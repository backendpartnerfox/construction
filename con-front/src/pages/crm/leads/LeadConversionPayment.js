import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  IndianRupee,
  X,
  UserCheck,
  Receipt,
  FileText,
  Info
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// =======================================================
// LeadConversionPayment
// Auto-calculates 2% advance from lead quotation total
// =======================================================
const ADVANCE_PERCENTAGE = 2;

const LeadConversionPayment = ({ lead, onConversionSuccess, onClose }) => {
  const [step, setStep] = useState('loading'); // loading, choose, processing, success, error, no_quotation
  const [paymentMode, setPaymentMode] = useState(null);
  const [manualForm, setManualForm] = useState({
    payment_method_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    bank_name: '',
    cheque_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [quotation, setQuotation] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setStep('loading');
    try {
      // Load payment methods
      const methodsRes = await api.get('/api/payment_methods');
      const seen = new Set();
      const unique = (methodsRes.data || []).filter(m => {
        if (seen.has(m.method_name)) return false;
        seen.add(m.method_name);
        return m.is_active;
      });
      setPaymentMethods(unique);

      // Load lead's current quotation
      let activeQuot = null;
      let quotations = [];
      try {
        const quotRes = await api.get(`/api/lead_quotations/lead/${lead.lead_id}`);
        const rawData = quotRes.data;
        quotations = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        console.log('[LeadConversion] Quotations found:', quotations.length);
        
        // Find the latest approved/sent/current version quotation
        activeQuot = quotations.find(q => q.is_current_version && q.total_amount && parseFloat(q.total_amount) > 0 && ['Approved', 'Sent', 'Draft'].includes(q.status))
          || quotations.find(q => q.is_current_version && q.total_amount && parseFloat(q.total_amount) > 0)
          || quotations.find(q => q.total_amount && parseFloat(q.total_amount) > 0);
      } catch (quotErr) {
        console.log('[LeadConversion] No quotations found:', quotErr.message);
      }

      if (activeQuot && activeQuot.total_amount && parseFloat(activeQuot.total_amount) > 0) {
        // Path A: Use quotation amount
        console.log('[LeadConversion] Path A: Using quotation', activeQuot.lead_quotation_id, 'total:', activeQuot.total_amount);
        setQuotation(activeQuot);
        const total = parseFloat(activeQuot.total_amount);
        const advance = Math.round(total * ADVANCE_PERCENTAGE / 100);
        setTotalAmount(total);
        setAdvanceAmount(advance);
        setStep('choose');
      } else {
        // No valid quotation — try to calculate from package + area
        const area = parseFloat(lead.estimated_built_up_area) || parseFloat(lead.site_area) || 0;
        const enquiryId = lead.enquiry_id;
        let packageRate = 0;
        let packageName = '';

        console.log('[LeadConversion] No quotation. Lead area:', area, 'enquiry_id:', enquiryId);

        // Try to get package info from lead's enquiry
        if (area > 0 && enquiryId) {
          try {
            const enquiryRes = await api.get(`/api/enquiries/${enquiryId}`);
            const enquiry = enquiryRes.data?.data || enquiryRes.data;
            console.log('[LeadConversion] Enquiry package_id:', enquiry?.package_id);
            if (enquiry?.package_id) {
              const pkgRes = await api.get(`/api/packages/${enquiry.package_id}`);
              const pkg = pkgRes.data?.data || pkgRes.data;
              packageRate = parseFloat(pkg?.total_price_per_sqft) || 0;
              packageName = pkg?.package_name || '';
              console.log('[LeadConversion] Package:', packageName, 'rate:', packageRate);
            }
          } catch (pkgErr) {
            console.error('[LeadConversion] Could not fetch package info:', pkgErr.message);
          }
        }

        if (area > 0 && packageRate > 0) {
          // Path B: Auto-calculate from package × area
          const total = area * packageRate;
          const advance = Math.round(total * ADVANCE_PERCENTAGE / 100);
          console.log('[LeadConversion] Path B: Auto-calc', packageName, area, 'x', packageRate, '=', total, 'advance:', advance);
          setQuotation({ auto_calculated: true, package_name: packageName, package_rate_per_sqft: packageRate, built_up_area: area });
          setTotalAmount(total);
          setAdvanceAmount(advance);
          setStep('choose');
        } else {
          // Path C: No quotation AND no package/area — let user enter amount manually
          console.log('[LeadConversion] Path C: Manual amount entry');
          setStep('manual_amount');
        }
      }

      // Load Razorpay script
      if (!document.getElementById('razorpay-script')) {
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load quotation data');
      setStep('no_quotation');
    }
  };

  // -------------------------------------------------------
  // RAZORPAY ONLINE PAYMENT
  // -------------------------------------------------------
  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderRes = await api.post(`/api/leads/${lead.lead_id}/create-payment-order`, {
        amount: advanceAmount,
        quotation_id: quotation?.lead_quotation_id,
        notes: `2% advance on quotation total ₹${formatCurrency(totalAmount)}`
      });

      const orderData = orderRes.data.data;

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_in_paise,
        currency: orderData.currency,
        name: 'Hams Constructions',
        description: `2% Advance - ${lead.lead_number} (₹${formatCurrency(totalAmount)} total)`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: orderData.lead.contact_name || '',
          email: orderData.lead.email || '',
          contact: orderData.lead.phone || ''
        },
        notes: {
          lead_id: lead.lead_id,
          lead_number: lead.lead_number,
          quotation_total: totalAmount,
          advance_percentage: ADVANCE_PERCENTAGE
        },
        theme: { color: '#EA580C' },
        handler: async (response) => {
          await verifyAndConvert(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setLoading(false);
          setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        setError('Razorpay SDK not loaded. Please refresh and try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Razorpay order error:', err);
      const errMsg = err.response?.data?.error || err.message;
      if (errMsg.includes('Authentication') || errMsg.includes('401')) {
        setError('Razorpay API keys not configured. Please use Offline Payment or update keys in .env file.');
      } else {
        setError(errMsg);
      }
      setLoading(false);
    }
  };

  const verifyAndConvert = async (razorpayResponse) => {
    setStep('processing');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await api.post(`/api/leads/${lead.lead_id}/verify-payment-and-convert`, {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        payment_method: 'online',
        converted_by: user.id || 1
      });

      setResult(res.data.data);
      setStep('success');
      setLoading(false);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Payment verification failed');
      setStep('error');
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // MANUAL / OFFLINE PAYMENT
  // -------------------------------------------------------
  const handleManualConversion = async () => {
    if (!manualForm.payment_method_id) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await api.post(`/api/leads/${lead.lead_id}/convert-to-client`, {
        payment_amount: advanceAmount,
        payment_method_id: parseInt(manualForm.payment_method_id),
        payment_date: manualForm.payment_date,
        payment_reference: manualForm.payment_reference,
        bank_name: manualForm.bank_name,
        cheque_number: manualForm.cheque_number,
        converted_by: user.id || 1,
        notes: manualForm.notes || `2% advance on quotation total ₹${formatCurrency(totalAmount)}`
      });

      setResult(res.data.data);
      setStep('success');
    } catch (err) {
      console.error('Manual conversion error:', err);
      setError(err.response?.data?.error || 'Conversion failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------
  const formatCurrency = (val) => {
    if (!val) return '0';
    const num = parseFloat(val);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString('en-IN');
  };

  // ======================== LOADING ========================
  if (step === 'loading') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  // ======================== NO QUOTATION — MANUAL AMOUNT ENTRY ========================
  if (step === 'no_quotation' || step === 'manual_amount') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IndianRupee className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Enter Project Amount</h2>
          <p className="text-gray-600 mb-5 text-center text-sm">
            No quotation found for <strong>{lead.lead_number}</strong>. 
            Enter the total project amount to calculate the 2% advance.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Amount (₹)</label>
              <input
                type="number"
                id="manual-total-amount"
                placeholder="e.g. 5000000"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg"
              />
            </div>
            {/* Show advance preview */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Advance (2%)</span>
                <span className="font-semibold text-orange-600" id="advance-preview">₹0</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const input = document.getElementById('manual-total-amount');
                  const val = parseFloat(input?.value) || 0;
                  if (val <= 0) {
                    alert('Please enter a valid amount');
                    return;
                  }
                  const advance = Math.round(val * ADVANCE_PERCENTAGE / 100);
                  setQuotation({ manual_entry: true });
                  setTotalAmount(val);
                  setAdvanceAmount(advance);
                  setStep('choose');
                }}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
              >
                Continue
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======================== SUCCESS ========================
  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversion Successful!</h2>
          <p className="text-gray-600 mb-6">
            Lead <strong>{lead.lead_number}</strong> has been converted to a client.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Client ID</span>
              <span className="font-semibold">#{result?.client_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment ID</span>
              <span className="font-semibold">#{result?.payment_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid (2%)</span>
              <span className="font-semibold text-green-600">₹{formatCurrency(result?.amount_paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quotation Total</span>
              <span className="font-semibold">₹{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => { if (onConversionSuccess) onConversionSuccess(result); }}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
            >
              View Client
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================== PROCESSING ========================
  if (step === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Verifying payment and creating client record.</p>
        </div>
      </div>
    );
  }

  // ======================== ERROR ========================
  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => { setStep('choose'); setError(null); }}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              Try Again
            </button>
            <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================== MAIN MODAL ========================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Convert Lead to Client</h2>
              <p className="text-sm text-gray-500">{lead.lead_number} — {lead.primary_contact_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Quotation / Amount Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {quotation?.auto_calculated
                  ? `Calculated from ${quotation.package_name} package`
                  : quotation?.manual_entry
                  ? 'Manually entered amount'
                  : `Quotation: ${quotation?.lead_quotation_number || `#${quotation?.lead_quotation_id}`}`
                }
              </span>
              {quotation?.auto_calculated && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Auto-calculated</span>
              )}
              {quotation?.manual_entry && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Manual</span>
              )}
              {quotation?.status && !quotation?.auto_calculated && !quotation?.manual_entry && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  quotation.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  quotation.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {quotation.status}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Project Total</p>
                <p className="text-lg font-bold text-gray-900">₹{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Advance ({ADVANCE_PERCENTAGE}%)</p>
                <p className="text-lg font-bold text-orange-600">₹{formatCurrency(advanceAmount)}</p>
              </div>
            </div>
            {quotation?.package_rate_per_sqft && (
              <p className="text-xs text-gray-500">
                Package: ₹{parseFloat(quotation.package_rate_per_sqft).toLocaleString('en-IN')}/sqft
                {quotation.built_up_area ? ` • ${quotation.built_up_area} sqft` : ''}
              </p>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              On successful payment of <strong>₹{formatCurrency(advanceAmount)}</strong> (2% advance), 
              this lead will be automatically converted to a client.
            </p>
          </div>

          {/* Payment Mode Selection */}
          {!paymentMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Payment Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPaymentMode('manual'); setError(null); }}
                  className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group"
                >
                  <Banknote className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                  <span className="font-medium text-gray-900">Offline Payment</span>
                  <span className="text-xs text-gray-500 mt-1">Cash, Cheque, Bank Transfer</span>
                </button>
                <button
                  onClick={() => {
                    if (!window.Razorpay) {
                      setError('Razorpay SDK not available. Use Offline Payment or configure Razorpay keys in .env');
                      return;
                    }
                    setPaymentMode('online'); setError(null);
                  }}
                  className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group"
                >
                  <CreditCard className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                  <span className="font-medium text-gray-900">Pay Online</span>
                  <span className="text-xs text-gray-500 mt-1">UPI, Card, Net Banking</span>
                </button>
              </div>
            </div>
          )}

          {/* ONLINE: Razorpay */}
          {paymentMode === 'online' && (
            <div className="space-y-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Pay ₹{formatCurrency(advanceAmount)} Now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setPaymentMode(null); setError(null); }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* MANUAL: Offline Payment */}
          {paymentMode === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={manualForm.payment_method_id}
                    onChange={(e) => setManualForm(f => ({ ...f, payment_method_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select method...</option>
                    {paymentMethods.map(m => (
                      <option key={m.payment_method_id} value={m.payment_method_id}>
                        {m.method_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={manualForm.payment_date}
                    onChange={(e) => setManualForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Txn ID</label>
                  <input
                    type="text"
                    value={manualForm.payment_reference}
                    onChange={(e) => setManualForm(f => ({ ...f, payment_reference: e.target.value }))}
                    placeholder="Transaction reference"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={manualForm.bank_name}
                    onChange={(e) => setManualForm(f => ({ ...f, bank_name: e.target.value }))}
                    placeholder="Bank name"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque No.</label>
                  <input
                    type="text"
                    value={manualForm.cheque_number}
                    onChange={(e) => setManualForm(f => ({ ...f, cheque_number: e.target.value }))}
                    placeholder="Cheque number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleManualConversion}
                  disabled={loading || !manualForm.payment_method_id}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      <span>Record ₹{formatCurrency(advanceAmount)} & Convert</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setPaymentMode(null); setError(null); }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadConversionPayment;
