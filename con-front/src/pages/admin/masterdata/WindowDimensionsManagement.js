import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Maximize2 } from 'lucide-react';

const WindowDimensionsManagement = () => {
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDimension, setEditingDimension] = useState(null);
  const [formData, setFormData] = useState({
    width: '',
    height: '',
    thickness: '',
    window_type: '',
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
      const response = await fetch(`${API_BASE_URL}/api/window_dimensions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch window dimensions');
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
      console.error('Error fetching window dimensions:', error);
      setDimensions([]);
      alert('Failed to fetch window dimensions. Please try again.');
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
      window_type: '',
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
      window_type: dimension.window_type || '',
      description: dimension.description || '',
      is_standard: dimension.is_standard !== false,
      is_active: dimension.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this window dimension?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/window_dimensions/${id}`, { 
        method: 'DELETE' 
      });
      
      if (response.ok) {
        alert('Window dimension deleted successfully');
        fetchDimensions();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting window dimension:', error);
      alert('Failed to delete window dimension');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.width || !formData.height || !formData.thickness) {
      alert('Please enter width, height, and thickness');
      return;
    }
    
    try {
      const url = editingDimension
        ? `${API_BASE_URL}/api/window_dimensions/${editingDimension.dimension_id}`
        : `${API_BASE_URL}/api/window_dimensions`;
      
      const method = editingDimension ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          thickness: parseFloat(formData.thickness)
        }),
      });
      
      if (response.ok) {
        alert(`Window dimension ${editingDimension ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchDimensions();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    }
  };

  const filteredDimensions = Array.isArray(dimensions) ? dimensions.filter(dim =>
    dim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dim.window_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dim.width?.toString().includes(searchTerm) ||
    dim.height?.toString().includes(searchTerm)
  ) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Maximize2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Window Dimensions Management</h1>
        </div>
        <p className="text-gray-600">Manage window dimension master data</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search window dimensions..."
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
          Add Dimension
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : filteredDimensions.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No window dimensions found</td></tr>
            ) : (
              filteredDimensions.map((dim) => (
                <tr key={dim.dimension_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dim.dimension_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dim.width}' × {dim.height}' × {dim.thickness}"
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dim.window_type || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dim.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      dim.is_standard !== false ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dim.is_standard !== false ? 'Standard' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      dim.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dim.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(dim)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(dim.dimension_id)} className="text-red-600 hover:text-red-900">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingDimension ? 'Edit Window Dimension' : 'Add New Window Dimension'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (ft) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (ft) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thickness (in) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Window Type</label>
                  <input
                    type="text"
                    value={formData.window_type}
                    onChange={(e) => setFormData({ ...formData, window_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sliding, Casement, Fixed"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Standard bedroom window"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_standard"
                    checked={formData.is_standard}
                    onChange={(e) => setFormData({ ...formData, is_standard: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_standard" className="ml-2 text-sm text-gray-700">Standard</label>
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

export default WindowDimensionsManagement;
