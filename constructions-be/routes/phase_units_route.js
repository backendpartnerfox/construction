const express = require('express');
const router = express.Router();

// Valid status values for phase_units
const VALID_STATUSES = ['Planned', 'Ready', 'In_Progress', 'Completed', 'Skipped'];

/**
 * @swagger
 * tags:
 *   name: Phase Units
 *   description: API for managing phase units
 */

/**
 * @swagger
 * /phase_units:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve all phase units from the phase_units table
 *     parameters:
 *       - in: query
 *         name: phase_id
 *         schema:
 *           type: integer
 *         description: Filter by phase ID
 *       - in: query
 *         name: unit_id
 *         schema:
 *           type: integer
 *         description: Filter by unit ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *         description: Filter by status
 *       - in: query
 *         name: is_critical
 *         schema:
 *           type: boolean
 *         description: Filter by critical units
 *     responses:
 *       200:
 *         description: List of phase units
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phase_unit_id:
 *                     type: integer
 *                   phase_id:
 *                     type: integer
 *                   unit_id:
 *                     type: integer
 *                   uid:
 *                     type: string
 *                   unit_role:
 *                     type: string
 *                   sequence_order:
 *                     type: integer
 *                   is_critical:
 *                     type: boolean
 *                   planned_start_offset_days:
 *                     type: integer
 *                   planned_duration_days:
 *                     type: integer
 *                   dependency_within_phase:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   status:
 *                     type: string
 *                     enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *                   completion_date:
 *                     type: string
 *                     format: date
 *                   notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 */

// Get all phase units with filters
router.get('/phase_units', async (req, res) => {
  const db = req.db;
  const { phase_id, unit_id, status, is_critical } = req.query;
  
  try {
    let query = 'SELECT * FROM phase_units WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (phase_id) {
      paramCount++;
      query += ` AND phase_id = $${paramCount}`;
      params.push(phase_id);
    }
    
    if (unit_id) {
      paramCount++;
      query += ` AND unit_id = $${paramCount}`;
      params.push(unit_id);
    }
    
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
        });
      }
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    if (is_critical !== undefined) {
      paramCount++;
      query += ` AND is_critical = $${paramCount}`;
      params.push(is_critical === 'true');
    }
    
    query += ' ORDER BY phase_id, sequence_order';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase_units/{id}:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve a specific phase unit by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase unit to retrieve
 *     responses:
 *       200:
 *         description: Phase unit details
 *       404:
 *         description: Phase unit not found
 *       500:
 *         description: Internal server error
 */

// Get phase unit by ID
router.get('/phase_units/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM phase_units WHERE phase_unit_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Phase unit not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase_units:
 *   post:
 *     summary: Create a new phase unit
 *     tags: [Phase Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phase_id
 *               - unit_id
 *               - uid
 *             properties:
 *               phase_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               uid:
 *                 type: string
 *               unit_role:
 *                 type: string
 *               sequence_order:
 *                 type: integer
 *               is_critical:
 *                 type: boolean
 *                 default: false
 *               planned_start_offset_days:
 *                 type: integer
 *                 default: 0
 *               planned_duration_days:
 *                 type: integer
 *               dependency_within_phase:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *                 enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *                 default: Planned
 *               completion_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Phase unit created successfully
 *       400:
 *         description: Missing required fields or invalid status
 *       500:
 *         description: Internal server error
 */
router.post('/phase_units', async (req, res) => {
  const db = req.db;
  const {
    phase_id,
    unit_id,
    uid,
    unit_role,
    sequence_order,
    is_critical,
    planned_start_offset_days,
    planned_duration_days,
    dependency_within_phase,
    status,
    completion_date,
    notes,
    created_by
  } = req.body;

  // Validate required fields
  if (!phase_id || !unit_id || !uid) {
    return res.status(400).json({ error: "phase_id, unit_id, and uid are required" });
  }

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO phase_units (
        phase_id, unit_id, uid, unit_role, sequence_order, is_critical,
        planned_start_offset_days, planned_duration_days, dependency_within_phase,
        status, completion_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        phase_id,
        unit_id,
        uid,
        unit_role || null,
        sequence_order || null,
        is_critical !== undefined ? is_critical : false,
        planned_start_offset_days !== undefined ? planned_start_offset_days : 0,
        planned_duration_days || null,
        dependency_within_phase || null,
        status || 'Planned',
        completion_date || null,
        notes || null,
        created_by || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase_units/{id}:
 *   put:
 *     summary: Update an existing phase unit by ID
 *     tags: [Phase Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase unit to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unit_role:
 *                 type: string
 *               sequence_order:
 *                 type: integer
 *               is_critical:
 *                 type: boolean
 *               planned_start_offset_days:
 *                 type: integer
 *               planned_duration_days:
 *                 type: integer
 *               dependency_within_phase:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *                 enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *               completion_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phase unit updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Phase unit not found
 *       500:
 *         description: Internal server error
 */
router.put('/phase_units/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Validate status if provided
  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
    });
  }

  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    // List of allowed update fields
    const allowedFields = [
      'unit_role', 'sequence_order', 'is_critical', 'planned_start_offset_days',
      'planned_duration_days', 'dependency_within_phase', 'status', 
      'completion_date', 'notes'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE phase_units 
      SET ${updateFields.join(', ')}
      WHERE phase_unit_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Phase unit not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase_units/{id}:
 *   delete:
 *     summary: Delete a phase unit by ID
 *     tags: [Phase Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase unit to delete
 *     responses:
 *       200:
 *         description: Phase unit deleted successfully
 *       404:
 *         description: Phase unit not found
 *       500:
 *         description: Internal server error
 */
router.delete('/phase_units/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM phase_units WHERE phase_unit_id = $1 RETURNING phase_unit_id",
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Phase unit not found" });
    }
    
    res.json({ 
      message: "Phase unit deleted successfully",
      deleted_id: result.rows[0].phase_unit_id
    });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase_units/phase/{phaseId}:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve phase units by phase ID
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The phase ID to filter phase units
 *     responses:
 *       200:
 *         description: List of phase units for the specified phase
 *       500:
 *         description: Internal server error
 */

// Get phase units by phase ID
router.get('/phase_units/phase/:phaseId', async (req, res) => {
  const db = req.db;
  const { phaseId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT pu.*, u.unit_name, u.unit_type
       FROM phase_units pu
       LEFT JOIN units u ON pu.unit_id = u.unit_id
       WHERE pu.phase_id = $1 
       ORDER BY pu.sequence_order`,
      [phaseId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase_units/unit/{unitId}:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve phase units by unit ID
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unit ID to filter phase units
 *     responses:
 *       200:
 *         description: List of phase units for the specified unit
 *       500:
 *         description: Internal server error
 */

// Get phase units by unit ID
router.get('/phase_units/unit/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT pu.*, p.phase_name, p.phase_type
       FROM phase_units pu
       LEFT JOIN phases p ON pu.phase_id = p.phase_id
       WHERE pu.unit_id = $1
       ORDER BY p.phase_sequence, pu.sequence_order`,
      [unitId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase_units/status/{status}:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve phase units by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *         description: The status to filter phase units
 *     responses:
 *       200:
 *         description: List of phase units with the specified status
 *       400:
 *         description: Invalid status
 *       500:
 *         description: Internal server error
 */

// Get phase units by status
router.get('/phase_units/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  // Validate status
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
    });
  }
  
  try {
    const result = await db.query(
      `SELECT pu.*, p.phase_name, u.unit_name
       FROM phase_units pu
       LEFT JOIN phases p ON pu.phase_id = p.phase_id
       LEFT JOIN units u ON pu.unit_id = u.unit_id
       WHERE pu.status = $1
       ORDER BY pu.phase_id, pu.sequence_order`,
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase_units/critical:
 *   get:
 *     tags: [Phase Units]
 *     description: Retrieve all critical phase units
 *     responses:
 *       200:
 *         description: List of critical phase units
 *       500:
 *         description: Internal server error
 */

// Get critical phase units
router.get('/phase_units/critical', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      `SELECT pu.*, p.phase_name, u.unit_name
       FROM phase_units pu
       LEFT JOIN phases p ON pu.phase_id = p.phase_id
       LEFT JOIN units u ON pu.unit_id = u.unit_id
       WHERE pu.is_critical = true
       ORDER BY pu.phase_id, pu.sequence_order`
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase_units/{id}/update-status:
 *   patch:
 *     summary: Update the status of a phase unit
 *     tags: [Phase Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase unit to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Planned, Ready, In_Progress, Completed, Skipped]
 *               completion_date:
 *                 type: string
 *                 format: date
 *                 description: Required when status is 'Completed'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status or missing completion_date
 *       404:
 *         description: Phase unit not found
 *       500:
 *         description: Internal server error
 */
router.patch('/phase_units/:id/update-status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status, completion_date } = req.body;

  // Validate status
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
    });
  }

  // If status is Completed, completion_date is required
  if (status === 'Completed' && !completion_date) {
    return res.status(400).json({ 
      error: "completion_date is required when status is 'Completed'" 
    });
  }

  try {
    const updateQuery = status === 'Completed' 
      ? `UPDATE phase_units 
         SET status = $1, completion_date = $2 
         WHERE phase_unit_id = $3 
         RETURNING *`
      : `UPDATE phase_units 
         SET status = $1 
         WHERE phase_unit_id = $2 
         RETURNING *`;

    const params = status === 'Completed' 
      ? [status, completion_date, id]
      : [status, id];

    const result = await db.query(updateQuery, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Phase unit not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase_units/bulk-create:
 *   post:
 *     summary: Create multiple phase units
 *     tags: [Phase Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phase_units
 *             properties:
 *               phase_units:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - phase_id
 *                     - unit_id
 *                     - uid
 *                   properties:
 *                     phase_id:
 *                       type: integer
 *                     unit_id:
 *                       type: integer
 *                     uid:
 *                       type: string
 *                     unit_role:
 *                       type: string
 *                     sequence_order:
 *                       type: integer
 *                     is_critical:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Phase units created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/phase_units/bulk-create', async (req, res) => {
  const db = req.db;
  const { phase_units } = req.body;

  if (!phase_units || !Array.isArray(phase_units) || phase_units.length === 0) {
    return res.status(400).json({ error: "phase_units array is required" });
  }

  try {
    // Start transaction
    await db.query('BEGIN');

    const createdUnits = [];

    for (const unit of phase_units) {
      const {
        phase_id, unit_id, uid, unit_role, sequence_order,
        is_critical, planned_start_offset_days, planned_duration_days,
        dependency_within_phase, status, created_by
      } = unit;

      if (!phase_id || !unit_id || !uid) {
        await db.query('ROLLBACK');
        return res.status(400).json({ 
          error: "Each phase unit must have phase_id, unit_id, and uid" 
        });
      }

      if (status && !VALID_STATUSES.includes(status)) {
        await db.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}` 
        });
      }

      const result = await db.query(
        `INSERT INTO phase_units (
          phase_id, unit_id, uid, unit_role, sequence_order, is_critical,
          planned_start_offset_days, planned_duration_days, dependency_within_phase,
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [
          phase_id, unit_id, uid, unit_role || null, sequence_order || null,
          is_critical !== undefined ? is_critical : false,
          planned_start_offset_days !== undefined ? planned_start_offset_days : 0,
          planned_duration_days || null, dependency_within_phase || null,
          status || 'Planned', created_by || null
        ]
      );

      createdUnits.push(result.rows[0]);
    }

    await db.query('COMMIT');
    res.status(201).json({ 
      message: `${createdUnits.length} phase units created successfully`,
      phase_units: createdUnits 
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Database transaction error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;