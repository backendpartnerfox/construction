import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MeetingFormDialog = ({ 
  open, 
  onClose, 
  editMode, 
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {editMode ? 'Edit Meeting' : 'Schedule New Meeting'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {editMode ? 'Update meeting information' : 'Add a new meeting to the project'}
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
                    {/* Meeting Details Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Meeting Details</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Type of Meeting */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Type of Meeting <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="type_of_meeting"
                            required
                            value={formData.type_of_meeting}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          >
                            <option value="">-- Select Type --</option>
                            <option value="Site Visit">Site Visit</option>
                            <option value="Client Meeting">Client Meeting</option>
                            <option value="Team Meeting">Team Meeting</option>
                            <option value="Review Meeting">Review Meeting</option>
                            <option value="Progress Meeting">Progress Meeting</option>
                            <option value="Planning Meeting">Planning Meeting</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Date & Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Date & Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="date"
                            required
                            value={formData.date}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Location */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="location"
                            required
                            value={formData.location}
                            onChange={onInputChange}
                            placeholder="e.g., Project Site, Office, Online"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Created By */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Created By
                          </label>
                          <input
                            type="text"
                            name="created_by"
                            value={formData.created_by}
                            onChange={onInputChange}
                            placeholder="Your name"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Meeting ID */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meeting ID/Code
                          </label>
                          <input
                            type="text"
                            name="meeting_id"
                            value={formData.meeting_id}
                            onChange={onInputChange}
                            placeholder="Optional meeting identifier"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Participants Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Participants</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Source */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meeting Called By (Source)
                          </label>
                          <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={onInputChange}
                            placeholder="e.g., Project Manager, Client"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Target */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meeting With (Target)
                          </label>
                          <input
                            type="text"
                            name="target"
                            value={formData.target}
                            onChange={onInputChange}
                            placeholder="e.g., Team, Architect, Client"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* To Be Included */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Attendees / To Be Included
                          </label>
                          <textarea
                            name="to_be_included"
                            rows="3"
                            value={formData.to_be_included}
                            onChange={onInputChange}
                            placeholder="List all participants who should attend this meeting..."
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                      </div>
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
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        <span className="mr-2">💾</span>
                        {editMode ? 'Update Meeting' : 'Schedule Meeting'}
                      </button>
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

export default MeetingFormDialog;
