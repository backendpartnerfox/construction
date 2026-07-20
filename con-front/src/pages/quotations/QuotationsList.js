import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, IndianRupee, Eye, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatINR = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const STATUS_STYLE = {
  Draft:    'bg-gray-100 text-gray-700',
  Sent:     'bg-blue-50 text-blue-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  Expired:  'bg-amber-50 text-amber-700',
};

const QuotationsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/quotations');
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load quotations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (r.client_quotation_number || '').toLowerCase().includes(q) ||
      (r.client_name || '').toLowerCase().includes(q) ||
      (r.project_title || '').toLowerCase().includes(q) ||
      (r.package_type || '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText size={16} /> Quotations
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-600 mt-1">All Brick&amp;Bolt-style construction quotations you've saved.</p>
        </div>
        <button
          onClick={() => navigate('/quotations/create')}
          className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
          <Plus size={14} /> New Quotation
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by number, client, project, or package…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Number</th>
              <th className="px-4 py-3 text-left">Client / Project</th>
              <th className="px-4 py-3 text-left">Package</th>
              <th className="px-4 py-3 text-right">Built-up (sft)</th>
              <th className="px-4 py-3 text-right">Final ₹</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="8" className="py-10 text-center text-gray-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="py-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <div className="text-gray-500">No quotations yet.</div>
                <button onClick={() => navigate('/quotations/create')} className="mt-3 text-sm text-orange-600 hover:underline">Create your first one →</button>
              </td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.client_quotation_id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/quotations/${r.client_quotation_id}`)}>
                  <td className="px-4 py-3 font-mono text-xs">{r.client_quotation_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.client_name || '—'}</div>
                    {r.project_title && <div className="text-xs text-gray-500">{r.project_title}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.package_type}
                    <div className="text-[11px] text-gray-500">₹{formatINR(r.package_rate_per_sqft)}/SFT</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatINR(r.built_up_area)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 flex items-center justify-end">
                    <IndianRupee size={12} className="text-gray-400" />{formatINR(r.final_cost)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1"><Calendar size={12} className="text-gray-400" />{r.quotation_date ? new Date(r.quotation_date).toLocaleDateString('en-IN') : '—'}</div>
                    {r.valid_until && <div className="text-[11px] text-gray-400 ml-4">valid to {new Date(r.valid_until).toLocaleDateString('en-IN')}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                      {r.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400"><Eye size={14} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationsList;
