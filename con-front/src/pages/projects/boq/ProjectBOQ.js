import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Zap, DollarSign, Trash2,
  Package as PackageIcon, IndianRupee, AlertCircle, Layers,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const MODULE_META = [
  { key: 'structural', label: 'Structural (Beams / Columns / Slabs)', icon: '🏗️' },
  { key: 'walls',      label: 'Walls / Masonry',                       icon: '🧱' },
  { key: 'doors',      label: 'Doors',                                 icon: '🚪' },
  { key: 'windows',    label: 'Windows',                               icon: '🪟' },
  { key: 'electrical', label: 'Electrical',                            icon: '⚡' },
  { key: 'plumbing',   label: 'Plumbing',                              icon: '🚰' },
  { key: 'flooring',   label: 'Flooring',                              icon: '⬛' },
  { key: 'painting',   label: 'Painting',                              icon: '🎨' },
];

const formatINR = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const ProjectBOQ = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // 'generate' | 'apply' | 'clear' | null

  const loadSummary = useCallback(async () => {
    try {
      const r = await api.get(`/boq_generation/summary/${projectId}`);
      setSummary(r.data);
    } catch (err) {
      console.error(err);
      setSummary(null);
    }
  }, [projectId]);

  const loadBreakdown = useCallback(async () => {
    try {
      const r = await api.get(`/boq_generation/cost-breakdown/${projectId}`);
      setBreakdown(r.data);
    } catch (err) {
      // OK if breakdown fails — it's only after Apply Costs
      setBreakdown(null);
    }
  }, [projectId]);

  const loadProject = useCallback(async () => {
    try {
      const r = await api.get(`/projects/${projectId}`);
      setProject(Array.isArray(r.data) ? r.data[0] : (r.data.data || r.data));
    } catch (err) { console.error(err); }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProject(), loadSummary(), loadBreakdown()]);
      setLoading(false);
    })();
  }, [loadProject, loadSummary, loadBreakdown]);

  const generateBOQ = async () => {
    if (!window.confirm('Regenerate the BOQ? This will clear any existing BOQ rows for this project first.')) return;
    setBusy('generate');
    try {
      const r = await api.post(`/boq_generation/generate/${projectId}`, { created_by: 1 });
      toast.success(`Generated: ${r.data.totalItemsGenerated ?? '—'} items`);
      await Promise.all([loadSummary(), loadBreakdown()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'BOQ generation failed');
    } finally { setBusy(null); }
  };

  const applyCosts = async () => {
    setBusy('apply');
    try {
      const r = await api.post(`/boq_generation/apply-costs/${projectId}`);
      toast.success('Costs applied to BOQ rows');
      await Promise.all([loadSummary(), loadBreakdown()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Apply costs failed');
    } finally { setBusy(null); }
  };

  const clearBOQ = async () => {
    if (!window.confirm('Delete every BOQ row for this project? This cannot be undone.')) return;
    setBusy('clear');
    try {
      await api.delete(`/boq_generation/clear/${projectId}`);
      toast.success('BOQ cleared');
      await Promise.all([loadSummary(), loadBreakdown()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clear failed');
    } finally { setBusy(null); }
  };

  const grandItems = summary?.grandTotalItems ?? 0;
  const grandCost = summary?.grandTotalCost ?? 0;
  const hasData = grandItems > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(`/projects/${projectId}`)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back to project
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Layers size={16} /> Project · BOQ
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bill of Quantities</h1>
        {project && (
          <p className="text-sm text-gray-600 mt-0.5">
            <span className="font-medium">{project.project_name}</span>
            {project.total_area && <span className="text-gray-500 ml-2">· {formatINR(project.total_area)} sqft</span>}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-2">
        <button onClick={generateBOQ} disabled={busy !== null}
                className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md disabled:opacity-60">
          <Zap size={14} /> {busy === 'generate' ? 'Generating…' : (hasData ? 'Regenerate BOQ' : 'Generate BOQ')}
        </button>
        <button onClick={applyCosts} disabled={busy !== null || !hasData}
                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md disabled:opacity-60">
          <DollarSign size={14} /> {busy === 'apply' ? 'Applying…' : 'Apply Costs'}
        </button>
        <button onClick={async () => { setBusy('refresh'); await Promise.all([loadSummary(), loadBreakdown()]); setBusy(null); }}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 disabled:opacity-60">
          <RefreshCw size={14} /> Refresh
        </button>
        <div className="flex-1"></div>
        <button onClick={clearBOQ} disabled={busy !== null || !hasData}
                className="inline-flex items-center gap-1 px-3 py-2 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50 disabled:opacity-60">
          <Trash2 size={14} /> Clear BOQ
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : !hasData ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <PackageIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <div className="text-gray-700 font-medium mb-1">No BOQ generated yet</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click <span className="font-medium">Generate BOQ</span> to compute quantities from the project's architect measurements.
            If the counts stay at zero, the project probably has no measurements yet — link an architect and add measurements first.
          </p>
        </div>
      ) : (
        <>
          {/* Grand total banner */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-4 flex items-baseline gap-6 flex-wrap">
            <div>
              <div className="text-xs uppercase text-orange-700 tracking-wide">Total items</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{formatINR(grandItems)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-orange-700 tracking-wide">Total cost</div>
              <div className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                <IndianRupee size={20} />{formatINR(grandCost)}
              </div>
            </div>
          </div>

          {/* Per-module summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {MODULE_META.map(m => {
              const row = summary?.summary?.[m.key] || {};
              const items = Number(row.total_items) || 0;
              const qty = Number(row.total_quantity) || 0;
              const cost = Number(row.total_cost) || 0;
              const hasErr = !!row.error;
              return (
                <div key={m.key} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-800">
                    <span className="text-lg">{m.icon}</span> {m.label}
                  </div>
                  {hasErr ? (
                    <div className="text-[11px] text-red-600 flex items-start gap-1">
                      <AlertCircle size={11} className="mt-0.5 flex-shrink-0" /> {row.error}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between"><span>Items</span><span className="font-medium text-gray-900">{items}</span></div>
                      <div className="flex justify-between"><span>Quantity</span><span>{Number(qty).toLocaleString('en-IN', {maximumFractionDigits:2})}</span></div>
                      <div className="flex justify-between border-t border-gray-100 pt-1 mt-1"><span>Cost</span><span className="font-semibold text-gray-900">₹{formatINR(cost)}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cost breakdown from /cost-breakdown endpoint */}
          {breakdown && (Array.isArray(breakdown.breakdown) || Array.isArray(breakdown.items) || breakdown.categories) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Cost Breakdown</h2>
              <pre className="text-[11px] text-gray-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(breakdown, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectBOQ;
