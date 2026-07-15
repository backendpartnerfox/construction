import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  Package,
  Edit,
  User,
  Briefcase,
  DollarSign,
  History as HistoryIcon,
  FolderKanban,
  ArrowRight,
  Settings
} from 'lucide-react';
import { clientsApi } from '../../services/clientsApi';
import { projectsService } from '../../services/dropdownServices';
import ClientRequirements from './requirements/ClientRequirements';
import ClientQuotations from './quotations/ClientQuotations';
import ClientQuotationHistory from './history/ClientQuotationHistory';
import ClientProjectApproval from './approval/ClientProjectApproval';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // Load client details
      const clientResponse = await clientsApi.getById(id);
      setClient(clientResponse.data);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectsService.getByClientId(id);
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadClientData();
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const InfoCard = ({ icon: Icon, label, value, color = 'text-gray-900' }) => (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className={`text-sm font-medium ${color}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  const TabButton = ({ id: tabId, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
        activeTab === tabId
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Client not found</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.client_name}
                {client.surname && ` ${client.surname}`}
              </h1>
              {client.company_name && (
                <p className="text-gray-600 flex items-center mt-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  {client.company_name}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  client.client_type === 'Individual' ? 'bg-blue-100 text-blue-800' :
                  client.client_type === 'Company' ? 'bg-green-100 text-green-800' :
                  client.client_type === 'Government' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {client.client_type}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/clients/edit/${id}`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Client</span>
          </button>
        </div>
      </div>

      {/* Contact Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard icon={Phone} label="Phone" value={client.phone} color="text-blue-600" />
        <InfoCard icon={Mail} label="Email" value={client.email} color="text-green-600" />
        <InfoCard icon={MapPin} label="Location" value={`${client.city || 'N/A'}, ${client.state || ''}`} color="text-purple-600" />
        <InfoCard icon={Briefcase} label="Category" value={client.client_category} color="text-orange-600" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200 flex space-x-4 px-4 overflow-x-auto">
          <TabButton id="overview" label="Overview" icon={FileText} />
          <TabButton id="requirements" label="Requirements" icon={FileText} />
          <TabButton id="quotations" label="Quotations" icon={DollarSign} />
          <TabButton id="history" label="Quotation History" icon={HistoryIcon} />
          <TabButton id="projects" label={`Projects${projects.length > 0 ? ` (${projects.length})` : ''}`} icon={FolderKanban} />
          <TabButton id="approval" label="Project Approval" icon={CheckCircle} />
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Conversion source banner */}
              {client.converted_from_lead && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Converted from Lead</p>
                      <p className="text-xs text-green-600">
                        {client.conversion_date ? `Converted on ${new Date(client.conversion_date).toLocaleDateString()}` : ''}
                        {client.referred_by ? ` • Source: ${client.referred_by}` : ''}
                      </p>
                    </div>
                  </div>
                  {client.lead_id && (
                    <button
                      onClick={() => navigate(`/crm/leads/${client.lead_id}`)}
                      className="text-sm text-green-700 hover:text-green-900 font-medium hover:underline"
                    >
                      View Lead →
                    </button>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Primary Contact</label>
                    <p className="text-sm text-gray-900 mt-1">{client.primary_contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">WhatsApp Number</label>
                    <p className="text-sm text-gray-900 mt-1">{client.whatsppnumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alternative Phone</label>
                    <p className="text-sm text-gray-900 mt-1">{client.alternative_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">GST Number</label>
                    <p className="text-sm text-gray-900 mt-1">{client.gst_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PAN Number</label>
                    <p className="text-sm text-gray-900 mt-1">{client.pan_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Referred By</label>
                    <p className="text-sm text-gray-900 mt-1">{client.referred_by || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900">{client.address_line1 || 'N/A'}</p>
                  {client.address_line2 && <p className="text-sm text-gray-900">{client.address_line2}</p>}
                  <p className="text-sm text-gray-900">
                    {client.city}, {client.state} - {client.postal_code}
                  </p>
                  <p className="text-sm text-gray-900">{client.country || 'India'}</p>
                </div>
              </div>

              {client.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <ClientRequirements clientId={id} />
          )}

          {/* Quotations Tab */}
          {activeTab === 'quotations' && (
            <ClientQuotations 
              clientId={id} 
              onSelectQuotation={(quotationId) => {
                setSelectedQuotationId(quotationId);
                setActiveTab('history');
              }}
            />
          )}

          {/* Quotation History Tab */}
          {activeTab === 'history' && (
            <ClientQuotationHistory 
              clientId={id}
              quotationId={selectedQuotationId}
            />
          )}

          {/* Package Selections tab was removed — use Project > Workflow > Selections instead. */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FolderKanban className="h-6 w-6 text-orange-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                    <p className="text-sm text-gray-600">Projects created for this client</p>
                  </div>
                </div>
              </div>

              {loadingProjects ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">No projects yet</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    A project is created automatically when a lead is converted to this client
                    with an advance payment. If this client was converted before project auto-creation
                    was wired up, run <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">BACKFILL_MISSING_PROJECTS.sql</code>.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => {
                    const statusColors = {
                      'Planning': 'bg-yellow-100 text-yellow-800',
                      'In Progress': 'bg-blue-100 text-blue-800',
                      'On Hold': 'bg-orange-100 text-orange-800',
                      'Completed': 'bg-green-100 text-green-800',
                      'Cancelled': 'bg-red-100 text-red-800'
                    };
                    const statusClass = statusColors[project.status] || 'bg-gray-100 text-gray-800';
                    const budgetDisplay = (() => {
                      const b = parseFloat(project.estimated_budget);
                      if (!b) return 'Budget TBD';
                      if (b >= 10000000) return `₹${(b / 10000000).toFixed(2)} Cr`;
                      if (b >= 100000) return `₹${(b / 100000).toFixed(2)} L`;
                      return `₹${b.toLocaleString('en-IN')}`;
                    })();

                    return (
                      <div
                        key={project.project_id}
                        className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {project.project_code || `Project #${project.project_id}`}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                                {project.status || 'Planning'}
                              </span>
                              <span className="text-sm text-gray-600">
                                {project.completion_percentage || 0}% complete
                              </span>
                            </div>
                            <p className="text-base font-medium text-gray-800">{project.project_name}</p>
                            {project.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-t border-b border-gray-100 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="text-sm font-semibold text-gray-900">{budgetDisplay}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Area</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {project.total_area ? `${project.total_area} ${project.area_unit || 'sqft'}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Floors</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {project.number_of_floors || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {project.location || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate(`/projects/${project.project_id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                          >
                            <span>Open Project</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.project_id}/workflow/selections`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            title="Manage material selections for this project"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Manage Selections</span>
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.project_id}/workflow/units`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                          >
                            <Package className="h-4 w-4" />
                            <span>Units</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Project Approval Tab */}
          {activeTab === 'approval' && (
            <ClientProjectApproval clientId={id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
