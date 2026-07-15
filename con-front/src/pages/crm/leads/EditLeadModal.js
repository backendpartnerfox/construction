import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { leadsAPI } from '../../../services/api';

const EditLeadModal = ({ lead, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    lead_title: '',
    project_description: '',
    primary_contact_name: '',
    company_name: '',
    designation: '',
    primary_phone: '',
    email: '',
    whatsapp_number: '',
    site_address: '',
    city: '',
    state: '',
    postal_code: '',
    project_type: '',
    construction_type: '',
    site_area: '',
    estimated_built_up_area: '',
    number_of_floors: '',
    budget_min: '',
    budget_max: '',
    timeline_months: '',
    preferred_start_date: '',
    is_decision_maker: false,
    budget_confirmed: false,
    timeline_confirmed: false,
    site_ownership_confirmed: false,
    approvals_status: '',
    stage: '',
    probability_percentage: '',
    // Remove fields that don't exist in database
    // assigned_to: '',
    // lead_source: '',
    notes: '' // Will be mapped to lead_notes in backend
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead && isOpen) {
      setFormData({
        lead_title: lead.lead_title || '',
        project_description: lead.project_description || '',
        primary_contact_name: lead.primary_contact_name || '',
        company_name: lead.company_name || '',
        designation: lead.designation || '',
        primary_phone: lead.primary_phone || '',
        email: lead.email || '',
        whatsapp_number: lead.whatsapp_number || '',
        site_address: lead.site_address || '',
        city: lead.city || '',
        state: lead.state || '',
        postal_code: lead.postal_code || '',
        project_type: lead.project_type || '',
        construction_type: lead.construction_type || '',
        site_area: lead.site_area || '',
        estimated_built_up_area: lead.estimated_built_up_area || '',
        number_of_floors: lead.number_of_floors || '',
        budget_min: lead.budget_min || '',
        budget_max: lead.budget_max || '',
        timeline_months: lead.timeline_months || '',
        preferred_start_date: lead.preferred_start_date ? lead.preferred_start_date.split('T')[0] : '',
        is_decision_maker: lead.is_decision_maker || false,
        budget_confirmed: lead.budget_confirmed || false,
        timeline_confirmed: lead.timeline_confirmed || false,
        site_ownership_confirmed: lead.site_ownership_confirmed || false,
        approvals_status: lead.approvals_status || '',
        stage: lead.stage || '',
        probability_percentage: lead.probability_percentage || '',
        // assigned_to: lead.assigned_to || '',
        // lead_source: lead.lead_source || '',
        notes: lead.lead_notes || lead.notes || '' // Map lead_notes to notes
      });
      setErrors({});
    }
  }, [lead, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.primary_contact_name?.trim()) {
      newErrors.primary_contact_name = 'Contact name is required';
    }

    if (!formData.primary_phone?.trim()) {
      newErrors.primary_phone = 'Phone number is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert empty strings to null for numeric fields
      const dataToSubmit = {
        ...formData,
        site_area: formData.site_area ? parseFloat(formData.site_area) : null,
        estimated_built_up_area: formData.estimated_built_up_area ? parseFloat(formData.estimated_built_up_area) : null,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        timeline_months: formData.timeline_months ? parseInt(formData.timeline_months) : null,
        probability_percentage: formData.probability_percentage ? parseFloat(formData.probability_percentage) : null,
        preferred_start_date: formData.preferred_start_date || null, // Keep as string or null
        // Remove empty strings for text fields
        lead_title: formData.lead_title || null,
        project_description: formData.project_description || null,
        company_name: formData.company_name || null,
        designation: formData.designation || null,
        email: formData.email || null,
        whatsapp_number: formData.whatsapp_number || null,
        site_address: formData.site_address || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        project_type: formData.project_type || null,
        construction_type: formData.construction_type || null,
        approvals_status: formData.approvals_status || null,
        stage: formData.stage || null,
        // Remove fields that don't exist
        // assigned_to: formData.assigned_to || null,
        // lead_source: formData.lead_source || null,
        notes: formData.notes || null // Backend maps to lead_notes
      };

      await leadsAPI.update(lead.lead_id, dataToSubmit);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Lead: {lead?.lead_number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Title
                  </label>
                  <input
                    type="text"
                    name="lead_title"
                    value={formData.lead_title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter lead title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage *
                  </label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Stage</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Requirement_Gathering">Requirement Gathering</option>
                    <option value="Site_Visit_Planned">Site Visit Planned</option>
                    <option value="Site_Visited">Site Visited</option>
                    <option value="Quotation_Requested">Quotation Requested</option>
                    <option value="Quotation_Sent">Quotation Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    name="project_description"
                    value={formData.project_description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe the project..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Contact Name *
                  </label>
                  <input
                    type="text"
                    name="primary_contact_name"
                    value={formData.primary_contact_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.primary_contact_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter contact name"
                  />
                  {errors.primary_contact_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_contact_name}</p>
                  )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter company name"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter designation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Phone *
                  </label>
                  <input
                    type="tel"
                    name="primary_phone"
                    value={formData.primary_phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.primary_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.primary_phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_phone}</p>
                  )}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter WhatsApp number"
                  />
                </div>
              </div>
            </div>

            {/* Site Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Address
                  </label>
                  <textarea
                    name="site_address"
                    value={formData.site_address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter site address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter city"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter state"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Mixed Use">Mixed Use</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Type</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Extension">Extension</option>
                    <option value="Remodeling">Remodeling</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter site area"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter built-up area"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter number of floors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approvals Status
                  </label>
                  <select
                    name="approvals_status"
                    value={formData.approvals_status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Min (₹)
                  </label>
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Minimum budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Max (₹)
                  </label>
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Maximum budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline (Months)
                  </label>
                  <input
                    type="number"
                    name="timeline_months"
                    value={formData.timeline_months}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Project timeline in months"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Win probability"
                  />
                </div>
              </div>
            </div>

            {/* Confirmation Checkboxes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmations</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_decision_maker"
                    checked={formData.is_decision_maker}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Is Decision Maker</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="budget_confirmed"
                    checked={formData.budget_confirmed}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Budget Confirmed</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="timeline_confirmed"
                    checked={formData.timeline_confirmed}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Timeline Confirmed</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="site_ownership_confirmed"
                    checked={formData.site_ownership_confirmed}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Site Ownership Confirmed</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;
