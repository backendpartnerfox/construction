import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Boxes } from 'lucide-react';

const ElementsManagement = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [formData, setFormData] = useState({
    element_name: '',
    element_category: '',
    element_description: '',
    linetype: '',
    phase: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  useEffect(() => {
    fetchElements();
  }, []);

  const fetchElements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/elements`);
      const data = await response.json();
      setElements(data);
    } catch (error) {
      console.error('Error fetching elements:', error);
      alert('Failed to fetch elements');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingElement(null);
    setFormData({
      element_name: '',
      element_category: '',
      element_description: '',
      linetype: '',
      phase: ''
    });
    setShowModal(true);
  };

  const handleEdit = (element) => {
    setEditingElement(element);
    setFormData({
      element_name: element.element_name,
      element_category: element.element_category || '',
      element_description: element.element_description || '',
      linetype: element.linetype || '',
      phase: element.phase || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this element?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/elements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Element deleted successfully');
        fetchElements();
      } else {
        alert('Failed to delete element');
      }
    } catch (error) {
      console.error('Error deleting element:', error);
      alert('Failed to delete element');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingElement
        ? `${API_BASE_URL}/elements/${editingElement.element_id}`
        : `${API_BASE_URL}/elements`;

      const method = editingElement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Element ${editingElement ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchElements();
      } else {
        alert(`Failed to ${editingElement ? 'update' : 'create'} element`);
      }
    } catch (error) {
      console.error('Error saving element:', error);
      alert(`Failed to ${editingElement ? 'update' : 'create'} element`);
    }
  };

  const filteredElements = elements.filter(element =>
    element.element_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (element.element_category && element.element_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (element.element_description && element.element_description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <Boxes className="h-8 w-8 text-orange-600" />
          Elements Management
        </h1>
        <p className="text-gray-600 mt-1">Manage construction elements like footings, columns, beams, etc.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search elements..."
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
          Add Element
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Element Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Line Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredElements.map((element) => (
              <tr key={element.element_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {element.element_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {element.element_category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {element.element_description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {element.linetype}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {element.phase}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(element)}
                    className="text-orange-600 hover:text-orange-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(element.element_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingElement ? 'Edit Element' : 'Add New Element'}
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
                    Element Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.element_name}
                    onChange={(e) => setFormData({ ...formData, element_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.element_category}
                    onChange={(e) => setFormData({ ...formData, element_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.element_description}
                    onChange={(e) => setFormData({ ...formData, element_description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line Type
                  </label>
                  <input
                    type="text"
                    value={formData.linetype}
                    onChange={(e) => setFormData({ ...formData, linetype: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phase
                  </label>
                  <input
                    type="text"
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
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
                  {editingElement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementsManagement;
