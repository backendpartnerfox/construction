import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Package,
  IndianRupee,
  TrendingUp,
  Calendar,
  Calculator,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { packagesAPI } from '../../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packageItems, setPackageItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allChoices, setAllChoices] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addForm, setAddForm] = useState({ item_id: '', item_choice_id: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());  // start with all collapsed

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };
  const expandAll = () => setExpandedCategories(new Set(Object.keys(groupedItems)));
  const collapseAll = () => setExpandedCategories(new Set());

  useEffect(() => {
    if (id) {
      fetchPackageDetails();
      fetchPackageItems();
      fetchAllItems();
      fetchAllChoices();
    }
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await packagesAPI.getById(id);
      setPackageData(response.data);
    } catch (error) {
      console.error('Error fetching package details:', error);
      toast.error('Failed to fetch package details');
      navigate('/packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageItems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/packages/${id}/items`);
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setPackageItems(data);
    } catch (error) {
      console.error('Error fetching package items:', error);
      setPackageItems([]);
    }
  };

  const fetchAllItems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/items`);
      const data = Array.isArray(response.data) ? response.data : [];
      // Deduplicate
      const seen = new Set();
      const unique = data.filter(item => {
        if (!item.item_name || item.item_name === 'sgdgfdfg') return false;
        const key = `${item.item_name}-${item.item_category}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => (a.item_category || '').localeCompare(b.item_category || '') || a.item_name.localeCompare(b.item_name));
      setAllItems(unique);
    } catch (e) { setAllItems([]); }
  };

  const fetchAllChoices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/item_choices`);
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAllChoices(data);
    } catch (e) { setAllChoices([]); }
  };

  const handleAddItem = async () => {
    if (!addForm.item_id || !addForm.item_choice_id) {
      toast.error('Please select both an item and a choice');
      return;
    }
    setAddLoading(true);
    try {
      await axios.post(`${API_BASE}/api/packages/${id}/items`, {
        item_id: parseInt(addForm.item_id),
        item_choice_id: parseInt(addForm.item_choice_id)
      });
      toast.success('Item added to package');
      setAddForm({ item_id: '', item_choice_id: '' });
      setShowAddItem(false);
      fetchPackageItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveItem = async (mappingId, itemName) => {
    if (!window.confirm(`Remove "${itemName}" from this package?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/packages/${id}/items/${mappingId}`);
      toast.success('Item removed');
      fetchPackageItems();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const getFilteredChoices = () => {
    if (!addForm.item_id) return [];
    return allChoices.filter(c => c.item_id === parseInt(addForm.item_id) && c.is_active !== false);
  };

  // Group items by category for display
  const groupedItems = packageItems.reduce((acc, item) => {
    const cat = item.item_category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculateSampleCost = (sqft) => {
    if (!packageData) return 0;
    return packageData.total_price_per_sqft * sqft;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Package not found</h3>
          <p className="text-gray-600 mb-6">The package you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/packages')}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
          >
            Back to Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/packages')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{packageData.package_name}</h1>
              <p className="text-gray-600 mt-1">Construction Package Details</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/packages/${id}/edit`)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Package
        </button>
      </div>

      {/* Package Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(packageData.total_price_per_sqft)}
                </p>
                <p className="text-sm text-orange-600">Total Price/sqft</p>
              </div>
            </div>
            <p className="text-xs text-orange-700 mt-2">Final price including all taxes</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(packageData.base_price_per_sqft)}
                </p>
                <p className="text-sm text-blue-600">Base Price/sqft</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">Price before taxes</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(packageData.gst_amount_per_sqft)}
                </p>
                <p className="text-sm text-green-600">GST Amount/sqft</p>
              </div>
            </div>
            <p className="text-xs text-green-700 mt-2">GST @ {packageData.gst_percentage}%</p>
          </div>
        </div>

        {/* GST Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">GST Rate Applied:</span>
            <span className="text-lg font-bold text-gray-900">{packageData.gst_percentage}%</span>
          </div>
        </div>
      </div>

      {/* Sample Calculations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Cost Calculations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1000, 2000, 3000].map((sqft) => (
            <div key={sqft} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{sqft.toLocaleString()} sqft</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {formatCurrency(calculateSampleCost(sqft))}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Cost</p>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(packageData.base_price_per_sqft * sqft)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(packageData.gst_amount_per_sqft * sqft)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-orange-600">
                    {formatCurrency(calculateSampleCost(sqft))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Items & Choices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Package Items & Choices</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {packageItems.length} items
            </span>
          </div>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {showAddItem ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showAddItem ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {/* Add Item Form */}
        {showAddItem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-3">Add item to {packageData.package_name} package</p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                <select
                  value={addForm.item_id}
                  onChange={(e) => setAddForm({ item_id: e.target.value, item_choice_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select item...</option>
                  {allItems.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                      [{item.item_category}] {item.item_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Brand / Choice</label>
                <select
                  value={addForm.item_choice_id}
                  onChange={(e) => setAddForm({ ...addForm, item_choice_id: e.target.value })}
                  disabled={!addForm.item_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                >
                  <option value="">{addForm.item_id ? 'Select choice...' : 'Select item first'}</option>
                  {getFilteredChoices().map(c => {
                    const priceLabel = c.total_price != null
                      ? `— ₹${Number(c.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${c.price_unit ? '/' + c.price_unit : ''}`
                      : '— no price';
                    return (
                      <option key={c.choice_option_id} value={c.choice_option_id}>
                        {c.display_name} {c.brand ? `(${c.brand})` : ''} {priceLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleAddItem}
                  disabled={addLoading || !addForm.item_id || !addForm.item_choice_id}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List grouped by category */}
        {packageItems.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <ShoppingBag className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No items added yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Item" to link items & choices to this package</p>
          </div>
        ) : (
          <div>
            {/* Expand / Collapse controls */}
            <div className="flex items-center justify-end gap-2 mb-3 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Collapse all
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(groupedItems).sort((a, b) => a[0].localeCompare(b[0])).map(([category, items]) => {
                const isOpen = expandedCategories.has(category);
                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                      <Tag className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex-1">
                        {category}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-2 space-y-1.5 bg-white">
                        {items.map((mapping) => (
                          <div
                            key={mapping.id}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-md hover:bg-white hover:border-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{mapping.item_name}</p>
                                <p className="text-xs text-blue-600 truncate">
                                  {mapping.choice_name}
                                  {mapping.brand && <span className="text-gray-400 ml-1">• {mapping.brand}</span>}
                                  {mapping.series && <span className="text-gray-400 ml-1">• {mapping.series}</span>}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(mapping.id, mapping.item_name)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                              title="Remove from package"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Package Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Package Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {packageData.description && (
              <div>
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-gray-600 mt-1 text-sm">{packageData.description}</p>
              </div>
            )}
            {packageData.tagline && (
              <div>
                <span className="text-sm font-medium text-gray-700">Tagline:</span>
                <p className="text-gray-900 mt-1 italic">{packageData.tagline}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-700">Package ID:</span>
              <p className="text-gray-900 mt-1 font-mono text-sm">#{packageData.id}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Created On:</span>
              <p className="text-gray-900 mt-1 text-sm">
                {new Date(packageData.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            {packageData.is_popular && (
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Popular Package
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;