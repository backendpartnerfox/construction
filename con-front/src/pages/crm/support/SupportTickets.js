import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LifeBuoy, Plus, Search, Loader2, X, Save, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../../utils/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

const STATUS_BADGE = {
  Open:                'bg-red-50 text-red-700 border-red-200',
  In_Progress:         'bg-amber-50 text-amber-700 border-amber-200',
  Waiting_On_Customer: 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved:            'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed:              'bg-gray-100 text-gray-600 border-gray-200',
};
const PRIORITY_BADGE = {
  Low:    'bg-gray-100 text-gray-600',
  Medium: 'bg-sky-100 text-sky-700',
  High:   'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

const emptyForm = {
  subject: '', description: '', priority: 'Medium', category: '',
  client_id: '', enquiry_id: '', project_id: '',
  contact_name: '', contact_phone: '', contact_email: '',
};

export default function SupportTickets() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('support.edit');

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/support_tickets${statusFilter ? `?status=${statusFilter}` : ''}`),
        axios.get(`${API_BASE_URL}/support_tickets/stats/summary`),
      ]);
      setRows(listRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (row) => {
    setEditingId(row.ticket_id);
    setForm({
      subject: row.subject || '',
      description: row.description || '',
      priority: row.priority || 'Medium',
      status: row.status || 'Open',
      category: row.category || '',
      client_id: row.client_id || '',
      enquiry_id: row.enquiry_id || '',
      project_id: row.project_id || '',
      contact_name: row.contact_name || '',
      contact_phone: row.contact_phone || '',
      contact_email: row.contact_email || '',
      resolution: row.resolution || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) { toast.error('Subject is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      // Strip empty-string ids that would break FKs
      ['client_id','enquiry_id','project_id'].forEach(k => {
        if (payload[k] === '' || payload[k] == null) delete payload[k]; else payload[k] = Number(payload[k]);
      });
      if (editingId) await axios.put(`${API_BASE_URL}/support_tickets/${editingId}`, payload);
      else            await axios.post(`${API_BASE_URL}/support_tickets`, payload);
      toast.success(editingId ? 'Ticket updated' : 'Ticket created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      (r.ticket_number||'').toLowerCase().includes(s) ||
      (r.subject||'').toLowerCase().includes(s) ||
      (r.client_name||'').toLowerCase().includes(s) ||
      (r.contact_name||'').toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <LifeBuoy size={16} /> CRM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-600 mt-1">Log and track customer support issues.</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
            <Plus size={16}/> New Ticket
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatTile label="Open"        value={stats.open || 0}        Icon={AlertCircle}  color="red" onClick={() => setStatusFilter('Open')} active={statusFilter === 'Open'}/>
        <StatTile label="In Progress" value={stats.in_progress || 0} Icon={Clock}        color="amber" onClick={() => setStatusFilter('In_Progress')} active={statusFilter === 'In_Progress'}/>
        <StatTile label="Waiting"     value={stats.waiting || 0}     Icon={Clock}        color="sky"   onClick={() => setStatusFilter('Waiting_On_Customer')} active={statusFilter === 'Waiting_On_Customer'}/>
        <StatTile label="Resolved"    value={stats.resolved || 0}    Icon={CheckCircle2} color="emerald" onClick={() => setStatusFilter('Resolved')} active={statusFilter === 'Resolved'}/>
        <StatTile label="Closed"      value={stats.closed || 0}      Icon={XCircle}      color="gray"  onClick={() => setStatusFilter('Closed')} active={statusFilter === 'Closed'}/>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search ticket number, subject, client…"
                 value={q} onChange={e => setQ(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"/>
        </div>
        {statusFilter && (
          <button onClick={() => setStatusFilter('')} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
            <X size={12}/> Clear status filter ({statusFilter})
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <LifeBuoy size={40} className="mx-auto text-gray-300 mb-3" />
            {rows.length === 0
              ? <>No support tickets yet. Create one with <strong>New Ticket</strong>.</>
              : <>No tickets match &quot;{q}&quot;.</>}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Ticket #</Th><Th>Subject</Th><Th>Priority</Th><Th>Status</Th><Th>Client / Contact</Th><Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ticket_id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openEdit(r)}>
                  <td className="px-4 py-3 font-mono text-xs text-orange-600">{r.ticket_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.subject}</div>
                    {r.category && <div className="text-xs text-gray-500">{r.category}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${PRIORITY_BADGE[r.priority] || 'bg-gray-100'}`}>{r.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>{r.status?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{r.client_name || r.contact_name || '—'}</div>
                    {r.contact_phone && <div className="text-xs text-gray-500">{r.contact_phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.created_at && new Date(r.created_at).toLocaleDateString()}
                    {r.created_by_name && <div>{r.created_by_name}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? `Edit Ticket #${editingId}` : 'New Support Ticket'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <Field label="Subject *" value={form.subject} onChange={v => setForm(f => ({...f, subject: v}))} />
              <Field label="Description" value={form.description} onChange={v => setForm(f => ({...f, description: v}))} textarea />

              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Priority" value={form.priority} onChange={v => setForm(f => ({...f, priority: v}))}
                             options={['Low','Medium','High','Urgent']} />
                <SelectField label="Status" value={form.status || 'Open'} onChange={v => setForm(f => ({...f, status: v}))}
                             options={['Open','In_Progress','Waiting_On_Customer','Resolved','Closed']} />
              </div>
              <Field label="Category" value={form.category} onChange={v => setForm(f => ({...f, category: v}))}
                     placeholder="Billing, Delivery, Quality, ..." />

              <div className="grid grid-cols-3 gap-3">
                <Field label="Client ID"   value={form.client_id}   onChange={v => setForm(f => ({...f, client_id: v}))}   type="number" />
                <Field label="Enquiry ID"  value={form.enquiry_id}  onChange={v => setForm(f => ({...f, enquiry_id: v}))}  type="number" />
                <Field label="Project ID"  value={form.project_id}  onChange={v => setForm(f => ({...f, project_id: v}))}  type="number" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Contact Name"  value={form.contact_name}  onChange={v => setForm(f => ({...f, contact_name: v}))}/>
                <Field label="Contact Phone" value={form.contact_phone} onChange={v => setForm(f => ({...f, contact_phone: v}))}/>
                <Field label="Contact Email" value={form.contact_email} onChange={v => setForm(f => ({...f, contact_email: v}))} type="email"/>
              </div>

              {editingId && (
                <Field label="Resolution" value={form.resolution || ''} onChange={v => setForm(f => ({...f, resolution: v}))} textarea />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} {editingId ? 'Save Changes' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>;

const StatTile = ({ label, value, Icon, color, onClick, active }) => {
  const colors = {
    red:     'bg-red-50 text-red-700 border-red-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray:    'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <button onClick={onClick}
            className={`flex items-center gap-3 p-4 rounded-lg border text-left transition ${colors[color]} ${active ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}>
      <Icon size={20} className="opacity-70"/>
      <div>
        <div className="text-xs uppercase font-medium">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </button>
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
      {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  </div>
);
