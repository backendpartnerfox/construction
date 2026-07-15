import React from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Monitor,
  AlertCircle,
  Edit,
  ArrowRight,
  Package
} from 'lucide-react';

const ViewEnquiryModal = ({ isOpen, onClose, enquiry, onEdit, onConvertToLead }) => {
  if (!isOpen || !enquiry) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'WhatsApp_Sent':
        return 'bg-green-100 text-green-800';
      case 'Call_Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'Called':
        return 'bg-orange-100 text-orange-800';
      case 'Interested':
        return 'bg-purple-100 text-purple-800';
      case 'Not_Interested':
        return 'bg-red-100 text-red-800';
      case 'Converted_to_Lead':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Hot':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate package estimate if package and area are available
  const calculatePackageEstimate = () => {
    if (enquiry.primary_package_rate && enquiry.approximate_area) {
      const area = parseFloat(enquiry.approximate_area);
      const rate = parseFloat(enquiry.primary_package_rate);
      const total = area * rate;
      const base = total / 1.18; // Assuming 18% GST
      const gst = total - base;
      
      return { total, base, gst };
    }
    return null;
  };

  const packageEstimate = calculatePackageEstimate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{enquiry.enquiry_number}</h2>
              <p className="text-gray-600">Enquiry Details</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(enquiry.status)}`}>
                {enquiry.status?.replace('_', ' ')}
              </span>
              {enquiry.crm_classification && (
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getClassificationColor(enquiry.crm_classification)}`}>
                  {enquiry.crm_classification} Lead
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
              title="Edit Enquiry"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Contact & Location */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">
                        {enquiry.contact_person_name} {enquiry.contact_surname}
                      </p>
                      {enquiry.company_name && (
                        <p className="text-sm text-gray-600">{enquiry.company_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{enquiry.primary_phone}</p>
                      {enquiry.whatsapp_number && (
                        <p className="text-sm text-gray-600">WhatsApp: {enquiry.whatsapp_number}</p>
                      )}
                    </div>
                  </div>

                  {enquiry.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{enquiry.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{enquiry.city}, {enquiry.state}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Qualification */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Lead Qualification</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Specific Location</span>
                    {enquiry.has_specific_location ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Realistic Budget</span>
                    {enquiry.has_realistic_budget ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Immediate Timeline</span>
                    {enquiry.has_immediate_timeline ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Repeat Visitor</span>
                    {enquiry.is_repeat_visitor ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>

                {enquiry.form_completion_quality && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Form Completion</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(enquiry.form_completion_quality * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${enquiry.form_completion_quality * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Source Information */}
              {(enquiry.utm_source || enquiry.utm_medium || enquiry.device_type) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Source Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {enquiry.utm_source && (
                      <div>
                        <p className="text-sm text-gray-500">UTM Source</p>
                        <p className="font-medium text-gray-900">{enquiry.utm_source}</p>
                      </div>
                    )}
                    {enquiry.utm_medium && (
                      <div>
                        <p className="text-sm text-gray-500">UTM Medium</p>
                        <p className="font-medium text-gray-900">{enquiry.utm_medium}</p>
                      </div>
                    )}
                    {enquiry.device_type && (
                      <div>
                        <p className="text-sm text-gray-500">Device</p>
                        <div className="flex items-center space-x-1">
                          {enquiry.device_type === 'Mobile' ? (
                            <Smartphone className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Monitor className="h-4 w-4 text-gray-400" />
                          )}
                          <p className="font-medium text-gray-900">{enquiry.device_type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Column - Project & Package Information */}
            <div className="space-y-6">
              {/* Project Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Building2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Project Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Project Type</p>
                      <p className="font-medium text-gray-900">{enquiry.project_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Construction Type</p>
                      <p className="font-medium text-gray-900">{enquiry.construction_type}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-medium text-gray-900">
                        {enquiry.approximate_area ? `${enquiry.approximate_area} ${enquiry.area_unit}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget Range</p>
                      <p className="font-medium text-gray-900">{enquiry.budget_range || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Timeline</p>
                    <p className="font-medium text-gray-900">{enquiry.expected_timeline || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Package Information */}
              {(enquiry.primary_package_name || enquiry.package_id) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Package Selection</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {enquiry.primary_package_name && (
                      <div>
                        <p className="text-sm text-blue-700">Selected Package</p>
                        <p className="font-semibold text-blue-900 text-lg">{enquiry.primary_package_name}</p>
                      </div>
                    )}
                    
                    {enquiry.primary_package_rate && (
                      <div>
                        <p className="text-sm text-blue-700">Rate per Sq Ft</p>
                        <p className="font-medium text-blue-900">₹{enquiry.primary_package_rate}/sq ft (incl. GST)</p>
                      </div>
                    )}

                    {/* Package Cost Estimate */}
                    {packageEstimate && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Cost Estimate</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Area:</span>
                            <span className="font-medium">{enquiry.approximate_area} {enquiry.area_unit}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rate:</span>
                            <span className="font-medium">₹{enquiry.primary_package_rate}/sq ft</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Base Cost:</span>
                              <span className="font-medium">{formatCurrency(packageEstimate.base)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">GST (18%):</span>
                              <span className="font-medium">{formatCurrency(packageEstimate.gst)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-blue-700 border-t border-gray-200 pt-1 mt-1">
                              <span>Total Estimate:</span>
                              <span>{formatCurrency(packageEstimate.total)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">*This is an approximate estimate based on the selected package.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Classification Details */}
              {enquiry.crm_classification && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Classification</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Classification</p>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getClassificationColor(enquiry.crm_classification)}`}>
                        {enquiry.crm_classification} Lead
                      </span>
                    </div>
                    {enquiry.classification_reason && (
                      <div>
                        <p className="text-sm text-gray-500">Reason</p>
                        <p className="text-sm text-gray-900">{enquiry.classification_reason}</p>
                      </div>
                    )}
                    {enquiry.classification_date && (
                      <div>
                        <p className="text-sm text-gray-500">Classified On</p>
                        <p className="text-sm text-gray-900">{formatDate(enquiry.classification_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Timeline & Assignment */}
            <div className="space-y-6">
              {/* Timeline Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(enquiry.created_at)}
                    </span>
                  </div>
                  {enquiry.updated_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(enquiry.updated_at)}
                      </span>
                    </div>
                  )}
                  {enquiry.whatsapp_sent_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">WhatsApp Sent</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(enquiry.whatsapp_sent_date)}
                      </span>
                    </div>
                  )}
                  {enquiry.first_call_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">First Call</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(enquiry.first_call_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Information */}
              {enquiry.assigned_to && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium text-gray-900">Employee ID: {enquiry.assigned_to}</p>
                    </div>
                    {enquiry.assignment_date && (
                      <div>
                        <p className="text-sm text-gray-500">Assignment Date</p>
                        <p className="text-sm text-gray-900">{formatDate(enquiry.assignment_date)}</p>
                      </div>
                    )}
                    {enquiry.scheduled_call_date && (
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Call</p>
                        <p className="text-sm text-gray-900">{formatDate(enquiry.scheduled_call_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {enquiry.enquiry_notes && (
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{enquiry.enquiry_notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-6 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition duration-200 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Enquiry</span>
            </button>
            {enquiry.status !== 'Converted_to_Lead' && (
              <button
                onClick={onConvertToLead}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 flex items-center space-x-2"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Convert to Lead</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEnquiryModal;