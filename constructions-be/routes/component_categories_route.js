const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ComponentCategories
 *   description: API for managing component categories
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ComponentCategory:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *         category_name:
 *           type: string
 *         category_code:
 *           type: string
 *         description:
 *           type: string
 *         parent_category_id:
 *           type: integer
 *         display_order:
 *           type: integer
 *         icon:
 *           type: string
 *         color:
 *           type: string
 *         is_active:
 *           type: boolean
 *         metadata:
 *           type: object
 *         created_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_by:
 *           type: integer
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /component_categories:
 *   get:
 *     tags: [ComponentCategories]
 *     summary: Retrieve all component categories
 *     responses:
 *       200:
 *         description: List of component categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComponentCategory'
 *       500:
 *         description: Internal server error
 */
// router.get('/component_categories', async (req, res) => {
//   // Fix: Use a fallback if req.db is undefined
//   const db = req.db || req.app.get('db');
//   if (!db) {
//     return res.status(500).json({ error: 'Database connection not found' });
//   }
//   try {
//     const result = await db.query(`
//       SELECT 
//         cc.*,
//         COUNT(DISTINCT c.component_id) as component_count
//       FROM component_categories cc
//       LEFT JOIN components c ON cc.category_id = c.category_id
//       GROUP BY cc.category_id
//       ORDER BY cc.display_order, cc.category_name
//     `);
//     res.json(result.rows);
//   } catch (queryErr) {
//     res.status(500).json({ error: queryErr.message });
//   }
// });
router.get('/', async (req, res) => {
  const db = req.db || req.app.get('db');
  if (!db) {
    return res.status(500).json({ error: 'Database connection not found' });
  }
  try {
    const result = await db.query(`
      SELECT *
      FROM component_categories
      ORDER BY display_order, category_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});
// ...rest of the file unchanged...
/**
 * @swagger
 * /component_categories/{id}:
 *   get:
 *     tags: [ComponentCategories]
 *     summary: Retrieve a specific component category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component category to retrieve
 *     responses:
 *       200:
 *         description: Component category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComponentCategory'
 *       404:
 *         description: Component category not found
 *       500:
 *         description: Internal server error
 */
// router.get('/:id', async (req, res) => {
//   const db = req.db || req.app.get('db');
//   if (!db) {
//     return res.status(500).json({ error: 'Database connection not found' });
//   }
//   const { id } = req.params;
//   try {
//     const result = await db.query(`
//       SELECT 
//         cc.*,
//         COUNT(DISTINCT c.component_id) as component_count
//       FROM component_categories cc
//       LEFT JOIN components c ON cc.category_id = c.category_id
//       WHERE cc.category_id = $1
//       GROUP BY cc.category_id
//     `, [id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Component category not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.get('/:id', async (req, res) => {
  const db = req.db || req.app.get('db');
  if (!db) {
    return res.status(500).json({ error: 'Database connection not found' });
  }
  const { id } = req.params;
  try {
    // Remove the JOIN and COUNT if the column does not exist
    const result = await db.query(`
      SELECT *
      FROM component_categories
      WHERE category_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * @swagger
 * /component_categories:
 *   post:
 *     summary: Create a new component category
 *     tags: [ComponentCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComponentCategory'
 *     responses:
 *       201:
 *         description: Component category created successfully
 *       400:
 *         description: Invalid input or category code already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    category_name, category_code, description, parent_category_id,
    display_order, icon, color, is_active, metadata, created_by
  } = req.body;

  if (!category_name || !category_code) {
    return res.status(400).json({ 
      error: "Required fields: category_name, category_code" 
    });
  }

  try {
    const codeCheck = await db.query(
      'SELECT category_id FROM component_categories WHERE category_code = $1',
      [category_code]
    );
    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Category code already exists' });
    }

    const result = await db.query(
      `INSERT INTO component_categories (
        category_name, category_code, description, parent_category_id,
        display_order, icon, color, is_active, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        category_name, category_code, description || null, parent_category_id || null,
        display_order || 0, icon || null, color || null, is_active !== false, metadata || null, created_by || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_categories/{id}:
 *   put:
 *     summary: Update an existing component category
 *     tags: [ComponentCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComponentCategory'
 *     responses:
 *       200:
 *         description: Component category updated successfully
 *       400:
 *         description: Category code already exists
 *       404:
 *         description: Component category not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  delete updates.category_id;
  delete updates.created_at;
  delete updates.created_by;

  updates.updated_at = new Date();

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    if (updates.category_code) {
      const codeCheck = await db.query(
        'SELECT category_id FROM component_categories WHERE category_code = $1 AND category_id != $2',
        [updates.category_code, id]
      );
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Category code already exists' });
      }
    }

    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE component_categories 
       SET ${setClause}
       WHERE category_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component category not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_categories/{id}:
 *   delete:
 *     summary: Delete a component category
 *     tags: [ComponentCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component category to delete
 *     responses:
 *       200:
 *         description: Component category deleted successfully
 *       400:
 *         description: Cannot delete category with associated components
 *       404:
 *         description: Component category not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const childCheck = await db.query(
      'SELECT COUNT(*) FROM component_categories WHERE parent_category_id = $1',
      [id]
    );
    if (parseInt(childCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category because it has child categories. Delete child categories first." 
      });
    }

    const componentCheck = await db.query(
      'SELECT COUNT(*) FROM components WHERE category_id = $1',
      [id]
    );
    if (parseInt(componentCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category because it has associated components." 
      });
    }
    
    const result = await db.query('DELETE FROM component_categories WHERE category_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component category not found" });
    }
    res.json({ message: "Component category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_categories/active:
 *   get:
 *     tags: [ComponentCategories]
 *     summary: Get all active component categories
 *     responses:
 *       200:
 *         description: List of active component categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComponentCategory'
 *       500:
 *         description: Internal server error
 */
router.get('/active', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT * FROM component_categories
      WHERE is_active = true
      ORDER BY display_order, category_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;