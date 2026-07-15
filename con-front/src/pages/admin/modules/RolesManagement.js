import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Shield, AlertCircle, Users, Key } from 'lucide-react';
import axios from 'axios';

const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api/roles`;
  const PERMISSIONS_URL = `${API_BASE_URL}/api/permissions`;

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setRoles(response.data);
    } catch (error) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(PERMISSIONS_URL);
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingRole) {
        await axios.put(`${API_URL}/${editingRole.id}`, formData);
        setSuccess('Role updated successfully');
      } else {
        await axios.post(API_URL, formData);
        setSuccess('Role created successfully');
      }
      
      fetchRoles();
      resetForm();
      setShowModal(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Operation failed');
      console.error('Error saving role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role? This will remove the role from all users.')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccess('Role deleted successfully');
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete role');
        console.error('Error deleting role:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || ''
    });
    setShowModal(true);
  };

  const handleManagePermissions = async (role) => {
    setSelectedRole(role);
    try {
      const response = await axios.get(`${API_URL}/${role.id}/permissions`);
      setSelectedPermissions(response.data.map(p => p.id));
    } catch (error) {
      setError('Failed to fetch role permissions');
      console.error('Error fetching role permissions:', error);
    }
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`${API_URL}/${selectedRole.id}/permissions`, {
        permissionIds: selectedPermissions
      });
      setSuccess('Permissions updated successfully');
      fetchRoles();
      setShowPermissionsModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update permissions');
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingRole(null);
    setError('');
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const filteredRoles = roles.filter(role =>
    (role.name && role.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource || 'Other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-green-500" />
            <p className="ml-3 text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Roles</p>
              <p className="text-3xl font-bold mt-2">{roles.length}</p>
            </div>
            <Shield className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Permissions</p>
              <p className="text-3xl font-bold mt-2">{permissions.length}</p>
            </div>
            <Key className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Roles</p>
              <p className="text-3xl font-bold mt-2">{roles.length}</p>
            </div>
            <Users className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-orange-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{role.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        {role.permissions_count || 0} permissions
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {role.users_count || 0} users
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManagePermissions(role)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Manage Permissions"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="e.g., Project Manager"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Brief description of the role"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Permissions
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Role: <span className="font-medium">{selectedRole.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 capitalize flex items-center">
                      <Key className="h-4 w-4 mr-2 text-purple-500" />
                      {resource}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {perms.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedPermissions.length}</span> permissions selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePermissions}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Updating...' : 'Update Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;
