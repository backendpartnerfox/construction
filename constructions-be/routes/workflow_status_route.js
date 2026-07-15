const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get complete workflow status for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get project basic info
        const projectQuery = `
            SELECT 
                p.*,
                c.client_name,
                e.first_name || ' ' || e.last_name as project_manager_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN employees e ON p.project_manager_id = e.employee_id
            WHERE p.project_id = $1
        `;
        const projectResult = await pool.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectResult.rows[0];
        
        // Get workflow stages status
        const workflowStatus = {
            project_info: project,
            stages: {}
        };
        
        // 1. Design & Measurement Stage
        const measurementQuery = `
            SELECT 
                COUNT(DISTINCT ams.structural_measurement_id) as structural_count,
                COUNT(DISTINCT ams.structural_measurement_id) FILTER (WHERE ams.status = 'Verified') as structural_verified,
                COUNT(DISTINCT awm.measurement_id) as wall_count,
                COUNT(DISTINCT amd.door_measurement_id) as door_count,
                COUNT(DISTINCT amw.window_measurement_id) as window_count,
                COUNT(DISTINCT amf.flooring_measurement_id) as flooring_count
            FROM projects p
            LEFT JOIN architect_measurements_structural ams ON p.project_id = ams.project_id
            LEFT JOIN architect_walls_measurement awm ON p.project_id = awm.project_id
            LEFT JOIN architect_measurements_doors amd ON p.project_id = amd.project_id
            LEFT JOIN architect_measurements_windows amw ON p.project_id = amw.project_id
            LEFT JOIN architect_measurements_flooring amf ON p.project_id = amf.project_id
            WHERE p.project_id = $1
        `;
        const measurementResult = await pool.query(measurementQuery, [projectId]);
        
        workflowStatus.stages.design_measurement = {
            status: measurementResult.rows[0].structural_verified > 0 ? 'In Progress' : 'Pending',
            details: measurementResult.rows[0]
        };
        
        // 2. BOQ Generation Stage
        const boqQuery = `
            SELECT 
                COUNT(DISTINCT pbs.boq_id) as structural_boq_count,
                COUNT(DISTINCT pbw.boq_id) as walls_boq_count,
                COUNT(DISTINCT pbd.boq_id) as doors_boq_count,
                COUNT(DISTINCT pbwin.boq_id) as windows_boq_count,
                COUNT(DISTINCT pbf.boq_id) as flooring_boq_count,
                COUNT(DISTINCT pbe.boq_id) as electrical_boq_count,
                COUNT(DISTINCT pbp.boq_id) as plumbing_boq_count
            FROM projects p
            LEFT JOIN project_boq_structural pbs ON p.project_id = pbs.project_id
            LEFT JOIN project_boq_walls pbw ON p.project_id = pbw.project_id
            LEFT JOIN project_boq_doors pbd ON p.project_id = pbd.project_id
            LEFT JOIN project_boq_windows pbwin ON p.project_id = pbwin.project_id
            LEFT JOIN project_boq_flooring pbf ON p.project_id = pbf.project_id
            LEFT JOIN project_boq_electrical pbe ON p.project_id = pbe.project_id
            LEFT JOIN project_boq_plumbing pbp ON p.project_id = pbp.project_id
            WHERE p.project_id = $1
        `;
        const boqResult = await pool.query(boqQuery, [projectId]);
        
        const boqTotal = Object.values(boqResult.rows[0]).reduce((sum, count) => sum + parseInt(count || 0), 0);
        workflowStatus.stages.boq_generation = {
            status: boqTotal > 0 ? 'In Progress' : 'Pending',
            details: boqResult.rows[0]
        };
        
        // 3. Component & Unit Breakdown
        const componentQuery = `
            SELECT 
                COUNT(DISTINCT pc.project_component_id) as component_count,
                COUNT(DISTINCT u.unit_id) as unit_count,
                COUNT(DISTINCT cu.component_unit_id) as component_unit_count
            FROM project_components pc
            LEFT JOIN units u ON pc.project_id = u.project_id
            LEFT JOIN component_units cu ON pc.component_id = cu.component_id
            WHERE pc.project_id = $1
        `;
        const componentResult = await pool.query(componentQuery, [projectId]);
        
        workflowStatus.stages.component_breakdown = {
            status: componentResult.rows[0].component_count > 0 ? 'Completed' : 'Pending',
            details: componentResult.rows[0]
        };
        
        // 4. Costing Stage
        const costingQuery = `
            SELECT 
                COUNT(*) as costing_entries,
                COUNT(*) FILTER (WHERE is_approved = true) as approved_entries,
                SUM(total_amount) as total_project_cost
            FROM project_material_costing
            WHERE project_id = $1
        `;
        const costingResult = await pool.query(costingQuery, [projectId]);
        
        workflowStatus.stages.costing = {
            status: costingResult.rows[0].approved_entries > 0 ? 'Approved' : 
                    costingResult.rows[0].costing_entries > 0 ? 'In Progress' : 'Pending',
            details: costingResult.rows[0]
        };
        
        // 5. Phase Planning
        const phaseQuery = `
            SELECT 
                COUNT(DISTINCT p.phase_id) as phase_count,
                COUNT(DISTINCT pu.phase_unit_id) as phase_unit_count,
                MIN(p.start_date) as earliest_start,
                MAX(p.end_date) as latest_end
            FROM phases p
            LEFT JOIN phase_units pu ON p.phase_id = pu.phase_id
            WHERE p.project_id = $1
        `;
        const phaseResult = await pool.query(phaseQuery, [projectId]);
        
        workflowStatus.stages.phase_planning = {
            status: phaseResult.rows[0].phase_count > 0 ? 'Completed' : 'Pending',
            details: phaseResult.rows[0]
        };
        
        // 6. Client Selections
        const selectionQuery = `
            SELECT 
                COUNT(*) as total_selections,
                COUNT(*) FILTER (WHERE status = 'Pending') as pending_selections,
                COUNT(*) FILTER (WHERE status = 'Selected') as completed_selections,
                COUNT(*) FILTER (WHERE status = 'Approved') as approved_selections
            FROM selections
            WHERE project_id = $1
        `;
        const selectionResult = await pool.query(selectionQuery, [projectId]);
        
        workflowStatus.stages.client_selections = {
            status: selectionResult.rows[0].approved_selections > 0 ? 'Approved' :
                    selectionResult.rows[0].completed_selections > 0 ? 'In Progress' : 'Pending',
            details: selectionResult.rows[0]
        };
        
        // 7. Procurement
        const procurementQuery = `
            SELECT 
                COUNT(DISTINCT po.purchase_order_id) as po_count,
                COUNT(DISTINCT po.purchase_order_id) FILTER (WHERE po.status = 'Delivered') as delivered_count,
                COUNT(DISTINCT wo.work_order_id) as wo_count,
                COUNT(DISTINCT wo.work_order_id) FILTER (WHERE wo.status = 'Completed') as completed_wo_count
            FROM projects p
            LEFT JOIN purchase_orders po ON p.project_id = po.project_id
            LEFT JOIN work_orders wo ON p.project_id = wo.project_id
            WHERE p.project_id = $1
        `;
        const procurementResult = await pool.query(procurementQuery, [projectId]);
        
        workflowStatus.stages.procurement = {
            status: procurementResult.rows[0].delivered_count > 0 ? 'In Progress' : 
                    procurementResult.rows[0].po_count > 0 ? 'Started' : 'Pending',
            details: procurementResult.rows[0]
        };
        
        // 8. Execution
        const executionQuery = `
            SELECT 
                COUNT(*) as work_package_count,
                COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_count,
                COUNT(*) FILTER (WHERE status = 'Completed') as completed_count,
                AVG(progress_percentage) as avg_progress
            FROM work_packages
            WHERE project_id = $1
        `;
        const executionResult = await pool.query(executionQuery, [projectId]);
        
        workflowStatus.stages.execution = {
            status: executionResult.rows[0].completed_count > 0 ? 'In Progress' :
                    executionResult.rows[0].in_progress_count > 0 ? 'Started' : 'Pending',
            details: executionResult.rows[0]
        };
        
        // Calculate overall progress
        const stageWeights = {
            design_measurement: 10,
            boq_generation: 15,
            component_breakdown: 10,
            costing: 15,
            phase_planning: 10,
            client_selections: 10,
            procurement: 15,
            execution: 15
        };
        
        let totalProgress = 0;
        Object.keys(workflowStatus.stages).forEach(stage => {
            const stageStatus = workflowStatus.stages[stage].status;
            const weight = stageWeights[stage] || 0;
            
            if (stageStatus === 'Completed' || stageStatus === 'Approved') {
                totalProgress += weight;
            } else if (stageStatus === 'In Progress' || stageStatus === 'Started') {
                totalProgress += weight * 0.5;
            }
        });
        
        workflowStatus.overall_progress = totalProgress;
        workflowStatus.overall_status = totalProgress === 100 ? 'Completed' :
                                       totalProgress > 50 ? 'In Progress' :
                                       totalProgress > 0 ? 'Started' : 'Not Started';
        
        res.json(workflowStatus);
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get workflow summary for all projects
router.get('/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.project_id,
                p.project_name,
                p.status as project_status,
                c.client_name,
                COUNT(DISTINCT ams.structural_measurement_id) as measurements_count,
                COUNT(DISTINCT pbs.boq_id) as boq_count,
                COUNT(DISTINCT pc.project_component_id) as component_count,
                COUNT(DISTINCT ph.phase_id) as phase_count,
                COUNT(DISTINCT po.purchase_order_id) as po_count,
                COUNT(DISTINCT wp.work_package_id) as work_package_count,
                AVG(wp.progress_percentage) as avg_progress
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN architect_measurements_structural ams ON p.project_id = ams.project_id
            LEFT JOIN project_boq_structural pbs ON p.project_id = pbs.project_id
            LEFT JOIN project_components pc ON p.project_id = pc.project_id
            LEFT JOIN phases ph ON p.project_id = ph.project_id
            LEFT JOIN purchase_orders po ON p.project_id = po.project_id
            LEFT JOIN work_packages wp ON p.project_id = wp.project_id
            GROUP BY p.project_id, p.project_name, p.status, c.client_name
            ORDER BY p.created_at DESC
        `;
        
        const result = await pool.query(query);
        
        const summary = result.rows.map(row => {
            // Calculate workflow progress based on completed stages
            let stagesCompleted = 0;
            const totalStages = 6;
            
            if (row.measurements_count > 0) stagesCompleted++;
            if (row.boq_count > 0) stagesCompleted++;
            if (row.component_count > 0) stagesCompleted++;
            if (row.phase_count > 0) stagesCompleted++;
            if (row.po_count > 0) stagesCompleted++;
            if (row.work_package_count > 0) stagesCompleted++;
            
            return {
                ...row,
                workflow_progress: Math.round((stagesCompleted / totalStages) * 100),
                execution_progress: row.avg_progress || 0
            };
        });
        
        res.json(summary);
    } catch (error) {
        console.error('Error fetching workflow summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update workflow stage status
router.put('/update-stage/:projectId/:stage', async (req, res) => {
    try {
        const { projectId, stage } = req.params;
        const { status, notes } = req.body;
        
        // Validate stage
        const validStages = [
            'design_measurement', 'boq_generation', 'component_breakdown',
            'costing', 'phase_planning', 'client_selections',
            'procurement', 'execution'
        ];
        
        if (!validStages.includes(stage)) {
            return res.status(400).json({ error: 'Invalid workflow stage' });
        }
        
        // Create or update workflow status entry
        const query = `
            INSERT INTO project_workflow_status (
                project_id, stage_name, status, notes, updated_at, updated_by
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
            ON CONFLICT (project_id, stage_name) 
            DO UPDATE SET 
                status = $3, 
                notes = $4, 
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $5
            RETURNING *
        `;
        
        const values = [projectId, stage, status, notes, req.user?.id || 1];
        const result = await pool.query(query, values);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating workflow stage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get stage dependencies and next actions
router.get('/next-actions/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get current workflow status
        const statusQuery = `
            SELECT * FROM project_workflow_status
            WHERE project_id = $1
            ORDER BY stage_name
        `;
        const statusResult = await pool.query(statusQuery, [projectId]);
        
        const completedStages = statusResult.rows
            .filter(row => row.status === 'Completed')
            .map(row => row.stage_name);
        
        const nextActions = [];
        
        // Define stage dependencies
        const stageDependencies = {
            'design_measurement': [],
            'boq_generation': ['design_measurement'],
            'component_breakdown': ['boq_generation'],
            'costing': ['boq_generation'],
            'phase_planning': ['component_breakdown'],
            'client_selections': ['costing'],
            'procurement': ['costing', 'client_selections'],
            'execution': ['procurement', 'phase_planning']
        };
        
        // Check which stages can be started
        Object.entries(stageDependencies).forEach(([stage, dependencies]) => {
            const isCompleted = completedStages.includes(stage);
            const dependenciesMet = dependencies.every(dep => completedStages.includes(dep));
            
            if (!isCompleted && dependenciesMet) {
                nextActions.push({
                    stage: stage,
                    action: `Start ${stage.replace('_', ' ')}`,
                    dependencies_met: true,
                    blocking_stages: []
                });
            } else if (!isCompleted && !dependenciesMet) {
                const blockingStages = dependencies.filter(dep => !completedStages.includes(dep));
                nextActions.push({
                    stage: stage,
                    action: `Complete prerequisites for ${stage.replace('_', ' ')}`,
                    dependencies_met: false,
                    blocking_stages: blockingStages
                });
            }
        });
        
        res.json({
            completed_stages: completedStages,
            next_actions: nextActions,
            workflow_dependencies: stageDependencies
        });
    } catch (error) {
        console.error('Error fetching next actions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
