import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, Plus, Loader2, X, Save, Calendar as CalIcon, Users } from 'lucide-react';
import { useAuth } from '../../../utils/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

const STATUS_BADGE = {
  Planned:     'bg-blue-50 text-blue-700 border-blue-200',
  Confirmed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed:   'bg-gray-100 text-gray-600 border-gray-200',
  Cancelled:   'bg-red-50 text-red-700 border-red-200',
  Rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
};

const emptyForm = {
  purpose: 'Initial Site Assessment',
  visit_date: '',
  address: '', city: '', state: '',
  related_entity_type: 'lead', related_entity_id: '',
  attendees: '', notes: '',
};

export default function SiteVisits() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('site_visits.edit');

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/site_visits`),
        axios.get(`${API_BASE_URL}/site_visits/stats/summary`),
      ]);
      setRows(listRes.data.data || listRes.data || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.purpose && !form.visit_date) { toast.error('Purpose or date is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.related_entity_id === '' || payload.related_entity_id == null) {
        delete payload.related_entity_id;
      } else {
        payload.related_entity_id = Number(payload.related_entity_id);
      }
      await axios.post(`${API_BASE_URL}/site_visits`, payload);
      toast.success('Site visit scheduled');
      setShowModal(false); setForm(emptyForm); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const setStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/site_visits/${id}/status`, { status: newStatus });
      toast.success(`Status → ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const now = new Date();
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (!r.visit_date) return filter === 'all';
      const d = new Date(r.visit_date);
      if (filter === 'upcoming') return d >= now;
      if (filter === 'past')     return d < now;
      return true;
    }).sort((a, b) => {
      if (!a.visit_date) return 1;
      if (!b.visit_date) return -1;
      return filter === 'past'
        ? new Date(b.visit_date) - new Date(a.visit_date)
        : new Date(a.visit_date) - new Date(b.visit_date);
    });
  }, [rows, filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MapPin size={16} /> Sales
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Site Visits</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule and record physical property visits.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
            <Plus size={16}/> Schedule Visit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile label="Upcoming"  value={stats.upcoming || 0}  color="blue"/>
        <StatTile label="Planned"   value={stats.planned || 0}   color="sky"/>
        <StatTile label="Confirmed" value={stats.confirmed || 0} color="emerald"/>
        <StatTile label="Completed" value={stats.completed || 0} color="gray"/>
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
            <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
            No site visits in this filter.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(r => (
              <li key={r.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="w-14 text-center shrink-0">
                    {r.visit_date ? (
                      <>
                        <div className="text-xs uppercase text-gray-500">{new Date(r.visit_date).toLocaleString('en', { month: 'short' })}</div>
                        <div className="text-2xl font-bold text-gray-900 leading-none">{new Date(r.visit_date).getDate()}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{new Date(r.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </>
                    ) : <div className="text-xs text-gray-400 italic">no date</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-orange-600">{r.visit_number}</span>
                      <span className="font-medium text-gray-900">{r.purpose || 'Site Visit'}</span>
                      {r.status && <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>{r.status}</span>}
                      {r.related_entity_type && r.related_entity_id && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          {r.related_entity_type} #{r.related_entity_id}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                      {(r.address || r.city) && (
                        <span className="inline-flex items-center gap-1"><MapPin size={11}/> {[r.address, r.city, r.state].filter(Boolean).join(', ')}</span>
                      )}
                      {r.attendees && <span className="inline-flex items-center gap-1"><Users size={11}/> {r.attendees}</span>}
                      {r.visited_by_name && <span className="inline-flex items-center gap-1">by {r.visited_by_name}</span>}
                    </div>
                    {r.findings && <div className="mt-2 text-xs text-gray-500 italic">Findings: {r.findings}</div>}
                    {r.next_action && <div className="mt-1 text-xs text-orange-600">Next: {r.next_action}</div>}
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
              <h2 className="text-lg font-semibold text-gray-900">Schedule Site Visit</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Purpose" value={form.purpose} onChange={v => setForm(f => ({...f, purpose: v}))}
                       placeholder="Initial Assessment, Follow-up, Handover..." />
                <Field label="When" type="datetime-local" value={form.visit_date} onChange={v => setForm(f => ({...f, visit_date: v}))}/>
              </div>
              <Field label="Address" value={form.address} onChange={v => setForm(f => ({...f, address: v}))} placeholder="Plot #, street, area"/>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={form.city} onChange={v => setForm(f => ({...f, city: v}))}/>
                <Field label="State" value={form.state} onChange={v => setForm(f => ({...f, state: v}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Related to" value={form.related_entity_type} onChange={v => setForm(f => ({...f, related_entity_type: v}))}
                             options={['enquiry','lead','client','project']}/>
                <Field label="Entity ID" type="number" value={form.related_entity_id} onChange={v => setForm(f => ({...f, related_entity_id: v}))}/>
              </div>
              <Field label="Attendees" value={form.attendees} onChange={v => setForm(f => ({...f, attendees: v}))} placeholder="Names, phone numbers"/>
              <Field label="Notes / Agenda" value={form.notes} onChange={v => setForm(f => ({...f, notes: v}))} textarea/>

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

const StatTile = ({ label, value, color }) => {
  const colors = {
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray:    'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`rounded-lg p-4 border ${colors[color]}`}>
      <div className="text-xs uppercase font-medium">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

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
