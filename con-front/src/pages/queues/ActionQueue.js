import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Inbox, Loader2, MapPin, Phone, Building2, Target, ArrowRight,
  CheckCircle2, Play, X, Filter,
} from 'lucide-react';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

// Generic assignee queue — used by PM and Designer. Reads /my-queue which
// filters server-side by the authenticated user's roles.
export default function ActionQueue({ title = 'My Queue', subtitle = 'Actions assigned to your role', restrictActionTypes = null }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open'); // open | all
  const [statusUpdating, setStatusUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/opportunity_actions/my-queue?open=${filter === 'open' ? 1 : 0}`);
      let rows = data.data || [];
      if (restrictActionTypes) rows = rows.filter(r => restrictActionTypes.includes(r.action_type));
      setRows(rows);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load queue');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (id, status) => {
    setStatusUpdating(id);
    try {
      await axios.patch(`${API_BASE_URL}/opportunity_actions/${id}/status`, { status });
      toast.success(`Status → ${status.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setStatusUpdating(null); }
  };

  const stats = useMemo(() => ({
    pending:    rows.filter(r => r.status === 'Pending').length,
    inProgress: rows.filter(r => r.status === 'In_Progress').length,
    total:      rows.length,
  }), [rows]);

  const ACTION_ICONS = {
    site_visit:           MapPin,
    quotation:            Target,
    clarification:        Target,
    technical_discussion: Building2,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Inbox size={16}/> Queue
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Tile label="Pending"     value={stats.pending}    color="amber"/>
        <Tile label="In Progress" value={stats.inProgress} color="blue"/>
        <Tile label="Total shown" value={stats.total}      color="gray"/>
      </div>

      <div className="flex gap-2 mb-4">
        {['open','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm rounded-md capitalize border ${filter === f ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
            <Filter className="inline-block mr-1" size={12}/> {f === 'open' ? 'Open only' : 'All statuses'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
            {filter === 'open' ? 'No open actions in your queue. Nice!' : 'No actions yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map(r => {
              const Icon = ACTION_ICONS[r.action_type] || Target;
              const busy = statusUpdating === r.action_id;
              return (
                <li key={r.action_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200"><Icon size={18}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-orange-600">{r.action_number}</span>
                        <span className="font-semibold text-gray-900">{r.title}</span>
                        <StatusPill status={r.status}/>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {r.action_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">{r.contact_person_name || 'Unknown'}</span>
                        {r.company_name && <span className="text-gray-500"> · {r.company_name}</span>}
                        {r.enquiry_number && <span className="text-gray-400 text-xs ml-2">[{r.enquiry_number}]</span>}
                      </div>
                      {r.description && <div className="mt-1 text-sm text-gray-600 italic">"{r.description}"</div>}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {r.primary_phone && <span className="inline-flex items-center gap-1"><Phone size={11}/>{r.primary_phone}</span>}
                        {r.enquiry_city && <span className="inline-flex items-center gap-1"><MapPin size={11}/>{r.enquiry_city}</span>}
                        <span>Created {r.created_at && new Date(r.created_at).toLocaleString()}</span>
                        {r.created_by_name && <span>by {r.created_by_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <button onClick={() => navigate(`/crm/opportunities/${r.enquiry_id}`)}
                              className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline">
                        Open opportunity <ArrowRight size={11}/>
                      </button>
                      <div className="flex gap-1">
                        {r.status === 'Pending' && (
                          <button onClick={() => setStatus(r.action_id, 'In_Progress')} disabled={busy}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-40">
                            <Play size={10}/> Start
                          </button>
                        )}
                        {(r.status === 'Pending' || r.status === 'In_Progress') && (
                          <>
                            <button onClick={() => setStatus(r.action_id, 'Completed')} disabled={busy}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                              <CheckCircle2 size={10}/> Complete
                            </button>
                            <button onClick={() => setStatus(r.action_id, 'Cancelled')} disabled={busy}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40">
                              <X size={10}/> Cancel
                            </button>
                          </>
                        )}
                        {busy && <Loader2 className="animate-spin text-orange-500" size={14}/>}
                      </div>
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
    Pending:     'bg-amber-100 text-amber-700',
    In_Progress: 'bg-blue-100 text-blue-700',
    Completed:   'bg-emerald-100 text-emerald-700',
    Cancelled:   'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CLS[status] || 'bg-gray-100'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function Tile({ label, value, color }) {
  const cls = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
    gray:  'bg-gray-50 text-gray-700 border-gray-200',
  }[color];
  return (
    <div className={`rounded-lg p-4 border ${cls}`}>
      <div className="text-xs uppercase font-medium">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
