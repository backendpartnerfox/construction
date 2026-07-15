import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import ProjectFormDialog from './components/ProjectFormDialog';

// Use relative URL since we have setupProxy.js configured
const API_BASE_URL = '';

const Projects = () => {
  const navigate = useNavigate();
  
  // State management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  // Filter and pagination state
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  
  // Statistics state
  const [stats, setStats] = useState({
    total_projects: 0,
    in_progress_count: 0,
    completed_count: 0,
    planning_count: 0,
    total_estimated_budget: 0
  });
  
  // Form state
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    project_manager_id: '',
    architect_id: '',
    project_type: 'Residential',
    location: '',
    site_address: '',
    start_date: '',
    estimated_end_date: '',
    estimated_budget: '',
    total_area: '',
    area_unit: 'sqft',
    number_of_floors: '',
    priority: 3,
    description: '',
    notes: ''
  });

  // Tab configuration
  const tabs = [
    { label: 'Overview', status: null },
    { label: 'Active', status: 'In Progress' },
    { label: 'Completed', status: 'Completed' },
    { label: 'Planning', status: 'Planning' }
  ];

  // Status color mapping
  const statusColors = {
    'Planning': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-red-100 text-red-800',
    'Cancelled': 'bg-gray-100 text-gray-800'
  };

  // Load initial data
  useEffect(() => {
    loadProjects();
    loadDashboardStats();
    loadClientsAndEmployees();
  }, [page, currentTab, searchQuery]);

  // Load clients and employees together
  const loadClientsAndEmployees = async () => {
    setLoadingDropdowns(true);
    try {
      const [clientsRes, employeesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/clients`),
        axios.get(`${API_BASE_URL}/api/employees`)
      ]);

      console.log('Clients Response:', clientsRes.data);
      console.log('Employees Response:', employeesRes.data);

      // Handle both response formats
      const clientsData = clientsRes.data?.success ? clientsRes.data.data : clientsRes.data;
      const employeesData = employeesRes.data?.success ? employeesRes.data.data : employeesRes.data;

      if (Array.isArray(clientsData)) {
        setClients(clientsData);
        console.log('✅ Clients loaded:', clientsData.length);
      } else {
        console.error('❌ Unexpected clients response format:', clientsRes.data);
        setClients([]);
      }

      if (Array.isArray(employeesData)) {
        setEmployees(employeesData);
        console.log('✅ Employees loaded:', employeesData.length);
      } else {
        console.error('❌ Unexpected employees response format:', employeesRes.data);
        setEmployees([]);
      }
    } catch (error) {
      console.error('❌ Error loading dropdowns:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      toast.error('Error loading clients/employees');
      setClients([]);
      setEmployees([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Load projects with filters
  const loadProjects = async () => {
    setLoading(true);
    try {
      const status = tabs[currentTab].status;
      const params = {
        page,
        limit: 20,
        ...(status && { status }),
        ...(searchQuery && { search: searchQuery })
      };

      console.log('Loading projects with params:', params);
      const response = await axios.get(`${API_BASE_URL}/api/projects`, { params });
      console.log('Projects response:', response.data);
      
      // Handle response format
      let projectsData = [];
      let pagination = { total_pages: 1, total: 0 };

      if (response.data?.success && response.data?.data) {
        if (Array.isArray(response.data.data)) {
          projectsData = response.data.data;
          pagination.total = projectsData.length;
        } else if (response.data.data.projects) {
          projectsData = response.data.data.projects;
          pagination = response.data.data.pagination || pagination;
        } else {
          projectsData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        projectsData = response.data;
        pagination.total = projectsData.length;
      } else if (response.data?.data) {
        projectsData = Array.isArray(response.data.data) ? response.data.data : [];
      }

      console.log('✅ Projects loaded:', projectsData.length);
      setProjects(projectsData || []);
      setTotalPages(pagination.total_pages || 1);
      setTotalProjects(pagination.total || projectsData.length);
      
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      toast.error('Error loading projects');
      setProjects([]);
      setTotalPages(1);
      setTotalProjects(0);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      console.log('🔍 Fetching dashboard stats...');
      const response = await axios.get(`${API_BASE_URL}/api/projects/statistics`);
      console.log('📊 Stats response:', response.data);
      
      // Handle different response formats
      let statsData = {};
      
      if (response.data?.success && response.data?.data) {
        statsData = response.data.data;
      } else if (response.data?.data) {
        statsData = response.data.data;
      } else {
        statsData = response.data;
      }
      
      console.log('✅ Stats data:', statsData);
      
      setStats({
        total_projects: parseInt(statsData.total_projects) || 0,
        in_progress_count: parseInt(statsData.active_projects || statsData.in_progress_count) || 0,
        completed_count: parseInt(statsData.completed_projects || statsData.completed_count) || 0,
        planning_count: parseInt(statsData.planning_projects || statsData.planning_count) || 0,
        total_estimated_budget: parseFloat(statsData.total_budget || statsData.total_estimated_budget) || 0
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      console.error('Error details:', error.response?.data);
      // Keep default stats on error
      setStats({
        total_projects: 0,
        in_progress_count: 0,
        completed_count: 0,
        planning_count: 0,
        total_estimated_budget: 0
      });
    }
  };

  // Navigate to project details
  const handleRowClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  // Format date for input[type="date"] - expects YYYY-MM-DD
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Handle dialog open/close
  const handleOpenDialog = (project = null, e) => {
    // Prevent row click when clicking on edit button
    if (e) {
      e.stopPropagation();
    }
    
    if (project) {
      console.log('📝 Opening edit dialog for project:', project);
      console.log('Raw IDs:', {
        client_id: project.client_id,
        project_manager_id: project.project_manager_id,
        architect_id: project.architect_id
      });
      console.log('Raw dates:', {
        start: project.start_date,
        end: project.estimated_end_date
      });
      
      setEditMode(true);
      setCurrentProject(project);
      
      // Convert IDs to strings for dropdown matching
      const formattedData = {
        project_name: project.project_name || '',
        client_id: project.client_id ? String(project.client_id) : '',
        project_manager_id: project.project_manager_id ? String(project.project_manager_id) : '',
        architect_id: project.architect_id ? String(project.architect_id) : '',
        project_type: project.project_type || 'Residential',
        location: project.location || '',
        site_address: project.site_address || '',
        start_date: formatDateForInput(project.start_date),
        estimated_end_date: formatDateForInput(project.estimated_end_date),
        estimated_budget: project.estimated_budget || '',
        total_area: project.total_area || '',
        area_unit: project.area_unit || 'sqft',
        number_of_floors: project.number_of_floors || '',
        priority: project.priority || 3,
        description: project.description || '',
        notes: project.notes || ''
      };
      
      console.log('✅ Formatted form data:', formattedData);
      console.log('Formatted IDs as strings:', {
        client_id: formattedData.client_id,
        project_manager_id: formattedData.project_manager_id,
        architect_id: formattedData.architect_id
      });
      console.log('Formatted dates:', {
        start: formattedData.start_date,
        end: formattedData.estimated_end_date
      });
      
      setFormData(formattedData);
    } else {
      setEditMode(false);
      setCurrentProject(null);
      setFormData({
        project_name: '',
        client_id: '',
        project_manager_id: '',
        architect_id: '',
        project_type: 'Residential',
        location: '',
        site_address: '',
        start_date: new Date().toISOString().split('T')[0],
        estimated_end_date: '',
        estimated_budget: '',
        total_area: '',
        area_unit: 'sqft',
        number_of_floors: '',
        priority: 3,
        description: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentProject(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submitting form data:', formData);
    
    // Convert string IDs to integers or null for backend
    const submitData = {
      ...formData,
      client_id: formData.client_id ? parseInt(formData.client_id) : null,
      project_manager_id: formData.project_manager_id ? parseInt(formData.project_manager_id) : null,
      architect_id: formData.architect_id ? parseInt(formData.architect_id) : null,
    };
    
    try {
      if (editMode && currentProject) {
        await axios.put(`${API_BASE_URL}/api/projects/${currentProject.project_id}`, submitData);
        toast.success('Project updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/projects`, submitData);
        toast.success('Project created successfully');
      }
      
      handleCloseDialog();
      loadProjects();
      loadDashboardStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving project');
      console.error('Error saving project:', error);
    }
  };

  // Handle delete
  const handleDelete = async (projectId, projectName, e) => {
    // Prevent row click when clicking on delete button
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to cancel project "${projectName}"?`)) {
      const reason = prompt('Please provide a reason for cancellation:');
      if (!reason) return;

      try {
        await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
          data: { reason }
        });
        toast.success('Project cancelled successfully');
        loadProjects();
        loadDashboardStats();
      } catch (error) {
        toast.error('Error cancelling project');
        console.error('Error deleting project:', error);
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    if (lakhs >= 1) {
      return `₹${lakhs.toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Projects Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all your construction projects
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Projects</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_projects || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Projects</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.in_progress_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Completed</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.completed_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Value</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(stats.total_estimated_budget)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <Tab.Group selectedIndex={currentTab} onChange={(index) => { setCurrentTab(index); setPage(1); }}>
          <Tab.List className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    `${
                      selected
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`
                  }
                >
                  {tab.label}
                </Tab>
              ))}
            </nav>
          </Tab.List>
        </Tab.Group>

        <div className="p-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={loadProjects}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(projects) || projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No projects found
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr 
                    key={project.project_id} 
                    onClick={() => handleRowClick(project.project_id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.project_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">{project.project_name}</div>
                      <div className="text-sm text-gray-500">{project.project_manager_name || 'No Manager'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{project.client_name}</div>
                      <div className="text-sm text-gray-500">{project.client_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${project.completion_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{project.completion_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(project.estimated_budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => handleOpenDialog(project, e)}
                        className="text-orange-600 hover:text-orange-900 mr-3"
                        title="Edit Project"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.project_id, project.project_name, e)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Project"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  {' '}({totalProjects} total projects)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ProjectFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        clients={clients}
        employees={employees}
        loadingDropdowns={loadingDropdowns}
      />
    </div>
  );
};

export default Projects;
