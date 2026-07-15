import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ItemChoicesManagement = () => {
  const [itemChoices, setItemChoices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    is_premium: false,
    package: 0,
    is_default: false,
    is_active: true,
    // Pricing
    base_price: '',
    unit_of_measurement: '',
    gst_percentage: 18,
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api/item_choices`;
  const ITEMS_API_URL = `${API_BASE_URL}/api/items`;

  useEffect(() => {
    fetchItemChoices();
    fetchItems();
  }, []);

  const fetchItemChoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      console.log('API Response:', response.data);
      
      // Backend returns { success: true, data: [...] }
      const choices = response.data.data || response.data;
      
      // Ensure it's an array
      setItemChoices(Array.isArray(choices) ? choices : []);
    } catch (error) {
      console.error('Error fetching item choices:', error);
      setError('Failed to fetch item choices');
      setItemChoices([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(ITEMS_API_URL);
      // Ensure response.data is an array
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]); // Set to empty array on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const PRICING_URL = `${API_BASE_URL}/api/item_choice_pricing`;
    // Separate choice fields from pricing fields
    const { base_price, unit_of_measurement, gst_percentage, ...choicePayload } = formData;
    const hasPrice = base_price !== '' && base_price != null && !isNaN(Number(base_price));

    try {
      let choiceId;
      if (editingChoice) {
        await axios.put(`${API_URL}/${editingChoice.choice_option_id}`, choicePayload);
        choiceId = editingChoice.choice_option_id;
      } else {
        const res = await axios.post(API_URL, choicePayload);
        // Response may be { success, data } or a plain row
        choiceId = res.data?.choice_option_id || res.data?.data?.choice_option_id;
      }

      // Save pricing if provided
      if (choiceId && hasPrice) {
        if (!unit_of_measurement) {
          throw new Error('Please enter a unit (e.g. Pc, meter, cum) when setting a price.');
        }
        const pricingBody = {
          choice_option_id: choiceId,
          base_price: Number(base_price),
          unit_of_measurement,
          gst_percentage: Number(gst_percentage) || 18,
          is_active: true,
        };
        // If editing and choice already had pricing (has price_pricing_id), update; else create new
        const existingPricingId = editingChoice?.price_pricing_id;
        if (existingPricingId) {
          await axios.put(`${PRICING_URL}/${existingPricingId}`, pricingBody);
        } else {
          await axios.post(PRICING_URL, pricingBody);
        }
      }

      setSuccess(editingChoice ? 'Item choice updated successfully' : 'Item choice created successfully');
      fetchItemChoices();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save item choice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item choice?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccess('Item choice deleted successfully');
        fetchItemChoices();
      } catch (error) {
        setError('Failed to delete item choice');
      }
    }
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
      is_premium: choice.is_premium || false,
      package: choice.package || 0,
      is_default: choice.is_default || false,
      is_active: choice.is_active,
      base_price: choice.base_price ?? '',
      unit_of_measurement: choice.price_unit || '',
      gst_percentage: choice.price_gst_percentage ?? 18,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
      is_premium: false,
      package: 0,
      is_default: false,
      is_active: true,
      base_price: '',
      unit_of_measurement: '',
      gst_percentage: 18,
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const filteredChoices = itemChoices.filter(choice =>
    choice.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    choice.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : 'Unknown';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Choices Management</h1>
          <p className="text-gray-600">Manage brands, series, and variants for items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Choice</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search item choices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Choices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand / Series
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (incl. GST)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
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
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredChoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No item choices found
                  </td>
                </tr>
              ) : (
                filteredChoices.map((choice) => (
                  <tr key={choice.choice_option_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{choice.display_name}</div>
                      <div className="text-xs text-gray-500">{choice.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getItemName(choice.item_id)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{choice.brand}</div>
                      <div className="text-xs text-gray-500">{choice.series} {choice.sub_series}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{choice.item_material_type}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {choice.total_price != null ? (
                        <>
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{Number(choice.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            base ₹{Number(choice.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {choice.price_gst_percentage != null && ` + ${Number(choice.price_gst_percentage).toFixed(0)}% GST`}
                          </div>
                          {choice.price_unit && (
                            <div className="text-[11px] text-gray-400">per {choice.price_unit}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">no price</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {choice.is_premium && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            Premium
                          </span>
                        )}
                        {choice.is_default && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        choice.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {choice.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(choice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(choice.choice_option_id)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingChoice ? 'Edit Item Choice' : 'Add New Item Choice'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item *
                  </label>
                  <select
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  <input
                    type="text"
                    name="item_material_type"
                    value={formData.item_material_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Series
                  </label>
                  <input
                    type="text"
                    name="series"
                    value={formData.series}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Series
                  </label>
                  <input
                    type="text"
                    name="sub_series"
                    value={formData.sub_series}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Pricing section */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="text-sm font-semibold text-gray-700 mb-2">Pricing (optional)</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      placeholder="e.g. 26.33"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-[11px] text-gray-500 mt-0.5">Excluding GST</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      name="unit_of_measurement"
                      value={formData.unit_of_measurement}
                      onChange={handleInputChange}
                      placeholder="Pc / meter / bag / cum / kg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-[11px] text-gray-500 mt-0.5">Required when a price is set</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="gst_percentage"
                      value={formData.gst_percentage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {formData.base_price !== '' && !isNaN(Number(formData.base_price)) && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Total: ₹{(Number(formData.base_price) * (1 + Number(formData.gst_percentage || 0) / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_premium"
                    checked={formData.is_premium}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Premium
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Default
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
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
