import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Building2,
  FileText,
  Activity,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  History
} from 'lucide-react';
import { leadsAPI } from '../../../services/leadsApi';
import LeadRequirements from './requirements/LeadRequirements';
import LeadQuotations from './quotations/LeadQuotations';
import LeadActivities from './activities/LeadActivities';
import LeadQuotationHistory from './history/LeadQuotationHistory';
import LeadSelectionPackage from './selections/LeadSelectionPackage';
import LeadConversionPayment from './LeadConversionPayment';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  useEffect(() => {
    loadLeadDetails();
  }, [id]);

  const loadLeadDetails = async () => {
    setLoading(true);
    try {
      const data = await leadsAPI.getById(id);
      setLead(data);
    } catch (error) {
      console.error('Error loading lead details:', error);
      alert('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        await leadsAPI.delete(id);
        navigate('/crm/leads');
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Failed to delete lead');
      }
    }
  };

  const handleStageUpdate = async (newStage) => {
    setUpdating(true);
    try {
      await leadsAPI.updateStage(id, newStage);
      await loadLeadDetails();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed to update stage');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  const getStageColor = (stage) => {
    const stageColors = {
      'Qualified': 'bg-blue-100 text-blue-800 border-blue-200',
      'Requirement_Gathering': 'bg-purple-100 text-purple-800 border-purple-200',
      'Site_Visit_Planned': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Site_Visited': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Quotation_Requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Quotation_Sent': 'bg-orange-100 text-orange-800 border-orange-200',
      'Negotiation': 'bg-amber-100 text-amber-800 border-amber-200',
      'Won': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-red-100 text-red-800 border-red-200'
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const stages = [
    { value: 'Qualified', label: 'Qualified', icon: CheckCircle },
    { value: 'Requirement_Gathering', label: 'Requirement Gathering', icon: FileText },
    { value: 'Site_Visit_Planned', label: 'Site Visit Planned', icon: Calendar },
    { value: 'Site_Visited', label: 'Site Visited', icon: MapPin },
    { value: 'Quotation_Requested', label: 'Quotation Requested', icon: FileText },
    { value: 'Quotation_Sent', label: 'Quotation Sent', icon: Target },
    { value: 'Negotiation', label: 'Negotiation', icon: Activity },
    { value: 'Won', label: 'Won', icon: CheckCircle },
    { value: 'Lost', label: 'Lost', icon: XCircle }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Not Found</h3>
          <p className="text-gray-500 mb-4">The lead you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/crm/leads')}
            className="text-orange-600 hover:text-orange-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/crm/leads')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lead.lead_number || `Lead #${lead.lead_id}`}
              </h1>
              <p className="text-gray-600">
                Created on {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/crm/leads/${id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            {!lead.converted_to_client && lead.stage !== 'Lost' && (
              <button
                onClick={() => setShowConversionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Convert to Client</span>
              </button>
            )}
            {lead.converted_to_client && (
              <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span>Converted to Client</span>
              </span>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Stage Badge */}
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStageColor(lead.stage)}`}>
            {lead.stage?.replace('_', ' ') || 'N/A'}
          </span>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Probability: {lead.probability_percentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Range</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(lead.budget_min)} - {formatCurrency(lead.budget_max)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Timeline</p>
              <p className="text-lg font-bold text-gray-900">
                {lead.timeline_months || 'N/A'} months
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Site Area</p>
              <p className="text-lg font-bold text-gray-900">
                {lead.site_area || 'N/A'} sq.ft
              </p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quotations</p>
              <p className="text-lg font-bold text-gray-900">
                {lead.quotations_generated || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'requirements', label: 'Requirements', icon: Briefcase },
              { id: 'quotations', label: 'Quotations', icon: Target },
              { id: 'history', label: 'Quotation History', icon: History },
              { id: 'selections', label: 'Package Selections', icon: CheckCircle },
              { id: 'activities', label: 'Activities', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Primary Contact</p>
                      <p className="text-base font-medium text-gray-900">{lead.primary_contact_name || 'N/A'}</p>
                    </div>
                  </div>
                  {lead.company_name && (
                    <div className="flex items-start space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="text-base font-medium text-gray-900">{lead.company_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-base font-medium text-gray-900">{lead.primary_phone || 'N/A'}</p>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-base font-medium text-gray-900">{lead.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Project Type</p>
                    <p className="text-base font-medium text-gray-900">{lead.project_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Construction Type</p>
                    <p className="text-base font-medium text-gray-900">{lead.construction_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Floors</p>
                    <p className="text-base font-medium text-gray-900">{lead.number_of_floors || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Built-up Area</p>
                    <p className="text-base font-medium text-gray-900">
                      {lead.estimated_built_up_area ? `${lead.estimated_built_up_area} sq.ft` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {(lead.site_address || lead.city || lead.state) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      {lead.site_address && <p className="text-base text-gray-900">{lead.site_address}</p>}
                      {(lead.city || lead.state) && (
                        <p className="text-base text-gray-600">
                          {[lead.city, lead.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Management</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stages.map((stage) => {
                    const StageIcon = stage.icon;
                    const isCurrentStage = lead.stage === stage.value;
                    return (
                      <button
                        key={stage.value}
                        onClick={() => handleStageUpdate(stage.value)}
                        disabled={updating || isCurrentStage}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                          isCurrentStage
                            ? 'bg-orange-50 border-orange-300 text-orange-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <StageIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{stage.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {lead.lead_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{lead.lead_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <LeadRequirements leadId={id} />
          )}

          {activeTab === 'quotations' && (
            <LeadQuotations leadId={id} />
          )}

          {activeTab === 'history' && (
            <LeadQuotationHistory leadId={id} />
          )}

          {activeTab === 'selections' && (
            <LeadSelectionPackage leadId={id} />
          )}

          {activeTab === 'activities' && (
            <LeadActivities leadId={id} />
          )}
        </div>
      </div>

      {/* Lead Conversion Payment Modal */}
      {showConversionModal && (
        <LeadConversionPayment
          lead={lead}
          onConversionSuccess={(result) => {
            navigate(`/clients/${result.client_id}`);
          }}
          onClose={() => {
            setShowConversionModal(false);
            loadLeadDetails();
          }}
        />
      )}
    </div>
  );
};

export default LeadDetail;
