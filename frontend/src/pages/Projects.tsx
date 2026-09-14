import React, { useState, useEffect } from 'react';
import { projectsApi } from '../api';
import { Project } from '../types';
import { 
  Search, 
  Loader2, 
  Building2, 
  MapPin, 
  Grid, 
  CalendarDays, 
  Sparkles, 
  ChevronDown, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  Home 
} from 'lucide-react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { isValidProject } from '../utils';
import { getPropertyImages } from '../utils/propertyImages';
import { PropertyGridSkeleton } from '../components/PropertySkeleton';
import { ProjectUnitsExplorer } from '../components/ProjectUnitsExplorer';
import { motion } from 'motion/react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeProjectId } = useParams<{ id?: string }>();
  const searchParams = new URLSearchParams(location.search);

  const initialFilters = {
    locality: searchParams.get('locality') || '',
    project_status: searchParams.get('project_status') || '',
    sort_by: searchParams.get('sort_by') || 'launch_date',
    order: searchParams.get('order') || 'desc',
  };

  const [filters, setFilters] = useState(initialFilters);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    const params = new URLSearchParams(location.search);
    params.set('explore', project.project_id);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleCloseExplorer = () => {
    setSelectedProject(null);
    const params = new URLSearchParams(location.search);
    params.delete('explore');
    params.delete('project_id');
    navigate({ search: params.toString() }, { replace: true });
  };

  // Sync selected project from URL param if available
  useEffect(() => {
    const targetId = routeProjectId || searchParams.get('explore') || searchParams.get('project_id');
    if (!targetId) return;

    const found = projects.find(p => p.project_id === targetId);
    if (found) {
      setSelectedProject(found);
    } else {
      projectsApi.getProject(targetId).then(p => {
        if (p) setSelectedProject(p);
      }).catch(err => {
        console.warn('Could not fetch project for explorer', err);
      });
    }
  }, [routeProjectId, location.search, projects]);

  const fetchProjects = async (currentOffset: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        limit: 20,
        offset: currentOffset,
      };
      if (filters.locality) params.locality = filters.locality.toLowerCase().trim();
      if (filters.project_status) params.project_status = filters.project_status.toLowerCase();
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.order) params.order = filters.order;
      
      const data = await projectsApi.getProjects(params);
      const validProjects = data.results.filter(isValidProject);

      if (isLoadMore) {
        setProjects(prev => [...prev, ...validProjects]);
      } else {
        setProjects(validProjects);
      }
      
      setHasMore(data.has_more);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load projects');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchProjects(0);
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
      project_status: '',
      sort_by: 'launch_date',
      order: 'desc',
    });
    navigate({ search: '' }, { replace: true });
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextOffset = offset + 20;
      setOffset(nextOffset);
      fetchProjects(nextOffset, true);
    }
  };

  const formatPriceRange = (min: number, max: number) => {
    const format = (price: number) => {
      if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
      if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
      return `₹${price.toLocaleString('en-IN')}`;
    };
    return `${format(min)} - ${format(max)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero Header */}
      <div className="mb-10 sm:mb-12 text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display mb-4 leading-[1.12]">
          New Residential Developments
        </h1>
        <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-normal leading-relaxed">
          Master-planned communities, luxury high-rises, and eco-sustainable projects from Tier-1 developers in Bangalore.
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
              placeholder="Search developments by locality (e.g. Whitefield, Sarjapur...)"
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

          {/* Project Status Dropdown */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:bg-white transition-all cursor-pointer"
                value={filters.project_status}
                onChange={(e) => handleFilterChange('project_status', e.target.value)}
              >
                <option value="">All Development Stages</option>
                <option value="under construction">Under Construction</option>
                <option value="ready to move">Ready to Move</option>
                <option value="new launch">Newly Launched</option>
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
                <option value="launch_date-desc">Newest Launch First</option>
                <option value="price_min-asc">Price: Low to High</option>
                <option value="price_min-desc">Price: High to Low</option>
                <option value="total_units-desc">Largest Township Units</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {(filters.locality || filters.project_status) && (
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">Filtered search results</span>
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#0D3B2E] hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      {error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <span>{error}</span>
        </div>
      ) : loading ? (
        <PropertyGridSkeleton count={6} />
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 font-display">No development projects found</h3>
          <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
            Try expanding your search locality or clearing development status filters.
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
            Showing <span className="text-[#0D3B2E] font-bold">{projects.length}</span> curated residential developments
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => {
              const images = getPropertyImages(project.project_id, 'apartment');
              return (
                <motion.div
                  key={`${project.project_id}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                  className="group block h-full"
                >
                  <article 
                    onClick={() => handleSelectProject(project)}
                    className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col h-full group-hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Project Visual Cover */}
                    <div className="h-56 bg-stone-100 relative overflow-hidden">
                      <img 
                        src={images.cover} 
                        alt={project.apartment_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent pointer-events-none" />

                      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[11px] font-semibold uppercase rounded-full text-stone-900 shadow-xs">
                          {project.project_status}
                        </span>
                      </div>

                      {project.rera_number && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-900/80 backdrop-blur-md text-[10px] font-semibold text-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            RERA Approved
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 text-white">
                        <div className="text-xl font-bold font-display text-white mb-0.5">
                          {project.apartment_name}
                        </div>
                        <div className="text-xs text-stone-200 font-medium capitalize">
                          by {project.developer_name}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Price Range */}
                        <div className="mb-3">
                          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block">Indicative Pricing</span>
                          <div className="text-xl font-bold text-stone-900 font-display">
                            {formatPriceRange(project.price_min, project.price_max)}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center text-stone-600 text-xs mb-4">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-[#0D3B2E] shrink-0" />
                          <span className="truncate capitalize font-medium">{project.locality}, Bangalore</span>
                        </div>

                        {/* Grid Matrix */}
                        <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-stone-100 text-xs text-stone-600 mb-4">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                            <Grid className="w-4 h-4 text-[#0D3B2E]" />
                            <div>
                              <div className="font-bold text-stone-900">{project.total_units} Units</div>
                              <div className="text-[10px] text-stone-400 font-medium">Master Township</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                            <Building2 className="w-4 h-4 text-[#0D3B2E]" />
                            <div>
                              <div className="font-bold text-stone-900">{project.total_towers} Towers</div>
                              <div className="text-[10px] text-stone-400 font-medium">{project.total_floors || '24'} Floors</div>
                            </div>
                          </div>
                        </div>

                        {project.possession_date && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-4">
                            <CalendarDays className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            <span>Target Possession: <strong className="text-stone-900">{new Date(project.possession_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Footer Info: Explorable Available Residences */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProject(project);
                          }}
                          className="text-xs font-semibold text-stone-600 hover:text-[#0D3B2E] transition-colors text-left"
                        >
                          {project.total_listings > 0 ? (
                            <span className="text-[#0D3B2E] font-bold hover:underline inline-flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              {project.total_listings} Available Residences
                            </span>
                          ) : (
                            <span className="hover:underline text-stone-500">Direct Developer Inquiries</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProject(project);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D3B2E]/10 hover:bg-[#0D3B2E] text-xs font-bold text-[#0D3B2E] hover:text-white transition-all group-hover:bg-[#0D3B2E] group-hover:text-white"
                        >
                          <span>Explore Units</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
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
                    <span>Loading projects...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Developments</span>
                    <ArrowRight className="w-4 h-4 text-[#0D3B2E]" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Project Units & Residences Interactive Explorer Modal */}
      <ProjectUnitsExplorer 
        project={selectedProject} 
        onClose={handleCloseExplorer} 
      />
    </div>
  );
}
