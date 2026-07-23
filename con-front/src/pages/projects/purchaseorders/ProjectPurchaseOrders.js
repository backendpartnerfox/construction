import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, ShoppingCart, Truck, Calendar, RefreshCw, X, Save, Trash2,
  Package as PackageIcon, IndianRupee, FileText, CheckCircle2, Clock,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const formatINR = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';
};
const formatINR2 = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
};

const STATUS_CLS = {
  Draft:      'bg-gray-100 text-gray-700',
  Pending:    'bg-amber-50 text-amber-700',
  Approved:   'bg-blue-50 text-blue-700',
  Sent:       'bg-cyan-50 text-cyan-700',
  Delivered:  'bg-emerald-50 text-emerald-700',
  Completed:  'bg-emerald-100 text-emerald-800',
  Cancelled:  'bg-red-50 text-red-700',
};

const emptyForm = {
  po_number: '',
  po_date: new Date().toISOString().slice(0, 10),
  vendor_id: '',
  module_id: '',
  work_order_id: '',
  delivery_address: '',
  expected_delivery_date: '',
  advance_percentage: '0',
  payment_terms: 'Net 30',
  status: 'Draft',
};

const emptyLine = {
  item_id: '', item_description: '', quantity: '1', unit: 'Pc', unit_price: '0',
  discount_percentage: '0', tax_percentage: '18', required_by_date: '',
};

const ProjectPurchaseOrders = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  const loadRef = useCallback(async () => {
    try {
      const [pRes, vRes, iRes, mRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get('/vendors'),
        api.get('/items'),
        api.get('/work_modules').catch(() => ({ data: [] })),
      ]);
      setProject(Array.isArray(pRes.data) ? pRes.data[0] : (pRes.data.data || pRes.data));
      setVendors(Array.isArray(vRes.data) ? vRes.data : (vRes.data.data || []));
      setItems(Array.isArray(iRes.data) ? iRes.data : (iRes.data.data || []));
      setModules(Array.isArray(mRes.data) ? mRes.data : (mRes.data.data || []));
    } catch (err) { console.error(err); }
  }, [projectId]);

  const loadOrders = useCallback(async () => {
    try {
      // Fetch all POs and filter to those linked to this project's modules
      const r = await api.get('/purchase_orders');
      const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
      arr.sort((a, b) => new Date(b.po_date || b.created_at) - new Date(a.po_date || a.created_at));
      setOrders(arr);
    } catch (err) { setOrders([]); }
  }, []);

  useEffect(() => { (async () => {
    setLoading(true);
    await Promise.all([loadRef(), loadOrders()]);
    setLoading(false);
  })(); }, [loadRef, loadOrders]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setLineField = (idx, k, v) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [k]: v } : l));
  const addLine = () => setLines(prev => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const lineTotal = (l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unit_price) || 0;
    const disc = Number(l.discount_percentage) || 0;
    const tax = Number(l.tax_percentage) || 0;
    const gross = qty * price;
    const afterDisc = gross * (1 - disc / 100);
    return afterDisc * (1 + tax / 100);
  };
  const totals = useMemo(() => {
    let subtotal = 0, tax = 0, total = 0;
    for (const l of lines) {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unit_price) || 0;
      const disc = Number(l.discount_percentage) || 0;
      const taxPct = Number(l.tax_percentage) || 0;
      const gross = qty * price;
      const afterDisc = gross * (1 - disc / 100);
      subtotal += afterDisc;
      tax += afterDisc * (taxPct / 100);
      total += afterDisc * (1 + taxPct / 100);
    }
    return { subtotal, tax, total };
  }, [lines]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vendor_id || !form.po_number || !form.module_id) {
      toast.error('PO number, vendor, and module are required');
      return;
    }
    if (!lines.some(l => Number(l.quantity) > 0 && l.item_id)) {
      toast.error('Add at least one line item with an item and quantity');
      return;
    }
    setSaving(true);
    try {
      // Create PO
      const poRes = await api.post('/purchase_orders', {
        ...form,
        vendor_id: Number(form.vendor_id),
        module_id: Number(form.module_id),
        work_order_id: form.work_order_id ? Number(form.work_order_id) : null,
        expected_delivery_date: form.expected_delivery_date || null,
        subtotal: Number(totals.subtotal.toFixed(2)),
        tax_amount: Number(totals.tax.toFixed(2)),
        total_amount: Number(totals.total.toFixed(2)),
        advance_percentage: Number(form.advance_percentage) || 0,
        advance_amount: Number((totals.total * (Number(form.advance_percentage) || 0) / 100).toFixed(2)),
        total_items: lines.filter(l => Number(l.quantity) > 0 && l.item_id).length,
        created_by: 1,
      });
      const poId = poRes.data.po_id || poRes.data.id || poRes.data.data?.po_id;

      // Insert line items
      let lineNum = 1;
      for (const l of lines) {
        if (!l.item_id || !(Number(l.quantity) > 0)) continue;
        await api.post('/po_line_items/po-line-items', {
          po_id: poId,
          line_number: lineNum++,
          item_id: Number(l.item_id),
          item_description: l.item_description || null,
          quantity: Number(l.quantity),
          unit: l.unit,
          unit_price: Number(l.unit_price) || 0,
          discount_percentage: Number(l.discount_percentage) || 0,
          tax_percentage: Number(l.tax_percentage) || 0,
          line_total: Number(lineTotal(l).toFixed(2)),
          required_by_date: l.required_by_date || null,
        });
      }
      toast.success(`PO ${form.po_number} created with ${lineNum - 1} line item(s)`);
      setShowModal(false);
      setForm(emptyForm);
      setLines([{ ...emptyLine }]);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to save PO');
    } finally { setSaving(false); }
  };

  const changeStatus = async (poId, nextStatus) => {
    if (!window.confirm(`Change PO status to "${nextStatus}"?`)) return;
    try {
      await api.put(`/purchase_orders/${poId}/status`, { status: nextStatus, changed_by: 1 });
      toast.success(`Status → ${nextStatus}`);
      loadOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(`/projects/${projectId}`)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back to project
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <ShoppingCart size={16} /> Project · Purchase Orders
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            {project && <p className="text-sm text-gray-600 mt-0.5">{project.project_name}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={loadOrders}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => { setForm({ ...emptyForm, po_number: `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(orders.length + 1).padStart(3, '0')}` }); setShowModal(true); }}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
              <Plus size={14} /> New PO
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <div className="text-gray-700 font-medium mb-1">No purchase orders yet</div>
          <p className="text-sm text-gray-500">Click <span className="font-medium">New PO</span> to create your first purchase order.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">PO Number</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(o => {
                const vendor = vendors.find(v => v.vendor_id === o.vendor_id);
                return (
                  <tr key={o.po_id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-orange-700 font-medium">{o.po_number}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {o.po_date ? new Date(o.po_date).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{vendor?.vendor_name || `#${o.vendor_id}`}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{o.total_items || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{formatINR(o.total_amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.expected_delivery_date && (
                        <span className="flex items-center gap-1">
                          <Truck size={11} className="text-gray-400" />
                          {new Date(o.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'Draft' && (
                        <button onClick={() => changeStatus(o.po_id, 'Pending')}
                                className="text-[11px] px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50">
                          Submit
                        </button>
                      )}
                      {o.status === 'Pending' && (
                        <button onClick={() => changeStatus(o.po_id, 'Approved')}
                                className="text-[11px] px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50">
                          Approve
                        </button>
                      )}
                      {o.status === 'Approved' && (
                        <button onClick={() => changeStatus(o.po_id, 'Sent')}
                                className="text-[11px] px-2 py-1 rounded border border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                          Send
                        </button>
                      )}
                      {o.status === 'Sent' && (
                        <button onClick={() => changeStatus(o.po_id, 'Delivered')}
                                className="text-[11px] px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4 text-sm">
              {/* PO Header */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PO Number *</label>
                  <input value={form.po_number} onChange={e => setField('po_number', e.target.value)}
                         required className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PO Date *</label>
                  <input type="date" value={form.po_date} onChange={e => setField('po_date', e.target.value)}
                         required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vendor *</label>
                  <select value={form.vendor_id} onChange={e => setField('vendor_id', e.target.value)}
                          required className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Module *</label>
                  <select value={form.module_id} onChange={e => setField('module_id', e.target.value)}
                          required className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Select module…</option>
                    {modules.map(m => <option key={m.module_id} value={m.module_id}>{m.module_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery</label>
                  <input type="date" value={form.expected_delivery_date} onChange={e => setField('expected_delivery_date', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Advance %</label>
                  <input type="number" step="1" min="0" max="100" value={form.advance_percentage} onChange={e => setField('advance_percentage', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address</label>
                  <input value={form.delivery_address} onChange={e => setField('delivery_address', e.target.value)}
                         placeholder="Site address"
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
                  <input value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)}
                         placeholder="Net 30"
                         className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase">Line items</h3>
                  <button type="button" onClick={addLine}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-orange-300 rounded text-orange-700 bg-orange-50 hover:bg-orange-100">
                    <Plus size={12} /> Add line
                  </button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                      <tr>
                        <th className="px-2 py-2 text-left">Item</th>
                        <th className="px-2 py-2 text-right w-16">Qty</th>
                        <th className="px-2 py-2 w-16">Unit</th>
                        <th className="px-2 py-2 text-right w-24">Price ₹</th>
                        <th className="px-2 py-2 text-right w-16">Disc %</th>
                        <th className="px-2 py-2 text-right w-16">Tax %</th>
                        <th className="px-2 py-2 text-right w-24">Line ₹</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines.map((l, i) => (
                        <tr key={i}>
                          <td className="px-1 py-1">
                            <select value={l.item_id} onChange={e => {
                              const item = items.find(it => it.item_id === Number(e.target.value));
                              setLineField(i, 'item_id', e.target.value);
                              if (item) {
                                setLineField(i, 'item_description', item.item_name);
                                setLineField(i, 'unit', item.item_unit || l.unit);
                              }
                            }}
                                    className="w-full border border-gray-200 rounded px-1 py-1">
                              <option value="">Select…</option>
                              {items.map(it => <option key={it.item_id} value={it.item_id}>{it.item_name} ({it.item_category})</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-1"><input type="number" step="0.01" min="0" value={l.quantity} onChange={e => setLineField(i, 'quantity', e.target.value)} className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                          <td className="px-1 py-1"><input value={l.unit} onChange={e => setLineField(i, 'unit', e.target.value)} className="w-full border border-gray-200 rounded px-1 py-1" /></td>
                          <td className="px-1 py-1"><input type="number" step="0.01" min="0" value={l.unit_price} onChange={e => setLineField(i, 'unit_price', e.target.value)} className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                          <td className="px-1 py-1"><input type="number" step="0.01" min="0" max="100" value={l.discount_percentage} onChange={e => setLineField(i, 'discount_percentage', e.target.value)} className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                          <td className="px-1 py-1"><input type="number" step="0.01" min="0" max="100" value={l.tax_percentage} onChange={e => setLineField(i, 'tax_percentage', e.target.value)} className="w-full text-right border border-gray-200 rounded px-1 py-1" /></td>
                          <td className="px-2 py-1 text-right font-medium">{formatINR2(lineTotal(l))}</td>
                          <td className="px-1 py-1 text-center"><button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="6" className="px-2 py-2 text-right text-gray-600">Subtotal</td>
                        <td className="px-2 py-2 text-right font-medium">₹{formatINR2(totals.subtotal)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="6" className="px-2 py-2 text-right text-gray-600">Tax</td>
                        <td className="px-2 py-2 text-right font-medium">₹{formatINR2(totals.tax)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="6" className="px-2 py-2 text-right font-bold">TOTAL</td>
                        <td className="px-2 py-2 text-right font-bold text-orange-600">₹{formatINR2(totals.total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPurchaseOrders;
