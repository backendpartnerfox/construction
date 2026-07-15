import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Store } from 'lucide-react';

const VendorsManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type_id: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchVendors();
    fetchVendorTypes();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/vendors`);
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      alert('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor_type`);
      const data = await response.json();
      setVendorTypes(data);
    } catch (error) {
      console.error('Error fetching vendor types:', error);
    }
  };

  const handleAdd = () => {
    setEditingVendor(null);
    setFormData({
      vendor_name: '',
      vendor_type_id: '',
      contact_person: '',
      contact_number: '',
      email: '',
      address: ''
    });
    setShowModal(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      vendor_type_id: vendor.vendor_type_id || '',
      contact_person: vendor.contact_person || '',
      contact_number: vendor.contact_number || '',
      email: vendor.email || '',
      address: vendor.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Vendor deleted successfully');
        fetchVendors();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor_name.trim()) {
      alert('Please enter vendor name');
      return;
    }
    try {
      const url = editingVendor
        ? `${API_BASE_URL}/api/vendors/${editingVendor.vendor_id}`
        : `${API_BASE_URL}/api/vendors`;
      const method = editingVendor ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vendor_type_id: formData.vendor_type_id || null
        }),
      });
      if (response.ok) {
        alert(`Vendor ${editingVendor ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchVendors();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    }
  };

  const getVendorTypeName = (typeId) => {
    const type = vendorTypes.find(t => t.vendor_type_id === typeId);
    return type ? type.vendor_type : '-';
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Vendors Management</h1>
        </div>
        <p className="text-gray-600">Manage vendor master data</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : filteredVendors.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No vendors found</td></tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.vendor_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getVendorTypeName(vendor.vendor_type_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contact_person || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contact_number || vendor.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(vendor)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(vendor.vendor_id)} className="text-red-600 hover:text-red-900">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Type</label>
                  <select
                    value={formData.vendor_type_id}
                    onChange={(e) => setFormData({ ...formData, vendor_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {vendorTypes.map(type => (
                      <option key={type.vendor_type_id} value={type.vendor_type_id}>{type.vendor_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-5 h-5" />
                  {editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsManagement;
