const request = require('supertest');
const express = require('express');
const router = require('../routes/project_boq_route');

// Mock database
const mockDb = {
  query: jest.fn()
};

// Create Express app for testing
const app = express();
app.use(express.json());

// Middleware to inject mock database
app.use((req, res, next) => {
  req.db = mockDb;
  next();
});

app.use('/', router);

describe('Project BOQ Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /boq', () => {
    it('should return paginated BOQ entries', async () => {
      const mockBOQEntries = [
        {
          boq_id: 1,
          project_id: 1,
          element_id: 4,
          item_id: 1,
          quantity: 500,
          unit: 'kg',
          unit_rate: 50,
          total_amount: 25000,
          status: 'Draft'
        },
        {
          boq_id: 2,
          project_id: 1,
          element_id: 6,
          item_id: 2,
          quantity: 10,
          unit: 'cum',
          unit_rate: 4500,
          total_amount: 45000,
          status: 'Approved'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockBOQEntries }); // Data query

      const response = await request(app).get('/boq?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        total: 2,
        data: mockBOQEntries
      });
      expect(mockDb.query).toHaveBeenCalledWith('SELECT COUNT(*) as total FROM project_boq');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq ORDER BY boq_id DESC LIMIT $1 OFFSET $2',
        [10, 0]
      );
    });

    it('should use default pagination values', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/boq');

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq ORDER BY boq_id DESC LIMIT $1 OFFSET $2',
        [100, 0]
      );
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/boq');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('GET /boq/:id', () => {
    it('should return a specific BOQ entry', async () => {
      const mockBOQEntry = {
        boq_id: 1,
        project_id: 1,
        element_id: 4,
        item_id: 1,
        main_bar_dia: 16,
        qty_main_bars: 25,
        quantity: 500,
        unit: 'kg',
        unit_rate: 50,
        total_amount: 25000,
        status: 'Draft'
      };

      mockDb.query.mockResolvedValue({ rows: [mockBOQEntry] });

      const response = await request(app).get('/boq/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBOQEntry);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE boq_id = $1',
        ['1']
      );
    });

    it('should return 404 if BOQ entry not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/boq/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });
  });

  describe('POST /boq', () => {
    it('should create a new BOQ entry', async () => {
      const newBOQEntry = {
        project_id: 1,
        element_id: 4,
        item_id: 1,
        main_bar_dia: 16,
        distribution_bar_dia: 8,
        qty_main_bars: 25,
        qty_distribution_bards: 50,
        rmc_grade: 'M25',
        element_length: 5.5,
        element_width: 0.3,
        element_height: 0.45,
        quantity: 500,
        unit: 'kg',
        unit_rate: 50,
        remarks: 'TMT bars for beams',
        created_by: 1
      };

      const mockCreatedEntry = {
        boq_id: 3,
        ...newBOQEntry,
        status: 'Draft',
        revision_number: 0,
        total_amount: 25000,
        created_at: '2024-05-01T10:00:00Z'
      };

      // Mock validation checks
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [{ element_id: 4 }] }) // Element exists
        .mockResolvedValueOnce({ rows: [{ item_id: 1 }] }) // Item exists
        .mockResolvedValueOnce({ rows: [mockCreatedEntry] }); // Insert

      const response = await request(app)
        .post('/boq')
        .send(newBOQEntry);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedEntry);
      expect(mockDb.query).toHaveBeenCalledTimes(4);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidEntry = {
        project_id: 1,
        element_id: 4
        // Missing item_id and quantity
      };

      const response = await request(app)
        .post('/boq')
        .send(invalidEntry);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Project ID, element ID, item ID, and quantity are required' 
      });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should return 400 if project does not exist', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Project doesn't exist

      const response = await request(app)
        .post('/boq')
        .send({
          project_id: 999,
          element_id: 4,
          item_id: 1,
          quantity: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Project ID does not exist' });
    });

    it('should handle foreign key constraint errors', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ element_id: 4 }] })
        .mockResolvedValueOnce({ rows: [{ item_id: 1 }] })
        .mockRejectedValueOnce({ code: '23503', message: 'Foreign key violation' });

      const response = await request(app)
        .post('/boq')
        .send({
          project_id: 1,
          element_id: 4,
          item_id: 1,
          quantity: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Invalid reference ID. Make sure all referenced IDs exist.' 
      });
    });
  });

  describe('PUT /boq/:id', () => {
    it('should update an existing BOQ entry', async () => {
      const updateData = {
        project_id: 1,
        element_id: 4,
        item_id: 1,
        quantity: 600,
        unit: 'kg',
        unit_rate: 55,
        remarks: 'Updated TMT quantity'
      };

      const mockUpdatedEntry = {
        boq_id: 1,
        ...updateData,
        total_amount: 33000
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ status: 'Draft' }] }) // Check status
        .mockResolvedValueOnce({ rows: [mockUpdatedEntry] }); // Update

      const response = await request(app)
        .put('/boq/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedEntry);
    });

    it('should return 404 if BOQ entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/boq/999')
        .send({
          project_id: 1,
          element_id: 4,
          item_id: 1,
          quantity: 100
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });

    it('should return 400 if BOQ entry is approved', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ status: 'Approved' }] });

      const response = await request(app)
        .put('/boq/1')
        .send({
          project_id: 1,
          element_id: 4,
          item_id: 1,
          quantity: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Cannot update an approved BOQ entry. Create a revision instead.' 
      });
    });
  });

  describe('DELETE /boq/:id', () => {
    it('should delete a BOQ entry', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ status: 'Draft' }] }) // Check status
        .mockResolvedValueOnce({ rows: [] }); // Delete

      const response = await request(app).delete('/boq/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'BOQ entry deleted successfully' });
    });

    it('should return 404 if BOQ entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/boq/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });

    it('should return 400 if BOQ entry is approved', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ status: 'Approved' }] });

      const response = await request(app).delete('/boq/1');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Cannot delete an approved BOQ entry. Create a revision instead.' 
      });
    });
  });

  describe('GET /boq/project/:projectId', () => {
    it('should return BOQ entries for a specific project', async () => {
      const mockEntries = [
        { boq_id: 1, project_id: 1, element_id: 4, item_id: 1 },
        { boq_id: 2, project_id: 1, element_id: 6, item_id: 2 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockEntries });

      const response = await request(app).get('/boq/project/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntries);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE project_id = $1 ORDER BY boq_id DESC',
        ['1']
      );
    });

    it('should filter by status if provided', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/boq/project/1?status=Approved');

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE project_id = $1 AND status = $2 ORDER BY boq_id DESC',
        ['1', 'Approved']
      );
    });
  });

  describe('PUT /boq/approve/:id', () => {
    it('should approve a BOQ entry', async () => {
      const mockApprovedEntry = {
        boq_id: 1,
        status: 'Approved',
        approved_by: 2,
        approved_at: '2024-05-01T11:00:00Z'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ status: 'Draft' }] }) // Check exists
        .mockResolvedValueOnce({ rows: [{ employee_id: 2 }] }) // Check employee
        .mockResolvedValueOnce({ rows: [mockApprovedEntry] }); // Update

      const response = await request(app)
        .put('/boq/approve/1')
        .send({ approved_by: 2 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockApprovedEntry);
    });

    it('should return 400 if approved_by is missing', async () => {
      const response = await request(app)
        .put('/boq/approve/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Approved by ID is required' });
    });

    it('should return 404 if BOQ entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/boq/approve/999')
        .send({ approved_by: 2 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });

    it('should return 400 if employee does not exist', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ status: 'Draft' }] })
        .mockResolvedValueOnce({ rows: [] }); // Employee doesn't exist

      const response = await request(app)
        .put('/boq/approve/1')
        .send({ approved_by: 999 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Employee ID does not exist' });
    });
  });

  describe('POST /boq/revise/:id', () => {
    it('should create a revised version of a BOQ entry', async () => {
      const originalEntry = {
        boq_id: 1,
        project_id: 1,
        element_id: 4,
        item_id: 1,
        main_bar_dia: 16,
        quantity: 500,
        unit: 'kg',
        unit_rate: 50,
        revision_number: 0
      };

      const revisedEntry = {
        boq_id: 10,
        ...originalEntry,
        quantity: 600,
        unit_rate: 55,
        revision_number: 1,
        status: 'Revised',
        remarks: 'Revision 1 of BOQ entry 1'
      };

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [originalEntry] }) // Get original
        .mockResolvedValueOnce({ rows: [revisedEntry] }) // Insert revised
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/revise/1')
        .send({
          created_by: 2,
          quantity: 600,
          unit_rate: 55
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(revisedEntry);
    });

    it('should return 400 if created_by is missing', async () => {
      const response = await request(app)
        .post('/boq/revise/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Created by ID is required' });
    });

    it('should return 404 if original BOQ entry not found', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Original not found
        .mockResolvedValueOnce({ rowCount: 0 }); // ROLLBACK

      const response = await request(app)
        .post('/boq/revise/999')
        .send({ created_by: 2 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });

    it('should handle transaction errors', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ boq_id: 1 }] }) // Get original
        .mockRejectedValueOnce({ code: '23503' }) // Insert fails
        .mockResolvedValueOnce({ rowCount: 0 }); // ROLLBACK

      const response = await request(app)
        .post('/boq/revise/1')
        .send({ created_by: 2 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid reference ID' });
    });
  });

  describe('GET /boq/detailed/:id', () => {
    it('should return detailed BOQ information with related data', async () => {
      const mockDetailedEntry = {
        boq_id: 1,
        project_id: 1,
        element_id: 4,
        item_id: 1,
        quantity: 500,
        unit: 'kg',
        unit_rate: 50,
        total_amount: 25000,
        project_name: 'Green Valley Residences',
        project_code: 'GVR-2024-01',
        element_name: 'Columns',
        element_category: 'Structural',
        item_name: 'TMT Bar',
        item_description: 'Thermo-Mechanically Treated reinforcement steel bars',
        item_unit: 'kg',
        item_category: 'Structural',
        creator_name: 'Rajesh Kumar',
        approver_name: 'Priya Singh'
      };

      mockDb.query.mockResolvedValue({ rows: [mockDetailedEntry] });

      const response = await request(app).get('/boq/detailed/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDetailedEntry);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN projects p ON b.project_id = p.project_id'),
        ['1']
      );
    });

    it('should return 404 if BOQ entry not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/boq/detailed/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'BOQ entry not found' });
    });
  });

  describe('GET /boq/summary/project/:projectId', () => {
    it('should return BOQ summary for a project', async () => {
      const mockSummary = {
        total_entries: '10',
        total_amount: '500000',
        draft_count: '3',
        approved_count: '6',
        revised_count: '1',
        last_updated: '2024-05-01T10:00:00Z',
        last_approved: '2024-04-30T15:00:00Z'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ project_id: 1, project_name: 'Test Project' }] }) // Project check
        .mockResolvedValueOnce({ rows: [mockSummary] }); // Summary data

      const response = await request(app).get('/boq/summary/project/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        project_name: 'Test Project',
        ...mockSummary
      });
    });

    it('should return empty summary for project with no BOQ entries', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ project_id: 1, project_name: 'Empty Project' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/boq/summary/project/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        project_name: 'Empty Project',
        total_entries: 0,
        total_amount: 0,
        draft_count: 0,
        approved_count: 0,
        revised_count: 0,
        last_updated: null,
        last_approved: null
      });
    });

    it('should return 404 if project not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/boq/summary/project/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project not found' });
    });
  });

  describe('GET /boq/summary/items/:projectId', () => {
    it('should return BOQ summary by item category', async () => {
      const mockSummary = [
        {
          item_category: 'Structural',
          item_count: '5',
          total_quantity: '1500',
          total_amount: '75000'
        },
        {
          item_category: 'Concrete',
          item_count: '3',
          total_quantity: '50',
          total_amount: '225000'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockSummary });

      const response = await request(app).get('/boq/summary/items/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSummary);
    });
  });

  describe('GET /boq/element/:elementId', () => {
    it('should return BOQ entries for a specific element', async () => {
      const mockEntries = [
        { boq_id: 1, element_id: 4, item_id: 1 },
        { boq_id: 5, element_id: 4, item_id: 2 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockEntries });

      const response = await request(app).get('/boq/element/4');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntries);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE element_id = $1 ORDER BY boq_id DESC',
        ['4']
      );
    });
  });

  describe('GET /boq/item/:itemId', () => {
    it('should return BOQ entries for a specific item', async () => {
      const mockEntries = [
        { boq_id: 1, element_id: 4, item_id: 1 },
        { boq_id: 3, element_id: 6, item_id: 1 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockEntries });

      const response = await request(app).get('/boq/item/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntries);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE item_id = $1 ORDER BY boq_id DESC',
        ['1']
      );
    });
  });

  describe('GET /boq/status/:status', () => {
    it('should return BOQ entries with specific status', async () => {
      const mockEntries = [
        { boq_id: 2, status: 'Approved' },
        { boq_id: 5, status: 'Approved' }
      ];

      mockDb.query.mockResolvedValue({ rows: mockEntries });

      const response = await request(app).get('/boq/status/Approved');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntries);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM project_boq WHERE status = $1 ORDER BY boq_id DESC',
        ['Approved']
      );
    });
  });

  describe('POST /boq/bulk', () => {
    it('should create multiple BOQ entries', async () => {
      const entries = [
        {
          project_id: 1,
          element_id: 4,
          item_id: 1,
          quantity: 500,
          unit: 'kg',
          unit_rate: 50
        },
        {
          project_id: 1,
          element_id: 6,
          item_id: 2,
          quantity: 10,
          unit: 'cum',
          unit_rate: 4500
        }
      ];

      const mockCreatedEntries = entries.map((entry, index) => ({
        boq_id: index + 10,
        ...entry,
        status: 'Draft',
        revision_number: 0
      }));

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCreatedEntries[0]] }) // Insert 1
        .mockResolvedValueOnce({ rows: [mockCreatedEntries[1]] }) // Insert 2
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/bulk')
        .send({ entries });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedEntries);
    });

    it('should return 400 if entries array is invalid', async () => {
      const response = await request(app)
        .post('/boq/bulk')
        .send({ entries: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Valid entries array is required' });
    });

    it('should validate each entry has required fields', async () => {
      const entries = [
        {
          project_id: 1,
          element_id: 4
          // Missing item_id and quantity
        }
      ];

      const response = await request(app)
        .post('/boq/bulk')
        .send({ entries });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Entry at index 0 missing required fields (project_id, element_id, item_id, quantity)' 
      });
    });

    it('should rollback on error', async () => {
      const entries = [{ project_id: 1, element_id: 4, item_id: 1, quantity: 100 }];

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce({ code: '23503' }) // Insert fails
        .mockResolvedValueOnce({ rowCount: 0 }); // ROLLBACK

      const response = await request(app)
        .post('/boq/bulk')
        .send({ entries });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Invalid reference ID. Make sure all referenced IDs exist.' 
      });
    });
  });

  describe('POST /boq/import/tmt', () => {
    it('should import BOQ entries from TMT calculations', async () => {
      const tmtCalc = {
        calculation_id: 1,
        element_id: 4,
        main_bar_dia: 16,
        distribution_bar_dia: 8,
        qty_main_bars: 25,
        qty_distribution_bars: 50,
        main_bar_total_weight: 400,
        distribution_bar_total_weight: 100
      };

      const mockCreatedEntry = {
        boq_id: 15,
        project_id: 1,
        element_id: 4,
        item_id: 1,
        quantity: 500,
        unit: 'kg',
        status: 'Draft'
      };

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] }) // Project check
        .mockResolvedValueOnce({ rows: [{ item_id: 1 }] }) // Item check
        .mockResolvedValueOnce({ rows: [tmtCalc] }) // Get TMT calc
        .mockResolvedValueOnce({ rows: [mockCreatedEntry] }) // Insert
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/import/tmt')
        .send({
          project_id: 1,
          calculation_ids: [1],
          item_id: 1,
          unit_rate: 50,
          created_by: 1
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([mockCreatedEntry]);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/boq/import/tmt')
        .send({
          project_id: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Project ID, item ID, and calculation IDs array are required' 
      });
    });

    it('should skip calculations with no weight', async () => {
      const tmtCalc = {
        calculation_id: 1,
        element_id: 4,
        main_bar_total_weight: 0,
        distribution_bar_total_weight: 0
      };

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] }) // Project check
        .mockResolvedValueOnce({ rows: [{ item_id: 1 }] }) // Item check
        .mockResolvedValueOnce({ rows: [tmtCalc] }) // Get TMT calc with 0 weight
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/import/tmt')
        .send({
          project_id: 1,
          calculation_ids: [1],
          item_id: 1
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([]); // No entries created
    });
  });

  describe('POST /boq/import/rmc', () => {
    it('should import BOQ entries from RMC calculations', async () => {
      const rmcCalc = {
        calculation_id: 1,
        element_id: 7,
        concrete_grade: 'M25',
        length: 10,
        width: 8,
        height: 0.15,
        thickness: 0.15,
        net_volume: 12
      };

      const mockCreatedEntry = {
        boq_id: 20,
        project_id: 1,
        element_id: 7,
        item_id: 2,
        rmc_grade: 'M25',
        quantity: 12,
        unit: 'm³',
        status: 'Draft'
      };

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] }) // Project check
        .mockResolvedValueOnce({ rows: [{ item_id: 2 }] }) // Item check
        .mockResolvedValueOnce({ rows: [rmcCalc] }) // Get RMC calc
        .mockResolvedValueOnce({ rows: [mockCreatedEntry] }) // Insert
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/import/rmc')
        .send({
          project_id: 1,
          calculation_ids: [1],
          item_id: 2,
          unit_rate: 4500,
          created_by: 1
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([mockCreatedEntry]);
    });

    it('should skip calculations with no volume', async () => {
      const rmcCalc = {
        calculation_id: 1,
        element_id: 7,
        net_volume: null
      };

      mockDb.query
        .mockResolvedValueOnce({ rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ project_id: 1 }] }) // Project check
        .mockResolvedValueOnce({ rows: [{ item_id: 2 }] }) // Item check
        .mockResolvedValueOnce({ rows: [rmcCalc] }) // Get RMC calc with no volume
        .mockResolvedValueOnce({ rowCount: 0 }); // COMMIT

      const response = await request(app)
        .post('/boq/import/rmc')
        .send({
          project_id: 1,
          calculation_ids: [1],
          item_id: 2
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([]); // No entries created
    });
  });

  describe('GET /boq/report/:projectId', () => {
    it('should generate a comprehensive BOQ report', async () => {
      const mockBOQData = [
        {
          boq_id: 1,
          element_name: 'Columns',
          element_category: 'Structural',
          item_name: 'TMT Bar',
          item_unit: 'kg',
          item_category: 'Structural',
          quantity: 500,
          unit: 'kg',
          unit_rate: 50,
          total_amount: 25000,
          status: 'Approved',
          revision_number: 0,
          created_date: '2024-05-01',
          approved_date: '2024-05-02',
          created_by_name: 'Rajesh Kumar',
          approved_by_name: 'Priya Singh'
        },
        {
          boq_id: 2,
          element_name: 'Columns',
          element_category: 'Structural',
          item_name: 'RMC',
          item_unit: 'cum',
          item_category: 'Concrete',
          quantity: 10,
          unit: 'cum',
          unit_rate: 4500,
          total_amount: 45000,
          status: 'Approved',
          revision_number: 0,
          created_date: '2024-05-01',
          approved_date: '2024-05-02',
          created_by_name: 'Rajesh Kumar',
          approved_by_name: 'Priya Singh'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            project_id: 1, 
            project_name: 'Green Valley Residences', 
            project_code: 'GVR-2024-01' 
          }] 
        })
        .mockResolvedValueOnce({ rows: mockBOQData });

      const response = await request(app).get('/boq/report/1');

      expect(response.status).toBe(200);
      expect(response.body.project).toEqual({
        project_id: 1,
        project_name: 'Green Valley Residences',
        project_code: 'GVR-2024-01'
      });
      expect(response.body.total_amount).toBe(70000);
      expect(response.body.item_count).toBe(2);
      expect(response.body.element_count).toBe(1);
      expect(response.body.elements).toHaveLength(1);
      expect(response.body.elements[0].element_name).toBe('Columns');
      expect(response.body.elements[0].items).toHaveLength(2);
    });

    it('should filter by status if provided', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ project_id: 1, project_name: 'Test', project_code: 'TEST-01' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/boq/report/1?status=Draft');

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AND b.status = $2'),
        ['1', 'Draft']
      );
    });

    it('should return 404 if project not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/boq/report/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project not found' });
    });
  });

  describe('GET /boq/element-summary/:projectId', () => {
    it('should return BOQ summary by element', async () => {
      const mockSummary = [
        {
          element_id: 4,
          element_name: 'Columns',
          element_category: 'Structural',
          item_count: '3',
          total_amount: '150000'
        },
        {
          element_id: 6,
          element_name: 'Beams',
          element_category: 'Structural',
          item_count: '2',
          total_amount: '100000'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockSummary });

      const response = await request(app).get('/boq/element-summary/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSummary);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY e.element_id'),
        ['1']
      );
    });
  });
});
