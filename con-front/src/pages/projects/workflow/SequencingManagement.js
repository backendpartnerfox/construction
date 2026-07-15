import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  GitBranch, CheckCircle, AlertCircle, Link as LinkIcon 
} from 'lucide-react';
import axios from 'axios';

const SequencingManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [sequences, setSequences] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    sequence_name: '',
    sequence_code: '',
    sequence_order: '',
    block_id: '',
    work_description: '',
    methodology: '',
    safety_requirements: '',
    estimated_days: '',
    buffer_days: '',
    predecessor_sequences: [],
    status: 'Planned',
    can_start: false,
    prerequisites_met: false,
    quality_checkpoints: [],
    labor_requirement: '',
    equipment_requirement: '',
    material_requirement: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchProject();
    fetchSequences();
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

  const fetchSequences = async () => {
    setLoading(true);
    try {
      console.log('Fetching sequences for project:', projectId);
      
      // First try to get sequences with project filter
      let response;
      if (projectId) {
        response = await axios.get(`${API_BASE_URL}/api/sequencing`, {
          params: { project_id: projectId }
        });
      } else {
        // If no projectId, get all sequences
        response = await axios.get(`${API_BASE_URL}/api/sequencing`);
      }
      
      console.log('Sequences API response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response formats
      let sequenceData = [];
      if (response.data && Array.isArray(response.data.data)) {
        sequenceData = response.data.data;
      } else if (Array.isArray(response.data)) {
        sequenceData = response.data;
      } else if (response.data && response.data.rows) {
        sequenceData = response.data.rows;
      }
      
      console.log('Processed sequence data:', sequenceData);
      setSequences(sequenceData);
      
    } catch (error) {
      console.error('Error fetching sequences:', error);
      console.error('Error details:', error.response?.data);
      setSequences([]);
      
      // Show error to user
      setError(`Failed to load sequences: ${error.response?.data?.error || error.message}`);
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
      // Prepare data for submission with proper field mapping
      let dataToSubmit = {
        sequence_name: formData.sequence_name || null,
        sequence_code: formData.sequence_code || null,
        sequence_order: formData.sequence_order ? parseInt(formData.sequence_order) : null,
        block_id: formData.block_id ? parseInt(formData.block_id) : null,
        work_description: formData.work_description || null,
        methodology: formData.methodology || null,
        safety_requirements: formData.safety_requirements || null,
        estimated_days: formData.estimated_days ? parseInt(formData.estimated_days) : null,
        buffer_days: formData.buffer_days ? parseInt(formData.buffer_days) : null,
        status: formData.status || 'Planned',
        can_start: Boolean(formData.can_start),
        prerequisites_met: Boolean(formData.prerequisites_met),
        // Ensure arrays are properly formatted
        predecessor_sequences: Array.isArray(formData.predecessor_sequences) ? formData.predecessor_sequences : [],
        quality_checkpoints: Array.isArray(formData.quality_checkpoints) ? formData.quality_checkpoints : [],
        labor_requirement: formData.labor_requirement || null,
        equipment_requirement: formData.equipment_requirement || null,
        material_requirement: formData.material_requirement || null
      };

      // Only add project_id for CREATE operations
      if (!editingSequence) {
        dataToSubmit.project_id = parseInt(projectId) || 1;
      }

      console.log('Submitting data:', dataToSubmit);
      console.log('Edit mode:', !!editingSequence);
      console.log('Sequence ID:', editingSequence?.sequence_id);

      if (editingSequence) {
        // Update existing sequence
        console.log(`🔄 Updating sequence ID: ${editingSequence.sequence_id}`);
        const response = await axios.put(
          `${API_BASE_URL}/api/sequencing/${editingSequence.sequence_id}`,
          dataToSubmit
        );
        console.log('✅ Update response:', response.data);
        setSuccess('Task sequence updated successfully');
      } else {
        // Create new sequence
        console.log('➕ Creating new sequence');
        const response = await axios.post(`${API_BASE_URL}/api/sequencing`, dataToSubmit);
        console.log('✅ Create response:', response.data);
        setSuccess('Task sequence created successfully');
      }

      // Refresh the list immediately after successful submission
      console.log('🔄 Refreshing sequences after submit...');
      await fetchSequences();
      handleCloseModal();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('❌ Error saving sequence:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 404) {
        setError('Sequence not found. It may have been deleted.');
      } else {
        setError(error.response?.data?.error || error.response?.data?.details || 'Failed to save sequence');
      }
    }
  };

  const handleEdit = (sequence) => {
    console.log('✏️ Editing sequence:', sequence);
    setEditingSequence(sequence);
    
    // Helper function to safely get values
    const safeNumber = (value, defaultValue = '') => {
      if (value === null || value === undefined) return defaultValue;
      return value.toString();
    };

    // Helper function to safely get arrays
    const safeArray = (value) => {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined) return [];
      return [];
    };

    // Populate form data with correct field mapping for existing database structure
    const newFormData = {
      sequence_name: sequence.sequence_name || '',
      sequence_code: sequence.sequence_code || '',
      sequence_order: safeNumber(sequence.sequence_order),
      block_id: safeNumber(sequence.block_id),
      work_description: sequence.work_description || '',
      methodology: sequence.methodology || '',
      safety_requirements: sequence.safety_requirements || '',
      estimated_days: safeNumber(sequence.estimated_days),
      buffer_days: safeNumber(sequence.buffer_days, '0'),
      predecessor_sequences: safeArray(sequence.predecessor_sequences),
      status: sequence.status || 'Planned',
      can_start: Boolean(sequence.can_start),
      prerequisites_met: Boolean(sequence.prerequisites_met),
      quality_checkpoints: safeArray(sequence.quality_checkpoints),
      labor_requirement: sequence.labor_requirement || '',
      equipment_requirement: sequence.equipment_requirement || '',
      material_requirement: sequence.material_requirement || ''
    };
    
    console.log('📄 Form data being set:', newFormData);
    setFormData(newFormData);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sequence?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/sequencing/${id}`);
      setSuccess('Sequence deleted successfully');
      fetchSequences();
    } catch (error) {
      console.error('Error deleting sequence:', error);
      setError(error.response?.data?.error || 'Failed to delete sequence');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSequence(null);
    setFormData({
      sequence_name: '',
      sequence_code: '',
      sequence_order: '',
      block_id: '',
      work_description: '',
      methodology: '',
      safety_requirements: '',
      estimated_days: '',
      buffer_days: '',
      predecessor_sequences: [],
      status: 'Planned',
      can_start: false,
      prerequisites_met: false,
      quality_checkpoints: [],
      labor_requirement: '',
      equipment_requirement: '',
      material_requirement: ''
    });
    setError('');
  };

  const filteredSequences = sequences.filter(sequence => {
    const matchesSearch = 
      sequence.sequence_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sequence.sequence_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || sequence.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Planned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Delayed': 'bg-red-100 text-red-800',
      'On Hold': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBlockName = (blockId) => {
    const block = blocks.find(b => b.block_id === blockId);
    return block ? block.block_name : 'N/A';
  };

  const getSequenceName = (sequenceId) => {
    const seq = sequences.find(s => s.sequence_id === sequenceId);
    return seq ? seq.sequence_name : 'Unknown';
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
              <GitBranch className="h-8 w-8 text-orange-600" />
              Sequencing Management
            </h1>
            {project && (
              <p className="text-gray-600 mt-1">
                {project.project_name} - Task Dependencies &amp; Critical Path
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchSequences()}
              className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 text-sm"
            >
              Refresh Data
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Task
            </button>
          </div>
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
            placeholder="Search tasks..."
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
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delayed">Delayed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Sequences Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ORDER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TASK NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PHASE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DURATION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPENDENCIES
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ASSIGNED TO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSequences.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No task sequences found. Click "Add Task" to create one.
                  </td>
                </tr>
              ) : (
                filteredSequences
                  .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                  .map((sequence) => (
                    <tr key={sequence.sequence_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {sequence.sequence_order}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {sequence.sequence_name}
                        </div>
                        <div className="text-xs text-gray-500">{sequence.sequence_code}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getBlockName(sequence.block_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sequence.estimated_days || 0} days
                        {sequence.buffer_days ? ` (+${sequence.buffer_days})` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sequence.predecessor_sequences && sequence.predecessor_sequences.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {sequence.predecessor_sequences.map(predId => (
                              <div key={predId} className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span>{getSequenceName(predId)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'None'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Not assigned
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(sequence.status)}`}>
                          {sequence.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(sequence)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sequence.sequence_id)}
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
                {editingSequence ? 'Edit Task Sequence' : 'Add Task Sequence'}
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
                      Task Name *
                    </label>
                    <input
                      type="text"
                      value={formData.sequence_name}
                      onChange={(e) => setFormData({ ...formData, sequence_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter task name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Order
                    </label>
                    <input
                      type="number"
                      value={formData.sequence_order}
                      onChange={(e) => setFormData({ ...formData, sequence_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Code
                    </label>
                    <input
                      type="text"
                      value={formData.sequence_code}
                      onChange={(e) => setFormData({ ...formData, sequence_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="SEQ-1"
                    />
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
                      <option value="">Select block</option>
                      {blocks.map(block => (
                        <option key={block.block_id} value={block.block_id}>
                          {block.block_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Description
                  </label>
                  <textarea
                    value={formData.work_description}
                    onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe the work to be done..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Methodology
                  </label>
                  <textarea
                    value={formData.methodology}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe the methodology and approach..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Safety Requirements
                  </label>
                  <textarea
                    value={formData.safety_requirements}
                    onChange={(e) => setFormData({ ...formData, safety_requirements: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="List safety requirements and precautions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Days
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_days}
                      onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buffer Days
                    </label>
                    <input
                      type="number"
                      value={formData.buffer_days}
                      onChange={(e) => setFormData({ ...formData, buffer_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="1"
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
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.can_start}
                      onChange={(e) => setFormData({ ...formData, can_start: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Can Start
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.prerequisites_met}
                      onChange={(e) => setFormData({ ...formData, prerequisites_met: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Prerequisites Met
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
                  {editingSequence ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequencingManagement;
