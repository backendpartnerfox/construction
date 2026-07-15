const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQElectrical
 *   description: API for managing project BOQ electrical items
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectBOQElectrical:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         element_id:
 *           type: integer
 *         floor:
 *           type: string
 *         room:
 *           type: string
 *         location_description:
 *           type: string
 *         item_id:
 *           type: integer
 *         item_choice_id:
 *           type: integer
 *         quantity:
 *           type: number
 *         unit:
 *           type: string
 *         unit_price:
 *           type: number
 *         total_price:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /project_boq_electrical:
 *   get:
 *     tags: [ProjectBOQElectrical]
 *     description: Retrieve all project BOQ electrical items
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *         description: Filter by room
 *     responses:
 *       200:
 *         description: List of project BOQ electrical items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectBOQElectrical'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room } = req.query;
  
  try {
    let query = `
      SELECT pbe.*, 
             p.project_name,
             e.element_name,
             i.item_name,
             ic.item_material_type as choice_name
      FROM project_boq_electrical pbe
      JOIN projects p ON pbe.project_id = p.project_id
      JOIN elements e ON pbe.element_id = e.element_id
      JOIN items i ON pbe.item_id = i.item_id
      JOIN item_choices ic ON pbe.item_choice_id = ic.choice_option_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      query += ` AND pbe.project_id = $${++paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      query += ` AND pbe.floor = $${++paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      query += ` AND pbe.room = $${++paramCount}`;
      params.push(room);
    }
    
    query += ' ORDER BY pbe.project_id, pbe.floor, pbe.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_electrical/{id}:
 *   get:
 *     tags: [ProjectBOQElectrical]
 *     description: Retrieve a specific project BOQ electrical item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project BOQ electrical item
 *     responses:
 *       200:
 *         description: Project BOQ electrical item details
 *       404:
 *         description: Project BOQ electrical item not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pbe.*, 
             p.project_name,
             e.element_name,
             i.item_name,
             ic.item_material_type as choice_name
      FROM project_boq_electrical pbe
      JOIN projects p ON pbe.project_id = p.project_id
      JOIN elements e ON pbe.element_id = e.element_id
      JOIN items i ON pbe.item_id = i.item_id
      JOIN item_choices ic ON pbe.item_choice_id = ic.choice_option_id
      WHERE pbe.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ electrical item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_electrical:
 *   post:
 *     tags: [ProjectBOQElectrical]
 *     description: Create a new project BOQ electrical item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - element_id
 *               - floor
 *               - room
 *               - item_id
 *               - item_choice_id
 *               - quantity
 *               - unit
 *               - unit_price
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               location_description:
 *                 type: string
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project BOQ electrical item created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, element_id, floor, room, location_description,
    item_id, item_choice_id, quantity, unit, unit_price 
  } = req.body;
  
  if (!project_id || !element_id || !floor || !room || 
      !item_id || !item_choice_id || !quantity || !unit || unit_price === undefined) {
    return res.status(400).json({ 
      error: 'Required fields: project_id, element_id, floor, room, item_id, item_choice_id, quantity, unit, unit_price' 
    });
  }
  
  try {
    const total_price = quantity * unit_price;
    
    const result = await db.query(`
      INSERT INTO project_boq_electrical (
        project_id, element_id, floor, room, location_description,
        item_id, item_choice_id, quantity, unit, unit_price, total_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [project_id, element_id, floor, room, location_description,
        item_id, item_choice_id, quantity, unit, unit_price, total_price]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference: Check project_id, element_id, item_id, or item_choice_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_electrical/{id}:
 *   put:
 *     tags: [ProjectBOQElectrical]
 *     description: Update a project BOQ electrical item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project BOQ electrical item updated successfully
 *       404:
 *         description: Project BOQ electrical item not found
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { quantity, unit, unit_price } = req.body;
  
  if (!quantity || !unit || unit_price === undefined) {
    return res.status(400).json({ error: 'Quantity, unit, and unit_price are required' });
  }
  
  try {
    const total_price = quantity * unit_price;
    
    const result = await db.query(`
      UPDATE project_boq_electrical 
      SET quantity = $1, unit = $2, unit_price = $3, total_price = $4
      WHERE id = $5
      RETURNING *
    `, [quantity, unit, unit_price, total_price, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ electrical item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_electrical/{id}:
 *   delete:
 *     tags: [ProjectBOQElectrical]
 *     description: Delete a project BOQ electrical item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project BOQ electrical item deleted successfully
 *       404:
 *         description: Project BOQ electrical item not found
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query('DELETE FROM project_boq_electrical WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project BOQ electrical item not found' });
    }
    
    res.json({ message: 'Project BOQ electrical item deleted successfully' });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_electrical/summary/{projectId}:
 *   get:
 *     tags: [ProjectBOQElectrical]
 *     description: Get summary of project BOQ electrical items by project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary of project BOQ electrical items
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        i.item_name,
        SUM(pbe.quantity) as total_quantity,
        pbe.unit,
        SUM(pbe.total_price) as item_total
      FROM project_boq_electrical pbe
      JOIN items i ON pbe.item_id = i.item_id
      WHERE pbe.project_id = $1
      GROUP BY i.item_name, pbe.unit
      ORDER BY i.item_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;