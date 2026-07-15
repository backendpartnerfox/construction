import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, Home, Building2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ClientRequirements = ({ clientId }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [viewingRequirement, setViewingRequirement] = useState(null);
  const [formData, setFormData] = useState({
    client_id: clientId,
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
    number_of_kitchens: '',
    stilt_required: false,
    stilt_area: '',
    balcony_area: '',
    terrace_area: '',
    quality_level: 'Standard',
    package_type: '',
    approved_budget: '',
    project_start_date: '',
    expected_completion_date: '',
    status: 'Draft'
  });

  useEffect(() => {
    fetchRequirements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/client_requirements/client/${clientId}`);
      setRequirements(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast.error('Failed to load requirements');
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRequirement) {
        const response = await axios.put(
          `/api/client_requirements/${editingRequirement.client_requirement_id}`,
          { ...formData, client_id: clientId }
        );
        if (response.data) {
          toast.success('Requirement updated successfully!');
          fetchRequirements();
          handleCloseModal();
        }
      } else {
        const response = await axios.post('/api/client_requirements', {
          ...formData,
          client_id: clientId
        });
        if (response.data) {
          toast.success('Requirement created successfully!');
          fetchRequirements();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (requirement) => {
    setEditingRequirement(requirement);
    setFormData({
      client_id: requirement.client_id,
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
      number_of_kitchens: requirement.number_of_kitchens || '',
      stilt_required: requirement.stilt_required || false,
      stilt_area: requirement.stilt_area || '',
      balcony_area: requirement.balcony_area || '',
      terrace_area: requirement.terrace_area || '',
      quality_level: requirement.quality_level || 'Standard',
      package_type: requirement.package_type || '',
      approved_budget: requirement.approved_budget || '',
      project_start_date: requirement.project_start_date?.split('T')[0] || '',
      expected_completion_date: requirement.expected_completion_date?.split('T')[0] || '',
      status: requirement.status || 'Draft'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;
    
    try {
      await axios.delete(`/api/client_requirements/${id}`);
      toast.success('Requirement deleted successfully!');
      fetchRequirements();
    } catch (error) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRequirement(null);
    setFormData({
      client_id: clientId,
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
      number_of_kitchens: '',
      stilt_required: false,
      stilt_area: '',
      balcony_area: '',
      terrace_area: '',
      quality_level: 'Standard',
      package_type: '',
      approved_budget: '',
      project_start_date: '',
      expected_completion_date: '',
      status: 'Draft'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Under_Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Locked': 'bg-blue-100 text-blue-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Client Requirements</h2>
            <p className="text-sm text-gray-600">Manage client project requirements</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Requirement</span>
        </button>
      </div>

      {/* Requirements List */}
      {requirements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No requirements found</p>
          <p className="text-sm text-gray-500 mt-1">Add your first requirement</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requirements.map((requirement) => (
            <div key={requirement.client_requirement_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {requirement.requirement_title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(requirement.status)}`}>
                      {requirement.status}
                    </span>
                  </div>
                  {requirement.project_title && (
                    <p className="text-sm text-gray-600">{requirement.project_title}</p>
                  )}
                  {requirement.requirement_description && (
                    <p className="text-sm text-gray-500 mt-1">{requirement.requirement_description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewingRequirement(requirement)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(requirement)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(requirement.client_requirement_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Project Type</p>
                    <p className="text-sm font-semibold text-gray-900">{requirement.project_type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Built-up Area</p>
                    <p className="text-sm font-semibold text-gray-900">{requirement.built_up_area ? `${requirement.built_up_area} sq.ft` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Bedrooms</p>
                    <p className="text-sm font-semibold text-gray-900">{requirement.number_of_bedrooms || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Quality</p>
                    <p className="text-sm font-semibold text-gray-900">{requirement.quality_level || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingRequirement ? 'Edit' : 'Add'} Requirement
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requirement Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.requirement_title}
                        onChange={(e) => setFormData({...formData, requirement_title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., 3BHK Villa Construction"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={formData.project_title}
                        onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Dream Villa Project"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirement Description
                    </label>
                    <textarea
                      rows="3"
                      value={formData.requirement_description}
                      onChange={(e) => setFormData({...formData, requirement_description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Describe the requirement..."
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Type *
                      </label>
                      <select
                        required
                        value={formData.project_type}
                        onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Mixed">Mixed Use</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Construction Type *
                      </label>
                      <select
                        required
                        value={formData.construction_type}
                        onChange={(e) => setFormData({...formData, construction_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="New Construction">New Construction</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Extension">Extension</option>
                        <option value="Remodeling">Remodeling</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Level
                      </label>
                      <select
                        value={formData.quality_level}
                        onChange={(e) => setFormData({...formData, quality_level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Economy">Economy</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Luxury">Luxury</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Area Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Details</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.site_area}
                        onChange={(e) => setFormData({...formData, site_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Built-up Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.built_up_area}
                        onChange={(e) => setFormData({...formData, built_up_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carpet Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.carpet_area}
                        onChange={(e) => setFormData({...formData, carpet_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Balcony Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.balcony_area}
                        onChange={(e) => setFormData({...formData, balcony_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terrace Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.terrace_area}
                        onChange={(e) => setFormData({...formData, terrace_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Floors
                      </label>
                      <input
                        type="number"
                        value={formData.number_of_floors}
                        onChange={(e) => setFormData({...formData, number_of_floors: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="stilt_required"
                      checked={formData.stilt_required}
                      onChange={(e) => setFormData({...formData, stilt_required: e.target.checked})}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="stilt_required" className="ml-2 block text-sm text-gray-700">
                      Stilt Required
                    </label>
                  </div>

                  {formData.stilt_required && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stilt Area (sq.ft)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stilt_area}
                        onChange={(e) => setFormData({...formData, stilt_area: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>

                {/* Room Configuration */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Configuration</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        value={formData.number_of_bedrooms}
                        onChange={(e) => setFormData({...formData, number_of_bedrooms: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        value={formData.number_of_bathrooms}
                        onChange={(e) => setFormData({...formData, number_of_bathrooms: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kitchens
                      </label>
                      <input
                        type="number"
                        value={formData.number_of_kitchens}
                        onChange={(e) => setFormData({...formData, number_of_kitchens: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Budget & Timeline */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Timeline</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approved Budget (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.approved_budget}
                        onChange={(e) => setFormData({...formData, approved_budget: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.project_start_date}
                        onChange={(e) => setFormData({...formData, project_start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Completion
                      </label>
                      <input
                        type="date"
                        value={formData.expected_completion_date}
                        onChange={(e) => setFormData({...formData, expected_completion_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under_Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {editingRequirement ? 'Update' : 'Create'} Requirement
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Requirement Details</h2>
                <button
                  onClick={() => setViewingRequirement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{viewingRequirement.requirement_title}</h3>
                  <p className="text-gray-600">{viewingRequirement.requirement_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Project Type</p>
                    <p className="font-semibold">{viewingRequirement.project_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Construction Type</p>
                    <p className="font-semibold">{viewingRequirement.construction_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Built-up Area</p>
                    <p className="font-semibold">{viewingRequirement.built_up_area} sq.ft</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quality Level</p>
                    <p className="font-semibold">{viewingRequirement.quality_level}</p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingRequirement(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRequirements;
