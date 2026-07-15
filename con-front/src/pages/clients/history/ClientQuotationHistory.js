import React, { useState, useEffect } from 'react';
import { History, Eye, Calendar, DollarSign, User, FileText, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientQuotationHistoryService } from '../../../services/clientQuotationHistoryService';

const ClientQuotationHistory = ({ clientId, quotationId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (quotationId) {
        // Fetch history for specific quotation
        response = await clientQuotationHistoryService.getByQuotationId(quotationId);
      } else {
        // Fetch all history for client
        response = await clientQuotationHistoryService.getAll();
      }
      
      if (response.success) {
        setHistory(response.data || []);
      } else {
        setError(response.error || 'Failed to load history');
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setError(error.message || 'Failed to load quotation history');
      setHistory([]);
      toast.error('Failed to load quotation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, quotationId]);

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getChangeIcon = (changeType) => {
    const icons = {
      'Revision': FileText,
      'Price Update': DollarSign,
      'Scope Change': FileText,
      'Client Request': User,
      'Negotiation': TrendingUp,
      'Discount': TrendingDown
    };
    return icons[changeType] || FileText;
  };

  const getChangeColor = (changeType) => {
    const colors = {
      'Revision': 'text-blue-600 bg-blue-50',
      'Price Update': 'text-green-600 bg-green-50',
      'Scope Change': 'text-purple-600 bg-purple-50',
      'Client Request': 'text-orange-600 bg-orange-50',
      'Negotiation': 'text-indigo-600 bg-indigo-50',
      'Discount': 'text-red-600 bg-red-50'
    };
    return colors[changeType] || 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Proposed': 'bg-yellow-100 text-yellow-800',
      'Under_Review': 'bg-blue-100 text-blue-800',
      'Client_Approval_Pending': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Implemented': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold mb-2">Error Loading History</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchHistory}
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
          <History className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quotation History</h2>
            <p className="text-sm text-gray-600">
              {quotationId 
                ? `Tracking changes for quotation #${quotationId}` 
                : 'Track all changes and versions'}
            </p>
          </div>
        </div>
      </div>

      {/* Info banner: history is now auto-generated */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start space-x-2">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-medium">History is recorded automatically.</span>{' '}
          Entries are created whenever you use “Create New Version” on a quotation. To add a new entry, open the Quotations tab and create a version on the current quotation.
        </div>
      </div>

      {/* Timeline */}
      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No history records yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            History entries are created automatically when you use “Create New Version” on a quotation.
            Go to the Quotations tab and click the purple trending-up icon on the current version to record a change.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revisions</p>
                  <p className="text-2xl font-bold text-gray-900">{history.length}</p>
                </div>
                <History className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Latest Version</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history[0]?.version_number || 'N/A'}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(history[0]?.contract_value_after)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {history[0]?.change_date 
                      ? new Date(history[0].change_date).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Timeline Items */}
            <div className="space-y-6">
              {history.map((item, index) => {
                const ChangeIcon = getChangeIcon(item.change_type);
                const colorClass = getChangeColor(item.change_type);
                const statusColor = getStatusColor(item.change_status);
                const valueChange = item.value_change || 
                  (item.contract_value_after && item.contract_value_before 
                    ? parseFloat(item.contract_value_after) - parseFloat(item.contract_value_before)
                    : 0);

                return (
                  <div key={item.history_id} className="relative pl-16">
                    {/* Icon */}
                    <div className={`absolute left-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center border-4 border-white`}>
                      <ChangeIcon className="h-6 w-6" />
                    </div>

                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Version {item.version_number}
                            </h3>
                            {item.client_quotation_id && (
                              <span className="text-xs text-gray-500">
                                (Quotation #{item.client_quotation_id})
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                              {item.change_type}
                            </span>
                            {item.change_category && (
                              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                {item.change_category}
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {item.change_status?.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {item.change_date 
                                  ? new Date(item.change_date).toLocaleString() 
                                  : 'N/A'}
                              </span>
                            </div>
                            {item.change_requested_by && (
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{item.change_requested_by}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingHistory(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Description */}
                      {item.change_description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">{item.change_description}</p>
                        </div>
                      )}

                      {/* Value Changes */}
                      {(item.contract_value_before || item.contract_value_after) && (
                        <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Previous Value</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatCurrency(item.contract_value_before)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">New Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.contract_value_after)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Change</p>
                            <p className={`text-sm font-semibold ${valueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {valueChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(valueChange))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Changes Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {item.scope_changes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Scope Changes</p>
                            <p className="text-gray-700">{item.scope_changes}</p>
                          </div>
                        )}
                        {item.material_changes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Material Changes</p>
                            <p className="text-gray-700">{item.material_changes}</p>
                          </div>
                        )}
                        {item.specification_changes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Specification Changes</p>
                            <p className="text-gray-700">{item.specification_changes}</p>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      {item.change_reason && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">Reason</p>
                          <p className="text-sm text-gray-700">{item.change_reason}</p>
                        </div>
                      )}

                      {/* Notes */}
                      {item.history_notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{item.history_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Version {viewingHistory.version_number} Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Change Type</p>
                    <p className="font-semibold">{viewingHistory.change_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Change Date</p>
                    <p className="font-semibold">
                      {viewingHistory.change_date 
                        ? new Date(viewingHistory.change_date).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {viewingHistory.client_quotation_id && (
                  <div>
                    <p className="text-sm text-gray-600">Quotation ID</p>
                    <p className="font-semibold">#{viewingHistory.client_quotation_id}</p>
                  </div>
                )}

                {viewingHistory.change_category && (
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold">{viewingHistory.change_category}</p>
                  </div>
                )}

                {viewingHistory.change_description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{viewingHistory.change_description}</p>
                    </div>
                  </div>
                )}

                {viewingHistory.change_reason && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Reason</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{viewingHistory.change_reason}</p>
                    </div>
                  </div>
                )}

                {(viewingHistory.contract_value_before || viewingHistory.contract_value_after) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-3 font-medium">Financial Impact</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Previous Value</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(viewingHistory.contract_value_before)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 mb-1">New Value</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(viewingHistory.contract_value_after)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Change</p>
                        <p className={`text-lg font-bold ${
                          (viewingHistory.value_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(viewingHistory.value_change || 0) >= 0 ? '+' : ''}
                          {formatCurrency(Math.abs(viewingHistory.value_change || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {viewingHistory.scope_changes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Scope Changes</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{viewingHistory.scope_changes}</p>
                      </div>
                    </div>
                  )}
                  {viewingHistory.material_changes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Material Changes</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{viewingHistory.material_changes}</p>
                      </div>
                    </div>
                  )}
                  {viewingHistory.specification_changes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Specification Changes</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{viewingHistory.specification_changes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {viewingHistory.history_notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{viewingHistory.history_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewingHistory(null)}
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

export default ClientQuotationHistory;
