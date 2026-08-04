import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Save, Loader2, Search } from 'lucide-react';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/api`;

// Toggle a checkbox in the local grid before persisting.
export default function RolePermissionMatrix() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [assignments, setAssignments] = useState({}); // { roleId: Set<permId> }
  const [dirty, setDirty] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/roles/matrix/all`);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      const asMap = {};
      for (const r of data.roles || []) asMap[r.id] = new Set(data.assignments?.[r.id] || []);
      setAssignments(asMap);
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load matrix');
    } finally {
      setLoading(false);
    }
  }

  function toggle(roleId, permId) {
    setAssignments(prev => {
      const next = { ...prev };
      const set = new Set(next[roleId] || []);
      if (set.has(permId)) set.delete(permId); else set.add(permId);
      next[roleId] = set;
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      // PUT each role's permission set. Sequential to make errors easier to trace.
      for (const role of roles) {
        const ids = Array.from(assignments[role.id] || []);
        await axios.put(`${API_BASE_URL}/roles/${role.id}/permissions`, { permission_ids: ids });
      }
      toast.success('Matrix saved');
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    if (!filter.trim()) return permissions;
    const q = filter.toLowerCase();
    return permissions.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.resource?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [permissions, filter]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100"><Shield className="text-blue-600" size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Role &amp; Permission Matrix</h1>
            <p className="text-sm text-slate-500">{roles.length} roles &times; {permissions.length} permissions</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Filter permissions…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 min-w-[220px]">
                Permission
              </th>
              {roles.map(r => (
                <th key={r.id} className="px-2 py-3 text-center font-medium text-slate-600 whitespace-nowrap" title={r.description}>
                  <div className="rotate-[-30deg] origin-bottom-left inline-block pl-3">{r.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 text-slate-700">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.description || `${p.resource}.${p.action}`}</div>
                </td>
                {roles.map(r => {
                  const on = assignments[r.id]?.has(p.id);
                  return (
                    <td key={r.id} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!on}
                        onChange={() => toggle(r.id, p.id)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                        aria-label={`${r.name} — ${p.name}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={roles.length + 1} className="px-4 py-8 text-center text-slate-400">
                  No permissions match &quot;{filter}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Changes are staged locally until you click Save. Admin role bypasses all checks in the app, so unchecking
        permissions for &quot;admin&quot; has no runtime effect.
      </p>
    </div>
  );
}
