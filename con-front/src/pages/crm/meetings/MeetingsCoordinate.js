import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Plus, Loader2, X, Save, Video, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../../utils/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

const STATUS_BADGE = {
  Scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  Confirmed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed:   'bg-gray-100 text-gray-600 border-gray-200',
  Cancelled:   'bg-red-50 text-red-700 border-red-200',
  Rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
};

const emptyForm = {
  title: '', type_of_meeting: 'Client Meeting',
  related_entity_type: 'enquiry', related_entity_id: '',
  date: '', location: '', source: '', target: '', to_be_included: '', notes: '',
};

export default function MeetingsCoordinate() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('meetings.edit');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/meetings`);
      setRows(data.data || data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.title && !form.type_of_meeting) { toast.error('Title or type is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.related_entity_id === '' || payload.related_entity_id == null) {
        delete payload.related_entity_id;
      } else {
        payload.related_entity_id = Number(payload.related_entity_id);
      }
      await axios.post(`${API_BASE_URL}/meetings`, payload);
      toast.success('Meeting scheduled');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const setStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/meetings/${id}/status`, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const now = new Date();
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (!r.date) return filter === 'all';
      const d = new Date(r.date);
      if (filter === 'upcoming') return d >= now;
      if (filter === 'past')     return d < now;
      return true;
    }).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return filter === 'past'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date);
    });
  }, [rows, filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar size={16} /> CRM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings — Coordinate</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule and track client meetings, calls, and site visits.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
            <Plus size={16}/> Schedule Meeting
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['upcoming','past','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm rounded-md capitalize border ${filter === f ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-500 self-center">{filtered.length} shown</div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
            No meetings in this filter.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(r => (
              <li key={r.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="w-14 text-center shrink-0">
                    {r.date ? (
                      <>
                        <div className="text-xs uppercase text-gray-500">{new Date(r.date).toLocaleString('en', { month: 'short' })}</div>
                        <div className="text-2xl font-bold text-gray-900 leading-none">{new Date(r.date).getDate()}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </>
                    ) : <div className="text-xs text-gray-400 italic">no date</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{r.title || r.type_of_meeting || 'Meeting'}</span>
                      {r.status && <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>{r.status}</span>}
                      {r.related_entity_type && r.related_entity_id && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          {r.related_entity_type} #{r.related_entity_id}
                        </span>
                      )}
                    </div>
                    {r.type_of_meeting && r.title && (
                      <div className="text-xs text-gray-500 mt-0.5">{r.type_of_meeting}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                      {r.location && <span className="inline-flex items-center gap-1"><MapPin size={11}/> {r.location}</span>}
                      {r.to_be_included && <span className="inline-flex items-center gap-1"><Users size={11}/> {r.to_be_included}</span>}
                      {r.source && <span className="inline-flex items-center gap-1"><Video size={11}/> {r.source}</span>}
                    </div>
                    {r.notes && <div className="mt-2 text-xs text-gray-500 italic">{r.notes}</div>}
                  </div>
                  {canEdit && (
                    <div className="flex flex-col gap-1 shrink-0">
                      {['Confirmed','Completed','Cancelled'].map(s => (
                        r.status !== s && (
                          <button key={s} onClick={() => setStatus(r.id, s)}
                                  className={`text-[10px] px-2 py-1 rounded border hover:border-orange-400 hover:text-orange-600 ${STATUS_BADGE[s]}`}>
                            → {s}
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Schedule Meeting</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({...f, title: v}))} placeholder="Initial call with Mr. Sharma"/>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={form.type_of_meeting} onChange={v => setForm(f => ({...f, type_of_meeting: v}))}
                       placeholder="Client Meeting, Site Visit, Discovery Call"/>
                <Field label="When" type="datetime-local" value={form.date} onChange={v => setForm(f => ({...f, date: v}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Related to" value={form.related_entity_type} onChange={v => setForm(f => ({...f, related_entity_type: v}))}
                             options={['enquiry','lead','client','project']}/>
                <Field label="Entity ID" type="number" value={form.related_entity_id} onChange={v => setForm(f => ({...f, related_entity_id: v}))}/>
              </div>
              <Field label="Location" value={form.location} onChange={v => setForm(f => ({...f, location: v}))} placeholder="Office / Zoom / Site address"/>
              <Field label="Attendees" value={form.to_be_included} onChange={v => setForm(f => ({...f, to_be_included: v}))} placeholder="Comma-separated names"/>
              <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({...f, notes: v}))} textarea/>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text', textarea, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {textarea ? (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
    ) : (
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
    )}
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
