import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import MeetingFormDialog from './MeetingFormDialog';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';


const ProjectMeetings = ({ projectId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [formData, setFormData] = useState({
    type_of_meeting: '',
    project_id: projectId,
    source: '',
    target: '',
    to_be_included: '',
    date: '',
    created_by: '',
    location: '',
    meeting_id: ''
  });

  // Load meetings for this project
  useEffect(() => {
    if (projectId) {
      loadMeetings();
    }
  }, [projectId]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      console.log('📅 Loading meetings for project:', projectId);
      const response = await axios.get(`${API_BASE_URL}/api/meetings/project/${projectId}`);
      console.log('Meetings response:', response.data);
      
      const meetingsData = response.data?.success ? response.data.data : response.data;
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      console.log('✅ Meetings loaded:', meetingsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading meetings:', error);
      toast.error('Error loading meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (meeting = null) => {
    if (meeting) {
      setEditMode(true);
      setCurrentMeeting(meeting);
      setFormData({
        type_of_meeting: meeting.type_of_meeting || '',
        project_id: projectId,
        source: meeting.source || '',
        target: meeting.target || '',
        to_be_included: meeting.to_be_included || '',
        date: meeting.date ? new Date(meeting.date).toISOString().slice(0, 16) : '',
        created_by: meeting.created_by || '',
        location: meeting.location || '',
        meeting_id: meeting.meeting_id || ''
      });
    } else {
      setEditMode(false);
      setCurrentMeeting(null);
      setFormData({
        type_of_meeting: '',
        project_id: projectId,
        source: '',
        target: '',
        to_be_included: '',
        date: '',
        created_by: '',
        location: '',
        meeting_id: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentMeeting(null);
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
      if (editMode && currentMeeting) {
        await axios.put(`${API_BASE_URL}/api/meetings/${currentMeeting.id}`, formData);
        toast.success('Meeting updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/meetings`, formData);
        toast.success('Meeting created successfully');
      }
      
      handleCloseDialog();
      loadMeetings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving meeting');
      console.error('Error saving meeting:', error);
    }
  };

  const handleDelete = async (meetingId, meetingType) => {
    if (window.confirm(`Are you sure you want to delete this ${meetingType} meeting?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/meetings/${meetingId}`);
        toast.success('Meeting deleted successfully');
        loadMeetings();
      } catch (error) {
        toast.error('Error deleting meeting');
        console.error('Error deleting meeting:', error);
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
          <h3 className="text-lg font-semibold text-gray-900">Meetings</h3>
          <p className="text-sm text-gray-500">
            Manage project meetings and schedules
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Schedule Meeting
        </button>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by scheduling a new meeting.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Schedule Meeting
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-5 w-5 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatDate(meeting.date)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {meeting.type_of_meeting || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPinIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {meeting.location || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="mr-2 h-4 w-4 text-gray-400" />
                      <div className="max-w-xs truncate">
                        {meeting.to_be_included || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {meeting.created_by || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenDialog(meeting)}
                      className="mr-3 text-orange-600 hover:text-orange-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(meeting.id, meeting.type_of_meeting)}
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

      {/* Meeting Form Dialog */}
      <MeetingFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ProjectMeetings;
