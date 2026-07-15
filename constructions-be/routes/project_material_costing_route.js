const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Material Costing
 *   description: API for managing project material costing
 */

/**
 * @swagger
 * /project_material_costing:
 *   get:
 *     tags: [Project Material Costing]
 *     description: Retrieve all project material costings with related information
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
 *       - in: query
 *         name: is_approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: List of project material costings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   costing_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   boq_id:
 *                     type: integer
 *                   element_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   boq_quantity:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   unit_price:
 *                     type: number
 *                   total_amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   is_approved:
 *                     type: boolean
 */

// Get all project material costings
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, status, is_approved } = req.query;
  
  try {
    let query = `
      SELECT pmc.*, p.project_name, e.element_name, i.item_name,
             ic.display_name as choice_name, v.vendor_name,
             u1.first_name || ' ' || u1.last_name as created_by_name,
             u2.first_name || ' ' || u2.last_name as updated_by_name,
             u3.first_name || ' ' || u3.last_name as approved_by_name
      FROM project_material_costing pmc
      LEFT JOIN projects p ON pmc.project_id = p.project_id
      LEFT JOIN elements e ON pmc.element_id = e.element_id
      LEFT JOIN items i ON pmc.item_id = i.item_id
      LEFT JOIN item_choices ic ON pmc.choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON pmc.vendor_id = v.vendor_id
      LEFT JOIN employees u1 ON pmc.created_by = u1.employee_id
      LEFT JOIN employees u2 ON pmc.updated_by = u2.employee_id
      LEFT JOIN employees u3 ON pmc.approved_by = u3.employee_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (project_id) {
      conditions.push(`pmc.project_id = $${params.length + 1}`);
      params.push(project_id);
    }
    
    if (status) {
      conditions.push(`pmc.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (is_approved !== undefined) {
      conditions.push(`pmc.is_approved = $${params.length + 1}`);
      params.push(is_approved === 'true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY pmc.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_material_costing/{id}:
 *   get:
 *     tags: [Project Material Costing]
 *     description: Retrieve a specific project material costing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the costing to retrieve
 *     responses:
 *       200:
 *         description: Project material costing details
 *       404:
 *         description: Costing not found
 *       500:
 *         description: Internal server error
 */

// Get project material costing by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT pmc.*, p.project_name, e.element_name, i.item_name,
             ic.display_name as choice_name, v.vendor_name,
             u1.first_name || ' ' || u1.last_name as created_by_name,
             u2.first_name || ' ' || u2.last_name as updated_by_name,
             u3.first_name || ' ' || u3.last_name as approved_by_name
      FROM project_material_costing pmc
      LEFT JOIN projects p ON pmc.project_id = p.project_id
      LEFT JOIN elements e ON pmc.element_id = e.element_id
      LEFT JOIN items i ON pmc.item_id = i.item_id
      LEFT JOIN item_choices ic ON pmc.choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON pmc.vendor_id = v.vendor_id
      LEFT JOIN employees u1 ON pmc.created_by = u1.employee_id
      LEFT JOIN employees u2 ON pmc.updated_by = u2.employee_id
      LEFT JOIN employees u3 ON pmc.approved_by = u3.employee_id
      WHERE pmc.costing_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project material costing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_material_costing/project/{projectId}:
 *   get:
 *     tags: [Project Material Costing]
 *     description: Retrieve all material costings for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of material costings for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get material costings by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT pmc.*, e.element_name, i.item_name,
             ic.display_name as choice_name, v.vendor_name
      FROM project_material_costing pmc
      LEFT JOIN elements e ON pmc.element_id = e.element_id
      LEFT JOIN items i ON pmc.item_id = i.item_id
      LEFT JOIN item_choices ic ON pmc.choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON pmc.vendor_id = v.vendor_id
      WHERE pmc.project_id = $1
      ORDER BY e.element_name, i.item_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_material_costing:
 *   post:
 *     summary: Create a new project material costing
 *     tags: [Project Material Costing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - boq_id
 *               - element_id
 *               - item_id
 *               - boq_quantity
 *               - unit
 *               - unit_price
 *             properties:
 *               project_id:
 *                 type: integer
 *               boq_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               choice_option_id:
 *                 type: integer
 *               boq_quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               main_bar_dia:
 *                 type: number
 *               tmt_standard_id:
 *                 type: integer
 *               rmc_grade:
 *                 type: string
 *               vendor_id:
 *                 type: integer
 *               unit_price:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *               quotation_reference:
 *                 type: string
 *               pricing_validity_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Material costing created successfully
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
    project_id, boq_id, element_id, item_id, choice_option_id, boq_quantity,
    unit, main_bar_dia, tmt_standard_id, rmc_grade, vendor_id, unit_price,
    discount_percentage = 0, gst_percentage = 18, quotation_reference,
    pricing_validity_date, notes, created_by
  } = req.body;

  // Validate required fields
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required" });
  }
  if (!boq_id) {
    return res.status(400).json({ error: "BOQ ID is required" });
  }
  if (!element_id) {
    return res.status(400).json({ error: "Element ID is required" });
  }
  if (!item_id) {
    return res.status(400).json({ error: "Item ID is required" });
  }
  if (!boq_quantity) {
    return res.status(400).json({ error: "BOQ quantity is required" });
  }
  if (!unit) {
    return res.status(400).json({ error: "Unit is required" });
  }
  if (!unit_price) {
    return res.status(400).json({ error: "Unit price is required" });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify element exists
    const elementCheck = await db.query('SELECT element_id FROM elements WHERE element_id = $1', [element_id]);
    if (elementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Element not found' });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Calculate amounts
    const unit_price_after_discount = unit_price * (1 - (discount_percentage / 100));
    const subtotal = boq_quantity * unit_price_after_discount;
    const gst_amount = unit_price_after_discount * (gst_percentage / 100);
    const total_gst = boq_quantity * gst_amount;
    const total_amount = subtotal + total_gst;

    const result = await db.query(
      `INSERT INTO project_material_costing (
        project_id, boq_id, element_id, item_id, choice_option_id, boq_quantity,
        unit, main_bar_dia, tmt_standard_id, rmc_grade, vendor_id, unit_price,
        discount_percentage, unit_price_after_discount, gst_percentage, gst_amount,
        subtotal, total_gst, total_amount, quotation_reference, pricing_validity_date,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
       RETURNING *`,
      [
        project_id, boq_id, element_id, item_id, choice_option_id, boq_quantity,
        unit, main_bar_dia, tmt_standard_id, rmc_grade, vendor_id, unit_price,
        discount_percentage, unit_price_after_discount, gst_percentage, gst_amount,
        subtotal, total_gst, total_amount, quotation_reference, pricing_validity_date,
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
 * /project_material_costing/{id}:
 *   put:
 *     summary: Update an existing project material costing by ID
 *     tags: [Project Material Costing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the costing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boq_quantity:
 *                 type: number
 *               unit_price:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *               vendor_id:
 *                 type: integer
 *               quotation_reference:
 *                 type: string
 *               pricing_validity_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Material costing updated successfully
 *       404:
 *         description: Costing not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    boq_quantity, unit_price, discount_percentage, gst_percentage, vendor_id,
    quotation_reference, pricing_validity_date, status, notes, updated_by
  } = req.body;

  try {
    // Get current record to recalculate amounts
    const currentRecord = await db.query('SELECT * FROM project_material_costing WHERE costing_id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "Project material costing not found" });
    }

    const current = currentRecord.rows[0];
    
    // Use provided values or keep current ones
    const newBoqQuantity = boq_quantity !== undefined ? boq_quantity : current.boq_quantity;
    const newUnitPrice = unit_price !== undefined ? unit_price : current.unit_price;
    const newDiscountPercentage = discount_percentage !== undefined ? discount_percentage : current.discount_percentage;
    const newGstPercentage = gst_percentage !== undefined ? gst_percentage : current.gst_percentage;

    // Recalculate amounts
    const unit_price_after_discount = newUnitPrice * (1 - (newDiscountPercentage / 100));
    const subtotal = newBoqQuantity * unit_price_after_discount;
    const gst_amount = unit_price_after_discount * (newGstPercentage / 100);
    const total_gst = newBoqQuantity * gst_amount;
    const total_amount = subtotal + total_gst;

    const result = await db.query(
      `UPDATE project_material_costing 
       SET boq_quantity = $1, unit_price = $2, discount_percentage = $3,
           unit_price_after_discount = $4, gst_percentage = $5, gst_amount = $6,
           subtotal = $7, total_gst = $8, total_amount = $9, vendor_id = $10,
           quotation_reference = $11, pricing_validity_date = $12, status = $13,
           notes = $14, updated_by = $15, updated_at = CURRENT_TIMESTAMP
       WHERE costing_id = $16 
       RETURNING *`,
      [
        newBoqQuantity, newUnitPrice, newDiscountPercentage, unit_price_after_discount,
        newGstPercentage, gst_amount, subtotal, total_gst, total_amount, vendor_id,
        quotation_reference, pricing_validity_date, status, notes, updated_by, id
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
 * /project_material_costing/{id}/approve:
 *   patch:
 *     summary: Approve a project material costing
 *     tags: [Project Material Costing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the costing to approve
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Costing approved successfully
 *       404:
 *         description: Costing not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by, notes } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "Approved by user ID is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_material_costing 
       SET is_approved = true, approved_by = $1, approval_date = CURRENT_DATE,
           status = 'Approved', notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE costing_id = $3 
       RETURNING *`,
      [approved_by, notes, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project material costing not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_material_costing/{id}:
 *   delete:
 *     summary: Delete a project material costing by ID
 *     tags: [Project Material Costing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the costing to delete
 *     responses:
 *       200:
 *         description: Costing deleted successfully
 *       400:
 *         description: Cannot delete approved costing
 *       404:
 *         description: Costing not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if costing is approved (shouldn't be deleted if approved)
    const statusCheck = await db.query(
      'SELECT is_approved FROM project_material_costing WHERE costing_id = $1', 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project material costing not found" });
    }
    
    if (statusCheck.rows[0].is_approved) {
      return res.status(400).json({ 
        error: "Cannot delete approved costing. Remove approval first." 
      });
    }
    
    const result = await db.query('DELETE FROM project_material_costing WHERE costing_id = $1', [id]);
    
    res.json({ message: "Project material costing deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_material_costing/project/{projectId}/summary:
 *   get:
 *     tags: [Project Material Costing]
 *     description: Get material costing summary for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project material costing summary
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_costings,
        SUM(subtotal) as total_subtotal,
        SUM(total_gst) as total_gst_amount,
        SUM(total_amount) as total_project_cost,
        AVG(gst_percentage) as avg_gst_percentage,
        AVG(discount_percentage) as avg_discount_percentage,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_costings,
        COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_costings,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_costings,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_status_costings,
        COUNT(DISTINCT vendor_id) as total_vendors
      FROM project_material_costing 
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;