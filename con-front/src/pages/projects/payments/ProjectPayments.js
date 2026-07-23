import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, IndianRupee, Calendar, CheckCircle2, Clock,
  AlertTriangle, X, Save, TrendingUp, Wallet, RefreshCw, Receipt,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const formatINR = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
const formatINR2 = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STATUS_CLS = {
  Received:   'bg-emerald-50 text-emerald-700',
  Pending:    'bg-amber-50 text-amber-700',
  Verified:   'bg-blue-50 text-blue-700',
  Cleared:    'bg-purple-50 text-purple-700',
  Rejected:   'bg-red-50 text-red-700',
  Overdue:    'bg-red-100 text-red-800',
  Upcoming:   'bg-blue-50 text-blue-700',
  Completed:  'bg-emerald-100 text-emerald-800',
};

const emptyPayment = {
  payment_type_id: '',
  payment_method_id: '',
  payment_amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_purpose: '',
  payment_stage: 'Advance',
  cheque_number: '',
  cheque_date: '',
  bank_name: '',
  upi_transaction_id: '',
  online_reference_number: '',
  payment_notes: '',
};

const emptyInstallment = {
  installment_number: 1,
  installment_amount: '',
  due_date: '',
  notes: '',
};

const ProjectPayments = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [payments, setPayments] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [types, setTypes] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [showInstModal, setShowInstModal] = useState(false);
  const [instForm, setInstForm] = useState(emptyInstallment);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const r = await api.get(`/projects/${projectId}`);
      const p = Array.isArray(r.data) ? r.data[0] : (r.data.data || r.data);
      setProject(p);
      return p;
    } catch (err) { console.error(err); return null; }
  }, [projectId]);

  const loadRefData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        api.get('/payment_types/payment-types'),
        api.get('/payment_methods'),
      ]);
      const tArr = Array.isArray(tRes.data) ? tRes.data : (tRes.data.data || []);
      const mArr = Array.isArray(mRes.data) ? mRes.data : (mRes.data.data || []);
      setTypes(tArr);
      setMethods(mArr);
    } catch (err) { console.error(err); }
  }, []);

  const loadPaymentsForClient = useCallback(async (clientId) => {
    if (!clientId) { setPayments([]); return; }
    try {
      const r = await api.get(`/finance_payments/client/${clientId}`);
      const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
      arr.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
      setPayments(arr);
    } catch (err) { setPayments([]); }
  }, []);

  const loadInstallmentsFromPayments = useCallback(async (paymentsArr) => {
    if (!paymentsArr || !paymentsArr.length) { setInstallments([]); return; }
    const all = [];
    for (const p of paymentsArr) {
      try {
        const r = await api.get(`/payment_installments/payment-installments/payment/${p.payment_id}`);
        const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
        arr.forEach(x => all.push({ ...x, parent_payment: p }));
      } catch (_) { /* ok — no installments for this payment */ }
    }
    all.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    setInstallments(all);
  }, []);

  const reload = useCallback(async () => {
    const p = await loadProject();
    if (p?.client_id) {
      await loadPaymentsForClient(p.client_id);
    }
  }, [loadProject, loadPaymentsForClient]);

  useEffect(() => { (async () => {
    setLoading(true);
    await Promise.all([loadRefData(), reload()]);
    setLoading(false);
  })(); }, [loadRefData, reload]);

  useEffect(() => { loadInstallmentsFromPayments(payments); }, [payments, loadInstallmentsFromPayments]);

  const setPayField = (k, v) => setPayForm(prev => ({ ...prev, [k]: v }));
  const setInstField = (k, v) => setInstForm(prev => ({ ...prev, [k]: v }));

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!project?.client_id) { toast.error('Project has no client_id'); return; }
    if (!payForm.payment_type_id || !payForm.payment_method_id) {
      toast.error('Type and method are required'); return;
    }
    if (!payForm.payment_amount || Number(payForm.payment_amount) <= 0) {
      toast.error('Amount must be > 0'); return;
    }
    setSaving(true);
    try {
      await api.post('/finance_payments', {
        ...payForm,
        client_id: project.client_id,
        payment_amount: Number(payForm.payment_amount),
        payment_type_id: Number(payForm.payment_type_id),
        payment_method_id: Number(payForm.payment_method_id),
        cheque_date: payForm.cheque_date || null,
        received_by: 1,
        status: 'Received',
      });
      toast.success('Payment recorded');
      setShowPayModal(false);
      setPayForm(emptyPayment);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const submitInstallment = async (e) => {
    e.preventDefault();
    if (!selectedPaymentId) { toast.error('Pick a payment to schedule under'); return; }
    if (!instForm.installment_amount || !instForm.due_date) {
      toast.error('Amount and due date required'); return;
    }
    setSaving(true);
    try {
      await api.post('/payment_installments/payment-installments', {
        payment_id: selectedPaymentId,
        installment_number: Number(instForm.installment_number) || 1,
        installment_amount: Number(instForm.installment_amount),
        due_date: instForm.due_date,
        notes: instForm.notes || null,
        status: 'Pending',
      });
      toast.success('Installment scheduled');
      setShowInstModal(false);
      setInstForm(emptyInstallment);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const markInstallmentPaid = async (inst) => {
    if (!window.confirm(`Mark installment #${inst.installment_number} (₹${formatINR(inst.installment_amount)}) as paid today?`)) return;
    try {
      await api.put(`/payment_installments/payment-installments/${inst.installment_id}`, {
        status: 'Paid',
        paid_date: new Date().toISOString().slice(0, 10),
      });
      toast.success('Marked as paid');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const totals = useMemo(() => {
    const received = payments.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0);
    const pendingInst = installments.filter(i => i.status !== 'Paid');
    const paidInst    = installments.filter(i => i.status === 'Paid');
    const scheduled = installments.reduce((s, i) => s + (Number(i.installment_amount) || 0), 0);
    const paid      = paidInst.reduce((s, i) => s + (Number(i.installment_amount) || 0), 0);
    const pending   = pendingInst.reduce((s, i) => s + (Number(i.installment_amount) || 0), 0);
    const overdue   = pendingInst.filter(i => new Date(i.due_date) < new Date()).length;
    return { received, scheduled, paid, pending, overdue, budget: Number(project?.estimated_budget) || 0 };
  }, [payments, installments, project]);

  const now = new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(`/projects/${projectId}`)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back to project
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Wallet size={16} /> Project · Payments
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            {project && <p className="text-sm text-gray-600 mt-0.5">{project.project_name}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={reload}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowPayModal(true)} disabled={!project?.client_id}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
              <Plus size={14} /> Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <SummaryTile label="Budget" value={totals.budget} icon={<IndianRupee size={18} className="text-gray-500" />} />
        <SummaryTile label="Received" value={totals.received} icon={<CheckCircle2 size={18} className="text-emerald-600" />} tone="emerald" />
        <SummaryTile label="Scheduled" value={totals.scheduled} icon={<Calendar size={18} className="text-blue-600" />} tone="blue" />
        <SummaryTile label="Paid (schedule)" value={totals.paid} icon={<TrendingUp size={18} className="text-purple-600" />} tone="purple" />
        <SummaryTile label={`Pending${totals.overdue ? ` · ${totals.overdue} overdue` : ''}`}
                     value={totals.pending} icon={<Clock size={18} className="text-amber-600" />}
                     tone={totals.overdue ? 'red' : 'amber'} />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : !project?.client_id ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Project has no client — cannot record payments.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payment history */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Receipt size={14} /> Payment History</h2>
              <span className="text-xs text-gray-500">{payments.length}</span>
            </div>
            {payments.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">No payments recorded yet.</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {payments.map(p => (
                  <div key={p.payment_id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          ₹{formatINR2(p.payment_amount)}
                          {p.payment_stage && <span className="text-xs text-gray-500 ml-2">· {p.payment_stage}</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {p.payment_number && <span> · {p.payment_number}</span>}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status || 'Received'}
                      </span>
                    </div>
                    {p.payment_purpose && <div className="text-xs text-gray-700 mt-1">{p.payment_purpose}</div>}
                    <button onClick={() => { setSelectedPaymentId(p.payment_id); setInstForm({ ...emptyInstallment, installment_number: (installments.filter(i => i.payment_id === p.payment_id).length + 1) }); setShowInstModal(true); }}
                            className="mt-2 text-xs text-orange-600 hover:underline">
                      + Schedule installment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Installment schedule */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calendar size={14} /> Installment Schedule</h2>
              <span className="text-xs text-gray-500">{installments.length}</span>
            </div>
            {installments.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">No installments scheduled yet.</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {installments.map(i => {
                  const isPaid = i.status === 'Paid';
                  const dueDate = new Date(i.due_date);
                  const isOverdue = !isPaid && dueDate < now;
                  return (
                    <div key={i.installment_id} className={`p-4 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                            #{i.installment_number} · ₹{formatINR2(i.installment_amount)}
                            {isOverdue && <AlertTriangle size={12} className="text-red-600" />}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Due {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {isPaid && <> · Paid {new Date(i.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>}
                          </div>
                        </div>
                        {isPaid ? (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS.Completed}`}>Paid</span>
                        ) : (
                          <button onClick={() => markInstallmentPaid(i)}
                                  className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            Mark paid
                          </button>
                        )}
                      </div>
                      {i.notes && <div className="text-xs text-gray-600 mt-1">{i.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayModal && (
        <Modal title="Record Payment" onClose={() => setShowPayModal(false)}>
          <form onSubmit={submitPayment} className="p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select value={payForm.payment_type_id} onChange={e => setPayField('payment_type_id', e.target.value)}
                        required className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Select…</option>
                  {types.map(t => <option key={t.payment_type_id} value={t.payment_type_id}>{t.payment_type_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Method *</label>
                <select value={payForm.payment_method_id} onChange={e => setPayField('payment_method_id', e.target.value)}
                        required className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Select…</option>
                  {methods.map(m => <option key={m.payment_method_id} value={m.payment_method_id}>{m.method_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ₹ *</label>
                <input type="number" step="0.01" min="0" value={payForm.payment_amount} onChange={e => setPayField('payment_amount', e.target.value)}
                       required className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
                <input type="date" value={payForm.payment_date} onChange={e => setPayField('payment_date', e.target.value)}
                       required className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
                <select value={payForm.payment_stage} onChange={e => setPayField('payment_stage', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Advance</option><option>Milestone</option><option>Final</option><option>Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cheque / UPI / Ref</label>
                <input value={payForm.cheque_number || payForm.upi_transaction_id || payForm.online_reference_number}
                       onChange={e => setPayField('online_reference_number', e.target.value)}
                       placeholder="Cheque no. / UPI ref / Txn id"
                       className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Purpose *</label>
                <input value={payForm.payment_purpose} onChange={e => setPayField('payment_purpose', e.target.value)}
                       required placeholder="e.g. Booking amount for construction contract"
                       className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={payForm.payment_notes} onChange={e => setPayField('payment_notes', e.target.value)}
                          rows="2" className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setShowPayModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Installment modal */}
      {showInstModal && (
        <Modal title={`Schedule Installment · Payment #${selectedPaymentId}`} onClose={() => setShowInstModal(false)}>
          <form onSubmit={submitInstallment} className="p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Installment #</label>
                <input type="number" min="1" value={instForm.installment_number} onChange={e => setInstField('installment_number', e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ₹ *</label>
                <input type="number" step="0.01" min="0" value={instForm.installment_amount} onChange={e => setInstField('installment_amount', e.target.value)}
                       required className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                <input type="date" value={instForm.due_date} onChange={e => setInstField('due_date', e.target.value)}
                       required className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input value={instForm.notes} onChange={e => setInstField('notes', e.target.value)}
                       placeholder="e.g. Milestone 2: slab casting complete"
                       className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setShowInstModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const SummaryTile = ({ label, value, icon, tone = 'gray' }) => {
  const toneMap = {
    gray:    'border-gray-200',
    emerald: 'border-emerald-200 bg-emerald-50/40',
    blue:    'border-blue-200 bg-blue-50/40',
    purple:  'border-purple-200 bg-purple-50/40',
    amber:   'border-amber-200 bg-amber-50/40',
    red:     'border-red-200 bg-red-50/40',
  };
  return (
    <div className={`bg-white border rounded-xl p-4 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 flex items-center">
        <IndianRupee size={16} /> {formatINR(value)}
      </div>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default ProjectPayments;
