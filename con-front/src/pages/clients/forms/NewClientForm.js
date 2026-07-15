import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { clientsAPI } from '../../../services/api';

const NewClientForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    surname: '',
    client_type: 'Individual',
    primary_contact_name: '',
    whatsppnumber: '',
    primary_contact_title: '',
    email: '',
    phone: '',
    alternative_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    gst_number: '',
    pan_number: '',
    business_registration_number: '',
    client_category: '',
    referred_by: '',
    credit_limit: '',
    payment_terms: '',
    is_active: true,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client_name) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        credit_limit: formData.credit_limit || null,
      };

      const response = await clientsAPI.create(submitData);

      if (response && (response.success || response.client_id)) {
        alert('Client created successfully');
        onSubmit();
        // Reset form
        setFormData({
          client_name: '',
          surname: '',
          client_type: 'Individual',
          primary_contact_name: '',
          whatsppnumber: '',
          primary_contact_title: '',
          email: '',
          phone: '',
          alternative_phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          gst_number: '',
          pan_number: '',
          business_registration_number: '',
          client_category: '',
          referred_by: '',
          credit_limit: '',
          payment_terms: '',
          is_active: true,
          notes: ''
        });
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error creating client: ' + (error.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const clientTypes = ['Individual', 'Company', 'Government', 'Institution'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Plus className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Client</h3>
              <p className="text-sm text-gray-500">Add a new client to the database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.client_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.client_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                  <select
                    value={formData.client_type}
                    onChange={(e) => handleInputChange('client_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  >
                    {clientTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Category</label>
                  <input
                    type="text"
                    value={formData.client_category}
                    onChange={(e) => handleInputChange('client_category', e.target.value)}
                    placeholder="e.g., VIP, Regular, Premium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    value={formData.primary_contact_name}
                    onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Title</label>
                  <input
                    type="text"
                    value={formData.primary_contact_title}
                    onChange={(e) => handleInputChange('primary_contact_title', e.target.value)}
                    placeholder="e.g., Mr, Ms, Dr"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Phone</label>
                  <input
                    type="tel"
                    value={formData.alternative_phone}
                    onChange={(e) => handleInputChange('alternative_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsppnumber}
                    onChange={(e) => handleInputChange('whatsppnumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={(e) => handleInputChange('gst_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Registration Number</label>
                  <input
                    type="text"
                    value={formData.business_registration_number}
                    onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Additional Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                  <input
                    type="text"
                    value={formData.referred_by}
                    onChange={(e) => handleInputChange('referred_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    placeholder="e.g., Net 30, Net 60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                    placeholder="Additional notes about the client..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">Active Client</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Create Client</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewClientForm;
