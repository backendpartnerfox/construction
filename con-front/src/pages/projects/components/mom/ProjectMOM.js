import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import MOMFormDialog from './MOMFormDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const ProjectMOM = ({ projectId }) => {
  const [moms, setMoms] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMOM, setCurrentMOM] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState({
    meeting_id: '',
    project_id: projectId,
    initial_mom: '',
    mom_sending: ''
  });

  // Load MOMs and meetings for this project
  useEffect(() => {
    if (projectId) {
      loadMOMs();
      loadMeetings();
    }
  }, [projectId]);

  const loadMOMs = async () => {
    setLoading(true);
    try {
      console.log('📝 Loading MOMs for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/minutes_of_meeting/project/${projectId}`);
      console.log('MOMs response:', response.data);
      
      const momsData = response.data?.success ? response.data.data : response.data;
      setMoms(Array.isArray(momsData) ? momsData : []);
      console.log('✅ MOMs loaded:', momsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading MOMs:', error);
      toast.error('Error loading minutes of meeting');
      setMoms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMeetings = async () => {
    setLoadingMeetings(true);
    try {
      console.log('📅 Loading meetings for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/meetings/project/${projectId}`);
      const meetingsData = response.data?.success ? response.data.data : response.data;
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      console.log('✅ Meetings loaded:', meetingsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading meetings:', error);
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const handleOpenDialog = (mom = null, view = false) => {
    setViewMode(view);
    
    if (mom) {
      setEditMode(true);
      setCurrentMOM(mom);
      setFormData({
        meeting_id: mom.meeting_id?.toString() || '',
        project_id: projectId,
        initial_mom: mom.initial_mom || '',
        mom_sending: mom.mom_sending || ''
      });
    } else {
      setEditMode(false);
      setCurrentMOM(null);
      setFormData({
        meeting_id: '',
        project_id: projectId,
        initial_mom: '',
        mom_sending: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentMOM(null);
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
        meeting_id: formData.meeting_id ? parseInt(formData.meeting_id) : null
      };

      if (editMode && currentMOM) {
        await axios.put(`${API_BASE_URL}/api/minutes_of_meeting/${currentMOM.mom_id}`, submitData);
        toast.success('MOM updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/minutes_of_meeting`, submitData);
        toast.success('MOM created successfully');
      }
      
      handleCloseDialog();
      loadMOMs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving MOM');
      console.error('Error saving MOM:', error);
    }
  };

  const handleDelete = async (momId) => {
    if (window.confirm('Are you sure you want to delete this MOM?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/minutes_of_meeting/${momId}`);
        toast.success('MOM deleted successfully');
        loadMOMs();
      } catch (error) {
        toast.error('Error deleting MOM');
        console.error('Error deleting MOM:', error);
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
          <h3 className="text-lg font-semibold text-gray-900">Minutes of Meeting (MOM)</h3>
          <p className="text-sm text-gray-500">
            Record and manage meeting minutes
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          disabled={loadingMeetings}
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create MOM
        </button>
      </div>

      {/* MOMs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : moms.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No minutes of meeting</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a MOM for a meeting.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
              disabled={loadingMeetings}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create MOM
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Meeting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Meeting Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Content Preview
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {moms.map((mom) => (
                <tr key={mom.mom_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mom.type_of_meeting || 'Meeting'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mom.meeting_location || 'No location'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <ClockIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {formatDate(mom.meeting_date)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      mom.mom_sending ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {mom.mom_sending || 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-sm text-gray-500">
                      {mom.initial_mom ? mom.initial_mom.substring(0, 100) + '...' : '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenDialog(mom, true)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenDialog(mom, false)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mom.mom_id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MOM Form Dialog */}
      <MOMFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        viewMode={viewMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        meetings={meetings}
        loadingMeetings={loadingMeetings}
      />
    </div>
  );
};

export default ProjectMOM;
