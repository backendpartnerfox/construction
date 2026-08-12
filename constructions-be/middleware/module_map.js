// URL-prefix -> RBAC module name.
//
// The moduleGuard middleware walks these entries in order (longest prefix
// wins) and, if a match is found, calls requireModule(<name>) to enforce
// `<module>.view` or `<module>.edit` based on the HTTP method.
//
// Any /api/* URL not covered here still requires authentication (via the
// global authenticate middleware) but has no module-level gate — safe
// default for admin-only or utility endpoints. Add entries as needed.

const PUBLIC_ALLOWLIST = [
  '/api/user_sessions/login',
  '/api/user_sessions/register',
  '/health',
  '/api-docs',
  '/api-docs.json',
];

// Endpoints that require AUTH but no module gate. Any signed-in user can hit
// them regardless of what permissions they hold — used for self-serve
// endpoints like reading/updating your own profile.
const AUTH_ONLY_ALLOWLIST = [
  '/api/users/me',
  '/api/user_sessions/logout',
];

function isAuthOnly(url) {
  return AUTH_ONLY_ALLOWLIST.some(p => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));
}

// Longest-prefix wins. Sorted longest-first for the walker.
const MODULE_MAP = [
  // Opportunities (list + mark/unmark endpoints live under /api/enquiries/*).
  // These come BEFORE the /api/enquiries entry so they win the prefix match.
  ['/api/enquiries/opportunities', 'opportunities'],

  // Meetings + support + site_visits (new modules)
  ['/api/meetings',        'meetings'],
  ['/api/support_tickets', 'support'],
  ['/api/site_visits',     'site_visits'],

  // CRM — leads + enquiries
  ['/api/lead_requirement_package_item_choice_customise', 'crm'],
  ['/api/lead_quotation_history', 'crm'],
  ['/api/lead_selection_package', 'crm'],
  ['/api/lead_item_choices', 'crm'],
  ['/api/lead_activities', 'crm'],
  ['/api/lead_quotations', 'crm'],
  ['/api/lead_requirements', 'crm'],
  ['/api/leads', 'crm'],
  ['/api/enquiry_requirement_package_item_choice_customise', 'crm'],
  ['/api/enquiry_selection_package', 'crm'],
  ['/api/enquiry_item_choices', 'crm'],
  ['/api/enquiry_quotations', 'crm'],
  ['/api/enquiry_requirements', 'crm'],
  ['/api/enquiry_sources', 'crm'],
  ['/api/enquiry_status', 'crm'],
  ['/api/enquiries', 'crm'],

  // Clients
  ['/api/client_requirement_package_item_choice_customise', 'clients'],
  ['/api/client_project_approval', 'clients'],
  ['/api/client_quotation_history', 'clients'],
  ['/api/client_quotations', 'clients'],
  ['/api/client_requirements', 'clients'],
  ['/api/client_selections', 'clients'],
  ['/api/client_choices', 'clients'],
  ['/api/clients', 'clients'],

  // Quotations
  ['/api/quotations', 'quotations'],

  // Projects + site structure
  ['/api/project_workflow_status', 'projects'],
  ['/api/project_material_costing', 'projects'],
  ['/api/project_components', 'projects'],
  ['/api/project_units', 'projects'],
  ['/api/project_boq', 'boq'],
  ['/api/projects', 'projects'],
  ['/api/blocks', 'projects'],
  ['/api/modules', 'projects'],
  ['/api/phases', 'projects'],
  ['/api/units', 'projects'],
  ['/api/sequencing', 'projects'],
  ['/api/work_packages', 'projects'],
  ['/api/work_sequencing', 'projects'],
  ['/api/work_orders', 'projects'],
  ['/api/work_modules', 'projects'],
  ['/api/selection_items', 'projects'],
  ['/api/selections', 'projects'],
  ['/api/assign_to_project', 'projects'],

  // BOQ
  ['/api/costing_boq', 'boq'],

  // Drawings (architect assets)
  ['/api/architect_project_drawing', 'drawings'],
  ['/api/architect_walls_measurement', 'drawings'],
  ['/api/architect_measurements_structural', 'drawings'],
  ['/api/architect_measurements_electrical', 'drawings'],
  ['/api/architect_measurements_flooring', 'drawings'],
  ['/api/architect_measurements_painting', 'drawings'],
  ['/api/architect_measurements_plumbing', 'drawings'],
  ['/api/architect_measurements_windows', 'drawings'],
  ['/api/architect_measurements_doors', 'drawings'],
  ['/api/architect_drawings', 'drawings'],
  ['/api/architect', 'drawings'],

  // Execution
  ['/api/execution_tracking', 'execution'],

  // Payments (transactional — actual money flows)
  ['/api/payment_installments', 'payments'],
  ['/api/payment_reminders', 'payments'],
  ['/api/payment_orders', 'payments'],
  ['/api/finance_payments', 'payments'],
  // NOTE: payment_methods and payment_types are catalog/dropdown data
  // (Cash, Cheque, UPI, ...). Deliberately NOT mapped so any signed-in
  // user can read them — needed by forms across every module.

  // Purchase orders
  ['/api/po_line_items', 'purchase_orders'],
  ['/api/purchase_order_items', 'purchase_orders'],
  ['/api/purchase_orders', 'purchase_orders'],

  // Vendors
  ['/api/vendor_pricing', 'vendors'],
  ['/api/vendor_type', 'vendors'],
  ['/api/vendors', 'vendors'],

  // Master data
  ['/api/package_rule_tiers', 'rulebook'],
  ['/api/package_rules', 'rulebook'],
  ['/api/package_addons', 'rulebook'],
  ['/api/package_items_mapping', 'packages'],
  ['/api/package_specifications', 'packages'],
  ['/api/packages', 'packages'],
  ['/api/item_choice_pricing', 'items'],
  ['/api/item_choices', 'items'],
  ['/api/item_specification_types', 'items'],
  ['/api/item_qty_per_sqft', 'items'],
  ['/api/item_tmt_standards', 'items'],
  ['/api/items', 'items'],

  // Users & Roles
  ['/api/user_roles', 'users'],
  ['/api/user_permissions', 'users'],
  ['/api/user_sessions', 'users'],
  ['/api/users', 'users'],
  ['/api/permissions', 'roles'],
  ['/api/roles', 'roles'],
];

function isPublic(url) {
  return PUBLIC_ALLOWLIST.some(p => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));
}

function moduleForUrl(url) {
  for (const [prefix, mod] of MODULE_MAP) {
    if (url === prefix || url.startsWith(prefix + '/') || url.startsWith(prefix + '?')) {
      return mod;
    }
  }
  return null;
}

module.exports = { PUBLIC_ALLOWLIST, AUTH_ONLY_ALLOWLIST, MODULE_MAP, isPublic, isAuthOnly, moduleForUrl };
