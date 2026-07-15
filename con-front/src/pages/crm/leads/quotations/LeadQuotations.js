// src/components/LeadQuotations.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  History,
  TrendingUp,
  FileCheck,
  Info
} from 'lucide-react';
import { leadQuotationsAPI, leadRequirementsAPI } from '../../../../services/leadsApi';

const LeadQuotations = ({ leadId }) => {
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [latestRequirement, setLatestRequirement] = useState(null);
  const [prefilledFromRequirement, setPrefilledFromRequirement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    quotation_title: '',
    project_title: '',
    package_type: 'Standard',
    package_rate_per_sqft: '',
    habitable_area: '',
    balcony_area: '',
    stilt_area: '',
    terrace_area: '',
    electrical_additional: '',
    plumbing_additional: '',
    finishing_additional: '',
    special_features_amount: '',
    miscellaneous_amount: '',
    discount_amount: '',
    gst_percentage: '18',
    estimated_duration_months: '',
    advance_percentage: '20',
    payment_terms: '',
    terms_conditions: '',
    inclusions: '',
    exclusions: ''
  });

  // Helper functions for safe number operations
  const safeNumber = (value, fallback = 0) => {
    const num = parseFloat(value);
    return isNaN(num) || num === null || num === undefined ? fallback : num;
  };

  const safeToFixed = (value, decimals = 2) => {
    const num = safeNumber(value);
    return num.toFixed(decimals);
  };

  const calculateTotalArea = (quotation) => {
    const habitable = safeNumber(quotation.habitable_area);
    const balcony = safeNumber(quotation.balcony_area);
    const stilt = safeNumber(quotation.stilt_area);
    const terrace = safeNumber(quotation.terrace_area);
    return habitable + balcony + stilt + terrace;
  };

  const calculatePackageAmount = (quotation) => {
    const rate = safeNumber(quotation.package_rate_per_sqft);
    const habitable = safeNumber(quotation.habitable_area);
    const balcony = safeNumber(quotation.balcony_area);
    const stilt = safeNumber(quotation.stilt_area);
    const terrace = safeNumber(quotation.terrace_area);
    
    return (habitable * rate) + 
           (balcony * rate * 0.65) + 
           (stilt * rate * 0.65) + 
           (terrace * rate * 0.65);
  };

  const calculateTotalAmount = (quotation) => {
    const packageAmount = calculatePackageAmount(quotation);
    const electrical = safeNumber(quotation.electrical_additional);
    const plumbing = safeNumber(quotation.plumbing_additional);
    const finishing = safeNumber(quotation.finishing_additional);
    const special = safeNumber(quotation.special_features_amount);
    const misc = safeNumber(quotation.miscellaneous_amount);
    const discount = safeNumber(quotation.discount_amount);
    const gstRate = safeNumber(quotation.gst_percentage, 18);
    
    const subtotal = packageAmount + electrical + plumbing + finishing + special + misc - discount;
    const gstAmount = subtotal * (gstRate / 100);
    
    return subtotal + gstAmount;
  };

  useEffect(() => {
    if (leadId) {
      loadQuotations();
      loadLatestRequirement();
    }
  }, [leadId]);

  // Load the most appropriate requirement for pre-filling:
  // priority: Finalized > Under_Discussion > Draft (most recent wins).
  const loadLatestRequirement = async () => {
    try {
      const data = await leadRequirementsAPI.getByLeadId(leadId);
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (list.length === 0) {
        setLatestRequirement(null);
        return;
      }
      const finalized = list.find(r => r.status === 'Finalized');
      const picked = finalized || list[0]; // API returns most recent first by convention
      setLatestRequirement(picked);
    } catch (err) {
      console.error('Error loading requirements for pre-fill:', err);
      setLatestRequirement(null);
    }
  };

  // Map a lead_requirement row to quotation form defaults.
  const buildPrefillFromRequirement = (req) => {
    if (!req) return {};

    // Requirements use "Standard Package", quotations use "Standard" — strip suffix.
    const rawPkg = (req.package_type || '').replace(/\s*Package\s*$/i, '').trim();
    const validPackages = ['Basic', 'Standard', 'Premium', 'Custom'];
    const packageType = validPackages.includes(rawPkg) ? rawPkg : 'Standard';

    // Derive a sensible rate from budget + built-up area if both are present.
    let rate = '';
    const bua = parseFloat(req.built_up_area);
    const budgetMax = parseFloat(req.budget_range_max);
    const budgetMin = parseFloat(req.budget_range_min);
    const avgBudget = budgetMax && budgetMin ? (budgetMax + budgetMin) / 2 : (budgetMax || budgetMin);
    if (bua > 0 && avgBudget > 0) {
      rate = Math.round(avgBudget / bua).toString();
    }

    return {
      quotation_title: req.requirement_title ? `Quotation - ${req.requirement_title}` : '',
      project_title: req.requirement_title || '',
      package_type: packageType,
      package_rate_per_sqft: rate,
      habitable_area: req.built_up_area ? String(req.built_up_area) : '',
    };
  };

  const loadQuotations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await leadQuotationsAPI.getByLeadId(leadId);
      console.log('Loaded quotations:', data);
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setError('Failed to load quotations: ' + error.message);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuotationHistory = async (quotationId) => {
    try {
      const data = await leadQuotationsAPI.getHistory(leadId, quotationId);
      setQuotationHistory(Array.isArray(data) ? data : []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading quotation history:', error);
      setError('Failed to load quotation history');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.quotation_title.trim()) {
      setError('Quotation title is required');
      return;
    }

    try {
      if (editingQuotation) {
        await leadQuotationsAPI.update(leadId, editingQuotation.lead_quotation_id, formData);
      } else {
        await leadQuotationsAPI.create(leadId, formData);
      }
      await loadQuotations();
      handleCancel();
    } catch (error) {
      console.error('Error saving quotation:', error);
      setError('Failed to save quotation: ' + error.message);
    }
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      quotation_title: quotation.quotation_title || quotation.project_title || '',
      project_title: quotation.project_title || '',
      package_type: quotation.package_type || 'Standard',
      package_rate_per_sqft: quotation.package_rate_per_sqft || '',
      habitable_area: quotation.habitable_area || '',
      balcony_area: quotation.balcony_area || '',
      stilt_area: quotation.stilt_area || '',
      terrace_area: quotation.terrace_area || '',
      electrical_additional: quotation.electrical_additional || '',
      plumbing_additional: quotation.plumbing_additional || '',
      finishing_additional: quotation.finishing_additional || '',
      special_features_amount: quotation.special_features_amount || '',
      miscellaneous_amount: quotation.miscellaneous_amount || '',
      discount_amount: quotation.discount_amount || '',
      gst_percentage: quotation.gst_percentage || '18',
      estimated_duration_months: quotation.estimated_duration_months || '',
      advance_percentage: quotation.advance_percentage || '20',
      payment_terms: quotation.payment_terms || '',
      terms_conditions: quotation.terms_conditions || '',
      inclusions: quotation.inclusions || '',
      exclusions: quotation.exclusions || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (quotationId) => {
    if (!window.confirm('Are you sure you want to delete this quotation? Its history and version links will also be removed.')) {
      return;
    }
    try {
      await leadQuotationsAPI.delete(leadId, quotationId);
      await loadQuotations();
      setError('');
    } catch (error) {
      console.error('Error deleting quotation:', error);
      const backendMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(`Failed to delete quotation: ${backendMsg}`);
    }
  };

  const handleSend = async (quotationId) => {
    try {
      await leadQuotationsAPI.send(leadId, quotationId, {
        send_email: true,
        send_whatsapp: true
      });
      await loadQuotations();
      setError('');
      alert('Quotation sent successfully');
    } catch (error) {
      console.error('Error sending quotation:', error);
      setError('Failed to send quotation: ' + error.message);
    }
  };

  const handleStatusUpdate = async (quotationId, newStatus) => {
    try {
      await leadQuotationsAPI.updateStatus(leadId, quotationId, newStatus);
      await loadQuotations();
      setError('');
    } catch (error) {
      console.error('Error updating quotation status:', error);
      setError('Failed to update quotation status: ' + error.message);
    }
  };

  const handleDownloadPDF = async (quotationId) => {
    const quotation = quotations.find(q => q.lead_quotation_id === quotationId);
    if (!quotation) {
      setError('Quotation not found');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      setError('Please allow popups to download the quotation PDF.');
      return;
    }
    printWindow.document.write(buildQuotationPrintHTML(quotation));
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };
  };

  // Build a styled, print-ready HTML document for a quotation.
  // Users can "Save as PDF" from the browser's print dialog.
  const buildQuotationPrintHTML = (q) => {
    const fmt = (n) => {
      const num = safeNumber(n);
      return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const fmtArea = (n) => safeToFixed(n) + ' sq.ft';
    const today = new Date().toLocaleDateString('en-IN');
    const validUntil = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : 'N/A';
    const quotationDate = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : today;

    const rate = safeNumber(q.package_rate_per_sqft);
    const hab = safeNumber(q.habitable_area);
    const bal = safeNumber(q.balcony_area);
    const sti = safeNumber(q.stilt_area);
    const ter = safeNumber(q.terrace_area);
    const habAmt = hab * rate;
    const balAmt = bal * rate * 0.65;
    const stiAmt = sti * rate * 0.65;
    const terAmt = ter * rate * 0.65;
    const packageAmt = habAmt + balAmt + stiAmt + terAmt;

    const electrical = safeNumber(q.electrical_additional);
    const plumbing = safeNumber(q.plumbing_additional);
    const finishing = safeNumber(q.finishing_additional);
    const special = safeNumber(q.special_features_amount);
    const misc = safeNumber(q.miscellaneous_amount);
    const discount = safeNumber(q.discount_amount);
    const gstRate = safeNumber(q.gst_percentage, 18);

    const subtotal = packageAmt + electrical + plumbing + finishing + special + misc - discount;
    const gstAmt = subtotal * (gstRate / 100);
    const grandTotal = subtotal + gstAmt;
    const advancePct = safeNumber(q.advance_percentage, 20);
    const advanceAmt = grandTotal * (advancePct / 100);

    const areaRow = (label, area, multiplier, amount) => {
      if (safeNumber(area) <= 0) return '';
      const mult = multiplier === 1 ? '' : ` × ${multiplier}`;
      return `<tr><td>${label}</td><td class="num">${fmtArea(area)}</td><td class="num">${fmt(rate)}${mult}</td><td class="num">${fmt(amount)}</td></tr>`;
    };
    const addRow = (label, amount) => {
      if (safeNumber(amount) === 0) return '';
      return `<tr><td colspan="3">${label}</td><td class="num">${fmt(amount)}</td></tr>`;
    };

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Quotation ${q.lead_quotation_number || q.lead_quotation_id}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 40px; font-size: 12px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ea580c; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 24px; font-weight: 700; color: #ea580c; }
  .brand-sub { color: #666; font-size: 11px; margin-top: 4px; }
  .meta { text-align: right; font-size: 11px; }
  .meta .label { color: #666; }
  .meta .value { font-weight: 600; }
  h1 { font-size: 18px; margin: 0 0 4px 0; }
  h2 { font-size: 14px; margin: 24px 0 8px 0; color: #ea580c; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 8px; }
  .info-grid .k { color: #666; }
  .info-grid .v { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td.num, th.num { text-align: right; }
  .totals { margin-top: 12px; }
  .totals tr.subtotal td { border-top: 2px solid #111; font-weight: 600; }
  .totals tr.grand td { background: #ea580c; color: white; font-weight: 700; font-size: 14px; }
  .notes { font-size: 11px; color: #444; white-space: pre-wrap; margin-top: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 48px; }
  .sign-box { width: 45%; text-align: center; font-size: 11px; color: #444; }
  .sign-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 10px; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ConstructPro</div>
      <div class="brand-sub">Construction Project Management</div>
    </div>
    <div class="meta">
      <div><span class="label">Quotation No:</span> <span class="value">${q.lead_quotation_number || 'LQ-' + q.lead_quotation_id}</span></div>
      <div><span class="label">Date:</span> <span class="value">${quotationDate}</span></div>
      <div><span class="label">Valid Until:</span> <span class="value">${validUntil}</span></div>
      <div><span class="label">Version:</span> <span class="value">v${q.version_number || 1}</span></div>
    </div>
  </div>

  <h1>${q.quotation_title || q.project_title || 'Construction Quotation'}</h1>
  ${q.project_title && q.quotation_title !== q.project_title ? `<div style="color:#666;margin-bottom:16px;">${q.project_title}</div>` : ''}

  <h2>Project Details</h2>
  <div class="info-grid">
    <div><span class="k">Package Type:</span> <span class="v">${q.package_type || 'N/A'}</span></div>
    <div><span class="k">Rate per Sq.Ft:</span> <span class="v">${fmt(rate)}</span></div>
    <div><span class="k">Estimated Duration:</span> <span class="v">${q.estimated_duration_months || 'N/A'} months</span></div>
    <div><span class="k">Status:</span> <span class="v">${(q.status || 'Draft').replace(/_/g, ' ')}</span></div>
  </div>

  <h2>Area &amp; Package Breakdown</h2>
  <table>
    <thead>
      <tr><th>Area Type</th><th class="num">Area</th><th class="num">Rate</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>
      ${areaRow('Habitable Area', hab, 1, habAmt)}
      ${areaRow('Balcony Area', bal, 0.65, balAmt)}
      ${areaRow('Stilt Area', sti, 0.65, stiAmt)}
      ${areaRow('Terrace Area', ter, 0.65, terAmt)}
      <tr><td colspan="3"><b>Package Construction Total</b></td><td class="num"><b>${fmt(packageAmt)}</b></td></tr>
    </tbody>
  </table>

  ${(electrical + plumbing + finishing + special + misc + discount) > 0 ? `
  <h2>Additional Costs &amp; Adjustments</h2>
  <table>
    <tbody>
      ${addRow('Electrical Additional', electrical)}
      ${addRow('Plumbing Additional', plumbing)}
      ${addRow('Finishing Additional', finishing)}
      ${addRow('Special Features', special)}
      ${addRow('Miscellaneous', misc)}
      ${discount > 0 ? `<tr><td colspan="3">Discount</td><td class="num">- ${fmt(discount)}</td></tr>` : ''}
    </tbody>
  </table>` : ''}

  <h2>Summary</h2>
  <table class="totals">
    <tbody>
      <tr class="subtotal"><td colspan="3">Subtotal (before GST)</td><td class="num">${fmt(subtotal)}</td></tr>
      <tr><td colspan="3">GST @ ${gstRate}%</td><td class="num">${fmt(gstAmt)}</td></tr>
      <tr class="grand"><td colspan="3">GRAND TOTAL</td><td class="num">${fmt(grandTotal)}</td></tr>
      <tr><td colspan="3">Advance Payable (${advancePct}%)</td><td class="num">${fmt(advanceAmt)}</td></tr>
    </tbody>
  </table>

  ${q.inclusions ? `<h2>Inclusions</h2><div class="notes">${q.inclusions}</div>` : ''}
  ${q.exclusions ? `<h2>Exclusions</h2><div class="notes">${q.exclusions}</div>` : ''}
  ${q.terms_conditions ? `<h2>Terms &amp; Conditions</h2><div class="notes">${q.terms_conditions}</div>` : ''}
  ${q.payment_terms ? `<h2>Payment Terms</h2><div class="notes">${q.payment_terms}</div>` : ''}

  <div class="sign">
    <div class="sign-box"><div class="sign-line">Authorised Signatory</div></div>
    <div class="sign-box"><div class="sign-line">Client Acceptance</div></div>
  </div>

  <div class="footer">
    This is a computer-generated quotation. Generated on ${today}.
  </div>

  <script>
    // auto-focus print dialog
    window.addEventListener('afterprint', () => window.close());
  </script>
</body>
</html>`;
  };

  const handleCreateVersion = async (quotationId) => {
    const notes = prompt(
      'What changed in this new version? (reason / client feedback / notes)'
    );
    if (notes === null) return; // user cancelled

    try {
      const result = await leadQuotationsAPI.createVersion(leadId, quotationId, {
        notes,
        reason_for_change: notes
      });
      await loadQuotations();
      setError('');
      const newNumber = result?.data?.lead_quotation_number || 'new version';
      alert(`${result?.message || 'New version created'}: ${newNumber}`);
    } catch (error) {
      console.error('Error creating version:', error);
      const backendMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(`Failed to create new version: ${backendMsg}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingQuotation(null);
    setPrefilledFromRequirement(false);
    setError('');
    setFormData({
      quotation_title: '',
      project_title: '',
      package_type: 'Standard',
      package_rate_per_sqft: '',
      habitable_area: '',
      balcony_area: '',
      stilt_area: '',
      terrace_area: '',
      electrical_additional: '',
      plumbing_additional: '',
      finishing_additional: '',
      special_features_amount: '',
      miscellaneous_amount: '',
      discount_amount: '',
      gst_percentage: '18',
      estimated_duration_months: '',
      advance_percentage: '20',
      payment_terms: '',
      terms_conditions: '',
      inclusions: '',
      exclusions: ''
    });
  };

  // Open the create form and pre-fill from the finalized/latest requirement if available.
  const handleCreateClick = () => {
    setEditingQuotation(null);
    setError('');
    const prefill = buildPrefillFromRequirement(latestRequirement);
    const hasPrefillData = Object.values(prefill).some(v => v !== '' && v !== null && v !== undefined);
    setFormData({
      quotation_title: '',
      project_title: '',
      package_type: 'Standard',
      package_rate_per_sqft: '',
      habitable_area: '',
      balcony_area: '',
      stilt_area: '',
      terrace_area: '',
      electrical_additional: '',
      plumbing_additional: '',
      finishing_additional: '',
      special_features_amount: '',
      miscellaneous_amount: '',
      discount_amount: '',
      gst_percentage: '18',
      estimated_duration_months: '',
      advance_percentage: '20',
      payment_terms: '',
      terms_conditions: '',
      inclusions: '',
      exclusions: '',
      ...prefill
    });
    setPrefilledFromRequirement(hasPrefillData);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'Under_Review': 'bg-blue-100 text-blue-800 border-blue-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Sent': 'bg-purple-100 text-purple-800 border-purple-200',
      'Viewed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Under_Discussion': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Accepted': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'Expired': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatCurrency = (amount) => {
    const numAmount = safeNumber(amount);
    if (numAmount === 0) return '₹0';
    
    if (numAmount >= 10000000) {
      return `₹${(numAmount / 10000000).toFixed(2)} Cr`;
    } else if (numAmount >= 100000) {
      return `₹${(numAmount / 100000).toFixed(2)} L`;
    } else {
      return `₹${numAmount.toLocaleString('en-IN')}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quotations</h3>
          <p className="text-sm text-gray-600">Manage and track quotations for this lead</p>
        </div>
        {!showForm && (
          <button
            onClick={handleCreateClick}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Quotation</span>
          </button>
        )}
      </div>

      {/* Requirement availability hint (shown when NOT in form) */}
      {!showForm && !editingQuotation && (
        latestRequirement ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
            <FileCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <span className="font-medium">
                {latestRequirement.status === 'Finalized' ? 'Finalized requirement found' : 'Requirement found'}:
              </span>{' '}
              <span>{latestRequirement.requirement_title}</span>
              <span className="text-green-700"> — the new quotation form will be pre-filled from this.</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              No requirement exists for this lead yet. Add a requirement first so the quotation form can be pre-filled automatically.
            </div>
          </div>
        )
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="text-red-800 flex-1">{error}</div>
          <button
            onClick={() => setError('')}
            className="ml-3 text-red-600 hover:text-red-800"
            title="Dismiss"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingQuotation ? 'Edit Quotation' : 'New Quotation'}
          </h4>

          {/* Pre-fill banner */}
          {!editingQuotation && prefilledFromRequirement && latestRequirement && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
              <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 flex-1">
                <span className="font-medium">Pre-filled from requirement:</span>{' '}
                <span>{latestRequirement.requirement_title}</span>
                <div className="text-xs text-blue-700 mt-1">
                  Title, project, package type, habitable area, and rate (derived from budget) have been populated. Review and adjust before saving.
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quotation Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quotation Title *
                </label>
                <input
                  type="text"
                  name="quotation_title"
                  value={formData.quotation_title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Villa Construction - Standard Package"
                />
              </div>

              {/* Project Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  name="project_title"
                  value={formData.project_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter project title"
                />
              </div>

              {/* Package Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Type *
                </label>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Package Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate per Sq.Ft (₹) *
                </label>
                <input
                  type="number"
                  name="package_rate_per_sqft"
                  value={formData.package_rate_per_sqft}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter rate per sq.ft"
                />
              </div>

              {/* Area Breakdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habitable Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="habitable_area"
                  value={formData.habitable_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter habitable area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balcony Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="balcony_area"
                  value={formData.balcony_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter balcony area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stilt Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="stilt_area"
                  value={formData.stilt_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter stilt area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terrace Area (sq.ft)
                </label>
                <input
                  type="number"
                  name="terrace_area"
                  value={formData.terrace_area}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter terrace area"
                />
              </div>

              {/* Additional Costs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Electrical Additional (₹)
                </label>
                <input
                  type="number"
                  name="electrical_additional"
                  value={formData.electrical_additional}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plumbing Additional (₹)
                </label>
                <input
                  type="number"
                  name="plumbing_additional"
                  value={formData.plumbing_additional}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Percentage (%)
                </label>
                <input
                  type="number"
                  name="gst_percentage"
                  value={formData.gst_percentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (months)
                </label>
                <input
                  type="number"
                  name="estimated_duration_months"
                  value={formData.estimated_duration_months}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter duration"
                />
              </div>

              {/* Advance Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Percentage (%)
                </label>
                <input
                  type="number"
                  name="advance_percentage"
                  value={formData.advance_percentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter advance %"
                />
              </div>

              {/* Terms & Conditions */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter terms and conditions..."
                />
              </div>

              {/* Inclusions */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inclusions
                </label>
                <textarea
                  name="inclusions"
                  value={formData.inclusions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="What's included in this quotation..."
                />
              </div>

              {/* Exclusions */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exclusions
                </label>
                <textarea
                  name="exclusions"
                  value={formData.exclusions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="What's not included..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first quotation for this lead
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quotation) => (
            <div
              key={quotation.lead_quotation_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {quotation.lead_quotation_number || `Quotation #${quotation.lead_quotation_id}`}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(quotation.status)}`}>
                      {quotation.status?.replace('_', ' ') || 'Draft'}
                    </span>
                    {quotation.is_current_version && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Current Version
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      v{quotation.version_number || '1'}
                    </span>
                  </div>
                  <p className="text-base font-medium text-gray-700 mb-2">
                    {quotation.quotation_title || quotation.project_title || 'Untitled Quotation'}
                  </p>
                  {quotation.project_title && quotation.quotation_title !== quotation.project_title && (
                    <p className="text-sm text-gray-600">{quotation.project_title}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadQuotationHistory(quotation.lead_quotation_id)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="View History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  {quotation.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => handleEdit(quotation)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(quotation.lead_quotation_id, 'Approved')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {quotation.status === 'Approved' && (
                    <button
                      onClick={() => handleSend(quotation.lead_quotation_id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                      title="Send to Client"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadPDF(quotation.lead_quotation_id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Print / Save as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {quotation.is_current_version && (
                    <button
                      onClick={() => handleCreateVersion(quotation.lead_quotation_id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Create New Version"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(quotation.lead_quotation_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quotation Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600">Package Type</p>
                  <p className="text-sm font-medium text-gray-900">{quotation.package_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Rate/Sq.Ft</p>
                  <p className="text-sm font-medium text-gray-900">
                    {quotation.package_rate_per_sqft ? `₹${safeToFixed(quotation.package_rate_per_sqft)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Area</p>
                  <p className="text-sm font-medium text-gray-900">
                    {safeToFixed(calculateTotalArea(quotation))} sq.ft
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(quotation.total_amount || calculateTotalAmount(quotation))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {quotation.estimated_duration_months || 'N/A'} months
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                {quotation.sent_date && (
                  <div className="flex items-center space-x-1">
                    <Send className="h-4 w-4" />
                    <span>Sent: {new Date(quotation.sent_date).toLocaleDateString()}</span>
                  </div>
                )}
                {quotation.valid_until && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Valid Until: {new Date(quotation.valid_until).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quotation History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {quotationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No history available</p>
                </div>
              ) : (
                quotationHistory.map((history, index) => (
                  <div key={history.history_id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">Version {history.version_number || 'N/A'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.status_at_time)}`}>
                            {history.status_at_time?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{history.change_type?.replace('_', ' ') || 'Change'}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {history.change_date ? new Date(history.change_date).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {history.changes_made && (
                      <p className="text-sm text-gray-700 mt-2">{history.changes_made}</p>
                    )}
                    {history.reason_for_change && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Reason:</strong> {history.reason_for_change}
                      </p>
                    )}
                    {history.client_feedback_received && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm text-blue-900">
                          <strong>Client Feedback:</strong> {history.client_feedback_received}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadQuotations;