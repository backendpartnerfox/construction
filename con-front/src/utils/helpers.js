// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency to Indian Rupees
 * @param {number} amount - Amount to format
 * @param {boolean} compact - Use compact notation (e.g., 25L instead of 25,00,000)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 'N/A';

  if (compact) {
    if (numAmount >= 10000000) { // Crores
      return `₹${(numAmount / 10000000).toFixed(2)} Cr`;
    } else if (numAmount >= 100000) { // Lakhs
      return `₹${(numAmount / 100000).toFixed(2)} L`;
    } else if (numAmount >= 1000) { // Thousands
      return `₹${(numAmount / 1000).toFixed(2)} K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numAmount);
};

/**
 * Format number with Indian number system
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return 'N/A';
  
  const numValue = parseFloat(num);
  if (isNaN(numValue)) return 'N/A';

  return new Intl.NumberFormat('en-IN').format(numValue);
};

/**
 * Format date to Indian format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' }
  };

  return new Intl.DateTimeFormat('en-IN', options[format] || options.medium).format(dateObj);
};

/**
 * Format date and time
 * @param {string|Date} dateTime - DateTime to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

/**
 * Format area (square feet)
 * @param {number} area - Area in square feet
 * @returns {string} Formatted area string
 */
export const formatArea = (area) => {
  if (area === null || area === undefined || area === '') return 'N/A';
  
  const numArea = parseFloat(area);
  if (isNaN(numArea)) return 'N/A';

  return `${formatNumber(numArea)} sq.ft`;
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'N/A';

  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned[0]} ${cleaned.slice(1, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate GST number
 * @param {string} gst - GST number to validate
 * @returns {boolean} True if valid
 */
export const isValidGST = (gst) => {
  if (!gst) return false;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

/**
 * Validate PAN number
 * @param {string} pan - PAN number to validate
 * @returns {boolean} True if valid
 */
export const isValidPAN = (pan) => {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Validate postal code
 * @param {string} code - Postal code to validate
 * @returns {boolean} True if valid
 */
export const isValidPostalCode = (code) => {
  if (!code) return false;
  const codeRegex = /^[1-9][0-9]{5}$/;
  return codeRegex.test(code);
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return true;
};

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @returns {boolean} True if meets minimum
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} max - Maximum length
 * @returns {boolean} True if under maximum
 */
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if in range
 */
export const inRange = (value, min, max) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

// ============================================
// DATA TRANSFORMATION UTILITIES
// ============================================

/**
 * Convert status to display format
 * @param {string} status - Status value
 * @returns {string} Display format
 */
export const statusToDisplay = (status) => {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get status badge color class
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes
 */
export const getStatusColor = (status) => {
  const colors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Under_Review': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Locked': 'bg-blue-100 text-blue-800',
    'Change_Request': 'bg-red-100 text-red-800',
    'Pending': 'bg-orange-100 text-orange-800',
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800',
    'Completed': 'bg-purple-100 text-purple-800',
    'Cancelled': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get client type badge color
 * @param {string} type - Client type
 * @returns {string} Tailwind CSS classes
 */
export const getClientTypeColor = (type) => {
  const colors = {
    'Individual': 'bg-green-100 text-green-800',
    'Company': 'bg-blue-100 text-blue-800',
    'Government': 'bg-purple-100 text-purple-800',
    'Institution': 'bg-yellow-100 text-yellow-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

/**
 * Calculate age from date
 * @param {string|Date} date - Date to calculate from
 * @returns {number} Age in years
 */
export const calculateAge = (date) => {
  if (!date) return 0;
  const birthDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate days between dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Days between dates
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate project duration in months
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Duration in months
 */
export const monthsBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  
  return months <= 0 ? 0 : months;
};

// ============================================
// SORTING UTILITIES
// ============================================

/**
 * Sort array by field
 * @param {Array} array - Array to sort
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export const sortBy = (array, field, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
};

// ============================================
// FILTERING UTILITIES
// ============================================

/**
 * Filter array by search query
 * @param {Array} array - Array to filter
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
export const searchFilter = (array, query, fields) => {
  if (!query) return array;
  
  const lowerQuery = query.toLowerCase();
  
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
};

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Slugify string
 * @param {string} str - String to slugify
 * @returns {string} Slugified string
 */
export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  // Formatting
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatArea,
  formatPercentage,
  formatPhone,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidGST,
  isValidPAN,
  isValidPostalCode,
  isRequired,
  minLength,
  maxLength,
  inRange,
  
  // Transformation
  statusToDisplay,
  getStatusColor,
  getClientTypeColor,
  calculateAge,
  daysBetween,
  monthsBetween,
  
  // Sorting
  sortBy,
  
  // Filtering
  searchFilter,
  
  // String utilities
  truncate,
  capitalize,
  toTitleCase,
  slugify,
};
