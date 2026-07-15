const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LeadRequirementPackageCustomise
 *   description: API for managing lead requirement package item choice customizations with SCD Type 2
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeadRequirementPackageCustomise:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         package_id:
 *           type: integer
 *         item_id:
 *           type: integer
 *         item_choice_id:
 *           type: integer
 *         choice_status:
 *           type: boolean
 *         effective_start_date:
 *           type: string
 *           format: date-time
 *         effective_end_date:
 *           type: string
 *           format: date-time
 *         is_current:
 *           type: boolean
 *         version:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: integer
 *         updated_at:
 *           type: string
 *           format: date-time
 *         updated_by:
 *           type: integer
 */

/**
 * @swagger
 * /lead_requirement_package_customise:
 *   get:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Retrieve all current lead requirement package customizations
 *     parameters:
 *       - in: query
 *         name: include_history
 *         schema:
 *           type: boolean
 *         description: Include historical records (default false)
 *       - in: query
 *         name: package_id
 *         schema:
 *           type: integer
 *         description: Filter by package ID
 *       - in: query
 *         name: item_id
 *         schema:
 *           type: integer
 *         description: Filter by item ID
 *       - in: query
 *         name: choice_status
 *         schema:
 *           type: boolean
 *         description: Filter by choice status
 *     responses:
 *       200:
 *         description: List of lead requirement package customizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadRequirementPackageCustomise'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { include_history, package_id, item_id, choice_status } = req.query;
  
  try {
    let query = `
      SELECT 
        lrpc.*,
        p.package_name,
        i.item_name,
        ic.item_material_type,
        e1.first_name || ' ' || e1.last_name as created_by_name,
        e2.first_name || ' ' || e2.last_name as updated_by_name
      FROM lead_requirement_package_item_choice_customise lrpc
      JOIN packages p ON lrpc.package_id = p.id
      JOIN items i ON lrpc.item_id = i.item_id
      JOIN item_choices ic ON lrpc.item_choice_id = ic.choice_option_id
      LEFT JOIN employees e1 ON lrpc.created_by = e1.employee_id
      LEFT JOIN employees e2 ON lrpc.updated_by = e2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Add is_current filter if not including history
    if (!include_history || include_history === 'false') {
      query += ' AND lrpc.is_current = true';
    }
    
    // Add other filters
    if (package_id) {
      query += ` AND lrpc.package_id = $${++paramCount}`;
      params.push(package_id);
    }
    
    if (item_id) {
      query += ` AND lrpc.item_id = $${++paramCount}`;
      params.push(item_id);
    }
    
    if (choice_status !== undefined) {
      query += ` AND lrpc.choice_status = $${++paramCount}`;
      params.push(choice_status);
    }
    
    query += ' ORDER BY lrpc.package_id, lrpc.item_id, lrpc.version DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lead requirement customizations:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/{id}:
 *   get:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Retrieve a specific lead requirement customization by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customization to retrieve
 *     responses:
 *       200:
 *         description: Lead requirement customization details
 *       404:
 *         description: Customization not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        lrpc.*,
        p.package_name,
        i.item_name,
        ic.item_material_type
      FROM lead_requirement_package_item_choice_customise lrpc
      JOIN packages p ON lrpc.package_id = p.id
      JOIN items i ON lrpc.item_id = i.item_id
      JOIN item_choices ic ON lrpc.item_choice_id = ic.choice_option_id
      WHERE lrpc.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customization:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/history:
 *   get:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Get history for a specific package, item, and choice combination
 *     parameters:
 *       - in: query
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: item_choice_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: History of changes for the specified combination
 *       400:
 *         description: Missing required parameters
 */
router.get('/history', async (req, res) => {
  const db = req.db;
  const { package_id, item_id, item_choice_id } = req.query;
  
  if (!package_id || !item_id || !item_choice_id) {
    return res.status(400).json({ 
      error: 'package_id, item_id, and item_choice_id are required' 
    });
  }
  
  try {
    const result = await db.query(
      'SELECT * FROM get_lead_req_choice_customise_history($1, $2, $3)',
      [package_id, item_id, item_choice_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise:
 *   post:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Create a new lead requirement customization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *               - item_id
 *               - item_choice_id
 *               - choice_status
 *               - created_by
 *             properties:
 *               package_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *               choice_status:
 *                 type: boolean
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customization created successfully
 *       400:
 *         description: Invalid input or duplicate entry
 *       404:
 *         description: Referenced entity not found
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { package_id, item_id, item_choice_id, choice_status, created_by } = req.body;
  
  // Validate required fields
  if (!package_id || !item_id || !item_choice_id || choice_status === undefined || !created_by) {
    return res.status(400).json({ 
      error: 'Required fields: package_id, item_id, item_choice_id, choice_status, created_by' 
    });
  }
  
  try {
    // Check if a current record already exists
    const existingCheck = await db.query(`
      SELECT id FROM lead_requirement_package_item_choice_customise 
      WHERE package_id = $1 AND item_id = $2 AND item_choice_id = $3 AND is_current = true
    `, [package_id, item_id, item_choice_id]);
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'A current record already exists for this combination. Use PUT to update.' 
      });
    }
    
    const result = await db.query(`
      INSERT INTO lead_requirement_package_item_choice_customise (
        package_id, item_id, item_choice_id, choice_status, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [package_id, item_id, item_choice_id, choice_status, created_by]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customization:', err.message);
    if (err.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        error: 'Invalid reference: Check package_id, item_id, item_choice_id, or created_by' 
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/{id}:
 *   put:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Update choice_status (triggers SCD Type 2 versioning)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choice_status
 *               - updated_by
 *             properties:
 *               choice_status:
 *                 type: boolean
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Customization updated (new version created)
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customization not found or not current
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { choice_status, updated_by } = req.body;
  
  if (choice_status === undefined || !updated_by) {
    return res.status(400).json({ 
      error: 'choice_status and updated_by are required' 
    });
  }
  
  try {
    // Check if record exists and is current
    const checkResult = await db.query(
      'SELECT * FROM lead_requirement_package_item_choice_customise WHERE id = $1 AND is_current = true',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Current customization not found' });
    }
    
    // Update will trigger the SCD Type 2 trigger
    await db.query(`
      UPDATE lead_requirement_package_item_choice_customise 
      SET choice_status = $1, updated_by = $2
      WHERE id = $3
    `, [choice_status, updated_by, id]);
    
    // Fetch the newly created version
    const result = await db.query(`
      SELECT * FROM lead_requirement_package_item_choice_customise
      WHERE package_id = $1 AND item_id = $2 AND item_choice_id = $3 AND is_current = true
    `, [checkResult.rows[0].package_id, checkResult.rows[0].item_id, checkResult.rows[0].item_choice_id]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customization:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/{id}:
 *   delete:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Soft delete by setting is_current to false and closing the record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: updated_by
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customization deactivated
 *       404:
 *         description: Customization not found
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { updated_by } = req.query;
  
  if (!updated_by) {
    return res.status(400).json({ error: 'updated_by is required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE lead_requirement_package_item_choice_customise
      SET 
        is_current = false,
        effective_end_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE id = $2 AND is_current = true
      RETURNING *
    `, [updated_by, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active customization not found' });
    }
    
    res.json({ 
      message: 'Customization deactivated successfully',
      data: result.rows[0] 
    });
  } catch (err) {
    console.error('Error deactivating customization:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/bulk:
 *   post:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Bulk create or update multiple customizations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customizations
 *               - created_by
 *             properties:
 *               customizations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     package_id:
 *                       type: integer
 *                     item_id:
 *                       type: integer
 *                     item_choice_id:
 *                       type: integer
 *                     choice_status:
 *                       type: boolean
 *               created_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Bulk operation completed
 *       400:
 *         description: Invalid input
 */
router.post('/bulk', async (req, res) => {
  const db = req.db;
  const { customizations, created_by } = req.body;
  
  if (!customizations || !Array.isArray(customizations) || !created_by) {
    return res.status(400).json({ 
      error: 'customizations array and created_by are required' 
    });
  }
  
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const item of customizations) {
      const { package_id, item_id, item_choice_id, choice_status } = item;
      
      // Check if exists
      const existingCheck = await client.query(`
        SELECT id FROM lead_requirement_package_item_choice_customise 
        WHERE package_id = $1 AND item_id = $2 AND item_choice_id = $3 AND is_current = true
      `, [package_id, item_id, item_choice_id]);
      
      if (existingCheck.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE lead_requirement_package_item_choice_customise 
          SET choice_status = $1, updated_by = $2
          WHERE id = $3
        `, [choice_status, created_by, existingCheck.rows[0].id]);
      } else {
        // Insert new
        const insertResult = await client.query(`
          INSERT INTO lead_requirement_package_item_choice_customise (
            package_id, item_id, item_choice_id, choice_status, created_by
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [package_id, item_id, item_choice_id, choice_status, created_by]);
        
        results.push(insertResult.rows[0]);
      }
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: 'Bulk operation completed successfully',
      processed: customizations.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in bulk operation:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/summary/{packageId}:
 *   get:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Get summary of customizations for a package
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary of customizations
 */
router.get('/summary/:packageId', async (req, res) => {
  const db = req.db;
  const { packageId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        i.item_name,
        COUNT(CASE WHEN lrpc.choice_status = true THEN 1 END) as active_choices,
        COUNT(CASE WHEN lrpc.choice_status = false THEN 1 END) as inactive_choices,
        COUNT(DISTINCT lrpc.item_choice_id) as total_choices
      FROM lead_requirement_package_item_choice_customise lrpc
      JOIN items i ON lrpc.item_id = i.item_id
      WHERE lrpc.package_id = $1 AND lrpc.is_current = true
      GROUP BY i.item_id, i.item_name
      ORDER BY i.item_name
    `, [packageId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /lead_requirement_package_customise/compare:
 *   get:
 *     tags: [LeadRequirementPackageCustomise]
 *     description: Compare customizations between two versions
 *     parameters:
 *       - in: query
 *         name: package_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: version1
 *         schema:
 *           type: integer
 *         description: First version to compare (defaults to earliest)
 *       - in: query
 *         name: version2
 *         schema:
 *           type: integer
 *         description: Second version to compare (defaults to latest)
 *     responses:
 *       200:
 *         description: Comparison results
 */
router.get('/compare', async (req, res) => {
  const db = req.db;
  const { package_id, version1, version2 } = req.query;
  
  if (!package_id) {
    return res.status(400).json({ error: 'package_id is required' });
  }
  
  try {
    const result = await db.query(`
      WITH version_data AS (
        SELECT 
          lrpc.item_id,
          lrpc.item_choice_id,
          lrpc.choice_status,
          lrpc.version,
          i.item_name,
          ic.item_material_type
        FROM lead_requirement_package_item_choice_customise lrpc
        JOIN items i ON lrpc.item_id = i.item_id
        JOIN item_choices ic ON lrpc.item_choice_id = ic.choice_option_id
        WHERE lrpc.package_id = $1
          AND (lrpc.version = $2 OR lrpc.version = $3 
               OR ($2 IS NULL AND lrpc.version = (SELECT MIN(version) FROM lead_requirement_package_item_choice_customise WHERE package_id = $1))
               OR ($3 IS NULL AND lrpc.version = (SELECT MAX(version) FROM lead_requirement_package_item_choice_customise WHERE package_id = $1)))
      )
      SELECT 
        COALESCE(v1.item_name, v2.item_name) as item_name,
        COALESCE(v1.item_material_type, v2.item_material_type) as item_material_type,
        v1.choice_status as version1_status,
        v2.choice_status as version2_status,
        CASE 
          WHEN v1.choice_status IS NULL THEN 'added'
          WHEN v2.choice_status IS NULL THEN 'removed'
          WHEN v1.choice_status != v2.choice_status THEN 'changed'
          ELSE 'unchanged'
        END as change_type
      FROM version_data v1
      FULL OUTER JOIN version_data v2 
        ON v1.item_id = v2.item_id 
        AND v1.item_choice_id = v2.item_choice_id 
        AND v1.version < v2.version
      WHERE v1.version != v2.version OR v1.version IS NULL OR v2.version IS NULL
      ORDER BY item_name, item_material_type
    `, [package_id, version1, version2]);
    
    res.json({
      package_id,
      version1: version1 || 'earliest',
      version2: version2 || 'latest',
      changes: result.rows
    });
  } catch (err) {
    console.error('Error comparing versions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;