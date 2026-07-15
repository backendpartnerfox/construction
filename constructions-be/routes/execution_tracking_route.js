const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ExecutionTracking
 *   description: API for tracking project execution and work progress
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExecutionTracking:
 *       type: object
 *       required:
 *         - package_id
 *         - tracking_date
 *       properties:
 *         tracking_id:
 *           type: integer
 *           description: Unique identifier for the execution tracking record
 *           example: 1
 *         package_id:
 *           type: integer
 *           description: Reference to the work package being executed
 *           example: 1
 *         tracking_date:
 *           type: string
 *           format: date
 *           description: Date of tracking
 *           example: "2024-01-15"
 *         work_completed_today:
 *           type: string
 *           nullable: true
 *           description: Description of work completed today
 *           example: "Completed foundation concrete pouring for section A"
 *         cumulative_progress:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Cumulative progress percentage
 *           example: 75.50
 *         manpower_used:
 *           type: integer
 *           nullable: true
 *           description: Number of workers used
 *           example: 10
 *         equipment_hours:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Equipment hours used
 *           example: 8.5
 *         materials_consumed:
 *           type: string
 *           nullable: true
 *           description: Materials consumed during work
 *           example: "Cement: 50 bags, Steel: 200 kg"
 *         quality_checks_done:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           description: Array of quality checks performed
 *           example: ["Concrete slump test", "Steel reinforcement check"]
 *         defects_identified:
 *           type: integer
 *           default: 0
 *           description: Number of defects identified
 *           example: 2
 *         defects_rectified:
 *           type: integer
 *           default: 0
 *           description: Number of defects rectified
 *           example: 1
 *         weather_conditions:
 *           type: string
 *           nullable: true
 *           description: Weather conditions during work
 *           example: "Sunny"
 *         work_hours:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Total work hours
 *           example: 8.0
 *         issues_faced:
 *           type: string
 *           nullable: true
 *           description: Issues faced during execution
 *           example: "Delayed due to material shortage"
 *         decisions_required:
 *           type: string
 *           nullable: true
 *           description: Decisions required from management
 *           example: "Approval needed for design change"
 *         progress_photos:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           description: Array of photo paths
 *           example: ["/uploads/progress/photo1.jpg", "/uploads/progress/photo2.jpg"]
 *         recorded_by:
 *           type: integer
 *           nullable: true
 *           description: ID of user who recorded the entry
 *           example: 1
 *         recorded_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *           example: "2024-01-15T09:00:00Z"
 *     ExecutionTrackingCreate:
 *       type: object
 *       required:
 *         - package_id
 *         - tracking_date
 *       properties:
 *         package_id:
 *           type: integer
 *           description: Reference to the work package being executed
 *           example: 1
 *         tracking_date:
 *           type: string
 *           format: date
 *           description: Date of tracking
 *           example: "2024-01-15"
 *         work_completed_today:
 *           type: string
 *           description: Description of work completed today
 *           example: "Completed foundation concrete pouring for section A"
 *         cumulative_progress:
 *           type: number
 *           format: decimal
 *           description: Cumulative progress percentage
 *           example: 75.50
 *         manpower_used:
 *           type: integer
 *           description: Number of workers used
 *           example: 10
 *         equipment_hours:
 *           type: number
 *           format: decimal
 *           description: Equipment hours used
 *           example: 8.5
 *         materials_consumed:
 *           type: string
 *           description: Materials consumed during work
 *           example: "Cement: 50 bags, Steel: 200 kg"
 *         quality_checks_done:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of quality checks performed
 *           example: ["Concrete slump test", "Steel reinforcement check"]
 *         defects_identified:
 *           type: integer
 *           description: Number of defects identified
 *           example: 2
 *         defects_rectified:
 *           type: integer
 *           description: Number of defects rectified
 *           example: 1
 *         weather_conditions:
 *           type: string
 *           description: Weather conditions during work
 *           example: "Sunny"
 *         work_hours:
 *           type: number
 *           format: decimal
 *           description: Total work hours
 *           example: 8.0
 *         issues_faced:
 *           type: string
 *           description: Issues faced during execution
 *           example: "Delayed due to material shortage"
 *         decisions_required:
 *           type: string
 *           description: Decisions required from management
 *           example: "Approval needed for design change"
 *         progress_photos:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of photo paths
 *           example: ["/uploads/progress/photo1.jpg", "/uploads/progress/photo2.jpg"]
 *         recorded_by:
 *           type: integer
 *           description: ID of user who recorded the entry
 *           example: 1
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Execution tracking record not found"
 */

/**
 * @swagger
 * /execution_tracking:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Retrieve all execution tracking records
 *     description: Get a list of all execution tracking records with optional filtering
 *     parameters:
 *       - in: query
 *         name: package_id
 *         schema:
 *           type: integer
 *         description: Filter by work package ID
 *       - in: query
 *         name: tracking_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by tracking date
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter records from this date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter records to this date
 *       - in: query
 *         name: recorded_by
 *         schema:
 *           type: integer
 *         description: Filter by recorder ID
 *     responses:
 *       200:
 *         description: Successfully retrieved execution tracking records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExecutionTracking'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { package_id, tracking_date, from_date, to_date, recorded_by } = req.query;
  
  try {
    let query = `
      SELECT 
        et.*,
        wp.package_name,
        e.first_name || ' ' || e.last_name as recorder_name
      FROM execution_tracking et
      LEFT JOIN work_packages wp ON et.package_id = wp.package_id
      LEFT JOIN employees e ON et.recorded_by = e.employee_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (package_id) {
      paramCount++;
      query += ` AND et.package_id = $${paramCount}`;
      params.push(package_id);
    }

    if (tracking_date) {
      paramCount++;
      query += ` AND et.tracking_date = $${paramCount}`;
      params.push(tracking_date);
    }

    if (from_date) {
      paramCount++;
      query += ` AND et.tracking_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      query += ` AND et.tracking_date <= $${paramCount}`;
      params.push(to_date);
    }

    if (recorded_by) {
      paramCount++;
      query += ` AND et.recorded_by = $${paramCount}`;
      params.push(recorded_by);
    }

    query += ' ORDER BY et.tracking_date DESC, et.recorded_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch execution tracking records', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/{id}:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Retrieve a specific execution tracking record
 *     description: Get detailed information about a specific execution tracking record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the execution tracking record
 *     responses:
 *       200:
 *         description: Execution tracking record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExecutionTracking'
 *       404:
 *         description: Execution tracking record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        et.*,
        wp.package_name,
        e.first_name || ' ' || e.last_name as recorder_name
      FROM execution_tracking et
      LEFT JOIN work_packages wp ON et.package_id = wp.package_id
      LEFT JOIN employees e ON et.recorded_by = e.employee_id
      WHERE et.tracking_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution tracking record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch execution tracking record', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking:
 *   post:
 *     tags: [ExecutionTracking]
 *     summary: Create a new execution tracking record
 *     description: Create a new execution tracking record for work progress
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecutionTrackingCreate'
 *     responses:
 *       201:
 *         description: Execution tracking record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExecutionTracking'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    package_id,
    tracking_date,
    work_completed_today,
    cumulative_progress,
    manpower_used,
    equipment_hours,
    materials_consumed,
    quality_checks_done,
    defects_identified,
    defects_rectified,
    weather_conditions,
    work_hours,
    issues_faced,
    decisions_required,
    progress_photos,
    recorded_by
  } = req.body;

  // Validation
  if (!package_id || !tracking_date) {
    return res.status(400).json({ 
      error: 'package_id and tracking_date are required' 
    });
  }

  try {
    // Check if a record already exists for this package and date
    const existingCheck = await db.query(
      'SELECT tracking_id FROM execution_tracking WHERE package_id = $1 AND tracking_date = $2',
      [package_id, tracking_date]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'A tracking record already exists for this package and date. Use PUT to update.' 
      });
    }

    const result = await db.query(
      `INSERT INTO execution_tracking (
        package_id, tracking_date, work_completed_today, cumulative_progress,
        manpower_used, equipment_hours, materials_consumed, quality_checks_done,
        defects_identified, defects_rectified, weather_conditions, work_hours,
        issues_faced, decisions_required, progress_photos, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        package_id, tracking_date, work_completed_today, cumulative_progress,
        manpower_used, equipment_hours, materials_consumed, 
        quality_checks_done ? `{${quality_checks_done.map(qc => `"${qc}"`).join(',')}}` : null,
        defects_identified || 0, defects_rectified || 0, weather_conditions, work_hours,
        issues_faced, decisions_required, 
        progress_photos ? `{${progress_photos.map(photo => `"${photo}"`).join(',')}}` : null,
        recorded_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    if (err.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        error: 'Invalid reference: Check package_id or recorded_by' 
      });
    }
    res.status(500).json({ error: 'Failed to create execution tracking record', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/{id}:
 *   put:
 *     tags: [ExecutionTracking]
 *     summary: Update an execution tracking record
 *     description: Update an existing execution tracking record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the execution tracking record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecutionTrackingCreate'
 *     responses:
 *       200:
 *         description: Execution tracking record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExecutionTracking'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Execution tracking record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    package_id,
    tracking_date,
    work_completed_today,
    cumulative_progress,
    manpower_used,
    equipment_hours,
    materials_consumed,
    quality_checks_done,
    defects_identified,
    defects_rectified,
    weather_conditions,
    work_hours,
    issues_faced,
    decisions_required,
    progress_photos,
    recorded_by
  } = req.body;

  // Validation
  if (!package_id || !tracking_date) {
    return res.status(400).json({ 
      error: 'package_id and tracking_date are required' 
    });
  }

  try {
    const result = await db.query(
      `UPDATE execution_tracking SET
        package_id = $1, tracking_date = $2, work_completed_today = $3,
        cumulative_progress = $4, manpower_used = $5, equipment_hours = $6,
        materials_consumed = $7, quality_checks_done = $8, defects_identified = $9,
        defects_rectified = $10, weather_conditions = $11, work_hours = $12,
        issues_faced = $13, decisions_required = $14, progress_photos = $15,
        recorded_by = $16
      WHERE tracking_id = $17
      RETURNING *`,
      [
        package_id, tracking_date, work_completed_today, cumulative_progress,
        manpower_used, equipment_hours, materials_consumed,
        quality_checks_done ? `{${quality_checks_done.map(qc => `"${qc}"`).join(',')}}` : null,
        defects_identified || 0, defects_rectified || 0, weather_conditions, work_hours,
        issues_faced, decisions_required,
        progress_photos ? `{${progress_photos.map(photo => `"${photo}"`).join(',')}}` : null,
        recorded_by, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution tracking record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    if (err.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        error: 'Invalid reference: Check package_id or recorded_by' 
      });
    }
    res.status(500).json({ error: 'Failed to update execution tracking record', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/{id}:
 *   delete:
 *     tags: [ExecutionTracking]
 *     summary: Delete an execution tracking record
 *     description: Delete an execution tracking record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the execution tracking record to delete
 *     responses:
 *       200:
 *         description: Execution tracking record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Execution tracking record deleted successfully"
 *       404:
 *         description: Execution tracking record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM execution_tracking WHERE tracking_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution tracking record not found' });
    }
    
    res.json({ message: 'Execution tracking record deleted successfully' });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Failed to delete execution tracking record', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/package/{package_id}:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Get execution tracking records for a work package
 *     description: Retrieve all execution tracking records for a specific work package
 *     parameters:
 *       - in: path
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work package
 *     responses:
 *       200:
 *         description: Successfully retrieved execution tracking records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExecutionTracking'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/package/:package_id', async (req, res) => {
  const db = req.db;
  const { package_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        et.*,
        e.first_name || ' ' || e.last_name as recorder_name
      FROM execution_tracking et
      LEFT JOIN employees e ON et.recorded_by = e.employee_id
      WHERE et.package_id = $1 
      ORDER BY et.tracking_date DESC
    `, [package_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch execution tracking records', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/progress-summary/{package_id}:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Get progress summary for a work package
 *     description: Get aggregated progress information for a specific work package
 *     parameters:
 *       - in: path
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work package
 *     responses:
 *       200:
 *         description: Progress summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 package_id:
 *                   type: integer
 *                   example: 1
 *                 total_records:
 *                   type: integer
 *                   example: 10
 *                 latest_progress:
 *                   type: number
 *                   example: 65.5
 *                 total_manpower_days:
 *                   type: integer
 *                   example: 50
 *                 total_equipment_hours:
 *                   type: number
 *                   example: 120.5
 *                 total_work_hours:
 *                   type: number
 *                   example: 400
 *                 total_defects_identified:
 *                   type: integer
 *                   example: 15
 *                 total_defects_rectified:
 *                   type: integer
 *                   example: 12
 *                 latest_tracking_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/progress-summary/:package_id', async (req, res) => {
  const db = req.db;
  const { package_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        package_id,
        COUNT(*) as total_records,
        MAX(cumulative_progress) as latest_progress,
        SUM(manpower_used) as total_manpower_days,
        SUM(equipment_hours) as total_equipment_hours,
        SUM(work_hours) as total_work_hours,
        SUM(defects_identified) as total_defects_identified,
        SUM(defects_rectified) as total_defects_rectified,
        MAX(tracking_date) as latest_tracking_date
      FROM execution_tracking
      WHERE package_id = $1
      GROUP BY package_id
    `, [package_id]);
    
    if (result.rows.length === 0) {
      return res.json({
        package_id: parseInt(package_id),
        total_records: 0,
        latest_progress: 0,
        total_manpower_days: 0,
        total_equipment_hours: 0,
        total_work_hours: 0,
        total_defects_identified: 0,
        total_defects_rectified: 0,
        latest_tracking_date: null
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch progress summary', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/defects-summary/{package_id}:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Get defects summary for a work package
 *     description: Get defects information for a specific work package
 *     parameters:
 *       - in: path
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work package
 *     responses:
 *       200:
 *         description: Defects summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 package_id:
 *                   type: integer
 *                 total_defects_identified:
 *                   type: integer
 *                 total_defects_rectified:
 *                   type: integer
 *                 pending_defects:
 *                   type: integer
 *                 rectification_rate:
 *                   type: number
 *       500:
 *         description: Internal server error
 */
router.get('/defects-summary/:package_id', async (req, res) => {
  const db = req.db;
  const { package_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        package_id,
        SUM(defects_identified) as total_defects_identified,
        SUM(defects_rectified) as total_defects_rectified,
        SUM(defects_identified) - SUM(defects_rectified) as pending_defects,
        CASE 
          WHEN SUM(defects_identified) > 0 
          THEN ROUND((SUM(defects_rectified)::numeric / SUM(defects_identified)::numeric) * 100, 2)
          ELSE 0 
        END as rectification_rate
      FROM execution_tracking
      WHERE package_id = $1
      GROUP BY package_id
    `, [package_id]);
    
    if (result.rows.length === 0) {
      return res.json({
        package_id: parseInt(package_id),
        total_defects_identified: 0,
        total_defects_rectified: 0,
        pending_defects: 0,
        rectification_rate: 0
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch defects summary', details: err.message });
  }
});

/**
 * @swagger
 * /execution_tracking/latest/{package_id}:
 *   get:
 *     tags: [ExecutionTracking]
 *     summary: Get latest execution tracking record for a package
 *     description: Retrieve the most recent execution tracking record for a specific work package
 *     parameters:
 *       - in: path
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work package
 *     responses:
 *       200:
 *         description: Latest execution tracking record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExecutionTracking'
 *       404:
 *         description: No tracking records found for this package
 *       500:
 *         description: Internal server error
 */
router.get('/latest/:package_id', async (req, res) => {
  const db = req.db;
  const { package_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        et.*,
        wp.package_name,
        e.first_name || ' ' || e.last_name as recorder_name
      FROM execution_tracking et
      LEFT JOIN work_packages wp ON et.package_id = wp.package_id
      LEFT JOIN employees e ON et.recorded_by = e.employee_id
      WHERE et.package_id = $1
      ORDER BY et.tracking_date DESC, et.recorded_at DESC
      LIMIT 1
    `, [package_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tracking records found for this package' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch latest tracking record', details: err.message });
  }
});

module.exports = router;