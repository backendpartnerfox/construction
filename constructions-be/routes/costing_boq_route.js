const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Costing BOQ
 *   description: API for managing Bill of Quantities (BOQ) costing
 */

/**
 * @swagger
 * /costing_boq:
 *   get:
 *     tags: [Costing BOQ]
 *     description: Retrieve all BOQ costing entries with related information
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of BOQ costing entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   costing_boq_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   unit_id:
 *                     type: integer
 *                   uid:
 *                     type: string
 *                   boq_code:
 *                     type: string
 *                   boq_description:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   total_amount:
 *                     type: number
 *                   status:
 *                     type: string
 */

// Get all BOQ costing entries
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, status } = req.query;
  
  try {
    let query = `
      SELECT cb.*, p.project_name, u.unit_name, e.element_name, i.item_name, 
             ic.choice_name, v.vendor_name, us.username as created_by_name,
             us2.username as updated_by_name
      FROM costing_boq cb
      LEFT JOIN projects p ON cb.project_id = p.id
      LEFT JOIN units u ON cb.unit_id = u.id
      LEFT JOIN elements e ON cb.element_id = e.id
      LEFT JOIN items i ON cb.item_id = i.id
      LEFT JOIN item_choices ic ON cb.choice_option_id = ic.id
      LEFT JOIN vendors v ON cb.vendor_id = v.id
      LEFT JOIN users us ON cb.created_by = us.id
      LEFT JOIN users us2 ON cb.updated_by = us2.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (project_id) {
      conditions.push(`cb.project_id = $${params.length + 1}`);
      params.push(project_id);
    }
    
    if (status) {
      conditions.push(`cb.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY cb.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /costing_boq/{id}:
 *   get:
 *     tags: [Costing BOQ]
 *     description: Retrieve a specific BOQ costing entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ costing entry to retrieve
 *     responses:
 *       200:
 *         description: BOQ costing entry details
 *       404:
 *         description: BOQ costing entry not found
 *       500:
 *         description: Internal server error
 */

// Get BOQ costing entry by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT cb.*, p.project_name, u.unit_name, e.element_name, i.item_name, 
             ic.choice_name, v.vendor_name, us.username as created_by_name,
             us2.username as updated_by_name
      FROM costing_boq cb
      LEFT JOIN projects p ON cb.project_id = p.id
      LEFT JOIN units u ON cb.unit_id = u.id
      LEFT JOIN elements e ON cb.element_id = e.id
      LEFT JOIN items i ON cb.item_id = i.id
      LEFT JOIN item_choices ic ON cb.choice_option_id = ic.id
      LEFT JOIN vendors v ON cb.vendor_id = v.id
      LEFT JOIN users us ON cb.created_by = us.id
      LEFT JOIN users us2 ON cb.updated_by = us2.id
      WHERE cb.costing_boq_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOQ costing entry not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /costing_boq/project/{projectId}:
 *   get:
 *     tags: [Costing BOQ]
 *     description: Retrieve all BOQ costing entries for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of BOQ costing entries for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get BOQ costing entries by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT cb.*, u.unit_name, e.element_name, i.item_name, 
             ic.choice_name, v.vendor_name
      FROM costing_boq cb
      LEFT JOIN units u ON cb.unit_id = u.id
      LEFT JOIN elements e ON cb.element_id = e.id
      LEFT JOIN items i ON cb.item_id = i.id
      LEFT JOIN item_choices ic ON cb.choice_option_id = ic.id
      LEFT JOIN vendors v ON cb.vendor_id = v.id
      WHERE cb.project_id = $1
      ORDER BY cb.boq_code, cb.uid
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /costing_boq:
 *   post:
 *     summary: Create a new BOQ costing entry
 *     tags: [Costing BOQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - unit_id
 *               - uid
 *               - quantity
 *               - unit
 *             properties:
 *               project_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               uid:
 *                 type: string
 *               boq_code:
 *                 type: string
 *               boq_description:
 *                 type: string
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               choice_option_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               material_cost:
 *                 type: number
 *               labor_cost:
 *                 type: number
 *               equipment_cost:
 *                 type: number
 *               overhead_cost:
 *                 type: number
 *               vendor_id:
 *                 type: integer
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ costing entry created successfully
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
    project_id, unit_id, uid, boq_code, boq_description, element_id, item_id,
    choice_option_id, quantity, unit, unit_rate, material_cost, labor_cost,
    equipment_cost, overhead_cost, vendor_id, quotation_reference,
    price_validity_date, notes, created_by, gst_percentage = 18.00
  } = req.body;

  // Validate required fields
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required" });
  }
  if (!unit_id) {
    return res.status(400).json({ error: "Unit ID is required" });
  }
  if (!uid) {
    return res.status(400).json({ error: "UID is required" });
  }
  if (!quantity) {
    return res.status(400).json({ error: "Quantity is required" });
  }
  if (!unit) {
    return res.status(400).json({ error: "Unit is required" });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify unit exists
    const unitCheck = await db.query('SELECT id FROM units WHERE id = $1', [unit_id]);
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Calculate costs
    const base_amount = (material_cost || 0) + (labor_cost || 0) + (equipment_cost || 0) + (overhead_cost || 0);
    const total_cost = unit_rate ? (quantity * unit_rate) : base_amount;
    const gst_amount = total_cost * (gst_percentage / 100);
    const total_amount = total_cost + gst_amount;

    const result = await db.query(
      `INSERT INTO costing_boq (
        project_id, unit_id, uid, boq_code, boq_description, element_id, item_id,
        choice_option_id, quantity, unit, unit_rate, material_cost, labor_cost,
        equipment_cost, overhead_cost, base_amount, total_cost, gst_percentage,
        gst_amount, total_amount, vendor_id, quotation_reference, price_validity_date,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) 
       RETURNING *`,
      [
        project_id, unit_id, uid, boq_code, boq_description, element_id, item_id,
        choice_option_id, quantity, unit, unit_rate, material_cost, labor_cost,
        equipment_cost, overhead_cost, base_amount, total_cost, gst_percentage,
        gst_amount, total_amount, vendor_id, quotation_reference, price_validity_date,
        notes, created_by
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
 * /costing_boq/{id}:
 *   put:
 *     summary: Update an existing BOQ costing entry by ID
 *     tags: [Costing BOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ costing entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unit_rate:
 *                 type: number
 *               material_cost:
 *                 type: number
 *               labor_cost:
 *                 type: number
 *               equipment_cost:
 *                 type: number
 *               overhead_cost:
 *                 type: number
 *               vendor_id:
 *                 type: integer
 *               status:
 *                 type: string
 *               approval_status:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ costing entry updated successfully
 *       404:
 *         description: BOQ costing entry not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    quantity, unit_rate, material_cost, labor_cost, equipment_cost, overhead_cost,
    vendor_id, quotation_reference, price_validity_date, status, approval_status,
    notes, updated_by, gst_percentage
  } = req.body;

  try {
    // Get current record to calculate new totals
    const currentRecord = await db.query('SELECT * FROM costing_boq WHERE costing_boq_id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "BOQ costing entry not found" });
    }

    const current = currentRecord.rows[0];
    
    // Use provided values or keep current ones
    const newQuantity = quantity !== undefined ? quantity : current.quantity;
    const newUnitRate = unit_rate !== undefined ? unit_rate : current.unit_rate;
    const newMaterialCost = material_cost !== undefined ? material_cost : current.material_cost;
    const newLaborCost = labor_cost !== undefined ? labor_cost : current.labor_cost;
    const newEquipmentCost = equipment_cost !== undefined ? equipment_cost : current.equipment_cost;
    const newOverheadCost = overhead_cost !== undefined ? overhead_cost : current.overhead_cost;
    const newGstPercentage = gst_percentage !== undefined ? gst_percentage : current.gst_percentage;

    // Recalculate totals
    const base_amount = (newMaterialCost || 0) + (newLaborCost || 0) + (newEquipmentCost || 0) + (newOverheadCost || 0);
    const total_cost = newUnitRate ? (newQuantity * newUnitRate) : base_amount;
    const gst_amount = total_cost * (newGstPercentage / 100);
    const total_amount = total_cost + gst_amount;

    // Increment revision number if status changes to approved
    const revision_number = (approval_status === 'Approved' && current.approval_status !== 'Approved') 
      ? current.revision_number + 1 
      : current.revision_number;

    const result = await db.query(
      `UPDATE costing_boq 
       SET quantity = $1, unit_rate = $2, material_cost = $3, labor_cost = $4, 
           equipment_cost = $5, overhead_cost = $6, base_amount = $7, total_cost = $8, 
           gst_percentage = $9, gst_amount = $10, total_amount = $11, vendor_id = $12, 
           quotation_reference = $13, price_validity_date = $14, status = $15, 
           approval_status = $16, revision_number = $17, notes = $18, updated_by = $19, 
           updated_at = CURRENT_TIMESTAMP
       WHERE costing_boq_id = $20 
       RETURNING *`,
      [
        newQuantity, newUnitRate, newMaterialCost, newLaborCost, newEquipmentCost, 
        newOverheadCost, base_amount, total_cost, newGstPercentage, gst_amount, 
        total_amount, vendor_id, quotation_reference, price_validity_date, status, 
        approval_status, revision_number, notes, updated_by, id
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
 * /costing_boq/{id}:
 *   delete:
 *     summary: Delete a BOQ costing entry by ID
 *     tags: [Costing BOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ costing entry to delete
 *     responses:
 *       200:
 *         description: BOQ costing entry deleted successfully
 *       400:
 *         description: Cannot delete due to dependencies
 *       404:
 *         description: BOQ costing entry not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if entry is approved (shouldn't be deleted if approved)
    const statusCheck = await db.query(
      'SELECT approval_status FROM costing_boq WHERE costing_boq_id = $1', 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "BOQ costing entry not found" });
    }
    
    if (statusCheck.rows[0].approval_status === 'Approved') {
      return res.status(400).json({ 
        error: "Cannot delete approved BOQ costing entry. Change approval status first." 
      });
    }
    
    const result = await db.query('DELETE FROM costing_boq WHERE costing_boq_id = $1', [id]);
    
    res.json({ message: "BOQ costing entry deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /costing_boq/project/{projectId}/summary:
 *   get:
 *     tags: [Costing BOQ]
 *     description: Get cost summary for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project cost summary
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(total_cost) as total_base_cost,
        SUM(gst_amount) as total_gst,
        SUM(total_amount) as total_project_cost,
        AVG(gst_percentage) as avg_gst_percentage,
        COUNT(CASE WHEN approval_status = 'Approved' THEN 1 END) as approved_items,
        COUNT(CASE WHEN approval_status = 'Pending' THEN 1 END) as pending_items,
        COUNT(CASE WHEN approval_status = 'Rejected' THEN 1 END) as rejected_items
      FROM costing_boq 
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;