import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, X, Save, 
  Package, CheckCircle, AlertCircle, Calendar, Users, DollarSign 
} from 'lucide-react';
import axios from 'axios';

const WorkPackagesManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [workPackages, setWorkPackages] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phases, setPhases] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    package_name: '',
    package_code: '',
    package_type: '',
    phase: '',
    contractor_name: '',
    team_lead_id: '',
    subcontractor_id: '',
    scope_of_work: '',
    planned_start_date: '',
    planned_end_date: '',
    manpower_deployed: '',
    status: 'Not Started',
    execution_notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const packageTypes = [
    'Structural', 'MEP', 'Finishing', 'Electrical', 
    'Plumbing', 'HVAC', 'Landscape', 'Interior', 'Other'
  ];

  const packageStatuses = [
    'Not Started', 'Planning', 'In Progress', 'On Hold', 
    'Completed', 'Cancelled', 'Under Review'
  ];

  useEffect(() => {
    fetchProject();
    fetchWorkPackages();
    fetchPhases();
    fetchContractors();
    fetchEmployees();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`);
      const projectData = response.data?.success ? response.data.data : response.data;
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchWorkPackages = async () => {
    setLoading(true);
    try {
      console.log('Fetching work packages for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/work_packages`, {
        params: { project_id: projectId }
      });
      
      console.log('API Response:', response.data);
      
      // Handle different response formats
      let packagesData = [];
      if (response.data.success && response.data.data) {
        packagesData = response.data.data;
      } else if (response.data.data) {
        packagesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        packagesData = response.data;
      }
      
      console.log('Processed work packages data:', packagesData);
      setWorkPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (error) {
      console.error('Error fetching work packages:', error);
      console.error('Error details:', error.response?.data);
      setWorkPackages([]);
      setError('Failed to load work packages: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    try {
      console.log('Fetching phases...');
      const response = await axios.get(`${API_BASE_URL}/api/work_packages/phases`);
      const phasesData = response.data.success ? response.data.data : response.data;
      console.log('Phases fetched:', phasesData);
      setPhases(Array.isArray(phasesData) ? phasesData : []);
    } catch (error) {
      console.error('Error fetching phases:', error);
      setPhases([]);
    }
  };

  const fetchContractors = async () => {
    try {
      console.log('Fetching contractors...');
      const response = await axios.get(`${API_BASE_URL}/api/work_packages/contractors`);
      const contractorsData = response.data.success ? response.data.data : response.data;
      console.log('Contractors fetched:', contractorsData);
      setContractors(Array.isArray(contractorsData) ? contractorsData : []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
      setContractors([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const response = await axios.get(`${API_BASE_URL}/api/work_packages/employees`);
      const employeesData = response.data.success ? response.data.data : response.data;
      console.log('Employees fetched:', employeesData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission with proper field mapping and type conversion
      const dataToSubmit = {
        project_id: parseInt(projectId),
        package_name: formData.package_name || null,
        package_code: formData.package_code || null,
        package_type: formData.package_type || null,
        phase: formData.phase || null,
        contractor_name: formData.contractor_name || null,
        team_lead_id: formData.team_lead_id ? parseInt(formData.team_lead_id) : null,
        subcontractor_id: formData.subcontractor_id ? parseInt(formData.subcontractor_id) : null,
        scope_of_work: formData.scope_of_work || null,
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
        manpower_deployed: formData.manpower_deployed ? parseInt(formData.manpower_deployed) : null,
        status: formData.status || 'Not Started',
        execution_notes: formData.execution_notes || null
      };

      console.log('Submitting work package data:', dataToSubmit);

      if (editingPackage) {
        const response = await axios.put(
          `${API_BASE_URL}/api/work_packages/${editingPackage.package_id}`,
          dataToSubmit
        );
        console.log('Update response:', response.data);
        setSuccess('Work package updated successfully');
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/work_packages`, dataToSubmit);
        console.log('Create response:', response.data);
        setSuccess('Work package created successfully');
      }

      await fetchWorkPackages();
      handleCloseModal();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Error saving work package:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to save work package';
      setError(errorMessage);
    }
  };

  const handleEdit = (workPackage) => {
    console.log('Editing work package:', workPackage);
    setEditingPackage(workPackage);
    
    // Helper function to safely format dates
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Date formatting error:', error);
        return '';
      }
    };

    // Helper function to safely get values
    const safeValue = (value, defaultValue = '') => {
      if (value === null || value === undefined) return defaultValue;
      return value.toString();
    };

    // Populate form data with correct field mapping for database structure
    const newFormData = {
      package_name: workPackage.package_name || '',
      package_code: workPackage.package_code || '',
      package_type: workPackage.package_type || '',
      phase: workPackage.phase || '',
      contractor_name: workPackage.contractor_name || '',
      team_lead_id: safeValue(workPackage.team_lead_id),
      subcontractor_id: safeValue(workPackage.subcontractor_id),
      scope_of_work: workPackage.scope_of_work || '',
      planned_start_date: formatDateForInput(workPackage.planned_start_date),
      planned_end_date: formatDateForInput(workPackage.planned_end_date),
      manpower_deployed: safeValue(workPackage.manpower_deployed),
      status: workPackage.status || 'Not Started',
      execution_notes: workPackage.execution_notes || ''
    };
    
    console.log('Form data being set:', newFormData);
    setFormData(newFormData);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work package?')) return;

    try {
      console.log('Deleting work package:', id);
      const response = await axios.delete(`${API_BASE_URL}/api/work_packages/${id}`);
      console.log('Delete response:', response.data);
      setSuccess('Work package deleted successfully');
      await fetchWorkPackages();
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting work package:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete work package';
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData({
      package_name: '',
      package_code: '',
      package_type: '',
      phase: '',
      contractor_name: '',
      team_lead_id: '',
      subcontractor_id: '',
      scope_of_work: '',
      planned_start_date: '',
      planned_end_date: '',
      manpower_deployed: '',
      status: 'Not Started',
      execution_notes: ''
    });
    setError('');
  };

  const filteredPackages = workPackages.filter(pkg => {
    const matchesSearch = 
      pkg.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.package_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || pkg.package_type === filterType;
    const matchesStatus = !filterStatus || pkg.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'Planning': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Under Review': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-orange-600" />
              Work Packages Management
            </h1>
            {project && (
              <p className="text-gray-600 mt-1">
                {project.project_name} - Execution Ready Work Units
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Work Package
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
          <button onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search work packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Types</option>
          {packageTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Status</option>
          {packageStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Work Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No work packages found. Click "Add Work Package" to create one.</p>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <div
              key={pkg.package_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {pkg.package_name}
                  </h3>
                  <p className="text-sm text-gray-500">{pkg.package_code}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(pkg.status)}`}>
                  {pkg.status}
                </span>
              </div>

              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded mr-2">
                  {pkg.package_type}
                </span>
                {pkg.contractor_name && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {pkg.contractor_name}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Team Lead</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pkg.team_lead_name || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Manpower</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pkg.manpower_deployed ? `${pkg.manpower_deployed} people` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Start Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pkg.planned_start_date ? new Date(pkg.planned_start_date).toLocaleDateString('en-IN') : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">End Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pkg.planned_end_date ? new Date(pkg.planned_end_date).toLocaleDateString('en-IN') : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.package_id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPackage ? 'Edit Work Package' : 'Add Work Package'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Code
                    </label>
                    <input
                      type="text"
                      value={formData.package_code}
                      onChange={(e) => setFormData({ ...formData, package_code: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Type
                    </label>
                    <select
                      value={formData.package_type}
                      onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Type</option>
                      {packageTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase
                    </label>
                    <select
                      value={formData.phase}
                      onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Phase (Optional)</option>
                      {phases.map(phase => (
                        <option key={phase.phase_id} value={phase.phase_name}>
                          {phase.phase_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Lead
                    </label>
                    <select
                      value={formData.team_lead_id}
                      onChange={(e) => setFormData({ ...formData, team_lead_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Team Lead (Optional)</option>
                      {employees.map(employee => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contractor/Vendor
                    </label>
                    <select
                      value={formData.subcontractor_id}
                      onChange={(e) => setFormData({ ...formData, subcontractor_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Contractor (Optional)</option>
                      {contractors.map(contractor => (
                        <option key={contractor.vendor_id} value={contractor.vendor_id}>
                          {contractor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contractor Name (Manual Entry)
                  </label>
                  <input
                    type="text"
                    value={formData.contractor_name}
                    onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                    placeholder="Or enter contractor name manually"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scope of Work
                  </label>
                  <textarea
                    value={formData.scope_of_work}
                    onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
                    rows="3"
                    placeholder="Describe the work to be done..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_start_date}
                      onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned End Date
                    </label>
                    <input
                      type="date"
                      value={formData.planned_end_date}
                      onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manpower
                    </label>
                    <input
                      type="number"
                      value={formData.manpower_deployed}
                      onChange={(e) => setFormData({ ...formData, manpower_deployed: e.target.value })}
                      placeholder="Number of people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {packageStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Execution Notes
                  </label>
                  <textarea
                    value={formData.execution_notes}
                    onChange={(e) => setFormData({ ...formData, execution_notes: e.target.value })}
                    rows="3"
                    placeholder="Additional notes about execution..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkPackagesManagement;
