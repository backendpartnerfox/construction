const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Requirement Package Customise
 *   description: API for managing client requirement package customizations
 */

// Get all package customizations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT crpc.*, cr.requirement_title, c.client_name, p.package_name
      FROM client_requirement_package_customise crpc
      LEFT JOIN client_requirements cr ON crpc.client_requirement_id = cr.client_requirement_id
      LEFT JOIN clients c ON cr.client_id = c.client_id
      LEFT JOIN packages p ON crpc.package_id = p.package_id
      ORDER BY crpc.created_at DESC
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get customizations by requirement ID
router.get('/requirement/:requirementId', async (req, res) => {
  const db = req.db;
  const { requirementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT crpc.*, p.package_name, p.package_type
      FROM client_requirement_package_customise crpc
      LEFT JOIN packages p ON crpc.package_id = p.package_id
      WHERE crpc.client_requirement_id = $1
      ORDER BY crpc.created_at DESC
    `, [requirementId]);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get customization by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT crpc.*, cr.requirement_title, c.client_name, p.package_name
      FROM client_requirement_package_customise crpc
      LEFT JOIN client_requirements cr ON crpc.client_requirement_id = cr.client_requirement_id
      LEFT JOIN clients c ON cr.client_id = c.client_id
      LEFT JOIN packages p ON crpc.package_id = p.package_id
      WHERE crpc.customise_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new package customization
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;

  if (!data.client_requirement_id || !data.package_id) {
    return res.status(400).json({ error: "Client requirement ID and package ID are required" });
  }

  try {
    // Get column names from the table
    const columnsQuery = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_requirement_package_customise' 
      AND column_name NOT IN ('customise_id', 'created_at', 'updated_at')
    `);
    
    const columns = columnsQuery.rows.map(row => row.column_name);
    const values = columns.map(col => data[col] !== undefined ? data[col] : null);
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO client_requirement_package_customise (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update package customization
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  if (!data.client_requirement_id || !data.package_id) {
    return res.status(400).json({ error: "Client requirement ID and package ID are required" });
  }

  try {
    // Get column names from the table
    const columnsQuery = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_requirement_package_customise' 
      AND column_name NOT IN ('customise_id', 'created_at', 'updated_at')
    `);
    
    const columns = columnsQuery.rows.map(row => row.column_name);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = columns.map(col => data[col] !== undefined ? data[col] : null);
    values.push(id);

    const query = `
      UPDATE client_requirement_package_customise 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE customise_id = $${values.length}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Package customization not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete package customization
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_requirement_package_customise WHERE customise_id = $1 RETURNING customise_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Package customization not found" });
    }
    
    res.json({ message: "Package customization deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
