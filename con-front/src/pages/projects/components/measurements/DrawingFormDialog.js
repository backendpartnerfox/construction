import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DrawingFormDialog = ({ 
  open, 
  onClose, 
  editMode,
  viewMode,
  formData, 
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-xl">📐</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {viewMode ? 'View Drawing' : editMode ? 'Edit Drawing' : 'Upload Drawing'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {viewMode ? 'View drawing details' : editMode ? 'Update drawing information' : 'Upload a new architectural drawing'}
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
                    {/* Drawing Information Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Drawing Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Drawing Document/File Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Drawing Document/File Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="upload_architect_documents"
                            required
                            value={formData.upload_architect_documents}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., floor_plan_ground_floor.pdf, site_layout.dwg"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter the file name or path to the drawing document
                          </p>
                        </div>

                        {/* Architect ID (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Architect ID (Optional)
                          </label>
                          <input
                            type="number"
                            name="architect_id"
                            value={formData.architect_id || ''}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., 1"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Optional: Assign this drawing to a specific architect
                          </p>
                        </div>

                        {/* Client ID (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Client ID (Optional)
                          </label>
                          <input
                            type="number"
                            name="client_id"
                            value={formData.client_id || ''}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., 1"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Optional: Associate this drawing with a specific client
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Information Box */}
                    {!viewMode && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-900">📌 About Drawings:</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Upload architectural drawings for this project</li>
                          <li>• Supported formats: PDF, DWG, DXF, JPG, PNG</li>
                          <li>• Keep file names descriptive</li>
                          <li>• Drawings can be updated or deleted later</li>
                          <li>• Link to architect and client if needed</li>
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
                          {editMode ? 'Update Drawing' : 'Upload Drawing'}
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

export default DrawingFormDialog;
