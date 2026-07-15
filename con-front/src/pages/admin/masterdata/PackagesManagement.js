import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, Save, Package, 
  CheckCircle, XCircle, Eye, ChevronDown, ChevronUp,
  Tag, DollarSign, Clock, Star, List
} from 'lucide-react';
import toast from 'react-hot-toast';

const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [items, setItems] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageItems, setPackageItems] = useState([]);
  const [expandedPackage, setExpandedPackage] = useState(null);
  
  const [formData, setFormData] = useState({
    package_name: '',
    package_code: '',
    package_type: 'Standard',
    base_price_per_sqft: '',
    gst_percentage: '18.00',
    short_description: '',
    detailed_description: '',
    features: [],
    exclusions: [],
    quality_level: 'Standard',
    construction_type: 'Residential',
    suitable_for: [],
    estimated_duration_months: '',
    applies_area_multipliers: true,
    habitable_area_rate: '1.00',
    balcony_area_rate: '0.65',
    stilt_area_rate: '0.65',
    terrace_area_rate: '0.65',
    is_active: true,
    is_published: false,
    popular_choice: false,
    display_order: 0
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const packageTypes = ['Basic', 'Standard', 'Premium', 'Luxury', 'Custom'];
  const qualityLevels = ['Basic', 'Standard', 'Premium', 'Luxury'];
  const constructionTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
  const suitableForOptions = ['Villa', 'Apartment', 'Duplex', 'Penthouse', 'Row House', 'Commercial Building'];

  useEffect(() => {
    fetchPackages();
    fetchItems();
    fetchItemChoices();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/packages`);
      const data = await response.json();
      if (data.success) {
        setPackages(data.data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchItemChoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/item-choices`);
      const data = await response.json();
      setItemChoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching item choices:', error);
    }
  };

  const fetchPackageItems = async (packageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/items`);
      const data = await response.json();
      if (data.success) {
        setPackageItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching package items:', error);
      toast.error('Failed to fetch package items');
    }
  };

  const handleAdd = () => {
    setEditingPackage(null);
    setFormData({
      package_name: '',
      package_code: '',
      package_type: 'Standard',
      base_price_per_sqft: '',
      gst_percentage: '18.00',
      short_description: '',
      detailed_description: '',
      features: [],
      exclusions: [],
      quality_level: 'Standard',
      construction_type: 'Residential',
      suitable_for: [],
      estimated_duration_months: '',
      applies_area_multipliers: true,
      habitable_area_rate: '1.00',
      balcony_area_rate: '0.65',
      stilt_area_rate: '0.65',
      terrace_area_rate: '0.65',
      is_active: true,
      is_published: false,
      popular_choice: false,
      display_order: 0
    });
    setShowModal(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      package_code: pkg.package_code || '',
      package_type: pkg.package_type,
      base_price_per_sqft: pkg.base_price_per_sqft,
      gst_percentage: pkg.gst_percentage,
      short_description: pkg.short_description || '',
      detailed_description: pkg.detailed_description || '',
      features: pkg.features || [],
      exclusions: pkg.exclusions || [],
      quality_level: pkg.quality_level || 'Standard',
      construction_type: pkg.construction_type || 'Residential',
      suitable_for: pkg.suitable_for || [],
      estimated_duration_months: pkg.estimated_duration_months || '',
      applies_area_multipliers: pkg.applies_area_multipliers,
      habitable_area_rate: pkg.habitable_area_rate,
      balcony_area_rate: pkg.balcony_area_rate,
      stilt_area_rate: pkg.stilt_area_rate,
      terrace_area_rate: pkg.terrace_area_rate,
      is_active: pkg.is_active,
      is_published: pkg.is_published,
      popular_choice: pkg.popular_choice,
      display_order: pkg.display_order || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchPackages();
      } else {
        toast.error(data.error || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.package_name.trim()) {
      toast.error('Package name is required');
      return;
    }
    if (!formData.base_price_per_sqft || parseFloat(formData.base_price_per_sqft) <= 0) {
      toast.error('Valid base price is required');
      return;
    }

    try {
      const url = editingPackage
        ? `${API_BASE_URL}/api/packages/${editingPackage.package_id}`
        : `${API_BASE_URL}/api/packages`;

      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        fetchPackages();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const handleViewItems = async (pkg) => {
    setSelectedPackage(pkg);
    await fetchPackageItems(pkg.package_id);
    setShowItemsModal(true);
  };

  const toggleExpand = async (packageId) => {
    if (expandedPackage === packageId) {
      setExpandedPackage(null);
      setPackageItems([]);
    } else {
      setExpandedPackage(packageId);
      await fetchPackageItems(packageId);
    }
  };

  const handleArrayInput = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: array });
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pkg.package_code && pkg.package_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type) => {
    const colors = {
      'Basic': 'bg-gray-100 text-gray-800',
      'Standard': 'bg-blue-100 text-blue-800',
      'Premium': 'bg-purple-100 text-purple-800',
      'Luxury': 'bg-yellow-100 text-yellow-800',
      'Custom': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-orange-600" />
            Packages Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage construction packages</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition duration-200"
        >
          <Plus className="h-5 w-5" />
          Add Package
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search packages by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Get started by creating a new package'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAdd}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Package
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPackages.map((pkg) => (
            <div key={pkg.package_id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              {/* Package Header */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.package_name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(pkg.package_type)}`}>
                        {pkg.package_type}
                      </span>
                      {pkg.popular_choice && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          <Star className="h-3 w-3 fill-current" />
                          Popular
                        </span>
                      )}
                      {pkg.is_published ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          <CheckCircle className="h-3 w-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          <XCircle className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    
                    {pkg.package_code && (
                      <p className="text-sm text-gray-500 mb-2">Code: {pkg.package_code}</p>
                    )}
                    
                    {pkg.short_description && (
                      <p className="text-sm text-gray-600 mb-3">{pkg.short_description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-700">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">₹{parseFloat(pkg.total_price_per_sqft).toFixed(2)}/sqft</span>
                        <span className="text-gray-500">(incl. GST)</span>
                      </div>
                      {pkg.estimated_duration_months && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{pkg.estimated_duration_months} months</span>
                        </div>
                      )}
                      {pkg.total_items > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <List className="h-4 w-4" />
                          <span>{pkg.total_items} items</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>{pkg.quality_level || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleExpand(pkg.package_id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Items"
                    >
                      {expandedPackage === pkg.package_id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleViewItems(pkg)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.package_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Items View */}
              {expandedPackage === pkg.package_id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Package Items</h4>
                  {packageItems.length === 0 ? (
                    <p className="text-sm text-gray-600">No items added to this package yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packageItems.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <h5 className="font-medium text-gray-900 mb-1">{item.item_name}</h5>
                          <p className="text-sm text-gray-600">{item.choice_name}</p>
                          {item.brand && (
                            <p className="text-xs text-gray-500 mt-1">Brand: {item.brand}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Code
                    </label>
                    <input
                      type="text"
                      value={formData.package_code}
                      onChange={(e) => setFormData({ ...formData, package_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Type *
                    </label>
                    <select
                      value={formData.package_type}
                      onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {packageTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Level
                    </label>
                    <select
                      value={formData.quality_level}
                      onChange={(e) => setFormData({ ...formData, quality_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {qualityLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price per sqft (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.base_price_per_sqft}
                      onChange={(e) => setFormData({ ...formData, base_price_per_sqft: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gst_percentage}
                      onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    value={formData.detailed_description}
                    onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Area Multipliers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Habitable Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.habitable_area_rate}
                      onChange={(e) => setFormData({ ...formData, habitable_area_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balcony Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balcony_area_rate}
                      onChange={(e) => setFormData({ ...formData, balcony_area_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stilt Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stilt_area_rate}
                      onChange={(e) => setFormData({ ...formData, stilt_area_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terrace Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.terrace_area_rate}
                      onChange={(e) => setFormData({ ...formData, terrace_area_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Other Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Construction Type
                    </label>
                    <select
                      value={formData.construction_type}
                      onChange={(e) => setFormData({ ...formData, construction_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {constructionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration (months)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_duration_months}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_months: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Published</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.popular_choice}
                      onChange={(e) => setFormData({ ...formData, popular_choice: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Popular Choice</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.applies_area_multipliers}
                      onChange={(e) => setFormData({ ...formData, applies_area_multipliers: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Apply Area Multipliers</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="h-5 w-5" />
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Modal */}
      {showItemsModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedPackage.package_name}</h2>
                <p className="text-sm text-gray-600 mt-1">Package Items</p>
              </div>
              <button onClick={() => setShowItemsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {packageItems.length === 0 ? (
                <div className="text-center py-12">
                  <List className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No items in this package yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageItems.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {item.item_category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{item.choice_name}</p>
                      {item.brand && (
                        <p className="text-xs text-gray-600">
                          Brand: {item.brand} {item.series && `| Series: ${item.series}`}
                        </p>
                      )}
                      {item.is_customizable && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Customizable
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesManagement;
