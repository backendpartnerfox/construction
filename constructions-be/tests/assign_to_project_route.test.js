// tests/assign_to_project_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for project assignments
const testData = {
  // User data needed for assignments
  users: [
    { id: 1, username: 'john_doe', first_name: 'John', last_name: 'Doe', email: 'john@example.com', is_active: true },
    { id: 2, username: 'jane_smith', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', is_active: true },
    { id: 3, username: 'bob_jones', first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com', is_active: true },
    { id: 4, username: 'alice_brown', first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com', is_active: false }
  ],
  
  // Project data needed for assignments
  projects: [
    { project_id: 1, project_name: 'Website Redesign', description: 'Company website redesign', status: 'active', start_date: '2024-01-01', end_date: '2024-06-01' },
    { project_id: 2, project_name: 'Mobile App', description: 'Mobile app development', status: 'active', start_date: '2024-02-01', end_date: '2024-08-01' },
    { project_id: 3, project_name: 'Data Migration', description: 'Legacy data migration', status: 'planning', start_date: '2024-03-01', end_date: '2024-05-01' },
    { project_id: 4, project_name: 'Completed Project', description: 'This project is done', status: 'completed', start_date: '2023-01-01', end_date: '2023-12-31' }
  ],
  
  // Assignment data
  seedData: [
    { id: 1, assignee: 1, assigned_by: 3, date: '2024-01-15', project_id: 1 },
    { id: 2, assignee: 2, assigned_by: 3, date: '2024-01-16', project_id: 1 },
    { id: 3, assignee: 1, assigned_by: 3, date: '2024-02-01', project_id: 2 },
    { id: 4, assignee: 3, assigned_by: 2, date: '2024-02-15', project_id: 3 }
  ],

  createData: {
    valid: {
      complete: {
        assignee: 2,
        assigned_by: 1,
        date: '2024-03-01',
        project_id: 2
      },
      minimal: {
        assignee: 3,
        assigned_by: 1,
        project_id: 3
      },
      bulk: {
        assignees: [1, 2, 3],
        assigned_by: 1,
        project_id: 3,
        date: '2024-03-10'
      }
    },
    invalid: {
      missingFields: {
        assignee: 1
        // Missing assigned_by and project_id
      },
      invalidAssignee: {
        assignee: 999,
        assigned_by: 1,
        project_id: 1
      },
      invalidProject: {
        assignee: 1,
        assigned_by: 2,
        project_id: 999
      },
      emptyBulkAssignees: {
        assignees: [],
        assigned_by: 1,
        project_id: 1
      }
    }
  },

  updateData: {
    valid: {
      changeAssignee: {
        assignee: 3,
        assigned_by: 1,
        date: '2024-01-20',
        project_id: 1
      },
      changeProject: {
        assignee: 1,
        assigned_by: 2,
        date: '2024-02-05',
        project_id: 3
      }
    },
    invalid: {
      missingRequired: {
        date: '2024-03-01'
      },
      invalidIds: {
        assignee: 999,
        assigned_by: 1,
        project_id: 1
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create required tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      email VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(50),
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assign_to_project (
      id SERIAL PRIMARY KEY,
      assignee INTEGER REFERENCES users(id),
      assigned_by INTEGER REFERENCES users(id),
      date DATE DEFAULT CURRENT_DATE,
      project_id INTEGER REFERENCES projects(project_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_assign_project ON assign_to_project(project_id);
    CREATE INDEX IF NOT EXISTS idx_assign_assignee ON assign_to_project(assignee);
    CREATE INDEX IF NOT EXISTS idx_assign_date ON assign_to_project(date);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS assign_to_project CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE assign_to_project RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE projects RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  
  // Insert users
  for (const user of testData.users) {
    await pool.query(
      'INSERT INTO users (id, username, first_name, last_name, email, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, user.username, user.first_name, user.last_name, user.email, user.is_active]
    );
  }
  
  // Insert projects
  for (const project of testData.projects) {
    await pool.query(
      'INSERT INTO projects (project_id, project_name, description, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [project.project_id, project.project_name, project.description, project.status, project.start_date, project.end_date]
    );
  }
  
  // Insert assignments
  for (const assignment of testData.seedData) {
    await pool.query(
      'INSERT INTO assign_to_project (id, assignee, assigned_by, date, project_id) VALUES ($1, $2, $3, $4, $5)',
      [assignment.id, assignment.assignee, assignment.assigned_by, assignment.date, assignment.project_id]
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 4)");
  await pool.query("SELECT setval('projects_project_id_seq', 4)");
  await pool.query("SELECT setval('assign_to_project_id_seq', 4)");
});

describe('Assign to Project API', () => {
  
  describe('GET /assign-to-project', () => {
    test('should return all assignments with user and project details', async () => {
      const response = await request(app).get('/assign-to-project');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      
      // Check structure
      const assignment = response.body[0];
      expect(assignment).toHaveProperty('id');
      expect(assignment).toHaveProperty('assignee');
      expect(assignment).toHaveProperty('assignee_name');
      expect(assignment).toHaveProperty('assignee_username');
      expect(assignment).toHaveProperty('assigned_by');
      expect(assignment).toHaveProperty('assigned_by_name');
      expect(assignment).toHaveProperty('assigned_by_username');
      expect(assignment).toHaveProperty('date');
      expect(assignment).toHaveProperty('project_id');
      expect(assignment).toHaveProperty('project_name');
      
      // Verify JOIN is working
      expect(assignment.assignee_name).toBeTruthy();
      expect(assignment.project_name).toBeTruthy();
    });
    
    test('should return assignments ordered by date DESC', async () => {
      const response = await request(app).get('/assign-to-project');
      
      const dates = response.body.map(a => new Date(a.date));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });
  });
  
  describe('GET /assign-to-project/:id', () => {
    test('should return specific assignment with details', async () => {
      const response = await request(app).get('/assign-to-project/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        assignee: 1,
        assignee_name: 'John Doe',
        assignee_username: 'john_doe',
        assigned_by: 3,
        assigned_by_name: 'Bob Jones',
        project_id: 1,
        project_name: 'Website Redesign'
      });
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).get('/assign-to-project/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project assignment not found');
    });
  });
  
  describe('POST /assign-to-project', () => {
    test('should create assignment with all fields', async () => {
      const newAssignment = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/assign-to-project')
        .send(newAssignment);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 5,
        assignee: 2,
        assignee_name: 'Jane Smith',
        assigned_by: 1,
        assigned_by_name: 'John Doe',
        project_id: 2,
        project_name: 'Mobile App'
      });
    });
    
    test('should create assignment with default date', async () => {
      const newAssignment = testData.createData.valid.minimal;
      
      const response = await request(app)
        .post('/assign-to-project')
        .send(newAssignment);
      
      expect(response.status).toBe(201);
      expect(response.body.date).toBeTruthy();
    });
    
    test('should fail without required fields', async () => {
      const response = await request(app)
        .post('/assign-to-project')
        .send(testData.createData.invalid.missingFields);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
    
    test('should fail with invalid assignee', async () => {
      const response = await request(app)
        .post('/assign-to-project')
        .send(testData.createData.invalid.invalidAssignee);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid assignee user ID');
    });
    
    test('should fail with invalid project', async () => {
      const response = await request(app)
        .post('/assign-to-project')
        .send(testData.createData.invalid.invalidProject);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid project ID');
    });
  });
  
  describe('POST /assign-to-project/bulk', () => {
    test('should create multiple assignments', async () => {
      const bulkData = testData.createData.valid.bulk;
      
      const response = await request(app)
        .post('/assign-to-project/bulk')
        .send(bulkData);
      
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Successfully assigned');
      expect(response.body.assignments).toHaveLength(2); // User 1 already assigned to project 3
      expect(response.body.skipped.count).toBe(1);
    });
    
    test('should skip already assigned users', async () => {
      const bulkData = {
        assignees: [1, 2], // User 1 already assigned to project 1
        assigned_by: 3,
        project_id: 1
      };
      
      const response = await request(app)
        .post('/assign-to-project/bulk')
        .send(bulkData);
      
      expect(response.status).toBe(201);
      expect(response.body.assignments).toHaveLength(0); // Both already assigned
      expect(response.body.skipped.count).toBe(2);
    });
    
    test('should fail with empty assignees array', async () => {
      const response = await request(app)
        .post('/assign-to-project/bulk')
        .send(testData.createData.invalid.emptyBulkAssignees);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
    
    test('should fail with invalid assignee in array', async () => {
      const response = await request(app)
        .post('/assign-to-project/bulk')
        .send({
          assignees: [1, 999, 2],
          assigned_by: 1,
          project_id: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid assignee user IDs: 999');
    });
  });
  
  describe('PUT /assign-to-project/:id', () => {
    test('should update assignment', async () => {
      const response = await request(app)
        .put('/assign-to-project/1')
        .send(testData.updateData.valid.changeAssignee);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        assignee: 3,
        assignee_name: 'Bob Jones',
        date: '2024-01-20'
      });
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app)
        .put('/assign-to-project/999')
        .send(testData.updateData.valid.changeProject);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project assignment not found');
    });
    
    test('should fail without required fields', async () => {
      const response = await request(app)
        .put('/assign-to-project/1')
        .send(testData.updateData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
    
    test('should fail with invalid IDs', async () => {
      const response = await request(app)
        .put('/assign-to-project/1')
        .send(testData.updateData.invalid.invalidIds);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid assignee user ID');
    });
  });
  
  describe('DELETE /assign-to-project/:id', () => {
    test('should delete existing assignment', async () => {
      const response = await request(app).delete('/assign-to-project/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Project assignment deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/assign-to-project/4');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).delete('/assign-to-project/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project assignment not found');
    });
  });
  
  describe('GET /assign-to-project/project/:projectId', () => {
    test('should return assignments for specific project', async () => {
      const response = await request(app).get('/assign-to-project/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(assignment => {
        expect(assignment.project_id).toBe(1);
        expect(assignment.project_name).toBe('Website Redesign');
      });
    });
    
    test('should return empty array for project with no assignments', async () => {
      const response = await request(app).get('/assign-to-project/project/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /assign-to-project/assignee/:assigneeId', () => {
    test('should return assignments for specific assignee', async () => {
      const response = await request(app).get('/assign-to-project/assignee/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(assignment => {
        expect(assignment.assignee).toBe(1);
        expect(assignment.assignee_name).toBe('John Doe');
      });
    });
  });
  
  describe('GET /assign-to-project/search', () => {
    test('should search by assignee name', async () => {
      const response = await request(app).get('/assign-to-project/search?query=john');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Should find assignments where John is assignee
      const hasJohn = response.body.some(a => 
        a.assignee_name.toLowerCase().includes('john') ||
        a.assignee_username.toLowerCase().includes('john')
      );
      expect(hasJohn).toBeTruthy();
    });
    
    test('should search by username', async () => {
      const response = await request(app).get('/assign-to-project/search?query=jane_smith');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
    
    test('should return 400 for missing query', async () => {
      const response = await request(app).get('/assign-to-project/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
  
  describe('GET /assign-to-project/users', () => {
    test('should return active users for assignment', async () => {
      const response = await request(app).get('/assign-to-project/users');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3); // Only active users
      
      response.body.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('email');
      });
      
      // Should not include inactive user
      const userIds = response.body.map(u => u.id);
      expect(userIds).not.toContain(4);
    });
  });
  
  describe('GET /assign-to-project/projects', () => {
    test('should return non-completed projects', async () => {
      const response = await request(app).get('/assign-to-project/projects');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3); // Excludes completed project
      
      response.body.forEach(project => {
        expect(project.status).not.toBe('completed');
        expect(project.status).not.toBe('cancelled');
      });
    });
  });
  
  describe('GET /assign-to-project/summary', () => {
    test('should return assignment statistics', async () => {
      const response = await request(app).get('/assign-to-project/summary');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('top_projects');
      expect(response.body).toHaveProperty('top_assignees');
      
      const summary = response.body.summary;
      expect(Number(summary.total_assignments)).toBe(4);
      expect(Number(summary.unique_assignees)).toBe(3);
      expect(Number(summary.projects_with_assignments)).toBe(3);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle date formatting correctly', async () => {
      const assignment = {
        assignee: 1,
        assigned_by: 2,
        date: '2024-12-31',
        project_id: 1
      };
      
      const response = await request(app)
        .post('/assign-to-project')
        .send(assignment);
      
      expect(response.status).toBe(201);
      expect(response.body.date).toContain('2024-12-31');
    });
    
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      promises.push(request(app).get('/assign-to-project'));
      promises.push(request(app).get('/assign-to-project/users'));
      promises.push(request(app).get('/assign-to-project/projects'));
      promises.push(request(app).get('/assign-to-project/summary'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
