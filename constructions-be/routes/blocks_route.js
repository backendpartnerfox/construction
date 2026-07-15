const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blocks
 *   description: API for managing project blocks
 */

/**
 * @swagger
 * /blocks:
 *   get:
 *     tags: [Blocks]
 *     description: Retrieve all blocks
 *     responses:
 *       200:
 *         description: List of blocks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   block_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   block_code:
 *                     type: string
 *                   block_name:
 *                     type: string
 *                   block_type:
 *                     type: string
 *                   phase_id:
 *                     type: integer
 *                   unit_ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   total_units_count:
 *                     type: integer
 *                   requires_client_selection:
 *                     type: boolean
 *                   selection_completed:
 *                     type: boolean
 *                   estimated_cost:
 *                     type: number
 *                   approved_cost:
 *                     type: number
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        b.*,
        p.project_name,
        ph.phase_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM blocks b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN phases ph ON b.phase_id = ph.phase_id
      LEFT JOIN employees e ON b.created_by = e.employee_id
      ORDER BY b.project_id, b.block_id
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /blocks/{id}:
 *   get:
 *     tags: [Blocks]
 *     description: Retrieve a specific block by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the block to retrieve
 *     responses:
 *       200:
 *         description: Block details
 *       404:
 *         description: Block not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        b.*,
        p.project_name,
        ph.phase_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM blocks b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN phases ph ON b.phase_id = ph.phase_id
      LEFT JOIN employees e ON b.created_by = e.employee_id
      WHERE b.block_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /blocks/project/{projectId}:
 *   get:
 *     tags: [Blocks]
 *     description: Retrieve all blocks for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of blocks for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  console.log('📋 Fetching blocks for project:', projectId);
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    const result = await db.query(`
      SELECT b.*, ph.phase_name 
      FROM blocks b
      LEFT JOIN phases ph ON b.phase_id = ph.phase_id
      WHERE b.project_id = $1 
      ORDER BY b.block_id
    `, [projectId]);
    
    // Transform data to match frontend expectations
    const transformedData = result.rows.map(block => {
      // Calculate fields that frontend expects
      const totalUnits = block.total_units_count || 0;
      const estimatedFloorsFromUnits = totalUnits > 0 ? Math.ceil(totalUnits / 4) : 0; // Assume 4 units per floor average
      const unitsPerFloor = estimatedFloorsFromUnits > 0 ? Math.ceil(totalUnits / estimatedFloorsFromUnits) : 0;
      
      return {
        ...block,
        // Map backend fields to frontend field names
        total_units: block.total_units_count,
        construction_start_date: block.planned_start_date,
        construction_end_date: block.planned_end_date,
        
        // Add missing fields with calculated/default values
        description: block.block_type || '',
        total_floors: estimatedFloorsFromUnits,
        units_per_floor: unitsPerFloor,
        progress_percentage: 0, // Default - can be enhanced later
        is_active: true // Default - can be enhanced later
      };
    });
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /blocks/phase/{phaseId}:
 *   get:
 *     tags: [Blocks]
 *     description: Retrieve all blocks for a specific phase
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase
 *     responses:
 *       200:
 *         description: List of blocks for the phase
 *       500:
 *         description: Internal server error
 */
router.get('/phase/:phaseId', async (req, res) => {
  const db = req.db;
  const { phaseId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT b.*, p.project_name 
      FROM blocks b
      LEFT JOIN projects p ON b.project_id = p.project_id
      WHERE b.phase_id = $1 
      ORDER BY b.block_id
    `, [phaseId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /blocks:
 *   post:
 *     summary: Create a new block
 *     tags: [Blocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - block_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               block_code:
 *                 type: string
 *               block_name:
 *                 type: string
 *               block_type:
 *                 type: string
 *               phase_id:
 *                 type: integer
 *               unit_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               total_units_count:
 *                 type: integer
 *               requires_client_selection:
 *                 type: boolean
 *               selection_completed:
 *                 type: boolean
 *               estimated_cost:
 *                 type: number
 *               approved_cost:
 *                 type: number
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Block created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id,
    block_name,
    block_code,
    description,          // Frontend sends this
    total_floors,         // Frontend sends this
    units_per_floor,      // Frontend sends this
    total_units,          // Frontend sends this
    construction_start_date, // Frontend sends this
    construction_end_date,   // Frontend sends this
    status,
    progress_percentage,  // Frontend sends this
    is_active,           // Frontend sends this
    created_by
  } = req.body;

  console.log('➕ Creating block:', { block_name, project_id });
  console.log('📊 Frontend data received:', req.body);

  // Validate required fields
  if (!project_id || !block_name) {
    return res.status(400).json({ 
      success: false,
      error: "Required fields: project_id, block_name" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Map frontend fields to backend database fields
    const result = await db.query(
      `INSERT INTO blocks (
        project_id, block_code, block_name, block_type,
        total_units_count, planned_start_date, planned_end_date,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        parseInt(project_id),
        block_code || null,
        block_name,
        description || 'Standard Block',     // Maps to block_type
        parseInt(total_units) || 0,          // Maps to total_units_count
        construction_start_date || null,     // Maps to planned_start_date
        construction_end_date || null,       // Maps to planned_end_date
        status || 'Draft',
        created_by || null
      ]
    );

    const createdBlock = result.rows[0];
    
    // Transform response to match frontend expectations
    const responseData = {
      ...createdBlock,
      // Map backend fields to frontend field names
      total_units: createdBlock.total_units_count,
      construction_start_date: createdBlock.planned_start_date,
      construction_end_date: createdBlock.planned_end_date,
      
      // Add frontend expected fields
      description: description || createdBlock.block_type || '',
      total_floors: parseInt(total_floors) || 0,
      units_per_floor: parseInt(units_per_floor) || 0,
      progress_percentage: parseInt(progress_percentage) || 0,
      is_active: is_active !== false
    };

    console.log('✅ Block created successfully:', createdBlock.block_id);

    res.status(201).json({
      success: true,
      message: 'Block created successfully',
      data: responseData
    });
  } catch (err) {
    console.error('Database error:', err.message);
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Block with this name already exists for this project'
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
 * /blocks/{id}:
 *   put:
 *     summary: Update an existing block
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the block to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               block_code:
 *                 type: string
 *               block_name:
 *                 type: string
 *               block_type:
 *                 type: string
 *               phase_id:
 *                 type: integer
 *               unit_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               total_units_count:
 *                 type: integer
 *               requires_client_selection:
 *                 type: boolean
 *               selection_completed:
 *                 type: boolean
 *               estimated_cost:
 *                 type: number
 *               approved_cost:
 *                 type: number
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Block updated successfully
 *       404:
 *         description: Block not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    block_name,
    block_code,
    description,
    total_floors,
    units_per_floor,
    total_units,
    construction_start_date,
    construction_end_date,
    status,
    progress_percentage,
    is_active
  } = req.body;

  console.log(`📝 Updating block ${id}:`, { block_name, status });

  // Validate required fields
  if (!block_name) {
    return res.status(400).json({ 
      success: false,
      error: "Block name is required" 
    });
  }

  try {
    // Map frontend fields to backend database fields
    const result = await db.query(
      `UPDATE blocks 
       SET block_code = $1, block_name = $2, block_type = $3,
           total_units_count = $4, planned_start_date = $5, planned_end_date = $6,
           status = $7
       WHERE block_id = $8
       RETURNING *`,
      [
        block_code || null,
        block_name,
        description || 'Standard Block',     // Maps to block_type
        parseInt(total_units) || 0,          // Maps to total_units_count
        construction_start_date || null,     // Maps to planned_start_date
        construction_end_date || null,       // Maps to planned_end_date
        status || 'Draft',
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Block not found" 
      });
    }

    const updatedBlock = result.rows[0];
    
    // Transform response to match frontend expectations
    const responseData = {
      ...updatedBlock,
      // Map backend fields to frontend field names
      total_units: updatedBlock.total_units_count,
      construction_start_date: updatedBlock.planned_start_date,
      construction_end_date: updatedBlock.planned_end_date,
      
      // Add frontend expected fields
      description: description || updatedBlock.block_type || '',
      total_floors: parseInt(total_floors) || 0,
      units_per_floor: parseInt(units_per_floor) || 0,
      progress_percentage: parseInt(progress_percentage) || 0,
      is_active: is_active !== false
    };

    console.log('✅ Block updated successfully:', id);

    res.json({
      success: true,
      message: 'Block updated successfully',
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
 * /blocks/{id}:
 *   delete:
 *     summary: Delete a block
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the block to delete
 *     responses:
 *       200:
 *         description: Block deleted successfully
 *       400:
 *         description: Cannot delete block with associated units
 *       404:
 *         description: Block not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if block has associated units
    const blockCheck = await db.query(
      'SELECT unit_ids FROM blocks WHERE block_id = $1',
      [id]
    );
    
    if (blockCheck.rows.length > 0 && blockCheck.rows[0].unit_ids && blockCheck.rows[0].unit_ids.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete block because it has associated units." 
      });
    }
    
    const result = await db.query('DELETE FROM blocks WHERE block_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Block not found" });
    }
    
    res.json({ message: "Block deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /blocks/status/{projectId}/{status}:
 *   get:
 *     tags: [Blocks]
 *     description: Get all blocks with a specific status for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter by
 *     responses:
 *       200:
 *         description: List of blocks with the specified status
 *       500:
 *         description: Internal server error
 */
router.get('/status/:projectId/:status', async (req, res) => {
  const db = req.db;
  const { projectId, status } = req.params;
  
  try {
    const result = await db.query(`
      SELECT b.*, ph.phase_name 
      FROM blocks b
      LEFT JOIN phases ph ON b.phase_id = ph.phase_id
      WHERE b.project_id = $1 AND b.status = $2
      ORDER BY b.block_id
    `, [projectId, status]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /blocks/selection-status/{requiresSelection}:
 *   get:
 *     tags: [Blocks]
 *     description: Get all blocks based on client selection requirement
 *     parameters:
 *       - in: path
 *         name: requiresSelection
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Filter by requires_client_selection
 *     responses:
 *       200:
 *         description: List of blocks filtered by selection requirement
 *       500:
 *         description: Internal server error
 */
router.get('/selection-status/:requiresSelection', async (req, res) => {
  const db = req.db;
  const { requiresSelection } = req.params;
  
  try {
    const result = await db.query(`
      SELECT b.*, p.project_name, ph.phase_name 
      FROM blocks b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN phases ph ON b.phase_id = ph.phase_id
      WHERE b.requires_client_selection = $1
      ORDER BY b.project_id, b.block_id
    `, [requiresSelection === 'true']);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;