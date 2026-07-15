const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wall Openings Summary
 *   description: API for managing wall openings summary (doors, windows, etc.)
 */

/**
 * @swagger
 * /wall_openings_summary:
 *   get:
 *     tags: [Wall Openings Summary]
 *     description: Retrieve all wall openings summaries with details
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
 *       - in: query
 *         name: opening_type
 *         schema:
 *           type: string
 *           enum: [Door, Window, Ventilator, Other]
 *         description: Filter by opening type
 *     responses:
 *       200:
 *         description: List of wall openings summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, opening_type } = req.query;
  
  try {
    let query = `
      SELECT 
        wos.*,
        p.project_name,
        p.project_code,
        awm.wall_direction,
        awm.wall_thickness,
        emp.first_name || ' ' || emp.last_name AS created_by_name
      FROM wall_openings_summary wos
      LEFT JOIN projects p ON wos.project_id = p.project_id
      LEFT JOIN architect_walls_measurement awm ON wos.wall_measurement_id = awm.measurement_id
      LEFT JOIN employees emp ON wos.created_by = emp.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND wos.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND wos.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND wos.room = $${paramCount}`;
      params.push(room);
    }
    
    if (opening_type) {
      paramCount++;
      query += ` AND wos.opening_type = $${paramCount}`;
      params.push(opening_type);
    }
    
    query += ' ORDER BY wos.project_id, wos.floor, wos.room, wos.wall_location';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary/{id}:
 *   get:
 *     tags: [Wall Openings Summary]
 *     description: Retrieve a specific wall opening summary by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the wall opening summary to retrieve
 *     responses:
 *       200:
 *         description: Wall opening summary details
 *       404:
 *         description: Wall opening summary not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        wos.*,
        p.project_name,
        p.project_code,
        awm.wall_direction,
        awm.wall_thickness,
        awm.total_wall_width,
        awm.height as wall_height,
        emp.first_name || ' ' || emp.last_name AS created_by_name
      FROM wall_openings_summary wos
      LEFT JOIN projects p ON wos.project_id = p.project_id
      LEFT JOIN architect_walls_measurement awm ON wos.wall_measurement_id = awm.measurement_id
      LEFT JOIN employees emp ON wos.created_by = emp.employee_id
      WHERE wos.opening_summary_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wall opening summary not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary:
 *   post:
 *     summary: Create a new wall opening summary
 *     tags: [Wall Openings Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - wall_measurement_id
 *               - floor
 *               - room
 *               - wall_location
 *               - opening_type
 *               - total_openings_count
 *               - total_openings_area
 *             properties:
 *               project_id:
 *                 type: integer
 *               wall_measurement_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               wall_location:
 *                 type: string
 *               opening_type:
 *                 type: string
 *                 enum: [Door, Window, Ventilator, Other]
 *               total_openings_count:
 *                 type: integer
 *               total_openings_area:
 *                 type: number
 *               door_count:
 *                 type: integer
 *               door_area:
 *                 type: number
 *               window_count:
 *                 type: integer
 *               window_area:
 *                 type: number
 *               ventilator_count:
 *                 type: integer
 *               ventilator_area:
 *                 type: number
 *               other_openings_count:
 *                 type: integer
 *               other_openings_area:
 *                 type: number
 *               opening_details:
 *                 type: object
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Wall opening summary created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    wall_measurement_id,
    floor,
    room,
    wall_location,
    opening_type,
    total_openings_count,
    total_openings_area,
    door_count,
    door_area,
    window_count,
    window_area,
    ventilator_count,
    ventilator_area,
    other_openings_count,
    other_openings_area,
    opening_details,
    notes,
    created_by
  } = req.body;

  if (!project_id || !wall_measurement_id || !floor || !room || !wall_location || 
      !opening_type || total_openings_count === undefined || total_openings_area === undefined) {
    return res.status(400).json({ 
      error: "project_id, wall_measurement_id, floor, room, wall_location, opening_type, total_openings_count, and total_openings_area are required" 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO wall_openings_summary (
        project_id, wall_measurement_id, floor, room, wall_location,
        opening_type, total_openings_count, total_openings_area,
        door_count, door_area, window_count, window_area,
        ventilator_count, ventilator_area, other_openings_count,
        other_openings_area, opening_details, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        project_id, wall_measurement_id, floor, room, wall_location,
        opening_type, total_openings_count, total_openings_area,
        door_count || 0, door_area || 0, window_count || 0, window_area || 0,
        ventilator_count || 0, ventilator_area || 0, other_openings_count || 0,
        other_openings_area || 0, opening_details, notes, created_by
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
 * /wall_openings_summary/{id}:
 *   put:
 *     summary: Update a wall opening summary
 *     tags: [Wall Openings Summary]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the wall opening summary to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total_openings_count:
 *                 type: integer
 *               total_openings_area:
 *                 type: number
 *               door_count:
 *                 type: integer
 *               door_area:
 *                 type: number
 *               window_count:
 *                 type: integer
 *               window_area:
 *                 type: number
 *               ventilator_count:
 *                 type: integer
 *               ventilator_area:
 *                 type: number
 *               other_openings_count:
 *                 type: integer
 *               other_openings_area:
 *                 type: number
 *               opening_details:
 *                 type: object
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Wall opening summary updated successfully
 *       404:
 *         description: Wall opening summary not found
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
          key !== 'wall_measurement_id' && 
          key !== 'floor' &&
          key !== 'room' &&
          key !== 'wall_location') {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE wall_openings_summary 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE opening_summary_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Wall opening summary not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary/{id}:
 *   delete:
 *     summary: Delete a wall opening summary
 *     tags: [Wall Openings Summary]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the wall opening summary to delete
 *     responses:
 *       200:
 *         description: Wall opening summary deleted successfully
 *       404:
 *         description: Wall opening summary not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM wall_openings_summary WHERE opening_summary_id = $1 RETURNING opening_summary_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Wall opening summary not found" });
    }

    res.json({ message: "Wall opening summary deleted successfully", deleted_id: result.rows[0].opening_summary_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary/project/{projectId}/summary:
 *   get:
 *     summary: Get wall openings summary for entire project
 *     tags: [Wall Openings Summary]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project-wide wall openings summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        wos.floor,
        COUNT(DISTINCT wos.room) as room_count,
        SUM(wos.total_openings_count) as total_openings,
        SUM(wos.total_openings_area) as total_area,
        SUM(wos.door_count) as total_doors,
        SUM(wos.door_area) as total_door_area,
        SUM(wos.window_count) as total_windows,
        SUM(wos.window_area) as total_window_area,
        SUM(wos.ventilator_count) as total_ventilators,
        SUM(wos.ventilator_area) as total_ventilator_area,
        SUM(wos.other_openings_count) as total_other_openings,
        SUM(wos.other_openings_area) as total_other_area
      FROM wall_openings_summary wos
      WHERE wos.project_id = $1
      GROUP BY wos.floor
      ORDER BY wos.floor
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get wall openings summary for a specific floor
 *     tags: [Wall Openings Summary]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: floor
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor name
 *     responses:
 *       200:
 *         description: Floor-wise wall openings summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        wos.*,
        awm.wall_direction,
        awm.wall_thickness,
        awm.total_wall_width,
        awm.height as wall_height,
        awm.actual_wall_width
      FROM wall_openings_summary wos
      LEFT JOIN architect_walls_measurement awm ON wos.wall_measurement_id = awm.measurement_id
      WHERE wos.project_id = $1 AND wos.floor = $2
      ORDER BY wos.room, wos.wall_location
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /wall_openings_summary/wall-measurement/{wallMeasurementId}:
 *   get:
 *     summary: Get wall openings summary for a specific wall measurement
 *     tags: [Wall Openings Summary]
 *     parameters:
 *       - in: path
 *         name: wallMeasurementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wall measurement ID
 *     responses:
 *       200:
 *         description: Wall openings for the measurement
 *       500:
 *         description: Internal server error
 */
router.get('/wall-measurement/:wallMeasurementId', async (req, res) => {
  const db = req.db;
  const { wallMeasurementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        wos.*,
        awm.wall_direction,
        awm.wall_thickness,
        awm.total_wall_width,
        awm.height as wall_height
      FROM wall_openings_summary wos
      LEFT JOIN architect_walls_measurement awm ON wos.wall_measurement_id = awm.measurement_id
      WHERE wos.wall_measurement_id = $1
    `, [wallMeasurementId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;