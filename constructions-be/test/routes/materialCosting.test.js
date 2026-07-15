const request = require('supertest');
const app = require('../../server');
const Project = require('../../models/Project');
const ProjectBOQ = require('../../models/ProjectBOQ');
const ProjectMaterialCosting = require('../../models/ProjectMaterialCosting');
const Vendor = require('../../models/Vendor');
const SourcingItemTMTBarPricing = require('../../models/SourcingItemTMTBarPricing');

describe('Material Costing Routes', () => {
  let authToken;
  let testProject;
  let testBOQ;
  let testVendor;
  let testCosting;

  beforeEach(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;

    // Create test project
    testProject = await Project.create({
      project_name: 'Test Costing Project',
      project_code: 'TCP-2024-001',
      client_id: 1,
      project_manager_id: 1,
      project_type: 'Residential',
      location: 'Hyderabad',
      status: 'In Progress',
      estimated_budget: 7500000
    });

    // Create test vendor
    testVendor = await Vendor.create({
      vendor_name: 'Test Steel Supplier',
      vendor_type_id: 1, // Product
      contact_person: 'John Doe',
      contact_number: '9876543210',
      email: 'test@supplier.com'
    });

    // Create test BOQ entry
    testBOQ = await ProjectBOQ.create({
      project_id: testProject.project_id,
      element_id: 4, // Columns
      item_id: 1, // TMT
      main_bar_dia: 16,
      quantity: 500,
      unit: 'kg',
      status: 'Approved',
      created_by: 1
    });

    // Create test vendor pricing
    await SourcingItemTMTBarPricing.create({
      vendor_id: testVendor.vendor_id,
      item_id: 1,
      choice_option_id: 1, // TATA FE 500D
      tmt_standard_id: 4, // 16mm
      unit_price: 1686.44,
      gst_percentage: 18,
      discount_percentage: 5,
      min_order_quantity: 8,
      price_validity_start: new Date(),
      price_validity_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      quotation_reference: 'TEST-TMT-16MM-24Q2',
      is_approved: true,
      is_active: true
    });
  });

  afterEach(async () => {
    await ProjectMaterialCosting.destroy({ where: {} });
    await SourcingItemTMTBarPricing.destroy({ where: {} });
    await ProjectBOQ.destroy({ where: {} });
    await Vendor.destroy({ where: {} });
    await Project.destroy({ where: {} });
  });

  describe('GET /api/costing/project/:projectId', () => {
    beforeEach(async () => {
      // Create test costing entries
      await ProjectMaterialCosting.create({
        project_id: testProject.project_id,
        boq_id: testBOQ.boq_id,
        element_id: 4,
        item_id: 1,
        choice_option_id: 1,
        boq_quantity: 500,
        unit: 'kg',
        main_bar_dia: 16,
        tmt_standard_id: 4,
        vendor_id: testVendor.vendor_id,
        unit_price: 1686.44,
        discount_percentage: 5,
        unit_price_after_discount: 1602.12,
        gst_percentage: 18,
        quotation_reference: 'TEST-TMT-16MM-24Q2',
        pricing_validity_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        created_by: 1
      });
    });

    it('should get all costing entries for a project', async () => {
      const res = await request(app)
        .get(`/api/costing/project/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('boq');
      expect(res.body.data[0]).toHaveProperty('vendor');
      expect(res.body.data[0]).toHaveProperty('total_amount');
    });

    it('should filter by element', async () => {
      const res = await request(app)
        .get(`/api/costing/project/${testProject.project_id}?element_id=4`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(c => c.element_id === 4)).toBe(true);
    });

    it('should filter by vendor', async () => {
      const res = await request(app)
        .get(`/api/costing/project/${testProject.project_id}?vendor_id=${testVendor.vendor_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(c => c.vendor_id === testVendor.vendor_id)).toBe(true);
    });

    it('should filter by approval status', async () => {
      const res = await request(app)
        .get(`/api/costing/project/${testProject.project_id}?is_approved=false`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(c => c.is_approved === false)).toBe(true);
    });

    it('should include summary statistics', async () => {
      const res = await request(app)
        .get(`/api/costing/project/${testProject.project_id}?include_summary=true`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('total_cost');
      expect(res.body.summary).toHaveProperty('approved_cost');
      expect(res.body.summary).toHaveProperty('pending_cost');
      expect(res.body.summary).toHaveProperty('by_vendor');
      expect(res.body.summary).toHaveProperty('by_item');
    });
  });

  describe('POST /api/costing', () => {
    it('should create costing entry', async () => {
      // Create another BOQ entry
      const newBOQ = await ProjectBOQ.create({
        project_id: testProject.project_id,
        element_id: 6, // Beams
        item_id: 1, // TMT
        main_bar_dia: 20,
        quantity: 800,
        unit: 'kg',
        status: 'Approved',
        created_by: 1
      });

      const costing = {
        project_id: testProject.project_id,
        boq_id: newBOQ.boq_id,
        element_id: 6,
        item_id: 1,
        choice_option_id: 1, // TATA FE 500D
        boq_quantity: 800,
        unit: 'kg',
        main_bar_dia: 20,
        tmt_standard_id: 5, // 20mm
        vendor_id: testVendor.vendor_id,
        unit_price: 2627.12,
        discount_percentage: 5,
        unit_price_after_discount: 2495.76,
        gst_percentage: 18,
        quotation_reference: 'TEST-TMT-20MM-24Q2',
        pricing_validity_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      };

      const res = await request(app)
        .post('/api/costing')
        .set('Authorization', `Bearer ${authToken}`)
        .send(costing);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('costing_id');
      expect(res.body.data).toHaveProperty('subtotal');
      expect(res.body.data).toHaveProperty('total_gst');
      expect(res.body.data).toHaveProperty('total_amount');
    });

    it('should calculate totals correctly', async () => {
      const costing = {
        project_id: testProject.project_id,
        boq_id: testBOQ.boq_id,
        element_id: 4,
        item_id: 1,
        boq_quantity: 100,
        unit: 'kg',
        vendor_id: testVendor.vendor_id,
        unit_price: 100,
        discount_percentage: 10,
        unit_price_after_discount: 90,
        gst_percentage: 18
      };

      const res = await request(app)
        .post('/api/costing')
        .set('Authorization', `Bearer ${authToken}`)
        .send(costing);

      expect(res.status).toBe(201);
      expect(res.body.data.subtotal).toBe(9000); // 100 * 90
      expect(res.body.data.total_gst).toBe(1620); // 9000 * 0.18
      expect(res.body.data.total_amount).toBe(10620); // 9000 + 1620
    });

    it('should validate required fields', async () => {
      const invalidCosting = {
        project_id: testProject.project_id,
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/costing')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCosting);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/costing/:id', () => {
    beforeEach(async () => {
      testCosting = await ProjectMaterialCosting.create({
        project_id: testProject.project_id,
        boq_id: testBOQ.boq_id,
        element_id: 4,
        item_id: 1,
        boq_quantity: 500,
        unit: 'kg',
        vendor_id: testVendor.vendor_id,
        unit_price: 1686.44,
        discount_percentage: 5,
        unit_price_after_discount: 1602.12,
        gst_percentage: 18,
        status: 'Draft',
        created_by: 1
      });
    });

    it('should update costing entry', async () => {
      const res = await request(app)
        .put(`/api/costing/${testCosting.costing_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: testVendor.vendor_id,
          unit_price: 1700,
          discount_percentage: 10,
          unit_price_after_discount: 1530,
          notes: 'Better pricing negotiated'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('unit_price', 1700);
      expect(res.body.data).toHaveProperty('discount_percentage', 10);
      expect(res.body.data).toHaveProperty('unit_price_after_discount', 1530);
    });

    it('should approve costing', async () => {
      const res = await request(app)
        .put(`/api/costing/${testCosting.costing_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          is_approved: true,
          approved_by: 1,
          approval_date: new Date(),
          status: 'Approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('is_approved', true);
      expect(res.body.data).toHaveProperty('status', 'Approved');
    });

    it('should not update approved costing without permission', async () => {
      await testCosting.update({ is_approved: true, status: 'Approved' });

      const res = await request(app)
        .put(`/api/costing/${testCosting.costing_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          unit_price: 2000
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot modify approved costing');
    });
  });

  describe('DELETE /api/costing/:id', () => {
    beforeEach(async () => {
      testCosting = await ProjectMaterialCosting.create({
        project_id: testProject.project_id,
        boq_id: testBOQ.boq_id,
        element_id: 4,
        item_id: 1,
        boq_quantity: 500,
        vendor_id: testVendor.vendor_id,
        unit_price: 100,
        status: 'Draft',
        created_by: 1
      });
    });

    it('should delete draft costing entry', async () => {
      const res = await request(app)
        .delete(`/api/costing/${testCosting.costing_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Costing entry deleted successfully');

      const deleted = await ProjectMaterialCosting.findByPk(testCosting.costing_id);
      expect(deleted).toBeNull();
    });

    it('should not delete approved costing', async () => {
      await testCosting.update({ is_approved: true, status: 'Approved' });

      const res = await request(app)
        .delete(`/api/costing/${testCosting.costing_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot delete approved costing');
    });
  });

  describe('POST /api/costing/populate/:projectId', () => {
    beforeEach(async () => {
      // Create multiple BOQ entries
      await ProjectBOQ.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          item_id: 1, // TMT
          main_bar_dia: 20,
          quantity: 800,
          unit: 'kg',
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 7, // Slab
          item_id: 1, // TMT
          main_bar_dia: 12,
          quantity: 1200,
          unit: 'kg',
          status: 'Approved',
          created_by: 1
        }
      ]);

      // Create vendor pricing for different sizes
      await SourcingItemTMTBarPricing.bulkCreate([
        {
          vendor_id: testVendor.vendor_id,
          item_id: 1,
          choice_option_id: 1,
          tmt_standard_id: 5, // 20mm
          unit_price: 2627.12,
          gst_percentage: 18,
          discount_percentage: 5,
          is_active: true
        },
        {
          vendor_id: testVendor.vendor_id,
          item_id: 1,
          choice_option_id: 1,
          tmt_standard_id: 3, // 12mm
          unit_price: 949.15,
          gst_percentage: 18,
          discount_percentage: 5,
          is_active: true
        }
      ]);
    });

    it('should populate costing from BOQ and vendor pricing', async () => {
      const res = await request(app)
        .post(`/api/costing/populate/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          created_by: 1
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('created');
      expect(res.body.created).toBeGreaterThan(0);

      // Check if costing entries were created
      const costingEntries = await ProjectMaterialCosting.findAll({
        where: { project_id: testProject.project_id }
      });
      expect(costingEntries.length).toBeGreaterThan(0);
    });

    it('should select best vendor pricing', async () => {
      // Create another vendor with better pricing
      const vendor2 = await Vendor.create({
        vendor_name: 'Competitive Supplier',
        vendor_type_id: 1,
        contact_person: 'Jane Doe'
      });

      await SourcingItemTMTBarPricing.create({
        vendor_id: vendor2.vendor_id,
        item_id: 1,
        choice_option_id: 1,
        tmt_standard_id: 4, // 16mm
        unit_price: 1600,
        gst_percentage: 18,
        discount_percentage: 10, // Better discount
        is_active: true
      });

      const res = await request(app)
        .post(`/api/costing/populate/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          created_by: 1
        });

      expect(res.status).toBe(200);

      // Check if better pricing was selected
      const costing = await ProjectMaterialCosting.findOne({
        where: {
          project_id: testProject.project_id,
          main_bar_dia: 16
        }
      });
      expect(costing.vendor_id).toBe(vendor2.vendor_id);
      expect(costing.discount_percentage).toBe(10);
    });
  });

  describe('GET /api/costing/summary/:projectId', () => {
    beforeEach(async () => {
      await ProjectMaterialCosting.bulkCreate([
        {
          project_id: testProject.project_id,
          boq_id: testBOQ.boq_id,
          element_id: 4,
          item_id: 1,
          boq_quantity: 500,
          unit: 'kg',
          vendor_id: testVendor.vendor_id,
          unit_price: 100,
          discount_percentage: 5,
          unit_price_after_discount: 95,
          gst_percentage: 18,
          is_approved: true,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          boq_id: testBOQ.boq_id,
          element_id: 6,
          item_id: 1,
          boq_quantity: 800,
          unit: 'kg',
          vendor_id: testVendor.vendor_id,
          unit_price: 100,
          discount_percentage: 5,
          unit_price_after_discount: 95,
          gst_percentage: 18,
          is_approved: false,
          status: 'Draft',
          created_by: 1
        }
      ]);
    });

    it('should get costing summary', async () => {
      const res = await request(app)
        .get(`/api/costing/summary/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_items');
      expect(res.body.data).toHaveProperty('total_cost');
      expect(res.body.data).toHaveProperty('approved_cost');
      expect(res.body.data).toHaveProperty('pending_cost');
      expect(res.body.data).toHaveProperty('total_discount_amount');
      expect(res.body.data).toHaveProperty('total_gst_amount');
      expect(res.body.data).toHaveProperty('by_vendor');
      expect(res.body.data).toHaveProperty('by_item');
      expect(res.body.data).toHaveProperty('by_element');
    });

    it('should calculate correct summary totals', async () => {
      const res = await request(app)
        .get(`/api/costing/summary/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Approved: 500 * 95 = 47500, GST = 8550, Total = 56050
      expect(res.body.data.approved_cost).toBe(56050);
      // Pending: 800 * 95 = 76000, GST = 13680, Total = 89680
      expect(res.body.data.pending_cost).toBe(89680);
      // Total: 56050 + 89680 = 145730
      expect(res.body.data.total_cost).toBe(145730);
    });
  });

  describe('POST /api/costing/compare-vendors/:projectId', () => {
    beforeEach(async () => {
      // Create multiple vendors
      const vendor2 = await Vendor.create({
        vendor_name: 'Vendor 2',
        vendor_type_id: 1
      });

      const vendor3 = await Vendor.create({
        vendor_name: 'Vendor 3',
        vendor_type_id: 1
      });

      // Create pricing from different vendors
      await SourcingItemTMTBarPricing.bulkCreate([
        {
          vendor_id: vendor2.vendor_id,
          item_id: 1,
          choice_option_id: 1,
          tmt_standard_id: 4,
          unit_price: 1700,
          discount_percentage: 3,
          gst_percentage: 18,
          is_active: true
        },
        {
          vendor_id: vendor3.vendor_id,
          item_id: 1,
          choice_option_id: 1,
          tmt_standard_id: 4,
          unit_price: 1650,
          discount_percentage: 7,
          gst_percentage: 18,
          is_active: true
        }
      ]);
    });

    it('should compare vendor pricing for project BOQ', async () => {
      const res = await request(app)
        .post(`/api/costing/compare-vendors/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          item_id: 1,
          choice_option_id: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('comparison');
      expect(res.body.data.comparison).toBeInstanceOf(Array);
      expect(res.body.data.comparison.length).toBeGreaterThan(1);
      expect(res.body.data).toHaveProperty('best_vendor');
      expect(res.body.data).toHaveProperty('potential_savings');
    });

    it('should identify best pricing option', async () => {
      const res = await request(app)
        .post(`/api/costing/compare-vendors/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.best_vendor).toBeTruthy();
      expect(res.body.data.best_vendor).toHaveProperty('vendor_name');
      expect(res.body.data.best_vendor).toHaveProperty('total_cost');
    });
  });

  describe('POST /api/costing/export/:projectId', () => {
    beforeEach(async () => {
      await ProjectMaterialCosting.create({
        project_id: testProject.project_id,
        boq_id: testBOQ.boq_id,
        element_id: 4,
        item_id: 1,
        boq_quantity: 500,
        unit: 'kg',
        vendor_id: testVendor.vendor_id,
        unit_price: 100,
        discount_percentage: 5,
        unit_price_after_discount: 95,
        gst_percentage: 18,
        is_approved: true,
        created_by: 1
      });
    });

    it('should export costing to Excel', async () => {
      const res = await request(app)
        .post(`/api/costing/export/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          include_pending: true,
          include_vendor_details: true
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('should export costing summary to PDF', async () => {
      const res = await request(app)
        .post(`/api/costing/export/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          type: 'summary'
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('summary');
    });
  });
});
