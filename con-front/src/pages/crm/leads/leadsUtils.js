/**
 * Leads Module Utility Functions
 * Helper functions for formatting, calculations, and validations
 */

/**
 * Format currency with Indian numbering system
 * @param {number} amount - Amount to format
 * @param {boolean} short - Use short format (Cr, L)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, short = true) => {
  if (!amount || isNaN(amount)) return '₹0';
  
  if (short) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
  }
  
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Get color class for lead stage
 * @param {string} stage - Lead stage
 * @returns {string} Tailwind color classes
 */
export const getStageColor = (stage) => {
  const stageColors = {
    'Qualified': 'bg-blue-100 text-blue-800 border-blue-200',
    'Requirement_Gathering': 'bg-purple-100 text-purple-800 border-purple-200',
    'Site_Visit_Planned': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Site_Visited': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Quotation_Requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Quotation_Sent': 'bg-orange-100 text-orange-800 border-orange-200',
    'Negotiation': 'bg-amber-100 text-amber-800 border-amber-200',
    'Won': 'bg-green-100 text-green-800 border-green-200',
    'Lost': 'bg-red-100 text-red-800 border-red-200'
  };
  return stageColors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get color class for status
 * @param {string} status - Status value
 * @returns {string} Tailwind color classes
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
    'Under_Review': 'bg-blue-100 text-blue-800 border-blue-200',
    'Under_Discussion': 'bg-blue-100 text-blue-800 border-blue-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Finalized': 'bg-green-100 text-green-800 border-green-200',
    'Sent': 'bg-purple-100 text-purple-800 border-purple-200',
    'Viewed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Accepted': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
    'Quoted': 'bg-purple-100 text-purple-800 border-purple-200',
    'Expired': 'bg-gray-100 text-gray-800 border-gray-200',
    'Planned': 'bg-blue-100 text-blue-800 border-blue-200',
    'In_Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
    'Overdue': 'bg-red-100 text-red-800 border-red-200'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get color class for priority
 * @param {string} priority - Priority level
 * @returns {string} Tailwind text color class
 */
export const getPriorityColor = (priority) => {
  const priorityColors = {
    'Low': 'text-gray-600',
    'Medium': 'text-blue-600',
    'High': 'text-orange-600',
    'Urgent': 'text-red-600'
  };
  return priorityColors[priority] || 'text-gray-600';
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Include time in output
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (includeTime) {
    return dateObj.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (default: today)
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate = new Date()) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a date is overdue
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if overdue
 */
export const isOverdue = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Calculate area-based quotation amount
 * @param {object} areas - Object with area values
 * @param {number} ratePerSqft - Rate per square foot
 * @returns {number} Calculated amount
 */
export const calculateQuotationAmount = (areas, ratePerSqft) => {
  const { habitable = 0, balcony = 0, stilt = 0, terrace = 0 } = areas;
  
  const amount = 
    (habitable * ratePerSqft) +
    (balcony * ratePerSqft * 0.65) +
    (stilt * ratePerSqft * 0.65) +
    (terrace * ratePerSqft * 0.65);
  
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate GST amount
 * @param {number} amount - Base amount
 * @param {number} gstPercentage - GST percentage
 * @returns {number} GST amount
 */
export const calculateGST = (amount, gstPercentage = 18) => {
  return Math.round((amount * gstPercentage / 100) * 100) / 100;
};

/**
 * Calculate total amount with GST
 * @param {number} baseAmount - Base amount
 * @param {number} gstPercentage - GST percentage
 * @returns {number} Total amount
 */
export const calculateTotalWithGST = (baseAmount, gstPercentage = 18) => {
  const gstAmount = calculateGST(baseAmount, gstPercentage);
  return Math.round((baseAmount + gstAmount) * 100) / 100;
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Get lead stage progress percentage
 * @param {string} stage - Current stage
 * @returns {number} Progress percentage (0-100)
 */
export const getStageProgress = (stage) => {
  const stages = {
    'Qualified': 10,
    'Requirement_Gathering': 25,
    'Site_Visit_Planned': 35,
    'Site_Visited': 45,
    'Quotation_Requested': 55,
    'Quotation_Sent': 70,
    'Negotiation': 85,
    'Won': 100,
    'Lost': 0
  };
  return stages[stage] || 0;
};

/**
 * Get next recommended stage
 * @param {string} currentStage - Current stage
 * @returns {string} Next recommended stage
 */
export const getNextStage = (currentStage) => {
  const stageFlow = {
    'Qualified': 'Requirement_Gathering',
    'Requirement_Gathering': 'Site_Visit_Planned',
    'Site_Visit_Planned': 'Site_Visited',
    'Site_Visited': 'Quotation_Requested',
    'Quotation_Requested': 'Quotation_Sent',
    'Quotation_Sent': 'Negotiation',
    'Negotiation': 'Won'
  };
  return stageFlow[currentStage] || currentStage;
};

/**
 * Calculate lead score based on various factors
 * @param {object} lead - Lead object
 * @returns {number} Lead score (0-100)
 */
export const calculateLeadScore = (lead) => {
  let score = 0;
  
  // Budget (max 30 points)
  if (lead.budget_max) {
    if (lead.budget_max >= 50000000) score += 30;
    else if (lead.budget_max >= 10000000) score += 20;
    else if (lead.budget_max >= 5000000) score += 10;
  }
  
  // Stage progress (max 25 points)
  score += getStageProgress(lead.stage) * 0.25;
  
  // Probability (max 20 points)
  if (lead.probability_percentage) {
    score += lead.probability_percentage * 0.2;
  }
  
  // Activity (max 15 points)
  const daysSinceCreation = daysBetween(lead.created_at);
  if (daysSinceCreation < 7) score += 15;
  else if (daysSinceCreation < 30) score += 10;
  else if (daysSinceCreation < 90) score += 5;
  
  // Quotations (max 10 points)
  if (lead.quotations_generated) {
    score += Math.min(lead.quotations_generated * 5, 10);
  }
  
  return Math.min(Math.round(score), 100);
};

/**
 * Get lead health status
 * @param {object} lead - Lead object
 * @returns {object} Health status with color and label
 */
export const getLeadHealth = (lead) => {
  const score = calculateLeadScore(lead);
  
  if (score >= 70) {
    return { label: 'Hot', color: 'text-red-600', bgColor: 'bg-red-100' };
  } else if (score >= 40) {
    return { label: 'Warm', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  } else {
    return { label: 'Cold', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  }
};

/**
 * Sort leads by various criteria
 * @param {Array} leads - Array of leads
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted leads
 */
export const sortLeads = (leads, sortBy, order = 'desc') => {
  return [...leads].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle dates
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle numbers
    if (sortBy === 'budget_max' || sortBy === 'probability_percentage') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

/**
 * Filter leads by multiple criteria
 * @param {Array} leads - Array of leads
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered leads
 */
export const filterLeads = (leads, filters) => {
  return leads.filter(lead => {
    // Search term
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        (lead.lead_number && lead.lead_number.toLowerCase().includes(search)) ||
        (lead.primary_contact_name && lead.primary_contact_name.toLowerCase().includes(search)) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(search)) ||
        (lead.primary_phone && lead.primary_phone.includes(search)) ||
        (lead.email && lead.email.toLowerCase().includes(search));
      
      if (!matchesSearch) return false;
    }
    
    // Stage filter
    if (filters.stage && filters.stage !== 'all') {
      if (lead.stage !== filters.stage) return false;
    }
    
    // Budget filter
    if (filters.budgetMin && lead.budget_max < filters.budgetMin) return false;
    if (filters.budgetMax && lead.budget_max > filters.budgetMax) return false;
    
    // Project type filter
    if (filters.projectType && filters.projectType !== 'all') {
      if (lead.project_type !== filters.projectType) return false;
    }
    
    // Assigned to filter
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      if (lead.assigned_sales_person !== parseInt(filters.assignedTo)) return false;
    }
    
    return true;
  });
};

/**
 * Export leads to CSV
 * @param {Array} leads - Array of leads to export
 * @param {string} filename - Filename for download
 */
export const exportLeadsToCSV = (leads, filename = 'leads.csv') => {
  const headers = [
    'Lead Number',
    'Name',
    'Company',
    'Phone',
    'Email',
    'Stage',
    'Budget Max',
    'Probability',
    'Project Type',
    'City',
    'Created Date'
  ];
  
  const rows = leads.map(lead => [
    lead.lead_number || '',
    lead.primary_contact_name || '',
    lead.company_name || '',
    lead.primary_phone || '',
    lead.email || '',
    lead.stage || '',
    lead.budget_max || '',
    lead.probability_percentage || '',
    lead.project_type || '',
    lead.city || '',
    formatDate(lead.created_at)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get activity icon name by type
 * @param {string} activityType - Activity type
 * @returns {string} Icon name
 */
export const getActivityIcon = (activityType) => {
  const icons = {
    'Call': 'Phone',
    'Email': 'Mail',
    'Meeting': 'Calendar',
    'Site_Visit': 'MapPin',
    'Follow_Up': 'MessageSquare',
    'Video_Call': 'Video',
    'Note': 'FileText'
  };
  return icons[activityType] || 'FileText';
};

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
};

export default {
  formatCurrency,
  getStageColor,
  getStatusColor,
  getPriorityColor,
  formatDate,
  daysBetween,
  isOverdue,
  calculateQuotationAmount,
  calculateGST,
  calculateTotalWithGST,
  validatePhone,
  validateEmail,
  formatPhone,
  getStageProgress,
  getNextStage,
  calculateLeadScore,
  getLeadHealth,
  sortLeads,
  filterLeads,
  exportLeadsToCSV,
  getActivityIcon,
  formatDuration
};
