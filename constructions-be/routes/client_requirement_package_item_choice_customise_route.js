const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Requirement Package Item Choice Customise
 *   description: API for managing client requirement package item choice customizations
 */

// Get all item choice customizations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT crpic.*, 
             crpc.client_requirement_id,
             i.item_name, 
             ic.display_name as choice_name
      FROM client_requirement_package_item_choice_customise crpic
      LEFT JOIN client_requirement_package_customise crpc 
        ON crpic.package_customise_id = crpc.customise_id
      LEFT JOIN items i ON crpic.item_id = i.item_id
      LEFT JOIN item_choices ic ON crpic.choice_option_id = ic.choice_option_id
      ORDER BY crpic.created_at DESC
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get item choice customizations by package customise ID
router.get('/package/:packageCustomiseId', async (req, res) => {
  const db = req.db;
  const { packageCustomiseId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT crpic.*, 
             i.item_name, 
             ic.display_name as choice_name,
             ic.brand, ic.series
      FROM client_requirement_package_item_choice_customise crpic
      LEFT JOIN items i ON crpic.item_id = i.item_id
      LEFT JOIN item_choices ic ON crpic.choice_option_id = ic.choice_option_id
      WHERE crpic.package_customise_id = $1
      ORDER BY crpic.created_at DESC
    `, [packageCustomiseId]);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get item choice customizations by item ID
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT crpic.*, 
             crpc.client_requirement_id,
             i.item_name, 
             ic.display_name as choice_name
      FROM client_requirement_package_item_choice_customise crpic
      LEFT JOIN client_requirement_package_customise crpc 
        ON crpic.package_customise_id = crpc.customise_id
      LEFT JOIN items i ON crpic.item_id = i.item_id
      LEFT JOIN item_choices ic ON crpic.choice_option_id = ic.choice_option_id
      WHERE crpic.item_id = $1
      ORDER BY crpic.created_at DESC
    `, [itemId]);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get item choice customization by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT crpic.*, 
             crpc.client_requirement_id,
             i.item_name, 
             i.item_category,
             ic.display_name as choice_name,
             ic.brand, ic.series, ic.description as choice_description
      FROM client_requirement_package_item_choice_customise crpic
      LEFT JOIN client_requirement_package_customise crpc 
        ON crpic.package_customise_id = crpc.customise_id
      LEFT JOIN items i ON crpic.item_id = i.item_id
      LEFT JOIN item_choices ic ON crpic.choice_option_id = ic.choice_option_id
      WHERE crpic.item_choice_customise_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice customization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new item choice customization
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;

  if (!data.package_customise_id || !data.item_id) {
    return res.status(400).json({ error: "Package customise ID and item ID are required" });
  }

  try {
    // Get column names from the table
    const columnsQuery = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_requirement_package_item_choice_customise' 
      AND column_name NOT IN ('item_choice_customise_id', 'created_at', 'updated_at')
    `);
    
    const columns = columnsQuery.rows.map(row => row.column_name);
    const values = columns.map(col => data[col] !== undefined ? data[col] : null);
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO client_requirement_package_item_choice_customise (${columns.join(', ')})
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

// Update item choice customization
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  if (!data.package_customise_id || !data.item_id) {
    return res.status(400).json({ error: "Package customise ID and item ID are required" });
  }

  try {
    // Get column names from the table
    const columnsQuery = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_requirement_package_item_choice_customise' 
      AND column_name NOT IN ('item_choice_customise_id', 'created_at', 'updated_at')
    `);
    
    const columns = columnsQuery.rows.map(row => row.column_name);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = columns.map(col => data[col] !== undefined ? data[col] : null);
    values.push(id);

    const query = `
      UPDATE client_requirement_package_item_choice_customise 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE item_choice_customise_id = $${values.length}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item choice customization not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete item choice customization
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_requirement_package_item_choice_customise WHERE item_choice_customise_id = $1 RETURNING item_choice_customise_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item choice customization not found" });
    }
    
    res.json({ message: "Item choice customization deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
