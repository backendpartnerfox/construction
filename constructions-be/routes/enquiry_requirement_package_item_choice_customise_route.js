const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiry Requirement Package Item Choice Customise
 *   description: Auto-generated API docs for Enquiry Requirement Package Item Choice Customise
 */


const SELECT_FIELDS = `
  erpc.*,
  p.package_name,
  i.item_name,
  i.item_category,
  ic.display_name as choice_name,
  ic.brand,
  ic.series,
  ic.description as choice_description
`;

const BASE_FROM = `
  FROM enquiry_requirement_package_item_choice_customise erpc
  LEFT JOIN packages p ON erpc.package_id = p.id
  LEFT JOIN items i ON erpc.item_id = i.item_id
  LEFT JOIN item_choices ic ON erpc.item_choice_id = ic.choice_option_id
`;

// GET all
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/:
 *   get:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: GET /enquiry_requirement_package_item_choice_customise/
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
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} ORDER BY erpc.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[erpc list] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by enquiry
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/enquiry/{enquiryId}:
 *   get:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: GET /enquiry_requirement_package_item_choice_customise/enquiry/{enquiryId}
 *     parameters:
 *       - in: path
 *         name: enquiryId
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
router.get('/enquiry/:enquiryId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE erpc.enquiry_id = $1 ORDER BY erpc.created_at DESC`,
      [req.params.enquiryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[erpc byEnquiry] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by requirement (translates requirement_id -> enquiry_id via enquiry_requirements)
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/requirement/{requirementId}:
 *   get:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: GET /enquiry_requirement_package_item_choice_customise/requirement/{requirementId}
 *     parameters:
 *       - in: path
 *         name: requirementId
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
router.get('/requirement/:requirementId', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM}
         LEFT JOIN enquiry_requirements er ON erpc.enquiry_id = er.enquiry_id
        WHERE er.enquiry_requirement_id = $1
        ORDER BY erpc.created_at DESC`,
      [req.params.requirementId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[erpc byRequirement] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by package
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/package/{packageId}:
 *   get:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: GET /enquiry_requirement_package_item_choice_customise/package/{packageId}
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
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE erpc.package_id = $1 ORDER BY erpc.created_at DESC`,
      [req.params.packageId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[erpc byPackage] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET by id
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/{id}:
 *   get:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: GET /enquiry_requirement_package_item_choice_customise/{id}
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
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE erpc.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[erpc byId] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST create
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/:
 *   post:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: POST /enquiry_requirement_package_item_choice_customise/
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
      `INSERT INTO enquiry_requirement_package_item_choice_customise
         (package_id, enquiry_id, item_id, item_choice_id, choice_status, created_by)
       VALUES ($1, $2, $3, $4, COALESCE($5, true), $6)
       RETURNING *`,
      [d.package_id, d.enquiry_id, d.item_id, d.item_choice_id, d.choice_status, d.created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[erpc create] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/{id}:
 *   put:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: PUT /enquiry_requirement_package_item_choice_customise/{id}
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
      `UPDATE enquiry_requirement_package_item_choice_customise
          SET package_id     = COALESCE($1, package_id),
              enquiry_id     = COALESCE($2, enquiry_id),
              item_id        = COALESCE($3, item_id),
              item_choice_id = COALESCE($4, item_choice_id),
              choice_status  = COALESCE($5, choice_status),
              updated_by     = COALESCE($6, updated_by),
              updated_at     = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *`,
      [d.package_id, d.enquiry_id, d.item_id, d.item_choice_id, d.choice_status, d.updated_by, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[erpc update] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
/**
 * @swagger
 * /enquiry_requirement_package_item_choice_customise/{id}:
 *   delete:
 *     tags: [Enquiry Requirement Package Item Choice Customise]
 *     summary: DELETE /enquiry_requirement_package_item_choice_customise/{id}
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
      'DELETE FROM enquiry_requirement_package_item_choice_customise WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry customization not found' });
    }
    res.json({ message: 'Enquiry customization deleted successfully' });
  } catch (err) {
    console.error('[erpc delete] ', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
