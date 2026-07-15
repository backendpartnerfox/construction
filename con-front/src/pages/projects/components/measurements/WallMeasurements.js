import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Eye,
  Ruler,
  Home,
} from 'lucide-react';
import WallMeasurementDialog from './WallMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const WallMeasurements = ({ projectId }) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [formData, setFormData] = useState({
    project_id: projectId,
    floor: '',
    room: '',
    walltype: '',
    wall_direction: '',
    wall_thickness: '',
    brick_choice_id: '',
    width: '',
    height: '',
    total_wall_width: '',
    window_width: '',
    window_height: '',
    window2_width: '',
    window2_height: '',
    door_width: '',
    door_height: '',
    door2_width: '',
    door2_height: '',
    lintel_width: '',
    lintel_height: '',
    created_by: 1,
  });

  useEffect(() => {
    if (projectId) {
      loadMeasurements();
    }
  }, [projectId]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      console.log('🧱 Loading wall measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_walls_measurements/project/${projectId}`);
      console.log('Wall measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Wall measurements loaded:', measurementsData?.length || 0);
      
      // Debug first measurement
      if (measurementsData && measurementsData.length > 0) {
        console.log('🔍 Sample measurement:', measurementsData[0]);
      }
    } catch (error) {
      console.error('❌ Error loading wall measurements:', error);
      toast.error('Error loading wall measurements');
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
        floor: measurement.floor || '',
        room: measurement.room || '',
        walltype: measurement.walltype || '',
        wall_direction: measurement.wall_direction || '',
        wall_thickness: measurement.wall_thickness || '',
        brick_choice_id: measurement.brick_choice_id || '',
        width: measurement.width || '',
        height: measurement.height || '',
        total_wall_width: measurement.total_wall_width || '',
        window_width: measurement.window_width || '',
        window_height: measurement.window_height || '',
        window2_width: measurement.window2_width || '',
        window2_height: measurement.window2_height || '',
        door_width: measurement.door_width || '',
        door_height: measurement.door_height || '',
        door2_width: measurement.door2_width || '',
        door2_height: measurement.door2_height || '',
        lintel_width: measurement.lintel_width || '',
        lintel_height: measurement.lintel_height || '',
        created_by: measurement.created_by || 1,
      });
    } else {
      setEditMode(false);
      setCurrentMeasurement(null);
      setFormData({
        project_id: projectId,
        floor: '',
        room: '',
        walltype: '',
        wall_direction: '',
        wall_thickness: '',
        brick_choice_id: '',
        width: '',
        height: '',
        total_wall_width: '',
        window_width: '',
        window_height: '',
        window2_width: '',
        window2_height: '',
        door_width: '',
        door_height: '',
        door2_width: '',
        door2_height: '',
        lintel_width: '',
        lintel_height: '',
        created_by: 1,
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        project_id: parseInt(projectId),
        wall_thickness: formData.wall_thickness ? parseFloat(formData.wall_thickness) : null,
        brick_choice_id: formData.brick_choice_id ? parseInt(formData.brick_choice_id) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        total_wall_width: formData.total_wall_width ? parseFloat(formData.total_wall_width) : null,
        window_width: formData.window_width ? parseFloat(formData.window_width) : null,
        window_height: formData.window_height ? parseFloat(formData.window_height) : null,
        window2_width: formData.window2_width ? parseFloat(formData.window2_width) : null,
        window2_height: formData.window2_height ? parseFloat(formData.window2_height) : null,
        door_width: formData.door_width ? parseFloat(formData.door_width) : null,
        door_height: formData.door_height ? parseFloat(formData.door_height) : null,
        door2_width: formData.door2_width ? parseFloat(formData.door2_width) : null,
        door2_height: formData.door2_height ? parseFloat(formData.door2_height) : null,
        lintel_width: formData.lintel_width ? parseFloat(formData.lintel_width) : null,
        lintel_height: formData.lintel_height ? parseFloat(formData.lintel_height) : null,
        created_by: parseInt(formData.created_by)
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_walls_measurements/${currentMeasurement.measurement_id}`, submitData);
        toast.success('Wall measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_walls_measurements`, submitData);
        toast.success('Wall measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving wall measurement');
      console.error('Error saving wall measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this wall measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_walls_measurements/${measurementId}`);
        toast.success('Wall measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting wall measurement');
        console.error('Error deleting wall measurement:', error);
      }
    }
  };

  const calculateTotalArea = (measurement) => {
    const width = parseFloat(measurement.width) || 0;
    const height = parseFloat(measurement.height) || 0;
    const wallArea = width * height;
    return wallArea.toFixed(2);
  };

  const calculateNetArea = (measurement) => {
    // Parse all values safely
    const width = parseFloat(measurement.width) || 0;
    const height = parseFloat(measurement.height) || 0;
    const windowSqft = parseFloat(measurement.window_sqft) || 0;
    const window2Sqft = parseFloat(measurement.window2_sqft) || 0;
    const doorSqft = parseFloat(measurement.door_sqft) || 0;
    const door2Sqft = parseFloat(measurement.door2_sqft) || 0;
    
    const wallArea = width * height;
    const totalOpeningsArea = windowSqft + window2Sqft + doorSqft + door2Sqft;
    const netArea = wallArea - totalOpeningsArea;
    
    // Return 0 if result is negative or NaN
    return (isNaN(netArea) || netArea < 0) ? '0.00' : netArea.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Wall Measurements</h4>
          <p className="text-sm text-gray-500">
            Record wall dimensions with doors and windows for accurate material estimation
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Wall
        </button>
      </div>

      {/* Measurements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : measurements.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Ruler className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No wall measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first wall measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Wall
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Floor</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Room</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Wall Type</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Direction</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions (W×H)</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Thickness</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Area</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Net Area</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {measurements.map((measurement) => (
                <tr key={measurement.measurement_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {measurement.floor || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-gray-400 mr-2" />
                      {measurement.room || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.walltype || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.wall_direction || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.width || 0} × {measurement.height || 0} ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.wall_thickness || '-'} mm
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {calculateTotalArea(measurement)} sq ft
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-green-600">
                    {calculateNetArea(measurement)} sq ft
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

      {/* Wall Measurement Form Dialog */}
      <WallMeasurementDialog
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

export default WallMeasurements;
