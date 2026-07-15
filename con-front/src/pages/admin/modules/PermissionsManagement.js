import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Key, AlertCircle, Lock, Unlock } from 'lucide-react';
import axios from 'axios';

const PermissionsManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedResource, setSelectedResource] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const API_URL = `${API_BASE_URL}/api/permissions`;

  // Common resources and actions
  const resources = [
    'users', 'roles', 'permissions', 'items', 'elements', 'vendors',
    'projects', 'clients', 'enquiries', 'leads', 'packages',
    'measurements', 'boq', 'costing', 'components', 'units'
  ];

  const actions = [
    'create', 'read', 'update', 'delete', 'manage', 'view',
    'approve', 'reject', 'export', 'import'
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setPermissions(response.data);
    } catch (error) {
      setError('Failed to fetch permissions');
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingPermission) {
        await axios.put(`${API_URL}/${editingPermission.id}`, formData);
        setSuccess('Permission updated successfully');
      } else {
        await axios.post(API_URL, formData);
        setSuccess('Permission created successfully');
      }
      
      fetchPermissions();
      resetForm();
      setShowModal(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Operation failed');
      console.error('Error saving permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this permission? This will remove the permission from all roles.')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccess('Permission deleted successfully');
        fetchPermissions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete permission');
        console.error('Error deleting permission:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name || '',
      description: permission.description || '',
      resource: permission.resource || '',
      action: permission.action || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: ''
    });
    setEditingPermission(null);
    setError('');
  };

  // Auto-generate permission name based on resource and action
  const generatePermissionName = () => {
    if (formData.resource && formData.action) {
      const name = `${formData.action}_${formData.resource}`;
      setFormData(prev => ({ ...prev, name }));
    }
  };

  useEffect(() => {
    if (formData.resource && formData.action && !editingPermission) {
      generatePermissionName();
    }
  }, [formData.resource, formData.action]);

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      (permission.name && permission.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.resource && permission.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.action && permission.action.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesResource = selectedResource === 'all' || permission.resource === selectedResource;
    
    return matchesSearch && matchesResource;
  });

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const resource = permission.resource || 'Other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {});

  // Get unique resources for filter
  const uniqueResources = ['all', ...new Set(permissions.map(p => p.resource).filter(Boolean))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600">Manage system permissions and access controls</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Permission</span>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Permissions</p>
              <p className="text-3xl font-bold mt-2">{permissions.length}</p>
            </div>
            <Key className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Resources</p>
              <p className="text-3xl font-bold mt-2">{uniqueResources.length - 1}</p>
            </div>
            <Lock className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <p className="text-3xl font-bold mt-2">{permissions.filter(p => p.is_active !== false).length}</p>
            </div>
            <Unlock className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Actions</p>
              <p className="text-3xl font-bold mt-2">{new Set(permissions.map(p => p.action)).size}</p>
            </div>
            <Key className="h-12 w-12 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>

        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {uniqueResources.map((resource) => (
            <option key={resource} value={resource}>
              {resource === 'all' ? 'All Resources' : resource.charAt(0).toUpperCase() + resource.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Permissions Grouped by Resource */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <Key className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No permissions found</p>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center capitalize">
                  <Key className="h-5 w-5 mr-2 text-purple-500" />
                  {resource}
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    ({perms.length} permissions)
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {perms.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                            {permission.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{permission.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {permission.created_at ? new Date(permission.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(permission)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(permission.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
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
          ))
        )}
      </div>

      {/* Add/Edit Permission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPermission ? 'Edit Permission' : 'Add New Permission'}
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
              {/* Resource */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource *
                </label>
                <select
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Resource</option>
                  {resources.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action *
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Action</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permission Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="e.g., create_project"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated based on resource and action
                </p>
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
                  placeholder="Brief description of what this permission allows"
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
                  <span>{loading ? 'Saving...' : 'Save Permission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;
