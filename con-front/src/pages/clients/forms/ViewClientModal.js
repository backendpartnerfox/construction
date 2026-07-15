import React, { useState, useEffect } from 'react';
import { X, Eye, Mail, Phone, MapPin, Building2, Calendar, FileText, CreditCard } from 'lucide-react';

const ViewClientModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  const getClientTypeColor = (type) => {
    const colors = {
      'Individual': 'bg-blue-100 text-blue-800',
      'Company': 'bg-green-100 text-green-800',
      'Government': 'bg-purple-100 text-purple-800',
      'Institution': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Client Details</h3>
              <p className="text-sm text-gray-500">Complete client information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">Basic Information</h4>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getClientTypeColor(client.client_type)}`}>
                {client.client_type || 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Client Name</p>
                <p className="text-base text-gray-900 mt-1">
                  {client.client_name}
                  {client.surname && ` ${client.surname}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Client Category</p>
                <p className="text-base text-gray-900 mt-1">{client.client_category || 'N/A'}</p>
              </div>
              {client.primary_contact_name && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Primary Contact</p>
                  <p className="text-base text-gray-900 mt-1">
                    {client.primary_contact_title && `${client.primary_contact_title}. `}
                    {client.primary_contact_name}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                  client.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-orange-600" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Phone className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-base text-gray-900 mt-1">{client.phone || 'N/A'}</p>
                </div>
              </div>
              {client.alternative_phone && (
                <div className="flex items-start">
                  <Phone className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alternative Phone</p>
                    <p className="text-base text-gray-900 mt-1">{client.alternative_phone}</p>
                  </div>
                </div>
              )}
              {client.whatsppnumber && (
                <div className="flex items-start">
                  <Phone className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                    <p className="text-base text-gray-900 mt-1">{client.whatsppnumber}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-start">
                  <Mail className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900 mt-1">{client.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Address
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              {client.address_line1 && (
                <p className="text-base text-gray-900">{client.address_line1}</p>
              )}
              {client.address_line2 && (
                <p className="text-base text-gray-900 mt-1">{client.address_line2}</p>
              )}
              <p className="text-base text-gray-900 mt-2">
                {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
              </p>
              {client.country && (
                <p className="text-base text-gray-900 mt-1">{client.country}</p>
              )}
            </div>
          </div>

          {/* Business Information */}
          {(client.gst_number || client.pan_number || client.business_registration_number) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                Business Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {client.gst_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">GST Number</p>
                    <p className="text-base text-gray-900 mt-1">{client.gst_number}</p>
                  </div>
                )}
                {client.pan_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">PAN Number</p>
                    <p className="text-base text-gray-900 mt-1">{client.pan_number}</p>
                  </div>
                )}
                {client.business_registration_number && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Business Registration Number</p>
                    <p className="text-base text-gray-900 mt-1">{client.business_registration_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Information */}
          {(client.credit_limit || client.payment_terms) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                Financial Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {client.credit_limit && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Credit Limit</p>
                    <p className="text-base text-gray-900 mt-1">{formatCurrency(client.credit_limit)}</p>
                  </div>
                )}
                {client.payment_terms && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Terms</p>
                    <p className="text-base text-gray-900 mt-1">{client.payment_terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-600" />
              Additional Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              {client.referred_by && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Referred By</p>
                  <p className="text-base text-gray-900 mt-1">{client.referred_by}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <p className="text-base text-gray-900 mt-1">{formatDate(client.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Notes</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-base text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewClientModal;
