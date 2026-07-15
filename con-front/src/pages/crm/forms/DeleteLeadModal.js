import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { leadsAPI } from '../../../services/api';

const DeleteLeadModal = ({ isOpen, onClose, onDelete, lead }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!lead || !lead.lead_id) {
      alert('Invalid lead data');
      return;
    }

    setDeleting(true);
    try {
      const response = await leadsAPI.delete(lead.lead_id);

      if (response && (response.success || response.message === 'Lead deleted successfully')) {
        alert('Lead deleted successfully');
        onDelete();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead: ' + (error.message || 'Please try again'));
    } finally {
      setDeleting(false);
      setConfirmText('');
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen || !lead) return null;

  const leadIdentifier = lead.lead_number || `Lead #${lead.lead_id}`;
  const isDeleteEnabled = confirmText.toUpperCase() === 'DELETE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={deleting}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Warning</p>
                <p className="text-sm text-red-700 mt-1">
                  You are about to permanently delete this lead and all associated data.
                  This action cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Lead: </span>
              <span className="text-sm font-semibold text-gray-900">{leadIdentifier}</span>
            </div>
            {lead.primary_contact_name && (
              <div>
                <span className="text-sm font-medium text-gray-500">Contact: </span>
                <span className="text-sm text-gray-900">{lead.primary_contact_name}</span>
              </div>
            )}
            {lead.primary_phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone: </span>
                <span className="text-sm text-gray-900">{lead.primary_phone}</span>
              </div>
            )}
            {lead.stage && (
              <div>
                <span className="text-sm font-medium text-gray-500">Stage: </span>
                <span className="text-sm text-gray-900">{lead.stage.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type <span className="font-bold text-red-600">DELETE</span> in the box below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={deleting}
              autoComplete="off"
            />
          </div>

          {/* Additional Warning */}
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">What will be deleted:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All lead information and contact details</li>
              <li>Project requirements and specifications</li>
              <li>Interaction history and notes</li>
              <li>Associated quotations (if any)</li>
              <li>All related documents and files</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isDeleteEnabled || deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteLeadModal;
