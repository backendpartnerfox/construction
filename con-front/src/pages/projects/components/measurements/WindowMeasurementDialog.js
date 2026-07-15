import React from 'react';
import { X, Square, Info } from 'lucide-react';

const WindowMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  const windowTypes = [
    'Fixed Window',
    'Casement Window',
    'Sliding Window',
    'Awning Window',
    'Bay Window',
    'Bow Window',
    'Picture Window',
    'Skylight'
  ];

  const frameMaterials = [
    'UPVC',
    'Aluminum',
    'Wood',
    'Steel',
    'Fiberglass',
    'Composite',
    'Vinyl'
  ];

  const glassTypes = [
    'Clear Glass',
    'Tinted Glass',
    'Frosted Glass',
    'Tempered Glass',
    'Laminated Glass',
    'Double Glazed',
    'Triple Glazed',
    'Low-E Glass'
  ];

  const openingStyles = [
    'Fixed',
    'Casement',
    'Sliding',
    'Awning',
    'Hopper',
    'Tilt & Turn',
    'Double Hung',
    'Single Hung'
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

  const grillMaterials = [
    'MS (Mild Steel)',
    'SS (Stainless Steel)',
    'Aluminum',
    'Wrought Iron',
    'UPVC'
  ];

  const grillDesigns = [
    'Simple Vertical Bars',
    'Horizontal Bars',
    'Square Pattern',
    'Decorative',
    'Colonial',
    'Contemporary',
    'Custom Design'
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <Square className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Window Measurement' : editMode ? 'Edit Window Measurement' : 'Add Window Measurement'}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {viewMode ? 'View window details' : 'Record window dimensions and specifications'}
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
                    <p className="font-medium mb-1">About Window Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record window location, type, and glass specifications</li>
                      <li>Sill level indicates height from floor to window bottom</li>
                      <li>Add grills for security or aesthetic requirements</li>
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
                      Window Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="window_location"
                      value={formData.window_location}
                      onChange={onInputChange}
                      disabled={viewMode}
                      required
                      placeholder="e.g., Living Room - East Wall"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                      Sill Level (ft)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="sill_level"
                      value={formData.sill_level}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 2.5"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Window Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Window Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Window Type
                    </label>
                    <select
                      name="window_type"
                      value={formData.window_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select type</option>
                      {windowTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frame Material
                    </label>
                    <select
                      name="frame_material"
                      value={formData.frame_material}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select material</option>
                      {frameMaterials.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Glass Type
                    </label>
                    <select
                      name="glass_type"
                      value={formData.glass_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select glass type</option>
                      {glassTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Style
                    </label>
                    <select
                      name="opening_style"
                      value={formData.opening_style}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select style</option>
                      {openingStyles.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Window Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Window Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                      placeholder="e.g., 4"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="window_thickness"
                      value={formData.window_thickness}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 6"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grill Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Grill Information (Optional)</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_grills"
                      checked={formData.has_grills}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Has Security Grills
                    </label>
                  </div>

                  {formData.has_grills && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grill Material
                        </label>
                        <select
                          name="grill_material"
                          value={formData.grill_material}
                          onChange={onInputChange}
                          disabled={viewMode}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">Select material</option>
                          {grillMaterials.map((material) => (
                            <option key={material} value={material}>
                              {material}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grill Design
                        </label>
                        <select
                          name="grill_design"
                          value={formData.grill_design}
                          onChange={onInputChange}
                          disabled={viewMode}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">Select design</option>
                          {grillDesigns.map((design) => (
                            <option key={design} value={design}>
                              {design}
                            </option>
                          ))}
                        </select>
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
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Square className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Window' : 'Add Window'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WindowMeasurementDialog;
