import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Building } from 'lucide-react';

const VendorTypesManagement = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ vendor_type: '' });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/vendor_type`);
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error('Error fetching vendor types:', error);
      alert('Failed to fetch vendor types');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({ vendor_type: '' });
    setShowModal(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({ vendor_type: type.vendor_type });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor type?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor_type/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Vendor type deleted successfully');
        fetchTypes();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting vendor type:', error);
      alert('Failed to delete vendor type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor_type.trim()) {
      alert('Please enter vendor type');
      return;
    }
    try {
      const url = editingType
        ? `${API_BASE_URL}/api/vendor_type/${editingType.vendor_type_id}`
        : `${API_BASE_URL}/api/vendor_type`;
      const method = editingType ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert(`Vendor type ${editingType ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchTypes();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    }
  };

  const filteredTypes = types.filter(type =>
    type.vendor_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Vendor Types Management</h1>
        </div>
        <p className="text-gray-600">Manage vendor type master data</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vendor types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Type
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : filteredTypes.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No vendor types found</td></tr>
            ) : (
              filteredTypes.map((type) => (
                <tr key={type.vendor_type_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.vendor_type_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.vendor_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(type.vendor_type_id)} className="text-red-600 hover:text-red-900">
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
              <h2 className="text-xl font-bold">{editingType ? 'Edit Vendor Type' : 'Add New Vendor Type'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_type}
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Material Supplier, Contractor, Service Provider"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-5 h-5" />
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTypesManagement;
