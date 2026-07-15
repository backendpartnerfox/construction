import React, { useState, useEffect } from 'react';
import { X, Users, User, UserCheck, AlertCircle } from 'lucide-react';
import { enquiriesAPI, employeesAPI } from '../../../services/api';

const ConvertToLeadModal = ({ isOpen, onClose, onSubmit, enquiry }) => {
  const [formData, setFormData] = useState({
    assigned_sales_person: '',
    assigned_architect: null,
    assigned_engineer: null,
    converted_by: '' // Changed from 1 to empty string
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      assigned_sales_person: '',
      assigned_architect: null,
      assigned_engineer: null,
      converted_by: '' // Reset to empty
    });
    setErrors({});
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll();
      
      let employeeData = [];
      if (response && response.success && response.data) {
        employeeData = response.data;
      } else if (response && Array.isArray(response)) {
        employeeData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        employeeData = response.data;
      }
      
      // Filter active employees
      const activeEmployees = employeeData.filter(emp => emp.status === 'Active');
      setEmployees(activeEmployees);
      
      // Auto-select first sales person as converted_by if available
      if (activeEmployees.length > 0) {
        setFormData(prev => ({
          ...prev,
          converted_by: activeEmployees[0].employee_id
        }));
      }
      
    } catch (error) {
      console.error('Error loading employees:', error);
      // Use fallback data for demo
      const fallbackEmployees = [
        { employee_id: 1, first_name: 'Rajesh', last_name: 'Kumar', designation: 'Project Manager', department: 'Projects', status: 'Active' },
        { employee_id: 2, first_name: 'Priya', last_name: 'Singh', designation: 'Site Engineer', department: 'Engineering', status: 'Active' },
        { employee_id: 3, first_name: 'Anand', last_name: 'Sharma', designation: 'Architect', department: 'Design', status: 'Active' }
      ];
      setEmployees(fallbackEmployees);
      
      // Set default converted_by to first employee
      setFormData(prev => ({
        ...prev,
        converted_by: fallbackEmployees[0].employee_id
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : parseInt(value)
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.assigned_sales_person) {
      newErrors.assigned_sales_person = 'Sales person is required';
    }
    
    if (!formData.converted_by) {
      newErrors.converted_by = 'Converted by is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      const conversionData = {
        assigned_sales_person: formData.assigned_sales_person,
        assigned_architect: formData.assigned_architect,
        assigned_engineer: formData.assigned_engineer,
        converted_by: formData.converted_by
      };
      
      console.log('Converting enquiry to lead:', { 
        enquiry_id: enquiry.enquiry_id, 
        ...conversionData 
      });
      
      const response = await enquiriesAPI.convertToLead(enquiry.enquiry_id, conversionData);
      
      console.log('Convert to lead response:', response);
      
      if (response && response.success) {
        alert(`Successfully converted enquiry to lead #${response.data.lead_number}`);
        
        // Reset form
        resetForm();
        
        // Call parent callbacks
        if (onSubmit) {
          onSubmit(response);
        }
        
        // Close modal
        onClose();
        
        // Optionally reload the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response.message || 'Conversion failed');
      }
      
    } catch (error) {
      console.error('Error converting to lead:', error);
      
      // More detailed error message
      let errorMessage = 'Error converting enquiry to lead';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeesByDepartment = (department) => {
    return employees.filter(emp => 
      emp.department?.toLowerCase().includes(department.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(department.toLowerCase())
    );
  };

  const salesPersons = getEmployeesByDepartment('sales').concat(getEmployeesByDepartment('project'));
  const architects = getEmployeesByDepartment('design').concat(getEmployeesByDepartment('architect'));
  const engineers = getEmployeesByDepartment('engineering').concat(getEmployeesByDepartment('engineer'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Convert to Lead</h3>
              <p className="text-sm text-gray-500">
                Convert enquiry #{enquiry?.enquiry_number || enquiry?.enquiry_id} to a qualified lead
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Enquiry Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Enquiry Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Client:</strong> {enquiry?.contact_person_name} {enquiry?.contact_surname || ''}</p>
            <p><strong>Phone:</strong> {enquiry?.primary_phone}</p>
            <p><strong>Project:</strong> {enquiry?.project_type} - {enquiry?.approximate_area} {enquiry?.area_unit}</p>
            <p><strong>Budget:</strong> {enquiry?.budget_range}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600">Loading employees...</span>
            </div>
          ) : (
            <>
              {/* Sales Person - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assigned_sales_person || ''}
                  onChange={(e) => handleInputChange('assigned_sales_person', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.assigned_sales_person ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  disabled={submitting}
                >
                  <option value="">Select a sales person</option>
                  {salesPersons.length > 0 ? (
                    salesPersons.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  )}
                </select>
                {errors.assigned_sales_person && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.assigned_sales_person}
                  </p>
                )}
              </div>

              {/* Architect - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Architect (Optional)
                </label>
                <select
                  value={formData.assigned_architect || ''}
                  onChange={(e) => handleInputChange('assigned_architect', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={submitting}
                >
                  <option value="">Select an architect</option>
                  {architects.length > 0 ? (
                    architects.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  ) : (
                    employees.filter(emp => 
                      emp.designation?.toLowerCase().includes('architect') || 
                      emp.department?.toLowerCase().includes('design')
                    ).map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Engineer - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engineer (Optional)
                </label>
                <select
                  value={formData.assigned_engineer || ''}
                  onChange={(e) => handleInputChange('assigned_engineer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={submitting}
                >
                  <option value="">Select an engineer</option>
                  {engineers.length > 0 ? (
                    engineers.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  ) : (
                    employees.filter(emp => 
                      emp.designation?.toLowerCase().includes('engineer') || 
                      emp.department?.toLowerCase().includes('engineering')
                    ).map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens when you convert?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>A new lead record will be created with all enquiry details</li>
                      <li>The assigned team will be notified</li>
                      <li>Package selections will be copied to the lead</li>
                      <li>Enquiry status will change to "Converted to Lead"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || !formData.assigned_sales_person || !formData.converted_by}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Convert to Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertToLeadModal;
