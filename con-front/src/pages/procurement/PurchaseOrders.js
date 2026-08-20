import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Search, Loader2, X, Save, Truck,
  Clock, CheckCircle2, XCircle, IndianRupee,
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

const STATUS_BADGE = {
  Draft:                'bg-gray-100 text-gray-600 border-gray-200',
  Sent:                 'bg-sky-50 text-sky-700 border-sky-200',
  Acknowledged:         'bg-blue-50 text-blue-700 border-blue-200',
  Partially_Delivered:  'bg-amber-50 text-amber-700 border-amber-200',
  Delivered:            'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled:            'bg-red-50 text-red-700 border-red-200',
};

const emptyForm = {
  vendor_id: '', module_id: '',
  po_date: new Date().toISOString().slice(0, 10),
  expected_delivery_date: '',
  payment_terms: '',
  advance_percentage: '',
  status: 'Draft',
  delivery_address: '',
};

export default function PurchaseOrders() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('purchase_orders.edit');

  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Vendors + modules are read defensively — procurement has vendors.view
      // but might not have projects.view (module_id lives under modules → projects).
      const [poRes, vRes, mRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/purchase_orders`),
        axios.get(`${API_BASE_URL}/vendors`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/modules`).catch(() => ({ data: [] })),
      ]);
      setRows(poRes.data?.data || poRes.data || []);
      setVendors(Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []));
      setModules(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load purchase orders');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.vendor_id) { toast.error('Vendor is required'); return; }
    if (!form.module_id) { toast.error('Module is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        vendor_id: Number(form.vendor_id),
        module_id: Number(form.module_id),
        advance_percentage: form.advance_percentage === '' ? null : Number(form.advance_percentage),
      };
      await axios.post(`${API_BASE_URL}/purchase_orders`, payload);
      toast.success('Purchase order created');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create PO');
    } finally { setSaving(false); }
  };

  const setStatus = async (poId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/purchase_orders/${poId}/status`, { status });
      toast.success(`Status → ${status.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status update failed');
    }
  };

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter(r => r.status === statusFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(r =>
        (r.po_number || '').toLowerCase().includes(s) ||
        (r.vendor_name || '').toLowerCase().includes(s)
      );
    }
    return out;
  }, [rows, q, statusFilter]);

  const stats = useMemo(() => ({
    total:     rows.length,
    open:      rows.filter(r => ['Draft', 'Sent', 'Acknowledged'].includes(r.status)).length,
    inTransit: rows.filter(r => r.status === 'Partially_Delivered').length,
    delivered: rows.filter(r => r.status === 'Delivered').length,
    value:     rows.reduce((s, r) => s + Number(r.total_amount || 0), 0),
  }), [rows]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <ShoppingCart size={16}/> Procurement
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Issue and track material purchase orders to vendors.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md">
            <Plus size={16}/> New Purchase Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatTile label="Total"      value={stats.total}     color="gray"    onClick={() => setStatusFilter('')} active={!statusFilter}/>
        <StatTile label="Open"       value={stats.open}      color="sky"     Icon={Clock}/>
        <StatTile label="In Transit" value={stats.inTransit} color="amber"   Icon={Truck}/>
        <StatTile label="Delivered"  value={stats.delivered} color="emerald" Icon={CheckCircle2}/>
        <StatTile label="Total Value" value={`₹${stats.value.toLocaleString('en-IN')}`} color="orange" Icon={IndianRupee} small/>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search PO number or vendor…"
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"/>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3"/>
            {rows.length === 0
              ? <>No purchase orders yet. Click <strong>New Purchase Order</strong> to create one.</>
              : <>No POs match your filters.</>}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>PO Number</Th><Th>Vendor</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.po_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-orange-600">{r.po_number}</td>
                  <td className="px-4 py-3 text-gray-800">{r.vendor_name || `#${r.vendor_id}`}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>{r.po_date && new Date(r.po_date).toLocaleDateString()}</div>
                    {r.expected_delivery_date && (
                      <div className="text-gray-400">→ {new Date(r.expected_delivery_date).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.total_amount != null ? `₹${Number(r.total_amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>
                      {r.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        {['Sent', 'Acknowledged', 'Delivered', 'Cancelled'].filter(s => s !== r.status).slice(0, 2).map(s => (
                          <button key={s} onClick={() => setStatus(r.po_id, s)}
                                  className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:border-orange-400 hover:text-orange-600">
                            → {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vendor *</label>
                  <select required value={form.vendor_id} onChange={e => setForm(f => ({...f, vendor_id: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                    <option value="">— Select vendor —</option>
                    {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Module *</label>
                  <select required value={form.module_id} onChange={e => setForm(f => ({...f, module_id: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                    <option value="">— Select project module —</option>
                    {modules.map(m => (
                      <option key={m.module_id} value={m.module_id}>
                        {m.module_name || m.name || `Module #${m.module_id}`}
                        {m.project_name ? ` — ${m.project_name}` : ''}
                      </option>
                    ))}
                  </select>
                  {modules.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No modules loaded. Ask an admin to grant projects.view or create modules first.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PO Date" type="date" value={form.po_date} onChange={v => setForm(f => ({...f, po_date: v}))}/>
                <Field label="Expected Delivery" type="date" value={form.expected_delivery_date} onChange={v => setForm(f => ({...f, expected_delivery_date: v}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Status" value={form.status} onChange={v => setForm(f => ({...f, status: v}))}
                             options={['Draft', 'Sent', 'Acknowledged', 'Delivered', 'Cancelled']}/>
                <Field label="Advance %" type="number" value={form.advance_percentage} onChange={v => setForm(f => ({...f, advance_percentage: v}))}/>
              </div>
              <Field label="Payment Terms" value={form.payment_terms} onChange={v => setForm(f => ({...f, payment_terms: v}))}
                     placeholder="30% advance, 60% on delivery, 10% after 15 days"/>
              <Field label="Delivery Address" value={form.delivery_address} onChange={v => setForm(f => ({...f, delivery_address: v}))}
                     textarea placeholder="Site address for delivery"/>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>;

const StatTile = ({ label, value, Icon, color, onClick, active, small }) => {
  const cls = {
    gray:    'bg-gray-50 text-gray-700 border-gray-200',
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orange:  'bg-orange-50 text-orange-700 border-orange-200',
  }[color];
  const Wrap = onClick ? 'button' : 'div';
  return (
    <Wrap onClick={onClick}
          className={`text-left flex items-center gap-3 p-4 rounded-lg border ${cls} ${active ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}>
      {Icon && <Icon size={20} className="opacity-70"/>}
      <div>
        <div className="text-xs uppercase font-medium">{label}</div>
        <div className={`font-bold ${small ? 'text-base' : 'text-2xl'}`}>{value}</div>
      </div>
    </Wrap>
  );
};

const Field = ({ label, value, onChange, type = 'text', textarea, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {textarea ? (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
    ) : (
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
    )}
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
