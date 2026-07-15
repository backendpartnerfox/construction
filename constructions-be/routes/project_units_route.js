const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Units
 *   description: API for managing property units (apartments/flats)
 */

/**
 * Get all units for a project
 * GET /api/project_units?project_id=:projectId
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;

  console.log('📦 Fetching units for project:', project_id);

  try {
    // Map backend work status to frontend property status
    const reverseStatusMapping = {
      'Planned': 'Available',
      'Designed': 'Available',
      'Approved': 'Booked',
      'Ready': 'Reserved',
      'In_Progress': 'Booked',
      'Completed': 'Sold',
      'On_Hold': 'Blocked'
    };

    let query = `
      SELECT 
        u.unit_id,
        u.project_id,
        u.unit_code as unit_number,
        u.unit_name,
        u.unit_description,
        u.status as db_status,
        COALESCE(u.created_at, CURRENT_TIMESTAMP) as created_at,
        -- Try to find which block contains this unit
        b.block_id,
        b.block_name
      FROM units u
      LEFT JOIN blocks b ON b.project_id = u.project_id 
        AND (b.unit_ids IS NULL OR u.unit_id = ANY(b.unit_ids))
      WHERE u.project_id = $1
    `;

    const params = [project_id];
    const result = await db.query(query, params);

    // Transform the data to match frontend expectations
    const units = result.rows.map(unit => {
      const description = unit.unit_description || '';
      
      // Extract info from description (format: "Flat - 3BHK, Floor 1")
      const typeMatch = description.match(/^([^-]+)/);
      const bedroomsMatch = description.match(/(\d+)BHK/);
      const floorMatch = description.match(/Floor (\d+)/);
      
      return {
        unit_id: unit.unit_id,
        project_id: unit.project_id,
        unit_number: unit.unit_number,
        unit_name: unit.unit_name,
        unit_type: typeMatch ? typeMatch[1].trim() : 'Flat',
        floor_number: floorMatch ? parseInt(floorMatch[1]) : 1,
        carpet_area: 1000, // Default values
        built_up_area: 1200,
        bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : 3,
        bathrooms: 2,
        facing: 'North',
        base_price: 5000000,
        status: reverseStatusMapping[unit.db_status] || 'Available',
        is_active: true,
        created_at: unit.created_at,
        // Block information
        block_id: unit.block_id,
        block_name: unit.block_name
      };
    });

    res.json({
      success: true,
      data: units,
      count: units.length
    });

  } catch (err) {
    console.error('❌ Error fetching units:', err.message);
    // Return empty array if table doesn't exist
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

/**
 * Get a single unit
 * GET /api/project_units/:unitId
 */
router.get('/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        unit_id,
        project_id,
        unit_code as unit_number,
        unit_name,
        'Flat' as unit_type,
        1 as floor_number,
        1000 as carpet_area,
        1200 as built_up_area,
        3 as bedrooms,
        2 as bathrooms,
        'North' as facing,
        5000000 as base_price,
        status
      FROM units 
      WHERE unit_id = $1
    `, [unitId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching unit:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unit'
    });
  }
});

/**
 * Create a new unit
 * POST /api/project_units
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    unit_number,
    unit_name,
    unit_type,
    block_id,
    floor_number,
    carpet_area,
    built_up_area,
    bedrooms,
    bathrooms,
    facing,
    base_price,
    status,
    is_active
  } = req.body;

  console.log('➕ Creating new unit:', unit_number);
  console.log('📊 Received data:', req.body);

  try {
    // Validate required fields
    if (!project_id || !unit_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, unit_number'
      });
    }

    // Get a default component_id for this project
    let component_id = 1; // Default fallback
    try {
      const componentResult = await db.query(
        'SELECT component_id FROM project_components WHERE project_id = $1 LIMIT 1',
        [parseInt(project_id)]
      );
      if (componentResult.rows.length > 0) {
        component_id = componentResult.rows[0].component_id;
      } else {
        // Create a default component if none exists
        const newComponentResult = await db.query(
          'INSERT INTO project_components (project_id, component_name, category_id, status, is_active) VALUES ($1, $2, 1, $3, true) RETURNING component_id',
          [parseInt(project_id), 'Default Unit Component', 'Active']
        );
        component_id = newComponentResult.rows[0].component_id;
      }
    } catch (compErr) {
      console.log('Using default component_id:', component_id);
    }

    // Map frontend property status to backend work status
    const statusMapping = {
      'Available': 'Planned',
      'Booked': 'Approved', 
      'Sold': 'Completed',
      'Reserved': 'Ready',
      'Blocked': 'On_Hold'
    };
    const mappedStatus = statusMapping[status] || 'Planned';

    console.log(`📋 Status mapping: ${status} → ${mappedStatus}`);

    // Map the frontend data to the existing units table structure
    const result = await db.query(`
      INSERT INTO units (
        project_id, component_id, uid, unit_code, unit_name, unit_description,
        quantity, unit_measure, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING unit_id, unit_code as unit_number, unit_name, status
    `, [
      parseInt(project_id),
      component_id,
      `UNIT-${unit_number}-${Date.now()}`, // Generate unique UID
      unit_number, // Use unit_number as unit_code
      unit_name || unit_number,
      `${unit_type || 'Flat'} - ${bedrooms || 3}BHK, Floor ${floor_number || 1}`,
      1, // Default quantity
      'Unit', // Default unit measure
      mappedStatus // Use mapped status
    ]);

    console.log('✅ Unit created successfully:', result.rows[0].unit_id);

    // Return the data in the format frontend expects
    const responseData = {
      ...result.rows[0],
      unit_type: unit_type || 'Flat',
      floor_number: floor_number || 1,
      bedrooms: bedrooms || 3,
      bathrooms: bathrooms || 2,
      status: status || 'Available', // Return original frontend status
      block_id: block_id ? parseInt(block_id) : null
    };

    // If block_id is provided, update the block to include this unit
    if (block_id) {
      try {
        await db.query(`
          UPDATE blocks 
          SET unit_ids = COALESCE(unit_ids, '{}') || ARRAY[$1]
          WHERE block_id = $2 AND project_id = $3
        `, [result.rows[0].unit_id, parseInt(block_id), parseInt(project_id)]);
        console.log(`🏢 Unit ${result.rows[0].unit_id} assigned to block ${block_id}`);
      } catch (blockErr) {
        console.log('Block assignment error (non-critical):', blockErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: responseData
    });

  } catch (err) {
    console.error('❌ Error creating unit:', err.message);
    console.error('❌ Error details:', err);
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Unit number already exists for this project'
      });
    }
    
    if (err.code === '23502') { // Not null violation
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ' + err.column
      });
    }

    if (err.code === '23514') { // Check constraint violation
      return res.status(400).json({
        success: false,
        error: 'Invalid status value. Please use: Available, Booked, Sold, Reserved, or Blocked'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create unit',
      details: err.message
    });
  }
});

/**
 * Update a unit
 * PUT /api/project_units/:unitId
 */
router.put('/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;
  const {
    unit_number,
    unit_name,
    unit_type,
    block_id,
    floor_number,
    carpet_area,
    built_up_area,
    bedrooms,
    bathrooms,
    facing,
    base_price,
    status,
    is_active
  } = req.body;

  console.log(`📝 Updating unit ${unitId} with status:`, status);

  try {
    // Map frontend property status to backend work status
    const statusMapping = {
      'Available': 'Planned',
      'Booked': 'Approved', 
      'Sold': 'Completed',
      'Reserved': 'Ready',
      'Blocked': 'On_Hold'
    };
    const mappedStatus = statusMapping[status] || 'Planned';

    console.log(`📋 Update status mapping: ${status} → ${mappedStatus}`);

    const result = await db.query(`
      UPDATE units SET
        unit_code = $1,
        unit_name = $2,
        unit_description = $3,
        status = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE unit_id = $5
      RETURNING unit_id, unit_code as unit_number, unit_name, status
    `, [
      unit_number,
      unit_name || unit_number,
      `${unit_type || 'Flat'} - ${bedrooms || 3}BHK, Floor ${floor_number || 1}`,
      mappedStatus, // Use mapped status
      unitId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    // Return the data in the format frontend expects
    const responseData = {
      ...result.rows[0],
      unit_type: unit_type || 'Flat',
      floor_number: floor_number || 1,
      bedrooms: bedrooms || 3,
      bathrooms: bathrooms || 2,
      status: status || 'Available' // Return original frontend status
    };

    console.log('✅ Unit updated successfully:', unitId);

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: responseData
    });

  } catch (err) {
    console.error('Error updating unit:', err.message);
    
    if (err.code === '23514') { // Check constraint violation
      return res.status(400).json({
        success: false,
        error: 'Invalid status value. Please use: Available, Booked, Sold, Reserved, or Blocked'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update unit',
      details: err.message
    });
  }
});

/**
 * Delete a unit
 * DELETE /api/project_units/:unitId
 */
router.delete('/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM units WHERE unit_id = $1 RETURNING unit_id',
      [unitId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    res.json({
      success: true,
      message: 'Unit deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting unit:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete unit'
    });
  }
});

module.exports = router;
