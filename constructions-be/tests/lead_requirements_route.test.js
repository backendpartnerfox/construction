const request = require('supertest');
const express = require('express');
const router = require('../routes/lead_requirements_route');

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

describe('Lead Requirements Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /lead-requirements', () => {
    it('should return all lead requirements', async () => {
      const mockRequirements = [
        {
          lead_requirement_id: 1,
          lead_id: 1,
          requirement_title: '3BHK Villa Requirements',
          project_type: 'Residential',
          construction_type: 'New Construction',
          budget_range_min: 5000000,
          budget_range_max: 7500000,
          status: 'Finalized'
        },
        {
          lead_requirement_id: 2,
          lead_id: 2,
          requirement_title: 'Office Space Requirements',
          project_type: 'Commercial',
          construction_type: 'New Construction',
          budget_range_min: 20000000,
          budget_range_max: 30000000,
          status: 'Draft'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/lead-requirements');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM lead_requirements ORDER BY created_at DESC');
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/lead-requirements');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('GET /lead-requirements/:id', () => {
    it('should return a specific lead requirement', async () => {
      const mockRequirement = {
        lead_requirement_id: 1,
        lead_id: 1,
        requirement_number: 'REQ-LED-24-001-01',
        requirement_title: '3BHK Villa Requirements',
        requirement_description: 'Detailed requirements for 3BHK villa construction',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 2400,
        site_area_unit: 'sqft',
        built_up_area: 2000,
        carpet_area: 1800,
        number_of_floors: 2,
        number_of_bedrooms: 3,
        number_of_bathrooms: 3,
        budget_range_min: 5000000,
        budget_range_max: 7500000,
        quality_preference: 'Premium',
        package_type: 'Standard Package',
        status: 'Finalized'
      };

      mockDb.query.mockResolvedValue({ rows: [mockRequirement] });

      const response = await request(app).get('/lead-requirements/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM lead_requirements WHERE lead_requirement_id = $1',
        ['1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/lead-requirements/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Lead requirement not found' });
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Query failed'));

      const response = await request(app).get('/lead-requirements/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Query failed' });
    });
  });

  describe('POST /lead-requirements', () => {
    it('should create a new lead requirement', async () => {
      const newRequirement = {
        lead_id: 1,
        requirement_number: 'REQ-LED-24-002-01',
        requirement_title: '2BHK Apartment Requirements',
        requirement_description: 'Requirements for a 2BHK apartment',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 1200,
        site_area_unit: 'sqft',
        built_up_area: 1000,
        carpet_area: 900,
        number_of_floors: 1,
        number_of_bedrooms: 2,
        number_of_bathrooms: 2,
        budget_range_min: 3000000,
        budget_range_max: 4000000,
        quality_preference: 'Standard',
        package_type: 'Basic Package',
        status: 'Draft',
        created_by: 1
      };

      const mockCreatedRequirement = {
        lead_requirement_id: 3,
        ...newRequirement,
        created_at: '2024-05-01T10:00:00Z'
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedRequirement] });

      const response = await request(app)
        .post('/lead-requirements')
        .send(newRequirement);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lead_requirements'),
        expect.arrayContaining([
          newRequirement.lead_id,
          newRequirement.requirement_number,
          newRequirement.requirement_title
        ])
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalRequirement = {
        lead_id: 1,
        requirement_title: 'Basic Requirements',
        created_by: 1
      };

      const mockCreatedRequirement = {
        lead_requirement_id: 4,
        lead_id: 1,
        requirement_title: 'Basic Requirements',
        site_area_unit: 'sqft',
        status: 'Draft',
        created_by: 1,
        created_at: '2024-05-01T10:00:00Z'
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedRequirement] });

      const response = await request(app)
        .post('/lead-requirements')
        .send(minimalRequirement);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedRequirement);
      
      // Check that default values were used
      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[1][7]).toBe('sqft'); // site_area_unit default
      expect(queryCall[1][17]).toBe('Draft'); // status default
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidRequirement = {
        requirement_title: 'Test Requirement'
        // Missing lead_id
      };

      const response = await request(app)
        .post('/lead-requirements')
        .send(invalidRequirement);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Lead ID and Requirement Title are required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const validRequirement = {
        lead_id: 1,
        requirement_title: 'Test Requirements',
        created_by: 1
      };

      mockDb.query.mockRejectedValue(new Error('Database insert failed'));

      const response = await request(app)
        .post('/lead-requirements')
        .send(validRequirement);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database insert failed' });
    });
  });

  describe('PUT /lead-requirements/:id', () => {
    it('should update an existing lead requirement', async () => {
      const updateData = {
        lead_id: 1,
        requirement_title: 'Updated Villa Requirements',
        requirement_description: 'Updated description with more details',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 2500,
        built_up_area: 2100,
        number_of_floors: 3,
        number_of_bedrooms: 4,
        number_of_bathrooms: 4,
        budget_range_min: 7000000,
        budget_range_max: 9000000,
        quality_preference: 'Premium',
        package_type: 'Premium Package',
        status: 'Finalized',
        updated_by: 2
      };

      const mockUpdatedRequirement = {
        lead_requirement_id: 1,
        ...updateData,
        updated_at: '2024-05-01T11:00:00Z'
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedRequirement] });

      const response = await request(app)
        .put('/lead-requirements/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE lead_requirements'),
        expect.arrayContaining([
          updateData.lead_id,
          updateData.requirement_title,
          updateData.requirement_description,
          updateData.project_type
        ])
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/lead-requirements/999')
        .send({
          lead_id: 1,
          requirement_title: 'Test Update',
          updated_by: 1
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Lead requirement not found' });
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .put('/lead-requirements/1')
        .send({
          requirement_title: 'Test Update'
          // Missing lead_id
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Lead ID and Requirement Title are required' });
    });

    it('should use default status if not provided', async () => {
      const updateData = {
        lead_id: 1,
        requirement_title: 'Updated Requirements',
        updated_by: 1
      };

      mockDb.query.mockResolvedValue({ rows: [{ ...updateData, status: 'Draft' }] });

      await request(app)
        .put('/lead-requirements/1')
        .send(updateData);

      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[1][14]).toBe('Draft'); // Default status
    });
  });

  describe('DELETE /lead-requirements/:id', () => {
    it('should delete a lead requirement', async () => {
      mockDb.query.mockResolvedValue({ 
        rows: [{ lead_requirement_id: 1 }] 
      });

      const response = await request(app).delete('/lead-requirements/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Lead requirement deleted successfully' });
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM lead_requirements WHERE lead_requirement_id = $1 RETURNING lead_requirement_id',
        ['1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).delete('/lead-requirements/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Lead requirement not found' });
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Delete operation failed'));

      const response = await request(app).delete('/lead-requirements/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Delete operation failed' });
    });
  });

  describe('GET /lead-requirements/lead/:leadId', () => {
    it('should return all requirements for a specific lead', async () => {
      const mockRequirements = [
        {
          lead_requirement_id: 1,
          lead_id: 1,
          requirement_title: 'Main Villa Requirements',
          status: 'Finalized'
        },
        {
          lead_requirement_id: 3,
          lead_id: 1,
          requirement_title: 'Guest House Requirements',
          status: 'Draft'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/lead-requirements/lead/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM lead_requirements WHERE lead_id = $1 ORDER BY created_at DESC',
        ['1']
      );
    });

    it('should return empty array if no requirements found for lead', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/lead-requirements/lead/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /lead-requirements/status/:status', () => {
    it('should return requirements with specific status', async () => {
      const mockRequirements = [
        {
          lead_requirement_id: 1,
          requirement_title: 'Finalized Villa',
          status: 'Finalized'
        },
        {
          lead_requirement_id: 4,
          requirement_title: 'Finalized Apartment',
          status: 'Finalized'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/lead-requirements/status/Finalized');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM lead_requirements WHERE status = $1 ORDER BY created_at DESC',
        ['Finalized']
      );
    });

    it('should handle different status values', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/lead-requirements/status/Draft');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM lead_requirements WHERE status = $1 ORDER BY created_at DESC',
        ['Draft']
      );
    });
  });

  describe('GET /lead-requirements/search', () => {
    it('should search requirements by title and description', async () => {
      const mockSearchResults = [
        {
          lead_requirement_id: 1,
          requirement_title: 'Luxury Villa Requirements',
          requirement_description: 'Requirements for a luxury villa with modern amenities'
        },
        {
          lead_requirement_id: 5,
          requirement_title: 'Beach Villa Specifications',
          requirement_description: 'Specifications for villa near the beach'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockSearchResults });

      const response = await request(app).get('/lead-requirements/search?query=villa');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSearchResults);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE requirement_title ILIKE $1'),
        ['%villa%']
      );
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app).get('/lead-requirements/search');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Search query is required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle special characters in search query', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/lead-requirements/search?query=test%20with%20spaces');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE requirement_title ILIKE $1'),
        ['%test with spaces%']
      );
    });

    it('should handle database errors during search', async () => {
      mockDb.query.mockRejectedValue(new Error('Search query failed'));

      const response = await request(app).get('/lead-requirements/search?query=test');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Search query failed' });
    });
  });
});
