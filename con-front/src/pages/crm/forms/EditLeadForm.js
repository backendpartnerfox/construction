import React, { useState, useEffect } from 'react';
import { X, Save, Edit, AlertCircle } from 'lucide-react';
import { leadsAPI, employeesAPI } from '../../../services/api';

const EditLeadForm = ({ isOpen, onClose, onSubmit, lead }) => {
  const [formData, setFormData] = useState({
    // Contact Information
    primary_contact_name: '',
    company_name: '',
    designation: '',
    primary_phone: '',
    email: '',
    whatsapp_number: '',
    
    // Project Information
    lead_title: '',
    project_description: '',
    project_type: '',
    construction_type: '',
    estimated_built_up_area: '',
    site_area: '',
    number_of_floors: '',
    
    // Location
    site_address: '',
    city: '',
    state: '',
    postal_code: '',
    
    // Budget & Timeline
    budget_min: '',
    budget_max: '',
    timeline_months: '',
    preferred_start_date: '',
    expected_closure_date: '',
    
    // Status
    stage: 'Qualified',
    probability_percentage: 25,
    
    // Team Assignment
    assigned_sales_person: '',
    assigned_architect: '',
    assigned_engineer: '',
    
    // Tracking
    total_calls_made: 0,
    total_meetings_held: 0,
    total_site_visits: 0,
    last_interaction_date: '',
    next_action_date: '',
    next_action_description: '',
    
    // Requirements
    requirements_finalized: false,
    site_survey_completed: false,
    quotation_sent: false,
    
    // Confirmation flags
    is_decision_maker: false,
    budget_confirmed: false,
    timeline_confirmed: false,
    site_ownership_confirmed: false,
    
    // Notes
    lead_notes: '',
    meeting_notes: '',
    technical_notes: ''
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      if (lead) {
        populateFormData(lead);
      }
    }
  }, [isOpen, lead]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeesAPI.getAll();
      if (response && response.data) {
        setEmployees(response.data.filter(emp => emp.status === 'Active'));
      } else if (Array.isArray(response)) {
        setEmployees(response.filter(emp => emp.status === 'Active'));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (leadData) => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      primary_contact_name: leadData.primary_contact_name || '',
      company_name: leadData.company_name || '',
      designation: leadData.designation || '',
      primary_phone: leadData.primary_phone || '',
      email: leadData.email || '',
      whatsapp_number: leadData.whatsapp_number || '',
      
      lead_title: leadData.lead_title || '',
      project_description: leadData.project_description || '',
      project_type: leadData.project_type || '',
      construction_type: leadData.construction_type || '',
      estimated_built_up_area: leadData.estimated_built_up_area || '',
      site_area: leadData.site_area || '',
      number_of_floors: leadData.number_of_floors || '',
      
      site_address: leadData.site_address || '',
      city: leadData.city || '',
      state: leadData.state || '',
      postal_code: leadData.postal_code || '',
      
      budget_min: leadData.budget_min || '',
      budget_max: leadData.budget_max || '',
      timeline_months: leadData.timeline_months || '',
      preferred_start_date: formatDate(leadData.preferred_start_date),
      expected_closure_date: formatDate(leadData.expected_closure_date),
      
      stage: leadData.stage || 'Qualified',
      probability_percentage: leadData.probability_percentage || 25,
      
      assigned_sales_person: leadData.assigned_sales_person || '',
      assigned_architect: leadData.assigned_architect || '',
      assigned_engineer: leadData.assigned_engineer || '',
      
      total_calls_made: leadData.total_calls_made || 0,
      total_meetings_held: leadData.total_meetings_held || 0,
      total_site_visits: leadData.total_site_visits || 0,
      last_interaction_date: formatDate(leadData.last_interaction_date),
      next_action_date: formatDate(leadData.next_action_date),
      next_action_description: leadData.next_action_description || '',
      
      requirements_finalized: leadData.requirements_finalized || false,
      site_survey_completed: leadData.site_survey_completed || false,
      quotation_sent: leadData.quotation_sent || false,
      
      is_decision_maker: leadData.is_decision_maker || false,
      budget_confirmed: leadData.budget_confirmed || false,
      timeline_confirmed: leadData.timeline_confirmed || false,
      site_ownership_confirmed: leadData.site_ownership_confirmed || false,
      
      lead_notes: leadData.lead_notes || '',
      meeting_notes: leadData.meeting_notes || '',
      technical_notes: leadData.technical_notes || ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.primary_contact_name) {
      newErrors.primary_contact_name = 'Primary contact name is required';
    }

    if (!formData.primary_phone) {
      newErrors.primary_phone = 'Phone number is required';
    }

    if (!formData.assigned_sales_person) {
      newErrors.assigned_sales_person = 'Sales person assignment is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare data for API
      const updateData = {
        ...formData,
        // Convert empty strings to null for numeric fields
        estimated_built_up_area: formData.estimated_built_up_area || null,
        site_area: formData.site_area || null,
        number_of_floors: formData.number_of_floors || null,
        budget_min: formData.budget_min || null,
        budget_max: formData.budget_max || null,
        timeline_months: formData.timeline_months || null,
        total_calls_made: parseInt(formData.total_calls_made) || 0,
        total_meetings_held: parseInt(formData.total_meetings_held) || 0,
        total_site_visits: parseInt(formData.total_site_visits) || 0,
        // Convert empty strings to null for date fields
        preferred_start_date: formData.preferred_start_date || null,
        expected_closure_date: formData.expected_closure_date || null,
        last_interaction_date: formData.last_interaction_date || null,
        next_action_date: formData.next_action_date || null,
        // Handle employee assignments
        assigned_sales_person: formData.assigned_sales_person || null,
        assigned_architect: formData.assigned_architect || null,
        assigned_engineer: formData.assigned_engineer || null
      };

      const response = await leadsAPI.update(lead.lead_id, updateData);

      if (response && response.success) {
        alert('Lead updated successfully');
        onSubmit();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead: ' + (error.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const stageOptions = [
    'Qualified',
    'Requirement_Gathering',
    'Site_Visit_Planned',
    'Site_Visited',
    'Quotation_Requested',
    'Quotation_Sent',
    'Negotiation',
    'Won',
    'Lost'
  ];

  const projectTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
  const constructionTypes = ['New Construction', 'Renovation', 'Extension', 'Remodeling'];

  const salesPersons = employees.filter(emp => 
    emp.department?.toLowerCase().includes('sales') || 
    emp.designation?.toLowerCase().includes('sales') ||
    emp.designation?.toLowerCase().includes('manager')
  );

  const architects = employees.filter(emp =>
    emp.department?.toLowerCase().includes('design') ||
    emp.designation?.toLowerCase().includes('architect')
  );

  const engineers = employees.filter(emp =>
    emp.department?.toLowerCase().includes('engineering') ||
    emp.designation?.toLowerCase().includes('engineer')
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit Lead</h3>
              <p className="text-sm text-gray-500">
                {lead?.lead_number || `Lead #${lead?.lead_id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <>
                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Contact Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.primary_contact_name}
                        onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.primary_contact_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      />
                      {errors.primary_contact_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.primary_contact_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.primary_phone}
                        onChange={(e) => handleInputChange('primary_phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.primary_phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      />
                      {errors.primary_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.primary_phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.whatsapp_number}
                        onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Project Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Title</label>
                      <input
                        type="text"
                        value={formData.lead_title}
                        onChange={(e) => handleInputChange('lead_title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                      <textarea
                        value={formData.project_description}
                        onChange={(e) => handleInputChange('project_description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                      <select
                        value={formData.project_type}
                        onChange={(e) => handleInputChange('project_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      >
                        <option value="">Select type</option>
                        {projectTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Construction Type</label>
                      <select
                        value={formData.construction_type}
                        onChange={(e) => handleInputChange('construction_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      >
                        <option value="">Select type</option>
                        {constructionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Built-up Area (sqft)</label>
                      <input
                        type="number"
                        value={formData.estimated_built_up_area}
                        onChange={(e) => handleInputChange('estimated_built_up_area', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Area (sqft)</label>
                      <input
                        type="number"
                        value={formData.site_area}
                        onChange={(e) => handleInputChange('site_area', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
                      <input
                        type="number"
                        value={formData.number_of_floors}
                        onChange={(e) => handleInputChange('number_of_floors', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
                      <textarea
                        value={formData.site_address}
                        onChange={(e) => handleInputChange('site_address', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Budget & Timeline */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Budget & Timeline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₹)</label>
                      <input
                        type="number"
                        value={formData.budget_min}
                        onChange={(e) => handleInputChange('budget_min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
                      <input
                        type="number"
                        value={formData.budget_max}
                        onChange={(e) => handleInputChange('budget_max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (months)</label>
                      <input
                        type="number"
                        value={formData.timeline_months}
                        onChange={(e) => handleInputChange('timeline_months', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Start Date</label>
                      <input
                        type="date"
                        value={formData.preferred_start_date}
                        onChange={(e) => handleInputChange('preferred_start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Closure Date</label>
                      <input
                        type="date"
                        value={formData.expected_closure_date}
                        onChange={(e) => handleInputChange('expected_closure_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Stage & Probability */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Stage & Probability</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                      <select
                        value={formData.stage}
                        onChange={(e) => handleInputChange('stage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      >
                        {stageOptions.map(stage => (
                          <option key={stage} value={stage}>
                            {stage.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Probability: {formData.probability_percentage}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.probability_percentage}
                        onChange={(e) => handleInputChange('probability_percentage', e.target.value)}
                        className="w-full"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Team Assignment */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Team Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sales Person <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.assigned_sales_person}
                        onChange={(e) => handleInputChange('assigned_sales_person', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.assigned_sales_person ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      >
                        <option value="">Select sales person</option>
                        {(salesPersons.length > 0 ? salesPersons : employees).map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.first_name} {emp.last_name} - {emp.designation}
                          </option>
                        ))}
                      </select>
                      {errors.assigned_sales_person && (
                        <p className="mt-1 text-sm text-red-600">{errors.assigned_sales_person}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                      <select
                        value={formData.assigned_architect}
                        onChange={(e) => handleInputChange('assigned_architect', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      >
                        <option value="">Select architect</option>
                        {(architects.length > 0 ? architects : employees).map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.first_name} {emp.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                      <select
                        value={formData.assigned_engineer}
                        onChange={(e) => handleInputChange('assigned_engineer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      >
                        <option value="">Select engineer</option>
                        {(engineers.length > 0 ? engineers : employees).map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.first_name} {emp.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interaction Tracking */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Interaction Tracking</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calls Made</label>
                      <input
                        type="number"
                        value={formData.total_calls_made}
                        onChange={(e) => handleInputChange('total_calls_made', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meetings Held</label>
                      <input
                        type="number"
                        value={formData.total_meetings_held}
                        onChange={(e) => handleInputChange('total_meetings_held', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Visits</label>
                      <input
                        type="number"
                        value={formData.total_site_visits}
                        onChange={(e) => handleInputChange('total_site_visits', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Interaction</label>
                      <input
                        type="date"
                        value={formData.last_interaction_date}
                        onChange={(e) => handleInputChange('last_interaction_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
                      <input
                        type="date"
                        value={formData.next_action_date}
                        onChange={(e) => handleInputChange('next_action_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                      <input
                        type="text"
                        value={formData.next_action_description}
                        onChange={(e) => handleInputChange('next_action_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                        placeholder="e.g., Follow-up call"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Flags */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_decision_maker}
                        onChange={() => handleCheckboxChange('is_decision_maker')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Is Decision Maker</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.budget_confirmed}
                        onChange={() => handleCheckboxChange('budget_confirmed')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Budget Confirmed</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.timeline_confirmed}
                        onChange={() => handleCheckboxChange('timeline_confirmed')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Timeline Confirmed</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.site_ownership_confirmed}
                        onChange={() => handleCheckboxChange('site_ownership_confirmed')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Site Ownership Confirmed</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.requirements_finalized}
                        onChange={() => handleCheckboxChange('requirements_finalized')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Requirements Finalized</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.site_survey_completed}
                        onChange={() => handleCheckboxChange('site_survey_completed')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Site Survey Completed</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.quotation_sent}
                        onChange={() => handleCheckboxChange('quotation_sent')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">Quotation Sent</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Notes</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Notes</label>
                      <textarea
                        value={formData.lead_notes}
                        onChange={(e) => handleInputChange('lead_notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                        placeholder="General notes about the lead..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Notes</label>
                      <textarea
                        value={formData.meeting_notes}
                        onChange={(e) => handleInputChange('meeting_notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                        placeholder="Notes from meetings..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Technical Notes</label>
                      <textarea
                        value={formData.technical_notes}
                        onChange={(e) => handleInputChange('technical_notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                        placeholder="Technical specifications and requirements..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>

        {/* Footer - Fixed */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLeadForm;
