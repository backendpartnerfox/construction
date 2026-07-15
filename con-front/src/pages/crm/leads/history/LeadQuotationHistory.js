import React, { useState, useEffect } from 'react';
import { History, Clock, User, DollarSign, FileText, TrendingUp, Eye, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadQuotationHistoryService } from '../../../../services/leadQuotationHistoryService';
import { leadQuotationsAPI } from '../../../../services/leadsApi';

const LeadQuotationHistory = ({ leadId, quotationId }) => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    lead_quotation_id: quotationId || '',
    change_type: '',
    change_description: '',
    total_amount_snapshot: '',
    changes_made: '',
    reason_for_change: '',
    client_feedback_received: '',
    negotiation_stage: '',
    client_counter_offer: '',
    our_response: '',
    history_notes: ''
  });

  useEffect(() => {
    fetchHistory();
    if (leadId) fetchQuotations();
  }, [leadId, quotationId]);

  const fetchQuotations = async () => {
    try {
      const data = await leadQuotationsAPI.getByLeadId(leadId);
      // leadsApi.getByLeadId returns response.data directly; handle both shapes
      const list = Array.isArray(data) ? data : (data?.data || []);
      setQuotations(list);
    } catch (error) {
      console.error('Error loading quotations for lead:', error);
      setQuotations([]);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let response;
      if (quotationId) {
        response = await leadQuotationHistoryService.getByQuotationId(quotationId);
      } else if (leadId) {
        response = await leadQuotationHistoryService.getByLeadId(leadId);
      } else {
        response = await leadQuotationHistoryService.getAll();
      }

      // Backend returns { success: true, data: [...] }
      if (response && response.success) {
        setHistoryRecords(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        // defensive: raw array fallback
        setHistoryRecords(response);
      } else {
        setHistoryRecords([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load quotation history');
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    const finalQuotationId = quotationId || formData.lead_quotation_id;
    if (!finalQuotationId) {
      toast.error('Please select a quotation for this history record');
      return;
    }

    try {
      const response = await leadQuotationHistoryService.create({
        ...formData,
        lead_quotation_id: finalQuotationId
      });

      if (response && response.success) {
        toast.success('History record created successfully!');
        fetchHistory();
        handleCloseCreateModal();
      } else {
        toast.error('Failed to create history record');
      }
    } catch (error) {
      toast.error(error.error || 'Failed to create history record');
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      lead_quotation_id: quotationId || '',
      change_type: '',
      change_description: '',
      total_amount_snapshot: '',
      changes_made: '',
      reason_for_change: '',
      client_feedback_received: '',
      negotiation_stage: '',
      client_counter_offer: '',
      our_response: '',
      history_notes: ''
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getChangeTypeBadge = (type) => {
    const colors = {
      'Initial': 'bg-blue-100 text-blue-800',
      'Revision': 'bg-yellow-100 text-yellow-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Final': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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
          <History className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quotation History</h2>
            <p className="text-sm text-gray-600">Track all changes and versions</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Record</span>
        </button>
      </div>

      {/* History Timeline */}
      {historyRecords.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No history records found</p>
          <p className="text-sm text-gray-500 mt-1">Create your first history record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyRecords.map((record, index) => (
            <div
              key={record.history_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getChangeTypeBadge(record.change_type)}`}>
                      {record.change_type || 'N/A'}
                    </span>
                    <span className="text-sm text-gray-600">
                      Version {record.version_number || 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(record.change_date).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {record.change_description && (
                    <p className="text-gray-700 mb-3">{record.change_description}</p>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    {record.total_amount_snapshot && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(record.total_amount_snapshot)}
                          </p>
                        </div>
                      </div>
                    )}
                    {record.negotiation_stage && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Negotiation Stage</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {record.negotiation_stage}
                          </p>
                        </div>
                      </div>
                    )}
                    {record.client_counter_offer && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Counter Offer</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(record.client_counter_offer)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Changes Made */}
                  {record.changes_made && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Changes Made:</p>
                      <p className="text-sm text-gray-600">{record.changes_made}</p>
                    </div>
                  )}

                  {/* Reason for Change */}
                  {record.reason_for_change && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Reason:</p>
                      <p className="text-sm text-blue-600">{record.reason_for_change}</p>
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleViewDetails(record)}
                  className="ml-4 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  History Details - Version {selectedRecord.version_number}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Details Grid */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Change Type</label>
                    <p className="text-gray-900">{selectedRecord.change_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Version Number</label>
                    <p className="text-gray-900">{selectedRecord.version_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Financial Snapshot</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Amount</label>
                      <p className="text-gray-900">{formatCurrency(selectedRecord.total_amount_snapshot)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Package Rate</label>
                      <p className="text-gray-900">{formatCurrency(selectedRecord.package_rate_snapshot)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Counter Offer</label>
                      <p className="text-gray-900">{formatCurrency(selectedRecord.client_counter_offer)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Negotiation Stage</label>
                      <p className="text-gray-900">{selectedRecord.negotiation_stage || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Area Details */}
                {(selectedRecord.habitable_area_snapshot || selectedRecord.balcony_area_snapshot || selectedRecord.stilt_area_snapshot) && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Area Snapshot</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedRecord.habitable_area_snapshot && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Habitable Area</label>
                          <p className="text-gray-900">{selectedRecord.habitable_area_snapshot} sq.ft</p>
                        </div>
                      )}
                      {selectedRecord.balcony_area_snapshot && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Balcony Area</label>
                          <p className="text-gray-900">{selectedRecord.balcony_area_snapshot} sq.ft</p>
                        </div>
                      )}
                      {selectedRecord.stilt_area_snapshot && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Stilt Area</label>
                          <p className="text-gray-900">{selectedRecord.stilt_area_snapshot} sq.ft</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Text Details */}
                <div className="border-t pt-4 space-y-4">
                  {selectedRecord.change_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Change Description</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.change_description}</p>
                    </div>
                  )}
                  {selectedRecord.changes_made && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Changes Made</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.changes_made}</p>
                    </div>
                  )}
                  {selectedRecord.reason_for_change && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Reason for Change</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.reason_for_change}</p>
                    </div>
                  )}
                  {selectedRecord.client_feedback_received && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Feedback</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.client_feedback_received}</p>
                    </div>
                  )}
                  {selectedRecord.our_response && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Our Response</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.our_response}</p>
                    </div>
                  )}
                  {selectedRecord.history_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRecord.history_notes}</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status at Time</label>
                      <p className="text-gray-900">{selectedRecord.status_at_time || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Change Date</label>
                      <p className="text-gray-900">{new Date(selectedRecord.change_date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create History Record</h2>
                <button onClick={handleCloseCreateModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Quotation selector (only when not locked to a specific quotation) */}
                {!quotationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quotation *
                    </label>
                    <select
                      required
                      value={formData.lead_quotation_id}
                      onChange={(e) => setFormData({...formData, lead_quotation_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Quotation</option>
                      {quotations.map(q => (
                        <option key={q.lead_quotation_id} value={q.lead_quotation_id}>
                          {q.lead_quotation_number || `Quotation #${q.lead_quotation_id}`}
                          {q.version_number ? ` (v${q.version_number})` : ''}
                          {q.status ? ` \u2014 ${q.status}` : ''}
                        </option>
                      ))}
                    </select>
                    {quotations.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        No quotations exist for this lead yet. Create one in the Quotations tab first.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Type *
                    </label>
                    <select
                      required
                      value={formData.change_type}
                      onChange={(e) => setFormData({...formData, change_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Initial">Initial</option>
                      <option value="Revision">Revision</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Final">Final</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount_snapshot}
                      onChange={(e) => setFormData({...formData, total_amount_snapshot: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.change_description}
                    onChange={(e) => setFormData({...formData, change_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Changes Made
                  </label>
                  <textarea
                    rows="2"
                    value={formData.changes_made}
                    onChange={(e) => setFormData({...formData, changes_made: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Change
                  </label>
                  <textarea
                    rows="2"
                    value={formData.reason_for_change}
                    onChange={(e) => setFormData({...formData, reason_for_change: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Negotiation Stage
                    </label>
                    <input
                      type="text"
                      value={formData.negotiation_stage}
                      onChange={(e) => setFormData({...formData, negotiation_stage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Counter Offer
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.client_counter_offer}
                      onChange={(e) => setFormData({...formData, client_counter_offer: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Feedback
                  </label>
                  <textarea
                    rows="2"
                    value={formData.client_feedback_received}
                    onChange={(e) => setFormData({...formData, client_feedback_received: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Our Response
                  </label>
                  <textarea
                    rows="2"
                    value={formData.our_response}
                    onChange={(e) => setFormData({...formData, our_response: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="2"
                    value={formData.history_notes}
                    onChange={(e) => setFormData({...formData, history_notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Create Record
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
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

export default LeadQuotationHistory;
