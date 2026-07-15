const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Package Items Mapping
 *   description: API for managing package-item mappings
 */

/**
 * @swagger
 * /package_items_mapping:
 *   get:
 *     tags: [Package Items Mapping]
 *     description: Retrieve all package-item mappings with package and item details
 *     responses:
 *       200:
 *         description: List of package-item mappings
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
 *                   item_id:
 *                     type: integer
 *                   item_choice_id:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   package_name:
 *                     type: string
 *                   item_name:
 *                     type: string
 *                   item_code:
 *                     type: string
 *                   choice_name:
 *                     type: string
 */

// Get all package-item mappings with details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT pim.id, pim.package_id, pim.item_id, pim.item_choice_id, pim.created_at,
             p.package_name, i.item_name, ic.display_name as choice_name
      FROM package_items_mapping pim
      JOIN packages p ON pim.package_id = p.id
      JOIN items i ON pim.item_id = i.item_id
      JOIN item_choices ic ON pim.item_choice_id = ic.choice_option_id
      ORDER BY p.package_name, i.item_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /package_items_mapping/{id}:
 *   get:
 *     tags: [Package Items Mapping]
 *     description: Retrieve a specific package-item mapping by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to retrieve
 *     responses:
 *       200:
 *         description: Package-item mapping details
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */

// Get package-item mapping by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT pim.id, pim.package_id, pim.item_id, pim.item_choice_id, pim.created_at,
             p.package_name, i.item_name, ic.display_name as choice_name
      FROM package_items_mapping pim
      JOIN packages p ON pim.package_id = p.id
      JOIN items i ON pim.item_id = i.item_id
      JOIN item_choices ic ON pim.item_choice_id = ic.choice_option_id
      WHERE pim.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package-item mapping not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /package_items_mapping/package/{packageId}:
 *   get:
 *     tags: [Package Items Mapping]
 *     description: Retrieve all item mappings for a specific package
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the package
 *     responses:
 *       200:
 *         description: List of item mappings for the package
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */

// Get mappings by package ID
router.get('/package/:packageId', async (req, res) => {
  const db = req.db;
  const { packageId } = req.params;
  
  try {
    // First check if package exists
    const packageCheck = await db.query('SELECT id FROM packages WHERE id = $1', [packageId]);
    
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    const result = await db.query(`
      SELECT pim.id, pim.package_id, pim.item_id, pim.item_choice_id, pim.created_at,
             i.item_name, ic.display_name as choice_name
      FROM package_items_mapping pim
      JOIN items i ON pim.item_id = i.item_id
      JOIN item_choices ic ON pim.item_choice_id = ic.choice_option_id
      WHERE pim.package_id = $1
      ORDER BY i.item_name
    `, [packageId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /package_items_mapping:
 *   post:
 *     summary: Create a new package-item mapping
 *     tags: [Package Items Mapping]
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
 *             properties:
 *               package_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Mapping created successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Package, item, or item choice not found
 *       409:
 *         description: Mapping already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { package_id, item_id, item_choice_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: "Package ID is required" });
  }

  if (!item_id) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  if (!item_choice_id) {
    return res.status(400).json({ error: "Item choice ID is required" });
  }

  try {
    // Verify package exists
    const packageCheck = await db.query('SELECT id FROM packages WHERE id = $1', [package_id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify item choice exists
    const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [item_choice_id]);
    if (choiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice not found' });
    }

    // Check if mapping already exists
    const existingMapping = await db.query(
      'SELECT id FROM package_items_mapping WHERE package_id = $1 AND item_id = $2',
      [package_id, item_id]
    );
    
    if (existingMapping.rows.length > 0) {
      return res.status(409).json({ error: 'Mapping already exists for this package and item' });
    }

    const result = await db.query(
      `INSERT INTO package_items_mapping (package_id, item_id, item_choice_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, package_id, item_id, item_choice_id, created_at`,
      [package_id, item_id, item_choice_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /package_items_mapping/{id}:
 *   put:
 *     summary: Update an existing package-item mapping by ID
 *     tags: [Package Items Mapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to update
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
 *             properties:
 *               package_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_choice_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Mapping updated successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Mapping, package, item, or item choice not found
 *       409:
 *         description: Duplicate mapping would be created
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { package_id, item_id, item_choice_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: "Package ID is required" });
  }

  if (!item_id) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  if (!item_choice_id) {
    return res.status(400).json({ error: "Item choice ID is required" });
  }

  try {
    // Verify package exists
    const packageCheck = await db.query('SELECT id FROM packages WHERE id = $1', [package_id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify item choice exists
    const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [item_choice_id]);
    if (choiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice not found' });
    }

    // Check for duplicate mapping (excluding current record)
    const duplicateCheck = await db.query(
      'SELECT id FROM package_items_mapping WHERE package_id = $1 AND item_id = $2 AND id != $3',
      [package_id, item_id, id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Another mapping already exists for this package and item' });
    }

    const result = await db.query(
      `UPDATE package_items_mapping 
       SET package_id = $1, item_id = $2, item_choice_id = $3
       WHERE id = $4 
       RETURNING id, package_id, item_id, item_choice_id, created_at`,
      [package_id, item_id, item_choice_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Package-item mapping not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /package_items_mapping/{id}:
 *   delete:
 *     summary: Delete a package-item mapping by ID
 *     tags: [Package Items Mapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to delete
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM package_items_mapping WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Package-item mapping not found" });
    }
    
    res.json({ message: "Package-item mapping deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /package_items_mapping/package/{packageId}/item/{itemId}:
 *   delete:
 *     summary: Delete package-item mapping by package and item IDs
 *     tags: [Package Items Mapping]
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the package
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */
router.delete('/package/:packageId/item/:itemId', async (req, res) => {
  const db = req.db;
  const { packageId, itemId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM package_items_mapping WHERE package_id = $1 AND item_id = $2',
      [packageId, itemId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Package-item mapping not found" });
    }
    
    res.json({ message: "Package-item mapping deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;