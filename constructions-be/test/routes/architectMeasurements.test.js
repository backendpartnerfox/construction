const request = require('supertest');
const app = require('../../server');
const Project = require('../../models/Project');
const Element = require('../../models/Element');
const ArchitectMeasurementStructural = require('../../models/ArchitectMeasurementStructural');
const ItemTMTCalculation = require('../../models/ItemTMTCalculation');
const ItemRMCCalculation = require('../../models/ItemRMCCalculation');

describe('Architect Measurements Routes', () => {
  let authToken;
  let testProject;
  let testElement;
  let testMeasurement;

  beforeEach(async () => {
    // Login to get auth token (architect role)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'architect@example.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;

    // Create test project
    testProject = await Project.create({
      project_name: 'Test Villa Project',
      project_code: 'TVP-2024-001',
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
  });

  afterEach(async () => {
    await ItemRMCCalculation.destroy({ where: {} });
    await ItemTMTCalculation.destroy({ where: {} });
    await ArchitectMeasurementStructural.destroy({ where: {} });
    await Project.destroy({ where: {} });
  });

  describe('POST /api/architect/measurements/structural', () => {
    it('should create structural measurement', async () => {
      const measurement = {
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 0.45,
        width: 0.45,
        height: 3.2,
        tmt_main_bar_dia: 16,
        tmt_distribution_bar_dia: 8,
        qty_main_bars: 8,
        qty_distribution_bars: 4,
        rmc_grade: 'M25',
        stirrup_dia: 8,
        stirrup_spacing: 150,
        concrete_cover: 40,
        design_load: 350,
        reinforcement_type: 'TMT Fe500',
        concrete_mix_ratio: '1:1.5:3'
      };

      const res = await request(app)
        .post('/api/architect/measurements/structural')
        .set('Authorization', `Bearer ${authToken}`)
        .send(measurement);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('structural_measurement_id');
      expect(res.body.data).toHaveProperty('area');
      expect(res.body.data).toHaveProperty('volume');
      expect(res.body.data).toHaveProperty('status', 'Draft');
    });

    it('should auto-calculate area and volume', async () => {
      const measurement = {
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 2,
        width: 3,
        height: 4
      };

      const res = await request(app)
        .post('/api/architect/measurements/structural')
        .set('Authorization', `Bearer ${authToken}`)
        .send(measurement);

      expect(res.status).toBe(201);
      expect(res.body.data.area).toBe(6); // 2 * 3
      expect(res.body.data.volume).toBe(24); // 2 * 3 * 4
    });

    it('should trigger TMT and RMC calculations', async () => {
      const measurement = {
        project_id: testProject.project_id,
        element_id: 4, // Columns - mapped to both TMT and RMC
        length: 0.45,
        width: 0.45,
        height: 3.2,
        tmt_main_bar_dia: 16,
        tmt_distribution_bar_dia: 8,
        qty_main_bars: 8,
        qty_distribution_bars: 4,
        rmc_grade: 'M25',
        concrete_mix_ratio: '1:1.5:3'
      };

      const res = await request(app)
        .post('/api/architect/measurements/structural')
        .set('Authorization', `Bearer ${authToken}`)
        .send(measurement);

      expect(res.status).toBe(201);

      // Check if TMT calculation was created
      const tmtCalc = await ItemTMTCalculation.findOne({
        where: { measurement_id: res.body.data.structural_measurement_id }
      });
      expect(tmtCalc).toBeTruthy();
      expect(tmtCalc.main_bar_dia).toBe(16);

      // Check if RMC calculation was created
      const rmcCalc = await ItemRMCCalculation.findOne({
        where: { measurement_id: res.body.data.structural_measurement_id }
      });
      expect(rmcCalc).toBeTruthy();
      expect(rmcCalc.concrete_grade).toBe('M25');
    });

    it('should validate required fields', async () => {
      const invalidMeasurement = {
        project_id: testProject.project_id,
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/architect/measurements/structural')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMeasurement);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/architect/measurements/structural', () => {
    beforeEach(async () => {
      // Create test measurement
      testMeasurement = await ArchitectMeasurementStructural.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 0.45,
        width: 0.45,
        height: 3.2,
        area: 0.2025,
        volume: 0.648,
        tmt_main_bar_dia: 16,
        qty_main_bars: 8,
        rmc_grade: 'M25',
        recorded_by: 3,
        status: 'Draft'
      });
    });

    it('should get all structural measurements for a project', async () => {
      const res = await request(app)
        .get(`/api/architect/measurements/structural?project_id=${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('element');
    });

    it('should filter by element', async () => {
      const res = await request(app)
        .get(`/api/architect/measurements/structural?project_id=${testProject.project_id}&element_id=${testElement.element_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(m => m.element_id === testElement.element_id)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get(`/api/architect/measurements/structural?project_id=${testProject.project_id}&status=Draft`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(m => m.status === 'Draft')).toBe(true);
    });
  });

  describe('GET /api/architect/measurements/structural/:id', () => {
    beforeEach(async () => {
      testMeasurement = await ArchitectMeasurementStructural.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 0.45,
        width: 0.45,
        height: 3.2,
        tmt_main_bar_dia: 16,
        rmc_grade: 'M25',
        recorded_by: 3,
        status: 'Draft'
      });
    });

    it('should get measurement by id', async () => {
      const res = await request(app)
        .get(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('structural_measurement_id', testMeasurement.structural_measurement_id);
      expect(res.body.data).toHaveProperty('element');
      expect(res.body.data).toHaveProperty('project');
    });

    it('should include calculations if requested', async () => {
      // Create TMT calculation
      await ItemTMTCalculation.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        measurement_id: testMeasurement.structural_measurement_id,
        main_bar_dia: 16,
        main_bar_length: 3.52,
        main_bar_weight_per_meter: 1.579,
        qty_main_bars: 8,
        calculated_by: 3
      });

      const res = await request(app)
        .get(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}?include=calculations`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('tmt_calculations');
      expect(res.body.data).toHaveProperty('rmc_calculations');
    });
  });

  describe('PUT /api/architect/measurements/structural/:id', () => {
    beforeEach(async () => {
      testMeasurement = await ArchitectMeasurementStructural.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 0.45,
        width: 0.45,
        height: 3.2,
        tmt_main_bar_dia: 16,
        rmc_grade: 'M25',
        recorded_by: 3,
        status: 'Draft'
      });
    });

    it('should update measurement', async () => {
      const res = await request(app)
        .put(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          height: 3.5,
          tmt_main_bar_dia: 20,
          qty_main_bars: 10,
          concrete_cover: 50
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('height', 3.5);
      expect(res.body.data).toHaveProperty('tmt_main_bar_dia', 20);
      expect(res.body.data).toHaveProperty('qty_main_bars', 10);
    });

    it('should update related calculations', async () => {
      // Create initial TMT calculation
      const tmtCalc = await ItemTMTCalculation.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        measurement_id: testMeasurement.structural_measurement_id,
        main_bar_dia: 16,
        main_bar_length: 3.52,
        qty_main_bars: 8,
        calculated_by: 3
      });

      const res = await request(app)
        .put(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tmt_main_bar_dia: 20,
          qty_main_bars: 10
        });

      expect(res.status).toBe(200);

      // Check if TMT calculation was updated
      const updatedCalc = await ItemTMTCalculation.findByPk(tmtCalc.calculation_id);
      expect(updatedCalc.main_bar_dia).toBe(20);
      expect(updatedCalc.qty_main_bars).toBe(10);
    });

    it('should verify measurement', async () => {
      const res = await request(app)
        .put(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Verified',
          verified_by: 1,
          verified_at: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Verified');
      expect(res.body.data).toHaveProperty('verified_by', 1);
    });
  });

  describe('DELETE /api/architect/measurements/structural/:id', () => {
    beforeEach(async () => {
      testMeasurement = await ArchitectMeasurementStructural.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        length: 0.45,
        width: 0.45,
        height: 3.2,
        recorded_by: 3,
        status: 'Draft'
      });
    });

    it('should delete measurement if in draft status', async () => {
      const res = await request(app)
        .delete(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Measurement deleted successfully');

      const deleted = await ArchitectMeasurementStructural.findByPk(testMeasurement.structural_measurement_id);
      expect(deleted).toBeNull();
    });

    it('should not delete verified measurement', async () => {
      // Update to verified status
      await testMeasurement.update({ status: 'Verified' });

      const res = await request(app)
        .delete(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Cannot delete verified measurements');
    });

    it('should cascade delete related calculations', async () => {
      // Create related calculations
      await ItemTMTCalculation.create({
        project_id: testProject.project_id,
        element_id: testElement.element_id,
        measurement_id: testMeasurement.structural_measurement_id,
        main_bar_dia: 16,
        calculated_by: 3
      });

      const res = await request(app)
        .delete(`/api/architect/measurements/structural/${testMeasurement.structural_measurement_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Check if calculations were deleted
      const tmtCalcs = await ItemTMTCalculation.findAll({
        where: { measurement_id: testMeasurement.structural_measurement_id }
      });
      expect(tmtCalcs.length).toBe(0);
    });
  });

  describe('POST /api/architect/measurements/structural/bulk', () => {
    it('should create multiple measurements', async () => {
      const measurements = [
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          length: 0.45,
          width: 0.45,
          height: 3.2,
          tmt_main_bar_dia: 16,
          rmc_grade: 'M25'
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          length: 5.0,
          width: 0.3,
          height: 0.45,
          tmt_main_bar_dia: 20,
          rmc_grade: 'M25'
        },
        {
          project_id: testProject.project_id,
          element_id: 7, // Slab
          length: 5.0,
          width: 4.0,
          slab_thickness: 0.15,
          slab_type: 'Two-way',
          tmt_main_bar_dia: 10,
          rmc_grade: 'M20'
        }
      ];

      const res = await request(app)
        .post('/api/architect/measurements/structural/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ measurements });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('created', 3);
      expect(res.body.data.measurements).toHaveLength(3);
    });

    it('should handle partial failures', async () => {
      const measurements = [
        {
          project_id: testProject.project_id,
          element_id: 4,
          length: 0.45,
          width: 0.45,
          height: 3.2
        },
        {
          // Invalid measurement - missing required fields
          project_id: testProject.project_id
        }
      ];

      const res = await request(app)
        .post('/api/architect/measurements/structural/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ measurements });

      expect(res.status).toBe(207); // Multi-status
      expect(res.body.data).toHaveProperty('created', 1);
      expect(res.body.data).toHaveProperty('failed', 1);
      expect(res.body.data.errors).toHaveLength(1);
    });
  });

  describe('GET /api/architect/measurements/structural/summary', () => {
    beforeEach(async () => {
      // Create multiple measurements
      await ArchitectMeasurementStructural.bulkCreate([
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          length: 0.45,
          width: 0.45,
          height: 3.2,
          recorded_by: 3,
          status: 'Verified'
        },
        {
          project_id: testProject.project_id,
          element_id: 4, // Columns
          length: 0.45,
          width: 0.45,
          height: 3.2,
          recorded_by: 3,
          status: 'Verified'
        },
        {
          project_id: testProject.project_id,
          element_id: 6, // Beams
          length: 5.0,
          width: 0.3,
          height: 0.45,
          recorded_by: 3,
          status: 'Draft'
        }
      ]);
    });

    it('should get measurement summary by element', async () => {
      const res = await request(app)
        .get(`/api/architect/measurements/structural/summary?project_id=${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('by_element');
      expect(res.body.data).toHaveProperty('by_status');
      expect(res.body.data).toHaveProperty('total_measurements');
      expect(res.body.data.by_element).toHaveProperty('4'); // Columns
      expect(res.body.data.by_element['4']).toBe(2);
    });
  });
});
