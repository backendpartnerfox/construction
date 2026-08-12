import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Package, Loader2, RotateCcw, CheckCircle2, Search } from 'lucide-react';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

// Sales flow: pick a Lead + Package, then swap item_choices per item.
// Backend persists via lead_requirement_package_item_choice_customise.
export default function PackageCustomize() {
  const [leads, setLeads] = useState([]);
  const [packages, setPackages] = useState([]);
  const [leadId, setLeadId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [rows, setRows] = useState([]);       // resolved items with choices
  const [savingItem, setSavingItem] = useState(null); // item_id currently saving
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  // Load leads and packages once
  useEffect(() => {
    (async () => {
      try {
        const [lRes, pRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/leads`),
          axios.get(`${API_BASE_URL}/packages`),
        ]);
        setLeads(lRes.data?.data || lRes.data || []);
        setPackages(pRes.data?.data || pRes.data || []);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load leads/packages');
      }
    })();
  }, []);

  const loadResolved = async () => {
    if (!leadId || !packageId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/lead_requirement_package_item_choice_customise/resolved/${leadId}/${packageId}`
      );
      setRows(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load items');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResolved(); /* eslint-disable-next-line */ }, [leadId, packageId]);

  const changeChoice = async (row, newChoiceId) => {
    setSavingItem(row.item_id);
    try {
      const isRevertToDefault = Number(newChoiceId) === row.default_choice_id;
      if (isRevertToDefault) {
        await axios.post(`${API_BASE_URL}/lead_requirement_package_item_choice_customise/revert`, {
          lead_id: Number(leadId),
          package_id: Number(packageId),
          item_id: row.item_id,
        });
      } else {
        await axios.post(`${API_BASE_URL}/lead_requirement_package_item_choice_customise/override`, {
          lead_id: Number(leadId),
          package_id: Number(packageId),
          item_id: row.item_id,
          item_choice_id: Number(newChoiceId),
        });
      }
      // Optimistic patch — no full reload for snappier UX
      setRows(prev => prev.map(r =>
        r.item_id === row.item_id
          ? { ...r, current_choice_id: Number(newChoiceId), is_customised: !isRevertToDefault }
          : r
      ));
      toast.success(isRevertToDefault ? 'Reverted to default' : 'Choice updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSavingItem(null);
    }
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      (r.item_name || '').toLowerCase().includes(s) ||
      (r.item_category || '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      const cat = r.item_category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalItems = rows.length;
  const customisedCount = rows.filter(r => r.is_customised).length;
  const selectedLead = leads.find(l => String(l.lead_id) === String(leadId));
  const selectedPackage = packages.find(p => String(p.id) === String(packageId));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Package size={16} /> Sales
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Customise Package</h1>
          <p className="text-sm text-gray-600 mt-1">
            Pick a lead + package, then swap item choices to tailor the quote.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">— Select a lead —</option>
              {leads.map(l => (
                <option key={l.lead_id} value={l.lead_id}>
                  {l.lead_number || `#${l.lead_id}`} — {l.primary_contact_name || l.lead_title || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Package</label>
            <select value={packageId} onChange={e => setPackageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">— Select a package —</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.package_name} — ₹{Number(p.total_price_per_sqft || 0).toLocaleString('en-IN')}/sqft
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedLead && selectedPackage && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
            <Tile label="Items in package" value={totalItems} />
            <Tile label="Customised" value={customisedCount} color="orange" />
            <Tile label="Package default" value={totalItems - customisedCount} color="emerald" />
          </div>
        )}
      </div>

      {leadId && packageId && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Filter by item name or category…"
                   value={q} onChange={e => setQ(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      )}

      {!leadId || !packageId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          Pick both a lead and a package to start customising.
        </div>
      ) : loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          {rows.length === 0
            ? <>This package has no items configured. Pick a different package or add items via the master data admin.</>
            : <>No items match &quot;{q}&quot;.</>}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {category} <span className="text-gray-400 ml-2">({items.length})</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map(row => {
                  const busy = savingItem === row.item_id;
                  return (
                    <li key={row.item_id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{row.item_name}</span>
                          {row.is_customised && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              CUSTOMISED
                            </span>
                          )}
                          {!row.is_customised && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              default
                            </span>
                          )}
                        </div>
                      </div>
                      <select
                        value={row.current_choice_id || ''}
                        onChange={e => changeChoice(row, e.target.value)}
                        disabled={busy}
                        className="w-72 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50"
                      >
                        {row.available_choices?.map(c => (
                          <option key={c.choice_option_id} value={c.choice_option_id}>
                            {c.display_name}
                            {c.brand ? ` (${c.brand})` : ''}
                            {c.is_default ? '  ★ default' : ''}
                          </option>
                        ))}
                      </select>
                      {row.is_customised && !busy && (
                        <button
                          onClick={() => changeChoice(row, row.default_choice_id)}
                          title="Revert to package default"
                          className="p-2 text-gray-400 hover:text-emerald-600"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      {busy && <Loader2 size={16} className="animate-spin text-orange-500" />}
                      {!busy && !row.is_customised && <CheckCircle2 size={16} className="text-gray-300" />}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Tile = ({ label, value, color = 'sky' }) => {
  const colors = {
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    orange:  'bg-orange-50 text-orange-700 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <div className={`rounded-md border p-3 ${colors[color]}`}>
      <div className="text-xs uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};
