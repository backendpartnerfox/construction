const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQDoors
 *   description: API for managing project BOQ doors
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectBOQDoor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         door_id:
 *           type: integer
 *         element_id:
 *           type: integer
 *         floor:
 *           type: string
 *         room:
 *           type: string
 *         door_number:
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
 * /project_boq_doors:
 *   get:
 *     tags: [ProjectBOQDoors]
 *     description: Retrieve all project BOQ doors
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: door_id
 *         schema:
 *           type: integer
 *         description: Filter by door ID
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
 *         description: List of project BOQ doors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectBOQDoor'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, door_id, floor, room } = req.query;
  
  try {
    let query = `
      SELECT pbd.*, 
             p.project_name,
             d.door_material, d.door_style, d.door_finish,
             e.element_name,
             i.item_name,
             ic.item_material_type, ic.display_name as choice_name
      FROM project_boq_doors pbd
      LEFT JOIN projects p ON pbd.project_id = p.project_id
      LEFT JOIN doors d ON pbd.door_id = d.door_id
      LEFT JOIN elements e ON pbd.element_id = e.element_id
      LEFT JOIN items i ON pbd.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbd.item_choice_id = ic.choice_option_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pbd.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (door_id) {
      paramCount++;
      query += ` AND pbd.door_id = $${paramCount}`;
      params.push(door_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND pbd.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND pbd.room = $${paramCount}`;
      params.push(room);
    }
    
    query += ' ORDER BY pbd.project_id, pbd.floor, pbd.room, pbd.door_number';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/{id}:
 *   get:
 *     tags: [ProjectBOQDoors]
 *     description: Retrieve a specific project BOQ door by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project BOQ door
 *     responses:
 *       200:
 *         description: Project BOQ door details
 *       404:
 *         description: Project BOQ door not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pbd.*, 
             p.project_name,
             d.door_material, d.door_style, d.door_finish,
             e.element_name,
             i.item_name,
             ic.item_material_type, ic.display_name as choice_name
      FROM project_boq_doors pbd
      LEFT JOIN projects p ON pbd.project_id = p.project_id
      LEFT JOIN doors d ON pbd.door_id = d.door_id
      LEFT JOIN elements e ON pbd.element_id = e.element_id
      LEFT JOIN items i ON pbd.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbd.item_choice_id = ic.choice_option_id
      WHERE pbd.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ door not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors:
 *   post:
 *     tags: [ProjectBOQDoors]
 *     description: Create a new project BOQ door entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - door_id
 *               - element_id
 *               - item_id
 *               - item_choice_id
 *               - quantity
 *               - unit_price
 *             properties:
 *               project_id:
 *                 type: integer
 *               door_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               door_number:
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
 *         description: Project BOQ door created successfully
 *       400:
 *         description: Invalid input or reference error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, door_id, element_id, floor, room, 
    door_number, item_id, item_choice_id, quantity, unit_price 
  } = req.body;
  
  // Validate required fields
  if (!project_id || !door_id || !element_id || !item_id || !item_choice_id || 
      !quantity || unit_price === undefined) {
    return res.status(400).json({ 
      error: 'Required fields: project_id, door_id, element_id, item_id, item_choice_id, quantity, unit_price' 
    });
  }
  
  try {
    // Validate all foreign key references before inserting
    const validationQueries = [
      { query: 'SELECT project_id FROM projects WHERE project_id = $1', param: project_id, name: 'project' },
      { query: 'SELECT door_id FROM doors WHERE door_id = $1', param: door_id, name: 'door' },
      { query: 'SELECT element_id FROM elements WHERE element_id = $1', param: element_id, name: 'element' },
      { query: 'SELECT item_id FROM items WHERE item_id = $1', param: item_id, name: 'item' },
      { query: 'SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', param: item_choice_id, name: 'item_choice' }
    ];
    
    const invalidReferences = [];
    
    for (const validation of validationQueries) {
      const result = await db.query(validation.query, [validation.param]);
      if (result.rows.length === 0) {
        invalidReferences.push(`${validation.name}_id: ${validation.param}`);
      }
    }
    
    if (invalidReferences.length > 0) {
      return res.status(400).json({ 
        error: `Invalid reference(s): ${invalidReferences.join(', ')}` 
      });
    }
    
    // Calculate total price
    const total_price = quantity * unit_price;
    
    // Insert the record
    const result = await db.query(`
      INSERT INTO project_boq_doors (
        project_id, door_id, element_id, floor, room, door_number,
        item_id, item_choice_id, quantity, unit_price, total_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [project_id, door_id, element_id, floor, room, door_number, 
        item_id, item_choice_id, quantity, unit_price, total_price]);
    
    // Fetch the complete record with joins
    const completeRecord = await db.query(`
      SELECT pbd.*, 
             p.project_name,
             d.door_material, d.door_style, d.door_finish,
             e.element_name,
             i.item_name,
             ic.item_material_type, ic.display_name as choice_name
      FROM project_boq_doors pbd
      LEFT JOIN projects p ON pbd.project_id = p.project_id
      LEFT JOIN doors d ON pbd.door_id = d.door_id
      LEFT JOIN elements e ON pbd.element_id = e.element_id
      LEFT JOIN items i ON pbd.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbd.item_choice_id = ic.choice_option_id
      WHERE pbd.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json(completeRecord.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference: Check project_id, door_id, element_id, item_id, or item_choice_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/{id}:
 *   put:
 *     tags: [ProjectBOQDoors]
 *     description: Update a project BOQ door entry
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
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               door_number:
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
 *       200:
 *         description: Project BOQ door updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project BOQ door not found
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // Check if record exists
    const checkResult = await db.query('SELECT * FROM project_boq_doors WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project BOQ door not found' });
    }
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;
    
    // List of allowed update fields
    const allowedFields = ['floor', 'room', 'door_number', 'item_id', 'item_choice_id', 'quantity', 'unit_price'];
    
    // Validate foreign key references if being updated
    if (updates.item_id) {
      const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [updates.item_id]);
      if (itemCheck.rows.length === 0) {
        return res.status(400).json({ error: `Invalid item_id: ${updates.item_id}` });
      }
    }
    
    if (updates.item_choice_id) {
      const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [updates.item_choice_id]);
      if (choiceCheck.rows.length === 0) {
        return res.status(400).json({ error: `Invalid item_choice_id: ${updates.item_choice_id}` });
      }
    }
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Recalculate total_price if quantity or unit_price changed
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const currentRecord = checkResult.rows[0];
      const newQuantity = updates.quantity !== undefined ? updates.quantity : currentRecord.quantity;
      const newUnitPrice = updates.unit_price !== undefined ? updates.unit_price : currentRecord.unit_price;
      const newTotalPrice = newQuantity * newUnitPrice;
      
      updateFields.push(`total_price = $${valueCount}`);
      values.push(newTotalPrice);
      valueCount++;
    }
    
    values.push(id);
    const updateQuery = `
      UPDATE project_boq_doors 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueCount}
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, values);
    
    // Fetch the complete record with joins
    const completeRecord = await db.query(`
      SELECT pbd.*, 
             p.project_name,
             d.door_material, d.door_style, d.door_finish,
             e.element_name,
             i.item_name,
             ic.item_material_type, ic.display_name as choice_name
      FROM project_boq_doors pbd
      LEFT JOIN projects p ON pbd.project_id = p.project_id
      LEFT JOIN doors d ON pbd.door_id = d.door_id
      LEFT JOIN elements e ON pbd.element_id = e.element_id
      LEFT JOIN items i ON pbd.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbd.item_choice_id = ic.choice_option_id
      WHERE pbd.id = $1
    `, [id]);
    
    res.json(completeRecord.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference: Check item_id or item_choice_id' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/{id}:
 *   delete:
 *     tags: [ProjectBOQDoors]
 *     description: Delete a project BOQ door entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project BOQ door deleted successfully
 *       404:
 *         description: Project BOQ door not found
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM project_boq_doors WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project BOQ door not found' });
    }
    
    res.json({ 
      message: 'Project BOQ door deleted successfully',
      deleted_id: result.rows[0].id 
    });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/door/{doorId}:
 *   get:
 *     tags: [ProjectBOQDoors]
 *     description: Get all BOQ entries for a specific door
 *     parameters:
 *       - in: path
 *         name: doorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of BOQ entries for the door
 */
router.get('/door/:doorId', async (req, res) => {
  const db = req.db;
  const { doorId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pbd.*, 
             p.project_name,
             d.door_material, d.door_style, d.door_finish,
             e.element_name,
             i.item_name,
             ic.item_material_type, ic.display_name as choice_name
      FROM project_boq_doors pbd
      LEFT JOIN projects p ON pbd.project_id = p.project_id
      LEFT JOIN doors d ON pbd.door_id = d.door_id
      LEFT JOIN elements e ON pbd.element_id = e.element_id
      LEFT JOIN items i ON pbd.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbd.item_choice_id = ic.choice_option_id
      WHERE pbd.door_id = $1
      ORDER BY pbd.element_id, pbd.item_id
    `, [doorId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/project/{projectId}/summary:
 *   get:
 *     tags: [ProjectBOQDoors]
 *     description: Get summary of project BOQ doors by project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary of project BOQ doors
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbd.floor,
        COUNT(DISTINCT pbd.door_id) as door_count,
        COUNT(DISTINCT pbd.room) as room_count,
        COUNT(*) as item_count,
        SUM(pbd.total_price) as floor_total,
        json_agg(DISTINCT pbd.room) as rooms
      FROM project_boq_doors pbd
      WHERE pbd.project_id = $1
      GROUP BY pbd.floor
      ORDER BY pbd.floor
    `, [projectId]);
    
    const totalResult = await db.query(`
      SELECT 
        COUNT(DISTINCT door_id) as total_doors,
        COUNT(DISTINCT room) as total_rooms,
        COUNT(*) as total_items,
        SUM(total_price) as grand_total
      FROM project_boq_doors
      WHERE project_id = $1
    `, [projectId]);
    
    res.json({
      by_floor: result.rows,
      totals: totalResult.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_doors/project/{projectId}/by-element:
 *   get:
 *     tags: [ProjectBOQDoors]
 *     description: Get project BOQ doors grouped by element
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: BOQ doors grouped by element
 */
router.get('/project/:projectId/by-element', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        e.element_id,
        e.element_name,
        COUNT(DISTINCT pbd.door_id) as door_count,
        COUNT(*) as item_count,
        SUM(pbd.total_price) as element_total
      FROM project_boq_doors pbd
      JOIN elements e ON pbd.element_id = e.element_id
      WHERE pbd.project_id = $1
      GROUP BY e.element_id, e.element_name
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
 * /project_boq_doors/bulk-create:
 *   post:
 *     tags: [ProjectBOQDoors]
 *     description: Create multiple project BOQ door entries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entries
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - project_id
 *                     - door_id
 *                     - element_id
 *                     - item_id
 *                     - item_choice_id
 *                     - quantity
 *                     - unit_price
 *     responses:
 *       201:
 *         description: Project BOQ doors created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/bulk-create', async (req, res) => {
  const db = req.db;
  const { entries } = req.body;
  
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries array is required' });
  }
  
  try {
    await db.query('BEGIN');
    
    const createdRecords = [];
    const errors = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const { 
        project_id, door_id, element_id, floor, room, 
        door_number, item_id, item_choice_id, quantity, unit_price 
      } = entry;
      
      // Validate required fields
      if (!project_id || !door_id || !element_id || !item_id || !item_choice_id || 
          !quantity || unit_price === undefined) {
        errors.push({ 
          index: i, 
          error: 'Missing required fields', 
          entry 
        });
        continue;
      }
      
      try {
        const total_price = quantity * unit_price;
        
        const result = await db.query(`
          INSERT INTO project_boq_doors (
            project_id, door_id, element_id, floor, room, door_number,
            item_id, item_choice_id, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [project_id, door_id, element_id, floor, room, door_number, 
            item_id, item_choice_id, quantity, unit_price, total_price]);
        
        createdRecords.push(result.rows[0]);
      } catch (err) {
        if (err.code === '23503') {
          errors.push({ 
            index: i, 
            error: 'Invalid reference', 
            entry 
          });
        } else {
          errors.push({ 
            index: i, 
            error: err.message, 
            entry 
          });
        }
      }
    }
    
    if (errors.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Some entries failed validation',
        failed_entries: errors,
        message: 'No entries were created due to validation errors'
      });
    }
    
    await db.query('COMMIT');
    
    res.status(201).json({
      message: `${createdRecords.length} project BOQ doors created successfully`,
      created: createdRecords
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Database transaction error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;