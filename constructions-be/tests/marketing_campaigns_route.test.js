// tests/marketing_campaigns_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      campaign_id SERIAL PRIMARY KEY,
      campaign_name VARCHAR(200) NOT NULL,
      campaign_type VARCHAR(100),
      platform VARCHAR(100),
      campaign_start_date DATE,
      campaign_end_date DATE,
      budget_allocated NUMERIC,
      n8n_webhook_url VARCHAR(500),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS marketing_campaigns');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM marketing_campaigns');
  
  // Insert test data
  await pool.query(`
    INSERT INTO marketing_campaigns (
      campaign_id, campaign_name, campaign_type, platform, campaign_start_date,
      campaign_end_date, budget_allocated, utm_source, utm_medium, utm_campaign, is_active
    )
    VALUES 
      (1, 'New Year Construction Special', 'Seasonal', 'Google Ads', '2024-01-01', '2024-01-31', 50000.00, 'google', 'cpc', 'newyear2024', true),
      (2, 'Summer Home Renovation', 'Seasonal', 'Facebook', '2024-04-01', '2024-06-30', 75000.00, 'facebook', 'social', 'summer-renovation', true),
      (3, 'Monsoon Waterproofing Drive', 'Seasonal', 'Instagram', '2024-06-01', '2024-09-30', 30000.00, 'instagram', 'social', 'monsoon-waterproof', true),
      (4, 'Luxury Villas Showcase', 'Product', 'LinkedIn', '2024-01-01', '2024-12-31', 200000.00, 'linkedin', 'professional', 'luxury-villas', true),
      (5, 'Ended Campaign', 'Test', 'Multiple', '2023-01-01', '2023-12-31', 10000.00, 'multiple', 'mixed', 'ended-campaign', false)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('marketing_campaigns_campaign_id_seq', 5)");
});

describe('Marketing Campaigns API', () => {
  // Test GET all campaigns
  test('GET /marketing-campaigns - should return all marketing campaigns', async () => {
    const response = await request(app).get('/marketing-campaigns');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('campaign_id');
    expect(response.body[0]).toHaveProperty('campaign_name');
    expect(response.body[0]).toHaveProperty('campaign_type');
  });
  
  // Test GET campaign by ID
  test('GET /marketing-campaigns/:id - should return a specific campaign', async () => {
    const response = await request(app).get('/marketing-campaigns/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaign_id', 1);
    expect(response.body).toHaveProperty('campaign_name', 'New Year Construction Special');
    expect(response.body).toHaveProperty('campaign_type', 'Seasonal');
    expect(response.body).toHaveProperty('platform', 'Google Ads');
    expect(response.body).toHaveProperty('budget_allocated', '50000');
    expect(response.body).toHaveProperty('utm_source', 'google');
    expect(response.body).toHaveProperty('utm_medium', 'cpc');
    expect(response.body).toHaveProperty('utm_campaign', 'newyear2024');
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test GET campaign by ID - not found
  test('GET /marketing-campaigns/:id - should return 404 for non-existent campaign', async () => {
    const response = await request(app).get('/marketing-campaigns/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Marketing campaign not found');
  });
  
  // Test POST new campaign
  test('POST /marketing-campaigns - should create a new marketing campaign', async () => {
    const newCampaign = {
      campaign_name: 'Festival Special Offer',
      campaign_type: 'Festival',
      platform: 'WhatsApp',
      campaign_start_date: '2024-10-01',
      campaign_end_date: '2024-10-31',
      budget_allocated: 40000.00,
      utm_source: 'whatsapp',
      utm_medium: 'messaging',
      utm_campaign: 'festival-special',
      is_active: true
    };
    
    const response = await request(app)
      .post('/marketing-campaigns')
      .send(newCampaign);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('campaign_id', 6);
    expect(response.body).toHaveProperty('campaign_name', 'Festival Special Offer');
    expect(response.body).toHaveProperty('campaign_type', 'Festival');
    expect(response.body).toHaveProperty('platform', 'WhatsApp');
    expect(response.body).toHaveProperty('budget_allocated', '40000');
  });
  
  // Test POST campaign - missing required fields
  test('POST /marketing-campaigns - should return 400 for missing campaign name', async () => {
    const incompleteCampaign = {
      campaign_type: 'Test',
      platform: 'Test Platform'
    };
    
    const response = await request(app)
      .post('/marketing-campaigns')
      .send(incompleteCampaign);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Campaign name is required');
  });
  
  // Test PUT update campaign
  test('PUT /marketing-campaigns/:id - should update a marketing campaign', async () => {
    const updatedCampaign = {
      campaign_name: 'Updated New Year Special',
      campaign_type: 'Updated Seasonal',
      platform: 'Updated Google Ads',
      campaign_start_date: '2024-01-05',
      campaign_end_date: '2024-02-05',
      budget_allocated: 60000.00,
      utm_source: 'updated-google',
      utm_medium: 'updated-cpc',
      utm_campaign: 'updated-newyear2024',
      is_active: false
    };
    
    const response = await request(app)
      .put('/marketing-campaigns/1')
      .send(updatedCampaign);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campaign_id', 1);
    expect(response.body).toHaveProperty('campaign_name', 'Updated New Year Special');
    expect(response.body).toHaveProperty('budget_allocated', '60000');
    expect(response.body).toHaveProperty('is_active', false);
  });
  
  // Test DELETE campaign
  test('DELETE /marketing-campaigns/:id - should delete a marketing campaign', async () => {
    const response = await request(app).delete('/marketing-campaigns/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Marketing campaign deleted successfully');
    
    // Verify campaign was deleted
    const getResponse = await request(app).get('/marketing-campaigns/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test GET active campaigns
  test('GET /marketing-campaigns/active - should return only active campaigns', async () => {
    const response = await request(app).get('/marketing-campaigns/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4); // 4 active campaigns
    expect(response.body.every(campaign => campaign.is_active === true)).toBeTruthy();
  });
  
  // Test GET campaigns by platform
  test('GET /marketing-campaigns/platform/Facebook - should return Facebook campaigns', async () => {
    const response = await request(app).get('/marketing-campaigns/platform/Facebook');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('platform', 'Facebook');
  });
  
  // Test search campaigns
  test('GET /marketing-campaigns/search?query=Summer - should search campaigns', async () => {
    const response = await request(app).get('/marketing-campaigns/search?query=Summer');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('campaign_name', 'Summer Home Renovation');
  });
  
  // Test search campaigns - missing query
  test('GET /marketing-campaigns/search - should return 400 for missing search query', async () => {
    const response = await request(app).get('/marketing-campaigns/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
  
  // Test GET running campaigns
  test('GET /marketing-campaigns/running - should return currently running campaigns', async () => {
    const response = await request(app).get('/marketing-campaigns/running');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    // Results depend on current date, so just check it returns an array
  });
});