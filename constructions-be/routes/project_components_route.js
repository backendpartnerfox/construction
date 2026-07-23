const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Components
 *   description: API for managing project components (mapping components to projects)
 */

/**
 * @swagger
 * /project_components:
 *   get:
 *     tags: [Project Components]
 *     description: Retrieve all project components with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: floor_id
 *         schema:
 *           type: integer
 *         description: Filter by floor ID
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of project components
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Convenience: list all components attached to one project.
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  try {
    const r = await db.query(
      `SELECT * FROM project_components WHERE project_id = $1 ORDER BY component_id`,
      [projectId]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[project_components/project/:id] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor_id, category_id, is_active } = req.query;
  
  let query = '';
  const params = [];
  
  try {
    query = `
      SELECT 
        pc.*,
        p.project_name,
        p.project_code,
        cc.category_name,
        cc.category_code,
        pf.floor_name,
        pf.floor_number,
        cr.requirement_title,
        cr.project_title,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS architect_name
      FROM project_components pc
      LEFT JOIN projects p ON pc.project_id = p.project_id
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN client_requirements cr ON pc.client_requirement_id = cr.client_requirement_id
      LEFT JOIN employees emp ON pc.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pc.architect_assigned = emp2.employee_id
      WHERE 1=1
    `;
    
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor_id) {
      paramCount++;
      query += ` AND pc.floor_id = $${paramCount}`;
      params.push(floor_id);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND pc.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND pc.is_active = $${paramCount}`;
      params.push(is_active);
    }
    
    query += ' ORDER BY pc.project_id, pf.floor_number, pc.component_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    console.error('Query was:', query);
    console.error('Parameters were:', params);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/{id}:
 *   get:
 *     tags: [Project Components]
 *     description: Retrieve a specific project component by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project component to retrieve
 *     responses:
 *       200:
 *         description: Project component details
 *       404:
 *         description: Project component not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pc.*,
        p.project_name,
        p.project_code,
        cc.category_name,
        cc.category_code,
        pf.floor_name,
        pf.floor_number,
        cr.requirement_title,
        cr.project_title,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS architect_name
      FROM project_components pc
      LEFT JOIN projects p ON pc.project_id = p.project_id
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN client_requirements cr ON pc.client_requirement_id = cr.client_requirement_id
      LEFT JOIN employees emp ON pc.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pc.architect_assigned = emp2.employee_id
      WHERE pc.component_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project component not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components:
 *   post:
 *     summary: Create a new project component
 *     tags: [Project Components]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - category_id
 *               - component_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               client_requirement_id:
 *                 type: integer
 *               floor_id:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               component_code:
 *                 type: string
 *               component_name:
 *                 type: string
 *               total_area:
 *                 type: number
 *               specifications:
 *                 type: string
 *               status:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               requires_client_selection:
 *                 type: boolean
 *               architect_assigned:
 *                 type: integer
 *               design_status:
 *                 type: string
 *               drawings_uploaded:
 *                 type: boolean
 *               drawings_path:
 *                 type: string
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
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Project component created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Component already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, category_id, component_name, floor_id, component_code,
    total_area, specifications, estimated_cost, approved_cost,
    planned_start_date, planned_end_date, requires_client_selection, is_active,
    client_requirement_id
  } = req.body;

  console.log('Received:', req.body);

  if (!project_id || !category_id || !component_name) {
    return res.status(400).json({ error: "project_id, category_id, and component_name are required" });
  }

  try {
    // Get client requirement ID if not provided
    let clientReqId = client_requirement_id;
    if (!clientReqId) {
      const reqResult = await db.query(
        'SELECT client_requirement_id FROM client_requirements WHERE client_id = (SELECT client_id FROM projects WHERE project_id = $1) LIMIT 1',
        [parseInt(project_id)]
      );
      if (reqResult.rows.length > 0) {
        clientReqId = reqResult.rows[0].client_requirement_id;
      } else {
        return res.status(400).json({ error: "No client requirement found for this project" });
      }
    }

    // Check if component already exists
    const existingCheck = await db.query(
      'SELECT component_id FROM project_components WHERE project_id = $1 AND component_name = $2',
      [parseInt(project_id), component_name]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Component with this name already exists",
        existing_id: existingCheck.rows[0].component_id
      });
    }

    // Build dynamic INSERT query - MUST include client_requirement_id
    const fields = ['project_id', 'client_requirement_id', 'category_id', 'component_name', 'status', 'is_active'];
    const values = [
      parseInt(project_id),
      parseInt(clientReqId),
      parseInt(category_id),
      component_name,
      'Active',
      is_active === true || is_active === 'true'
    ];

    // Add optional fields
    if (floor_id) {
      fields.push('floor_id');
      values.push(parseInt(floor_id));
    }
    if (component_code) {
      fields.push('component_code');
      values.push(component_code);
    }
    if (total_area) {
      fields.push('total_area');
      values.push(parseFloat(total_area));
    }
    if (specifications) {
      fields.push('specifications');
      values.push(specifications);
    }
    if (estimated_cost) {
      fields.push('estimated_cost');
      values.push(parseFloat(estimated_cost));
    }
    if (approved_cost) {
      fields.push('approved_cost');
      values.push(parseFloat(approved_cost));
    }
    if (planned_start_date) {
      fields.push('planned_start_date');
      values.push(planned_start_date);
    }
    if (planned_end_date) {
      fields.push('planned_end_date');
      values.push(planned_end_date);
    }
    if (requires_client_selection !== undefined) {
      fields.push('requires_client_selection');
      values.push(requires_client_selection === true || requires_client_selection === 'true');
    }

    // Build placeholders - FIXED: Added $ sign
    const placeholders = values.map((_, i) => {
      // Use ::boolean cast for boolean fields
      if (fields[i] === 'is_active' || fields[i] === 'requires_client_selection') {
        return `$${i + 1}::boolean`;  // FIXED: Added $
      }
      return `$${i + 1}`;  // FIXED: Added $
    }).join(', ');

    const query = `
      INSERT INTO project_components (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    console.log('Query:', query);
    console.log('Values:', values);

    const result = await db.query(query, values);

    console.log('Success! Created component:', result.rows[0].component_id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/{id}:
 *   put:
 *     summary: Update a project component
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project component to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               floor_id:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               component_code:
 *                 type: string
 *               component_name:
 *                 type: string
 *               total_area:
 *                 type: number
 *               specifications:
 *                 type: string
 *               status:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               requires_client_selection:
 *                 type: boolean
 *               architect_assigned:
 *                 type: integer
 *               design_status:
 *                 type: string
 *               drawings_uploaded:
 *                 type: boolean
 *               drawings_path:
 *                 type: string
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
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Project component updated successfully
 *       404:
 *         description: Project component not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    // List of allowed fields to update
    const allowedFields = [
      'floor_id', 'category_id', 'component_code', 'component_name',
      'total_area', 'specifications', 'status', 'is_active',
      'requires_client_selection', 'architect_assigned', 'design_status',
      'drawings_uploaded', 'drawings_path', 'estimated_cost', 'approved_cost',
      'planned_start_date', 'planned_end_date', 'updated_by'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE project_components 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE component_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project component not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/{id}:
 *   delete:
 *     summary: Delete a project component
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project component to delete
 *     responses:
 *       200:
 *         description: Project component deleted successfully
 *       404:
 *         description: Project component not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_components WHERE component_id = $1 RETURNING component_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project component not found" });
    }

    res.json({ message: "Project component deleted successfully", deleted_id: result.rows[0].component_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/project/{projectId}/summary:
 *   get:
 *     summary: Get component summary for a project
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Component summary grouped by category
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cc.category_name,
        cc.category_code,
        COUNT(DISTINCT pc.component_id) as component_count,
        COUNT(DISTINCT pc.floor_id) as floor_count,
        SUM(pc.total_area) as total_area,
        SUM(pc.estimated_cost) as total_estimated_cost,
        SUM(pc.approved_cost) as total_approved_cost,
        array_agg(DISTINCT pf.floor_name) as floors,
        array_agg(DISTINCT pc.component_name) as components
      FROM project_components pc
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      WHERE pc.project_id = $1 AND pc.is_active = true
      GROUP BY cc.category_id, cc.category_name, cc.category_code
      ORDER BY cc.category_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/project/{projectId}/floor/{floorId}:
 *   get:
 *     summary: Get components for a specific floor
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: floorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Components for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floorId', async (req, res) => {
  const db = req.db;
  const { projectId, floorId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pc.*,
        cc.category_name,
        cc.category_code,
        pf.floor_name,
        pf.floor_number
      FROM project_components pc
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      WHERE pc.project_id = $1 AND pc.floor_id = $2 AND pc.is_active = true
      ORDER BY pc.component_name
    `, [projectId, floorId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/project/{projectId}/category/{categoryId}:
 *   get:
 *     summary: Get components for a specific category
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Components for the category
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/category/:categoryId', async (req, res) => {
  const db = req.db;
  const { projectId, categoryId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pc.*,
        cc.category_name,
        cc.category_code,
        pf.floor_name,
        pf.floor_number,
        cr.requirement_title,
        cr.project_title
      FROM project_components pc
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN client_requirements cr ON pc.client_requirement_id = cr.client_requirement_id
      WHERE pc.project_id = $1 AND pc.category_id = $2 AND pc.is_active = true
      ORDER BY pf.floor_number, pc.component_name
    `, [projectId, categoryId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/bulk-create:
 *   post:
 *     summary: Create multiple project components at once
 *     tags: [Project Components]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - components
 *             properties:
 *               project_id:
 *                 type: integer
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - category_id
 *                     - component_name
 *                   properties:
 *                     category_id:
 *                       type: integer
 *                     floor_id:
 *                       type: integer
 *                     component_name:
 *                       type: string
 *                     component_code:
 *                       type: string
 *                     total_area:
 *                       type: number
 *                     specifications:
 *                       type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Components created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-create', async (req, res) => {
  const db = req.db;
  const { project_id, components, created_by } = req.body;

  if (!project_id || !components || !Array.isArray(components) || components.length === 0) {
    return res.status(400).json({ error: "project_id and components array are required" });
  }

  try {
    const results = [];
    const errors = [];

    for (const component of components) {
      if (!component.category_id || !component.component_name) {
        errors.push({ 
          component, 
          error: "category_id and component_name are required for each component" 
        });
        continue;
      }

      try {
        // Check if component already exists
        const existingCheck = await db.query(
          'SELECT component_id FROM project_components WHERE project_id = $1 AND component_name = $2 AND COALESCE(floor_id, -1) = COALESCE($3, -1)',
          [project_id, component.component_name, component.floor_id]
        );

        if (existingCheck.rows.length > 0) {
          errors.push({ 
            component, 
            error: "Component already exists",
            existing_id: existingCheck.rows[0].component_id
          });
          continue;
        }

        const result = await db.query(
          `INSERT INTO project_components (
            project_id, category_id, floor_id, component_code,
            component_name, total_area, specifications, is_active,
            status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            project_id, 
            component.category_id,
            component.floor_id,
            component.component_code,
            component.component_name,
            component.total_area,
            component.specifications,
            component.is_active !== false,
            'Active',
            created_by
          ]
        );

        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({ component, error: err.message });
      }
    }

    res.status(201).json({
      message: `Created ${results.length} components successfully`,
      created: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_components/architect/{architectId}:
 *   get:
 *     summary: Get components assigned to a specific architect
 *     tags: [Project Components]
 *     parameters:
 *       - in: path
 *         name: architectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Architect ID
 *     responses:
 *       200:
 *         description: Components assigned to the architect
 *       500:
 *         description: Internal server error
 */
router.get('/architect/:architectId', async (req, res) => {
  const db = req.db;
  const { architectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pc.*,
        p.project_name,
        p.project_code,
        cc.category_name,
        pf.floor_name,
        pf.floor_number
      FROM project_components pc
      LEFT JOIN projects p ON pc.project_id = p.project_id
      LEFT JOIN component_categories cc ON pc.category_id = cc.category_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      WHERE pc.architect_assigned = $1 AND pc.is_active = true
      ORDER BY p.project_name, pf.floor_number, pc.component_name
    `, [architectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;