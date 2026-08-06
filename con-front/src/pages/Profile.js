import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { usersAPI } from '../services/api';
import { Mail, Phone, MapPin, Calendar, Edit, Save, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Real profile page — hydrates from GET /users/me (auth'd user + roles + linked
// employee record if any). Editable fields save via PUT /users/me. Fields
// backed by the employees table (designation, phone, department, address)
// display when available but aren't editable here — those need a dedicated
// employee-management flow.
const Profile = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getProfile();
      const data = res?.data || res;
      setUser(data.user || null);
      setRoles(data.roles || []);
      setEmployee(data.employee || null);
      setForm({
        first_name: data.user?.first_name || '',
        last_name:  data.user?.last_name || '',
        email:      data.user?.email || '',
      });
    } catch (err) {
      console.error('[Profile] load failed:', err);
      toast.error(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(form);
      toast.success('Profile updated');
      setIsEditing(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'User';
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase() +
                   (user?.last_name?.[0] || '').toUpperCase();
  const roleNames = roles.map(r => r.name).join(', ') || (authUser?.username === 'admin' ? 'admin' : '—');

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); load(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left card — identity & contact summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
              <p className="text-gray-600 mt-1">{employee?.designation || <em className="text-gray-400 not-italic">No designation</em>}</p>
              <p className="text-sm text-gray-500">{employee?.department || <em className="text-gray-400 not-italic">No department</em>}</p>
              <div className="mt-2 inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">@{user?.username}</div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Row icon={Mail}     value={user?.email} />
              <Row icon={Phone}    value={employee?.phone || <em className="text-gray-400 not-italic">No phone on file</em>} />
              <Row icon={Calendar} value={user?.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString()}` : '—'} />
              <Row icon={MapPin}   value={employee?.address || user?.city_name || <em className="text-gray-400 not-italic">No address</em>} />
            </div>
          </div>

          {/* Right — editable form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="First Name" value={form.first_name} editing={isEditing} onChange={v => setForm(f => ({ ...f, first_name: v }))} />
              <Field label="Last Name"  value={form.last_name}  editing={isEditing} onChange={v => setForm(f => ({ ...f, last_name: v }))} />
              <Field label="Email"      value={form.email}      editing={isEditing} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Field label="Username"   value={user?.username || ''} readOnly hint="Username cannot be changed" />
              <Field label="Designation" value={employee?.designation || ''} readOnly hint={employee ? 'From employees record' : 'No employee record linked'} />
              <Field label="Department"  value={employee?.department || ''}  readOnly hint={employee ? 'From employees record' : 'No employee record linked'} />
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Roles &amp; Access</h3>
          </div>
          <div className="text-sm text-gray-700">
            <div><strong>Assigned roles:</strong> {roleNames}</div>
            {roles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {roles.map(r => (
                  <span key={r.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium" title={r.description}>
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
    <span className="text-gray-600 break-all">{value}</span>
  </div>
);

const Field = ({ label, value, editing, onChange, type = 'text', readOnly, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {editing && !readOnly ? (
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ) : (
      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{value || <em className="text-gray-400 not-italic">—</em>}</p>
    )}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

export default Profile;
