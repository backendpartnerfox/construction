import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Search, BookOpen, ChevronDown, ChevronRight, X, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MODULE_LABELS = {
  earthwork:'Earthwork', structure:'Structure', masonry:'Masonry & Plastering',
  waterproofing:'Waterproofing', doors:'Doors', windows:'Windows',
  flooring:'Flooring', kitchen:'Kitchen', bathroom:'Bathroom',
  plumbing:'Plumbing', electrical:'Electrical', painting:'Painting',
  tanks:'Tanks & Water', railings:'Railings & Steel', misc:'Miscellaneous',
  lift:'Lift', commercial:'Commercial',
};

const RulebookEditor = () => {
  const [packages, setPackages] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirtyTiers, setDirtyTiers] = useState({});    // key = `${rule_id}:${package_id}`
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const loadGrid = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/quotations/rules/grid');
      setPackages(r.data.packages || []);
      setRules(r.data.rules || []);
    } catch (err) { toast.error('Failed to load rulebook'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadGrid(); }, [loadGrid]);

  // Merge live tier value with any pending edit
  const currentTier = (ruleId, pkgId) => {
    const key = `${ruleId}:${pkgId}`;
    if (dirtyTiers[key]) return { ...(rules.find(r => r.rule_id === ruleId)?.tiers?.[pkgId] || {}), ...dirtyTiers[key] };
    return rules.find(r => r.rule_id === ruleId)?.tiers?.[pkgId] || {};
  };

  const setTierField = (ruleId, pkgId, field, value) => {
    const key = `${ruleId}:${pkgId}`;
    setDirtyTiers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const isDirty = (ruleId, pkgId) => !!dirtyTiers[`${ruleId}:${pkgId}`];

  const saveAll = async () => {
    if (Object.keys(dirtyTiers).length === 0) return;
    setSaving(true);
    let ok = 0, fail = 0;
    for (const [key, patch] of Object.entries(dirtyTiers)) {
      const [rule_id, package_id] = key.split(':');
      try {
        await api.put(`/quotations/rules/${rule_id}/tiers/${package_id}`, patch);
        ok++;
      } catch (err) { console.error(err); fail++; }
    }
    setSaving(false);
    if (fail) toast.error(`Saved ${ok}, failed ${fail}`);
    else toast.success(`Saved ${ok} tier update${ok===1?'':'s'}`);
    setDirtyTiers({});
    loadGrid();
  };

  const revertAll = () => setDirtyTiers({});

  const filtered = useMemo(() => {
    let list = rules;
    if (moduleFilter) list = list.filter(r => r.module === moduleFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(r =>
        r.rule_id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.spec_text || '').toLowerCase().includes(q));
    }
    return list;
  }, [rules, query, moduleFilter]);

  const groupedByModule = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      if (!map.has(r.module)) map.set(r.module, []);
      map.get(r.module).push(r);
    }
    return map;
  }, [filtered]);

  const toggleModule = (m) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(m)) next.delete(m); else next.add(m);
    return next;
  });
  const expandAll   = () => setExpanded(new Set(groupedByModule.keys()));
  const collapseAll = () => setExpanded(new Set());

  const dirtyCount = Object.keys(dirtyTiers).length;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BookOpen size={16} /> Admin · Rulebook
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rulebook Editor</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {rules.length} rules across {new Set(rules.map(r => r.module)).size} modules · edit per-tier caps, brand options, overage rates. Changes flow into every future quotation's annexure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <>
              <span className="text-xs text-amber-700 font-medium">{dirtyCount} unsaved change{dirtyCount===1?'':'s'}</span>
              <button onClick={revertAll} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <X size={12}/> Revert
              </button>
              <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-medium rounded">
                <Save size={12}/> {saving ? 'Saving…' : `Save ${dirtyCount}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search rule id, title, spec text…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">All modules</option>
          {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={expandAll}   className="px-3 py-2 border border-gray-300 rounded text-xs">Expand all</button>
        <button onClick={collapseAll} className="px-3 py-2 border border-gray-300 rounded text-xs">Collapse all</button>
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 text-center">Loading rulebook…</div>
      ) : (
        <div className="space-y-2">
          {[...groupedByModule.entries()].map(([mod, rows]) => {
            const isOpen = expanded.has(mod);
            return (
              <div key={mod} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleModule(mod)}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left">
                  {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                  <span className="text-sm font-semibold text-gray-800 flex-1">{MODULE_LABELS[mod] || mod}</span>
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{rows.length}</span>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white text-gray-500 uppercase text-[10px]">
                        <tr>
                          <th className="border-b border-gray-200 px-2 py-2 text-left w-28">Rule</th>
                          <th className="border-b border-gray-200 px-2 py-2 text-left">Title / Spec</th>
                          {packages.map(p => (
                            <th key={p.id} className="border-b border-l border-gray-200 px-2 py-2 text-center min-w-[220px]">{p.package_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map(r => (
                          <tr key={r.rule_id} className="hover:bg-gray-50 align-top">
                            <td className="px-2 py-2 font-mono text-[11px] text-gray-700">
                              {r.rule_id}
                              <div className="text-[9px] text-gray-400 uppercase mt-0.5">{r.rule_type}</div>
                              <div className="text-[9px] text-gray-400">basis: {r.basis || '—'}</div>
                            </td>
                            <td className="px-2 py-2 text-gray-800">
                              <div className="font-medium">{r.title}</div>
                              {r.spec_text && <div className="text-[10px] text-gray-500 mt-0.5">{r.spec_text.slice(0, 140)}{r.spec_text.length > 140 ? '…' : ''}</div>}
                            </td>
                            {packages.map(p => {
                              const t = currentTier(r.rule_id, p.id);
                              const dirty = isDirty(r.rule_id, p.id);
                              return (
                                <td key={p.id} className={`border-l border-gray-100 px-2 py-2 ${dirty ? 'bg-amber-50' : ''}`}>
                                  <label className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
                                    <input type="checkbox" checked={t.included ?? true}
                                           onChange={e => setTierField(r.rule_id, p.id, 'included', e.target.checked)}/>
                                    included
                                  </label>
                                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                                    <input type="number" step="0.01" placeholder="value cap ₹"
                                           value={t.value_cap ?? ''}
                                           onChange={e => setTierField(r.rule_id, p.id, 'value_cap', e.target.value)}
                                           className="border border-gray-200 rounded px-1 py-0.5 text-right"/>
                                    <input type="number" step="0.01" placeholder="rate cap"
                                           value={t.rate_cap ?? ''}
                                           onChange={e => setTierField(r.rule_id, p.id, 'rate_cap', e.target.value)}
                                           className="border border-gray-200 rounded px-1 py-0.5 text-right"/>
                                    <input type="number" step="0.01" placeholder="overage rate"
                                           value={t.overage_rate ?? ''}
                                           onChange={e => setTierField(r.rule_id, p.id, 'overage_rate', e.target.value)}
                                           className="border border-gray-200 rounded px-1 py-0.5 text-right"/>
                                    <input type="text" placeholder="brand1, brand2"
                                           value={Array.isArray(t.brand_options) ? t.brand_options.join(', ') : (t.brand_options || '')}
                                           onChange={e => setTierField(r.rule_id, p.id, 'brand_options', e.target.value)}
                                           className="border border-gray-200 rounded px-1 py-0.5"/>
                                  </div>
                                  {dirty && <div className="text-[9px] text-amber-700 mt-1 flex items-center gap-1"><Check size={9}/>changed</div>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RulebookEditor;
