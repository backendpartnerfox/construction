const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Units Generation
 *   description: Auto-generate units from BOQ data
 */

/**
 * Generate units from BOQ items for a project
 * This creates one unit per unique (floor, element, item) combination
 * across all 8 BOQ tables
 * 
 * POST /api/units_generation/generate/:projectId
 */
router.post('/generate/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { created_by = 1 } = req.body;

  console.log('Starting Units Generation for project:', projectId);

  try {
    await db.query('BEGIN');

    // Get project info
    const projectCheck = await db.query(
      'SELECT project_id, project_name FROM projects WHERE project_id = $1',
      [projectId]
    );
    if (projectCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get default component_id for this project
    const componentResult = await db.query(
      'SELECT component_id FROM project_components WHERE project_id = $1 LIMIT 1',
      [projectId]
    );
    const defaultComponentId = componentResult.rows.length > 0
      ? componentResult.rows[0].component_id
      : null;

    // Get project floors
    const floorsResult = await db.query(
      'SELECT floor_id, floor_name, floor_code, floor_number FROM project_floors WHERE project_id = $1 ORDER BY floor_number',
      [projectId]
    );
    // Build a map: floor_number/floor_id => floor_name/floor_code
    const floorMap = {};
    for (const f of floorsResult.rows) {
      floorMap[f.floor_id] = f;
      floorMap[f.floor_number] = f;
      floorMap[f.floor_name] = f;
    }
    const defaultFloor = floorsResult.rows.length > 0 ? floorsResult.rows[0] : null;

    let totalUnitsGenerated = 0;
    const results = {};
    const errors = [];

    // ================================================================
    // Collect BOQ items from all 8 tables into a unified list
    // Each item: { boq_type, boq_id, element_id, element_name, item_id, 
    //              item_name, floor, quantity, unit, unit_rate, amount,
    //              requires_client_selection }
    // ================================================================
    const boqItems = [];

    // --- 1. STRUCTURAL ---
    try {
      const structRows = await db.query(`
        SELECT s.boq_id, s.element_id, s.item_id, s.quantity, s.unit, 
               s.unit_rate, s.amount, s.component_id,
               e.element_name, e.element_category, i.item_name,
               pc.floor_id
        FROM project_boq_structural s
        LEFT JOIN elements e ON s.element_id = e.element_id
        LEFT JOIN items i ON s.item_id = i.item_id
        LEFT JOIN project_components pc ON s.component_id = pc.component_id
        WHERE s.project_id = $1
        ORDER BY s.boq_id
      `, [projectId]);

      for (const row of structRows.rows) {
        const floorInfo = floorMap[row.floor_id] || defaultFloor;
        boqItems.push({
          boq_type: 'structural',
          boq_id: row.boq_id,
          element_id: row.element_id,
          element_name: row.element_name || 'Structural',
          element_category: row.element_category || 'Foundation',
          item_id: row.item_id,
          item_name: row.item_name || 'Unknown',
          floor: floorInfo ? floorInfo.floor_name : 'Ground Floor',
          floor_code: floorInfo ? floorInfo.floor_code : 'GF',
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit,
          unit_rate: parseFloat(row.unit_rate) || 0,
          amount: parseFloat(row.amount) || 0,
          component_id: row.component_id || defaultComponentId,
          requires_client_selection: false
        });
      }
    } catch (err) {
      errors.push({ type: 'structural', error: err.message });
    }

    // --- 2. WALLS ---
    try {
      const wallRows = await db.query(`
        SELECT w.boq_id, w.item_id, w.wall_type, w.specifications, 
               w.quantity, w.unit, w.unit_rate, w.amount, w.component_id,
               i.item_name
        FROM project_boq_walls w
        LEFT JOIN items i ON w.item_id = i.item_id
        WHERE w.project_id = $1
        ORDER BY w.boq_id
      `, [projectId]);

      // Walls element_id is not stored, get it from elements table
      const wallElementResult = await db.query(
        "SELECT element_id FROM elements WHERE element_name = 'Wall Masonry' LIMIT 1"
      );
      const wallElementId = wallElementResult.rows.length > 0 ? wallElementResult.rows[0].element_id : null;

      for (const row of wallRows.rows) {
        // Parse floor from specifications if available (e.g., "Floor 2, Room 3: ...")
        let floorName = defaultFloor ? defaultFloor.floor_name : 'Ground Floor';
        let floorCode = defaultFloor ? defaultFloor.floor_code : 'GF';
        const floorMatch = (row.specifications || '').match(/Floor\s+(\d+)/i);
        if (floorMatch) {
          floorName = 'Floor ' + floorMatch[1];
          floorCode = 'F' + floorMatch[1];
        }

        boqItems.push({
          boq_type: 'walls',
          boq_id: row.boq_id,
          element_id: wallElementId,
          element_name: 'Wall Masonry',
          element_category: 'Masonry',
          item_id: row.item_id,
          item_name: row.item_name || 'Brick',
          floor: floorName,
          floor_code: floorCode,
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit,
          unit_rate: parseFloat(row.unit_rate) || 0,
          amount: parseFloat(row.amount) || 0,
          component_id: row.component_id || defaultComponentId,
          requires_client_selection: false
        });
      }
    } catch (err) {
      errors.push({ type: 'walls', error: err.message });
    }

    // --- 3. DOORS ---
    try {
      const doorRows = await db.query(`
        SELECT d.id as boq_id, d.element_id, d.item_id, d.floor, d.room,
               d.quantity, d.unit_price, d.total_price,
               e.element_name, i.item_name
        FROM project_boq_doors d
        LEFT JOIN elements e ON d.element_id = e.element_id
        LEFT JOIN items i ON d.item_id = i.item_id
        WHERE d.project_id = $1
        ORDER BY d.id
      `, [projectId]);

      for (const row of doorRows.rows) {
        const floorNum = row.floor || '0';
        const floorName = floorNum === '0' ? 'Ground Floor' : 'Floor ' + floorNum;
        const floorCode = floorNum === '0' ? 'GF' : 'F' + floorNum;

        boqItems.push({
          boq_type: 'doors',
          boq_id: row.boq_id,
          element_id: row.element_id,
          element_name: row.element_name || 'Doors',
          element_category: 'Finishing',
          item_id: row.item_id,
          item_name: row.item_name || 'Door Frame',
          floor: floorName,
          floor_code: floorCode,
          quantity: parseFloat(row.quantity) || 0,
          unit: 'Nos',
          unit_rate: parseFloat(row.unit_price) || 0,
          amount: parseFloat(row.total_price) || 0,
          component_id: defaultComponentId,
          requires_client_selection: true
        });
      }
    } catch (err) {
      errors.push({ type: 'doors', error: err.message });
    }

    // --- 4. WINDOWS ---
    try {
      const winRows = await db.query(`
        SELECT w.id as boq_id, w.element_id, w.item_id, w.floor, w.room,
               w.quantity, w.unit_price, w.total_price,
               e.element_name, i.item_name
        FROM project_boq_windows w
        LEFT JOIN elements e ON w.element_id = e.element_id
        LEFT JOIN items i ON w.item_id = i.item_id
        WHERE w.project_id = $1
        ORDER BY w.id
      `, [projectId]);

      for (const row of winRows.rows) {
        const floorNum = row.floor || '0';
        const floorName = floorNum === '0' ? 'Ground Floor' : 'Floor ' + floorNum;
        const floorCode = floorNum === '0' ? 'GF' : 'F' + floorNum;

        boqItems.push({
          boq_type: 'windows',
          boq_id: row.boq_id,
          element_id: row.element_id,
          element_name: row.element_name || 'Windows',
          element_category: 'Finishing',
          item_id: row.item_id,
          item_name: row.item_name || 'Window Frame',
          floor: floorName,
          floor_code: floorCode,
          quantity: parseFloat(row.quantity) || 0,
          unit: 'Nos',
          unit_rate: parseFloat(row.unit_price) || 0,
          amount: parseFloat(row.total_price) || 0,
          component_id: defaultComponentId,
          requires_client_selection: true
        });
      }
    } catch (err) {
      errors.push({ type: 'windows', error: err.message });
    }

    // --- 5. ELECTRICAL ---
    try {
      const elecRows = await db.query(`
        SELECT el.id as boq_id, el.element_id, el.item_id, el.floor, el.room,
               el.quantity, el.unit, el.unit_price, el.total_price,
               e.element_name, i.item_name
        FROM project_boq_electrical el
        LEFT JOIN elements e ON el.element_id = e.element_id
        LEFT JOIN items i ON el.item_id = i.item_id
        WHERE el.project_id = $1
        ORDER BY el.id
      `, [projectId]);

      for (const row of elecRows.rows) {
        const floorNum = row.floor || '0';
        const floorName = floorNum === '0' ? 'Ground Floor' : 'Floor ' + floorNum;
        const floorCode = floorNum === '0' ? 'GF' : 'F' + floorNum;

        boqItems.push({
          boq_type: 'electrical',
          boq_id: row.boq_id,
          element_id: row.element_id,
          element_name: row.element_name || 'Electrical Work',
          element_category: 'MEP',
          item_id: row.item_id,
          item_name: row.item_name || 'Electrical',
          floor: floorName,
          floor_code: floorCode,
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit || 'Points',
          unit_rate: parseFloat(row.unit_price) || 0,
          amount: parseFloat(row.total_price) || 0,
          component_id: defaultComponentId,
          requires_client_selection: false
        });
      }
    } catch (err) {
      errors.push({ type: 'electrical', error: err.message });
    }

    // --- 6. PLUMBING ---
    try {
      const plumbRows = await db.query(`
        SELECT p.boq_id, p.item_id, p.fixture_type, p.pipe_type, p.specifications,
               p.quantity, p.unit, p.unit_rate, p.amount, p.component_id,
               i.item_name
        FROM project_boq_plumbing p
        LEFT JOIN items i ON p.item_id = i.item_id
        WHERE p.project_id = $1
        ORDER BY p.boq_id
      `, [projectId]);

      const plumbElementResult = await db.query(
        "SELECT element_id FROM elements WHERE element_name = 'Plumbing Work' LIMIT 1"
      );
      const plumbElementId = plumbElementResult.rows.length > 0 ? plumbElementResult.rows[0].element_id : null;

      for (const row of plumbRows.rows) {
        boqItems.push({
          boq_type: 'plumbing',
          boq_id: row.boq_id,
          element_id: plumbElementId,
          element_name: 'Plumbing Work',
          element_category: 'MEP',
          item_id: row.item_id,
          item_name: row.item_name || 'Plumbing',
          floor: defaultFloor ? defaultFloor.floor_name : 'Ground Floor',
          floor_code: defaultFloor ? defaultFloor.floor_code : 'GF',
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit,
          unit_rate: parseFloat(row.unit_rate) || 0,
          amount: parseFloat(row.amount) || 0,
          component_id: row.component_id || defaultComponentId,
          requires_client_selection: (row.fixture_type ? true : false)
        });
      }
    } catch (err) {
      errors.push({ type: 'plumbing', error: err.message });
    }

    // --- 7. FLOORING ---
    try {
      const floorRows = await db.query(`
        SELECT f.boq_id, f.item_id, f.specifications,
               f.quantity, f.unit, f.unit_rate, f.amount, f.component_id,
               i.item_name
        FROM project_boq_flooring f
        LEFT JOIN items i ON f.item_id = i.item_id
        WHERE f.project_id = $1
        ORDER BY f.boq_id
      `, [projectId]);

      const floorElementResult = await db.query(
        "SELECT element_id FROM elements WHERE element_name = 'Flooring' LIMIT 1"
      );
      const floorElementId = floorElementResult.rows.length > 0 ? floorElementResult.rows[0].element_id : null;

      for (const row of floorRows.rows) {
        // Parse floor from specifications
        let floorName = defaultFloor ? defaultFloor.floor_name : 'Ground Floor';
        let floorCode = defaultFloor ? defaultFloor.floor_code : 'GF';
        const floorMatch = (row.specifications || '').match(/Floor\s+(\d+)/i);
        if (floorMatch) {
          floorName = 'Floor ' + floorMatch[1];
          floorCode = 'F' + floorMatch[1];
        }

        boqItems.push({
          boq_type: 'flooring',
          boq_id: row.boq_id,
          element_id: floorElementId,
          element_name: 'Flooring',
          element_category: 'Finishing',
          item_id: row.item_id,
          item_name: row.item_name || 'Floor Tile',
          floor: floorName,
          floor_code: floorCode,
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit,
          unit_rate: parseFloat(row.unit_rate) || 0,
          amount: parseFloat(row.amount) || 0,
          component_id: row.component_id || defaultComponentId,
          requires_client_selection: true
        });
      }
    } catch (err) {
      errors.push({ type: 'flooring', error: err.message });
    }

    // --- 8. PAINTING ---
    try {
      const paintRows = await db.query(`
        SELECT p.boq_id, p.item_id, p.specifications,
               p.quantity, p.unit, p.unit_rate, p.amount, p.component_id,
               i.item_name
        FROM project_boq_painting p
        LEFT JOIN items i ON p.item_id = i.item_id
        WHERE p.project_id = $1
        ORDER BY p.boq_id
      `, [projectId]);

      const paintElementResult = await db.query(
        "SELECT element_id FROM elements WHERE element_name = 'Painting' LIMIT 1"
      );
      const paintElementId = paintElementResult.rows.length > 0 ? paintElementResult.rows[0].element_id : null;

      for (const row of paintRows.rows) {
        boqItems.push({
          boq_type: 'painting',
          boq_id: row.boq_id,
          element_id: paintElementId,
          element_name: 'Painting',
          element_category: 'Finishing',
          item_id: row.item_id,
          item_name: row.item_name || 'Paint',
          floor: defaultFloor ? defaultFloor.floor_name : 'Ground Floor',
          floor_code: defaultFloor ? defaultFloor.floor_code : 'GF',
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit,
          unit_rate: parseFloat(row.unit_rate) || 0,
          amount: parseFloat(row.amount) || 0,
          component_id: row.component_id || defaultComponentId,
          requires_client_selection: true
        });
      }
    } catch (err) {
      errors.push({ type: 'painting', error: err.message });
    }

    // ================================================================
    // GROUP BOQ items by (floor + element_name + item_name) to create units
    // Aggregate quantities and amounts for same group
    // ================================================================
    const unitGroups = {};

    for (const item of boqItems) {
      const key = `${item.floor}|${item.element_name}|${item.item_name}`;
      
      if (!unitGroups[key]) {
        unitGroups[key] = {
          floor: item.floor,
          floor_code: item.floor_code,
          element_id: item.element_id,
          element_name: item.element_name,
          element_category: item.element_category,
          item_id: item.item_id,
          item_name: item.item_name,
          unit: item.unit,
          unit_rate: item.unit_rate,
          component_id: item.component_id,
          requires_client_selection: item.requires_client_selection,
          total_quantity: 0,
          total_amount: 0,
          boq_ids: [],
          boq_types: new Set()
        };
      }

      unitGroups[key].total_quantity += item.quantity;
      unitGroups[key].total_amount += item.amount;
      unitGroups[key].boq_ids.push(item.boq_id);
      unitGroups[key].boq_types.add(item.boq_type);
      // Keep the higher unit_rate if there are multiples
      if (item.unit_rate > unitGroups[key].unit_rate) {
        unitGroups[key].unit_rate = item.unit_rate;
      }
    }

    // ================================================================
    // INSERT units into the units table
    // ================================================================
    const timestamp = Date.now();
    let unitIndex = 0;

    for (const [key, group] of Object.entries(unitGroups)) {
      unitIndex++;
      const uid = `UNIT-${projectId}-${group.floor_code}-${unitIndex}-${timestamp}`;
      const unitCode = `${group.floor_code}-${group.element_name.replace(/\s+/g, '').substring(0, 6)}-${group.item_name.replace(/\s+/g, '').substring(0, 6)}`;
      const unitName = `${group.floor} - ${group.element_name} - ${group.item_name}`;
      const unitDescription = `${group.item_name} for ${group.element_name} at ${group.floor}`;
      const unitCategory = group.element_category;

      try {
        await db.query(`
          INSERT INTO units (
            uid, project_id, component_id, unit_code, unit_name, unit_description,
            unit_category, element_id, item_id, quantity, unit_measure,
            unit_rate, total_amount, status, completion_percentage,
            floor, notes, created_by, requires_client_selection
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          uid,
          projectId,
          group.component_id,
          unitCode,
          unitName,
          unitDescription,
          unitCategory,
          group.element_id,
          group.item_id,
          group.total_quantity,
          group.unit,
          group.unit_rate,
          group.total_amount,
          'Planned',
          0.00,
          group.floor,
          `Auto-generated from BOQ. Source types: ${Array.from(group.boq_types).join(', ')}`,
          created_by,
          group.requires_client_selection
        ]);

        totalUnitsGenerated++;
        const typeKey = Array.from(group.boq_types).join('+');
        results[typeKey] = (results[typeKey] || 0) + 1;
      } catch (insertErr) {
        errors.push({
          type: 'unit_insert',
          unit: unitName,
          error: insertErr.message
        });
      }
    }

    await db.query('COMMIT');

    console.log(`Units Generation complete: ${totalUnitsGenerated} units created`);

    res.json({
      success: true,
      message: `Generated ${totalUnitsGenerated} units from BOQ data`,
      totalUnitsGenerated,
      results,
      boqItemsProcessed: boqItems.length,
      uniqueGroups: Object.keys(unitGroups).length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Units Generation Error:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * Get generated units summary for a project
 * GET /api/units_generation/summary/:projectId
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        u.unit_id, u.uid, u.unit_code, u.unit_name, u.unit_description,
        u.unit_category, u.floor, u.quantity, u.unit_measure,
        u.unit_rate, u.total_amount, u.status, u.requires_client_selection,
        e.element_name, i.item_name, pc.component_name
      FROM units u
      LEFT JOIN elements e ON u.element_id = e.element_id
      LEFT JOIN items i ON u.item_id = i.item_id
      LEFT JOIN project_components pc ON u.component_id = pc.component_id
      WHERE u.project_id = $1
      ORDER BY u.floor, u.unit_category, u.unit_name
    `, [projectId]);

    // Also get summary stats
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_units,
        COUNT(DISTINCT floor) as total_floors,
        COUNT(DISTINCT unit_category) as total_categories,
        SUM(total_amount) as total_project_cost,
        COUNT(CASE WHEN requires_client_selection = true THEN 1 END) as units_needing_selection,
        COUNT(CASE WHEN status = 'Planned' THEN 1 END) as planned_units,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_units,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_units
      FROM units WHERE project_id = $1
    `, [projectId]);

    res.json({
      success: true,
      summary: stats.rows[0],
      units: result.rows
    });

  } catch (err) {
    console.error('Units summary error:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * Delete all generated units for a project (for re-generation)
 * DELETE /api/units_generation/clear/:projectId
 */
router.delete('/clear/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    // Check if any units are linked to costing_boq
    const linkedCheck = await db.query(
      'SELECT COUNT(*) as cnt FROM costing_boq WHERE project_id = $1',
      [projectId]
    );

    if (parseInt(linkedCheck.rows[0].cnt) > 0) {
      return res.status(400).json({
        error: 'Cannot clear units - they are linked to costing_boq entries. Clear costing_boq first.'
      });
    }

    const result = await db.query(
      'DELETE FROM units WHERE project_id = $1',
      [projectId]
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} units for project ${projectId}`
    });

  } catch (err) {
    console.error('Units clear error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
