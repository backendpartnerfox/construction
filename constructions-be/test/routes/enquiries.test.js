const request = require('supertest');
const app = require('../../server');
const Enquiry = require('../../models/Enquiry');
const Campaign = require('../../models/Campaign');

describe('Enquiries Routes', () => {
  let authToken;
  let testCampaign;
  let testEnquiry;

  beforeEach(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    authToken = loginRes.body.token;

    // Create test campaign
    testCampaign = await Campaign.create({
      campaign_name: 'Test Campaign',
      campaign_type: 'Google_Ads',
      platform: 'Google',
      is_active: true
    });

    // Create test enquiry
    testEnquiry = await Enquiry.create({
      enquiry_number: 'ENQ-24-TEST-001',
      campaign_id: testCampaign.campaign_id,
      contact_person_name: 'Test Customer',
      primary_phone: '9876543210',
      email: 'test@example.com',
      project_type: 'Residential',
      construction_type: 'New',
      approximate_area: 2500,
      budget_range: '50-75 Lakhs',
      expected_timeline: '6-8 months',
      status: 'New',
      crm_classification: 'Hot'
    });
  });

  afterEach(async () => {
    await Enquiry.destroy({ where: {} });
    await Campaign.destroy({ where: {} });
  });

  describe('GET /api/enquiries', () => {
    it('should get all enquiries', async () => {
      const res = await request(app)
        .get('/api/enquiries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter enquiries by status', async () => {
      const res = await request(app)
        .get('/api/enquiries?status=New')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(e => e.status === 'New')).toBe(true);
    });

    it('should filter enquiries by CRM classification', async () => {
      const res = await request(app)
        .get('/api/enquiries?crm_classification=Hot')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(e => e.crm_classification === 'Hot')).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/enquiries?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/enquiries/:id', () => {
    it('should get enquiry by id', async () => {
      const res = await request(app)
        .get(`/api/enquiries/${testEnquiry.enquiry_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('enquiry_id', testEnquiry.enquiry_id);
      expect(res.body.data).toHaveProperty('contact_person_name', 'Test Customer');
    });

    it('should return 404 for non-existent enquiry', async () => {
      const res = await request(app)
        .get('/api/enquiries/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Enquiry not found');
    });
  });

  describe('POST /api/enquiries', () => {
    it('should create new enquiry from marketing form', async () => {
      const newEnquiry = {
        campaign_id: testCampaign.campaign_id,
        contact_person_name: 'New Customer',
        contact_surname: 'Surname',
        primary_phone: '8765432109',
        email: 'new@example.com',
        whatsapp_number: '8765432109',
        city: 'Hyderabad',
        state: 'Telangana',
        project_type: 'Residential',
        construction_type: 'New',
        approximate_area: 3000,
        budget_range: '75-100 Lakhs',
        expected_timeline: '12-18 months',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer_2024'
      };

      const res = await request(app)
        .post('/api/enquiries')
        .send(newEnquiry);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('enquiry_number');
      expect(res.body.data).toHaveProperty('contact_person_name', 'New Customer');
      expect(res.body.data).toHaveProperty('crm_classification');
    });

    it('should auto-classify as Hot for immediate timeline', async () => {
      const hotEnquiry = {
        campaign_id: testCampaign.campaign_id,
        contact_person_name: 'Hot Lead',
        primary_phone: '7654321098',
        email: 'hot@example.com',
        project_type: 'Residential',
        construction_type: 'New',
        approximate_area: 2000,
        budget_range: '50-75 Lakhs',
        expected_timeline: 'Immediate',
        city: 'Bangalore',
        state: 'Karnataka'
      };

      const res = await request(app)
        .post('/api/enquiries')
        .send(hotEnquiry);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('crm_classification', 'Hot');
      expect(res.body.data).toHaveProperty('has_immediate_timeline', true);
    });

    it('should validate required fields', async () => {
      const invalidEnquiry = {
        campaign_id: testCampaign.campaign_id,
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/enquiries')
        .send(invalidEnquiry);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/enquiries/:id', () => {
    it('should update enquiry status', async () => {
      const res = await request(app)
        .put(`/api/enquiries/${testEnquiry.enquiry_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Called',
          first_call_attempted: true,
          first_call_date: new Date(),
          first_call_status: 'Connected',
          call_notes: 'Spoke with customer, interested in villa construction'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Called');
      expect(res.body.data).toHaveProperty('first_call_attempted', true);
    });

    it('should assign enquiry to sales person', async () => {
      const res = await request(app)
        .put(`/api/enquiries/${testEnquiry.enquiry_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigned_to: 1,
          assignment_date: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('assigned_to', 1);
    });

    it('should update CRM classification', async () => {
      const res = await request(app)
        .put(`/api/enquiries/${testEnquiry.enquiry_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crm_classification: 'Medium',
          classification_reason: 'Budget needs discussion, timeline flexible',
          classification_date: new Date(),
          classification_by: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('crm_classification', 'Medium');
    });
  });

  describe('POST /api/enquiries/:id/convert-to-lead', () => {
    it('should convert enquiry to lead', async () => {
      const res = await request(app)
        .post(`/api/enquiries/${testEnquiry.enquiry_id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lead_title: 'Villa Construction - Test Customer',
          project_description: 'G+2 villa construction in Hyderabad',
          site_address: '123 Test Street, Hyderabad',
          estimated_built_up_area: 3500,
          number_of_floors: 3,
          budget_min: 5000000,
          budget_max: 7500000,
          timeline_months: 8,
          assigned_sales_person: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('lead_number');
      expect(res.body.data).toHaveProperty('enquiry_id', testEnquiry.enquiry_id);
      expect(res.body.data).toHaveProperty('stage', 'Qualified');
    });

    it('should update enquiry status after conversion', async () => {
      await request(app)
        .post(`/api/enquiries/${testEnquiry.enquiry_id}/convert-to-lead`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lead_title: 'Test Lead',
          assigned_sales_person: 1
        });

      const enquiry = await Enquiry.findByPk(testEnquiry.enquiry_id);
      expect(enquiry.converted_to_lead).toBe(true);
      expect(enquiry.status).toBe('Converted_to_Lead');
    });
  });

  describe('POST /api/enquiries/:id/schedule-call', () => {
    it('should schedule a call for enquiry', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      const res = await request(app)
        .post(`/api/enquiries/${testEnquiry.enquiry_id}/schedule-call`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduled_call_date: scheduledDate,
          assigned_to: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('call_scheduled', true);
      expect(res.body.data).toHaveProperty('status', 'Call_Scheduled');
    });
  });

  describe('GET /api/enquiries/stats', () => {
    it('should get enquiry statistics', async () => {
      const res = await request(app)
        .get('/api/enquiries/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_enquiries');
      expect(res.body.data).toHaveProperty('hot_enquiries');
      expect(res.body.data).toHaveProperty('converted_to_leads');
      expect(res.body.data).toHaveProperty('conversion_rate');
    });
  });

  describe('POST /api/enquiries/webhook/n8n', () => {
    it('should handle n8n webhook for new enquiry', async () => {
      const webhookData = {
        campaign_id: testCampaign.campaign_id,
        form_data: {
          name: 'Webhook Customer',
          phone: '6543210987',
          email: 'webhook@example.com',
          project_type: 'Residential',
          area: '2000',
          budget: '40-60 Lakhs',
          timeline: '6 months'
        },
        utm_params: {
          source: 'facebook',
          medium: 'social',
          campaign: 'fb_summer_2024'
        },
        metadata: {
          ip_address: '192.168.1.1',
          device_type: 'Mobile',
          browser: 'Chrome'
        }
      };

      const res = await request(app)
        .post('/api/enquiries/webhook/n8n')
        .send(webhookData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('enquiry_number');
      expect(res.body.data).toHaveProperty('n8n_webhook_data');
    });
  });
});
