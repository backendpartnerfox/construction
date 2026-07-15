import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, DoorOpen } from 'lucide-react';

const DoorDimensionsManagement = () => {
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDimension, setEditingDimension] = useState(null);
  const [formData, setFormData] = useState({
    width: '',
    height: '',
    thickness: '',
    description: '',
    is_standard: true,
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/door_dimensions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch door dimensions');
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setDimensions(data);
      } else if (data && Array.isArray(data.data)) {
        setDimensions(data.data);
      } else {
        console.error('Unexpected data format:', data);
        setDimensions([]);
      }
    } catch (error) {
      console.error('Error fetching door dimensions:', error);
      setDimensions([]);
      alert('Failed to fetch door dimensions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDimension(null);
    setFormData({
      width: '',
      height: '',
      thickness: '',
      description: '',
      is_standard: true,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (dimension) => {
    setEditingDimension(dimension);
    setFormData({
      width: dimension.width || '',
      height: dimension.height || '',
      thickness: dimension.thickness || '',
      description: dimension.description || '',
      is_standard: dimension.is_standard !== false,
      is_active: dimension.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this door dimension?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/door_dimensions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Door dimension deleted successfully');
        fetchDimensions();
      } else {
        const error = await response.json();
        alert(`Failed to delete door dimension: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting door dimension:', error);
      alert('Failed to delete door dimension');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.width || !formData.height || !formData.thickness) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const url = editingDimension
        ? `${API_BASE_URL}/api/door_dimensions/${editingDimension.dimension_id}`
        : `${API_BASE_URL}/api/door_dimensions`;

      const method = editingDimension ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          thickness: parseFloat(formData.thickness)
        }),
      });

      if (response.ok) {
        alert(`Door dimension ${editingDimension ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchDimensions();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingDimension ? 'update' : 'create'} door dimension: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving door dimension:', error);
      alert(`Failed to ${editingDimension ? 'update' : 'create'} door dimension`);
    }
  };

  const filteredDimensions = Array.isArray(dimensions) ? dimensions.filter(dim =>
    dim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dim.width?.toString().includes(searchTerm) ||
    dim.height?.toString().includes(searchTerm)
  ) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <DoorOpen className="h-8 w-8 text-orange-600" />
          Door Dimensions Management
        </h1>
        <p className="text-gray-600 mt-1">Manage standard door sizes and specifications</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search door dimensions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Dimension
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Width (ft)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Height (ft)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thickness (ft)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
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
            {filteredDimensions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No door dimensions found
                </td>
              </tr>
            ) : (
              filteredDimensions.map((dimension) => (
                <tr key={dimension.dimension_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dimension.width}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dimension.height}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dimension.thickness}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dimension.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dimension.is_standard
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dimension.is_standard ? 'Standard' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dimension.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dimension.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(dimension)}
                      className="text-orange-600 hover:text-orange-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dimension.dimension_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingDimension ? 'Edit Door Dimension' : 'Add New Door Dimension'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (feet) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    placeholder="e.g., 3.0, 3.5, 4.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (feet) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="e.g., 7.0, 7.5, 8.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thickness (feet) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                    placeholder="e.g., 0.15, 0.20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Standard Interior Door, Main Entrance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_standard}
                      onChange={(e) => setFormData({ ...formData, is_standard: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Standard
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingDimension ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoorDimensionsManagement;
