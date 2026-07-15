import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Building2 } from 'lucide-react';

const CitiesManagement = () => {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    state_id: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchCities();
    fetchStates();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cities`);
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
      alert('Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/states`);
      const data = await response.json();
      setStates(data);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const handleAdd = () => {
    setEditingCity(null);
    setFormData({
      name: '',
      state_id: ''
    });
    setShowModal(true);
  };

  const handleEdit = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      state_id: city.state_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this city?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('City deleted successfully');
        fetchCities();
      } else {
        const error = await response.json();
        alert(`Failed to delete city: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('Failed to delete city');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter city name');
      return;
    }

    try {
      const url = editingCity
        ? `${API_BASE_URL}/api/cities/${editingCity.id}`
        : `${API_BASE_URL}/api/cities`;

      const method = editingCity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          state_id: formData.state_id || null
        }),
      });

      if (response.ok) {
        alert(`City ${editingCity ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchCities();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingCity ? 'update' : 'create'} city: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${editingCity ? 'updating' : 'creating'} city:`, error);
      alert(`Failed to ${editingCity ? 'update' : 'create'} city`);
    }
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : '-';
  };

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getStateName(city.state_id)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Cities Management</h1>
        </div>
        <p className="text-gray-600">Manage city master data</p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cities..."
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
          Add City
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
                City Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Loading cities...
                </td>
              </tr>
            ) : filteredCities.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No cities found
                </td>
              </tr>
            ) : (
              filteredCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {city.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {city.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStateName(city.state_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(city)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(city.id)}
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
                {editingCity ? 'Edit City' : 'Add New City'}
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
                    City Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state_id}
                    onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
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
                  {editingCity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesManagement;
