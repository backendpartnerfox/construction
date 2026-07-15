import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Home } from 'lucide-react';

const RoomTypesManagement = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [formData, setFormData] = useState({
    room_type_name: '',
    description: '',
    category: '',
    is_active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  // Room type categories
  const ROOM_CATEGORIES = [
    'Living Space',
    'Bedroom',
    'Bathroom',
    'Kitchen',
    'Utility',
    'Circulation',
    'Storage',
    'Outdoor',
    'Commercial',
    'Other'
  ];

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/room_types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch room types');
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRoomTypes(data);
      } else if (data && Array.isArray(data.data)) {
        setRoomTypes(data.data);
      } else {
        console.error('Unexpected data format:', data);
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
      setRoomTypes([]);
      alert('Failed to fetch room types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRoomType(null);
    setFormData({
      room_type_name: '',
      description: '',
      category: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (roomType) => {
    setEditingRoomType(roomType);
    setFormData({
      room_type_name: roomType.room_type_name || '',
      description: roomType.description || '',
      category: roomType.category || '',
      is_active: roomType.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room type?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/room_types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Room type deleted successfully');
        fetchRoomTypes();
      } else {
        const error = await response.json();
        alert(`Failed to delete room type: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting room type:', error);
      alert('Failed to delete room type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.room_type_name.trim()) {
      alert('Please enter a room type name');
      return;
    }

    try {
      const url = editingRoomType
        ? `${API_BASE_URL}/api/room_types/${editingRoomType.room_type_id}`
        : `${API_BASE_URL}/api/room_types`;

      const method = editingRoomType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Room type ${editingRoomType ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchRoomTypes();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingRoomType ? 'update' : 'create'} room type: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving room type:', error);
      alert(`Failed to ${editingRoomType ? 'update' : 'create'} room type`);
    }
  };

  const filteredRoomTypes = Array.isArray(roomTypes) ? roomTypes.filter(rt =>
    rt.room_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rt.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Home className="h-8 w-8 text-orange-600" />
          Room Types Management
        </h1>
        <p className="text-gray-600 mt-1">Manage room types and categories</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search room types..."
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
          Add Room Type
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Type Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {filteredRoomTypes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No room types found
                </td>
              </tr>
            ) : (
              filteredRoomTypes.map((roomType) => (
                <tr key={roomType.room_type_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roomType.room_type_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {roomType.room_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {roomType.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {roomType.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      roomType.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {roomType.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(roomType)}
                      className="text-orange-600 hover:text-orange-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(roomType.room_type_id)}
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
                {editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}
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
                    Room Type Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room_type_name}
                    onChange={(e) => setFormData({ ...formData, room_type_name: e.target.value })}
                    placeholder="e.g., Master Bedroom, Living Room"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    {ROOM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this room type..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
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
                  {editingRoomType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypesManagement;
