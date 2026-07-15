const express = require('express');
const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    const db = req.db;
    try {
        const {
            status,
            client_id,
            location,
            project_manager_id,
            search,
            page = 1,
            limit = 100
        } = req.query;

        let query = `
            SELECT 
                p.project_id,
                p.project_code,
                p.project_name,
                p.description,
                p.project_type,
                p.location,
                p.site_address,
                p.status,
                p.completion_percentage,
                p.start_date,
                p.estimated_end_date,
                p.actual_end_date,
                p.estimated_budget,
                p.actual_cost,
                p.currency,
                p.total_area,
                p.area_unit,
                p.number_of_floors,
                p.priority,
                p.tags,
                p.notes,
                p.created_at,
                p.client_id,
                c.client_name,
                c.email as client_email,
                c.phone as client_phone,
                p.project_manager_id,
                pm.first_name || ' ' || pm.last_name as project_manager_name,
                p.architect_id,
                arch.first_name || ' ' || arch.last_name as architect_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN employees pm ON p.project_manager_id = pm.employee_id
            LEFT JOIN employees arch ON p.architect_id = arch.employee_id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (client_id) {
            query += ` AND p.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        if (location) {
            query += ` AND p.location ILIKE $${paramIndex}`;
            params.push(`%${location}%`);
            paramIndex++;
        }

        if (project_manager_id) {
            query += ` AND p.project_manager_id = $${paramIndex}`;
            params.push(project_manager_id);
            paramIndex++;
        }

        if (search) {
            query += ` AND (p.project_name ILIKE $${paramIndex} OR p.project_code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.rowCount
            }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get project statistics - MUST BE BEFORE /:id route
router.get('/statistics', async (req, res) => {
    const db = req.db;
    try {
        console.log('📊 Fetching project statistics...');
        
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_projects,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as active_projects,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
                COUNT(CASE WHEN status = 'Planning' THEN 1 END) as planning_projects,
                COALESCE(SUM(estimated_budget), 0) as total_budget
            FROM projects
            WHERE status != 'Cancelled'
        `);

        console.log('✅ Statistics fetched:', result.rows[0]);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error fetching project statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get projects by client ID
router.get('/client/:clientId', async (req, res) => {
    const db = req.db;
    try {
        const { clientId } = req.params;
        
        console.log('Fetching projects for client:', clientId);

        const query = `
            SELECT 
                p.project_id,
                p.project_code,
                p.project_name,
                p.description,
                p.project_type,
                p.location,
                p.site_address,
                p.status,
                p.completion_percentage,
                p.start_date,
                p.estimated_end_date,
                p.actual_end_date,
                p.estimated_budget,
                p.actual_cost,
                p.currency,
                p.total_area,
                p.area_unit,
                p.number_of_floors,
                p.priority,
                p.tags,
                p.notes,
                p.created_at,
                p.client_id,
                c.client_name,
                c.email as client_email,
                c.phone as client_phone,
                p.project_manager_id,
                pm.first_name || ' ' || pm.last_name as project_manager_name,
                p.architect_id,
                arch.first_name || ' ' || arch.last_name as architect_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN employees pm ON p.project_manager_id = pm.employee_id
            LEFT JOIN employees arch ON p.architect_id = arch.employee_id
            WHERE p.client_id = $1
            ORDER BY p.created_at DESC
        `;

        const result = await db.query(query, [clientId]);

        console.log(`Found ${result.rows.length} projects for client ${clientId}`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching projects by client:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    const db = req.db;
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p.*,
                c.client_name,
                c.email as client_email,
                c.phone as client_phone,
                pm.first_name || ' ' || pm.last_name as project_manager_name,
                arch.first_name || ' ' || arch.last_name as architect_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN employees pm ON p.project_manager_id = pm.employee_id
            LEFT JOIN employees arch ON p.architect_id = arch.employee_id
            WHERE p.project_id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create project
router.post('/', async (req, res) => {
    const db = req.db;
    try {
        const {
            project_name,
            client_id,
            project_manager_id,
            architect_id,
            description,
            project_type,
            location,
            site_address,
            start_date,
            estimated_end_date,
            estimated_budget,
            total_area,
            area_unit,
            number_of_floors,
            priority,
            tags,
            notes
        } = req.body;

        // Validate required fields
        if (!project_name || !client_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: project_name and client_id are required'
            });
        }

        // Generate project code
        const codeQuery = `
            SELECT 
                'PRJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                LPAD((COALESCE(MAX(CAST(SUBSTRING(project_code FROM 10) AS INT)), 0) + 1)::TEXT, 3, '0') as project_code
            FROM projects
            WHERE project_code LIKE 'PRJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
        `;
        const codeResult = await db.query(codeQuery);
        const project_code = codeResult.rows[0].project_code;

        const insertQuery = `
            INSERT INTO projects (
                project_name, project_code, client_id, project_manager_id, architect_id,
                description, project_type, location, site_address,
                start_date, estimated_end_date, status, completion_percentage,
                estimated_budget, actual_cost, currency,
                total_area, area_unit, number_of_floors,
                priority, tags, notes, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Planning', 0,
                $12, 0, 'INR', $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
            ) RETURNING project_id, project_code, project_name
        `;

        const result = await db.query(insertQuery, [
            project_name, project_code, client_id, project_manager_id, architect_id,
            description, project_type, location, site_address,
            start_date, estimated_end_date, estimated_budget || 0,
            total_area || 0, area_unit || 'sqft', number_of_floors || 0,
            priority || 3, tags, notes
        ]);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    const db = req.db;
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'project_id') {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const updateQuery = `
            UPDATE projects 
            SET ${fields.join(', ')}
            WHERE project_id = $${paramIndex}
            RETURNING project_id, project_name, project_code, status
        `;

        const result = await db.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete/Cancel project
router.delete('/:id', async (req, res) => {
    const db = req.db;
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const updateQuery = `
            UPDATE projects
            SET 
                status = 'Cancelled',
                notes = COALESCE(notes || E'\\n\\n', '') || 
                        'CANCELLED on ' || CURRENT_DATE || ' - Reason: ' || $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE project_id = $2
            RETURNING project_id, project_name, status
        `;

        const result = await db.query(updateQuery, [reason || 'No reason provided', id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project cancelled successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
