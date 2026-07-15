import React from 'react';

const BOQItemsTable = ({ projectId, costBreakdown }) => {
  if (!costBreakdown || !costBreakdown.breakdown) {
    return (
      <div className="text-center py-8 text-gray-500">
        No BOQ items found
      </div>
    );
  }

  const allItems = [];
  const modules = Object.entries(costBreakdown.breakdown);

  modules.forEach(([moduleName, items]) => {
    if (items && items.length > 0) {
      items.forEach(item => {
        allItems.push({
          ...item,
          module: moduleName
        });
      });
    }
  });

  if (allItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No BOQ items found
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Module</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Item ID</th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Quantity</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Rate (₹)</th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {allItems.map((item, index) => (
            <tr key={`${item.module}-${item.boq_id || index}`} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {item.module}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {item.item_id || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                {parseFloat(item.quantity || 0).toFixed(2)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {item.unit || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                {parseFloat(item.unit_rate || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-green-600">
                {parseFloat(item.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan="5" className="px-3 py-4 text-sm font-semibold text-right text-gray-900">
              Grand Total:
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-right text-green-600">
              ₹{(costBreakdown?.grandTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default BOQItemsTable;
