import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Users } from 'lucide-react';

const EnquirySourcesManagement = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    source_name: '',
    source_type: '',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/enquiry_sources`);
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Error fetching enquiry sources:', error);
      alert('Failed to fetch enquiry sources');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSource(null);
    setFormData({
      source_name: '',
      source_type: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      source_name: source.source_name,
      source_type: source.source_type || '',
      is_active: source.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry source?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiry_sources/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Enquiry source deleted successfully');
        fetchSources();
      } else {
        const error = await response.json();
        alert(`Failed to delete enquiry source: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting enquiry source:', error);
      alert('Failed to delete enquiry source');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.source_name.trim()) {
      alert('Please enter source name');
      return;
    }

    try {
      const url = editingSource
        ? `${API_BASE_URL}/api/enquiry_sources/${editingSource.source_id}`
        : `${API_BASE_URL}/api/enquiry_sources`;

      const method = editingSource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Enquiry source ${editingSource ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchSources();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingSource ? 'update' : 'create'} enquiry source: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${editingSource ? 'updating' : 'creating'} enquiry source:`, error);
      alert(`Failed to ${editingSource ? 'update' : 'create'} enquiry source`);
    }
  };

  const filteredSources = sources.filter(source =>
    source.source_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.source_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Enquiry Sources Management</h1>
        </div>
        <p className="text-gray-600">Manage enquiry source master data</p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search enquiry sources..."
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
          Add Source
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source Type
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
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Loading enquiry sources...
                </td>
              </tr>
            ) : filteredSources.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No enquiry sources found
                </td>
              </tr>
            ) : (
              filteredSources.map((source) => (
                <tr key={source.source_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {source.source_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {source.source_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.source_type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      source.is_active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {source.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(source)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(source.source_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingSource ? 'Edit Enquiry Source' : 'Add New Enquiry Source'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Website, Referral, Social Media"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type
                  </label>
                  <input
                    type="text"
                    value={formData.source_type}
                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Online, Offline, Direct"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
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
                  {editingSource ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquirySourcesManagement;
