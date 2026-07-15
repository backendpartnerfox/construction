// Script to generate all master data CRUD components
// Run this after creating the template files

const masterDataConfigs = [
  {
    name: 'Packages',
    title: 'Packages',
    icon: 'Package',
    apiEndpoint: 'packages',
    idField: 'package_id',
    fields: [
      { name: 'package_name', label: 'Package Name', type: 'text', required: true },
      { name: 'package_code', label: 'Package Code', type: 'text' },
      { name: 'package_type', label: 'Package Type', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Luxury', 'Custom'] },
      { name: 'base_price_per_sqft', label: 'Base Price per sqft', type: 'number', required: true, step: '0.01' },
      { name: 'gst_percentage', label: 'GST %', type: 'number', default: 18.00, step: '0.01' },
      { name: 'short_description', label: 'Short Description', type: 'text' },
      { name: 'detailed_description', label: 'Detailed Description', type: 'textarea' },
      { name: 'quality_level', label: 'Quality Level', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Luxury'] },
      { name: 'construction_type', label: 'Construction Type', type: 'select', options: ['Residential', 'Commercial', 'Industrial', 'Mixed Use'] },
      { name: 'estimated_duration_months', label: 'Duration (months)', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
      { name: 'is_published', label: 'Published', type: 'checkbox', default: false },
      { name: 'popular_choice', label: 'Popular Choice', type: 'checkbox', default: false }
    ],
    searchFields: ['package_name', 'package_code'],
    tableColumns: [
      { key: 'package_id', label: 'ID' },
      { key: 'package_name', label: 'Package Name' },
      { key: 'package_type', label: 'Type' },
      { key: 'total_price_per_sqft', label: 'Price/sqft', format: 'currency' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'is_published', label: 'Published', type: 'boolean' }
    ]
  },
  {
    name: 'PaymentMethods',
    title: 'Payment Methods',
    icon: 'CreditCard',
    apiEndpoint: 'payment_methods',
    idField: 'payment_method_id',
    fields: [
      { name: 'method_name', label: 'Method Name', type: 'text', required: true },
      { name: 'is_active', label: 'Active', type: 'checkbox', default: true }
    ],
    searchFields: ['method_name'],
    tableColumns: [
      { key: 'payment_method_id', label: 'ID' },
      { key: 'method_name', label: 'Method Name' },
      { key: 'is_active', label: 'Status', type: 'boolean' }
    ]
  },
  {
    name: 'PaymentTypes',
    title: 'Payment Types',
    icon: 'Wallet',
    apiEndpoint: 'payment_types',
    idField: 'payment_type_id',
    fields: [
      { name: 'payment_type_name', label: 'Type Name', type: 'text', required: true },
      { name: 'payment_category', label: 'Category', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'checkbox', default: true }
    ],
    searchFields: ['payment_type_name', 'payment_category'],
    tableColumns: [
      { key: 'payment_type_id', label: 'ID' },
      { key: 'payment_type_name', label: 'Type Name' },
      { key: 'payment_category', label: 'Category' },
      { key: 'is_active', label: 'Status', type: 'boolean' }
    ]
  },
  {
    name: 'VendorTypes',
    title: 'Vendor Types',
    icon: 'Building',
    apiEndpoint: 'vendor_type',
    idField: 'vendor_type_id',
    fields: [
      { name: 'vendor_type', label: 'Vendor Type', type: 'text', required: true }
    ],
    searchFields: ['vendor_type'],
    tableColumns: [
      { key: 'vendor_type_id', label: 'ID' },
      { key: 'vendor_type', label: 'Vendor Type' }
    ]
  },
  {
    name: 'Vendors',
    title: 'Vendors',
    icon: 'Store',
    apiEndpoint: 'vendors',
    idField: 'vendor_id',
    fields: [
      { name: 'vendor_name', label: 'Vendor Name', type: 'text', required: true },
      { name: 'vendor_type_id', label: 'Vendor Type', type: 'select', reference: 'vendor_type' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'contact_number', label: 'Contact Number', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Address', type: 'textarea' }
    ],
    searchFields: ['vendor_name', 'contact_person', 'email'],
    tableColumns: [
      { key: 'vendor_id', label: 'ID' },
      { key: 'vendor_name', label: 'Vendor Name' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'contact_number', label: 'Contact' },
      { key: 'email', label: 'Email' }
    ]
  },
  {
    name: 'WindowDimensions',
    title: 'Window Dimensions',
    icon: 'Maximize2',
    apiEndpoint: 'window_dimensions',
    idField: 'dimension_id',
    fields: [
      { name: 'width', label: 'Width (ft)', type: 'number', required: true, step: '0.01' },
      { name: 'height', label: 'Height (ft)', type: 'number', required: true, step: '0.01' },
      { name: 'thickness', label: 'Thickness (inches)', type: 'number', required: true, step: '0.01' },
      { name: 'window_type', label: 'Window Type', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'is_standard', label: 'Standard', type: 'checkbox', default: true },
      { name: 'is_active', label: 'Active', type: 'checkbox', default: true }
    ],
    searchFields: ['description', 'window_type'],
    tableColumns: [
      { key: 'dimension_id', label: 'ID' },
      { key: 'width', label: 'Width (ft)' },
      { key: 'height', label: 'Height (ft)' },
      { key: 'thickness', label: 'Thickness (in)' },
      { key: 'window_type', label: 'Type' },
      { key: 'is_standard', label: 'Standard', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' }
    ]
  }
];

console.log('Master Data Configuration Ready');
console.log('Total Components:', masterDataConfigs.length);

module.exports = masterDataConfigs;
