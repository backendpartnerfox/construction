const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ComponentUnits
 *   description: API for managing component units mapping
 */

/**
 * @swagger
 * /component_units:
 *   get:
 *     tags: [ComponentUnits]
 *     description: Retrieve all component unit mappings
 *     responses:
 *       200:
 *         description: List of component unit mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   component_unit_id:
 *                     type: integer
 *                   component_id:
 *                     type: integer
 *                   unit_id:
 *                     type: integer
 *                   quantity:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        cu.*,
        c.component_name,
        c.component_code,
        u.unit_name,
        u.unit_code,
        p.project_name
      FROM component_units cu
      LEFT JOIN components c ON cu.component_id = c.component_id
      LEFT JOIN units u ON cu.unit_id = u.unit_id
      LEFT JOIN projects p ON c.project_id = p.project_id
      ORDER BY p.project_name, c.component_name, u.unit_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_units/{id}:
 *   get:
 *     tags: [ComponentUnits]
 *     description: Retrieve a specific component unit mapping by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component unit mapping
 *     responses:
 *       200:
 *         description: Component unit mapping details
 *       404:
 *         description: Component unit mapping not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        cu.*,
        c.component_name,
        c.component_code,
        u.unit_name,
        u.unit_code,
        p.project_name
      FROM component_units cu
      LEFT JOIN components c ON cu.component_id = c.component_id
      LEFT JOIN units u ON cu.unit_id = u.unit_id
      LEFT JOIN projects p ON c.project_id = p.project_id
      WHERE cu.component_unit_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component unit mapping not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_units/component/{componentId}:
 *   get:
 *     tags: [ComponentUnits]
 *     description: Retrieve all units for a specific component
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component
 *     responses:
 *       200:
 *         description: List of units for the component
 *       404:
 *         description: Component not found
 *       500:
 *         description: Internal server error
 */
router.get('/component/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  
  try {
    // First check if component exists
    const componentCheck = await db.query('SELECT component_id FROM components WHERE component_id = $1', [componentId]);
    
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    const result = await db.query(`
      SELECT 
        cu.*,
        u.unit_name,
        u.unit_code,
        u.description as unit_description,
        u.floor,
        u.room
      FROM component_units cu
      LEFT JOIN units u ON cu.unit_id = u.unit_id
      WHERE cu.component_id = $1
      ORDER BY u.floor, u.room, u.unit_name
    `, [componentId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_units/unit/{unitId}:
 *   get:
 *     tags: [ComponentUnits]
 *     description: Retrieve all components that map to a specific unit
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the unit
 *     responses:
 *       200:
 *         description: List of components mapped to the unit
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Internal server error
 */
router.get('/unit/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;
  
  try {
    // First check if unit exists
    const unitCheck = await db.query('SELECT unit_id FROM units WHERE unit_id = $1', [unitId]);
    
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    const result = await db.query(`
      SELECT 
        cu.*,
        c.component_name,
        c.component_code,
        c.component_type
      FROM component_units cu
      LEFT JOIN components c ON cu.component_id = c.component_id
      WHERE cu.unit_id = $1
      ORDER BY c.component_name
    `, [unitId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_units:
 *   post:
 *     summary: Create a new component unit mapping
 *     tags: [ComponentUnits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - component_id
 *               - unit_id
 *             properties:
 *               component_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit_of_measure:
 *                 type: string
 *               allocation_percentage:
 *                 type: number
 *               is_primary:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Component unit mapping created successfully
 *       400:
 *         description: Invalid input or mapping already exists
 *       404:
 *         description: Component or unit not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    component_id, unit_id, quantity, unit_of_measure,
    allocation_percentage, is_primary, notes, created_by
  } = req.body;

  // Validate required fields
  if (!component_id || !unit_id) {
    return res.status(400).json({ 
      error: "Required fields: component_id, unit_id" 
    });
  }

  try {
    // Verify component exists
    const componentCheck = await db.query('SELECT component_id FROM components WHERE component_id = $1', [component_id]);
    
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Verify unit exists
    const unitCheck = await db.query('SELECT unit_id FROM units WHERE unit_id = $1', [unit_id]);
    
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Check if mapping already exists
    const mappingCheck = await db.query(
      'SELECT component_unit_id FROM component_units WHERE component_id = $1 AND unit_id = $2',
      [component_id, unit_id]
    );
    
    if (mappingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Component unit mapping already exists' });
    }

    const result = await db.query(
      `INSERT INTO component_units (
        component_id, unit_id, quantity, unit_of_measure,
        allocation_percentage, is_primary, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        component_id, unit_id, quantity || 1, unit_of_measure,
        allocation_percentage || 100, is_primary || false, notes, created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_units/{id}:
 *   put:
 *     summary: Update an existing component unit mapping
 *     tags: [ComponentUnits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component unit mapping to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unit_of_measure:
 *                 type: string
 *               allocation_percentage:
 *                 type: number
 *               is_primary:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Component unit mapping updated successfully
 *       404:
 *         description: Component unit mapping not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.component_unit_id;
  delete updates.component_id;
  delete updates.unit_id;
  delete updates.created_at;
  delete updates.created_by;

  // Add updated_at timestamp
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE component_units 
       SET ${setClause}
       WHERE component_unit_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component unit mapping not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_units/{id}:
 *   delete:
 *     summary: Delete a component unit mapping
 *     tags: [ComponentUnits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component unit mapping to delete
 *     responses:
 *       200:
 *         description: Component unit mapping deleted successfully
 *       404:
 *         description: Component unit mapping not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM component_units WHERE component_unit_id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component unit mapping not found" });
    }
    
    res.json({ message: "Component unit mapping deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_units/project/{projectId}:
 *   get:
 *     tags: [ComponentUnits]
 *     description: Get all component unit mappings for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *     responses:
 *       200:
 *         description: List of component unit mappings for the project
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cu.*,
        c.component_name,
        c.component_code,
        u.unit_name,
        u.unit_code,
        u.floor,
        u.room
      FROM component_units cu
      LEFT JOIN components c ON cu.component_id = c.component_id
      LEFT JOIN units u ON cu.unit_id = u.unit_id
      WHERE c.project_id = $1
      ORDER BY c.component_name, u.floor, u.room
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;