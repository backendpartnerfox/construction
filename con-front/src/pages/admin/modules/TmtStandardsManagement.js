import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, AlertCircle, Wrench } from 'lucide-react';
import axios from 'axios';

const TmtStandardsManagement = () => {
  const [tmtStandards, setTmtStandards] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    tmt_item_id: '',
    dia: '',
    length: '12',
    weight_per_meter: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const TMT_STANDARDS_URL = `${API_BASE_URL}/api/item_tmt_standards`;
  const ITEMS_URL = `${API_BASE_URL}/api/items`;

  useEffect(() => {
    fetchTmtStandards();
    fetchItems();
  }, []);

  const fetchTmtStandards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(TMT_STANDARDS_URL);
      setTmtStandards(response.data);
    } catch (error) {
      setError('Failed to fetch TMT standards');
      console.error('Error fetching TMT standards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(ITEMS_URL);
      // Filter only TMT related items
      const tmtItems = response.data.filter(item => 
        item.item_name.toLowerCase().includes('tmt') || 
        item.item_category === 'Structural' ||
        item.item_id === 1
      );
      setItems(tmtItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingStandard) {
        await axios.put(`${TMT_STANDARDS_URL}/${editingStandard.tmt_standard_id}`, formData);
        setSuccess('TMT standard updated successfully');
      } else {
        await axios.post(TMT_STANDARDS_URL, formData);
        setSuccess('TMT standard created successfully');
      }
      fetchTmtStandards();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save TMT standard');
      console.error('Error saving TMT standard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (standard) => {
    setEditingStandard(standard);
    setFormData({
      tmt_item_id: standard.tmt_item_id,
      dia: standard.dia,
      length: standard.length,
      weight_per_meter: standard.weight_per_meter
    });
    setShowModal(true);
  };

  const handleDelete = async (standardId) => {
    if (window.confirm('Are you sure you want to delete this TMT standard? This may affect existing pricing data.')) {
      try {
        await axios.delete(`${TMT_STANDARDS_URL}/${standardId}`);
        setSuccess('TMT standard deleted successfully');
        fetchTmtStandards();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete TMT standard');
        console.error('Error deleting TMT standard:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStandard(null);
    setFormData({
      tmt_item_id: '',
      dia: '',
      length: '12',
      weight_per_meter: ''
    });
    setError('');
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : '-';
  };

  const calculateWeightOfBar = (standard) => {
    return (standard.length * standard.weight_per_meter).toFixed(3);
  };

  // Standard TMT bar weights per meter based on diameter
  const standardWeights = {
    '6': 0.222,
    '8': 0.395,
    '10': 0.617,
    '12': 0.888,
    '16': 1.579,
    '20': 2.466,
    '25': 3.854,
    '32': 6.313,
    '40': 9.865
  };

  // Auto-calculate weight per meter based on diameter
  const handleDiameterChange = (dia) => {
    setFormData({
      ...formData,
      dia: dia,
      weight_per_meter: standardWeights[dia] || ''
    });
  };

  const filteredStandards = tmtStandards.filter(standard => {
    const matchesSearch = 
      getItemName(standard.tmt_item_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      standard.dia?.toString().includes(searchTerm) ||
      standard.length?.toString().includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TMT Standards</h1>
          <p className="text-gray-600">Manage TMT bar specifications and standards</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Standard</span>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search standards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diameter (mm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length (m)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight/Meter (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredStandards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No standards found
                  </td>
                </tr>
              ) : (
                filteredStandards.map((standard) => (
                  <tr key={standard.tmt_standard_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getItemName(standard.tmt_item_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">{standard.dia}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standard.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(standard.weight_per_meter).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {standard.weight_of_full_bar ? parseFloat(standard.weight_of_full_bar).toFixed(3) : calculateWeightOfBar(standard)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {standard.dia}mm × {standard.length}m
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(standard)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(standard.tmt_standard_id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStandard ? 'Edit TMT Standard' : 'Add TMT Standard'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-4">
                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TMT Item *
                  </label>
                  <select
                    value={formData.tmt_item_id}
                    onChange={(e) => setFormData({ ...formData, tmt_item_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Diameter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter (mm) *
                  </label>
                  <select
                    value={formData.dia}
                    onChange={(e) => handleDiameterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Diameter</option>
                    {Object.keys(standardWeights).map(dia => (
                      <option key={dia} value={dia}>
                        {dia}mm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (meters) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Weight per Meter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight per Meter (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.weight_per_meter}
                    onChange={(e) => setFormData({ ...formData, weight_per_meter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  {formData.dia && standardWeights[formData.dia] && (
                    <p className="mt-1 text-sm text-gray-500">
                      Standard weight for {formData.dia}mm: {standardWeights[formData.dia]} kg/m
                    </p>
                  )}
                </div>

                {/* Weight Preview */}
                {formData.weight_per_meter && formData.length && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Total Bar Weight:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {(parseFloat(formData.weight_per_meter) * parseFloat(formData.length)).toFixed(3)} kg
                      </span>
                    </div>
                  </div>
                )}
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
                  <span>{editingStandard ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TmtStandardsManagement;
