// CRM Utility Functions

/**
 * Get color classes for enquiry status
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'New': 'bg-blue-100 text-blue-800',
    'WhatsApp_Sent': 'bg-green-100 text-green-800',
    'Call_Scheduled': 'bg-yellow-100 text-yellow-800',
    'Called': 'bg-orange-100 text-orange-800',
    'Interested': 'bg-purple-100 text-purple-800',
    'Not_Interested': 'bg-red-100 text-red-800',
    'Converted_to_Lead': 'bg-green-100 text-green-800',
    'Lost': 'bg-gray-100 text-gray-800'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get color classes for CRM classification
 */
export const getClassificationColor = (classification) => {
  const classificationColors = {
    'Hot': 'bg-red-100 text-red-800 border-red-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Cold': 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  return classificationColors[classification] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Format date for display
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

/**
 * Format currency values
 */
export const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate enquiry classification based on criteria
 */
export const calculateEnquiryClassification = (enquiryData) => {
  let hotScore = 0;
  
  // Scoring criteria
  if (enquiryData.has_specific_location) hotScore += 1;
  if (enquiryData.has_realistic_budget) hotScore += 1;
  if (enquiryData.has_immediate_timeline) hotScore += 1;
  if (enquiryData.budget_range && !enquiryData.budget_range.includes('Not sure')) hotScore += 1;
  if (enquiryData.expected_timeline && !enquiryData.expected_timeline.includes('Not decided')) hotScore += 1;
  if (enquiryData.company_name && enquiryData.company_name.trim()) hotScore += 1;
  if (enquiryData.email && enquiryData.email.trim()) hotScore += 0.5;
  
  // Classification logic
  if (hotScore >= 4) return 'Hot';
  if (hotScore >= 2) return 'Medium';
  return 'Cold';
};

/**
 * Generate classification reason text
 */
export const getClassificationReason = (enquiryData) => {
  const reasons = [];
  
  if (enquiryData.has_specific_location) reasons.push('Has specific location');
  if (enquiryData.has_realistic_budget) reasons.push('Has realistic budget');
  if (enquiryData.has_immediate_timeline) reasons.push('Has immediate timeline');
  if (enquiryData.company_name && enquiryData.company_name.trim()) reasons.push('Company enquiry');
  if (enquiryData.budget_range && !enquiryData.budget_range.includes('Not sure')) reasons.push('Clear budget range');
  if (enquiryData.expected_timeline && !enquiryData.expected_timeline.includes('Not decided')) reasons.push('Defined timeline');
  
  return reasons.length > 0 ? reasons.join(', ') : 'Basic enquiry information provided';
};

/**
 * Calculate form completion quality score
 */
export const calculateFormCompletionScore = (formData) => {
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(value => {
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  }).length;
  
  return Math.round((filledFields / totalFields) * 100) / 100;
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate unique enquiry number
 */
export const generateEnquiryNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `ENQ-${timestamp}`;
};

/**
 * Get enquiry statistics
 */
export const getEnquiryStats = (enquiries) => {
  const total = enquiries.length;
  const hot = enquiries.filter(e => e.crm_classification === 'Hot').length;
  const medium = enquiries.filter(e => e.crm_classification === 'Medium').length;
  const cold = enquiries.filter(e => e.crm_classification === 'Cold').length;
  const converted = enquiries.filter(e => e.status === 'Converted_to_Lead').length;
  
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  
  return {
    total,
    hot,
    medium,
    cold,
    converted,
    conversionRate,
    hotPercentage: total > 0 ? Math.round((hot / total) * 100) : 0,
    mediumPercentage: total > 0 ? Math.round((medium / total) * 100) : 0,
    coldPercentage: total > 0 ? Math.round((cold / total) * 100) : 0
  };
};