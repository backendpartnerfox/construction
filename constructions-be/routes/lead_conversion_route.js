const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ============================================================
// HELPER: Auto-create a project when a lead is converted to client
// ============================================================
// Best-effort: if this fails, the conversion (client + payment) still
// succeeds and we log a warning. A missing project can always be
// created manually later, but we never want to lose a captured payment.
// ============================================================
async function createProjectForConvertedClient(db, { lead, clientId, paymentId }) {
  try {
    // 1. Pull the current/finalized quotation (if any) for budget + title
    const quotResult = await db.query(
      `SELECT lead_quotation_id, quotation_title, project_title, total_amount, estimated_duration_months
         FROM lead_quotations
        WHERE lead_id = $1 AND is_current_version = TRUE
        ORDER BY version_number DESC LIMIT 1`,
      [lead.lead_id]
    );
    const quotation = quotResult.rows[0] || null;

    // 2. Build project fields from lead + quotation
    const projectName =
      (quotation && quotation.project_title) ||
      (lead.project_title) ||
      `${lead.primary_contact_name || 'Project'} - ${lead.lead_number || lead.lead_id}`;

    const estimatedBudget =
      (quotation && parseFloat(quotation.total_amount)) ||
      parseFloat(lead.budget_max) ||
      parseFloat(lead.budget_min) ||
      0;

    // Derive estimated_end_date from quotation duration (months) or lead timeline_months
    const durationMonths =
      parseInt(quotation && quotation.estimated_duration_months) ||
      parseInt(lead.timeline_months) ||
      null;

    // 3. Generate a project_code via the same pattern used by /api/projects POST
    const codeResult = await db.query(`
      SELECT 'PRJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
             LPAD((COALESCE(MAX(CAST(SUBSTRING(project_code FROM 10) AS INT)), 0) + 1)::TEXT, 3, '0') AS project_code
        FROM projects
       WHERE project_code LIKE 'PRJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
    `);
    const projectCode = codeResult.rows[0].project_code;

    const noteLines = [
      `Auto-created from Lead ${lead.lead_number || lead.lead_id} on conversion.`,
      lead.enquiry_id ? `Original Enquiry: #${lead.enquiry_id}` : null,
      quotation ? `Based on Quotation ${quotation.lead_quotation_id}` : null,
      `Conversion Payment ID: ${paymentId}`
    ].filter(Boolean).join('\n');

    const insertResult = await db.query(
      `INSERT INTO projects (
          project_name, project_code, client_id,
          project_manager_id, architect_id,
          description, project_type, location, site_address,
          start_date, estimated_end_date, status, completion_percentage,
          estimated_budget, actual_cost, currency,
          total_area, area_unit, number_of_floors,
          priority, notes, created_at
        ) VALUES (
          $1, $2, $3,
          $4, $5,
          $6, $7, $8, $9,
          CURRENT_DATE,
          CASE WHEN $10::INT IS NOT NULL THEN CURRENT_DATE + ($10 || ' months')::INTERVAL ELSE NULL END,
          'Planning', 0,
          $11, 0, 'INR',
          $12, 'sqft', $13,
          3, $14, CURRENT_TIMESTAMP
        ) RETURNING project_id, project_code, project_name`,
      [
        projectName,
        projectCode,
        clientId,
        null,                          // project_manager_id (assign later)
        lead.assigned_architect || null, // carry over architect from lead if any
        lead.project_scope || lead.lead_notes || null, // description
        lead.project_type || 'Residential',
        lead.city || null,
        lead.site_address || null,
        durationMonths,
        estimatedBudget,
        parseFloat(lead.site_area) || parseFloat(lead.estimated_built_up_area) || 0,
        parseInt(lead.number_of_floors) || 0,
        noteLines
      ]
    );

    const newProject = insertResult.rows[0];
    console.log('[Lead Conversion] ✅ Project auto-created:', newProject.project_code);
    return newProject;
  } catch (err) {
    // Log but don't throw — the parent transaction continues.
    console.warn('[Lead Conversion] ⚠️  Project auto-creation FAILED (non-fatal):', err.message);
    console.warn('    Client/payment were still saved. You can create the project manually from the client page.');
    return null;
  }
}

// ============================================================
// Lead → Client Conversion with Payment Gateway (Razorpay)
// ============================================================
// Endpoints:
// POST /:id/create-payment-order    - Create Razorpay order
// POST /:id/verify-payment-and-convert - Verify payment & convert lead
// POST /:id/convert-to-client       - Manual/offline payment conversion
// GET  /:id/payment-orders          - Get payment orders for a lead
// ============================================================

// Read Razorpay keys at request time (not module load time)
// so that dotenv has definitely loaded by then
function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes('XXXX')) {
    throw new Error('Razorpay API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  return { keyId, keySecret };
}

// Middleware
router.use((req, res, next) => {
  console.log(`[Lead Conversion] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// STEP 1: Create Razorpay Order
// POST /api/leads/:id/create-payment-order
// ============================================================
router.post('/:id/create-payment-order', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { amount, quotation_id, notes } = req.body;

  console.log('[Lead Conversion] Creating payment order for lead:', id);

  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({ success: false, error: 'Invalid lead ID' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
  }

  try {
    // 1. Check lead exists and is not already converted
    const leadResult = await db.query('SELECT * FROM leads WHERE lead_id = $1', [leadId]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];
    if (lead.converted_to_client) {
      return res.status(400).json({ success: false, error: 'Lead is already converted to client' });
    }

    // 2. Generate receipt number
    const countResult = await db.query('SELECT COUNT(*) as count FROM payment_orders');
    const count = parseInt(countResult.rows[0].count) + 1;
    const receipt = `HAMS-RCP-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    // 3. Create Razorpay order via API
    const amountInPaise = Math.round(amount * 100);

    const orderPayload = JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        lead_id: leadId.toString(),
        lead_number: lead.lead_number || '',
        contact_name: lead.primary_contact_name || '',
        purpose: 'Lead Conversion Advance Payment'
      }
    });

    const { keyId, keySecret } = getRazorpayKeys();
    console.log('[Lead Conversion] Using Razorpay Key:', keyId);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const razorpayOrder = await new Promise((resolve, reject) => {
      const https = require('https');
      const options = {
        hostname: 'api.razorpay.com',
        port: 443,
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(orderPayload)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error?.description || `Razorpay API error: ${response.statusCode}`));
            }
          } catch (e) {
            reject(new Error('Failed to parse Razorpay response'));
          }
        });
      });

      request.on('error', (err) => reject(err));
      request.write(orderPayload);
      request.end();
    });

    // 4. Store order in our database
    const insertResult = await db.query(`
      INSERT INTO payment_orders (
        razorpay_order_id, lead_id, quotation_id, amount, currency, 
        purpose, status, contact_name, contact_email, contact_phone,
        notes, receipt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING order_id
    `, [
      razorpayOrder.id,
      leadId,
      quotation_id || null,
      amount,
      'INR',
      'Lead Conversion Advance Payment',
      'created',
      lead.primary_contact_name,
      lead.email,
      lead.primary_phone,
      notes || null,
      receipt
    ]);

    console.log('[Lead Conversion] ✅ Payment order created:', razorpayOrder.id);

    res.status(201).json({
      success: true,
      data: {
        order_id: insertResult.rows[0].order_id,
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        amount_in_paise: amountInPaise,
        currency: 'INR',
        receipt: receipt,
        key_id: keyId,
        lead: {
          lead_id: leadId,
          lead_number: lead.lead_number,
          contact_name: lead.primary_contact_name,
          email: lead.email,
          phone: lead.primary_phone
        }
      },
      message: 'Payment order created successfully'
    });

  } catch (err) {
    console.error('[Lead Conversion] ❌ Create order error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================================
// STEP 2: Verify Payment & Convert Lead to Client
// POST /api/leads/:id/verify-payment-and-convert
// ============================================================
router.post('/:id/verify-payment-and-convert', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    payment_method,
    converted_by
  } = req.body;

  console.log('[Lead Conversion] Verifying payment for lead:', id);

  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({ success: false, error: 'Invalid lead ID' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Razorpay payment details are required' });
  }

  try {
    await db.query('BEGIN');

    // 1. Verify Razorpay signature
    const { keySecret } = getRazorpayKeys();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await db.query('ROLLBACK');
      
      await db.query(`
        UPDATE payment_orders SET status = 'failed', 
        error_details = $1::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE razorpay_order_id = $2
      `, [JSON.stringify({ reason: 'Signature verification failed' }), razorpay_order_id]);

      return res.status(400).json({ success: false, error: 'Payment verification failed - invalid signature' });
    }

    // 2. Get the payment order from our DB
    const orderResult = await db.query(
      'SELECT * FROM payment_orders WHERE razorpay_order_id = $1 AND lead_id = $2',
      [razorpay_order_id, leadId]
    );

    if (orderResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Payment order not found' });
    }

    const paymentOrder = orderResult.rows[0];

    if (paymentOrder.status === 'paid') {
      await db.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Payment already processed' });
    }

    // 3. Update payment_orders with Razorpay response
    await db.query(`
      UPDATE payment_orders SET 
        razorpay_payment_id = $1, razorpay_signature = $2,
        status = 'paid', payment_method = $3,
        razorpay_response = $4::jsonb,
        updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $5
    `, [
      razorpay_payment_id,
      razorpay_signature,
      payment_method || null,
      JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
      razorpay_order_id
    ]);

    // 4. Get lead details for client creation
    const leadResult = await db.query('SELECT * FROM leads WHERE lead_id = $1', [leadId]);
    const lead = leadResult.rows[0];

    if (lead.converted_to_client) {
      await db.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Lead already converted' });
    }

    // 5. Record in finance_payments
    const paymentNumber = `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const financeResult = await db.query(`
      INSERT INTO finance_payments (
        payment_number, receipt_number, lead_id, payment_type_id, payment_method_id,
        payment_amount, payment_date, online_reference_number,
        payment_purpose, payment_stage,
        status, triggers_client_conversion, conversion_threshold_met,
        payment_verified, payment_cleared,
        received_by, payment_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING payment_id
    `, [
      paymentNumber,
      paymentOrder.receipt,
      leadId,
      13, // Advance Payment type
      24, // Online Payment method
      paymentOrder.amount,
      razorpay_payment_id,
      'Lead conversion advance payment via Razorpay',
      'Advance - Contract Signing',
      'Received',
      true,
      true,
      true,
      true,
      converted_by || 1,
      `Razorpay Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`
    ]);

    const paymentId = financeResult.rows[0].payment_id;

    // 6. Create client from lead data
    const clientResult = await db.query(`
      INSERT INTO clients (
        client_name, surname, client_type, primary_contact_name,
        whatsppnumber, email, phone, 
        city, state, country,
        client_category, referred_by,
        is_active, notes,
        lead_id, enquiry_id, conversion_payment_id,
        converted_from_lead, conversion_date,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, $19)
      RETURNING client_id
    `, [
      lead.primary_contact_name,
      null,
      lead.company_name ? 'Company' : 'Individual',
      lead.primary_contact_name,
      lead.whatsapp_number,
      lead.email,
      lead.primary_phone,
      lead.city,
      lead.state,
      'India',
      'Converted Lead',
      `Lead: ${lead.lead_number}`,
      true,
      `Converted from Lead ${lead.lead_number}. Advance payment of ₹${paymentOrder.amount} received via Razorpay.`,
      leadId,
      lead.enquiry_id,
      paymentId,
      true,
      converted_by || 1
    ]);

    const clientId = clientResult.rows[0].client_id;

    // 7. Update lead as converted
    await db.query(`
      UPDATE leads SET 
        converted_to_client = true,
        client_conversion_date = CURRENT_DATE,
        conversion_payment_amount = $1,
        closure_amount = $1,
        closure_date = CURRENT_DATE,
        stage = 'Won',
        probability_percentage = 100,
        updated_at = CURRENT_TIMESTAMP
      WHERE lead_id = $2
    `, [paymentOrder.amount, leadId]);

    // 8. Update finance_payments with client_id
    await db.query('UPDATE finance_payments SET client_id = $1 WHERE payment_id = $2', [clientId, paymentId]);

    // 9. Auto-create a Project for this client (best-effort, non-fatal)
    const newProject = await createProjectForConvertedClient(db, { lead, clientId, paymentId });
    if (newProject) {
      await db.query('UPDATE finance_payments SET project_id = $1 WHERE payment_id = $2', [newProject.project_id, paymentId])
        .catch(e => console.warn('[Lead Conversion] Could not attach project_id to payment (FK may not exist yet):', e.message));
    }

    await db.query('COMMIT');

    console.log('[Lead Conversion] ✅ Lead converted:', { leadId, clientId, paymentId, projectId: newProject?.project_id || null });

    res.status(200).json({
      success: true,
      message: 'Payment verified and lead converted to client successfully',
      data: {
        client_id: clientId,
        lead_id: leadId,
        payment_id: paymentId,
        payment_order_id: paymentOrder.order_id,
        amount_paid: paymentOrder.amount,
        razorpay_payment_id: razorpay_payment_id,
        project_id: newProject?.project_id || null,
        project_code: newProject?.project_code || null,
        project_auto_created: !!newProject
      }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[Lead Conversion] ❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================================
// GET: Payment order status for a lead
// GET /api/leads/:id/payment-orders
// ============================================================
router.get('/:id/payment-orders', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM payment_orders WHERE lead_id = $1 ORDER BY created_at DESC',
      [parseInt(id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================================
// MANUAL / OFFLINE PAYMENT CONVERSION
// POST /api/leads/:id/convert-to-client
// (Cash, Cheque, Bank Transfer, UPI - recorded manually)
// ============================================================
router.post('/:id/convert-to-client', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    payment_amount,
    payment_method_id,
    payment_date,
    payment_reference,
    bank_name,
    cheque_number,
    upi_transaction_id,
    converted_by,
    notes
  } = req.body;

  console.log('[Lead Conversion] Manual conversion for lead:', id);

  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({ success: false, error: 'Invalid lead ID' });
  }

  if (!payment_amount || payment_amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
  }

  if (!payment_method_id) {
    return res.status(400).json({ success: false, error: 'Payment method is required' });
  }

  try {
    await db.query('BEGIN');

    // 1. Get lead
    const leadResult = await db.query('SELECT * FROM leads WHERE lead_id = $1', [leadId]);
    if (leadResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];
    if (lead.converted_to_client) {
      await db.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Lead already converted to client' });
    }

    // 2. Record payment in finance_payments
    const paymentNumber = `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const receiptNumber = `HAMS-RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const financeResult = await db.query(`
      INSERT INTO finance_payments (
        payment_number, receipt_number, lead_id, payment_type_id, payment_method_id,
        payment_amount, payment_date, cheque_number, bank_name, upi_transaction_id,
        online_reference_number, payment_purpose, payment_stage,
        status, triggers_client_conversion, conversion_threshold_met,
        payment_verified, received_by, payment_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING payment_id
    `, [
      paymentNumber, receiptNumber, leadId, 13, payment_method_id,
      payment_amount, payment_date || new Date().toISOString().split('T')[0],
      cheque_number || null, bank_name || null, upi_transaction_id || null,
      payment_reference || null,
      'Lead conversion advance payment',
      'Advance - Contract Signing',
      'Received', true, true, false,
      converted_by || 1,
      notes || null
    ]);

    const paymentId = financeResult.rows[0].payment_id;

    // 3. Create client from lead data
    const clientResult = await db.query(`
      INSERT INTO clients (
        client_name, client_type, primary_contact_name, whatsppnumber, email, phone,
        city, state, country, client_category, referred_by,
        is_active, notes, lead_id, enquiry_id, conversion_payment_id,
        converted_from_lead, conversion_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, $18)
      RETURNING client_id
    `, [
      lead.primary_contact_name,
      lead.company_name ? 'Company' : 'Individual',
      lead.primary_contact_name,
      lead.whatsapp_number, lead.email, lead.primary_phone,
      lead.city, lead.state, 'India',
      'Converted Lead', `Lead: ${lead.lead_number}`,
      true,
      `Converted from Lead ${lead.lead_number}. Advance ₹${payment_amount} received.`,
      leadId, lead.enquiry_id, paymentId, true,
      converted_by || 1
    ]);

    const clientId = clientResult.rows[0].client_id;

    // 4. Update lead as converted
    await db.query(`
      UPDATE leads SET 
        converted_to_client = true, client_conversion_date = CURRENT_DATE,
        conversion_payment_amount = $1, closure_amount = $1, closure_date = CURRENT_DATE,
        stage = 'Won', probability_percentage = 100, updated_at = CURRENT_TIMESTAMP
      WHERE lead_id = $2
    `, [payment_amount, leadId]);

    // 5. Link client_id to the payment
    await db.query('UPDATE finance_payments SET client_id = $1 WHERE payment_id = $2', [clientId, paymentId]);

    // 6. Auto-create a Project for this client (best-effort, non-fatal)
    const newProject = await createProjectForConvertedClient(db, { lead, clientId, paymentId });
    if (newProject) {
      await db.query('UPDATE finance_payments SET project_id = $1 WHERE payment_id = $2', [newProject.project_id, paymentId])
        .catch(e => console.warn('[Lead Conversion] Could not attach project_id to payment (FK may not exist yet):', e.message));
    }

    await db.query('COMMIT');

    console.log('[Lead Conversion] ✅ Manual conversion done:', { leadId, clientId, paymentId, projectId: newProject?.project_id || null });

    res.status(200).json({
      success: true,
      message: 'Lead converted to client successfully',
      data: {
        client_id: clientId,
        lead_id: leadId,
        payment_id: paymentId,
        amount_paid: payment_amount,
        project_id: newProject?.project_id || null,
        project_code: newProject?.project_code || null,
        project_auto_created: !!newProject
      }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[Lead Conversion] ❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
