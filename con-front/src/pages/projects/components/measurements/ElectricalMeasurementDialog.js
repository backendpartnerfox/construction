import React from 'react';
import { X, Zap, Info } from 'lucide-react';

const ElectricalMeasurementDialog = ({
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
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white bg-opacity-20">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {viewMode ? 'View Electrical Measurement' : editMode ? 'Edit Electrical Measurement' : 'Add Electrical Measurement'}
                  </h3>
                  <p className="text-sm text-yellow-100">
                    {viewMode ? 'View electrical details' : 'Record electrical points and circuit specifications'}
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
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">About Electrical Measurements:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Record all electrical points room by room</li>
                      <li>Specify wire and conduit lengths for accurate material estimation</li>
                      <li>MCB (Circuit Breaker) count helps in DB (Distribution Board) planning</li>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Circuit Description
                    </label>
                    <input
                      type="text"
                      name="circuit_description"
                      value={formData.circuit_description}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="e.g., Main Power Circuit, Lighting Circuit"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Electrical Points */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Electrical Points</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Light Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="light_points"
                      value={formData.light_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fan Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="fan_points"
                      value={formData.fan_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      5A Outlets
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="power_outlets_5a"
                      value={formData.power_outlets_5a}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      15A Outlets
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="power_outlets_15a"
                      value={formData.power_outlets_15a}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AC Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="ac_points"
                      value={formData.ac_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Points */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Points</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPS Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="ups_points"
                      value={formData.ups_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="data_points"
                      value={formData.data_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TV Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="tv_points"
                      value={formData.tv_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telephone Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="telephone_points"
                      value={formData.telephone_points}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Conduit Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Conduit Specifications (meters)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1 inch Conduit Length (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="conduit_length_1_inch"
                      value={formData.conduit_length_1_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      3/4 inch Conduit Length (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="conduit_length_3_4_inch"
                      value={formData.conduit_length_3_4_inch}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Wire Specifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Wire Specifications (meters)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1.5 sq.mm Wire (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="wire_length_1_5_sqmm"
                      value={formData.wire_length_1_5_sqmm}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      2.5 sq.mm Wire (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="wire_length_2_5_sqmm"
                      value={formData.wire_length_2_5_sqmm}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      4 sq.mm Wire (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="wire_length_4_sqmm"
                      value={formData.wire_length_4_sqmm}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Circuit Protection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Circuit Protection</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MCB Required (count)
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="mcb_required"
                      value={formData.mcb_required}
                      onChange={onInputChange}
                      disabled={viewMode}
                      placeholder="Number of circuit breakers"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="flex items-center pt-7">
                    <input
                      type="checkbox"
                      name="db_required"
                      checked={formData.db_required}
                      onChange={onInputChange}
                      disabled={viewMode}
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Distribution Board (DB) Required
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  <Zap className="-ml-1 mr-2 h-4 w-4" />
                  {editMode ? 'Update Electrical' : 'Add Electrical'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ElectricalMeasurementDialog;
