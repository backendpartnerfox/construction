import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { usersAPI } from '../services/api';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  Camera,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    address: '',
    joinDate: '',
    bio: ''
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      // Try to get profile from API
      const response = await usersAPI.getProfile();
      if (response && response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Set default data if API fails
      setProfileData({
        firstName: user?.first_name || 'Admin',
        lastName: user?.last_name || 'User',
        email: user?.email || 'admin@constructpro.com',
        phone: user?.phone || '+91-9876543210',
        designation: user?.designation || 'System Administrator',
        department: user?.department || 'IT',
        address: user?.address || '123 Construction Street, Hyderabad, Telangana',
        joinDate: user?.join_date || '2023-01-15',
        bio: user?.bio || 'Experienced system administrator with expertise in construction management systems.'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.updateProfile(profileData);
      if (response.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data if needed
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture and Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                    </span>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition duration-200">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-gray-600">{profileData.designation}</p>
                <p className="text-sm text-gray-500">{profileData.department}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.phone}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Joined {profileData.joinDate}</span>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">{profileData.address}</span>
                </div>
              </div>
            </div>

            {/* Profile Details Form */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.designation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="IT">IT</option>
                      <option value="Projects">Projects</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.department}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.address}</p>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profileData.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Change Password</h4>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200">
                  Update Password
                </button>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</h4>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Profile;