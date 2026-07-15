import React from 'react';
import { X, PaintBucket, Info } from 'lucide-react';

const PaintingMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  const surfaceTypes = [
    'Interior Wall',
    'Exterior Wall',
    'Ceiling',
    'Door',
    'Window Frame',
    'Grill',
    'Metal Surface'
  ];

  const surfacePreparations = [
    'New Surface',
    'Scraping & Cleaning',
    'Repair Cracks',
    'Remove Old Paint',
    'Primer Only'
  ];

  const paintFinishes = [
    'Emulsion (Matt)',
    'Emulsion (Satin)',
    'Emulsion (Silk)',
    'Enamel (Gloss)',
    'Enamel (Semi-Gloss)',
    'Weather Coat (Exterior)',
    'Texture Paint',
    'Distemper'
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
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <PaintBucket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Painting Measurement' : editMode ? 'Edit Painting Measurement' : 'Add Painting Measurement'}
                  </h3>
                  <p className="text-sm text-pink-100">
                    {viewMode ? 'View painting details' : 'Record painting areas and specifications'}
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
              <div className="rounded-lg bg-pink-50 border border-pink-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-pink-800">
                    <p className="font-medium mb-1">About Painting Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record wall dimensions and deduct door/window areas for net painting area</li>
                      <li>Typical: 1 primer + 2 putty + 2 paint coats for interior walls</li>
                      <li>Exterior walls usually need weather-resistant paint</li>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surface Description
                    </label>
                    <input
                      type="text"
                      name="surface_description"
                      value={formData.surface_description}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., North Wall, Main Ceiling"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surface Type
                    </label>
                    <select
                      name="surface_type"
                      value={formData.surface_type}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select type</option>
                      {surfaceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surface Preparation
                    </label>
                    <select
                      name="surface_preparation"
                      value={formData.surface_preparation}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select preparation</option>
                      {surfacePreparations.map((prep) => (
                        <option key={prep} value={prep}>
                          {prep}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="height"
                      value={formData.height}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., 10"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Door/Window Area (sq ft)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="door_window_area"
                      value={formData.door_window_area}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Area to deduct"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
                {formData.length && formData.height && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-pink-600 font-medium">
                      Total Area: {(parseFloat(formData.length) * parseFloat(formData.height)).toFixed(2)} sq ft
                    </div>
                    <div className="text-sm text-pink-600 font-medium">
                      Net Painting Area: {((parseFloat(formData.length) * parseFloat(formData.height)) - (parseFloat(formData.door_window_area) || 0)).toFixed(2)} sq ft
                    </div>
                  </div>
                )}
              </div>

              {/* Coats */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Coats</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primer Coats
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      name="primer_coats"
                      value={formData.primer_coats}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Putty Coats
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      name="putty_coats"
                      value={formData.putty_coats}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paint Coats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      name="paint_coats"
                      value={formData.paint_coats}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Paint Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Paint Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paint Finish
                    </label>
                    <select
                      name="paint_finish"
                      value={formData.paint_finish}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select finish</option>
                      {paintFinishes.map((finish) => (
                        <option key={finish} value={finish}>
                          {finish}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paint Color
                    </label>
                    <input
                      type="text"
                      name="paint_color"
                      value={formData.paint_color}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., White, Beige, Light Blue"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                >
                  <PaintBucket className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Painting' : 'Add Painting'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaintingMeasurementDialog;
