const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get complete workflow tracking for all projects
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT * FROM complete_workflow_tracking
            ORDER BY enquiry_number DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflow tracking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get workflow tracking by enquiry number
router.get('/enquiry/:enquiryNumber', async (req, res) => {
    try {
        const { enquiryNumber } = req.params;
        const query = `
            SELECT * FROM complete_workflow_tracking
            WHERE enquiry_number = $1
        `;
        const result = await pool.query(query, [enquiryNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow tracking not found for this enquiry' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching workflow tracking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get requirements evolution tracking
router.get('/requirements-evolution/:enquiryId', async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const query = `
            SELECT 
                er.requirement_title as enquiry_req,
                er.budget_range_max as enquiry_budget,
                lr.requirement_title as lead_req,
                lr.budget_range_max as lead_budget,
                cr.requirement_title as client_req,
                cr.approved_budget as client_budget,
                lr.budget_range_max - er.budget_range_max as enquiry_to_lead_budget_change,
                cr.approved_budget - lr.budget_range_max as lead_to_client_budget_change
            FROM enquiry_requirements er
            LEFT JOIN lead_requirements lr ON er.enquiry_requirement_id = lr.enquiry_requirement_id
            LEFT JOIN client_requirements cr ON lr.lead_requirement_id = cr.lead_requirement_id
            WHERE er.enquiry_id = $1
        `;
        const result = await pool.query(query, [enquiryId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching requirements evolution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get quotation evolution tracking
router.get('/quotation-evolution/:enquiryId', async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const query = `
            SELECT * FROM quotation_evolution
            WHERE enquiry_quotation_number IN (
                SELECT enquiry_quotation_number 
                FROM enquiry_quotations 
                WHERE enquiry_id = $1
            )
        `;
        const result = await pool.query(query, [enquiryId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching quotation evolution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get detailed workflow timeline for a specific journey
router.get('/timeline/:enquiryNumber', async (req, res) => {
    try {
        const { enquiryNumber } = req.params;
        
        // Get all events in chronological order
        const query = `
            WITH workflow_events AS (
                -- Enquiry events
                SELECT 
                    e.enquiry_number,
                    'Enquiry Created' as event_type,
                    e.created_at as event_date,
                    'Enquiry' as stage,
                    e.contact_person_name as actor,
                    'New enquiry received from ' || e.utm_source as description,
                    e.enquiry_id::text as reference_id
                FROM enquiries e
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Enquiry quotation events
                SELECT 
                    e.enquiry_number,
                    'Enquiry Quotation Created' as event_type,
                    eq.created_at as event_date,
                    'Enquiry' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Quotation ' || eq.enquiry_quotation_number || ' created' as description,
                    eq.enquiry_quotation_id::text as reference_id
                FROM enquiry_quotations eq
                JOIN enquiries e ON eq.enquiry_id = e.enquiry_id
                LEFT JOIN employees emp ON eq.prepared_by = emp.employee_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Lead conversion events
                SELECT 
                    e.enquiry_number,
                    'Converted to Lead' as event_type,
                    l.created_at as event_date,
                    'Lead' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Lead ' || l.lead_number || ' created' as description,
                    l.lead_id::text as reference_id
                FROM leads l
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                LEFT JOIN employees emp ON l.assigned_sales_person = emp.employee_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Lead quotation events
                SELECT 
                    e.enquiry_number,
                    'Lead Quotation ' || 
                    CASE 
                        WHEN lq.version_number > 1 THEN 'Revised (v' || lq.version_number || ')'
                        ELSE 'Created'
                    END as event_type,
                    lq.created_at as event_date,
                    'Lead' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Quotation ' || lq.lead_quotation_number || 
                    ' - Amount: ₹' || TO_CHAR(lq.total_amount, 'FM999,999,999.00') as description,
                    lq.lead_quotation_id::text as reference_id
                FROM lead_quotations lq
                JOIN leads l ON lq.lead_id = l.lead_id
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                LEFT JOIN employees emp ON lq.prepared_by = emp.employee_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Payment events
                SELECT 
                    e.enquiry_number,
                    'Payment Received' as event_type,
                    fp.payment_date as event_date,
                    'Finance' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Payment ' || fp.payment_number || 
                    ' - Amount: ₹' || TO_CHAR(fp.payment_amount, 'FM999,999,999.00') ||
                    ' via ' || pm.method_name as description,
                    fp.payment_id::text as reference_id
                FROM finance_payments fp
                JOIN leads l ON fp.lead_id = l.lead_id
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                LEFT JOIN payment_methods pm ON fp.payment_method_id = pm.payment_method_id
                LEFT JOIN employees emp ON fp.received_by = emp.employee_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Client conversion events
                SELECT 
                    e.enquiry_number,
                    'Converted to Client' as event_type,
                    c.created_at as event_date,
                    'Client' as stage,
                    c.client_name as actor,
                    'Client ' || c.client_number || ' created with advance payment' as description,
                    c.client_id::text as reference_id
                FROM clients c
                JOIN leads l ON c.lead_id = l.lead_id
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Project creation events
                SELECT 
                    e.enquiry_number,
                    'Project Created' as event_type,
                    p.created_at as event_date,
                    'Project' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Project ' || p.project_code || ' - ' || p.project_name as description,
                    p.project_id::text as reference_id
                FROM projects p
                JOIN clients c ON p.client_id = c.client_id
                JOIN leads l ON c.lead_id = l.lead_id
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                LEFT JOIN employees emp ON p.project_manager_id = emp.employee_id
                WHERE e.enquiry_number = $1
                
                UNION ALL
                
                -- Architect assignment events
                SELECT 
                    e.enquiry_number,
                    'Architect Assigned' as event_type,
                    p.created_at as event_date,
                    'Project' as stage,
                    emp.first_name || ' ' || emp.last_name as actor,
                    'Architect assigned to project' as description,
                    p.project_id::text as reference_id
                FROM projects p
                JOIN clients c ON p.client_id = c.client_id
                JOIN leads l ON c.lead_id = l.lead_id
                JOIN enquiries e ON l.enquiry_id = e.enquiry_id
                LEFT JOIN employees emp ON p.architect_id = emp.employee_id
                WHERE e.enquiry_number = $1 AND p.architect_id IS NOT NULL
            )
            SELECT * FROM workflow_events
            ORDER BY event_date ASC
        `;
        
        const result = await pool.query(query, [enquiryNumber]);
        
        // Group events by stage
        const timeline = {
            enquiry_number: enquiryNumber,
            total_events: result.rows.length,
            stages: {},
            events: result.rows
        };
        
        // Group by stage
        result.rows.forEach(event => {
            if (!timeline.stages[event.stage]) {
                timeline.stages[event.stage] = [];
            }
            timeline.stages[event.stage].push(event);
        });
        
        res.json(timeline);
    } catch (error) {
        console.error('Error fetching workflow timeline:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get conversion funnel statistics
router.get('/conversion-funnel', async (req, res) => {
    try {
        const query = `
            WITH funnel_stats AS (
                SELECT 
                    COUNT(DISTINCT e.enquiry_id) as total_enquiries,
                    COUNT(DISTINCT l.lead_id) as total_leads,
                    COUNT(DISTINCT c.client_id) as total_clients,
                    COUNT(DISTINCT p.project_id) as total_projects
                FROM enquiries e
                LEFT JOIN leads l ON e.enquiry_id = l.enquiry_id
                LEFT JOIN clients c ON l.lead_id = c.lead_id
                LEFT JOIN projects p ON c.client_id = p.client_id
            ),
            conversion_rates AS (
                SELECT 
                    total_enquiries,
                    total_leads,
                    total_clients,
                    total_projects,
                    CASE WHEN total_enquiries > 0 
                        THEN ROUND((total_leads::numeric / total_enquiries) * 100, 2) 
                        ELSE 0 END as enquiry_to_lead_rate,
                    CASE WHEN total_leads > 0 
                        THEN ROUND((total_clients::numeric / total_leads) * 100, 2) 
                        ELSE 0 END as lead_to_client_rate,
                    CASE WHEN total_clients > 0 
                        THEN ROUND((total_projects::numeric / total_clients) * 100, 2) 
                        ELSE 0 END as client_to_project_rate,
                    CASE WHEN total_enquiries > 0 
                        THEN ROUND((total_projects::numeric / total_enquiries) * 100, 2) 
                        ELSE 0 END as overall_conversion_rate
                FROM funnel_stats
            )
            SELECT * FROM conversion_rates
        `;
        
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching conversion funnel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get workflow bottlenecks
router.get('/bottlenecks', async (req, res) => {
    try {
        const query = `
            WITH stage_durations AS (
                -- Calculate average time between stages
                SELECT 
                    'Enquiry to Lead' as transition,
                    AVG(EXTRACT(EPOCH FROM (l.created_at - e.created_at))/86400)::numeric(10,2) as avg_days,
                    MIN(EXTRACT(EPOCH FROM (l.created_at - e.created_at))/86400)::numeric(10,2) as min_days,
                    MAX(EXTRACT(EPOCH FROM (l.created_at - e.created_at))/86400)::numeric(10,2) as max_days,
                    COUNT(*) as sample_size
                FROM enquiries e
                JOIN leads l ON e.enquiry_id = l.enquiry_id
                
                UNION ALL
                
                SELECT 
                    'Lead to Client' as transition,
                    AVG(EXTRACT(EPOCH FROM (c.created_at - l.created_at))/86400)::numeric(10,2) as avg_days,
                    MIN(EXTRACT(EPOCH FROM (c.created_at - l.created_at))/86400)::numeric(10,2) as min_days,
                    MAX(EXTRACT(EPOCH FROM (c.created_at - l.created_at))/86400)::numeric(10,2) as max_days,
                    COUNT(*) as sample_size
                FROM leads l
                JOIN clients c ON l.lead_id = c.lead_id
                
                UNION ALL
                
                SELECT 
                    'Client to Project' as transition,
                    AVG(EXTRACT(EPOCH FROM (p.created_at - c.created_at))/86400)::numeric(10,2) as avg_days,
                    MIN(EXTRACT(EPOCH FROM (p.created_at - c.created_at))/86400)::numeric(10,2) as min_days,
                    MAX(EXTRACT(EPOCH FROM (p.created_at - c.created_at))/86400)::numeric(10,2) as max_days,
                    COUNT(*) as sample_size
                FROM clients c
                JOIN projects p ON c.client_id = p.client_id
            ),
            stuck_items AS (
                -- Find items stuck at each stage
                SELECT 
                    'Stuck at Enquiry' as status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400)::numeric(10,2) as avg_days_stuck
                FROM enquiries
                WHERE enquiry_id NOT IN (SELECT enquiry_id FROM leads)
                AND created_at < CURRENT_DATE - INTERVAL '30 days'
                
                UNION ALL
                
                SELECT 
                    'Stuck at Lead' as status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400)::numeric(10,2) as avg_days_stuck
                FROM leads
                WHERE lead_id NOT IN (SELECT lead_id FROM clients WHERE lead_id IS NOT NULL)
                AND created_at < CURRENT_DATE - INTERVAL '60 days'
                
                UNION ALL
                
                SELECT 
                    'Stuck at Client' as status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400)::numeric(10,2) as avg_days_stuck
                FROM clients
                WHERE client_id NOT IN (SELECT client_id FROM projects)
                AND created_at < CURRENT_DATE - INTERVAL '30 days'
            )
            SELECT 
                'transitions' as metric_type,
                json_agg(row_to_json(sd.*)) as data
            FROM stage_durations sd
            UNION ALL
            SELECT 
                'stuck_items' as metric_type,
                json_agg(row_to_json(si.*)) as data
            FROM stuck_items si
        `;
        
        const result = await pool.query(query);
        
        const bottlenecks = {};
        result.rows.forEach(row => {
            bottlenecks[row.metric_type] = row.data;
        });
        
        res.json(bottlenecks);
    } catch (error) {
        console.error('Error fetching workflow bottlenecks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
