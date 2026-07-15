const request = require('supertest');
const express = require('express');
const router = require('../routes/client_requirements_route');

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

describe('Client Requirements Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /client-requirements', () => {
    it('should return all client requirements', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 1,
          client_id: 1,
          requirement_title: 'Luxury Villa Requirements',
          project_type: 'Residential',
          status: 'Approved',
          approved_budget: 10000000
        },
        {
          client_requirement_id: 2,
          client_id: 2,
          requirement_title: 'Commercial Complex Requirements',
          project_type: 'Commercial',
          status: 'Draft',
          approved_budget: 50000000
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/client-requirements');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM client_requirements ORDER BY created_at DESC');
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/client-requirements');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('GET /client-requirements/:id', () => {
    it('should return a specific client requirement', async () => {
      const mockRequirement = {
        client_requirement_id: 1,
        client_id: 1,
        requirement_title: 'Luxury Villa Requirements',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 5000,
        built_up_area: 3500,
        number_of_floors: 2,
        number_of_bedrooms: 4,
        number_of_bathrooms: 5,
        status: 'Approved'
      };

      mockDb.query.mockResolvedValue({ rows: [mockRequirement] });

      const response = await request(app).get('/client-requirements/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM client_requirements WHERE client_requirement_id = $1',
        ['1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/client-requirements/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });
  });

  describe('POST /client-requirements', () => {
    it('should create a new client requirement', async () => {
      const newRequirement = {
        client_id: 1,
        requirement_title: 'Modern Apartment Requirements',
        requirement_description: 'Requirements for a modern 3BHK apartment',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 2000,
        built_up_area: 1500,
        number_of_floors: 1,
        number_of_bedrooms: 3,
        number_of_bathrooms: 2,
        number_of_kitchens: 1,
        stilt_required: false,
        has_swimming_pool: false,
        has_garden_landscaping: true,
        has_solar_panels: true,
        has_elevator: false,
        quality_level: 'Premium',
        package_type: 'Standard Package',
        approved_budget: 7500000,
        project_start_date: '2024-06-01',
        expected_completion_date: '2025-06-01',
        status: 'Draft',
        created_by: 1
      };

      const mockCreatedRequirement = {
        client_requirement_id: 3,
        ...newRequirement,
        created_at: '2024-05-01T10:00:00Z'
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedRequirement] });

      const response = await request(app)
        .post('/client-requirements')
        .send(newRequirement);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO client_requirements'),
        expect.arrayContaining([
          newRequirement.client_id,
          newRequirement.requirement_title,
          newRequirement.project_type
        ])
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidRequirement = {
        requirement_title: 'Test Requirement'
        // Missing client_id
      };

      const response = await request(app)
        .post('/client-requirements')
        .send(invalidRequirement);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Client ID and requirement title are required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('PUT /client-requirements/:id', () => {
    it('should update an existing client requirement', async () => {
      const updateData = {
        client_id: 1,
        requirement_title: 'Updated Villa Requirements',
        requirement_description: 'Updated requirements description',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 5500,
        built_up_area: 4000,
        number_of_floors: 3,
        number_of_bedrooms: 5,
        number_of_bathrooms: 6,
        status: 'Under_Review',
        approved_budget: 12000000
      };

      const mockUpdatedRequirement = {
        client_requirement_id: 1,
        ...updateData,
        updated_at: '2024-05-01T11:00:00Z'
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedRequirement] });

      const response = await request(app)
        .put('/client-requirements/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE client_requirements'),
        expect.arrayContaining([updateData.client_id, updateData.requirement_title])
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/client-requirements/999')
        .send({
          client_id: 1,
          requirement_title: 'Test Update'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .put('/client-requirements/1')
        .send({
          requirement_title: 'Test Update'
          // Missing client_id
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Client ID and requirement title are required' });
    });
  });

  describe('DELETE /client-requirements/:id', () => {
    it('should delete a client requirement', async () => {
      mockDb.query.mockResolvedValue({ 
        rows: [{ client_requirement_id: 1 }] 
      });

      const response = await request(app).delete('/client-requirements/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Client requirement deleted successfully' });
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM client_requirements WHERE client_requirement_id = $1 RETURNING client_requirement_id',
        ['1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).delete('/client-requirements/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });
  });

  describe('GET /client-requirements/client/:clientId', () => {
    it('should return all requirements for a specific client', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 1,
          client_id: 1,
          requirement_title: 'Villa Requirements',
          status: 'Approved'
        },
        {
          client_requirement_id: 3,
          client_id: 1,
          requirement_title: 'Guest House Requirements',
          status: 'Draft'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/client-requirements/client/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM client_requirements WHERE client_id = $1 ORDER BY created_at DESC',
        ['1']
      );
    });
  });

  describe('GET /client-requirements/status/:status', () => {
    it('should return requirements with specific status', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 1,
          requirement_title: 'Approved Villa',
          status: 'Approved'
        },
        {
          client_requirement_id: 4,
          requirement_title: 'Approved Complex',
          status: 'Approved'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/client-requirements/status/Approved');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM client_requirements WHERE status = $1 ORDER BY created_at DESC',
        ['Approved']
      );
    });
  });

  describe('GET /client-requirements/search', () => {
    it('should search requirements by query', async () => {
      const mockSearchResults = [
        {
          client_requirement_id: 1,
          requirement_title: 'Luxury Villa Requirements',
          project_title: 'Green Valley Villa'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockSearchResults });

      const response = await request(app).get('/client-requirements/search?query=villa');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSearchResults);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE requirement_title ILIKE $1'),
        ['%villa%']
      );
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app).get('/client-requirements/search');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Search query is required' });
    });
  });

  describe('PATCH /client-requirements/:id/approve', () => {
    it('should approve a client requirement', async () => {
      const mockApprovedRequirement = {
        client_requirement_id: 1,
        requirement_title: 'Villa Requirements',
        status: 'Approved',
        approved_date: '2024-05-01',
        approved_by: 2
      };

      mockDb.query.mockResolvedValue({ rows: [mockApprovedRequirement] });

      const response = await request(app)
        .patch('/client-requirements/1/approve')
        .send({ approved_by: 2 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Client requirement approved successfully');
      expect(response.body.requirement).toEqual(mockApprovedRequirement);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'Approved'"),
        [2, '1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .patch('/client-requirements/999/approve')
        .send({ approved_by: 2 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });
  });

  describe('PATCH /client-requirements/:id/lock', () => {
    it('should lock an approved requirement', async () => {
      // First query checks status
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ status: 'Approved' }] 
      });
      
      // Second query performs the update
      const mockLockedRequirement = {
        client_requirement_id: 1,
        requirement_title: 'Villa Requirements',
        status: 'Locked',
        locked_date: '2024-05-01',
        locked_by: 3,
        change_requests_allowed: false
      };
      mockDb.query.mockResolvedValueOnce({ 
        rows: [mockLockedRequirement] 
      });

      const response = await request(app)
        .patch('/client-requirements/1/lock')
        .send({ locked_by: 3 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Client requirement locked successfully');
      expect(response.body.requirement).toEqual(mockLockedRequirement);
    });

    it('should return 400 if requirement is not approved', async () => {
      mockDb.query.mockResolvedValue({ 
        rows: [{ status: 'Draft' }] 
      });

      const response = await request(app)
        .patch('/client-requirements/1/lock')
        .send({ locked_by: 3 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Requirement must be approved before locking' });
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .patch('/client-requirements/999/lock')
        .send({ locked_by: 3 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });
  });

  describe('PATCH /client-requirements/:id/change-request', () => {
    it('should submit a major change request', async () => {
      // First query checks if changes are allowed
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{
          change_requests_allowed: true,
          major_changes_count: 1,
          minor_changes_count: 0
        }] 
      });
      
      // Second query performs the update
      const mockUpdatedRequirement = {
        client_requirement_id: 1,
        status: 'Change_Request',
        major_changes_count: 2,
        client_specific_requests: 'Previous requests\n\nMAJOR CHANGE REQUEST: Add swimming pool'
      };
      mockDb.query.mockResolvedValueOnce({ 
        rows: [mockUpdatedRequirement] 
      });

      const response = await request(app)
        .patch('/client-requirements/1/change-request')
        .send({ 
          change_type: 'major',
          change_notes: 'Add swimming pool'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Major change request submitted successfully');
      expect(response.body.requirement).toEqual(mockUpdatedRequirement);
    });

    it('should submit a minor change request', async () => {
      // First query checks if changes are allowed
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{
          change_requests_allowed: true,
          major_changes_count: 0,
          minor_changes_count: 1
        }] 
      });
      
      // Second query performs the update
      const mockUpdatedRequirement = {
        client_requirement_id: 1,
        status: 'Change_Request',
        minor_changes_count: 2,
        client_specific_requests: 'Previous requests\n\nMINOR CHANGE REQUEST: Change paint color'
      };
      mockDb.query.mockResolvedValueOnce({ 
        rows: [mockUpdatedRequirement] 
      });

      const response = await request(app)
        .patch('/client-requirements/1/change-request')
        .send({ 
          change_type: 'minor',
          change_notes: 'Change paint color'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Minor change request submitted successfully');
      expect(response.body.requirement).toEqual(mockUpdatedRequirement);
    });

    it('should return 400 if change requests are not allowed', async () => {
      mockDb.query.mockResolvedValue({ 
        rows: [{
          change_requests_allowed: false,
          major_changes_count: 0,
          minor_changes_count: 0
        }] 
      });

      const response = await request(app)
        .patch('/client-requirements/1/change-request')
        .send({ 
          change_type: 'major',
          change_notes: 'Add feature'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Change requests are not allowed for this requirement' });
    });
  });

  describe('GET /client-requirements/project-type/:projectType', () => {
    it('should return requirements by project type', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 1,
          requirement_title: 'Villa Requirements',
          project_type: 'Residential'
        },
        {
          client_requirement_id: 3,
          requirement_title: 'Apartment Requirements',
          project_type: 'Residential'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/client-requirements/project-type/Residential');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM client_requirements WHERE project_type ILIKE $1 ORDER BY created_at DESC',
        ['%Residential%']
      );
    });
  });

  describe('GET /client-requirements/budget-range', () => {
    it('should return requirements within budget range', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 1,
          requirement_title: 'Mid-range Villa',
          approved_budget: 7500000
        },
        {
          client_requirement_id: 2,
          requirement_title: 'Premium Apartment',
          approved_budget: 9000000
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app)
        .get('/client-requirements/budget-range?min_budget=5000000&max_budget=10000000');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE approved_budget >= $1 AND approved_budget <= $2'),
        ['5000000', '10000000']
      );
    });

    it('should return 400 if budget parameters are missing', async () => {
      const response = await request(app)
        .get('/client-requirements/budget-range?min_budget=5000000');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Both min_budget and max_budget are required' });
    });
  });

  describe('GET /client-requirements/pending-approval', () => {
    it('should return requirements pending approval', async () => {
      const mockRequirements = [
        {
          client_requirement_id: 2,
          requirement_title: 'Pending Villa',
          status: 'Under_Review'
        },
        {
          client_requirement_id: 4,
          requirement_title: 'Pending Complex',
          status: 'Under_Review'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirements });

      const response = await request(app).get('/client-requirements/pending-approval');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirements);
      expect(mockDb.query).toHaveBeenCalledWith(
        "SELECT * FROM client_requirements WHERE status = 'Under_Review' ORDER BY created_at ASC"
      );
    });
  });

  describe('GET /client-requirements/with-client-details', () => {
    it('should return requirements with client details', async () => {
      const mockRequirementsWithDetails = [
        {
          client_requirement_id: 1,
          client_id: 1,
          requirement_title: 'Villa Requirements',
          status: 'Approved',
          client_name: 'John Doe',
          surname: 'Doe',
          client_email: 'john.doe@example.com',
          client_phone: '9876543210',
          client_city: 'Mumbai',
          client_state: 'Maharashtra'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockRequirementsWithDetails });

      const response = await request(app).get('/client-requirements/with-client-details');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirementsWithDetails);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN clients c ON cr.client_id = c.client_id')
      );
    });
  });

  describe('GET /client-requirements/:id/with-client-details', () => {
    it('should return a specific requirement with client details', async () => {
      const mockRequirementWithDetails = {
        client_requirement_id: 1,
        client_id: 1,
        requirement_title: 'Villa Requirements',
        status: 'Approved',
        client_name: 'John Doe',
        surname: 'Doe',
        client_email: 'john.doe@example.com',
        client_phone: '9876543210',
        client_city: 'Mumbai',
        client_state: 'Maharashtra',
        client_type: 'Individual'
      };

      mockDb.query.mockResolvedValue({ rows: [mockRequirementWithDetails] });

      const response = await request(app).get('/client-requirements/1/with-client-details');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequirementWithDetails);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE cr.client_requirement_id = $1'),
        ['1']
      );
    });

    it('should return 404 if requirement not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/client-requirements/999/with-client-details');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Client requirement not found' });
    });
  });
});
