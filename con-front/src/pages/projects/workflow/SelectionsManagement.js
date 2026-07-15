import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Palette, CheckCircle, AlertCircle, Filter 
} from 'lucide-react';
import axios from 'axios';

const SelectionsManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [selections, setSelections] = useState([]);
  const [units, setUnits] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    unit_id: '',
    category: '',
    item_name: '',
    specification: '',
    choice_option_id: '',
    brand: '',
    model: '',
    color: '',
    finish: '',
    quantity: '',
    unit: '',
    unit_price: '',
    status: 'Pending',
    approved_by_client: false,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const categories = [
    'Flooring', 'Kitchen', 'Bathroom', 'Electrical', 
    'Plumbing', 'Doors', 'Windows', 'Paint', 'Other'
  ];

  useEffect(() => {
    fetchProject();
    fetchSelections();
    fetchUnits();
    fetchItemChoices();
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

  const fetchSelections = async () => {
    setLoading(true);
    try {
      // Use the correct endpoint for fetching selections by project
      const response = await axios.get(`${API_BASE_URL}/api/selections/project/${projectId}`);
      const data = response.data?.data || response.data;
      setSelections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching selections:', error);
      setSelections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project_units`, {
        params: { project_id: projectId }
      });
      const data = response.data.data || response.data;
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    }
  };

  const fetchItemChoices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/item_choices`);
      const data = response.data.data || response.data;
      setItemChoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching item choices:', error);
      setItemChoices([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        project_id: projectId,
        total_price: parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0)
      };

      if (editingSelection) {
        const response = await axios.put(
          `${API_BASE_URL}/api/selections/${editingSelection.selection_id}`,
          dataToSubmit
        );
        
        if (response.data?.success) {
          setSuccess(response.data.message || 'Selection updated successfully');
        } else {
          setSuccess('Selection updated successfully');
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/selections`, dataToSubmit);
        
        if (response.data?.success) {
          setSuccess(response.data.message || 'Selection created successfully');
        } else {
          setSuccess('Selection created successfully');
        }
      }

      fetchSelections();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving selection:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to save selection';
      setError(errorMessage);
    }
  };

  const handleEdit = (selection) => {
    setEditingSelection(selection);
    setFormData({
      unit_id: selection.unit_id || '',
      category: selection.category || '',
      item_name: selection.item_name || '',
      specification: selection.specification || '',
      choice_option_id: selection.choice_option_id || '',
      brand: selection.brand || '',
      model: selection.model || '',
      color: selection.color || '',
      finish: selection.finish || '',
      quantity: selection.quantity || '',
      unit: selection.unit || '',
      unit_price: selection.unit_price || '',
      status: selection.status || 'Pending',
      approved_by_client: selection.approved_by_client || false,
      is_active: selection.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this selection?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/selections/${id}`);
      setSuccess('Selection deleted successfully');
      fetchSelections();
    } catch (error) {
      console.error('Error deleting selection:', error);
      setError('Failed to delete selection');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSelection(null);
    setFormData({
      unit_id: '',
      category: '',
      item_name: '',
      specification: '',
      choice_option_id: '',
      brand: '',
      model: '',
      color: '',
      finish: '',
      quantity: '',
      unit: '',
      unit_price: '',
      status: 'Pending',
      approved_by_client: false,
      is_active: true
    });
    setError('');
  };

  const filteredSelections = selections.filter(selection => {
    const matchesSearch = 
      selection.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selection.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || selection.category === filterCategory;
    const matchesStatus = !filterStatus || selection.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Ordered': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Installed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.unit_id === unitId);
    if (!unit) return 'N/A';
    // project_units table stores unit_number (not unit_code)
    const label = unit.unit_number || unit.unit_code || `Unit #${unit.unit_id}`;
    return unit.unit_name ? `${label} - ${unit.unit_name}` : label;
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
              <Palette className="h-8 w-8 text-orange-600" />
              Selections Management
            </h1>
            {project && (
              <p className="text-gray-600 mt-1">
                {project.project_name} - Client Material Selections
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Selection
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
            placeholder="Search selections..."
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
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Ordered">Ordered</option>
          <option value="Delivered">Delivered</option>
          <option value="Installed">Installed</option>
        </select>
      </div>

      {/* Selections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand / Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSelections.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No selections found. Click "Add Selection" to create one.
                  </td>
                </tr>
              ) : (
                filteredSelections.map((selection) => (
                  <tr key={selection.selection_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {selection.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {selection.item_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selection.specification}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getUnitName(selection.unit_id)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{selection.brand}</div>
                      <div className="text-xs text-gray-500">{selection.model}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {selection.quantity} {selection.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{parseFloat(selection.total_price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(selection.status)}`}>
                          {selection.status}
                        </span>
                        {selection.approved_by_client && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                            Client Approved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(selection)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selection.selection_id)}
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
                {editingSelection ? 'Edit Selection' : 'Add Selection'}
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
                      Unit
                    </label>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_number} - {unit.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specification
                  </label>
                  <textarea
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Finish
                    </label>
                    <input
                      type="text"
                      value={formData.finish}
                      onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="sqft, nos, etc"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {formData.quantity && formData.unit_price && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-700">Total Price: </span>
                    <span className="text-lg font-bold text-orange-600">
                      ₹{(parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toLocaleString()}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Installed">Installed</option>
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.approved_by_client}
                      onChange={(e) => setFormData({ ...formData, approved_by_client: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Client Approved
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
                  {editingSelection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionsManagement;
