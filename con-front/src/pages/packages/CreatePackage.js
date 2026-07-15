import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Package,
  IndianRupee,
  Calculator,
  Info
} from 'lucide-react';
import { packagesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CreatePackage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    package_name: '',
    description: '',
    tagline: '',
    total_price_per_sqft: '',
    gst_percentage: '18.00',
    is_popular: false,
    sort_order: 0
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePricing = () => {
    const totalPrice = parseFloat(formData.total_price_per_sqft) || 0;
    const gstPercentage = parseFloat(formData.gst_percentage) || 0;
    
    // Calculate base price from total price
    const basePrice = totalPrice / (1 + (gstPercentage / 100));
    const gstAmount = totalPrice - basePrice;
    
    return {
      basePrice: basePrice.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  };

  const pricing = calculatePricing();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.package_name.trim()) {
      toast.error('Package name is required');
      return;
    }

    if (!formData.total_price_per_sqft || parseFloat(formData.total_price_per_sqft) <= 0) {
      toast.error('Please enter a valid total price per sqft');
      return;
    }

    const gstPercentage = parseFloat(formData.gst_percentage);
    if (isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 50) {
      toast.error('GST percentage must be between 0 and 50');
      return;
    }

    try {
      setLoading(true);
      
      const packageData = {
        package_name: formData.package_name.trim(),
        total_price_per_sqft: parseFloat(formData.total_price_per_sqft),
        gst_percentage: gstPercentage,
        description: formData.description || null,
        tagline: formData.tagline || null,
        is_popular: formData.is_popular || false,
        sort_order: parseInt(formData.sort_order) || 0
      };

      const response = await packagesAPI.create(packageData);
      const newId = response?.data?.id || response?.id;
      toast.success('Package created! Now add items & choices.');
      if (newId) {
        navigate(`/packages/${newId}`);
      } else {
        navigate('/packages');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error(error.response?.data?.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/packages')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Package</h1>
          <p className="text-gray-600 mt-1">Add a new construction package to your offerings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Package Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="package_name" className="block text-sm font-medium text-gray-700 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                id="package_name"
                name="package_name"
                value={formData.package_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Premium Residential Package"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="total_price_per_sqft" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price per Sqft (₹) *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="total_price_per_sqft"
                    name="total_price_per_sqft"
                    value={formData.total_price_per_sqft}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="1800.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This is the final price including GST</p>
              </div>

              <div>
                <label htmlFor="gst_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                  GST Percentage (%)
                </label>
                <input
                  type="number"
                  id="gst_percentage"
                  name="gst_percentage"
                  value={formData.gst_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="18.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        {formData.total_price_per_sqft && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calculator className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing Breakdown</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Base Price/sqft</span>
                  <span className="text-lg font-bold text-blue-900">₹{pricing.basePrice}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Price before GST</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    GST Amount/sqft ({formData.gst_percentage}%)
                  </span>
                  <span className="text-lg font-bold text-green-900">₹{pricing.gstAmount}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Tax amount per sqft</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700">Total Price/sqft</span>
                  <span className="text-lg font-bold text-orange-900">₹{pricing.totalPrice}</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">Final price including GST</p>
              </div>
            </div>

            {/* Sample Calculation */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Sample Calculation</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>For a 2000 sqft construction:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-xs">
                  <div>Base Amount: ₹{(parseFloat(pricing.basePrice) * 2000).toLocaleString('en-IN')}</div>
                  <div>GST Amount: ₹{(parseFloat(pricing.gstAmount) * 2000).toLocaleString('en-IN')}</div>
                  <div className="font-semibold">Total: ₹{(parseFloat(pricing.totalPrice) * 2000).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/packages')}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Package
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePackage;