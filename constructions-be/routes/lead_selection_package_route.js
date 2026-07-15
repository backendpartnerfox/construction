const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Lead Selection Package
 *   description: API for managing lead package selections
 */

/**
 * @swagger
 * /api/lead_selection_package:
 *   get:
 *     tags: [Lead Selection Package]
 *     description: Retrieve all lead package selections with related information
 *     parameters:
 *       - in: query
 *         name: lead_id
 *         schema:
 *           type: integer
 *         description: Filter by lead ID
 *       - in: query
 *         name: package_id
 *         schema:
 *           type: integer
 *         description: Filter by package ID
 *       - in: query
 *         name: is_approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: List of lead package selections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       lead_id:
 *                         type: integer
 *                       package_id:
 *                         type: integer
 *                       item_id:
 *                         type: integer
 *                       default_choice_id:
 *                         type: integer
 *                       selected_choice_id:
 *                         type: integer
 *                       price_difference:
 *                         type: number
 *                       total_difference:
 *                         type: number
 *                       is_approved:
 *                         type: boolean
 */

// Get all lead package selections
router.get('/', async (req, res) => {
  const db = req.db;
  const { lead_id, package_id, is_approved } = req.query;
  
  try {
    let query = `
      SELECT lsp.*, 
             l.primary_contact_name as contact_name, 
             l.primary_phone as phone_number, 
             p.package_name, 
             i.item_name,
             dc.display_name as default_choice_name, 
             sc.display_name as selected_choice_name,
             u.username as approved_by_name
      FROM lead_selection_package lsp
      LEFT JOIN leads l ON lsp.lead_id = l.lead_id
      LEFT JOIN packages p ON lsp.package_id = p.id
      LEFT JOIN items i ON lsp.item_id = i.item_id
      LEFT JOIN item_choices dc ON lsp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON lsp.selected_choice_id = sc.choice_option_id
      LEFT JOIN users u ON lsp.approved_by = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (lead_id) {
      conditions.push(`lsp.lead_id = $${params.length + 1}`);
      params.push(lead_id);
    }
    
    if (package_id) {
      conditions.push(`lsp.package_id = $${params.length + 1}`);
      params.push(package_id);
    }
    
    if (is_approved !== undefined) {
      conditions.push(`lsp.is_approved = $${params.length + 1}`);
      params.push(is_approved === 'true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY lsp.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/{id}:
 *   get:
 *     tags: [Lead Selection Package]
 *     description: Retrieve a specific lead package selection by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to retrieve
 *     responses:
 *       200:
 *         description: Lead package selection details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */

// Get lead package selection by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT lsp.*, 
             l.primary_contact_name as contact_name, 
             l.primary_phone as phone_number, 
             p.package_name, 
             i.item_name,
             dc.display_name as default_choice_name, 
             sc.display_name as selected_choice_name,
             u.username as approved_by_name
      FROM lead_selection_package lsp
      LEFT JOIN leads l ON lsp.lead_id = l.lead_id
      LEFT JOIN packages p ON lsp.package_id = p.id
      LEFT JOIN items i ON lsp.item_id = i.item_id
      LEFT JOIN item_choices dc ON lsp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON lsp.selected_choice_id = sc.choice_option_id
      LEFT JOIN users u ON lsp.approved_by = u.id
      WHERE lsp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead package selection not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/lead/{leadId}:
 *   get:
 *     tags: [Lead Selection Package]
 *     description: Retrieve all package selections for a specific lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead
 *     responses:
 *       200:
 *         description: List of package selections for the lead
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Internal server error
 */

// Get selections by lead ID - FIXED: Removed i.item_code
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    // First check if lead exists
    const leadCheck = await db.query('SELECT lead_id FROM leads WHERE lead_id = $1', [leadId]);
    
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found' 
      });
    }
    
    // FIXED: Removed i.item_code from SELECT
    const result = await db.query(`
      SELECT lsp.*, 
             p.package_name, 
             i.item_name,
             i.item_id,
             dc.display_name as default_choice_name, 
             sc.display_name as selected_choice_name
      FROM lead_selection_package lsp
      LEFT JOIN packages p ON lsp.package_id = p.id
      LEFT JOIN items i ON lsp.item_id = i.item_id
      LEFT JOIN item_choices dc ON lsp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON lsp.selected_choice_id = sc.choice_option_id
      WHERE lsp.lead_id = $1
      ORDER BY p.package_name, i.item_name
    `, [leadId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package:
 *   post:
 *     summary: Create a new lead package selection
 *     tags: [Lead Selection Package]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lead_id
 *               - package_id
 *               - item_id
 *               - default_choice_id
 *               - default_choice_price
 *               - selected_choice_id
 *               - selected_choice_price
 *             properties:
 *               lead_id:
 *                 type: integer
 *                 description: The lead ID
 *               package_id:
 *                 type: integer
 *                 description: The package ID
 *               item_id:
 *                 type: integer
 *                 description: The item ID
 *               default_choice_id:
 *                 type: integer
 *                 description: Default choice ID
 *               default_choice_price:
 *                 type: number
 *                 description: Price of default choice
 *               selected_choice_id:
 *                 type: integer
 *                 description: Selected choice ID
 *               selected_choice_price:
 *                 type: number
 *                 description: Price of selected choice
 *               gst_percentage:
 *                 type: number
 *                 default: 18.00
 *                 description: GST percentage
 *               remarks:
 *                 type: string
 *                 description: Additional remarks
 *     responses:
 *       201:
 *         description: Selection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Related entity not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    lead_id, package_id, item_id, default_choice_id, default_choice_price,
    selected_choice_id, selected_choice_price, gst_percentage = 18.00, remarks
  } = req.body;

  console.log('Received data:', req.body);

  // Validate required fields
  if (!lead_id) {
    return res.status(400).json({ 
      success: false,
      error: "Lead ID is required" 
    });
  }
  if (!package_id) {
    return res.status(400).json({ 
      success: false,
      error: "Package ID is required" 
    });
  }
  
  // Validate that package_id is a number
  if (isNaN(parseInt(package_id))) {
    return res.status(400).json({ 
      success: false,
      error: `Package ID must be a number, received: '${package_id}'. Please select a valid package from the dropdown.` 
    });
  }
  if (!item_id) {
    return res.status(400).json({ 
      success: false,
      error: "Item ID is required" 
    });
  }
  if (!default_choice_id) {
    return res.status(400).json({ 
      success: false,
      error: "Default choice ID is required" 
    });
  }
  if (default_choice_price === undefined || default_choice_price === null) {
    return res.status(400).json({ 
      success: false,
      error: "Default choice price is required" 
    });
  }
  if (!selected_choice_id) {
    return res.status(400).json({ 
      success: false,
      error: "Selected choice ID is required" 
    });
  }
  if (selected_choice_price === undefined || selected_choice_price === null) {
    return res.status(400).json({ 
      success: false,
      error: "Selected choice price is required" 
    });
  }

  try {
    // Verify lead exists
    const leadCheck = await db.query('SELECT lead_id FROM leads WHERE lead_id = $1', [lead_id]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found' 
      });
    }

    // Verify package exists
    const packageCheck = await db.query('SELECT id FROM packages WHERE id = $1', [package_id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Package not found' 
      });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }

    // Calculate price differences
    const price_difference = parseFloat(selected_choice_price) - parseFloat(default_choice_price);
    const gst_on_difference = price_difference * (parseFloat(gst_percentage) / 100);
    const total_difference = price_difference + gst_on_difference;

    const result = await db.query(
      `INSERT INTO lead_selection_package (
        lead_id, package_id, item_id, default_choice_id, default_choice_price,
        selected_choice_id, selected_choice_price, gst_percentage, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        lead_id, package_id, item_id, default_choice_id, default_choice_price,
        selected_choice_id, selected_choice_price, gst_percentage,
        remarks || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Lead package selection created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/{id}:
 *   put:
 *     summary: Update an existing lead package selection by ID
 *     tags: [Lead Selection Package]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selected_choice_id:
 *                 type: integer
 *               selected_choice_price:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Selection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { selected_choice_id, selected_choice_price, gst_percentage, remarks } = req.body;

  console.log('Update selection ID:', id);
  console.log('Update data:', req.body);

  try {
    // Get current record
    const currentRecord = await db.query('SELECT * FROM lead_selection_package WHERE id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Lead package selection not found" 
      });
    }

    const current = currentRecord.rows[0];
    
    // Use provided values or keep current ones
    const newSelectedChoiceId = selected_choice_id !== undefined ? selected_choice_id : current.selected_choice_id;
    const newSelectedChoicePrice = selected_choice_price !== undefined ? selected_choice_price : current.selected_choice_price;
    const newGstPercentage = gst_percentage !== undefined ? gst_percentage : current.gst_percentage;
    const newRemarks = remarks !== undefined ? remarks : current.remarks;

    // Note: price_difference, gst_on_difference, and total_difference are GENERATED columns
    // PostgreSQL will automatically recalculate them

    const result = await db.query(
      `UPDATE lead_selection_package 
       SET selected_choice_id = $1, selected_choice_price = $2, 
           gst_percentage = $3, remarks = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [
        newSelectedChoiceId, newSelectedChoicePrice, 
        newGstPercentage, newRemarks, id
      ]
    );

    res.json({
      success: true,
      message: 'Lead package selection updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/{id}/approve:
 *   put:
 *     summary: Approve a lead package selection
 *     tags: [Lead Selection Package]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to approve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved_by
 *             properties:
 *               approved_by:
 *                 type: integer
 *                 description: User ID of approver
 *               remarks:
 *                 type: string
 *                 description: Approval remarks
 *     responses:
 *       200:
 *         description: Selection approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by, remarks } = req.body;

  if (!approved_by) {
    return res.status(400).json({ 
      success: false,
      error: "Approved by user ID is required" 
    });
  }

  try {
    const result = await db.query(
      `UPDATE lead_selection_package 
       SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP, 
           remarks = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [approved_by, remarks || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Lead package selection not found" 
      });
    }

    res.json({
      success: true,
      message: 'Lead package selection approved successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/{id}:
 *   delete:
 *     summary: Delete a lead package selection by ID
 *     tags: [Lead Selection Package]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to delete
 *     responses:
 *       200:
 *         description: Selection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete approved selection
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if selection is approved (shouldn't be deleted if approved)
    const statusCheck = await db.query(
      'SELECT is_approved FROM lead_selection_package WHERE id = $1', 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Lead package selection not found" 
      });
    }
    
    if (statusCheck.rows[0].is_approved) {
      return res.status(400).json({ 
        success: false,
        error: "Cannot delete approved selection. Remove approval first." 
      });
    }
    
    await db.query('DELETE FROM lead_selection_package WHERE id = $1', [id]);
    
    res.json({ 
      success: true,
      message: "Lead package selection deleted successfully" 
    });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/lead_selection_package/lead/{leadId}/summary:
 *   get:
 *     tags: [Lead Selection Package]
 *     description: Get package selection summary for a lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead
 *     responses:
 *       200:
 *         description: Lead package selection summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_selections:
 *                       type: integer
 *                     total_price_difference:
 *                       type: number
 *                     total_gst_difference:
 *                       type: number
 *                     total_amount_difference:
 *                       type: number
 *                     approved_selections:
 *                       type: integer
 *                     pending_selections:
 *                       type: integer
 *                     avg_gst_percentage:
 *                       type: number
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Internal server error
 */
router.get('/lead/:leadId/summary', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    const leadCheck = await db.query('SELECT lead_id FROM leads WHERE lead_id = $1', [leadId]);
    
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found' 
      });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_selections,
        COALESCE(SUM(price_difference), 0) as total_price_difference,
        COALESCE(SUM(gst_on_difference), 0) as total_gst_difference,
        COALESCE(SUM(total_difference), 0) as total_amount_difference,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_selections,
        COUNT(CASE WHEN is_approved = false OR is_approved IS NULL THEN 1 END) as pending_selections,
        COALESCE(AVG(gst_percentage), 0) as avg_gst_percentage
      FROM lead_selection_package 
      WHERE lead_id = $1
    `, [leadId]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

module.exports = router;
