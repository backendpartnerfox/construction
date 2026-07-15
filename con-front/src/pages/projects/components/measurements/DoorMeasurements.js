import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Eye,
  DoorOpen,
} from 'lucide-react';
import DoorMeasurementDialog from './DoorMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const DoorMeasurements = ({ projectId }) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [formData, setFormData] = useState({
    project_id: projectId,
    component_id: 1, // Default component
    component_element_id: null,
    floor_id: 1, // Default floor
    room: '',
    door_location: '',
    wall_direction: '',
    door_width: '',
    door_height: '',
    door_thickness: '',
    frame_width: '',
    frame_thickness: '',
    door_type: '',
    door_material: '',
    door_style: '',
    quantity: 1,
    door_choice_id: null,
    requires_client_selection: true,
    recorded_by: 1,
    status: 'Draft',
    wall_measurement_id: null,
    wall_code: '',
  });

  useEffect(() => {
    if (projectId) {
      loadMeasurements();
    }
  }, [projectId]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      console.log('🚪 Loading door measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_measurements_doors/project/${projectId}`);
      console.log('Door measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Door measurements loaded:', measurementsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading door measurements:', error);
      toast.error('Error loading door measurements');
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
        door_location: measurement.door_location || '',
        wall_direction: measurement.wall_direction || '',
        door_width: measurement.door_width || '',
        door_height: measurement.door_height || '',
        door_thickness: measurement.door_thickness || '',
        frame_width: measurement.frame_width || '',
        frame_thickness: measurement.frame_thickness || '',
        door_type: measurement.door_type || '',
        door_material: measurement.door_material || '',
        door_style: measurement.door_style || '',
        quantity: measurement.quantity || 1,
        door_choice_id: measurement.door_choice_id || null,
        requires_client_selection: measurement.requires_client_selection !== false,
        recorded_by: measurement.recorded_by || 1,
        status: measurement.status || 'Draft',
        wall_measurement_id: measurement.wall_measurement_id || null,
        wall_code: measurement.wall_code || '',
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
        door_location: '',
        wall_direction: '',
        door_width: '',
        door_height: '',
        door_thickness: '',
        frame_width: '',
        frame_thickness: '',
        door_type: '',
        door_material: '',
        door_style: '',
        quantity: 1,
        door_choice_id: null,
        requires_client_selection: true,
        recorded_by: 1,
        status: 'Draft',
        wall_measurement_id: null,
        wall_code: '',
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
        door_width: formData.door_width ? parseFloat(formData.door_width) : null,
        door_height: formData.door_height ? parseFloat(formData.door_height) : null,
        door_thickness: formData.door_thickness ? parseFloat(formData.door_thickness) : null,
        frame_width: formData.frame_width ? parseFloat(formData.frame_width) : null,
        frame_thickness: formData.frame_thickness ? parseFloat(formData.frame_thickness) : null,
        quantity: parseInt(formData.quantity) || 1,
        door_choice_id: formData.door_choice_id ? parseInt(formData.door_choice_id) : null,
        recorded_by: parseInt(formData.recorded_by),
        wall_measurement_id: formData.wall_measurement_id ? parseInt(formData.wall_measurement_id) : null,
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_doors/${currentMeasurement.measurement_id}`, submitData);
        toast.success('Door measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_measurements_doors`, submitData);
        toast.success('Door measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving door measurement');
      console.error('Error saving door measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this door measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_measurements_doors/${measurementId}`);
        toast.success('Door measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting door measurement');
        console.error('Error deleting door measurement:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Door Measurements</h4>
          <p className="text-sm text-gray-500">
            Record door dimensions, types, and materials for accurate estimation
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Door
        </button>
      </div>

      {/* Measurements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : measurements.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <DoorOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No door measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first door measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Door
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Room</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Material</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions (W×H)</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Qty</th>
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
                      <DoorOpen className="h-4 w-4 text-gray-400 mr-2" />
                      {measurement.door_location || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.room || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.door_type || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.door_material || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.door_width || 0} × {measurement.door_height || 0} ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.quantity || 1}
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

      {/* Door Measurement Form Dialog */}
      <DoorMeasurementDialog
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

export default DoorMeasurements;
