import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Layers, CheckCircle, AlertCircle, Copy 
} from 'lucide-react';
import axios from 'axios';

const ModulesManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [modules, setModules] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    module_name: '',
    module_code: '',
    module_type: '',
    order_type: 'Purchase Order',
    vendor_id: '',
    total_quantity: '',
    unit_of_measure: 'nos',
    order_value: '',
    tax_amount: '',
    payment_terms: '',
    advance_percentage: '',
    expected_delivery_date: '',
    delivery_location: '',
    status: 'Draft'
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const moduleTypes = [
    'Structural', 'MEP', 'Finishing', 'Plumbing', 
    'Electrical', 'HVAC', 'Landscape', 'Interior', 'Other'
  ];

  useEffect(() => {
    fetchProject();
    fetchModules();
    fetchVendors();
  }, [projectId]);

  const fetchVendors = async () => {
    try {
      console.log('🏢 Fetching vendors...');
      const response = await axios.get(`${API_BASE_URL}/api/modules/vendors`);
      const vendorsData = response.data.success ? response.data.data : response.data;
      console.log('✅ Vendors fetched:', vendorsData);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`);
      const projectData = response.data?.success ? response.data.data : response.data;
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching modules for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/modules`, {
        params: { project_id: projectId }
      });
      
      console.log('📦 API Response:', response.data);
      
      // Handle different response formats
      let modulesData = [];
      if (response.data.success && response.data.data) {
        modulesData = response.data.data;
      } else if (response.data.data) {
        modulesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        modulesData = response.data;
      }
      
      console.log('✅ Processed modules data:', modulesData);
      setModules(Array.isArray(modulesData) ? modulesData : []);
    } catch (error) {
      console.error('❌ Error fetching modules:', error);
      console.error('❌ Error details:', error.response?.data);
      setModules([]);
      setError('Failed to load modules: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission with proper field mapping and type conversion
      const dataToSubmit = {
        project_id: parseInt(projectId),
        module_name: formData.module_name || null,
        module_code: formData.module_code || null,
        module_type: formData.module_type || null,
        order_type: formData.order_type || 'Purchase Order',
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
        total_quantity: formData.total_quantity ? parseFloat(formData.total_quantity) : null,
        unit_of_measure: formData.unit_of_measure || 'nos',
        order_value: formData.order_value ? parseFloat(formData.order_value) : null,
        tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : null,
        payment_terms: formData.payment_terms || null,
        advance_percentage: formData.advance_percentage ? parseFloat(formData.advance_percentage) : null,
        expected_delivery_date: formData.expected_delivery_date || null,
        delivery_location: formData.delivery_location || null,
        status: formData.status || 'Draft'
      };

      console.log('🚀 Submitting module data:', dataToSubmit);

      if (editingModule) {
        const response = await axios.put(
          `${API_BASE_URL}/api/modules/${editingModule.module_id}`,
          dataToSubmit
        );
        console.log('✅ Update response:', response.data);
        setSuccess('Module updated successfully');
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/modules`, dataToSubmit);
        console.log('✅ Create response:', response.data);
        setSuccess('Module created successfully');
      }

      await fetchModules();
      handleCloseModal();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('❌ Error saving module:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to save module';
      setError(errorMessage);
    }
  };

  const handleEdit = (module) => {
    console.log('✏️ Editing module:', module);
    setEditingModule(module);
    
    // Helper function to safely format dates
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Date formatting error:', error);
        return '';
      }
    };

    // Helper function to safely get values
    const safeValue = (value, defaultValue = '') => {
      if (value === null || value === undefined) return defaultValue;
      return value.toString();
    };

    // Populate form data with correct field mapping for database structure
    const newFormData = {
      module_name: module.module_name || '',
      module_code: module.module_code || '',
      module_type: module.module_type || '',
      order_type: module.order_type || 'Purchase Order',
      vendor_id: safeValue(module.vendor_id),
      total_quantity: safeValue(module.total_quantity),
      unit_of_measure: module.unit_of_measure || 'nos',
      order_value: safeValue(module.order_value),
      tax_amount: safeValue(module.tax_amount),
      payment_terms: module.payment_terms || '',
      advance_percentage: safeValue(module.advance_percentage),
      expected_delivery_date: formatDateForInput(module.expected_delivery_date),
      delivery_location: module.delivery_location || '',
      status: module.status || 'Draft'
    };
    
    console.log('📄 Form data being set:', newFormData);
    setFormData(newFormData);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;

    try {
      console.log('🗑️ Deleting module:', id);
      const response = await axios.delete(`${API_BASE_URL}/api/modules/${id}`);
      console.log('✅ Delete response:', response.data);
      setSuccess('Module deleted successfully');
      await fetchModules();
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('❌ Error deleting module:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete module';
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingModule(null);
    setFormData({
      module_name: '',
      module_code: '',
      module_type: '',
      order_type: 'Purchase Order',
      vendor_id: '',
      total_quantity: '',
      unit_of_measure: 'nos',
      order_value: '',
      tax_amount: '',
      payment_terms: '',
      advance_percentage: '',
      expected_delivery_date: '',
      delivery_location: '',
      status: 'Draft'
    });
    setError('');
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = 
      module.module_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.module_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || module.module_type === filterType;
    const matchesStatus = !filterStatus || module.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Approved': 'bg-green-100 text-green-800',
      'Ordered': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-8 w-8 text-orange-600" />
              Modules Management
            </h1>
            {project && (
              <p className="text-gray-600 mt-1">
                {project.project_name} - Reusable Work Templates
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Module
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
          <button onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Types</option>
          {moduleTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
          <option value="Ordered">Ordered</option>
          <option value="Delivered">Delivered</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Layers className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No modules found. Click "Add Module" to create one.</p>
          </div>
        ) : (
          filteredModules.map((module) => (
            <div
              key={module.module_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {module.module_name}
                  </h3>
                  <p className="text-sm text-gray-500">{module.module_code}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(module.status)}`}>
                  {module.status}
                </span>
              </div>

              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded mr-2">
                  {module.module_type}
                </span>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {module.order_type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Order Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {module.order_value ? `₹${parseFloat(module.order_value).toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {module.total_quantity ? `${module.total_quantity} ${module.unit_of_measure || 'nos'}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Expected Delivery</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {module.expected_delivery_date ? new Date(module.expected_delivery_date).toLocaleDateString('en-IN') : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(module)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="text-green-600 hover:text-green-900 p-2"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(module.module_id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingModule ? 'Edit Module' : 'Add Module'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.module_name}
                      onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Code
                    </label>
                    <input
                      type="text"
                      value={formData.module_code}
                      onChange={(e) => setFormData({ ...formData, module_code: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Type
                    </label>
                    <select
                      value={formData.module_type}
                      onChange={(e) => setFormData({ ...formData, module_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Type</option>
                      {moduleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Type
                    </label>
                    <select
                      value={formData.order_type}
                      onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Purchase Order">Purchase Order</option>
                      <option value="Work Order">Work Order</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_quantity}
                      onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="nos">Nos</option>
                      <option value="kg">Kg</option>
                      <option value="m">Meter</option>
                      <option value="sqft">Sq.Ft</option>
                      <option value="cuft">Cu.Ft</option>
                      <option value="ltr">Liter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      value={formData.vendor_id}
                      onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Vendor (Optional)</option>
                      {vendors.map(vendor => (
                        <option key={vendor.vendor_id} value={vendor.vendor_id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.order_value}
                      onChange={(e) => setFormData({ ...formData, order_value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.advance_percentage}
                      onChange={(e) => setFormData({ ...formData, advance_percentage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    rows="2"
                    placeholder="e.g., 30% advance, 70% on delivery"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Location
                  </label>
                  <textarea
                    value={formData.delivery_location}
                    onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                    rows="2"
                    placeholder="Site address or delivery location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingModule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulesManagement;
