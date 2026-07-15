const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EnquiryRequirementPackageCustomise
 *   description: API for managing enquiry requirement package item choice customizations with SCD Type 2
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EnquiryRequirementPackageCustomise:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         package_id:
 *           type: integer
 *         enquiry_id:
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
 * /enquiry_requirement_package_customise:
 *   get:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Retrieve all current enquiry requirement package customizations
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
 *         name: enquiry_id
 *         schema:
 *           type: integer
 *         description: Filter by enquiry ID
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
 *         description: List of enquiry requirement package customizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnquiryRequirementPackageCustomise'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { include_history, package_id, enquiry_id, item_id, choice_status } = req.query;
  
  try {
    let query = `
      SELECT 
        erpc.*,
        p.package_name,
        e.client_name as enquiry_client_name,
        i.item_name,
        ic.item_material_type,
        emp1.first_name || ' ' || emp1.last_name as created_by_name,
        emp2.first_name || ' ' || emp2.last_name as updated_by_name
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN packages p ON erpc.package_id = p.id
      LEFT JOIN enquiries e ON erpc.enquiry_id = e.enquiry_id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic ON erpc.item_choice_id = ic.choice_option_id
      LEFT JOIN employees emp1 ON erpc.created_by = emp1.employee_id
      LEFT JOIN employees emp2 ON erpc.updated_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Add is_current filter if not including history
    if (!include_history || include_history === 'false') {
      query += ' AND erpc.is_current = true';
    }
    
    // Add other filters
    if (package_id) {
      query += ` AND erpc.package_id = $${++paramCount}`;
      params.push(package_id);
    }
    
    if (enquiry_id) {
      query += ` AND erpc.enquiry_id = $${++paramCount}`;
      params.push(enquiry_id);
    }
    
    if (item_id) {
      query += ` AND erpc.item_id = $${++paramCount}`;
      params.push(item_id);
    }
    
    if (choice_status !== undefined) {
      query += ` AND erpc.choice_status = $${++paramCount}`;
      params.push(choice_status);
    }
    
    query += ' ORDER BY erpc.id DESC, erpc.version DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enquiry requirement customizations:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch customizations', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   get:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Retrieve a specific enquiry requirement customization by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customization to retrieve
 *     responses:
 *       200:
 *         description: Enquiry requirement customization details
 *       404:
 *         description: Customization not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        erpc.*,
        p.package_name,
        e.client_name as enquiry_client_name,
        i.item_name,
        ic.item_material_type
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN packages p ON erpc.package_id = p.id
      LEFT JOIN enquiries e ON erpc.enquiry_id = e.enquiry_id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic ON erpc.item_choice_id = ic.choice_option_id
      WHERE erpc.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customization:', err.message);
    res.status(500).json({ error: 'Failed to fetch customization', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/history:
 *   get:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Get history for a specific package, item, and choice combination
 *     parameters:
 *       - in: query
 *         name: package_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: enquiry_id
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
  const { package_id, enquiry_id, item_id, item_choice_id } = req.query;
  
  if (!item_id || !item_choice_id) {
    return res.status(400).json({ 
      error: 'item_id and item_choice_id are required' 
    });
  }
  
  try {
    let query = `
      SELECT 
        erpc.*,
        p.package_name,
        e.client_name as enquiry_client_name,
        i.item_name,
        ic.item_material_type,
        emp1.first_name || ' ' || emp1.last_name as created_by_name,
        emp2.first_name || ' ' || emp2.last_name as updated_by_name
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN packages p ON erpc.package_id = p.id
      LEFT JOIN enquiries e ON erpc.enquiry_id = e.enquiry_id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic ON erpc.item_choice_id = ic.choice_option_id
      LEFT JOIN employees emp1 ON erpc.created_by = emp1.employee_id
      LEFT JOIN employees emp2 ON erpc.updated_by = emp2.employee_id
      WHERE erpc.item_id = $1 AND erpc.item_choice_id = $2
    `;
    
    const params = [item_id, item_choice_id];
    let paramCount = 2;
    
    if (package_id) {
      query += ` AND erpc.package_id = $${++paramCount}`;
      params.push(package_id);
    }
    
    if (enquiry_id) {
      query += ` AND erpc.enquiry_id = $${++paramCount}`;
      params.push(enquiry_id);
    }
    
    query += ' ORDER BY erpc.version DESC, erpc.effective_start_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch history', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise:
 *   post:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Create a new enquiry requirement customization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_id
 *               - item_choice_id
 *               - choice_status
 *               - created_by
 *             properties:
 *               package_id:
 *                 type: integer
 *               enquiry_id:
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
  const { package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by } = req.body;
  
  // Validate required fields
  if (!item_id || !item_choice_id || choice_status === undefined || !created_by) {
    return res.status(400).json({ 
      error: 'Required fields: item_id, item_choice_id, choice_status, created_by' 
    });
  }
  
  try {
    // Build check query based on provided IDs
    let checkQuery = `
      SELECT id FROM enquiry_requirement_package_item_choice_customise 
      WHERE item_id = $1 AND item_choice_id = $2 AND is_current = true
    `;
    const checkParams = [item_id, item_choice_id];
    let paramCount = 2;
    
    if (package_id) {
      checkQuery += ` AND package_id = $${++paramCount}`;
      checkParams.push(package_id);
    }
    
    if (enquiry_id) {
      checkQuery += ` AND enquiry_id = $${++paramCount}`;
      checkParams.push(enquiry_id);
    }
    
    const existingCheck = await db.query(checkQuery, checkParams);
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'A current record already exists for this combination. Use PUT to update.' 
      });
    }
    
    const result = await db.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise (
        package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customization:', err.message);
    if (err.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        error: 'Invalid reference: Check package_id, enquiry_id, item_id, item_choice_id, or created_by' 
      });
    }
    res.status(500).json({ error: 'Failed to create customization', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   put:
 *     tags: [EnquiryRequirementPackageCustomise]
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
      'SELECT * FROM enquiry_requirement_package_item_choice_customise WHERE id = $1 AND is_current = true',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Current customization not found' });
    }
    
    const currentRecord = checkResult.rows[0];
    
    // Check if the value is actually changing
    if (currentRecord.choice_status === choice_status) {
      return res.json({ 
        message: 'No change in choice_status', 
        data: currentRecord 
      });
    }
    
    // Start a transaction for SCD Type 2 update
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Close the current record
      await client.query(`
        UPDATE enquiry_requirement_package_item_choice_customise 
        SET 
          is_current = false,
          effective_end_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
      `, [updated_by, id]);
      
      // Insert new version
      const insertResult = await client.query(`
        INSERT INTO enquiry_requirement_package_item_choice_customise (
          package_id, enquiry_id, item_id, item_choice_id, choice_status, 
          version, created_by, effective_start_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        currentRecord.package_id,
        currentRecord.enquiry_id,
        currentRecord.item_id,
        currentRecord.item_choice_id,
        choice_status,
        currentRecord.version + 1,
        updated_by
      ]);
      
      await client.query('COMMIT');
      res.json(insertResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating customization:', err.message);
    res.status(500).json({ error: 'Failed to update customization', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   delete:
 *     tags: [EnquiryRequirementPackageCustomise]
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
      UPDATE enquiry_requirement_package_item_choice_customise
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
    res.status(500).json({ error: 'Failed to deactivate customization', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/bulk:
 *   post:
 *     tags: [EnquiryRequirementPackageCustomise]
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
 *               package_id:
 *                 type: integer
 *               enquiry_id:
 *                 type: integer
 *               customizations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
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
  const { package_id, enquiry_id, customizations, created_by } = req.body;
  
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
      const { item_id, item_choice_id, choice_status } = item;
      
      // Build check query
      let checkQuery = `
        SELECT id, choice_status FROM enquiry_requirement_package_item_choice_customise 
        WHERE item_id = $1 AND item_choice_id = $2 AND is_current = true
      `;
      const checkParams = [item_id, item_choice_id];
      let paramCount = 2;
      
      if (package_id) {
        checkQuery += ` AND package_id = $${++paramCount}`;
        checkParams.push(package_id);
      }
      
      if (enquiry_id) {
        checkQuery += ` AND enquiry_id = $${++paramCount}`;
        checkParams.push(enquiry_id);
      }
      
      const existingCheck = await client.query(checkQuery, checkParams);
      
      if (existingCheck.rows.length > 0) {
        // Update existing only if status changed
        if (existingCheck.rows[0].choice_status !== choice_status) {
          // Close current record
          await client.query(`
            UPDATE enquiry_requirement_package_item_choice_customise 
            SET 
              is_current = false,
              effective_end_date = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $1
            WHERE id = $2
          `, [created_by, existingCheck.rows[0].id]);
          
          // Insert new version
          const insertResult = await client.query(`
            INSERT INTO enquiry_requirement_package_item_choice_customise (
              package_id, enquiry_id, item_id, item_choice_id, choice_status, 
              version, created_by
            ) 
            SELECT 
              package_id, enquiry_id, item_id, item_choice_id, $1, 
              version + 1, $2
            FROM enquiry_requirement_package_item_choice_customise
            WHERE id = $3
            RETURNING id
          `, [choice_status, created_by, existingCheck.rows[0].id]);
          
          results.push({ action: 'updated', id: insertResult.rows[0].id });
        } else {
          results.push({ action: 'unchanged', id: existingCheck.rows[0].id });
        }
      } else {
        // Insert new
        const insertResult = await client.query(`
          INSERT INTO enquiry_requirement_package_item_choice_customise (
            package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by]);
        
        results.push({ action: 'created', id: insertResult.rows[0].id });
      }
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: 'Bulk operation completed successfully',
      processed: customizations.length,
      results: results
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in bulk operation:', err.message);
    res.status(500).json({ error: 'Failed to process bulk operation', details: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/summary:
 *   get:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Get summary of customizations
 *     parameters:
 *       - in: query
 *         name: package_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: enquiry_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary of customizations
 */
router.get('/summary', async (req, res) => {
  const db = req.db;
  const { package_id, enquiry_id } = req.query;
  
  try {
    let query = `
      SELECT 
        i.item_name,
        i.item_id,
        COUNT(CASE WHEN erpc.choice_status = true THEN 1 END) as active_choices,
        COUNT(CASE WHEN erpc.choice_status = false THEN 1 END) as inactive_choices,
        COUNT(DISTINCT erpc.item_choice_id) as total_choices
      FROM enquiry_requirement_package_item_choice_customise erpc
      JOIN items i ON erpc.item_id = i.item_id
      WHERE erpc.is_current = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (package_id) {
      query += ` AND erpc.package_id = $${++paramCount}`;
      params.push(package_id);
    }
    
    if (enquiry_id) {
      query += ` AND erpc.enquiry_id = $${++paramCount}`;
      params.push(enquiry_id);
    }
    
    query += ' GROUP BY i.item_id, i.item_name ORDER BY i.item_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary', details: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/by-enquiry/{enquiryId}:
 *   get:
 *     tags: [EnquiryRequirementPackageCustomise]
 *     description: Get all customizations for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of customizations for the enquiry
 */
router.get('/by-enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        erpc.*,
        p.package_name,
        i.item_name,
        ic.item_material_type,
        ic.unit_price
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN packages p ON erpc.package_id = p.id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic ON erpc.item_choice_id = ic.choice_option_id
      WHERE erpc.enquiry_id = $1 AND erpc.is_current = true
      ORDER BY p.package_name, i.item_name
    `, [enquiryId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enquiry customizations:', err.message);
    res.status(500).json({ error: 'Failed to fetch enquiry customizations', details: err.message });
  }
});

module.exports = router;