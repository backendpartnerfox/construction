import React, { useState, useEffect } from 'react';
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
  Package
} from 'lucide-react';
import { enquiriesAPI } from '../../../services/api';
import NewEnquiryForm from '../forms/NewEnquiryForm';
import EditEnquiryForm from '../forms/EditEnquiryForm';
import ViewEnquiryModal from '../forms/ViewEnquiryModal';
import ConvertToLeadModal from '../forms/ConvertToLeadModal';

const EnquiryList = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClassification, setFilterClassification] = useState('all');
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load enquiries on component mount
  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      console.log('Loading enquiries from API...');
      
      const response = await enquiriesAPI.getAll();
      console.log('API Response:', response);
      
      // Check if response has the expected structure
      let enquiriesData = [];
      if (response && response.success && response.data) {
        enquiriesData = response.data;
      } else if (response && Array.isArray(response)) {
        enquiriesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        enquiriesData = response.data;
      } else {
        console.warn('Unexpected API response structure:', response);
      }
      
      console.log('Processed enquiries data:', enquiriesData);
      console.log('Sample enquiry with package info:', enquiriesData[0]);
      
      setEnquiries(enquiriesData);
      
    } catch (error) {
      console.error('Error loading enquiries:', error);
      
      // Show error to user but don't use mock data that might confuse debugging
      setEnquiries([]);
      
      // You could show a toast notification here
      alert('Error loading enquiries. Please check if the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search enquiries
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.enquiry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.contact_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.contact_surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.primary_phone?.includes(searchTerm) ||
      enquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || enquiry.status === filterStatus;
    const matchesClassification = filterClassification === 'all' || enquiry.crm_classification === filterClassification;

    return matchesSearch && matchesStatus && matchesClassification;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, startIndex + itemsPerPage);

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
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;
    
    if (numAmount >= 10000000) {
      return `₹${(numAmount / 10000000).toFixed(1)} cr`;
    } else if (numAmount >= 100000) {
      return `₹${(numAmount / 100000).toFixed(1)}L`;
    } else {
      return `₹${numAmount.toLocaleString('en-IN')}`;
    }
  };

  const handleView = (enquiry) => {
    console.log('Viewing enquiry:', enquiry);
    setSelectedEnquiry(enquiry);
    setIsViewModalOpen(true);
  };

  const handleEdit = (enquiry) => {
    console.log('Editing enquiry:', enquiry);
    setSelectedEnquiry(enquiry);
    setIsEditFormOpen(true);
    setIsViewModalOpen(false); // Close view modal if open
  };

  const handleDelete = async (enquiry) => {
    if (window.confirm(`Are you sure you want to delete enquiry ${enquiry.enquiry_number || enquiry.enquiry_id}?`)) {
      try {
        await enquiriesAPI.delete(enquiry.enquiry_id);
        await loadEnquiries(); // Reload the list
        alert('Enquiry deleted successfully!');
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert('Error deleting enquiry. Please try again.');
      }
    }
  };

  const handleConvertToLead = (enquiry) => {
    console.log('Converting enquiry to lead:', enquiry);
    setSelectedEnquiry(enquiry);
    setIsConvertModalOpen(true);
    setIsViewModalOpen(false); // Close view modal if open
  };

  const handleFormSubmit = async (formData) => {
    await loadEnquiries(); // Reload the list
  };

  const handleLeadConverted = async (conversionData) => {
    await loadEnquiries(); // Reload the list to show updated status
    setIsConvertModalOpen(false);
    setSelectedEnquiry(null);
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-600">Manage customer enquiries and convert them to leads</p>
        </div>
        <button
          onClick={() => setIsNewFormOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
              <option value="Lost">Lost</option>
            </select>

            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Classifications</option>
              <option value="Hot">Hot</option>
              <option value="Medium">Medium</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredEnquiries.length} of {enquiries.length} enquiries
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enquiry Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEnquiries.map((enquiry) => (
                <tr key={enquiry.enquiry_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {enquiry.enquiry_number || `ENQ-${enquiry.enquiry_id}`}
                      </div>
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
                        {enquiry.contact_person_name} {enquiry.contact_surname || ''}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2 mb-1">
                        <Phone className="h-3 w-3" />
                        <span>{enquiry.primary_phone}</span>
                      </div>
                      {enquiry.email && (
                        <div className="text-sm text-gray-500 flex items-center space-x-2 mb-1">
                          <Mail className="h-3 w-3" />
                          <span>{enquiry.email}</span>
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
                      <div className="text-sm text-gray-500">Budget: {enquiry.budget_range}</div>
                      <div className="text-sm text-gray-500">
                        Area: {enquiry.approximate_area} {enquiry.area_unit}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {/* Package Information Display - FIXED VERSION */}
                      {enquiry.primary_package_name ? (
                        <>
                          <div className="text-sm font-medium text-blue-700 flex items-center">
                            <Package className="h-3 w-3 mr-1" />
                            {enquiry.primary_package_name}
                          </div>
                          <div className="text-xs text-blue-600">
                            ₹{enquiry.primary_package_rate}/sq ft
                          </div>
                          {enquiry.approximate_area && enquiry.primary_package_rate && (
                            <div className="text-xs text-green-600 font-medium">
                              Est: {formatCurrency(enquiry.approximate_area * enquiry.primary_package_rate)}
                            </div>
                          )}
                        </>
                      ) : enquiry.package_id ? (
                        <div className="text-sm text-orange-600 flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          Package ID: {enquiry.package_id}
                          <span className="text-xs text-gray-500 ml-1">(Name not loaded)</span>
                        </div>
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
        {filteredEnquiries.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterClassification !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first enquiry to get started'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterClassification === 'all' && (
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEnquiries.length)} of {filteredEnquiries.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === index + 1
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <ConvertToLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setSelectedEnquiry(null);
        }}
        onSubmit={handleLeadConverted}
        enquiry={selectedEnquiry}
      />
    </div>
  );
};

export default EnquiryList;
