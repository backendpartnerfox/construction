import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, Edit, Calendar, User, Package, IndianRupee, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatINR = (n, dec = 2) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specs, setSpecs] = useState([]);
  const [annexure, setAnnexure] = useState(null);
  const [openSections, setOpenSections] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/quotations/${id}`);
        setQ(res.data);
        // Look up package_id via package_type name
        try {
          const pkgs = await api.get('/packages');
          const arr = Array.isArray(pkgs.data) ? pkgs.data : (pkgs.data.data || []);
          const pkg = arr.find(p => p.package_name === res.data.package_type);
          if (pkg?.id) {
            const s = await api.get(`/packages/${pkg.id}/specifications`);
            setSpecs(Array.isArray(s.data) ? s.data : []);
          }
        } catch (specErr) { console.warn('specs load skipped:', specErr.message); }
        // Load material annexure (rules-driven)
        try {
          const ann = await api.get(`/quotations/${id}/annexure`);
          setAnnexure(ann.data);
        } catch (annErr) { console.warn('annexure load skipped:', annErr.message); }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load quotation');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleSection = (name) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const expandAll   = () => setOpenSections(new Set(specs.map(s => s.section)));
  const collapseAll = () => setOpenSections(new Set());

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!q) return <div className="p-6 text-gray-500">Quotation not found.</div>;

  // Derive totals from stored columns (they match what we saved)
  const construction = (Number(q.floor_units_total_amount) || 0) + (Number(q.addons_total_amount) || 0);
  const design = Number(q.total_design_amount) || 0;
  const final = construction + design;

  return (
    <div className="p-6 max-w-5xl mx-auto print:p-0 print:max-w-none">
      <div className="mb-6 print:hidden">
        <button onClick={() => navigate('/quotations')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> All quotations
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <FileText size={16} /> Quotation
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{q.client_quotation_number}</h1>
            {q.project_title && <p className="text-sm text-gray-600 mt-0.5">{q.project_title}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={() => navigate('/quotations/create')} className="inline-flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md">
              <Edit size={14} /> New Quotation
            </button>
          </div>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[11px] text-gray-500 uppercase mb-1 flex items-center gap-1"><User size={11} /> Client</div>
            <div className="font-medium text-gray-900">{q.client_name || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase mb-1 flex items-center gap-1"><Package size={11} /> Package</div>
            <div className="font-medium text-gray-900">{q.package_type}</div>
            <div className="text-xs text-gray-500">₹{formatINR(q.package_rate_per_sqft, 0)}/SFT</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase mb-1 flex items-center gap-1"><Calendar size={11} /> Date</div>
            <div className="font-medium text-gray-900">{q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : '—'}</div>
            {q.valid_until && <div className="text-xs text-gray-500">valid to {new Date(q.valid_until).toLocaleDateString('en-IN')}</div>}
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase mb-1">Status</div>
            <div className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">{q.status || 'Draft'}</div>
          </div>
        </div>
      </div>

      {/* Overall cost */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Overall Cost</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">Construction Cost</td>
              <td className="py-2 text-right font-medium">₹{formatINR(construction, 0)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">Architecture, Design &amp; Operation Cost <span className="text-xs text-gray-500">(details below)</span></td>
              <td className="py-2 text-right font-medium">₹{formatINR(design, 0)}</td>
            </tr>
            <tr>
              <td className="py-3 font-bold text-gray-900">Final Cost</td>
              <td className="py-3 text-right text-xl font-bold text-orange-600 flex items-center justify-end"><IndianRupee size={16} />{formatINR(final, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Construction Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Construction Details</h2>
        <div className="text-sm text-gray-700 space-y-1">
          {(q.floor_units || []).map(u => (
            <div key={u.id}>
              <span className="font-medium">{u.floor_label || `Floor ${u.floor_number}`}</span> =&gt;{' '}
              {u.area_sqft} sqft ({u.units_count} unit{u.units_count > 1 ? 's' : ''} of {u.unit_type})
              <span className="text-xs text-gray-500 ml-2">— {u.area_category} @ ₹{formatINR(u.rate_per_sqft, 0)}/SFT = <span className="font-medium text-gray-700">₹{formatINR(u.computed_amount, 0)}</span></span>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
            <div>Habitable / Built-up: <span className="font-medium">{q.habitable_area || '—'} sqft</span></div>
            <div>Stilt / Parking: <span className="font-medium">{q.stilt_area || 0} sqft</span></div>
            <div>Terrace: <span className="font-medium">{q.terrace_area || 0} sqft</span></div>
            <div>Total built-up: <span className="font-medium">{q.built_up_area || '—'} sqft</span></div>
          </div>
        </div>
      </div>

      {/* Add-ons */}
      {(q.addon_lines || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Additions to Package</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2 w-24">Rate</th>
                <th className="text-right py-2 w-16">Qty</th>
                <th className="text-right py-2 w-32">Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {q.addon_lines.map(a => (
                <tr key={a.id}>
                  <td className="py-2 text-gray-700">{a.name}<div className="text-[11px] text-gray-500">per {a.unit}</div></td>
                  <td className="py-2 text-right">₹{formatINR(a.rate, 0)}</td>
                  <td className="py-2 text-right">{a.quantity}</td>
                  <td className="py-2 text-right font-medium">₹{formatINR(a.computed_amount, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Design & Operation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Architecture, Design &amp; Operation Cost</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 text-gray-700">Architectural Design Fee ({q.architectural_fee_percentage || 0}% of Construction Cost)</td>
              <td className="py-2 text-right font-medium">₹{formatINR(q.architectural_fee_amount, 0)}</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-700">Other Design &amp; Pre-Construction Fee ({q.other_design_fee_percentage || 0}% of Construction Cost)</td>
              <td className="py-2 text-right font-medium">₹{formatINR(q.other_design_fee_amount, 0)}</td>
            </tr>
            <tr>
              <td className="py-3 font-bold text-gray-900">Total Design &amp; Operation Cost</td>
              <td className="py-3 text-right font-bold">₹{formatINR(q.total_design_amount, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cost Breakup */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Total Construction Cost Breakup</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2 w-24">Rate</th>
              <th className="text-right py-2 w-24">Qty</th>
              <th className="text-right py-2 w-32">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(q.floor_units || []).map(u => (
              <tr key={u.id}>
                <td className="py-2 text-gray-700">
                  <div>{u.floor_label || `Floor ${u.floor_number}`} — {u.units_count} unit{u.units_count > 1 ? 's' : ''} of {u.unit_type}</div>
                  <div className="text-[11px] text-gray-500">{u.area_category}</div>
                </td>
                <td className="py-2 text-right">₹{formatINR(u.rate_per_sqft, 0)}/sqft</td>
                <td className="py-2 text-right">{u.area_sqft * (u.units_count || 1)} sqft</td>
                <td className="py-2 text-right font-medium">₹{formatINR(u.computed_amount, 0)}</td>
              </tr>
            ))}
            {(q.addon_lines || []).map(a => (
              <tr key={'a' + a.id}>
                <td className="py-2 text-gray-700">{a.name}<div className="text-[11px] text-gray-500">per {a.unit}</div></td>
                <td className="py-2 text-right">₹{formatINR(a.rate, 0)}</td>
                <td className="py-2 text-right">{a.quantity}</td>
                <td className="py-2 text-right font-medium">₹{formatINR(a.computed_amount, 0)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" className="py-3 font-bold text-gray-900 text-right">Total Construction Cost</td>
              <td className="py-3 text-right font-bold">₹{formatINR(construction, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Site Conditions summary */}
      {(q.site_conditions || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Site Conditions</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left py-2">Checkpoint</th>
                <th className="text-left py-2">Standard</th>
                <th className="text-left py-2">Actual</th>
                <th className="text-center py-2">Status</th>
                <th className="text-left py-2">Triggers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {q.site_conditions.map(sc => (
                <tr key={sc.id}>
                  <td className="py-2 text-gray-700">{sc.question}</td>
                  <td className="py-2 text-gray-500 text-xs">{sc.standard_answer}</td>
                  <td className="py-2 text-gray-800 text-xs">{sc.actual_answer || '—'}</td>
                  <td className="py-2 text-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sc.is_deviation ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                      {sc.is_deviation ? 'Deviation' : 'Standard'}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-gray-600">
                    {sc.is_deviation && sc.triggers_rule_id ? sc.triggers_rule_id : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applied Rules */}
      {(q.rule_evaluations || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Applied Rulebook Entitlements</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left py-2">Rule</th>
                <th className="text-left py-2">Title</th>
                <th className="text-right py-2 w-24">Entitled</th>
                <th className="text-right py-2 w-24">Cap</th>
                <th className="text-right py-2 w-32">Overage ₹</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {q.rule_evaluations.map(ev => (
                <tr key={ev.id}>
                  <td className="py-2 font-mono text-xs">{ev.rule_id}</td>
                  <td className="py-2 text-gray-700 text-xs">{ev.title}<div className="text-[10px] text-gray-500">{ev.module}</div></td>
                  <td className="py-2 text-right text-xs">{ev.entitled_qty != null ? `${ev.entitled_qty} ${ev.uom || ''}` : '—'}</td>
                  <td className="py-2 text-right text-xs">{ev.cap_value ? `₹${Number(ev.cap_value).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="py-2 text-right font-medium">{ev.overage_amount ? `₹${Number(ev.overage_amount).toLocaleString('en-IN')}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Material Annexure — styled to match the WeHouse / JS Constructions PDF exactly */}
      {annexure && annexure.main_sections && annexure.main_sections.length > 0 && (
        <div className="bg-white border border-gray-300 mb-4 annexure-doc" style={{ fontFamily: 'Cambria, Georgia, "Times New Roman", serif' }}>
          {/* Document title band */}
          <div className="text-center border-b border-gray-300 py-3">
            <div className="text-base font-bold tracking-wide">STANDARD MATERIAL ANNEXURE – II</div>
          </div>
          <div className="text-center border-b border-gray-300 py-2 text-sm font-semibold">
            PROPOSED RESIDENTIAL BUILDING {annexure.project_title ? '— ' + annexure.project_title.toUpperCase() : ''}
          </div>

          {/* Client row */}
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold w-40">CLIENT NAME:</td>
                <td className="border border-gray-300 px-3 py-2" colSpan="2">MR. {annexure.client_name || '—'}</td>
              </tr>
              <tr className="text-[11px] uppercase font-semibold bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 w-40">ITEM</td>
                <td className="border border-gray-300 px-3 py-2">DESCRIPTION</td>
                <td className="border border-gray-300 px-3 py-2 w-64">REMARKS</td>
              </tr>

              {annexure.main_sections.flatMap(sec => sec.items).map(it => (
                <tr key={it.rule_id} className="align-top">
                  <td className="border border-gray-300 px-3 py-2 font-semibold text-sm">
                    {it.seq}. {it.title.toUpperCase()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-line">
                    {it.description || '—'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {it.remarks.length === 0 ? '—' : (
                      <div className="space-y-1">
                        {it.remarks.map((r, i) => <div key={i}>{r}</div>)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ELECTRICAL & PLUMBING sub-annexure */}
          <div className="text-center border-t-2 border-b border-gray-400 py-3 mt-4">
            <div className="text-base font-bold tracking-wide">ELECTRICAL &amp; PLUMBING ANNEXURE</div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[11px] uppercase font-semibold bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 w-40">ITEM</td>
                <td className="border border-gray-300 px-3 py-2">DESCRIPTION</td>
                <td className="border border-gray-300 px-3 py-2 w-64">REMARKS</td>
              </tr>
            </thead>
            <tbody>
              {/* Electrical fixture matrix — one row per room */}
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">1. ELECTRICAL.</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  <div className="font-semibold mb-1">POWER WIRING:</div>
                  <div>Flame-retardant insulated copper cables. Light &amp; Fan points, 5A &amp; 15A power sockets, TV sockets provided per below.</div>
                  <div className="mt-1">Wire — 1, 1.5, 2.5, 4 sq mm</div>
                  <div className="mt-2 font-semibold">INVERTER POINTS: AS PER REQUIREMENT.</div>
                  <div className="text-xs">MINIMUM: Living + 1 Bedroom shall be provided with 1 Light + 1 Fan point. Utility and Common area shall be provided with required light points.</div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  Brand — Finolex / Polycab<br/>
                  Piping — Sudhakar<br/>
                  <span className="text-amber-800">Anything beyond shall be compensated.</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">2. ELECTRICAL FIXTURES.</td>
                <td className="border border-gray-300 px-3 py-2 text-sm p-0">
                  {annexure.electrical_matrix && annexure.electrical_matrix.map((r, idx) => (
                    <div key={idx} className={`px-3 py-2 ${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                      <div className="font-semibold text-xs uppercase tracking-wide">{r.room}:</div>
                      <ol className="list-decimal ml-5 mt-1 text-sm">
                        {r.points.map((p, i) => <li key={i}>{p}</li>)}
                      </ol>
                    </div>
                  ))}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  Brand — {annexure.electrical_switch_brand}<br/>
                  <span className="text-amber-800">Anything above shall be compensated.</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">3. DISTRIBUTION BOARDS.</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  1. Double Door 4-Way TPIN.<br/>
                  MCBs: 100–2000 A Standard Circuit Breakers sized per load.
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  Brand — Anchor / HPL<br/>
                  <span className="text-amber-800">Anything above shall be compensated.</span>
                </td>
              </tr>

              {/* Plumbing */}
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">4. PLUMBING.</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  <div className="font-semibold mb-1">WATER SUPPLY / DRAINAGE PIPING:</div>
                  All toilets, kitchen, utility. Hot &amp; Cold-Water Compatibility for shower CPVC or CPVC Pro. ISI-certified CPVC water-supply piping and SWR drainage piping &amp; accessories.
                  <div className="font-semibold mt-2">UNDERGROUND DRAINAGE:</div>
                  6″ diameter PVC pipes with adequate slope.
                  <div className="font-semibold mt-2">MANHOLES:</div>
                  Cement concrete bricks in CM 1:6 with 4″ PCC bed, internal &amp; external plastering (inside smooth slurry finish). Building-to-main point connection every 10 ft.
                  <div className="text-xs mt-1">Gate-to-main GHMC manhole connection shall be compensated by the landlord.</div>
                  <div className="font-semibold mt-2">WATER SUMP:</div> RCC as per design, 4000 L capacity.
                  <div className="font-semibold mt-2">OVERHEAD TANK:</div> 1000 L double-layer per DU.
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  Brand — Astral / Supreme
                </td>
              </tr>

              {/* Sanitary — room-keyed budgets */}
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">5. SANITARYWARE.</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  WC (floor / wall mounted), Wash basin (semi-pedestal), Wall mixer, Shower + Shower head, Angular cocks, Waste pipe, Couplings, Nahni traps.
                  <div className="font-semibold mt-2">ALL TOILETS:</div>
                  <ol className="list-decimal ml-5">
                    <li>2-in-1 Wall Mixer — 1 no.</li>
                    <li>Basin Mixer — 1 no.</li>
                    <li>Health Faucet — 1 no.</li>
                    <li>Overhead Shower / Shower Head — 1 no.</li>
                    <li>Concealed Stopcock — 1 no.</li>
                    <li>Shower inlets — Hot / Cold</li>
                    <li>Inlet &amp; outlet point for Geyser — 1 no.</li>
                  </ol>
                  Floor traps as per layout.
                  <div className="font-semibold mt-2">UTILITY AREA:</div>
                  Short body bibcock + Washing machine angle cock.
                  <div className="font-semibold mt-2">KITCHEN:</div>
                  Long body bibcock ×2 (bore + municipal), RO point, Kitchen sink + sink faucet.
                  <div className="font-semibold mt-2">STILT FLOOR / TERRACE:</div>
                  Stilt floor tap ×1, Terrace tap ×1 (site condition).
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {annexure.sanitary_budgets && annexure.sanitary_budgets.master && (
                    <>
                      <div className="font-semibold">One Master Bathroom</div>
                      <div>Rs {Number(annexure.sanitary_budgets.master).toLocaleString('en-IN')}/-</div>
                      <div className="mt-2 font-semibold">Other bathrooms</div>
                      <div>Rs {Number(annexure.sanitary_budgets.other).toLocaleString('en-IN')}/-</div>
                    </>
                  )}
                  <div className="mt-2">Brand — CERA / Hindware / Parryware</div>
                  <div className="mt-2 text-xs">Kitchen sink Rs 4,000 (assured)<br/>Sink faucet Rs 1,800 (Hindware / Parryware)</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes footer */}
          <div className="p-3 text-sm border-t border-gray-300">
            <div className="font-semibold mb-1">Notes:</div>
            <ol className="list-decimal ml-6 space-y-0.5">
              {annexure.notes && annexure.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ol>
          </div>
        </div>
      )}

      <style>{`
        .annexure-doc td { vertical-align: top; }
        @media print {
          .annexure-doc { page-break-inside: auto; }
          .annexure-doc tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* Package Specification (from Comparison_HYD.xlsx) */}
      {specs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {q.package_type} Package — Full Specification
            </h2>
            <div className="flex gap-2 print:hidden">
              <button onClick={expandAll}   className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Expand all</button>
              <button onClick={collapseAll} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Collapse all</button>
            </div>
          </div>
          <div className="space-y-2">
            {specs.map(sec => {
              const isOpen = openSections.has(sec.section);
              return (
                <div key={sec.section} className="border border-gray-200 rounded-md overflow-hidden print:break-inside-avoid">
                  <button type="button" onClick={() => toggleSection(sec.section)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left print:bg-white">
                    <span className="print:hidden">{isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}</span>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex-1">{sec.section}</span>
                    <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full print:hidden">{sec.features.length}</span>
                  </button>
                  <div className={`${isOpen ? '' : 'hidden'} print:!block`}>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {sec.features.map((f, i) => (
                          <tr key={i}>
                            <td className="w-1/3 align-top px-3 py-2 text-gray-700 font-medium">{f.feature}</td>
                            <td className="align-top px-3 py-2 text-gray-800">{f.spec_text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:\\!block { display: block !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default QuotationDetail;
