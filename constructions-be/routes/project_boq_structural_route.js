const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project BOQ Structural
 *   description: API for managing project BOQ structural items
 */

/**
 * @swagger
 * /project_boq_structural:
 *   get:
 *     tags: [Project BOQ Structural]
 *     description: Retrieve all structural BOQ items with project and element details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: element_id
 *         schema:
 *           type: integer
 *         description: Filter by element ID
 *       - in: query
 *         name: component_id
 *         schema:
 *           type: integer
 *         description: Filter by component ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Approved, Revised]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of structural BOQ items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, element_id, component_id, status } = req.query;
  
  try {
    let query = `
      SELECT 
        pbs.*,
        p.project_name,
        p.project_code,
        e.element_name,
        e.element_category,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code,
        pc.floor_id,
        pf.floor_name,
        pf.floor_number,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS approved_by_name
      FROM project_boq_structural pbs
      LEFT JOIN projects p ON pbs.project_id = p.project_id
      LEFT JOIN elements e ON pbs.element_id = e.element_id
      LEFT JOIN items i ON pbs.item_id = i.item_id
      LEFT JOIN components c ON pbs.component_id = c.component_id
      LEFT JOIN project_components pc ON pbs.component_id = pc.component_id AND pbs.project_id = pc.project_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN employees emp ON pbs.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pbs.approved_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pbs.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (element_id) {
      paramCount++;
      query += ` AND pbs.element_id = $${paramCount}`;
      params.push(element_id);
    }
    
    if (component_id) {
      paramCount++;
      query += ` AND pbs.component_id = $${paramCount}`;
      params.push(component_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND pbs.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY pbs.project_id, pbs.component_id, pbs.element_id';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/{id}:
 *   get:
 *     tags: [Project BOQ Structural]
 *     description: Retrieve a specific structural BOQ item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to retrieve
 *     responses:
 *       200:
 *         description: BOQ item details
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbs.*,
        p.project_name,
        p.project_code,
        e.element_name,
        e.element_category,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code,
        pc.floor_id,
        pf.floor_name,
        pf.floor_number,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS approved_by_name
      FROM project_boq_structural pbs
      LEFT JOIN projects p ON pbs.project_id = p.project_id
      LEFT JOIN elements e ON pbs.element_id = e.element_id
      LEFT JOIN items i ON pbs.item_id = i.item_id
      LEFT JOIN components c ON pbs.component_id = c.component_id
      LEFT JOIN project_components pc ON pbs.component_id = pc.component_id AND pbs.project_id = pc.project_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN employees emp ON pbs.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pbs.approved_by = emp2.employee_id
      WHERE pbs.boq_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOQ item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural:
 *   post:
 *     summary: Create a new structural BOQ item
 *     tags: [Project BOQ Structural]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - element_id
 *               - item_id
 *               - quantity
 *               - unit
 *             properties:
 *               project_id:
 *                 type: integer
 *               component_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               calculation_id:
 *                 type: integer
 *               calculation_type:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ item created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    component_id,
    element_id,
    item_id,
    unit_id,
    calculation_id,
    calculation_type,
    specifications,
    quantity,
    unit,
    unit_rate,
    created_by
  } = req.body;

  if (!project_id || !element_id || !item_id || !quantity || !unit) {
    return res.status(400).json({ error: "project_id, element_id, item_id, quantity, and unit are required" });
  }

  try {
    // Calculate amount
    const amount = quantity * (unit_rate || 0);

    const result = await db.query(
      `INSERT INTO project_boq_structural (
        project_id, component_id, element_id, item_id, unit_id,
        calculation_id, calculation_type, specifications,
        quantity, unit, unit_rate, amount, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        project_id, component_id, element_id, item_id, unit_id,
        calculation_id, calculation_type, specifications,
        quantity, unit, unit_rate, amount, 'Draft', created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/{id}:
 *   put:
 *     summary: Update a structural BOQ item
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               component_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               calculation_id:
 *                 type: integer
 *               calculation_type:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Draft, Approved, Revised]
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ item updated successfully
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    // List of allowed fields to update
    const allowedFields = [
      'component_id', 'element_id', 'item_id', 'unit_id', 
      'calculation_id', 'calculation_type', 'specifications',
      'quantity', 'unit', 'unit_rate', 'status', 'updated_by'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    // Recalculate amount if quantity or unit_rate is updated
    if (updates.quantity !== undefined || updates.unit_rate !== undefined) {
      updateFields.push(`amount = COALESCE($${valueCount}, quantity) * COALESCE($${valueCount + 1}, unit_rate)`);
      values.push(updates.quantity);
      values.push(updates.unit_rate);
      valueCount += 2;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE project_boq_structural 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE boq_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/{id}:
 *   delete:
 *     summary: Delete a structural BOQ item
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to delete
 *     responses:
 *       200:
 *         description: BOQ item deleted successfully
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_boq_structural WHERE boq_id = $1 RETURNING boq_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json({ message: "BOQ item deleted successfully", deleted_id: result.rows[0].boq_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/{id}/approve:
 *   post:
 *     summary: Approve a structural BOQ item
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to approve
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
 *     responses:
 *       200:
 *         description: BOQ item approved successfully
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "approved_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_boq_structural 
       SET status = 'Approved', 
           approved_by = $1, 
           approved_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE boq_id = $2
       RETURNING *`,
      [approved_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/project/{projectId}/summary:
 *   get:
 *     summary: Get structural BOQ summary for a project
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Structural BOQ summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        i.item_name,
        i.item_unit,
        pbs.unit,
        SUM(pbs.quantity) as total_quantity,
        AVG(pbs.unit_rate) as avg_unit_rate,
        SUM(pbs.amount) as total_cost,
        COUNT(*) as item_count
      FROM project_boq_structural pbs
      JOIN items i ON pbs.item_id = i.item_id
      WHERE pbs.project_id = $1
      GROUP BY i.item_id, i.item_name, i.item_unit, pbs.unit
      ORDER BY i.item_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/component/{componentId}:
 *   get:
 *     summary: Get structural BOQ items for a specific component
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Component ID
 *     responses:
 *       200:
 *         description: List of BOQ items for the component
 *       500:
 *         description: Internal server error
 */
router.get('/component/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbs.*,
        e.element_name,
        e.element_category,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code
      FROM project_boq_structural pbs
      LEFT JOIN elements e ON pbs.element_id = e.element_id
      LEFT JOIN items i ON pbs.item_id = i.item_id
      LEFT JOIN components c ON pbs.component_id = c.component_id
      WHERE pbs.component_id = $1
      ORDER BY pbs.element_id, pbs.item_id
    `, [componentId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_structural/element/{elementId}:
 *   get:
 *     summary: Get structural BOQ items for a specific element
 *     tags: [Project BOQ Structural]
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Element ID
 *     responses:
 *       200:
 *         description: List of BOQ items for the element
 *       500:
 *         description: Internal server error
 */
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbs.*,
        p.project_name,
        p.project_code,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code
      FROM project_boq_structural pbs
      LEFT JOIN projects p ON pbs.project_id = p.project_id
      LEFT JOIN items i ON pbs.item_id = i.item_id
      LEFT JOIN components c ON pbs.component_id = c.component_id
      WHERE pbs.element_id = $1
      ORDER BY pbs.project_id, pbs.component_id
    `, [elementId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;