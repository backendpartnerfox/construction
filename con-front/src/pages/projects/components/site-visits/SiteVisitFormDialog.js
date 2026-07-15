import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SiteVisitFormDialog = ({ 
  open, 
  onClose, 
  editMode,
  viewMode,
  formData, 
  onInputChange, 
  onSubmit,
  moms,
  loadingMOMs
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-xl">🏗️</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {viewMode ? 'View Site Visit' : editMode ? 'Edit Site Visit' : 'Record Site Visit'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {viewMode ? 'View site visit details' : editMode ? 'Update site visit information' : 'Record a new site visit'}
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
                    {/* Site Visit Information Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Site Visit Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Related MOM */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Related MOM (Optional)
                          </label>
                          <select
                            name="mom_id"
                            value={formData.mom_id}
                            onChange={onInputChange}
                            disabled={loadingMOMs || viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">-- No MOM / Select MOM --</option>
                            {moms.map(mom => (
                              <option key={mom.mom_id} value={mom.mom_id}>
                                {mom.type_of_meeting || 'Meeting'} - {new Date(mom.meeting_date).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                          {loadingMOMs && (
                            <p className="mt-1 text-xs text-gray-500">Loading MOMs...</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Link this site visit to a Minutes of Meeting if applicable
                          </p>
                        </div>

                        {/* Created By */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Visited By / Created By <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="created_by"
                            required
                            value={formData.created_by}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="e.g., Project Manager, Site Engineer, Architect"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Name of the person who conducted this site visit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Information Box */}
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="text-sm font-medium text-blue-900">📌 About Site Visits:</h4>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        <li>• Site visits help track project progress</li>
                        <li>• Link to MOM if this visit was part of a meeting</li>
                        <li>• Record who conducted the visit</li>
                        <li>• Multiple visits can be recorded for a project</li>
                        <li>• Useful for tracking project timeline</li>
                      </ul>
                    </div>
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
                          {editMode ? 'Update Site Visit' : 'Record Site Visit'}
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

export default SiteVisitFormDialog;
