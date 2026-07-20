import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, Calculator, FileText, IndianRupee
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UNIT_TYPES  = ['1bhk', '2bhk', '3bhk', '4bhk', 'rk', 'studio', 'carParking', 'passage', 'terrace', 'headroom', 'other'];
const CATEGORIES  = [
  { value: 'built_up', label: 'Built-up (main rate)' },
  { value: 'stilt',    label: 'Stilt / Parking rate' },
  { value: 'terrace',  label: 'Terrace (65% built-up)' },
  { value: 'headroom', label: 'Headroom (free)' },
];

const formatINR = (n, dec = 2) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const emptyFloor = (fn = 0) => ({
  floor_number: fn, floor_label: '', unit_type: '3bhk',
  units_count: 1, area_sqft: '', area_category: 'built_up', rate_per_sqft: '',
});

const CreateQuotation = () => {
  const navigate = useNavigate();

  // Reference data
  const [packages, setPackages] = useState([]);
  const [clients, setClients]   = useState([]);
  const [addons, setAddons]     = useState([]);
  const [siteCatalog, setSiteCatalog] = useState([]);
  const [siteAnswers, setSiteAnswers] = useState({});   // {[condition_id]: 'Yes'/'No'/actual text}

  // Form state
  const [clientId, setClientId]           = useState('');
  const [packageId, setPackageId]         = useState('');
  const [projectTitle, setProjectTitle]   = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil]       = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [archFeePct, setArchFeePct]       = useState(2.0);
  const [otherFeePct, setOtherFeePct]     = useState(2.5);
  const [floorLines, setFloorLines]       = useState([emptyFloor(0)]);
  const [selectedAddons, setSelectedAddons] = useState({}); // { [addonId]: quantity }

  // Live-preview state
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [savedQuotation, setSavedQuotation] = useState(null);

  // -------------------------------------------------------------------------
  // Load reference data
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes, aRes, sRes] = await Promise.all([
          api.get('/packages'),
          api.get('/clients'),
          api.get('/quotations/addons'),
          api.get('/quotations/site-conditions'),
        ]);
        setSiteCatalog(Array.isArray(sRes.data) ? sRes.data : []);
        // Prefill with standard answers so nothing is flagged by default
        const init = {};
        (sRes.data || []).forEach(sc => { init[sc.id] = sc.standard_answer; });
        setSiteAnswers(init);
        const pkgArr = Array.isArray(pRes.data) ? pRes.data : (pRes.data.data || []);
        pkgArr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setPackages(pkgArr);

        const cliArr = Array.isArray(cRes.data) ? cRes.data : (cRes.data.data || []);
        setClients(cliArr);

        setAddons(Array.isArray(aRes.data) ? aRes.data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load reference data');
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Build the request body
  const payload = useMemo(() => {
    const addonList = Object.entries(selectedAddons)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => ({ addon_id: Number(id), quantity: Number(q) }));
    return {
      package_id: packageId ? Number(packageId) : null,
      floor_units: floorLines
        .filter(f => Number(f.area_sqft) > 0)
        .map(f => ({
          floor_number: Number(f.floor_number) || 0,
          floor_label: f.floor_label || null,
          unit_type: f.unit_type,
          units_count: Number(f.units_count) || 1,
          area_sqft: Number(f.area_sqft) || 0,
          area_category: f.area_category,
          rate_per_sqft: f.rate_per_sqft === '' ? null : Number(f.rate_per_sqft),
        })),
      addons: addonList,
      architectural_fee_percentage: Number(archFeePct) || 0,
      other_design_fee_percentage: Number(otherFeePct) || 0,
      site_answers: Object.entries(siteAnswers)
        .filter(([, v]) => v != null && v !== '')
        .map(([condition_id, actual_answer]) => ({ condition_id: Number(condition_id), actual_answer })),
    };
  }, [packageId, floorLines, selectedAddons, archFeePct, otherFeePct, siteAnswers]);

  // Debounced auto-preview
  useEffect(() => {
    if (!payload.package_id || payload.floor_units.length === 0) { setPreview(null); return; }
    const h = setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await api.post('/quotations/preview', payload);
        setPreview(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setPreviewing(false);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [payload]);

  // -------------------------------------------------------------------------
  const addFloor = useCallback(() => {
    setFloorLines(prev => {
      const nextFloor = prev.length ? Math.max(...prev.map(p => Number(p.floor_number) || 0)) + 1 : 0;
      return [...prev, emptyFloor(nextFloor)];
    });
  }, []);

  const updateFloor = (idx, patch) => {
    setFloorLines(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  const removeFloor = (idx) => {
    setFloorLines(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleAddon = (id, unit) => {
    setSelectedAddons(prev => {
      const next = { ...prev };
      if (next[id] != null) delete next[id]; else next[id] = 1;
      return next;
    });
  };

  const setAddonQty = (id, qty) => {
    setSelectedAddons(prev => ({ ...prev, [id]: qty }));
  };

  const handleSave = async () => {
    if (!clientId)  return toast.error('Pick a client');
    if (!packageId) return toast.error('Pick a package');
    if (payload.floor_units.length === 0) return toast.error('Add at least one floor line');

    try {
      const res = await api.post('/quotations', {
        ...payload,
        client_id: Number(clientId),
        project_title: projectTitle || null,
        quotation_date: quotationDate,
        valid_until: validUntil,
      });
      toast.success(`Saved: ${res.data.quotation_number}`);
      setSavedQuotation({
        id: res.data.client_quotation_id,
        number: res.data.quotation_number,
        final_cost: res.data.breakup?.final_cost,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save quotation');
    }
  };

  const resetForNew = () => {
    setSavedQuotation(null);
    setFloorLines([emptyFloor(0)]);
    setSelectedAddons({});
    setProjectTitle('');
  };

  // -------------------------------------------------------------------------
  const selectedAddonRows = useMemo(
    () => addons.filter(a => selectedAddons[a.id] != null),
    [addons, selectedAddons]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <FileText size={16} /> Quotations
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Quotation</h1>
        <p className="text-sm text-gray-600 mt-1">Floor-by-floor breakup with add-ons and design fees. Preview updates as you type.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basics */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Basics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.client_name}{c.email ? ` — ${c.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Package *</label>
                <select value={packageId} onChange={e => setPackageId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">Select package…</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.package_name} — ₹{formatINR(p.total_price_per_sqft)}/SFT · Stilt ₹{formatINR(p.stilt_price_per_sqft)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
                <input value={projectTitle} onChange={e => setProjectTitle(e.target.value)}
                       placeholder="e.g. Residential G+4 at Kondapur"
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quotation Date</label>
                <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valid Until</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Floor lines */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Floor / Unit Breakup</h2>
              <button onClick={addFloor}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100">
                <Plus size={12} /> Add row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-500">
                  <tr>
                    <th className="text-left px-1 py-1 w-16">Floor #</th>
                    <th className="text-left px-1 py-1">Label</th>
                    <th className="text-left px-1 py-1">Unit type</th>
                    <th className="text-right px-1 py-1 w-14">Count</th>
                    <th className="text-right px-1 py-1 w-24">Area (sqft)</th>
                    <th className="text-left px-1 py-1">Rate category</th>
                    <th className="text-right px-1 py-1 w-24">Rate ₹ (override)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {floorLines.map((f, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-1 py-1"><input type="number" value={f.floor_number} onChange={e => updateFloor(i, { floor_number: e.target.value })} className="w-full border border-gray-200 rounded px-1 py-1" /></td>
                      <td className="px-1 py-1"><input value={f.floor_label} onChange={e => updateFloor(i, { floor_label: e.target.value })} placeholder="Ground / 1st…" className="w-full border border-gray-200 rounded px-1 py-1" /></td>
                      <td className="px-1 py-1">
                        <select value={f.unit_type} onChange={e => updateFloor(i, { unit_type: e.target.value })} className="w-full border border-gray-200 rounded px-1 py-1">
                          {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input type="number" min="1" value={f.units_count} onChange={e => updateFloor(i, { units_count: e.target.value })} className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                      <td className="px-1 py-1"><input type="number" min="0" step="1" value={f.area_sqft} onChange={e => updateFloor(i, { area_sqft: e.target.value })} placeholder="0" className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                      <td className="px-1 py-1">
                        <select value={f.area_category} onChange={e => updateFloor(i, { area_category: e.target.value })} className="w-full border border-gray-200 rounded px-1 py-1">
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input type="number" min="0" step="0.01" value={f.rate_per_sqft} onChange={e => updateFloor(i, { rate_per_sqft: e.target.value })} placeholder="auto" className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                      <td className="px-1 py-1 text-center"><button onClick={() => removeFloor(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add-ons */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add-ons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {addons.map(a => {
                const on = selectedAddons[a.id] != null;
                return (
                  <div key={a.id} className={`border rounded-md px-3 py-2 text-xs ${on ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={on} onChange={() => toggleAddon(a.id, a.unit)} className="mr-1" />
                      <span className="flex-1 font-medium text-gray-800">{a.name}</span>
                      <span className="text-gray-500">₹{formatINR(a.default_rate, 0)}/{a.unit}</span>
                    </label>
                    {on && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-gray-500">Qty:</span>
                        <input type="number" min="0" step="1" value={selectedAddons[a.id]}
                               onChange={e => setAddonQty(a.id, Number(e.target.value))}
                               className="w-20 text-right border border-gray-200 rounded px-2 py-1" />
                        <span className="text-gray-500">{a.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Site Conditions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Site Conditions Checklist <span className="text-xs text-gray-500 font-normal">(deviations from standard flag escalator rules)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {siteCatalog.map(sc => {
                const current = siteAnswers[sc.id] ?? sc.standard_answer;
                const isDeviation = (current || '').toLowerCase().trim() !== (sc.standard_answer || '').toLowerCase().trim();
                return (
                  <div key={sc.id} className={`rounded-md px-3 py-2 border ${isDeviation ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                    <div className="text-gray-800 font-medium">{sc.question}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-gray-500">Standard: <span className="font-mono">{sc.standard_answer}</span></span>
                      {sc.triggers_rule_id && <span className="text-[10px] text-gray-400">→ triggers {sc.triggers_rule_id}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={current}
                        onChange={e => setSiteAnswers(prev => ({ ...prev, [sc.id]: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded px-2 py-1"
                      >
                        <option value={sc.standard_answer}>{sc.standard_answer} (standard)</option>
                        {sc.deviation_answer && <option value={sc.deviation_answer}>{sc.deviation_answer} (deviation)</option>}
                      </select>
                    </div>
                    {isDeviation && sc.default_impact && (
                      <div className="mt-1 text-[10px] text-amber-800">⚠ {sc.default_impact}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fees */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Design & Operation Fees (% of construction cost)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Architectural Design %</label>
                <input type="number" min="0" step="0.1" value={archFeePct} onChange={e => setArchFeePct(e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Other Design & Pre-Construction %</label>
                <input type="number" min="0" step="0.1" value={otherFeePct} onChange={e => setOtherFeePct(e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Live Preview</h2>
              {previewing && <span className="text-[10px] text-gray-400">updating…</span>}
            </div>
            {!preview ? (
              <div className="text-xs text-gray-500 italic py-6 text-center">
                Pick a package and add at least one floor row to see the breakup.
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-500 mb-2">Package: <span className="font-medium text-gray-800">{preview.package.name}</span></div>
                <div className="text-[11px] grid grid-cols-2 gap-y-1 mb-3">
                  <span>Built-up area</span> <span className="text-right font-medium">{formatINR(preview.areas.built_up, 0)} sft</span>
                  <span>Stilt / parking</span> <span className="text-right font-medium">{formatINR(preview.areas.stilt, 0)} sft</span>
                  {preview.areas.terrace > 0 && (<><span>Terrace</span><span className="text-right font-medium">{formatINR(preview.areas.terrace, 0)} sft</span></>)}
                  {preview.areas.headroom > 0 && (<><span>Headroom</span><span className="text-right font-medium">{formatINR(preview.areas.headroom, 0)} sft</span></>)}
                  <span className="font-semibold text-gray-800 pt-1 border-t border-gray-100 mt-1">Total built-up</span>
                  <span className="text-right font-semibold text-gray-800 pt-1 border-t border-gray-100 mt-1">{formatINR(preview.areas.total_built_up, 0)} sft</span>
                </div>

                <div className="text-[11px] space-y-1 border-t border-gray-100 pt-2">
                  <div className="flex justify-between"><span>Floor units subtotal</span><span>₹{formatINR(preview.breakup.floor_units_total, 0)}</span></div>
                  <div className="flex justify-between"><span>Add-ons subtotal</span><span>₹{formatINR(preview.breakup.addons_total, 0)}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100"><span>Construction cost</span><span>₹{formatINR(preview.breakup.construction_cost, 0)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Architectural fee ({preview.breakup.architectural_fee_percentage}%)</span><span>₹{formatINR(preview.breakup.architectural_fee_amount, 0)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Other design fee ({preview.breakup.other_design_fee_percentage}%)</span><span>₹{formatINR(preview.breakup.other_design_fee_amount, 0)}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100"><span>Design total</span><span>₹{formatINR(preview.breakup.design_total, 0)}</span></div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-gray-700">FINAL COST</span>
                  <span className="text-xl font-bold text-orange-600 flex items-center"><IndianRupee size={16} />{formatINR(preview.breakup.final_cost, 0)}</span>
                </div>

                {savedQuotation ? (
                  <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] text-emerald-800 font-semibold">Saved ✓</div>
                    <div className="text-xs text-emerald-900 mt-0.5 font-mono">{savedQuotation.number}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/quotations/${savedQuotation.id}`)}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded">
                        View
                      </button>
                      <button onClick={resetForNew}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-emerald-300 text-emerald-800 text-xs font-medium rounded hover:bg-emerald-100">
                        + New
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleSave}
                          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
                    <Save size={14} /> Save Quotation
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuotation;
