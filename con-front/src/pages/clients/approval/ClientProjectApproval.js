import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Plus, Eye, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientProjectApprovalService } from '../../../services/clientProjectApprovalService';
import { projectsService } from '../../../services/dropdownServices';

const ClientProjectApproval = ({ clientId }) => {
  const [approvals, setApprovals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewingApproval, setViewingApproval] = useState(null);
  const [formData, setFormData] = useState({
    client_id: clientId,
    project_id: '',
    drawings_id: '',
    drawing_version: ''
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching approvals for clientId:', clientId);
      
      const response = await clientProjectApprovalService.getByClientId(clientId);
      console.log('Approvals response:', response);
      
      if (response && response.success) {
        const approvalsData = Array.isArray(response.data) ? response.data : [];
        setApprovals(approvalsData);
        console.log('✅ Approvals loaded:', approvalsData.length);
      } else {
        setError(response?.error || 'Failed to load approvals');
        setApprovals([]);
      }
    } catch (error) {
      console.error('❌ Error loading approvals:', error);
      setError(error.message || error.error || 'Failed to load approvals');
      setApprovals([]);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log('Fetching projects for clientId:', clientId);
      
      const response = await projectsService.getByClientId(clientId);
      console.log('Projects response:', response);
      
      // Robust response handling
      let projectsArray = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        projectsArray = response.data;
      } else if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response && response.data) {
        if (Array.isArray(response.data)) {
          projectsArray = response.data;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          projectsArray = response.data.projects;
        }
      }
      
      console.log('✅ Projects loaded:', projectsArray.length);
      setProjects(projectsArray);
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchApprovals();
      fetchProjects();
    }
  }, [clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.project_id) {
      toast.error('Please select or enter a project ID');
      return;
    }

    try {
      console.log('Submitting approval request:', formData);
      
      const submitData = {
        client_id: parseInt(clientId),
        project_id: parseInt(formData.project_id),
        drawings_id: formData.drawings_id ? parseInt(formData.drawings_id) : null,
        drawing_version: formData.drawing_version || null
      };
      
      console.log('Submit data:', submitData);
      
      const response = await clientProjectApprovalService.create(submitData);
      console.log('Create response:', response);
      
      if (response && response.success) {
        toast.success('Approval request created successfully!');
        fetchApprovals();
        handleCloseModal();
      } else {
        toast.error(response?.error || 'Failed to create approval request');
      }
    } catch (error) {
      console.error('Error creating approval:', error);
      toast.error(error?.error || error?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this approval request?')) return;
    
    try {
      const response = await clientProjectApprovalService.delete(id);
      if (response && response.success) {
        toast.success('Approval request deleted!');
        fetchApprovals();
      } else {
        toast.error(response?.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting approval:', error);
      toast.error('Delete failed');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      client_id: clientId,
      project_id: '',
      drawings_id: '',
      drawing_version: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate summary statistics
  const summary = {
    total: approvals.length,
    pending: approvals.filter(a => a.approval_status === 'Pending').length,
    approved: approvals.filter(a => a.approval_status === 'Approved').length,
    rejected: approvals.filter(a => a.approval_status === 'Rejected').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading approvals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold mb-2">Error Loading Approvals</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchApprovals}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project Approvals</h2>
            <p className="text-sm text-gray-600">Manage approval workflow</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Request</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No approval requests found</p>
          <p className="text-sm text-gray-500 mb-4">Create your first approval request</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Create First Request
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawing Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawing ID</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      #{approval.id}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {approval.project_name || `Project #${approval.project_id}`}
                        </p>
                        {approval.project_code && (
                          <p className="text-xs text-gray-500">{approval.project_code}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {approval.drawing_version || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {approval.drawings_id || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setViewingApproval(approval)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(approval.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Request"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">New Approval Request</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                      Loading projects...
                    </div>
                  ) : (
                    <>
                      <select
                        name="project_id"
                        required={Array.isArray(projects) && projects.length > 0}
                        value={formData.project_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select Project</option>
                        {Array.isArray(projects) && projects.map(proj => (
                          <option key={proj.project_id} value={proj.project_id}>
                            {proj.project_name} {proj.project_code ? `- ${proj.project_code}` : ''}
                          </option>
                        ))}
                      </select>
                      {(!Array.isArray(projects) || projects.length === 0) && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ No projects found. Create a project for this client first, or enter project ID manually below.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Manual Project ID input - fallback */}
                {(!Array.isArray(projects) || projects.length === 0) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or Enter Project ID Manually *
                    </label>
                    <input
                      type="number"
                      name="project_id"
                      required
                      value={formData.project_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter project ID"
                    />
                  </div>
                )}

                {/* Drawing ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing ID
                  </label>
                  <input
                    type="number"
                    name="drawings_id"
                    value={formData.drawings_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter drawing ID"
                  />
                </div>

                {/* Drawing Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Version
                  </label>
                  <input
                    type="text"
                    name="drawing_version"
                    value={formData.drawing_version}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., v1.0, Rev A"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Create Request
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Approval Request #{viewingApproval.id}
                </h2>
                <button
                  onClick={() => setViewingApproval(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Project</p>
                  <p className="font-semibold text-gray-900">
                    {viewingApproval.project_name || `Project #${viewingApproval.project_id}`}
                  </p>
                  {viewingApproval.project_code && (
                    <p className="text-xs text-gray-500 mt-1">{viewingApproval.project_code}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Drawing ID</p>
                    <p className="font-semibold text-gray-900">
                      {viewingApproval.drawings_id || <span className="text-gray-400">N/A</span>}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Version</p>
                    <p className="font-semibold text-gray-900">
                      {viewingApproval.drawing_version || <span className="text-gray-400">N/A</span>}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingApproval(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectApproval;
