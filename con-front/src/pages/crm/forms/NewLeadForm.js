import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, User, Building2, Phone, Mail, MapPin, Home, DollarSign, Calendar, FileText } from 'lucide-react';
import { leadsAPI, employeesAPI } from '../../../../services/api';

const NewLeadForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    // Basic Info
    lead_title: '',
    primary_contact_name: '',
    company_name: '',
    designation: '',
    primary_phone: '',
    email: '',
    whatsapp_number: '',
    
    // Address
    site_address: '',
    city: '',
    state: '',
    postal_code: '',
    
    // Project Details
    project_type: 'Residential',
    construction_type: 'New',
    project_description: '',
    site_area: '',
    estimated_built_up_area: '',
    number_of_floors: '',
    
    // Budget and Timeline
    budget_min: '',
    budget_max: '',
    timeline_months: '',
    preferred_start_date: '',
    
    // Assignment
    assigned_sales_person: '',
    assigned_architect: '',
    assigned_engineer: '',
    
    // Pipeline
    stage: 'Qualified',
    probability_percentage: 25,
    
    // Notes
    lead_notes: ''
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      if (response && response.data) {
        setEmployees(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Clean up the data - remove empty strings
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );
      
      const response = await leadsAPI.create(cleanedData);
      alert('Lead created successfully!');
      navigate('/crm/leads');
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const projectTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
  const constructionTypes = ['New', 'Renovation', 'Extension'];
  const stages = [
    'Qualified',
    'Requirement_Gathering',
    'Site_Visit_Planned',
    'Site_Visited',
    'Quotation_Requested',
    'Quotation_Sent',
    'Negotiation'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
            <button
              onClick={() => navigate('/crm/leads')}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-500" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lead_title"
                  value={formData.lead_title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Luxury Villa Construction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company name (if applicable)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Job title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="primary_phone"
                  value={formData.primary_phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-500" />
              Location Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Address
                </label>
                <textarea
                  name="site_address"
                  value={formData.site_address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Complete site address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Postal code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2 text-orange-500" />
              Project Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Construction Type
                </label>
                <select
                  name="construction_type"
                  value={formData.construction_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {constructionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="site_area"
                  value={formData.site_area}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Built-up Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="estimated_built_up_area"
                  value={formData.estimated_built_up_area}
                  onChange={handleChange}
                  placeholder="e.g., 3500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Floors
                </label>
                <input
                  type="number"
                  name="number_of_floors"
                  value={formData.number_of_floors}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description
                </label>
                <textarea
                  name="project_description"
                  value={formData.project_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of the project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Budget and Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-orange-500" />
              Budget & Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Budget (₹)
                </label>
                <input
                  type="number"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="e.g., 5000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Budget (₹)
                </label>
                <input
                  type="number"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="e.g., 7500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeline (months)
                </label>
                <input
                  type="number"
                  name="timeline_months"
                  value={formData.timeline_months}
                  onChange={handleChange}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Start Date
                </label>
                <input
                  type="date"
                  name="preferred_start_date"
                  value={formData.preferred_start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-500" />
              Team Assignment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person <span className="text-red-500">*</span>
                </label>
                <select
                  name="assigned_sales_person"
                  value={formData.assigned_sales_person}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Sales Person</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Architect
                </label>
                <select
                  name="assigned_architect"
                  value={formData.assigned_architect}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Architect</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engineer
                </label>
                <select
                  name="assigned_engineer"
                  value={formData.assigned_engineer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Engineer</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pipeline Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              Pipeline Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>
                      {stage.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Probability (%)
                </label>
                <input
                  type="number"
                  name="probability_percentage"
                  value={formData.probability_percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  placeholder="0-100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              Additional Notes
            </h2>
            <div>
              <textarea
                name="lead_notes"
                value={formData.lead_notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any additional notes or important information about this lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/crm/leads')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLeadForm;
