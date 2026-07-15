const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('FIXING CONVERT TO LEAD ENDPOINT');
console.log('========================================\n');

// Read the original file
const filePath = path.join(__dirname, 'routes', 'enquiries_route.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('✓ File loaded:', filePath);

// Find the start of the convert-to-lead endpoint
const startPattern = "router.post('/enquiries/:id/convert-to-lead', async (req, res) => {";
const endPattern = "module.exports = router;";

const startIndex = content.indexOf(startPattern);
const endIndex = content.lastIndexOf(endPattern);

if (startIndex === -1) {
  console.error('❌ Could not find convert-to-lead endpoint');
  process.exit(1);
}

if (endIndex === -1) {
  console.error('❌ Could not find module.exports');
  process.exit(1);
}

console.log('✓ Found convert-to-lead endpoint at position:', startIndex);

// Find the end of this specific endpoint (look for the next router. or module.exports)
let endpointEndIndex = content.indexOf('\nrouter.', startIndex + startPattern.length);
if (endpointEndIndex === -1 || endpointEndIndex > endIndex) {
  endpointEndIndex = endIndex;
}

console.log('✓ Endpoint ends at position:', endpointEndIndex);

// The fixed endpoint code
const fixedEndpoint = `router.post('/enquiries/:id/convert-to-lead', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { 
    assigned_sales_person, 
    assigned_architect = null, 
    assigned_engineer = null, 
    converted_by 
  } = req.body;

  console.log('[Convert To Lead] Starting conversion for enquiry:', id);
  console.log('[Convert To Lead] Request body:', req.body);

  // Validate required fields
  if (!assigned_sales_person) {
    return res.status(400).json({
      success: false,
      message: 'assigned_sales_person is required'
    });
  }

  if (!converted_by) {
    return res.status(400).json({
      success: false,
      message: 'converted_by is required'
    });
  }

  // Validate enquiry_id is a number
  const enquiryId = parseInt(id);
  if (isNaN(enquiryId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid enquiry ID'
    });
  }

  try {
    await db.query('BEGIN');

    // Validate that assigned employees exist
    const employeeChecks = [];

    // Only add non-null values and convert to integers
    if (assigned_sales_person && assigned_sales_person !== null && !isNaN(assigned_sales_person)) {
      employeeChecks.push(parseInt(assigned_sales_person));
    }
    if (assigned_architect && assigned_architect !== null && !isNaN(assigned_architect)) {
      employeeChecks.push(parseInt(assigned_architect));
    }
    if (assigned_engineer && assigned_engineer !== null && !isNaN(assigned_engineer)) {
      employeeChecks.push(parseInt(assigned_engineer));
    }
    if (converted_by && converted_by !== null && !isNaN(converted_by)) {
      employeeChecks.push(parseInt(converted_by));
    }

    // Remove duplicates
    const uniqueEmployeeChecks = [...new Set(employeeChecks)];

    console.log('[Convert To Lead] Validating employee IDs:', uniqueEmployeeChecks);

    if (uniqueEmployeeChecks.length > 0) {
      const employeeCheckQuery = \`
        SELECT employee_id FROM employees 
        WHERE employee_id = ANY($1) AND status = 'Active'
      \`;
      
      const employeeResult = await db.query(employeeCheckQuery, [uniqueEmployeeChecks]);
      
      const foundEmployeeIds = employeeResult.rows.map(r => r.employee_id);
      console.log('[Convert To Lead] Found active employees:', foundEmployeeIds);
      
      if (employeeResult.rows.length !== uniqueEmployeeChecks.length) {
        await db.query('ROLLBACK');
        const missingIds = uniqueEmployeeChecks.filter(id => !foundEmployeeIds.includes(id));
        console.error('[Convert To Lead] Missing employee IDs:', missingIds);
        return res.status(400).json({
          success: false,
          message: 'One or more assigned employees not found or inactive',
          details: {
            requested: uniqueEmployeeChecks,
            found: foundEmployeeIds,
            missing: missingIds
          }
        });
      }
      
      console.log('[Convert To Lead] Employee validation passed');
    }

    // CRITICAL FIX: Fetch the enquiry data
    const enquiryResult = await db.query(\`
      SELECT * FROM enquiries WHERE enquiry_id = $1
    \`, [enquiryId]);

    if (enquiryResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    const enquiry = enquiryResult.rows[0];
    console.log('[Convert To Lead] Found enquiry:', enquiry.enquiry_id);

    // Check if already converted
    if (enquiry.converted_to_lead === true) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Enquiry has already been converted to lead'
      });
    }

    // Generate lead number
    const leadCountResult = await db.query('SELECT COUNT(*) as count FROM leads');
    const leadCount = parseInt(leadCountResult.rows[0].count) + 1;
    const leadNumber = \`LED-24-\${leadCount.toString().padStart(3, '0')}\`;

    console.log('[Convert To Lead] Creating lead:', leadNumber);

    // Create the lead
    const leadResult = await db.query(\`
      INSERT INTO leads (
        enquiry_id,
        lead_number,
        lead_title,
        primary_contact_name,
        company_name,
        primary_phone,
        email,
        whatsapp_number,
        city,
        state,
        project_type,
        construction_type,
        estimated_built_up_area,
        assigned_sales_person,
        assigned_architect,
        assigned_engineer,
        stage,
        probability_percentage,
        is_decision_maker,
        budget_confirmed,
        timeline_confirmed,
        site_ownership_confirmed
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING lead_id
    \`, [
      enquiryId,
      leadNumber,
      ((enquiry.project_type || 'Project') + ' for ' + (enquiry.contact_person_name || 'Client')),
      enquiry.contact_person_name,
      enquiry.company_name,
      enquiry.primary_phone,
      enquiry.email,
      enquiry.whatsapp_number,
      enquiry.city,
      enquiry.state,
      enquiry.project_type,
      enquiry.construction_type,
      enquiry.approximate_area,
      assigned_sales_person,
      assigned_architect,
      assigned_engineer,
      'Qualified',
      25,
      false,
      false,
      false,
      false
    ]);

    const leadId = leadResult.rows[0].lead_id;
    console.log('[Convert To Lead] Lead created with ID:', leadId);

    // Copy package selections from enquiry to lead if they exist
    if (enquiry.package_id) {
      console.log('[Convert To Lead] Copying package selections');
      
      const packageSelections = await db.query(\`
        SELECT * FROM enquiry_selection_package WHERE enquiry_id = $1
      \`, [enquiryId]);

      if (packageSelections.rows.length > 0) {
        for (const selection of packageSelections.rows) {
          await db.query(\`
            INSERT INTO lead_selection_package (
              lead_id, package_id, item_id, default_choice_id, default_choice_price,
              selected_choice_id, selected_choice_price, gst_percentage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          \`, [
            leadId,
            selection.package_id,
            selection.item_id,
            selection.default_choice_id,
            selection.default_choice_price,
            selection.selected_choice_id,
            selection.selected_choice_price,
            selection.gst_percentage
          ]);
        }
      } else {
        try {
          const packageItems = await db.query(\`
            SELECT pim.item_id, pim.item_choice_id, COALESCE(ic.package, 0) as package_price
            FROM package_items_mapping pim
            LEFT JOIN item_choices ic ON pim.item_choice_id = ic.choice_option_id
            WHERE pim.package_id = $1
          \`, [enquiry.package_id]);

          for (const item of packageItems.rows) {
            await db.query(\`
              INSERT INTO lead_selection_package (
                lead_id, package_id, item_id, default_choice_id, default_choice_price,
                selected_choice_id, selected_choice_price, gst_percentage
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            \`, [
              leadId,
              enquiry.package_id,
              item.item_id,
              item.item_choice_id,
              item.package_price,
              item.item_choice_id,
              item.package_price,
              18.00
            ]);
          }
        } catch (packageError) {
          console.log('[Convert To Lead] Warning:', packageError.message);
        }
      }
    }

    // Update enquiry status
    await db.query(\`
      UPDATE enquiries 
      SET 
        converted_to_lead = true,
        lead_conversion_date = CURRENT_TIMESTAMP,
        status = 'Converted_to_Lead',
        updated_at = CURRENT_TIMESTAMP
      WHERE enquiry_id = $1
    \`, [enquiryId]);

    await db.query('COMMIT');
    console.log('[Convert To Lead] Success');

    res.status(200).json({
      success: true,
      message: 'Enquiry successfully converted to lead',
      data: {
        lead_id: leadId,
        lead_number: leadNumber,
        enquiry_id: enquiryId,
        enquiry_number: enquiry.enquiry_number,
        assigned_sales_person: assigned_sales_person,
        assigned_architect: assigned_architect,
        assigned_engineer: assigned_engineer
      }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[Convert To Lead] Error:', err.message);
    console.error('[Convert To Lead] Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + err.message
    });
  }
});

`;

// Build the new content
const beforeEndpoint = content.substring(0, startIndex);
const afterEndpoint = content.substring(endpointEndIndex);

const newContent = beforeEndpoint + fixedEndpoint + afterEndpoint;

// Create backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, 'routes', `enquiries_route.backup.${timestamp}.js`);
fs.writeFileSync(backupPath, content);
console.log('✓ Backup created:', backupPath);

// Write the fixed version
fs.writeFileSync(filePath, newContent);
console.log('✓ File updated successfully');

console.log('\n========================================');
console.log('FIX APPLIED SUCCESSFULLY!');
console.log('========================================');
console.log('\n📋 Next steps:');
console.log('1. Restart your backend server (Ctrl+C then restart)');
console.log('2. Try converting an enquiry to lead');
console.log('3. Check the server console for detailed logs');
console.log('\nThe fix added:');
console.log('- Missing enquiry data fetch');
console.log('- Better null handling');
console.log('- Detailed logging');
console.log('- Better error messages');
