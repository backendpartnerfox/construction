import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';

const AddMaterialCostModal = ({ isOpen, onClose, projectId, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_id: projectId,
    boq_id: '',
    item_id: '',
    vendor_id: '',
    boq_quantity: '',
    unit: '',
    unit_price: '',
    discount_percentage: 0,
    gst_percentage: 18,
    quotation_reference: '',
    pricing_validity_date: '',
    created_by: 1
  });

  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchVendors();
    }
  }, [isOpen]);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      setItems(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vendors`);
      setVendors(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.item_id) newErrors.item_id = 'Item is required';
    if (!formData.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData.boq_quantity || formData.boq_quantity <= 0) newErrors.boq_quantity = 'Valid quantity is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.unit_price || formData.unit_price <= 0) newErrors.unit_price = 'Valid unit price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const quantity = parseFloat(formData.boq_quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const discount = parseFloat(formData.discount_percentage) || 0;
    const gst = parseFloat(formData.gst_percentage) || 0;

    const unitPriceAfterDiscount = unitPrice - (unitPrice * discount / 100);
    const subtotal = quantity * unitPriceAfterDiscount;
    const gstAmount = subtotal * (gst / 100);
    const total = subtotal + gstAmount;

    return {
      unitPriceAfterDiscount: unitPriceAfterDiscount.toFixed(2),
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/project-costing/materials`, formData);
      
      if (response.data.success) {
        alert('Material cost added successfully!');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          project_id: projectId,
          boq_id: '',
          item_id: '',
          vendor_id: '',
          boq_quantity: '',
          unit: '',
          unit_price: '',
          discount_percentage: 0,
          gst_percentage: 18,
          quotation_reference: '',
          pricing_validity_date: '',
          created_by: 1
        });
      }
    } catch (error) {
      console.error('Error adding material cost:', error);
      alert(error.response?.data?.error || 'Failed to add material cost');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Plus className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Material Cost</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Item and Vendor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item <span className="text-red-500">*</span>
                </label>
                <select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.item_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name}
                    </option>
                  ))}
                </select>
                {errors.item_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.item_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.vendor_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.vendor_name}
                    </option>
                  ))}
                </select>
                {errors.vendor_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.vendor_id}</p>
                )}
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="boq_quantity"
                  value={formData.boq_quantity}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.boq_quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                />
                {errors.boq_quantity && (
                  <p className="mt-1 text-sm text-red-500">{errors.boq_quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., kg, cum, sqft"
                />
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.unit_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-500">{errors.unit_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST (%)
                </label>
                <input
                  type="number"
                  name="gst_percentage"
                  value={formData.gst_percentage}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="18"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quotation Reference
                </label>
                <input
                  type="text"
                  name="quotation_reference"
                  value={formData.quotation_reference}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Q-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Valid Until
                </label>
                <input
                  type="date"
                  name="pricing_validity_date"
                  value={formData.pricing_validity_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Cost Calculation Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Calculation</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit Price after Discount:</span>
                  <span className="font-medium text-gray-900">₹{totals.unitPriceAfterDiscount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST Amount:</span>
                  <span className="font-medium text-gray-900">₹{totals.gstAmount}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-orange-600 text-lg">₹{totals.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Material Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialCostModal;
