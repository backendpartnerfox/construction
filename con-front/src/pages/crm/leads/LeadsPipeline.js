import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  List,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import { leadsAPI } from '../../../services/leadsApi';

const LeadsPipeline = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLead, setDraggedLead] = useState(null);
  const [stats, setStats] = useState({});

  const stages = [
    { value: 'Qualified', label: 'Qualified', color: 'bg-blue-100 border-blue-300' },
    { value: 'Requirement_Gathering', label: 'Requirements', color: 'bg-purple-100 border-purple-300' },
    { value: 'Site_Visit_Planned', label: 'Site Visit Planned', color: 'bg-indigo-100 border-indigo-300' },
    { value: 'Site_Visited', label: 'Site Visited', color: 'bg-cyan-100 border-cyan-300' },
    { value: 'Quotation_Requested', label: 'Quotation Requested', color: 'bg-yellow-100 border-yellow-300' },
    { value: 'Quotation_Sent', label: 'Quotation Sent', color: 'bg-orange-100 border-orange-300' },
    { value: 'Negotiation', label: 'Negotiation', color: 'bg-amber-100 border-amber-300' },
    { value: 'Won', label: 'Won', color: 'bg-green-100 border-green-300' }
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await leadsAPI.getAll();
      const leadsData = Array.isArray(response.data) ? response.data : 
                        Array.isArray(response) ? response : [response.data || response];
      setLeads(leadsData.filter(lead => lead.stage !== 'Lost'));
      calculateStats(leadsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData) => {
    const stageStats = {};
    let totalValue = 0;

    stages.forEach(stage => {
      const stageLeads = leadsData.filter(l => l.stage === stage.value);
      const stageValue = stageLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
      
      stageStats[stage.value] = {
        count: stageLeads.length,
        value: stageValue
      };
      totalValue += stageValue;
    });

    setStats({ ...stageStats, totalValue });
  };

  const getLeadsByStage = (stage) => {
    return leads.filter(lead => {
      const matchesStage = lead.stage === stage;
      const matchesSearch = !searchTerm ||
        (lead.lead_number && lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.primary_contact_name && lead.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStage && matchesSearch;
    });
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.stage === targetStage) {
      setDraggedLead(null);
      return;
    }

    try {
      await leadsAPI.updateStage(draggedLead.lead_id, targetStage, `Moved from ${draggedLead.stage} to ${targetStage}`);
      await loadLeads();
    } catch (error) {
      console.error('Error updating lead stage:', error);
      alert('Failed to update lead stage');
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  const handleViewLead = (leadId) => {
    navigate(`/crm/leads/${leadId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600">Drag and drop leads to update their stage</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/crm/leads')}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <List className="h-4 w-4" />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Pipeline Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="flex items-center space-x-6">
            {stages.slice(0, 4).map(stage => (
              <div key={stage.value} className="text-center">
                <p className="text-xs text-gray-600">{stage.label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats[stage.value]?.count || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(stats[stage.value]?.value || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.value);
            const stageValue = stageLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);

            return (
              <div
                key={stage.value}
                className="flex-shrink-0 w-80 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.value)}
              >
                {/* Stage Header */}
                <div className={`${stage.color} border-2 rounded-t-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    {formatCurrency(stageValue)}
                  </p>
                </div>

                {/* Stage Content */}
                <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-2 overflow-y-auto space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No leads in this stage</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.lead_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow ${
                          draggedLead?.lead_id === lead.lead_id ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Lead Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {lead.lead_number || `Lead #${lead.lead_id}`}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {lead.primary_contact_name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewLead(lead.lead_id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Company */}
                        {lead.company_name && (
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <Building2 className="h-3 w-3 mr-1" />
                            <span className="truncate">{lead.company_name}</span>
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-1 mb-3">
                          {lead.primary_phone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{lead.primary_phone}</span>
                            </div>
                          )}
                          {lead.city && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{lead.city}</span>
                            </div>
                          )}
                        </div>

                        {/* Budget */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center text-sm font-semibold text-gray-900">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            <span>{formatCurrency(lead.budget_max)}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span>{lead.probability_percentage || 0}%</span>
                          </div>
                        </div>

                        {/* Project Info */}
                        {lead.project_type && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600">{lead.project_type}</p>
                            {lead.site_area && (
                              <p className="text-xs text-gray-500">{lead.site_area} sq.ft</p>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                            {lead.quotations_generated > 0 && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {lead.quotations_generated} quotes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeadsPipeline;
