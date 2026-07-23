import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, ClipboardList, Calendar, Users, HardHat,
  AlertCircle, X, Save, TrendingUp, RefreshCw,
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  tracking_date: new Date().toISOString().slice(0, 10),
  work_completed_today: '',
  cumulative_progress: '',
  manpower_used: '',
  equipment_hours: '',
  materials_consumed: '',
  weather_conditions: 'Clear',
  work_hours: '8',
  issues_faced: '',
  decisions_required: '',
  defects_identified: '0',
  defects_rectified: '0',
};

const WEATHERS = ['Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Hot', 'Cold', 'Windy', 'Storm'];

const ProjectExecution = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [packages, setPackages] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const r = await api.get(`/projects/${projectId}`);
      setProject(Array.isArray(r.data) ? r.data[0] : (r.data.data || r.data));
    } catch (err) { console.error(err); }
  }, [projectId]);

  const loadPackages = useCallback(async () => {
    try {
      const r = await api.get(`/work_packages`);
      const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
      const mine = arr.filter(p => Number(p.project_id) === Number(projectId));
      setPackages(mine);
      if (mine.length && !selectedPackage) setSelectedPackage(mine[0].package_id);
    } catch (err) { console.error(err); }
  }, [projectId, selectedPackage]);

  const loadEntries = useCallback(async () => {
    if (!selectedPackage) { setEntries([]); return; }
    try {
      const r = await api.get(`/execution_tracking/package/${selectedPackage}`);
      const arr = Array.isArray(r.data) ? r.data : (r.data.data || []);
      arr.sort((a, b) => new Date(b.tracking_date) - new Date(a.tracking_date));
      setEntries(arr);
    } catch (err) { setEntries([]); }
  }, [selectedPackage]);

  useEffect(() => { (async () => {
    setLoading(true);
    await Promise.all([loadProject(), loadPackages()]);
    setLoading(false);
  })(); }, [loadProject, loadPackages]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) { toast.error('Pick a work package first'); return; }
    setSaving(true);
    try {
      await api.post('/execution_tracking', {
        ...form,
        package_id: selectedPackage,
        cumulative_progress:  form.cumulative_progress === ''  ? null : Number(form.cumulative_progress),
        manpower_used:        form.manpower_used === ''        ? null : Number(form.manpower_used),
        equipment_hours:      form.equipment_hours === ''      ? null : Number(form.equipment_hours),
        work_hours:           form.work_hours === ''           ? null : Number(form.work_hours),
        defects_identified:   Number(form.defects_identified) || 0,
        defects_rectified:    Number(form.defects_rectified) || 0,
        recorded_by: 1,
      });
      toast.success('Entry logged');
      setShowModal(false);
      setForm(emptyForm);
      loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const currentPkg = useMemo(
    () => packages.find(p => p.package_id === selectedPackage),
    [packages, selectedPackage]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(`/projects/${projectId}`)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
          <ArrowLeft size={14} /> Back to project
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <ClipboardList size={16} /> Project · Execution Tracking
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Execution Tracking</h1>
        {project && <p className="text-sm text-gray-600 mt-0.5">{project.project_name}</p>}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <div className="text-gray-700 font-medium mb-1">No work packages yet</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            This project has no work packages. Create work packages first from the project workflow before you can log execution progress.
          </p>
          <button onClick={() => navigate(`/projects/${projectId}/workflow/workpackages`)}
                  className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md">
            Go to Work Packages
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Package list */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                Work Packages
              </div>
              <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
                {packages.map(p => (
                  <button key={p.package_id}
                          onClick={() => setSelectedPackage(p.package_id)}
                          className={`w-full text-left p-3 text-sm hover:bg-gray-50 ${selectedPackage === p.package_id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
                    <div className="font-medium text-gray-900 truncate">{p.package_name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-between">
                      <span>#{p.package_id} · {p.package_type || 'General'}</span>
                      <span>{Number(p.progress_percentage) || 0}%</span>
                    </div>
                    {p.progress_percentage != null && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${Number(p.progress_percentage) || 0}%` }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Entries list */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {currentPkg ? currentPkg.package_name : 'Select a work package'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{entries.length} daily log entr{entries.length === 1 ? 'y' : 'ies'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadEntries}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                    <RefreshCw size={14} /> Refresh
                  </button>
                  <button onClick={() => setShowModal(true)} disabled={!selectedPackage}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                    <Plus size={14} /> Log Progress
                  </button>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <TrendingUp className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <div className="text-sm">No daily logs yet.</div>
                  <div className="text-xs mt-1">Click Log Progress to add today's site update.</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {entries.map(e => (
                    <div key={e.tracking_id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(e.tracking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {e.weather_conditions && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{e.weather_conditions}</span>
                          )}
                        </div>
                        {e.cumulative_progress != null && (
                          <span className="text-xs text-emerald-700 font-medium">{Number(e.cumulative_progress)}% cumulative</span>
                        )}
                      </div>
                      {e.work_completed_today && (
                        <div className="text-sm text-gray-800 mb-2 whitespace-pre-line">{e.work_completed_today}</div>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2">
                        {e.manpower_used != null && (
                          <span className="flex items-center gap-1"><Users size={11} /> {e.manpower_used} workers</span>
                        )}
                        {e.work_hours != null && (
                          <span className="flex items-center gap-1"><HardHat size={11} /> {e.work_hours} hrs</span>
                        )}
                        {(Number(e.defects_identified) > 0 || Number(e.defects_rectified) > 0) && (
                          <span className="flex items-center gap-1 text-amber-700"><AlertCircle size={11} /> {e.defects_identified} identified / {e.defects_rectified} rectified</span>
                        )}
                      </div>
                      {e.issues_faced && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                          <span className="font-medium">Issues: </span>{e.issues_faced}
                        </div>
                      )}
                      {e.materials_consumed && (
                        <div className="mt-2 text-xs text-gray-600"><span className="font-medium">Materials: </span>{e.materials_consumed}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New entry modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Progress Log
                <div className="text-xs text-gray-500 font-normal mt-0.5">{currentPkg?.package_name}</div>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input type="date" value={form.tracking_date} onChange={e => setField('tracking_date', e.target.value)}
                         required className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weather</label>
                  <select value={form.weather_conditions} onChange={e => setField('weather_conditions', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2">
                    {WEATHERS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Work Completed Today</label>
                <textarea value={form.work_completed_today} onChange={e => setField('work_completed_today', e.target.value)}
                          rows="3" placeholder="e.g. Column casting completed for ground floor. Slab shuttering started for first floor."
                          className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cumulative %</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.cumulative_progress} onChange={e => setField('cumulative_progress', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Manpower</label>
                  <input type="number" min="0" value={form.manpower_used} onChange={e => setField('manpower_used', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Work hrs</label>
                  <input type="number" step="0.5" min="0" value={form.work_hours} onChange={e => setField('work_hours', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Equipment hrs</label>
                  <input type="number" step="0.5" min="0" value={form.equipment_hours} onChange={e => setField('equipment_hours', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Materials Consumed</label>
                <input value={form.materials_consumed} onChange={e => setField('materials_consumed', e.target.value)}
                       placeholder="e.g. Cement 45 bags, Steel 2.1 T, RMC 8 cum"
                       className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Defects Identified</label>
                  <input type="number" min="0" value={form.defects_identified} onChange={e => setField('defects_identified', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Defects Rectified</label>
                  <input type="number" min="0" value={form.defects_rectified} onChange={e => setField('defects_rectified', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 text-right" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Issues Faced</label>
                <textarea value={form.issues_faced} onChange={e => setField('issues_faced', e.target.value)}
                          rows="2" placeholder="Blocker for the day (rain, material shortage, design change…)"
                          className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Decisions Required</label>
                <textarea value={form.decisions_required} onChange={e => setField('decisions_required', e.target.value)}
                          rows="2" placeholder="Anything needing client / architect input"
                          className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExecution;
