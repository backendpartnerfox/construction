import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Send, Eye, DollarSign, Calendar, Clock, X, Download, TrendingUp, History, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientQuotationsService } from '../../../services/clientQuotationsService';
import { packagesService } from '../../../services/dropdownServices';

const ClientQuotations = ({ clientId, onSelectQuotation }) => {
  const [quotations, setQuotations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [formData, setFormData] = useState({
    client_id: clientId,
    client_requirement_id: '',
    quotation_number: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    package_id: '',
    package_name: '',
    package_rate: '',
    habitable_area: '',
    balcony_area: '',
    stilt_area: '',
    terrace_area: '',
    total_amount: '',
    gst_amount: '',
    grand_total: '',
    status: 'Draft',
    remarks: ''
  });

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      console.log('Fetching quotations for client:', clientId);
      const response = await clientQuotationsService.getByClientId(clientId);
      console.log('Quotations response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        setQuotations(response.data);
        console.log('Loaded quotations:', response.data.length);
      } else {
        console.warn('No quotations found');
        setQuotations([]);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast.error('Failed to load quotations');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await packagesService.getAll();
      if (response && response.success && Array.isArray(response.data)) {
        setPackages(response.data);
      } else if (Array.isArray(response)) {
        setPackages(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setPackages(response.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
    }
  };

  const fetchRequirements = async () => {
    try {
      const response = await fetch(`/api/client_requirements/client/${clientId}`);
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        setRequirements(Array.isArray(data) ? data : data.data || []);
      } else {
        setRequirements([]);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      setRequirements([]);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchQuotations();
      fetchPackages();
      fetchRequirements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handlePackageChange = (packageId) => {
    const selectedPackage = packages.find(p => p.package_id === parseInt(packageId));
    if (selectedPackage) {
      setFormData({
        ...formData,
        package_id: packageId,
        package_name: selectedPackage.package_name || '',
        package_rate: selectedPackage.base_rate || selectedPackage.rate || ''
      });
    } else {
      setFormData({
        ...formData,
        package_id: packageId,
        package_name: '',
        package_rate: ''
      });
    }
  };

  const calculateTotals = () => {
    const habitable = parseFloat(formData.habitable_area) || 0;
    const balcony = parseFloat(formData.balcony_area) || 0;
    const stilt = parseFloat(formData.stilt_area) || 0;
    const terrace = parseFloat(formData.terrace_area) || 0;
    const rate = parseFloat(formData.package_rate) || 0;
    const gstPct = parseFloat(formData.gst_percentage) || 18;

    // Non-habitable areas billed at 65% of the rate — matches lead_quotations
    // and the server-side generated column for package_construction_amount.
    const totalArea = habitable + (balcony * 0.65) + (stilt * 0.65) + (terrace * 0.65);
    const totalAmount = totalArea * rate;
    const gstAmount = totalAmount * (gstPct / 100);
    const grandTotal = totalAmount + gstAmount;

    setFormData(prev => ({
      ...prev,
      total_amount: totalAmount.toFixed(2),
      gst_amount: gstAmount.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    }));
  };

  // When a requirement is selected, pre-fill areas/title/package_type from it.
  // User can still override before submitting.
  const handleRequirementChange = (requirementId) => {
    const req = requirements.find(
      r => String(r.client_requirement_id) === String(requirementId)
    );
    if (!req) {
      setFormData(prev => ({ ...prev, client_requirement_id: requirementId }));
      return;
    }
    // Normalize package_type: requirements store "Standard Package", quotations "Standard"
    const rawPkg = (req.package_type || req.quality_level || '').replace(/\s*Package\s*$/i, '').trim();
    setFormData(prev => ({
      ...prev,
      client_requirement_id: requirementId,
      package_name: rawPkg || prev.package_name,
      habitable_area: req.built_up_area || req.carpet_area || prev.habitable_area || '',
      balcony_area: req.balcony_area || prev.balcony_area || '',
      stilt_area: req.stilt_area || prev.stilt_area || '',
      terrace_area: req.terrace_area || prev.terrace_area || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error('Client ID is missing. Please refresh and try again.');
      return;
    }

    // Guard against junk quotations (the "444 / ₹0.00" problem)
    if (!formData.client_requirement_id) {
      toast.error('Please select a requirement first.');
      return;
    }
    if (!formData.package_id && !formData.package_name) {
      toast.error('Please select a package.');
      return;
    }
    if (!parseFloat(formData.package_rate) || parseFloat(formData.package_rate) <= 0) {
      toast.error('Package rate must be greater than zero.');
      return;
    }
    if (!parseFloat(formData.habitable_area) || parseFloat(formData.habitable_area) <= 0) {
      toast.error('Habitable area must be greater than zero.');
      return;
    }
    
    console.log('Submitting quotation:', {
      ...formData,
      client_id: clientId,
      editing: !!editingQuotation
    });
    
    try {
      if (editingQuotation) {
        console.log('Updating quotation ID:', editingQuotation.client_quotation_id);
        const response = await clientQuotationsService.update(
          editingQuotation.client_quotation_id,
          {
            ...formData,
            client_id: clientId
          }
        );
        
        if (response.success) {
          toast.success('Quotation updated successfully!');
          fetchQuotations();
          handleCloseModal();
        } else {
          toast.error(response.error || 'Update failed');
          console.error('Update error:', response);
        }
      } else {
        const response = await clientQuotationsService.create({
          ...formData,
          client_id: clientId
        });
        
        if (response.success) {
          toast.success('Quotation created successfully!');
          fetchQuotations();
          handleCloseModal();
        } else {
          toast.error(response.error || 'Create failed');
          console.error('Create error:', response);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.error || error.message || 'Operation failed');
    }
  };

  const handleView = (quotation) => {
    console.log('Viewing quotation:', quotation);
    setViewingQuotation(quotation);
    setShowViewModal(true);
  };

  const handleEdit = (quotation) => {
    console.log('Editing quotation:', quotation);
    setEditingQuotation(quotation);
    
    // Map backend fields to frontend form fields
    setFormData({
      client_id: quotation.client_id,
      client_requirement_id: quotation.client_requirement_id || '',
      quotation_number: quotation.client_quotation_number || quotation.quotation_number || '',
      quotation_date: quotation.quotation_date?.split('T')[0] || '',
      valid_until: quotation.valid_until?.split('T')[0] || '',
      package_id: quotation.package_id || '',
      package_name: quotation.project_title || quotation.package_name || '',
      package_rate: quotation.package_rate_per_sqft || quotation.package_rate || '',
      habitable_area: quotation.habitable_area || '',
      balcony_area: quotation.balcony_area || '',
      stilt_area: quotation.stilt_area || '',
      terrace_area: quotation.terrace_area || '',
      total_amount: quotation.subtotal || quotation.total_amount || '',
      gst_amount: quotation.gst_amount || '',
      grand_total: quotation.contract_value || quotation.grand_total || '',
      status: quotation.status || 'Draft',
      remarks: quotation.preparation_notes || quotation.remarks || ''
    });
    
    setShowModal(true);
  };

  const handleDelete = async (quotation) => {
    console.log('Deleting quotation:', quotation);
    
    if (!window.confirm(`Are you sure you want to delete quotation ${quotation.client_quotation_number || quotation.quotation_number}? Its history and version links will also be removed.`)) {
      return;
    }
    
    try {
      const quotationId = quotation.client_quotation_id;
      console.log('Deleting quotation ID:', quotationId);
      
      const response = await clientQuotationsService.delete(quotationId);
      console.log('Delete response:', response);
      
      if (response.success) {
        toast.success('Quotation deleted successfully!');
        fetchQuotations();
      } else {
        toast.error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.error || error.message || 'Delete failed');
    }
  };

  // Send quotation to client: marks status=Sent and sets sent_to_client_date on server.
  const handleSend = async (quotation) => {
    if (!window.confirm(`Mark quotation ${quotation.client_quotation_number} as sent to the client?`)) return;
    try {
      const response = await clientQuotationsService.send(quotation.client_quotation_id);
      if (response.success) {
        toast.success('Quotation marked as sent.');
        fetchQuotations();
      } else {
        toast.error(response.error || 'Failed to mark as sent');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send');
    }
  };

  // Create a new version (Variation) from an existing quotation.
  const handleCreateVersion = async (quotation) => {
    const notes = prompt(
      'What changed in this new version? (reason / scope change / client feedback)'
    );
    if (notes === null) return; // cancelled
    try {
      const response = await clientQuotationsService.createVersion(
        quotation.client_quotation_id,
        { notes, change_reason: notes, change_description: notes }
      );
      if (response.success) {
        const newNumber = response?.data?.client_quotation_number || 'new version';
        toast.success(`${response.message || 'New version created'}: ${newNumber}`);
        fetchQuotations();
      } else {
        toast.error(response.error || 'Failed to create new version');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create new version');
    }
  };

  // Client-side PDF generation: opens a styled quotation in a new window
  // and triggers the browser print dialog (Save as PDF).
  const handleDownloadPDF = (quotation) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      toast.error('Please allow popups to download the quotation PDF.');
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

  // Build a styled, print-ready HTML document for a client quotation.
  const buildQuotationPrintHTML = (q) => {
    const num = (v) => (parseFloat(v) || 0);
    const fmt = (v) => '₹' + num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtArea = (v) => num(v).toFixed(2) + ' sq.ft';
    const today = new Date().toLocaleDateString('en-IN');
    const qdate = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : today;
    const validUntil = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : 'N/A';

    const rate = num(q.package_rate_per_sqft);
    const hab = num(q.habitable_area);
    const bal = num(q.balcony_area);
    const sti = num(q.stilt_area);
    const ter = num(q.terrace_area);
    const habAmt = hab * rate;
    const balAmt = bal * rate * 0.65;
    const stiAmt = sti * rate * 0.65;
    const terAmt = ter * rate * 0.65;
    const basePackage = habAmt + balAmt + stiAmt + terAmt;

    const electrical = num(q.electrical_work_amount);
    const plumbing = num(q.plumbing_work_amount);
    const finishing = num(q.finishing_work_amount);
    const special = num(q.special_features_amount);
    const misc = num(q.miscellaneous_amount);
    const variation = num(q.variation_amount);
    const additional = num(q.additional_work_amount);
    const discount = num(q.discount_amount);
    const gstPct = num(q.gst_percentage) || 18;

    // Prefer server-computed values when present.
    const subtotal = num(q.subtotal) || (basePackage + electrical + plumbing + finishing + special + misc + variation + additional - discount);
    const gstAmt = num(q.gst_amount) || (subtotal * gstPct / 100);
    const grandTotal = num(q.contract_value) || (subtotal + gstAmt);
    const advancePct = num(q.advance_percentage) || 20;
    const advanceAmt = grandTotal * advancePct / 100;

    const areaRow = (label, area, multiplier, amount) => {
      if (num(area) <= 0) return '';
      const mult = multiplier === 1 ? '' : ` × ${multiplier}`;
      return `<tr><td>${label}</td><td class="num">${fmtArea(area)}</td><td class="num">${fmt(rate)}${mult}</td><td class="num">${fmt(amount)}</td></tr>`;
    };
    const addRow = (label, amount) => {
      if (num(amount) === 0) return '';
      return `<tr><td colspan="3">${label}</td><td class="num">${fmt(amount)}</td></tr>`;
    };

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Quotation ${q.client_quotation_number || q.client_quotation_id}</title>
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
  .totals tr.subtotal td { border-top: 2px solid #111; font-weight: 600; }
  .totals tr.grand td { background: #ea580c; color: white; font-weight: 700; font-size: 14px; }
  .notes { font-size: 11px; color: #444; white-space: pre-wrap; margin-top: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 48px; }
  .sign-box { width: 45%; text-align: center; font-size: 11px; color: #444; }
  .sign-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #dbeafe; color: #1e40af; font-size: 10px; font-weight: 600; margin-left: 8px; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div>
      <div class="brand">ConstructPro</div>
      <div class="brand-sub">Construction Project Management — Client Quotation</div>
    </div>
    <div class="meta">
      <div><span class="label">Quotation No:</span> <span class="value">${q.client_quotation_number || 'CQ-' + q.client_quotation_id}</span></div>
      <div><span class="label">Date:</span> <span class="value">${qdate}</span></div>
      <div><span class="label">Valid Until:</span> <span class="value">${validUntil}</span></div>
      <div><span class="label">Version:</span> <span class="value">v${q.version_number || 1}${q.is_current_version ? ' <span class="badge">Current</span>' : ''}</span></div>
    </div>
  </div>

  <h1>${q.project_title || q.quotation_title || 'Construction Contract Quotation'}</h1>
  ${q.requirement_title ? `<div style="color:#666;margin-bottom:16px;">Requirement: ${q.requirement_title}</div>` : ''}

  <h2>Project Details</h2>
  <div class="info-grid">
    <div><span class="k">Package Type:</span> <span class="v">${q.package_type || 'N/A'}</span></div>
    <div><span class="k">Rate per Sq.Ft:</span> <span class="v">${fmt(rate)}</span></div>
    <div><span class="k">Construction Type:</span> <span class="v">${q.construction_type || 'N/A'}</span></div>
    <div><span class="k">Duration:</span> <span class="v">${q.contract_duration_months || 'N/A'} months</span></div>
    <div><span class="k">Status:</span> <span class="v">${(q.status || 'Draft').replace(/_/g, ' ')}</span></div>
    <div><span class="k">Contract Signed:</span> <span class="v">${q.contract_signed ? 'Yes' : 'No'}</span></div>
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
      <tr><td colspan="3"><b>Base Package Total</b></td><td class="num"><b>${fmt(basePackage)}</b></td></tr>
    </tbody>
  </table>

  ${(electrical + plumbing + finishing + special + misc + variation + additional + discount) > 0 ? `
  <h2>Additional Work &amp; Adjustments</h2>
  <table><tbody>
    ${addRow('Electrical Work', electrical)}
    ${addRow('Plumbing Work', plumbing)}
    ${addRow('Finishing Work', finishing)}
    ${addRow('Special Features', special)}
    ${addRow('Miscellaneous', misc)}
    ${addRow('Variation Amount', variation)}
    ${addRow('Additional Work', additional)}
    ${discount > 0 ? `<tr><td colspan="3">Discount</td><td class="num">- ${fmt(discount)}</td></tr>` : ''}
  </tbody></table>` : ''}

  <h2>Summary</h2>
  <table class="totals"><tbody>
    <tr class="subtotal"><td colspan="3">Subtotal (before GST)</td><td class="num">${fmt(subtotal)}</td></tr>
    <tr><td colspan="3">GST @ ${gstPct}%</td><td class="num">${fmt(gstAmt)}</td></tr>
    <tr class="grand"><td colspan="3">CONTRACT VALUE</td><td class="num">${fmt(grandTotal)}</td></tr>
    <tr><td colspan="3">Advance Payable (${advancePct}%)</td><td class="num">${fmt(advanceAmt)}</td></tr>
  </tbody></table>

  ${q.inclusions ? `<h2>Inclusions</h2><div class="notes">${q.inclusions}</div>` : ''}
  ${q.exclusions ? `<h2>Exclusions</h2><div class="notes">${q.exclusions}</div>` : ''}
  ${q.terms_conditions ? `<h2>Terms &amp; Conditions</h2><div class="notes">${q.terms_conditions}</div>` : ''}
  ${q.payment_schedule ? `<h2>Payment Schedule</h2><div class="notes">${q.payment_schedule}</div>` : ''}
  ${q.preparation_notes ? `<h2>Notes</h2><div class="notes">${q.preparation_notes}</div>` : ''}

  <div class="sign">
    <div class="sign-box"><div class="sign-line">Authorised Signatory</div></div>
    <div class="sign-box"><div class="sign-line">Client Acceptance</div></div>
  </div>

  <div class="footer">Computer-generated quotation. Generated on ${today}.</div>
  <script>window.addEventListener('afterprint', () => window.close());</script>
</body></html>`;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuotation(null);
    setFormData({
      client_id: clientId,
      client_requirement_id: '',
      quotation_number: '',
      quotation_date: new Date().toISOString().split('T')[0],
      valid_until: '',
      package_id: '',
      package_name: '',
      package_rate: '',
      habitable_area: '',
      balcony_area: '',
      stilt_area: '',
      terrace_area: '',
      total_amount: '',
      gst_amount: '',
      grand_total: '',
      status: 'Draft',
      remarks: ''
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingQuotation(null);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Under_Review': 'bg-yellow-100 text-yellow-800',
      'Client_Review': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Contract_Signed': 'bg-purple-100 text-purple-800',
      'Active': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Viewed': 'bg-purple-100 text-purple-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Revised': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ') || 'Draft';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Client Quotations</h2>
            <p className="text-sm text-gray-600">Manage and track client quotations</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-5 w-5" />
          <span>Create Quotation</span>
        </button>
      </div>

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No quotations found</p>
          <p className="text-sm text-gray-500 mt-1">Create your first quotation</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotations.map((quotation) => (
            <div key={quotation.client_quotation_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quotation.client_quotation_number || `QUO-${quotation.client_quotation_id}`}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(quotation.status)}`}>
                      {formatStatus(quotation.status)}
                    </span>
                    {quotation.is_current_version && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current Version
                      </span>
                    )}
                    {quotation.version_number > 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        v{quotation.version_number}
                      </span>
                    )}
                  </div>
                  {quotation.project_title && (
                    <p className="text-sm text-gray-600">{quotation.project_title}</p>
                  )}
                  {quotation.requirement_title && (
                    <p className="text-xs text-gray-500 mt-1">Requirement: {quotation.requirement_title}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleView(quotation)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  {quotation.status !== 'Sent' && quotation.status !== 'Contract_Signed' && (
                    <button
                      onClick={() => handleSend(quotation)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Mark as Sent"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadPDF(quotation)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Print / Save as PDF"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  {quotation.is_current_version && (
                    <button
                      onClick={() => handleCreateVersion(quotation)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Create New Version"
                    >
                      <TrendingUp className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(quotation)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quotation)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(quotation.contract_value || quotation.grand_total || quotation.subtotal)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Valid Until</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Package Rate</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(quotation.package_rate_per_sqft || quotation.package_rate)}/sqft
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingQuotation ? 'Edit' : 'Create'} Quotation
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Requirement Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Requirement *
                  </label>
                  <select
                    required
                    value={formData.client_requirement_id}
                    onChange={(e) => handleRequirementChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Requirement</option>
                    {requirements.map(req => (
                      <option key={req.client_requirement_id} value={req.client_requirement_id}>
                        {req.requirement_title || `Requirement #${req.client_requirement_id}`}
                      </option>
                    ))}
                  </select>
                  {formData.client_requirement_id && !editingQuotation && (
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Areas and package type pre-filled from requirement. You can edit any value.
                    </p>
                  )}
                  {requirements.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      No requirements found. Please create a requirement first in the Requirements tab.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quotation Number
                    </label>
                    <input
                      type="text"
                      value={formData.quotation_number}
                      onChange={(e) => setFormData({...formData, quotation_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                      placeholder={editingQuotation ? '' : 'Auto-generated (e.g. CQ-2026-001)'}
                      readOnly={!editingQuotation}
                    />
                    {!editingQuotation && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty — system will assign a number.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quotation Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.quotation_date}
                      onChange={(e) => setFormData({...formData, quotation_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Under_Review">Under Review</option>
                      <option value="Client_Review">Client Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Contract_Signed">Contract Signed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <select
                      value={formData.package_id}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select Package</option>
                      {Array.isArray(packages) && packages.length > 0 ? (
                        packages.map(pkg => (
                          <option key={pkg.package_id} value={pkg.package_id}>
                            {pkg.package_name} - ₹{pkg.base_rate || pkg.rate}/sq.ft
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No packages available</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Rate *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_rate}
                      onChange={(e) => setFormData({...formData, package_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Rate per sq.ft"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Habitable Area
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.habitable_area}
                      onChange={(e) => setFormData({...formData, habitable_area: e.target.value})}
                      onBlur={calculateTotals}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balcony Area
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balcony_area}
                      onChange={(e) => setFormData({...formData, balcony_area: e.target.value})}
                      onBlur={calculateTotals}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stilt Area
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stilt_area}
                      onChange={(e) => setFormData({...formData, stilt_area: e.target.value})}
                      onBlur={calculateTotals}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terrace Area
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.terrace_area}
                      onChange={(e) => setFormData({...formData, terrace_area: e.target.value})}
                      onBlur={calculateTotals}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={calculateTotals}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    Calculate Totals
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount (preview)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.total_amount ? `₹${parseFloat(formData.total_amount).toLocaleString('en-IN')}` : ''}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="— click Calculate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Amount (preview)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.gst_amount ? `₹${parseFloat(formData.gst_amount).toLocaleString('en-IN')}` : ''}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="—"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grand Total (preview)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.grand_total ? `₹${parseFloat(formData.grand_total).toLocaleString('en-IN')}` : ''}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-bold"
                      placeholder="—"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Totals shown above are a client-side preview. Final amounts are computed by the server from areas and rate.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {editingQuotation ? 'Update' : 'Create'} Quotation
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quotation Details</h2>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Quotation Number</p>
                      <p className="font-semibold">{viewingQuotation.client_quotation_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(viewingQuotation.status)}`}>
                        {formatStatus(viewingQuotation.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quotation Date</p>
                      <p className="font-semibold">
                        {viewingQuotation.quotation_date ? new Date(viewingQuotation.quotation_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="font-semibold">
                        {viewingQuotation.valid_until ? new Date(viewingQuotation.valid_until).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Project Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Project Title</p>
                      <p className="font-medium">{viewingQuotation.project_title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Package Type</p>
                      <p className="font-medium">{viewingQuotation.package_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Package Rate</p>
                      <p className="font-medium">{formatCurrency(viewingQuotation.package_rate_per_sqft)}/sqft</p>
                    </div>
                  </div>
                </div>

                {/* Area Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Area Breakdown</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Habitable Area</p>
                      <p className="font-medium">{viewingQuotation.habitable_area || 0} sqft</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balcony Area</p>
                      <p className="font-medium">{viewingQuotation.balcony_area || 0} sqft</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stilt Area</p>
                      <p className="font-medium">{viewingQuotation.stilt_area || 0} sqft</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Terrace Area</p>
                      <p className="font-medium">{viewingQuotation.terrace_area || 0} sqft</p>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Financial Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(viewingQuotation.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST ({viewingQuotation.gst_percentage || 18}%)</span>
                      <span className="font-semibold">{formatCurrency(viewingQuotation.gst_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t">
                      <span className="font-bold">Total Amount</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(viewingQuotation.contract_value || viewingQuotation.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewingQuotation.preparation_notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingQuotation.preparation_notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    handleCloseViewModal();
                    handleEdit(viewingQuotation);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Edit Quotation
                </button>
                <button
                  onClick={handleCloseViewModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientQuotations;
