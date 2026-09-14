import React, { useState, useEffect } from 'react';
import { listingsApi, savedApi } from '../api';
import { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { PropertyGridSkeleton } from '../components/PropertySkeleton';
import { 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  MapPin, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ChevronDown,
  Building,
  ArrowRight
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isValidListing } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

const POPULAR_LOCALITIES = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Bellandur',
  'Sarjapur Road',
];

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const initialFilters = {
    locality: searchParams.get('locality') || '',
    bhk: searchParams.get('bhk') || '',
    property_type: searchParams.get('property_type') || '',
    project_id: searchParams.get('project_id') || '',
    apartment_name: searchParams.get('apartment_name') || '',
    sort_by: searchParams.get('sort_by') || 'posted_at',
    order: searchParams.get('order') || 'desc',
  };

  const [filters, setFilters] = useState(initialFilters);

  const fetchListings = async (currentOffset: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        limit: 20,
        offset: currentOffset,
      };
      if (filters.locality) params.locality = filters.locality.toLowerCase().trim();
      if (filters.bhk) params.bhk = parseInt(filters.bhk);
      if (filters.property_type) params.property_type = filters.property_type.toLowerCase();
      if (filters.project_id) params.project_id = filters.project_id;
      if (filters.apartment_name) params.apartment_name = filters.apartment_name;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.order) params.order = filters.order;

      const [data, savedData] = await Promise.all([
        listingsApi.getListings(params),
        currentOffset === 0 ? savedApi.getSaved().catch(() => ({ results: [] })) : Promise.resolve(null)
      ]);

      if (savedData) {
        setSavedIds(new Set(savedData.results.map((l: Listing) => l.listing_id)));
      }

      let validListings = data.results.filter(isValidListing);

      // Support project / development filtering
      if (filters.apartment_name || filters.project_id) {
        const aptFilter = (filters.apartment_name || '').toLowerCase().trim();
        const filtered = validListings.filter(l => {
          if (filters.project_id && l.project_id === filters.project_id) return true;
          if (aptFilter && l.apartment_name && l.apartment_name.toLowerCase().includes(aptFilter)) return true;
          return false;
        });
        if (filtered.length > 0) {
          validListings = filtered;
        }
      }

      if (isLoadMore) {
        setListings(prev => [...prev, ...validListings]);
      } else {
        setListings(validListings);
      }
      
      setHasMore(data.has_more);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load listings');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const updated = {
      locality: params.get('locality') || '',
      bhk: params.get('bhk') || '',
      property_type: params.get('property_type') || '',
      project_id: params.get('project_id') || '',
      apartment_name: params.get('apartment_name') || '',
      sort_by: params.get('sort_by') || 'posted_at',
      order: params.get('order') || 'desc',
    };
    setFilters(prev => {
      const isSame = 
        prev.locality === updated.locality &&
        prev.bhk === updated.bhk &&
        prev.property_type === updated.property_type &&
        prev.project_id === updated.project_id &&
        prev.apartment_name === updated.apartment_name &&
        prev.sort_by === updated.sort_by &&
        prev.order === updated.order;
      return isSame ? prev : updated;
    });
  }, [location.search]);

  useEffect(() => {
    setOffset(0);
    fetchListings(0);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL query parameters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    navigate({ search: params.toString() }, { replace: true });
  };

  const clearAllFilters = () => {
    const reset = {
      locality: '',
      bhk: '',
      property_type: '',
      project_id: '',
      apartment_name: '',
      sort_by: 'posted_at',
      order: 'desc',
    };
    setFilters(reset);
    navigate({ search: '' }, { replace: true });
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextOffset = offset + 20;
      setOffset(nextOffset);
      fetchListings(nextOffset, true);
    }
  };

  const activeFilterCount = [
    Boolean(filters.locality),
    Boolean(filters.bhk),
    Boolean(filters.property_type),
    Boolean(filters.apartment_name || filters.project_id),
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero Header */}
      <div className="mb-10 sm:mb-12 text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display mb-4 leading-[1.12]">
          Curated Residences in Bangalore
        </h1>
        <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-normal leading-relaxed">
          Architectural homes, luxury high-rises, and private villas vetted for clean legal titles, transparent valuation benchmarks, and immediate possession.
        </p>
      </div>

      {/* Floating Modern Search & Filter Console */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-stone-200/50 border border-stone-200/80 mb-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Locality Search Input */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white text-sm transition-all"
              placeholder="Search locality (e.g. Koramangala, Indiranagar...)"
              value={filters.locality}
              onChange={(e) => handleFilterChange('locality', e.target.value)}
            />
            {filters.locality && (
              <button
                onClick={() => handleFilterChange('locality', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Property Type Dropdown */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white transition-all cursor-pointer"
                value={filters.property_type}
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
              >
                <option value="">All Property Types</option>
                <option value="apartment">Gated Apartment</option>
                <option value="villa">Private Villa</option>
                <option value="independent house">Independent House</option>
                <option value="builder floor">Builder Floor</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-4">
            <div className="relative">
              <select
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white transition-all cursor-pointer"
                value={`${filters.sort_by}-${filters.order}`}
                onChange={(e) => {
                  const [sort_by, order] = e.target.value.split('-');
                  setFilters({ ...filters, sort_by, order });
                }}
              >
                <option value="posted_at-desc">Sort: Newest Listed</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
                <option value="carpet_area-desc">Sort: Largest Carpet Area</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* BHK Quick Selector Tabs & Popular Locations */}
        <div className="pt-3 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1 shrink-0">
              Bedrooms:
            </span>
            {['', '1', '2', '3', '4'].map((bhkVal) => {
              const isActive = filters.bhk === bhkVal;
              return (
                <button
                  key={bhkVal}
                  onClick={() => handleFilterChange('bhk', bhkVal)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-[#0D3B2E] text-white shadow-xs' 
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {bhkVal === '' ? 'Any BHK' : bhkVal === '4' ? '4+ BHK' : `${bhkVal} BHK`}
                </button>
              );
            })}
          </div>

          {/* Quick Locality Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-stone-400 shrink-0 font-medium">Hot:</span>
            {POPULAR_LOCALITIES.slice(0, 4).map((loc) => (
              <button
                key={loc}
                onClick={() => handleFilterChange('locality', loc)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                  filters.locality.toLowerCase() === loc.toLowerCase()
                    ? 'border-[#0D3B2E] bg-[#0D3B2E]/10 text-[#0D3B2E]'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-stone-500">Active Filters:</span>
              {filters.locality && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  Locality: {filters.locality}
                  <button onClick={() => handleFilterChange('locality', '')}>
                    <X className="w-3 h-3 hover:text-emerald-950" />
                  </button>
                </span>
              )}
              {filters.bhk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  {filters.bhk} BHK
                  <button onClick={() => handleFilterChange('bhk', '')}>
                    <X className="w-3 h-3 hover:text-emerald-950" />
                  </button>
                </span>
              )}
              {filters.property_type && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 capitalize">
                  {filters.property_type}
                  <button onClick={() => handleFilterChange('property_type', '')}>
                    <X className="w-3 h-3 hover:text-emerald-950" />
                  </button>
                </span>
              )}
              {(filters.apartment_name || filters.project_id) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D3B2E] text-white text-xs font-medium border border-[#0D3B2E] shadow-xs">
                  Development: {filters.apartment_name || filters.project_id}
                  <button onClick={() => {
                    handleFilterChange('apartment_name', '');
                    handleFilterChange('project_id', '');
                  }}>
                    <X className="w-3 h-3 hover:text-stone-200" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#0D3B2E] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Listing View */}
      {error ? (
        <div className="p-6 bg-red-50/80 border border-red-200 rounded-2xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => fetchListings(0)} 
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : loading ? (
        <PropertyGridSkeleton count={8} />
      ) : listings.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 font-display">No residences match your criteria</h3>
          <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
            Try adjusting your locality search, opening bedroom preferences, or removing property type constraints.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full bg-[#0D3B2E] text-white text-xs font-semibold hover:bg-[#124b3b] shadow-sm transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Results Summary Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-700">
              Showing <span className="text-[#0D3B2E] font-bold">{listings.length}</span> verified properties in Bangalore
            </div>
            {total > 0 && (
              <div className="text-xs text-stone-500 font-medium">
                {total} total in catalog
              </div>
            )}
          </div>

          {/* Listing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing, i) => (
              <motion.div
                key={`${listing.listing_id}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
              >
                <ListingCard 
                  listing={listing} 
                  isSaved={savedIds.has(listing.listing_id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Load More Action */}
          {hasMore && (
            <div className="mt-14 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-stone-300 text-sm font-bold rounded-full text-stone-800 bg-white hover:bg-stone-50 hover:border-stone-400 shadow-sm transition-all disabled:opacity-50 active:scale-98"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#0D3B2E] animate-spin" />
                    <span>Loading more homes...</span>
                  </>
                ) : (
                  <>
                    <span>Discover More Residences</span>
                    <ArrowRight className="w-4 h-4 text-[#0D3B2E]" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
