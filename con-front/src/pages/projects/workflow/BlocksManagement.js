import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Building2, CheckCircle, AlertCircle 
} from 'lucide-react';
import axios from 'axios';

const BlocksManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [blocks, setBlocks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    block_name: '',
    block_code: '',
    description: '',
    total_floors: '',
    units_per_floor: '',
    total_units: '',
    construction_start_date: '',
    construction_end_date: '',
    status: 'Planned',
    progress_percentage: 0,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchProject();
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

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      // Use the correct endpoint for fetching blocks by project
      const response = await axios.get(`${API_BASE_URL}/api/blocks/project/${projectId}`);
      const data = response.data?.data || response.data;
      setBlocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
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

      if (editingBlock) {
        const response = await axios.put(
          `${API_BASE_URL}/api/blocks/${editingBlock.block_id}`,
          dataToSubmit
        );
        
        if (response.data?.success) {
          setSuccess(response.data.message || 'Block updated successfully');
        } else {
          setSuccess('Block updated successfully');
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/blocks`, dataToSubmit);
        
        if (response.data?.success) {
          setSuccess(response.data.message || 'Block created successfully');
        } else {
          setSuccess('Block created successfully');
        }
      }

      fetchBlocks();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving block:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to save block';
      setError(errorMessage);
    }
  };

  const handleEdit = (block) => {
    setEditingBlock(block);
    setFormData({
      block_name: block.block_name || '',
      block_code: block.block_code || '',
      description: block.description || '',
      total_floors: block.total_floors || '',
      units_per_floor: block.units_per_floor || '',
      total_units: block.total_units || '',
      construction_start_date: block.construction_start_date?.split('T')[0] || '',
      construction_end_date: block.construction_end_date?.split('T')[0] || '',
      status: block.status || 'Planned',
      progress_percentage: block.progress_percentage || 0,
      is_active: block.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this block?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/blocks/${id}`);
      setSuccess('Block deleted successfully');
      fetchBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
      setError('Failed to delete block');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBlock(null);
    setFormData({
      block_name: '',
      block_code: '',
      description: '',
      total_floors: '',
      units_per_floor: '',
      total_units: '',
      construction_start_date: '',
      construction_end_date: '',
      status: 'Planned',
      progress_percentage: 0,
      is_active: true
    });
    setError('');
  };

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = 
      block.block_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.block_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || block.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Planned': 'bg-gray-100 text-gray-800',
      'Under Construction': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
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
              <Building2 className="h-8 w-8 text-orange-600" />
              Blocks Management
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
            Add Block
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
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          <option value="Planned">Planned</option>
          <option value="Under Construction">Under Construction</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlocks.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No blocks found. Click "Add Block" to create one.</p>
          </div>
        ) : (
          filteredBlocks.map((block) => (
            <div
              key={block.block_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {block.block_name}
                  </h3>
                  <p className="text-sm text-gray-500">{block.block_code}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(block.status)}`}>
                  {block.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{block.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Floors</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {block.total_floors || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Units/Floor</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {block.units_per_floor || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Units</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {block.total_units || 0}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">
                    {block.progress_percentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(block.progress_percentage || 0)}`}
                    style={{ width: `${block.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(block)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(block.block_id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBlock ? 'Edit Block' : 'Add Block'}
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
                      Block Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.block_name}
                      onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
                      placeholder="e.g., Tower A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block Code
                    </label>
                    <input
                      type="text"
                      value={formData.block_code}
                      onChange={(e) => setFormData({ ...formData, block_code: e.target.value })}
                      placeholder="e.g., BLK-A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Floors
                    </label>
                    <input
                      type="number"
                      value={formData.total_floors}
                      onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Units/Floor
                    </label>
                    <input
                      type="number"
                      value={formData.units_per_floor}
                      onChange={(e) => setFormData({ ...formData, units_per_floor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Units
                    </label>
                    <input
                      type="number"
                      value={formData.total_units}
                      onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Construction Start
                    </label>
                    <input
                      type="date"
                      value={formData.construction_start_date}
                      onChange={(e) => setFormData({ ...formData, construction_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Construction End
                    </label>
                    <input
                      type="date"
                      value={formData.construction_end_date}
                      onChange={(e) => setFormData({ ...formData, construction_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Under Construction">Under Construction</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress_percentage}
                      onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
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
                  {editingBlock ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocksManagement;
