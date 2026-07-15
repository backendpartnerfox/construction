const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Elements
 *   description: API for managing construction elements
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Element:
 *       type: object
 *       required:
 *         - element_name
 *       properties:
 *         element_id:
 *           type: integer
 *           description: Unique identifier for the element
 *           example: 1
 *         element_name:
 *           type: string
 *           description: Name of the construction element
 *           example: "Doors"
 *         element_category:
 *           type: string
 *           description: Category classification of the element
 *           example: "Finishing"
 *           enum: ["Foundation", "Structural", "Architectural", "Finishing", "Utility", "External", "Circulation", "MEP"]
 *         element_description:
 *           type: string
 *           description: Detailed description of the element
 *           example: "Interior and exterior doors for rooms"
 *         linetype:
 *           type: string
 *           nullable: true
 *           description: Line type specification for drawings
 *           example: "continuous"
 *         phase:
 *           type: string
 *           nullable: true
 *           description: Construction phase where element is used
 *           example: "finishing"
 *     ElementCreate:
 *       type: object
 *       required:
 *         - element_name
 *       properties:
 *         element_name:
 *           type: string
 *           description: Name of the construction element
 *           example: "Doors"
 *         element_category:
 *           type: string
 *           description: Category classification of the element
 *           example: "Finishing"
 *         element_description:
 *           type: string
 *           description: Detailed description of the element
 *           example: "Interior and exterior doors for rooms"
 *         linetype:
 *           type: string
 *           nullable: true
 *           description: Line type specification for drawings
 *           example: "continuous"
 *         phase:
 *           type: string
 *           nullable: true
 *           description: Construction phase where element is used
 *           example: "finishing"
 *     ElementUpdate:
 *       type: object
 *       required:
 *         - element_name
 *       properties:
 *         element_name:
 *           type: string
 *           description: Name of the construction element
 *           example: "Updated Doors"
 *         element_category:
 *           type: string
 *           description: Category classification of the element
 *           example: "Finishing"
 *         element_description:
 *           type: string
 *           description: Detailed description of the element
 *           example: "Updated description for doors"
 *         linetype:
 *           type: string
 *           nullable: true
 *           description: Line type specification for drawings
 *           example: "continuous"
 *         phase:
 *           type: string
 *           nullable: true
 *           description: Construction phase where element is used
 *           example: "finishing"
 *     SequenceStatus:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Sequence fixed successfully"
 *         before:
 *           type: object
 *           properties:
 *             sequence_value:
 *               type: integer
 *               example: 7
 *             max_table_id:
 *               type: integer
 *               example: 20
 *             issue:
 *               type: string
 *               example: "Sequence was behind table data"
 *         after:
 *           type: object
 *           properties:
 *             sequence_value:
 *               type: integer
 *               example: 21
 *             next_available_id:
 *               type: integer
 *               example: 21
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Element name is required"
 *         solution:
 *           type: string
 *           description: Suggested solution for the error
 *           example: "Please contact administrator to fix sequence issue."
 *         technical_error:
 *           type: string
 *           description: Technical error details
 *           example: "duplicate key value violates unique constraint"
 *         existing_id:
 *           type: integer
 *           description: ID of existing element (for duplicate errors)
 *           example: 5
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Elements]
 *     summary: Retrieve all construction elements
 *     description: Get a complete list of all construction elements with their details
 *     responses:
 *       200:
 *         description: Successfully retrieved list of elements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
 *             example:
 *               - element_id: 1
 *                 element_name: "Footings"
 *                 element_category: "Foundation"
 *                 element_description: "Base of the structure"
 *                 linetype: null
 *                 phase: null
 *               - element_id: 2
 *                 element_name: "Doors"
 *                 element_category: "Finishing"
 *                 element_description: "Interior and exterior doors"
 *                 linetype: "continuous"
 *                 phase: "finishing"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all elements
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    // Access the rows property from the query result
    const result = await db.query('SELECT * FROM elements');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /admin/fix-sequence:
 *   post:
 *     tags: [Elements]
 *     summary: Fix elements sequence (Admin only)
 *     description: |
 *       Administrative endpoint to fix the elements_element_id_seq sequence when it gets out of sync.
 *       This resolves "duplicate key value violates unique constraint" errors.
 *       
 *       **When to use:**
 *       - When POST /elements returns sequence/duplicate key errors
 *       - After bulk data imports
 *       - When sequence value is behind the maximum element_id in the table
 *       
 *       **Security:** This endpoint should be restricted to administrators only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sequence status (fixed or already correct)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SequenceStatus'
 *             examples:
 *               sequence_fixed:
 *                 summary: Sequence was fixed
 *                 value:
 *                   message: "Sequence fixed successfully"
 *                   before:
 *                     sequence_value: 7
 *                     max_table_id: 20
 *                     issue: "Sequence was behind table data"
 *                   after:
 *                     sequence_value: 21
 *                     next_available_id: 21
 *               sequence_ok:
 *                 summary: Sequence was already correct
 *                 value:
 *                   message: "Sequence is already correct"
 *                   sequence_value: 25
 *                   max_table_id: 20
 *                   status: "No fix needed"
 *       500:
 *         description: Failed to fix sequence
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/admin/fix-sequence', async (req, res) => {
  const db = req.db;
  
  try {
    // Get current sequence value
    const seqResult = await db.query('SELECT last_value FROM elements_element_id_seq');
    const currentSeqValue = seqResult.rows[0].last_value;
    
    // Get max element_id from table
    const maxResult = await db.query('SELECT COALESCE(MAX(element_id), 0) as max_id FROM elements');
    const maxId = maxResult.rows[0].max_id;
    
    if (currentSeqValue <= maxId) {
      // Fix the sequence
      await db.query('SELECT setval($1, $2, false)', ['elements_element_id_seq', maxId + 1]);
      
      // Verify the fix
      const newSeqResult = await db.query('SELECT last_value FROM elements_element_id_seq');
      const newSeqValue = newSeqResult.rows[0].last_value;
      
      res.json({
        message: 'Sequence fixed successfully',
        before: {
          sequence_value: currentSeqValue,
          max_table_id: maxId,
          issue: currentSeqValue <= maxId ? 'Sequence was behind table data' : 'No issue'
        },
        after: {
          sequence_value: newSeqValue,
          next_available_id: newSeqValue
        }
      });
    } else {
      res.json({
        message: 'Sequence is already correct',
        sequence_value: currentSeqValue,
        max_table_id: maxId,
        status: 'No fix needed'
      });
    }
  } catch (err) {
    console.error('Error fixing sequence:', err);
    res.status(500).json({ 
      error: 'Failed to fix sequence',
      technical_error: err.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     tags: [Elements]
 *     summary: Retrieve a specific element by ID
 *     description: Get detailed information about a specific construction element by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique ID of the element to retrieve
 *         example: 1
 *     responses:
 *       200:
 *         description: Element details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
 *             example:
 *               element_id: 1
 *               element_name: "Doors"
 *               element_category: "Finishing"
 *               element_description: "Interior and exterior doors for rooms"
 *               linetype: "continuous"
 *               phase: "finishing"
 *       404:
 *         description: Element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get element by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM elements WHERE element_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Element not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /:
 *   post:
 *     tags: [Elements]
 *     summary: Create a new construction element
 *     description: |
 *       Create a new construction element with the specified details.
 *       
 *       **Important Notes:**
 *       - Element names must be unique
 *       - If you get a "duplicate key constraint" error, use the admin fix-sequence endpoint
 *       - The system will auto-assign the next available element_id
 *       
 *       **Validation:**
 *       - element_name is required
 *       - Duplicate element names are not allowed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ElementCreate'
 *           examples:
 *             basic_element:
 *               summary: Basic element creation
 *               value:
 *                 element_name: "Doors"
 *                 element_category: "Finishing"
 *                 element_description: "Interior and exterior doors for rooms"
 *             full_element:
 *               summary: Element with all fields
 *               value:
 *                 element_name: "Windows"
 *                 element_category: "Finishing"
 *                 element_description: "Glass windows for natural light"
 *                 linetype: "continuous"
 *                 phase: "finishing"
 *     responses:
 *       201:
 *         description: Element created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
 *             example:
 *               element_id: 21
 *               element_name: "Doors"
 *               element_category: "Finishing"
 *               element_description: "Interior and exterior doors for rooms"
 *               linetype: null
 *               phase: null
 *       400:
 *         description: Validation error (missing required fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element name is required"
 *       409:
 *         description: Conflict - element name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element with this name already exists"
 *               existing_id: 5
 *       500:
 *         description: Internal server error (possibly sequence issue)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               sequence_error:
 *                 summary: Sequence out of sync error
 *                 value:
 *                   error: "Primary key constraint violation. The sequence may be out of sync."
 *                   solution: "Please contact administrator to fix sequence issue."
 *                   technical_error: "duplicate key value violates unique constraint"
 *               general_error:
 *                 summary: General server error
 *                 value:
 *                   error: "Failed to create element"
 *                   technical_error: "Database connection failed"
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { element_name, element_category, element_description, linetype, phase } = req.body;

  if (!element_name) {
    return res.status(400).json({ error: "Element name is required" });
  }

  try {
    // Check if element with same name already exists to avoid duplicates
    const existingElement = await db.query(
      'SELECT element_id FROM elements WHERE element_name = $1',
      [element_name]
    );
    
    if (existingElement.rows.length > 0) {
      return res.status(409).json({ 
        error: "Element with this name already exists",
        existing_id: existingElement.rows[0].element_id
      });
    }

    const result = await db.query(
      'INSERT INTO elements (element_name, element_category, element_description, linetype, phase) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [element_name, element_category, element_description, linetype, phase]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error in POST /elements:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'elements_pkey') {
        return res.status(500).json({ 
          error: "Primary key constraint violation. The sequence may be out of sync.",
          solution: "Please contact administrator to fix sequence issue.",
          technical_error: err.message
        });
      }
      return res.status(409).json({ 
        error: "Duplicate entry",
        constraint: err.constraint,
        technical_error: err.message
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create element",
      technical_error: err.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   put:
 *     tags: [Elements]
 *     summary: Update an existing element
 *     description: |
 *       Update an existing construction element with new details.
 *       All fields in the request body will replace the existing values.
 *       
 *       **Validation:**
 *       - element_name is required
 *       - Element must exist (valid ID)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique ID of the element to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ElementUpdate'
 *           example:
 *             element_name: "Updated Doors"
 *             element_category: "Finishing"
 *             element_description: "Updated description for interior and exterior doors"
 *             linetype: "dashed"
 *             phase: "finishing"
 *     responses:
 *       200:
 *         description: Element updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
 *             example:
 *               element_id: 1
 *               element_name: "Updated Doors"
 *               element_category: "Finishing"
 *               element_description: "Updated description for interior and exterior doors"
 *               linetype: "dashed"
 *               phase: "finishing"
 *       400:
 *         description: Validation error (missing required fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element name is required"
 *       404:
 *         description: Element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { element_name, element_category, element_description, linetype, phase } = req.body;

  if (!element_name) {
    return res.status(400).json({ error: "Element name is required" });
  }

  try {
    const result = await db.query(
      'UPDATE elements SET element_name = $1, element_category = $2, element_description = $3, linetype = $4, phase = $5 WHERE element_id = $6 RETURNING *',
      [element_name, element_category, element_description, linetype, phase, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Element not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error in PUT /elements:', err);
    res.status(500).json({ 
      error: "Failed to update element",
      technical_error: err.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   delete:
 *     tags: [Elements]
 *     summary: Delete an element
 *     description: |
 *       Permanently delete a construction element from the system.
 *       
 *       **Warning:** This action cannot be undone.
 *       **Note:** Deletion may fail if the element is referenced by other records.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique ID of the element to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Element deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Element deleted successfully"
 *       404:
 *         description: Element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Element not found"
 *       500:
 *         description: Internal server error or foreign key constraint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               constraint_error:
 *                 summary: Element is referenced by other records
 *                 value:
 *                   error: "Cannot delete element as it is referenced by other records"
 *               server_error:
 *                 summary: General server error
 *                 value:
 *                   error: "Failed to delete element"
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM elements WHERE element_id = $1 RETURNING *", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Element not found" });
    }
    
    res.json({ message: "Element deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /category/{category}:
 *   get:
 *     tags: [Elements]
 *     summary: Get elements by category
 *     description: |
 *       Retrieve all construction elements that belong to a specific category.
 *       This is useful for filtering elements by their type or construction phase.
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["Foundation", "Structural", "Architectural", "Finishing", "Utility", "External", "Circulation", "MEP"]
 *         description: The category to filter elements by
 *         example: "Finishing"
 *     responses:
 *       200:
 *         description: List of elements in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
 *             example:
 *               - element_id: 1
 *                 element_name: "Doors"
 *                 element_category: "Finishing"
 *                 element_description: "Interior and exterior doors"
 *                 linetype: null
 *                 phase: "finishing"
 *               - element_id: 2
 *                 element_name: "Windows"
 *                 element_category: "Finishing"
 *                 element_description: "Glass windows for natural light"
 *                 linetype: "continuous"
 *                 phase: "finishing"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get elements by category
router.get('/category/:category', async (req, res) => {
  const db = req.db;
  const { category } = req.params;
  
  try {
    const result = await db.query("SELECT * FROM elements WHERE element_category = $1", [category]);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /search/{term}:
 *   get:
 *     tags: [Elements]
 *     summary: Search elements by name or description
 *     description: |
 *       Search for construction elements by name or description using case-insensitive partial matching.
 *       The search will look for the term in both element_name and element_description fields.
 *     parameters:
 *       - in: path
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search term to look for in element names and descriptions
 *         example: "door"
 *     responses:
 *       200:
 *         description: List of elements matching the search term
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
 *             example:
 *               - element_id: 1
 *                 element_name: "Doors"
 *                 element_category: "Finishing"
 *                 element_description: "Interior and exterior doors for rooms"
 *                 linetype: null
 *                 phase: "finishing"
 *               - element_id: 15
 *                 element_name: "Garage Door"
 *                 element_category: "External"
 *                 element_description: "Overhead garage door system"
 *                 linetype: "hidden"
 *                 phase: "finishing"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Search elements by name or description
router.get('/search/:term', async (req, res) => {
  const db = req.db;
  const { term } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM elements WHERE element_name ILIKE $1 OR element_description ILIKE $1",
      [`%${term}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;