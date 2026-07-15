import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignToProjectService } from '../../../services/assignToProjectService';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ProjectAssignments = ({ projectId }) => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_id: projectId,
    assignee: '',
    assigned_by: 1, // Default admin user
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching assignments for project:', projectId);
      
      const response = await assignToProjectService.getByProjectId(projectId);
      console.log('Assignments response:', response);
      
      if (response && response.success) {
        const assignmentsData = Array.isArray(response.data) ? response.data : [];
        setAssignments(assignmentsData);
        console.log('✅ Assignments loaded:', assignmentsData.length);
      } else {
        setError(response?.error || 'Failed to load assignments');
        setAssignments([]);
      }
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      setError(error.message || error.error || 'Failed to load assignments');
      setAssignments([]);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Fetching users...');
      
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      console.log('Users response:', response.data);
      
      let usersData = [];
      if (response.data?.success && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      console.log('✅ Users loaded:', usersData.length);
      setUsers(usersData);
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchAssignments();
      fetchUsers();
    }
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.assignee) {
      toast.error('Please select a user to assign');
      return;
    }

    try {
      console.log('Submitting assignment:', formData);
      
      const submitData = {
        project_id: parseInt(projectId),
        assignee: parseInt(formData.assignee),
        assigned_by: parseInt(formData.assigned_by),
        date: formData.date
      };
      
      console.log('Submit data:', submitData);
      
      const response = await assignToProjectService.create(submitData);
      console.log('Create response:', response);
      
      if (response && response.success) {
        toast.success('User assigned successfully!');
        fetchAssignments();
        handleCloseModal();
      } else {
        toast.error(response?.error || 'Failed to assign user');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error(error?.error || error?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this project?`)) return;
    
    try {
      const response = await assignToProjectService.delete(id);
      if (response && response.success) {
        toast.success('Assignment removed successfully!');
        fetchAssignments();
      } else {
        toast.error(response?.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      project_id: projectId,
      assignee: '',
      assigned_by: 1,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading assignments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold mb-2">Error Loading Assignments</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAssignments}
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
          <Users className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project Team</h2>
            <p className="text-sm text-gray-600">Manage team assignments</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Assign User</span>
        </button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No team members assigned</p>
          <p className="text-sm text-gray-500 mb-4">Assign users to this project</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Assign First User
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      #{assignment.id}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.assignee_username || 'Unknown User'}
                        </p>
                        {assignment.assignee_email && (
                          <p className="text-xs text-gray-500">{assignment.assignee_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {assignment.assigned_by_username || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {assignment.date ? new Date(assignment.date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDelete(assignment.id, assignment.assignee_username)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove Assignment"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Assign User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign User to Project</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User *
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                      Loading users...
                    </div>
                  ) : (
                    <>
                      <select
                        name="assignee"
                        required
                        value={formData.assignee}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">-- Select User --</option>
                        {Array.isArray(users) && users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} {user.email ? `(${user.email})` : ''}
                          </option>
                        ))}
                      </select>
                      {(!Array.isArray(users) || users.length === 0) && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ No users available. Please create users first.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Assignment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loadingUsers}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign User
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
    </div>
  );
};

export default ProjectAssignments;
