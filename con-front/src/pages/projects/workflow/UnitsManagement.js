import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Home, CheckCircle, AlertCircle, Building2 
} from 'lucide-react';
import axios from 'axios';

const UnitsManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [units, setUnits] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    unit_number: '',
    unit_name: '',
    unit_type: 'Flat',
    block_id: '',
    floor_number: '',
    carpet_area: '',
    built_up_area: '',
    bedrooms: '',
    bathrooms: '',
    facing: '',
    base_price: '',
    status: 'Available',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchProject();
    fetchUnits();
    fetchBlocks();
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

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project_units`, {
        params: { project_id: projectId }
      });
      const data = response.data.data || response.data;
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      // Use path-param endpoint for consistency with BlocksManagement
      const response = await axios.get(`${API_BASE_URL}/api/blocks/project/${projectId}`);
      const data = response.data?.data || response.data;
      setBlocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        project_id: projectId
      };

      if (editingUnit) {
        await axios.put(
          `${API_BASE_URL}/api/project_units/${editingUnit.unit_id}`,
          dataToSubmit
        );
        setSuccess('Unit updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/project_units`, dataToSubmit);
        setSuccess('Unit created successfully');
      }

      fetchUnits();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving unit:', error);
      setError(error.response?.data?.error || 'Failed to save unit');
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unit_number: unit.unit_number || '',
      unit_name: unit.unit_name || '',
      unit_type: unit.unit_type || 'Flat',
      block_id: unit.block_id || '',
      floor_number: unit.floor_number || '',
      carpet_area: unit.carpet_area || '',
      built_up_area: unit.built_up_area || '',
      bedrooms: unit.bedrooms || '',
      bathrooms: unit.bathrooms || '',
      facing: unit.facing || '',
      base_price: unit.base_price || '',
      status: unit.status || 'Available',
      is_active: unit.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/project_units/${id}`);
      setSuccess('Unit deleted successfully');
      fetchUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      setError('Failed to delete unit');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      unit_number: '',
      unit_name: '',
      unit_type: 'Flat',
      block_id: '',
      floor_number: '',
      carpet_area: '',
      built_up_area: '',
      bedrooms: '',
      bathrooms: '',
      facing: '',
      base_price: '',
      status: 'Available',
      is_active: true
    });
    setError('');
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || unit.status === filterStatus;
    const matchesBlock = !filterBlock || unit.block_id === parseInt(filterBlock);
    return matchesSearch && matchesStatus && matchesBlock;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'bg-green-100 text-green-800',
      'Booked': 'bg-blue-100 text-blue-800',
      'Sold': 'bg-purple-100 text-purple-800',
      'Reserved': 'bg-yellow-100 text-yellow-800',
      'Blocked': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBlockName = (blockId) => {
    const block = blocks.find(b => b.block_id === blockId);
    return block ? block.block_name : 'N/A';
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
              <Home className="h-8 w-8 text-orange-600" />
              Units Management
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
            Add Unit
          </button>
        </div>
      </div>

      {/* Scope clarification banner */}
      <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-sm">
        <strong>Real-estate units.</strong> This page tracks inventory units such as flats, villas, and shops
        (with bedrooms, floor, base price, and sale status). Work-breakdown units for BOQ costing
        (e.g. “ground-floor pipes”) are managed through BOQ &amp; Costing, not here.
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
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterBlock}
          onChange={(e) => setFilterBlock(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Blocks</option>
          {blocks.map(block => (
            <option key={block.block_id} value={block.block_id}>
              {block.block_name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Booked">Booked</option>
          <option value="Sold">Sold</option>
          <option value="Reserved">Reserved</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUnits.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Home className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No units found. Click "Add Unit" to create one.</p>
          </div>
        ) : (
          filteredUnits.map((unit) => (
            <div
              key={unit.unit_id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {unit.unit_number}
                  </h3>
                  <p className="text-sm text-gray-500">{unit.unit_name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{unit.unit_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Block:</span>
                  <span className="font-medium">{getBlockName(unit.block_id)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Floor:</span>
                  <span className="font-medium">{unit.floor_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Area:</span>
                  <span className="font-medium">{unit.carpet_area || 'N/A'} sqft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Config:</span>
                  <span className="font-medium">{unit.bedrooms}BHK / {unit.bathrooms}Bath</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(unit)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(unit.unit_id)}
                  className="text-red-600 hover:text-red-900 p-2"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUnit ? 'Edit Unit' : 'Add Unit'}
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
                      Unit Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.unit_number}
                      onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                      placeholder="e.g., A-101"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Name
                    </label>
                    <input
                      type="text"
                      value={formData.unit_name}
                      onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Type *
                    </label>
                    <select
                      required
                      value={formData.unit_type}
                      onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Flat">Flat</option>
                      <option value="Shop">Shop</option>
                      <option value="Office">Office</option>
                      <option value="Parking">Parking</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block
                    </label>
                    <select
                      value={formData.block_id}
                      onChange={(e) => setFormData({ ...formData, block_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Block</option>
                      {blocks.map(block => (
                        <option key={block.block_id} value={block.block_id}>
                          {block.block_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor Number
                    </label>
                    <input
                      type="number"
                      value={formData.floor_number}
                      onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carpet Area (sqft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.carpet_area}
                      onChange={(e) => setFormData({ ...formData, carpet_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Built-up Area (sqft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.built_up_area}
                      onChange={(e) => setFormData({ ...formData, built_up_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facing
                    </label>
                    <select
                      value={formData.facing}
                      onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North-East">North-East</option>
                      <option value="North-West">North-West</option>
                      <option value="South-East">South-East</option>
                      <option value="South-West">South-West</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
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
                      <option value="Available">Available</option>
                      <option value="Booked">Booked</option>
                      <option value="Sold">Sold</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
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
                  {editingUnit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitsManagement;
