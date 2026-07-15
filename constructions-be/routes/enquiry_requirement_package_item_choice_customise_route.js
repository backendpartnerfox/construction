const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiry Requirement Package Customization
 *   description: API for managing enquiry requirement package item choice customizations
 */

/**
 * @swagger
 * /enquiry_requirement_package_customise:
 *   get:
 *     tags: [Enquiry Requirement Package Customization]
 *     description: Retrieve all enquiry requirement package customizations
 *     parameters:
 *       - in: query
 *         name: enquiry_requirement_id
 *         schema:
 *           type: integer
 *         description: Filter by enquiry requirement ID
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
 *         name: is_upgraded
 *         schema:
 *           type: boolean
 *         description: Filter by upgrade status
 *     responses:
 *       200:
 *         description: List of enquiry requirement package customizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { enquiry_requirement_id, package_id, item_id, is_upgraded } = req.query;
  
  try {
    let query = `
      SELECT 
        erpc.*,
        er.requirement_title,
        e.contact_person_name,
        e.company_name,
        p.package_name,
        p.package_type,
        i.item_name,
        i.item_unit,
        ic_default.display_name as default_choice_name,
        ic_selected.display_name as selected_choice_name,
        emp.first_name || ' ' || emp.last_name AS customized_by_name
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN enquiry_requirements er ON erpc.enquiry_requirement_id = er.enquiry_requirement_id
      LEFT JOIN enquiries e ON er.enquiry_id = e.enquiry_id
      LEFT JOIN packages p ON erpc.package_id = p.package_id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic_default ON erpc.default_choice_id = ic_default.choice_option_id
      LEFT JOIN item_choices ic_selected ON erpc.selected_choice_id = ic_selected.choice_option_id
      LEFT JOIN employees emp ON erpc.customized_by = emp.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (enquiry_requirement_id) {
      paramCount++;
      query += ` AND erpc.enquiry_requirement_id = $${paramCount}`;
      params.push(enquiry_requirement_id);
    }
    
    if (package_id) {
      paramCount++;
      query += ` AND erpc.package_id = $${paramCount}`;
      params.push(package_id);
    }
    
    if (item_id) {
      paramCount++;
      query += ` AND erpc.item_id = $${paramCount}`;
      params.push(item_id);
    }
    
    if (is_upgraded !== undefined) {
      paramCount++;
      query += ` AND erpc.is_upgraded = $${paramCount}`;
      params.push(is_upgraded);
    }
    
    query += ' ORDER BY erpc.enquiry_requirement_id, i.item_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   get:
 *     tags: [Enquiry Requirement Package Customization]
 *     description: Retrieve a specific enquiry requirement package customization by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customization to retrieve
 *     responses:
 *       200:
 *         description: Customization details
 *       404:
 *         description: Customization not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        erpc.*,
        er.requirement_title,
        er.project_type,
        e.contact_person_name,
        e.company_name,
        e.primary_phone,
        p.package_name,
        p.package_type,
        i.item_name,
        i.item_unit,
        ic_default.display_name as default_choice_name,
        ic_selected.display_name as selected_choice_name,
        emp.first_name || ' ' || emp.last_name AS customized_by_name
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN enquiry_requirements er ON erpc.enquiry_requirement_id = er.enquiry_requirement_id
      LEFT JOIN enquiries e ON er.enquiry_id = e.enquiry_id
      LEFT JOIN packages p ON erpc.package_id = p.package_id
      LEFT JOIN items i ON erpc.item_id = i.item_id
      LEFT JOIN item_choices ic_default ON erpc.default_choice_id = ic_default.choice_option_id
      LEFT JOIN item_choices ic_selected ON erpc.selected_choice_id = ic_selected.choice_option_id
      LEFT JOIN employees emp ON erpc.customized_by = emp.employee_id
      WHERE erpc.customization_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise:
 *   post:
 *     summary: Create a new enquiry requirement package customization
 *     tags: [Enquiry Requirement Package Customization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_requirement_id
 *               - package_id
 *               - item_id
 *               - default_choice_id
 *               - selected_choice_id
 *             properties:
 *               enquiry_requirement_id:
 *                 type: integer
 *               package_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               default_choice_id:
 *                 type: integer
 *               selected_choice_id:
 *                 type: integer
 *               is_upgraded:
 *                 type: boolean
 *               upgrade_cost:
 *                 type: number
 *               customization_notes:
 *                 type: string
 *               customized_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customization created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Customization already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    enquiry_requirement_id,
    package_id,
    item_id,
    default_choice_id,
    selected_choice_id,
    is_upgraded,
    upgrade_cost,
    customization_notes,
    customized_by
  } = req.body;

  if (!enquiry_requirement_id || !package_id || !item_id || !default_choice_id || !selected_choice_id) {
    return res.status(400).json({ 
      error: "enquiry_requirement_id, package_id, item_id, default_choice_id, and selected_choice_id are required" 
    });
  }

  try {
    // Check if customization already exists
    const existingCheck = await db.query(
      'SELECT customization_id FROM enquiry_requirement_package_item_choice_customise WHERE enquiry_requirement_id = $1 AND package_id = $2 AND item_id = $3',
      [enquiry_requirement_id, package_id, item_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Customization already exists for this requirement, package, and item",
        existing_id: existingCheck.rows[0].customization_id
      });
    }

    // Determine if it's an upgrade
    const isUpgrade = is_upgraded !== undefined ? is_upgraded : (default_choice_id !== selected_choice_id);

    const result = await db.query(
      `INSERT INTO enquiry_requirement_package_item_choice_customise (
        enquiry_requirement_id, package_id, item_id, default_choice_id,
        selected_choice_id, is_upgraded, upgrade_cost, customization_notes,
        customized_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        enquiry_requirement_id, package_id, item_id, default_choice_id,
        selected_choice_id, isUpgrade, upgrade_cost || 0, customization_notes,
        customized_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   put:
 *     summary: Update an enquiry requirement package customization
 *     tags: [Enquiry Requirement Package Customization]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customization to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selected_choice_id:
 *                 type: integer
 *               is_upgraded:
 *                 type: boolean
 *               upgrade_cost:
 *                 type: number
 *               customization_notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Customization updated successfully
 *       404:
 *         description: Customization not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    // If selected_choice_id is being updated, recalculate is_upgraded
    if (updates.selected_choice_id !== undefined) {
      const currentData = await db.query(
        'SELECT default_choice_id FROM enquiry_requirement_package_item_choice_customise WHERE customization_id = $1',
        [id]
      );
      
      if (currentData.rows.length > 0) {
        updates.is_upgraded = currentData.rows[0].default_choice_id !== updates.selected_choice_id;
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && 
          key !== 'enquiry_requirement_id' && 
          key !== 'package_id' && 
          key !== 'item_id' &&
          key !== 'default_choice_id') {
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
      UPDATE enquiry_requirement_package_item_choice_customise 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE customization_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customization not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/{id}:
 *   delete:
 *     summary: Delete an enquiry requirement package customization
 *     tags: [Enquiry Requirement Package Customization]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customization to delete
 *     responses:
 *       200:
 *         description: Customization deleted successfully
 *       404:
 *         description: Customization not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM enquiry_requirement_package_item_choice_customise WHERE customization_id = $1 RETURNING customization_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customization not found" });
    }

    res.json({ message: "Customization deleted successfully", deleted_id: result.rows[0].customization_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/requirement/{requirementId}/summary:
 *   get:
 *     summary: Get customization summary for an enquiry requirement
 *     tags: [Enquiry Requirement Package Customization]
 *     parameters:
 *       - in: path
 *         name: requirementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enquiry requirement ID
 *     responses:
 *       200:
 *         description: Customization summary for the requirement
 *       500:
 *         description: Internal server error
 */
router.get('/requirement/:requirementId/summary', async (req, res) => {
  const db = req.db;
  const { requirementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_customizations,
        COUNT(CASE WHEN is_upgraded = true THEN 1 END) as upgraded_items,
        SUM(upgrade_cost) as total_upgrade_cost,
        array_agg(DISTINCT i.item_name) as customized_items
      FROM enquiry_requirement_package_item_choice_customise erpc
      LEFT JOIN items i ON erpc.item_id = i.item_id
      WHERE erpc.enquiry_requirement_id = $1
    `, [requirementId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirement_package_customise/bulk-create:
 *   post:
 *     summary: Create multiple enquiry requirement package customizations
 *     tags: [Enquiry Requirement Package Customization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_requirement_id
 *               - package_id
 *               - customizations
 *             properties:
 *               enquiry_requirement_id:
 *                 type: integer
 *               package_id:
 *                 type: integer
 *               customizations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_id
 *                     - default_choice_id
 *                     - selected_choice_id
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                     default_choice_id:
 *                       type: integer
 *                     selected_choice_id:
 *                       type: integer
 *                     upgrade_cost:
 *                       type: number
 *                     customization_notes:
 *                       type: string
 *               customized_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customizations created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-create', async (req, res) => {
  const db = req.db;
  const { enquiry_requirement_id, package_id, customizations, customized_by } = req.body;

  if (!enquiry_requirement_id || !package_id || !customizations || !Array.isArray(customizations) || customizations.length === 0) {
    return res.status(400).json({ 
      error: "enquiry_requirement_id, package_id, and customizations array are required" 
    });
  }

  try {
    const results = [];
    const errors = [];

    for (const customization of customizations) {
      if (!customization.item_id || !customization.default_choice_id || !customization.selected_choice_id) {
        errors.push({ 
          customization, 
          error: "item_id, default_choice_id, and selected_choice_id are required" 
        });
        continue;
      }

      try {
        const isUpgrade = customization.default_choice_id !== customization.selected_choice_id;

        const result = await db.query(
          `INSERT INTO enquiry_requirement_package_item_choice_customise (
            enquiry_requirement_id, package_id, item_id, default_choice_id,
            selected_choice_id, is_upgraded, upgrade_cost, customization_notes,
            customized_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (enquiry_requirement_id, package_id, item_id) DO NOTHING
          RETURNING *`,
          [
            enquiry_requirement_id, package_id, customization.item_id, 
            customization.default_choice_id, customization.selected_choice_id,
            isUpgrade, customization.upgrade_cost || 0, 
            customization.customization_notes, customized_by
          ]
        );

        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({ customization, error: err.message });
      }
    }

    res.status(201).json({
      message: `Created ${results.length} customizations successfully`,
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
 * /enquiry_requirement_package_customise/copy-to-lead:
 *   post:
 *     summary: Copy enquiry customizations to lead requirement
 *     tags: [Enquiry Requirement Package Customization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_requirement_id
 *               - lead_requirement_id
 *             properties:
 *               enquiry_requirement_id:
 *                 type: integer
 *               lead_requirement_id:
 *                 type: integer
 *               copied_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customizations copied successfully
 *       404:
 *         description: No customizations found to copy
 *       500:
 *         description: Internal server error
 */
router.post('/copy-to-lead', async (req, res) => {
  const db = req.db;
  const { enquiry_requirement_id, lead_requirement_id, copied_by } = req.body;

  if (!enquiry_requirement_id || !lead_requirement_id) {
    return res.status(400).json({ 
      error: "enquiry_requirement_id and lead_requirement_id are required" 
    });
  }

  try {
    // Get all customizations for the enquiry requirement
    const enquiryCustomizations = await db.query(
      `SELECT * FROM enquiry_requirement_package_item_choice_customise 
       WHERE enquiry_requirement_id = $1`,
      [enquiry_requirement_id]
    );

    if (enquiryCustomizations.rows.length === 0) {
      return res.status(404).json({ 
        error: "No customizations found for this enquiry requirement" 
      });
    }

    const copiedCount = enquiryCustomizations.rows.length;

    res.json({
      message: `${copiedCount} customizations ready to be copied to lead requirement`,
      enquiry_requirement_id,
      lead_requirement_id,
      customizations_count: copiedCount
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;