// tests/testApp.js - COMPLETE FIXED VERSION
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

// Import all routes
const architect_drawings_route = require('../routes/architect_drawings_route.js');
const architect_measurements_doors_route = require('../routes/architect_measurements_doors_route.js');
const architect_measurements_electrical_route = require('../routes/architect_measurements_electrical_route.js');
const architect_measurements_flooring_route = require('../routes/architect_measurements_flooring_route.js');
const architect_measurements_painting_route = require('../routes/architect_measurements_painting_route.js');
const architect_measurements_plumbing_route = require('../routes/architect_measurements_plumbing_route.js');
const architect_measurements_structural_route = require('../routes/architect_measurements_structural_route.js');
const architect_measurements_windows_route = require('../routes/architect_measurements_windows_route.js');
const architect_project_drawing_route = require('../routes/architect_project_drawing_route.js');
const architect_route = require('../routes/architect_route.js');
const architect_walls_measurement_route = require('../routes/architect_walls_measurement_route.js');
const assign_to_project_route = require('../routes/assign_to_project_route.js');
const blocks_route = require('../routes/blocks_route.js');
const cities_route = require('../routes/cities_route.js');
const clients_route = require('../routes/clients_route.js');
const client_choices_route = require('../routes/client_choices_route.js');
const client_project_approval_route = require('../routes/client_project_approval_route.js');
const client_quotations_route = require('../routes/client_quotations_route.js');
const client_quotation_history_route = require('../routes/client_quotation_history_route.js');
const client_requirements_route = require('../routes/client_requirements_route.js');
const client_requirement_package_customise_route = require('../routes/client_requirement_package_customise_route.js');
const client_requirement_package_item_choice_customise_route = require('../routes/client_requirement_package_item_choice_customise_route.js');
const client_selections_route = require('../routes/client_selections_route.js');
const components_route = require('../routes/components_route.js');
const component_categories_route = require('../routes/component_categories_route.js');
const component_elements_route = require('../routes/component_elements_route.js');
const component_units_route = require('../routes/component_units_route.js');
const costing_boq_route = require('../routes/costing_boq_route.js');
const doors_route = require('../routes/doors_route.js');
const door_dimensions_route = require('../routes/door_dimensions_route.js');
const elements_route = require('../routes/elements_route.js');
const element_item_mapping_route = require('../routes/element_item_mapping_route.js');
const employees_route = require('../routes/employees_route.js');
const enquiries_route = require('../routes/enquiries_route.js');
const enquiry_item_choices_route = require('../routes/enquiry_item_choices_route.js');
const enquiry_quotations_route = require('../routes/enquiry_quotations_route.js');
const enquiry_requirements_route = require('../routes/enquiry_requirements_route.js');
const enquiry_requirement_package_customise_route = require('../routes/enquiry_requirement_package_customise_route.js');
const enquiry_requirement_package_item_choice_customise_route = require('../routes/enquiry_requirement_package_item_choice_customise_route.js');
const enquiry_selection_package_route = require('../routes/enquiry_selection_package_route.js');
const enquiry_sources_route = require('../routes/enquiry_sources_route.js');
const enquiry_status_route = require('../routes/enquiry_status_route.js');
const execution_tracking_route = require('../routes/execution_tracking_route.js');
const finance_payments_route = require('../routes/finance_payments_route.js');
const groups_route = require('../routes/groups_route.js');
const items_brick_calculations_route = require('../routes/items_brick_calculations_route.js');
const items_doors_calculations_route = require('../routes/items_doors_calculations_route.js');
const items_electrical_calculations_route = require('../routes/items_electrical_calculations_route.js');
const items_flooring_calculations_route = require('../routes/items_flooring_calculations_route.js');
const items_paint_calculations_route = require('../routes/items_paint_calculations_route.js');
const items_plumbing_calculations_route = require('../routes/items_plumbing_calculations_route.js');
const items_rmc_calculations_route = require('../routes/items_rmc_calculations_route.js');
const items_route = require('../routes/items_route.js');
const items_structural_calculations_route = require('../routes/items_structural_calculations_route.js');
const items_tmt_calculations_route = require('../routes/items_tmt_calculations_route.js');
const items_windows_calculations_route = require('../routes/items_windows_calculations_route.js');
const item_choices_route = require('../routes/item_choices_route.js');
const item_choice_pricing_route = require('../routes/item_choice_pricing_route.js');
const item_specification_types_route = require('../routes/item_specification_types_route.js');
const item_tmt_standards_route = require('../routes/item_tmt_standards_route.js');
const leads_route = require('../routes/leads_route.js');
const lead_item_choices_route = require('../routes/lead_item_choices_route.js');
const lead_quotations_route = require('../routes/lead_quotations_route.js');
const lead_quotation_history_route = require('../routes/lead_quotation_history_route.js');
const lead_requirements_route = require('../routes/lead_requirements_route.js');
const lead_requirement_floors_route = require('../routes/lead_requirement_floors_route.js');
const lead_requirement_package_customise_route = require('../routes/lead_requirement_package_customise_route.js');
const lead_requirement_package_item_choice_customise_route = require('../routes/lead_requirement_package_item_choice_customise_route.js');
const lead_selection_package_route = require('../routes/lead_selection_package_route.js');
const marketing_campaigns_route = require('../routes/marketing_campaigns_route.js');
const meetings_route = require('../routes/meetings_route.js');
const minutes_of_meeting_route = require('../routes/minutes_of_meeting_route.js');
const modules_route = require('../routes/modules_route.js');
const packages_route = require('../routes/packages_route.js');
const package_items_mapping_route = require('../routes/package_items_mapping_route.js');
const payment_installments_route = require('../routes/payment_installments_route.js');
const payment_methods_route = require('../routes/payment_methods_route.js');
const payment_reminders_route = require('../routes/payment_reminders_route.js');
const payment_types_route = require('../routes/payment_types_route.js');
const permissions_route = require('../routes/permissions_route.js');
const phases_route = require('../routes/phases_route.js');
const phase_cost_summary_route = require('../routes/phase_cost_summary_route.js');
const phase_summary_route = require('../routes/phase_summary_route.js');
const phase_units_route = require('../routes/phase_units_route.js');
const po_line_items_route = require('../routes/po_line_items_route.js');
const projects_route = require('../routes/projects_route.js');
const project_blocks_route = require('../routes/project_blocks_route.js');
const project_boq_doors_route = require('../routes/project_boq_doors_route.js');
const project_boq_electrical_route = require('../routes/project_boq_electrical_route.js');
const project_boq_flooring_route = require('../routes/project_boq_flooring_route.js');
const project_boq_painting_route = require('../routes/project_boq_painting_route.js');
const project_boq_plumbing_route = require('../routes/project_boq_plumbing_route.js');
const project_boq_route = require('../routes/project_boq_route.js');
const project_boq_structural_route = require('../routes/project_boq_structural_route.js');
const project_boq_walls_route = require('../routes/project_boq_walls_route.js');
const project_boq_windows_route = require('../routes/project_boq_windows_route.js');
const project_components_route = require('../routes/project_components_route.js');
const project_floors_route = require('../routes/project_floors_route.js');
const project_groups_route = require('../routes/project_groups_route.js');
const project_material_costing_route = require('../routes/project_material_costing_route.js');
const project_phases_route = require('../routes/project_phases_route.js');
const project_workflow_status_route = require('../routes/project_workflow_status_route.js');
const purchase_orders_route = require('../routes/purchase_orders_route.js');
const roles_route = require('../routes/roles_route.js');
const room_dimensions_route = require('../routes/room_dimensions_route.js');
const selections_route = require('../routes/selections_route.js');
const selection_items_route = require('../routes/selection_items_route.js');
const sequencing_route = require('../routes/sequencing_route.js');
const site_visits_route = require('../routes/site_visits_route.js');
const states_route = require('../routes/states_route.js');
const units_route = require('../routes/units_route.js');
const unit_details_route = require('../routes/unit_details_route.js');
const users_route = require('../routes/users_route.js');
const user_permissions_route = require('../routes/user_permissions_route.js');
const user_roles_route = require('../routes/user_roles_route.js');
const user_sessions_route = require('../routes/user_sessions_route.js');
const vendors_route = require('../routes/vendors_route.js');
const vendor_pricing_route = require('../routes/vendor_pricing_route.js');
const vendor_type_route = require('../routes/vendor_type_route.js');
const wall_openings_summary_route = require('../routes/wall_openings_summary_route.js');
const windows_route = require('../routes/windows_route.js');
const window_dimensions_route = require('../routes/window_dimensions_route.js');
const work_modules_route = require('../routes/work_modules_route.js');
const work_orders_route = require('../routes/work_orders_route.js');
const work_packages_route = require('../routes/work_packages_route.js');
const work_sequencing_route = require('../routes/work_sequencing_route.js');

// Database configuration for testing
const testConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'nopassword',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'testdb2',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

function createTestApp() {
  const app = express();
  const pool = new Pool(testConfig);
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add db to request object
  app.use((req, res, next) => {
    req.db = pool;
    next();
  });
  
  // Register all routes
  app.use('/', architect_drawings_route);
  app.use('/', architect_measurements_doors_route);
  app.use('/', architect_measurements_electrical_route);
  app.use('/', architect_measurements_flooring_route);
  app.use('/', architect_measurements_painting_route);
  app.use('/', architect_measurements_plumbing_route);
  app.use('/', architect_measurements_structural_route);
  app.use('/', architect_measurements_windows_route);
  app.use('/', architect_project_drawing_route);
  app.use('/', architect_route);
  app.use('/', architect_walls_measurement_route);
  app.use('/', assign_to_project_route);
  app.use('/', blocks_route);
  app.use('/', cities_route);
  app.use('/', clients_route);
  app.use('/', client_choices_route);
  app.use('/', client_project_approval_route);
  app.use('/', client_quotations_route);
  app.use('/', client_quotation_history_route);
  app.use('/', client_requirements_route);
  app.use('/', client_requirement_package_customise_route);
  app.use('/', client_requirement_package_item_choice_customise_route);
  app.use('/', client_selections_route);
  app.use('/', components_route);
  app.use('/', component_categories_route);
  app.use('/', component_elements_route);
  app.use('/', component_units_route);
  app.use('/', costing_boq_route);
  app.use('/', doors_route);
  app.use('/', door_dimensions_route);
  app.use('/', elements_route);
  app.use('/', element_item_mapping_route);
  app.use('/', employees_route);
  app.use('/', enquiries_route);
  app.use('/', enquiry_item_choices_route);
  app.use('/', enquiry_quotations_route);
  app.use('/', enquiry_requirements_route);
  app.use('/', enquiry_requirement_package_customise_route);
  app.use('/', enquiry_requirement_package_item_choice_customise_route);
  app.use('/', enquiry_selection_package_route);
  app.use('/', enquiry_sources_route);
  app.use('/', enquiry_status_route);
  app.use('/', execution_tracking_route);
  app.use('/', finance_payments_route);
  app.use('/', groups_route);
  app.use('/', items_brick_calculations_route);
  app.use('/', items_doors_calculations_route);
  app.use('/', items_electrical_calculations_route);
  app.use('/', items_flooring_calculations_route);
  app.use('/', items_paint_calculations_route);
  app.use('/', items_plumbing_calculations_route);
  app.use('/', items_rmc_calculations_route);
  app.use('/', items_route);
  app.use('/', items_structural_calculations_route);
  app.use('/', items_tmt_calculations_route);
  app.use('/', items_windows_calculations_route);
  app.use('/', item_choices_route);
  app.use('/', item_choice_pricing_route);
  app.use('/', item_specification_types_route);
  app.use('/', item_tmt_standards_route);
  app.use('/', leads_route);
  app.use('/', lead_item_choices_route);
  app.use('/', lead_quotations_route);
  app.use('/', lead_quotation_history_route);
  app.use('/', lead_requirements_route);
  app.use('/', lead_requirement_floors_route);
  app.use('/', lead_requirement_package_customise_route);
  app.use('/', lead_requirement_package_item_choice_customise_route);
  app.use('/', lead_selection_package_route);
  app.use('/', marketing_campaigns_route);
  app.use('/', meetings_route);
  app.use('/', minutes_of_meeting_route);
  app.use('/', modules_route);
  app.use('/', packages_route);
  app.use('/', package_items_mapping_route);
  app.use('/', payment_installments_route);
  app.use('/', payment_methods_route);
  app.use('/', payment_reminders_route);
  app.use('/', payment_types_route);
  app.use('/', permissions_route);
  app.use('/', phases_route);
  app.use('/', phase_cost_summary_route);
  app.use('/', phase_summary_route);
  app.use('/', phase_units_route);
  app.use('/', po_line_items_route);
  app.use('/', projects_route);
  app.use('/', project_blocks_route);
  app.use('/', project_boq_doors_route);
  app.use('/', project_boq_electrical_route);
  app.use('/', project_boq_flooring_route);
  app.use('/', project_boq_painting_route);
  app.use('/', project_boq_plumbing_route);
  app.use('/', project_boq_route);
  app.use('/', project_boq_structural_route);
  app.use('/', project_boq_walls_route);
  app.use('/', project_boq_windows_route);
  app.use('/', project_components_route);
  app.use('/', project_floors_route);
  app.use('/', project_groups_route);
  app.use('/', project_material_costing_route);
  app.use('/', project_phases_route);
  app.use('/', project_workflow_status_route);
  app.use('/', purchase_orders_route);
  app.use('/', roles_route);
  app.use('/', room_dimensions_route);
  app.use('/', selections_route);
  app.use('/', selection_items_route);
  app.use('/', sequencing_route);
  app.use('/', site_visits_route);
  app.use('/', states_route);
  app.use('/', units_route);
  app.use('/', unit_details_route);
  app.use('/', users_route);
  app.use('/', user_permissions_route);
  app.use('/', user_roles_route);
  app.use('/', user_sessions_route);
  app.use('/', vendors_route);
  app.use('/', vendor_pricing_route);
  app.use('/', vendor_type_route);
  app.use('/', wall_openings_summary_route);
  app.use('/', windows_route);
  app.use('/', window_dimensions_route);
  app.use('/', work_modules_route);
  app.use('/', work_orders_route);
  app.use('/', work_packages_route);
  app.use('/', work_sequencing_route);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });
  
  return { app, pool };
}

module.exports = createTestApp;
