import React, { useState, useEffect } from 'react';
import { CheckSquare, Star, Plus, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const LeadItemChoices = ({ leadId }) => {
  const [choices, setChoices] = useState([]);
  const [items, setItems] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChoice, setEditingChoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    lead_id: leadId,
    item_id: '',
    choice_id: '',
    is_default: false,
    notes: ''
  });

  useEffect(() => {
    fetchChoices();
    fetchItems();
  }, [leadId]);

  // Fetch item choices when item is selected
  useEffect(() => {
    if (formData.item_id) {
      fetchItemChoices(formData.item_id);
    }
  }, [formData.item_id]);

  const fetchChoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lead_item_choices/lead/${leadId}`);
      setChoices(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error loading item choices:', error);
      toast.error('Failed to load item choices');
    } finally {
      setLoading(false);
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

  const fetchItemChoices = async (itemId) => {
    try {
      const response = await axios.get(`/api/item_choices/item/${itemId}`);
      const choicesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setItemChoices(choicesData);
    } catch (error) {
      console.error('Error loading item choices:', error);
      setItemChoices([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        lead_id: leadId
      };

      if (editingChoice) {
        // Use the correct ID field - choice_id is the primary key
        const choiceId = editingChoice.choice_id || editingChoice.lead_item_choice_id;
        console.log('Updating choice with ID:', choiceId, 'Data:', dataToSend);
        await axios.put(`/api/lead_item_choices/${choiceId}`, dataToSend);
        toast.success('Choice updated successfully!');
      } else {
        console.log('Creating choice with data:', dataToSend);
        await axios.post('/api/lead_item_choices', dataToSend);
        toast.success('Choice created successfully!');
      }
      
      fetchChoices();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving choice:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (choice) => {
    setEditingChoice(choice);
    setFormData({
      lead_id: choice.lead_id,
      item_id: choice.item_id || '',
      choice_id: choice.choice_value || choice.choice_id || '',
      is_default: choice.is_default || false,
      notes: choice.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this choice?')) return;
    
    try {
      console.log('Deleting choice with ID:', id);
      await axios.delete(`/api/lead_item_choices/${id}`);
      toast.success('Choice deleted successfully!');
      fetchChoices();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChoice(null);
    setFormData({
      lead_id: leadId,
      item_id: '',
      choice_id: '',
      is_default: false,
      notes: ''
    });
    setItemChoices([]);
  };

  const filteredChoices = choices.filter(choice =>
    !searchTerm ||
    choice.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    choice.choice_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    choice.item_id?.toString().includes(searchTerm)
  );

  // Group choices by item
  const groupedChoices = filteredChoices.reduce((acc, choice) => {
    const itemKey = choice.item_name || `Item ${choice.item_id}`;
    if (!acc[itemKey]) {
      acc[itemKey] = [];
    }
    acc[itemKey].push(choice);
    return acc;
  }, {});

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
          <CheckSquare className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Item Choices</h2>
            <p className="text-sm text-gray-600">Manage item selections and preferences</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Choice</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item or choice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Choices Display */}
      {Object.keys(groupedChoices).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No item choices found</p>
          <p className="text-sm text-gray-500 mt-1">Add your first item choice</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedChoices).map(([itemName, itemChoices]) => (
            <div key={itemName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {itemChoices.map((choice) => (
                  <div key={choice.choice_id || choice.lead_item_choice_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-base font-medium text-gray-900">
                            {choice.display_name || choice.choice_name || `Choice ${choice.choice_value || choice.choice_id}`}
                          </h4>
                          {choice.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          )}
                        </div>
                        {choice.notes && (
                          <p className="text-sm text-gray-600 mt-1">{choice.notes}</p>
                        )}
                        {(choice.price || choice.package) && (
                          <p className="text-sm text-gray-900 font-medium mt-2">
                            Price: ₹{parseFloat(choice.price || choice.package || 0).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(choice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(choice.choice_id || choice.lead_item_choice_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingChoice ? 'Edit' : 'Add'} Item Choice
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Item Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item *
                  </label>
                  <select
                    required
                    value={formData.item_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        item_id: e.target.value,
                        choice_id: ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name || `Item ${item.item_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Choice Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Choice *
                  </label>
                  <select
                    required
                    value={formData.choice_id}
                    onChange={(e) => setFormData({...formData, choice_id: e.target.value})}
                    disabled={!formData.item_id || itemChoices.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Choice</option>
                    {itemChoices.map(choice => (
                      <option key={choice.choice_option_id} value={choice.choice_option_id}>
                        {choice.display_name || choice.brand || choice.model || `Choice ${choice.choice_option_id}`}
                        {choice.package && ` - ₹${choice.package}`}
                      </option>
                    ))}
                  </select>
                  {formData.item_id && itemChoices.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No choices available for this item</p>
                  )}
                </div>

                {/* Is Default */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                    Set as default choice
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {editingChoice ? 'Update' : 'Add'}
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

export default LeadItemChoices;
