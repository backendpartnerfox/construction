const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQWindows
 *   description: API for managing project BOQ windows
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectBOQWindow:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         window_id:
 *           type: integer
 *         element_id:
 *           type: integer
 *         floor:
 *           type: string
 *         room:
 *           type: string
 *         location_description:
 *           type: string
 *         wall_direction:
 *           type: string
 *         item_id:
 *           type: integer
 *         item_choice_id:
 *           type: integer
 *         quantity:
 *           type: number
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
 * /project_boq_windows:
 *   get:
 *     tags: [ProjectBOQWindows]
 *     description: Retrieve all project BOQ windows
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: window_id
 *         schema:
 *           type: integer
 *         description: Filter by window ID
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *     responses:
 *       200:
 *         description: List of project BOQ windows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectBOQWindow'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, window_id, floor } = req.query;
  
  try {
    let query = `
      SELECT pbw.*, 
             p.project_name,
             w.window_type, w.window_material,
             e.element_name,
             i.item_name,
             ic.item_material_type as choice_name
      FROM project_boq_windows pbw
      JOIN projects p ON pbw.project_id = p.project_id
      JOIN windows w ON pbw.window_id = w.window_id
      JOIN elements e ON pbw.element_id = e.element_id
      JOIN items i ON pbw.item_id = i.item_id
      JOIN item_choices ic ON pbw.item_choice_id = ic.choice_option_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      query += ` AND pbw.project_id = $${++paramCount}`;
      params.push(project_id);
    }
    
    if (window_id) {
      query += ` AND pbw.window_id = $${++paramCount}`;
      params.push(window_id);
    }
    
    if (floor) {
      query += ` AND pbw.floor = $${++paramCount}`;
      params.push(floor);
    }
    
    query += ' ORDER BY pbw.project_id, pbw.floor, pbw.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_windows/{id}:
 *   get:
 *     tags: [ProjectBOQWindows]
 *     description: Retrieve a specific project BOQ window by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project BOQ window
 *     responses:
 *       200:
 *         description: Project BOQ window details
 *       404:
 *         description: Project BOQ window not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pbw.*, 
             p.project_name,
             w.window_type, w.window_material,
             e.element_name,
             i.item_name,
             ic.item_material_type as choice_name
      FROM project_boq_windows pbw
      JOIN projects p ON pbw.project_id = p.project_id
      JOIN windows w ON pbw.window_id = w.window_id
      JOIN elements e ON pbw.element_id = e.element_id
      JOIN items i ON pbw.item_id = i.item_id
      JOIN item_choices ic ON pbw.item_choice_id = ic.choice_option_id
      WHERE pbw.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ window not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_windows:
 *   post:
 *     tags: [ProjectBOQWindows]
 *     description: Create a new project BOQ window entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - window_id
 *               - element_id
 *               - floor
 *               - room
 *               - item_id
 *               - item_choice_id
 *               - quantity
 *               - unit_price
 *             properties:
 *               project_id:
 *                 type: integer
 *               window_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               location_description:
 *                 type: string
 *               wall_direction:
 *                 type: string
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project BOQ window created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, window_id, element_id, floor, room, 
    location_description, wall_direction, item_id, item_choice_id, 
    quantity, unit_price 
  } = req.body;
  
  if (!project_id || !window_id || !element_id || !floor || !room || 
      !item_id || !item_choice_id || !quantity || unit_price === undefined) {
    return res.status(400).json({ 
      error: 'Required fields: project_id, window_id, element_id, floor, room, item_id, item_choice_id, quantity, unit_price' 
    });
  }
  
  try {
    const total_price = quantity * unit_price;
    
    const result = await db.query(`
      INSERT INTO project_boq_windows (
        project_id, window_id, element_id, floor, room, 
        location_description, wall_direction, item_id, item_choice_id, 
        quantity, unit_price, total_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [project_id, window_id, element_id, floor, room, 
        location_description, wall_direction, item_id, item_choice_id, 
        quantity, unit_price, total_price]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference: Check project_id, window_id, element_id, item_id, or item_choice_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_windows/{id}:
 *   put:
 *     tags: [ProjectBOQWindows]
 *     description: Update a project BOQ window entry
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
 *               unit_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project BOQ window updated successfully
 *       404:
 *         description: Project BOQ window not found
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { quantity, unit_price } = req.body;
  
  if (!quantity || unit_price === undefined) {
    return res.status(400).json({ error: 'Quantity and unit_price are required' });
  }
  
  try {
    const total_price = quantity * unit_price;
    
    const result = await db.query(`
      UPDATE project_boq_windows 
      SET quantity = $1, unit_price = $2, total_price = $3
      WHERE id = $4
      RETURNING *
    `, [quantity, unit_price, total_price, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ window not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_windows/{id}:
 *   delete:
 *     tags: [ProjectBOQWindows]
 *     description: Delete a project BOQ window entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project BOQ window deleted successfully
 *       404:
 *         description: Project BOQ window not found
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query('DELETE FROM project_boq_windows WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project BOQ window not found' });
    }
    
    res.json({ message: 'Project BOQ window deleted successfully' });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_windows/summary/{projectId}:
 *   get:
 *     tags: [ProjectBOQWindows]
 *     description: Get summary of project BOQ windows by project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary of project BOQ windows
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        floor,
        COUNT(DISTINCT window_id) as window_count,
        COUNT(*) as item_count,
        SUM(total_price) as floor_total
      FROM project_boq_windows
      WHERE project_id = $1
      GROUP BY floor
      ORDER BY floor
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;