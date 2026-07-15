import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const LeadSelectionPackage = ({ leadId }) => {
  const [selections, setSelections] = useState([]);
  const [packages, setPackages] = useState([]);
  const [items, setItems] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproved, setFilterApproved] = useState('all');
  const [formData, setFormData] = useState({
    lead_id: leadId,
    package_id: '',
    item_id: '',
    default_choice_id: '',
    default_choice_price: '',
    selected_choice_id: '',
    selected_choice_price: '',
    gst_percentage: '18',
    remarks: ''
  });

  useEffect(() => {
    fetchSelections();
    fetchPackages();
    fetchItems();
  }, [leadId]);

  // Fetch choices when item is selected
  useEffect(() => {
    if (formData.item_id) {
      fetchChoicesForItem(formData.item_id);
    }
  }, [formData.item_id]);

  const fetchSelections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lead_selection_package/lead/${leadId}`);
      setSelections(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error loading selections:', error);
      toast.error('Failed to load package selections');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/packages');
      const packagesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/items');
      const itemsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    }
  };

  const fetchChoicesForItem = async (itemId) => {
    try {
      const response = await axios.get(`/api/item_choices/item/${itemId}`);
      const choicesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      console.log('Fetched choices for item:', itemId, choicesData);
      setChoices(choicesData);
    } catch (error) {
      console.error('Error loading choices:', error);
      setChoices([]);
    }
  };

  const handleChoiceChange = (choiceId, fieldName) => {
    const selectedChoice = choices.find(c => c.choice_option_id === parseInt(choiceId));
    if (selectedChoice) {
      setFormData({
        ...formData,
        [fieldName]: choiceId,
        [`${fieldName.replace('_id', '_price')}`]: selectedChoice.package || selectedChoice.price || 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let dataToSend;
      
      if (editingSelection) {
        // When editing, only send the fields that can be updated
        dataToSend = {
          selected_choice_id: formData.selected_choice_id,
          selected_choice_price: formData.selected_choice_price,
          gst_percentage: formData.gst_percentage,
          remarks: formData.remarks
        };
        await axios.put(`/api/lead_selection_package/${editingSelection.id}`, dataToSend);
        toast.success('Selection updated successfully!');
      } else {
        // When creating, send all fields
        dataToSend = {
          ...formData,
          lead_id: leadId
        };
        await axios.post('/api/lead_selection_package', dataToSend);
        toast.success('Selection created successfully!');
      }
      
      fetchSelections();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (selection) => {
    setEditingSelection(selection);
    setFormData({
      lead_id: selection.lead_id,
      package_id: selection.package_id || '',
      item_id: selection.item_id || '',
      default_choice_id: selection.default_choice_id || '',
      default_choice_price: selection.default_choice_price || '',
      selected_choice_id: selection.selected_choice_id || '',
      selected_choice_price: selection.selected_choice_price || '',
      gst_percentage: selection.gst_percentage || '18',
      remarks: selection.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this selection?')) return;
    
    try {
      await axios.delete(`/api/lead_selection_package/${id}`);
      toast.success('Selection deleted successfully!');
      fetchSelections();
    } catch (error) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSelection(null);
    setFormData({
      lead_id: leadId,
      package_id: '',
      item_id: '',
      default_choice_id: '',
      default_choice_price: '',
      selected_choice_id: '',
      selected_choice_price: '',
      gst_percentage: '18',
      remarks: ''
    });
    setChoices([]);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateDifference = (selected, defaultPrice) => {
    return parseFloat(selected || 0) - parseFloat(defaultPrice || 0);
  };

  const filteredSelections = selections.filter(selection => {
    const matchesSearch = !searchTerm || 
      selection.item_id?.toString().includes(searchTerm) ||
      selection.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterApproved === 'all' ||
      (filterApproved === 'approved' && selection.is_approved) ||
      (filterApproved === 'pending' && !selection.is_approved);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Package Selections</h2>
            <p className="text-sm text-gray-600">Manage item choices and pricing</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Selection</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Selections Table */}
      {filteredSelections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No package selections found</p>
          <p className="text-sm text-gray-500 mt-1">Create your first package selection</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selected Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSelections.map((selection) => {
                const difference = calculateDifference(selection.selected_choice_price, selection.default_choice_price);
                
                return (
                  <tr key={selection.id || selection.lead_selection_package_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {selection.package_name || `PKG-${selection.package_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {selection.item_name || `Item-${selection.item_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(selection.default_choice_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(selection.selected_choice_price)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {difference > 0 && '+'}{formatCurrency(difference)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {selection.gst_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {selection.is_approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(selection)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(selection.id || selection.lead_selection_package_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingSelection ? 'Edit' : 'Create'} Package Selection
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Package Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package ID *
                    </label>
                    <select
                      required
                      value={formData.package_id}
                      onChange={(e) => setFormData({...formData, package_id: e.target.value})}
                      disabled={editingSelection !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Package</option>
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.package_name || `Package ${pkg.id}`}
                        </option>
                      ))}
                    </select>
                    {editingSelection && (
                      <p className="text-xs text-gray-500 mt-1">Package cannot be changed when editing</p>
                    )}
                  </div>

                  {/* Item Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item ID *
                    </label>
                    <select
                      required
                      value={formData.item_id}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          item_id: e.target.value,
                          default_choice_id: '',
                          selected_choice_id: '',
                          default_choice_price: '',
                          selected_choice_price: ''
                        });
                      }}
                      disabled={editingSelection !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Item</option>
                      {items.map(item => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.item_name || `Item ${item.item_id}`}
                        </option>
                      ))}
                    </select>
                    {editingSelection && (
                      <p className="text-xs text-gray-500 mt-1">Item cannot be changed when editing</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Default Choice Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Choice ID *
                    </label>
                    <select
                      required
                      value={formData.default_choice_id}
                      onChange={(e) => handleChoiceChange(e.target.value, 'default_choice_id')}
                      disabled={!formData.item_id || choices.length === 0 || editingSelection !== null}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Choice</option>
                      {choices.map(choice => (
                        <option key={choice.choice_option_id} value={choice.choice_option_id}>
                        {choice.display_name || choice.brand || choice.model || choice.description?.substring(0, 50) || `Choice ${choice.choice_option_id}`} - ₹{parseFloat(choice.package || choice.price || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {formData.item_id && choices.length === 0 && !editingSelection && (
                      <p className="text-xs text-gray-500 mt-1">No choices available for this item</p>
                    )}
                    {editingSelection && (
                      <p className="text-xs text-gray-500 mt-1">Default choice cannot be changed when editing</p>
                    )}
                  </div>

                  {/* Default Choice Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Choice Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.default_choice_price}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Selected Choice Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Choice ID *
                    </label>
                    <select
                      required
                      value={formData.selected_choice_id}
                      onChange={(e) => handleChoiceChange(e.target.value, 'selected_choice_id')}
                      disabled={!formData.item_id || choices.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Choice</option>
                      {choices.map(choice => (
                        <option key={choice.choice_option_id} value={choice.choice_option_id}>
                          {choice.display_name || choice.brand || choice.model || choice.description?.substring(0, 50) || `Choice ${choice.choice_option_id}`} - ₹{parseFloat(choice.package || choice.price || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Choice Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Choice Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.selected_choice_price}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Percentage *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({...formData, gst_percentage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {editingSelection ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSelectionPackage;
