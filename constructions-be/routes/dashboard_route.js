const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and metrics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     description: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get('/stats', async (req, res) => {
  const db = req.db;
  
  try {
    // Get project counts
    const projectStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'In Progress') as active_projects,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed_projects,
        COUNT(*) as total_projects,
        COALESCE(SUM(estimated_budget) FILTER (WHERE status = 'In Progress'), 0) as total_value
      FROM projects
    `);

    // Get enquiry counts
    const enquiryStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'New') as new_enquiries,
        COUNT(*) FILTER (WHERE converted_to_lead = true) as converted_enquiries,
        COUNT(*) as total_enquiries
      FROM enquiries
    `);

    // Get lead counts
    const leadStats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE stage = 'Qualified') as qualified_leads,
        COUNT(*) FILTER (WHERE stage IN ('Quotation_Sent', 'Negotiation')) as active_leads,
        COUNT(*) FILTER (WHERE converted_to_client = true) as converted_leads,
        COUNT(*) as total_leads
      FROM leads
    `);

    // Get client count
    const clientStats = await db.query(`
      SELECT COUNT(*) as total_clients
      FROM clients
    `);

    res.json({
      success: true,
      data: {
        projects: {
          active: parseInt(projectStats.rows[0].active_projects) || 0,
          completed: parseInt(projectStats.rows[0].completed_projects) || 0,
          total: parseInt(projectStats.rows[0].total_projects) || 0,
          totalValue: parseFloat(projectStats.rows[0].total_value) || 0
        },
        enquiries: {
          new: parseInt(enquiryStats.rows[0].new_enquiries) || 0,
          converted: parseInt(enquiryStats.rows[0].converted_enquiries) || 0,
          total: parseInt(enquiryStats.rows[0].total_enquiries) || 0
        },
        leads: {
          qualified: parseInt(leadStats.rows[0].qualified_leads) || 0,
          active: parseInt(leadStats.rows[0].active_leads) || 0,
          converted: parseInt(leadStats.rows[0].converted_leads) || 0,
          total: parseInt(leadStats.rows[0].total_leads) || 0
        },
        clients: {
          total: parseInt(clientStats.rows[0].total_clients) || 0
        }
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     description: Get recent activity
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/recent-activity', async (req, res) => {
  const db = req.db;
  
  try {
    // Get recent enquiries
    const recentEnquiries = await db.query(`
      SELECT 
        enquiry_id as id,
        'enquiry' as type,
        contact_person_name as title,
        status,
        created_at
      FROM enquiries
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get recent leads
    const recentLeads = await db.query(`
      SELECT 
        lead_id as id,
        'lead' as type,
        lead_title as title,
        stage as status,
        created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get recent projects
    const recentProjects = await db.query(`
      SELECT 
        project_id as id,
        'project' as type,
        project_name as title,
        status,
        created_at
      FROM projects
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Combine and sort
    const allActivity = [
      ...recentEnquiries.rows,
      ...recentLeads.rows,
      ...recentProjects.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    res.json({
      success: true,
      data: allActivity
    });
  } catch (err) {
    console.error('Recent activity error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
