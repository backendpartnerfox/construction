import React from 'react';
import { IndianRupee } from 'lucide-react';

const BOQCostBreakdown = ({ costBreakdown }) => {
  if (!costBreakdown || !costBreakdown.moduleTotals) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cost data available
      </div>
    );
  }

  const modules = Object.entries(costBreakdown.moduleTotals);
  const grandTotal = costBreakdown.grandTotal || 0;

  // Calculate percentages
  const modulesWithPercentage = modules.map(([name, cost]) => ({
    name,
    cost,
    percentage: grandTotal > 0 ? ((cost / grandTotal) * 100).toFixed(2) : 0
  })).sort((a, b) => b.cost - a.cost); // Sort by cost descending

  const getBarColor = (index) => {
    const colors = [
      'bg-orange-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Grand Total Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Total Project Cost</h4>
            <p className="text-sm text-gray-600 mt-1">Including all modules with GST</p>
          </div>
          <div className="flex items-center space-x-2">
            <IndianRupee className="h-8 w-8 text-green-600" />
            <span className="text-4xl font-bold text-green-600">
              {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Module-wise Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Module-wise Cost Distribution</h4>
        
        <div className="space-y-4">
          {modulesWithPercentage.map((module, index) => (
            <div key={module.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {module.name}
                </span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{module.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({module.percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getBarColor(index)}`}
                  style={{ width: `${module.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Module
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost (₹)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modulesWithPercentage.map((module, index) => (
              <tr key={module.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                  {module.name}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  ₹{module.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500">
                  {module.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-4 py-3 text-sm font-bold text-right text-green-600">
                ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BOQCostBreakdown;
