import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Package, CheckCircle, AlertCircle 
} from 'lucide-react';
import axios from 'axios';

const ComponentsManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [floors, setFloors] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    component_name: '',
    category_id: '',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchProject();
    fetchComponents();
    fetchCategories();
    fetchFloors();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`);
      const projectData = response.data?.success ? response.data.data : response.data;
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project_components`, {
        params: { project_id: projectId }
      });
      const data = response.data || [];
      setComponents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/component_categories`);
      const data = response.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project_floors`, {
        params: { project_id: projectId }
      });
      const data = response.data || [];
      setFloors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.component_name || !formData.category_id) {
      setError('Component name and category are required');
      return;
    }

    try {
      const dataToSubmit = {
        project_id: parseInt(projectId),
        component_name: String(formData.component_name).trim(),
        category_id: parseInt(formData.category_id),
        is_active: true
      };

      // Add optional fields only if they have values
      if (formData.floor_id) dataToSubmit.floor_id = parseInt(formData.floor_id);
      if (formData.component_code) dataToSubmit.component_code = String(formData.component_code).trim();
      if (formData.total_area) dataToSubmit.total_area = parseFloat(formData.total_area);
      if (formData.specifications) dataToSubmit.specifications = String(formData.specifications).trim();
      if (formData.estimated_cost) dataToSubmit.estimated_cost = parseFloat(formData.estimated_cost);
      if (formData.approved_cost) dataToSubmit.approved_cost = parseFloat(formData.approved_cost);
      if (formData.planned_start_date) dataToSubmit.planned_start_date = formData.planned_start_date;
      if (formData.planned_end_date) dataToSubmit.planned_end_date = formData.planned_end_date;
      if (formData.requires_client_selection !== undefined) dataToSubmit.requires_client_selection = Boolean(formData.requires_client_selection);

      console.log('Submitting data:', dataToSubmit);

      if (editingComponent) {
        await axios.put(
          `${API_BASE_URL}/api/project_components/${editingComponent.component_id}`,
          dataToSubmit
        );
        setSuccess('Component updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/project_components`, dataToSubmit);
        setSuccess('Component created successfully');
      }

      fetchComponents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving component:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to save component');
    }
  };

  const handleEdit = (component) => {
    setEditingComponent(component);
    
    // Format dates properly for input fields
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    };

    setFormData({
      component_name: component.component_name || '',
      category_id: component.category_id || '',
      floor_id: component.floor_id || '',
      component_code: component.component_code || '',
      total_area: component.total_area || '',
      specifications: component.specifications || '',
      estimated_cost: component.estimated_cost || '',
      approved_cost: component.approved_cost || '',
      planned_start_date: formatDateForInput(component.planned_start_date),
      planned_end_date: formatDateForInput(component.planned_end_date),
      requires_client_selection: component.requires_client_selection || false,
      is_active: component.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/project_components/${id}`);
      setSuccess('Component deleted successfully');
      fetchComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
      setError('Failed to delete component');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingComponent(null);
    setFormData({
      component_name: '',
      category_id: '',
      floor_id: '',
      component_code: '',
      total_area: '',
      specifications: '',
      estimated_cost: '',
      approved_cost: '',
      planned_start_date: '',
      planned_end_date: '',
      requires_client_selection: false,
      is_active: true
    });
    setError('');
  };

  const filteredComponents = components.filter(component => {
    const matchesSearch = 
      component.component_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || component.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'N/A';
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
              <Package className="h-8 w-8 text-orange-600" />
              Components Management
            </h1>
            {project && (
              <p className="text-gray-600 mt-1">
                {project.project_name} - {project.project_code}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Component
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
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Components Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Component
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Floor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Area (sqft)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Estimated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Approved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No components found. Click "Add Component" to create one.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((component) => {
                  const floor = floors.find(f => f.floor_id === component.floor_id);
                  const floorName = floor ? (floor.floor_name || `Floor ${floor.floor_number}`) : '—';
                  const fmt = (v) => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—';
                  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : null;
                  const startDate = fmtDate(component.planned_start_date);
                  const endDate = fmtDate(component.planned_end_date);
                  const timeline = startDate || endDate
                    ? `${startDate || '?'} → ${endDate || '?'}`
                    : '—';

                  return (
                    <tr key={component.component_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {component.component_name}
                        </div>
                        {component.component_code && (
                          <div className="text-xs text-gray-500">{component.component_code}</div>
                        )}
                        {component.requires_client_selection && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">
                            Client selection
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getCategoryName(component.category_id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {floorName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {component.total_area ? parseFloat(component.total_area).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {fmt(component.estimated_cost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {fmt(component.approved_cost)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {timeline}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          component.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {component.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(component)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(component.component_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingComponent ? 'Edit Component' : 'Add Component'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Component Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.component_name}
                    onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Bedroom Wall"
                  />
                </div>

                {/* Category and Floor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor
                    </label>
                    <select
                      value={formData.floor_id}
                      onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Optional</option>
                      {floors.map((floor) => (
                        <option key={floor.floor_id} value={floor.floor_id}>
                          {floor.floor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Component Code & Total Area */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Component Code
                    </label>
                    <input
                      type="text"
                      value={formData.component_code}
                      onChange={(e) => setFormData({ ...formData, component_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="BDR-W-01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Area (sqft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_area}
                      onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specifications
                  </label>
                  <textarea
                    rows="2"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter specifications..."
                  />
                </div>

                {/* Costs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approved Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.approved_cost}
                      onChange={(e) => setFormData({ ...formData, approved_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_start_date}
                      onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_end_date}
                      onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requires_client_selection}
                      onChange={(e) => setFormData({ ...formData, requires_client_selection: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Client Selection Required
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
                  {editingComponent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentsManagement;
