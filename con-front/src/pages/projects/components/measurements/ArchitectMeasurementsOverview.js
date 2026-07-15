import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Building2,
  FileText,
  Grid,
  DoorOpen,
  Square,
  Zap,
  Droplet,
  Layers,
  PaintBucket,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calculator,
  RefreshCw,
  BarChart3,
  Plus,
  Eye
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ArchitectMeasurementsOverview = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);

  // Measurement types with their configuration
  const measurementTypes = [
    { 
      id: 'structural', 
      label: 'Structural', 
      icon: Building2, 
      color: 'blue',
      description: 'Columns, beams, slabs, foundations'
    },
    { 
      id: 'walls', 
      label: 'Walls', 
      icon: Grid, 
      color: 'green',
      description: 'Interior and exterior walls'
    },
    { 
      id: 'doors', 
      label: 'Doors', 
      icon: DoorOpen, 
      color: 'purple',
      description: 'Door frames and specifications'
    },
    { 
      id: 'windows', 
      label: 'Windows', 
      icon: Square, 
      color: 'indigo',
      description: 'Window frames and glazing'
    },
    { 
      id: 'electrical', 
      label: 'Electrical', 
      icon: Zap, 
      color: 'yellow',
      description: 'Wiring, switches, outlets'
    },
    { 
      id: 'plumbing', 
      label: 'Plumbing', 
      icon: Droplet, 
      color: 'blue',
      description: 'Pipes, fixtures, fittings'
    },
    { 
      id: 'flooring', 
      label: 'Flooring', 
      icon: Layers, 
      color: 'pink',
      description: 'Floor types and areas'
    },
    { 
      id: 'painting', 
      label: 'Painting', 
      icon: PaintBucket, 
      color: 'orange',
      description: 'Wall and ceiling areas'
    }
  ];

  useEffect(() => {
    if (projectId) {
      fetchSummaryData();
    }
  }, [projectId]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const promises = measurementTypes.map(async (type) => {
        try {
          // Special handling for walls - backend uses different naming
          const apiPath = type.id === 'walls' 
            ? `${API_BASE_URL}/api/architect_walls_measurements/project/${projectId}`
            : `${API_BASE_URL}/api/architect_measurements_${type.id}/project/${projectId}`;
          
          const response = await axios.get(apiPath);
          const data = response.data?.success ? response.data.data : response.data;
          const measurements = Array.isArray(data) ? data : [];
          
          return {
            type: type.id,
            total: measurements.length,
            verified: measurements.filter(item => item.status === 'Verified').length,
            pending: measurements.filter(item => item.status === 'Pending Verification').length,
            draft: measurements.filter(item => item.status === 'Draft').length,
            data: measurements
          };
        } catch (error) {
          console.error(`Error fetching ${type.id} measurements:`, error);
          return {
            type: type.id,
            total: 0,
            verified: 0,
            pending: 0,
            draft: 0,
            data: []
          };
        }
      });

      const results = await Promise.all(promises);
      const summary = {};
      results.forEach(result => {
        summary[result.type] = result;
      });
      
      setSummaryData(summary);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      toast.error('Error loading measurements summary');
    } finally {
      setLoading(false);
    }
  };

  const triggerBOQCalculation = async () => {
    try {
      setCalculating(true);
      
      // Call the BOQ calculation API endpoint
      const response = await axios.post(`${API_BASE_URL}/api/boq_generation/generate/${projectId}`);
      
      toast.success(`BOQ calculation completed successfully! Generated ${response.data.totalItems || 0} items.`);
      setLastCalculated(new Date());
      
    } catch (error) {
      console.error('Error calculating BOQ:', error);
      toast.error('Error calculating BOQ. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getTotalMeasurements = () => {
    return Object.values(summaryData).reduce((total, type) => total + type.total, 0);
  };

  const getTotalVerified = () => {
    return Object.values(summaryData).reduce((total, type) => total + type.verified, 0);
  };

  const getCompletionPercentage = () => {
    const total = getTotalMeasurements();
    const verified = getTotalVerified();
    return total > 0 ? Math.round((verified / total) * 100) : 0;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colors[color] || colors.blue;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pending Verification':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Measurements Overview</h3>
          <p className="text-sm text-gray-500">
            Summary of all measurement types for this project
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastCalculated && (
            <div className="text-sm text-gray-500">
              Last calculated: {lastCalculated.toLocaleString()}
            </div>
          )}
          <button
            onClick={triggerBOQCalculation}
            disabled={calculating}
            className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {calculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate BOQ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Measurements</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalMeasurements()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalVerified()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-gray-900">{getCompletionPercentage()}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {measurementTypes.map((type) => {
          const Icon = type.icon;
          const data = summaryData[type.id] || { total: 0, verified: 0, pending: 0, draft: 0, data: [] };
          const colorClasses = getColorClasses(type.color);
          
          return (
            <div key={type.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.total}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Verified</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.verified}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.pending}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.draft}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{data.total > 0 ? Math.round((data.verified / data.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      type.color === 'blue' ? 'bg-blue-500' :
                      type.color === 'green' ? 'bg-green-500' :
                      type.color === 'purple' ? 'bg-purple-500' :
                      type.color === 'indigo' ? 'bg-indigo-500' :
                      type.color === 'yellow' ? 'bg-yellow-500' :
                      type.color === 'pink' ? 'bg-pink-500' :
                      'bg-orange-500'
                    }`}
                    style={{ 
                      width: `${data.total > 0 ? (data.verified / data.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Recent Activity */}
              {data.data && data.data.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Recent Activity</p>
                  <div className="space-y-1">
                    {data.data.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-600 truncate">
                          {item.element_name || 'Unknown Element'}
                        </span>
                        <div className="flex items-center ml-2">
                          {getStatusIcon(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Measurements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Measurements</h3>
        </div>
        <div className="overflow-x-auto">
          {Object.values(summaryData).some(type => type.data.length > 0) ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Element
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Floor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summaryData)
                  .flatMap(([type, data]) => 
                    data.data.map(item => ({ ...item, measurement_type: type }))
                  )
                  .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
                  .slice(0, 10)
                  .map((item, index) => {
                    const typeConfig = measurementTypes.find(t => t.id === item.measurement_type);
                    const TypeIcon = typeConfig?.icon || FileText;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TypeIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {item.measurement_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.element_name || 'Unknown Element'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.floor || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === 'Verified' ? 'bg-green-100 text-green-800' :
                            item.status === 'Pending Verification' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.recorded_by_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.recorded_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No measurements yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding measurements for different elements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchitectMeasurementsOverview;
