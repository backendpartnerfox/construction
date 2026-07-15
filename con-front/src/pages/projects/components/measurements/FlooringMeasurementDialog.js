import React from 'react';
import { X, Layers, Info } from 'lucide-react';

const FlooringMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  const flooringTypes = [
    'Vitrified Tiles',
    'Ceramic Tiles',
    'Marble',
    'Granite',
    'Wooden Flooring',
    'Laminate Flooring',
    'Vinyl Flooring',
    'Carpet',
    'Epoxy Flooring',
    'Concrete Flooring'
  ];

  const tileSizes = [
    '2x2 ft (600x600 mm)',
    '2x4 ft (600x1200 mm)',
    '3x3 ft (900x900 mm)',
    '1x1 ft (300x300 mm)',
    '1x2 ft (300x600 mm)',
    'Custom Size'
  ];

  const patternTypes = [
    'Straight Lay',
    'Diagonal',
    'Herringbone',
    'Brick Pattern',
    'Random',
    'Checkerboard'
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
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Flooring Measurement' : editMode ? 'Edit Flooring Measurement' : 'Add Flooring Measurement'}
                  </h3>
                  <p className="text-sm text-purple-100">
                    {viewMode ? 'View flooring details' : 'Record flooring type and area specifications'}
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
          <form onSubmit={onSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Info Box */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">About Flooring Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record room dimensions for accurate area calculation</li>
                      <li>Base preparation is typically required for most flooring types</li>
                      <li>Skirting protects wall-floor junction and covers expansion gaps</li>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area Description
                    </label>
                    <input
                      type="text"
                      name="area_description"
                      value={formData.area_description}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., Main Area, Balcony"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="length"
                      value={formData.length}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 15"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="width"
                      value={formData.width}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 12"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
                {formData.length && formData.width && (
                  <div className="mt-2 text-sm text-purple-600 font-medium">
                    Calculated Area: {(parseFloat(formData.length) * parseFloat(formData.width)).toFixed(2)} sq ft
                  </div>
                )}
              </div>

              {/* Flooring Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Flooring Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flooring Type
                    </label>
                    <select
                      name="flooring_type"
                      value={formData.flooring_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select type</option>
                      {flooringTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tile/Plank Size
                    </label>
                    <select
                      name="tile_size"
                      value={formData.tile_size}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select size</option>
                      {tileSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pattern Type
                    </label>
                    <select
                      name="pattern_type"
                      value={formData.pattern_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select pattern</option>
                      {patternTypes.map((pattern) => (
                        <option key={pattern} value={pattern}>
                          {pattern}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Base Preparation */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Base Preparation</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="base_preparation_required"
                      checked={formData.base_preparation_required}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Base Preparation Required
                    </label>
                  </div>

                  {formData.base_preparation_required && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Thickness (mm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        name="base_thickness"
                        value={formData.base_thickness}
                        onChange={onInputChange}
                        disabled={viewMode}
                        placeholder="e.g., 50"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Skirting */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Skirting</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="skirting_required"
                      checked={formData.skirting_required}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Skirting Required
                    </label>
                  </div>

                  {formData.skirting_required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skirting Height (inches)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="skirting_height"
                          value={formData.skirting_height}
                          onChange={onInputChange}
                          disabled={viewMode}
                          placeholder="e.g., 4"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skirting Length (ft)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="skirting_length"
                          value={formData.skirting_length}
                          onChange={onInputChange}
                          disabled={viewMode}
                          placeholder="Perimeter length"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Layers className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Flooring' : 'Add Flooring'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FlooringMeasurementDialog;
