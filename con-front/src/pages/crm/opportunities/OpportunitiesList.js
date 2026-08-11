import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Target, Search, Loader2, Phone, Mail, MapPin, IndianRupee, User, X } from 'lucide-react';
import { useAuth } from '../../../utils/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

// Qualified enquiries flagged as opportunities. Both CRM and Sales can see
// this list; Sales typically converts to a lead from here (existing
// enquiry->lead flow still applies).
export default function OpportunitiesList() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('opportunities.edit');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/enquiries/opportunities/list`);
      setRows(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const unmark = async (enquiryId, name) => {
    if (!window.confirm(`Remove ${name} from Opportunities?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/enquiries/${enquiryId}/unmark-opportunity`);
      toast.success('Un-marked opportunity');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to un-mark');
    }
  };

  const filtered = rows.filter(r => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (r.contact_person_name || '').toLowerCase().includes(s)
        || (r.company_name || '').toLowerCase().includes(s)
        || (r.enquiry_number || '').toLowerCase().includes(s)
        || (r.primary_phone || '').includes(s);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Target size={16} /> CRM
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-600 mt-1">Qualified enquiries ready for Sales pickup.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatTile label="Total opportunities" value={rows.length} color="orange" />
        <StatTile label="With phone contact"  value={rows.filter(r => r.primary_phone).length} color="emerald" />
        <StatTile label="With budget info"    value={rows.filter(r => r.budget_range).length} color="sky" />
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, company, number, phone…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Target size={40} className="mx-auto text-gray-300 mb-3" />
            {rows.length === 0
              ? <>No opportunities yet. Mark an enquiry as an opportunity from the <strong>Enquiries</strong> page.</>
              : <>No opportunities match &quot;{q}&quot;.</>}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Enquiry #</Th><Th>Contact</Th><Th>Project</Th><Th>Location</Th><Th>Budget / Timeline</Th><Th>Marked</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.enquiry_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-orange-600">{r.enquiry_number || `ENQ-${r.enquiry_id}`}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.contact_person_name || '—'}</div>
                    {r.company_name && <div className="text-xs text-gray-500">{r.company_name}</div>}
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {r.primary_phone && <div className="flex items-center gap-1"><Phone size={11}/> {r.primary_phone}</div>}
                      {r.email && <div className="flex items-center gap-1"><Mail size={11}/> {r.email}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{r.project_type || '—'}</div>
                    {r.construction_type && <div className="text-xs text-gray-500">{r.construction_type}</div>}
                    {r.approximate_area && <div className="text-xs text-gray-500">{r.approximate_area} {r.area_unit || 'sqft'}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(r.city || r.state)
                      ? <div className="flex items-start gap-1"><MapPin size={11} className="mt-0.5"/>{[r.city, r.state].filter(Boolean).join(', ')}</div>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.budget_range && <div className="flex items-center gap-1"><IndianRupee size={11}/>{r.budget_range}</div>}
                    {r.expected_timeline && <div className="text-xs text-gray-500 mt-1">{r.expected_timeline}</div>}
                    {!r.budget_range && !r.expected_timeline && '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.opportunity_marked_at && new Date(r.opportunity_marked_at).toLocaleDateString()}
                    {(r.marked_by_first || r.marked_by_last) && (
                      <div className="flex items-center gap-1 mt-0.5"><User size={10}/>{[r.marked_by_first, r.marked_by_last].filter(Boolean).join(' ')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <button
                        onClick={() => unmark(r.enquiry_id, r.contact_person_name || 'this enquiry')}
                        title="Remove from opportunities"
                        className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 text-xs"
                      >
                        <X size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const Th = ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>;

const StatTile = ({ label, value, color }) => {
  const colors = {
    orange:  'bg-orange-50 text-orange-700 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky:     'bg-sky-50 text-sky-700 border-sky-100',
  };
  return (
    <div className={`rounded-lg p-4 border ${colors[color]}`}>
      <div className="text-sm">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
};
