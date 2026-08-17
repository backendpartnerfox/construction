import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, Target, MapPin, Phone, Mail, Building2,
  Calendar, FileText, Users, MessageCircle, CheckCircle2, Clock,
  Video, X,
} from 'lucide-react';
import { useAuth } from '../../../utils/AuthContext';
import CreateQuotation from '../../quotations/CreateQuotation';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

const FLOOR_OPTIONS = [
  'G','G+1','G+2','G+3','G+4','G+5',
  'Stilt+G','Stilt+G+1','Stilt+G+2','Stilt+G+3','Stilt+G+4',
  'Penthouse',
];

// Action-type -> icon + colour + one-line label. Buttons are grouped by
// intended assignee so Sales can see at a glance what routing they're
// triggering.
const ACTIONS = [
  { key: 'site_visit',           label: 'Site Visit',          desc: 'Assigned to Project Manager',    Icon: MapPin,        color: 'blue',    role: 'project_manager' },
  { key: 'quotation',            label: 'Quotation',           desc: 'Prepare quotation',              Icon: FileText,      color: 'orange',  role: 'sales' },
  { key: 'clarification',        label: 'Clarification',       desc: 'Assigned to Designer',           Icon: MessageCircle, color: 'purple',  role: 'designer' },
  { key: 'technical_discussion', label: 'Technical Discussion',desc: 'Assigned to Project Manager',    Icon: Users,         color: 'teal',    role: 'project_manager' },
];

const COLOR_CLS = {
  blue:   'border-blue-300 text-blue-700 hover:bg-blue-50',
  orange: 'border-orange-300 text-orange-700 hover:bg-orange-50',
  purple: 'border-purple-300 text-purple-700 hover:bg-purple-50',
  teal:   'border-teal-300 text-teal-700 hover:bg-teal-50',
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canAct = hasPermission('opportunity_actions.edit');

  const canMeet = hasPermission('meetings.edit');
  const [enq, setEnq] = useState(null);
  const [actions, setActions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingForm, setMeetingForm] = useState(null); // { kind: 'virtual' | 'inperson' } | null
  const [meetingFields, setMeetingFields] = useState({ title: '', date: '', location: '', to_be_included: '' });
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);
  const [openAction, setOpenAction] = useState(null); // key of currently expanded action form
  const [actionForm, setActionForm] = useState({ description: '', scheduled_at: '', package_id: '' });
  const [creating, setCreating] = useState(false);
  const [plot, setPlot] = useState({
    plot_length: '', plot_width: '', plot_dimensions_unit: 'ft',
    plot_area_sqyards: '', floor_configuration: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Meetings fetch is optional — some roles won't have meetings.view. If it
      // 403s we swallow and show 'no permission' state instead of failing the page.
      const [eRes, aRes, pRes, mRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/enquiries/${id}`),
        axios.get(`${API_BASE_URL}/opportunity_actions/enquiry/${id}`),
        axios.get(`${API_BASE_URL}/packages`),
        axios.get(`${API_BASE_URL}/meetings/entity/enquiry/${id}`).catch(() => ({ data: { data: [] } })),
      ]);
      const e = eRes.data?.data || eRes.data;
      setEnq(e);
      setPlot({
        plot_length: e?.plot_length ?? '',
        plot_width: e?.plot_width ?? '',
        plot_dimensions_unit: e?.plot_dimensions_unit || 'ft',
        plot_area_sqyards: e?.plot_area_sqyards ?? '',
        floor_configuration: e?.floor_configuration || '',
      });
      setActions(aRes.data?.data || []);
      setPackages(pRes.data?.data || pRes.data || []);
      setMeetings(mRes.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-derive sq yards from L × W when both are set (1 sqft ≈ 1/9 sqyd)
  const derivedSqyards = () => {
    const L = parseFloat(plot.plot_length);
    const W = parseFloat(plot.plot_width);
    if (!L || !W) return '';
    const sqft = L * W;
    return (sqft / 9).toFixed(2);
  };

  const savePlot = async () => {
    setSavingPlot(true);
    try {
      const payload = {
        plot_length: plot.plot_length ? Number(plot.plot_length) : null,
        plot_width: plot.plot_width ? Number(plot.plot_width) : null,
        plot_dimensions_unit: plot.plot_dimensions_unit || null,
        plot_area_sqyards: plot.plot_area_sqyards ? Number(plot.plot_area_sqyards) : null,
        floor_configuration: plot.floor_configuration || null,
      };
      await axios.patch(`${API_BASE_URL}/enquiries/${id}/plot`, payload);
      toast.success('Plot info saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSavingPlot(false); }
  };

  const submitAction = async (actionType) => {
    // Quotation must include a package
    if (actionType === 'quotation' && !actionForm.package_id) {
      toast.error('Please pick a package for the quotation');
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/opportunity_actions`, {
        enquiry_id: Number(id),
        action_type: actionType,
        description: actionForm.description || null,
        scheduled_at: actionForm.scheduled_at || null,
        package_id: actionForm.package_id ? Number(actionForm.package_id) : null,
      });
      const meta = ACTIONS.find(a => a.key === actionType);
      toast.success(`${meta?.label} created — assigned to ${meta?.role.replace('_', ' ')}`);
      setOpenAction(null);
      setActionForm({ description: '', scheduled_at: '', package_id: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create action');
    } finally { setCreating(false); }
  };

  const openMeetingForm = (kind) => {
    setMeetingForm({ kind });
    setMeetingFields({
      title: kind === 'virtual' ? 'Virtual meet with client' : 'Site / office meeting',
      date: '',
      location: kind === 'virtual' ? 'Google Meet / Zoom link TBD' : '',
      to_be_included: '',
    });
  };

  const scheduleMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm) return;
    if (!meetingFields.date) { toast.error('Please pick a date/time'); return; }
    setSavingMeeting(true);
    try {
      await axios.post(`${API_BASE_URL}/meetings`, {
        type_of_meeting:      meetingForm.kind === 'virtual' ? 'Virtual Meet' : 'In-Person Meeting',
        title:                meetingFields.title,
        date:                 meetingFields.date,
        location:             meetingFields.location || null,
        to_be_included:       meetingFields.to_be_included || null,
        related_entity_type:  'enquiry',
        related_entity_id:    Number(id),
        status:               'Scheduled',
      });
      toast.success('Meeting scheduled — visible to CRM, Sales & Opportunity');
      setMeetingForm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule meeting');
    } finally { setSavingMeeting(false); }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
  }
  if (!enq) {
    return <div className="p-12 text-center text-gray-500">Enquiry not found.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/crm/opportunities')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14}/> Back to Opportunities
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Target size={16}/> Opportunity
              <span className="font-mono text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
                {enq.enquiry_number || `ENQ-${enq.enquiry_id}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{enq.contact_person_name || 'Unnamed'}</h1>
            {enq.company_name && <p className="text-gray-600">{enq.company_name}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              {enq.primary_phone && <span className="inline-flex items-center gap-1"><Phone size={12}/>{enq.primary_phone}</span>}
              {enq.email && <span className="inline-flex items-center gap-1"><Mail size={12}/>{enq.email}</span>}
              {(enq.city || enq.state) && <span className="inline-flex items-center gap-1"><MapPin size={12}/>{[enq.city, enq.state].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{enq.project_type} • {enq.construction_type}</div>
            {enq.budget_range && <div className="mt-1">Budget: {enq.budget_range}</div>}
            {enq.expected_timeline && <div>Timeline: {enq.expected_timeline}</div>}
          </div>
        </div>
      </div>

      {/* Plot info form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18}/> Plot Information
          </h2>
          <button onClick={savePlot} disabled={savingPlot}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md disabled:opacity-50">
            {savingPlot ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Save Plot Info
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plot Length</label>
            <input type="number" step="0.01" value={plot.plot_length}
                   onChange={e => setPlot(p => ({...p, plot_length: e.target.value}))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="40"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plot Width</label>
            <input type="number" step="0.01" value={plot.plot_width}
                   onChange={e => setPlot(p => ({...p, plot_width: e.target.value}))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="30"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <select value={plot.plot_dimensions_unit}
                    onChange={e => setPlot(p => ({...p, plot_dimensions_unit: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="ft">ft</option>
              <option value="m">m</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Area (sq. yards)</label>
            <div className="flex gap-1">
              <input type="number" step="0.01" value={plot.plot_area_sqyards}
                     onChange={e => setPlot(p => ({...p, plot_area_sqyards: e.target.value}))}
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Auto"/>
              {plot.plot_length && plot.plot_width && plot.plot_dimensions_unit === 'ft' && (
                <button type="button" onClick={() => setPlot(p => ({...p, plot_area_sqyards: derivedSqyards()}))}
                        title="Auto-fill from L × W" className="px-2 text-xs text-blue-600 hover:underline">
                  = {derivedSqyards()}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Floor Configuration</label>
            <select value={plot.floor_configuration}
                    onChange={e => setPlot(p => ({...p, floor_configuration: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">— Select —</option>
              {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        {!canAct && (
          <div className="text-sm text-gray-500 italic mb-4">You don't have permission to create actions.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map(a => (
            <button
              key={a.key}
              disabled={!canAct}
              onClick={() => {
                setActionForm({ description: '', scheduled_at: '', package_id: '' });
                setOpenAction(openAction === a.key ? null : a.key);
              }}
              className={`p-4 rounded-lg border-2 bg-white text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${COLOR_CLS[a.color]} ${openAction === a.key ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <a.Icon size={18}/>
                <span className="font-semibold">{a.label}</span>
              </div>
              <div className="text-xs opacity-75">{a.desc}</div>
            </button>
          ))}
        </div>

        {/* Quotation action gets the full embedded CreateQuotation form so
            Sales fills floor breakup, add-ons, live preview inline. On save
            we also log an opportunity_action for traceability. */}
        {openAction === 'quotation' && canAct && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">📄 Build Quotation for this Opportunity</div>
              <button type="button" onClick={() => setOpenAction(null)}
                      className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
            </div>
            <CreateQuotation
              embedded
              enquiryId={Number(id)}
              defaultPackageId={enq?.package_id || null}
              onSaved={async (saved) => {
                try {
                  // Log the action so it appears in the Action History
                  await axios.post(`${API_BASE_URL}/opportunity_actions`, {
                    enquiry_id: Number(id),
                    action_type: 'quotation',
                    package_id: enq?.package_id || null,
                    description: `Quotation ${saved.number} created (₹${Number(saved.final_cost || 0).toLocaleString('en-IN')})`,
                    status: 'Completed',
                  });
                } catch (err) {
                  console.warn('Failed to log opportunity_action for quotation:', err.message);
                }
                setOpenAction(null);
                load();
              }}
            />
          </div>
        )}

        {/* Non-quotation actions still get the simple notes/schedule form */}
        {openAction && openAction !== 'quotation' && canAct && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes for the assignee</label>
              <textarea rows={3} value={actionForm.description}
                        onChange={e => setActionForm(f => ({...f, description: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="What should they focus on?"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Schedule for (optional)</label>
                <input type="datetime-local" value={actionForm.scheduled_at}
                       onChange={e => setActionForm(f => ({...f, scheduled_at: e.target.value}))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
              </div>
              <div className="flex items-end gap-2 justify-end">
                <button type="button" onClick={() => setOpenAction(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button onClick={() => submitAction(openAction)} disabled={creating}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-50">
                  {creating ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meetings for this opportunity — Designer can schedule Virtual Meet
          or In-Person Meeting; visible to CRM/Sales/PM/Admin via meetings.view. */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={18}/> Meetings ({meetings.length})
          </h2>
          {canMeet && (
            <div className="flex gap-2">
              <button onClick={() => openMeetingForm('virtual')}
                      className="inline-flex items-center gap-1 px-3 py-2 border-2 border-sky-300 text-sky-700 hover:bg-sky-50 text-sm rounded-md">
                <Video size={14}/> Schedule Virtual Meet
              </button>
              <button onClick={() => openMeetingForm('inperson')}
                      className="inline-flex items-center gap-1 px-3 py-2 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm rounded-md">
                <MapPin size={14}/> Schedule Meeting
              </button>
            </div>
          )}
        </div>

        {meetingForm && (
          <form onSubmit={scheduleMeeting} className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                {meetingForm.kind === 'virtual' ? '🎥 Virtual Meet' : '📍 In-Person Meeting'}
              </div>
              <button type="button" onClick={() => setMeetingForm(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input type="text" value={meetingFields.title}
                       onChange={e => setMeetingFields(f => ({...f, title: e.target.value}))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">When *</label>
                <input type="datetime-local" required value={meetingFields.date}
                       onChange={e => setMeetingFields(f => ({...f, date: e.target.value}))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {meetingForm.kind === 'virtual' ? 'Meeting link / platform' : 'Location'}
              </label>
              <input type="text" value={meetingFields.location}
                     onChange={e => setMeetingFields(f => ({...f, location: e.target.value}))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                     placeholder={meetingForm.kind === 'virtual' ? 'https://meet.google.com/…' : 'Site address or office'}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
              <input type="text" value={meetingFields.to_be_included}
                     onChange={e => setMeetingFields(f => ({...f, to_be_included: e.target.value}))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                     placeholder="Client name, Sales owner, PM…"/>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMeetingForm(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
              <button type="submit" disabled={savingMeeting}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-50">
                {savingMeeting ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Schedule
              </button>
            </div>
          </form>
        )}

        {meetings.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No meetings scheduled yet for this opportunity.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {meetings.map(m => {
              const isVirtual = (m.type_of_meeting || '').toLowerCase().includes('virtual');
              const Icon = isVirtual ? Video : MapPin;
              const iconCls = isVirtual ? 'text-sky-600 border-sky-200 bg-sky-50' : 'text-emerald-600 border-emerald-200 bg-emerald-50';
              return (
                <li key={m.id} className="py-3 flex items-start gap-3">
                  <div className={`p-2 rounded-md border ${iconCls}`}><Icon size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{m.title || m.type_of_meeting || 'Meeting'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{m.type_of_meeting}</span>
                      {m.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{m.status}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                      {m.date && <span className="inline-flex items-center gap-1"><Clock size={11}/>{new Date(m.date).toLocaleString()}</span>}
                      {m.location && <span className="inline-flex items-center gap-1"><MapPin size={11}/>{m.location}</span>}
                      {m.to_be_included && <span className="inline-flex items-center gap-1"><Users size={11}/>{m.to_be_included}</span>}
                    </div>
                    {m.notes && <div className="mt-1 text-xs text-gray-500 italic">{m.notes}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Action history */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Action History ({actions.length})</h2>
        {actions.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No actions yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {actions.map(a => {
              const meta = ACTIONS.find(x => x.key === a.action_type);
              const Icon = meta?.Icon || FileText;
              return (
                <li key={a.action_id} className="py-3 flex items-start gap-3">
                  <div className={`p-2 rounded-md border ${COLOR_CLS[meta?.color || 'blue']}`}>
                    <Icon size={16}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-orange-600">{a.action_number}</span>
                      <span className="font-medium text-gray-900">{a.title}</span>
                      <StatusPill status={a.status}/>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">→ {a.assigned_to_role.replace('_', ' ')}</span>
                      {a.package_name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                          📦 {a.package_name}
                          {a.package_rate && <span className="ml-1 opacity-75">₹{Number(a.package_rate).toLocaleString('en-IN')}/sqft</span>}
                        </span>
                      )}
                    </div>
                    {a.description && <div className="text-sm text-gray-600 mt-1">{a.description}</div>}
                    {a.outcome && <div className="text-sm text-emerald-700 mt-1 italic">Outcome: {a.outcome}</div>}
                    <div className="text-[10px] text-gray-400 mt-1 flex gap-3">
                      <span>Created {a.created_at && new Date(a.created_at).toLocaleString()}</span>
                      {a.created_by_name && <span>by {a.created_by_name}</span>}
                      {a.completed_at && <span>Completed {new Date(a.completed_at).toLocaleString()}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const CLS = {
    Pending:      'bg-amber-100 text-amber-700',
    In_Progress:  'bg-blue-100 text-blue-700',
    Completed:    'bg-emerald-100 text-emerald-700',
    Cancelled:    'bg-gray-100 text-gray-500',
  };
  const Icon = status === 'Completed' ? CheckCircle2 : Clock;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${CLS[status] || 'bg-gray-100'}`}>
      <Icon size={10}/> {status?.replace('_', ' ')}
    </span>
  );
}
