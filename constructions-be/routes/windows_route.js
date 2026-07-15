const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Windows
 *   description: API for managing windows in construction projects
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Window:
 *       type: object
 *       properties:
 *         window_id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         floor:
 *           type: string
 *         room:
 *           type: string
 *         location_description:
 *           type: string
 *         wall_direction:
 *           type: string
 *         window_type:
 *           type: string
 *         opening_type:
 *           type: string
 *         window_material:
 *           type: string
 *         window_style:
 *           type: string
 *         window_finish:
 *           type: string
 *         dimension_id:
 *           type: integer
 *         quantity:
 *           type: integer
 *         glass_type:
 *           type: string
 *         glass_thickness:
 *           type: number
 *         is_tempered:
 *           type: boolean
 *         is_laminated:
 *           type: boolean
 *         is_low_e:
 *           type: boolean
 *         is_tinted:
 *           type: boolean
 *         tint_color:
 *           type: string
 *         u_value:
 *           type: number
 *         shgc_value:
 *           type: number
 *         custom_design:
 *           type: boolean
 *         custom_design_description:
 *           type: string
 *         unit_price:
 *           type: number
 *         gst_percentage:
 *           type: number
 *         gst_amount:
 *           type: number
 *         total_amount:
 *           type: number
 *         has_frame:
 *           type: boolean
 *         frame_material:
 *           type: string
 *         frame_finish:
 *           type: string
 *         frame_price:
 *           type: number
 *         lock_type:
 *           type: string
 *         handle_type:
 *           type: string
 *         hardware_finish:
 *           type: string
 *         hardware_price:
 *           type: number
 *         has_screen:
 *           type: boolean
 *         screen_type:
 *           type: string
 *         has_blinds:
 *           type: boolean
 *         blinds_type:
 *           type: string
 *         has_grilles:
 *           type: boolean
 *         grille_pattern:
 *           type: string
 *         installation_required:
 *           type: boolean
 *         installation_price:
 *           type: number
 *         delivery_date:
 *           type: string
 *           format: date
 *         installation_date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [Planned, Ordered, Delivered, Installed, Completed]
 *         notes:
 *           type: string
 *         created_by:
 *           type: integer
 */

/**
 * @swagger
 * /windows:
 *   post:
 *     tags: [Windows]
 *     description: Create a new window
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - floor
 *               - room
 *               - window_type
 *               - dimension_id
 *             properties:
 *               project_id:
 *                 type: integer
 *                 description: Project ID
 *               floor:
 *                 type: string
 *                 description: Floor where window is located
 *               room:
 *                 type: string
 *                 description: Room where window is located
 *               location_description:
 *                 type: string
 *                 description: Additional location details
 *               wall_direction:
 *                 type: string
 *                 description: Wall orientation (North, South, East, West)
 *               window_type:
 *                 type: string
 *                 description: Type of window
 *               opening_type:
 *                 type: string
 *                 description: How the window opens
 *               window_material:
 *                 type: string
 *                 description: Window frame material
 *               window_style:
 *                 type: string
 *                 description: Style of window
 *               window_finish:
 *                 type: string
 *                 description: Finish of window
 *               dimension_id:
 *                 type: integer
 *                 description: Reference to dimension table
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 description: Number of windows
 *               glass_type:
 *                 type: string
 *                 description: Type of glass
 *               glass_thickness:
 *                 type: number
 *                 description: Thickness of glass in mm
 *               is_tempered:
 *                 type: boolean
 *                 default: false
 *               is_laminated:
 *                 type: boolean
 *                 default: false
 *               is_low_e:
 *                 type: boolean
 *                 default: false
 *               is_tinted:
 *                 type: boolean
 *                 default: false
 *               tint_color:
 *                 type: string
 *               u_value:
 *                 type: number
 *                 description: Thermal transmittance
 *               shgc_value:
 *                 type: number
 *                 description: Solar heat gain coefficient
 *               custom_design:
 *                 type: boolean
 *                 default: false
 *               custom_design_description:
 *                 type: string
 *               privacy_level:
 *                 type: string
 *               special_treatment:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *               has_frame:
 *                 type: boolean
 *                 default: true
 *               frame_material:
 *                 type: string
 *               frame_finish:
 *                 type: string
 *               frame_width:
 *                 type: number
 *               frame_height:
 *                 type: number
 *               frame_thickness:
 *                 type: number
 *               frame_depth:
 *                 type: number
 *               frame_profile:
 *                 type: string
 *               frame_price:
 *                 type: number
 *               lock_type:
 *                 type: string
 *               handle_type:
 *                 type: string
 *               operation_mechanism:
 *                 type: string
 *               hardware_finish:
 *                 type: string
 *               hardware_price:
 *                 type: number
 *               has_screen:
 *                 type: boolean
 *                 default: false
 *               screen_type:
 *                 type: string
 *               has_blinds:
 *                 type: boolean
 *                 default: false
 *               blinds_type:
 *                 type: string
 *               has_grilles:
 *                 type: boolean
 *                 default: false
 *               grille_pattern:
 *                 type: string
 *               has_weather_strip:
 *                 type: boolean
 *                 default: false
 *               has_sill:
 *                 type: boolean
 *                 default: false
 *               sill_material:
 *                 type: string
 *               is_egress_compliant:
 *                 type: boolean
 *                 default: false
 *               additional_features:
 *                 type: string
 *               installation_required:
 *                 type: boolean
 *                 default: true
 *               installation_price:
 *                 type: number
 *               delivery_date:
 *                 type: string
 *                 format: date
 *               installation_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 default: Planned
 *                 enum: [Planned, Ordered, Delivered, Installed, Completed]
 *               room_id:
 *                 type: integer
 *               window_wall_ratio:
 *                 type: number
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Window created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Window'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, floor, room, location_description, wall_direction,
    window_type, opening_type, window_material, window_style, window_finish,
    dimension_id, quantity, glass_type, glass_thickness,
    is_tempered, is_laminated, is_low_e, is_tinted, tint_color,
    u_value, shgc_value, custom_design, custom_design_description,
    custom_image_path, privacy_level, special_treatment,
    unit_price, gst_percentage, has_frame, frame_material, frame_finish,
    frame_width, frame_height, frame_thickness, frame_depth, frame_profile, frame_price,
    lock_type, handle_type, operation_mechanism, hardware_finish, hardware_price,
    has_screen, screen_type, has_blinds, blinds_type, has_grilles, grille_pattern,
    has_weather_strip, has_sill, sill_material, is_egress_compliant,
    additional_features, installation_required, installation_price,
    delivery_date, installation_date, status, room_id, window_wall_ratio,
    notes, created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !floor || !room || !window_type || !dimension_id) {
    return res.status(400).json({ 
      error: 'Required fields: project_id, floor, room, window_type, dimension_id' 
    });
  }

  try {
    console.log('Creating window with data:', req.body);
    
    // Calculate GST and total amount if unit price is provided
    let gst_amount = null;
    let total_amount = null;
    
    if (unit_price && gst_percentage) {
      gst_amount = (unit_price * (quantity || 1) * gst_percentage) / 100;
      total_amount = (unit_price * (quantity || 1)) + gst_amount;
    } else if (unit_price) {
      total_amount = unit_price * (quantity || 1);
    }

    const query = `
      INSERT INTO windows (
        project_id, floor, room, location_description, wall_direction,
        window_type, opening_type, window_material, window_style, window_finish,
        dimension_id, quantity, glass_type, glass_thickness,
        is_tempered, is_laminated, is_low_e, is_tinted, tint_color,
        u_value, shgc_value, custom_design, custom_design_description,
        custom_image_path, privacy_level, special_treatment,
        unit_price, gst_percentage, gst_amount, total_amount,
        has_frame, frame_material, frame_finish, frame_width, frame_height,
        frame_thickness, frame_depth, frame_profile, frame_price,
        lock_type, handle_type, operation_mechanism, hardware_finish, hardware_price,
        has_screen, screen_type, has_blinds, blinds_type, has_grilles, grille_pattern,
        has_weather_strip, has_sill, sill_material, is_egress_compliant,
        additional_features, installation_required, installation_price,
        delivery_date, installation_date, status, room_id, window_wall_ratio,
        notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
        $61, $62, $63, $64
      ) RETURNING *`;

    const values = [
      project_id, floor, room, location_description, wall_direction,
      window_type, opening_type, window_material, window_style, window_finish,
      dimension_id, quantity || 1, glass_type, glass_thickness,
      is_tempered || false, is_laminated || false, is_low_e || false, 
      is_tinted || false, tint_color,
      u_value, shgc_value, custom_design || false, custom_design_description,
      custom_image_path, privacy_level, special_treatment,
      unit_price, gst_percentage, gst_amount, total_amount,
      has_frame !== false, frame_material, frame_finish, frame_width, frame_height,
      frame_thickness, frame_depth, frame_profile, frame_price,
      lock_type, handle_type, operation_mechanism, hardware_finish, hardware_price,
      has_screen || false, screen_type, has_blinds || false, blinds_type, 
      has_grilles || false, grille_pattern,
      has_weather_strip || false, has_sill || false, sill_material, is_egress_compliant || false,
      additional_features, installation_required !== false, installation_price,
      delivery_date, installation_date, status || 'Planned', room_id, window_wall_ratio,
      notes, created_by
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Error creating window:', err);
    console.error('Error details:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ 
        error: 'Invalid reference: Check project_id, dimension_id, room_id, or created_by exists' 
      });
    }
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Window with these details already exists' });
    }
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// [Previous routes remain the same]

/**
 * @swagger
 * /windows/{id}:
 *   delete:
 *     tags: [Windows]
 *     description: Delete a window
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window
 *     responses:
 *       204:
 *         description: Window deleted successfully
 *       404:
 *         description: Window not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM windows WHERE window_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting window:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete due to references from other tables' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /windows/project/{projectId}:
 *   get:
 *     tags: [Windows]
 *     description: Retrieve all windows for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of windows for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Window'
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM windows WHERE project_id = $1',
      [projectId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching windows for project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /windows/room:
 *   get:
 *     tags: [Windows]
 *     description: Retrieve all windows for a specific room in a project
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
 *         description: List of windows for the room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Window'
 */
router.get('/room', async (req, res) => {
  const db = req.db;
  const { projectId, floor, room } = req.query;
  
  if (!projectId || !floor || !room) {
    return res.status(400).json({ error: 'Project ID, floor, and room are required' });
  }
  
  try {
    const result = await db.query(
      'SELECT * FROM windows WHERE project_id = $1 AND floor = $2 AND room = $3',
      [projectId, floor, room]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching windows for room:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /windows/status/{status}:
 *   get:
 *     tags: [Windows]
 *     description: Retrieve all windows with a specific status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status of the windows (Planned, Ordered, Delivered, Installed, Completed)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Optional project ID to filter results
 *     responses:
 *       200:
 *         description: List of windows with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Window'
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  const { projectId } = req.query;
  
  try {
    let query = 'SELECT * FROM windows WHERE status = $1';
    let params = [status];
    
    if (projectId) {
      query += ' AND project_id = $2';
      params.push(projectId);
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching windows by status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /windows/{id}/approve:
 *   put:
 *     tags: [Windows]
 *     description: Approve a window
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved_by:
 *                 type: integer
 *                 description: The ID of the employee approving the window
 *             required:
 *               - approved_by
 *     responses:
 *       200:
 *         description: Window approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Window'
 *       404:
 *         description: Window not found
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
      `UPDATE windows 
       SET is_approved = TRUE, 
           approved_by = $1, 
           approval_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE window_id = $2
       RETURNING *`,
      [approved_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error approving window:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced approver does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /windows/{id}/update-status:
 *   put:
 *     tags: [Windows]
 *     description: Update the status of a window
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window
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
 *         description: Window status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Window'
 *       404:
 *         description: Window not found
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
      `UPDATE windows 
       SET status = $1, 
           updated_by = $2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE window_id = $3
       RETURNING *`,
      [status, updated_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating window status:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced updater does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;