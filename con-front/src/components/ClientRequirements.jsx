import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientRequirements = ({ clientId }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const [formData, setFormData] = useState({
    client_id: clientId || '',
    requirement_title: '',
    requirement_description: '',
    project_title: '',
    project_type: 'Residential',
    construction_type: 'New Construction',
    site_area: '',
    built_up_area: '',
    carpet_area: '',
    number_of_floors: '',
    number_of_bedrooms: '',
    number_of_bathrooms: '',
    number_of_kitchens: 1,
    stilt_required: false,
    stilt_area: '',
    balcony_area: '',
    terrace_area: '',
    quality_level: 'Standard',
    package_type: 'Standard Package',
    approved_budget: '',
    project_start_date: '',
    expected_completion_date: '',
    status: 'Draft'
  });

  const API_BASE_URL = 'http://localhost:9001/api';

  useEffect(() => {
    if (clientId) {
      fetchRequirements();
    }
  }, [clientId]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const url = clientId 
        ? `${API_BASE_URL}/client_requirements/client/${clientId}`
        : `${API_BASE_URL}/client_requirements`;
      
      const response = await axios.get(url);
      setRequirements(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch requirements: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRequirement) {
        await axios.put(
          `${API_BASE_URL}/client_requirements/${editingRequirement.client_requirement_id}`,
          { ...formData, updated_by: 1 }
        );
        alert('Requirement updated successfully!');
      } else {
        await axios.post(
          `${API_BASE_URL}/client_requirements`,
          { ...formData, created_by: 1 }
        );
        alert('Requirement created successfully!');
      }
      
      resetForm();
      fetchRequirements();
    } catch (err) {
      alert('Error saving requirement: ' + err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (requirement) => {
    setEditingRequirement(requirement);
    setFormData({
      client_id: requirement.client_id || clientId || '',
      requirement_title: requirement.requirement_title || '',
      requirement_description: requirement.requirement_description || '',
      project_title: requirement.project_title || '',
      project_type: requirement.project_type || 'Residential',
      construction_type: requirement.construction_type || 'New Construction',
      site_area: requirement.site_area || '',
      built_up_area: requirement.built_up_area || '',
      carpet_area: requirement.carpet_area || '',
      number_of_floors: requirement.number_of_floors || '',
      number_of_bedrooms: requirement.number_of_bedrooms || '',
      number_of_bathrooms: requirement.number_of_bathrooms || '',
      number_of_kitchens: requirement.number_of_kitchens || 1,
      stilt_required: requirement.stilt_required || false,
      stilt_area: requirement.stilt_area || '',
      balcony_area: requirement.balcony_area || '',
      terrace_area: requirement.terrace_area || '',
      quality_level: requirement.quality_level || 'Standard',
      package_type: requirement.package_type || 'Standard Package',
      approved_budget: requirement.approved_budget || '',
      project_start_date: requirement.project_start_date || '',
      expected_completion_date: requirement.expected_completion_date || '',
      status: requirement.status || 'Draft'
    });
    setShowForm(true);
  };

  const handleDelete = async (requirementId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/client_requirements/${requirementId}`);
      alert('Requirement deleted successfully!');
      fetchRequirements();
    } catch (err) {
      alert('Error deleting requirement: ' + err.response?.data?.error || err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: clientId || '',
      requirement_title: '',
      requirement_description: '',
      project_title: '',
      project_type: 'Residential',
      construction_type: 'New Construction',
      site_area: '',
      built_up_area: '',
      carpet_area: '',
      number_of_floors: '',
      number_of_bedrooms: '',
      number_of_bathrooms: '',
      number_of_kitchens: 1,
      stilt_required: false,
      stilt_area: '',
      balcony_area: '',
      terrace_area: '',
      quality_level: 'Standard',
      package_type: 'Standard Package',
      approved_budget: '',
      project_start_date: '',
      expected_completion_date: '',
      status: 'Draft'
    });
    setEditingRequirement(null);
    setShowForm(false);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Under_Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Locked': 'bg-blue-100 text-blue-800',
      'Change_Request': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Requirements</h2>
          <p className="text-gray-600 mt-1">Manage project requirements and specifications</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Add Requirement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Requirements Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRequirement ? 'Edit Requirement' : 'Add New Requirement'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requirement Title *
                      </label>
                      <input
                        type="text"
                        name="requirement_title"
                        value={formData.requirement_title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="requirement_description"
                        value={formData.requirement_description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Title
                      </label>
                      <input
                        type="text"
                        name="project_title"
                        value={formData.project_title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Type *
                      </label>
                      <select
                        name="project_type"
                        value={formData.project_type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Mixed Use">Mixed Use</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Construction Type *
                      </label>
                      <select
                        name="construction_type"
                        value={formData.construction_type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="New Construction">New Construction</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Extension">Extension</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Under_Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Locked">Locked</option>
                        <option value="Change_Request">Change Request</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Area Specifications */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="site_area"
                        value={formData.site_area}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Built-up Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="built_up_area"
                        value={formData.built_up_area}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Carpet Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="carpet_area"
                        value={formData.carpet_area}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Balcony Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="balcony_area"
                        value={formData.balcony_area}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terrace Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="terrace_area"
                        value={formData.terrace_area}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stilt Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        name="stilt_area"
                        value={formData.stilt_area}
                        onChange={handleInputChange}
                        step="0.01"
                        disabled={!formData.stilt_required}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Building Details */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Floors
                      </label>
                      <input
                        type="number"
                        name="number_of_floors"
                        value={formData.number_of_floors}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        name="number_of_bedrooms"
                        value={formData.number_of_bedrooms}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        name="number_of_bathrooms"
                        value={formData.number_of_bathrooms}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kitchens
                      </label>
                      <input
                        type="number"
                        name="number_of_kitchens"
                        value={formData.number_of_kitchens}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        name="stilt_required"
                        checked={formData.stilt_required}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Stilt Required
                      </label>
                    </div>
                  </div>
                </div>

                {/* Package & Quality */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Package & Quality</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality Level
                      </label>
                      <select
                        name="quality_level"
                        value={formData.quality_level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Basic">Basic</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Luxury">Luxury</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package Type
                      </label>
                      <select
                        name="package_type"
                        value={formData.package_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Basic Package">Basic Package</option>
                        <option value="Standard Package">Standard Package</option>
                        <option value="Premium Package">Premium Package</option>
                        <option value="Custom Package">Custom Package</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Budget & Timeline */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approved Budget (₹)
                      </label>
                      <input
                        type="number"
                        name="approved_budget"
                        value={formData.approved_budget}
                        onChange={handleInputChange}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Start Date
                      </label>
                      <input
                        type="date"
                        name="project_start_date"
                        value={formData.project_start_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Completion Date
                      </label>
                      <input
                        type="date"
                        name="expected_completion_date"
                        value={formData.expected_completion_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRequirement ? 'Update Requirement' : 'Create Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Requirements List ({requirements.length})
          </h3>
        </div>

        {requirements.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4">No requirements found</p>
            <p className="mt-1 text-sm">Click "Add Requirement" to create a new requirement</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requirements.map((req) => (
              <div key={req.client_requirement_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {req.requirement_title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(req.status)}`}>
                        {req.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {req.requirement_description && (
                      <p className="text-gray-600 mb-3">{req.requirement_description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Project Type:</span>
                        <span className="ml-2 font-medium text-gray-900">{req.project_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Built-up Area:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {req.built_up_area ? `${req.built_up_area} sq.ft` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Floors:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {req.number_of_floors || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatCurrency(req.approved_budget)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bedrooms:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {req.number_of_bedrooms || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bathrooms:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {req.number_of_bathrooms || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatDate(req.project_start_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completion:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatDate(req.expected_completion_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(req)}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(req.client_requirement_id)}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRequirements;