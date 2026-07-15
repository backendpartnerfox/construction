import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FileText,
  Download,
  Eye,
  Upload,
} from 'lucide-react';
import DrawingFormDialog from './DrawingFormDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ArchitectDrawings = ({ projectId }) => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState({
    project_id: projectId,
    architect_id: null,
    client_id: null,
    upload_architect_documents: ''
  });

  // Load drawings for this project
  useEffect(() => {
    if (projectId) {
      loadDrawings();
    }
  }, [projectId]);

  const loadDrawings = async () => {
    setLoading(true);
    try {
      console.log('📐 Loading drawings for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/architect_project_drawing/project/${projectId}/with-details`);
      console.log('Drawings response:', response.data);
      
      const drawingsData = response.data?.success ? response.data.data : response.data;
      setDrawings(Array.isArray(drawingsData) ? drawingsData : []);
      console.log('✅ Drawings loaded:', drawingsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading drawings:', error);
      toast.error('Error loading drawings');
      setDrawings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (drawing = null, view = false) => {
    setViewMode(view);
    
    if (drawing) {
      setEditMode(true);
      setCurrentDrawing(drawing);
      setFormData({
        project_id: projectId,
        architect_id: drawing.architect_id || null,
        client_id: drawing.client_id || null,
        upload_architect_documents: drawing.upload_architect_documents || ''
      });
    } else {
      setEditMode(false);
      setCurrentDrawing(null);
      setFormData({
        project_id: projectId,
        architect_id: null,
        client_id: null,
        upload_architect_documents: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentDrawing(null);
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
        project_id: parseInt(projectId)
      };

      if (editMode && currentDrawing) {
        await axios.put(`${API_BASE_URL}/api/architect_project_drawing/${currentDrawing.id}`, submitData);
        toast.success('Drawing updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/architect_project_drawing`, submitData);
        toast.success('Drawing uploaded successfully');
      }
      
      handleCloseDialog();
      loadDrawings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving drawing');
      console.error('Error saving drawing:', error);
    }
  };

  const handleDelete = async (drawingId) => {
    if (window.confirm('Are you sure you want to delete this drawing?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/architect_project_drawing/${drawingId}`);
        toast.success('Drawing deleted successfully');
        loadDrawings();
      } catch (error) {
        toast.error('Error deleting drawing');
        console.error('Error deleting drawing:', error);
      }
    }
  };

  const getDrawingIcon = (docName) => {
    if (!docName) return <FileText className="h-8 w-8 text-gray-400" />;
    const ext = docName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (['dwg', 'dxf'].includes(ext)) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Architect Drawings</h4>
          <p className="text-sm text-gray-500">
            Upload and manage architectural drawings
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <Upload className="-ml-1 mr-2 h-5 w-5" />
          Upload Drawing
        </button>
      </div>

      {/* Drawings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : drawings.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drawings uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first architectural drawing.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <Upload className="-ml-1 mr-2 h-5 w-5" />
              Upload Drawing
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((drawing) => (
            <div
              key={drawing.id}
              className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-orange-500 hover:shadow-md transition-all"
            >
              {/* Drawing Icon */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {getDrawingIcon(drawing.upload_architect_documents)}
                  <div className="ml-3">
                    <h5 className="text-sm font-semibold text-gray-900">
                      Drawing #{drawing.id}
                    </h5>
                    <p className="text-xs text-gray-500">
                      {drawing.project_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawing Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">Document:</p>
                  <p className="text-sm text-gray-900 truncate" title={drawing.upload_architect_documents}>
                    {drawing.upload_architect_documents}
                  </p>
                </div>
                
                {drawing.client_name && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Client:</p>
                    <p className="text-sm text-gray-900">{drawing.client_name}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenDialog(drawing, true)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="View"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleOpenDialog(drawing, false)}
                  className="text-orange-600 hover:text-orange-900 p-1"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(drawing.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawing Form Dialog */}
      <DrawingFormDialog
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

export default ArchitectDrawings;
