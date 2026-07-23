import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Phone, Mail, MapPin, User, Building2,
  Calendar, Target, ExternalLink,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const KV = ({ label, children }) => (
  <div>
    <div className="text-[10px] uppercase text-gray-500 mb-0.5">{label}</div>
    <div className="text-sm text-gray-900">{children || <span className="text-gray-400 italic">—</span>}</div>
  </div>
);

const EnquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/enquiries/${id}`);
        setQ(Array.isArray(r.data) ? r.data[0] : (r.data.data || r.data));
      } catch (err) { toast.error('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const convertToLead = async () => {
    if (!window.confirm(`Convert this enquiry into a lead?`)) return;
    try {
      const r = await api.post(`/enquiries/${id}/convert-to-lead`);
      toast.success(`Lead created`);
      // navigate to the created lead if we know the id
      if (r.data.lead_id) navigate(`/crm/leads/${r.data.lead_id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Convert failed'); }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!q) return <div className="p-6 text-gray-500">Enquiry not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/crm/enquiries')}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back to enquiries
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <MessageCircle size={16} /> Enquiry
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{q.enquiry_number || `#${q.enquiry_id}`}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {q.contact_person_name} {q.contact_surname || ''}
              {q.company_name && <span className="text-gray-500"> · {q.company_name}</span>}
            </p>
          </div>
          <button onClick={convertToLead}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md">
            <Target size={14} /> Convert to Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <User size={14} /> Contact
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <KV label="Phone">{q.primary_phone && <a href={`tel:${q.primary_phone}`} className="text-orange-600 hover:underline">{q.primary_phone}</a>}</KV>
            <KV label="WhatsApp">{q.whatsapp_number}</KV>
            <KV label="Email"><span className="text-gray-800 break-all">{q.email}</span></KV>
            <KV label="City / State">{[q.city, q.state].filter(Boolean).join(', ')}</KV>
          </div>
        </div>

        {/* Project */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Building2 size={14} /> Project
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <KV label="Project Type">{q.project_type}</KV>
            <KV label="Construction Type">{q.construction_type}</KV>
            <KV label="Approximate Area">{q.approximate_area && `${Number(q.approximate_area).toLocaleString('en-IN')} ${q.area_unit || 'sqft'}`}</KV>
            <KV label="Budget Range">{q.budget_range}</KV>
            <KV label="Expected Timeline">{q.expected_timeline}</KV>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target size={14} /> Classification
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <KV label="CRM Classification">{q.crm_classification}</KV>
            <KV label="Classification Date">{q.classification_date && new Date(q.classification_date).toLocaleString('en-IN')}</KV>
            <KV label="Assigned To">{q.assigned_to || '—'}</KV>
            <KV label="Assignment Date">{q.assignment_date && new Date(q.assignment_date).toLocaleString('en-IN')}</KV>
          </div>
          {q.classification_reason && (
            <div className="mt-3 text-xs text-gray-600 border-t border-gray-100 pt-2">
              <span className="font-medium text-gray-500">Reason: </span>{q.classification_reason}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {[
              ['Specific location', q.has_specific_location],
              ['Realistic budget', q.has_realistic_budget],
              ['Immediate timeline', q.has_immediate_timeline],
              ['Repeat visitor', q.is_repeat_visitor],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border border-gray-100 rounded px-2 py-1">
                <span className="text-gray-600">{k}</span>
                <span className={v ? 'text-emerald-700 font-medium' : 'text-gray-400'}>{v == null ? '—' : (v ? 'Yes' : 'No')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing attribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ExternalLink size={14} /> Marketing Attribution
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <KV label="UTM Source">{q.utm_source}</KV>
            <KV label="UTM Medium">{q.utm_medium}</KV>
            <KV label="UTM Campaign">{q.utm_campaign}</KV>
            <KV label="UTM Content">{q.utm_content}</KV>
            <KV label="Landing Page">{q.landing_page && <span className="break-all text-xs">{q.landing_page}</span>}</KV>
            <KV label="Referrer">{q.referrer_url && <span className="break-all text-xs">{q.referrer_url}</span>}</KV>
            <KV label="Device Type">{q.device_type}</KV>
            <KV label="Browser">{q.browser}</KV>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetail;
