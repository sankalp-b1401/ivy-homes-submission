import React, { useState, useEffect } from 'react';
import { rentalsApi } from '../api';
import { Rental } from '../types';
import { 
  Search, 
  Loader2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  KeyRound, 
  Sparkles, 
  ChevronDown, 
  X,
  ShieldCheck,
  ArrowRight,
  Shield,
  Building
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isValidRental } from '../utils';
import { getPropertyImages } from '../utils/propertyImages';
import { PropertyGridSkeleton } from '../components/PropertySkeleton';
import { motion } from 'motion/react';

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const initialFilters = {
    locality: searchParams.get('locality') || '',
    bhk: searchParams.get('bhk') || '',
    furnishing: searchParams.get('furnishing') || '',
    sort_by: searchParams.get('sort_by') || 'posted_at',
    order: searchParams.get('order') || 'desc',
  };

  const [filters, setFilters] = useState(initialFilters);

  const fetchRentals = async (currentOffset: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        limit: 20,
        offset: currentOffset,
      };
      if (filters.locality) params.locality = filters.locality.toLowerCase().trim();
      if (filters.bhk) params.bhk = parseInt(filters.bhk);
      if (filters.furnishing) params.furnishing = filters.furnishing.toLowerCase();
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.order) params.order = filters.order;
      
      const data = await rentalsApi.getRentals(params);
      const validRentals = data.results.filter(isValidRental);

      if (isLoadMore) {
        setRentals(prev => [...prev, ...validRentals]);
      } else {
        setRentals(validRentals);
      }
      
      setHasMore(data.has_more);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load rentals');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchRentals(0);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    navigate({ search: params.toString() }, { replace: true });
  };

  const clearAllFilters = () => {
    setFilters({
      locality: '',
      bhk: '',
      furnishing: '',
      sort_by: 'posted_at',
      order: 'desc',
    });
    navigate({ search: '' }, { replace: true });
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextOffset = offset + 20;
      setOffset(nextOffset);
      fetchRentals(nextOffset, true);
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  const formatDeposit = (deposit: number) => {
    if (!deposit) return null;
    if (deposit >= 100000) {
      return `₹${(deposit / 100000).toFixed(1)}L`;
    }
    return `₹${(deposit / 1000).toFixed(0)}k`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero Header */}
      <div className="mb-10 sm:mb-12 text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display mb-4 leading-[1.12]">
          Curated Rental Residences
        </h1>
        <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-normal leading-relaxed">
          Furnished and semi-furnished apartments vetted for corporate executives and families across prime Bangalore neighborhoods.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-stone-200/50 border border-stone-200/80 mb-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Locality Search */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white text-sm transition-all"
              placeholder="Search rental localities (e.g. Indiranagar, HSR...)"
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

          {/* Furnishing Dropdown */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white transition-all cursor-pointer"
                value={filters.furnishing}
                onChange={(e) => handleFilterChange('furnishing', e.target.value)}
              >
                <option value="">Any Furnishing</option>
                <option value="fully-furnished">Fully Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort Dropdown */}
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
                <option value="posted_at-desc">Sort: Newest First</option>
                <option value="price-asc">Rent: Low to High</option>
                <option value="price-desc">Rent: High to Low</option>
                <option value="carpet_area-desc">Largest Area</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bedroom chips */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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

          {(filters.locality || filters.bhk || filters.furnishing) && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#0D3B2E] hover:underline shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid or Skeleton */}
      {error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <span>{error}</span>
        </div>
      ) : loading ? (
        <PropertyGridSkeleton count={8} />
      ) : rentals.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 font-display">No rental properties found</h3>
          <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
            Try adjusting your search criteria or removing bedroom constraints.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full bg-[#0D3B2E] text-white text-xs font-semibold hover:bg-[#124b3b]"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 text-sm font-semibold text-stone-700">
            Showing <span className="text-[#0D3B2E] font-bold">{rentals.length}</span> verified rental homes
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rentals.map((rental, i) => {
              const images = getPropertyImages(rental.listing_id, rental.property_type);
              return (
                <motion.div
                  key={`${rental.listing_id}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                  className="group block h-full"
                >
                  <article className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col h-full group-hover:-translate-y-1">
                    {/* Cover Image */}
                    <div className="h-52 bg-stone-100 relative overflow-hidden">
                      <img 
                        src={images.cover} 
                        alt={rental.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/10 to-transparent pointer-events-none" />

                      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[11px] font-semibold uppercase rounded-full text-stone-800 shadow-xs">
                          {rental.furnishing ? rental.furnishing.replace('-', ' ') : 'Semi-Furnished'}
                        </span>
                      </div>

                      {rental.deposit > 0 && (
                        <div className="absolute bottom-3 right-3.5 z-10">
                          <span className="px-2.5 py-0.5 rounded-md bg-stone-900/70 backdrop-blur-sm text-[11px] font-medium text-emerald-300">
                            Deposit: {formatDeposit(rental.deposit)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <h3 className="text-2xl font-bold font-display text-stone-900 tracking-tight">
                            {formatPrice(rental.price)}
                          </h3>
                          <span className="text-xs text-stone-500 font-medium">/ month</span>
                        </div>

                        {/* Apartment Name */}
                        {rental.apartment_name ? (
                          <div className="mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] mb-0.5">
                              <Building className="w-3.5 h-3.5 shrink-0 text-[#0D3B2E]" />
                              <span className="truncate tracking-tight uppercase text-[11px] font-bold">{rental.apartment_name}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-stone-800 capitalize line-clamp-1">
                              {rental.title || `${rental.bedroom} BHK in ${rental.locality}`}
                            </h4>
                          </div>
                        ) : (
                          <h4 className="text-sm font-semibold text-stone-800 capitalize line-clamp-1 mb-2">
                            {rental.title || `${rental.bedroom} BHK in ${rental.locality}`}
                          </h4>
                        )}

                        <div className="flex items-center text-stone-500 text-xs mb-4">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-[#0D3B2E] shrink-0" />
                          <span className="truncate capitalize font-medium">{rental.locality}, Bangalore</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700">
                          <div className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            <span className="text-xs font-bold">{rental.bedroom}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">Beds</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700">
                          <div className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            <span className="text-xs font-bold">{rental.bathroom}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">Baths</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700">
                          <div className="flex items-center gap-1">
                            <Square className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            <span className="text-xs font-bold">{rental.carpet_area}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">Sq Ft</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-14 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-stone-300 text-sm font-bold rounded-full text-stone-800 bg-white hover:bg-stone-50 hover:border-stone-400 shadow-sm transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#0D3B2E] animate-spin" />
                    <span>Loading rentals...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Rentals</span>
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
