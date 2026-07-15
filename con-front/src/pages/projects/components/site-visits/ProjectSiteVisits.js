import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import SiteVisitFormDialog from './SiteVisitFormDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ProjectSiteVisits = ({ projectId }) => {
  const [siteVisits, setSiteVisits] = useState([]);
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMOMs, setLoadingMOMs] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState({
    project_id: projectId,
    mom_id: '',
    created_by: ''
  });

  // Load site visits and MOMs for this project
  useEffect(() => {
    if (projectId) {
      loadSiteVisits();
      loadMOMs();
    }
  }, [projectId]);

  const loadSiteVisits = async () => {
    setLoading(true);
    try {
      console.log('🏗️ Loading site visits for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/site_visits/project/${projectId}`);
      console.log('Site visits response:', response.data);
      
      const visitsData = response.data?.success ? response.data.data : response.data;
      setSiteVisits(Array.isArray(visitsData) ? visitsData : []);
      console.log('✅ Site visits loaded:', visitsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading site visits:', error);
      toast.error('Error loading site visits');
      setSiteVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMOMs = async () => {
    setLoadingMOMs(true);
    try {
      console.log('📝 Loading MOMs for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/minutes_of_meeting/project/${projectId}`);
      const momsData = response.data?.success ? response.data.data : response.data;
      setMoms(Array.isArray(momsData) ? momsData : []);
      console.log('✅ MOMs loaded:', momsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading MOMs:', error);
      setMoms([]);
    } finally {
      setLoadingMOMs(false);
    }
  };

  const handleOpenDialog = (visit = null, view = false) => {
    setViewMode(view);
    
    if (visit) {
      setEditMode(true);
      setCurrentVisit(visit);
      setFormData({
        project_id: projectId,
        mom_id: visit.mom_id?.toString() || '',
        created_by: visit.created_by || ''
      });
    } else {
      setEditMode(false);
      setCurrentVisit(null);
      setFormData({
        project_id: projectId,
        mom_id: '',
        created_by: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentVisit(null);
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
        mom_id: formData.mom_id ? parseInt(formData.mom_id) : null
      };

      if (editMode && currentVisit) {
        await axios.put(`${API_BASE_URL}/api/site_visits/${currentVisit.id}`, submitData);
        toast.success('Site visit updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/site_visits`, submitData);
        toast.success('Site visit created successfully');
      }
      
      handleCloseDialog();
      loadSiteVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving site visit');
      console.error('Error saving site visit:', error);
    }
  };

  const handleDelete = async (visitId) => {
    if (window.confirm('Are you sure you want to delete this site visit?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/site_visits/${visitId}`);
        toast.success('Site visit deleted successfully');
        loadSiteVisits();
      } catch (error) {
        toast.error('Error deleting site visit');
        console.error('Error deleting site visit:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Site Visits</h3>
          <p className="text-sm text-gray-500">
            Track and record project site visits
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          disabled={loadingMOMs}
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Record Site Visit
        </button>
      </div>

      {/* Site Visits List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : siteVisits.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No site visits recorded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by recording your first site visit.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
              disabled={loadingMOMs}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Record Site Visit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteVisits.map((visit) => (
            <div
              key={visit.id}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <MapPinIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Site Visit #{visit.id}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {visit.project_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                {/* Meeting Info */}
                {visit.type_of_meeting && (
                  <div className="flex items-start">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{visit.type_of_meeting}</p>
                      <p className="text-xs text-gray-500">{formatDate(visit.meeting_date)}</p>
                    </div>
                  </div>
                )}

                {/* Created By */}
                <div className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {visit.created_by || 'Unknown'}
                  </span>
                </div>

                {/* MOM Preview */}
                {visit.initial_mom && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {visit.initial_mom}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="mt-4 flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenDialog(visit, true)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="View"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleOpenDialog(visit, false)}
                  className="text-orange-600 hover:text-orange-900 p-1"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(visit.id)}
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

      {/* Site Visit Form Dialog */}
      <SiteVisitFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        viewMode={viewMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        moms={moms}
        loadingMOMs={loadingMOMs}
      />
    </div>
  );
};

export default ProjectSiteVisits;
