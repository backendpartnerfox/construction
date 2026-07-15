const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Components
 *   description: API for managing project components
 */

/**
 * @swagger
 * /components:
 *   get:
 *     tags: [Components]
 *     description: Retrieve all components from the components table
 *     responses:
 *       200:
 *         description: List of components
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   component_id:
 *                     type: integer
 *                   client_requirement_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   component_code:
 *                     type: string
 *                   component_name:
 *                     type: string
 *                   component_description:
 *                     type: string
 *                   component_category:
 *                     type: string
 *                   component_type:
 *                     type: string
 *                   area:
 *                     type: number
 *                   volume:
 *                     type: number
 *                   quantity:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   status:
 *                     type: string
 *                   priority:
 *                     type: string
 *                   parent_component_id:
 *                     type: integer
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   actual_start_date:
 *                     type: string
 *                     format: date
 *                   actual_end_date:
 *                     type: string
 *                     format: date
 *                   notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   updated_by:
 *                     type: integer
 */

// Get all components
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM components');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /components/{id}:
 *   get:
 *     tags: [Components]
 *     description: Retrieve a specific component by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component to retrieve
 *     responses:
 *       200:
 *         description: Component details
 *       404:
 *         description: Component not found
 *       500:
 *         description: Internal server error
 */

// Get component by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM components WHERE component_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /components:
 *   post:
 *     summary: Create a new component
 *     tags: [Components]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_requirement_id
 *               - project_id
 *               - component_name
 *             properties:
 *               client_requirement_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               component_code:
 *                 type: string
 *               component_name:
 *                 type: string
 *               component_description:
 *                 type: string
 *               component_category:
 *                 type: string
 *               component_type:
 *                 type: string
 *               area:
 *                 type: number
 *               volume:
 *                 type: number
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               parent_component_id:
 *                 type: integer
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Component created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    client_requirement_id,
    project_id,
    component_code,
    component_name,
    component_description,
    component_category,
    component_type,
    area,
    volume,
    quantity,
    unit,
    status,
    priority,
    parent_component_id,
    planned_start_date,
    planned_end_date,
    notes,
    created_by
  } = req.body;

  if (!client_requirement_id || !project_id || !component_name) {
    return res.status(400).json({ error: "Client requirement ID, project ID, and component name are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO components (
        client_requirement_id, project_id, component_code, component_name, component_description,
        component_category, component_type, area, volume, quantity, unit, status, priority,
        parent_component_id, planned_start_date, planned_end_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
       RETURNING component_id`,
      [
        client_requirement_id,
        project_id,
        component_code || null,
        component_name,
        component_description || null,
        component_category || null,
        component_type || null,
        area || null,
        volume || null,
        quantity || 1,
        unit || null,
        status || 'Planned',
        priority || 'Medium',
        parent_component_id || null,
        planned_start_date || null,
        planned_end_date || null,
        notes || null,
        created_by || null
      ]
    );

    res.status(201).json({ 
      component_id: result.rows[0].component_id,
      client_requirement_id,
      project_id,
      component_code,
      component_name,
      component_description,
      component_category,
      component_type,
      area,
      volume,
      quantity: quantity || 1,
      unit,
      status: status || 'Planned',
      priority: priority || 'Medium',
      parent_component_id,
      planned_start_date,
      planned_end_date,
      notes,
      created_by
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /components/{id}:
 *   put:
 *     summary: Update an existing component by ID
 *     tags: [Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_requirement_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               component_code:
 *                 type: string
 *               component_name:
 *                 type: string
 *               component_description:
 *                 type: string
 *               component_category:
 *                 type: string
 *               component_type:
 *                 type: string
 *               area:
 *                 type: number
 *               volume:
 *                 type: number
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               parent_component_id:
 *                 type: integer
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               actual_start_date:
 *                 type: string
 *                 format: date
 *               actual_end_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Component updated successfully
 *       404:
 *         description: Component not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    client_requirement_id,
    project_id,
    component_code,
    component_name,
    component_description,
    component_category,
    component_type,
    area,
    volume,
    quantity,
    unit,
    status,
    priority,
    parent_component_id,
    planned_start_date,
    planned_end_date,
    actual_start_date,
    actual_end_date,
    notes,
    updated_by
  } = req.body;

  if (!component_name) {
    return res.status(400).json({ error: "Component name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE components 
       SET client_requirement_id = $1, project_id = $2, component_code = $3, component_name = $4,
           component_description = $5, component_category = $6, component_type = $7, area = $8,
           volume = $9, quantity = $10, unit = $11, status = $12, priority = $13,
           parent_component_id = $14, planned_start_date = $15, planned_end_date = $16,
           actual_start_date = $17, actual_end_date = $18, notes = $19, updated_by = $20,
           updated_at = CURRENT_TIMESTAMP
       WHERE component_id = $21`,
      [
        client_requirement_id,
        project_id,
        component_code || null,
        component_name,
        component_description || null,
        component_category || null,
        component_type || null,
        area || null,
        volume || null,
        quantity || null,
        unit || null,
        status || null,
        priority || null,
        parent_component_id || null,
        planned_start_date || null,
        planned_end_date || null,
        actual_start_date || null,
        actual_end_date || null,
        notes || null,
        updated_by || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component not found" });
    }

    res.json({ 
      component_id: Number(id),
      client_requirement_id,
      project_id,
      component_code,
      component_name,
      component_description,
      component_category,
      component_type,
      area,
      volume,
      quantity,
      unit,
      status,
      priority,
      parent_component_id,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date,
      notes,
      updated_by
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /components/{id}:
 *   delete:
 *     summary: Delete a component by ID
 *     tags: [Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component to delete
 *     responses:
 *       200:
 *         description: Component deleted successfully
 *       404:
 *         description: Component not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM components WHERE component_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component not found" });
    }
    
    res.json({ message: "Component deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /components/project/{projectId}:
 *   get:
 *     tags: [Components]
 *     description: Retrieve components by project ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to filter components
 *     responses:
 *       200:
 *         description: List of components for the specified project
 *       500:
 *         description: Internal server error
 */

// Get components by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM components WHERE project_id = $1",
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /components/status/{status}:
 *   get:
 *     tags: [Components]
 *     description: Retrieve components by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter components
 *     responses:
 *       200:
 *         description: List of components with the specified status
 *       500:
 *         description: Internal server error
 */

// Get components by status
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM components WHERE status = $1",
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;