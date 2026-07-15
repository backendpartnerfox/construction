const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Structural Calculations
 *   description: API for managing structural calculations for projects
 */

/**
 * @swagger
 * /items_structural_calculations:
 *   get:
 *     tags: [Items Structural Calculations]
 *     description: Retrieve all structural calculations with details
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
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *       - in: query
 *         name: structural_type
 *         schema:
 *           type: string
 *         description: Filter by structural type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of structural calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, element_id, floor, structural_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        isc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_structural_calculations isc
      LEFT JOIN projects p ON isc.project_id = p.project_id
      LEFT JOIN elements e ON isc.element_id = e.element_id
      LEFT JOIN employees emp ON isc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON isc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND isc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (element_id) {
      paramCount++;
      query += ` AND isc.element_id = $${paramCount}`;
      params.push(element_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND isc.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (structural_type) {
      paramCount++;
      query += ` AND isc.structural_type = $${paramCount}`;
      params.push(structural_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND isc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY isc.project_id, isc.element_id, isc.floor';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/{id}:
 *   get:
 *     tags: [Items Structural Calculations]
 *     description: Retrieve a specific structural calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Structural calculation details
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        isc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_structural_calculations isc
      LEFT JOIN projects p ON isc.project_id = p.project_id
      LEFT JOIN elements e ON isc.element_id = e.element_id
      LEFT JOIN employees emp ON isc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON isc.verified_by = emp2.employee_id
      WHERE isc.calculation_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations:
 *   post:
 *     summary: Create a new structural calculation
 *     tags: [Items Structural Calculations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - element_id
 *               - measurement_id
 *               - structural_type
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               structural_type:
 *                 type: string
 *               sub_type:
 *                 type: string
 *               dimensions:
 *                 type: object
 *               tmt_requirements:
 *                 type: object
 *               rmc_requirements:
 *                 type: object
 *               main_bar_dia:
 *                 type: number
 *               distribution_bar_dia:
 *                 type: number
 *               stirrup_dia:
 *                 type: number
 *               stirrup_spacing:
 *                 type: number
 *               concrete_grade:
 *                 type: string
 *               concrete_cover:
 *                 type: number
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               design_load:
 *                 type: number
 *               live_load:
 *                 type: number
 *               dead_load:
 *                 type: number
 *               safety_factor:
 *                 type: number
 *               calculated_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Calculation created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    element_id,
    measurement_id,
    floor,
    structural_type,
    sub_type,
    dimensions,
    tmt_requirements,
    rmc_requirements,
    main_bar_dia,
    distribution_bar_dia,
    stirrup_dia,
    stirrup_spacing,
    concrete_grade,
    concrete_cover,
    quantity,
    unit,
    design_load,
    live_load,
    dead_load,
    safety_factor,
    reinforcement_type,
    concrete_mix_ratio,
    formwork_area,
    shuttering_area,
    unit_price,
    material_cost,
    labor_cost,
    wastage_percentage,
    calculated_by,
    notes
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, element_id, measurement_id, structural_type
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO items_structural_calculations (
        project_id, element_id, measurement_id, floor, structural_type,
        sub_type, dimensions, tmt_requirements, rmc_requirements,
        main_bar_dia, distribution_bar_dia, stirrup_dia, stirrup_spacing,
        concrete_grade, concrete_cover, quantity, unit, design_load,
        live_load, dead_load, safety_factor, reinforcement_type,
        concrete_mix_ratio, formwork_area, shuttering_area,
        unit_price, material_cost, labor_cost, wastage_percentage,
        calculated_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
                $25, $26, $27, $28, $29, $30, $31)
      RETURNING *`,
      [
        project_id, element_id, measurement_id, floor, structural_type,
        sub_type, dimensions ? JSON.stringify(dimensions) : null,
        tmt_requirements ? JSON.stringify(tmt_requirements) : null,
        rmc_requirements ? JSON.stringify(rmc_requirements) : null,
        main_bar_dia, distribution_bar_dia, stirrup_dia, stirrup_spacing,
        concrete_grade, concrete_cover, quantity || 1, unit || 'nos',
        design_load, live_load, dead_load, safety_factor || 1.5,
        reinforcement_type, concrete_mix_ratio, formwork_area,
        shuttering_area, unit_price || 0, material_cost || 0,
        labor_cost || 0, wastage_percentage || 5.00,
        calculated_by, notes
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
 * /items_structural_calculations/{id}:
 *   put:
 *     summary: Update a structural calculation
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               structural_type:
 *                 type: string
 *               sub_type:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit_price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Draft, Verified, Pending]
 *     responses:
 *       200:
 *         description: Calculation updated successfully
 *       404:
 *         description: Calculation not found
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

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && 
          key !== 'project_id' && 
          key !== 'element_id' &&
          key !== 'measurement_id' &&
          key !== 'calculation_id') {
        
        // Handle JSON fields
        if (key === 'dimensions' || key === 'tmt_requirements' || key === 'rmc_requirements') {
          updateFields.push(`${key} = $${valueCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = $${valueCount}`);
          values.push(updates[key]);
        }
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE items_structural_calculations 
      SET ${updateFields.join(', ')}
      WHERE calculation_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/{id}:
 *   delete:
 *     summary: Delete a structural calculation
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to delete
 *     responses:
 *       200:
 *         description: Calculation deleted successfully
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM items_structural_calculations WHERE calculation_id = $1 RETURNING calculation_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json({ message: "Calculation deleted successfully", deleted_id: result.rows[0].calculation_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/{id}/verify:
 *   post:
 *     summary: Verify a structural calculation
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to verify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verified_by
 *             properties:
 *               verified_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Calculation verified successfully
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  if (!verified_by) {
    return res.status(400).json({ error: "verified_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE items_structural_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE calculation_id = $2
       RETURNING *`,
      [verified_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get structural calculation summary for a project
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Structural calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        isc.structural_type,
        isc.sub_type,
        e.element_name,
        COUNT(*) as item_count,
        SUM(isc.quantity) as total_quantity,
        AVG(isc.unit_price) as avg_unit_price,
        SUM(isc.total_material_cost) as total_material_cost,
        SUM(isc.total_labor_cost) as total_labor_cost,
        SUM(isc.total_cost) as total_project_cost,
        COUNT(CASE WHEN isc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN isc.status = 'Draft' THEN 1 END) as draft_count,
        SUM(isc.tmt_weight) as total_tmt_weight,
        SUM(isc.rmc_volume) as total_rmc_volume
      FROM items_structural_calculations isc
      LEFT JOIN elements e ON isc.element_id = e.element_id
      WHERE isc.project_id = $1
      GROUP BY isc.structural_type, isc.sub_type, e.element_name
      ORDER BY isc.structural_type, isc.sub_type
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/project/{projectId}/element/{elementId}:
 *   get:
 *     summary: Get structural calculations for a specific element
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Element ID
 *     responses:
 *       200:
 *         description: Structural calculations for the element
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/element/:elementId', async (req, res) => {
  const db = req.db;
  const { projectId, elementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        isc.*,
        e.element_name
      FROM items_structural_calculations isc
      LEFT JOIN elements e ON isc.element_id = e.element_id
      WHERE isc.project_id = $1 AND isc.element_id = $2
      ORDER BY isc.floor, isc.structural_type
    `, [projectId, elementId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/project/{projectId}/tmt-summary:
 *   get:
 *     summary: Get TMT steel summary for a project
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: TMT steel usage summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/tmt-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        isc.main_bar_dia,
        isc.distribution_bar_dia,
        isc.stirrup_dia,
        COUNT(*) as usage_count,
        SUM(isc.tmt_weight) as total_weight_kg,
        SUM(isc.tmt_weight / 1000) as total_weight_mt,
        AVG(isc.unit_price) as avg_price_per_unit,
        SUM(isc.tmt_cost) as total_tmt_cost
      FROM items_structural_calculations isc
      WHERE isc.project_id = $1 
        AND (isc.main_bar_dia IS NOT NULL 
          OR isc.distribution_bar_dia IS NOT NULL 
          OR isc.stirrup_dia IS NOT NULL)
      GROUP BY isc.main_bar_dia, isc.distribution_bar_dia, isc.stirrup_dia
      ORDER BY isc.main_bar_dia
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/project/{projectId}/rmc-summary:
 *   get:
 *     summary: Get RMC concrete summary for a project
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: RMC concrete usage summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/rmc-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        isc.concrete_grade,
        isc.concrete_mix_ratio,
        COUNT(*) as usage_count,
        SUM(isc.rmc_volume) as total_volume_cum,
        AVG(isc.unit_price) as avg_price_per_cum,
        SUM(isc.rmc_cost) as total_rmc_cost,
        COUNT(DISTINCT isc.element_id) as elements_used_in
      FROM items_structural_calculations isc
      WHERE isc.project_id = $1 AND isc.concrete_grade IS NOT NULL
      GROUP BY isc.concrete_grade, isc.concrete_mix_ratio
      ORDER BY isc.concrete_grade
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/project/{projectId}/load-summary:
 *   get:
 *     summary: Get load calculation summary for a project
 *     tags: [Items Structural Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Load calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/load-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        e.element_name,
        isc.structural_type,
        COUNT(*) as element_count,
        AVG(isc.design_load) as avg_design_load,
        MAX(isc.design_load) as max_design_load,
        AVG(isc.live_load) as avg_live_load,
        AVG(isc.dead_load) as avg_dead_load,
        AVG(isc.safety_factor) as avg_safety_factor
      FROM items_structural_calculations isc
      LEFT JOIN elements e ON isc.element_id = e.element_id
      WHERE isc.project_id = $1 
        AND (isc.design_load IS NOT NULL 
          OR isc.live_load IS NOT NULL 
          OR isc.dead_load IS NOT NULL)
      GROUP BY e.element_name, isc.structural_type
      ORDER BY e.element_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_structural_calculations/structural-types:
 *   get:
 *     summary: Get all structural types used in the system
 *     tags: [Items Structural Calculations]
 *     responses:
 *       200:
 *         description: List of structural types
 *       500:
 *         description: Internal server error
 */
router.get('/structural-types', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT 
        structural_type,
        COUNT(*) as usage_count
      FROM items_structural_calculations
      WHERE structural_type IS NOT NULL
      GROUP BY structural_type
      ORDER BY structural_type
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;