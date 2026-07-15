import React from 'react';
import { X, DoorOpen, Info } from 'lucide-react';

const DoorMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  const doorTypes = [
    'Single Door',
    'Double Door',
    'Sliding Door',
    'Folding Door',
    'French Door',
    'Pocket Door',
    'Barn Door',
    'Pivot Door'
  ];

  const doorMaterials = [
    'Wood',
    'Steel',
    'Aluminum',
    'Fiberglass',
    'UPVC',
    'Glass',
    'Composite',
    'WPC'
  ];

  const doorStyles = [
    'Panel',
    'Flush',
    'French',
    'Louvered',
    'Dutch',
    'Glass Panel',
    'Contemporary',
    'Traditional'
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
                  <DoorOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Door Measurement' : editMode ? 'Edit Door Measurement' : 'Add Door Measurement'}
                  </h3>
                  <p className="text-sm text-orange-100">
                    {viewMode ? 'View door details' : 'Record door dimensions and specifications'}
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
                    <p className="font-medium mb-1">About Door Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record door location, type, and material</li>
                      <li>Specify dimensions for accurate material estimation</li>
                      <li>Frame dimensions help calculate complete requirements</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Location Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Door Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="door_location"
                      value={formData.door_location}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., Main Entrance, Bedroom 1"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., Living Room, Master Bedroom"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wall Direction
                    </label>
                    <select
                      name="wall_direction"
                      value={formData.wall_direction}
                      onChange={onInputChange}
                      disabled={viewMode}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={formData.quantity}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Door Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Door Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Door Type
                    </label>
                    <select
                      name="door_type"
                      value={formData.door_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select type</option>
                      {doorTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <select
                      name="door_material"
                      value={formData.door_material}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select material</option>
                      {doorMaterials.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style
                    </label>
                    <select
                      name="door_style"
                      value={formData.door_style}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select style</option>
                      {doorStyles.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Door Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Door Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="door_thickness"
                      value={formData.door_thickness}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 35"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Frame Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Frame Dimensions (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frame Width (inches)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="frame_width"
                      value={formData.frame_width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 4"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frame Thickness (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="frame_thickness"
                      value={formData.frame_thickness}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 25"
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
                  <DoorOpen className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Door' : 'Add Door'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoorMeasurementDialog;
