import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle, Eye, Link2 } from 'lucide-react';
import axios from 'axios';

const ElementItemMappingManagement = () => {
  const [mappings, setMappings] = useState([]);
  const [elements, setElements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [viewingMapping, setViewingMapping] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    element_id: '',
    item_id: '',
    is_required: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const MAPPING_API = `${API_BASE_URL}/api/element_item_mapping`;
  const ELEMENTS_API = `${API_BASE_URL}/api/elements`;
  const ITEMS_API = `${API_BASE_URL}/api/items`;

  useEffect(() => {
    fetchMappings();
    fetchElements();
    fetchItems();
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

  const fetchMappings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(MAPPING_API);
      setMappings(response.data);
    } catch (error) {
      setError('Failed to fetch mappings');
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async () => {
    try {
      const response = await axios.get(ELEMENTS_API);
      setElements(response.data);
    } catch (error) {
      console.error('Error fetching elements:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(ITEMS_API);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.element_id || !formData.item_id) {
      setError('Please select both Element and Item');
      setLoading(false);
      return;
    }

    try {
      if (editingMapping) {
        await axios.put(`${MAPPING_API}/${editingMapping.mapping_id}`, formData);
        setSuccess('Mapping updated successfully');
      } else {
        // Check if mapping already exists
        const existingMapping = mappings.find(
          m => m.element_id === parseInt(formData.element_id) && 
               m.item_id === parseInt(formData.item_id)
        );
        
        if (existingMapping) {
          setError('This element-item mapping already exists');
          setLoading(false);
          return;
        }

        await axios.post(MAPPING_API, formData);
        setSuccess('Mapping created successfully');
      }
      fetchMappings();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this mapping? This will affect BOQ calculations.')) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        await axios.delete(`${MAPPING_API}/${id}`);
        setSuccess('Mapping deleted successfully');
        fetchMappings();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete mapping');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      element_id: mapping.element_id,
      item_id: mapping.item_id,
      is_required: mapping.is_required
    });
    setShowModal(true);
  };

  const handleView = (mapping) => {
    setViewingMapping(mapping);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMapping(null);
    setFormData({
      element_id: '',
      item_id: '',
      is_required: true
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingMapping(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getElementName = (elementId) => {
    const element = elements.find(e => e.element_id === elementId);
    return element ? element.element_name : 'Unknown';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : 'Unknown';
  };

  const getItemCategory = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_category : '';
  };

  const getElementCategory = (elementId) => {
    const element = elements.find(e => e.element_id === elementId);
    return element ? element.element_category : '';
  };

  const filteredMappings = mappings.filter(mapping => {
    const elementName = getElementName(mapping.element_id).toLowerCase();
    const itemName = getItemName(mapping.item_id).toLowerCase();
    const search = searchTerm.toLowerCase();
    return elementName.includes(search) || itemName.includes(search);
  });

  // Group mappings by element
  const groupedMappings = filteredMappings.reduce((acc, mapping) => {
    const elementName = getElementName(mapping.element_id);
    if (!acc[elementName]) {
      acc[elementName] = [];
    }
    acc[elementName].push(mapping);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Link2 className="h-6 w-6 mr-2 text-orange-500" />
            Element-Item Mapping
          </h1>
          <p className="text-gray-600">Define which items are used in each construction element</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Mapping</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Total Mappings</div>
          <div className="text-2xl font-bold text-gray-900">{mappings.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Elements Mapped</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(mappings.map(m => m.element_id)).size}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Items Used</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(mappings.map(m => m.item_id)).size}
          </div>
        </div>
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
            placeholder="Search by element or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Element
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Element Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
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
                      <span className="ml-3 text-gray-500">Loading mappings...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No mappings found matching your search' : 'No mappings found. Create your first element-item mapping to get started.'}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.mapping_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getElementName(mapping.element_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {getElementCategory(mapping.element_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getItemName(mapping.item_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                        {getItemCategory(mapping.item_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        mapping.is_required
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.is_required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(mapping)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Mapping"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.mapping_id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Mapping"
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

      {/* Grouped View Toggle */}
      {filteredMappings.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mappings by Element</h3>
          <div className="space-y-4">
            {Object.entries(groupedMappings).map(([elementName, elementMappings]) => (
              <div key={elementName} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{elementName}</h4>
                <div className="flex flex-wrap gap-2">
                  {elementMappings.map((mapping) => (
                    <span
                      key={mapping.mapping_id}
                      className={`px-3 py-1 text-sm rounded-full ${
                        mapping.is_required
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {getItemName(mapping.item_id)}
                      {mapping.is_required && ' *'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
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
                  Element *
                </label>
                <select
                  name="element_id"
                  value={formData.element_id}
                  onChange={handleInputChange}
                  required
                  disabled={editingMapping}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Element</option>
                  {elements
                    .filter(e => e.element_name)
                    .sort((a, b) => a.element_name.localeCompare(b.element_name))
                    .map((element) => (
                      <option key={element.element_id} value={element.element_id}>
                        {element.element_name} ({element.element_category})
                      </option>
                    ))}
                </select>
                {editingMapping && (
                  <p className="text-xs text-gray-500 mt-1">
                    Element cannot be changed. Delete and create new mapping to change element.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item *
                </label>
                <select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleInputChange}
                  required
                  disabled={editingMapping}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Item</option>
                  {items
                    .filter(i => i.item_name)
                    .sort((a, b) => a.item_name.localeCompare(b.item_name))
                    .map((item) => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name} ({item.item_category})
                      </option>
                    ))}
                </select>
                {editingMapping && (
                  <p className="text-xs text-gray-500 mt-1">
                    Item cannot be changed. Delete and create new mapping to change item.
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="is_required"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
                />
                <div>
                  <label htmlFor="is_required" className="block text-sm font-medium text-gray-900 cursor-pointer">
                    Required Item
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Mark this item as required for the element. Required items must be included in BOQ calculations.
                  </p>
                </div>
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
                  <span>{loading ? 'Saving...' : editingMapping ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mapping Details</h2>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                        <Link2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">Element → Item Mapping</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Element</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {getElementName(viewingMapping.element_id)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {getElementCategory(viewingMapping.element_id)}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Item</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {getItemName(viewingMapping.item_id)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      {getItemCategory(viewingMapping.item_id)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900 mt-1">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${
                    viewingMapping.is_required
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingMapping.is_required ? '✓ Required' : 'Optional'}
                  </span>
                </p>
                {viewingMapping.is_required && (
                  <p className="text-xs text-gray-600 mt-1">
                    This item is required for BOQ calculations
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t">
                <div>
                  <label className="font-medium">Mapping ID</label>
                  <p className="text-gray-900 mt-1">#{viewingMapping.mapping_id}</p>
                </div>
                <div>
                  <label className="font-medium">Element ID</label>
                  <p className="text-gray-900 mt-1">#{viewingMapping.element_id}</p>
                </div>
                <div>
                  <label className="font-medium">Item ID</label>
                  <p className="text-gray-900 mt-1">#{viewingMapping.item_id}</p>
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
                  handleEdit(viewingMapping);
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

export default ElementItemMappingManagement;
