const request = require('supertest');
const express = require('express');
const router = require('../routes/vendors_route');

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

describe('Vendors Route Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /vendors', () => {
    it('should return all vendors', async () => {
      const mockVendors = [
        {
          vendor_id: 1,
          vendor_name: 'BuildTech Materials',
          vendor_type_id: 1,
          contact_person: 'Rajesh Sharma',
          contact_number: '+91-9876543210',
          email: 'contact@buildtechmaterials.com',
          address: '123 Construction Lane, Mumbai, Maharashtra, India'
        },
        {
          vendor_id: 2,
          vendor_name: 'Supreme Cement',
          vendor_type_id: 1,
          contact_person: 'Anita Patel',
          contact_number: '+91-8765432109',
          email: 'sales@supremecement.com',
          address: '456 Industrial Zone, Delhi, India'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockVendors });

      const response = await request(app).get('/vendors');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVendors);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM vendors');
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/vendors');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /vendors/:id', () => {
    it('should return a specific vendor', async () => {
      const mockVendor = {
        vendor_id: 1,
        vendor_name: 'BuildTech Materials',
        vendor_type_id: 1,
        contact_person: 'Rajesh Sharma',
        contact_number: '+91-9876543210',
        email: 'contact@buildtechmaterials.com',
        address: '123 Construction Lane, Mumbai, Maharashtra, India'
      };

      mockDb.query.mockResolvedValue({ rows: [mockVendor] });

      const response = await request(app).get('/vendors/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVendor);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vendors WHERE vendor_id = $1',
        ['1']
      );
    });

    it('should return 404 if vendor not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/vendors/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vendor not found' });
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Query failed'));

      const response = await request(app).get('/vendors/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /vendors/type/:vendorTypeId', () => {
    it('should return vendors of a specific type', async () => {
      const mockVendors = [
        {
          vendor_id: 1,
          vendor_name: 'BuildTech Materials',
          vendor_type_id: 1,
          contact_person: 'Rajesh Sharma'
        },
        {
          vendor_id: 2,
          vendor_name: 'Supreme Cement',
          vendor_type_id: 1,
          contact_person: 'Anita Patel'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockVendors });

      const response = await request(app).get('/vendors/type/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVendors);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vendors WHERE vendor_type_id = $1',
        ['1']
      );
    });

    it('should return empty array if no vendors found for type', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/vendors/type/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Query failed'));

      const response = await request(app).get('/vendors/type/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /vendors', () => {
    it('should create a new vendor', async () => {
      const newVendor = {
        vendor_name: 'SteelForge Industries',
        vendor_type_id: 1,
        contact_person: 'Vikram Singh',
        contact_number: '+91-7654321098',
        email: 'orders@steelforge.co.in',
        address: '789 Metal Complex, Jamshedpur, Jharkhand, India'
      };

      const mockCreatedVendor = {
        vendor_id: 3,
        ...newVendor
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedVendor] });

      const response = await request(app)
        .post('/vendors')
        .send(newVendor);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedVendor);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vendors'),
        [
          newVendor.vendor_name,
          newVendor.vendor_type_id,
          newVendor.contact_person,
          newVendor.contact_number,
          newVendor.email,
          newVendor.address
        ]
      );
    });

    it('should create vendor with minimal required fields', async () => {
      const minimalVendor = {
        vendor_name: 'Basic Vendor'
      };

      const mockCreatedVendor = {
        vendor_id: 4,
        vendor_name: 'Basic Vendor',
        vendor_type_id: null,
        contact_person: null,
        contact_number: null,
        email: null,
        address: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedVendor] });

      const response = await request(app)
        .post('/vendors')
        .send(minimalVendor);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedVendor);
    });

    it('should return 400 if vendor name is missing', async () => {
      const invalidVendor = {
        vendor_type_id: 1,
        contact_person: 'Test Person'
      };

      const response = await request(app)
        .post('/vendors')
        .send(invalidVendor);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Vendor name is required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle foreign key violations', async () => {
      const vendorWithInvalidType = {
        vendor_name: 'Test Vendor',
        vendor_type_id: 999 // Non-existent type
      };

      mockDb.query.mockRejectedValue({ code: '23503', message: 'Foreign key violation' });

      const response = await request(app)
        .post('/vendors')
        .send(vendorWithInvalidType);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid vendor type' });
    });

    it('should handle unique constraint violations', async () => {
      const duplicateVendor = {
        vendor_name: 'Existing Vendor'
      };

      mockDb.query.mockRejectedValue({ code: '23505', message: 'Unique violation' });

      const response = await request(app)
        .post('/vendors')
        .send(duplicateVendor);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Vendor already exists' });
    });

    it('should handle not null violations', async () => {
      mockDb.query.mockRejectedValue({ code: '23502', message: 'Not null violation' });

      const response = await request(app)
        .post('/vendors')
        .send({ vendor_name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle general database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/vendors')
        .send({ vendor_name: 'Test Vendor' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('PUT /vendors/:id', () => {
    it('should update an existing vendor', async () => {
      const updateData = {
        vendor_name: 'Updated BuildTech Materials',
        vendor_type_id: 2,
        contact_person: 'Updated Rajesh Sharma',
        contact_number: '+91-9876543211',
        email: 'updated@buildtechmaterials.com',
        address: 'Updated Address, Mumbai, Maharashtra, India'
      };

      const mockUpdatedVendor = {
        vendor_id: 1,
        ...updateData
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedVendor] });

      const response = await request(app)
        .put('/vendors/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedVendor);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendors'),
        [
          updateData.vendor_name,
          updateData.vendor_type_id,
          updateData.contact_person,
          updateData.contact_number,
          updateData.email,
          updateData.address,
          '1'
        ]
      );
    });

    it('should update vendor with partial fields', async () => {
      const partialUpdate = {
        vendor_name: 'Partially Updated Vendor',
        contact_person: 'New Contact'
      };

      const mockUpdatedVendor = {
        vendor_id: 1,
        vendor_name: 'Partially Updated Vendor',
        vendor_type_id: null,
        contact_person: 'New Contact',
        contact_number: null,
        email: null,
        address: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedVendor] });

      const response = await request(app)
        .put('/vendors/1')
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedVendor);
    });

    it('should return 404 if vendor not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/vendors/999')
        .send({ vendor_name: 'Test Update' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vendor not found' });
    });

    it('should return 400 if vendor name is missing', async () => {
      const invalidUpdate = {
        contact_person: 'Test Person'
      };

      const response = await request(app)
        .put('/vendors/1')
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Vendor name is required' });
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle foreign key violations', async () => {
      mockDb.query.mockRejectedValue({ code: '23503', message: 'Foreign key violation' });

      const response = await request(app)
        .put('/vendors/1')
        .send({ 
          vendor_name: 'Test Vendor',
          vendor_type_id: 999 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid vendor type' });
    });

    it('should handle not null violations', async () => {
      mockDb.query.mockRejectedValue({ code: '23502', message: 'Not null violation' });

      const response = await request(app)
        .put('/vendors/1')
        .send({ vendor_name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle general database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/vendors/1')
        .send({ vendor_name: 'Test Update' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('DELETE /vendors/:id', () => {
    it('should delete a vendor', async () => {
      mockDb.query.mockResolvedValue({ 
        rows: [{ vendor_id: 1, vendor_name: 'Deleted Vendor' }] 
      });

      const response = await request(app).delete('/vendors/1');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM vendors WHERE vendor_id = $1 RETURNING *',
        ['1']
      );
    });

    it('should return 404 if vendor not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app).delete('/vendors/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Vendor not found' });
    });

    it('should handle foreign key constraint errors', async () => {
      mockDb.query.mockRejectedValue({ 
        code: '23503', 
        message: 'Foreign key violation - vendor is referenced' 
      });

      const response = await request(app).delete('/vendors/1');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Cannot delete. Vendor is referenced by other records.' 
      });
    });

    it('should handle general database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/vendors/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
});
