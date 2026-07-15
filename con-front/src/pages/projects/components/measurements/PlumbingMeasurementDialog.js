import React from 'react';
import { X, Droplet, Info } from 'lucide-react';

const PlumbingMeasurementDialog = ({
  open,
  onClose,
  editMode,
  viewMode,
  formData,
  onInputChange,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={viewMode ? onClose : undefined}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-5xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <Droplet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Plumbing Measurement' : editMode ? 'Edit Plumbing Measurement' : 'Add Plumbing Measurement'}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {viewMode ? 'View plumbing details' : 'Record plumbing fixtures and pipe specifications'}
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
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">About Plumbing Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record all plumbing fixtures room by room</li>
                      <li>CPVC pipes are for hot/cold water supply</li>
                      <li>PVC pipes are for drainage and sewage</li>
                      <li>Include floor drains and nahani traps for proper drainage</li>
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
                      placeholder="e.g., Master Bathroom, Kitchen"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixture Location
                    </label>
                    <input
                      type="text"
                      name="fixture_location"
                      value={formData.fixture_location}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., East Wall, Near Window"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Plumbing Fixtures */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Plumbing Fixtures</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wash Basins
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="wash_basin_points"
                      value={formData.wash_basin_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toilets
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="toilet_points"
                      value={formData.toilet_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Showers
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="shower_points"
                      value={formData.shower_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kitchen Sinks
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="kitchen_sink_points"
                      value={formData.kitchen_sink_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Washing Machine
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="washing_machine_points"
                      value={formData.washing_machine_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* CPVC Pipes (Water Supply) */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">CPVC Pipes - Water Supply (meters)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1 inch CPVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="cpvc_pipe_1_inch"
                      value={formData.cpvc_pipe_1_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Main supply"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      3/4 inch CPVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="cpvc_pipe_3_4_inch"
                      value={formData.cpvc_pipe_3_4_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Branch lines"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1/2 inch CPVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="cpvc_pipe_1_2_inch"
                      value={formData.cpvc_pipe_1_2_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Fixtures"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* PVC Pipes (Drainage) */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">PVC Pipes - Drainage (meters)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      4 inch PVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="pvc_pipe_4_inch"
                      value={formData.pvc_pipe_4_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Main drainage"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      3 inch PVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="pvc_pipe_3_inch"
                      value={formData.pvc_pipe_3_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Toilet drainage"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      2 inch PVC (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="pvc_pipe_2_inch"
                      value={formData.pvc_pipe_2_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Sink/basin drainage"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Drainage Fixtures */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Drainage Fixtures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor Drains (count)
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="floor_drains"
                      value={formData.floor_drains}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Number of floor drains"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nahani Traps (count)
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="nahani_traps"
                      value={formData.nahani_traps}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Number of nahani traps"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Droplet className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Plumbing' : 'Add Plumbing'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlumbingMeasurementDialog;
