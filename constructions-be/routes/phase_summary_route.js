const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Phase Summary
 *   description: API for viewing project phase summaries (READ-ONLY VIEW)
 */

/**
 * @swagger
 * /phase-summary:
 *   get:
 *     tags: [Phase Summary]
 *     description: Retrieve all phase summaries with project information
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: phase_status
 *         schema:
 *           type: string
 *         description: Filter by phase status
 *       - in: query
 *         name: phase_type
 *         schema:
 *           type: string
 *         description: Filter by phase type
 *     responses:
 *       200:
 *         description: List of phase summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phase_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   phase_code:
 *                     type: string
 *                   phase_name:
 *                     type: string
 *                   phase_type:
 *                     type: string
 *                   phase_sequence:
 *                     type: integer
 *                   phase_status:
 *                     type: string
 *                   total_units_count:
 *                     type: integer
 *                   completion_percentage:
 *                     type: number
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   planned_duration_days:
 *                     type: integer
 *                   total_phase_cost:
 *                     type: number
 *                   total_material_cost:
 *                     type: number
 *                   total_labor_cost:
 *                     type: number
 *                   unit_names:
 *                     type: string
 *                   unit_uids:
 *                     type: string
 */

// Get all phase summaries
router.get('/phase-summary', async (req, res) => {
  const db = req.db;
  const { project_id, phase_status, phase_type } = req.query;
  
  try {
    let query = `
      SELECT ps.*, p.project_name, p.project_code
      FROM phase_summary ps
      LEFT JOIN projects p ON ps.project_id = p.project_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (project_id) {
      conditions.push(`ps.project_id = $${params.length + 1}`);
      params.push(project_id);
    }
    
    if (phase_status) {
      conditions.push(`ps.phase_status = $${params.length + 1}`);
      params.push(phase_status);
    }
    
    if (phase_type) {
      conditions.push(`ps.phase_type = $${params.length + 1}`);
      params.push(phase_type);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ps.project_id, ps.phase_sequence`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/phase/{phaseId}:
 *   get:
 *     tags: [Phase Summary]
 *     description: Retrieve phase summary by phase ID
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase
 *     responses:
 *       200:
 *         description: Phase summary details
 *       404:
 *         description: Phase summary not found
 *       500:
 *         description: Internal server error
 */

// Get phase summary by phase ID
router.get('/phase-summary/phase/:phaseId', async (req, res) => {
  const db = req.db;
  const { phaseId } = req.params;
  try {
    const result = await db.query(`
      SELECT ps.*, p.project_name, p.project_code
      FROM phase_summary ps
      LEFT JOIN projects p ON ps.project_id = p.project_id
      WHERE ps.phase_id = $1
    `, [phaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phase summary not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-summary/project/{projectId}:
 *   get:
 *     tags: [Phase Summary]
 *     description: Retrieve all phase summaries for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of phase summaries for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get phase summaries by project ID
router.get('/phase-summary/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT *
      FROM phase_summary
      WHERE project_id = $1
      ORDER BY phase_sequence
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/project/{projectId}/status/{status}:
 *   get:
 *     tags: [Phase Summary]
 *     description: Get phase summaries by project and status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The phase status
 *     responses:
 *       200:
 *         description: List of phase summaries with the specified status
 *       500:
 *         description: Internal server error
 */

// Get phase summaries by project and status
router.get('/phase-summary/project/:projectId/status/:status', async (req, res) => {
  const db = req.db;
  const { projectId, status } = req.params;
  
  try {
    const result = await db.query(`
      SELECT *
      FROM phase_summary
      WHERE project_id = $1 AND phase_status = $2
      ORDER BY phase_sequence
    `, [projectId, status]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/project/{projectId}/overview:
 *   get:
 *     tags: [Phase Summary]
 *     description: Get project phase overview with aggregated data
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project phase overview
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get project phase overview
router.get('/phase-summary/project/:projectId/overview', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_phases,
        SUM(total_units_count) as total_units,
        AVG(completion_percentage) as avg_completion_percentage,
        SUM(total_phase_cost) as total_project_cost,
        SUM(total_material_cost) as total_material_cost,
        SUM(total_labor_cost) as total_labor_cost,
        MIN(planned_start_date) as project_start_date,
        MAX(planned_end_date) as project_end_date,
        COUNT(CASE WHEN phase_status = 'Completed' THEN 1 END) as completed_phases,
        COUNT(CASE WHEN phase_status = 'In Progress' THEN 1 END) as in_progress_phases,
        COUNT(CASE WHEN phase_status = 'Planned' THEN 1 END) as planned_phases,
        COUNT(CASE WHEN phase_status = 'On Hold' THEN 1 END) as on_hold_phases
      FROM phase_summary 
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/refresh:
 *   post:
 *     summary: Refresh the phase summary view (if materialized)
 *     tags: [Phase Summary]
 *     responses:
 *       200:
 *         description: View refreshed successfully
 *       500:
 *         description: Internal server error
 */
router.post('/phase-summary/refresh', async (req, res) => {
  const db = req.db;

  try {
    // Check if it's a materialized view
    const viewCheck = await db.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'phase_summary'
    `);
    
    if (viewCheck.rows.length > 0) {
      // It's a materialized view, refresh it
      await db.query('REFRESH MATERIALIZED VIEW phase_summary');
      res.json({ message: 'Materialized view refreshed successfully' });
    } else {
      // It's a regular view, no refresh needed
      res.json({ message: 'This is a regular view, no refresh needed' });
    }
  } catch (err) {
    console.error('Database refresh error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-summary/search:
 *   get:
 *     tags: [Phase Summary]
 *     description: Search phase summaries by phase name or code
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for phase name or code
 *     responses:
 *       200:
 *         description: List of matching phase summaries
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
router.get('/phase-summary/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(`
      SELECT ps.*, p.project_name, p.project_code
      FROM phase_summary ps
      LEFT JOIN projects p ON ps.project_id = p.project_id
      WHERE ps.phase_name ILIKE $1 OR ps.phase_code ILIKE $1
      ORDER BY ps.project_id, ps.phase_sequence
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/statistics:
 *   get:
 *     tags: [Phase Summary]
 *     description: Get overall phase statistics across all projects
 *     responses:
 *       200:
 *         description: Phase statistics
 *       500:
 *         description: Internal server error
 */
router.get('/phase-summary/statistics', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT project_id) as total_projects,
        COUNT(*) as total_phases,
        SUM(total_units_count) as total_units,
        AVG(completion_percentage) as avg_completion_percentage,
        SUM(total_phase_cost) as total_all_projects_cost,
        COUNT(CASE WHEN phase_status = 'Completed' THEN 1 END) as completed_phases,
        COUNT(CASE WHEN phase_status = 'In Progress' THEN 1 END) as in_progress_phases,
        COUNT(CASE WHEN phase_status = 'Planned' THEN 1 END) as planned_phases,
        COUNT(CASE WHEN phase_status = 'On Hold' THEN 1 END) as on_hold_phases,
        COUNT(CASE WHEN phase_type = 'Foundation' THEN 1 END) as foundation_phases,
        COUNT(CASE WHEN phase_type = 'Structure' THEN 1 END) as structure_phases,
        COUNT(CASE WHEN phase_type = 'Finishing' THEN 1 END) as finishing_phases
      FROM phase_summary
    `);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/cost-analysis:
 *   get:
 *     tags: [Phase Summary]
 *     description: Get cost analysis breakdown by phase type
 *     responses:
 *       200:
 *         description: Cost analysis by phase type
 *       500:
 *         description: Internal server error
 */
router.get('/phase-summary/cost-analysis', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        phase_type,
        COUNT(*) as phase_count,
        SUM(total_phase_cost) as total_cost,
        SUM(total_material_cost) as material_cost,
        SUM(total_labor_cost) as labor_cost,
        AVG(total_phase_cost) as avg_phase_cost,
        CASE 
          WHEN SUM(total_phase_cost) > 0 
          THEN ROUND((SUM(total_material_cost) / SUM(total_phase_cost) * 100)::numeric, 2)
          ELSE 0 
        END as material_cost_percentage,
        CASE 
          WHEN SUM(total_phase_cost) > 0 
          THEN ROUND((SUM(total_labor_cost) / SUM(total_phase_cost) * 100)::numeric, 2)
          ELSE 0 
        END as labor_cost_percentage
      FROM phase_summary
      WHERE total_phase_cost > 0
      GROUP BY phase_type
      ORDER BY total_cost DESC
    `);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phase-summary/timeline/{projectId}:
 *   get:
 *     tags: [Phase Summary]
 *     description: Get project phase timeline
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Phase timeline for the project
 *       500:
 *         description: Internal server error
 */
router.get('/phase-summary/timeline/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        phase_id,
        phase_name,
        phase_code,
        phase_sequence,
        phase_status,
        planned_start_date,
        planned_end_date,
        planned_duration_days,
        completion_percentage,
        CASE 
          WHEN planned_start_date <= CURRENT_DATE 
            AND (planned_end_date IS NULL OR planned_end_date >= CURRENT_DATE)
            AND phase_status != 'Completed'
          THEN 'Active'
          WHEN planned_start_date > CURRENT_DATE 
          THEN 'Upcoming'
          WHEN planned_end_date < CURRENT_DATE AND phase_status != 'Completed'
          THEN 'Delayed'
          ELSE phase_status
        END as current_status
      FROM phase_summary
      WHERE project_id = $1
      ORDER BY phase_sequence
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Note: Since phase_summary is a VIEW, we cannot perform INSERT, UPDATE, or DELETE operations
// To modify phase data, use the appropriate endpoints for the underlying tables:
// - phases table for phase information
// - phase_units table for unit assignments
// - costing_boq table for cost details

module.exports = router;