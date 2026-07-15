const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ComponentElements
 *   description: API for managing component elements mapping
 */

/**
 * @swagger
 * /component_elements:
 *   get:
 *     tags: [ComponentElements]
 *     description: Retrieve all component element mappings
 *     responses:
 *       200:
 *         description: List of component element mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   component_element_id:
 *                     type: integer
 *                   component_id:
 *                     type: integer
 *                   element_id:
 *                     type: integer
 *                   is_primary:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        ce.*,
        c.component_name,
        e.element_name,
        e.element_category
      FROM component_elements ce
      LEFT JOIN components c ON ce.component_id = c.component_id
      LEFT JOIN elements e ON ce.element_id = e.element_id
      ORDER BY c.component_name, e.element_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_elements/{id}:
 *   get:
 *     tags: [ComponentElements]
 *     description: Retrieve a specific component element mapping by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component element mapping
 *     responses:
 *       200:
 *         description: Component element mapping details
 *       404:
 *         description: Component element mapping not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        ce.*,
        c.component_name,
        e.element_name,
        e.element_category
      FROM component_elements ce
      LEFT JOIN components c ON ce.component_id = c.component_id
      LEFT JOIN elements e ON ce.element_id = e.element_id
      WHERE ce.component_element_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component element mapping not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_elements/component/{componentId}:
 *   get:
 *     tags: [ComponentElements]
 *     description: Retrieve all elements for a specific component
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component
 *     responses:
 *       200:
 *         description: List of elements for the component
 *       404:
 *         description: Component not found
 *       500:
 *         description: Internal server error
 */
router.get('/component/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  
  try {
    // First check if component exists
    const componentCheck = await db.query('SELECT component_id FROM components WHERE component_id = $1', [componentId]);
    
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    const result = await db.query(`
      SELECT 
        ce.*,
        e.element_name,
        e.element_category,
        e.element_description
      FROM component_elements ce
      LEFT JOIN elements e ON ce.element_id = e.element_id
      WHERE ce.component_id = $1
      ORDER BY ce.is_primary DESC, e.element_name
    `, [componentId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_elements/element/{elementId}:
 *   get:
 *     tags: [ComponentElements]
 *     description: Retrieve all components that use a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element
 *     responses:
 *       200:
 *         description: List of components using the element
 *       404:
 *         description: Element not found
 *       500:
 *         description: Internal server error
 */
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    // First check if element exists
    const elementCheck = await db.query('SELECT element_id FROM elements WHERE element_id = $1', [elementId]);
    
    if (elementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Element not found' });
    }
    
    const result = await db.query(`
      SELECT 
        ce.*,
        c.component_name,
        c.component_code,
        c.component_type
      FROM component_elements ce
      LEFT JOIN components c ON ce.component_id = c.component_id
      WHERE ce.element_id = $1
      ORDER BY c.component_name
    `, [elementId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /component_elements:
 *   post:
 *     summary: Create a new component element mapping
 *     tags: [ComponentElements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - component_id
 *               - element_id
 *             properties:
 *               component_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               is_primary:
 *                 type: boolean
 *               quantity_factor:
 *                 type: number
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Component element mapping created successfully
 *       400:
 *         description: Invalid input or mapping already exists
 *       404:
 *         description: Component or element not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    component_id, element_id, is_primary, quantity_factor, notes, created_by
  } = req.body;

  // Validate required fields
  if (!component_id || !element_id) {
    return res.status(400).json({ 
      error: "Required fields: component_id, element_id" 
    });
  }

  try {
    // Verify component exists
    const componentCheck = await db.query('SELECT component_id FROM components WHERE component_id = $1', [component_id]);
    
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Verify element exists
    const elementCheck = await db.query('SELECT element_id FROM elements WHERE element_id = $1', [element_id]);
    
    if (elementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Element not found' });
    }

    // Check if mapping already exists
    const mappingCheck = await db.query(
      'SELECT component_element_id FROM component_elements WHERE component_id = $1 AND element_id = $2',
      [component_id, element_id]
    );
    
    if (mappingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Component element mapping already exists' });
    }

    const result = await db.query(
      `INSERT INTO component_elements (
        component_id, element_id, is_primary, quantity_factor, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        component_id, element_id, is_primary || false, 
        quantity_factor || 1.0, notes, created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_elements/{id}:
 *   put:
 *     summary: Update an existing component element mapping
 *     tags: [ComponentElements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component element mapping to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_primary:
 *                 type: boolean
 *               quantity_factor:
 *                 type: number
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Component element mapping updated successfully
 *       404:
 *         description: Component element mapping not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.component_element_id;
  delete updates.component_id;
  delete updates.element_id;
  delete updates.created_at;
  delete updates.created_by;

  // Add updated_at timestamp
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE component_elements 
       SET ${setClause}
       WHERE component_element_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component element mapping not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_elements/{id}:
 *   delete:
 *     summary: Delete a component element mapping
 *     tags: [ComponentElements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the component element mapping to delete
 *     responses:
 *       200:
 *         description: Component element mapping deleted successfully
 *       404:
 *         description: Component element mapping not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM component_elements WHERE component_element_id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Component element mapping not found" });
    }
    
    res.json({ message: "Component element mapping deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /component_elements/primary/{componentId}:
 *   get:
 *     tags: [ComponentElements]
 *     description: Get primary elements for a component
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The component ID
 *     responses:
 *       200:
 *         description: List of primary elements for the component
 *       500:
 *         description: Internal server error
 */
router.get('/primary/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ce.*,
        e.element_name,
        e.element_category,
        e.element_description
      FROM component_elements ce
      LEFT JOIN elements e ON ce.element_id = e.element_id
      WHERE ce.component_id = $1 AND ce.is_primary = true
      ORDER BY e.element_name
    `, [componentId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;