const express = require('express');
const { Pool } = require('pg'); // ✅ PostgreSQL client
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 9000;

// ✅ CORS Configuration
// Production origins come from ALLOWED_ORIGINS env var (comma-separated).
// e.g. ALLOWED_ORIGINS=https://myapp.netlify.app,https://staging.myapp.netlify.app
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4200',
  'http://localhost:8000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8989',
  'http://localhost:8990',
  'http://localhost:9000',
  'http://localhost:9001',
  ...extraOrigins,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // curl/postman/mobile
    try {
      const host = new URL(origin).host;
      if (allowedOrigins.includes(origin) ||
          /\.netlify\.app$/i.test(host) ||           // Netlify deploy previews
          process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
    } catch (_) { /* invalid URL — fall through to deny */ }
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// ✅ Middleware
app.use(express.json());
// ✅ Enable CORS with the configured options
app.use(cors(corsOptions));
// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ PostgreSQL Connection Pool
let db;

async function connectToDatabase() {
  try {
    // Database configuration object
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
    
    // Only add SSL configuration for remote connections
    if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
      dbConfig.ssl = {
        rejectUnauthorized: false
      };
    }
    
    console.log('Connecting to database:', {
      host: dbConfig.host,
      user: dbConfig.user,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: dbConfig.ssl ? 'enabled' : 'disabled'
    });
    
    db = new Pool(dbConfig);

    // Optional: test connection
    const result = await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL at:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.message);
    throw err;
  }
}

// ✅ Import routes

const projects = require('./routes/projects_route');  
const items = require('./routes/items_route');  
const itemchoices = require('./routes/item_choices_route');  
const employees = require('./routes/employees_route');  
const clients = require('./routes/clients_route');
const architect_measurements_structural = require('./routes/architect_measurements_structural_route');
const architectMeasurementsDoorsRoute = require('./routes/architect_measurements_doors_route'); // ✅ Import architect_measurements_doors route
const client_choices = require('./routes/client_choices_route');
const item_specification_types = require('./routes/item_specification_types_route');
const elements = require('./routes/elements_route'); // ✅ Import elements route
const element_item_mapping = require('./routes/element_item_mapping_route'); // ✅ Import element_item_mapping route
const items_tmt_calculations = require('./routes/items_tmt_calculations_route'); // ✅ Import items_TMT_calculations route
const items_rmc_calculations = require('./routes/items_rmc_calculations_route'); // ✅ Import items_RMC_calculations route
const project_boq = require('./routes/project_boq_route'); // ✅ Import project_boq route
const door_dimensions = require('./routes/door_dimensions_route'); // ✅ Import door_dimensions route
const architect_walls_measurment = require('./routes/architect_walls_measurement_route'); // ✅ Import architect_walls_measurement route
const doors = require('./routes/doors_route'); // ✅ Import doors route
const room_dimensions = require('./routes/room_dimensions_route'); // ✅ Import room_dimensions route
const vendor_type = require('./routes/vendor_type_route'); // ✅ Import vendor_type route
const vendors = require('./routes/vendors_route'); // ✅ Import vendors route
const vendor_pricing = require('./routes/vendor_pricing_route'); // ✅ Import vendor_pricing route
const window_dimensions = require('./routes/window_dimensions_route'); // ✅ Import window_dimensions route
const windows = require('./routes/windows_route'); // ✅ Import windows route

const statesRoutes = require('./routes/states_route');
const citiesRoutes = require('./routes/cities_route');
const usersRoutes = require('./routes/users_route');
const rolesRoutes = require('./routes/roles_route');
const permissionsRoutes = require('./routes/permissions_route');
const userRolesRoutes = require('./routes/user_roles_route');
const userPermissionsRoutes = require('./routes/user_permissions_route');
const userSessionsRoutes = require('./routes/user_sessions_route');
const client_requirements = require('./routes/client_requirements_route');
const components = require('./routes/components_route'); // ✅ Import components route
const phases = require('./routes/phases_route'); // ✅ Import phases route
const phase_units = require('./routes/phase_units_route'); // ✅ Import phase_units route
const enquiry_sources = require('./routes/enquiry_sources_route'); // ✅ Import enquiry_sources route
const enquiry_status = require('./routes/enquiry_status_route'); // ✅ Import enquiry_status route
const leads = require('./routes/leads_route'); // ✅ Import leads route
const enquiries = require('./routes/enquiries_route'); // ✅ Import enquiries route
const dashboard = require('./routes/dashboard_route'); // ✅ Import dashboard route
const units = require('./routes/units_route'); // ✅ Import units route
const finance_payments = require('./routes/finance_payments_route'); // ✅ Import finance_payments route
const lead_quotations = require('./routes/lead_quotations_route'); // ✅ Import lead_quotations route
const lead_quotation_history = require('./routes/lead_quotation_history_route');
const lead_activities = require('./routes/lead_activities_route'); // ✅ Import lead_activities route

// ✅ New route imports
const enquiryItemChoicesRoute = require('./routes/enquiry_item_choices_route');
const leadItemChoicesRoute = require('./routes/lead_item_choices_route');
const enquiryRequirementsRoute = require('./routes/enquiry_requirements_route');
const meetingsRoute = require('./routes/meetings_route');
const siteVisitsRoute = require('./routes/site_visits_route');
const paymentInstallmentsRoute = require('./routes/payment_installments_route');
const marketingCampaignsRoute = require('./routes/marketing_campaigns_route');
const paymentMethodsRoute = require('./routes/payment_methods_route');
const architectRoute = require('./routes/architect_route');
const leadRequirementsRoute = require('./routes/lead_requirements_route');
const minutesOfMeetingRoute = require('./routes/minutes_of_meeting_route');
const enquiryQuotationsRoute = require('./routes/enquiry_quotations_route');
const paymentTypesRoute = require('./routes/payment_types_route');
const paymentRemindersRoute = require('./routes/payment_reminders_route');
const assignToProjectRoute = require('./routes/assign_to_project_route');
const clientProjectApprovalRoute = require('./routes/client_project_approval_route');
const clientQuotationHistoryRoute = require('./routes/client_quotation_history_route');
const clientQuotationsRoute = require('./routes/client_quotations_route'); // ✅ Import client_quotations route
const architectProjectDrawingRoute = require('./routes/architect_project_drawing_route');
const packagesRoute = require('./routes/packages_route'); // ✅ Import packages route
const packageItemsMappingRoute = require('./routes/package_items_mapping_route'); // ✅ Import package_items_mapping route
const enquirySelectionPackageRoute = require('./routes/enquiry_selection_package_route'); // ✅ Import enquiry_selection_package route
const leadSelectionPackageRoute = require('./routes/lead_selection_package_route'); // ✅ Import lead_selection_package route
const clientReqPackageCustomiseRoute = require('./routes/client_requirement_package_customise_route'); // ✅ Import client_requirement_package_customise route
const enquiryReqPackageCustomiseRoute = require('./routes/enquiry_requirement_package_customise_route'); // ✅ Import enquiry_requirement_package_customise route
const leadReqPackageCustomiseRoute = require('./routes/lead_requirement_package_customise_route'); // ✅ Import lead_requirement_package_customise route
const projectBOQDoorsRoute = require('./routes/project_boq_doors_route'); // ✅ Import project_boq_doors route
const projectBOQWindowsRoute = require('./routes/project_boq_windows_route'); // ✅ Import project_boq_windows route
const projectBOQElectricalRoute = require('./routes/project_boq_electrical_route'); // ✅ Import project_boq_electrical route

// ✅ Import missing routes
const workPackagesRoute = require('./routes/work_packages_route'); // ✅ Import work_packages route
const clientSelectionsRoute = require('./routes/client_selections_route'); // ✅ Import client_selections route
const leadReqPackageItemChoiceCustomiseRoute = require('./routes/lead_requirement_package_item_choice_customise_route'); // ✅ Import lead_requirement_package_item_choice_customise route
const poLineItemsRoute = require('./routes/po_line_items_route'); // ✅ Import po_line_items route
const purchaseOrdersRoute = require('./routes/purchase_orders_route'); // ✅ Import purchase_orders route
const workOrdersRoute = require('./routes/work_orders_route'); // ✅ Import work_orders route
const workSequencingRoute = require('./routes/work_sequencing_route'); // ✅ Import work_sequencing route
const blocksRoute = require('./routes/blocks_route'); // ✅ Import blocks route
const sequencingRoute = require('./routes/sequencing_route'); // ✅ Import sequencing route
const selectionsRoute = require('./routes/selections_route'); // ✅ Import selections route
const groupsRoute = require('./routes/groups_route'); // ✅ Import groups route
const workModulesRoute = require('./routes/work_modules_route'); // ✅ Import work_modules route
const architectDrawingsRoute = require('./routes/architect_drawings_route'); // ✅ Import architect_drawings route
const architectMeasurementsElectricalRoute = require('./routes/architect_measurements_electrical_route'); // ✅ Import architect_measurements_electrical route
const architectMeasurementsFlooringRoute = require('./routes/architect_measurements_flooring_route'); // ✅ Import architect_measurements_flooring route
const architectMeasurementsPaintingRoute = require('./routes/architect_measurements_painting_route'); // ✅ Import architect_measurements_painting route
const architectMeasurementsPlumbingRoute = require('./routes/architect_measurements_plumbing_route'); // ✅ Import architect_measurements_plumbing route
const architectMeasurementsWindowsRoute = require('./routes/architect_measurements_windows_route'); // ✅ Import architect_measurements_windows route

const component_categories = require('./routes/component_categories_route');
const component_elements = require('./routes/component_elements_route');
const component_units = require('./routes/component_units_route');
const unit_details = require('./routes/unit_details_route');
const project_components = require('./routes/project_components_route');
const project_floors = require('./routes/project_floors_route');
const project_phases = require('./routes/project_phases_route');
const project_blocks = require('./routes/project_blocks_route');
const project_groups = require('./routes/project_groups_route');
const project_workflow_status = require('./routes/project_workflow_status_route');
const project_material_costing = require('./routes/project_material_costing_route');
const project_boq_structural = require('./routes/project_boq_structural_route');
const project_boq_walls = require('./routes/project_boq_walls_route');
const project_boq_flooring = require('./routes/project_boq_flooring_route');
const project_boq_painting = require('./routes/project_boq_painting_route');
const project_boq_plumbing = require('./routes/project_boq_plumbing_route');
const selection_items = require('./routes/selection_items_route');
const items_brick_calculations = require('./routes/items_brick_calculations_route');
const items_flooring_calculations = require('./routes/items_flooring_calculations_route');
const items_paint_calculations = require('./routes/items_paint_calculations_route');
const items_plumbing_calculations = require('./routes/items_plumbing_calculations_route'); // ✅ Import items_plumbing_calculations route
const items_doors_calculations = require('./routes/items_doors_calculations_route'); // ✅ Import items_doors_calculations route
const items_electrical_calculations = require('./routes/items_electrical_calculations_route'); // ✅ Import items_electrical_calculations route
const items_structural_calculations = require('./routes/items_structural_calculations_route'); // ✅ Import items_structural_calculations route
const items_windows_calculations = require('./routes/items_windows_calculations_route'); // ✅ Import items_windows_calculations route
const execution_tracking = require('./routes/execution_tracking_route');
const wall_openings_summary = require('./routes/wall_openings_summary_route');
const costing_boq = require('./routes/costing_boq_route');
const phase_summary = require('./routes/phase_summary_route');
const phase_cost_summary = require('./routes/phase_cost_summary_route');
const item_choice_pricing = require('./routes/item_choice_pricing_route');
const lead_requirement_floors = require('./routes/lead_requirement_floors_route');
const enquiry_requirement_package_item_choice_customise = require('./routes/enquiry_requirement_package_item_choice_customise_route');
const client_requirement_package_item_choice_customise = require('./routes/client_requirement_package_item_choice_customise_route');
const modules_route = require('./routes/modules_route'); // ✅ Import modules route
const item_tmt_standards = require('./routes/item_tmt_standards_route');
const boq_generation = require('./routes/boq_generation_route'); // ✅ Import BOQ generation route
const project_costing = require('./routes/project_costing_route'); // ✅ Import Project Costing route
const project_units = require('./routes/project_units_route'); // ✅ Import Project Units route
const leadConversionRoute = require('./routes/lead_conversion_route'); // ✅ Lead → Client conversion with Razorpay
const quotationBuilderRoute = require('./routes/quotation_builder_route'); // Brick&Bolt-style quotation builder

// ✅ CRITICAL FIX: Global middleware for database injection - MUST be before all routes
app.use((req, res, next) => {
  req.db = db;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.clientIp = ip;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from IP: ${ip}`);
  next();
});

// ✅ Register routes
app.use('/api/projects', projects);
app.use('/api/items', items);
app.use('/api/item_choices', itemchoices);
app.use('/api/employees', employees);
app.use('/api/clients', clients);
app.use('/api/architect_measurements_structural', architect_measurements_structural);
app.use('/api/architect_measurements_doors', architectMeasurementsDoorsRoute);
app.use('/api/client_choices', client_choices);
app.use('/api/item_specification_types', item_specification_types);
app.use('/api/elements', elements); 
app.use('/api/element_item_mapping', element_item_mapping); 
app.use('/api/items_tmt_calculations', items_tmt_calculations); 
app.use('/api/items_rmc_calculations', items_rmc_calculations); 
app.use('/api/project_boq', project_boq);
app.use('/api/door_dimensions', door_dimensions);
app.use('/api/architect_walls_measurements', architect_walls_measurment);
app.use('/api/doors', doors);
app.use('/api/room_dimensions', room_dimensions);
app.use('/api/vendor_type', vendor_type);  
app.use('/api/vendors', vendors);
app.use('/api/vendor_pricing', vendor_pricing);  
app.use('/api/window_dimensions', window_dimensions);
app.use('/api/windows', windows);

app.use('/api/states', statesRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user_roles', userRolesRoutes);
app.use('/api/user_permissions', userPermissionsRoutes);
app.use('/api/user_sessions', userSessionsRoutes);
app.use('/api/client_requirements', client_requirements);
app.use('/api/components', components);
app.use('/api/phases', phases);
app.use('/api/phase_units', phase_units);
app.use('/api/enquiry_sources', enquiry_sources);
app.use('/api/enquiry_status', enquiry_status);
app.use('/api/leads', leads);
app.use('/api/enquiries', enquiries); // ✅ CRITICAL: Database injection is now working
app.use('/api/dashboard', dashboard);
app.use('/api/units', units);
app.use('/api/finance_payments', finance_payments);
app.use('/api/lead_quotations', lead_quotations);
app.use('/api/lead_quotation_history', lead_quotation_history);
app.use('/api/lead_activities', lead_activities); // ✅ Register lead_activities route

// ✅ Register new routes
app.use('/api/enquiry_item_choices', enquiryItemChoicesRoute);
app.use('/api/lead_item_choices', leadItemChoicesRoute);
app.use('/api/enquiry_requirements', enquiryRequirementsRoute);
app.use('/api/meetings', meetingsRoute);
app.use('/api/site_visits', siteVisitsRoute);
app.use('/api/payment_installments', paymentInstallmentsRoute);
app.use('/api/marketing_campaigns', marketingCampaignsRoute);
app.use('/api/payment_methods', paymentMethodsRoute);
app.use('/api/architect', architectRoute);
app.use('/api/lead_requirements', leadRequirementsRoute);
app.use('/api/minutes_of_meeting', minutesOfMeetingRoute);
app.use('/api/enquiry_quotations', enquiryQuotationsRoute);
app.use('/api/payment_types', paymentTypesRoute);
app.use('/api/payment_reminders', paymentRemindersRoute);
app.use('/api/assign_to_project', assignToProjectRoute);
app.use('/api/client_project_approval', clientProjectApprovalRoute);
app.use('/api/client_quotation_history', clientQuotationHistoryRoute);
app.use('/api/client_quotations', clientQuotationsRoute);
app.use('/api/quotations', quotationBuilderRoute); // Brick&Bolt-style whole-house quotations
app.use('/api/architect_project_drawing', architectProjectDrawingRoute);
app.use('/api/packages', packagesRoute);
app.use('/api/package_items_mapping', packageItemsMappingRoute);
app.use('/api/enquiry_selection_package', enquirySelectionPackageRoute);
app.use('/api/lead_selection_package', leadSelectionPackageRoute);
app.use('/api/client_requirement_package_customise', clientReqPackageCustomiseRoute);
app.use('/api/enquiry_requirement_package_customise', enquiryReqPackageCustomiseRoute);
app.use('/api/lead_requirement_package_customise', leadReqPackageCustomiseRoute);
app.use('/api/project_boq_doors', projectBOQDoorsRoute);
app.use('/api/project_boq_windows', projectBOQWindowsRoute);
app.use('/api/project_boq_electrical', projectBOQElectricalRoute);

// ✅ Register missing routes
app.use('/api/work_packages', workPackagesRoute);
app.use('/api/client_selections', clientSelectionsRoute);
app.use('/api/lead_requirement_package_item_choice_customise', leadReqPackageItemChoiceCustomiseRoute);
app.use('/api/po_line_items', poLineItemsRoute);
app.use('/api/purchase_orders', purchaseOrdersRoute);
app.use('/api/work_orders', workOrdersRoute);
app.use('/api/work_sequencing', workSequencingRoute);
app.use('/api/blocks', blocksRoute);
app.use('/api/sequencing', sequencingRoute);
app.use('/api/selections', selectionsRoute);
app.use('/api/groups', groupsRoute);
app.use('/api/work_modules', workModulesRoute);
app.use('/api/architect_drawings', architectDrawingsRoute);
app.use('/api/architect_measurements_electrical', architectMeasurementsElectricalRoute);
app.use('/api/architect_measurements_flooring', architectMeasurementsFlooringRoute);
app.use('/api/architect_measurements_painting', architectMeasurementsPaintingRoute);
app.use('/api/architect_measurements_plumbing', architectMeasurementsPlumbingRoute);
app.use('/api/architect_measurements_windows', architectMeasurementsWindowsRoute);
app.use('/api/component_categories', component_categories);
app.use('/api/component_elements', component_elements);
app.use('/api/component_units', component_units);
app.use('/api/unit_details', unit_details);
app.use('/api/project_components', project_components);
app.use('/api/project_floors', project_floors);
app.use('/api/project_phases', project_phases);
app.use('/api/project_blocks', project_blocks);
app.use('/api/project_groups', project_groups);
app.use('/api/project_workflow_status', project_workflow_status);
app.use('/api/project_material_costing', project_material_costing);
app.use('/api/project_boq_structural', project_boq_structural);
app.use('/api/project_boq_walls', project_boq_walls);
app.use('/api/project_boq_flooring', project_boq_flooring);
app.use('/api/project_boq_painting', project_boq_painting);
app.use('/api/project_boq_plumbing', project_boq_plumbing);
app.use('/api/selection_items', selection_items);
app.use('/api/items_brick_calculations', items_brick_calculations);
app.use('/api/items_flooring_calculations', items_flooring_calculations);
app.use('/api/items_paint_calculations', items_paint_calculations);
app.use('/api/items_plumbing_calculations', items_plumbing_calculations);
app.use('/api/items_doors_calculations', items_doors_calculations);
app.use('/api/items_electrical_calculations', items_electrical_calculations);
app.use('/api/items_structural_calculations', items_structural_calculations);
app.use('/api/items_windows_calculations', items_windows_calculations);
app.use('/api/execution_tracking', execution_tracking);
app.use('/api/wall_openings_summary', wall_openings_summary);
app.use('/api/costing_boq', costing_boq);
app.use('/api/phase_summary', phase_summary);
app.use('/api/phase_cost_summary', phase_cost_summary);
app.use('/api/item_choice_pricing', item_choice_pricing);
app.use('/api/lead_requirement_floors', lead_requirement_floors);
app.use('/api/enquiry_requirement_package_item_choice_customise', enquiry_requirement_package_item_choice_customise);
app.use('/api/client_requirement_package_item_choice_customise', client_requirement_package_item_choice_customise);
app.use('/api/modules', modules_route);
app.use('/api/item_tmt_standards', item_tmt_standards);
app.use('/api/boq_generation', boq_generation); // ✅ BOQ Generation route
app.use('/api/project-costing', project_costing); // ✅ Project Costing route
app.use('/api/project_units', project_units); // ✅ Project Units route
app.use('/api/leads', leadConversionRoute); // ✅ Lead conversion + payment gateway routes

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    database: db ? 'connected' : 'disconnected'
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Construction Backend API',
    documentation: '/api-docs',
    health: '/health',
    version: '1.0.0'
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON', 
      message: 'The request body contains invalid JSON syntax'
    });
  }
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS Error', 
      message: 'Origin not allowed by CORS policy'
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({ 
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ 404 handler (must be after all other routes)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ✅ Start server
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`✅ API Documentation at http://localhost:${PORT}/api-docs`);
      console.log(`✅ CORS enabled for development`);
      console.log(`✅ Database connection established`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

// ✅ Gracefully close PostgreSQL pool on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (db) {
    await db.end();
    console.log('✅ PostgreSQL connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (db) {
    await db.end();
    console.log('✅ PostgreSQL connection closed');
  }
  process.exit(0);
});
