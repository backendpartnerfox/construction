import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Calculator,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  FileText,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  AlertCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const MeasurementBOQIntegration = ({ projectId }) => {
  const [measurements, setMeasurements] = useState({});
  const [boqData, setBOQData] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch measurements from all types
      const measurementTypes = ['structural', 'walls', 'doors', 'windows', 'electrical', 'plumbing', 'flooring', 'painting'];
      const measurementPromises = measurementTypes.map(async (type) => {
        try {
          // Special handling for walls - backend uses different naming
          const apiPath = type === 'walls' 
            ? `${API_BASE_URL}/api/architect_walls_measurements/project/${projectId}`
            : `${API_BASE_URL}/api/architect_measurements_${type}/project/${projectId}`;
          
          const response = await axios.get(apiPath);
          const data = response.data?.success ? response.data.data : response.data;
          return { type, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          console.error(`Error fetching ${type} measurements:`, error);
          return { type, data: [] };
        }
      });

      const [allMeasurements, boqRes] = await Promise.all([
        Promise.all(measurementPromises),
        fetchBOQData()
      ]);

      // Organize measurements by type
      const measurementsData = {};
      allMeasurements.forEach(({ type, data }) => {
        measurementsData[type] = data;
      });

      setMeasurements(measurementsData);
      setBOQData(boqRes);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBOQData = async () => {
    try {
      // Use the BOQ generation summary endpoint instead of individual endpoints
      const response = await axios.get(`${API_BASE_URL}/api/boq_generation/summary/${projectId}`);
      
      if (response.data?.success && response.data.summary) {
        return response.data.summary;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching BOQ data:', error);
      return {};
    }
  };

  const triggerBOQCalculation = async () => {
    try {
      setCalculating(true);
      
      // Call the correct BOQ calculation API endpoint
      const response = await axios.post(`${API_BASE_URL}/api/boq_generation/generate/${projectId}`);
      
      // Refresh BOQ data
      const updatedBoqData = await fetchBOQData();
      setBOQData(updatedBoqData);
      setLastCalculated(new Date());
      
      toast.success(`BOQ calculation completed! Generated ${response.data.totalItems || 0} items.`);
      
    } catch (error) {
      console.error('Error calculating BOQ:', error);
      toast.error('Error calculating BOQ. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getMeasurementSummary = () => {
    const summary = {};
    Object.entries(measurements).forEach(([type, data]) => {
      summary[type] = {
        total: data.length,
        verified: data.filter(item => item.status === 'Verified').length,
        hasMeasurements: data.length > 0
      };
    });
    return summary;
  };

  const getBOQSummary = () => {
    const summary = {};
    Object.entries(boqData).forEach(([type, data]) => {
      // Handle the summary data structure from the API
      const itemCount = data?.total_items ? parseInt(data.total_items) : 0;
      const totalQuantity = data?.total_quantity ? parseFloat(data.total_quantity) : 0;
      const totalCost = data?.total_cost ? parseFloat(data.total_cost) : 0;
      
      summary[type] = {
        itemCount,
        totalQuantity,
        totalCost,
        hasBoq: itemCount > 0
      };
    });
    return summary;
  };

  const measurementSummary = getMeasurementSummary();
  const boqSummary = getBOQSummary();

  const getIntegrationStatus = (type) => {
    const hasMeasurements = measurementSummary[type]?.hasMeasurements;
    const hasVerifiedMeasurements = measurementSummary[type]?.verified > 0;
    const hasBOQ = boqSummary[type]?.hasBoq;

    if (!hasMeasurements) return { status: 'no-measurements', color: 'gray', icon: AlertCircle };
    if (!hasVerifiedMeasurements) return { status: 'pending-verification', color: 'yellow', icon: Clock };
    if (!hasBOQ) return { status: 'needs-calculation', color: 'orange', icon: Calculator };
    return { status: 'integrated', color: 'green', icon: CheckCircle };
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
          <h4 className="text-base font-semibold text-gray-900">Measurements to BOQ Integration</h4>
          <p className="text-sm text-gray-500">
            Monitor and manage the flow from measurements to BOQ calculations
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

      {/* Integration Flow Diagram */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Workflow</h2>
        <div className="flex items-center justify-between overflow-x-auto">
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Measurements</p>
            <p className="text-xs text-gray-500">Architect inputs</p>
          </div>
          
          <ArrowRight className="h-6 w-6 text-gray-400 mx-4 flex-shrink-0" />
          
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Verification</p>
            <p className="text-xs text-gray-500">Quality check</p>
          </div>
          
          <ArrowRight className="h-6 w-6 text-gray-400 mx-4 flex-shrink-0" />
          
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">BOQ Calculation</p>
            <p className="text-xs text-gray-500">Quantity & Cost</p>
          </div>
          
          <ArrowRight className="h-6 w-6 text-gray-400 mx-4 flex-shrink-0" />
          
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Units & Phases</p>
            <p className="text-xs text-gray-500">Work breakdown</p>
          </div>
        </div>
      </div>

      {/* Integration Status by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.keys(measurementSummary).map((type) => {
          const integrationStatus = getIntegrationStatus(type);
          const StatusIcon = integrationStatus.icon;
          const measurementData = measurementSummary[type];
          const boqDataForType = boqSummary[type] || {};
          
          return (
            <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{type}</h3>
                <StatusIcon className={`h-6 w-6 ${
                  integrationStatus.color === 'green' ? 'text-green-500' :
                  integrationStatus.color === 'yellow' ? 'text-yellow-500' :
                  integrationStatus.color === 'orange' ? 'text-orange-500' :
                  'text-gray-500'
                }`} />
              </div>

              {/* Measurements Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Measurements</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{measurementData.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Verified:</span>
                    <span className="font-medium text-green-600">{measurementData.verified}</span>
                  </div>
                </div>
              </div>

              {/* BOQ Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">BOQ</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{boqDataForType.itemCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{boqDataForType.totalQuantity?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium text-blue-600">
                      ₹{boqDataForType.totalCost?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={`text-center p-2 rounded text-sm font-medium ${
                integrationStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                integrationStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                integrationStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {integrationStatus.status === 'integrated' ? 'Integrated' :
                 integrationStatus.status === 'needs-calculation' ? 'Needs Calculation' :
                 integrationStatus.status === 'pending-verification' ? 'Pending Verification' :
                 'No Measurements'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Integration Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((Object.values(measurementSummary).filter(m => m.verified > 0).length / 
                  Object.keys(measurementSummary).length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total BOQ Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(boqSummary).reduce((sum, boq) => sum + (boq.itemCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Project Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{Object.values(boqSummary).reduce((sum, boq) => sum + (boq.totalCost || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Integration Status Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Integration Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Measurement Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified Measurements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BOQ Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(measurementSummary).map((type) => {
                const integrationStatus = getIntegrationStatus(type);
                const StatusIcon = integrationStatus.icon;
                const measurementData = measurementSummary[type];
                const boqDataForType = boqSummary[type] || {};
                
                return (
                  <tr key={type} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Layers className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600 font-medium">{measurementData.verified}</span>
                      <span className="text-gray-500">/{measurementData.total}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {boqDataForType.itemCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{boqDataForType.totalCost?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${
                          integrationStatus.color === 'green' ? 'text-green-500' :
                          integrationStatus.color === 'yellow' ? 'text-yellow-500' :
                          integrationStatus.color === 'orange' ? 'text-orange-500' :
                          'text-gray-500'
                        }`} />
                        <span className={`text-sm ${
                          integrationStatus.color === 'green' ? 'text-green-800' :
                          integrationStatus.color === 'yellow' ? 'text-yellow-800' :
                          integrationStatus.color === 'orange' ? 'text-orange-800' :
                          'text-gray-800'
                        }`}>
                          {integrationStatus.status === 'integrated' ? 'Ready' :
                           integrationStatus.status === 'needs-calculation' ? 'Calculate' :
                           integrationStatus.status === 'pending-verification' ? 'Verify' :
                           'No Data'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MeasurementBOQIntegration;
