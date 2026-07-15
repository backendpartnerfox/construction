import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProjectFormDialog = ({ 
  open, 
  onClose, 
  editMode, 
  formData, 
  onInputChange, 
  onSubmit,
  clients,
  employees,
  loadingDropdowns 
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
                        <span className="text-xl">📊</span>
                      </div>
                      <div className="ml-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {editMode ? 'Edit Project' : 'New Project'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500">
                          {editMode ? 'Update project information' : 'Add a new project to the database'}
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

                {/* Loading Banner */}
                {loadingDropdowns && (
                  <div className="border-b border-blue-200 bg-blue-50 px-6 py-3">
                    <div className="flex items-center text-sm text-blue-700">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"></div>
                      Loading clients and employees...
                    </div>
                  </div>
                )}

                {/* Form Content */}
                <form onSubmit={onSubmit}>
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-6">
                    {/* Basic Information Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Project Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Project Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="project_name"
                            required
                            value={formData.project_name}
                            onChange={onInputChange}
                            placeholder="Enter project name"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Client Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Client <span className="text-red-500">*</span>
                            {Array.isArray(clients) && clients.length > 0 && (
                              <span className="ml-1 text-xs text-gray-500">({clients.length} available)</span>
                            )}
                          </label>
                          <select
                            name="client_id"
                            required
                            value={formData.client_id}
                            onChange={onInputChange}
                            disabled={loadingDropdowns}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">-- Select Client --</option>
                            {Array.isArray(clients) && clients.map(client => (
                              <option key={client.client_id} value={client.client_id}>
                                {client.client_name}{client.city ? ` - ${client.city}` : ''}
                              </option>
                            ))}
                          </select>
                          {(!Array.isArray(clients) || clients.length === 0) && !loadingDropdowns && (
                            <p className="mt-1 text-xs text-red-600">⚠️ No clients available</p>
                          )}
                        </div>

                        {/* Project Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Project Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="project_type"
                            required
                            value={formData.project_type}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Mixed Use">Mixed Use</option>
                          </select>
                        </div>

                        {/* Project Manager */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Project Manager
                            {Array.isArray(employees) && employees.length > 0 && (
                              <span className="ml-1 text-xs text-gray-500">({employees.length} available)</span>
                            )}
                          </label>
                          <select
                            name="project_manager_id"
                            value={formData.project_manager_id}
                            onChange={onInputChange}
                            disabled={loadingDropdowns}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">-- Select Manager --</option>
                            {Array.isArray(employees) && employees.map(emp => (
                              <option key={emp.employee_id} value={emp.employee_id}>
                                {emp.first_name} {emp.last_name}{emp.designation ? ` (${emp.designation})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Architect */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Architect</label>
                          <select
                            name="architect_id"
                            value={formData.architect_id}
                            onChange={onInputChange}
                            disabled={loadingDropdowns}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 sm:text-sm"
                          >
                            <option value="">-- Select Architect --</option>
                            {Array.isArray(employees) && employees.map(emp => (
                              <option key={emp.employee_id} value={emp.employee_id}>
                                {emp.first_name} {emp.last_name}{emp.designation ? ` (${emp.designation})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location Information Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Location Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="location"
                            required
                            value={formData.location}
                            onChange={onInputChange}
                            placeholder="Enter location (city/area)"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Site Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Site Address</label>
                          <textarea
                            name="site_address"
                            rows="2"
                            value={formData.site_address}
                            onChange={onInputChange}
                            placeholder="Enter complete site address"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Timeline</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Start Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="start_date"
                            required
                            value={formData.start_date}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Estimated End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="estimated_end_date"
                            required
                            value={formData.estimated_end_date}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Project Details Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Project Details</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Budget */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Estimated Budget (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="estimated_budget"
                            required
                            value={formData.estimated_budget}
                            onChange={onInputChange}
                            placeholder="Enter budget amount"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Total Area */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Total Area (sqft) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="total_area"
                            required
                            value={formData.total_area}
                            onChange={onInputChange}
                            placeholder="Enter area in sqft"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Number of Floors */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Number of Floors</label>
                          <input
                            type="number"
                            name="number_of_floors"
                            value={formData.number_of_floors}
                            onChange={onInputChange}
                            placeholder="Enter number of floors"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <select
                            name="priority"
                            value={formData.priority}
                            onChange={onInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          >
                            <option value="1">High</option>
                            <option value="2">Medium</option>
                            <option value="3">Low</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Additional Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={onInputChange}
                            placeholder="Enter project description"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
                          <textarea
                            name="notes"
                            rows="2"
                            value={formData.notes}
                            onChange={onInputChange}
                            placeholder="Enter any additional notes"
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
                        disabled={loadingDropdowns}
                        className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="mr-2">💾</span>
                        {editMode ? 'Update Project' : 'Create Project'}
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

export default ProjectFormDialog;
