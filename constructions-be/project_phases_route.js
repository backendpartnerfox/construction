const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectPhases
 *   description: API for managing project phases
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectPhase:
 *       type: object
 *       required:
 *         - project_id
 *         - phase_id
 *         - phase_name
 *       properties:
 *         project_phase_id:
 *           type: integer
 *           description: Unique identifier for the project phase mapping
 *           example: 1
 *         project_id:
 *           type: integer
 *           description: Reference to the project
 *           example: 1
 *         phase_id:
 *           type: integer
 *           description: Reference to the phase
 *           example: 2
 *         phase_name:
 *           type: string
 *           description: Name of the phase for this project
 *           example: "Foundation Phase"
 *         phase_description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the phase
 *           example: "All foundation work including excavation, PCC, and RCC"
 *         sequence_number:
 *           type: integer
 *           nullable: true
 *           description: Order of execution for this phase
 *           example: 1
 *         estimated_start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Planned start date for the phase
 *           example: "2024-02-01"
 *         estimated_end_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Planned end date for the phase
 *           example: "2024-02-28"
 *         actual_start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Actual start date of the phase
 *           example: "2024-02-05"
 *         actual_end_date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Actual end date of the phase
 *           example: null
 *         phase_status:
 *           type: string
 *           nullable: true
 *           description: Current status of the phase
 *           enum: ["Not Started", "In Progress", "Completed", "On Hold", "Cancelled"]
 *           example: "In Progress"
 *         budget_allocated:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Budget allocated for this phase
 *           example: 1500000.00
 *         actual_cost:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Actual cost incurred for this phase
 *           example: 1450000.00
 *         progress_percentage:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Overall progress percentage of the phase
 *           example: 85.5
 *         dependencies:
 *           type: object
 *           nullable: true
 *           description: JSON object containing phase dependencies
 *           example: {"depends_on": [1], "blocks": [2, 3]}
 *         milestone_description:
 *           type: string
 *           nullable: true
 *           description: Key milestones for this phase
 *           example: "Foundation completion, plinth level reached"
 *         deliverables:
 *           type: string
 *           nullable: true
 *           description: Expected deliverables from this phase
 *           example: "Completed foundation ready for superstructure"
 *         risks:
 *           type: string
 *           nullable: true
 *           description: Identified risks for this phase
 *           example: "Weather delays, soil condition variations"
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes
 *           example: "Soil testing required before excavation"
 *         created_by:
 *           type: integer
 *           nullable: true
 *           description: ID of user who created the record
 *           example: 1
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *           example: "2024-01-15T10:00:00Z"
 *         updated_by:
 *           type: integer
 *           nullable: true
 *           description: ID of user who last updated the record
 *           example: 1
 *         updated_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of last update
 *           example: "2024-01-20T14:30:00Z"
 *     ProjectPhaseCreate:
 *       type: object
 *       required:
 *         - project_id
 *         - phase_id
 *         - phase_name
 *       properties:
 *         project_id:
 *           type: integer
 *           description: Reference to the project
 *           example: 1
 *         phase_id:
 *           type: integer
 *           description: Reference to the phase
 *           example: 2
 *         phase_name:
 *           type: string
 *           description: Name of the phase for this project
 *           example: "Foundation Phase"
 *         phase_description:
 *           type: string
 *           description: Detailed description of the phase
 *           example: "All foundation work including excavation, PCC, and RCC"
 *         sequence_number:
 *           type: integer
 *           description: Order of execution for this phase
 *           example: 1
 *         estimated_start_date:
 *           type: string
 *           format: date
 *           description: Planned start date for the phase
 *           example: "2024-02-01"
 *         estimated_end_date:
 *           type: string
 *           format: date
 *           description: Planned end date for the phase
 *           example: "2024-02-28"
 *         budget_allocated:
 *           type: number
 *           format: decimal
 *           description: Budget allocated for this phase
 *           example: 1500000.00
 *         dependencies:
 *           type: object
 *           description: JSON object containing phase dependencies
 *           example: {"depends_on": [1], "blocks": [2, 3]}
 *         milestone_description:
 *           type: string
 *           description: Key milestones for this phase
 *           example: "Foundation completion, plinth level reached"
 *         deliverables:
 *           type: string
 *           description: Expected deliverables from this phase
 *           example: "Completed foundation ready for superstructure"
 *         risks:
 *           type: string
 *           description: Identified risks for this phase
 *           example: "Weather delays, soil condition variations"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Soil testing required before excavation"
 *         created_by:
 *           type: integer
 *           description: ID of user who created the record
 *           example: 1
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Project phase not found"
 */

// Middleware to check if table exists
async function checkTableExists(db) {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'project_phases'
      );
    `);
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking table existence:', err);
    return false;
  }
}

// Middleware to create table if it doesn't exist
async function ensureTableExists(req, res, next) {
  const db = req.db;
  
  try {
    const tableExists = await checkTableExists(db);
    
    if (!tableExists) {
      // First create the phases table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS phases (
          phase_id SERIAL PRIMARY KEY,
          phase_name VARCHAR(100) NOT NULL,
          phase_description TEXT,
          typical_duration_days INT,
          is_milestone BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Insert some default phases
      await db.query(`
        INSERT INTO phases (phase_name, phase_description, typical_duration_days, is_milestone)
        SELECT * FROM (VALUES
          ('Site Preparation', 'Site clearing, surveying, and preparation', 7, false),
          ('Foundation', 'Excavation, footings, and foundation work', 30, true),
          ('Structural', 'Columns, beams, slabs, and structural framework', 90, true),
          ('Masonry', 'Brick work, block work, and walls', 60, false),
          ('Roofing', 'Roof structure and covering', 21, true),
          ('Electrical', 'Electrical wiring and installations', 30, false),
          ('Plumbing', 'Plumbing and water systems', 30, false),
          ('Flooring', 'Floor finishing and tiling', 21, false),
          ('Painting', 'Interior and exterior painting', 14, false),
          ('Finishing', 'Final touches and completion', 14, true)
        ) AS v(phase_name, phase_description, typical_duration_days, is_milestone)
        WHERE NOT EXISTS (SELECT 1 FROM phases WHERE phase_name = v.phase_name);
      `);

      // Create the project_phases table
      await db.query(`
        CREATE TABLE project_phases (
          project_phase_id SERIAL PRIMARY KEY,
          project_id INT NOT NULL,
          phase_id INT NOT NULL,
          phase_name VARCHAR(255) NOT NULL,
          phase_description TEXT,
          sequence_number INT,
          estimated_start_date DATE,
          estimated_end_date DATE,
          actual_start_date DATE,
          actual_end_date DATE,
          phase_status VARCHAR(50) DEFAULT 'Not Started',
          budget_allocated DECIMAL(15,2),
          actual_cost DECIMAL(15,2),
          progress_percentage DECIMAL(5,2) DEFAULT 0,
          dependencies JSONB,
          milestone_description TEXT,
          deliverables TEXT,
          risks TEXT,
          notes TEXT,
          created_by INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_by INT,
          updated_at TIMESTAMP WITH TIME ZONE,
          
          FOREIGN KEY (project_id) REFERENCES projects(project_id),
          FOREIGN KEY (phase_id) REFERENCES phases(phase_id),
          FOREIGN KEY (created_by) REFERENCES employees(employee_id),
          FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
          
          CONSTRAINT check_phase_status CHECK (
            phase_status IN ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled')
          ),
          CONSTRAINT check_progress CHECK (
            progress_percentage >= 0 AND progress_percentage <= 100
          ),
          CONSTRAINT check_dates CHECK (
            estimated_end_date >= estimated_start_date AND
            (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
          )
        );
      `);

      // Create indexes
      await db.query(`
        CREATE INDEX idx_project_phases_project ON project_phases(project_id);
        CREATE INDEX idx_project_phases_phase ON project_phases(phase_id);
        CREATE INDEX idx_project_phases_status ON project_phases(phase_status);
        CREATE INDEX idx_project_phases_sequence ON project_phases(project_id, sequence_number);
      `);

      console.log('Tables created successfully');
    }
    
    next();
  } catch (err) {
    console.error('Error ensuring table exists:', err);
    return res.status(500).json({ 
      error: 'Database initialization error', 
      details: err.message 
    });
  }
}

// Apply middleware to all routes
router.use(ensureTableExists);

/**
 * @swagger
 * /project-phases:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Retrieve all project phases
 *     description: Get a list of all project phases with optional filtering
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: phase_id
 *         schema:
 *           type: integer
 *         description: Filter by phase ID
 *       - in: query
 *         name: phase_status
 *         schema:
 *           type: string
 *           enum: ["Not Started", "In Progress", "Completed", "On Hold", "Cancelled"]
 *         description: Filter by phase status
 *     responses:
 *       200:
 *         description: Successfully retrieved project phases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectPhase'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/project-phases', async (req, res) => {
  const db = req.db;
  const { project_id, phase_id, phase_status } = req.query;
  
  try {
    let query = 'SELECT * FROM project_phases WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (phase_id) {
      paramCount++;
      query += ` AND phase_id = $${paramCount}`;
      params.push(phase_id);
    }

    if (phase_status) {
      paramCount++;
      query += ` AND phase_status = $${paramCount}`;
      params.push(phase_status);
    }

    query += ' ORDER BY project_id, sequence_number, created_at';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/{id}:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Retrieve a specific project phase
 *     description: Get detailed information about a specific project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase
 *     responses:
 *       200:
 *         description: Project phase found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectPhase'
 *       404:
 *         description: Project phase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/project-phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_phases WHERE project_phase_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project phase not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases:
 *   post:
 *     tags: [ProjectPhases]
 *     summary: Create a new project phase
 *     description: Create a new project phase mapping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectPhaseCreate'
 *     responses:
 *       201:
 *         description: Project phase created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectPhase'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/project-phases', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    phase_id,
    phase_name,
    phase_description,
    sequence_number,
    estimated_start_date,
    estimated_end_date,
    budget_allocated,
    dependencies,
    milestone_description,
    deliverables,
    risks,
    notes,
    created_by
  } = req.body;

  // Validation
  if (!project_id || !phase_id || !phase_name) {
    return res.status(400).json({ 
      error: 'project_id, phase_id, and phase_name are required' 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO project_phases (
        project_id, phase_id, phase_name, phase_description,
        sequence_number, estimated_start_date, estimated_end_date,
        budget_allocated, dependencies, milestone_description,
        deliverables, risks, notes, created_by, phase_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Not Started')
      RETURNING *`,
      [
        project_id, phase_id, phase_name, phase_description,
        sequence_number, estimated_start_date, estimated_end_date,
        budget_allocated, dependencies, milestone_description,
        deliverables, risks, notes, created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/{id}:
 *   put:
 *     tags: [ProjectPhases]
 *     summary: Update a project phase
 *     description: Update an existing project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectPhaseCreate'
 *     responses:
 *       200:
 *         description: Project phase updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectPhase'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project phase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/project-phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    phase_id,
    phase_name,
    phase_description,
    sequence_number,
    estimated_start_date,
    estimated_end_date,
    actual_start_date,
    actual_end_date,
    phase_status,
    budget_allocated,
    actual_cost,
    progress_percentage,
    dependencies,
    milestone_description,
    deliverables,
    risks,
    notes,
    updated_by
  } = req.body;

  // Validation
  if (!project_id || !phase_id || !phase_name) {
    return res.status(400).json({ 
      error: 'project_id, phase_id, and phase_name are required' 
    });
  }

  try {
    const result = await db.query(
      `UPDATE project_phases SET
        project_id = $1, phase_id = $2, phase_name = $3, phase_description = $4,
        sequence_number = $5, estimated_start_date = $6, estimated_end_date = $7,
        actual_start_date = $8, actual_end_date = $9, phase_status = $10,
        budget_allocated = $11, actual_cost = $12, progress_percentage = $13,
        dependencies = $14, milestone_description = $15, deliverables = $16,
        risks = $17, notes = $18, updated_by = $19, updated_at = CURRENT_TIMESTAMP
      WHERE project_phase_id = $20
      RETURNING *`,
      [
        project_id, phase_id, phase_name, phase_description,
        sequence_number, estimated_start_date, estimated_end_date,
        actual_start_date, actual_end_date, phase_status,
        budget_allocated, actual_cost, progress_percentage,
        dependencies, milestone_description, deliverables,
        risks, notes, updated_by, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project phase not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/{id}:
 *   delete:
 *     tags: [ProjectPhases]
 *     summary: Delete a project phase
 *     description: Delete a project phase by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase to delete
 *     responses:
 *       200:
 *         description: Project phase deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project phase deleted successfully"
 *       404:
 *         description: Project phase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/project-phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM project_phases WHERE project_phase_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project phase not found' });
    }
    
    res.json({ message: 'Project phase deleted successfully' });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/project/{project_id}:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Get all phases for a project
 *     description: Retrieve all phases for a specific project, ordered by sequence
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Successfully retrieved project phases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectPhase'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/project-phases/project/:project_id', async (req, res) => {
  const db = req.db;
  const { project_id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_phases WHERE project_id = $1 ORDER BY sequence_number, created_at',
      [project_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/{id}/update-status:
 *   patch:
 *     tags: [ProjectPhases]
 *     summary: Update phase status
 *     description: Update the status and progress of a project phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phase_status
 *             properties:
 *               phase_status:
 *                 type: string
 *                 enum: ["Not Started", "In Progress", "Completed", "On Hold", "Cancelled"]
 *                 description: New status for the phase
 *                 example: "In Progress"
 *               progress_percentage:
 *                 type: number
 *                 format: decimal
 *                 description: Progress percentage
 *                 example: 45.5
 *               actual_start_date:
 *                 type: string
 *                 format: date
 *                 description: Actual start date (if starting)
 *                 example: "2024-02-05"
 *               actual_end_date:
 *                 type: string
 *                 format: date
 *                 description: Actual end date (if completing)
 *                 example: "2024-02-25"
 *               actual_cost:
 *                 type: number
 *                 format: decimal
 *                 description: Actual cost incurred
 *                 example: 1475000.00
 *               notes:
 *                 type: string
 *                 description: Notes about the status change
 *                 example: "Foundation work started"
 *               updated_by:
 *                 type: integer
 *                 description: ID of user updating
 *                 example: 1
 *     responses:
 *       200:
 *         description: Phase status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectPhase'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project phase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/project-phases/:id/update-status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { 
    phase_status, 
    progress_percentage,
    actual_start_date, 
    actual_end_date,
    actual_cost,
    notes,
    updated_by 
  } = req.body;

  if (!phase_status) {
    return res.status(400).json({ error: 'phase_status is required' });
  }

  try {
    // Build dynamic update query
    const updates = [`phase_status = $1`];
    const values = [phase_status];
    let valueIndex = 2;

    if (progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${valueIndex}`);
      values.push(progress_percentage);
      valueIndex++;
    }

    if (actual_start_date !== undefined) {
      updates.push(`actual_start_date = $${valueIndex}`);
      values.push(actual_start_date);
      valueIndex++;
    }

    if (actual_end_date !== undefined) {
      updates.push(`actual_end_date = $${valueIndex}`);
      values.push(actual_end_date);
      valueIndex++;
    }

    if (actual_cost !== undefined) {
      updates.push(`actual_cost = $${valueIndex}`);
      values.push(actual_cost);
      valueIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${valueIndex}`);
      values.push(notes);
      valueIndex++;
    }

    if (updated_by !== undefined) {
      updates.push(`updated_by = $${valueIndex}`);
      values.push(updated_by);
      valueIndex++;
    }

    // Update progress based on status
    if (phase_status === 'Completed' && progress_percentage === undefined) {
      updates.push(`progress_percentage = 100`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    values.push(id);

    const query = `
      UPDATE project_phases 
      SET ${updates.join(', ')}
      WHERE project_phase_id = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project phase not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/phase/{phase_id}:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Get all projects using a specific phase
 *     description: Retrieve all project phase mappings for a specific phase ID
 *     parameters:
 *       - in: path
 *         name: phase_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase
 *     responses:
 *       200:
 *         description: Successfully retrieved project phases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectPhase'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/project-phases/phase/:phase_id', async (req, res) => {
  const db = req.db;
  const { phase_id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_phases WHERE phase_id = $1 ORDER BY project_id, sequence_number',
      [phase_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project-phases/{id}/update-progress:
 *   patch:
 *     tags: [ProjectPhases]
 *     summary: Update phase progress and cost
 *     description: Update only the progress percentage and actual cost of a phase
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project phase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress_percentage:
 *                 type: number
 *                 format: decimal
 *                 description: Progress percentage
 *                 example: 75.5
 *               actual_cost:
 *                 type: number
 *                 format: decimal
 *                 description: Actual cost incurred
 *                 example: 1475000.00
 *               updated_by:
 *                 type: integer
 *                 description: ID of user updating
 *                 example: 1
 *     responses:
 *       200:
 *         description: Phase progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectPhase'
 *       404:
 *         description: Project phase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/project-phases/:id/update-progress', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { progress_percentage, actual_cost, updated_by } = req.body;

  try {
    // Build dynamic update query
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${valueIndex}`);
      values.push(progress_percentage);
      valueIndex++;
    }

    if (actual_cost !== undefined) {
      updates.push(`actual_cost = $${valueIndex}`);
      values.push(actual_cost);
      valueIndex++;
    }

    if (updated_by !== undefined) {
      updates.push(`updated_by = $${valueIndex}`);
      values.push(updated_by);
      valueIndex++;
    }

    // Update status based on progress
    if (progress_percentage !== undefined) {
      if (progress_percentage === 100) {
        updates.push(`phase_status = 'Completed'`);
      } else if (progress_percentage > 0) {
        updates.push(`phase_status = 'In Progress'`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    values.push(id);

    const query = `
      UPDATE project_phases 
      SET ${updates.join(', ')}
      WHERE project_phase_id = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project phase not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phases:
 *   get:
 *     tags: [ProjectPhases]
 *     summary: Get all available phases
 *     description: Retrieve all phases from the phases master table
 *     responses:
 *       200:
 *         description: Successfully retrieved phases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phase_id:
 *                     type: integer
 *                     example: 1
 *                   phase_name:
 *                     type: string
 *                     example: "Foundation"
 *                   phase_description:
 *                     type: string
 *                     example: "Excavation, footings, and foundation work"
 *                   typical_duration_days:
 *                     type: integer
 *                     example: 30
 *                   is_milestone:
 *                     type: boolean
 *                     example: true
 *                   is_active:
 *                     type: boolean
 *                     example: true
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/phases', async (req, res) => {
  const db = req.db;
  
  try {
    // Check if phases table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'phases'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create phases table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS phases (
          phase_id SERIAL PRIMARY KEY,
          phase_name VARCHAR(100) NOT NULL,
          phase_description TEXT,
          typical_duration_days INT,
          is_milestone BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Insert default phases
      await db.query(`
        INSERT INTO phases (phase_name, phase_description, typical_duration_days, is_milestone)
        VALUES
          ('Site Preparation', 'Site clearing, surveying, and preparation', 7, false),
          ('Foundation', 'Excavation, footings, and foundation work', 30, true),
          ('Structural', 'Columns, beams, slabs, and structural framework', 90, true),
          ('Masonry', 'Brick work, block work, and walls', 60, false),
          ('Roofing', 'Roof structure and covering', 21, true),
          ('Electrical', 'Electrical wiring and installations', 30, false),
          ('Plumbing', 'Plumbing and water systems', 30, false),
          ('Flooring', 'Floor finishing and tiling', 21, false),
          ('Painting', 'Interior and exterior painting', 14, false),
          ('Finishing', 'Final touches and completion', 14, true);
      `);
    }
    
    const result = await db.query('SELECT * FROM phases WHERE is_active = true ORDER BY phase_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
