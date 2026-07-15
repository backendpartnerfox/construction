const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Requirements
 *   description: API for managing client requirements and specifications
 */

// Get all client requirements
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT cr.*, c.client_name, c.email, c.phone
      FROM client_requirements cr
      LEFT JOIN clients c ON cr.client_id = c.client_id
      ORDER BY cr.created_at DESC
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get client requirements by client ID
router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cr.*, c.client_name
      FROM client_requirements cr
      LEFT JOIN clients c ON cr.client_id = c.client_id
      WHERE cr.client_id = $1
      ORDER BY cr.created_at DESC
    `, [clientId]);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get client requirements by status
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cr.*, c.client_name
      FROM client_requirements cr
      LEFT JOIN clients c ON cr.client_id = c.client_id
      WHERE cr.status = $1
      ORDER BY cr.created_at DESC
    `, [status]);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get client requirement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cr.*, c.client_name, c.email, c.phone
      FROM client_requirements cr
      LEFT JOIN clients c ON cr.client_id = c.client_id
      WHERE cr.client_requirement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client requirement not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new client requirement
router.post('/', async (req, res) => {
  const db = req.db;
  
  console.log('Received client requirement data:', req.body);
  
  const {
    client_id,
    requirement_title,
    requirement_description,
    project_type,
    construction_type,
    approved_budget,
    project_start_date,
    expected_completion_date,
    status
  } = req.body;

  if (!client_id || !requirement_title) {
    return res.status(400).json({ error: "Client ID and requirement title are required" });
  }

  try {
    // Generate requirement number
    const countResult = await db.query(
      'SELECT COUNT(*) + 1 as next_num FROM client_requirements WHERE client_id = $1',
      [client_id]
    );
    const requirement_number = `CR-${client_id}-${String(countResult.rows[0].next_num).padStart(3, '0')}`;

    const query = `
      INSERT INTO client_requirements (
        client_id,
        requirement_number,
        requirement_title,
        requirement_description,
        project_type,
        construction_type,
        approved_budget,
        project_start_date,
        expected_completion_date,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *
    `;
    
    const values = [
      client_id,
      requirement_number,
      requirement_title || null,
      requirement_description || null,
      project_type || null,
      construction_type || null,
      parseFloat(approved_budget) || null,
      project_start_date || null,
      expected_completion_date || null,
      status || 'Draft'
    ];

    console.log('Executing insert with values:', values);

    const result = await db.query(query, values);
    console.log('✅ Client requirement created successfully');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    res.status(500).json({ error: err.message });
  }
});

// Update client requirement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log('Updating client requirement ID:', id);
  console.log('Update data:', req.body);
  
  const {
    client_id,
    requirement_title,
    requirement_description,
    project_title,
    project_type,
    construction_type,
    site_area,
    built_up_area,
    carpet_area,
    number_of_floors,
    number_of_bedrooms,
    number_of_bathrooms,
    number_of_kitchens,
    stilt_required,
    stilt_area,
    balcony_area,
    terrace_area,
    quality_level,
    package_type,
    approved_budget,
    project_start_date,
    expected_completion_date,
    status
  } = req.body;

  if (!client_id || !requirement_title) {
    return res.status(400).json({ error: "Client ID and requirement title are required" });
  }

  try {
    const query = `
      UPDATE client_requirements SET
        client_id = $1,
        requirement_title = $2,
        requirement_description = $3,
        project_title = $4,
        project_type = $5,
        construction_type = $6,
        site_area = $7,
        built_up_area = $8,
        carpet_area = $9,
        number_of_floors = $10,
        number_of_bedrooms = $11,
        number_of_bathrooms = $12,
        number_of_kitchens = $13,
        stilt_required = $14,
        stilt_area = $15,
        balcony_area = $16,
        terrace_area = $17,
        quality_level = $18,
        package_type = $19,
        approved_budget = $20,
        project_start_date = $21,
        expected_completion_date = $22,
        status = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE client_requirement_id = $24
      RETURNING *
    `;
    
    const values = [
      client_id,
      requirement_title,
      requirement_description || null,
      project_title || null,
      project_type || null,
      construction_type || null,
      parseFloat(site_area) || null,
      parseFloat(built_up_area) || null,
      parseFloat(carpet_area) || null,
      parseInt(number_of_floors) || null,
      parseInt(number_of_bedrooms) || null,
      parseInt(number_of_bathrooms) || null,
      parseInt(number_of_kitchens) || null,
      stilt_required || false,
      parseFloat(stilt_area) || null,
      parseFloat(balcony_area) || null,
      parseFloat(terrace_area) || null,
      quality_level || null,
      package_type || null,
      parseFloat(approved_budget) || null,
      project_start_date || null,
      expected_completion_date || null,
      status || 'Draft',
      id
    ];

    console.log('Executing update with values:', values);

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client requirement not found" });
    }

    console.log('✅ Client requirement updated successfully');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    res.status(500).json({ error: err.message });
  }
});

// Update client requirement status
router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Draft', 'Under_Review', 'Approved', 'Locked', 'Change_Request'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await db.query(
      'UPDATE client_requirements SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE client_requirement_id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client requirement not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Approve client requirement
router.patch('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;

  try {
    const result = await db.query(
      `UPDATE client_requirements 
       SET status = 'Approved', 
           approved_date = CURRENT_DATE,
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE client_requirement_id = $2 
       RETURNING *`,
      [approved_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client requirement not found" });
    }

    res.json({ message: 'Client requirement approved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lock client requirement
router.patch('/:id/lock', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { locked_by } = req.body;

  try {
    const result = await db.query(
      `UPDATE client_requirements 
       SET status = 'Locked', 
           locked_date = CURRENT_DATE,
           locked_by = $1,
           locked_at = CURRENT_TIMESTAMP,
           change_requests_allowed = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE client_requirement_id = $2 
       RETURNING *`,
      [locked_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client requirement not found" });
    }

    res.json({ message: 'Client requirement locked successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete client requirement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_requirements WHERE client_requirement_id = $1 RETURNING client_requirement_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client requirement not found" });
    }
    
    res.json({ message: "Client requirement deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
