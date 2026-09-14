import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Bookmark, 
  ShieldCheck, 
  ArrowUpRight
} from 'lucide-react';
import { savedApi } from '../api';
import { getPropertyImages } from '../utils/propertyImages';

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onSaveToggle?: (id: string, isSaved: boolean) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  isSaved = false, 
  onSaveToggle 
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [imgError, setImgError] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const images = getPropertyImages(listing.listing_id, listing.property_type);

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return 'Price on Request';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Estimate price per sq ft
  const pricePerSqFt = listing.carpet_area && listing.price
    ? Math.round(listing.price / listing.carpet_area)
    : null;

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    
    setSaving(true);
    try {
      if (saved) {
        await savedApi.removeSaved(listing.listing_id);
      } else {
        await savedApi.saveListing(listing.listing_id);
      }
      const nextSaved = !saved;
      setSaved(nextSaved);
      if (onSaveToggle) {
        onSaveToggle(listing.listing_id, nextSaved);
      }
    } catch (error) {
      console.error('Failed to toggle save', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link 
      to={`/listings/${listing.listing_id}`} 
      className="group block h-full focus:outline-none"
    >
      <article className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col h-full relative group-hover:-translate-y-1">
        {/* Visual Cover Container */}
        <div className="h-56 bg-stone-100 relative overflow-hidden">
          <img 
            src={imgError ? images.exterior : images.cover}
            alt={listing.apartment_name || `${listing.bedroom} BHK ${listing.property_type}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Top Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[11px] font-semibold tracking-wide uppercase rounded-full text-stone-800 shadow-xs">
                {listing.property_type}
              </span>
              {listing.is_verified && (
                <span className="px-2.5 py-1 bg-emerald-700/90 backdrop-blur-md text-[11px] font-semibold text-emerald-50 rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                  Verified
                </span>
              )}
            </div>

            {/* Bookmark Action */}
            <button 
              onClick={handleSaveToggle}
              disabled={saving}
              title={saved ? 'Remove from saved' : 'Save property'}
              className="p-2 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-stone-700 shadow-sm transition-all hover:scale-110 active:scale-95"
              aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Bookmark 
                className={`w-4 h-4 transition-colors ${
                  saved 
                    ? 'fill-[#0D3B2E] text-[#0D3B2E]' 
                    : 'text-stone-700 hover:text-stone-900'
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Price and Rate */}
            <div className="flex items-baseline justify-between mb-1.5">
              <h3 className="text-2xl font-bold font-display text-stone-900 tracking-tight">
                {formatPrice(listing.price)}
              </h3>
              {pricePerSqFt && (
                <span className="text-xs font-semibold text-stone-500">
                  ₹{pricePerSqFt.toLocaleString('en-IN')} / sq ft
                </span>
              )}
            </div>

            <h4 className="text-sm font-semibold text-stone-700 capitalize line-clamp-1 mb-2">
              {listing.apartment_name || `${listing.bedroom} BHK Residence in ${listing.locality}`}
            </h4>

            {/* Location & Furnishing */}
            <div className="flex items-center justify-between text-stone-500 text-xs mb-4">
              <div className="flex items-center truncate">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#0D3B2E] shrink-0" />
                <span className="truncate capitalize font-medium">{listing.locality}, Bangalore</span>
              </div>
              {listing.furnishing && (
                <span className="text-[11px] font-medium text-stone-600 capitalize shrink-0 ml-2">
                  {listing.furnishing.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Key Specs Grid */}
          <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700 group-hover:bg-[#FAF9F6] transition-colors">
              <div className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-[#0D3B2E]" />
                <span className="text-xs font-bold">{listing.bedroom}</span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">BHK</span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700 group-hover:bg-[#FAF9F6] transition-colors">
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-[#0D3B2E]" />
                <span className="text-xs font-bold">{listing.bathroom}</span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">Baths</span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-50 text-stone-700 group-hover:bg-[#FAF9F6] transition-colors">
              <div className="flex items-center gap-1">
                <Square className="w-3.5 h-3.5 text-[#0D3B2E]" />
                <span className="text-xs font-bold">{listing.carpet_area}</span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">Sq Ft</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
