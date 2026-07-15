import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, CheckCircle } from 'lucide-react';

const EnquiryStatusManagement = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formData, setFormData] = useState({
    status_name: '',
    status_order: '',
    color_code: '#3B82F6',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/enquiry_status`);
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      console.error('Error fetching enquiry statuses:', error);
      alert('Failed to fetch enquiry statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStatus(null);
    setFormData({
      status_name: '',
      status_order: '',
      color_code: '#3B82F6',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      status_name: status.status_name,
      status_order: status.status_order || '',
      color_code: status.color_code || '#3B82F6',
      is_active: status.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry status?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiry_status/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Enquiry status deleted successfully');
        fetchStatuses();
      } else {
        const error = await response.json();
        alert(`Failed to delete enquiry status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting enquiry status:', error);
      alert('Failed to delete enquiry status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.status_name.trim()) {
      alert('Please enter status name');
      return;
    }

    try {
      const url = editingStatus
        ? `${API_BASE_URL}/api/enquiry_status/${editingStatus.status_id}`
        : `${API_BASE_URL}/api/enquiry_status`;

      const method = editingStatus ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status_order: formData.status_order ? parseInt(formData.status_order) : null
        }),
      });

      if (response.ok) {
        alert(`Enquiry status ${editingStatus ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchStatuses();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingStatus ? 'update' : 'create'} enquiry status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${editingStatus ? 'updating' : 'creating'} enquiry status:`, error);
      alert(`Failed to ${editingStatus ? 'update' : 'create'} enquiry status`);
    }
  };

  const filteredStatuses = statuses.filter(status =>
    status.status_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStatuses = [...filteredStatuses].sort((a, b) => {
    if (a.status_order && b.status_order) {
      return a.status_order - b.status_order;
    }
    return 0;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Enquiry Status Management</h1>
        </div>
        <p className="text-gray-600">Manage enquiry status master data</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search enquiry statuses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Status
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : sortedStatuses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No enquiry statuses found</td>
              </tr>
            ) : (
              sortedStatuses.map((status) => (
                <tr key={status.status_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{status.status_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{status.status_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{status.status_order || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: status.color_code || '#3B82F6' }}></div>
                      <span className="text-gray-500">{status.color_code || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      status.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(status)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(status.status_id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingStatus ? 'Edit Enquiry Status' : 'Add New Enquiry Status'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.status_name}
                    onChange={(e) => setFormData({ ...formData, status_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.status_order}
                    onChange={(e) => setFormData({ ...formData, status_order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color_code}
                      onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color_code}
                      onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingStatus ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryStatusManagement;
