import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { requirementsApi, clientsApi } from '../../../services/clientsApi';

const RequirementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    requirement_title: '',
    requirement_description: '',
    project_title: '',
    project_type: 'Residential',
    construction_type: 'New Construction',
    site_area: '',
    built_up_area: '',
    carpet_area: '',
    number_of_floors: '',
    number_of_bedrooms: '',
    number_of_bathrooms: '',
    number_of_kitchens: 1,
    stilt_required: false,
    stilt_area: '',
    balcony_area: '',
    terrace_area: '',
    site_level: '',
    ground_floor_ffl: '',
    typical_floor_height: 3.0,
    sump_capacity_liters: '',
    overhead_tank_capacity_liters: '',
    foundation_type: '',
    wall_type: '',
    roofing_type: '',
    flooring_type: '',
    paint_type: '',
    kitchen_type: '',
    bathroom_fittings: '',
    has_swimming_pool: false,
    has_garden_landscaping: false,
    has_solar_panels: false,
    has_elevator: false,
    quality_level: 'Standard',
    package_type: 'Standard Package',
    approved_budget: '',
    project_start_date: '',
    expected_completion_date: '',
    status: 'Draft'
  });

  useEffect(() => {
    loadClients();
    if (id) {
      loadRequirement();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const response = await clientsApi.getAll();
      setClients(response.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadRequirement = async () => {
    try {
      const response = await requirementsApi.getById(id);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading requirement:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await requirementsApi.update(id, formData);
      } else {
        await requirementsApi.create(formData);
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving requirement:', error);
      alert('Failed to save requirement');
    } finally {
      setLoading(false);
    }
  };

  const FormSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, name, type = 'text', required = false, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        {...props}
      />
    </div>
  );

  const SelectField = ({ label, name, options, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const CheckboxField = ({ label, name }) => (
    <div className="flex items-center">
      <input
        type="checkbox"
        name={name}
        checked={formData[name] || false}
        onChange={handleChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
      />
      <label className="ml-2 block text-sm text-gray-700">{label}</label>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Requirement' : 'New Requirement'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {/* Basic Information */}
        <FormSection title="Basic Information">
          <SelectField
            label="Client"
            name="client_id"
            required
            options={clients.map(c => ({
              value: c.client_id,
              label: c.client_name
            }))}
          />
          <InputField label="Requirement Title" name="requirement_title" required />
          <SelectField
            label="Project Type"
            name="project_type"
            options={[
              { value: 'Residential', label: 'Residential' },
              { value: 'Commercial', label: 'Commercial' },
              { value: 'Industrial', label: 'Industrial' },
              { value: 'Mixed Use', label: 'Mixed Use' }
            ]}
          />
          <SelectField
            label="Construction Type"
            name="construction_type"
            options={[
              { value: 'New Construction', label: 'New Construction' },
              { value: 'Renovation', label: 'Renovation' },
              { value: 'Extension', label: 'Extension' }
            ]}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="requirement_description"
              value={formData.requirement_description || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </FormSection>

        {/* Area Specifications */}
        <FormSection title="Area Specifications">
          <InputField label="Site Area (sq ft)" name="site_area" type="number" />
          <InputField label="Built-up Area (sq ft)" name="built_up_area" type="number" />
          <InputField label="Carpet Area (sq ft)" name="carpet_area" type="number" />
          <InputField label="Balcony Area (sq ft)" name="balcony_area" type="number" />
          <InputField label="Terrace Area (sq ft)" name="terrace_area" type="number" />
          <InputField label="Number of Floors" name="number_of_floors" type="number" />
        </FormSection>

        {/* Room Configuration */}
        <FormSection title="Room Configuration">
          <InputField label="Bedrooms" name="number_of_bedrooms" type="number" />
          <InputField label="Bathrooms" name="number_of_bathrooms" type="number" />
          <InputField label="Kitchens" name="number_of_kitchens" type="number" />
        </FormSection>

        {/* Special Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CheckboxField label="Stilt Required" name="stilt_required" />
            <CheckboxField label="Swimming Pool" name="has_swimming_pool" />
            <CheckboxField label="Garden/Landscaping" name="has_garden_landscaping" />
            <CheckboxField label="Solar Panels" name="has_solar_panels" />
            <CheckboxField label="Elevator" name="has_elevator" />
          </div>
        </div>

        {/* Budget & Timeline */}
        <FormSection title="Budget & Timeline">
          <InputField label="Approved Budget" name="approved_budget" type="number" />
          <InputField label="Project Start Date" name="project_start_date" type="date" />
          <InputField label="Expected Completion" name="expected_completion_date" type="date" />
          <SelectField
            label="Quality Level"
            name="quality_level"
            options={[
              { value: 'Basic', label: 'Basic' },
              { value: 'Standard', label: 'Standard' },
              { value: 'Premium', label: 'Premium' },
              { value: 'Luxury', label: 'Luxury' }
            ]}
          />
          <SelectField
            label="Status"
            name="status"
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Under_Review', label: 'Under Review' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Locked', label: 'Locked' }
            ]}
          />
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : 'Save Requirement'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequirementForm;
