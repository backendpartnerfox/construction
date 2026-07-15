import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  MoreVertical,
  IndianRupee,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { packagesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Packages = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      console.log('Fetching packages...');
      const response = await packagesAPI.getAll();
      console.log('Packages API response:', response);
      
      // ✅ FIX: Handle different response formats (same as admin module)
      let packagesData = [];
      if (Array.isArray(response)) {
        // If response is directly an array
        packagesData = response;
      } else if (response.data) {
        // If response has a data property
        if (Array.isArray(response.data)) {
          packagesData = response.data;
        } else if (Array.isArray(response.data.packages)) {
          packagesData = response.data.packages;
        } else if (Array.isArray(response.data.data)) {
          packagesData = response.data.data;
        }
      }
      
      console.log('Processed packages data:', packagesData);
      setPackages(packagesData);
    } catch (error) {
      console.error('Error fetching packages:', error);
      console.error('Error details:', error.response);
      toast.error('Failed to fetch packages');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (packageId) => {
    try {
      await packagesAPI.delete(packageId);
      toast.success('Package deleted successfully');
      fetchPackages();
      setShowDeleteModal(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(error.response?.data?.message || 'Failed to delete package');
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Construction Packages</h1>
          <p className="text-gray-600 mt-1">Manage your construction packages and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/packages/rates')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <IndianRupee className="h-4 w-4 mr-2" />
            View Rates
          </button>
          <button
            onClick={() => navigate('/packages/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Get started by creating your first package'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/packages/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Popular badge */}
                {pkg.is_popular && (
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-b-lg text-center -mt-6 -mx-6 mb-4 mx-auto w-fit">
                Most Popular
                </div>
                )}

                <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pkg.is_popular ? 'bg-orange-500' : 'bg-orange-100'}`}>
                      <Package className={`h-5 w-5 ${pkg.is_popular ? 'text-white' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pkg.package_name}
                      </h3>
                      {pkg.tagline && (
                        <p className="text-xs text-gray-500">{pkg.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === pkg.id ? null : pkg.id)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    {dropdownOpen === pkg.id && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            navigate(`/packages/${pkg.id}`);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/packages/${pkg.id}/edit`);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit Package</span>
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowDeleteModal(true);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Package</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Price/sqft:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(pkg.total_price_per_sqft || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Base Price/sqft:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(pkg.base_price_per_sqft || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">GST ({pkg.gst_percentage || 0}%):</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(pkg.gst_amount_per_sqft || 0)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {pkg.description && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 leading-relaxed">{pkg.description}</p>
                  </div>
                )}
                {!pkg.description && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-gray-600">GST: {pkg.gst_percentage || 0}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">
                          {new Date(pkg.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/packages/${pkg.id}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/packages/${pkg.id}/edit`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Package</h3>
                <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{selectedPackage.package_name}"? 
              This will permanently remove the package and all associated data.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPackage(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePackage(selectedPackage.id)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
