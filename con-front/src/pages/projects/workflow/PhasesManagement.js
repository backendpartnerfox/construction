import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Calendar, CheckCircle, AlertCircle, Clock 
} from 'lucide-react';
import axios from 'axios';

const PhasesManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [phases, setPhases] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    phase_name: '',
    phase_code: '',
    phase_order: '',
    description: '',
    planned_start_date: '',
    planned_end_date: '',
    duration_days: '',
    estimated_cost: '',
    status: 'Not Started',
    progress_percentage: 0,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchProject();
    fetchPhases();
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

  const fetchPhases = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project_phases`, {
        params: { project_id: projectId }
      });
      const data = response.data.data || response.data;
      setPhases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching phases:', error);
      setPhases([]);
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

      if (editingPhase) {
        await axios.put(
          `${API_BASE_URL}/api/project_phases/${editingPhase.phase_id}`,
          dataToSubmit
        );
        setSuccess('Phase updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/project_phases`, dataToSubmit);
        setSuccess('Phase created successfully');
      }

      fetchPhases();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving phase:', error);
      setError(error.response?.data?.error || 'Failed to save phase');
    }
  };

  const handleEdit = (phase) => {
    setEditingPhase(phase);
    setFormData({
      phase_name: phase.phase_name || '',
      phase_code: phase.phase_code || '',
      phase_order: phase.phase_order || '',
      description: phase.description || '',
      planned_start_date: phase.planned_start_date?.split('T')[0] || '',
      planned_end_date: phase.planned_end_date?.split('T')[0] || '',
      duration_days: phase.duration_days || '',
      estimated_cost: phase.estimated_cost || '',
      status: phase.status || 'Not Started',
      progress_percentage: phase.progress_percentage || 0,
      is_active: phase.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this phase?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/project_phases/${id}`);
      setSuccess('Phase deleted successfully');
      fetchPhases();
    } catch (error) {
      console.error('Error deleting phase:', error);
      setError('Failed to delete phase');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPhase(null);
    setFormData({
      phase_name: '',
      phase_code: '',
      phase_order: '',
      description: '',
      planned_start_date: '',
      planned_end_date: '',
      duration_days: '',
      estimated_cost: '',
      status: 'Not Started',
      progress_percentage: 0,
      is_active: true
    });
    setError('');
  };

  const filteredPhases = phases.filter(phase => {
    const matchesSearch = 
      phase.phase_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phase.phase_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || phase.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Delayed': 'bg-red-100 text-red-800'
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
              <Calendar className="h-8 w-8 text-orange-600" />
              Phases Management
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
            Add Phase
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
            placeholder="Search phases..."
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
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Delayed">Delayed</option>
        </select>
      </div>

      {/* Phases Timeline View */}
      <div className="space-y-4">
        {filteredPhases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No phases found. Click "Add Phase" to create one.</p>
          </div>
        ) : (
          filteredPhases
            .sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0))
            .map((phase, index) => (
              <div
                key={phase.phase_id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-full font-bold">
                      {phase.phase_order || index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {phase.phase_name}
                      </h3>
                      <p className="text-sm text-gray-500">{phase.phase_code}</p>
                      <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(phase.status)}`}>
                      {phase.status}
                    </span>
                    <button
                      onClick={() => handleEdit(phase)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(phase.phase_id)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {phase.planned_start_date 
                        ? new Date(phase.planned_start_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {phase.planned_end_date 
                        ? new Date(phase.planned_end_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-gray-900">
                      {phase.duration_days || 0} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated Cost</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{parseFloat(phase.estimated_cost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {phase.progress_percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(phase.progress_percentage || 0)}`}
                      style={{ width: `${phase.progress_percentage || 0}%` }}
                    ></div>
                  </div>
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
                {editingPhase ? 'Edit Phase' : 'Add Phase'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phase_name}
                      onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase Code
                    </label>
                    <input
                      type="text"
                      value={formData.phase_code}
                      onChange={(e) => setFormData({ ...formData, phase_code: e.target.value })}
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
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase Order
                    </label>
                    <input
                      type="number"
                      value={formData.phase_order}
                      onChange={(e) => setFormData({ ...formData, phase_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
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
                  {editingPhase ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhasesManagement;
