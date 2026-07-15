// Main CRM Components
export { default as CRM } from './CRM';

// Form Components
export { default as NewEnquiryForm } from './forms/NewEnquiryForm';
export { default as EditEnquiryForm } from './forms/EditEnquiryForm';
export { default as ViewEnquiryModal } from './forms/ViewEnquiryModal';

// List Components
export { default as EnquiryList } from './components/EnquiryList';

// Leads Module
export { Leads, LeadDetail } from './leads';

// Re-export for convenience
export { default } from './CRM';
