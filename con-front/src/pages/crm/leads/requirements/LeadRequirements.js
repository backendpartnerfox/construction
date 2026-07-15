import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Building2,
  Home,
  Ruler,
  FileText,
  DollarSign,
  Bed,
  Bath,
  Layers,
  Package
} from 'lucide-react';
import { leadRequirementsAPI } from '../../../../services/leadsApi';

const LeadRequirements = ({ leadId }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    requirement_title: '',
    requirement_description: '',
    project_type: '',
    construction_type: '',
    site_area: '',
    built_up_area: '',
    number_of_floors: '',
    number_of_bedrooms: '',
    number_of_bathrooms: '',
    quality_preference: 'Standard',
    package_type: 'Standard Package',
    budget_range_min: '',
    budget_range_max: '',
    status: 'Draft'
  });

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadRequirementsAPI.getByLeadId(leadId);
      if (Array.isArray(data)) {
        setRequirements(data);
      } else if (data && typeof data === 'object') {
        setRequirements([data]);
      } else {
        setRequirements([]);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load requirements';
      setError(errorMessage);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      loadRequirements();
    }
  }, [leadId, loadRequirements]);

  const validateForm = () => {
    if (!formData.requirement_title?.trim()) {
      alert('Please enter a requirement title');
      return false;
    }
    if (!formData.project_type) {
      alert('Please select a project type');
      return false;
    }
    if (!formData.construction_type) {
      alert('Please select a construction type');
      return false;
    }
    
    const minBudget = parseFloat(formData.budget_range_min);
    const maxBudget = parseFloat(formData.budget_range_max);
    if (minBudget && maxBudget && minBudget > maxBudget) {
      alert('Minimum budget cannot be greater than maximum budget');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const cleanedData = {
        requirement_title: formData.requirement_title.trim(),
        requirement_description: formData.requirement_description?.trim() || null,
        project_type: formData.project_type || null,
        construction_type: formData.construction_type || null,
        site_area: formData.site_area ? parseFloat(formData.site_area) : null,
        built_up_area: formData.built_up_area ? parseFloat(formData.built_up_area) : null,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : null,
        number_of_bedrooms: formData.number_of_bedrooms ? parseInt(formData.number_of_bedrooms) : null,
        number_of_bathrooms: formData.number_of_bathrooms ? parseInt(formData.number_of_bathrooms) : null,
        budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
        quality_preference: formData.quality_preference || null,
        package_type: formData.package_type || null,
        status: formData.status || 'Draft'
      };

      console.log('Submitting data:', cleanedData);

      if (editingRequirement) {
        await leadRequirementsAPI.update(editingRequirement.lead_requirement_id, cleanedData);
      } else {
        await leadRequirementsAPI.create(leadId, cleanedData);
      }
      
      await loadRequirements();
      handleCancel();
    } catch (error) {
      console.error('Error saving requirement:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save requirement';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (requirement) => {
    setEditingRequirement(requirement);
    setFormData({
      requirement_title: requirement.requirement_title || '',
      requirement_description: requirement.requirement_description || '',
      project_type: requirement.project_type || '',
      construction_type: requirement.construction_type || '',
      site_area: requirement.site_area || '',
      built_up_area: requirement.built_up_area || '',
      number_of_floors: requirement.number_of_floors || '',
      number_of_bedrooms: requirement.number_of_bedrooms || '',
      number_of_bathrooms: requirement.number_of_bathrooms || '',
      quality_preference: requirement.quality_preference || 'Standard',
      package_type: requirement.package_type || 'Standard Package',
      budget_range_min: requirement.budget_range_min || '',
      budget_range_max: requirement.budget_range_max || '',
      status: requirement.status || 'Draft'
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (requirementId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) {
      return;
    }

    setError(null);
    try {
      await leadRequirementsAPI.delete(requirementId);
      await loadRequirements();
    } catch (error) {
      console.error('Error deleting requirement:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete requirement';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleFinalize = async (requirementId) => {
    if (!window.confirm('Are you sure you want to finalize this requirement? This will lock the requirement details.')) {
      return;
    }

    setError(null);
    try {
      await leadRequirementsAPI.finalize(requirementId);
      await loadRequirements();
    } catch (error) {
      console.error('Error finalizing requirement:', error);
      const errorMessage = error.response?.data?.error || 'Failed to finalize requirement';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequirement(null);
    setError(null);
    setFormData({
      requirement_title: '',
      requirement_description: '',
      project_type: '',
      construction_type: '',
      site_area: '',
      built_up_area: '',
      number_of_floors: '',
      number_of_bedrooms: '',
      number_of_bathrooms: '',
      quality_preference: 'Standard',
      package_type: 'Standard Package',
      budget_range_min: '',
      budget_range_max: '',
      status: 'Draft'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'Under_Discussion': 'bg-blue-100 text-blue-800 border-blue-200',
      'Finalized': 'bg-green-100 text-green-800 border-green-200',
      'Quoted': 'bg-purple-100 text-purple-800 border-purple-200',
      'Selected': 'bg-teal-100 text-teal-800 border-teal-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    const numAmount = parseFloat(amount);
    if (numAmount >= 10000000) {
      return `₹${(numAmount / 10000000).toFixed(2)} Cr`;
    } else if (numAmount >= 100000) {
      return `₹${(numAmount / 100000).toFixed(2)} L`;
    } else {
      return `₹${numAmount.toLocaleString('en-IN')}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
          <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
          <p className="text-sm text-gray-600">Manage project requirements for this lead</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Requirement</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRequirement ? 'Edit Requirement' : 'New Requirement'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requirement Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="requirement_title"
                  value={formData.requirement_title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 3BHK Residential Villa"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="requirement_description"
                  value={formData.requirement_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe the project requirements..."
                />
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
              </div>

              {/* Construction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Construction Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="construction_type"
                  value={formData.construction_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="New Construction">New Construction</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Extension">Extension</option>
                </select>
              </div>

              {/* Site Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="site_area"
                  value={formData.site_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter site area"
                />
              </div>

              {/* Built-up Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Built-up Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="built_up_area"
                  value={formData.built_up_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter built-up area"
                />
              </div>

              {/* Number of Floors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Floors
                </label>
                <input
                  type="number"
                  name="number_of_floors"
                  value={formData.number_of_floors}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter number of floors"
                />
              </div>

              {/* Number of Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Bedrooms
                </label>
                <input
                  type="number"
                  name="number_of_bedrooms"
                  value={formData.number_of_bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter number of bedrooms"
                />
              </div>

              {/* Number of Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Bathrooms
                </label>
                <input
                  type="number"
                  name="number_of_bathrooms"
                  value={formData.number_of_bathrooms}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter number of bathrooms"
                />
              </div>

              {/* Quality Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Preference
                </label>
                <select
                  name="quality_preference"
                  value={formData.quality_preference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              {/* Package Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Type
                </label>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Basic Package">Basic Package</option>
                  <option value="Standard Package">Standard Package</option>
                  <option value="Premium Package">Premium Package</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Budget Range Min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Min (₹)
                </label>
                <input
                  type="number"
                  name="budget_range_min"
                  value={formData.budget_range_min}
                  onChange={handleChange}
                  step="1000"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter minimum budget"
                />
              </div>

              {/* Budget Range Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Max (₹)
                </label>
                <input
                  type="number"
                  name="budget_range_max"
                  value={formData.budget_range_max}
                  onChange={handleChange}
                  step="1000"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter maximum budget"
                />
              </div>

              {/* Status (only show when editing) */}
              {editingRequirement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under_Discussion">Under Discussion</option>
                    <option value="Finalized">Finalized</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{editingRequirement ? 'Update Requirement' : 'Create Requirement'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requirements List */}
      {requirements.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
          <p className="text-gray-500 mb-4">
            Start by adding project requirements for this lead
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Requirement</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <div
              key={requirement.lead_requirement_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {requirement.requirement_title}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(requirement.status)}`}>
                      {requirement.status?.replace('_', ' ') || 'Draft'}
                    </span>
                  </div>
                  {requirement.requirement_description && (
                    <p className="text-gray-600 mb-3">{requirement.requirement_description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {requirement.status !== 'Finalized' && (
                    <>
                      <button
                        onClick={() => handleEdit(requirement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFinalize(requirement.lead_requirement_id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Finalize"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(requirement.lead_requirement_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Requirement Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-start space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Project Type</p>
                    <p className="text-sm font-medium text-gray-900">{requirement.project_type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Home className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Construction</p>
                    <p className="text-sm font-medium text-gray-900">{requirement.construction_type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Ruler className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Built-up Area</p>
                    <p className="text-sm font-medium text-gray-900">
                      {requirement.built_up_area ? `${parseFloat(requirement.built_up_area).toFixed(2)} sq.ft` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Budget Range</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(requirement.budget_range_min)} - {formatCurrency(requirement.budget_range_max)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {(requirement.number_of_floors || requirement.number_of_bedrooms || requirement.number_of_bathrooms || requirement.package_type) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                  {requirement.number_of_floors && (
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Floors</p>
                        <p className="text-sm font-medium text-gray-900">{requirement.number_of_floors}</p>
                      </div>
                    </div>
                  )}
                  {requirement.number_of_bedrooms && (
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Bedrooms</p>
                        <p className="text-sm font-medium text-gray-900">{requirement.number_of_bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {requirement.number_of_bathrooms && (
                    <div className="flex items-center space-x-2">
                      <Bath className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Bathrooms</p>
                        <p className="text-sm font-medium text-gray-900">{requirement.number_of_bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {requirement.package_type && (
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Package</p>
                        <p className="text-sm font-medium text-gray-900">{requirement.package_type}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadRequirements;