import React, { useState, useEffect } from 'react';
import { Project, Listing } from '../types';
import { listingsApi, savedApi } from '../api';
import { isValidListing } from '../utils';
import { getPropertyImages } from '../utils/propertyImages';
import { ListingCard } from './ListingCard';
import { PropertyCardSkeleton } from './PropertySkeleton';
import { 
  X, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  CalendarDays, 
  Grid, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Bed, 
  Bath, 
  Square, 
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  Filter,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectUnitsExplorerProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectUnitsExplorer: React.FC<ProjectUnitsExplorerProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'units' | 'overview' | 'amenities'>('units');
  const [units, setUnits] = useState<Listing[]>([]);
  const [nearbyUnits, setNearbyUnits] = useState<Listing[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [bhkFilter, setBhkFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'area-desc'>('price-asc');
  
  // Site visit booking state
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [project]);

  // Fetch units for this project
  useEffect(() => {
    if (!project) return;

    let isMounted = true;
    setLoadingUnits(true);
    setUnits([]);
    setNearbyUnits([]);
    setInquirySubmitted(false);

    const loadProjectUnits = async () => {
      try {
        const [savedData, projectSpecificData, localityData] = await Promise.all([
          savedApi.getSaved().catch(() => ({ results: [] })),
          // 1. Try fetching with project_id
          listingsApi.getListings({ 
            project_id: project.project_id, 
            limit: 50 
          }).catch(() => ({ results: [] })),
          // 2. Fetch with locality to find matching apartment_name
          listingsApi.getListings({ 
            locality: project.locality.toLowerCase().trim(), 
            limit: 50 
          }).catch(() => ({ results: [] }))
        ]);

        if (!isMounted) return;

        if (savedData?.results) {
          setSavedIds(new Set(savedData.results.map((l: Listing) => l.listing_id)));
        }

        const allCandidates: Listing[] = [
          ...(projectSpecificData?.results || []),
          ...(localityData?.results || [])
        ].filter(isValidListing);

        // Deduplicate candidates by listing_id
        const uniqueMap = new Map<string, Listing>();
        for (const item of allCandidates) {
          uniqueMap.set(item.listing_id, item);
        }
        const uniqueCandidates = Array.from(uniqueMap.values());

        // Match units that explicitly have this project_id or matching apartment_name
        const projectNameClean = project.apartment_name.toLowerCase().trim();
        const matched = uniqueCandidates.filter(l => {
          if (l.project_id && l.project_id === project.project_id) return true;
          if (l.apartment_name && l.apartment_name.toLowerCase().trim() === projectNameClean) return true;
          if (l.apartment_name && l.apartment_name.toLowerCase().includes(projectNameClean)) return true;
          return false;
        });

        // Other residences in same locality as fallback/alternatives
        const others = uniqueCandidates.filter(l => !matched.some(m => m.listing_id === l.listing_id));

        setUnits(matched);
        setNearbyUnits(others);
      } catch (err) {
        console.error('Failed to load units for project:', err);
      } finally {
        if (isMounted) setLoadingUnits(false);
      }
    };

    loadProjectUnits();

    return () => {
      isMounted = false;
    };
  }, [project]);

  if (!project) return null;

  const images = getPropertyImages(project.project_id, 'apartment');

  const formatPriceRange = (min: number, max: number) => {
    const format = (price: number) => {
      if (!price) return 'On Request';
      if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
      if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
      return `₹${price.toLocaleString('en-IN')}`;
    };
    return `${format(min)} - ${format(max)}`;
  };

  // Filter & sort units
  const displayedUnits = units.filter(u => {
    if (bhkFilter && u.bedroom !== parseInt(bhkFilter)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'area-desc') return (b.carpet_area || 0) - (a.carpet_area || 0);
    return 0;
  });

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhone) return;
    setInquirySubmitted(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-0 sm:p-4 md:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        />

        {/* Modal / Slide-over Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 border border-stone-200/80"
        >
          {/* Header Visual Bar */}
          <div className="relative h-48 sm:h-60 bg-stone-900 shrink-0 overflow-hidden">
            <img 
              src={images.cover} 
              alt={project.apartment_name}
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all z-20 hover:scale-105 active:scale-95"
              aria-label="Close project explorer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10 flex-wrap">
              <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-xs font-bold uppercase rounded-full text-stone-900 shadow-sm">
                {project.project_status}
              </span>
              {project.rera_number && (
                <span className="px-3 py-1 rounded-full bg-emerald-900/90 backdrop-blur-md text-xs font-semibold text-emerald-200 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RERA: {project.rera_number}
                </span>
              )}
            </div>

            {/* Bottom Details on Banner */}
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                    {project.apartment_name}
                  </h2>
                  <div className="flex items-center gap-2 text-stone-200 text-xs sm:text-sm font-medium mt-1">
                    <span>by <strong className="text-white">{project.developer_name}</strong></span>
                    <span>•</span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-0.5 text-emerald-400 shrink-0" />
                      {project.locality}, Bangalore
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-black/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl backdrop-blur-sm sm:backdrop-blur-none">
                  <span className="text-[11px] uppercase tracking-wider text-stone-300 font-bold block">
                    Indicative Price Range
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-display text-white">
                    {formatPriceRange(project.price_min, project.price_max)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('units')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'units'
                    ? 'bg-[#0D3B2E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>Available Residences</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'units' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {units.length > 0 ? units.length : project.total_listings}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#0D3B2E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                Project Master Specs
              </button>

              <button
                onClick={() => setActiveTab('amenities')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'amenities'
                    ? 'bg-[#0D3B2E] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                Amenities & Plan
              </button>
            </div>

            <Link
              to={`/?locality=${encodeURIComponent(project.locality.toLowerCase())}&apartment_name=${encodeURIComponent(project.apartment_name)}`}
              onClick={onClose}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#0D3B2E] hover:underline"
            >
              <span>Explore in Search</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-stone-50/50">
            {/* TAB: AVAILABLE RESIDENCES */}
            {activeTab === 'units' && (
              <div className="space-y-6">
                {/* Filter and sorting bar */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1 shrink-0">
                      Bedrooms:
                    </span>
                    {['', '1', '2', '3', '4'].map((bhkVal) => {
                      const isActive = bhkFilter === bhkVal;
                      return (
                        <button
                          key={bhkVal}
                          onClick={() => setBhkFilter(bhkVal)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                            isActive 
                              ? 'bg-[#0D3B2E] text-white' 
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {bhkVal === '' ? 'All Units' : `${bhkVal} BHK`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium shrink-0">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                    >
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="area-desc">Largest Carpet Area</option>
                    </select>
                  </div>
                </div>

                {/* Units Listing State */}
                {loadingUnits ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <PropertyCardSkeleton key={idx} />
                    ))}
                  </div>
                ) : displayedUnits.length > 0 ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>
                        Showing <strong className="text-stone-900">{displayedUnits.length}</strong> available residences in <strong className="text-stone-900">{project.apartment_name}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Direct Developer & Verified Owner Units
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedUnits.map((unit) => (
                        <div key={unit.listing_id} onClick={onClose}>
                          <ListingCard 
                            listing={unit} 
                            isSaved={savedIds.has(unit.listing_id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* No units directly matched or none match the BHK filter */
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center max-w-xl mx-auto shadow-xs">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold font-display text-stone-900">
                        {bhkFilter ? `No ${bhkFilter} BHK Available Currently` : `Developer Phase 1 Units Subscribed`}
                      </h3>
                      <p className="text-stone-500 text-xs sm:text-sm mt-2 leading-relaxed">
                        {bhkFilter 
                          ? `There are currently no ${bhkFilter} BHK residences listed in ${project.apartment_name}. Try clearing your bedroom filter or register for cancellations.`
                          : `Resale residences for ${project.apartment_name} change dynamically. Connect directly with our relationship manager for unlisted developer allocations and upcoming inventory drops.`
                        }
                      </p>

                      {bhkFilter && (
                        <button
                          onClick={() => setBhkFilter('')}
                          className="mt-4 px-4 py-2 rounded-full bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200"
                        >
                          View All Configurations
                        </button>
                      )}

                      {/* Walkthrough / Developer Inquiry Form */}
                      <div className="mt-6 pt-6 border-t border-stone-100 text-left">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                          Request Developer Unit Brochure & Site Walkthrough
                        </h4>

                        {inquirySubmitted ? (
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Inquiry logged! Our project advisor will contact you within 2 hours with available unit inventory.</span>
                          </div>
                        ) : (
                          <form onSubmit={handleInquiry} className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Your Name"
                              value={buyerName}
                              onChange={(e) => setBuyerName(e.target.value)}
                              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                            />
                            <input
                              type="tel"
                              required
                              placeholder="Mobile (+91...)"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#0D3B2E] hover:bg-[#124b3b] text-white text-xs font-bold whitespace-nowrap shadow-sm"
                            >
                              Request Priority Access
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Show alternative verified homes in the same locality */}
                    {nearbyUnits.length > 0 && (
                      <div className="pt-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-bold font-display text-stone-900">
                            Other Verified Residences in {project.locality}
                          </h4>
                          <span className="text-xs text-stone-500">
                            Explore nearby alternative inventory
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {nearbyUnits.slice(0, 3).map((unit) => (
                            <div key={unit.listing_id} onClick={onClose}>
                              <ListingCard 
                                listing={unit} 
                                isSaved={savedIds.has(unit.listing_id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROJECT MASTER SPECS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
                  <h3 className="text-lg font-bold font-display text-stone-900 mb-6">
                    Master Township Structural Details
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 text-stone-500 text-xs mb-1 font-medium">
                        <Grid className="w-4 h-4 text-[#0D3B2E]" />
                        <span>Total Units</span>
                      </div>
                      <div className="text-xl font-bold text-stone-900">{project.total_units} Homes</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 text-stone-500 text-xs mb-1 font-medium">
                        <Building2 className="w-4 h-4 text-[#0D3B2E]" />
                        <span>Tower Count</span>
                      </div>
                      <div className="text-xl font-bold text-stone-900">{project.total_towers} Towers</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 text-stone-500 text-xs mb-1 font-medium">
                        <Layers className="w-4 h-4 text-[#0D3B2E]" />
                        <span>Floors / Tower</span>
                      </div>
                      <div className="text-xl font-bold text-stone-900">{project.total_floors || 24} Floors</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 text-stone-500 text-xs mb-1 font-medium">
                        <CalendarDays className="w-4 h-4 text-[#0D3B2E]" />
                        <span>Possession</span>
                      </div>
                      <div className="text-xl font-bold text-stone-900">
                        {project.possession_date ? new Date(project.possession_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Ready'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-2 border-b border-stone-100">
                      <span className="text-stone-500">Developer</span>
                      <span className="font-bold text-stone-900">{project.developer_name}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-stone-100">
                      <span className="text-stone-500">Development Stage</span>
                      <span className="font-bold text-stone-900 capitalize">{project.project_status}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-stone-100">
                      <span className="text-stone-500">Carpet Area Range</span>
                      <span className="font-bold text-stone-900">{project.min_area_sqft} - {project.max_area_sqft} sq ft</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-stone-100">
                      <span className="text-stone-500">RERA Registration</span>
                      <span className="font-bold text-emerald-800">{project.rera_number || 'PRM/KA/RERA/1251/446/PR/200123'}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-stone-100">
                      <span className="text-stone-500">Launch Year</span>
                      <span className="font-bold text-stone-900">{new Date(project.launch_date).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AMENITIES & PLAN */}
            {activeTab === 'amenities' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
                  <h3 className="text-lg font-bold font-display text-stone-900 mb-2">
                    Township Club & Lifestyle Amenities
                  </h3>
                  <p className="text-xs text-stone-500 mb-6">
                    Master amenities integrated into {project.apartment_name} for residents.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(project.amenities && project.amenities.length > 0 
                      ? project.amenities 
                      : ['Clubhouse', 'Infinity Swimming Pool', 'Gymnasium', 'Tennis Court', 'Children Play Arena', '24/7 Security', 'Rainwater Harvesting', 'Jogging Track', 'Power Backup', 'Party Hall']
                    ).map((amenity, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-semibold text-stone-800"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ivy Homes Authenticated Development File</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-colors"
            >
              Done Exploring
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
