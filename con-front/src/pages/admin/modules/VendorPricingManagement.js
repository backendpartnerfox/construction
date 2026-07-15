import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle, DollarSign, Package, Filter, FileText } from 'lucide-react';
import axios from 'axios';

const VendorPricingManagement = () => {
  const [vendorPricing, setVendorPricing] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [tmtStandards, setTmtStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pricingType, setPricingType] = useState('product'); // 'product' or 'tmt'

  const [formData, setFormData] = useState({
    vendor_id: '',
    item_id: '',
    choice_option_id: '',
    tmt_standard_id: '',
    unit_price: '',
    gst_percentage: '18.00',
    discount_percentage: '0',
    min_order_quantity: '1',
    price_validity_start: '',
    price_validity_end: '',
    quotation_reference: '',
    is_approved: false,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const PRODUCT_PRICING_URL = `${API_BASE_URL}/api/vendor_pricing`;
  const TMT_PRICING_URL = `${API_BASE_URL}/api/sourcing_item_tmt_bar_pricing`;
  const VENDORS_URL = `${API_BASE_URL}/api/vendors`;
  const ITEMS_URL = `${API_BASE_URL}/api/items`;
  const ITEM_CHOICES_URL = `${API_BASE_URL}/api/item_choices`;
  const TMT_STANDARDS_URL = `${API_BASE_URL}/api/item_tmt_standards`;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [pricingType]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, itemsRes, itemChoicesRes, tmtStandardsRes] = await Promise.all([
        axios.get(VENDORS_URL),
        axios.get(ITEMS_URL),
        axios.get(ITEM_CHOICES_URL),
        axios.get(TMT_STANDARDS_URL)
      ]);
      
      // Handle API response format { success: true, data: [...] } or direct array
      const extractData = (response) => {
        const data = response.data.data || response.data;
        return Array.isArray(data) ? data : [];
      };
      
      setVendors(extractData(vendorsRes));
      setItems(extractData(itemsRes));
      setItemChoices(extractData(itemChoicesRes));
      setTmtStandards(extractData(tmtStandardsRes));
    } catch (error) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', error);
      // Set empty arrays on error
      setVendors([]);
      setItems([]);
      setItemChoices([]);
      setTmtStandards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const url = pricingType === 'tmt' ? TMT_PRICING_URL : PRODUCT_PRICING_URL;
      const response = await axios.get(url);
      
      // Handle API response format
      const data = response.data.data || response.data;
      setVendorPricing(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(`Failed to fetch ${pricingType} pricing data`);
      console.error('Error fetching pricing:', error);
      setVendorPricing([]); // Set empty array on error
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
      const url = pricingType === 'tmt' ? TMT_PRICING_URL : PRODUCT_PRICING_URL;
      const dataToSubmit = { ...formData };
      
      // Remove unused fields based on pricing type
      if (pricingType === 'product') {
        delete dataToSubmit.tmt_standard_id;
      }

      if (editingPricing) {
        const idField = pricingType === 'tmt' 
          ? 'sourcing_item_tmt_bar_pricing_id' 
          : 'product_pricing_id';
        await axios.put(`${url}/${editingPricing[idField]}`, dataToSubmit);
        setSuccess('Pricing updated successfully');
      } else {
        await axios.post(url, dataToSubmit);
        setSuccess('Pricing created successfully');
      }
      
      fetchPricing();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save pricing');
      console.error('Error saving pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pricing) => {
    setEditingPricing(pricing);
    const idField = pricingType === 'tmt' 
      ? 'sourcing_item_tmt_bar_pricing_id' 
      : 'product_pricing_id';
      
    setFormData({
      vendor_id: pricing.vendor_id,
      item_id: pricing.item_id,
      choice_option_id: pricing.choice_option_id || '',
      tmt_standard_id: pricing.tmt_standard_id || '',
      unit_price: pricing.unit_price,
      gst_percentage: pricing.gst_percentage || '18.00',
      discount_percentage: pricing.discount_percentage || '0',
      min_order_quantity: pricing.min_order_quantity || '1',
      price_validity_start: pricing.price_validity_start || '',
      price_validity_end: pricing.price_validity_end || '',
      quotation_reference: pricing.quotation_reference || '',
      is_approved: pricing.is_approved || false,
      is_active: pricing.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (pricing) => {
    if (window.confirm('Are you sure you want to delete this pricing?')) {
      try {
        const url = pricingType === 'tmt' ? TMT_PRICING_URL : PRODUCT_PRICING_URL;
        const idField = pricingType === 'tmt' 
          ? 'sourcing_item_tmt_bar_pricing_id' 
          : 'product_pricing_id';
        
        await axios.delete(`${url}/${pricing[idField]}`);
        setSuccess('Pricing deleted successfully');
        fetchPricing();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete pricing');
        console.error('Error deleting pricing:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPricing(null);
    setFormData({
      vendor_id: '',
      item_id: '',
      choice_option_id: '',
      tmt_standard_id: '',
      unit_price: '',
      gst_percentage: '18.00',
      discount_percentage: '0',
      min_order_quantity: '1',
      price_validity_start: '',
      price_validity_end: '',
      quotation_reference: '',
      is_approved: false,
      is_active: true
    });
    setError('');
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.vendor_id === vendorId);
    return vendor ? vendor.vendor_name : '-';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : '-';
  };

  const getItemChoiceName = (choiceId) => {
    const choice = itemChoices.find(c => c.choice_option_id === choiceId);
    return choice ? choice.display_name : '-';
  };

  const getTmtStandardDescription = (standardId) => {
    const standard = tmtStandards.find(s => s.tmt_standard_id === standardId);
    return standard ? `${standard.dia}mm x ${standard.length}m` : '-';
  };

  const calculateTotalPrice = (pricing) => {
    const unitPrice = parseFloat(pricing.unit_price) || 0;
    const discount = parseFloat(pricing.discount_percentage) || 0;
    const gst = parseFloat(pricing.gst_percentage) || 0;
    
    const discountedPrice = unitPrice * (1 - discount / 100);
    const totalPrice = discountedPrice * (1 + gst / 100);
    
    return totalPrice.toFixed(2);
  };

  const filteredPricing = vendorPricing.filter(pricing => {
    const matchesSearch = 
      getVendorName(pricing.vendor_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getItemName(pricing.item_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = !filterVendor || pricing.vendor_id === parseInt(filterVendor);
    const matchesItem = !filterItem || pricing.item_id === parseInt(filterItem);
    
    return matchesSearch && matchesVendor && matchesItem;
  });

  const filteredItemChoices = itemChoices.filter(choice => 
    choice.item_id === parseInt(formData.item_id)
  );

  const filteredTmtStandards = tmtStandards.filter(standard => 
    standard.tmt_item_id === parseInt(formData.item_id)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Pricing Management</h1>
          <p className="text-gray-600">Manage vendor pricing for products and materials</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Pricing</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pricing Type Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setPricingType('product')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              pricingType === 'product'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="inline h-4 w-4 mr-2" />
            Product Pricing
          </button>
          <button
            onClick={() => setPricingType('tmt')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              pricingType === 'tmt'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            TMT Bar Pricing
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search pricing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Vendors</option>
          {vendors.map(vendor => (
            <option key={vendor.vendor_id} value={vendor.vendor_id}>
              {vendor.vendor_name}
            </option>
          ))}
        </select>
        <select
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Items</option>
          {items.map(item => (
            <option key={item.item_id} value={item.item_id}>
              {item.item_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {pricingType === 'tmt' ? 'Specification' : 'Choice'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredPricing.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    No pricing data found
                  </td>
                </tr>
              ) : (
                filteredPricing.map((pricing) => (
                  <tr key={pricing.product_pricing_id || pricing.sourcing_item_tmt_bar_pricing_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getVendorName(pricing.vendor_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getItemName(pricing.item_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pricingType === 'tmt' 
                        ? getTmtStandardDescription(pricing.tmt_standard_id)
                        : getItemChoiceName(pricing.choice_option_id)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{parseFloat(pricing.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pricing.discount_percentage || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pricing.gst_percentage || 18}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{calculateTotalPrice(pricing)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pricing.min_order_quantity || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-1">
                        {pricing.is_active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Inactive</span>
                        )}
                        {pricing.is_approved && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Approved</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(pricing)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pricing)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                {editingPricing ? 'Edit Pricing' : 'Add Pricing'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Vendor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.vendor_id} value={vendor.vendor_id}>
                        {vendor.vendor_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item *
                  </label>
                  <select
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value, choice_option_id: '', tmt_standard_id: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Choice or TMT Standard */}
                {pricingType === 'product' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Choice *
                    </label>
                    <select
                      value={formData.choice_option_id}
                      onChange={(e) => setFormData({ ...formData, choice_option_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      disabled={!formData.item_id}
                    >
                      <option value="">Select Choice</option>
                      {filteredItemChoices.map(choice => (
                        <option key={choice.choice_option_id} value={choice.choice_option_id}>
                          {choice.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TMT Specification *
                    </label>
                    <select
                      value={formData.tmt_standard_id}
                      onChange={(e) => setFormData({ ...formData, tmt_standard_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      disabled={!formData.item_id}
                    >
                      <option value="">Select Specification</option>
                      {filteredTmtStandards.map(standard => (
                        <option key={standard.tmt_standard_id} value={standard.tmt_standard_id}>
                          {standard.dia}mm x {standard.length}m (Weight: {standard.weight_of_full_bar}kg)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* GST Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Min Order Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_quantity}
                    onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Validity Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.price_validity_start}
                    onChange={(e) => setFormData({ ...formData, price_validity_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Validity End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.price_validity_end}
                    onChange={(e) => setFormData({ ...formData, price_validity_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Quotation Reference */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quotation Reference
                  </label>
                  <input
                    type="text"
                    value={formData.quotation_reference}
                    onChange={(e) => setFormData({ ...formData, quotation_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Checkboxes */}
                <div className="col-span-2 flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Approved</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Price Preview */}
              {formData.unit_price && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Price Preview</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Base Price:</span>
                      <span className="ml-2 font-medium">₹{parseFloat(formData.unit_price || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">After Discount:</span>
                      <span className="ml-2 font-medium">
                        ₹{(parseFloat(formData.unit_price || 0) * (1 - parseFloat(formData.discount_percentage || 0) / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">GST Amount:</span>
                      <span className="ml-2 font-medium">
                        ₹{(parseFloat(formData.unit_price || 0) * (1 - parseFloat(formData.discount_percentage || 0) / 100) * parseFloat(formData.gst_percentage || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Price:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        ₹{(parseFloat(formData.unit_price || 0) * (1 - parseFloat(formData.discount_percentage || 0) / 100) * (1 + parseFloat(formData.gst_percentage || 0) / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  <span>{editingPricing ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPricingManagement;
