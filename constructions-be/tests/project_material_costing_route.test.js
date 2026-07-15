const request = require('supertest');
const express = require('express');
const router = require('../routes/project_material_costing_route');

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

describe('Project Material Costing Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /project-material-costing', () => {
    it('should return all project material costings with filters', async () => {
      const mockCostings = [
        {
          costing_id: 1,
          project_id: 1,
          boq_id: 1,
          element_id: 4,
          item_id: 1,
          boq_quantity: 500,
          unit: 'kg',
          unit_price: 50,
          total_amount: 29500,
          status: 'Draft',
          is_approved: false,
          project_name: 'Green Valley Residences',
          element_name: 'Columns',
          item_name: 'TMT Bar',
          vendor_name: 'BuildTech Materials'
        },
        {
          costing_id: 2,
          project_id: 1,
          boq_id: 2,
          element_id: 6,
          item_id: 2,
          boq_quantity: 10,
          unit: 'cum',
          unit_price: 4500,
          total_amount: 53100,
          status: 'Approved',
          is_approved: true,
          project_name: 'Green Valley Residences',
          element_name: 'Beams',
          item_name: 'RMC',
          vendor_name: 'Supreme Cement'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockCostings });

      const response = await request(app).get('/project-material-costing?project_id=1&status=Draft');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCostings);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pmc.project_id = $1 AND pmc.status = $2'),
        ['1', 'Draft']
      );
    });

    it('should handle approval status filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/project-material-costing?is_approved=true');

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pmc.is_approved = $1'),
        [true]
      );
    });

    it('should return all costings without filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/project-material-costing');

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY pmc.created_at DESC'),
        []
      );
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/project-material-costing');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('GET /project-material-costing/:id', () => {
    it('should return a specific costing with all related data', async () => {
      const mockCosting = {
        costing_id: 1,
        project_id: 1,
        boq_id: 1,
        element_id: 4,
        item_id: 1,
        choice_option_id: 1,
        boq_quantity: 500,
        unit: 'kg',
        main_bar_dia: 16,
        tmt_standard_id: 4,
        vendor_id: 1,
        unit_price: 50,
        discount_percentage: 5,
        unit_price_after_discount: 47.5,
        gst_percentage: 18,
        gst_amount: 8.55,
        subtotal: 23750,
        total_gst: 4275,
        total_amount: 28025,
        quotation_reference: 'QUO-2024-001',
        pricing_validity_date: '2024-12-31',
        is_approved: false,
        status: 'Draft',
        project_name: 'Green Valley Residences',
        element_name: 'Columns',
        item_name: 'TMT Bar',
        choice_name: 'TATA FE 500D',
        vendor_name: 'BuildTech Materials',
        tmt_dia: 16,
        created_by_name: 'Rajesh Kumar',
        approved_by_name: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockCosting] });

      const response = await request(app).get('/project-material-costing/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCosting);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pmc.costing_id = $1'),
        ['1']
      );
    });

    it('should return 404 if costing not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/project-material-costing/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project material costing not found' });
    });
  });

  describe('GET /project-material-costing/project/:projectId', () => {
    it('should return all costings for a specific project', async () => {
      const mockCostings = [
        {
          costing_id: 1,
          project_id: 1,
          element_name: 'Columns',
          item_name: 'TMT Bar',
          choice_name: 'TATA FE 500D',
          vendor_name: 'BuildTech Materials',
          boq_quantity: 500,
          unit: 'kg',
          total_amount: 28025
        },
        {
          costing_id: 2,
          project_id: 1,
          element_name: 'Beams',
          item_name: 'RMC',
          choice_name: 'Ultratech M25',
          vendor_name: 'Supreme Cement',
          boq_quantity: 10,
          unit: 'cum',
          total_amount: 53100
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: mockCostings }); // Costings data

      const response = await request(app).get('/project-material-costing/project/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCostings);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should return 404 if project not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/project-material-costing/project/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project not found' });
    });

    it('should return empty array if project has no costings', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [] }); // No costings

      const response = await request(app).get('/project-material-costing/project/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /project-material-costing', () => {
    it('should create a new material costing', async () => {
      const newCosting = {
        project_id: 1,
        boq_id: 3,
        element_id: 4,
        item_id: 1,
        choice_option_id: 1,
        boq_quantity: 750,
        unit: 'kg',
        main_bar_dia: 20,
        tmt_standard_id: 5,
        vendor_id: 1,
        unit_price: 55,
        discount_percentage: 10,
        gst_percentage: 18,
        quotation_reference: 'QUO-2024-002',
        pricing_validity_date: '2024-12-31',
        notes: 'Bulk order discount applied',
        created_by: 1
      };

      const mockCreatedCosting = {
        costing_id: 3,
        ...newCosting,
        unit_price_after_discount: 49.5,
        gst_amount: 8.91,
        subtotal: 37125,
        total_gst: 6682.5,
        total_amount: 43807.5,
        status: 'Draft',
        is_approved: false,
        created_at: '2024-05-01T10:00:00Z'
      };

      // Mock verification queries
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // Element exists
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Item exists
        .mockResolvedValueOnce({ rows: [mockCreatedCosting] }); // Insert

      const response = await request(app)
        .post('/project-material-costing')
        .send(newCosting);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedCosting);
      expect(mockDb.query).toHaveBeenCalledTimes(4);
    });

    it('should validate required fields', async () => {
      const testCases = [
        { data: { boq_id: 1, element_id: 1, item_id: 1, boq_quantity: 100, unit: 'kg', unit_price: 50 }, 
          error: 'Project ID is required' },
        { data: { project_id: 1, element_id: 1, item_id: 1, boq_quantity: 100, unit: 'kg', unit_price: 50 }, 
          error: 'BOQ ID is required' },
        { data: { project_id: 1, boq_id: 1, item_id: 1, boq_quantity: 100, unit: 'kg', unit_price: 50 }, 
          error: 'Element ID is required' },
        { data: { project_id: 1, boq_id: 1, element_id: 1, boq_quantity: 100, unit: 'kg', unit_price: 50 }, 
          error: 'Item ID is required' },
        { data: { project_id: 1, boq_id: 1, element_id: 1, item_id: 1, unit: 'kg', unit_price: 50 }, 
          error: 'BOQ quantity is required' },
        { data: { project_id: 1, boq_id: 1, element_id: 1, item_id: 1, boq_quantity: 100, unit_price: 50 }, 
          error: 'Unit is required' },
        { data: { project_id: 1, boq_id: 1, element_id: 1, item_id: 1, boq_quantity: 100, unit: 'kg' }, 
          error: 'Unit price is required' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/project-material-costing')
          .send(testCase.data);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: testCase.error });
        expect(mockDb.query).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should return 404 if project not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/project-material-costing')
        .send({
          project_id: 999,
          boq_id: 1,
          element_id: 1,
          item_id: 1,
          boq_quantity: 100,
          unit: 'kg',
          unit_price: 50
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project not found' });
    });

    it('should return 404 if element not found', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [] }); // Element doesn't exist

      const response = await request(app)
        .post('/project-material-costing')
        .send({
          project_id: 1,
          boq_id: 1,
          element_id: 999,
          item_id: 1,
          boq_quantity: 100,
          unit: 'kg',
          unit_price: 50
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Element not found' });
    });

    it('should return 404 if item not found', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Element exists
        .mockResolvedValueOnce({ rows: [] }); // Item doesn't exist

      const response = await request(app)
        .post('/project-material-costing')
        .send({
          project_id: 1,
          boq_id: 1,
          element_id: 1,
          item_id: 999,
          boq_quantity: 100,
          unit: 'kg',
          unit_price: 50
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Item not found' });
    });

    it('should handle default values for discount and GST', async () => {
      const minimalCosting = {
        project_id: 1,
        boq_id: 1,
        element_id: 1,
        item_id: 1,
        boq_quantity: 100,
        unit: 'kg',
        unit_price: 50
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ costing_id: 4, ...minimalCosting }] });

      const response = await request(app)
        .post('/project-material-costing')
        .send(minimalCosting);

      expect(response.status).toBe(201);
      
      // Check that default values were used in the calculation
      const insertCall = mockDb.query.mock.calls[3];
      expect(insertCall[1][12]).toBe(0); // discount_percentage default
      expect(insertCall[1][14]).toBe(18); // gst_percentage default
    });
  });

  describe('PUT /project-material-costing/:id', () => {
    it('should update an existing costing and recalculate amounts', async () => {
      const currentCosting = {
        costing_id: 1,
        boq_quantity: 500,
        unit_price: 50,
        discount_percentage: 5,
        gst_percentage: 18
      };

      const updateData = {
        boq_quantity: 600,
        unit_price: 55,
        discount_percentage: 10,
        vendor_id: 2,
        quotation_reference: 'QUO-2024-003',
        notes: 'Updated pricing',
        updated_by: 2
      };

      const mockUpdatedCosting = {
        costing_id: 1,
        ...updateData,
        unit_price_after_discount: 49.5,
        gst_amount: 8.91,
        subtotal: 29700,
        total_gst: 5346,
        total_amount: 35046,
        updated_at: '2024-05-01T11:00:00Z'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [currentCosting] }) // Get current
        .mockResolvedValueOnce({ rows: [mockUpdatedCosting] }); // Update

      const response = await request(app)
        .put('/project-material-costing/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedCosting);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should update with partial data', async () => {
      const currentCosting = {
        costing_id: 1,
        boq_quantity: 500,
        unit_price: 50,
        discount_percentage: 5,
        gst_percentage: 18
      };

      const partialUpdate = {
        unit_price: 60,
        updated_by: 2
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [currentCosting] })
        .mockResolvedValueOnce({ rows: [{ ...currentCosting, ...partialUpdate }] });

      const response = await request(app)
        .put('/project-material-costing/1')
        .send(partialUpdate);

      expect(response.status).toBe(200);
      
      // Check that existing values were preserved
      const updateCall = mockDb.query.mock.calls[1];
      expect(updateCall[1][0]).toBe(500); // Kept original quantity
      expect(updateCall[1][1]).toBe(60); // Updated price
      expect(updateCall[1][2]).toBe(5); // Kept original discount
    });

    it('should return 404 if costing not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/project-material-costing/999')
        .send({ unit_price: 60 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project material costing not found' });
    });
  });

  describe('PATCH /project-material-costing/:id/approve', () => {
    it('should approve a costing', async () => {
      const mockApprovedCosting = {
        costing_id: 1,
        is_approved: true,
        approved_by: 2,
        approval_date: '2024-05-01',
        status: 'Approved',
        notes: 'Approved for procurement'
      };

      mockDb.query.mockResolvedValue({ 
        rows: [mockApprovedCosting], 
        rowCount: 1 
      });

      const response = await request(app)
        .patch('/project-material-costing/1/approve')
        .send({ approved_by: 2, notes: 'Approved for procurement' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockApprovedCosting);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_approved = true'),
        [2, 'Approved for procurement', '1']
      );
    });

    it('should return 400 if approved_by is missing', async () => {
      const response = await request(app)
        .patch('/project-material-costing/1/approve')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Approved by user ID is required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should return 404 if costing not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const response = await request(app)
        .patch('/project-material-costing/999/approve')
        .send({ approved_by: 2 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project material costing not found' });
    });
  });

  describe('DELETE /project-material-costing/:id', () => {
    it('should delete a non-approved costing', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ is_approved: false }] }) // Not approved
        .mockResolvedValueOnce({ rows: [] }); // Delete

      const response = await request(app).delete('/project-material-costing/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Project material costing deleted successfully' });
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if trying to delete approved costing', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ is_approved: true }] });

      const response = await request(app).delete('/project-material-costing/1');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Cannot delete approved costing. Remove approval first.' 
      });
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if costing not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/project-material-costing/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project material costing not found' });
    });
  });

  describe('GET /project-material-costing/project/:projectId/summary', () => {
    it('should return project costing summary', async () => {
      const mockSummary = {
        total_costings: '10',
        total_subtotal: '500000',
        total_gst_amount: '90000',
        total_project_cost: '590000',
        avg_gst_percentage: '18.00',
        avg_discount_percentage: '7.50',
        approved_costings: '6',
        pending_costings: '4',
        draft_costings: '3',
        approved_status_costings: '6',
        total_vendors: '5'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Project exists
        .mockResolvedValueOnce({ rows: [mockSummary] }); // Summary data

      const response = await request(app).get('/project-material-costing/project/1/summary');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSummary);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_costings'),
        ['1']
      );
    });

    it('should return 404 if project not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/project-material-costing/project/999/summary');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Project not found' });
    });

    it('should handle projects with no costings', async () => {
      const emptySummary = {
        total_costings: '0',
        total_subtotal: null,
        total_gst_amount: null,
        total_project_cost: null,
        avg_gst_percentage: null,
        avg_discount_percentage: null,
        approved_costings: '0',
        pending_costings: '0',
        draft_costings: '0',
        approved_status_costings: '0',
        total_vendors: '0'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [emptySummary] });

      const response = await request(app).get('/project-material-costing/project/1/summary');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptySummary);
    });

    it('should handle database errors', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(new Error('Summary calculation failed'));

      const response = await request(app).get('/project-material-costing/project/1/summary');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Summary calculation failed' });
    });
  });
});
