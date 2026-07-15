// Route Generator System for PostgreSQL Tables
// This system checks which tables don't have route files and creates them

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

class RouteGenerator {
    constructor(dbConfig, routesDir) {
        this.pool = new Pool(dbConfig);
        this.routesDir = routesDir;
        
        // Ensure routes directory exists
        if (!fs.existsSync(this.routesDir)) {
            fs.mkdirSync(this.routesDir, { recursive: true });
        }
    }

    // Get all table names from PostgreSQL
    async getAllTables() {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        
        const result = await this.pool.query(query);
        return result.rows.map(row => row.table_name);
    }

    // Get table columns and their types
    async getTableColumns(tableName) {
        const query = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `;
        
        const result = await this.pool.query(query, [tableName]);
        return result.rows;
    }

    // Check which tables don't have route files
    async getTablesWithoutRoutes() {
        const tables = await this.getAllTables();
        const missingRoutes = [];

        for (const table of tables) {
            const routeFileName = `${table}.js`;
            const routeFilePath = path.join(this.routesDir, routeFileName);
            
            if (!fs.existsSync(routeFilePath)) {
                missingRoutes.push({
                    table: table,
                    routeFile: routeFileName,
                    routePath: routeFilePath
                });
            }
        }

        return missingRoutes;
    }

    // Generate route.js file for a table
    async generateRouteFile(tableName) {
        const columns = await this.getTableColumns(tableName);
        const primaryKey = this.findPrimaryKey(columns);
        
        const routeContent = this.createRouteTemplate(tableName, columns, primaryKey);
        const routeFileName = `${tableName}.js`;
        const routeFilePath = path.join(this.routesDir, routeFileName);
        
        fs.writeFileSync(routeFilePath, routeContent);
        
        return {
            table: tableName,
            routeFile: routeFileName,
            routePath: routeFilePath,
            created: true
        };
    }

    // Find primary key column
    findPrimaryKey(columns) {
        // Common primary key patterns
        const pkPatterns = ['id', '_id', `${tableName}_id`];
        
        for (const pattern of pkPatterns) {
            const pk = columns.find(col => 
                col.column_name.toLowerCase().includes(pattern.toLowerCase())
            );
            if (pk) return pk.column_name;
        }
        
        // Return first column if no obvious PK found
        return columns[0]?.column_name || 'id';
    }

    // Create route template
    createRouteTemplate(tableName, columns, primaryKey) {
        const modelName = this.toPascalCase(tableName);
        const routeName = tableName.toLowerCase();
        
        return `const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name'
});

// GET all ${tableName}
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ${tableName} ORDER BY ${primaryKey}');
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching ${tableName}:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ${tableName}'
        });
    }
});

// GET single ${tableName.slice(0, -1)} by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM ${tableName} WHERE ${primaryKey} = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '${modelName} not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching ${tableName.slice(0, -1)}:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ${tableName.slice(0, -1)}'
        });
    }
});

// POST create new ${tableName.slice(0, -1)}
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        
        // Build dynamic insert query
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map((_, index) => \`$\${index + 1}\`);
        
        const query = \`
            INSERT INTO ${tableName} (\${columns.join(', ')}) 
            VALUES (\${placeholders.join(', ')}) 
            RETURNING *
        \`;
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: '${modelName} created successfully'
        });
    } catch (error) {
        console.error('Error creating ${tableName.slice(0, -1)}:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create ${tableName.slice(0, -1)}'
        });
    }
});

// PUT update ${tableName.slice(0, -1)}
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Build dynamic update query
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, index) => \`\${col} = $\${index + 1}\`);
        
        const query = \`
            UPDATE ${tableName} 
            SET \${setClause.join(', ')}, updated_at = NOW()
            WHERE ${primaryKey} = $\${columns.length + 1}
            RETURNING *
        \`;
        
        const result = await pool.query(query, [...values, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '${modelName} not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: '${modelName} updated successfully'
        });
    } catch (error) {
        console.error('Error updating ${tableName.slice(0, -1)}:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update ${tableName.slice(0, -1)}'
        });
    }
});

// DELETE ${tableName.slice(0, -1)}
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM ${tableName} WHERE ${primaryKey} = $1 RETURNING *', 
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '${modelName} not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: '${modelName} deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ${tableName.slice(0, -1)}:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete ${tableName.slice(0, -1)}'
        });
    }
});

// GET with pagination and filtering
router.get('/search/advanced', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '${primaryKey}', order = 'ASC', ...filters } = req.query;
        const offset = (page - 1) * limit;
        
        // Build WHERE clause for filters
        let whereClause = '';
        let values = [];
        let paramIndex = 1;
        
        if (Object.keys(filters).length > 0) {
            const conditions = [];
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== '') {
                    conditions.push(\`\${key} ILIKE $\${paramIndex}\`);
                    values.push(\`%\${value}%\`);
                    paramIndex++;
                }
            }
            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
        }
        
        const query = \`
            SELECT * FROM ${tableName} 
            \${whereClause}
            ORDER BY \${sort} \${order}
            LIMIT $\${paramIndex} OFFSET $\${paramIndex + 1}
        \`;
        
        values.push(limit, offset);
        
        const result = await pool.query(query, values);
        
        // Get total count
        const countQuery = \`SELECT COUNT(*) FROM ${tableName} \${whereClause}\`;
        const countResult = await pool.query(countQuery, values.slice(0, -2));
        const totalCount = parseInt(countResult.rows[0].count);
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error in advanced search:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform search'
        });
    }
});

module.exports = router;
`;
    }

    // Utility function to convert to PascalCase
    toPascalCase(str) {
        return str
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    // Generate routes for all missing tables
    async generateAllMissingRoutes() {
        const missingRoutes = await this.getTablesWithoutRoutes();
        const results = [];

        for (const missing of missingRoutes) {
            try {
                const result = await this.generateRouteFile(missing.table);
                results.push(result);
                console.log(`✅ Created route file: ${result.routeFile}`);
            } catch (error) {
                console.error(`❌ Failed to create route for ${missing.table}:`, error);
                results.push({
                    table: missing.table,
                    error: error.message,
                    created: false
                });
            }
        }

        return results;
    }

    // Main function to check and report
    async checkAndReport() {
        try {
            const allTables = await this.getAllTables();
            const missingRoutes = await this.getTablesWithoutRoutes();
            
            console.log(`\n📊 Database Analysis:`);
            console.log(`Total tables: ${allTables.length}`);
            console.log(`Missing route files: ${missingRoutes.length}`);
            
            if (missingRoutes.length > 0) {
                console.log(`\n❌ Tables without route files:`);
                missingRoutes.forEach(missing => {
                    console.log(`  - ${missing.table} (needs ${missing.routeFile})`);
                });
            } else {
                console.log(`\n✅ All tables have route files!`);
            }
            
            return {
                totalTables: allTables.length,
                missingRoutes: missingRoutes.length,
                tables: allTables,
                missing: missingRoutes
            };
        } catch (error) {
            console.error('Error checking routes:', error);
            throw error;
        }
    }
}

// Usage example
async function main() {
    const dbConfig = {
        user: 'your_username',
        host: 'localhost',
        database: 'your_database',
        password: 'your_password',
        port: 5432,
    };
    
    const routesDir = './routes'; // Adjust path as needed
    
    const generator = new RouteGenerator(dbConfig, routesDir);
    
    try {
        // Check current status
        const report = await generator.checkAndReport();
        
        // Generate missing routes if any
        if (report.missingRoutes > 0) {
            console.log(`\n🔧 Generating missing route files...`);
            const results = await generator.generateAllMissingRoutes();
            
            const successful = results.filter(r => r.created).length;
            const failed = results.filter(r => !r.created).length;
            
            console.log(`\n📈 Generation Results:`);
            console.log(`✅ Successfully created: ${successful} files`);
            if (failed > 0) {
                console.log(`❌ Failed: ${failed} files`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await generator.pool.end();
    }
}

// Export for use as module
module.exports = RouteGenerator;

// Run if called directly
if (require.main === module) {
    main();
}