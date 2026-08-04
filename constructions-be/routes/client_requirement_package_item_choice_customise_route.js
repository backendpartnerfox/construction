const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Requirement Package Item Choice Customise
 *   description: Auto-generated API docs for Client Requirement Package Item Choice Customise
 */


const SELECT_FIELDS = `
  crpic.*,
  i.item_name,
  i.item_category,
  ic.display_name as choice_name,
  ic.brand,
  ic.series,
  ic.description as choice_description
`;

const BASE_FROM = `
  FROM client_requirement_package_item_choice_customise crpic
  LEFT JOIN items i ON crpic.item_id = i.item_id
  LEFT JOIN item_choices ic ON crpic.item_choice_id = ic.choice_option_id
`;

// GET all
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} ORDER BY crpic.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[crpic list] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by client
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/client/{clientId}:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/client/{clientId}
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE crpic.client_id = $1 ORDER BY crpic.created_at DESC`,
      [req.params.clientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[crpic byClient] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by project
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/project/{projectId}:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/project/{projectId}
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE crpic.project_id = $1 ORDER BY crpic.created_at DESC`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[crpic byProject] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by package
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/package/{packageId}:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/package/{packageId}
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/package/:packageId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE crpic.package_id = $1 ORDER BY crpic.created_at DESC`,
      [req.params.packageId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[crpic byPackage] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by item
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/item/{itemId}:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/item/{itemId}
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/item/:itemId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE crpic.item_id = $1 ORDER BY crpic.created_at DESC`,
      [req.params.itemId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[crpic byItem] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by id
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/{id}:
 *   get:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: GET /client_requirement_package_item_choice_customise/{id}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE crpic.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[crpic byId] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST create
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/:
 *   post:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: POST /client_requirement_package_item_choice_customise/
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  const d = req.body || {};
  if (!d.item_id || !d.item_choice_id) {
    return res.status(400).json({ error: 'item_id and item_choice_id are required' });
  }
  try {
    const result = await req.db.query(
      `INSERT INTO client_requirement_package_item_choice_customise
         (package_id, client_id, project_id, item_id, item_choice_id, choice_status, created_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true), $7)
       RETURNING *`,
      [d.package_id, d.client_id, d.project_id, d.item_id, d.item_choice_id, d.choice_status, d.created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[crpic create] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/{id}:
 *   put:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: PUT /client_requirement_package_item_choice_customise/{id}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  const d = req.body || {};
  try {
    const result = await req.db.query(
      `UPDATE client_requirement_package_item_choice_customise
          SET package_id     = COALESCE($1, package_id),
              client_id      = COALESCE($2, client_id),
              project_id     = COALESCE($3, project_id),
              item_id        = COALESCE($4, item_id),
              item_choice_id = COALESCE($5, item_choice_id),
              choice_status  = COALESCE($6, choice_status),
              updated_by     = COALESCE($7, updated_by),
              updated_at     = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *`,
      [d.package_id, d.client_id, d.project_id, d.item_id, d.item_choice_id, d.choice_status, d.updated_by, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[crpic update] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
/**
 * @swagger
 * /client_requirement_package_item_choice_customise/{id}:
 *   delete:
 *     tags: [Client Requirement Package Item Choice Customise]
 *     summary: DELETE /client_requirement_package_item_choice_customise/{id}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await req.db.query(
      'DELETE FROM client_requirement_package_item_choice_customise WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice customization not found' });
    }
    res.json({ message: 'Item choice customization deleted successfully' });
  } catch (err) {
    console.error('[crpic delete] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
