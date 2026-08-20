import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Truck, Search, Loader2, Phone, Mail, MapPin, Building2 } from 'lucide-react';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

// Read-only vendor directory for Procurement / Sourcing / Dispatch. Editing
// lives under /admin/vendors (admin panel) and is gated by vendors.edit.
export default function Vendors() {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, tRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/vendors`),
        axios.get(`${API_BASE_URL}/vendor_type`).catch(() => ({ data: [] })),
      ]);
      const vArr = Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []);
      setRows(vArr);
      const tArr = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []);
      const map = {};
      tArr.forEach(t => { map[t.vendor_type_id || t.id] = t.type_name || t.name; });
      setTypes(map);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load vendors');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (typeFilter) out = out.filter(r => String(r.vendor_type_id) === String(typeFilter));
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(r =>
        (r.vendor_name || '').toLowerCase().includes(s) ||
        (r.contact_person || '').toLowerCase().includes(s) ||
        (r.email || '').toLowerCase().includes(s) ||
        (r.contact_number || '').includes(s)
      );
    }
    return out;
  }, [rows, q, typeFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Truck size={16}/> Procurement
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-600 mt-1">Approved vendor directory ({rows.length}). Contact vendors to raise new POs.</p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search name, contact, email, phone…"
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"/>
        </div>
        {Object.keys(types).length > 0 && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All vendor types</option>
            {Object.entries(types).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          <Truck size={40} className="mx-auto text-gray-300 mb-3"/>
          {rows.length === 0 ? 'No vendors registered yet.' : `No vendors match "${q}".`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v.vendor_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
                  <Building2 size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{v.vendor_name}</div>
                  {types[v.vendor_type_id] && (
                    <div className="text-xs text-gray-500 mt-0.5">{types[v.vendor_type_id]}</div>
                  )}
                  {v.contact_person && (
                    <div className="text-xs text-gray-600 mt-2">Contact: {v.contact_person}</div>
                  )}
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    {v.contact_number && (
                      <div className="inline-flex items-center gap-1">
                        <Phone size={11}/>
                        <a href={`tel:${v.contact_number}`} className="hover:text-orange-600">{v.contact_number}</a>
                      </div>
                    )}
                    {v.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={11}/>
                        <a href={`mailto:${v.email}`} className="hover:text-orange-600 truncate">{v.email}</a>
                      </div>
                    )}
                    {v.address && (
                      <div className="flex items-start gap-1 text-gray-500">
                        <MapPin size={11} className="mt-0.5 shrink-0"/>
                        <span className="line-clamp-2">{v.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
