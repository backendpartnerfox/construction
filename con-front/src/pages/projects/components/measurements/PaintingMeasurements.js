import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Eye,
  PaintBucket,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import PaintingMeasurementDialog from './PaintingMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const PaintingMeasurements = ({ projectId }) => {
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
    surface_description: '',
    surface_type: '',
    length: '',
    height: '',
    door_window_area: 0,
    surface_preparation: '',
    primer_coats: 1,
    putty_coats: 2,
    paint_coats: 2,
    paint_finish: '',
    paint_brand_choice_id: null,
    paint_color: '',
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
      console.log('🖌️ Loading painting measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_measurements_painting/project/${projectId}`);
      console.log('Painting measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Painting measurements loaded:', measurementsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading painting measurements:', error);
      toast.error('Error loading painting measurements');
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
        surface_description: measurement.surface_description || '',
        surface_type: measurement.surface_type || '',
        length: measurement.length || '',
        height: measurement.height || '',
        door_window_area: measurement.door_window_area || 0,
        surface_preparation: measurement.surface_preparation || '',
        primer_coats: measurement.primer_coats || 1,
        putty_coats: measurement.putty_coats || 2,
        paint_coats: measurement.paint_coats || 2,
        paint_finish: measurement.paint_finish || '',
        paint_brand_choice_id: measurement.paint_brand_choice_id || null,
        paint_color: measurement.paint_color || '',
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
        surface_description: '',
        surface_type: '',
        length: '',
        height: '',
        door_window_area: 0,
        surface_preparation: '',
        primer_coats: 1,
        putty_coats: 2,
        paint_coats: 2,
        paint_finish: '',
        paint_brand_choice_id: null,
        paint_color: '',
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
        height: formData.height ? parseFloat(formData.height) : null,
        door_window_area: parseFloat(formData.door_window_area) || 0,
        primer_coats: parseInt(formData.primer_coats) || 1,
        putty_coats: parseInt(formData.putty_coats) || 2,
        paint_coats: parseInt(formData.paint_coats) || 2,
        paint_brand_choice_id: formData.paint_brand_choice_id ? parseInt(formData.paint_brand_choice_id) : null,
        recorded_by: parseInt(formData.recorded_by),
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_painting/${currentMeasurement.measurement_id}`, submitData);
        toast.success('Painting measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_measurements_painting`, submitData);
        toast.success('Painting measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving painting measurement');
      console.error('Error saving painting measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this painting measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_measurements_painting/${measurementId}`);
        toast.success('Painting measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting painting measurement');
        console.error('Error deleting painting measurement:', error);
      }
    }
  };

  const handleVerify = async (measurementId) => {
    if (window.confirm('Are you sure you want to verify this measurement? This will make it available for BOQ generation.')) {
      try {
        await axios.patch(`${API_BASE_URL}/api/architect_measurements_painting/${measurementId}/verify`, {
          verified_by: 1, // Should get from logged in user
          verified_at: new Date().toISOString()
        });
        toast.success('Painting measurement verified successfully');
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
        await axios.patch(`${API_BASE_URL}/api/architect_measurements_painting/project/${projectId}/verify-all`, {
          verified_by: 1 // Should get from logged in user
        });
        toast.success(`${draftMeasurements.length} painting measurements verified successfully`);
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
          <h4 className="text-base font-semibold text-gray-900">Painting Measurements</h4>
          <p className="text-sm text-gray-500">
            Record painting areas, coats, and color specifications
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
            Add Painting
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
          <PaintBucket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No painting measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first painting measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Painting
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Room</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Surface</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Net Area</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Coats</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Finish</th>
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
                      <PaintBucket className="h-4 w-4 text-pink-500 mr-2" />
                      {measurement.room || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.surface_description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.surface_type || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.length || 0} × {measurement.height || 0} ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-pink-600">
                    {measurement.net_area ? parseFloat(measurement.net_area).toFixed(2) : '0.00'} sq ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.paint_coats || 2}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.paint_finish || '-'}
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

      {/* Painting Measurement Form Dialog */}
      <PaintingMeasurementDialog
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

export default PaintingMeasurements;
