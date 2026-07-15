import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings, ArrowLeft, Calendar, Tag } from 'lucide-react';
import { packageCustomizationApi } from '../../../services/clientsApi';

const PackageCustomizations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomizations();
  }, [id]);

  const loadCustomizations = async () => {
    try {
      const response = await packageCustomizationApi.getByClient(id);
      setCustomizations(response.data || []);
    } catch (error) {
      console.error('Error loading customizations:', error);
      setCustomizations([]);
    } finally {
      setLoading(false);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package Customizations</h1>
            <p className="text-gray-600 mt-1">Manage package item choice customizations</p>
          </div>
          <button
            onClick={() => navigate(`/clients/${id}/customizations/new`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customization</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : customizations.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No customizations found</p>
            <p className="text-sm text-gray-400 mt-1">Add package customizations to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customizations.map((custom) => (
              <div key={custom.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Package #{custom.package_id}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        custom.choice_status === 'Active' ? 'bg-green-100 text-green-800' :
                        custom.choice_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        custom.choice_status === 'Superseded' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {custom.choice_status}
                      </span>
                      {custom.is_current && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Current Version
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Item ID</p>
                        <p className="text-sm font-medium text-gray-900">{custom.item_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Choice ID</p>
                        <p className="text-sm font-medium text-gray-900">{custom.item_choice_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Version</p>
                        <p className="text-sm font-medium text-gray-900">v{custom.version}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Project ID</p>
                        <p className="text-sm font-medium text-gray-900">{custom.project_id}</p>
                      </div>
                    </div>

                    {/* Date Information */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatDate(custom.effective_start_date)}</span>
                      </div>
                      {custom.effective_end_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>End: {formatDate(custom.effective_end_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Created/Updated Info */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {formatDate(custom.created_at)}</span>
                        {custom.updated_at && (
                          <span>Updated: {formatDate(custom.updated_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/clients/${id}/customizations/${custom.id}`)}
                    className="text-orange-600 hover:text-orange-700 ml-4"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCustomizations;
