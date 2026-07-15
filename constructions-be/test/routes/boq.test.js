const request = require('supertest');
const app = require('../../server');
const Project = require('../../models/Project');
const ProjectBOQ = require('../../models/ProjectBOQ');
const Element = require('../../models/Element');
const Item = require('../../models/Item');
const ItemTMTCalculation = require('../../models/ItemTMTCalculation');
const ItemRMCCalculation = require('../../models/ItemRMCCalculation');

describe('Project BOQ Routes', () => {
  let authToken;
  let testProject;
  let testElement;
  let testItem;
  let testBOQ;

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
      project_name: 'Test BOQ Project',
      project_code: 'TBP-2024-001',
      client_id: 1,
      project_manager_id: 1,
      architect_id: 3,
      project_type: 'Residential',
      location: 'Hyderabad',
      site_address: '123 Test Street, Hyderabad',
      start_date: new Date(),
      estimated_end_date: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
      estimated_budget: 7500000,
      total_area: 3500,
      number_of_floors: 3
    });

    // Create test element
    testElement = await Element.create({
      element_name: 'Columns',
      element_category: 'Structural',
      element_description: 'Vertical structural elements'
    });

    // Create test item
    testItem = await Item.create({
      item_name: 'TMT Bar',
      item_description: 'Thermo-Mechanically Treated reinforcement steel bars',
      item_unit: 'kg',
      item_category: 'Structural',
      is_active: true
    });
  });

  afterEach(async () => {
    await ProjectBOQ.destroy({ where: {} });
    await ItemRMCCalculation.destroy({ where: {} });
    await ItemTMTCalculation.destroy({ where: {} });
    await Project.destroy({ where: {} });
  });

  describe('GET /api/boq/project/:projectId', () => {
    beforeEach(async () => {
      // Create test BOQ entries
      await ProjectBOQ.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: testElement.element_id,
          item_id: 1, // TMT
          main_bar_dia: 16,
          quantity: 500,
          unit: 'kg',
          unit_rate: 75,
          status: 'Draft',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: testElement.element_id,
          item_id: 2, // RMC
          rmc_grade: 'M25',
          quantity: 10,
          unit: 'cum',
          unit_rate: 5500,
          status: 'Draft',
          created_by: 1
        }
      ]);
    });

    it('should get all BOQ items for a project', async () => {
      const res = await request(app)
        .get(`/api/boq/project/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty('element');
      expect(res.body.data[0]).toHaveProperty('item');
      expect(res.body.data[0]).toHaveProperty('total_amount');
    });

    it('should filter by element', async () => {
      const res = await request(app)
        .get(`/api/boq/project/${testProject.project_id}?element_id=${testElement.element_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(b => b.element_id === testElement.element_id)).toBe(true);
    });

    it('should filter by item', async () => {
      const res = await request(app)
        .get(`/api/boq/project/${testProject.project_id}?item_id=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(b => b.item_id === 1)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get(`/api/boq/project/${testProject.project_id}?status=Draft`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(b => b.status === 'Draft')).toBe(true);
    });

    it('should include summary statistics', async () => {
      const res = await request(app)
        .get(`/api/boq/project/${testProject.project_id}?include_summary=true`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('total_items');
      expect(res.body.summary).toHaveProperty('total_amount');
      expect(res.body.summary).toHaveProperty('by_category');
    });
  });

  describe('POST /api/boq', () => {
    it('should create BOQ entry', async () => {
      const boqEntry = {
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1, // TMT
        main_bar_dia: 20,
        quantity: 750,
        unit: 'kg',
        unit_rate: 78,
        remarks: 'For column reinforcement'
      };

      const res = await request(app)
        .post('/api/boq')
        .set('Authorization', `Bearer ${authToken}`)
        .send(boqEntry);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('boq_id');
      expect(res.body.data).toHaveProperty('total_amount', 58500); // 750 * 78
      expect(res.body.data).toHaveProperty('status', 'Draft');
    });

    it('should prevent duplicate entries', async () => {
      // Create first entry
      await ProjectBOQ.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1,
        quantity: 500,
        unit: 'kg',
        created_by: 1
      });

      // Try to create duplicate
      const duplicateEntry = {
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1,
        quantity: 600,
        unit: 'kg'
      };

      const res = await request(app)
        .post('/api/boq')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateEntry);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'BOQ entry already exists for this project-element-item combination');
    });

    it('should link to calculation if provided', async () => {
      const boqEntry = {
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1,
        calculation_id: 123,
        quantity: 500,
        unit: 'kg',
        unit_rate: 75
      };

      const res = await request(app)
        .post('/api/boq')
        .set('Authorization', `Bearer ${authToken}`)
        .send(boqEntry);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('calculation_id', 123);
    });
  });

  describe('PUT /api/boq/:id', () => {
    beforeEach(async () => {
      testBOQ = await ProjectBOQ.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1,
        main_bar_dia: 16,
        quantity: 500,
        unit: 'kg',
        unit_rate: 75,
        status: 'Draft',
        created_by: 1
      });
    });

    it('should update BOQ entry', async () => {
      const res = await request(app)
        .put(`/api/boq/${testBOQ.boq_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 600,
          unit_rate: 80,
          remarks: 'Updated quantity based on revised calculations'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('quantity', 600);
      expect(res.body.data).toHaveProperty('unit_rate', 80);
      expect(res.body.data).toHaveProperty('total_amount', 48000); // 600 * 80
      expect(res.body.data).toHaveProperty('revision_number', 1);
    });

    it('should not update approved BOQ without permission', async () => {
      // Update BOQ to approved status
      await testBOQ.update({ status: 'Approved' });

      const res = await request(app)
        .put(`/api/boq/${testBOQ.boq_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 700
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot modify approved BOQ entry');
    });

    it('should approve BOQ entry', async () => {
      const res = await request(app)
        .put(`/api/boq/${testBOQ.boq_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Approved',
          approved_by: 1,
          approved_at: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Approved');
      expect(res.body.data).toHaveProperty('approved_by', 1);
    });
  });

  describe('DELETE /api/boq/:id', () => {
    beforeEach(async () => {
      testBOQ = await ProjectBOQ.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        item_id: 1,
        quantity: 500,
        unit: 'kg',
        status: 'Draft',
        created_by: 1
      });
    });

    it('should delete draft BOQ entry', async () => {
      const res = await request(app)
        .delete(`/api/boq/${testBOQ.boq_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'BOQ entry deleted successfully');

      const deleted = await ProjectBOQ.findByPk(testBOQ.boq_id);
      expect(deleted).toBeNull();
    });

    it('should not delete approved BOQ entry', async () => {
      await testBOQ.update({ status: 'Approved' });

      const res = await request(app)
        .delete(`/api/boq/${testBOQ.boq_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot delete approved BOQ entry');
    });
  });

  describe('POST /api/boq/populate/:projectId', () => {
    beforeEach(async () => {
      // Create TMT calculations
      await ItemTMTCalculation.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          measurement_id: 1,
          main_bar_dia: 16,
          main_bar_total_weight: 250,
          distribution_bar_total_weight: 50,
          calculated_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          measurement_id: 2,
          main_bar_dia: 20,
          main_bar_total_weight: 400,
          distribution_bar_total_weight: 100,
          calculated_by: 1
        }
      ]);

      // Create RMC calculations
      await ItemRMCCalculation.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          measurement_id: 1,
          concrete_grade: 'M25',
          net_volume: 5.5,
          calculated_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          measurement_id: 2,
          concrete_grade: 'M25',
          net_volume: 8.2,
          calculated_by: 1
        }
      ]);
    });

    it('should populate BOQ from calculations', async () => {
      const res = await request(app)
        .post(`/api/boq/populate/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('created');
      expect(res.body).toHaveProperty('updated');

      // Check if BOQ entries were created
      const boqEntries = await ProjectBOQ.findAll({
        where: { project_id: testProject.project_id }
      });
      expect(boqEntries.length).toBeGreaterThan(0);
    });

    it('should update existing BOQ entries', async () => {
      // Create existing BOQ entry
      await ProjectBOQ.create({
        project_id: testProject.project_id,
        element_id: 4,
        item_id: 1, // TMT
        quantity: 200,
        unit: 'kg',
        created_by: 1
      });

      const res = await request(app)
        .post(`/api/boq/populate/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.updated).toBeGreaterThan(0);

      // Check if quantity was updated
      const updatedBOQ = await ProjectBOQ.findOne({
        where: {
          project_id: testProject.project_id,
          element_id: 4,
          item_id: 1
        }
      });
      expect(updatedBOQ.quantity).toBe(300); // 250 + 50 from calculations
    });
  });

  describe('GET /api/boq/summary/:projectId', () => {
    beforeEach(async () => {
      await ProjectBOQ.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          item_id: 1, // TMT
          quantity: 500,
          unit: 'kg',
          unit_rate: 75,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          item_id: 2, // RMC
          quantity: 10,
          unit: 'cum',
          unit_rate: 5500,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          item_id: 1, // TMT
          quantity: 800,
          unit: 'kg',
          unit_rate: 75,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          item_id: 2, // RMC
          quantity: 15,
          unit: 'cum',
          unit_rate: 5500,
          status: 'Draft',
          created_by: 1
        }
      ]);
    });

    it('should get BOQ summary', async () => {
      const res = await request(app)
        .get(`/api/boq/summary/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_items', 4);
      expect(res.body.data).toHaveProperty('total_approved_amount');
      expect(res.body.data).toHaveProperty('total_draft_amount');
      expect(res.body.data).toHaveProperty('by_element');
      expect(res.body.data).toHaveProperty('by_item');
      expect(res.body.data).toHaveProperty('by_category');
    });

    it('should calculate correct summary totals', async () => {
      const res = await request(app)
        .get(`/api/boq/summary/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Approved: (500*75) + (10*5500) + (800*75) = 37500 + 55000 + 60000 = 152500
      expect(res.body.data.total_approved_amount).toBe(152500);
      // Draft: 15*5500 = 82500
      expect(res.body.data.total_draft_amount).toBe(82500);
    });

    it('should group by element correctly', async () => {
      const res = await request(app)
        .get(`/api/boq/summary/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.by_element).toHaveProperty('4'); // Columns
      expect(res.body.data.by_element['4']).toHaveProperty('quantity');
      expect(res.body.data.by_element['4']).toHaveProperty('amount');
    });
  });

  describe('POST /api/boq/export/:projectId', () => {
    beforeEach(async () => {
      await ProjectBOQ.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4,
          item_id: 1,
          quantity: 500,
          unit: 'kg',
          unit_rate: 75,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 4,
          item_id: 2,
          quantity: 10,
          unit: 'cum',
          unit_rate: 5500,
          status: 'Approved',
          created_by: 1
        }
      ]);
    });

    it('should export BOQ to Excel', async () => {
      const res = await request(app)
        .post(`/api/boq/export/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          include_draft: false
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('should export BOQ to PDF', async () => {
      const res = await request(app)
        .post(`/api/boq/export/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          include_draft: true,
          include_summary: true
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should export BOQ to CSV', async () => {
      const res = await request(app)
        .post(`/api/boq/export/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv'
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.csv');
    });
  });

  describe('POST /api/boq/approve-all/:projectId', () => {
    beforeEach(async () => {
      await ProjectBOQ.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4,
          item_id: 1,
          quantity: 500,
          unit: 'kg',
          status: 'Draft',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 4,
          item_id: 2,
          quantity: 10,
          unit: 'cum',
          status: 'Draft',
          created_by: 1
        },
        {
          project_id: testProject.project_id,
          element_id: 6,
          item_id: 1,
          quantity: 800,
          unit: 'kg',
          status: 'Approved',
          created_by: 1
        }
      ]);
    });

    it('should approve all draft BOQ entries', async () => {
      const res = await request(app)
        .post(`/api/boq/approve-all/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('approved_count', 2);
      expect(res.body).toHaveProperty('already_approved', 1);

      // Check if entries were approved
      const approvedEntries = await ProjectBOQ.findAll({
        where: {
          project_id: testProject.project_id,
          status: 'Approved'
        }
      });
      expect(approvedEntries.length).toBe(3);
    });
  });

  describe('POST /api/boq/copy/:sourceProjectId/:targetProjectId', () => {
    let sourceProject;
    let targetProject;

    beforeEach(async () => {
      // Create source project with BOQ
      sourceProject = testProject;

      // Create target project
      targetProject = await Project.create({
        project_name: 'Target Project',
        project_code: 'TP-2024-002',
        client_id: 2,
        project_manager_id: 1,
        status: 'Planning'
      });

      // Create BOQ entries in source project
      await ProjectBOQ.bulkCreate([
        {
          project_id: sourceProject.project_id,
          element_id: 4,
          item_id: 1,
          quantity: 500,
          unit: 'kg',
          unit_rate: 75,
          status: 'Approved',
          created_by: 1
        },
        {
          project_id: sourceProject.project_id,
          element_id: 4,
          item_id: 2,
          quantity: 10,
          unit: 'cum',
          unit_rate: 5500,
          status: 'Approved',
          created_by: 1
        }
      ]);
    });

    it('should copy BOQ from source to target project', async () => {
      const res = await request(app)
        .post(`/api/boq/copy/${sourceProject.project_id}/${targetProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copy_rates: true,
          reset_status: true
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('copied_count', 2);

      // Check if BOQ was copied
      const copiedEntries = await ProjectBOQ.findAll({
        where: { project_id: targetProject.project_id }
      });
      expect(copiedEntries.length).toBe(2);
      expect(copiedEntries[0].status).toBe('Draft'); // Reset status
      expect(copiedEntries[0].unit_rate).toBe(75); // Rates copied
    });

    it('should copy BOQ without rates', async () => {
      const res = await request(app)
        .post(`/api/boq/copy/${sourceProject.project_id}/${targetProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copy_rates: false
        });

      expect(res.status).toBe(200);

      const copiedEntries = await ProjectBOQ.findAll({
        where: { project_id: targetProject.project_id }
      });
      expect(copiedEntries[0].unit_rate).toBe(0); // Rates not copied
    });
  });
});
