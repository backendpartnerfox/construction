import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Eye,
  Square,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import WindowMeasurementDialog from './WindowMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const WindowMeasurements = ({ projectId }) => {
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
    window_location: '',
    wall_direction: '',
    sill_level: '',
    window_width: '',
    window_height: '',
    window_thickness: '',
    window_type: '',
    frame_material: '',
    glass_type: '',
    opening_style: '',
    has_grills: false,
    grill_material: '',
    grill_design: '',
    quantity: 1,
    window_choice_id: null,
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
      console.log('🪟 Loading window measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_measurements_windows/project/${projectId}`);
      console.log('Window measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Window measurements loaded:', measurementsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading window measurements:', error);
      toast.error('Error loading window measurements');
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
        window_location: measurement.window_location || '',
        wall_direction: measurement.wall_direction || '',
        sill_level: measurement.sill_level || '',
        window_width: measurement.window_width || '',
        window_height: measurement.window_height || '',
        window_thickness: measurement.window_thickness || '',
        window_type: measurement.window_type || '',
        frame_material: measurement.frame_material || '',
        glass_type: measurement.glass_type || '',
        opening_style: measurement.opening_style || '',
        has_grills: measurement.has_grills || false,
        grill_material: measurement.grill_material || '',
        grill_design: measurement.grill_design || '',
        quantity: measurement.quantity || 1,
        window_choice_id: measurement.window_choice_id || null,
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
        window_location: '',
        wall_direction: '',
        sill_level: '',
        window_width: '',
        window_height: '',
        window_thickness: '',
        window_type: '',
        frame_material: '',
        glass_type: '',
        opening_style: '',
        has_grills: false,
        grill_material: '',
        grill_design: '',
        quantity: 1,
        window_choice_id: null,
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
        sill_level: formData.sill_level ? parseFloat(formData.sill_level) : null,
        window_width: formData.window_width ? parseFloat(formData.window_width) : null,
        window_height: formData.window_height ? parseFloat(formData.window_height) : null,
        window_thickness: formData.window_thickness ? parseFloat(formData.window_thickness) : null,
        quantity: parseInt(formData.quantity) || 1,
        window_choice_id: formData.window_choice_id ? parseInt(formData.window_choice_id) : null,
        recorded_by: parseInt(formData.recorded_by),
        wall_measurement_id: formData.wall_measurement_id ? parseInt(formData.wall_measurement_id) : null,
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_windows/${currentMeasurement.measurement_id}`, submitData);
        toast.success('Window measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_measurements_windows`, submitData);
        toast.success('Window measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving window measurement');
      console.error('Error saving window measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this window measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_measurements_windows/${measurementId}`);
        toast.success('Window measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting window measurement');
        console.error('Error deleting window measurement:', error);
      }
    }
  };

  const handleVerify = async (measurementId) => {
    if (window.confirm('Are you sure you want to verify this measurement? This will make it available for BOQ generation.')) {
      try {
        await axios.patch(`${API_BASE_URL}/api/architect_measurements_windows/${measurementId}/verify`, {
          verified_by: 1, // Should get from logged in user
          verified_at: new Date().toISOString()
        });
        toast.success('Window measurement verified successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error verifying measurement');
        console.error('Error verifying measurement:', error);
      }
    }
  };

  const handleBulkVerify = async () => {
    const draftMeasurements = measurements.filter(m => m.status === 'Draft');
    if (draftMeasurements.length === 0) {
      toast.info('No draft measurements to verify');
      return;
    }

    if (window.confirm(`Are you sure you want to verify ${draftMeasurements.length} draft measurements? This will make them available for BOQ generation.`)) {
      try {
        await axios.patch(`${API_BASE_URL}/api/architect_measurements_windows/project/${projectId}/verify-all`, {
          verified_by: 1 // Should get from logged in user
        });
        toast.success(`${draftMeasurements.length} window measurements verified successfully`);
        loadMeasurements();
      } catch (error) {
        toast.error('Error verifying measurements');
        console.error('Error verifying measurements:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Window Measurements</h4>
          <p className="text-sm text-gray-500">
            Record window dimensions, types, and glass specifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {measurements.filter(m => m.status === 'Draft').length > 0 && (
            <button
              onClick={handleBulkVerify}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
              Verify All ({measurements.filter(m => m.status === 'Draft').length})
            </button>
          )}
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Window
          </button>
        </div>
      </div>

      {/* Measurements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : measurements.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Square className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No window measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first window measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Window
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
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Glass</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions (W×H)</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Qty</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
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
                      <Square className="h-4 w-4 text-gray-400 mr-2" />
                      {measurement.window_location || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.room || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.window_type || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.glass_type || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.window_width || 0} × {measurement.window_height || 0} ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.quantity || 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(measurement.status)}`}>
                      {getStatusIcon(measurement.status)}
                      {measurement.status}
                    </span>
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
                      {measurement.status === 'Draft' && (
                        <button
                          onClick={() => handleVerify(measurement.measurement_id)}
                          className="text-green-600 hover:text-green-900"
                          title="Verify"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
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

      {/* Window Measurement Form Dialog */}
      <WindowMeasurementDialog
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

export default WindowMeasurements;
