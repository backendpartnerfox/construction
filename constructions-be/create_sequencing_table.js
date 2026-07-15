const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/constructions'
});

async function createTable() {
    const client = await pool.connect();
    try {
        console.log('Dropping existing table if exists...');
        await client.query('DROP TABLE IF EXISTS project_sequencing CASCADE');
        
        console.log('Creating project_sequencing table...');
        await client.query(`
            CREATE TABLE project_sequencing (
                sequence_id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
                phase_id INTEGER,
                task_name VARCHAR(200) NOT NULL,
                task_code VARCHAR(50),
                task_order INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                planned_start_date DATE,
                planned_end_date DATE,
                duration_days INTEGER,
                depends_on_sequence_id INTEGER,
                dependency_type VARCHAR(10) DEFAULT 'FS',
                assigned_to INTEGER,
                status VARCHAR(50) DEFAULT 'Not Started',
                progress_percentage INTEGER DEFAULT 0,
                is_critical BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER
            )
        `);
        
        console.log('Creating indexes...');
        await client.query('CREATE INDEX idx_project_sequencing_project ON project_sequencing(project_id)');
        await client.query('CREATE INDEX idx_project_sequencing_phase ON project_sequencing(phase_id)');
        await client.query('CREATE INDEX idx_project_sequencing_dependency ON project_sequencing(depends_on_sequence_id)');
        await client.query('CREATE INDEX idx_project_sequencing_assigned ON project_sequencing(assigned_to)');
        await client.query('CREATE INDEX idx_project_sequencing_status ON project_sequencing(status)');
        await client.query('CREATE INDEX idx_project_sequencing_order ON project_sequencing(project_id, task_order)');
        
        console.log('Adding foreign key for self-referencing dependency...');
        await client.query(`
            ALTER TABLE project_sequencing 
            ADD CONSTRAINT fk_depends_on_sequence 
            FOREIGN KEY (depends_on_sequence_id) REFERENCES project_sequencing(sequence_id) ON DELETE SET NULL
        `);
        
        console.log('Inserting sample data for project 16...');
        const sampleData = [
            {name: 'Site Preparation', code: 'SITE-PREP', order: 1, desc: 'Clear and level the construction site', days: 5, status: 'Completed', critical: true},
            {name: 'Foundation Excavation', code: 'FOUND-EXC', order: 2, desc: 'Excavate for foundation', days: 7, status: 'In Progress', critical: true},
            {name: 'Foundation Concrete', code: 'FOUND-CONC', order: 3, desc: 'Pour foundation concrete', days: 10, status: 'Not Started', critical: true},
            {name: 'Foundation Curing', code: 'FOUND-CURE', order: 4, desc: 'Allow foundation to cure', days: 14, status: 'Not Started', critical: true},
            {name: 'Ground Floor Slab', code: 'GF-SLAB', order: 5, desc: 'Pour ground floor slab', days: 5, status: 'Not Started', critical: true},
        ];
        
        for (const task of sampleData) {
            await client.query(`
                INSERT INTO project_sequencing 
                (project_id, task_name, task_code, task_order, description, duration_days, status, is_critical)
                VALUES (16, $1, $2, $3, $4, $5, $6, $7)
            `, [task.name, task.code, task.order, task.desc, task.days, task.status, task.critical]);
        }
        
        console.log('Setting up dependencies...');
        await client.query(`
            UPDATE project_sequencing 
            SET depends_on_sequence_id = (
                SELECT sequence_id FROM project_sequencing 
                WHERE task_order = 1 AND project_id = 16
            ) 
            WHERE task_order = 2 AND project_id = 16
        `);
        
        await client.query(`
            UPDATE project_sequencing 
            SET depends_on_sequence_id = (
                SELECT sequence_id FROM project_sequencing 
                WHERE task_order = 2 AND project_id = 16
            ) 
            WHERE task_order = 3 AND project_id = 16
        `);
        
        await client.query(`
            UPDATE project_sequencing 
            SET depends_on_sequence_id = (
                SELECT sequence_id FROM project_sequencing 
                WHERE task_order = 3 AND project_id = 16
            ) 
            WHERE task_order = 4 AND project_id = 16
        `);
        
        await client.query(`
            UPDATE project_sequencing 
            SET depends_on_sequence_id = (
                SELECT sequence_id FROM project_sequencing 
                WHERE task_order = 4 AND project_id = 16
            ) 
            WHERE task_order = 5 AND project_id = 16
        `);
        
        console.log('Calculating planned dates...');
        // Set initial date for first task
        await client.query(`
            UPDATE project_sequencing 
            SET planned_start_date = CURRENT_DATE,
                planned_end_date = CURRENT_DATE + duration_days
            WHERE depends_on_sequence_id IS NULL AND project_id = 16
        `);
        
        // Calculate subsequent dates
        for (let i = 2; i <= 5; i++) {
            await client.query(`
                UPDATE project_sequencing ps
                SET 
                    planned_start_date = prev.planned_end_date,
                    planned_end_date = prev.planned_end_date + ps.duration_days
                FROM project_sequencing prev
                WHERE ps.depends_on_sequence_id = prev.sequence_id 
                AND ps.project_id = 16 
                AND ps.task_order = $1
            `, [i]);
        }
        
        console.log('✅ Table created successfully!');
        console.log('');
        console.log('Verifying data...');
        const result = await client.query('SELECT * FROM project_sequencing WHERE project_id = 16 ORDER BY task_order');
        console.log(`Found ${result.rows.length} tasks for project 16`);
        result.rows.forEach(row => {
            console.log(`  ${row.task_order}. ${row.task_name} (${row.status}) - Depends on: ${row.depends_on_sequence_id || 'None'}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
