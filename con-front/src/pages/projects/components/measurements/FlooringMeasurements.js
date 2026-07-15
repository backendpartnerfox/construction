import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Eye,
  Layers,
} from 'lucide-react';
import FlooringMeasurementDialog from './FlooringMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const FlooringMeasurements = ({ projectId }) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [formData, setFormData] = useState({
    project_id: projectId,
    component_id: 1,
    component_element_id: null,
    floor_id: 1,
    room: '',
    area_description: '',
    length: '',
    width: '',
    flooring_type: '',
    base_preparation_required: true,
    base_thickness: '',
    skirting_required: true,
    skirting_height: '',
    skirting_length: '',
    tile_size: '',
    pattern_type: '',
    flooring_choice_id: null,
    skirting_choice_id: null,
    requires_client_selection: true,
    recorded_by: 1,
    status: 'Draft',
  });

  useEffect(() => {
    if (projectId) {
      loadMeasurements();
    }
  }, [projectId]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      console.log('🎨 Loading flooring measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_measurements_flooring/project/${projectId}`);
      console.log('Flooring measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Flooring measurements loaded:', measurementsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading flooring measurements:', error);
      toast.error('Error loading flooring measurements');
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (measurement = null, view = false) => {
    setViewMode(view);
    
    if (measurement) {
      setEditMode(true);
      setCurrentMeasurement(measurement);
      setFormData({
        project_id: projectId,
        component_id: measurement.component_id || 1,
        component_element_id: measurement.component_element_id || null,
        floor_id: measurement.floor_id || 1,
        room: measurement.room || '',
        area_description: measurement.area_description || '',
        length: measurement.length || '',
        width: measurement.width || '',
        flooring_type: measurement.flooring_type || '',
        base_preparation_required: measurement.base_preparation_required !== false,
        base_thickness: measurement.base_thickness || '',
        skirting_required: measurement.skirting_required !== false,
        skirting_height: measurement.skirting_height || '',
        skirting_length: measurement.skirting_length || '',
        tile_size: measurement.tile_size || '',
        pattern_type: measurement.pattern_type || '',
        flooring_choice_id: measurement.flooring_choice_id || null,
        skirting_choice_id: measurement.skirting_choice_id || null,
        requires_client_selection: measurement.requires_client_selection !== false,
        recorded_by: measurement.recorded_by || 1,
        status: measurement.status || 'Draft',
      });
    } else {
      setEditMode(false);
      setCurrentMeasurement(null);
      setFormData({
        project_id: projectId,
        component_id: 1,
        component_element_id: null,
        floor_id: 1,
        room: '',
        area_description: '',
        length: '',
        width: '',
        flooring_type: '',
        base_preparation_required: true,
        base_thickness: '',
        skirting_required: true,
        skirting_height: '',
        skirting_length: '',
        tile_size: '',
        pattern_type: '',
        flooring_choice_id: null,
        skirting_choice_id: null,
        requires_client_selection: true,
        recorded_by: 1,
        status: 'Draft',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentMeasurement(null);
    setViewMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        project_id: parseInt(projectId),
        component_id: parseInt(formData.component_id),
        component_element_id: formData.component_element_id ? parseInt(formData.component_element_id) : null,
        floor_id: parseInt(formData.floor_id),
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        base_thickness: formData.base_thickness ? parseFloat(formData.base_thickness) : null,
        skirting_height: formData.skirting_height ? parseFloat(formData.skirting_height) : null,
        skirting_length: formData.skirting_length ? parseFloat(formData.skirting_length) : null,
        flooring_choice_id: formData.flooring_choice_id ? parseInt(formData.flooring_choice_id) : null,
        skirting_choice_id: formData.skirting_choice_id ? parseInt(formData.skirting_choice_id) : null,
        recorded_by: parseInt(formData.recorded_by),
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_flooring/${currentMeasurement.measurement_id}`, submitData);
        toast.success('Flooring measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_measurements_flooring`, submitData);
        toast.success('Flooring measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving flooring measurement');
      console.error('Error saving flooring measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this flooring measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_measurements_flooring/${measurementId}`);
        toast.success('Flooring measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting flooring measurement');
        console.error('Error deleting flooring measurement:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Flooring Measurements</h4>
          <p className="text-sm text-gray-500">
            Record flooring types, dimensions, and skirting specifications
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Flooring
        </button>
      </div>

      {/* Measurements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : measurements.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No flooring measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first flooring measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Flooring
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Room</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Area (sq ft)</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Skirting</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {measurements.map((measurement) => (
                <tr key={measurement.measurement_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 text-purple-500 mr-2" />
                      {measurement.room || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.area_description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.flooring_type || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.length || 0} × {measurement.width || 0} ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-purple-600">
                    {measurement.area ? parseFloat(measurement.area).toFixed(2) : '0.00'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.skirting_required ? 'Yes' : 'No'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenDialog(measurement, true)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDialog(measurement, false)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(measurement.measurement_id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Flooring Measurement Form Dialog */}
      <FlooringMeasurementDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        viewMode={viewMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default FlooringMeasurements;
