import React, { useState, useEffect } from 'react';
import { X, Eye, User, Phone, Mail, MapPin, Building, Calendar, DollarSign, TrendingUp, FileText, Users } from 'lucide-react';
import { leadsAPI, employeesAPI } from '../../../services/api';

const ViewLeadModal = ({ isOpen, onClose, lead }) => {
  const [leadDetails, setLeadDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isOpen && lead) {
      loadLeadDetails();
      loadEmployees();
    }
  }, [isOpen, lead]);

  const loadLeadDetails = async () => {
    if (!lead?.lead_id) {
      setLeadDetails(lead);
      return;
    }

    setLoading(true);
    try {
      const response = await leadsAPI.getById(lead.lead_id);
      if (response && response.data) {
        setLeadDetails(response.data);
      } else if (response) {
        setLeadDetails(response);
      } else {
        setLeadDetails(lead);
      }
    } catch (error) {
      console.error('Error loading lead details:', error);
      setLeadDetails(lead);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      if (response && response.data) {
        setEmployees(response.data);
      } else if (Array.isArray(response)) {
        setEmployees(response);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Not Assigned';
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'N/A';
  };

  const getStageColor = (stage) => {
    const colors = {
      'Qualified': 'bg-blue-100 text-blue-800',
      'Requirement_Gathering': 'bg-purple-100 text-purple-800',
      'Site_Visit_Planned': 'bg-indigo-100 text-indigo-800',
      'Site_Visited': 'bg-cyan-100 text-cyan-800',
      'Quotation_Requested': 'bg-yellow-100 text-yellow-800',
      'Quotation_Sent': 'bg-orange-100 text-orange-800',
      'Negotiation': 'bg-amber-100 text-amber-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  const displayLead = leadDetails || lead || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
              <p className="text-sm text-gray-500">
                {displayLead.lead_number || `Lead #${displayLead.lead_id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading lead details...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Lead Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Stage</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getStageColor(displayLead.stage)}`}>
                      {displayLead.stage?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Probability</label>
                  <div className="mt-1 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${displayLead.probability_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {displayLead.probability_percentage || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created On</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(displayLead.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Primary Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.primary_contact_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.company_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {displayLead.primary_phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    {displayLead.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.whatsapp_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Designation</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.designation || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                Project Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Lead Title</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.lead_title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Type</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.project_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Construction Type</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.construction_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Built-up Area</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {displayLead.estimated_built_up_area 
                      ? `${displayLead.estimated_built_up_area} sqft` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Number of Floors</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.number_of_floors || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Site Area</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {displayLead.site_area ? `${displayLead.site_area} sqft` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                Location
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Site Address</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.site_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.state || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Postal Code</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.postal_code || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                Budget & Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget Range</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {displayLead.budget_min || displayLead.budget_max 
                      ? `${formatCurrency(displayLead.budget_min)} - ${formatCurrency(displayLead.budget_max)}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timeline</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {displayLead.timeline_months ? `${displayLead.timeline_months} months` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Preferred Start Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(displayLead.preferred_start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Closure</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(displayLead.expected_closure_date)}</p>
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-600" />
                Team Assignment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Sales Person</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getEmployeeName(displayLead.assigned_sales_person)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Architect</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getEmployeeName(displayLead.assigned_architect)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Engineer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getEmployeeName(displayLead.assigned_engineer)}
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Tracking */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                Interaction Tracking
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Calls Made</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.total_calls_made || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Meetings Held</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.total_meetings_held || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Site Visits</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.total_site_visits || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Interaction</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(displayLead.last_interaction_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Action Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(displayLead.next_action_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quotations Generated</label>
                  <p className="mt-1 text-sm text-gray-900">{displayLead.quotations_generated || 0}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(displayLead.lead_notes || displayLead.meeting_notes || displayLead.technical_notes) && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  Notes
                </h4>
                <div className="space-y-3">
                  {displayLead.lead_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Notes</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayLead.lead_notes}</p>
                    </div>
                  )}
                  {displayLead.meeting_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Meeting Notes</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayLead.meeting_notes}</p>
                    </div>
                  )}
                  {displayLead.technical_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Technical Notes</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayLead.technical_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLeadModal;
