const request = require('supertest');
const app = require('../../server');
const Lead = require('../../models/Lead');
const Enquiry = require('../../models/Enquiry');
const LeadRequirement = require('../../models/LeadRequirement');
const LeadQuotation = require('../../models/LeadQuotation');

describe('Leads Routes', () => {
  let authToken;
  let testEnquiry;
  let testLead;
  let testRequirement;

  beforeEach(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;

    // Create test enquiry
    testEnquiry = await Enquiry.create({
      enquiry_number: 'ENQ-24-TEST-001',
      contact_person_name: 'Test Customer',
      primary_phone: '9876543210',
      email: 'test@example.com',
      project_type: 'Residential',
      status: 'Converted_to_Lead'
    });

    // Create test lead
    testLead = await Lead.create({
      enquiry_id: testEnquiry.enquiry_id,
      lead_number: 'LED-24-TEST-001',
      lead_title: 'Test Villa Construction',
      project_description: 'G+2 villa construction test',
      primary_contact_name: 'Test Customer',
      primary_phone: '9876543210',
      email: 'test@example.com',
      site_address: '123 Test Street, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      project_type: 'Residential',
      construction_type: 'New',
      estimated_built_up_area: 3500,
      number_of_floors: 3,
      budget_min: 5000000,
      budget_max: 7500000,
      timeline_months: 8,
      assigned_sales_person: 1,
      stage: 'Qualified',
      probability_percentage: 25
    });
  });

  afterEach(async () => {
    await LeadQuotation.destroy({ where: {} });
    await LeadRequirement.destroy({ where: {} });
    await Lead.destroy({ where: {} });
    await Enquiry.destroy({ where: {} });
  });

  describe('GET /api/leads', () => {
    it('should get all leads', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter leads by stage', async () => {
      const res = await request(app)
        .get('/api/leads?stage=Qualified')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(l => l.stage === 'Qualified')).toBe(true);
    });

    it('should filter leads by assigned sales person', async () => {
      const res = await request(app)
        .get('/api/leads?assigned_sales_person=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(l => l.assigned_sales_person === 1)).toBe(true);
    });

    it('should include related data with include query', async () => {
      const res = await request(app)
        .get(`/api/leads?include=enquiry,requirements,quotations`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const lead = res.body.data[0];
      expect(lead).toHaveProperty('enquiry');
      expect(lead).toHaveProperty('requirements');
      expect(lead).toHaveProperty('quotations');
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should get lead by id with full details', async () => {
      const res = await request(app)
        .get(`/api/leads/${testLead.lead_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('lead_id', testLead.lead_id);
      expect(res.body.data).toHaveProperty('lead_number', 'LED-24-TEST-001');
      expect(res.body.data).toHaveProperty('enquiry');
    });

    it('should return 404 for non-existent lead', async () => {
      const res = await request(app)
        .get('/api/leads/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Lead not found');
    });
  });

  describe('POST /api/leads', () => {
    it('should create new lead from enquiry', async () => {
      const newEnquiry = await Enquiry.create({
        enquiry_number: 'ENQ-24-TEST-002',
        contact_person_name: 'New Lead Customer',
        primary_phone: '8765432109',
        status: 'New'
      });

      const newLead = {
        enquiry_id: newEnquiry.enquiry_id,
        lead_title: 'New Villa Project',
        project_description: 'G+1 villa construction',
        primary_contact_name: 'New Lead Customer',
        primary_phone: '8765432109',
        email: 'newlead@example.com',
        site_address: '456 New Street, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        project_type: 'Residential',
        construction_type: 'New',
        estimated_built_up_area: 2500,
        number_of_floors: 2,
        budget_min: 3000000,
        budget_max: 4000000,
        timeline_months: 6,
        assigned_sales_person: 1
      };

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLead);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('lead_number');
      expect(res.body.data).toHaveProperty('stage', 'Qualified');
      expect(res.body.data).toHaveProperty('probability_percentage', 25);
    });

    it('should validate required fields', async () => {
      const invalidLead = {
        enquiry_id: testEnquiry.enquiry_id,
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLead);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/leads/:id', () => {
    it('should update lead details', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          budget_confirmed: true,
          timeline_confirmed: true,
          site_ownership_confirmed: true,
          is_decision_maker: true,
          stage: 'Requirement_Gathering',
          probability_percentage: 40,
          next_action_date: new Date(),
          next_action_description: 'Site visit scheduled'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('stage', 'Requirement_Gathering');
      expect(res.body.data).toHaveProperty('probability_percentage', 40);
      expect(res.body.data).toHaveProperty('budget_confirmed', true);
    });

    it('should update interaction tracking', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          total_calls_made: 3,
          total_meetings_held: 1,
          total_site_visits: 1,
          last_interaction_date: new Date(),
          meeting_notes: 'Discussed project requirements in detail'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_calls_made', 3);
      expect(res.body.data).toHaveProperty('total_meetings_held', 1);
    });

    it('should handle stage progression', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stage: 'Site_Visited',
          site_survey_completed: true,
          requirements_finalized: true,
          probability_percentage: 60
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('stage', 'Site_Visited');
      expect(res.body.data).toHaveProperty('probability_percentage', 60);
    });
  });

  describe('POST /api/leads/:id/requirements', () => {
    it('should create lead requirement', async () => {
      const requirement = {
        requirement_title: '3BHK Villa Requirement',
        requirement_description: 'Modern 3BHK villa with parking',
        project_type: 'Residential',
        construction_type: 'New',
        site_area: 2400,
        built_up_area: 3500,
        number_of_floors: 3,
        number_of_bedrooms: 3,
        number_of_bathrooms: 4,
        stilt_required: true,
        stilt_area: 800,
        quality_preference: 'Premium',
        package_type: 'Premium Package',
        budget_range_min: 5000000,
        budget_range_max: 7500000,
        preferred_start_date: new Date(),
        expected_completion_months: 8
      };

      const res = await request(app)
        .post(`/api/leads/${testLead.lead_id}/requirements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requirement);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('requirement_number');
      expect(res.body.data).toHaveProperty('requirement_title', '3BHK Villa Requirement');
      expect(res.body.data).toHaveProperty('status', 'Draft');
    });

    it('should create detailed requirement with all specifications', async () => {
      const detailedRequirement = {
        requirement_title: 'Luxury Villa with Pool',
        requirement_description: 'Premium luxury villa with swimming pool',
        project_type: 'Residential',
        construction_type: 'New',
        site_area: 4000,
        built_up_area: 5000,
        carpet_area: 4200,
        number_of_floors: 3,
        number_of_bedrooms: 4,
        number_of_bathrooms: 5,
        has_swimming_pool: true,
        has_garden_landscaping: true,
        has_elevator: true,
        has_solar_panels: true,
        ac_provision: true,
        ac_rooms: ['Master Bedroom', 'Guest Bedroom', 'Living Room'],
        has_cctv: true,
        has_intercom: true,
        green_building_certification: true,
        quality_preference: 'Luxury',
        package_type: 'Custom',
        budget_range_min: 15000000,
        budget_range_max: 20000000
      };

      const res = await request(app)
        .post(`/api/leads/${testLead.lead_id}/requirements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(detailedRequirement);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('has_swimming_pool', true);
      expect(res.body.data).toHaveProperty('has_elevator', true);
      expect(res.body.data).toHaveProperty('quality_preference', 'Luxury');
    });
  });

  describe('GET /api/leads/:id/requirements', () => {
    it('should get all requirements for a lead', async () => {
      // Create a requirement first
      await LeadRequirement.create({
        lead_id: testLead.lead_id,
        requirement_number: 'REQ-LED-24-TEST-01',
        requirement_title: 'Test Requirement',
        project_type: 'Residential',
        built_up_area: 3500,
        status: 'Draft',
        created_by: 1
      });

      const res = await request(app)
        .get(`/api/leads/${testLead.lead_id}/requirements`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('requirement_title', 'Test Requirement');
    });
  });

  describe('POST /api/leads/:id/quotations', () => {
    beforeEach(async () => {
      // Create a requirement for quotation
      testRequirement = await LeadRequirement.create({
        lead_id: testLead.lead_id,
        requirement_number: 'REQ-LED-24-TEST-01',
        requirement_title: 'Test Requirement',
        project_type: 'Residential',
        built_up_area: 3500,
        status: 'Finalized',
        created_by: 1
      });
    });

    it('should create lead quotation', async () => {
      const quotation = {
        lead_requirement_id: testRequirement.lead_requirement_id,
        quotation_title: 'Villa Construction Quotation',
        project_title: 'Premium Villa Project',
        project_scope: 'Complete villa construction with premium finishes',
        site_area: 2400,
        built_up_area: 3500,
        construction_type: 'New',
        number_of_floors: 3,
        package_type: 'Premium Package',
        package_rate_per_sqft: 2500,
        habitable_area: 3000,
        balcony_area: 300,
        stilt_area: 200,
        terrace_area: 0,
        electrical_additional: 50000,
        plumbing_additional: 75000,
        finishing_additional: 100000,
        discount_amount: 100000,
        gst_percentage: 18,
        estimated_duration_months: 8,
        advance_percentage: 20,
        payment_terms: 'Stage-wise payment as per agreement',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        prepared_by: 1
      };

      const res = await request(app)
        .post(`/api/leads/${testLead.lead_id}/quotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(quotation);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('lead_quotation_number');
      expect(res.body.data).toHaveProperty('package_construction_amount');
      expect(res.body.data).toHaveProperty('total_amount');
      expect(res.body.data).toHaveProperty('cost_per_sqft');
      expect(res.body.data).toHaveProperty('status', 'Draft');
    });

    it('should calculate amounts correctly', async () => {
      const quotation = {
        lead_requirement_id: testRequirement.lead_requirement_id,
        quotation_title: 'Test Calculation',
        built_up_area: 1000,
        package_type: 'Basic Package',
        package_rate_per_sqft: 1000,
        habitable_area: 900,
        balcony_area: 100,
        stilt_area: 0,
        terrace_area: 0,
        gst_percentage: 18,
        prepared_by: 1
      };

      const res = await request(app)
        .post(`/api/leads/${testLead.lead_id}/quotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(quotation);

      expect(res.status).toBe(201);
      // Package amount = (900 * 1000) + (100 * 1000 * 0.65) = 900000 + 65000 = 965000
      expect(res.body.data.package_construction_amount).toBe(965000);
      // GST = 965000 * 0.18 = 173700
      expect(res.body.data.gst_amount).toBe(173700);
      // Total = 965000 + 173700 = 1138700
      expect(res.body.data.total_amount).toBe(1138700);
    });
  });

  describe('PUT /api/leads/:id/quotations/:quotationId', () => {
    let testQuotation;

    beforeEach(async () => {
      testRequirement = await LeadRequirement.create({
        lead_id: testLead.lead_id,
        requirement_number: 'REQ-LED-24-TEST-01',
        requirement_title: 'Test Requirement',
        project_type: 'Residential',
        built_up_area: 3500,
        status: 'Finalized',
        created_by: 1
      });

      testQuotation = await LeadQuotation.create({
        lead_id: testLead.lead_id,
        lead_requirement_id: testRequirement.lead_requirement_id,
        lead_quotation_number: 'LQ-24-TEST-001',
        quotation_title: 'Test Quotation',
        built_up_area: 3500,
        package_type: 'Standard Package',
        package_rate_per_sqft: 2000,
        habitable_area: 3000,
        balcony_area: 300,
        stilt_area: 200,
        terrace_area: 0,
        gst_percentage: 18,
        status: 'Draft',
        prepared_by: 1
      });
    });

    it('should update quotation status', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}/quotations/${testQuotation.lead_quotation_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Sent',
          sent_date: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Sent');
      expect(res.body.data).toHaveProperty('sent_date');
    });

    it('should handle client feedback', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}/quotations/${testQuotation.lead_quotation_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Under_Discussion',
          client_response_date: new Date(),
          client_feedback: 'Price is higher than expected, need some adjustments',
          follow_up_required: true,
          next_follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Under_Discussion');
      expect(res.body.data).toHaveProperty('client_feedback');
      expect(res.body.data).toHaveProperty('follow_up_required', true);
    });

    it('should create new version on major changes', async () => {
      const res = await request(app)
        .put(`/api/leads/${testLead.lead_id}/quotations/${testQuotation.lead_quotation_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          package_rate_per_sqft: 2200,
          discount_amount: 200000,
          revision_notes: 'Increased rate but provided higher discount',
          version_number: 2,
          previous_version_id: testQuotation.lead_quotation_id,
          is_current_version: true
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('package_rate_per_sqft', 2200);
      expect(res.body.data).toHaveProperty('discount_amount', 200000);
    });
  });

  describe('POST /api/leads/:id/convert-to-client', () => {
    it('should convert lead to client with payment', async () => {
      const res = await request(app)
        .post(`/api/leads/${testLead.lead_id}/convert-to-client`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          advance_received: 1000000,
          advance_payment_date: new Date(),
          payment_method: 'Bank_Transfer',
          payment_reference: 'UTR123456789',
          contract_signed: true,
          contract_date: new Date(),
          project_start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimated_completion_date: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
          project_manager_id: 1,
          site_engineer_id: 2,
          architect_id: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('client_number');
      expect(res.body.data).toHaveProperty('lead_id', testLead.lead_id);
      expect(res.body.data).toHaveProperty('advance_received', 1000000);
      expect(res.body.data).toHaveProperty('status', 'Payment_Received');
    });

    it('should update lead status after conversion', async () => {
      await request(app)
        .post(`/api/leads/${testLead.lead_id}/convert-to-client`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          advance_received: 500000,
          advance_payment_date: new Date(),
          payment_method: 'Cheque',
          payment_reference: 'CHQ123456'
        });

      const lead = await Lead.findByPk(testLead.lead_id);
      expect(lead.converted_to_client).toBe(true);
      expect(lead.stage).toBe('Won');
    });
  });

  describe('GET /api/leads/stats', () => {
    it('should get lead statistics', async () => {
      const res = await request(app)
        .get('/api/leads/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_leads');
      expect(res.body.data).toHaveProperty('leads_by_stage');
      expect(res.body.data).toHaveProperty('conversion_rate');
      expect(res.body.data).toHaveProperty('average_deal_size');
      expect(res.body.data).toHaveProperty('pipeline_value');
    });
  });

  describe('GET /api/leads/pipeline', () => {
    it('should get sales pipeline view', async () => {
      const res = await request(app)
        .get('/api/leads/pipeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('stages');
      expect(res.body.data.stages).toBeInstanceOf(Array);
      expect(res.body.data.stages[0]).toHaveProperty('stage');
      expect(res.body.data.stages[0]).toHaveProperty('leads');
      expect(res.body.data.stages[0]).toHaveProperty('total_value');
    });
  });
});
