import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, IndianRupee, Car, Home, ArrowLeft, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { packagesAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatINR = (amount, decimals = 2) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const PackageRateCards = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sft, setSft] = useState('');
  const [stilt, setStilt] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await packagesAPI.getAll();
        const arr = Array.isArray(response) ? response
          : Array.isArray(response?.data) ? response.data
          : [];
        arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setPackages(arr);
      } catch (err) {
        console.error('Error fetching packages:', err);
        toast.error('Failed to fetch packages');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-load breakdown at sft=0 so category chips render even before user inputs.
  useEffect(() => { fetchBreakdown(0, 0); /* eslint-disable-next-line */ }, []);

  const fetchBreakdown = async (s, st) => {
    setCalcLoading(true);
    try {
      const res = await api.get(`/packages/cost-breakdown?sft=${s || 0}&stilt=${st || 0}`);
      setBreakdown(res.data);
    } catch (err) {
      console.error('cost breakdown error', err);
      toast.error('Failed to load cost breakdown');
    } finally {
      setCalcLoading(false);
    }
  };

  const onCalculate = (e) => {
    e.preventDefault();
    fetchBreakdown(Number(sft) || 0, Number(stilt) || 0);
  };

  const catByPkg = useMemo(() => {
    const map = new Map();
    if (breakdown?.packages) breakdown.packages.forEach(p => map.set(p.id, p));
    return map;
  }, [breakdown]);

  const accentByOrder = [
    { ring: 'ring-emerald-200', chip: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    { ring: 'ring-sky-200',     chip: 'bg-sky-50 text-sky-700',         bar: 'bg-sky-500' },
    { ring: 'ring-violet-200',  chip: 'bg-violet-50 text-violet-700',   bar: 'bg-violet-500' },
    { ring: 'ring-amber-200',   chip: 'bg-amber-50 text-amber-700',     bar: 'bg-amber-500' },
  ];

  const showTotals = (Number(sft) || 0) > 0 || (Number(stilt) || 0) > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/packages')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
        >
          <ArrowLeft size={14} /> Back to Packages
        </button>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Package size={16} /> Packages
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Package Rates &amp; Cost Calculator</h1>
        <p className="text-sm text-gray-600 mt-1">
          Per-square-foot sales rates (inclusive of GST) and estimated MEP procurement cost per package.
        </p>
      </div>

      {/* Calculator */}
      <form onSubmit={onCalculate} className="bg-white ring-1 ring-gray-200 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Built-up Area (SFT)</label>
          <input
            type="number" min="0" step="1" value={sft} onChange={e => setSft(e.target.value)}
            placeholder="e.g. 1500"
            className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stilt / Parking (SFT)</label>
          <input
            type="number" min="0" step="1" value={stilt} onChange={e => setStilt(e.target.value)}
            placeholder="e.g. 400"
            className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button
          type="submit"
          disabled={calcLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-md"
        >
          <Calculator size={16} /> {calcLoading ? 'Calculating…' : 'Calculate'}
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-96 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No packages found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg, idx) => {
            const acc = accentByOrder[idx % 4];
            const bd = catByPkg.get(pkg.id);
            return (
              <div
                key={pkg.id}
                className={`relative rounded-xl bg-white ring-1 ${acc.ring} shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col`}
              >
                <div className={`h-1 ${acc.bar}`} />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.package_name}</h3>
                      {pkg.tagline && <p className="text-xs text-gray-500 mt-0.5">{pkg.tagline}</p>}
                    </div>
                    {pkg.is_popular && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${acc.chip}`}>
                        <Star size={12} fill="currentColor" /> Popular
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    {/* Sales rate — FIXED at package creation */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Sales rate (fixed)</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <IndianRupee size={20} className="text-gray-700" />
                        <span className="text-3xl font-bold text-gray-900">{formatINR(pkg.total_price_per_sqft)}</span>
                        <span className="text-sm text-gray-500 ml-1">/ SFT</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Home size={14} className="text-gray-400" />
                        <span className="text-gray-500">Built-up (incl. {Number(pkg.gst_percentage || 0).toFixed(0)}% GST)</span>
                      </div>
                    </div>

                    {/* Cost from items — DYNAMIC, updates when items change */}
                    {pkg.mep_cost_per_sqft != null && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Cost / SFT (from items)</div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-semibold text-gray-800">₹{formatINR(pkg.mep_cost_per_sqft)}</span>
                          <span className="text-xs text-gray-500">/ SFT</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Live — recomputes as items/choices change</div>
                      </div>
                    )}

                    {/* Margin indicator */}
                    {pkg.margin_per_sqft != null && (
                      <div className={`rounded-md px-2 py-1.5 flex items-center justify-between ${
                        Number(pkg.margin_per_sqft) >= 0
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}>
                        <span className="text-[11px] font-medium flex items-center gap-1">
                          {Number(pkg.margin_per_sqft) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          Margin vs items only
                        </span>
                        <span className="text-sm font-bold">₹{formatINR(pkg.margin_per_sqft)}</span>
                      </div>
                    )}

                    {pkg.stilt_price_per_sqft != null && (
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <div className="flex items-baseline gap-1">
                          <Car size={16} className="text-gray-500" />
                          <span className="text-lg font-semibold text-gray-800">₹{formatINR(pkg.stilt_price_per_sqft)}</span>
                          <span className="text-xs text-gray-500 ml-1">/ SFT</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">Stilt floor / parking (fixed)</p>
                        {pkg.stilt_cost_per_sqft != null && (
                          <div className="mt-1 text-[11px] text-gray-600 flex justify-between">
                            <span>Cost <span className="text-gray-400">({Math.round(Number(pkg.stilt_cost_ratio || 0.65) * 100)}% of built-up cost)</span></span>
                            <span className="font-medium">₹{formatINR(pkg.stilt_cost_per_sqft)}</span>
                          </div>
                        )}
                        {pkg.stilt_margin_per_sqft != null && (
                          <div className={`mt-1 text-[11px] flex justify-between font-medium ${
                            Number(pkg.stilt_margin_per_sqft) >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            <span>Margin</span>
                            <span>₹{formatINR(pkg.stilt_margin_per_sqft)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MEP breakdown */}
                  {bd && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-[11px] uppercase font-semibold text-gray-500 tracking-wide mb-2">MEP cost estimate</div>
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold">₹{formatINR(bd.mep_cost_per_sqft)}</span>
                        <span className="text-xs text-gray-500"> / SFT</span>
                        {bd.mep_share_pct != null && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${acc.chip}`}>{bd.mep_share_pct}% of price</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-gray-600">
                        {bd.categories.map(c => (
                          <div key={c.category} className="flex justify-between">
                            <span>{c.category} <span className="text-gray-400">({c.items})</span></span>
                            <span className="font-medium">₹{formatINR(c.mep_cost_per_sqft)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals when SFT provided */}
                  {showTotals && bd && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Built-up total</span><span>₹{formatINR(bd.built_up_total)}</span>
                      </div>
                      {bd.stilt_total > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Stilt total</span><span>₹{formatINR(bd.stilt_total)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100 mt-1">
                        <span>Quote total</span><span>₹{formatINR(bd.revenue_total, 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>MEP cost (est.)</span><span>₹{formatINR(bd.mep_cost_total, 0)}</span>
                      </div>
                    </div>
                  )}

                  {pkg.description && !showTotals && (
                    <p className="text-xs text-gray-600 mt-4 line-clamp-3">{pkg.description}</p>
                  )}

                  <div className="mt-auto pt-4 text-[11px] text-gray-400 flex justify-between">
                    <span>Base: ₹{formatINR(pkg.base_price_per_sqft)}</span>
                    <span>GST: ₹{formatINR(pkg.gst_amount_per_sqft)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="mt-6 text-xs text-gray-500 flex flex-wrap gap-4">
          <span><span className="font-medium text-gray-700">Sales rate</span> is the customer-facing price per SFT (inclusive of GST).</span>
          <span><span className="font-medium text-gray-700">MEP cost</span> is estimated procurement cost of Electrical + Plumbing + CP&amp;Sanitary — not the full build cost.</span>
        </div>
      )}
    </div>
  );
};

export default PackageRateCards;
