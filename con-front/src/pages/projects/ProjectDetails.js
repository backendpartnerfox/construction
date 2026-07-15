import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Calendar, DollarSign, FileText, 
  Settings, CheckCircle, AlertCircle, ArrowLeft, Edit, FileCheck, MapPin
} from 'lucide-react';
import axios from 'axios';
import ProjectAssignments from './assignments/ProjectAssignments';
import ProjectMeetings from './components/meetings/ProjectMeetings';
import ProjectMOM from './components/mom/ProjectMOM';
import ProjectSiteVisits from './components/site-visits/ProjectSiteVisits';
import ProjectMeasurements from './components/measurements/ProjectMeasurements';
import BOQDashboard from './components/boq/BOQDashboard';
import ProjectCosting from './components/costing/ProjectCosting';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching project details for ID:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`);
      console.log('✅ Project data received:', response.data);
      
      // Handle different response formats
      const projectData = response.data?.success ? response.data.data : response.data;
      
      if (projectData) {
        setProject(projectData);
        console.log('✅ Project set:', projectData.project_name);
      } else {
        throw new Error('No project data received');
      }
    } catch (error) {
      console.error('❌ Error fetching project details:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || error.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'mom', label: 'MOM', icon: FileCheck },
    { id: 'sitevisits', label: 'Site Visits', icon: MapPin },
    { id: 'measurements', label: 'Measurements', icon: FileText },
    { id: 'boq', label: 'BOQ', icon: FileText },
    { id: 'costing', label: 'Costing', icon: DollarSign },
    { id: 'workflow', label: 'Workflow', icon: Settings },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mb-4"></div>
        <p className="text-gray-600">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Project Data</h3>
          <p className="text-gray-600 mb-4">Unable to load project information</p>
          <button
            onClick={fetchProjectDetails}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="mt-1 text-sm text-gray-500">Project Code: {project.project_code}</p>
          </div>
          <div className="flex space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <button
              onClick={() => navigate(`/projects/${projectId}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Budget</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{project.estimated_budget?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Area</p>
              <p className="text-lg font-semibold text-gray-900">
                {project.total_area} {project.area_unit}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-teal-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Progress</p>
              <p className="text-lg font-semibold text-gray-900">
                {project.completion_percentage || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab project={project} />}
          {activeTab === 'team' && <ProjectAssignments projectId={projectId} />}
          {activeTab === 'meetings' && <ProjectMeetings projectId={projectId} />}
          {activeTab === 'mom' && <ProjectMOM projectId={projectId} />}
          {activeTab === 'sitevisits' && <ProjectSiteVisits projectId={projectId} />}
          {activeTab === 'measurements' && <ProjectMeasurements projectId={projectId} />}
          {activeTab === 'boq' && <BOQDashboard projectId={projectId} />}
          {activeTab === 'costing' && <ProjectCosting projectId={projectId} />}
          {activeTab === 'workflow' && <WorkflowTab projectId={projectId} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ project }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        <div>
          <dt className="text-sm font-medium text-gray-500">Project Type</dt>
          <dd className="mt-1 text-sm text-gray-900">{project.project_type || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Location</dt>
          <dd className="mt-1 text-sm text-gray-900">{project.location || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Number of Floors</dt>
          <dd className="mt-1 text-sm text-gray-900">{project.number_of_floors || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Estimated End Date</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {project.estimated_end_date ? new Date(project.estimated_end_date).toLocaleDateString() : 'Not set'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Client</dt>
          <dd className="mt-1 text-sm text-gray-900">{project.client_name || 'N/A'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
          <dd className="mt-1 text-sm text-gray-900">{project.project_manager_name || 'Not assigned'}</dd>
        </div>
      </dl>
    </div>

    {project.description && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
        <p className="text-sm text-gray-600">{project.description}</p>
      </div>
    )}

    {project.site_address && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Site Address</h3>
        <p className="text-sm text-gray-600">{project.site_address}</p>
      </div>
    )}
  </div>
);

// Measurements Tab Component
const MeasurementsTab = ({ projectId }) => {
  const navigate = useNavigate();
  
  const measurementTypes = [
    { id: 'structural', name: 'Structural Measurements', description: 'Columns, beams, slabs, foundations' },
    { id: 'walls', name: 'Wall Measurements', description: 'Interior and exterior walls' },
    { id: 'doors', name: 'Door Measurements', description: 'All door specifications' },
    { id: 'windows', name: 'Window Measurements', description: 'All window specifications' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Architect Measurements</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {measurementTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => navigate(`/projects/${projectId}/measurements/${type.id}`)}
            className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md cursor-pointer transition-all"
          >
            <h4 className="text-base font-medium text-gray-900">{type.name}</h4>
            <p className="mt-2 text-sm text-gray-500">{type.description}</p>
            <button className="mt-4 text-orange-600 text-sm font-medium hover:text-orange-700">
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// BOQ Tab Component
const BOQTab = ({ projectId }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bill of Quantities</h3>
        <button
          onClick={() => navigate(`/projects/${projectId}/boq/generate`)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Generate BOQ
        </button>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          BOQ will be automatically generated based on architect measurements and element-item mappings.
        </p>
      </div>
    </div>
  );
};

// Costing Tab Component  
const CostingTab = ({ projectId }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Costing</h3>
        <button
          onClick={() => navigate(`/projects/${projectId}/costing`)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          View Detailed Costing
        </button>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          View and manage project costing based on BOQ and vendor pricing.
        </p>
      </div>
    </div>
  );
};

// Workflow Tab Component
const WorkflowTab = ({ projectId }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = React.useState({
    components: null,
    units: null,
    phases: null,
    blocks: null,
    selections: null,
    sequencing: null,
    modules: null,
    workpackages: null
  });
  const [loadingCounts, setLoadingCounts] = React.useState(true);

  React.useEffect(() => {
    const BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000';
    const unwrap = (res) => {
      const d = res?.data;
      if (d && d.success && Array.isArray(d.data)) return d.data.length;
      if (Array.isArray(d)) return d.length;
      if (d && Array.isArray(d.data)) return d.data.length;
      return 0;
    };
    // Each endpoint gets a safe fetch that resolves to 0 on failure — so
    // one broken module can't blank out the whole workflow dashboard.
    const safeCount = (url) =>
      axios.get(url).then(unwrap).catch(() => 0);

    Promise.all([
      safeCount(`${BASE}/api/project_components?project_id=${projectId}`),
      safeCount(`${BASE}/api/project_units?project_id=${projectId}`),
      safeCount(`${BASE}/api/project_phases?project_id=${projectId}`),
      safeCount(`${BASE}/api/blocks/project/${projectId}`),
      safeCount(`${BASE}/api/selections/project/${projectId}`),
      safeCount(`${BASE}/api/sequencing?project_id=${projectId}`),
      safeCount(`${BASE}/api/modules?project_id=${projectId}`),
      safeCount(`${BASE}/api/work_packages?project_id=${projectId}`)
    ]).then(([components, units, phases, blocks, selections, sequencing, modules, workpackages]) => {
      setCounts({ components, units, phases, blocks, selections, sequencing, modules, workpackages });
      setLoadingCounts(false);
    });
  }, [projectId]);

  const workflowStages = [
    { id: 'components',   name: 'Components',    description: 'Logical parts (pipes, cables, switchboards)' },
    { id: 'units',        name: 'Units',         description: 'Real-estate units (flats, villas, shops)' },
    { id: 'phases',       name: 'Phases',        description: 'Time-based execution groups' },
    { id: 'blocks',       name: 'Blocks',        description: 'Spatial groups (Tower A, Block B)' },
    { id: 'selections',   name: 'Selections',    description: 'Material &amp; finish choices per unit' },
    { id: 'sequencing',   name: 'Sequencing',    description: 'Task dependencies &amp; critical path' },
    { id: 'modules',      name: 'Modules',       description: 'Purchase/work-order groupings' },
    { id: 'workpackages', name: 'Work Packages', description: 'Contractor-ready deliverables' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Project Workflow</h3>
          <p className="text-sm text-gray-500 mt-1">
            Plan execution by breaking the project into components, phases, blocks, and deliverable work packages.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowStages.map((stage) => {
          const count = counts[stage.id];
          const hasData = count !== null && count > 0;
          const statusLabel = loadingCounts ? '…' : hasData ? `${count} item${count === 1 ? '' : 's'}` : 'empty';
          const statusClass = loadingCounts
            ? 'bg-gray-100 text-gray-500'
            : hasData
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600';

          return (
            <div
              key={stage.id}
              onClick={() => navigate(`/projects/${projectId}/workflow/${stage.id}`)}
              className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-medium text-gray-900">{stage.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{stage.description}</p>
              </div>
              <button className="text-orange-600 text-sm font-medium hover:text-orange-700 text-left">
                Manage →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDetails;
