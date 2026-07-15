import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle, Filter } from 'lucide-react';
import axios from 'axios';

const VendorsManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type_id: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const VENDORS_URL = `${API_BASE_URL}/api/vendors`;
  const VENDOR_TYPES_URL = `${API_BASE_URL}/api/vendor_type`;

  useEffect(() => {
    fetchVendors();
    fetchVendorTypes();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(VENDORS_URL);
      setVendors(response.data);
    } catch (error) {
      setError('Failed to fetch vendors');
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorTypes = async () => {
    try {
      const response = await axios.get(VENDOR_TYPES_URL);
      setVendorTypes(response.data);
    } catch (error) {
      console.error('Error fetching vendor types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingVendor) {
        await axios.put(`${VENDORS_URL}/${editingVendor.vendor_id}`, formData);
        setSuccess('Vendor updated successfully');
      } else {
        await axios.post(VENDORS_URL, formData);
        setSuccess('Vendor created successfully');
      }
      fetchVendors();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save vendor');
      console.error('Error saving vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      vendor_type_id: vendor.vendor_type_id,
      contact_person: vendor.contact_person || '',
      contact_number: vendor.contact_number || '',
      email: vendor.email || '',
      address: vendor.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`${VENDORS_URL}/${vendorId}`);
        setSuccess('Vendor deleted successfully');
        fetchVendors();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete vendor');
        console.error('Error deleting vendor:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({
      vendor_name: '',
      vendor_type_id: '',
      contact_person: '',
      contact_number: '',
      email: '',
      address: ''
    });
    setError('');
  };

  const getVendorTypeName = (typeId) => {
    const type = vendorTypes.find(vt => vt.vendor_type_id === typeId);
    return type ? type.vendor_type : '';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !filterType || vendor.vendor_type_id === parseInt(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage vendor information</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="w-64">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Types</option>
            {vendorTypes.map(type => (
              <option key={type.vendor_type_id} value={type.vendor_type_id}>
                {type.vendor_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.vendor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {getVendorTypeName(vendor.vendor_type_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.contact_person || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.contact_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.vendor_id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Type *
                  </label>
                  <select
                    value={formData.vendor_type_id}
                    onChange={(e) => setFormData({ ...formData, vendor_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {vendorTypes.map(type => (
                      <option key={type.vendor_type_id} value={type.vendor_type_id}>
                        {type.vendor_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  <span>{editingVendor ? 'Update' : 'Create'}</span>
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
