import React from 'react';
import {
  Home,
  Grid,
  DoorOpen,
  Square,
  Zap,
  Droplet,
  Layers,
  PaintBucket,
} from 'lucide-react';

const BOQSummaryCards = ({ summary, costBreakdown }) => {
  if (!summary || !costBreakdown) return null;

  const modules = [
    { key: 'structural', label: 'Structural', icon: Home, color: 'orange' },
    { key: 'walls', label: 'Walls', icon: Grid, color: 'blue' },
    { key: 'doors', label: 'Doors', icon: DoorOpen, color: 'green' },
    { key: 'windows', label: 'Windows', icon: Square, color: 'cyan' },
    { key: 'electrical', label: 'Electrical', icon: Zap, color: 'yellow' },
    { key: 'plumbing', label: 'Plumbing', icon: Droplet, color: 'blue' },
    { key: 'flooring', label: 'Flooring', icon: Layers, color: 'purple' },
    { key: 'painting', label: 'Painting', icon: PaintBucket, color: 'pink' },
  ];

  const getColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      cyan: 'bg-cyan-100 text-cyan-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      pink: 'bg-pink-100 text-pink-600',
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((module) => {
        const moduleData = summary[module.key] || {};
        const moduleCost = costBreakdown?.moduleTotals?.[module.key] || 0;
        const Icon = module.icon;

        return (
          <div
            key={module.key}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${getColorClasses(module.color)}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900">{module.label}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{moduleData.total_items || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">
                  {parseFloat(moduleData.total_quantity || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Cost:</span>
                <span className="font-semibold text-green-600">
                  ₹{moduleCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BOQSummaryCards;
