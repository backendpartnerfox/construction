import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Plus, Trash2, X, Search, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'addons',     label: 'Package Add-ons' },
  { key: 'site',       label: 'Site Conditions' },
  { key: 'qty',        label: 'Qty / SFT Ratios' },
];

const QuotationConfigEditor = () => {
  const [tab, setTab] = useState('addons');
  const [addons, setAddons] = useState([]);
  const [siteConditions, setSiteConditions] = useState([]);
  const [qtyRatios, setQtyRatios] = useState([]);
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(null);   // 'addon' | 'site' | 'qty' | null
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, sRes, qRes, iRes, pRes] = await Promise.all([
        api.get('/quotations/addons'),
        api.get('/quotations/site-conditions'),
        api.get('/quotations/qty-ratios'),
        api.get('/items'),
        api.get('/packages'),
      ]);
      setAddons(Array.isArray(aRes.data) ? aRes.data : []);
      setSiteConditions(Array.isArray(sRes.data) ? sRes.data : []);
      setQtyRatios(Array.isArray(qRes.data) ? qRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : (iRes.data.data || []));
      const pkgArr = Array.isArray(pRes.data) ? pRes.data : (pRes.data.data || []);
      pkgArr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setPackages(pkgArr);
    } catch (err) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = (kind) => {
    setEditingId(null);
    setForm(
      kind === 'addon' ? { name:'', description:'', unit:'unit', default_rate:'', inclusions:'', exclusions:'', package_id:'', sort_order: 100 }
      : kind === 'site' ? { code:'', question:'', standard_answer:'Yes', deviation_answer:'No', triggers_rule_id:'', default_impact:'', sort_order: 100 }
      : { item_id:'', package_id:'', qty_per_sqft:'', wastage_pct:'0', notes:'' }
    );
    setShowModal(kind);
  };

  const openEdit = (kind, row) => {
    setEditingId(row.id);
    setForm({ ...row });
    setShowModal(kind);
  };

  const closeModal = () => { setShowModal(null); setForm({}); setEditingId(null); };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const kind = showModal;
      if (kind === 'addon') {
        const body = {
          package_id: form.package_id === '' ? null : Number(form.package_id),
          name: form.name, description: form.description, unit: form.unit,
          default_rate: Number(form.default_rate),
          inclusions: form.inclusions, exclusions: form.exclusions,
          sort_order: Number(form.sort_order) || 100, is_active: form.is_active !== false,
        };
        if (editingId) await api.put(`/quotations/addons/${editingId}`, body);
        else           await api.post('/quotations/addons', body);
      } else if (kind === 'site') {
        const body = {
          code: form.code, question: form.question,
          standard_answer: form.standard_answer, deviation_answer: form.deviation_answer || null,
          triggers_rule_id: form.triggers_rule_id || null,
          default_impact: form.default_impact || null,
          sort_order: Number(form.sort_order) || 100,
        };
        if (editingId) await api.put(`/quotations/site-conditions/${editingId}`, body);
        else           await api.post('/quotations/site-conditions', body);
      } else if (kind === 'qty') {
        const body = {
          item_id: Number(form.item_id),
          package_id: form.package_id === '' ? null : Number(form.package_id),
          qty_per_sqft: Number(form.qty_per_sqft),
          wastage_pct: Number(form.wastage_pct) || 0,
          notes: form.notes || null,
        };
        if (editingId) await api.put(`/quotations/qty-ratios/${editingId}`, body);
        else           await api.post('/quotations/qty-ratios', body);
      }
      toast.success('Saved');
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (kind, id) => {
    if (!window.confirm('Delete this row? This cannot be undone.')) return;
    try {
      await api.delete(`/quotations/${kind === 'addon' ? 'addons' : kind === 'site' ? 'site-conditions' : 'qty-ratios'}/${id}`);
      toast.success('Deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const filteredAddons = addons.filter(a => !query || `${a.name} ${a.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  const filteredSite = siteConditions.filter(s => !query || `${s.code} ${s.question}`.toLowerCase().includes(query.toLowerCase()));
  const filteredQty = qtyRatios.filter(q => !query || `${q.item_name} ${q.item_category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Settings size={16} /> Admin · Quotation Config
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Quotation Configuration</h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit the reference data behind the quotation builder — add-ons catalog, site-conditions checklist, and material qty ratios per SFT.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setQuery(''); }}
                    className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === t.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {t.label}
              <span className="ml-2 text-[10px] text-gray-400">
                {t.key === 'addons' && addons.length}
                {t.key === 'site' && siteConditions.length}
                {t.key === 'qty' && qtyRatios.length}
              </span>
            </button>
          ))}
        </div>
        <div className="pb-2 flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
                   placeholder="Search…"
                   className="pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs w-52" />
          </div>
          <button onClick={() => openNew(tab === 'addons' ? 'addon' : tab === 'site' ? 'site' : 'qty')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded">
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Add-ons */}
          {tab === 'addons' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Package</th>
                    <th className="px-4 py-2 text-right w-20">Unit</th>
                    <th className="px-4 py-2 text-right w-32">Default Rate ₹</th>
                    <th className="px-4 py-2 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAddons.map(a => (
                    <tr key={a.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{a.name}</div>
                        {a.description && <div className="text-[11px] text-gray-500 mt-0.5">{a.description}</div>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{a.package_id ? packages.find(p => p.id === a.package_id)?.package_name : 'All packages'}</td>
                      <td className="px-4 py-2 text-right text-xs">{a.unit}</td>
                      <td className="px-4 py-2 text-right font-medium">₹{Number(a.default_rate).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit('addon', a)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">Edit</button>
                          <button onClick={() => remove('addon', a.id)} className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Site conditions */}
          {tab === 'site' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left w-24">Code</th>
                    <th className="px-4 py-2 text-left">Question</th>
                    <th className="px-4 py-2 text-left w-24">Standard</th>
                    <th className="px-4 py-2 text-left w-32">Triggers Rule</th>
                    <th className="px-4 py-2 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSite.map(s => (
                    <tr key={s.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
                      <td className="px-4 py-2 text-gray-800">
                        {s.question}
                        {s.default_impact && <div className="text-[11px] text-amber-800 mt-1"><AlertCircle size={11} className="inline mr-1" />{s.default_impact}</div>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700">{s.standard_answer}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-gray-500">{s.triggers_rule_id || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit('site', s)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">Edit</button>
                          <button onClick={() => remove('site', s.id)} className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Qty ratios */}
          {tab === 'qty' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-left w-32">Category</th>
                    <th className="px-4 py-2 text-left w-32">Package</th>
                    <th className="px-4 py-2 text-right w-32">Qty / SFT</th>
                    <th className="px-4 py-2 text-right w-24">Wastage %</th>
                    <th className="px-4 py-2 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQty.map(q => (
                    <tr key={q.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{q.item_name}</div>
                        {q.notes && <div className="text-[11px] text-gray-500 mt-0.5">{q.notes}</div>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{q.item_category}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{q.package_id ? packages.find(p => p.id === q.package_id)?.package_name : 'All'}</td>
                      <td className="px-4 py-2 text-right font-medium">{Number(q.qty_per_sqft).toFixed(4)} {q.item_unit}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{Number(q.wastage_pct).toFixed(2)}%</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit('qty', q)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">Edit</button>
                          <button onClick={() => remove('qty', q.id)} className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal — union form for all 3 kinds */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit' : 'New'} · {showModal === 'addon' ? 'Add-on' : showModal === 'site' ? 'Site Condition' : 'Qty Ratio'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4 text-sm">
              {showModal === 'addon' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                      <input value={form.name || ''} onChange={e => setField('name', e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                      <select value={form.unit || 'unit'} onChange={e => setField('unit', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="unit">unit</option><option value="per_floor">per_floor</option>
                        <option value="per_sft">per_sft</option><option value="per_running_ft">per_running_ft</option>
                        <option value="per_ltr">per_ltr</option><option value="per_cft">per_cft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Default Rate ₹ *</label>
                      <input type="number" step="0.01" value={form.default_rate || ''} onChange={e => setField('default_rate', e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Package (blank = all)</label>
                      <select value={form.package_id ?? ''} onChange={e => setField('package_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="">All packages</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.package_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
                      <input type="number" value={form.sort_order || 100} onChange={e => setField('sort_order', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <input value={form.description || ''} onChange={e => setField('description', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inclusions</label>
                      <textarea value={form.inclusions || ''} onChange={e => setField('inclusions', e.target.value)} rows="2" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Exclusions</label>
                      <textarea value={form.exclusions || ''} onChange={e => setField('exclusions', e.target.value)} rows="2" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                  </div>
                </>
              )}

              {showModal === 'site' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                      <input value={form.code || ''} onChange={e => setField('code', e.target.value)} required disabled={!!editingId}
                             placeholder="e.g. rock_terrain"
                             className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono disabled:bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
                      <input type="number" value={form.sort_order || 100} onChange={e => setField('sort_order', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
                      <input value={form.question || ''} onChange={e => setField('question', e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Standard Answer *</label>
                      <input value={form.standard_answer || ''} onChange={e => setField('standard_answer', e.target.value)} required placeholder="Yes / No / >3 Ft" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Deviation Answer</label>
                      <input value={form.deviation_answer || ''} onChange={e => setField('deviation_answer', e.target.value)} placeholder="Yes / No / <3 Ft" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Triggers Rule ID</label>
                      <input value={form.triggers_rule_id || ''} onChange={e => setField('triggers_rule_id', e.target.value)} placeholder="e.g. R-ERT-008" className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Default Impact</label>
                      <input value={form.default_impact || ''} onChange={e => setField('default_impact', e.target.value)} placeholder="Impact on cost when deviation is present" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                  </div>
                </>
              )}

              {showModal === 'qty' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Item *</label>
                      <select value={form.item_id || ''} onChange={e => setField('item_id', e.target.value)} required disabled={!!editingId} className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100">
                        <option value="">Select item…</option>
                        {items.map(it => <option key={it.item_id} value={it.item_id}>{it.item_name} · {it.item_category} ({it.item_unit})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Package (blank = all)</label>
                      <select value={form.package_id ?? ''} onChange={e => setField('package_id', e.target.value)} disabled={!!editingId} className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100">
                        <option value="">All packages</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.package_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Qty per SFT *</label>
                      <input type="number" step="0.0001" value={form.qty_per_sqft || ''} onChange={e => setField('qty_per_sqft', e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Wastage %</label>
                      <input type="number" step="0.01" value={form.wastage_pct || 0} onChange={e => setField('wastage_pct', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                      <input value={form.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="e.g. ~1200m per 1000 SFT (all circuits combined)" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationConfigEditor;
