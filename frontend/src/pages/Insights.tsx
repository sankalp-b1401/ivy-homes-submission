import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Building2, 
  MapPin, 
  Layers, 
  RefreshCw, 
  Copy, 
  Check, 
  TrendingUp, 
  FileCode2,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Search
} from 'lucide-react';
import { AnalyticsSummary } from '../types';
import { PRECOMPUTED_ANALYTICS, fetchAllListingsAndCompute } from '../utils/analytics';
import { motion } from 'motion/react';

export default function Insights() {
  const [summary, setSummary] = useState<AnalyticsSummary>(() => {
    const cached = localStorage.getItem('ivy_cached_analytics');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    return PRECOMPUTED_ANALYTICS;
  });

  const [loadingLive, setLoadingLive] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'localities' | 'bhk' | 'raw_json'>('overview');
  const [localitySearch, setLocalitySearch] = useState('');

  const handleRunLiveComputation = async () => {
    setLoadingLive(true);
    setProgress({ loaded: 0, total: 1 });
    try {
      const { summary: computed } = await fetchAllListingsAndCompute((loaded, total) => {
        setProgress({ loaded, total });
      });
      setSummary(computed);
      localStorage.setItem('ivy_cached_analytics', JSON.stringify(computed));
    } catch (err) {
      console.error('Failed to run live analytics computation:', err);
    } finally {
      setLoadingLive(false);
      setProgress(null);
    }
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '₹0';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBhkListings = summary.by_bhk.reduce((acc, curr) => acc + curr.count, 0) || summary.total_listings;
  const maxLocalityCount = Math.max(...summary.by_locality.map(l => l.count), 1);

  const filteredLocalities = summary.by_locality.filter(l => 
    l.locality.toLowerCase().includes(localitySearch.toLowerCase().trim())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero Header */}
      <div className="mb-10 sm:mb-12 text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display mb-4 leading-[1.12]">
            Market Intelligence & Valuations
          </h1>
          <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-normal leading-relaxed">
            Directly aggregated pricing medians, micro-market inventory distribution, and configuration analysis across Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunLiveComputation}
            disabled={loadingLive}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#0D3B2E] hover:bg-[#124b3b] rounded-full shadow-md shadow-[#0D3B2E]/20 transition-all disabled:opacity-50 active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
            <span>{loadingLive ? 'Recalculating...' : 'Refresh Live Data'}</span>
          </button>
        </div>
      </div>

      {/* Live Computation Banner */}
      {loadingLive && progress && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-700 animate-spin" />
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Compiling city-wide market benchmarks...
              </p>
              <p className="text-[11px] text-emerald-700">
                Processed {progress.loaded} of {progress.total} catalog properties
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800">
            {progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0}%
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link 
          to="/" 
          className="bg-white p-6 rounded-3xl border border-stone-200/80 hover:border-stone-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-600 transition-colors">Total Valid Residences</span>
            <div className="p-2 rounded-xl bg-[#0D3B2E]/10 text-[#0D3B2E] group-hover:bg-[#0D3B2E] group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-stone-900 group-hover:text-[#0D3B2E] transition-colors mt-3 flex items-center justify-between">
            <span>{summary.total_listings.toLocaleString('en-IN')}</span>
            <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
          </p>
          <div className="flex items-center text-xs text-stone-500 mt-2">
            <span className="text-emerald-700 font-semibold flex items-center mr-1">
              <Sparkles className="w-3 h-3 mr-0.5" /> 100% Genuine
            </span>
            <span>Explore all homes &rarr;</span>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Median Residence Price</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-stone-900 mt-3">{formatPrice(summary.median_price)}</p>
          <div className="text-xs text-stone-500 mt-2">
            Median benchmark across all listings
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Median Rate / Sq.Ft</span>
            <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-stone-900 mt-3">₹{summary.median_price_per_sqft.toLocaleString('en-IN')}</p>
          <div className="text-xs text-stone-500 mt-2">
            Carpet area basis rate
          </div>
        </div>

        <button
          onClick={() => setActiveTab('localities')}
          className="bg-white p-6 rounded-3xl border border-stone-200/80 hover:border-stone-300 hover:shadow-md transition-all group text-left block w-full"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-600 transition-colors">Tracked Micro-Markets</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-stone-900 group-hover:text-[#0D3B2E] transition-colors mt-3 flex items-center justify-between">
            <span>{summary.by_locality.length}</span>
            <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
          </p>
          <div className="text-xs text-stone-500 mt-2 truncate">
            Top hub: <strong className="text-stone-800 capitalize">{summary.by_locality[0]?.locality || 'Bangalore'}</strong> &rarr;
          </div>
        </button>
      </div>

      {/* Styled Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 mb-8">
        {[
          { id: 'overview', label: 'Overview & Distribution' },
          { id: 'localities', label: `Locality Index (${summary.by_locality.length})` },
          { id: 'bhk', label: 'BHK Configurations' },
          { id: 'raw_json', label: 'Raw API Schema' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#0D3B2E] text-white shadow-xs' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Localities Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold font-display text-stone-900">Highest Inventory Corridors</h3>
                <p className="text-xs text-stone-500 mt-1">Listing volume and localized median prices</p>
              </div>
              <button 
                onClick={() => setActiveTab('localities')}
                className="text-xs font-bold text-[#0D3B2E] hover:underline"
              >
                View all localities
              </button>
            </div>

            <div className="space-y-4">
              {summary.by_locality.slice(0, 6).map((loc) => {
                const percentage = Math.round((loc.count / maxLocalityCount) * 100);
                return (
                  <Link
                    key={loc.locality}
                    to={`/?locality=${encodeURIComponent(loc.locality.toLowerCase())}`}
                    className="block p-3.5 rounded-2xl bg-stone-50/70 hover:bg-stone-100/90 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-stone-900 group-hover:text-[#0D3B2E] text-xs sm:text-sm capitalize flex items-center gap-1.5 transition-colors">
                        <span>{loc.locality}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
                      </span>
                      <div className="text-right">
                        <span className="font-extrabold text-stone-900 text-xs sm:text-sm">{formatPrice(loc.median_price)}</span>
                        <span className="text-[11px] text-stone-500 ml-2">({loc.count} homes)</span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-600 to-[#0D3B2E] h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Configuration Mix */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold font-display text-stone-900 mb-1">Configuration Mix</h3>
              <p className="text-xs text-stone-500 mb-6">Bedroom breakdown across all live inventory</p>

              <div className="space-y-3.5">
                {summary.by_bhk.map((bhk) => {
                  const pct = Math.round((bhk.count / totalBhkListings) * 100) || 0;
                  return (
                    <Link
                      key={bhk.bedroom}
                      to={`/?bhk=${bhk.bedroom}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100/90 border border-stone-100 hover:border-stone-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0D3B2E] text-white font-bold text-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                          {bhk.bedroom}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900 group-hover:text-[#0D3B2E] flex items-center gap-1 transition-colors">
                            <span>{bhk.bedroom} BHK Residences</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
                          </p>
                          <p className="text-[10px] text-stone-500 font-medium">{pct}% of market</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-stone-900 text-sm group-hover:text-[#0D3B2E] transition-colors">{bhk.count}</span>
                        <span className="text-[10px] text-stone-400 block font-medium">units</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
              <span>Total Units Analyzed:</span>
              <span className="font-bold text-stone-900">{totalBhkListings}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Locality Index */}
      {activeTab === 'localities' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold font-display text-stone-900">Locality-wise Pricing Index</h3>
              <p className="text-xs text-stone-500 mt-1">
                Complete ranking of neighborhoods sorted by available inventory volume.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Filter locality..."
                value={localitySearch}
                onChange={(e) => setLocalitySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Rank & Micro-Market
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Active Listings
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Supply Share
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Median Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {filteredLocalities.map((item, idx) => {
                  const share = ((item.count / summary.total_listings) * 100).toFixed(1);
                  return (
                    <tr 
                      key={item.locality} 
                      className="hover:bg-stone-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-stone-900 capitalize">
                        <Link 
                          to={`/?locality=${encodeURIComponent(item.locality.toLowerCase())}`}
                          className="flex items-center gap-2 group-hover:text-[#0D3B2E] transition-colors"
                        >
                          <span className="w-6 text-[11px] text-stone-400 font-mono">#{idx + 1}</span>
                          <span>{item.locality}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-600 font-medium">
                        <Link 
                          to={`/?locality=${encodeURIComponent(item.locality.toLowerCase())}`}
                          className="block group-hover:text-stone-900"
                        >
                          {item.count} homes
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#0D3B2E] h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(share) * 3)}%` }}></div>
                          </div>
                          <span>{share}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-stone-900 text-right">
                        <Link 
                          to={`/?locality=${encodeURIComponent(item.locality.toLowerCase())}`}
                          className="inline-block group-hover:text-[#0D3B2E] transition-colors"
                        >
                          {formatPrice(item.median_price)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: BHK Configurations */}
      {activeTab === 'bhk' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mb-8">
            <h3 className="text-xl font-bold font-display text-stone-900">Bedrooms Configuration Distribution</h3>
            <p className="text-xs text-stone-500 mt-1">
              Distribution of verified genuine residential properties categorized by room count.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {summary.by_bhk.map((bhk) => {
              const pct = ((bhk.count / totalBhkListings) * 100).toFixed(1);
              return (
                <Link 
                  key={bhk.bedroom} 
                  to={`/?bhk=${bhk.bedroom}`}
                  className="p-6 rounded-3xl border border-stone-200/80 bg-stone-50/60 hover:bg-white hover:border-stone-300 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#0D3B2E] text-white font-extrabold text-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    {bhk.bedroom}
                  </div>
                  <h4 className="text-base font-bold text-stone-900 group-hover:text-[#0D3B2E] flex items-center gap-1.5 transition-colors">
                    <span>{bhk.bedroom} BHK Residences</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0D3B2E]" />
                  </h4>
                  <p className="text-3xl font-extrabold text-stone-900 font-display mt-2 group-hover:text-[#0D3B2E] transition-colors">{bhk.count}</p>
                  <p className="text-xs text-stone-500 mt-1">{pct}% of catalog</p>
                  <div className="w-full bg-stone-200 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-[#0D3B2E] h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Raw JSON */}
      {activeTab === 'raw_json' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-stone-900">Pre-computed / Computed Aggregates JSON</h3>
              <p className="text-xs text-stone-500">Strictly adheres to the promised analytics schema.</p>
            </div>
            <button
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="bg-stone-950 text-stone-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-stone-800">
            <pre>{JSON.stringify(summary, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
