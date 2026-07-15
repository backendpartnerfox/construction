import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, X, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [items, setItems] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageMappings, setPackageMappings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    package_name: '',
    description: '',
    tagline: '',
    base_price_per_sqft: '',
    gst_percentage: '18.00',
    is_popular: false,
    sort_order: 0
  });

  const [mappingFormData, setMappingFormData] = useState({
    item_id: '',
    item_choice_id: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api`;

  useEffect(() => {
    fetchPackages();
    fetchItems();
    fetchItemChoices();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/packages`);
      
      // Handle different response formats
      let packagesData = [];
      if (Array.isArray(response.data)) {
        packagesData = response.data;
      } else if (response.data && Array.isArray(response.data.packages)) {
        packagesData = response.data.packages;
      } else if (response.data && Array.isArray(response.data.data)) {
        packagesData = response.data.data;
      }
      
      setPackages(packagesData);
    } catch (error) {
      setError('Failed to fetch packages');
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/items`);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    }
  };

  const fetchItemChoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/item_choices`);
      // Handle both formats: raw array OR { success, data }
      const choicesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data);
      setItemChoices(Array.isArray(choicesData) ? choicesData : []);
    } catch (error) {
      console.error('Error fetching item choices:', error);
      setItemChoices([]);
    }
  };

  const fetchPackageMappings = async (packageId) => {
    try {
      // Use the correct path param endpoint, not query param
      const response = await axios.get(`${API_URL}/packages/${packageId}/items`);
      // Handle both formats: raw array OR { success, data }
      const mappingsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data);
      setPackageMappings(Array.isArray(mappingsData) ? mappingsData : []);
    } catch (error) {
      console.error('Error fetching package mappings:', error);
      setError('Failed to fetch package items');
      setPackageMappings([]);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        package_name: pkg.package_name,
        description: pkg.description || '',
        tagline: pkg.tagline || '',
        base_price_per_sqft: pkg.base_price_per_sqft || '',
        gst_percentage: pkg.gst_percentage || '18.00',
        is_popular: pkg.is_popular || false,
        sort_order: pkg.sort_order || 0
      });
    } else {
      setEditingPackage(null);
      setFormData({
        package_name: '',
        description: '',
        tagline: '',
        base_price_per_sqft: '',
        gst_percentage: '18.00',
        is_popular: false,
        sort_order: 0
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
  };

  const handleOpenMappingModal = (pkg) => {
    setSelectedPackage(pkg);
    fetchPackageMappings(pkg.id);
    setMappingFormData({
      item_id: '',
      item_choice_id: ''
    });
    setShowMappingModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseMappingModal = () => {
    setShowMappingModal(false);
    setSelectedPackage(null);
    setPackageMappings([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMappingInputChange = (e) => {
    const { name, value } = e.target;
    setMappingFormData({
      ...mappingFormData,
      [name]: value
    });

    if (name === 'item_id') {
      setMappingFormData({
        item_id: value,
        item_choice_id: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.package_name || !formData.package_name.trim()) {
      setError('Package name is required');
      setLoading(false);
      return;
    }
    
    if (!formData.base_price_per_sqft || parseFloat(formData.base_price_per_sqft) <= 0) {
      setError('Valid base price per sqft is required');
      setLoading(false);
      return;
    }
    
    if (!formData.gst_percentage || parseFloat(formData.gst_percentage) < 0) {
      setError('Valid GST percentage is required');
      setLoading(false);
      return;
    }

    try {
      // ✅ Calculate total_price_per_sqft from base_price and gst
      // This matches your database schema where total_price is the INPUT
      const base_price = parseFloat(formData.base_price_per_sqft);
      const gst_pct = parseFloat(formData.gst_percentage);
      const total_price = parseFloat((base_price * (1 + gst_pct / 100)).toFixed(2));
      
      const payload = {
        package_name: formData.package_name.trim(),
        total_price_per_sqft: total_price,
        gst_percentage: gst_pct,
        description: formData.description || null,
        tagline: formData.tagline || null,
        is_popular: formData.is_popular || false,
        sort_order: parseInt(formData.sort_order) || 0
      };
      
      console.log('=== Package Submit Debug ===');
      console.log('Editing Package:', editingPackage);
      console.log('Form Data:', formData);
      console.log('Calculated Total Price:', total_price);
      console.log('Payload to send:', payload);
      console.log('API URL:', editingPackage ? `${API_URL}/packages/${editingPackage.id}` : `${API_URL}/packages`);
      
      let response;
      if (editingPackage) {
        console.log('Making PUT request...');
        response = await axios.put(`${API_URL}/packages/${editingPackage.id}`, payload);
        console.log('PUT Response:', response.data);
        setSuccess('Package updated successfully');
      } else {
        console.log('Making POST request...');
        response = await axios.post(`${API_URL}/packages`, payload);
        console.log('POST Response:', response.data);
        setSuccess('Package created successfully');
      }
      
      await fetchPackages();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('=== Error Details ===');
      console.error('Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Data:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Headers:', error.response?.headers);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        error.message ||
        'Failed to save package';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/packages/${id}`);
        setSuccess('Package deleted successfully');
        fetchPackages();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete package');
        console.error('Error deleting package:', error);
        setTimeout(() => setError(''), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddMapping = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!mappingFormData.item_id || !mappingFormData.item_choice_id) {
      setError('Please select both an item and a choice');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/packages/${selectedPackage.id}/items`, {
        item_id: parseInt(mappingFormData.item_id),
        item_choice_id: parseInt(mappingFormData.item_choice_id)
      });
      setSuccess('Item added to package successfully');
      fetchPackageMappings(selectedPackage.id);
      setMappingFormData({
        item_id: '',
        item_choice_id: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add item to package');
      console.error('Error adding mapping:', error);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (window.confirm('Are you sure you want to remove this item from the package?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/packages/${selectedPackage.id}/items/${mappingId}`);
        setSuccess('Item removed from package successfully');
        fetchPackageMappings(selectedPackage.id);
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to remove item from package');
        console.error('Error deleting mapping:', error);
        setTimeout(() => setError(''), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const getFilteredItemChoices = () => {
    if (!mappingFormData.item_id) return [];
    return itemChoices.filter(choice => choice.item_id === parseInt(mappingFormData.item_id) && choice.is_active !== false);
  };

  // Get deduplicated items list (items table has duplicates)
  const getUniqueItems = () => {
    const seen = new Set();
    return items.filter(item => {
      if (item.item_name === 'sgdgfdfg') return false; // skip junk
      const key = `${item.item_name}-${item.item_category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => {
      if (a.item_category < b.item_category) return -1;
      if (a.item_category > b.item_category) return 1;
      return a.item_name.localeCompare(b.item_name);
    });
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : 'Unknown Item';
  };

  const getItemCategory = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_category : '';
  };

  const getChoiceName = (choiceId) => {
    const choice = itemChoices.find(c => c.choice_option_id === choiceId);
    return choice ? choice.display_name : 'Unknown Choice';
  };

  const calculateTotalPrice = () => {
    if (formData.base_price_per_sqft && formData.gst_percentage) {
      const base = parseFloat(formData.base_price_per_sqft);
      const gst = parseFloat(formData.gst_percentage);
      return (base * (1 + gst / 100)).toFixed(2);
    }
    return '0.00';
  };

  const calculateGstAmount = () => {
    if (formData.base_price_per_sqft && formData.gst_percentage) {
      const base = parseFloat(formData.base_price_per_sqft);
      const gst = parseFloat(formData.gst_percentage);
      return (base * gst / 100).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Packages Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Package
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Price/sqft
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                GST %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                GST Amount/sqft
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Price/sqft
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Loading packages...
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No packages found. Click "Add Package" to create one.
                </td>
              </tr>
            ) : packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{pkg.package_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{parseFloat(pkg.base_price_per_sqft).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {parseFloat(pkg.gst_percentage).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{parseFloat(pkg.gst_amount_per_sqft).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                  ₹{parseFloat(pkg.total_price_per_sqft).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(pkg.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenMappingModal(pkg)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Manage Items"
                    >
                      <Package size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Modal Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  <span className="text-sm">{success}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  name="package_name"
                  value={formData.package_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="e.g. Quality-assured, no compromise"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List key materials & specs included in this package"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price per sqft *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="base_price_per_sqft"
                      value={formData.base_price_per_sqft}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Percentage *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="gst_percentage"
                      value={formData.gst_percentage}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_popular"
                      checked={formData.is_popular}
                      onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                  </label>
                </div>
              </div>

              {formData.base_price_per_sqft && formData.gst_percentage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Price Breakdown:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">₹{parseFloat(formData.base_price_per_sqft).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST Amount:</span>
                      <span className="font-medium">₹{calculateGstAmount()}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="text-sm font-bold text-gray-900">Total Price per sqft:</span>
                      <span className="text-sm font-bold text-blue-600">₹{calculateTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Items Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Manage Package Items - {selectedPackage?.package_name}
              </h3>
              <button
                onClick={handleCloseMappingModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            {/* Add Item Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Add Item to Package</h4>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select
                    name="item_id"
                    value={mappingFormData.item_id}
                    onChange={handleMappingInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Item</option>
                    {getUniqueItems().map((item) => (
                      <option key={item.item_id} value={item.item_id}>
                        [{item.item_category}] {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Choice</label>
                  <select
                    name="item_choice_id"
                    value={mappingFormData.item_choice_id}
                    onChange={handleMappingInputChange}
                    disabled={!mappingFormData.item_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Choice</option>
                    {getFilteredItemChoices().map((choice) => (
                      <option key={choice.choice_option_id} value={choice.choice_option_id}>
                        {choice.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                  <button
                    onClick={handleAddMapping}
                    disabled={!mappingFormData.item_id || !mappingFormData.item_choice_id || loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Current Package Items */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Current Package Items ({packageMappings.length})
              </h4>
              
              {packageMappings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items added to this package yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {packageMappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{mapping.item_name || getItemName(mapping.item_id)}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{mapping.item_category || getItemCategory(mapping.item_id)}</span>
                        </div>
                        <div className="text-sm text-blue-600">
                          {mapping.choice_name || getChoiceName(mapping.item_choice_id)}
                          {mapping.brand && <span className="text-gray-400 ml-1">({mapping.brand})</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseMappingModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesManagement;
