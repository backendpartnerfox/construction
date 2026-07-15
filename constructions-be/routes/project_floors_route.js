const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Floors
 *   description: API for managing project floors and floor-wise details
 */

/**
 * @swagger
 * /project_floors:
 *   get:
 *     tags: [Project Floors]
 *     description: Retrieve all project floors with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: floor_type
 *         schema:
 *           type: string
 *         description: Filter by floor type
 *       - in: query
 *         name: is_typical
 *         schema:
 *           type: boolean
 *         description: Filter by typical floor status
 *     responses:
 *       200:
 *         description: List of project floors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor_type, is_typical } = req.query;
  
  try {
    let query = `
      SELECT 
        pf.*,
        p.project_name,
        p.project_code,
        p.total_area as project_total_area,
        p.number_of_floors as total_floors
      FROM project_floors pf
      LEFT JOIN projects p ON pf.project_id = p.project_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pf.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor_type) {
      paramCount++;
      query += ` AND pf.floor_type = $${paramCount}`;
      params.push(floor_type);
    }
    
    if (is_typical !== undefined) {
      paramCount++;
      query += ` AND pf.is_typical = $${paramCount}`;
      params.push(is_typical);
    }
    
    query += ' ORDER BY pf.project_id, pf.floor_number';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/{id}:
 *   get:
 *     tags: [Project Floors]
 *     description: Retrieve a specific project floor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project floor to retrieve
 *     responses:
 *       200:
 *         description: Project floor details
 *       404:
 *         description: Project floor not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pf.*,
        p.project_name,
        p.project_code
      FROM project_floors pf
      LEFT JOIN projects p ON pf.project_id = p.project_id
      WHERE pf.floor_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project floor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors:
 *   post:
 *     summary: Create a new project floor
 *     tags: [Project Floors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - floor_number
 *               - floor_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               floor_number:
 *                 type: integer
 *               floor_name:
 *                 type: string
 *               floor_code:
 *                 type: string
 *               floor_type:
 *                 type: string
 *               is_typical:
 *                 type: boolean
 *               floor_height:
 *                 type: number
 *               floor_area:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project floor created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Floor already exists for this project
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    floor_number,
    floor_name,
    floor_code,
    floor_type,
    is_typical,
    floor_height,
    floor_area
  } = req.body;

  if (!project_id || floor_number === undefined || !floor_name) {
    return res.status(400).json({ error: "project_id, floor_number, and floor_name are required" });
  }

  try {
    // Check if floor already exists for this project
    const existingCheck = await db.query(
      'SELECT floor_id FROM project_floors WHERE project_id = $1 AND floor_number = $2',
      [project_id, floor_number]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Floor already exists for this project",
        existing_id: existingCheck.rows[0].floor_id
      });
    }

    const result = await db.query(
      `INSERT INTO project_floors (
        project_id, floor_number, floor_name, floor_code,
        floor_type, is_typical, floor_height, floor_area
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        project_id, floor_number, floor_name, floor_code,
        floor_type, is_typical || false, floor_height, floor_area
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
 * /project_floors/{id}:
 *   put:
 *     summary: Update a project floor
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project floor to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               floor_name:
 *                 type: string
 *               floor_code:
 *                 type: string
 *               floor_type:
 *                 type: string
 *               is_typical:
 *                 type: boolean
 *               floor_height:
 *                 type: number
 *               floor_area:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project floor updated successfully
 *       404:
 *         description: Project floor not found
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
      'floor_name', 'floor_code', 'floor_type', 
      'is_typical', 'floor_height', 'floor_area'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
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
      UPDATE project_floors 
      SET ${updateFields.join(', ')}
      WHERE floor_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project floor not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/{id}:
 *   delete:
 *     summary: Delete a project floor
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project floor to delete
 *     responses:
 *       200:
 *         description: Project floor deleted successfully
 *       400:
 *         description: Cannot delete floor with associated data
 *       404:
 *         description: Project floor not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if floor has associated components
    const componentCheck = await db.query(
      'SELECT COUNT(*) FROM project_components WHERE floor_id = $1',
      [id]
    );

    if (parseInt(componentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete floor because it has associated components" 
      });
    }

    const result = await db.query(
      'DELETE FROM project_floors WHERE floor_id = $1 RETURNING floor_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project floor not found" });
    }

    res.json({ message: "Project floor deleted successfully", deleted_id: result.rows[0].floor_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/project/{projectId}:
 *   get:
 *     summary: Get all floors for a specific project
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of floors for the project
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pf.*,
        (
          SELECT COUNT(*)
          FROM project_components pc
          WHERE pc.project_id = pf.project_id 
            AND pc.floor_id = pf.floor_id 
            AND pc.is_active = true
        ) as component_count
      FROM project_floors pf
      WHERE pf.project_id = $1
      ORDER BY pf.floor_number
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/project/{projectId}/summary:
 *   get:
 *     summary: Get floor summary for a project
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Floor summary with areas and counts
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_floors,
        COUNT(CASE WHEN is_typical = true THEN 1 END) as typical_floors,
        SUM(floor_area) as total_floor_area,
        MIN(floor_number) as lowest_floor,
        MAX(floor_number) as highest_floor,
        AVG(floor_height) as average_floor_height,
        array_agg(DISTINCT floor_type) as floor_types,
        array_agg(floor_name ORDER BY floor_number) as floor_names
      FROM project_floors
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/bulk-create:
 *   post:
 *     summary: Create multiple project floors at once
 *     tags: [Project Floors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - floors
 *             properties:
 *               project_id:
 *                 type: integer
 *               floors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - floor_number
 *                     - floor_name
 *                   properties:
 *                     floor_number:
 *                       type: integer
 *                     floor_name:
 *                       type: string
 *                     floor_code:
 *                       type: string
 *                     floor_type:
 *                       type: string
 *                     is_typical:
 *                       type: boolean
 *                     floor_height:
 *                       type: number
 *                     floor_area:
 *                       type: number
 *     responses:
 *       201:
 *         description: Floors created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-create', async (req, res) => {
  const db = req.db;
  const { project_id, floors } = req.body;

  if (!project_id || !floors || !Array.isArray(floors) || floors.length === 0) {
    return res.status(400).json({ error: "project_id and floors array are required" });
  }

  try {
    const results = [];
    const errors = [];

    for (const floor of floors) {
      if (floor.floor_number === undefined || !floor.floor_name) {
        errors.push({ 
          floor, 
          error: "floor_number and floor_name are required" 
        });
        continue;
      }

      try {
        // Check if floor already exists
        const existingCheck = await db.query(
          'SELECT floor_id FROM project_floors WHERE project_id = $1 AND floor_number = $2',
          [project_id, floor.floor_number]
        );

        if (existingCheck.rows.length > 0) {
          errors.push({ 
            floor, 
            error: "Floor number already exists",
            existing_id: existingCheck.rows[0].floor_id
          });
          continue;
        }

        const result = await db.query(
          `INSERT INTO project_floors (
            project_id, floor_number, floor_name, floor_code,
            floor_type, is_typical, floor_height, floor_area
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            project_id, floor.floor_number, floor.floor_name, floor.floor_code,
            floor.floor_type, floor.is_typical || false, 
            floor.floor_height, floor.floor_area
          ]
        );

        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({ floor, error: err.message });
      }
    }

    res.status(201).json({
      message: `Created ${results.length} floors successfully`,
      created: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/project/{projectId}/typical:
 *   get:
 *     summary: Get typical floors for a project
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of typical floors
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/typical', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT * FROM project_floors
      WHERE project_id = $1 AND is_typical = true
      ORDER BY floor_number
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_floors/floor-type/{floorType}:
 *   get:
 *     summary: Get floors by type across all projects
 *     tags: [Project Floors]
 *     parameters:
 *       - in: path
 *         name: floorType
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor type
 *     responses:
 *       200:
 *         description: List of floors of the specified type
 *       500:
 *         description: Internal server error
 */
router.get('/floor-type/:floorType', async (req, res) => {
  const db = req.db;
  const { floorType } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pf.*,
        p.project_name,
        p.project_code
      FROM project_floors pf
      LEFT JOIN projects p ON pf.project_id = p.project_id
      WHERE pf.floor_type = $1
      ORDER BY pf.project_id, pf.floor_number
    `, [floorType]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;