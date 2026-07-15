const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: BOQ Generation
 *   description: API for generating BOQ from architect measurements
 */

/**
 * Generate BOQ from all architect measurements for a project
 * POST /api/boq_generation/generate/:projectId
 */
router.post('/generate/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { created_by = 1 } = req.body;

  console.log('🚀 Starting BOQ Generation for project:', projectId);

  try {
    await db.query('BEGIN');

    // CLEANUP: Delete existing BOQ records for this project before regenerating
    // This prevents duplicate records when Generate is clicked multiple times
    console.log('Cleaning up existing BOQ records for project:', projectId);
    await db.query('DELETE FROM project_boq_structural WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_walls WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_doors WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_windows WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_electrical WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_plumbing WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_flooring WHERE project_id = $1', [projectId]);
    await db.query('DELETE FROM project_boq_painting WHERE project_id = $1', [projectId]);
    console.log('Existing BOQ records cleaned up successfully');

    let totalItemsGenerated = 0;
    const results = {
      structural: 0,
      walls: 0,
      doors: 0,
      windows: 0,
      electrical: 0,
      plumbing: 0,
      flooring: 0,
      painting: 0
    };
    const errors = [];

    // Helper: Get a valid component_id for this project (or null)
    const componentResult = await db.query(
      `SELECT component_id FROM project_components WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    const defaultComponentId = componentResult.rows.length > 0 ? componentResult.rows[0].component_id : null;

    // Helper: Get a valid unit_id (or null)
    const unitResult = await db.query(`SELECT unit_id FROM component_units LIMIT 1`);
    const defaultUnitId = unitResult.rows.length > 0 ? unitResult.rows[0].unit_id : null;

    // ================================
    // 1. STRUCTURAL BOQ GENERATION
    // ================================
    console.log('📐 Processing Structural measurements...');
    
    try {
      // Get measurements with their element-item mappings
      // KEY FIX: Match by ITEM NAME (TMT/RMC) not element name
      const structuralMeasurements = await db.query(`
        SELECT 
          ams.structural_measurement_id,
          ams.element_id,
          ams.floor,
          ams.component_id as meas_component_id,
          ams.length, ams.width, ams.height, ams.depth, ams.thickness,
          ams.tmt_main_bar_dia, ams.tmt_distribution_bar_dia,
          ams.qty_main_bars, ams.qty_distribution_bars,
          ams.rmc_grade, ams.stirrup_dia, ams.stirrup_spacing,
          e.element_name,
          i.item_id,
          i.item_name,
          i.item_unit
        FROM architect_measurements_structural ams
        JOIN elements e ON ams.element_id = e.element_id
        JOIN element_item_mapping eim ON e.element_id = eim.element_id
        JOIN items i ON eim.item_id = i.item_id
        WHERE ams.project_id = $1 
          AND ams.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${structuralMeasurements.rows.length} structural measurement-item pairs`);

      for (const m of structuralMeasurements.rows) {
        let quantity = 0;
        let unit = m.item_unit || 'Unit';
        let specs = '';

        const length = parseFloat(m.length) || 0;
        const width = parseFloat(m.width) || 0;
        const height = parseFloat(m.height) || 0;
        const depth = parseFloat(m.depth) || height; // fallback
        const volume = length * width * (depth || height);

        // TMT Bar calculation
        if (m.item_name === 'TMT Bar') {
          const mainBarDia = parseFloat(m.tmt_main_bar_dia) || 0;
          const qtyMainBars = parseInt(m.qty_main_bars) || 0;
          const distBarDia = parseFloat(m.tmt_distribution_bar_dia) || 0;
          const qtyDistBars = parseInt(m.qty_distribution_bars) || 0;

          // Weight = (D²/162) × Length × Number of bars
          let mainWeight = 0, distWeight = 0;
          if (mainBarDia > 0 && qtyMainBars > 0) {
            mainWeight = ((mainBarDia * mainBarDia) / 162) * length * qtyMainBars;
          }
          if (distBarDia > 0 && qtyDistBars > 0) {
            distWeight = ((distBarDia * distBarDia) / 162) * length * qtyDistBars;
          }
          quantity = mainWeight + distWeight;

          // If no bar details but we have dimensions, use steel ratio ~80kg/cum
          if (quantity === 0 && volume > 0) {
            quantity = volume * 80; // ~80 kg steel per cubic meter of concrete
          }

          unit = 'kg';
          specs = `${m.element_name}: ${mainBarDia}mm main (${qtyMainBars} nos)`;
          
        // RMC calculation
        } else if (m.item_name === 'RMC' || m.item_name === 'Miller Concrete') {
          quantity = volume; // Volume in cubic meters
          unit = 'cum';
          specs = `${m.element_name}: ${m.rmc_grade || 'M20'}, ${length}m×${width}m×${depth || height}m`;
        
        // Brick (for walls-type structural elements like Parapet, Boundary Walls)
        } else if (m.item_name === 'Brick') {
          const area = length * height;
          const wallThickness = parseFloat(m.thickness) || 4;
          const bricksPerSqft = wallThickness <= 4 ? 55 : 110;
          quantity = area * bricksPerSqft;
          unit = 'Nos';
          specs = `${m.element_name}: ${area.toFixed(1)} sqft × ${bricksPerSqft} bricks/sqft`;

        // Cement
        } else if (m.item_name === 'Cement') {
          // ~0.2 bags per sqft of wall area
          quantity = (length * height) * 0.2;
          unit = 'bag';
          specs = `${m.element_name}: Cement for masonry`;

        // Sand
        } else if (m.item_name === 'Sand') {
          // ~0.01 cum per sqft of wall area
          quantity = (length * height) * 0.01;
          unit = 'cum';
          specs = `${m.element_name}: Sand for masonry`;
        }

        if (quantity > 0) {
          const compId = m.meas_component_id || defaultComponentId;
          if (!compId) {
            console.log(`  ⚠️ Skipping structural ${m.element_name}/${m.item_name} - no component_id available`);
            continue;
          }

          await db.query(`
            INSERT INTO project_boq_structural (
              project_id, component_id, unit_id, element_id, item_id,
              calculation_type, specifications,
              quantity, unit, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            projectId, compId, defaultUnitId,
            m.element_id, m.item_id,
            'Architect Measurement', specs,
            quantity.toFixed(2), unit, 'Draft', created_by
          ]);

          results.structural++;
          totalItemsGenerated++;
          console.log(`  ✅ ${m.element_name} → ${m.item_name}: ${quantity.toFixed(2)} ${unit}`);
        }
      }
    } catch (err) {
      console.error('  ❌ Structural error:', err.message);
      errors.push({ type: 'structural', error: err.message });
    }

    console.log(`✅ Structural BOQ: ${results.structural} items`);

    // ================================
    // 2. WALLS BOQ GENERATION
    // ================================
    console.log('🧱 Processing Walls measurements...');
    
    try {
      const wallsMeasurements = await db.query(`
        SELECT 
          am.measurement_id, am.floor, am.room, am.walltype,
          am.wall_thickness, am.width, am.height, 
          am.total_wall_width, am.actual_wall_width,
          am.window_sqft, am.window2_sqft, am.door_sqft, am.door2_sqft,
          am.project_id
        FROM architect_walls_measurement am
        WHERE am.project_id = $1
      `, [projectId]);

      console.log(`  Found ${wallsMeasurements.rows.length} wall measurements`);

      // Get brick item
      const brickItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Brick' AND item_id <= 16 LIMIT 1`);
      const brickItemId = brickItem.rows.length > 0 ? brickItem.rows[0].item_id : null;

      if (!brickItemId) {
        console.log('  ⚠️ No Brick item found in items table');
      }

      for (const m of wallsMeasurements.rows) {
        if (!brickItemId) continue;

        // Calculate net wall area
        let wallWidth = parseFloat(m.width) || parseFloat(m.total_wall_width) || 0;
        let wallHeight = parseFloat(m.height) || 0;
        
        // If actual_wall_width is positive, use it (it has openings deducted)
        const actualWidth = parseFloat(m.actual_wall_width) || 0;
        if (actualWidth > 0) {
          wallWidth = actualWidth;
        }

        // If width is from wall dimensions, calculate area
        let netArea = wallWidth * wallHeight;
        
        // If netArea still negative or zero, try using raw width*height minus openings
        if (netArea <= 0) {
          const rawWidth = parseFloat(m.total_wall_width) || parseFloat(m.width) || 0;
          const rawHeight = parseFloat(m.height) || 0;
          const openings = (parseFloat(m.window_sqft) || 0) + (parseFloat(m.window2_sqft) || 0) + 
                          (parseFloat(m.door_sqft) || 0) + (parseFloat(m.door2_sqft) || 0);
          netArea = (rawWidth * rawHeight) - openings;
        }

        if (netArea <= 0) {
          console.log(`  ⚠️ Skipping wall ${m.measurement_id} - no valid area (${netArea})`);
          continue;
        }

        const thickness = parseFloat(m.wall_thickness) || 4;
        const bricksPerSqft = thickness <= 6 ? 55 : 110; // 4" = 55, 9" = 110
        const quantity = netArea * bricksPerSqft;

        if (!defaultComponentId) {
          console.log(`  ⚠️ Skipping wall ${m.measurement_id} - no component_id`);
          continue;
        }

        await db.query(`
          INSERT INTO project_boq_walls (
            project_id, component_id, unit_id, item_id,
            measurement_id, wall_type, specifications,
            quantity, unit, status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          projectId, defaultComponentId, defaultUnitId,
          brickItemId, m.measurement_id,
          m.walltype || 'External Wall',
          `Floor ${m.floor}, Room ${m.room}: ${netArea.toFixed(1)} sqft × ${bricksPerSqft}/sqft, Thickness: ${thickness}"`,
          quantity.toFixed(0), 'Nos', 'Draft', created_by
        ]);

        results.walls++;
        totalItemsGenerated++;
        console.log(`  ✅ Wall ${m.measurement_id}: ${netArea.toFixed(1)} sqft → ${quantity.toFixed(0)} bricks`);
      }
    } catch (err) {
      console.error('  ❌ Walls error:', err.message);
      errors.push({ type: 'walls', error: err.message });
    }

    console.log(`✅ Walls BOQ: ${results.walls} items`);

    // ================================
    // 3. DOORS BOQ GENERATION
    // ================================
    console.log('🚪 Processing Doors measurements...');
    
    try {
      const doorsMeasurements = await db.query(`
        SELECT 
          amd.measurement_id, amd.floor_id, amd.room,
          amd.door_width, amd.door_height, amd.door_area,
          amd.door_type, amd.door_material, amd.quantity,
          amd.door_location, amd.wall_direction,
          amd.component_id as meas_component_id
        FROM architect_measurements_doors amd
        WHERE amd.project_id = $1 
          AND amd.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${doorsMeasurements.rows.length} door measurements`);

      // Get door item
      const doorItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Door Frame' LIMIT 1`);
      const doorItemId = doorItem.rows.length > 0 ? doorItem.rows[0].item_id : null;

      // Get Door element (21)
      const doorElementId = 21;

      for (const m of doorsMeasurements.rows) {
        if (!doorItemId) {
          console.log('  ⚠️ No Door Frame item found');
          continue;
        }

        const qty = parseInt(m.quantity) || 1;
        const area = parseFloat(m.door_area) || (parseFloat(m.door_width) * parseFloat(m.door_height)) || 0;

        await db.query(`
          INSERT INTO project_boq_doors (
            project_id, door_id, element_id, item_id,
            floor, room, door_number,
            quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          projectId,
          21, // default door_id from doors table
          doorElementId,
          doorItemId,
          m.floor_id ? m.floor_id.toString() : '1',
          m.room || '',
          m.door_location || 'D1',
          qty
        ]);

        results.doors++;
        totalItemsGenerated++;
        console.log(`  ✅ Door: ${m.door_type} ${m.door_material}, ${qty} nos, area: ${area} sqft`);
      }
    } catch (err) {
      console.error('  ❌ Doors error:', err.message);
      errors.push({ type: 'doors', error: err.message });
    }

    console.log(`✅ Doors BOQ: ${results.doors} items`);

    // ================================
    // 4. WINDOWS BOQ GENERATION
    // ================================
    console.log('🪟 Processing Windows measurements...');
    
    try {
      const windowsMeasurements = await db.query(`
        SELECT 
          amw.measurement_id, amw.floor_id, amw.room,
          amw.window_width, amw.window_height, amw.window_area,
          amw.window_type, amw.frame_material, amw.quantity,
          amw.window_location, amw.wall_direction,
          amw.component_id as meas_component_id
        FROM architect_measurements_windows amw
        WHERE amw.project_id = $1 
          AND amw.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${windowsMeasurements.rows.length} window measurements`);

      // Get window item
      const windowItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Window Frame' LIMIT 1`);
      const windowItemId = windowItem.rows.length > 0 ? windowItem.rows[0].item_id : null;

      // Get Windows element
      const windowElement = await db.query(`SELECT element_id FROM elements WHERE element_name = 'Windows' LIMIT 1`);
      const windowElementId = windowElement.rows.length > 0 ? windowElement.rows[0].element_id : null;

      for (const m of windowsMeasurements.rows) {
        if (!windowItemId || !windowElementId) {
          console.log('  ⚠️ No Window Frame item or Windows element found');
          continue;
        }

        const qty = parseInt(m.quantity) || 1;

        await db.query(`
          INSERT INTO project_boq_windows (
            project_id, window_id, element_id, item_id,
            floor, room, location_description, wall_direction,
            quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          projectId,
          1, // default window_id from windows table
          windowElementId,
          windowItemId,
          m.floor_id ? m.floor_id.toString() : '1',
          m.room || '',
          m.window_location || '',
          m.wall_direction || '',
          qty
        ]);

        results.windows++;
        totalItemsGenerated++;
        console.log(`  ✅ Window: ${m.window_type} ${m.frame_material}, ${qty} nos`);
      }
    } catch (err) {
      console.error('  ❌ Windows error:', err.message);
      errors.push({ type: 'windows', error: err.message });
    }

    console.log(`✅ Windows BOQ: ${results.windows} items`);

    // ================================
    // 5. ELECTRICAL BOQ GENERATION
    // ================================
    console.log('⚡ Processing Electrical measurements...');
    
    try {
      const electricalMeasurements = await db.query(`
        SELECT 
          ame.*
        FROM architect_measurements_electrical ame
        WHERE ame.project_id = $1 
          AND ame.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${electricalMeasurements.rows.length} electrical measurements`);

      // Get electrical items
      const electricalWiringItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Electrical Wiring' LIMIT 1`);
      const wiringItemId = electricalWiringItem.rows.length > 0 ? electricalWiringItem.rows[0].item_id : null;

      const conduitItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Conduit Pipe' LIMIT 1`);
      const conduitItemId = conduitItem.rows.length > 0 ? conduitItem.rows[0].item_id : null;

      // Get Electrical element
      const elecElement = await db.query(`SELECT element_id FROM elements WHERE element_name = 'Electrical Work' LIMIT 1`);
      const elecElementId = elecElement.rows.length > 0 ? elecElement.rows[0].element_id : null;

      for (const m of electricalMeasurements.rows) {
        if (!elecElementId) {
          console.log('  ⚠️ No Electrical Work element found');
          continue;
        }

        // Calculate total electrical points
        const totalPoints = (
          (parseInt(m.light_points) || 0) +
          (parseInt(m.fan_points) || 0) +
          (parseInt(m.power_outlets_5a) || 0) +
          (parseInt(m.power_outlets_15a) || 0) +
          (parseInt(m.ac_points) || 0) +
          (parseInt(m.ups_points) || 0) +
          (parseInt(m.data_points) || 0) +
          (parseInt(m.tv_points) || 0) +
          (parseInt(m.telephone_points) || 0)
        );

        // Calculate total conduit length
        const totalConduit = (
          (parseFloat(m.conduit_length_1_inch) || 0) +
          (parseFloat(m.conduit_length_3_4_inch) || 0)
        );

        // Insert electrical points BOQ
        if (totalPoints > 0 && wiringItemId) {
          await db.query(`
            INSERT INTO project_boq_electrical (
              project_id, element_id, item_id,
              floor, room, location_description,
              quantity, unit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            projectId, elecElementId, wiringItemId,
            m.floor_id ? m.floor_id.toString() : '1',
            m.room || '',
            `Light:${m.light_points||0}, Fan:${m.fan_points||0}, 5A:${m.power_outlets_5a||0}, 15A:${m.power_outlets_15a||0}, AC:${m.ac_points||0}`,
            totalPoints, 'Points'
          ]);

          results.electrical++;
          totalItemsGenerated++;
          console.log(`  ✅ Electrical Points: ${totalPoints} points`);
        }

        // Insert conduit BOQ
        if (totalConduit > 0 && conduitItemId) {
          await db.query(`
            INSERT INTO project_boq_electrical (
              project_id, element_id, item_id,
              floor, room, location_description,
              quantity, unit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            projectId, elecElementId, conduitItemId,
            m.floor_id ? m.floor_id.toString() : '1',
            m.room || '',
            `Conduit: 1"=${m.conduit_length_1_inch||0}ft, 3/4"=${m.conduit_length_3_4_inch||0}ft`,
            totalConduit, 'Rft'
          ]);

          results.electrical++;
          totalItemsGenerated++;
          console.log(`  ✅ Conduit: ${totalConduit} Rft`);
        }
      }
    } catch (err) {
      console.error('  ❌ Electrical error:', err.message);
      errors.push({ type: 'electrical', error: err.message });
    }

    console.log(`✅ Electrical BOQ: ${results.electrical} items`);

    // ================================
    // 6. PLUMBING BOQ GENERATION
    // ================================
    console.log('💧 Processing Plumbing measurements...');
    
    try {
      const plumbingMeasurements = await db.query(`
        SELECT amp.*
        FROM architect_measurements_plumbing amp
        WHERE amp.project_id = $1 
          AND amp.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${plumbingMeasurements.rows.length} plumbing measurements`);

      // Get plumbing items
      const pipeItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Plumbing Pipe CPVC' LIMIT 1`);
      const pipeItemId = pipeItem.rows.length > 0 ? pipeItem.rows[0].item_id : null;

      const fixtureItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Plumbing Fixtures' LIMIT 1`);
      const fixtureItemId = fixtureItem.rows.length > 0 ? fixtureItem.rows[0].item_id : null;

      for (const m of plumbingMeasurements.rows) {
        // Calculate total fixtures
        const totalFixtures = (
          (parseInt(m.wash_basin_points) || 0) +
          (parseInt(m.toilet_points) || 0) +
          (parseInt(m.shower_points) || 0) +
          (parseInt(m.kitchen_sink_points) || 0) +
          (parseInt(m.washing_machine_points) || 0)
        );

        // Calculate total pipe length
        const totalPipe = (
          (parseFloat(m.cpvc_pipe_1_inch) || 0) +
          (parseFloat(m.cpvc_pipe_3_4_inch) || 0) +
          (parseFloat(m.cpvc_pipe_1_2_inch) || 0) +
          (parseFloat(m.pvc_pipe_4_inch) || 0) +
          (parseFloat(m.pvc_pipe_3_inch) || 0) +
          (parseFloat(m.pvc_pipe_2_inch) || 0)
        );

        const compId = m.component_id || defaultComponentId;
        if (!compId) continue;

        // Insert fixtures BOQ
        if (totalFixtures > 0 && fixtureItemId) {
          await db.query(`
            INSERT INTO project_boq_plumbing (
              project_id, component_id, unit_id, item_id,
              measurement_id, fixture_type, specifications,
              quantity, unit, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            projectId, compId, defaultUnitId,
            fixtureItemId, m.measurement_id,
            'Mixed Fixtures',
            `WB:${m.wash_basin_points||0}, Toilet:${m.toilet_points||0}, Shower:${m.shower_points||0}, Sink:${m.kitchen_sink_points||0}, WM:${m.washing_machine_points||0}`,
            totalFixtures, 'Nos', 'Draft', created_by
          ]);

          results.plumbing++;
          totalItemsGenerated++;
          console.log(`  ✅ Plumbing Fixtures: ${totalFixtures} nos`);
        }

        // Insert pipe BOQ
        if (totalPipe > 0 && pipeItemId) {
          await db.query(`
            INSERT INTO project_boq_plumbing (
              project_id, component_id, unit_id, item_id,
              measurement_id, pipe_type, specifications,
              quantity, unit, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            projectId, compId, defaultUnitId,
            pipeItemId, m.measurement_id,
            'CPVC + PVC',
            `CPVC: 1"=${m.cpvc_pipe_1_inch||0}, 3/4"=${m.cpvc_pipe_3_4_inch||0}, 1/2"=${m.cpvc_pipe_1_2_inch||0}; PVC: 4"=${m.pvc_pipe_4_inch||0}, 3"=${m.pvc_pipe_3_inch||0}, 2"=${m.pvc_pipe_2_inch||0}`,
            totalPipe, 'Rft', 'Draft', created_by
          ]);

          results.plumbing++;
          totalItemsGenerated++;
          console.log(`  ✅ Plumbing Pipes: ${totalPipe} Rft`);
        }
      }
    } catch (err) {
      console.error('  ❌ Plumbing error:', err.message);
      errors.push({ type: 'plumbing', error: err.message });
    }

    console.log(`✅ Plumbing BOQ: ${results.plumbing} items`);

    // ================================
    // 7. FLOORING BOQ GENERATION
    // ================================
    console.log('🎨 Processing Flooring measurements...');
    
    try {
      const flooringMeasurements = await db.query(`
        SELECT amf.*
        FROM architect_measurements_flooring amf
        WHERE amf.project_id = $1 
          AND amf.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${flooringMeasurements.rows.length} flooring measurements`);

      // Get flooring item
      const tileItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Floor Tile' LIMIT 1`);
      const tileItemId = tileItem.rows.length > 0 ? tileItem.rows[0].item_id : null;

      for (const m of flooringMeasurements.rows) {
        if (!tileItemId) {
          console.log('  ⚠️ No Floor Tile item found');
          continue;
        }

        const area = parseFloat(m.area) || ((parseFloat(m.length) || 0) * (parseFloat(m.width) || 0));
        
        if (area <= 0) {
          console.log(`  ⚠️ Skipping flooring ${m.measurement_id} - no area`);
          continue;
        }

        const compId = m.component_id || defaultComponentId;
        if (!compId) continue;

        // Add 5% wastage
        const quantityWithWastage = area * 1.05;

        await db.query(`
          INSERT INTO project_boq_flooring (
            project_id, component_id, unit_id, item_id,
            measurement_id, flooring_type, tile_size, specifications,
            quantity, unit, requires_selection, status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          projectId, compId, defaultUnitId,
          tileItemId, m.measurement_id,
          m.flooring_type || 'Standard',
          m.tile_size || '',
          `Floor ${m.floor_id}, Room: ${m.room}, Area: ${area} sqft (+5% wastage)`,
          quantityWithWastage.toFixed(2), 'sqft',
          m.requires_client_selection || false,
          'Draft', created_by
        ]);

        results.flooring++;
        totalItemsGenerated++;
        console.log(`  ✅ Flooring: ${area} sqft → ${quantityWithWastage.toFixed(0)} sqft (with wastage)`);

        // Add skirting if required
        if (m.skirting_required) {
          const skirtingItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Skirting Tile' LIMIT 1`);
          if (skirtingItem.rows.length > 0) {
            const skirtingLength = parseFloat(m.skirting_length) || 0;
            if (skirtingLength > 0) {
              await db.query(`
                INSERT INTO project_boq_flooring (
                  project_id, component_id, unit_id, item_id,
                  measurement_id, flooring_type, specifications,
                  quantity, unit, status, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              `, [
                projectId, compId, defaultUnitId,
                skirtingItem.rows[0].item_id, m.measurement_id,
                'Skirting',
                `Skirting Height: ${m.skirting_height}`, 
                skirtingLength, 'Rft', 'Draft', created_by
              ]);

              results.flooring++;
              totalItemsGenerated++;
              console.log(`  ✅ Skirting: ${skirtingLength} Rft`);
            }
          }
        }
      }
    } catch (err) {
      console.error('  ❌ Flooring error:', err.message);
      errors.push({ type: 'flooring', error: err.message });
    }

    console.log(`✅ Flooring BOQ: ${results.flooring} items`);

    // ================================
    // 8. PAINTING BOQ GENERATION
    // ================================
    console.log('🖌️ Processing Painting measurements...');
    
    try {
      const paintingMeasurements = await db.query(`
        SELECT amp.*
        FROM architect_measurements_painting amp
        WHERE amp.project_id = $1 
          AND amp.status = 'Verified'
      `, [projectId]);

      console.log(`  Found ${paintingMeasurements.rows.length} painting measurements`);

      // Get paint items based on surface type
      const interiorPaintItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Interior Paint' LIMIT 1`);
      const exteriorPaintItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Exterior Paint' LIMIT 1`);
      const primerItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Primer' LIMIT 1`);
      const puttyItem = await db.query(`SELECT item_id FROM items WHERE item_name = 'Wall Putty' LIMIT 1`);

      for (const m of paintingMeasurements.rows) {
        const netArea = parseFloat(m.net_area) || 0;
        
        if (netArea <= 0) {
          console.log(`  ⚠️ Skipping painting ${m.measurement_id} - no net_area`);
          continue;
        }

        const compId = m.component_id || defaultComponentId;
        if (!compId) continue;

        // Determine paint item based on surface type
        const isExterior = (m.surface_type || '').toLowerCase().includes('exterior');
        const paintItem = isExterior ? exteriorPaintItem : interiorPaintItem;
        const paintItemId = paintItem.rows.length > 0 ? paintItem.rows[0].item_id : null;

        // Insert paint BOQ
        if (paintItemId) {
          const paintCoats = parseInt(m.paint_coats) || 2;
          const paintQuantity = netArea * paintCoats; // Total coverage area

          await db.query(`
            INSERT INTO project_boq_painting (
              project_id, component_id, unit_id, item_id,
              measurement_id, surface_type, paint_type, specifications,
              quantity, unit, requires_color_selection, selected_color,
              status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            projectId, compId, defaultUnitId,
            paintItemId, m.measurement_id,
            m.surface_type || 'Wall',
            m.paint_finish || 'Emulsion',
            `${m.surface_description || ''}: ${netArea} sqft × ${paintCoats} coats`,
            paintQuantity.toFixed(2), 'sqft',
            m.requires_client_selection || false,
            m.paint_color || null,
            'Draft', created_by
          ]);

          results.painting++;
          totalItemsGenerated++;
          console.log(`  ✅ Paint: ${netArea} sqft × ${paintCoats} coats = ${paintQuantity} sqft`);
        }

        // Insert primer BOQ if needed
        const primerCoats = parseInt(m.primer_coats) || 0;
        if (primerCoats > 0 && primerItem.rows.length > 0) {
          const primerQuantity = netArea * primerCoats;

          await db.query(`
            INSERT INTO project_boq_painting (
              project_id, component_id, unit_id, item_id,
              measurement_id, surface_type, paint_type, specifications,
              quantity, unit, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            projectId, compId, defaultUnitId,
            primerItem.rows[0].item_id, m.measurement_id,
            m.surface_type || 'Wall', 'Primer',
            `Primer: ${netArea} sqft × ${primerCoats} coats`,
            primerQuantity.toFixed(2), 'sqft', 'Draft', created_by
          ]);

          results.painting++;
          totalItemsGenerated++;
          console.log(`  ✅ Primer: ${netArea} sqft × ${primerCoats} coats = ${primerQuantity} sqft`);
        }

        // Insert putty BOQ if needed
        const puttyCoats = parseInt(m.putty_coats) || 0;
        if (puttyCoats > 0 && puttyItem.rows.length > 0) {
          const puttyQuantity = netArea * puttyCoats;

          await db.query(`
            INSERT INTO project_boq_painting (
              project_id, component_id, unit_id, item_id,
              measurement_id, surface_type, paint_type, specifications,
              quantity, unit, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            projectId, compId, defaultUnitId,
            puttyItem.rows[0].item_id, m.measurement_id,
            m.surface_type || 'Wall', 'Wall Putty',
            `Putty: ${netArea} sqft × ${puttyCoats} coats`,
            puttyQuantity.toFixed(2), 'sqft', 'Draft', created_by
          ]);

          results.painting++;
          totalItemsGenerated++;
          console.log(`  ✅ Putty: ${netArea} sqft × ${puttyCoats} coats = ${puttyQuantity} sqft`);
        }
      }
    } catch (err) {
      console.error('  ❌ Painting error:', err.message);
      errors.push({ type: 'painting', error: err.message });
    }

    console.log(`✅ Painting BOQ: ${results.painting} items`);

    // Commit transaction
    await db.query('COMMIT');

    console.log(`\n🎉 BOQ Generation Complete! Total items: ${totalItemsGenerated}`);
    console.log('Breakdown:', JSON.stringify(results));
    if (errors.length > 0) {
      console.log('Errors:', JSON.stringify(errors));
    }

    res.status(201).json({
      success: true,
      message: `BOQ generated successfully! ${totalItemsGenerated} items created`,
      totalItems: totalItemsGenerated,
      breakdown: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Fatal error generating BOQ:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate BOQ',
      details: err.message 
    });
  }
});

/**
 * Get BOQ Summary for a project
 * GET /api/boq_generation/summary/:projectId
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    const summary = {};

    const tables = [
      { name: 'structural', table: 'project_boq_structural', amountField: 'amount', pkField: 'boq_id' },
      { name: 'walls', table: 'project_boq_walls', amountField: 'amount', pkField: 'boq_id' },
      { name: 'doors', table: 'project_boq_doors', amountField: 'total_price', pkField: 'id' },
      { name: 'windows', table: 'project_boq_windows', amountField: 'total_price', pkField: 'id' },
      { name: 'electrical', table: 'project_boq_electrical', amountField: 'total_price', pkField: 'id' },
      { name: 'plumbing', table: 'project_boq_plumbing', amountField: 'amount', pkField: 'boq_id' },
      { name: 'flooring', table: 'project_boq_flooring', amountField: 'amount', pkField: 'boq_id' },
      { name: 'painting', table: 'project_boq_painting', amountField: 'amount', pkField: 'boq_id' }
    ];

    let grandTotalItems = 0;
    let grandTotalCost = 0;

    for (const module of tables) {
      try {
        const result = await db.query(`
          SELECT 
            COUNT(*) as total_items,
            COALESCE(SUM(COALESCE(quantity, 0)), 0) as total_quantity,
            COALESCE(SUM(COALESCE(${module.amountField}, 0)), 0) as total_cost
          FROM ${module.table}
          WHERE project_id = $1
        `, [projectId]);

        summary[module.name] = result.rows[0];
        grandTotalItems += parseInt(result.rows[0].total_items);
        grandTotalCost += parseFloat(result.rows[0].total_cost);
      } catch (tableErr) {
        summary[module.name] = { total_items: '0', total_quantity: '0', total_cost: '0', error: tableErr.message };
      }
    }

    res.json({
      success: true,
      projectId: parseInt(projectId),
      summary,
      grandTotalItems,
      grandTotalCost
    });

  } catch (err) {
    console.error('Error fetching BOQ summary:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch BOQ summary',
      details: err.message 
    });
  }
});

/**
 * Delete all BOQ items for a project (clear before regenerating)
 * DELETE /api/boq_generation/clear/:projectId
 */
router.delete('/clear/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    await db.query('BEGIN');

    const tables = [
      'project_boq_structural',
      'project_boq_walls',
      'project_boq_doors',
      'project_boq_windows',
      'project_boq_electrical',
      'project_boq_plumbing',
      'project_boq_flooring',
      'project_boq_painting'
    ];

    let totalDeleted = 0;
    const deletedBreakdown = {};

    for (const table of tables) {
      try {
        const result = await db.query(`DELETE FROM ${table} WHERE project_id = $1`, [projectId]);
        deletedBreakdown[table] = result.rowCount;
        totalDeleted += result.rowCount;
      } catch (delErr) {
        deletedBreakdown[table] = { error: delErr.message };
      }
    }

    await db.query('COMMIT');

    res.json({
      success: true,
      message: `BOQ cleared: ${totalDeleted} items deleted`,
      itemsDeleted: totalDeleted,
      breakdown: deletedBreakdown
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error clearing BOQ:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear BOQ',
      details: err.message 
    });
  }
});

/**
 * Apply costs to generated BOQ items
 * POST /api/boq_generation/apply-costs/:projectId
 */
router.post('/apply-costs/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { gst_percentage = 18 } = req.body;

  console.log('💰 Starting Cost Application for project:', projectId);

  try {
    await db.query('BEGIN');

    let totalUpdated = 0;
    const costSummary = {};

    // Process each BOQ table type
    const boqTypes = [
      { 
        name: 'structural', table: 'project_boq_structural', 
        pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount',
        statusFilter: "status = 'Draft'"
      },
      { 
        name: 'walls', table: 'project_boq_walls', 
        pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount',
        statusFilter: "status = 'Draft'"
      },
      { 
        name: 'doors', table: 'project_boq_doors', 
        pkField: 'id', rateField: 'unit_price', amountField: 'total_price',
        statusFilter: '1=1'
      },
      { 
        name: 'windows', table: 'project_boq_windows', 
        pkField: 'id', rateField: 'unit_price', amountField: 'total_price',
        statusFilter: '1=1'
      },
      { 
        name: 'electrical', table: 'project_boq_electrical', 
        pkField: 'id', rateField: 'unit_price', amountField: 'total_price',
        statusFilter: '1=1'
      },
      { 
        name: 'plumbing', table: 'project_boq_plumbing', 
        pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount',
        statusFilter: "status = 'Draft'"
      },
      { 
        name: 'flooring', table: 'project_boq_flooring', 
        pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount',
        statusFilter: "status = 'Draft'"
      },
      { 
        name: 'painting', table: 'project_boq_painting', 
        pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount',
        statusFilter: "status = 'Draft'"
      }
    ];

    for (const boqType of boqTypes) {
      try {
        const items = await db.query(`
          SELECT b.${boqType.pkField}, b.item_id, b.quantity,
            icp.base_price, icp.gst_percentage
          FROM ${boqType.table} b
          LEFT JOIN item_choices ic ON b.item_id = ic.item_id AND ic.is_default = true
          LEFT JOIN item_choice_pricing icp ON ic.choice_option_id = icp.choice_option_id 
            AND icp.is_active = true
            AND CURRENT_DATE BETWEEN icp.effective_from AND COALESCE(icp.effective_to, CURRENT_DATE + INTERVAL '100 years')
          WHERE b.project_id = $1 AND ${boqType.statusFilter}
        `, [projectId]);

        let moduleItems = 0;
        let moduleTotal = 0;

        for (const item of items.rows) {
          const unitRate = parseFloat(item.base_price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          const baseAmount = quantity * unitRate;
          const gst = (baseAmount * (parseFloat(item.gst_percentage) || gst_percentage)) / 100;
          const totalAmount = baseAmount + gst;

          if (unitRate > 0) {
            await db.query(`
              UPDATE ${boqType.table}
              SET ${boqType.rateField} = $1, ${boqType.amountField} = $2
              WHERE ${boqType.pkField} = $3
            `, [unitRate, totalAmount, item[boqType.pkField]]);

            moduleItems++;
            moduleTotal += totalAmount;
            totalUpdated++;
          }
        }

        costSummary[boqType.name] = { items: moduleItems, total: moduleTotal };
      } catch (typeErr) {
        costSummary[boqType.name] = { items: 0, total: 0, error: typeErr.message };
      }
    }

    const grandTotal = Object.values(costSummary).reduce((sum, m) => sum + (m.total || 0), 0);

    await db.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `Costs applied: ${totalUpdated} items updated`,
      itemsUpdated: totalUpdated,
      costSummary,
      grandTotal
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Error applying costs:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to apply costs',
      details: err.message 
    });
  }
});

/**
 * Get detailed cost breakdown for a project
 * GET /api/boq_generation/cost-breakdown/:projectId
 */
router.get('/cost-breakdown/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    const breakdown = {};
    
    const tables = [
      { name: 'structural', table: 'project_boq_structural', pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount' },
      { name: 'walls', table: 'project_boq_walls', pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount' },
      { name: 'doors', table: 'project_boq_doors', pkField: 'id', rateField: 'unit_price', amountField: 'total_price' },
      { name: 'windows', table: 'project_boq_windows', pkField: 'id', rateField: 'unit_price', amountField: 'total_price' },
      { name: 'electrical', table: 'project_boq_electrical', pkField: 'id', rateField: 'unit_price', amountField: 'total_price' },
      { name: 'plumbing', table: 'project_boq_plumbing', pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount' },
      { name: 'flooring', table: 'project_boq_flooring', pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount' },
      { name: 'painting', table: 'project_boq_painting', pkField: 'boq_id', rateField: 'unit_rate', amountField: 'amount' }
    ];

    let grandTotal = 0;
    const totals = {};

    for (const mod of tables) {
      try {
        const result = await db.query(`
          SELECT 
            t.${mod.pkField} as boq_id,
            t.item_id,
            i.item_name,
            t.quantity,
            COALESCE(t.${mod.rateField}, 0) as unit_rate,
            COALESCE(t.${mod.amountField}, 0) as total_amount
          FROM ${mod.table} t
          LEFT JOIN items i ON t.item_id = i.item_id
          WHERE t.project_id = $1
          ORDER BY t.${mod.pkField}
        `, [projectId]);

        breakdown[mod.name] = result.rows;
        const moduleTotal = result.rows.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
        totals[mod.name] = moduleTotal;
        grandTotal += moduleTotal;
      } catch (e) {
        breakdown[mod.name] = [];
        totals[mod.name] = 0;
      }
    }

    res.json({
      success: true,
      projectId: parseInt(projectId),
      breakdown,
      moduleTotals: totals,
      grandTotal
    });

  } catch (err) {
    console.error('Error fetching cost breakdown:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch cost breakdown',
      details: err.message 
    });
  }
});

module.exports = router;
