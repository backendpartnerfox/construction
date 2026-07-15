const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Phase Cost Summary
 *   description: API for viewing phase-wise cost summaries (READ-ONLY VIEW)
 */

/**
 * @swagger
 * /phase-cost-summary:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Retrieve phase cost summary data from the view
 *     parameters:
 *       - in: query
 *         name: phase_id
 *         schema:
 *           type: integer
 *         description: Filter by phase ID
 *       - in: query
 *         name: phase_code
 *         schema:
 *           type: string
 *         description: Filter by phase code
 *     responses:
 *       200:
 *         description: List of phase cost summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phase_id:
 *                     type: integer
 *                   phase_name:
 *                     type: string
 *                   phase_code:
 *                     type: string
 *                   phase_sequence:
 *                     type: integer
 *                   planned_duration_days:
 *                     type: integer
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   total_units_count:
 *                     type: integer
 *                   costed_items:
 *                     type: integer
 *                   phase_material_cost:
 *                     type: number
 *                   phase_labor_cost:
 *                     type: number
 *                   phase_total_cost:
 *                     type: number
 *                   phase_total_with_gst:
 *                     type: number
 *                   milestone_payment_percentage:
 *                     type: number
 *                   milestone_payment:
 *                     type: number
 */
router.get('/phase-cost-summary', async (req, res) => {
  const db = req.db;
  const { phase_id, phase_code } = req.query;
  
  try {
    let query = `SELECT * FROM phase_cost_summary WHERE 1=1`;
    const params = [];
    let paramCount = 0;
    
    if (phase_id) {
      paramCount++;
      query += ` AND phase_id = $${paramCount}`;
      params.push(phase_id);
    }
    
    if (phase_code) {
      paramCount++;
      query += ` AND phase_code = $${paramCount}`;
      params.push(phase_code);
    }
    
    query += ' ORDER BY phase_sequence';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/{phaseId}:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Retrieve cost summary for a specific phase
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The phase ID
 *     responses:
 *       200:
 *         description: Phase cost summary details
 *       404:
 *         description: Phase not found in summary
 *       500:
 *         description: Internal server error
 */
router.get('/phase-cost-summary/:phaseId', async (req, res) => {
  const db = req.db;
  const { phaseId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM phase_cost_summary WHERE phase_id = $1',
      [phaseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phase not found in cost summary' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/total:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Get total cost summary across all phases
 *     responses:
 *       200:
 *         description: Total cost summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_phases:
 *                   type: integer
 *                 total_units:
 *                   type: integer
 *                 total_costed_items:
 *                   type: integer
 *                 total_material_cost:
 *                   type: number
 *                 total_labor_cost:
 *                   type: number
 *                 grand_total_cost:
 *                   type: number
 *                 grand_total_with_gst:
 *                   type: number
 *                 total_milestone_payment:
 *                   type: number
 *       500:
 *         description: Internal server error
 */
router.get('/phase-cost-summary/total', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_phases,
        SUM(total_units_count) as total_units,
        SUM(costed_items) as total_costed_items,
        SUM(phase_material_cost) as total_material_cost,
        SUM(phase_labor_cost) as total_labor_cost,
        SUM(phase_total_cost) as grand_total_cost,
        SUM(phase_total_with_gst) as grand_total_with_gst,
        SUM(milestone_payment) as total_milestone_payment
      FROM phase_cost_summary
    `);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/by-sequence:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Get phase costs grouped by sequence
 *     responses:
 *       200:
 *         description: Phases grouped by sequence with costs
 *       500:
 *         description: Internal server error
 */
router.get('/phase-cost-summary/by-sequence', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        phase_sequence,
        COUNT(*) as phase_count,
        array_agg(phase_name ORDER BY phase_name) as phases,
        SUM(phase_total_cost) as sequence_total_cost,
        SUM(phase_total_with_gst) as sequence_total_with_gst,
        AVG(milestone_payment_percentage) as avg_milestone_percentage,
        SUM(milestone_payment) as sequence_milestone_payment
      FROM phase_cost_summary
      GROUP BY phase_sequence
      ORDER BY phase_sequence
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/cost-breakdown:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Get material vs labor cost breakdown
 *     responses:
 *       200:
 *         description: Cost breakdown by type
 *       500:
 *         description: Internal server error
 */
router.get('/phase-cost-summary/cost-breakdown', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        phase_id,
        phase_name,
        phase_code,
        phase_material_cost,
        phase_labor_cost,
        phase_total_cost,
        CASE 
          WHEN phase_total_cost > 0 
          THEN ROUND((phase_material_cost / phase_total_cost * 100)::numeric, 2)
          ELSE 0 
        END as material_percentage,
        CASE 
          WHEN phase_total_cost > 0 
          THEN ROUND((phase_labor_cost / phase_total_cost * 100)::numeric, 2)
          ELSE 0 
        END as labor_percentage
      FROM phase_cost_summary
      ORDER BY phase_sequence
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/milestone-schedule:
 *   get:
 *     tags: [Phase Cost Summary]
 *     description: Get milestone payment schedule
 *     responses:
 *       200:
 *         description: Milestone payment schedule by phase
 *       500:
 *         description: Internal server error
 */
router.get('/phase-cost-summary/milestone-schedule', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        phase_sequence,
        phase_name,
        phase_code,
        planned_start_date,
        planned_end_date,
        phase_total_with_gst,
        milestone_payment_percentage,
        milestone_payment,
        SUM(milestone_payment) OVER (ORDER BY phase_sequence) as cumulative_payment
      FROM phase_cost_summary
      WHERE milestone_payment > 0
      ORDER BY phase_sequence
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phase-cost-summary/refresh:
 *   post:
 *     tags: [Phase Cost Summary]
 *     description: Refresh the materialized view (if needed)
 *     responses:
 *       200:
 *         description: View refreshed successfully
 *       500:
 *         description: Internal server error
 */
router.post('/phase-cost-summary/refresh', async (req, res) => {
  const db = req.db;
  
  try {
    // Check if it's a materialized view
    const viewCheck = await db.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'phase_cost_summary'
    `);
    
    if (viewCheck.rows.length > 0) {
      // It's a materialized view, refresh it
      await db.query('REFRESH MATERIALIZED VIEW phase_cost_summary');
      res.json({ message: 'Materialized view refreshed successfully' });
    } else {
      // It's a regular view, no refresh needed
      res.json({ message: 'This is a regular view, no refresh needed' });
    }
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Note: POST, PUT, DELETE operations are not available for VIEWs
// If you need to modify the underlying data, you should use the appropriate
// tables: phases, phase_units, costing_boq

module.exports = router;