import React, { useState, useEffect } from 'react';
import { savedApi } from '../api';
import { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Bookmark, Loader2, ArrowRight, Sparkles, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isValidListing } from '../utils';
import { PropertyGridSkeleton } from '../components/PropertySkeleton';
import { motion } from 'motion/react';

export default function SavedListings() {
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const data = await savedApi.getSaved();
      const validListings = data.results.filter(isValidListing);
      setSavedListings(validListings);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load saved listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = (id: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedListings(prev => prev.filter(l => l.listing_id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero Header */}
      <div className="mb-10 sm:mb-12 text-left">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display mb-4 leading-[1.12]">
          Your Saved Residences
        </h1>
        <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-normal leading-relaxed">
          Compare your shortlisted homes, track price movements, and schedule walkthroughs with our relationship advisors.
        </p>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <span>{error}</span>
        </div>
      ) : loading ? (
        <PropertyGridSkeleton count={4} />
      ) : savedListings.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Bookmark className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-2xl font-bold text-stone-900 font-display">No saved properties yet</h3>
          <p className="text-stone-500 text-sm mt-2 mb-6 max-w-sm mx-auto">
            Click the bookmark icon on any residence to curate your private portfolio of prospective homes.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0D3B2E] hover:bg-[#124b3b] text-white text-xs font-bold shadow-md shadow-[#0D3B2E]/20 transition-all"
          >
            <span>Browse Active Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">
              <strong className="text-[#0D3B2E]">{savedListings.length}</strong> properties saved in your portfolio
            </span>
            <Link to="/" className="text-xs font-semibold text-[#0D3B2E] hover:underline flex items-center gap-1">
              <span>Add more homes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedListings.map((listing, i) => (
              <motion.div
                key={listing.listing_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <ListingCard 
                  listing={listing} 
                  isSaved={true}
                  onSaveToggle={handleSaveToggle}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
