import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  MoreVertical,
  Check,
  XCircle,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';

const ProjectCosting = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [costingSummary, setCostingSummary] = useState(null);
  const [materialCosts, setMaterialCosts] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const loadData = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const [summaryRes, materialsRes, breakdownRes] = await Promise.all([
        axios.get(`${API_URL}/api/project-costing/summary/${projectId}`),
        axios.get(`${API_URL}/api/project-costing/materials/${projectId}`),
        axios.get(`${API_URL}/api/project-costing/breakdown/${projectId}`)
      ]);

      setCostingSummary(summaryRes.data.data);
      setMaterialCosts(materialsRes.data.data);
      setCostBreakdown(breakdownRes.data.data);
    } catch (error) {
      console.error('Error loading costing data:', error);
      alert('Error loading costing data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  const handleAddMaterial = () => {
    setShowAddModal(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setShowEditModal(true);
  };

  const handleDeleteMaterial = async (costingId) => {
    if (!window.confirm('Are you sure you want to delete this material cost?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/project-costing/materials/${costingId}`);
      alert('Material cost deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error deleting material cost');
    }
  };

  const handleApproveMaterial = (material) => {
    setSelectedMaterial(material);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  const handleRejectMaterial = (material) => {
    setSelectedMaterial(material);
    setApprovalAction('reject');
    setShowApprovalModal(true);
  };

  const handleResetToPending = async (material) => {
    if (!window.confirm(`Reset "${material.item_name}" back to Pending status?`)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/api/project-costing/materials/${material.costing_id}/status`, {
        status: 'Pending',
        updated_by: 1,
        notes: 'Status reset to Pending'
      });
      alert('Material status reset to Pending');
      loadData();
    } catch (error) {
      console.error('Error resetting status:', error);
      alert('Error resetting material status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading costing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {costingSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(costingSummary.budget)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">BOQ Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(costingSummary.boq.total)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPercentage(costingSummary.boq.percentage)} of budget
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Material Costs</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(costingSummary.materialCosts.total)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {costingSummary.materialCosts.items} items
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Variance</p>
                <p className={`text-2xl font-bold mt-2 ${
                  costingSummary.variance.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(costingSummary.variance.amount))}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPercentage(Math.abs(costingSummary.variance.percentage))}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                costingSummary.variance.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {costingSummary.variance.amount >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['summary', 'materials', 'breakdown'].map((tab) => {
              const icons = { summary: BarChart3, materials: Package, breakdown: PieChart };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab === 'breakdown' ? 'Cost Breakdown' : tab}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <CostingSummaryTab 
              summary={costingSummary} 
              formatCurrency={formatCurrency} 
              formatPercentage={formatPercentage} 
            />
          )}
          {activeTab === 'materials' && (
            <MaterialCostsTab 
              materials={materialCosts} 
              formatCurrency={formatCurrency} 
              formatPercentage={formatPercentage}
              onAdd={handleAddMaterial}
              onEdit={handleEditMaterial}
              onDelete={handleDeleteMaterial}
              onApprove={handleApproveMaterial}
              onReject={handleRejectMaterial}
              onResetToPending={handleResetToPending}
            />
          )}
          {activeTab === 'breakdown' && (
            <CostBreakdownTab 
              breakdown={costBreakdown} 
              formatCurrency={formatCurrency} 
            />
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <AddMaterialModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
          API_URL={API_URL}
        />
      )}

      {/* Edit Material Modal */}
      {showEditModal && editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          onClose={() => {
            setShowEditModal(false);
            setEditingMaterial(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingMaterial(null);
            loadData();
          }}
          API_URL={API_URL}
        />
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedMaterial && (
        <ApprovalModal
          isOpen={showApprovalModal}
          material={selectedMaterial}
          action={approvalAction}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedMaterial(null);
            setApprovalAction(null);
          }}
          onSubmit={async (notes) => {
            try {
              const endpoint = approvalAction === 'approve' ? 'approve' : 'reject';
              const payload = approvalAction === 'approve'
                ? { approved_by: 1, approval_notes: notes }
                : { rejected_by: 1, rejection_reason: notes };
              
              await axios.put(
                `${API_URL}/api/project-costing/materials/${selectedMaterial.costing_id}/${endpoint}`,
                payload
              );
              
              alert(`Material ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
              setShowApprovalModal(false);
              setSelectedMaterial(null);
              setApprovalAction(null);
              loadData();
            } catch (error) {
              console.error(`Error ${approvalAction}ing material:`, error);
              alert(`Error ${approvalAction}ing material`);
            }
          }}
        />
      )}
    </div>
  );
};

// Add Material Modal Component
const AddMaterialModal = ({ projectId, onClose, onSuccess, API_URL }) => {
  const [formData, setFormData] = useState({
    item_id: '',
    vendor_id: '',
    boq_quantity: '',
    unit: '',
    unit_price: '',
    discount_percentage: 0,
    gst_percentage: 18,
    quotation_reference: '',
    pricing_validity_date: '',
    created_by: 1
  });

  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculatedTotals, setCalculatedTotals] = useState({
    unitPriceAfterDiscount: 0,
    subtotal: 0,
    totalGst: 0,
    totalAmount: 0
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [itemsRes, vendorsRes] = await Promise.all([
          axios.get(`${API_URL}/api/items`),
          axios.get(`${API_URL}/api/vendors`)
        ]);
        
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : []);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        alert('Error loading items/vendors. Check console for details.');
      }
    };
    loadDropdownData();
  }, [API_URL]);

  useEffect(() => {
    const quantity = parseFloat(formData.boq_quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const discount = parseFloat(formData.discount_percentage) || 0;
    const gst = parseFloat(formData.gst_percentage) || 0;

    const unitPriceAfterDiscount = unitPrice - (unitPrice * discount / 100);
    const subtotal = quantity * unitPriceAfterDiscount;
    const totalGst = subtotal * (gst / 100);
    const totalAmount = subtotal + totalGst;

    setCalculatedTotals({
      unitPriceAfterDiscount,
      subtotal,
      totalGst,
      totalAmount
    });
  }, [formData.boq_quantity, formData.unit_price, formData.discount_percentage, formData.gst_percentage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        project_id: projectId,
        item_id: formData.item_id,
        vendor_id: formData.vendor_id,
        boq_quantity: formData.boq_quantity,
        unit: formData.unit,
        unit_price: formData.unit_price,
        discount_percentage: formData.discount_percentage || 0,
        gst_percentage: formData.gst_percentage || 18,
        created_by: formData.created_by || 1
      };
      
      if (formData.quotation_reference && formData.quotation_reference !== '') {
        payload.quotation_reference = formData.quotation_reference;
      }
      
      if (formData.pricing_validity_date && formData.pricing_validity_date !== '') {
        payload.pricing_validity_date = formData.pricing_validity_date;
      }
      
      await axios.post(`${API_URL}/api/project-costing/materials`, payload);
      alert('Material cost added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adding material:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Material Cost</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.boq_quantity}
                onChange={(e) => setFormData({ ...formData, boq_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., kg, m, sqft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter unit price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter discount %"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter GST %"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Reference
              </label>
              <input
                type="text"
                value={formData.quotation_reference}
                onChange={(e) => setFormData({ ...formData, quotation_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter quotation ref"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Validity Date
              </label>
              <input
                type="date"
                value={formData.pricing_validity_date}
                onChange={(e) => setFormData({ ...formData, pricing_validity_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">Calculated Totals</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price After Discount:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.unitPriceAfterDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST Amount:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.totalGst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-semibold">Total Amount:</span>
                <span className="font-bold text-orange-600">{formatCurrency(calculatedTotals.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Material Cost</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Material Modal Component
const EditMaterialModal = ({ material, onClose, onSuccess, API_URL }) => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    item_id: material.item_id || '',
    vendor_id: material.vendor_id || '',
    boq_quantity: material.boq_quantity || '',
    unit: material.unit || '',
    unit_price: material.unit_price || '',
    discount_percentage: material.discount_percentage || 0,
    gst_percentage: material.gst_percentage || 18,
    quotation_reference: material.quotation_reference || '',
    pricing_validity_date: formatDateForInput(material.pricing_validity_date),
    updated_by: 1
  });

  const [loading, setLoading] = useState(false);
  const [calculatedTotals, setCalculatedTotals] = useState({
    unitPriceAfterDiscount: 0,
    subtotal: 0,
    totalGst: 0,
    totalAmount: 0
  });

  useEffect(() => {
    const quantity = parseFloat(formData.boq_quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const discount = parseFloat(formData.discount_percentage) || 0;
    const gst = parseFloat(formData.gst_percentage) || 0;

    const unitPriceAfterDiscount = unitPrice - (unitPrice * discount / 100);
    const subtotal = quantity * unitPriceAfterDiscount;
    const totalGst = subtotal * (gst / 100);
    const totalAmount = subtotal + totalGst;

    setCalculatedTotals({
      unitPriceAfterDiscount,
      subtotal,
      totalGst,
      totalAmount
    });
  }, [formData.boq_quantity, formData.unit_price, formData.discount_percentage, formData.gst_percentage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        boq_quantity: formData.boq_quantity,
        unit: formData.unit,
        unit_price: formData.unit_price,
        discount_percentage: formData.discount_percentage || 0,
        gst_percentage: formData.gst_percentage || 18,
        updated_by: formData.updated_by || 1
      };
      
      if (formData.quotation_reference && formData.quotation_reference !== '') {
        payload.quotation_reference = formData.quotation_reference;
      }
      
      if (formData.pricing_validity_date && formData.pricing_validity_date !== '') {
        payload.pricing_validity_date = formData.pricing_validity_date;
      }
      
      await axios.put(`${API_URL}/api/project-costing/materials/${material.costing_id}`, payload);
      alert('Material cost updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating material:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Material Cost</h2>
            <p className="text-sm text-gray-500 mt-1">Material ID: {material.costing_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item
              </label>
              <input
                type="text"
                value={material.item_name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <input
                type="text"
                value={material.vendor_name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.boq_quantity}
                onChange={(e) => setFormData({ ...formData, boq_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Reference
              </label>
              <input
                type="text"
                value={formData.quotation_reference}
                onChange={(e) => setFormData({ ...formData, quotation_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Validity Date
              </label>
              <input
                type="date"
                value={formData.pricing_validity_date}
                onChange={(e) => setFormData({ ...formData, pricing_validity_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">Calculated Totals</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price After Discount:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.unitPriceAfterDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST Amount:</span>
                <span className="font-medium">{formatCurrency(calculatedTotals.totalGst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-semibold">Total Amount:</span>
                <span className="font-bold text-orange-600">{formatCurrency(calculatedTotals.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Material Cost</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Approval/Rejection Modal Component
const ApprovalModal = ({ isOpen, onClose, onSubmit, material, action }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !material) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (action === 'reject' && !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(notes);
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isApprove ? (
              <div className="bg-green-100 p-2 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isApprove ? 'Approve' : 'Reject'} Material Cost
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item:</span>
              <span className="font-medium text-gray-900">{material.item_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vendor:</span>
              <span className="font-medium text-gray-900">{material.vendor_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-orange-600">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                }).format(material.total_amount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isApprove ? 'Notes (Optional)' : 'Rejection Reason'} 
              {!isApprove && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={!isApprove}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={isApprove ? 'Add any notes...' : 'Explain why this is being rejected...'}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 ${
                isApprove 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:bg-gray-400`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isApprove ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{isApprove ? 'Approve' : 'Reject'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced CostingSummaryTab Component
const CostingSummaryTab = ({ summary, formatCurrency, formatPercentage }) => {
  if (!summary) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Budget', value: summary.budget, bg: 'bg-gray-50', text: 'text-gray-900' },
              { label: 'BOQ Total', value: summary.boq.total, bg: 'bg-blue-50', text: 'text-blue-900' },
              { label: 'Material Costs', value: summary.materialCosts.total, bg: 'bg-orange-50', text: 'text-orange-900' },
              { 
                label: 'Variance', 
                value: Math.abs(summary.variance.amount), 
                bg: summary.variance.amount >= 0 ? 'bg-green-50' : 'bg-red-50',
                text: summary.variance.amount >= 0 ? 'text-green-900' : 'text-red-900'
              }
            ].map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-3 rounded-lg ${item.bg}`}>
                <span className="text-sm font-medium text-gray-600">{item.label}</span>
                <span className={`text-sm font-bold ${item.text}`}>{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Material Cost Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Items', value: summary.materialCosts.items, format: false },
              { label: 'Subtotal', value: summary.materialCosts.subtotal },
              { label: 'GST', value: summary.materialCosts.gst },
              { label: 'Total', value: summary.materialCosts.total, highlight: true }
            ].map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-3 rounded-lg ${item.highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <span className="text-sm font-medium text-gray-600">{item.label}</span>
                <span className={`text-sm font-bold ${item.highlight ? 'text-orange-900' : 'text-gray-900'}`}>
                  {item.format === false ? item.value : formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget Utilization</h3>
        {[
          { label: 'BOQ Total', percentage: summary.boq.percentage, color: 'bg-blue-600' },
          { label: 'Material Costs', percentage: summary.materialCosts.percentage, color: 'bg-orange-600' }
        ].map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-600">{item.label}</span>
              <span className={`font-bold ${item.color.replace('bg-', 'text-')}`}>
                {formatPercentage(item.percentage)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`${item.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(parseFloat(item.percentage), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced MaterialCostsTab Component with Approval Actions
const MaterialCostsTab = ({ materials, formatCurrency, formatPercentage, onAdd, onEdit, onDelete, onApprove, onReject, onResetToPending }) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const getStatusBadge = (status) => {
    const config = {
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };
    const { bg, text, icon: Icon } = config[status] || config['Pending'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Material Costing List</h3>
        <button 
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center space-x-2"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4" />
          <span>Add Material Cost</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Item Name', 'Vendor', 'Quantity', 'Unit Price', 'Discount', 'GST', 'Total', 'Status', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No material costs added yet. Click "Add Material Cost" to get started.
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.costing_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.boq_quantity} {material.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(material.unit_price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(material.discount_percentage)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(material.gst_percentage)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(material.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(material.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(material.costing_id);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      title="More actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {openDropdownId === material.costing_id && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(material);
                              setOpenDropdownId(null);
                            }}
                            className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-700" />
                            Edit Material
                          </button>
                        </div>
                        
                        {material.status === 'Pending' && (
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApprove(material);
                                setOpenDropdownId(null);
                              }}
                              className="group flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4 mr-3 text-green-600" />
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReject(material);
                                setOpenDropdownId(null);
                              }}
                              className="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-3 text-red-600" />
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {(material.status === 'Approved' || material.status === 'Rejected') && (
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onResetToPending(material);
                                setOpenDropdownId(null);
                              }}
                              className="group flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-3 text-blue-600" />
                              Reset to Pending
                            </button>
                          </div>
                        )}
                        
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(material.costing_id);
                              setOpenDropdownId(null);
                            }}
                            className="group flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-3 text-red-600" />
                            Delete Material
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Enhanced CostBreakdownTab Component
const CostBreakdownTab = ({ breakdown, formatCurrency }) => {
  if (!breakdown) return <div>No data available</div>;

  const modules = [
    { key: 'structural', label: 'Structural', color: 'bg-blue-500', icon: '🏗️' },
    { key: 'walls', label: 'Walls', color: 'bg-green-500', icon: '🧱' },
    { key: 'doors', label: 'Doors', color: 'bg-yellow-500', icon: '🚪' },
    { key: 'windows', label: 'Windows', color: 'bg-purple-500', icon: '🪟' },
    { key: 'electrical', label: 'Electrical', color: 'bg-red-500', icon: '⚡' },
    { key: 'plumbing', label: 'Plumbing', color: 'bg-indigo-500', icon: '🚰' },
    { key: 'flooring', label: 'Flooring', color: 'bg-pink-500', icon: '🔲' },
    { key: 'painting', label: 'Painting', color: 'bg-orange-500', icon: '🎨' }
  ];

  const total = breakdown.grandTotal;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Module-wise Cost Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(module => {
          const amount = breakdown.breakdown[module.key];
          const percentage = total > 0 ? (amount / total * 100).toFixed(2) : 0;
          return (
            <div key={module.key} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${module.color}`} />
                      <span className="font-medium text-gray-900">{module.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{percentage}% of total</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${module.color}`} 
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-orange-800">Grand Total</span>
            <p className="text-xs text-orange-600 mt-1">Combined cost of all modules</p>
          </div>
          <span className="text-3xl font-bold text-orange-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCosting;
