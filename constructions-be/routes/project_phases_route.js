const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectPhases
 *   description: API for managing project phases
 */

/**
 * @swagger
 * /project_phases:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Retrieve all project phases
 *     description: Get a list of all project phases with optional filtering
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Successfully retrieved project phases
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;
  
  console.log('📋 Fetching project phases for project:', project_id);
  
  try {
    let query = 'SELECT * FROM project_phases WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }

    query += ' ORDER BY project_id, phase_id, created_at';

    const result = await db.query(query, params);
    
    // Add calculated fields for frontend compatibility
    const transformedData = result.rows.map(phase => {
      // Calculate duration if dates exist
      let duration_days = null;
      if (phase.planned_start_date && phase.planned_end_date) {
        const startDate = new Date(phase.planned_start_date);
        const endDate = new Date(phase.planned_end_date);
        duration_days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...phase,
        duration_days,
        phase_order: phase.phase_id, // Use phase_id as order
        description: phase.phase_name, // Use phase_name as description fallback
        estimated_cost: 0, // Default value - can be added to table later
        progress_percentage: 0, // Default value - can be added to table later
        is_active: true // Default value
      };
    });
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /project_phases/{id}:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Retrieve a specific project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase
 *     responses:
 *       200:
 *         description: Project phase found
 *       404:
 *         description: Project phase not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_phases WHERE phase_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project phase not found' 
      });
    }
    
    const phase = result.rows[0];
    
    // Add calculated fields
    let duration_days = null;
    if (phase.planned_start_date && phase.planned_end_date) {
      const startDate = new Date(phase.planned_start_date);
      const endDate = new Date(phase.planned_end_date);
      duration_days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }
    
    const responseData = {
      ...phase,
      duration_days,
      phase_order: phase.phase_id,
      description: phase.phase_name,
      estimated_cost: 0,
      progress_percentage: 0,
      is_active: true
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /project_phases:
 *   post:
 *     tags: [ProjectPhases]
 *     summary: Create a new project phase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - phase_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               phase_name:
 *                 type: string
 *               phase_code:
 *                 type: string
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project phase created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    phase_name,
    phase_code,
    phase_order,
    description,
    planned_start_date,
    planned_end_date,
    duration_days,
    estimated_cost,
    status,
    progress_percentage,
    is_active,
    created_by
  } = req.body;

  console.log('➕ Creating project phase:', { phase_name, project_id });
  console.log('📊 Frontend data received:', req.body);

  // Validation
  if (!project_id || !phase_name) {
    return res.status(400).json({ 
      success: false,
      error: 'project_id and phase_name are required' 
    });
  }

  try {
    // The project_phases table has these columns:
    // phase_id, project_id, phase_name, phase_code, included_units, 
    // planned_start_date, planned_end_date, status, created_at, created_by
    
    const result = await db.query(
      `INSERT INTO project_phases (
        project_id, phase_name, phase_code, planned_start_date, 
        planned_end_date, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        parseInt(project_id),
        phase_name,
        phase_code || null,
        planned_start_date || null,
        planned_end_date || null,
        status || 'Not Started',
        created_by || null
      ]
    );

    const createdPhase = result.rows[0];
    
    // Calculate duration for response
    let calculatedDuration = null;
    if (createdPhase.planned_start_date && createdPhase.planned_end_date) {
      const startDate = new Date(createdPhase.planned_start_date);
      const endDate = new Date(createdPhase.planned_end_date);
      calculatedDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }
    
    // Transform response to match frontend expectations
    const responseData = {
      ...createdPhase,
      phase_order: createdPhase.phase_id,
      description: description || createdPhase.phase_name,
      duration_days: calculatedDuration,
      estimated_cost: parseFloat(estimated_cost) || 0,
      progress_percentage: parseFloat(progress_percentage) || 0,
      is_active: is_active !== false
    };

    console.log('✅ Project phase created successfully:', createdPhase.phase_id);

    res.status(201).json({
      success: true,
      message: 'Phase created successfully',
      data: responseData
    });
  } catch (err) {
    console.error('Database error:', err.message);
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Phase with this name already exists for this project'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /project_phases/{id}:
 *   put:
 *     tags: [ProjectPhases]
 *     summary: Update a project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Project phase updated successfully
 *       404:
 *         description: Project phase not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    phase_name,
    phase_code,
    phase_order,
    description,
    planned_start_date,
    planned_end_date,
    duration_days,
    estimated_cost,
    status,
    progress_percentage,
    is_active,
    updated_by
  } = req.body;

  console.log(`📝 Updating project phase ${id}:`, { phase_name, status });

  // Validation
  if (!project_id || !phase_name) {
    return res.status(400).json({ 
      success: false,
      error: 'project_id and phase_name are required' 
    });
  }

  try {
    const result = await db.query(
      `UPDATE project_phases SET
        project_id = $1, phase_name = $2, phase_code = $3,
        planned_start_date = $4, planned_end_date = $5, status = $6
      WHERE phase_id = $7
      RETURNING *`,
      [
        parseInt(project_id),
        phase_name,
        phase_code || null,
        planned_start_date || null,
        planned_end_date || null,
        status || 'Not Started',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project phase not found' 
      });
    }

    const updatedPhase = result.rows[0];
    
    // Calculate duration for response
    let calculatedDuration = null;
    if (updatedPhase.planned_start_date && updatedPhase.planned_end_date) {
      const startDate = new Date(updatedPhase.planned_start_date);
      const endDate = new Date(updatedPhase.planned_end_date);
      calculatedDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }
    
    // Transform response to match frontend expectations
    const responseData = {
      ...updatedPhase,
      phase_order: updatedPhase.phase_id,
      description: description || updatedPhase.phase_name,
      duration_days: calculatedDuration,
      estimated_cost: parseFloat(estimated_cost) || 0,
      progress_percentage: parseFloat(progress_percentage) || 0,
      is_active: is_active !== false
    };

    console.log('✅ Project phase updated successfully:', id);

    res.json({
      success: true,
      message: 'Phase updated successfully',
      data: responseData
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /project_phases/{id}:
 *   delete:
 *     tags: [ProjectPhases]
 *     summary: Delete a project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase to delete
 *     responses:
 *       200:
 *         description: Project phase deleted successfully
 *       404:
 *         description: Project phase not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM project_phases WHERE phase_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project phase not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Project phase deleted successfully' 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /project_phases/project/{project_id}:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Get all phases for a project
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Successfully retrieved project phases
 *       500:
 *         description: Internal server error
 */
router.get('/project/:project_id', async (req, res) => {
  const db = req.db;
  const { project_id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_phases WHERE project_id = $1 ORDER BY phase_id, created_at',
      [project_id]
    );
    
    // Add calculated fields for each phase
    const transformedData = result.rows.map(phase => {
      let duration_days = null;
      if (phase.planned_start_date && phase.planned_end_date) {
        const startDate = new Date(phase.planned_start_date);
        const endDate = new Date(phase.planned_end_date);
        duration_days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...phase,
        duration_days,
        phase_order: phase.phase_id,
        description: phase.phase_name,
        estimated_cost: 0,
        progress_percentage: 0,
        is_active: true
      };
    });
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
