import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Building,
  MapPin,
  Plus,
  Edit2,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
  Tag
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const FloorComponentMapping = ({ projectId }) => {
  const [measurements, setMeasurements] = useState([]);
  const [components, setComponents] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [mappingForm, setMappingForm] = useState({
    floor_level: '',
    component_ids: []
  });

  // Default floors - you can make this dynamic from project requirements
  const defaultFloors = [
    { floor_id: 'GF', floor_name: 'Ground Floor', floor_level: 0 },
    { floor_id: 'FF', floor_name: 'First Floor', floor_level: 1 },
    { floor_id: 'SF', floor_name: 'Second Floor', floor_level: 2 },
    { floor_id: 'TF', floor_name: 'Third Floor', floor_level: 3 },
    { floor_id: 'RF', floor_name: 'Roof/Terrace', floor_level: 4 }
  ];

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all measurement types
      const measurementTypes = ['structural', 'walls', 'doors', 'windows', 'electrical', 'plumbing', 'flooring', 'painting'];
      const measurementPromises = measurementTypes.map(async (type) => {
        try {
          // Special handling for walls - backend uses different naming
          const apiPath = type === 'walls' 
            ? `${API_BASE_URL}/api/architect_walls_measurements/project/${projectId}`
            : `${API_BASE_URL}/api/architect_measurements_${type}/project/${projectId}`;
          
          const response = await axios.get(apiPath);
          const data = response.data?.success ? response.data.data : response.data;
          return (Array.isArray(data) ? data : []).map(item => ({ ...item, measurement_type: type }));
        } catch (error) {
          console.error(`Error fetching ${type} measurements:`, error);
          return [];
        }
      });

      const [allMeasurements, componentsRes] = await Promise.all([
        Promise.all(measurementPromises),
        axios.get(`${API_BASE_URL}/api/components`)
      ]);

      // Flatten all measurements
      const flattenedMeasurements = allMeasurements.flat();
      
      setMeasurements(flattenedMeasurements);
      setComponents(componentsRes.data?.success ? componentsRes.data.data : componentsRes.data);
      setFloors(defaultFloors);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMapping = (measurement) => {
    setEditingMeasurement(measurement);
    setMappingForm({
      floor_level: measurement.floor_level || measurement.floor || '',
      component_ids: measurement.component_ids ? 
        (Array.isArray(measurement.component_ids) ? measurement.component_ids : 
         typeof measurement.component_ids === 'string' ? JSON.parse(measurement.component_ids || '[]') : []) : []
    });
  };

  const handleSaveMapping = async () => {
    if (!editingMeasurement) return;

    try {
      // Build update data with all existing measurement data plus new mapping fields
      const updateData = {
        // Required fields
        project_id: parseInt(projectId),
        
        // Preserve existing measurement data
        component_id: editingMeasurement.component_id || 1,
        component_element_id: editingMeasurement.component_element_id,
        floor_id: editingMeasurement.floor_id || 1,
        room: editingMeasurement.room,
        area_description: editingMeasurement.area_description,
        length: editingMeasurement.length,
        width: editingMeasurement.width,
        flooring_type: editingMeasurement.flooring_type,
        base_preparation_required: editingMeasurement.base_preparation_required,
        base_thickness: editingMeasurement.base_thickness,
        skirting_required: editingMeasurement.skirting_required,
        skirting_height: editingMeasurement.skirting_height,
        skirting_length: editingMeasurement.skirting_length,
        tile_size: editingMeasurement.tile_size,
        pattern_type: editingMeasurement.pattern_type,
        flooring_choice_id: editingMeasurement.flooring_choice_id,
        skirting_choice_id: editingMeasurement.skirting_choice_id,
        requires_client_selection: editingMeasurement.requires_client_selection,
        status: editingMeasurement.status || 'Draft',
        
        // New mapping fields we're updating
        floor_level: mappingForm.floor_level,
        component_ids: JSON.stringify(mappingForm.component_ids),
        floor: mappingForm.floor_level // Also update the floor field for backward compatibility
      };
      
      // For non-flooring measurements, use simpler update data
      const measurementType = editingMeasurement.measurement_type;
      
      if (measurementType !== 'flooring') {
        // For other measurement types, only send the mapping fields + project_id
        Object.assign(updateData, {
          // Keep existing data for the measurement
          ...editingMeasurement,
          // Override with our mapping updates
          project_id: parseInt(projectId),
          floor_level: mappingForm.floor_level,
          component_ids: JSON.stringify(mappingForm.component_ids),
          floor: mappingForm.floor_level
        });
      }
      
      // Get the correct measurement ID based on type (matching actual database schema)
      const getMeasurementId = (measurement) => {
        switch (measurement.measurement_type) {
          case 'structural': return measurement.structural_measurement_id;
          case 'walls': return measurement.measurement_id; // walls table uses measurement_id
          case 'doors': return measurement.measurement_id; // doors table uses measurement_id
          case 'windows': return measurement.measurement_id; // windows table uses measurement_id
          case 'electrical': return measurement.measurement_id; // electrical table uses measurement_id
          case 'plumbing': return measurement.measurement_id; // plumbing table uses measurement_id
          case 'flooring': return measurement.measurement_id; // flooring table uses measurement_id
          case 'painting': return measurement.measurement_id; // painting table uses measurement_id
          default: return measurement.measurement_id;
        }
      };
      
      const measurementId = getMeasurementId(editingMeasurement);
      
      if (!measurementId) {
        toast.error('Invalid measurement ID');
        return;
      }

      // Construct API path with proper endpoint naming
      const apiPath = measurementType === 'walls' 
        ? `${API_BASE_URL}/api/architect_walls_measurements/${measurementId}`
        : `${API_BASE_URL}/api/architect_measurements_${measurementType}/${measurementId}`;
      
      console.log('Updating mapping:', { measurementType, measurementId, apiPath, updateData });

      await axios.put(apiPath, updateData);
      
      toast.success('Floor and component mapping updated successfully');
      setEditingMeasurement(null);
      setMappingForm({ floor_level: '', component_ids: [] });
      fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error updating mapping:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Error updating mapping: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingMeasurement(null);
    setMappingForm({
      floor_level: '',
      component_ids: []
    });
  };

  const handleComponentToggle = (componentId) => {
    setMappingForm(prev => ({
      ...prev,
      component_ids: prev.component_ids.includes(componentId)
        ? prev.component_ids.filter(id => id !== componentId)
        : [...prev.component_ids, componentId]
    }));
  };

  const groupedMeasurements = measurements.reduce((acc, measurement) => {
    const floor = measurement.floor_level || measurement.floor || 'unassigned';
    if (!acc[floor]) {
      acc[floor] = {};
    }
    
    const type = measurement.measurement_type;
    if (!acc[floor][type]) {
      acc[floor][type] = [];
    }
    
    acc[floor][type].push(measurement);
    return acc;
  }, {});

  const getFloorName = (floorId) => {
    const floor = floors.find(f => f.floor_id === floorId || f.floor_level.toString() === floorId.toString());
    return floor ? floor.floor_name : floorId === 'unassigned' ? 'Unassigned' : `Floor ${floorId}`;
  };

  const getComponentName = (componentId) => {
    const component = components.find(c => c.component_id === componentId);
    return component ? component.component_name : `Component ${componentId}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pending Verification':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter components based on measurement type
  const getRelevantComponents = (measurementType) => {
    const typeComponentMap = {
      'structural': ['Structural'],
      'walls': ['Walls'],
      'doors': ['Doors'],
      'windows': ['Windows'],
      'electrical': ['Electrical'],
      'plumbing': ['Plumbing'],
      'flooring': ['Flooring'],
      'painting': ['Painting']
    };

    const relevantTypes = typeComponentMap[measurementType] || [];
    return components.filter(component => 
      relevantTypes.some(type => 
        component.component_name?.toLowerCase().includes(type.toLowerCase())
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-base font-semibold text-gray-900">Floor & Component Mapping</h4>
        <p className="text-sm text-gray-500">
          Assign measurements to floors and components for better organization
        </p>
      </div>

      {/* Floor-wise Organization */}
      <div className="space-y-6">
        {Object.entries(groupedMeasurements).map(([floorId, measurementsByType]) => (
          <div key={floorId} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Floor Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getFloorName(floorId)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {Object.values(measurementsByType).flat().length} measurements
                    </p>
                  </div>
                </div>
                {floorId === 'unassigned' && (
                  <div className="flex items-center text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">Needs Assignment</span>
                  </div>
                )}
              </div>
            </div>

            {/* Measurement Types */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(measurementsByType).map(([type, measurements]) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Layers className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-md font-medium text-gray-900 capitalize">
                          {type}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {measurements.length} items
                      </span>
                    </div>

                    <div className="space-y-2">
                      {measurements.map((measurement) => {
                        // Get unique measurement ID based on measurement type (matching actual database schema)
                        const getMeasurementId = (measurement) => {
                          switch (measurement.measurement_type) {
                            case 'structural': return measurement.structural_measurement_id;
                            case 'walls': return measurement.measurement_id; // walls table uses measurement_id
                            case 'doors': return measurement.measurement_id; // doors table uses measurement_id
                            case 'windows': return measurement.measurement_id; // windows table uses measurement_id
                            case 'electrical': return measurement.measurement_id; // electrical table uses measurement_id
                            case 'plumbing': return measurement.measurement_id; // plumbing table uses measurement_id
                            case 'flooring': return measurement.measurement_id; // flooring table uses measurement_id
                            case 'painting': return measurement.measurement_id; // painting table uses measurement_id
                            default: return measurement.measurement_id;
                          }
                        };
                        
                        const measurementId = getMeasurementId(measurement);
                        const editingId = editingMeasurement ? getMeasurementId(editingMeasurement) : null;
                        
                        // Create unique key combining type and ID to avoid conflicts
                        const uniqueKey = `${measurement.measurement_type}_${measurementId}`;
                        const editingUniqueKey = editingMeasurement ? `${editingMeasurement.measurement_type}_${editingId}` : null;
                        
                        const isEditing = editingMeasurement && uniqueKey === editingUniqueKey;

                        return (
                          <div 
                            key={measurementId} 
                            className={`p-3 rounded border ${isEditing ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {measurement.element_name || 'Unknown Element'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {measurement.length && measurement.width && (
                                    <span>{measurement.length}m × {measurement.width}m</span>
                                  )}
                                  {measurement.area && (
                                    <span className="ml-2">Area: {measurement.area}m²</span>
                                  )}
                                </div>
                                
                                {/* Component Assignment Display */}
                                {isEditing ? (
                                  <div className="mt-2 space-y-2">
                                    {/* Floor Selection */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Floor
                                      </label>
                                      <select
                                        value={mappingForm.floor_level}
                                        onChange={(e) => setMappingForm(prev => ({ ...prev, floor_level: e.target.value }))}
                                        className="block w-full text-xs border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                      >
                                        <option value="">Select Floor</option>
                                        {floors.map(floor => (
                                          <option key={floor.floor_id} value={floor.floor_id}>
                                            {floor.floor_name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {/* Component Selection */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Components
                                      </label>
                                      <div className="max-h-24 overflow-y-auto border border-gray-200 rounded p-2">
                                        {getRelevantComponents(measurement.measurement_type).map(component => (
                                          <label key={component.component_id} className="flex items-center text-xs">
                                            <input
                                              type="checkbox"
                                              checked={mappingForm.component_ids.includes(component.component_id)}
                                              onChange={() => handleComponentToggle(component.component_id)}
                                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="ml-1 text-gray-700">
                                              {component.component_name}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  measurement.component_ids && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(Array.isArray(measurement.component_ids) ? 
                                        measurement.component_ids : 
                                        JSON.parse(measurement.component_ids || '[]')
                                      ).map(componentId => (
                                        <span 
                                          key={componentId}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                          <Tag className="h-3 w-3 mr-1" />
                                          {getComponentName(componentId)}
                                        </span>
                                      ))}
                                    </div>
                                  )
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1 ml-2">
                                {getStatusIcon(measurement.status)}
                                
                                {isEditing ? (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={handleSaveMapping}
                                      className="text-green-600 hover:text-green-800"
                                      title="Save"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditMapping(measurement)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Mapping"
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Floors</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(groupedMeasurements).filter(f => f !== 'unassigned').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Layers className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Measurements</p>
              <p className="text-2xl font-bold text-gray-900">
                {measurements.filter(m => m.floor_level || m.floor).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {measurements.filter(m => !m.floor_level && !m.floor).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorComponentMapping;
