import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Building2,
  TrendingUp,
  ChevronDown,
  Download,
  Upload,
  X,
  FileText,
  Target,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { leadsAPI } from '../../../services/api';

import EditLeadModal from './EditLeadModal';
import LeadConversionPayment from './LeadConversionPayment';

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Conversion modal state
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionLead, setConversionLead] = useState(null);

  // Load leads on component mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await leadsAPI.getAll();
      if (response && response.data) {
        setLeads(Array.isArray(response.data) ? response.data : [response.data]);
      } else if (Array.isArray(response)) {
        setLeads(response);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLead = (leadId) => {
    navigate(`/crm/leads/${leadId}`);
  };

  const handleEditLead = (leadId) => {
    // Open edit modal instead of navigating
    const lead = leads.find(l => l.lead_id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedLead(null);
  };

  const handleLeadUpdated = () => {
    loadLeads(); // Reload leads after update
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadsAPI.delete(leadId);
        loadLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Failed to delete lead');
      }
    }
  };

  const getStageColor = (stage) => {
    const stageColors = {
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
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageIcon = (stage) => {
    const icons = {
      'Qualified': CheckCircle,
      'Requirement_Gathering': FileText,
      'Site_Visit_Planned': Calendar,
      'Site_Visited': MapPin,
      'Quotation_Requested': FileText,
      'Quotation_Sent': Target,
      'Negotiation': Users,
      'Won': CheckCircle,
      'Lost': XCircle
    };
    return icons[stage] || Clock;
  };

  const formatCurrency = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) return 'N/A';
    if (n >= 10000000) {
      return `₹${(n / 10000000).toFixed(2)} Cr`;
    } else if (n >= 100000) {
      return `₹${(n / 100000).toFixed(2)} L`;
    } else {
      return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      !searchTerm ||
      (lead.lead_number && lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.primary_contact_name && lead.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.primary_phone && lead.primary_phone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStage = selectedStage === 'all' || lead.stage === selectedStage;
    
    return matchesSearch && matchesStage;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === 'budget_max') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const stages = [
    'Qualified',
    'Requirement_Gathering',
    'Site_Visit_Planned',
    'Site_Visited',
    'Quotation_Requested',
    'Quotation_Sent',
    'Negotiation',
    'Won',
    'Lost'
  ];

  const stats = {
    total: leads.length,
    qualified: leads.filter(l => l.stage === 'Qualified').length,
    negotiation: leads.filter(l => l.stage === 'Negotiation').length,
    won: leads.filter(l => l.stage === 'Won').length,
    converted: leads.filter(l => l.converted_to_client === true).length,
    totalValue: leads.reduce((sum, l) => sum + (Number(l.budget_max) || 0), 0)
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600">Track and manage qualified sales leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.qualified}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Negotiation</p>
              <p className="text-2xl font-bold text-gray-900">{stats.negotiation}</p>
            </div>
            <Users className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Won</p>
              <p className="text-2xl font-bold text-gray-900">{stats.won}</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by lead number, name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>
                {stage.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="budget_max-desc">Highest Value</option>
            <option value="budget_max-asc">Lowest Value</option>
            <option value="probability_percentage-desc">Highest Probability</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            <span>{showFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">All Budgets</option>
                  <option value="0-5000000">Up to ₹50L</option>
                  <option value="5000000-10000000">₹50L - ₹1Cr</option>
                  <option value="10000000-50000000">₹1Cr - ₹5Cr</option>
                  <option value="50000000+">Above ₹5Cr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">All Types</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">All Team Members</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading leads...</span>
          </div>
        ) : sortedLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedStage !== 'all'
                ? 'Try adjusting your filters'
                : 'Leads will appear here when created from enquiries'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLeads.map((lead) => {
                  const StageIcon = getStageIcon(lead.stage);
                  return (
                    <tr key={lead.lead_id} className="hover:bg-gray-50 cursor-pointer">
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleViewLead(lead.lead_id)}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.lead_number || `Lead #${lead.lead_id}`}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {lead.primary_contact_name || 'N/A'}
                          </div>
                          {lead.company_name && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Building2 className="h-3 w-3 mr-1" />
                              {lead.company_name}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {lead.primary_phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {lead.project_type && (
                            <div className="text-sm text-gray-900">{lead.project_type}</div>
                          )}
                          {lead.site_area && (
                            <div className="text-sm text-gray-500">
                              Area: {lead.site_area} sq.ft
                            </div>
                          )}
                          {lead.city && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {lead.city}, {lead.state}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                            <StageIcon className="h-3 w-3 mr-1" />
                            {lead.stage?.replace('_', ' ') || 'N/A'}
                          </span>
                          {lead.converted_to_client && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Client
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(lead.budget_max)}
                        </div>
                        {lead.budget_min && lead.budget_max && (
                          <div className="text-xs text-gray-500">
                            Range: {formatCurrency(lead.budget_min)} - {formatCurrency(lead.budget_max)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                lead.probability_percentage >= 75
                                  ? 'bg-green-500'
                                  : lead.probability_percentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${lead.probability_percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {lead.probability_percentage || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {!lead.converted_to_client && lead.stage !== 'Lost' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConversionLead(lead);
                                setShowConversionModal(true);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 transition-colors"
                              title="Convert to Client"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Convert</span>
                            </button>
                          )}
                          {lead.converted_to_client && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-200 text-xs font-medium">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Client</span>
                            </span>
                          )}
                          <button
                            onClick={() => handleViewLead(lead.lead_id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="View Lead"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditLead(lead.lead_id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Lead"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.lead_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={selectedLead}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleLeadUpdated}
      />

      {/* Lead Conversion Payment Modal */}
      {showConversionModal && conversionLead && (
        <LeadConversionPayment
          lead={conversionLead}
          onConversionSuccess={(result) => {
            setShowConversionModal(false);
            setConversionLead(null);
            navigate(`/clients/${result.client_id}`);
          }}
          onClose={() => {
            setShowConversionModal(false);
            setConversionLead(null);
            loadLeads();
          }}
        />
      )}
    </div>
  );
};

export default Leads;
