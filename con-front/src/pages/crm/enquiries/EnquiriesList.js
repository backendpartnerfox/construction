import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Phone, Mail, Building2, MapPin, Calendar,
  UserPlus, Eye, X, Save, MessageCircle, Target,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const STATUS_CLS = {
  Hot:      'bg-red-50 text-red-700',
  Warm:     'bg-amber-50 text-amber-700',
  Cold:     'bg-blue-50 text-blue-700',
  Qualified:'bg-emerald-50 text-emerald-700',
  Converted:'bg-purple-50 text-purple-700',
};

const emptyForm = {
  contact_person_name: '',
  contact_surname: '',
  company_name: '',
  primary_phone: '',
  email: '',
  whatsapp_number: '',
  city: '',
  state: '',
  project_type: 'Residential',
  construction_type: 'New Construction',
  approximate_area: '',
  area_unit: 'sqft',
  budget_range: '',
  expected_timeline: '',
};

const EnquiriesList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/enquiries');
      const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
      setRows(arr);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load enquiries');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (r.enquiry_number || '').toLowerCase().includes(q) ||
      (r.contact_person_name || '').toLowerCase().includes(q) ||
      (r.company_name || '').toLowerCase().includes(q) ||
      (r.primary_phone || '').includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.city || '').toLowerCase().includes(q));
  }, [rows, query]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.contact_person_name || !form.primary_phone) {
      toast.error('Contact name and phone are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/enquiries', {
        ...form,
        approximate_area: form.approximate_area === '' ? null : Number(form.approximate_area),
      });
      toast.success('Enquiry created');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create enquiry');
    } finally { setSaving(false); }
  };

  const convertToLead = async (id, name) => {
    if (!window.confirm(`Convert enquiry from ${name} into a lead?`)) return;
    try {
      const r = await api.post(`/enquiries/${id}/convert-to-lead`);
      toast.success(`Lead created (LED-…-${(r.data.lead_number || '').split('-').pop() || ''})`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Convert failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MessageCircle size={16} /> CRM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-sm text-gray-600 mt-1">Incoming enquiries — qualify and convert to leads.</p>
        </div>
        <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
          <Plus size={14} /> New Enquiry
        </button>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={e => setQuery(e.target.value)}
               placeholder="Search by number, name, phone, email, city…"
               className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Number</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Budget / Timeline</th>
              <th className="px-4 py-3 text-left">Classification</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="7" className="py-10 text-center text-gray-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="py-10 text-center text-gray-500">
                <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                No enquiries found.
              </td></tr>
            ) : filtered.map(r => (
              <tr key={r.enquiry_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button onClick={() => navigate(`/crm/enquiries/${r.enquiry_id}`)}
                          className="font-mono text-xs text-orange-600 hover:underline">
                    {r.enquiry_number || `#${r.enquiry_id}`}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{r.contact_person_name}{r.contact_surname ? ' ' + r.contact_surname : ''}</div>
                  {r.company_name && <div className="text-xs text-gray-500">{r.company_name}</div>}
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600">
                    {r.primary_phone && <span className="flex items-center gap-1"><Phone size={10} />{r.primary_phone}</span>}
                    {r.email && <span className="flex items-center gap-1"><Mail size={10} />{r.email}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{r.project_type || '—'}</div>
                  <div className="text-xs text-gray-500">{r.construction_type}</div>
                  {r.approximate_area && <div className="text-xs text-gray-500">{Number(r.approximate_area).toLocaleString('en-IN')} {r.area_unit || 'sqft'}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {(r.city || r.state) && (
                    <span className="flex items-center gap-1"><MapPin size={10} />{[r.city, r.state].filter(Boolean).join(', ')}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  <div>{r.budget_range || '—'}</div>
                  <div className="text-gray-500 flex items-center gap-1"><Calendar size={10} />{r.expected_timeline || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  {r.crm_classification ? (
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[r.crm_classification] || 'bg-gray-100 text-gray-700'}`}>
                      {r.crm_classification}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">unclassified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button title="View" onClick={() => navigate(`/crm/enquiries/${r.enquiry_id}`)}
                            className="p-1 text-gray-500 hover:text-orange-600"><Eye size={14} /></button>
                    <button title="Convert to Lead" onClick={() => convertToLead(r.enquiry_id, r.contact_person_name)}
                            className="p-1 text-gray-500 hover:text-emerald-600"><Target size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Enquiry</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
                  <input value={form.contact_person_name} onChange={e => setField('contact_person_name', e.target.value)}
                         required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Surname</label>
                  <input value={form.contact_surname} onChange={e => setField('contact_surname', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                  <input value={form.company_name} onChange={e => setField('company_name', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input value={form.primary_phone} onChange={e => setField('primary_phone', e.target.value)}
                         required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
                  <input value={form.whatsapp_number} onChange={e => setField('whatsapp_number', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={e => setField('city', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input value={form.state} onChange={e => setField('state', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Project Type</label>
                  <select value={form.project_type} onChange={e => setField('project_type', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>Residential</option><option>Commercial</option><option>Mixed Use</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Construction Type</label>
                  <select value={form.construction_type} onChange={e => setField('construction_type', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>New Construction</option><option>Renovation</option><option>Extension</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Approximate Area</label>
                  <input type="number" step="1" value={form.approximate_area} onChange={e => setField('approximate_area', e.target.value)}
                         placeholder="e.g. 2500" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Budget Range</label>
                  <select value={form.budget_range} onChange={e => setField('budget_range', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">—</option>
                    <option>Under 25 Lakhs</option>
                    <option>25 - 50 Lakhs</option>
                    <option>50 - 75 Lakhs</option>
                    <option>75 Lakhs - 1 Crore</option>
                    <option>1 - 2 Crore</option>
                    <option>Over 2 Crore</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Timeline</label>
                  <select value={form.expected_timeline} onChange={e => setField('expected_timeline', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">—</option>
                    <option>Immediate</option>
                    <option>1-3 months</option>
                    <option>3-6 months</option>
                    <option>6-12 months</option>
                    <option>Over 1 year</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesList;
