import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';

const ElementsManagement = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [viewingElement, setViewingElement] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    element_name: '',
    element_category: '',
    element_description: '',
    linetype: '',
    phase: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api/elements`;

  // Categories for dropdown
  const categories = [
    'Foundation',
    'Structural',
    'Utility',
    'Circulation',
    'Architectural',
    'External'
  ];

  // Line types for dropdown
  const lineTypes = [
    'RCC',
    'Masonry',
    'Steel',
    'Mixed',
    'Other'
  ];

  // Phases for dropdown
  const phases = [
    'Pre-Construction',
    'Foundation',
    'Structure',
    'Finishing',
    'Final'
  ];

  useEffect(() => {
    fetchElements();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchElements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(API_URL);
      setElements(response.data);
    } catch (error) {
      setError('Failed to fetch elements');
      console.error('Error fetching elements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingElement) {
        await axios.put(`${API_URL}/${editingElement.element_id}`, formData);
        setSuccess('Element updated successfully');
      } else {
        await axios.post(API_URL, formData);
        setSuccess('Element created successfully');
      }
      fetchElements();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save element');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this element? This may affect related data.')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccess('Element deleted successfully');
        fetchElements();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete element');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (element) => {
    setEditingElement(element);
    setFormData({
      element_name: element.element_name,
      element_category: element.element_category || '',
      element_description: element.element_description || '',
      linetype: element.linetype || '',
      phase: element.phase || ''
    });
    setShowModal(true);
  };

  const handleView = (element) => {
    setViewingElement(element);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingElement(null);
    setFormData({
      element_name: '',
      element_category: '',
      element_description: '',
      linetype: '',
      phase: ''
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingElement(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredElements = elements.filter(element =>
    element.element_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.element_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.phase?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Elements Management</h1>
          <p className="text-gray-600">Manage construction elements and components</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Element</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <span>{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search elements by name, category, or phase..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Elements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Element Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <span className="ml-3 text-gray-500">Loading elements...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredElements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No elements found matching your search' : 'No elements found. Add your first element to get started.'}
                  </td>
                </tr>
              ) : (
                filteredElements.map((element) => (
                  <tr key={element.element_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{element.element_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {element.element_category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{element.linetype || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                        {element.phase || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {element.element_description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(element)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(element)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Element"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(element.element_id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Element"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingElement ? 'Edit Element' : 'Add New Element'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Element Name *
                </label>
                <input
                  type="text"
                  name="element_name"
                  value={formData.element_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Footings, Columns, Beams"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="element_category"
                    value={formData.element_category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line Type
                  </label>
                  <select
                    name="linetype"
                    value={formData.linetype}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Line Type</option>
                    {lineTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase
                </label>
                <select
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Phase</option>
                  {phases.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="element_description"
                  value={formData.element_description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter detailed description of the element"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingElement ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingElement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Element Details</h2>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Element Name</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{viewingElement.element_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 mt-1">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {viewingElement.element_category || 'N/A'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Line Type</label>
                  <p className="text-gray-900 mt-1">{viewingElement.linetype || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Phase</label>
                <p className="text-gray-900 mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                    {viewingElement.phase || 'N/A'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{viewingElement.element_description || 'No description available'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="font-medium">Element ID</label>
                  <p className="text-gray-900 mt-1">#{viewingElement.element_id}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseViewModal();
                  handleEdit(viewingElement);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementsManagement;
