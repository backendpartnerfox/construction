// generate_remaining_tests.js
// Script to generate test files for remaining simple CRUD routes

const fs = require('fs');
const path = require('path');

const simpleRoutes = [
  {
    routeName: 'enquiry-sources',
    tableName: 'enquiry_sources',
    idField: 'source_id',
    requiredFields: ['source_name'],
    sampleData: {
      seed: [
        { source_id: 1, source_name: 'Website', description: 'Company website', is_active: true },
        { source_id: 2, source_name: 'Referral', description: 'Customer referral', is_active: true },
        { source_id: 3, source_name: 'Social Media', description: 'Social media channels', is_active: false }
      ],
      create: {
        source_name: 'Trade Show',
        description: 'Trade show leads',
        is_active: true
      },
      update: {
        source_name: 'Updated Source',
        description: 'Updated description',
        is_active: false
      }
    }
  },
  {
    routeName: 'enquiry-status',
    tableName: 'enquiry_status',
    idField: 'status_id',
    requiredFields: ['status_name'],
    sampleData: {
      seed: [
        { status_id: 1, status_name: 'New', status_order: 1, is_active: true },
        { status_id: 2, status_name: 'In Progress', status_order: 2, is_active: true },
        { status_id: 3, status_name: 'Completed', status_order: 3, is_active: true }
      ],
      create: {
        status_name: 'On Hold',
        status_order: 4,
        is_active: true
      },
      update: {
        status_name: 'Updated Status',
        status_order: 5,
        is_active: false
      }
    }
  },
  {
    routeName: 'vendor-type',
    tableName: 'vendor_types',
    idField: 'vendor_type_id',
    requiredFields: ['vendor_type_name'],
    sampleData: {
      seed: [
        { vendor_type_id: 1, vendor_type_name: 'Material Supplier', description: 'Supplies construction materials' },
        { vendor_type_id: 2, vendor_type_name: 'Service Provider', description: 'Provides services' },
        { vendor_type_id: 3, vendor_type_name: 'Equipment Rental', description: 'Rents equipment' }
      ],
      create: {
        vendor_type_name: 'Contractor',
        description: 'General contractors'
      },
      update: {
        vendor_type_name: 'Updated Type',
        description: 'Updated description'
      }
    }
  },
  {
    routeName: 'payment-installments',
    tableName: 'payment_installments',
    idField: 'installment_id',
    requiredFields: ['project_id', 'installment_number', 'amount'],
    sampleData: {
      seed: [
        { installment_id: 1, project_id: 1, installment_number: 1, amount: 100000, due_date: '2024-01-15', status: 'Pending' },
        { installment_id: 2, project_id: 1, installment_number: 2, amount: 150000, due_date: '2024-02-15', status: 'Paid' },
        { installment_id: 3, project_id: 2, installment_number: 1, amount: 200000, due_date: '2024-03-15', status: 'Overdue' }
      ],
      create: {
        project_id: 2,
        installment_number: 2,
        amount: 250000,
        due_date: '2024-04-15',
        status: 'Pending'
      },
      update: {
        project_id: 1,
        installment_number: 3,
        amount: 300000,
        due_date: '2024-05-15',
        status: 'Paid'
      }
    }
  },
  {
    routeName: 'payment-reminders',
    tableName: 'payment_reminders',
    idField: 'reminder_id',
    requiredFields: ['installment_id', 'reminder_date'],
    sampleData: {
      seed: [
        { reminder_id: 1, installment_id: 1, reminder_date: '2024-01-10', reminder_type: 'Email', status: 'Sent' },
        { reminder_id: 2, installment_id: 2, reminder_date: '2024-02-10', reminder_type: 'SMS', status: 'Pending' },
        { reminder_id: 3, installment_id: 3, reminder_date: '2024-03-10', reminder_type: 'Call', status: 'Completed' }
      ],
      create: {
        installment_id: 1,
        reminder_date: '2024-04-10',
        reminder_type: 'Email',
        status: 'Pending'
      },
      update: {
        installment_id: 2,
        reminder_date: '2024-05-10',
        reminder_type: 'SMS',
        status: 'Sent'
      }
    }
  }
];

// Template for generating test files
const generateTestFile = (route) => {
  const { routeName, tableName, idField, requiredFields, sampleData } = route;
  const routeNameCamelCase = routeName.split('-').map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');

  return `// tests/${routeName}_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for ${routeName}
const testData = {
  seedData: ${JSON.stringify(sampleData.seed, null, 4)},

  createData: {
    valid: {
      complete: ${JSON.stringify(sampleData.create, null, 8)},
      minimal: ${JSON.stringify(
        requiredFields.reduce((obj, field) => {
          obj[field] = sampleData.create[field] || 'Test Value';
          return obj;
        }, {}),
        null,
        8
      )}
    },
    invalid: {
      missingRequired: ${JSON.stringify(
        Object.keys(sampleData.create).reduce((obj, key) => {
          if (!requiredFields.includes(key)) {
            obj[key] = sampleData.create[key];
          }
          return obj;
        }, {}),
        null,
        8
      )}
    }
  },

  updateData: {
    valid: {
      fullUpdate: ${JSON.stringify(sampleData.update, null, 8)}
    },
    invalid: {
      missingRequired: {}
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create table
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${idField} SERIAL PRIMARY KEY,
      ${Object.entries(sampleData.seed[0])
        .filter(([key]) => key !== idField)
        .map(([key, value]) => {
          let type = 'VARCHAR(200)';
          if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(12,2)';
          } else if (typeof value === 'boolean') {
            type = 'BOOLEAN DEFAULT true';
          } else if (key.includes('date')) {
            type = 'DATE';
          } else if (key.includes('description') || key.includes('notes')) {
            type = 'TEXT';
          }
          const notNull = requiredFields.includes(key) ? ' NOT NULL' : '';
          return `${key} ${type}${notNull}`;
        })
        .join(',\n      ')},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  \`);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS ${tableName} CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const item of testData.seedData) {
    const columns = Object.keys(item).join(', ');
    const placeholders = Object.keys(item).map((_, i) => \`$\${i + 1}\`).join(', ');
    const values = Object.values(item);
    
    await pool.query(
      \`INSERT INTO ${tableName} (\${columns}) VALUES (\${placeholders})\`,
      values
    );
  }
  
  await pool.query("SELECT setval('${tableName}_${idField}_seq', ${sampleData.seed.length})");
});

describe('${routeName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} API', () => {
  
  describe('GET /${routeName}', () => {
    test('should return all items', async () => {
      const response = await request(app).get('/${routeName}');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(${sampleData.seed.length});
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/${routeName}');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /${routeName}/:id', () => {
    test('should return specific item', async () => {
      const response = await request(app).get('/${routeName}/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('${idField}', 1);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app).get('/${routeName}/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /${routeName}', () => {
    test('should create item with all fields', async () => {
      const newItem = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/${routeName}')
        .send(newItem);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newItem);
    });
    
    test('should create item with minimal fields', async () => {
      const newItem = testData.createData.valid.minimal;
      
      const response = await request(app)
        .post('/${routeName}')
        .send(newItem);
      
      expect(response.status).toBe(201);
    });
    
    test('should fail without required fields', async () => {
      const response = await request(app)
        .post('/${routeName}')
        .send(testData.createData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /${routeName}/:id', () => {
    test('should update item', async () => {
      const response = await request(app)
        .put('/${routeName}/1')
        .send(testData.updateData.valid.fullUpdate);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(testData.updateData.valid.fullUpdate);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/${routeName}/999')
        .send(testData.updateData.valid.fullUpdate);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /${routeName}/:id', () => {
    test('should delete existing item', async () => {
      const response = await request(app).delete('/${routeName}/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verify deletion
      const checkResponse = await request(app).get('/${routeName}/1');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app).delete('/${routeName}/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
`;
};

// Generate test files
simpleRoutes.forEach(route => {
  const testContent = generateTestFile(route);
  const fileName = path.join(__dirname, 'tests', `${route.routeName}_route.test.js`);
  
  fs.writeFileSync(fileName, testContent);
  console.log(`Generated test file: ${fileName}`);
});

console.log(`\nGenerated ${simpleRoutes.length} test files successfully!`);
