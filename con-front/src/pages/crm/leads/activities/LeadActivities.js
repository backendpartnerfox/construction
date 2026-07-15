import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  MessageSquare,
  Video,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { leadActivitiesAPI } from '../../../../services/leadsApi';

const LeadActivities = ({ leadId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    activity_type: 'Call',
    activity_title: '',
    activity_description: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '30',
    priority: 'Medium',
    status: 'Planned'
  });

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await leadActivitiesAPI.getByLeadId(leadId);
      setActivities(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const activityData = {
        ...formData,
        scheduled_datetime: formData.scheduled_date && formData.scheduled_time 
          ? `${formData.scheduled_date}T${formData.scheduled_time}`
          : null
      };
      
      if (editingActivity) {
        await leadActivitiesAPI.update(leadId, editingActivity.activity_id, activityData);
      } else {
        await leadActivitiesAPI.create(leadId, activityData);
      }
      await loadActivities();
      handleCancel();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity');
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    const scheduledDate = activity.scheduled_datetime ? new Date(activity.scheduled_datetime) : null;
    setFormData({
      activity_type: activity.activity_type || 'Call',
      activity_title: activity.activity_title || '',
      activity_description: activity.activity_description || '',
      scheduled_date: scheduledDate ? scheduledDate.toISOString().split('T')[0] : '',
      scheduled_time: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : '',
      duration_minutes: activity.duration_minutes || '30',
      priority: activity.priority || 'Medium',
      status: activity.status || 'Planned'
    });
    setShowForm(true);
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await leadActivitiesAPI.delete(leadId, activityId);
        await loadActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity');
      }
    }
  };

  const handleComplete = async (activityId) => {
    const notes = prompt('Add completion notes (optional):');
    if (notes !== null) {
      try {
        await leadActivitiesAPI.complete(leadId, activityId, notes);
        await loadActivities();
      } catch (error) {
        console.error('Error completing activity:', error);
        alert('Failed to complete activity');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingActivity(null);
    setFormData({
      activity_type: 'Call',
      activity_title: '',
      activity_description: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: '30',
      priority: 'Medium',
      status: 'Planned'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getActivityIcon = (type) => {
    const icons = {
      'Call': Phone,
      'Email': Mail,
      'Meeting': Calendar,
      'Site_Visit': MapPin,
      'Follow_Up': MessageSquare,
      'Video_Call': Video,
      'Note': FileText
    };
    return icons[type] || FileText;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Planned': 'bg-blue-100 text-blue-800 border-blue-200',
      'In_Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'Overdue': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'Low': 'text-gray-600',
      'Medium': 'text-blue-600',
      'High': 'text-orange-600',
      'Urgent': 'text-red-600'
    };
    return priorityColors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activities & Tasks</h3>
          <p className="text-sm text-gray-600">Track interactions and follow-ups with this lead</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingActivity ? 'Edit Activity' : 'New Activity'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type *
                </label>
                <select
                  name="activity_type"
                  value={formData.activity_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Site_Visit">Site Visit</option>
                  <option value="Follow_Up">Follow Up</option>
                  <option value="Video_Call">Video Call</option>
                  <option value="Note">Note</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Activity Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  name="activity_title"
                  value={formData.activity_title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Follow-up call regarding quotation"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="activity_description"
                  value={formData.activity_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the activity..."
                />
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter duration"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Planned">Planned</option>
                  <option value="In_Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {editingActivity ? 'Update Activity' : 'Create Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
          <p className="text-gray-500 mb-4">
            Start tracking interactions and tasks for this lead
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.activity_type);
            const scheduledDate = activity.scheduled_datetime ? new Date(activity.scheduled_datetime) : null;
            
            return (
              <div
                key={activity.activity_id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${
                    activity.status === 'Completed' ? 'bg-green-100' : 
                    activity.status === 'In_Progress' ? 'bg-yellow-100' :
                    activity.status === 'Cancelled' ? 'bg-gray-100' :
                    'bg-blue-100'
                  }`}>
                    <ActivityIcon className={`h-5 w-5 ${
                      activity.status === 'Completed' ? 'text-green-600' :
                      activity.status === 'In_Progress' ? 'text-yellow-600' :
                      activity.status === 'Cancelled' ? 'text-gray-600' :
                      'text-blue-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-base font-semibold text-gray-900">
                            {activity.activity_title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                            {activity.status?.replace('_', ' ')}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                            {activity.priority} Priority
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{activity.activity_type?.replace('_', ' ')}</span>
                          </span>
                          {scheduledDate && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{scheduledDate.toLocaleString()}</span>
                            </span>
                          )}
                          {activity.duration_minutes && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.duration_minutes} min</span>
                            </span>
                          )}
                        </div>
                        {activity.activity_description && (
                          <p className="text-sm text-gray-700 mt-2">{activity.activity_description}</p>
                        )}
                        {activity.completion_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-900">
                              <strong>Completion Notes:</strong> {activity.completion_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {activity.status !== 'Completed' && activity.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => handleEdit(activity)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleComplete(activity.activity_id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Mark Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(activity.activity_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>Created: {new Date(activity.created_at).toLocaleString()}</span>
                      {activity.completed_at && (
                        <span>Completed: {new Date(activity.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadActivities;
