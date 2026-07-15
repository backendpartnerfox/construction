import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { clientsAPI } from '../../../services/api';

const DeleteClientModal = ({ isOpen, onClose, onDelete, client }) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !client) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      const response = await clientsAPI.delete(client.client_id);
      
      if (response && (response.success || response.message)) {
        alert('Client deleted successfully');
        onDelete();
        setConfirmText('');
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client: ' + (error.message || 'Please try again'));
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setConfirmText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
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
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 mb-1">Warning</h4>
                <p className="text-sm text-red-700">
                  You are about to permanently delete this client and all associated data. 
                  This action cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Client Details</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {client.client_name}
                {client.surname && ` ${client.surname}`}
              </p>
              {client.phone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {client.phone}
                </p>
              )}
              {client.email && (
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {client.email}
                </p>
              )}
              {client.client_type && (
                <p className="text-gray-700">
                  <span className="font-medium">Type:</span> {client.client_type}
                </p>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={deleting}
            />
          </div>

          {/* What will be deleted */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">What will be deleted:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>All client information and contact details</li>
              <li>Business information (GST, PAN, etc.)</li>
              <li>Financial information (credit limit, payment terms)</li>
              <li>Address and location data</li>
              <li>All notes and additional information</li>
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
            disabled={confirmText !== 'DELETE' || deleting}
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
                <span>Delete Client</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;
