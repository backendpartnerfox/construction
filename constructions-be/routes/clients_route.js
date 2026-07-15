const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: API for managing construction clients
 */

/**
 * @swagger
 * /clients:
 *   get:
 *     tags: [Clients]
 *     description: Retrieve all clients from the clients table
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   client_id:
 *                     type: integer
 *                   client_name:
 *                     type: string
 *                   surname:
 *                     type: string
 *                   client_type:
 *                     type: string
 *                     enum: ['Individual', 'Company', 'Government', 'Institution']
 *                   primary_contact_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */

// Get all clients
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    // Correctly access the rows property from the query result
    const result = await db.query('SELECT * FROM clients');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /clients/search:
 *   get:
 *     tags: [Clients]
 *     description: Search clients by name, email, or phone
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for client name, email, or phone
 *     responses:
 *       200:
 *         description: List of clients matching the search criteria
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
    const result = await db.query(
      `SELECT * FROM clients 
       WHERE client_name ILIKE $1 
       OR email ILIKE $1 
       OR phone ILIKE $1`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /clients/active:
 *   get:
 *     tags: [Clients]
 *     description: Retrieve all active clients
 *     responses:
 *       200:
 *         description: List of active clients
 *       500:
 *         description: Internal server error
 */
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM clients WHERE is_active = true");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /clients/type/{clientType}:
 *   get:
 *     tags: [Clients]
 *     description: Retrieve clients by client type
 *     parameters:
 *       - in: path
 *         name: clientType
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['Individual', 'Company', 'Government', 'Institution']
 *         description: The type of clients to retrieve
 *     responses:
 *       200:
 *         description: List of clients of the specified type
 *       500:
 *         description: Internal server error
 */
router.get('/type/:clientType', async (req, res) => {
  const db = req.db;
  const { clientType } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM clients WHERE client_type = $1", 
      [clientType]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /clients/location/{city}:
 *   get:
 *     tags: [Clients]
 *     description: Retrieve clients by city
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: The city to retrieve clients from
 *     responses:
 *       200:
 *         description: List of clients in the specified city
 *       500:
 *         description: Internal server error
 */
router.get('/location/:city', async (req, res) => {
  const db = req.db;
  const { city } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM clients WHERE city ILIKE $1", 
      [`%${city}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     tags: [Clients]
 *     description: Retrieve a specific client by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client to retrieve
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */

// Get client by ID - MUST come after all specific routes
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM clients WHERE client_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *             properties:
 *               client_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               client_type:
 *                 type: string
 *                 enum: ['Individual', 'Company', 'Government', 'Institution']
 *               primary_contact_name:
 *                 type: string
 *               whatsppnumber:
 *                 type: string
 *               primary_contact_title:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               alternative_phone:
 *                 type: string
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               gst_number:
 *                 type: string
 *               pan_number:
 *                 type: string
 *               business_registration_number:
 *                 type: string
 *               client_category:
 *                 type: string
 *               referred_by:
 *                 type: string
 *               credit_limit:
 *                 type: number
 *               payment_terms:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               profile_image_url:
 *                 type: string
 *               documents_path:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Client name is required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    client_name,
    surname,
    client_type,
    primary_contact_name,
    whatsppnumber,
    primary_contact_title,
    email,
    phone,
    alternative_phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    gst_number,
    pan_number,
    business_registration_number,
    client_category,
    referred_by,
    credit_limit,
    payment_terms,
    is_active,
    notes,
    profile_image_url,
    documents_path,
    created_by
  } = req.body;

  if (!client_name) {
    return res.status(400).json({ error: "Client name is required" });
  }

  try {
    const query = `
      INSERT INTO clients (
        client_name, surname, client_type, primary_contact_name, whatsppnumber,
        primary_contact_title, email, phone, alternative_phone, address_line1,
        address_line2, city, state, postal_code, country, gst_number,
        pan_number, business_registration_number, client_category, referred_by,
        credit_limit, payment_terms, is_active, notes, profile_image_url,
        documents_path, created_by
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      RETURNING *
    `;
    
    const values = [
      client_name,
      surname,
      client_type,
      primary_contact_name,
      whatsppnumber,
      primary_contact_title,
      email,
      phone,
      alternative_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country || 'India',
      gst_number,
      pan_number,
      business_registration_number,
      client_category,
      referred_by,
      credit_limit,
      payment_terms,
      is_active === false ? false : true,
      notes,
      profile_image_url,
      documents_path,
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
 * /clients/{id}:
 *   put:
 *     summary: Update an existing client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *             properties:
 *               client_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               client_type:
 *                 type: string
 *                 enum: ['Individual', 'Company', 'Government', 'Institution']
 *               primary_contact_name:
 *                 type: string
 *               whatsppnumber:
 *                 type: string
 *               primary_contact_title:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               alternative_phone:
 *                 type: string
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               gst_number:
 *                 type: string
 *               pan_number:
 *                 type: string
 *               business_registration_number:
 *                 type: string
 *               client_category:
 *                 type: string
 *               referred_by:
 *                 type: string
 *               credit_limit:
 *                 type: number
 *               payment_terms:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               profile_image_url:
 *                 type: string
 *               documents_path:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Client updated successfully
 *       400:
 *         description: Client name is required
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    client_name,
    surname,
    client_type,
    primary_contact_name,
    whatsppnumber,
    primary_contact_title,
    email,
    phone,
    alternative_phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    gst_number,
    pan_number,
    business_registration_number,
    client_category,
    referred_by,
    credit_limit,
    payment_terms,
    is_active,
    notes,
    profile_image_url,
    documents_path,
    updated_by
  } = req.body;

  if (!client_name) {
    return res.status(400).json({ error: "Client name is required" });
  }

  try {
    const query = `
      UPDATE clients 
      SET 
        client_name = $1,
        surname = $2,
        client_type = $3,
        primary_contact_name = $4,
        whatsppnumber = $5,
        primary_contact_title = $6,
        email = $7,
        phone = $8,
        alternative_phone = $9,
        address_line1 = $10,
        address_line2 = $11,
        city = $12,
        state = $13,
        postal_code = $14,
        country = $15,
        gst_number = $16,
        pan_number = $17,
        business_registration_number = $18,
        client_category = $19,
        referred_by = $20,
        credit_limit = $21,
        payment_terms = $22,
        is_active = $23,
        notes = $24,
        profile_image_url = $25,
        documents_path = $26,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $27
      WHERE client_id = $28
      RETURNING *
    `;
    
    const values = [
      client_name,
      surname,
      client_type,
      primary_contact_name,
      whatsppnumber,
      primary_contact_title,
      email,
      phone,
      alternative_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country || 'India',
      gst_number,
      pan_number,
      business_registration_number,
      client_category,
      referred_by,
      credit_limit,
      payment_terms,
      is_active === false ? false : true,
      notes,
      profile_image_url,
      documents_path,
      updated_by,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Delete a client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client to delete
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM clients WHERE client_id = $1 RETURNING client_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;