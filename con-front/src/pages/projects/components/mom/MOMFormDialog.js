import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MOMFormDialog = ({ 
  open, 
  onClose, 
  editMode,
  viewMode,
  formData, 
  onInputChange, 
  onSubmit,
  meetings,
  loadingMeetings
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
                        <span className="text-xl">📝</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {viewMode ? 'View MOM' : editMode ? 'Edit Minutes of Meeting' : 'Create Minutes of Meeting'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {viewMode ? 'View meeting minutes details' : editMode ? 'Update meeting minutes' : 'Record minutes for a meeting'}
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
                    {/* Meeting Selection Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Meeting Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Meeting Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Select Meeting <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="meeting_id"
                            required
                            value={formData.meeting_id}
                            onChange={onInputChange}
                            disabled={loadingMeetings || viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">-- Select a Meeting --</option>
                            {meetings.map(meeting => (
                              <option key={meeting.id} value={meeting.id}>
                                {meeting.type_of_meeting || 'Meeting'} - {new Date(meeting.date).toLocaleDateString()} ({meeting.location})
                              </option>
                            ))}
                          </select>
                          {loadingMeetings && (
                            <p className="mt-1 text-xs text-gray-500">Loading meetings...</p>
                          )}
                          {!loadingMeetings && meetings.length === 0 && (
                            <p className="mt-1 text-xs text-red-600">⚠️ No meetings available. Please create a meeting first.</p>
                          )}
                        </div>

                        {/* MOM Status/Sending */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status / Sending To
                          </label>
                          <select
                            name="mom_sending"
                            value={formData.mom_sending}
                            onChange={onInputChange}
                            disabled={viewMode}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">Draft</option>
                            <option value="Sent to Team">Sent to Team</option>
                            <option value="Sent to Client">Sent to Client</option>
                            <option value="Sent to Management">Sent to Management</option>
                            <option value="Approved">Approved</option>
                            <option value="Finalized">Finalized</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Minutes Content Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Meeting Minutes</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Initial MOM / Minutes Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Minutes of Meeting <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="initial_mom"
                            required
                            rows="12"
                            value={formData.initial_mom}
                            onChange={onInputChange}
                            disabled={viewMode}
                            placeholder="Record the meeting minutes here...

Topics Discussed:
- 

Decisions Made:
- 

Action Items:
- 

Next Steps:
- 
"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm font-mono"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Record detailed meeting minutes including topics, decisions, and action items
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Helper Section */}
                    {!viewMode && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-900">💡 Tips for effective MOM:</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Be concise and clear</li>
                          <li>• List all attendees and their roles</li>
                          <li>• Document all decisions made</li>
                          <li>• Clearly state action items with responsible persons</li>
                          <li>• Include deadlines for action items</li>
                          <li>• Note any follow-up meetings needed</li>
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
                          disabled={loadingMeetings || meetings.length === 0}
                          className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="mr-2">💾</span>
                          {editMode ? 'Update MOM' : 'Create MOM'}
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

export default MOMFormDialog;
