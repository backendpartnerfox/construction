import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Calculator,
  IndianRupee,
  RefreshCw,
  FileText,
  Trash2,
} from 'lucide-react';
import BOQSummaryCards from './BOQSummaryCards';
import BOQItemsTable from './BOQItemsTable';
import BOQCostBreakdown from './BOQCostBreakdown';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const BOQDashboard = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applyingCosts, setApplyingCosts] = useState(false);
  const [boqSummary, setBoqSummary] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (projectId) {
      loadBOQData();
    }
  }, [projectId]);

  const loadBOQData = async () => {
    setLoading(true);
    try {
      // Load BOQ summary
      const summaryResponse = await axios.get(`${API_BASE_URL}/api/boq_generation/summary/${projectId}`);
      setBoqSummary(summaryResponse.data);

      // Load cost breakdown
      const breakdownResponse = await axios.get(`${API_BASE_URL}/api/boq_generation/cost-breakdown/${projectId}`);
      setCostBreakdown(breakdownResponse.data);

      console.log('BOQ data loaded successfully');
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading BOQ data:', error);
        toast.error('Error loading BOQ data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBOQ = async () => {
    if (!window.confirm('Generate BOQ from verified measurements? This will create BOQ items for all modules.')) {
      return;
    }

    setGenerating(true);
    try {
      console.log('🚀 Generating BOQ for project:', projectId);
      const response = await axios.post(`${API_BASE_URL}/api/boq_generation/generate/${projectId}`, {
        created_by: 1
      });

      console.log('BOQ generation response:', response.data);

      if (response.data.success) {
        toast.success(`BOQ generated successfully! ${response.data.totalItems} items created.`);
        loadBOQData();
      }
    } catch (error) {
      console.error('Error generating BOQ:', error);
      toast.error(error.response?.data?.error || 'Error generating BOQ');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyCosts = async () => {
    if (!window.confirm('Apply costs to BOQ items? This will fetch rates and calculate total costs.')) {
      return;
    }

    setApplyingCosts(true);
    try {
      console.log('💰 Applying costs for project:', projectId);
      const response = await axios.post(`${API_BASE_URL}/api/boq_generation/apply-costs/${projectId}`, {
        gst_percentage: 18
      });

      console.log('Cost application response:', response.data);

      if (response.data.success) {
        toast.success(`Costs applied! Grand Total: ₹${response.data.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
        loadBOQData();
      }
    } catch (error) {
      console.error('Error applying costs:', error);
      toast.error(error.response?.data?.error || 'Error applying costs');
    } finally {
      setApplyingCosts(false);
    }
  };

  const handleClearBOQ = async () => {
    if (!window.confirm('Clear all BOQ items? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/boq_generation/clear/${projectId}`);
      
      if (response.data.success) {
        toast.success('BOQ cleared successfully');
        setBoqSummary(null);
        setCostBreakdown(null);
      }
    } catch (error) {
      console.error('Error clearing BOQ:', error);
      toast.error('Error clearing BOQ');
    }
  };

  const hasBOQData = boqSummary && Object.keys(boqSummary.summary || {}).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bill of Quantities (BOQ)</h3>
          <p className="text-sm text-gray-500">
            Generate and manage project BOQ with cost estimates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadBOQData}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {hasBOQData && (
            <>
              <button
                onClick={handleApplyCosts}
                disabled={applyingCosts}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                <IndianRupee className="-ml-1 mr-2 h-4 w-4" />
                {applyingCosts ? 'Applying...' : 'Apply Costs'}
              </button>

              <button
                onClick={handleClearBOQ}
                className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                Clear BOQ
              </button>
            </>
          )}

          <button
            onClick={handleGenerateBOQ}
            disabled={generating}
            className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
          >
            <Calculator className="-ml-1 mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate BOQ'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasBOQData && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No BOQ Generated</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate BOQ from verified measurements to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={handleGenerateBOQ}
              disabled={generating}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <Calculator className="-ml-1 mr-2 h-5 w-5" />
              {generating ? 'Generating...' : 'Generate BOQ'}
            </button>
          </div>
        </div>
      )}

      {/* BOQ Data */}
      {!loading && hasBOQData && (
        <>
          {/* Summary Cards */}
          <BOQSummaryCards 
            summary={boqSummary?.summary} 
            costBreakdown={costBreakdown}
          />

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('summary')}
                className={`${
                  activeTab === 'summary'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`${
                  activeTab === 'items'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                All Items
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`${
                  activeTab === 'breakdown'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                Cost Breakdown
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Project Summary</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Overview of BOQ items and costs across all modules
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="text-3xl font-bold text-orange-600">
                        ₹{(costBreakdown?.grandTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(boqSummary.summary).map(([module, data]) => (
                    <div key={module} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h5 className="font-medium text-gray-900 capitalize mb-2">{module}</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Items:</span>
                          <span className="font-medium">{data.total_items || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quantity:</span>
                          <span className="font-medium">{parseFloat(data.total_quantity || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Cost:</span>
                          <span className="font-medium text-green-600">
                            ₹{parseFloat(data.total_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <BOQItemsTable projectId={projectId} costBreakdown={costBreakdown} />
            )}

            {activeTab === 'breakdown' && (
              <BOQCostBreakdown costBreakdown={costBreakdown} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BOQDashboard;
