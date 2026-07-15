// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  BASE_URL: 'http://localhost:9001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// ============================================
// CLIENT TYPES
// ============================================

export const CLIENT_TYPES = [
  { value: 'Individual', label: 'Individual', color: 'green' },
  { value: 'Company', label: 'Company', color: 'blue' },
  { value: 'Government', label: 'Government', color: 'purple' },
  { value: 'Institution', label: 'Institution', color: 'yellow' },
];

// ============================================
// CLIENT CATEGORIES
// ============================================

export const CLIENT_CATEGORIES = [
  { value: 'VIP', label: 'VIP' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Premium', label: 'Premium' },
  { value: 'Standard', label: 'Standard' },
];

// ============================================
// PROJECT TYPES
// ============================================

export const PROJECT_TYPES = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Mixed Use', label: 'Mixed Use' },
  { value: 'Infrastructure', label: 'Infrastructure' },
];

// ============================================
// CONSTRUCTION TYPES
// ============================================

export const CONSTRUCTION_TYPES = [
  { value: 'New Construction', label: 'New Construction' },
  { value: 'Renovation', label: 'Renovation' },
  { value: 'Extension', label: 'Extension' },
  { value: 'Remodeling', label: 'Remodeling' },
];

// ============================================
// QUALITY LEVELS
// ============================================

export const QUALITY_LEVELS = [
  { value: 'Basic', label: 'Basic', rate: 1200 },
  { value: 'Standard', label: 'Standard', rate: 1800 },
  { value: 'Premium', label: 'Premium', rate: 2500 },
  { value: 'Luxury', label: 'Luxury', rate: 3500 },
];

// ============================================
// PACKAGE TYPES
// ============================================

export const PACKAGE_TYPES = [
  { 
    value: 'Basic Package', 
    label: 'Basic Package',
    rate: 1200,
    description: 'Essential construction with standard materials'
  },
  { 
    value: 'Standard Package', 
    label: 'Standard Package',
    rate: 1800,
    description: 'Quality construction with good materials'
  },
  { 
    value: 'Premium Package', 
    label: 'Premium Package',
    rate: 2500,
    description: 'High-quality construction with premium materials'
  },
  { 
    value: 'Custom Package', 
    label: 'Custom Package',
    rate: 0,
    description: 'Fully customized package per client requirements'
  },
];

// ============================================
// REQUIREMENT STATUS
// ============================================

export const REQUIREMENT_STATUS = [
  { value: 'Draft', label: 'Draft', color: 'gray' },
  { value: 'Under_Review', label: 'Under Review', color: 'yellow' },
  { value: 'Approved', label: 'Approved', color: 'green' },
  { value: 'Locked', label: 'Locked', color: 'blue' },
  { value: 'Change_Request', label: 'Change Request', color: 'red' },
];

// ============================================
// QUOTATION STATUS
// ============================================

export const QUOTATION_STATUS = [
  { value: 'Draft', label: 'Draft', color: 'gray' },
  { value: 'Under_Review', label: 'Under Review', color: 'yellow' },
  { value: 'Client_Review', label: 'Client Review', color: 'orange' },
  { value: 'Approved', label: 'Approved', color: 'green' },
  { value: 'Contract_Signed', label: 'Contract Signed', color: 'blue' },
  { value: 'Active', label: 'Active', color: 'green' },
  { value: 'Completed', label: 'Completed', color: 'purple' },
  { value: 'Cancelled', label: 'Cancelled', color: 'red' },
];

// ============================================
// QUOTATION TYPES
// ============================================

export const QUOTATION_TYPES = [
  { value: 'Contract', label: 'Contract' },
  { value: 'Variation', label: 'Variation' },
  { value: 'Additional_Work', label: 'Additional Work' },
];

// ============================================
// SELECTION STATUS
// ============================================

export const SELECTION_STATUS = [
  { value: 'Pending', label: 'Pending', color: 'gray' },
  { value: 'Sample_Requested', label: 'Sample Requested', color: 'yellow' },
  { value: 'Sample_Approved', label: 'Sample Approved', color: 'blue' },
  { value: 'Client_Approved', label: 'Client Approved', color: 'green' },
  { value: 'Architect_Approved', label: 'Architect Approved', color: 'green' },
  { value: 'Final', label: 'Final', color: 'purple' },
  { value: 'Rejected', label: 'Rejected', color: 'red' },
];

// ============================================
// GST RATES
// ============================================

export const GST_RATES = [
  { value: 0, label: '0% (Exempted)' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18% (Standard)' },
  { value: 28, label: '28%' },
];

// ============================================
// PAYMENT TERMS
// ============================================

export const PAYMENT_TERMS = [
  { value: 'Net 15', label: 'Net 15 Days' },
  { value: 'Net 30', label: 'Net 30 Days' },
  { value: 'Net 45', label: 'Net 45 Days' },
  { value: 'Net 60', label: 'Net 60 Days' },
  { value: 'Net 90', label: 'Net 90 Days' },
  { value: 'Immediate', label: 'Immediate Payment' },
  { value: 'Custom', label: 'Custom Terms' },
];

// ============================================
// ADVANCE PAYMENT PERCENTAGES
// ============================================

export const ADVANCE_PERCENTAGES = [
  { value: 10, label: '10%' },
  { value: 15, label: '15%' },
  { value: 20, label: '20% (Standard)' },
  { value: 25, label: '25%' },
  { value: 30, label: '30%' },
  { value: 40, label: '40%' },
  { value: 50, label: '50%' },
];

// ============================================
// INDIAN STATES
// ============================================

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// ============================================
// MAJOR CITIES
// ============================================

export const MAJOR_CITIES = [
  'Hyderabad',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
];

// ============================================
// DATE FORMATS
// ============================================

export const DATE_FORMATS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
  ISO: 'ISO',
};

// ============================================
// AREA UNITS
// ============================================

export const AREA_UNITS = [
  { value: 'sqft', label: 'Square Feet', multiplier: 1 },
  { value: 'sqm', label: 'Square Meters', multiplier: 0.092903 },
  { value: 'sqyd', label: 'Square Yards', multiplier: 0.111111 },
  { value: 'acres', label: 'Acres', multiplier: 0.000022957 },
  { value: 'cents', label: 'Cents', multiplier: 0.00229568 },
];

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// ============================================
// TABLE COLUMNS - CLIENTS
// ============================================

export const CLIENT_TABLE_COLUMNS = [
  { key: 'client_id', label: 'ID', sortable: true, width: '80px' },
  { key: 'client_name', label: 'Name', sortable: true },
  { key: 'client_type', label: 'Type', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'city', label: 'City', sortable: true },
  { key: 'is_active', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

// ============================================
// TABLE COLUMNS - REQUIREMENTS
// ============================================

export const REQUIREMENT_TABLE_COLUMNS = [
  { key: 'client_requirement_id', label: 'ID', sortable: true, width: '80px' },
  { key: 'requirement_title', label: 'Title', sortable: true },
  { key: 'project_type', label: 'Type', sortable: true },
  { key: 'built_up_area', label: 'Area', sortable: true },
  { key: 'approved_budget', label: 'Budget', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

// ============================================
// TABLE COLUMNS - QUOTATIONS
// ============================================

export const QUOTATION_TABLE_COLUMNS = [
  { key: 'client_quotation_id', label: 'ID', sortable: true, width: '80px' },
  { key: 'client_quotation_number', label: 'Quotation #', sortable: true },
  { key: 'project_title', label: 'Project', sortable: true },
  { key: 'contract_value', label: 'Value', sortable: true },
  { key: 'version_number', label: 'Version', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

// ============================================
// VALIDATION MESSAGES
// ============================================

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid 10-digit phone number',
  INVALID_GST: 'Please enter a valid GST number',
  INVALID_PAN: 'Please enter a valid PAN number',
  INVALID_POSTAL_CODE: 'Please enter a valid 6-digit postal code',
  MIN_LENGTH: (min) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
  MIN_VALUE: (min) => `Minimum value is ${min}`,
  MAX_VALUE: (max) => `Maximum value is ${max}`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
};

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  CLIENT_CREATED: 'Client created successfully!',
  CLIENT_UPDATED: 'Client updated successfully!',
  CLIENT_DELETED: 'Client deleted successfully!',
  REQUIREMENT_CREATED: 'Requirement created successfully!',
  REQUIREMENT_UPDATED: 'Requirement updated successfully!',
  REQUIREMENT_DELETED: 'Requirement deleted successfully!',
  QUOTATION_CREATED: 'Quotation created successfully!',
  QUOTATION_UPDATED: 'Quotation updated successfully!',
  QUOTATION_DELETED: 'Quotation deleted successfully!',
  SELECTION_SAVED: 'Selection saved successfully!',
  APPROVAL_GRANTED: 'Approval granted successfully!',
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_FAILED: 'Please fix the validation errors.',
};

// ============================================
// REGEX PATTERNS
// ============================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6-9]\d{9}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  POSTAL_CODE: /^[1-9][0-9]{5}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
};

// ============================================
// LOCAL STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  PREFERENCES: 'userPreferences',
  LAST_CLIENT_FILTER: 'lastClientFilter',
  LAST_REQUIREMENT_FILTER: 'lastRequirementFilter',
};

// ============================================
// TOAST NOTIFICATION TYPES
// ============================================

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// ============================================
// ROUTE PATHS
// ============================================

export const ROUTES = {
  HOME: '/',
  CLIENTS: '/clients',
  CLIENT_DETAILS: '/clients/:id',
  CLIENT_REQUIREMENTS: '/clients/:id/requirements',
  CLIENT_QUOTATIONS: '/clients/:id/quotations',
  REQUIREMENTS: '/requirements',
  QUOTATIONS: '/quotations',
  SELECTIONS: '/selections',
  PROJECTS: '/projects',
  DASHBOARD: '/dashboard',
};

// ============================================
// EXPORT ALL CONSTANTS
// ============================================

export default {
  API_CONFIG,
  CLIENT_TYPES,
  CLIENT_CATEGORIES,
  PROJECT_TYPES,
  CONSTRUCTION_TYPES,
  QUALITY_LEVELS,
  PACKAGE_TYPES,
  REQUIREMENT_STATUS,
  QUOTATION_STATUS,
  QUOTATION_TYPES,
  SELECTION_STATUS,
  GST_RATES,
  PAYMENT_TERMS,
  ADVANCE_PERCENTAGES,
  INDIAN_STATES,
  MAJOR_CITIES,
  DATE_FORMATS,
  AREA_UNITS,
  PAGINATION,
  CLIENT_TABLE_COLUMNS,
  REQUIREMENT_TABLE_COLUMNS,
  QUOTATION_TABLE_COLUMNS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  REGEX_PATTERNS,
  STORAGE_KEYS,
  TOAST_TYPES,
  ROUTES,
};
