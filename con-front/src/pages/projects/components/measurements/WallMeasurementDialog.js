import React from 'react';
import { X, Ruler, Info } from 'lucide-react';

const WallMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  const wallTypes = [
    'External Wall',
    'Internal Wall',
    'Load Bearing Wall',
    'Partition Wall',
    'Compound Wall',
    'Retaining Wall'
  ];

  const directions = [
    'North',
    'South',
    'East',
    'West',
    'North-East',
    'North-West',
    'South-East',
    'South-West'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={viewMode ? onClose : undefined}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <Ruler className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Wall Measurement' : editMode ? 'Edit Wall Measurement' : 'Add Wall Measurement'}
                  </h3>
                  <p className="text-sm text-orange-100">
                    {viewMode ? 'View wall details' : 'Record wall dimensions with openings'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="px-6 py-4">
            <div className="space-y-6">
              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">About Wall Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record main wall dimensions (width × height)</li>
                      <li>Add door and window openings for accurate calculations</li>
                      <li>Net wall area is automatically calculated</li>
                      <li>Up to 2 windows and 2 doors can be recorded per wall</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="floor"
                      value={formData.floor}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., Ground Floor, First Floor"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., Living Room, Master Bedroom"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wall Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="walltype"
                      value={formData.walltype}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select wall type</option>
                      {wallTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wall Direction <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="wall_direction"
                      value={formData.wall_direction}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select direction</option>
                      {directions.map((dir) => (
                        <option key={dir} value={dir}>
                          {dir}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Wall Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Wall Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="width"
                      value={formData.width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., 12.5"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="height"
                      value={formData.height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., 10"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="wall_thickness"
                      value={formData.wall_thickness}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 230"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Window 1 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Window 1 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="window_width"
                      value={formData.window_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 4"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="window_height"
                      value={formData.window_height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 3"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Window 2 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Window 2 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="window2_width"
                      value={formData.window2_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 3"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="window2_height"
                      value={formData.window2_height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 3"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Door 1 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Door 1 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="door_width"
                      value={formData.door_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 3"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="door_height"
                      value={formData.door_height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 7"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Door 2 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Door 2 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="door2_width"
                      value={formData.door2_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 3"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="door2_height"
                      value={formData.door2_height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 7"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lintel */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Lintel (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="lintel_width"
                      value={formData.lintel_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 4"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="lintel_height"
                      value={formData.lintel_height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 1"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <Ruler className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Wall' : 'Add Wall'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WallMeasurementDialog;
