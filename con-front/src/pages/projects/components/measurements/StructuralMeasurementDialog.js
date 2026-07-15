import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const StructuralMeasurementDialog = ({ 
  open, 
  onClose, 
  editMode,
  viewMode,
  formData, 
  elements,
  onInputChange, 
  onSubmit
}) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-xl">🏗️</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {viewMode ? 'View Measurement' : editMode ? 'Edit Measurement' : 'Add Structural Measurement'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {viewMode ? 'View measurement details' : editMode ? 'Update measurement information' : 'Record a new structural measurement'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={onSubmit}>
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-6">
                    
                    {/* Basic Information */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Element Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Element Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="element_id"
                            required
                            value={formData.element_id}
                            onChange={onInputChange}
                            disabled={viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">Select Element</option>
                            {elements.map((element) => (
                              <option key={element.element_id} value={element.element_id}>
                                {element.element_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Floor */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Floor
                          </label>
                          <input
                            type="text"
                            name="floor"
                            value={formData.floor}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., Ground Floor, First Floor"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        {/* Component */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Component/Location
                          </label>
                          <input
                            type="text"
                            name="component"
                            value={formData.component}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., C1, B1, Main Beam"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Dimensions (in meters)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Length</label>
                          <input
                            type="number"
                            step="0.01"
                            name="length"
                            value={formData.length}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Width</label>
                          <input
                            type="number"
                            step="0.01"
                            name="width"
                            value={formData.width}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Height</label>
                          <input
                            type="number"
                            step="0.01"
                            name="height"
                            value={formData.height}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Depth</label>
                          <input
                            type="number"
                            step="0.01"
                            name="depth"
                            value={formData.depth}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Slab Details (if applicable) */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Slab Details (if applicable)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Slab Thickness (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="slab_thickness"
                            value={formData.slab_thickness}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Slab Type</label>
                          <select
                            name="slab_type"
                            value={formData.slab_type}
                            onChange={onInputChange}
                            disabled={viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">Select Type</option>
                            <option value="Solid">Solid Slab</option>
                            <option value="Ribbed">Ribbed Slab</option>
                            <option value="Waffle">Waffle Slab</option>
                            <option value="Flat">Flat Slab</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Steel Reinforcement */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Steel Reinforcement (TMT Bars)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Main Bar Dia (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="tmt_main_bar_dia"
                            value={formData.tmt_main_bar_dia}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Distribution Bar Dia (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="tmt_distribution_bar_dia"
                            value={formData.tmt_distribution_bar_dia}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Qty Main Bars</label>
                          <input
                            type="number"
                            name="qty_main_bars"
                            value={formData.qty_main_bars}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Qty Distribution Bars</label>
                          <input
                            type="number"
                            name="qty_distribution_bars"
                            value={formData.qty_distribution_bars}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stirrups & Cover */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Stirrups & Concrete Cover</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Stirrup Dia (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="stirrup_dia"
                            value={formData.stirrup_dia}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Stirrup Spacing (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="stirrup_spacing"
                            value={formData.stirrup_spacing}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Concrete Cover (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="concrete_cover"
                            value={formData.concrete_cover}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Concrete Details */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Concrete Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">RMC Grade</label>
                          <select
                            name="rmc_grade"
                            value={formData.rmc_grade}
                            onChange={onInputChange}
                            disabled={viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">Select Grade</option>
                            <option value="M15">M15</option>
                            <option value="M20">M20</option>
                            <option value="M25">M25</option>
                            <option value="M30">M30</option>
                            <option value="M35">M35</option>
                            <option value="M40">M40</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reinforcement Type</label>
                          <input
                            type="text"
                            name="reinforcement_type"
                            value={formData.reinforcement_type}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., HYSD Bars"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Concrete Mix Ratio</label>
                          <input
                            type="text"
                            name="concrete_mix_ratio"
                            value={formData.concrete_mix_ratio}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., 1:1.5:3"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Information Box */}
                    {!viewMode && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-900">📏 Measurement Tips:</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Enter all dimensions in meters (m) unless specified</li>
                          <li>• Steel bar diameters and cover in millimeters (mm)</li>
                          <li>• Select appropriate element type for accurate BOQ generation</li>
                          <li>• Add floor and component details for easy identification</li>
                          <li>• All measurements will be used for material calculations</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-end space-x-3">
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
                          className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                          <span className="mr-2">💾</span>
                          {editMode ? 'Update Measurement' : 'Save Measurement'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StructuralMeasurementDialog;
