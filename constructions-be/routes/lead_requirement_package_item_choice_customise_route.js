const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Lead Requirement Package Item Choice Customise
 *   description: API for managing lead requirement package item choice customizations
 */

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise:
 *   get:
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     description: Retrieve all lead requirement package item choice customizations
 *     responses:
 *       200:
 *         description: List of lead requirement package item choice customizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   package_id:
 *                     type: integer
 *                   lead_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   item_choice_id:
 *                     type: integer
 *                   choice_status:
 *                     type: boolean
 *                   effective_start_date:
 *                     type: string
 *                     format: date-time
 *                   effective_end_date:
 *                     type: string
 *                     format: date-time
 *                   is_current:
 *                     type: boolean
 *                   version:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   updated_by:
 *                     type: integer
 */

// Get all lead requirement package item choice customizations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM lead_requirement_package_item_choice_customise ORDER BY id');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/{id}:
 *   get:
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     description: Retrieve a specific lead requirement package item choice customization by ID
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

// Get customization by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM lead_requirement_package_item_choice_customise WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement package item choice customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise:
 *   post:
 *     summary: Create a new lead requirement package item choice customization
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_id
 *               - item_choice_id
 *             properties:
 *               package_id:
 *                 type: integer
 *               lead_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *               choice_status:
 *                 type: boolean
 *               effective_start_date:
 *                 type: string
 *                 format: date-time
 *               effective_end_date:
 *                 type: string
 *                 format: date-time
 *               is_current:
 *                 type: boolean
 *               version:
 *                 type: integer
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customization created successfully
 *       400:
 *         description: Item ID and Item Choice ID are required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    package_id,
    lead_id,
    item_id,
    item_choice_id,
    choice_status,
    effective_start_date,
    effective_end_date,
    is_current,
    version,
    created_by
  } = req.body;

  if (!item_id || !item_choice_id) {
    return res.status(400).json({ error: "Item ID and Item Choice ID are required" });
  }

  try {
    const query = `
      INSERT INTO lead_requirement_package_item_choice_customise (
        package_id, lead_id, item_id, item_choice_id, choice_status,
        effective_start_date, effective_end_date, is_current, version, created_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      package_id,
      lead_id,
      item_id,
      item_choice_id,
      choice_status !== undefined ? choice_status : true,
      effective_start_date || new Date(),
      effective_end_date || '9999-12-31 23:59:59+05:30',
      is_current !== undefined ? is_current : true,
      version || 1,
      created_by
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/{id}:
 *   put:
 *     summary: Update an existing lead requirement package item choice customization by ID
 *     tags: [Lead Requirement Package Item Choice Customise]
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
 *             required:
 *               - item_id
 *               - item_choice_id
 *             properties:
 *               package_id:
 *                 type: integer
 *               lead_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *               choice_status:
 *                 type: boolean
 *               effective_start_date:
 *                 type: string
 *                 format: date-time
 *               effective_end_date:
 *                 type: string
 *                 format: date-time
 *               is_current:
 *                 type: boolean
 *               version:
 *                 type: integer
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Customization updated successfully
 *       400:
 *         description: Item ID and Item Choice ID are required
 *       404:
 *         description: Customization not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    package_id,
    lead_id,
    item_id,
    item_choice_id,
    choice_status,
    effective_start_date,
    effective_end_date,
    is_current,
    version,
    updated_by
  } = req.body;

  if (!item_id || !item_choice_id) {
    return res.status(400).json({ error: "Item ID and Item Choice ID are required" });
  }

  try {
    const query = `
      UPDATE lead_requirement_package_item_choice_customise 
      SET 
        package_id = $1,
        lead_id = $2,
        item_id = $3,
        item_choice_id = $4,
        choice_status = $5,
        effective_start_date = $6,
        effective_end_date = $7,
        is_current = $8,
        version = $9,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $10
      WHERE id = $11
      RETURNING *
    `;
    
    const values = [
      package_id,
      lead_id,
      item_id,
      item_choice_id,
      choice_status,
      effective_start_date,
      effective_end_date,
      is_current,
      version,
      updated_by,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement package item choice customization not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/{id}:
 *   delete:
 *     summary: Delete a lead requirement package item choice customization by ID
 *     tags: [Lead Requirement Package Item Choice Customise]
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
      "DELETE FROM lead_requirement_package_item_choice_customise WHERE id = $1 RETURNING id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement package item choice customization not found" });
    }
    
    res.json({ message: "Lead requirement package item choice customization deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/by-lead/{leadId}:
 *   get:
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     description: Retrieve customizations by lead ID
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The lead ID to retrieve customizations for
 *     responses:
 *       200:
 *         description: List of customizations for the specified lead
 *       500:
 *         description: Internal server error
 */
router.get('/by-lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM lead_requirement_package_item_choice_customise WHERE lead_id = $1 ORDER BY created_at DESC", 
      [leadId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/by-package/{packageId}:
 *   get:
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     description: Retrieve customizations by package ID
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The package ID to retrieve customizations for
 *     responses:
 *       200:
 *         description: List of customizations for the specified package
 *       500:
 *         description: Internal server error
 */
router.get('/by-package/:packageId', async (req, res) => {
  const db = req.db;
  const { packageId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM lead_requirement_package_item_choice_customise WHERE package_id = $1 ORDER BY created_at DESC", 
      [packageId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirement_package_item_choice_customise/current:
 *   get:
 *     tags: [Lead Requirement Package Item Choice Customise]
 *     description: Retrieve all current customizations
 *     responses:
 *       200:
 *         description: List of current customizations
 *       500:
 *         description: Internal server error
 */
router.get('/current', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM lead_requirement_package_item_choice_customise WHERE is_current = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// -----------------------------------------------------------------------
// Resolved customization view — used by the Sales "Customise Package" UI.
// Given a lead + package, returns every item in the package with:
//   - the package's default choice
//   - all alternative choices for that item (from item_choices)
//   - the currently-selected choice (customization override if any)
// -----------------------------------------------------------------------
router.get('/resolved/:leadId/:packageId', async (req, res) => {
  const { leadId, packageId } = req.params;
  try {
    const r = await req.db.query(
      `
      WITH package_items AS (
        SELECT pim.item_id, pim.item_choice_id AS default_choice_id
          FROM package_items_mapping pim
         WHERE pim.package_id = $2
      ),
      overrides AS (
        SELECT DISTINCT ON (item_id) item_id, item_choice_id AS overridden_choice_id
          FROM lead_requirement_package_item_choice_customise
         WHERE lead_id = $1 AND package_id = $2 AND is_current = TRUE
         ORDER BY item_id, created_at DESC
      )
      SELECT
        i.item_id,
        i.item_name,
        i.item_category,
        pi.default_choice_id,
        COALESCE(o.overridden_choice_id, pi.default_choice_id) AS current_choice_id,
        (o.overridden_choice_id IS NOT NULL) AS is_customised,
        json_agg(
          json_build_object(
            'choice_option_id', ic.choice_option_id,
            'display_name',     ic.display_name,
            'brand',            ic.brand,
            'series',           ic.series,
            'is_default',       (ic.choice_option_id = pi.default_choice_id)
          ) ORDER BY (ic.choice_option_id = pi.default_choice_id) DESC, ic.display_name
        ) AS available_choices
      FROM package_items pi
      JOIN items i          ON i.item_id = pi.item_id
      JOIN item_choices ic  ON ic.item_id = i.item_id
      LEFT JOIN overrides o ON o.item_id = i.item_id
      GROUP BY i.item_id, i.item_name, i.item_category, pi.default_choice_id, o.overridden_choice_id
      ORDER BY i.item_category, i.item_name;
      `,
      [leadId, packageId]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[lrpicc/resolved] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upsert an override for one item. Version-bumps by marking previous
// customizations for the same (lead, package, item) as is_current=false
// then inserting a fresh row.
router.post('/override', async (req, res) => {
  const { lead_id, package_id, item_id, item_choice_id } = req.body || {};
  if (!lead_id || !package_id || !item_id || !item_choice_id) {
    return res.status(400).json({ error: 'lead_id, package_id, item_id, item_choice_id are required' });
  }
  try {
    await req.db.query('BEGIN');
    await req.db.query(
      `UPDATE lead_requirement_package_item_choice_customise
          SET is_current = FALSE, effective_end_date = CURRENT_TIMESTAMP
        WHERE lead_id = $1 AND package_id = $2 AND item_id = $3 AND is_current = TRUE`,
      [lead_id, package_id, item_id]
    );
    const versionRes = await req.db.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM lead_requirement_package_item_choice_customise
        WHERE lead_id = $1 AND package_id = $2 AND item_id = $3`,
      [lead_id, package_id, item_id]
    );
    const nextVersion = versionRes.rows[0].next_version;
    const r = await req.db.query(
      `INSERT INTO lead_requirement_package_item_choice_customise
         (package_id, lead_id, item_id, item_choice_id, is_current, version, created_by)
       VALUES ($1, $2, $3, $4, TRUE, $5, $6)
       RETURNING *`,
      [package_id, lead_id, item_id, item_choice_id, nextVersion, req.user?.id || null]
    );
    await req.db.query('COMMIT');
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    await req.db.query('ROLLBACK').catch(() => {});
    console.error('[lrpicc/override] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revert an item back to package default (marks any current override as
// non-current — no new row inserted).
router.post('/revert', async (req, res) => {
  const { lead_id, package_id, item_id } = req.body || {};
  if (!lead_id || !package_id || !item_id) {
    return res.status(400).json({ error: 'lead_id, package_id, item_id are required' });
  }
  try {
    const r = await req.db.query(
      `UPDATE lead_requirement_package_item_choice_customise
          SET is_current = FALSE, effective_end_date = CURRENT_TIMESTAMP
        WHERE lead_id = $1 AND package_id = $2 AND item_id = $3 AND is_current = TRUE
        RETURNING id`,
      [lead_id, package_id, item_id]
    );
    res.json({ success: true, reverted: r.rowCount });
  } catch (err) {
    console.error('[lrpicc/revert] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;