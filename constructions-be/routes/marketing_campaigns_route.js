const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MarketingCampaigns
 *   description: API for managing marketing campaigns
 */

/**
 * @swagger
 * /marketing_campaigns:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Retrieve all marketing campaigns
 *     responses:
 *       200:
 *         description: List of marketing campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   campaign_id:
 *                     type: integer
 *                   campaign_name:
 *                     type: string
 *                   campaign_type:
 *                     type: string
 *                   platform:
 *                     type: string
 *                   campaign_start_date:
 *                     type: string
 *                     format: date
 *                   campaign_end_date:
 *                     type: string
 *                     format: date
 *                   budget_allocated:
 *                     type: number
 *                   n8n_webhook_url:
 *                     type: string
 *                   utm_source:
 *                     type: string
 *                   utm_medium:
 *                     type: string
 *                   utm_campaign:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

// Get all marketing campaigns
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM marketing_campaigns ORDER BY created_at DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/{id}:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Retrieve a specific marketing campaign by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the marketing campaign to retrieve
 *     responses:
 *       200:
 *         description: Marketing campaign details
 *       404:
 *         description: Marketing campaign not found
 *       500:
 *         description: Internal server error
 */

// Get marketing campaign by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM marketing_campaigns WHERE campaign_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Marketing campaign not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns:
 *   post:
 *     summary: Create a new marketing campaign
 *     tags: [MarketingCampaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_name
 *             properties:
 *               campaign_name:
 *                 type: string
 *               campaign_type:
 *                 type: string
 *               platform:
 *                 type: string
 *               campaign_start_date:
 *                 type: string
 *                 format: date
 *               campaign_end_date:
 *                 type: string
 *                 format: date
 *               budget_allocated:
 *                 type: number
 *               n8n_webhook_url:
 *                 type: string
 *               utm_source:
 *                 type: string
 *               utm_medium:
 *                 type: string
 *               utm_campaign:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Marketing campaign created successfully
 *       400:
 *         description: Campaign name is required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    campaign_name,
    campaign_type,
    platform,
    campaign_start_date,
    campaign_end_date,
    budget_allocated,
    n8n_webhook_url,
    utm_source,
    utm_medium,
    utm_campaign,
    is_active
  } = req.body;

  if (!campaign_name) {
    return res.status(400).json({ error: "Campaign name is required" });
  }

  try {
    const query = `
      INSERT INTO marketing_campaigns (
        campaign_name, campaign_type, platform, campaign_start_date,
        campaign_end_date, budget_allocated, n8n_webhook_url, utm_source,
        utm_medium, utm_campaign, is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      campaign_name,
      campaign_type,
      platform,
      campaign_start_date,
      campaign_end_date,
      budget_allocated,
      n8n_webhook_url,
      utm_source,
      utm_medium,
      utm_campaign,
      is_active === false ? false : true
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/{id}:
 *   put:
 *     summary: Update an existing marketing campaign by ID
 *     tags: [MarketingCampaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the marketing campaign to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_name
 *             properties:
 *               campaign_name:
 *                 type: string
 *               campaign_type:
 *                 type: string
 *               platform:
 *                 type: string
 *               campaign_start_date:
 *                 type: string
 *                 format: date
 *               campaign_end_date:
 *                 type: string
 *                 format: date
 *               budget_allocated:
 *                 type: number
 *               n8n_webhook_url:
 *                 type: string
 *               utm_source:
 *                 type: string
 *               utm_medium:
 *                 type: string
 *               utm_campaign:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Marketing campaign updated successfully
 *       400:
 *         description: Campaign name is required
 *       404:
 *         description: Marketing campaign not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    campaign_name,
    campaign_type,
    platform,
    campaign_start_date,
    campaign_end_date,
    budget_allocated,
    n8n_webhook_url,
    utm_source,
    utm_medium,
    utm_campaign,
    is_active
  } = req.body;

  if (!campaign_name) {
    return res.status(400).json({ error: "Campaign name is required" });
  }

  try {
    const query = `
      UPDATE marketing_campaigns 
      SET 
        campaign_name = $1,
        campaign_type = $2,
        platform = $3,
        campaign_start_date = $4,
        campaign_end_date = $5,
        budget_allocated = $6,
        n8n_webhook_url = $7,
        utm_source = $8,
        utm_medium = $9,
        utm_campaign = $10,
        is_active = $11
      WHERE campaign_id = $12
      RETURNING *
    `;
    
    const values = [
      campaign_name,
      campaign_type,
      platform,
      campaign_start_date,
      campaign_end_date,
      budget_allocated,
      n8n_webhook_url,
      utm_source,
      utm_medium,
      utm_campaign,
      is_active === false ? false : true,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Marketing campaign not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/{id}:
 *   delete:
 *     summary: Delete a marketing campaign by ID
 *     tags: [MarketingCampaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the marketing campaign to delete
 *     responses:
 *       200:
 *         description: Marketing campaign deleted successfully
 *       404:
 *         description: Marketing campaign not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM marketing_campaigns WHERE campaign_id = $1 RETURNING campaign_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Marketing campaign not found" });
    }
    
    res.json({ message: "Marketing campaign deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/active:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Retrieve all active marketing campaigns
 *     responses:
 *       200:
 *         description: List of active marketing campaigns
 *       500:
 *         description: Internal server error
 */
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM marketing_campaigns WHERE is_active = true ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/platform/{platform}:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Retrieve campaigns by platform
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *         description: The platform to retrieve campaigns from
 *     responses:
 *       200:
 *         description: List of campaigns on the specified platform
 *       500:
 *         description: Internal server error
 */
router.get('/platform/:platform', async (req, res) => {
  const db = req.db;
  const { platform } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM marketing_campaigns WHERE platform ILIKE $1 ORDER BY created_at DESC", 
      [`%${platform}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/search:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Search campaigns by name or type
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for campaign name or type
 *     responses:
 *       200:
 *         description: List of campaigns matching the search criteria
 *       500:
 *         description: Internal server error
 */
router.get('/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM marketing_campaigns 
       WHERE campaign_name ILIKE $1 
       OR campaign_type ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /marketing_campaigns/running:
 *   get:
 *     tags: [MarketingCampaigns]
 *     description: Retrieve all currently running campaigns
 *     responses:
 *       200:
 *         description: List of currently running campaigns
 *       500:
 *         description: Internal server error
 */
router.get('/running', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      `SELECT * FROM marketing_campaigns 
       WHERE is_active = true 
       AND (campaign_start_date IS NULL OR campaign_start_date <= CURRENT_DATE)
       AND (campaign_end_date IS NULL OR campaign_end_date >= CURRENT_DATE)
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;