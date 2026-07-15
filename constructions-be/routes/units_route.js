const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: API for managing construction units
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Unit:
 *       type: object
 *       properties:
 *         unit_id:
 *           type: integer
 *         uid:
 *           type: string
 *         project_id:
 *           type: integer
 *         component_id:
 *           type: integer
 *         unit_code:
 *           type: string
 *         unit_name:
 *           type: string
 *         unit_description:
 *           type: string
 *         unit_category:
 *           type: string
 *         element_id:
 *           type: integer
 *         item_id:
 *           type: integer
 *         quantity:
 *           type: number
 *         unit_measure:
 *           type: string
 *         unit_rate:
 *           type: number
 *         total_amount:
 *           type: number
 *         work_method:
 *           type: string
 *         quality_standards:
 *           type: string
 *         status:
 *           type: string
 *         completion_percentage:
 *           type: number
 *         labor_hours:
 *           type: number
 *         material_cost:
 *           type: number
 *         equipment_cost:
 *           type: number
 *         overhead_cost:
 *           type: number
 *         planned_duration_days:
 *           type: integer
 *         planned_start_date:
 *           type: string
 *           format: date
 *         planned_end_date:
 *           type: string
 *           format: date
 *         actual_start_date:
 *           type: string
 *           format: date
 *         actual_end_date:
 *           type: string
 *           format: date
 *         building_block:
 *           type: string
 *         floor:
 *           type: string
 *         zone:
 *           type: string
 *         grid_reference:
 *           type: string
 *         notes:
 *           type: string
 *         created_by:
 *           type: integer
 *         updated_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /units:
 *   get:
 *     summary: Retrieve all units
 *     tags: [Units]
 *     responses:
 *       200:
 *         description: List of units
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM units ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/{id}:
 *   get:
 *     summary: Get a unit by ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the unit
 *     responses:
 *       200:
 *         description: Unit details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM units WHERE unit_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units:
 *   post:
 *     summary: Create a new unit
 *     tags: [Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    uid, project_id, component_id, unit_code, unit_name, unit_description, unit_category,
    element_id, item_id, quantity, unit_measure, unit_rate, total_amount, work_method,
    quality_standards, status, completion_percentage, labor_hours, material_cost,
    equipment_cost, overhead_cost, planned_duration_days, planned_start_date,
    planned_end_date, building_block, floor, zone, grid_reference, notes, created_by
  } = req.body;

  if (!uid || !project_id || !component_id || !unit_name || !quantity || !unit_measure) {
    return res.status(400).json({ error: "UID, project ID, component ID, unit name, quantity, and unit measure are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO units (
        uid, project_id, component_id, unit_code, unit_name, unit_description, unit_category,
        element_id, item_id, quantity, unit_measure, unit_rate, total_amount, work_method,
        quality_standards, status, completion_percentage, labor_hours, material_cost,
        equipment_cost, overhead_cost, planned_duration_days, planned_start_date,
        planned_end_date, building_block, floor, zone, grid_reference, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) 
       RETURNING unit_id`,
      [
        uid, project_id, component_id, unit_code || null, unit_name, unit_description || null,
        unit_category || null, element_id || null, item_id || null, quantity, unit_measure,
        unit_rate || null, total_amount || null, work_method || null, quality_standards || null,
        status || 'Planned', completion_percentage || 0.00, labor_hours || null, material_cost || null,
        equipment_cost || null, overhead_cost || null, planned_duration_days || null, planned_start_date || null,
        planned_end_date || null, building_block || null, floor || null, zone || null, grid_reference || null,
        notes || null, created_by || null
      ]
    );
    res.status(201).json({ unit_id: result.rows[0].unit_id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/{id}:
 *   put:
 *     summary: Update a unit by ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the unit to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    uid, project_id, component_id, unit_code, unit_name, unit_description, unit_category,
    element_id, item_id, quantity, unit_measure, unit_rate, total_amount, work_method,
    quality_standards, status, completion_percentage, labor_hours, material_cost,
    equipment_cost, overhead_cost, planned_duration_days, planned_start_date,
    planned_end_date, actual_start_date, actual_end_date, building_block, floor,
    zone, grid_reference, notes, updated_by
  } = req.body;

  if (!unit_name) {
    return res.status(400).json({ error: "Unit name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE units 
       SET uid = $1, project_id = $2, component_id = $3, unit_code = $4, unit_name = $5,
           unit_description = $6, unit_category = $7, element_id = $8, item_id = $9,
           quantity = $10, unit_measure = $11, unit_rate = $12, total_amount = $13,
           work_method = $14, quality_standards = $15, status = $16, completion_percentage = $17,
           labor_hours = $18, material_cost = $19, equipment_cost = $20, overhead_cost = $21,
           planned_duration_days = $22, planned_start_date = $23, planned_end_date = $24,
           actual_start_date = $25, actual_end_date = $26, building_block = $27, floor = $28,
           zone = $29, grid_reference = $30, notes = $31, updated_by = $32,
           updated_at = CURRENT_TIMESTAMP
       WHERE unit_id = $33`,
      [
        uid, project_id, component_id, unit_code, unit_name, unit_description, unit_category,
        element_id, item_id, quantity, unit_measure, unit_rate, total_amount, work_method,
        quality_standards, status, completion_percentage, labor_hours, material_cost,
        equipment_cost, overhead_cost, planned_duration_days, planned_start_date,
        planned_end_date, actual_start_date, actual_end_date, building_block, floor,
        zone, grid_reference, notes, updated_by, id
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.json({ unit_id: Number(id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/{id}:
 *   delete:
 *     summary: Delete a unit by ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the unit to delete
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM units WHERE unit_id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.json({ message: "Unit deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/project/{projectId}:
 *   get:
 *     summary: Get units by project ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to filter units
 *     responses:
 *       200:
 *         description: List of units for the given project
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM units WHERE project_id = $1 ORDER BY unit_name",
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/component/{componentId}:
 *   get:
 *     summary: Get units by component ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The component ID to filter units
 *     responses:
 *       200:
 *         description: List of units for the given component
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/component/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM units WHERE component_id = $1 ORDER BY unit_name",
      [componentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/status/{status}:
 *   get:
 *     summary: Get units by status
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter units
 *     responses:
 *       200:
 *         description: List of units for the given status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM units WHERE status = $1 ORDER BY unit_name",
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/category/{category}:
 *   get:
 *     summary: Get units by category
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The category to filter units
 *     responses:
 *       200:
 *         description: List of units for the given category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/category/:category', async (req, res) => {
  const db = req.db;
  const { category } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM units WHERE unit_category = $1 ORDER BY unit_name",
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /units/floor/{floor}:
 *   get:
 *     summary: Get units by floor
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: floor
 *         required: true
 *         schema:
 *           type: string
 *         description: The floor to filter units
 *     responses:
 *       200:
 *         description: List of units for the given floor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       500:
 *         description: Internal server error
 */
router.get('/floor/:floor', async (req, res) => {
  const db = req.db;
  const { floor } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM units WHERE floor = $1 ORDER BY unit_name",
      [floor]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;