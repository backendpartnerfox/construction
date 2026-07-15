import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, X, Save, AlertCircle, Filter, 
  ChevronDown, ChevronUp, Boxes, Calendar, CheckCircle, Clock,
  AlertTriangle, Eye, MapPin, Package
} from 'lucide-react';
import axios from 'axios';

const ComponentsManagement = () => {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'

  // Filter states
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [formData, setFormData] = useState({
    client_requirement_id: 1, // Default
    project_id: '',
    component_code: '',
    component_name: '',
    component_description: '',
    component_category: '',
    component_type: '',
    area: '',
    volume: '',
    quantity: 1,
    unit: 'sqft',
    status: 'Planned',
    priority: 'Medium',
    parent_component_id: '',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    floor_name: '',
    notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api/components`;

  const statusOptions = ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const unitOptions = ['sqft', 'cum', 'pcs', 'kg', 'meter', 'liter'];

  useEffect(() => {
    fetchComponents();
    fetchCategories();
    fetchProjects();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/`);
      // Ensure we always set an array
      setComponents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setError('Failed to fetch components');
      console.error('Error fetching components:', error);
      setComponents([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/component_categories`);
      // Ensure we always set an array
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set to empty array on error
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects`);
      // Ensure we always set an array
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set to empty array on error
    }
  };

  const handleAdd = () => {
    setEditingComponent(null);
    setFormData({
      client_requirement_id: 1,
      project_id: '',
      component_code: '',
      component_name: '',
      component_description: '',
      component_category: '',
      component_type: '',
      area: '',
      volume: '',
      quantity: 1,
      unit: 'sqft',
      status: 'Planned',
      priority: 'Medium',
      parent_component_id: '',
      planned_start_date: '',
      planned_end_date: '',
      actual_start_date: '',
      actual_end_date: '',
      floor_name: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (component) => {
    setEditingComponent(component);
    setFormData({
      client_requirement_id: component.client_requirement_id || 1,
      project_id: component.project_id || '',
      component_code: component.component_code || '',
      component_name: component.component_name || '',
      component_description: component.component_description || '',
      component_category: component.component_category || '',
      component_type: component.component_type || '',
      area: component.area || '',
      volume: component.volume || '',
      quantity: component.quantity || 1,
      unit: component.unit || 'sqft',
      status: component.status || 'Planned',
      priority: component.priority || 'Medium',
      parent_component_id: component.parent_component_id || '',
      planned_start_date: component.planned_start_date || '',
      planned_end_date: component.planned_end_date || '',
      actual_start_date: component.actual_start_date || '',
      actual_end_date: component.actual_end_date || '',
      floor_name: component.floor_name || '',
      notes: component.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;

    try {
      await axios.delete(`${API_URL}/components/${id}`);
      setSuccess('Component deleted successfully');
      fetchComponents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete component');
      console.error('Error deleting component:', error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingComponent) {
        await axios.put(`${API_URL}/components/${editingComponent.component_id}`, formData);
        setSuccess('Component updated successfully');
      } else {
        await axios.post(`${API_URL}/components`, formData);
        setSuccess('Component created successfully');
      }
      setShowModal(false);
      fetchComponents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save component');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Planned':
        return 'bg-gray-100 text-gray-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'High':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'Medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProjectName = (projectId) => {
    // Ensure projects is an array before using .find()
    if (!Array.isArray(projects) || projects.length === 0) {
      return `Project #${projectId}`;
    }
    const project = projects.find(p => p.project_id === projectId);
    return project ? project.project_name : `Project #${projectId}`;
  };

  // Apply filters
  const filteredComponents = components.filter(component => {
    const matchesSearch = 
      component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (component.component_description && component.component_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (component.component_code && component.component_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProject = !filterProject || component.project_id.toString() === filterProject;
    const matchesCategory = !filterCategory || component.component_category === filterCategory;
    const matchesStatus = !filterStatus || component.status === filterStatus;
    const matchesPriority = !filterPriority || component.priority === filterPriority;

    return matchesSearch && matchesProject && matchesCategory && matchesStatus && matchesPriority;
  });

  // Get unique categories from components
  const uniqueCategories = [...new Set(components.map(c => c.component_category).filter(Boolean))];

  if (loading && components.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Boxes className="h-8 w-8 text-orange-600" />
          Components Management
        </h1>
        <p className="text-gray-600 mt-1">Manage project components and their configurations</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-5 w-5" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            <button
              onClick={handleAdd}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Component
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Projects</option>
                {Array.isArray(projects) && projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Priorities</option>
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredComponents.length} of {components.length} components
      </div>

      {/* Components Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComponents.map((component) => (
                <tr key={component.component_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {component.component_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {component.component_code || `#${component.component_id}`}
                      </div>
                      {component.component_description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {component.component_description.substring(0, 50)}
                          {component.component_description.length > 50 && '...'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {getProjectName(component.project_id)}
                    </div>
                    {component.floor_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        Floor: {component.floor_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {component.component_category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {component.area && (
                        <div>Area: {parseFloat(component.area).toFixed(2)} {component.unit}</div>
                      )}
                      {component.volume && (
                        <div>Volume: {parseFloat(component.volume).toFixed(2)} cum</div>
                      )}
                      {component.quantity && (
                        <div>Qty: {component.quantity}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(component.status)}`}>
                      {component.status || 'Planned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(component.priority)}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(component.priority)}`}>
                        {component.priority || 'Medium'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {component.planned_start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(component.planned_start_date).toLocaleDateString()}
                      </div>
                    )}
                    {component.planned_end_date && (
                      <div className="text-xs text-gray-500">
                        to {new Date(component.planned_end_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(component)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(component.component_id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No components found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterProject || filterCategory || filterStatus || filterPriority
                ? 'Try adjusting your filters'
                : 'Get started by creating a new component'}
            </p>
          </div>
        )}
      </div>

      {/* Modal - Same as before, keeping it the same */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingComponent ? 'Edit Component' : 'Add New Component'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto px-1">
                {/* Basic Information */}
                <div className="col-span-2 border-b pb-4 mb-4">
                  <h4 className="text-md font-semibold text-gray-700">Basic Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.component_name}
                    onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Foundation System"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Code
                  </label>
                  <input
                    type="text"
                    value={formData.component_code}
                    onChange={(e) => setFormData({ ...formData, component_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., COMP-001"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.component_description}
                    onChange={(e) => setFormData({ ...formData, component_description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Detailed description of the component"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Project</option>
                    {Array.isArray(projects) && projects.map(project => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.component_category}
                    onChange={(e) => setFormData({ ...formData, component_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    {Array.isArray(categories) && categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_name}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Type
                  </label>
                  <input
                    type="text"
                    value={formData.component_type}
                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., RCC, Masonry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Name
                  </label>
                  <input
                    type="text"
                    value={formData.floor_name}
                    onChange={(e) => setFormData({ ...formData, floor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Ground Floor, First Floor"
                  />
                </div>

                {/* Specifications */}
                <div className="col-span-2 border-b pb-4 mb-4 mt-4">
                  <h4 className="text-md font-semibold text-gray-700">Specifications</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                {/* Status & Priority */}
                <div className="col-span-2 border-b pb-4 mb-4 mt-4">
                  <h4 className="text-md font-semibold text-gray-700">Status & Priority</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                {/* Schedule */}
                <div className="col-span-2 border-b pb-4 mb-4 mt-4">
                  <h4 className="text-md font-semibold text-gray-700">Schedule</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned End Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.actual_start_date}
                    onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual End Date
                  </label>
                  <input
                    type="date"
                    value={formData.actual_end_date}
                    onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Additional notes or instructions"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : editingComponent ? 'Update' : 'Create'}
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
