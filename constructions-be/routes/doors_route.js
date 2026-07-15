const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Doors
 *   description: API for managing Doors
 */
/**
 * @swagger
 * /doors:
 *   get:
 *     tags: [Doors]
 *     description: Retrieve all doors
 *     responses:
 *       200:
 *         description: List of doors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Door'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM doors ORDER BY door_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doors:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch doors', details: err.message });
  }
});

/**
 * @swagger
 * /doors/{id}:
 *   get:
 *     tags: [Doors]
 *     description: Retrieve a single door by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door
 *     responses:
 *       200:
 *         description: A single door
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Door'
 *       404:
 *         description: Door not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM doors WHERE door_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching door:', err.message);
    res.status(500).json({ error: 'Failed to fetch door', details: err.message });
  }
});

/**
 * @swagger
 * /doors:
 *   post:
 *     tags: [Doors]
 *     description: Create a new door
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoorInput'
 *     responses:
 *       201:
 *         description: Door created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Door'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, floor, room, location_description, wall_direction,
    door_material, door_style, door_finish, dimension_id, quantity,
    custom_design, custom_design_description, custom_image_path, 
    polish_type, polish_color, polish_coats, special_treatment,
    unit_price, gst_percentage,
    has_frame, frame_material, frame_finish, frame_width, frame_height, 
    frame_thickness, frame_depth, frame_profile, frame_price,
    lock_type, handle_type, hinge_type, hinge_quantity, hardware_finish, hardware_price,
    has_peephole, has_door_closer, has_weather_strip, has_threshold, additional_features,
    installation_required, installation_price, delivery_date, installation_date,
    status, is_approved, approved_by, approval_date, notes, created_by
  } = req.body;

  try {
    // Add computed fields
    const gst_amount = unit_price && gst_percentage ? (unit_price * quantity * gst_percentage / 100) : 0;
    const total_amount = unit_price ? (unit_price * quantity + gst_amount) : 0;

    const result = await db.query(
      `INSERT INTO doors 
       (project_id, floor, room, location_description, wall_direction,
        door_material, door_style, door_finish, dimension_id, quantity,
        custom_design, custom_design_description, custom_image_path, 
        polish_type, polish_color, polish_coats, special_treatment,
        unit_price, gst_percentage, gst_amount, total_amount,
        has_frame, frame_material, frame_finish, frame_width, frame_height, 
        frame_thickness, frame_depth, frame_profile, frame_price,
        lock_type, handle_type, hinge_type, hinge_quantity, hardware_finish, hardware_price,
        has_peephole, has_door_closer, has_weather_strip, has_threshold, additional_features,
        installation_required, installation_price, delivery_date, installation_date,
        status, is_approved, approved_by, approval_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
               $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, 
               $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51)
       RETURNING *`,
      [project_id, floor, room, location_description, wall_direction,
        door_material, door_style, door_finish, dimension_id, quantity,
        custom_design, custom_design_description, custom_image_path, 
        polish_type, polish_color, polish_coats, special_treatment,
        unit_price, gst_percentage, gst_amount, total_amount,
        has_frame, frame_material, frame_finish, frame_width, frame_height, 
        frame_thickness, frame_depth, frame_profile, frame_price,
        lock_type, handle_type, hinge_type, hinge_quantity, hardware_finish, hardware_price,
        has_peephole, has_door_closer, has_weather_strip, has_threshold, additional_features,
        installation_required, installation_price, delivery_date, installation_date,
        status, is_approved, approved_by, approval_date, notes, created_by]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating door:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    res.status(500).json({ error: 'Failed to create door', details: err.message });
  }
});

/**
 * @swagger
 * /doors/{id}:
 *   put:
 *     tags: [Doors]
 *     description: Update an existing door
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoorInput'
 *     responses:
 *       200:
 *         description: Door updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Door'
 *       404:
 *         description: Door not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, floor, room, location_description, wall_direction,
    door_material, door_style, door_finish, dimension_id, quantity,
    custom_design, custom_design_description, custom_image_path, 
    polish_type, polish_color, polish_coats, special_treatment,
    unit_price, gst_percentage,
    has_frame, frame_material, frame_finish, frame_width, frame_height, 
    frame_thickness, frame_depth, frame_profile, frame_price,
    lock_type, handle_type, hinge_type, hinge_quantity, hardware_finish, hardware_price,
    has_peephole, has_door_closer, has_weather_strip, has_threshold, additional_features,
    installation_required, installation_price, delivery_date, installation_date,
    status, is_approved, approved_by, approval_date, notes, updated_by
  } = req.body;

  try {
    // Add computed fields
    const gst_amount = unit_price && gst_percentage ? (unit_price * quantity * gst_percentage / 100) : 0;
    const total_amount = unit_price ? (unit_price * quantity + gst_amount) : 0;

    const result = await db.query(
      `UPDATE doors 
       SET project_id = $1, floor = $2, room = $3, location_description = $4, wall_direction = $5,
           door_material = $6, door_style = $7, door_finish = $8, dimension_id = $9, quantity = $10,
           custom_design = $11, custom_design_description = $12, custom_image_path = $13, 
           polish_type = $14, polish_color = $15, polish_coats = $16, special_treatment = $17,
           unit_price = $18, gst_percentage = $19, gst_amount = $20, total_amount = $21,
           has_frame = $22, frame_material = $23, frame_finish = $24, frame_width = $25, frame_height = $26, 
           frame_thickness = $27, frame_depth = $28, frame_profile = $29, frame_price = $30,
           lock_type = $31, handle_type = $32, hinge_type = $33, hinge_quantity = $34, hardware_finish = $35, hardware_price = $36,
           has_peephole = $37, has_door_closer = $38, has_weather_strip = $39, has_threshold = $40, additional_features = $41,
           installation_required = $42, installation_price = $43, delivery_date = $44, installation_date = $45,
           status = $46, is_approved = $47, approved_by = $48, approval_date = $49, notes = $50, 
           updated_by = $51, updated_at = CURRENT_TIMESTAMP
       WHERE door_id = $52
       RETURNING *`,
      [project_id, floor, room, location_description, wall_direction,
        door_material, door_style, door_finish, dimension_id, quantity,
        custom_design, custom_design_description, custom_image_path, 
        polish_type, polish_color, polish_coats, special_treatment,
        unit_price, gst_percentage, gst_amount, total_amount,
        has_frame, frame_material, frame_finish, frame_width, frame_height, 
        frame_thickness, frame_depth, frame_profile, frame_price,
        lock_type, handle_type, hinge_type, hinge_quantity, hardware_finish, hardware_price,
        has_peephole, has_door_closer, has_weather_strip, has_threshold, additional_features,
        installation_required, installation_price, delivery_date, installation_date,
        status, is_approved, approved_by, approval_date, notes, updated_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating door:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    res.status(500).json({ error: 'Failed to update door', details: err.message });
  }
});

/**
 * @swagger
 * /doors/{id}:
 *   delete:
 *     tags: [Doors]
 *     description: Delete a door
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door
 *     responses:
 *       204:
 *         description: Door deleted successfully
 *       404:
 *         description: Door not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM doors WHERE door_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting door:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete due to references from other tables' });
    }
    res.status(500).json({ error: 'Failed to delete door', details: err.message });
  }
});

/**
 * @swagger
 * /doors/project/{projectId}:
 *   get:
 *     tags: [Doors]
 *     description: Retrieve all doors for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of doors for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Door'
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM doors WHERE project_id = $1 ORDER BY door_id DESC',
      [projectId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doors for project:', err.message);
    res.status(500).json({ error: 'Failed to fetch doors for project', details: err.message });
  }
});

/**
 * @swagger
 * /doors/room:
 *   get:
 *     tags: [Doors]
 *     description: Retrieve all doors for a specific room in a project
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: query
 *         name: floor
 *         required: true
 *         schema:
 *           type: string
 *         description: The floor of the room
 *       - in: query
 *         name: room
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the room
 *     responses:
 *       200:
 *         description: List of doors for the room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Door'
 */
router.get('/room', async (req, res) => {
  const db = req.db;
  const { projectId, floor, room } = req.query;
  
  if (!projectId || !floor || !room) {
    return res.status(400).json({ error: 'Project ID, floor, and room are required' });
  }
  
  try {
    const result = await db.query(
      'SELECT * FROM doors WHERE project_id = $1 AND floor = $2 AND room = $3 ORDER BY door_id DESC',
      [projectId, floor, room]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doors for room:', err.message);
    res.status(500).json({ error: 'Failed to fetch doors for room', details: err.message });
  }
});

/**
 * @swagger
 * /doors/status/{status}:
 *   get:
 *     tags: [Doors]
 *     description: Retrieve all doors with a specific status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status of the doors (Planned, Ordered, Delivered, Installed, Completed)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Optional project ID to filter results
 *     responses:
 *       200:
 *         description: List of doors with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Door'
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  const { projectId } = req.query;
  
  try {
    let query = 'SELECT * FROM doors WHERE status = $1';
    let params = [status];
    
    if (projectId) {
      query += ' AND project_id = $2';
      params.push(projectId);
    }
    
    query += ' ORDER BY door_id DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doors by status:', err.message);
    res.status(500).json({ error: 'Failed to fetch doors by status', details: err.message });
  }
});

/**
 * @swagger
 * /doors/{id}/approve:
 *   put:
 *     tags: [Doors]
 *     description: Approve a door
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved_by:
 *                 type: integer
 *                 description: The ID of the employee approving the door
 *             required:
 *               - approved_by
 *     responses:
 *       200:
 *         description: Door approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Door'
 *       404:
 *         description: Door not found
 */
router.put('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;
  
  if (!approved_by) {
    return res.status(400).json({ error: 'Approver ID is required' });
  }
  
  try {
    const result = await db.query(
      `UPDATE doors 
       SET is_approved = TRUE, 
           approved_by = $1, 
           approval_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE door_id = $2
       RETURNING *`,
      [approved_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error approving door:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced approver does not exist' });
    }
    res.status(500).json({ error: 'Failed to approve door', details: err.message });
  }
});

/**
 * @swagger
 * /doors/{id}/update-status:
 *   put:
 *     tags: [Doors]
 *     description: Update the status of a door
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status (Planned, Ordered, Delivered, Installed, Completed)
 *               updated_by:
 *                 type: integer
 *                 description: The ID of the employee updating the status
 *             required:
 *               - status
 *               - updated_by
 *     responses:
 *       200:
 *         description: Door status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Door'
 *       404:
 *         description: Door not found
 *       400:
 *         description: Invalid status
 */
router.put('/:id/update-status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status, updated_by } = req.body;
  
  if (!status || !updated_by) {
    return res.status(400).json({ error: 'Status and updater ID are required' });
  }
  
  const validStatuses = ['Planned', 'Ordered', 'Delivered', 'Installed', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
  }
  
  try {
    const result = await db.query(
      `UPDATE doors 
       SET status = $1, 
           updated_by = $2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE door_id = $3
       RETURNING *`,
      [status, updated_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating door status:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced updater does not exist' });
    }
    res.status(500).json({ error: 'Failed to update door status', details: err.message });
  }
});

module.exports = router;