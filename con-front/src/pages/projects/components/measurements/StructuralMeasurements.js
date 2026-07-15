import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Home,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import StructuralMeasurementDialog from './StructuralMeasurementDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const StructuralMeasurements = ({ projectId }) => {
  const [measurements, setMeasurements] = useState([]);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [formData, setFormData] = useState({
    project_id: projectId,
    element_id: '',
    floor: '',
    component: '',
    length: '',
    width: '',
    height: '',
    depth: '',
    slab_thickness: '',
    slab_type: '',
    tmt_main_bar_dia: '',
    tmt_distribution_bar_dia: '',
    qty_main_bars: '',
    qty_distribution_bars: '',
    rmc_grade: '',
    stirrup_dia: '',
    stirrup_spacing: '',
    concrete_cover: '',
    reinforcement_type: '',
    concrete_mix_ratio: '',
    recorded_by: 1, // Default to employee 1, should get from logged in user
    status: 'Draft'
  });

  // Load measurements and elements
  useEffect(() => {
    if (projectId) {
      loadMeasurements();
      loadElements();
    }
  }, [projectId]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      console.log('🏗️ Loading structural measurements for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_measurements_structural/project/${projectId}`);
      console.log('Measurements response:', response.data);
      
      const measurementsData = response.data?.success ? response.data.data : response.data;
      setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
      console.log('✅ Measurements loaded:', measurementsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading measurements:', error);
      toast.error('Error loading measurements');
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadElements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/elements`);
      const elementsData = response.data?.success ? response.data.data : response.data;
      // Filter only structural elements
      const structuralElements = Array.isArray(elementsData) 
        ? elementsData.filter(e => 
            ['Foundation', 'Structural', 'Circulation'].includes(e.element_category)
          )
        : [];
      setElements(structuralElements);
      console.log('✅ Elements loaded:', structuralElements.length);
    } catch (error) {
      console.error('❌ Error loading elements:', error);
      toast.error('Error loading elements');
    }
  };

  const handleOpenDialog = (measurement = null, view = false) => {
    setViewMode(view);
    
    if (measurement) {
      setEditMode(true);
      setCurrentMeasurement(measurement);
      setFormData({
        project_id: projectId,
        element_id: measurement.element_id || '',
        floor: measurement.floor || '',
        component: measurement.component || '',
        length: measurement.length || '',
        width: measurement.width || '',
        height: measurement.height || '',
        depth: measurement.depth || '',
        slab_thickness: measurement.slab_thickness || '',
        slab_type: measurement.slab_type || '',
        tmt_main_bar_dia: measurement.tmt_main_bar_dia || '',
        tmt_distribution_bar_dia: measurement.tmt_distribution_bar_dia || '',
        qty_main_bars: measurement.qty_main_bars || '',
        qty_distribution_bars: measurement.qty_distribution_bars || '',
        rmc_grade: measurement.rmc_grade || '',
        stirrup_dia: measurement.stirrup_dia || '',
        stirrup_spacing: measurement.stirrup_spacing || '',
        concrete_cover: measurement.concrete_cover || '',
        reinforcement_type: measurement.reinforcement_type || '',
        concrete_mix_ratio: measurement.concrete_mix_ratio || '',
        recorded_by: measurement.recorded_by || 1,
        status: measurement.status || 'Draft'
      });
    } else {
      setEditMode(false);
      setCurrentMeasurement(null);
      setFormData({
        project_id: projectId,
        element_id: '',
        floor: '',
        component: '',
        length: '',
        width: '',
        height: '',
        depth: '',
        slab_thickness: '',
        slab_type: '',
        tmt_main_bar_dia: '',
        tmt_distribution_bar_dia: '',
        qty_main_bars: '',
        qty_distribution_bars: '',
        rmc_grade: '',
        stirrup_dia: '',
        stirrup_spacing: '',
        concrete_cover: '',
        reinforcement_type: '',
        concrete_mix_ratio: '',
        recorded_by: 1,
        status: 'Draft'
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
      // Convert string numbers to actual numbers
      const submitData = {
        ...formData,
        project_id: parseInt(projectId),
        element_id: parseInt(formData.element_id),
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        depth: formData.depth ? parseFloat(formData.depth) : null,
        slab_thickness: formData.slab_thickness ? parseFloat(formData.slab_thickness) : null,
        tmt_main_bar_dia: formData.tmt_main_bar_dia ? parseFloat(formData.tmt_main_bar_dia) : null,
        tmt_distribution_bar_dia: formData.tmt_distribution_bar_dia ? parseFloat(formData.tmt_distribution_bar_dia) : null,
        qty_main_bars: formData.qty_main_bars ? parseInt(formData.qty_main_bars) : null,
        qty_distribution_bars: formData.qty_distribution_bars ? parseInt(formData.qty_distribution_bars) : null,
        stirrup_dia: formData.stirrup_dia ? parseFloat(formData.stirrup_dia) : null,
        stirrup_spacing: formData.stirrup_spacing ? parseFloat(formData.stirrup_spacing) : null,
        concrete_cover: formData.concrete_cover ? parseFloat(formData.concrete_cover) : null,
        recorded_by: parseInt(formData.recorded_by)
      };

      if (editMode && currentMeasurement) {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_structural/${currentMeasurement.structural_measurement_id}`, submitData);
        toast.success('Measurement updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_measurements_structural`, submitData);
        toast.success('Measurement added successfully');
      }
      
      handleCloseDialog();
      loadMeasurements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving measurement');
      console.error('Error saving measurement:', error);
    }
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm('Are you sure you want to delete this measurement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_measurements_structural/${measurementId}`);
        toast.success('Measurement deleted successfully');
        loadMeasurements();
      } catch (error) {
        toast.error('Error deleting measurement');
        console.error('Error deleting measurement:', error);
      }
    }
  };

  const handleVerify = async (measurementId) => {
    if (window.confirm('Are you sure you want to verify this measurement? This will make it available for BOQ generation.')) {
      try {
        await axios.put(`${API_BASE_URL}/api/architect_measurements_structural/${measurementId}/verify`, {
          verified_by: 1, // Should get from logged in user
          verified_at: new Date().toISOString()
        });
        toast.success('Measurement verified successfully');
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
        await axios.put(`${API_BASE_URL}/api/architect_measurements_structural/project/${projectId}/verify-all`, {
          verified_by: 1 // Should get from logged in user
        });
        toast.success(`${draftMeasurements.length} measurements verified successfully`);
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
      case 'Pending Verification':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Pending Verification':
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
          <h4 className="text-base font-semibold text-gray-900">Structural Measurements</h4>
          <p className="text-sm text-gray-500">
            Record measurements for columns, beams, slabs, and other structural elements
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
            Add Measurement
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
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No measurements recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first structural measurement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Measurement
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Element</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Floor</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Component</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dimensions (L×W×H)</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">RMC Grade</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Recorded By</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {measurements.map((measurement) => (
                <tr key={measurement.structural_measurement_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="font-medium text-gray-900">{measurement.element_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.floor || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.component || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.length || 0} × {measurement.width || 0} × {measurement.height || 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.rmc_grade || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(measurement.status)}`}>
                      {getStatusIcon(measurement.status)}
                      {measurement.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {measurement.recorded_by_name || 'Unknown'}
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
                          onClick={() => handleVerify(measurement.structural_measurement_id)}
                          className="text-green-600 hover:text-green-900"
                          title="Verify"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(measurement.structural_measurement_id)}
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

      {/* Measurement Form Dialog */}
      <StructuralMeasurementDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        viewMode={viewMode}
        formData={formData}
        elements={elements}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default StructuralMeasurements;
