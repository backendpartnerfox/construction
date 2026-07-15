import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, CreditCard } from 'lucide-react';

const PaymentMethodsManagement = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    method_name: '',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/payment_methods`);
      const data = await response.json();
      setMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      alert('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMethod(null);
    setFormData({ method_name: '', is_active: true });
    setShowModal(true);
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      method_name: method.method_name,
      is_active: method.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment_methods/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Payment method deleted successfully');
        fetchMethods();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.method_name.trim()) {
      alert('Please enter method name');
      return;
    }
    try {
      const url = editingMethod
        ? `${API_BASE_URL}/api/payment_methods/${editingMethod.payment_method_id}`
        : `${API_BASE_URL}/api/payment_methods`;
      const method = editingMethod ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert(`Payment method ${editingMethod ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchMethods();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    }
  };

  const filteredMethods = methods.filter(method =>
    method.method_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Payment Methods Management</h1>
        </div>
        <p className="text-gray-600">Manage payment method master data</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search payment methods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Method
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : filteredMethods.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No payment methods found</td></tr>
            ) : (
              filteredMethods.map((method) => (
                <tr key={method.payment_method_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{method.payment_method_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.method_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      method.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {method.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(method)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(method.payment_method_id)} className="text-red-600 hover:text-red-900">
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
              <h2 className="text-xl font-bold">{editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.method_name}
                    onChange={(e) => setFormData({ ...formData, method_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Cash, Card, UPI"
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
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-5 h-5" />
                  {editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsManagement;
