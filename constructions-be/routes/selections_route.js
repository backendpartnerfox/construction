const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Selections
 *   description: API for managing client selections
 */

/**
 * @swagger
 * /selections:
 *   get:
 *     tags: [Selections]
 *     description: Retrieve all selections
 *     responses:
 *       200:
 *         description: List of selections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   selection_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   block_id:
 *                     type: integer
 *                   selection_code:
 *                     type: string
 *                   selection_name:
 *                     type: string
 *                   selection_category:
 *                     type: string
 *                   item_id:
 *                     type: integer
 *                   current_choice_id:
 *                     type: integer
 *                   available_choices:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   selection_deadline:
 *                     type: string
 *                     format: date
 *                   reminder_sent:
 *                     type: boolean
 *                   reminder_date:
 *                     type: string
 *                     format: date
 *                   depends_on_selections:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   blocks_units:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   status:
 *                     type: string
 *                   selected_date:
 *                     type: string
 *                     format: date
 *                   selected_by:
 *                     type: integer
 *                   approved_by:
 *                     type: integer
 *                   approval_date:
 *                     type: string
 *                     format: date
 *                   selection_notes:
 *                     type: string
 *                   client_preferences:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        p.project_name,
        b.block_name,
        i.item_name,
        ic.display_name as current_choice_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        se.first_name || ' ' || se.last_name as selected_by_name,
        ae.first_name || ' ' || ae.last_name as approved_by_name
      FROM selections s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN items i ON s.item_id = i.item_id
      LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_option_id
      LEFT JOIN employees e ON s.created_by = e.employee_id
      LEFT JOIN employees se ON s.selected_by = se.employee_id
      LEFT JOIN employees ae ON s.approved_by = ae.employee_id
      ORDER BY s.project_id, s.selection_deadline
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });

/**
 * @swagger
 * /selections/{id}:
 *   delete:
 *     summary: Delete a selection
 *     tags: [Selections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The selection item ID to delete
 *     responses:
 *       200:
 *         description: Selection deleted successfully
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('🗑️ Deleting selection:', id);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Verify selection exists
    const selectionCheck = await client.query(
      'SELECT selection_item_id FROM selection_items WHERE selection_item_id = $1',
      [id]
    );
    
    if (selectionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Selection not found' 
      });
    }

    // Delete client_selection first (foreign key constraint)
    await client.query(
      'DELETE FROM client_selections WHERE selection_item_id = $1',
      [id]
    );

    // Delete selection_item
    await client.query(
      'DELETE FROM selection_items WHERE selection_item_id = $1',
      [id]
    );

    await client.query('COMMIT');

    console.log('✅ Selection deleted successfully:', id);

    res.json({
      success: true,
      message: 'Selection deleted successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error during delete:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  } finally {
    client.release();
  }
});
  }
});

/**
 * @swagger
 * /selections/{id}:
 *   get:
 *     tags: [Selections]
 *     description: Retrieve a specific selection by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to retrieve
 *     responses:
 *       200:
 *         description: Selection details
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        p.project_name,
        b.block_name,
        i.item_name,
        ic.display_name as current_choice_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        se.first_name || ' ' || se.last_name as selected_by_name,
        ae.first_name || ' ' || ae.last_name as approved_by_name
      FROM selections s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN items i ON s.item_id = i.item_id
      LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_option_id
      LEFT JOIN employees e ON s.created_by = e.employee_id
      LEFT JOIN employees se ON s.selected_by = se.employee_id
      LEFT JOIN employees ae ON s.approved_by = ae.employee_id
      WHERE s.selection_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    // Get available choice details
    if (result.rows[0].available_choices && result.rows[0].available_choices.length > 0) {
      const choicesResult = await db.query(`
        SELECT choice_option_id, display_name, package as unit_price 
        FROM item_choices 
        WHERE choice_option_id = ANY($1)
      `, [result.rows[0].available_choices]);
      
      result.rows[0].available_choices_details = choicesResult.rows;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * FIXED: Handle both workflows:
 * 1. selections table - for deadline/workflow management
 * 2. selection_items + client_selections - for actual material selections
 */

/**
 * @swagger
 * /selections/project/{projectId}:
 *   get:
 *     tags: [Selections]
 *     description: Retrieve all selections for a specific project (Combined view)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of selections for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  console.log('📋 Fetching selections for project:', projectId);
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    // Get selection items with their client selections (if any)
    const result = await db.query(`
      SELECT 
        si.selection_item_id,
        si.project_id,
        si.unit_id,
        si.item_id,
        si.selection_category,
        si.selection_subcategory,
        si.location_description,
        si.selection_due_date,
        si.quantity_required,
        si.unit_of_measurement,
        si.budgeted_amount,
        si.budgeted_rate_per_unit,
        si.selection_status,
        si.selection_guidelines,
        si.architect_recommendations,
        si.created_at,
        
        -- Client selection details (if selected)
        cs.client_selection_id,
        cs.selected_choice_option_id,
        cs.selected_brand,
        cs.selected_model,
        cs.selected_color,
        cs.selected_pattern,
        cs.selected_size,
        cs.selected_finish,
        cs.selected_unit_price,
        cs.selected_total_price,
        cs.price_difference,
        cs.custom_specifications,
        cs.sample_approved,
        cs.client_approved,
        cs.selection_date,
        cs.status as client_selection_status,
        
        -- Related data
        u.unit_code,
        u.unit_name,
        i.item_name,
        ic.display_name as choice_display_name,
        ic.brand as choice_brand,
        ic.model as choice_model
        
      FROM selection_items si
      LEFT JOIN client_selections cs ON si.selection_item_id = cs.selection_item_id
      LEFT JOIN units u ON si.unit_id = u.unit_id
      LEFT JOIN items i ON si.item_id = i.item_id
      LEFT JOIN item_choices ic ON cs.selected_choice_option_id = ic.choice_option_id
      WHERE si.project_id = $1 
      ORDER BY si.selection_due_date, si.selection_category, si.selection_item_id
    `, [projectId]);
    
    // Transform data to match frontend expectations
    const transformedData = result.rows.map(row => {
      return {
        // Map to frontend field names
        selection_id: row.selection_item_id,  // Frontend expects selection_id
        project_id: row.project_id,
        unit_id: row.unit_id,
        category: row.selection_category,     // Frontend expects category
        item_name: row.item_name || `${row.selection_category} Item`, // Frontend expects item_name
        specification: row.selection_guidelines || row.location_description || '',
        choice_option_id: row.selected_choice_option_id,
        brand: row.selected_brand || row.choice_brand || '',
        model: row.selected_model || row.choice_model || '',
        color: row.selected_color || '',
        finish: row.selected_finish || '',
        quantity: row.quantity_required || 0,
        unit: row.unit_of_measurement || '',
        unit_price: row.selected_unit_price || row.budgeted_rate_per_unit || 0,
        total_price: row.selected_total_price || row.budgeted_amount || 0,
        status: row.client_selection_status || row.selection_status || 'Pending',
        approved_by_client: row.client_approved || false,
        is_active: true,
        
        // Additional useful fields
        unit_code: row.unit_code,
        unit_name: row.unit_name,
        selection_due_date: row.selection_due_date,
        selection_date: row.selection_date,
        sample_approved: row.sample_approved || false,
        price_difference: row.price_difference || 0,
        custom_specifications: row.custom_specifications || '',
        
        // Internal IDs for updates
        _selection_item_id: row.selection_item_id,
        _client_selection_id: row.client_selection_id
      };
    });
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /selections/block/{blockId}:
 *   get:
 *     tags: [Selections]
 *     description: Retrieve all selections for a specific block
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the block
 *     responses:
 *       200:
 *         description: List of selections for the block
 *       404:
 *         description: Block not found
 *       500:
 *         description: Internal server error
 */
router.get('/block/:blockId', async (req, res) => {
  const db = req.db;
  const { blockId } = req.params;
  
  try {
    // First check if block exists
    const blockCheck = await db.query('SELECT block_id FROM blocks WHERE block_id = $1', [blockId]);
    
    if (blockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    const result = await db.query(`
      SELECT s.*, i.item_name, ic.display_name as current_choice_name
      FROM selections s
      LEFT JOIN items i ON s.item_id = i.item_id
      LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_option_id
      WHERE s.block_id = $1 
      ORDER BY s.selection_deadline, s.selection_name
    `, [blockId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /selections:
 *   post:
 *     summary: Create a new selection
 *     tags: [Selections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - selection_name
 *               - selection_deadline
 *             properties:
 *               project_id:
 *                 type: integer
 *               block_id:
 *                 type: integer
 *               selection_code:
 *                 type: string
 *               selection_name:
 *                 type: string
 *               selection_category:
 *                 type: string
 *               item_id:
 *                 type: integer
 *               current_choice_id:
 *                 type: integer
 *               available_choices:
 *                 type: array
 *                 items:
 *                   type: integer
 *               selection_deadline:
 *                 type: string
 *                 format: date
 *               reminder_sent:
 *                 type: boolean
 *               reminder_date:
 *                 type: string
 *                 format: date
 *               depends_on_selections:
 *                 type: array
 *                 items:
 *                   type: integer
 *               blocks_units:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *               selected_date:
 *                 type: string
 *                 format: date
 *               selected_by:
 *                 type: integer
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *               selection_notes:
 *                 type: string
 *               client_preferences:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Selection created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project or referenced entity not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /selections:
 *   post:
 *     summary: Create a new selection or update existing client selection
 *     tags: [Selections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - category
 *             properties:
 *               project_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               category:
 *                 type: string
 *               item_name:
 *                 type: string
 *               specification:
 *                 type: string
 *               choice_option_id:
 *                 type: integer
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               color:
 *                 type: string
 *               finish:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *               approved_by_client:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Selection created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id,
    unit_id,
    category,          // Maps to selection_category
    item_name,         // We'll find/create the item
    specification,     // Maps to location_description/guidelines
    choice_option_id,  // Maps to selected_choice_option_id
    brand,             // Maps to selected_brand
    model,             // Maps to selected_model
    color,             // Maps to selected_color
    finish,            // Maps to selected_finish
    quantity,          // Maps to quantity_required
    unit,              // Maps to unit_of_measurement
    unit_price,        // Maps to selected_unit_price
    total_price,       // Maps to selected_total_price
    status,            // Maps to status
    approved_by_client,// Maps to client_approved
    created_by
  } = req.body;

  console.log('➕ Creating selection:', { category, item_name, project_id });
  console.log('📊 Frontend data received:', req.body);

  // Validate required fields
  if (!project_id || !category) {
    return res.status(400).json({ 
      success: false,
      error: "Required fields: project_id, category" 
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Verify project exists
    const projectCheck = await client.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Find or create the item if item_name is provided
    let item_id = null;
    if (item_name) {
      const itemCheck = await client.query(
        'SELECT item_id FROM items WHERE LOWER(item_name) = LOWER($1)',
        [item_name]
      );
      
      if (itemCheck.rows.length > 0) {
        item_id = itemCheck.rows[0].item_id;
      } else {
        // Create new item
        const newItem = await client.query(
          `INSERT INTO items (item_name, item_description, item_category, is_active)
           VALUES ($1, $2, $3, true) RETURNING item_id`,
          [item_name, specification || `${category} item`, category]
        );
        item_id = newItem.rows[0].item_id;
      }
    }

    // Create or find selection_item
    let selection_item_id;
    const selectionItemCheck = await client.query(
      `SELECT selection_item_id FROM selection_items 
       WHERE project_id = $1 AND unit_id = $2 AND selection_category = $3 AND item_id = $4`,
      [project_id, unit_id, category, item_id]
    );

    if (selectionItemCheck.rows.length > 0) {
      selection_item_id = selectionItemCheck.rows[0].selection_item_id;
    } else {
      // Create new selection_item
      const newSelectionItem = await client.query(
        `INSERT INTO selection_items (
          project_id, unit_id, item_id, selection_category,
          location_description, quantity_required, unit_of_measurement,
          budgeted_rate_per_unit, budgeted_amount, selection_due_date,
          selection_status, selection_guidelines, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING selection_item_id`,
        [
          parseInt(project_id),
          unit_id ? parseInt(unit_id) : null,
          item_id,
          category,
          specification || '',
          parseFloat(quantity) || 0,
          unit || '',
          parseFloat(unit_price) || 0,
          parseFloat(total_price) || (parseFloat(quantity || 0) * parseFloat(unit_price || 0)),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status || 'Pending',
          specification || '',
          created_by || null
        ]
      );
      selection_item_id = newSelectionItem.rows[0].selection_item_id;
    }

    // Create or update client_selection
    let clientSelection;
    const clientSelectionCheck = await client.query(
      'SELECT client_selection_id FROM client_selections WHERE selection_item_id = $1',
      [selection_item_id]
    );

    if (clientSelectionCheck.rows.length > 0) {
      // Update existing client selection
      clientSelection = await client.query(
        `UPDATE client_selections SET
          selected_choice_option_id = $2,
          selected_brand = $3,
          selected_model = $4,
          selected_color = $5,
          selected_finish = $6,
          selected_unit_price = $7,
          selected_total_price = $8,
          custom_specifications = $9,
          client_approved = $10,
          status = $11
         WHERE selection_item_id = $1
         RETURNING *`,
        [
          selection_item_id,
          choice_option_id ? parseInt(choice_option_id) : null,
          brand || null,
          model || null,
          color || null,
          finish || null,
          parseFloat(unit_price) || null,
          parseFloat(total_price) || null,
          specification || null,
          approved_by_client || false,
          status || 'Selected'
        ]
      );
    } else {
      // Create new client selection
      clientSelection = await client.query(
        `INSERT INTO client_selections (
          selection_item_id, selected_choice_option_id, selected_brand,
          selected_model, selected_color, selected_finish,
          selected_unit_price, selected_total_price, custom_specifications,
          client_approved, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          selection_item_id,
          choice_option_id ? parseInt(choice_option_id) : null,
          brand || null,
          model || null,
          color || null,
          finish || null,
          parseFloat(unit_price) || null,
          parseFloat(total_price) || null,
          specification || null,
          approved_by_client || false,
          status || 'Selected'
        ]
      );
    }

    await client.query('COMMIT');

    // Transform response to match frontend expectations
    const responseData = {
      selection_id: selection_item_id,
      project_id: parseInt(project_id),
      unit_id: unit_id ? parseInt(unit_id) : null,
      category,
      item_name,
      specification: specification || '',
      choice_option_id: choice_option_id ? parseInt(choice_option_id) : null,
      brand: brand || '',
      model: model || '',
      color: color || '',
      finish: finish || '',
      quantity: parseFloat(quantity) || 0,
      unit: unit || '',
      unit_price: parseFloat(unit_price) || 0,
      total_price: parseFloat(total_price) || 0,
      status: status || 'Selected',
      approved_by_client: approved_by_client || false,
      is_active: true,
      _selection_item_id: selection_item_id,
      _client_selection_id: clientSelection.rows[0].client_selection_id
    };

    console.log('✅ Selection created successfully:', selection_item_id);

    res.status(201).json({
      success: true,
      message: 'Selection created successfully',
      data: responseData
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /selections/{id}:
 *   put:
 *     summary: Update an existing selection
 *     tags: [Selections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The selection item ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               item_name:
 *                 type: string
 *               specification:
 *                 type: string
 *               choice_option_id:
 *                 type: integer
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               color:
 *                 type: string
 *               finish:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *               approved_by_client:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Selection updated successfully
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params; // This is the selection_item_id
  const { 
    category,          // Maps to selection_category
    item_name,         // We'll update the item
    specification,     // Maps to location_description/guidelines
    choice_option_id,  // Maps to selected_choice_option_id
    brand,             // Maps to selected_brand
    model,             // Maps to selected_model
    color,             // Maps to selected_color
    finish,            // Maps to selected_finish
    quantity,          // Maps to quantity_required
    unit,              // Maps to unit_of_measurement
    unit_price,        // Maps to selected_unit_price
    total_price,       // Maps to selected_total_price
    status,            // Maps to status
    approved_by_client,// Maps to client_approved
    updated_by
  } = req.body;

  console.log('✏️ Updating selection:', id);
  console.log('📊 Update data received:', req.body);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Verify selection item exists
    const selectionCheck = await client.query(
      'SELECT selection_item_id, item_id FROM selection_items WHERE selection_item_id = $1',
      [id]
    );
    
    if (selectionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Selection not found' 
      });
    }

    const { item_id } = selectionCheck.rows[0];

    // Update item if item_name is provided
    if (item_name && item_id) {
      await client.query(
        'UPDATE items SET item_name = $1, item_description = $2 WHERE item_id = $3',
        [item_name, specification || '', item_id]
      );
    }

    // Update selection_item
    await client.query(
      `UPDATE selection_items SET
        selection_category = $2,
        location_description = $3,
        quantity_required = $4,
        unit_of_measurement = $5,
        budgeted_rate_per_unit = $6,
        budgeted_amount = $7,
        selection_status = $8,
        selection_guidelines = $9
       WHERE selection_item_id = $1`,
      [
        parseInt(id),
        category || null,
        specification || null,
        parseFloat(quantity) || 0,
        unit || null,
        parseFloat(unit_price) || 0,
        parseFloat(total_price) || (parseFloat(quantity || 0) * parseFloat(unit_price || 0)),
        status || 'Pending',
        specification || null
      ]
    );

    // Update or create client_selection
    const clientSelectionCheck = await client.query(
      'SELECT client_selection_id FROM client_selections WHERE selection_item_id = $1',
      [id]
    );

    if (clientSelectionCheck.rows.length > 0) {
      // Update existing client selection
      await client.query(
        `UPDATE client_selections SET
          selected_choice_option_id = $2,
          selected_brand = $3,
          selected_model = $4,
          selected_color = $5,
          selected_finish = $6,
          selected_unit_price = $7,
          selected_total_price = $8,
          custom_specifications = $9,
          client_approved = $10,
          status = $11
         WHERE selection_item_id = $1`,
        [
          parseInt(id),
          choice_option_id ? parseInt(choice_option_id) : null,
          brand || null,
          model || null,
          color || null,
          finish || null,
          parseFloat(unit_price) || null,
          parseFloat(total_price) || null,
          specification || null,
          approved_by_client || false,
          status || 'Selected'
        ]
      );
    } else {
      // Create new client selection
      await client.query(
        `INSERT INTO client_selections (
          selection_item_id, selected_choice_option_id, selected_brand,
          selected_model, selected_color, selected_finish,
          selected_unit_price, selected_total_price, custom_specifications,
          client_approved, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          parseInt(id),
          choice_option_id ? parseInt(choice_option_id) : null,
          brand || null,
          model || null,
          color || null,
          finish || null,
          parseFloat(unit_price) || null,
          parseFloat(total_price) || null,
          specification || null,
          approved_by_client || false,
          status || 'Selected'
        ]
      );
    }

    await client.query('COMMIT');

    console.log('✅ Selection updated successfully:', id);

    res.json({
      success: true,
      message: 'Selection updated successfully',
      data: {
        selection_id: parseInt(id),
        category,
        item_name,
        specification,
        brand,
        model,
        color,
        finish,
        quantity: parseFloat(quantity) || 0,
        unit,
        unit_price: parseFloat(unit_price) || 0,
        total_price: parseFloat(total_price) || 0,
        status,
        approved_by_client: approved_by_client || false
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error during update:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /selections/{id}:
 *   put:
 *     summary: Update an existing selection
 *     tags: [Selections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               block_id:
 *                 type: integer
 *               selection_code:
 *                 type: string
 *               selection_name:
 *                 type: string
 *               selection_category:
 *                 type: string
 *               item_id:
 *                 type: integer
 *               current_choice_id:
 *                 type: integer
 *               available_choices:
 *                 type: array
 *                 items:
 *                   type: integer
 *               selection_deadline:
 *                 type: string
 *                 format: date
 *               reminder_sent:
 *                 type: boolean
 *               reminder_date:
 *                 type: string
 *                 format: date
 *               depends_on_selections:
 *                 type: array
 *                 items:
 *                   type: integer
 *               blocks_units:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *               selected_date:
 *                 type: string
 *                 format: date
 *               selected_by:
 *                 type: integer
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *               selection_notes:
 *                 type: string
 *               client_preferences:
 *                 type: string
 *     responses:
 *       200:
 *         description: Selection updated successfully
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.selection_id;
  delete updates.project_id;
  delete updates.created_at;
  delete updates.created_by;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Verify block exists if provided
    if (updates.block_id) {
      const blockCheck = await db.query('SELECT block_id FROM blocks WHERE block_id = $1', [updates.block_id]);
      if (blockCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Block not found' });
      }
    }

    // Verify item exists if provided
    if (updates.item_id) {
      const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [updates.item_id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
    }

    // Verify current choice exists if provided
    if (updates.current_choice_id) {
      const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [updates.current_choice_id]);
      if (choiceCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Choice not found' });
      }
    }

    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE selections 
       SET ${setClause}
       WHERE selection_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Selection not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /selections/{id}:
 *   delete:
 *     summary: Delete a selection
 *     tags: [Selections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection to delete
 *     responses:
 *       200:
 *         description: Selection deleted successfully
 *       400:
 *         description: Cannot delete selection with dependencies
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if selection is a dependency for other selections
    const depCheck = await db.query(
      'SELECT COUNT(*) FROM selections WHERE $1 = ANY(depends_on_selections)',
      [id]
    );
    
    if (parseInt(depCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete selection because other selections depend on it." 
      });
    }
    
    const result = await db.query('DELETE FROM selections WHERE selection_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Selection not found" });
    }
    
    res.json({ message: "Selection deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /selections/pending/{projectId}:
 *   get:
 *     tags: [Selections]
 *     description: Get all pending selections for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *     responses:
 *       200:
 *         description: List of pending selections
 *       500:
 *         description: Internal server error
 */
router.get('/pending/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, b.block_name, i.item_name, ic.display_name as current_choice_name
      FROM selections s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN items i ON s.item_id = i.item_id
      LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_option_id
      WHERE s.project_id = $1 AND s.status = 'Pending'
      ORDER BY s.selection_deadline ASC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /selections/overdue/{projectId}:
 *   get:
 *     tags: [Selections]
 *     description: Get overdue selections for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *     responses:
 *       200:
 *         description: List of overdue selections
 *       500:
 *         description: Internal server error
 */
router.get('/overdue/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, b.block_name, i.item_name, ic.display_name as current_choice_name
      FROM selections s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN items i ON s.item_id = i.item_id
      LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_option_id
      WHERE s.project_id = $1 
        AND s.status = 'Pending' 
        AND s.selection_deadline < CURRENT_DATE
      ORDER BY s.selection_deadline ASC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /selections/reminders-due:
 *   get:
 *     tags: [Selections]
 *     description: Get selections that need reminders sent
 *     responses:
 *       200:
 *         description: List of selections needing reminders
 *       500:
 *         description: Internal server error
 */
router.get('/reminders-due', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT s.*, p.project_name, b.block_name, i.item_name
      FROM selections s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN items i ON s.item_id = i.item_id
      WHERE s.status = 'Pending' 
        AND s.reminder_sent = false
        AND s.reminder_date <= CURRENT_DATE
      ORDER BY s.selection_deadline ASC
    `);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /selections/{id}/make-selection:
 *   post:
 *     summary: Make a selection (choose an option)
 *     tags: [Selections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the selection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_choice_id
 *               - selected_by
 *             properties:
 *               current_choice_id:
 *                 type: integer
 *               selection_notes:
 *                 type: string
 *               selected_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Selection made successfully
 *       400:
 *         description: Invalid choice ID
 *       404:
 *         description: Selection not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/make-selection', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { current_choice_id, selection_notes, selected_by } = req.body;

  if (!current_choice_id || !selected_by) {
    return res.status(400).json({ error: "Required fields: current_choice_id, selected_by" });
  }

  try {
    // Get the selection to verify available choices
    const selectionCheck = await db.query(
      'SELECT selection_id, available_choices FROM selections WHERE selection_id = $1',
      [id]
    );

    if (selectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    // Verify the choice is available
    if (selectionCheck.rows[0].available_choices && 
        !selectionCheck.rows[0].available_choices.includes(current_choice_id)) {
      return res.status(400).json({ error: 'Selected choice is not in available choices' });
    }

    const result = await db.query(
      `UPDATE selections 
       SET current_choice_id = $2, 
           selected_date = CURRENT_DATE, 
           selected_by = $3,
           selection_notes = COALESCE($4, selection_notes),
           status = 'Selected'
       WHERE selection_id = $1
       RETURNING *`,
      [id, current_choice_id, selected_by, selection_notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;