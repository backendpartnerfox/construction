import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, Search, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientSelectionsService } from '../../../services/clientSelectionsService';
import { projectsService, selectionItemsService, itemChoicesService } from '../../../services/dropdownServices';

const ClientSelections = ({ clientId }) => {
  const [selections, setSelections] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectionItems, setSelectionItems] = useState([]);
  const [itemChoices, setItemChoices] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [viewingSelection, setViewingSelection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    selection_item_id: '',
    selected_choice_option_id: '',
    selected_brand: '',
    selected_model: '',
    selected_color: '',
    selected_finish: '',
    selected_unit_price: '',
    selected_total_price: '',
    price_difference: '',
    status: 'Pending',
    custom_specifications: ''
  });

  useEffect(() => {
    if (clientId) {
      fetchSelections();
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchSelections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientSelectionsService.getByClientId(clientId);
      
      if (response.success) {
        setSelections(response.data || []);
      } else {
        setError(response.error || 'Failed to load selections');
        setSelections([]);
      }
    } catch (error) {
      console.error('Error loading selections:', error);
      setError(error.message || 'Failed to load selections');
      setSelections([]);
      toast.error('Failed to load selections');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects for clientId:', clientId);
      const response = await projectsService.getByClientId(clientId);
      console.log('Projects response:', response);
      
      let projectsArray = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        projectsArray = response.data;
      } else if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        projectsArray = response.data;
      } else {
        // Try getting all projects as fallback
        try {
          const allResponse = await projectsService.getAll();
          if (allResponse && allResponse.success && Array.isArray(allResponse.data)) {
            projectsArray = allResponse.data;
          } else if (Array.isArray(allResponse)) {
            projectsArray = allResponse;
          }
        } catch (err) {
          console.error('Error fetching all projects:', err);
        }
      }
      
      console.log('Setting projects array:', projectsArray);
      setProjects(projectsArray);
      
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const handleProjectChange = async (projectId) => {
    setSelectedProject(projectId);
    setFormData({...formData, selection_item_id: '', selected_choice_option_id: '', selected_brand: '', selected_model: '', selected_unit_price: ''});
    setItemChoices([]);
    
    if (projectId) {
      try {
        console.log('Fetching selection items for projectId:', projectId);
        const response = await selectionItemsService.getByProjectId(projectId);
        console.log('Selection items response:', response);
        
        let itemsArray = [];
        if (response && response.success && Array.isArray(response.data)) {
          itemsArray = response.data;
        } else if (Array.isArray(response)) {
          itemsArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          itemsArray = response.data;
        }
        
        console.log('Setting selection items:', itemsArray);
        setSelectionItems(itemsArray);
      } catch (error) {
        console.error('Error loading selection items:', error);
        setSelectionItems([]);
        toast.error('Failed to load selection items');
      }
    } else {
      setSelectionItems([]);
    }
  };

  const handleItemChange = async (itemId) => {
    setFormData({...formData, selection_item_id: itemId, selected_choice_option_id: '', selected_brand: '', selected_model: '', selected_unit_price: ''});
    
    if (itemId) {
      try {
        const item = selectionItems.find(si => si.selection_item_id === parseInt(itemId));
        console.log('Selected item:', item);
        
        if (item && item.item_id) {
          console.log('Fetching choices for item_id:', item.item_id);
          const response = await itemChoicesService.getByItemId(item.item_id);
          console.log('Item choices response:', response);
          
          let choicesArray = [];
          if (response && response.success && Array.isArray(response.data)) {
            choicesArray = response.data;
          } else if (Array.isArray(response)) {
            choicesArray = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            choicesArray = response.data;
          }
          
          console.log('Setting item choices:', choicesArray);
          setItemChoices(choicesArray);
        }
      } catch (error) {
        console.error('Error loading choice options:', error);
        setItemChoices([]);
        toast.error('Failed to load choice options');
      }
    } else {
      setItemChoices([]);
    }
  };

  const handleChoiceChange = (choiceId) => {
    const selectedChoice = itemChoices.find(c => c.choice_option_id === parseInt(choiceId));
    console.log('Selected choice:', selectedChoice);
    
    if (selectedChoice) {
      setFormData({
        ...formData,
        selected_choice_option_id: choiceId,
        selected_brand: selectedChoice.brand || '',
        selected_model: selectedChoice.model || '',
        selected_unit_price: selectedChoice.price || selectedChoice.unit_price || ''
      });
    } else {
      setFormData({
        ...formData,
        selected_choice_option_id: choiceId
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSelection) {
        const response = await clientSelectionsService.update(editingSelection.client_selection_id, formData);
        if (response.success) {
          toast.success('Selection updated successfully!');
          fetchSelections();
          handleCloseModal();
        }
      } else {
        const response = await clientSelectionsService.create(formData);
        if (response.success) {
          toast.success('Selection created successfully!');
          fetchSelections();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.error || error.message || 'Operation failed');
    }
  };

  const handleEdit = (selection) => {
    setEditingSelection(selection);
    setFormData({
      selection_item_id: selection.selection_item_id || '',
      selected_choice_option_id: selection.selected_choice_option_id || '',
      selected_brand: selection.selected_brand || '',
      selected_model: selection.selected_model || '',
      selected_color: selection.selected_color || '',
      selected_finish: selection.selected_finish || '',
      selected_unit_price: selection.selected_unit_price || '',
      selected_total_price: selection.selected_total_price || '',
      price_difference: selection.price_difference || '',
      status: selection.status || 'Pending',
      custom_specifications: selection.custom_specifications || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this selection?')) return;
    
    try {
      const response = await clientSelectionsService.delete(id);
      if (response.success) {
        toast.success('Selection deleted successfully!');
        fetchSelections();
      }
    } catch (error) {
      toast.error('Delete failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this selection?')) return;
    
    try {
      const response = await clientSelectionsService.approve(id, {
        approved_by: 'Current User',
        approval_type: 'client'
      });
      if (response.success) {
        toast.success('Selection approved!');
        fetchSelections();
      }
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSelection(null);
    setSelectedProject('');
    setSelectionItems([]);
    setItemChoices([]);
    setFormData({
      selection_item_id: '',
      selected_choice_option_id: '',
      selected_brand: '',
      selected_model: '',
      selected_color: '',
      selected_finish: '',
      selected_unit_price: '',
      selected_total_price: '',
      price_difference: '',
      status: 'Pending',
      custom_specifications: ''
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Filter selections
  const filteredSelections = selections.filter(selection =>
    selection.selection_item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    selection.selected_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    selection.selected_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    selection.selected_choice_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary
  const summary = {
    total: selections.length,
    approved: selections.filter(s => s.client_approved).length,
    pending: selections.filter(s => !s.client_approved).length,
    totalValue: selections.reduce((sum, s) => sum + (parseFloat(s.selected_total_price) || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading selections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold mb-2">Error Loading Selections</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchSelections}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
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
            <h2 className="text-xl font-bold text-gray-900">Client Selections</h2>
            <p className="text-sm text-gray-600">Manage client material and item selections</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Selections</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <XCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      {selections.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search selections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      )}

      {/* Selections List */}
      {filteredSelections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            {selections.length === 0 ? 'No selections found' : 'No matching selections'}
          </p>
          {selections.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                This client doesn't have any project selections yet.
              </p>
              <p className="text-xs text-gray-400">
                Selections are linked to projects. Create a project first, then add selections.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand & Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSelections.map((selection) => (
                  <tr key={selection.client_selection_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {selection.selection_item_name || selection.item_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selection.selected_brand || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{selection.selected_model || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">
                        {selection.selected_color && <span className="mr-2">Color: {selection.selected_color}</span>}
                        {selection.selected_finish && <span>Finish: {selection.selected_finish}</span>}
                        {!selection.selected_color && !selection.selected_finish && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(selection.selected_total_price)}
                        </p>
                        {selection.price_difference !== 0 && selection.price_difference !== null && (
                          <p className={`text-xs ${parseFloat(selection.price_difference) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(selection.price_difference) >= 0 ? '+' : ''}{formatCurrency(selection.price_difference)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selection.client_approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          {selection.status || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setViewingSelection(selection)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(selection)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!selection.client_approved && (
                          <button
                            onClick={() => handleApprove(selection.client_selection_id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(selection.client_selection_id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingSelection ? 'Edit' : 'Create'} Selection
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Dropdown - Step 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    required
                    value={selectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Project</option>
                    {Array.isArray(projects) && projects.length > 0 ? (
                      projects.map(proj => (
                        <option key={proj.project_id} value={proj.project_id}>
                          {proj.project_name} {proj.project_code ? `- ${proj.project_code}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No projects available</option>
                    )}
                  </select>
                  {(!Array.isArray(projects) || projects.length === 0) && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No projects found. Create a project for this client first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Selection Item Dropdown - Step 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selection Item *
                    </label>
                    <select
                      required
                      value={formData.selection_item_id}
                      onChange={(e) => handleItemChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={!selectedProject}
                    >
                      <option value="">Select Item</option>
                      {Array.isArray(selectionItems) && selectionItems.length > 0 ? (
                        selectionItems.map(item => (
                          <option key={item.selection_item_id} value={item.selection_item_id}>
                            {item.item_name || `Item #${item.selection_item_id}`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>{selectedProject ? 'No items available' : 'Select project first'}</option>
                      )}
                    </select>
                    {selectedProject && (!Array.isArray(selectionItems) || selectionItems.length === 0) && (
                      <p className="text-xs text-yellow-600 mt-1">
                        No selection items found for this project.
                      </p>
                    )}
                  </div>

                  {/* Choice Option Dropdown - Step 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Choice Option *
                    </label>
                    <select
                      required
                      value={formData.selected_choice_option_id}
                      onChange={(e) => handleChoiceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      disabled={!formData.selection_item_id}
                    >
                      <option value="">Select Choice</option>
                      {Array.isArray(itemChoices) && itemChoices.length > 0 ? (
                        itemChoices.map(choice => (
                          <option key={choice.choice_option_id} value={choice.choice_option_id}>
                            {choice.display_name || choice.brand || `Choice #${choice.choice_option_id}`} 
                            {choice.brand && choice.model ? ` - ${choice.brand} ${choice.model}` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>{formData.selection_item_id ? 'No choices available' : 'Select item first'}</option>
                      )}
                    </select>
                    {formData.selection_item_id && (!Array.isArray(itemChoices) || itemChoices.length === 0) && (
                      <p className="text-xs text-yellow-600 mt-1">
                        No choice options found for this item.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.selected_brand}
                      onChange={(e) => setFormData({...formData, selected_brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formData.selected_model}
                      onChange={(e) => setFormData({...formData, selected_model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.selected_color}
                      onChange={(e) => setFormData({...formData, selected_color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Finish
                    </label>
                    <input
                      type="text"
                      value={formData.selected_finish}
                      onChange={(e) => setFormData({...formData, selected_finish: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selected_unit_price}
                      onChange={(e) => setFormData({...formData, selected_unit_price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.selected_total_price}
                      onChange={(e) => setFormData({...formData, selected_total_price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Difference
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_difference}
                      onChange={(e) => setFormData({...formData, price_difference: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="In Review">In Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Specifications
                  </label>
                  <textarea
                    rows="3"
                    value={formData.custom_specifications}
                    onChange={(e) => setFormData({...formData, custom_specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

      {/* View Modal */}
      {viewingSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Selection Details</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Item</p>
                    <p className="font-semibold">{viewingSelection.selection_item_name || viewingSelection.item_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">{viewingSelection.status || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Brand</p>
                    <p className="font-semibold">{viewingSelection.selected_brand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-semibold">{viewingSelection.selected_model || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-semibold">{viewingSelection.selected_color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Finish</p>
                    <p className="font-semibold">{viewingSelection.selected_finish || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Pricing</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Unit Price:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(viewingSelection.selected_unit_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Total Price:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(viewingSelection.selected_total_price)}
                      </span>
                    </div>
                    {viewingSelection.price_difference && parseFloat(viewingSelection.price_difference) !== 0 && (
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Price Difference:</span>
                        <span className={`text-sm font-bold ${parseFloat(viewingSelection.price_difference) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(viewingSelection.price_difference) >= 0 ? '+' : ''}{formatCurrency(viewingSelection.price_difference)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Approval Status</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      {viewingSelection.client_approved ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm">Client Approved</span>
                    </div>
                    <div className="flex items-center">
                      {viewingSelection.architect_approved ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm">Architect Approved</span>
                    </div>
                  </div>
                </div>

                {viewingSelection.custom_specifications && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Custom Specifications</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{viewingSelection.custom_specifications}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewingSelection(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelections;
