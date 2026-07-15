import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Tag } from 'lucide-react';

const ItemChoicesManagement = () => {
  const [choices, setChoices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);
  const [formData, setFormData] = useState({
    item_id: '',
    item_material_type: '',
    brand: '',
    series: '',
    sub_series: '',
    model: '',
    code: '',
    display_name: '',
    description: '',
    image_url: '',
    is_premium: false,
    package: 0,
    is_default: false,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchChoices();
    fetchItems();
  }, []);

  const fetchChoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/item_choices`);
      const result = await response.json();
      console.log('API Response:', result);
      
      // Backend returns { success: true, data: [...] }
      const data = result.data || result;
      
      // Ensure data is an array
      setChoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching item choices:', error);
      setChoices([]); // Set to empty array on error
      alert('Failed to fetch item choices');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/active`);
      const data = await response.json();
      // Ensure data is an array
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]); // Set to empty array on error
    }
  };

  const handleAdd = () => {
    setEditingChoice(null);
    setFormData({
      item_id: '',
      item_material_type: '',
      brand: '',
      series: '',
      sub_series: '',
      model: '',
      code: '',
      display_name: '',
      description: '',
      image_url: '',
      is_premium: false,
      package: 0,
      is_default: false,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (choice) => {
    setEditingChoice(choice);
    setFormData({
      item_id: choice.item_id || '',
      item_material_type: choice.item_material_type || '',
      brand: choice.brand || '',
      series: choice.series || '',
      sub_series: choice.sub_series || '',
      model: choice.model || '',
      code: choice.code || '',
      display_name: choice.display_name || '',
      description: choice.description || '',
      image_url: choice.image_url || '',
      is_premium: choice.is_premium || false,
      package: choice.package || 0,
      is_default: choice.is_default || false,
      is_active: choice.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item choice?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/item_choices/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Item choice deleted successfully');
        fetchChoices();
      } else {
        alert('Failed to delete item choice');
      }
    } catch (error) {
      console.error('Error deleting item choice:', error);
      alert('Failed to delete item choice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingChoice
        ? `${API_BASE_URL}/api/item_choices/${editingChoice.choice_option_id}`
        : `${API_BASE_URL}/api/item_choices`;

      const method = editingChoice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Item choice ${editingChoice ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchChoices();
      } else {
        alert(`Failed to ${editingChoice ? 'update' : 'create'} item choice`);
      }
    } catch (error) {
      console.error('Error saving item choice:', error);
      alert(`Failed to ${editingChoice ? 'update' : 'create'} item choice`);
    }
  };

  const filteredChoices = choices.filter(choice =>
    choice.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    choice.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    choice.item_material_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="h-8 w-8 text-orange-600" />
          Item Choices Management
        </h1>
        <p className="text-gray-600 mt-1">Manage item brands, specifications, and options</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search item choices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Choice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Series
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Premium
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChoices.map((choice) => (
              <tr key={choice.choice_option_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {choice.display_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {choice.brand}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {choice.item_material_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {choice.series}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {choice.is_premium && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      Premium
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    choice.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {choice.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(choice)}
                    className="text-orange-600 hover:text-orange-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(choice.choice_option_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingChoice ? 'Edit Item Choice' : 'Add New Item Choice'}
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
                    Item *
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
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Type
                    </label>
                    <input
                      type="text"
                      value={formData.item_material_type}
                      onChange={(e) => setFormData({ ...formData, item_material_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Series
                    </label>
                    <input
                      type="text"
                      value={formData.series}
                      onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Series
                    </label>
                    <input
                      type="text"
                      value={formData.sub_series}
                      onChange={(e) => setFormData({ ...formData, sub_series: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_premium}
                      onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Premium
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Default
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingChoice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemChoicesManagement;
