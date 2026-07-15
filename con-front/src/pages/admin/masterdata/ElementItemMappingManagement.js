import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, GitBranch, Loader } from 'lucide-react';

const ElementItemMappingManagement = () => {
  const [mappings, setMappings] = useState([]);
  const [elements, setElements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState({
    element_id: '',
    item_id: '',
    is_required: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchMappings();
    fetchElements();
    fetchItems();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/element_item_mapping`);
      if (!response.ok) throw new Error('Failed to fetch mappings');
      const data = await response.json();
      setMappings(data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      alert('Failed to fetch element-item mappings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/elements`);
      if (!response.ok) throw new Error('Failed to fetch elements');
      const data = await response.json();
      setElements(data);
    } catch (error) {
      console.error('Error fetching elements:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      // Filter only active items
      const activeItems = data.filter(item => item.is_active !== false);
      setItems(activeItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleAdd = () => {
    setEditingMapping(null);
    setFormData({
      element_id: '',
      item_id: '',
      is_required: true
    });
    setShowModal(true);
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      element_id: mapping.element_id || '',
      item_id: mapping.item_id || '',
      is_required: mapping.is_required !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/element_item_mapping/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Mapping deleted successfully');
        fetchMappings();
      } else {
        const error = await response.json();
        alert('Failed to delete mapping: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingMapping
        ? `${API_BASE_URL}/api/element_item_mapping/${editingMapping.mapping_id}`
        : `${API_BASE_URL}/api/element_item_mapping`;

      const method = editingMapping ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Mapping ${editingMapping ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchMappings();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingMapping ? 'update' : 'create'} mapping: ` + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert(`Failed to ${editingMapping ? 'update' : 'create'} mapping: ` + error.message);
    }
  };

  const getElementName = (elementId) => {
    const element = elements.find(e => e.element_id === elementId);
    return element ? element.element_name : 'Unknown';
  };

  const getElementCategory = (elementId) => {
    const element = elements.find(e => e.element_id === elementId);
    return element ? element.element_category : '';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : 'Unknown';
  };

  const getItemUnit = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_unit : '';
  };

  const filteredMappings = mappings.filter(mapping => {
    const elementName = getElementName(mapping.element_id).toLowerCase();
    const itemName = getItemName(mapping.item_id).toLowerCase();
    const elementCategory = getElementCategory(mapping.element_id).toLowerCase();
    const search = searchTerm.toLowerCase();
    return elementName.includes(search) || 
           itemName.includes(search) || 
           elementCategory.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-12 w-12 text-orange-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="h-8 w-8 text-orange-600" />
          Element-Item Mapping
        </h1>
        <p className="text-gray-600 mt-1">Map construction items to structural elements</p>
        <p className="text-sm text-gray-500 mt-2">
          Define which construction materials (items) are required for each structural element
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by element, item, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Mapping
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Unit
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
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No mappings found matching your search' : 'No element-item mappings found. Click "Add Mapping" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.mapping_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getElementName(mapping.element_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getElementCategory(mapping.element_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getItemName(mapping.item_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getItemUnit(mapping.item_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mapping.is_required
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.is_required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(mapping)}
                        className="text-orange-600 hover:text-orange-900 mr-4 transition-colors"
                        title="Edit mapping"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mapping.mapping_id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete mapping"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Mappings</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{mappings.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Elements Mapped</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {new Set(mappings.map(m => m.element_id)).size}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Items Mapped</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {new Set(mappings.map(m => m.item_id)).size}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.element_id}
                    onChange={(e) => setFormData({ ...formData, element_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Element</option>
                    {elements.map(element => (
                      <option key={element.element_id} value={element.element_id}>
                        {element.element_name} ({element.element_category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name} ({item.item_unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">
                    Required Item
                    <span className="block text-xs text-gray-500">This item is mandatory for the element</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingMapping ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementItemMappingManagement;
