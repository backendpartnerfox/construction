import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Plus,
  AlertCircle,
  ArrowRight,
  Package,
  Download,
  RefreshCw,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Star
} from 'lucide-react';
import { enquiriesAPI } from '../../../services/api';
import NewEnquiryForm from '../forms/NewEnquiryForm';
import EditEnquiryForm from '../forms/EditEnquiryForm';
import ViewEnquiryModal from '../forms/ViewEnquiryModal';

const EnquiryList = () => {
  // State management
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    classification: 'all',
    city: 'all',
    state: 'all',
    package: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0
  });
  
  // Modal states
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  
  // UI states
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', direction: 'desc' });
  
  // Statistics
  const [stats, setStats] = useState({
    total_enquiries: 0,
    hot_enquiries: 0,
    medium_enquiries: 0,
    cold_enquiries: 0,
    conversion_rate: 0
  });

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadEnquiries();
  }, [pagination.page, pagination.limit, searchTerm, filters, sortConfig]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadEnquiries = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value && value !== 'all')
        )
      };
      
      const response = await enquiriesAPI.getAll(queryParams);
      
      if (response.success) {
        setEnquiries(response.data || []);
        if (response.pagination) {
          setPagination(prev => ({ ...prev, ...response.pagination }));
        }
      } else {
        throw new Error(response.error || 'Failed to load enquiries');
      }
    } catch (error) {
      console.error('Error loading enquiries:', error);
      setError(error.message);
      
      // Fallback to mock data for demo
      setEnquiries([
        {
          enquiry_id: 1,
          enquiry_number: 'ENQ-20241225-001',
          created_at: new Date().toISOString(),
          contact_person_name: 'John',
          contact_surname: 'Doe',
          primary_phone: '9876543210',
          email: 'john.doe@example.com',
          city: 'Hyderabad',
          state: 'Telangana',
          project_type: 'Residential',
          budget_range: '50-75 Lakhs',
          approximate_area: 2500,
          area_unit: 'sqft',
          status: 'New',
          crm_classification: 'Hot',
          primary_package_name: 'Premium Package',
          primary_package_rate: 2200,
          estimated_total_cost: 5500000
        }
      ]);
      setPagination(prev => ({ ...prev, total_records: 1, total_pages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await enquiriesAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set fallback stats
      setStats({
        total_enquiries: 125,
        hot_enquiries: 23,
        medium_enquiries: 45,
        cold_enquiries: 57,
        conversion_rate: 28
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEnquiries(false), loadStats()]);
    setRefreshing(false);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, direction });
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleView = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsViewModalOpen(true);
  };

  const handleEdit = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsEditFormOpen(true);
  };

  const handleDelete = async (enquiry) => {
    if (window.confirm(`Are you sure you want to delete enquiry ${enquiry.enquiry_number}?`)) {
      try {
        setLoading(true);
        await enquiriesAPI.delete(enquiry.enquiry_id);
        await loadEnquiries(false);
        await loadStats();
        alert('Enquiry deleted successfully!');
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert('Error deleting enquiry. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConvertToLead = async (enquiry) => {
    // TODO: Implement lead conversion
    alert(`Converting enquiry ${enquiry.enquiry_number} to lead...`);
  };

  const handleFormSubmit = async () => {
    await Promise.all([loadEnquiries(false), loadStats()]);
  };

  const handleBulkAction = async (action) => {
    if (selectedEnquiries.length === 0) {
      alert('Please select enquiries first');
      return;
    }
    
    if (action === 'delete') {
      if (window.confirm(`Delete ${selectedEnquiries.length} selected enquiries?`)) {
        // TODO: Implement bulk delete
        alert('Bulk delete functionality coming soon');
      }
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEnquiries(enquiries.map(e => e.enquiry_id));
    } else {
      setSelectedEnquiries([]);
    }
  };

  const handleSelectEnquiry = (enquiryId, checked) => {
    if (checked) {
      setSelectedEnquiries(prev => [...prev, enquiryId]);
    } else {
      setSelectedEnquiries(prev => prev.filter(id => id !== enquiryId));
    }
  };

  // Utility functions
  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'WhatsApp_Sent': 'bg-green-100 text-green-800',
      'Call_Scheduled': 'bg-yellow-100 text-yellow-800',
      'Called': 'bg-orange-100 text-orange-800',
      'Interested': 'bg-purple-100 text-purple-800',
      'Not_Interested': 'bg-red-100 text-red-800',
      'Converted_to_Lead': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getClassificationColor = (classification) => {
    const colors = {
      'Hot': 'bg-red-100 text-red-800 border-red-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Cold': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[classification] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  // Memoized filtered data
  const filteredEnquiries = useMemo(() => {
    return enquiries; // Filtering is now done server-side
  }, [enquiries]);

  // Statistics cards component
  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading && enquiries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading enquiries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries Management</h1>
          <p className="text-gray-600">Manage customer enquiries and convert them to leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsNewFormOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading enquiries</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadEnquiries()}
              className="ml-auto text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Enquiries"
          value={stats.total_enquiries}
          subtitle="All time enquiries"
          icon={Users}
          color="bg-blue-500"
          trend="12"
        />
        <StatCard
          title="Hot Leads"
          value={stats.hot_enquiries}
          subtitle="High priority"
          icon={Star}
          color="bg-red-500"
          trend="8"
        />
        <StatCard
          title="Medium Leads"
          value={stats.medium_enquiries}
          subtitle="Potential prospects"
          icon={Clock}
          color="bg-yellow-500"
          trend="15"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversion_rate}%`}
          subtitle="Enquiry to lead"
          icon={TrendingUp}
          color="bg-green-500"
          trend="5"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition duration-200 ${
                showFilters ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedEnquiries.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedEnquiries.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total_records)} of {pagination.total_records} results
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="New">New</option>
                <option value="WhatsApp_Sent">WhatsApp Sent</option>
                <option value="Call_Scheduled">Call Scheduled</option>
                <option value="Called">Called</option>
                <option value="Interested">Interested</option>
                <option value="Not_Interested">Not Interested</option>
                <option value="Converted_to_Lead">Converted to Lead</option>
              </select>

              <select
                value={filters.classification}
                onChange={(e) => handleFilterChange('classification', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Classifications</option>
                <option value="Hot">Hot</option>
                <option value="Medium">Medium</option>
                <option value="Cold">Cold</option>
              </select>

              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All States</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>

              <input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEnquiries.length === enquiries.length && enquiries.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('enquiry_number')}
                >
                  Enquiry Details
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('contact_person_name')}
                >
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package & Estimate
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnquiries.map((enquiry) => (
                <tr key={enquiry.enquiry_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEnquiries.includes(enquiry.enquiry_id)}
                      onChange={(e) => handleSelectEnquiry(enquiry.enquiry_id, e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{enquiry.enquiry_number}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(enquiry.created_at)}
                      </div>
                      {enquiry.crm_classification && (
                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded border ${getClassificationColor(enquiry.crm_classification)}`}>
                          {enquiry.crm_classification}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {enquiry.contact_person_name} {enquiry.contact_surname}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2 mb-1">
                        <Phone className="h-3 w-3" />
                        <span>{enquiry.primary_phone}</span>
                      </div>
                      {enquiry.email && (
                        <div className="text-sm text-gray-500 flex items-center space-x-2 mb-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{enquiry.email}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>{enquiry.city}, {enquiry.state}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{enquiry.project_type}</div>
                      <div className="text-sm text-gray-500">Budget: {enquiry.budget_range || 'Not specified'}</div>
                      <div className="text-sm text-gray-500">
                        Area: {enquiry.approximate_area} {enquiry.area_unit}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {enquiry.primary_package_name ? (
                        <>
                          <div className="text-sm font-medium text-blue-700 flex items-center">
                            <Package className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[120px]">{enquiry.primary_package_name}</span>
                          </div>
                          <div className="text-xs text-blue-600">
                            ₹{enquiry.primary_package_rate}/sq ft
                          </div>
                          {enquiry.estimated_total_cost && (
                            <div className="text-xs text-green-600 font-medium">
                              Est: {formatCurrency(enquiry.estimated_total_cost)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          No package selected
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(enquiry.status)}`}>
                      {enquiry.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleView(enquiry)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(enquiry)}
                        className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition duration-200"
                        title="Edit Enquiry"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {enquiry.status !== 'Converted_to_Lead' && (
                        <button 
                          onClick={() => handleConvertToLead(enquiry)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition duration-200"
                          title="Convert to Lead"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(enquiry)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition duration-200"
                        title="Delete Enquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEnquiries.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || Object.values(filters).some(v => v && v !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Create your first enquiry to get started'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(v => v && v !== 'all') && (
              <button
                onClick={() => setIsNewFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Enquiry</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total_records)} of {pagination.total_records} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Previous
            </button>
            {[...Array(Math.min(5, pagination.total_pages))].map((_, index) => {
              const pageNum = Math.max(1, pagination.page - 2) + index;
              if (pageNum > pagination.total_pages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded text-sm transition duration-200 ${
                    pagination.page === pageNum
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Forms and Modals */}
      <NewEnquiryForm
        isOpen={isNewFormOpen}
        onClose={() => setIsNewFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <EditEnquiryForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedEnquiry(null);
        }}
        onSubmit={handleFormSubmit}
        enquiry={selectedEnquiry}
      />

      <ViewEnquiryModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEnquiry(null);
        }}
        enquiry={selectedEnquiry}
        onEdit={() => handleEdit(selectedEnquiry)}
        onConvertToLead={() => handleConvertToLead(selectedEnquiry)}
      />
    </div>
  );
};

export default EnquiryList;