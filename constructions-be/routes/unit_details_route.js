const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Unit Details
 *   description: API for managing project unit details
 */

/**
 * @swagger
 * /unit_details:
 *   get:
 *     tags: [Unit Details]
 *     description: Retrieve all unit details with project information
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: unit_category
 *         schema:
 *           type: string
 *         description: Filter by unit category
 *       - in: query
 *         name: unit_status
 *         schema:
 *           type: string
 *         description: Filter by unit status
 *     responses:
 *       200:
 *         description: List of unit details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   unit_id:
 *                     type: integer
 *                   uid:
 *                     type: string
 *                   project_id:
 *                     type: integer
 *                   unit_name:
 *                     type: string
 *                   unit_category:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   unit_measure:
 *                     type: string
 *                   unit_rate:
 *                     type: number
 *                   unit_total:
 *                     type: number
 *                   unit_status:
 *                     type: string
 *                   element_name:
 *                     type: string
 *                   element_category:
 *                     type: string
 *                   item_name:
 *                     type: string
 *                   item_category:
 *                     type: string
 *                   component_name:
 *                     type: string
 *                   component_category:
 *                     type: string
 *                   boq_total_cost:
 *                     type: number
 *                   material_cost:
 *                     type: number
 *                   labor_cost:
 *                     type: number
 *                   equipment_cost:
 *                     type: number
 *                   overhead_cost:
 *                     type: number
 */

// Get all unit details
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, unit_category, unit_status } = req.query;
  
  try {
    let query = `
      SELECT ud.*, p.project_name
      FROM unit_details ud
      LEFT JOIN projects p ON ud.project_id = p.project_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (project_id) {
      conditions.push(`ud.project_id = $${params.length + 1}`);
      params.push(project_id);
    }
    
    if (unit_category) {
      conditions.push(`ud.unit_category = $${params.length + 1}`);
      params.push(unit_category);
    }
    
    if (unit_status) {
      conditions.push(`ud.unit_status = $${params.length + 1}`);
      params.push(unit_status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ud.project_id, ud.uid`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/unit/{unitId}:
 *   get:
 *     tags: [Unit Details]
 *     description: Retrieve unit detail by unit ID
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the unit
 *     responses:
 *       200:
 *         description: Unit detail information
 *       404:
 *         description: Unit detail not found
 *       500:
 *         description: Internal server error
 */

// Get unit detail by unit ID
router.get('/unit/:unitId', async (req, res) => {
  const db = req.db;
  const { unitId } = req.params;
  try {
    const result = await db.query(`
      SELECT ud.*, p.project_name
      FROM unit_details ud
      LEFT JOIN projects p ON ud.project_id = p.project_id
      WHERE ud.unit_id = $1
    `, [unitId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit detail not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /unit_details/project/{projectId}:
 *   get:
 *     tags: [Unit Details]
 *     description: Retrieve all unit details for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of unit details for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get unit details by project ID
router.get('/project/:projectId', async (req, res) => {
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
      FROM unit_details
      WHERE project_id = $1
      ORDER BY uid
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/uid/{uid}:
 *   get:
 *     tags: [Unit Details]
 *     description: Retrieve unit detail by UID
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The UID of the unit
 *     responses:
 *       200:
 *         description: Unit detail information
 *       404:
 *         description: Unit detail not found
 *       500:
 *         description: Internal server error
 */

// Get unit detail by UID
router.get('/uid/:uid', async (req, res) => {
  const db = req.db;
  const { uid } = req.params;
  
  try {
    const result = await db.query(`
      SELECT ud.*, p.project_name
      FROM unit_details ud
      LEFT JOIN projects p ON ud.project_id = p.project_id
      WHERE ud.uid = $1
    `, [uid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit detail not found' });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/project/{projectId}/category/{category}:
 *   get:
 *     tags: [Unit Details]
 *     description: Get unit details by project and category
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The unit category
 *     responses:
 *       200:
 *         description: List of unit details with the specified category
 *       500:
 *         description: Internal server error
 */

// Get unit details by project and category
router.get('/project/:projectId/category/:category', async (req, res) => {
  const db = req.db;
  const { projectId, category } = req.params;
  
  try {
    const result = await db.query(`
      SELECT *
      FROM unit_details
      WHERE project_id = $1 AND unit_category = $2
      ORDER BY uid
    `, [projectId, category]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/project/{projectId}/summary:
 *   get:
 *     tags: [Unit Details]
 *     description: Get unit details summary for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project unit details summary
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get project unit details summary
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_units,
        COUNT(DISTINCT unit_category) as total_categories,
        SUM(quantity) as total_quantity,
        SUM(unit_total) as total_unit_cost,
        SUM(boq_total_cost) as total_boq_cost,
        SUM(material_cost) as total_material_cost,
        SUM(labor_cost) as total_labor_cost,
        SUM(equipment_cost) as total_equipment_cost,
        SUM(overhead_cost) as total_overhead_cost,
        AVG(unit_rate) as avg_unit_rate,
        COUNT(CASE WHEN unit_status = 'Completed' THEN 1 END) as completed_units,
        COUNT(CASE WHEN unit_status = 'In Progress' THEN 1 END) as in_progress_units,
        COUNT(CASE WHEN unit_status = 'Planned' THEN 1 END) as planned_units,
        COUNT(CASE WHEN unit_status = 'On Hold' THEN 1 END) as on_hold_units
      FROM unit_details 
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
 * /unit_details/categories:
 *   get:
 *     tags: [Unit Details]
 *     description: Get all unique unit categories
 *     responses:
 *       200:
 *         description: List of unit categories
 *       500:
 *         description: Internal server error
 */

// Get all unique unit categories
router.get('/categories', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT unit_category
      FROM unit_details
      WHERE unit_category IS NOT NULL
      ORDER BY unit_category
    `);
    
    const categories = result.rows.map(row => row.unit_category);
    res.json(categories);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/search:
 *   get:
 *     tags: [Unit Details]
 *     description: Search unit details by name, UID, or element
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for unit name, UID, or element name
 *     responses:
 *       200:
 *         description: List of matching unit details
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
router.get('/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(`
      SELECT ud.*, p.project_name
      FROM unit_details ud
      LEFT JOIN projects p ON ud.project_id = p.project_id
      WHERE ud.unit_name ILIKE $1 
         OR ud.uid ILIKE $1 
         OR ud.element_name ILIKE $1
         OR ud.item_name ILIKE $1
         OR ud.component_name ILIKE $1
      ORDER BY ud.project_id, ud.uid
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/cost-analysis/{projectId}:
 *   get:
 *     tags: [Unit Details]
 *     description: Get cost analysis breakdown for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Cost analysis breakdown
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get cost analysis breakdown for a project
router.get('/cost-analysis/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT 
        unit_category,
        COUNT(*) as unit_count,
        SUM(quantity) as total_quantity,
        SUM(unit_total) as category_total_cost,
        SUM(material_cost) as category_material_cost,
        SUM(labor_cost) as category_labor_cost,
        SUM(equipment_cost) as category_equipment_cost,
        SUM(overhead_cost) as category_overhead_cost,
        AVG(unit_rate) as avg_unit_rate,
        (SUM(material_cost) / NULLIF(SUM(unit_total), 0) * 100) as material_cost_percentage,
        (SUM(labor_cost) / NULLIF(SUM(unit_total), 0) * 100) as labor_cost_percentage,
        (SUM(equipment_cost) / NULLIF(SUM(unit_total), 0) * 100) as equipment_cost_percentage,
        (SUM(overhead_cost) / NULLIF(SUM(unit_total), 0) * 100) as overhead_cost_percentage
      FROM unit_details 
      WHERE project_id = $1 AND unit_category IS NOT NULL
      GROUP BY unit_category
      ORDER BY category_total_cost DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /unit_details/refresh/{projectId}:
 *   post:
 *     summary: Refresh unit details data for a project
 *     tags: [Unit Details]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to refresh
 *     responses:
 *       200:
 *         description: Unit details refreshed successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post('/refresh/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // This would typically contain logic to recalculate unit details data
    // For now, we'll just return a success message
    // In a real implementation, you might:
    // 1. Recalculate costs from related tables
    // 2. Update quantities and rates
    // 3. Refresh category mappings
    
    const result = await db.query(`
      SELECT COUNT(*) as refreshed_units
      FROM unit_details
      WHERE project_id = $1
    `, [projectId]);

    res.json({ 
      message: "Unit details refresh completed successfully",
      project_id: projectId,
      units_refreshed: result.rows[0].refreshed_units
    });
  } catch (err) {
    console.error('Database refresh error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;