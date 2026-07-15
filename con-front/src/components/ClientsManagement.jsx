import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientsManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('clients');
  
  const [formData, setFormData] = useState({
    client_name: '',
    surname: '',
    client_type: 'Individual',
    primary_contact_name: '',
    email: '',
    phone: '',
    alternative_phone: '',
    whatsppnumber: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    gst_number: '',
    pan_number: '',
    client_category: '',
    referred_by: '',
    credit_limit: '',
    payment_terms: '',
    notes: '',
    is_active: true
  });

  const API_BASE_URL = 'http://localhost:9001/api';

  useEffect(() => {
    fetchClients();
  }, [filterType]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/clients`;
      
      if (filterType === 'active') {
        url = `${API_BASE_URL}/clients/active`;
      } else if (filterType !== 'all') {
        url = `${API_BASE_URL}/clients/type/${filterType}`;
      }
      
      const response = await axios.get(url);
      setClients(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch clients: ' + err.message);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchClients();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/clients/search?query=${searchQuery}`
      );
      setClients(response.data);
      setError(null);
    } catch (err) {
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // Update existing client
        await axios.put(
          `${API_BASE_URL}/clients/${editingClient.client_id}`,
          { ...formData, updated_by: 1 }
        );
        alert('Client updated successfully!');
      } else {
        // Create new client
        await axios.post(
          `${API_BASE_URL}/clients`,
          { ...formData, created_by: 1 }
        );
        alert('Client created successfully!');
      }
      
      resetForm();
      fetchClients();
    } catch (err) {
      alert('Error saving client: ' + err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name || '',
      surname: client.surname || '',
      client_type: client.client_type || 'Individual',
      primary_contact_name: client.primary_contact_name || '',
      email: client.email || '',
      phone: client.phone || '',
      alternative_phone: client.alternative_phone || '',
      whatsppnumber: client.whatsppnumber || '',
      address_line1: client.address_line1 || '',
      address_line2: client.address_line2 || '',
      city: client.city || '',
      state: client.state || '',
      postal_code: client.postal_code || '',
      country: client.country || 'India',
      gst_number: client.gst_number || '',
      pan_number: client.pan_number || '',
      client_category: client.client_category || '',
      referred_by: client.referred_by || '',
      credit_limit: client.credit_limit || '',
      payment_terms: client.payment_terms || '',
      notes: client.notes || '',
      is_active: client.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/clients/${clientId}`);
      alert('Client deleted successfully!');
      fetchClients();
    } catch (err) {
      alert('Error deleting client: ' + err.response?.data?.error || err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      surname: '',
      client_type: 'Individual',
      primary_contact_name: '',
      email: '',
      phone: '',
      alternative_phone: '',
      whatsppnumber: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      gst_number: '',
      pan_number: '',
      client_category: '',
      referred_by: '',
      credit_limit: '',
      payment_terms: '',
      notes: '',
      is_active: true
    });
    setEditingClient(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clients Management</h1>
        <p className="mt-2 text-gray-600">Manage your construction clients and their projects</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('clients')}
            className={`${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Clients List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {activeTab === 'clients' && (
        <>
          {/* Search and Filter Bar */}
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        fetchClients();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Only</option>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                  <option value="Government">Government</option>
                  <option value="Institution">Institution</option>
                </select>
              </div>

              {/* Add New Button */}
              <div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  + Add New Client
                </button>
              </div>
            </div>
          </div>

          {/* Client Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingClient ? 'Edit Client' : 'Add New Client'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Surname
                          </label>
                          <input
                            type="text"
                            name="surname"
                            value={formData.surname}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Type *
                          </label>
                          <select
                            name="client_type"
                            value={formData.client_type}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Individual">Individual</option>
                            <option value="Company">Company</option>
                            <option value="Government">Government</option>
                            <option value="Institution">Institution</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Category
                          </label>
                          <input
                            type="text"
                            name="client_category"
                            value={formData.client_category}
                            onChange={handleInputChange}
                            placeholder="VIP, Regular, etc."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Contact Name
                          </label>
                          <input
                            type="text"
                            name="primary_contact_name"
                            value={formData.primary_contact_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alternative Phone
                          </label>
                          <input
                            type="tel"
                            name="alternative_phone"
                            value={formData.alternative_phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            name="whatsppnumber"
                            value={formData.whatsppnumber}
                            onChange={handleInputChange}
                            maxLength="10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            name="address_line1"
                            value={formData.address_line1}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            name="address_line2"
                            value={formData.address_line2}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            GST Number
                          </label>
                          <input
                            type="text"
                            name="gst_number"
                            value={formData.gst_number}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PAN Number
                          </label>
                          <input
                            type="text"
                            name="pan_number"
                            value={formData.pan_number}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credit Limit
                          </label>
                          <input
                            type="number"
                            name="credit_limit"
                            value={formData.credit_limit}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Terms
                          </label>
                          <input
                            type="text"
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleInputChange}
                            placeholder="Net 30, Net 60, etc."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Referred By
                          </label>
                          <input
                            type="text"
                            name="referred_by"
                            value={formData.referred_by}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Active Client
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingClient ? 'Update Client' : 'Create Client'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Clients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Clients List ({clients.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No clients found. Click "Add New Client" to create one.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{client.client_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.client_name} {client.surname}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.client_type === 'Company' ? 'bg-blue-100 text-blue-800' :
                            client.client_type === 'Government' ? 'bg-purple-100 text-purple-800' :
                            client.client_type === 'Institution' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {client.client_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.city ? `${client.city}, ${client.state}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {client.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client.client_id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Clients */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Clients</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{clients.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Clients */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Clients</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {clients.filter(c => c.is_active).length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Companies */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Companies</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {clients.filter(c => c.client_type === 'Company').length}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Individuals */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Individuals</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {clients.filter(c => c.client_type === 'Individual').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution by Type</h3>
            <div className="space-y-4">
              {['Individual', 'Company', 'Government', 'Institution'].map(type => {
                const count = clients.filter(c => c.client_type === type).length;
                const percentage = clients.length > 0 ? ((count / clients.length) * 100).toFixed(1) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{type}</span>
                      <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;