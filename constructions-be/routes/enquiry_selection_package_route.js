const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiry Selection Package
 *   description: API for managing enquiry package selections
 */

/**
 * @swagger
 * /enquiry_selection_package:
 *   get:
 *     tags: [Enquiry Selection Package]
 *     description: Retrieve all enquiry package selections with related information
 *     parameters:
 *       - in: query
 *         name: enquiry_id
 *         schema:
 *           type: integer
 *         description: Filter by enquiry ID
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
 *         description: List of enquiry package selections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   enquiry_id:
 *                     type: integer
 *                   package_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   default_choice_id:
 *                     type: integer
 *                   selected_choice_id:
 *                     type: integer
 *                   price_difference:
 *                     type: number
 *                   total_difference:
 *                     type: number
 *                   is_approved:
 *                     type: boolean
 */

// Get all enquiry package selections
router.get('/', async (req, res) => {
  const db = req.db;
  const { enquiry_id, package_id, is_approved } = req.query;
  
  try {
    let query = `
      SELECT esp.*, e.enquiry_number, p.package_name, i.item_name,
             dc.display_name as default_choice_name, sc.display_name as selected_choice_name,
             u.username as approved_by_name
      FROM enquiry_selection_package esp
      LEFT JOIN enquiries e ON esp.enquiry_id = e.enquiry_id
      LEFT JOIN packages p ON esp.package_id = p.id
      LEFT JOIN items i ON esp.item_id = i.item_id
      LEFT JOIN item_choices dc ON esp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON esp.selected_choice_id = sc.choice_option_id
      LEFT JOIN users u ON esp.approved_by = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (enquiry_id) {
      conditions.push(`esp.enquiry_id = $${params.length + 1}`);
      params.push(enquiry_id);
    }
    
    if (package_id) {
      conditions.push(`esp.package_id = $${params.length + 1}`);
      params.push(package_id);
    }
    
    if (is_approved !== undefined) {
      conditions.push(`esp.is_approved = $${params.length + 1}`);
      params.push(is_approved === 'true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY esp.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/{id}:
 *   get:
 *     tags: [Enquiry Selection Package]
 *     description: Retrieve a specific enquiry package selection by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to retrieve
 *     responses:
 *       200:
 *         description: Enquiry package selection details
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry package selection by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT esp.*, e.enquiry_number, p.package_name, i.item_name, 
             dc.display_name as default_choice_name, sc.display_name as selected_choice_name,
             u.username as approved_by_name
      FROM enquiry_selection_package esp
      LEFT JOIN enquiries e ON esp.enquiry_id = e.enquiry_id
      LEFT JOIN packages p ON esp.package_id = p.id
      LEFT JOIN items i ON esp.item_id = i.item_id
      LEFT JOIN item_choices dc ON esp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON esp.selected_choice_id = sc.choice_option_id
      LEFT JOIN users u ON esp.approved_by = u.id
      WHERE esp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry package selection not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/enquiry/{enquiryId}:
 *   get:
 *     tags: [Enquiry Selection Package]
 *     description: Retrieve all package selections for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: List of package selections for the enquiry
 *       404:
 *         description: Enquiry not found
 *       500:
 *         description: Internal server error
 */

// Get selections by enquiry ID
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    // First check if enquiry exists
    const enquiryCheck = await db.query('SELECT enquiry_id FROM enquiries WHERE enquiry_id = $1', [enquiryId]);
    
    if (enquiryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    
    const result = await db.query(`
      SELECT esp.*, p.package_name, i.item_name,
             dc.display_name as default_choice_name, sc.display_name as selected_choice_name
      FROM enquiry_selection_package esp
      LEFT JOIN packages p ON esp.package_id = p.id
      LEFT JOIN items i ON esp.item_id = i.item_id
      LEFT JOIN item_choices dc ON esp.default_choice_id = dc.choice_option_id
      LEFT JOIN item_choices sc ON esp.selected_choice_id = sc.choice_option_id
      WHERE esp.enquiry_id = $1
      ORDER BY p.package_name, i.item_name
    `, [enquiryId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package:
 *   post:
 *     summary: Create a new enquiry package selection
 *     tags: [Enquiry Selection Package]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - package_id
 *               - item_id
 *               - default_choice_id
 *               - default_choice_price
 *               - selected_choice_id
 *               - selected_choice_price
 *             properties:
 *               enquiry_id:
 *                 type: integer
 *               package_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               default_choice_id:
 *                 type: integer
 *               default_choice_price:
 *                 type: number
 *               selected_choice_id:
 *                 type: integer
 *               selected_choice_price:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *                 default: 18.00
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Selection created successfully
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
    enquiry_id, package_id, item_id, default_choice_id, default_choice_price,
    selected_choice_id, selected_choice_price, gst_percentage = 18.00, remarks
  } = req.body;

  // Validate required fields
  if (!enquiry_id) {
    return res.status(400).json({ error: "Enquiry ID is required" });
  }
  if (!package_id) {
    return res.status(400).json({ error: "Package ID is required" });
  }
  if (!item_id) {
    return res.status(400).json({ error: "Item ID is required" });
  }
  if (!default_choice_id) {
    return res.status(400).json({ error: "Default choice ID is required" });
  }
  if (!default_choice_price) {
    return res.status(400).json({ error: "Default choice price is required" });
  }
  if (!selected_choice_id) {
    return res.status(400).json({ error: "Selected choice ID is required" });
  }
  if (!selected_choice_price) {
    return res.status(400).json({ error: "Selected choice price is required" });
  }

  try {
    // Verify enquiry exists
    const enquiryCheck = await db.query('SELECT enquiry_id FROM enquiries WHERE enquiry_id = $1', [enquiry_id]);
    if (enquiryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Verify package exists
    const packageCheck = await db.query('SELECT id FROM packages WHERE id = $1', [package_id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = await db.query(
      `INSERT INTO enquiry_selection_package (
        enquiry_id, package_id, item_id, default_choice_id, default_choice_price,
        selected_choice_id, selected_choice_price, gst_percentage, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        enquiry_id, package_id, item_id, default_choice_id, default_choice_price,
        selected_choice_id, selected_choice_price, gst_percentage, remarks
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/{id}:
 *   put:
 *     summary: Update an existing enquiry package selection by ID
 *     tags: [Enquiry Selection Package]
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
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { selected_choice_id, selected_choice_price, gst_percentage, remarks } = req.body;

  try {
    // Get current record
    const currentRecord = await db.query('SELECT * FROM enquiry_selection_package WHERE id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry package selection not found" });
    }

    const current = currentRecord.rows[0];
    
    // Use provided values or keep current ones
    const newSelectedChoiceId = selected_choice_id !== undefined ? selected_choice_id : current.selected_choice_id;
    const newSelectedChoicePrice = selected_choice_price !== undefined ? selected_choice_price : current.selected_choice_price;
    const newGstPercentage = gst_percentage !== undefined ? gst_percentage : current.gst_percentage;

    const result = await db.query(
      `UPDATE enquiry_selection_package 
       SET selected_choice_id = $1, selected_choice_price = $2, 
           gst_percentage = $3, remarks = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [
        newSelectedChoiceId, newSelectedChoicePrice, 
        newGstPercentage, remarks, id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/{id}/approve:
 *   patch:
 *     summary: Approve an enquiry package selection
 *     tags: [Enquiry Selection Package]
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
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Selection approved successfully
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by, remarks } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "Approved by user ID is required" });
  }

  try {
    const result = await db.query(
      `UPDATE enquiry_selection_package 
       SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP, 
           remarks = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [approved_by, remarks, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enquiry package selection not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/{id}:
 *   delete:
 *     summary: Delete an enquiry package selection by ID
 *     tags: [Enquiry Selection Package]
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
      'SELECT is_approved FROM enquiry_selection_package WHERE id = $1', 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry package selection not found" });
    }
    
    if (statusCheck.rows[0].is_approved) {
      return res.status(400).json({ 
        error: "Cannot delete approved selection. Remove approval first." 
      });
    }
    
    const result = await db.query('DELETE FROM enquiry_selection_package WHERE id = $1', [id]);
    
    res.json({ message: "Enquiry package selection deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_selection_package/enquiry/{enquiryId}/summary:
 *   get:
 *     tags: [Enquiry Selection Package]
 *     description: Get package selection summary for an enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: Enquiry package selection summary
 *       404:
 *         description: Enquiry not found
 *       500:
 *         description: Internal server error
 */
router.get('/enquiry/:enquiryId/summary', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const enquiryCheck = await db.query('SELECT enquiry_id FROM enquiries WHERE enquiry_id = $1', [enquiryId]);
    
    if (enquiryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_selections,
        SUM(price_difference) as total_price_difference,
        SUM(gst_on_difference) as total_gst_difference,
        SUM(total_difference) as total_amount_difference,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_selections,
        COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_selections,
        AVG(gst_percentage) as avg_gst_percentage
      FROM enquiry_selection_package 
      WHERE enquiry_id = $1
    `, [enquiryId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;