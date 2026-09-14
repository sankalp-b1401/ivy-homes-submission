import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsApi, savedApi } from '../api';
import { Listing } from '../types';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  ChevronLeft, 
  Phone, 
  ShieldCheck, 
  Compass, 
  Bookmark, 
  Building,
  Car,
  Share2,
  Check,
  ExternalLink,
  Copy,
  Navigation,
  Building2,
  Armchair,
  Layers
} from 'lucide-react';
import { isValidListing } from '../utils';
import { getPropertyImages } from '../utils/propertyImages';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await listingsApi.getListing(id);

        if (!isValidListing(data)) {
          setError('This residence is currently unavailable, inactive, or has been unlisted.');
          setListing(null);
          return;
        }

        setListing(data);
        
        const gallery = getPropertyImages(data.listing_id, data.property_type);
        setActivePhoto(gallery.cover);

        // Check if saved
        const savedData = await savedApi.getSaved();
        const isSaved = savedData.results.some((l: Listing) => l.listing_id === id);
        setSaved(isSaved);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleSaveToggle = async () => {
    if (saving || !listing) return;
    setSaving(true);
    try {
      if (saved) {
        await savedApi.removeSaved(listing.listing_id);
      } else {
        await savedApi.saveListing(listing.listing_id);
      }
      setSaved(!saved);
    } catch (error) {
      console.error('Failed to toggle save', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyPhone = () => {
    if (!listing?.posted_by_contact) return;
    navigator.clipboard.writeText(listing.posted_by_contact);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  };

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-stone-200 rounded-md" />
          <div className="h-16 bg-stone-200 rounded-2xl w-2/3" />
          <div className="h-96 bg-stone-200 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 bg-stone-200 rounded-2xl" />
            <div className="h-64 bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl" role="alert">
          <p className="font-semibold">{error || 'Listing not found'}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-6 inline-flex items-center text-xs font-bold text-[#0D3B2E] hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Return to listings
        </button>
      </div>
    );
  }

  const gallery = getPropertyImages(listing.listing_id, listing.property_type);
  const galleryItems = [
    { label: 'Exterior', url: gallery.cover },
    { label: 'Living Room', url: gallery.living },
    { label: 'Master Bedroom', url: gallery.bedroom },
    { label: 'Kitchen', url: gallery.kitchen },
    { label: 'Balcony View', url: gallery.balcony },
  ];

  // Price calculations based strictly on real fields
  const pricePerCarpetSqFt = listing.carpet_area && listing.price
    ? Math.round(listing.price / listing.carpet_area)
    : null;

  const pricePerSuperSqFt = listing.super_built_up_area && listing.price
    ? Math.round(listing.price / listing.super_built_up_area)
    : null;

  const googleMapsUrl = `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`;

  const displayName = listing.apartment_name 
    ? `${listing.apartment_name}`
    : `${listing.bedroom} BHK ${listing.property_type}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      
      {/* 1. Breadcrumb & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-600 bg-white border border-stone-200 hover:text-stone-950 hover:bg-stone-50 transition-all shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </button>

        <div className="flex items-center gap-2">
          {listing.listing_url && (
            <a
              href={listing.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-xs"
              title={`View on ${listing.website}`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span className="capitalize">Source ({listing.website})</span>
            </a>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-xs"
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-[#0D3B2E] text-[#0D3B2E]' : 'text-stone-500'}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* 2. Property Header (Sitting cleanly ABOVE the photos — NO overlapping cards) */}
      <div className="mb-6">
        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-1 bg-stone-100 text-stone-800 text-xs font-bold uppercase rounded-full tracking-wider border border-stone-200/80">
            {listing.property_type}
          </span>

          {listing.is_verified && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified
            </span>
          )}

          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
            listing.is_live 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {listing.is_live ? 'Active' : 'Off Market'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-stone-900">
          {displayName}
        </h1>

        <div className="flex items-center gap-3 mt-2 text-sm text-stone-600 flex-wrap">
          <span className="flex items-center gap-1 font-medium capitalize">
            <MapPin className="w-4 h-4 text-[#0D3B2E] shrink-0" />
            {listing.locality}, Bangalore
          </span>

          <span className="text-stone-300">•</span>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D3B2E] hover:underline"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View on Maps</span>
          </a>
        </div>
      </div>

      {/* 3. Bento Photo Gallery (Clean, Unobstructed Images — Zero overlapping text cards) */}
      <div className="mb-10">
        {/* Desktop Bento Grid: 1 large hero + 4 room tiles (2x2) */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-3 h-[420px]">
          {/* Main Large Photo */}
          <div className="sm:col-span-2 sm:row-span-2 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80">
            <img 
              src={activePhoto || gallery.cover} 
              alt={displayName} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* 4 Supporting Photo Tiles in 2x2 bento layout */}
          {galleryItems.slice(1, 5).map((item, index) => {
            const isSelected = activePhoto === item.url;
            return (
              <button
                key={index}
                onClick={() => setActivePhoto(item.url)}
                className={`relative rounded-2xl overflow-hidden bg-stone-100 border transition-all h-[204px] text-left group focus:outline-none ${
                  isSelected 
                    ? 'border-[#0D3B2E] ring-2 ring-[#0D3B2E]/25' 
                    : 'border-stone-200/80 hover:border-stone-400'
                }`}
                title={`Click to view ${item.label}`}
              >
                <img 
                  src={item.url} 
                  alt={item.label} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </button>
            );
          })}
        </div>

        {/* Mobile View: Hero image + horizontal preview bar */}
        <div className="sm:hidden space-y-2">
          <div className="h-72 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            <img 
              src={activePhoto || gallery.cover} 
              alt={displayName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {galleryItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhoto(item.url)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  activePhoto === item.url
                    ? 'bg-[#0D3B2E] text-white border-[#0D3B2E]'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Information Layout (Focusing ONLY on relevant property information) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Specifications & Description */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Specifications Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
              Key Specifications
            </h2>

            {/* Primary 4 Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                  <Bed className="w-4 h-4 text-[#0D3B2E]" />
                  <span>Bedrooms</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{listing.bedroom} BHK</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                  <Bath className="w-4 h-4 text-[#0D3B2E]" />
                  <span>Bathrooms</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{listing.bathroom} Baths</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                  <Square className="w-4 h-4 text-[#0D3B2E]" />
                  <span>Carpet Area</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{listing.carpet_area} sq ft</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                  <Armchair className="w-4 h-4 text-[#0D3B2E]" />
                  <span>Furnishing</span>
                </div>
                <div className="text-base font-bold text-stone-900 capitalize truncate">
                  {listing.furnishing ? listing.furnishing.replace('-', ' ') : 'Not Specified'}
                </div>
              </div>
            </div>

            {/* Relevant Detail Rows (Rendered only when data exists) */}
            <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              {listing.super_built_up_area && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Super Built-up Area</span>
                  <span className="font-semibold text-stone-900">{listing.super_built_up_area} sq ft</span>
                </div>
              )}

              {listing.floor !== undefined && listing.floor !== null && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Floor Placement</span>
                  <span className="font-semibold text-stone-900">
                    Floor {listing.floor}{listing.total_floors ? ` of ${listing.total_floors}` : ''}
                  </span>
                </div>
              )}

              {listing.total_floors !== undefined && listing.total_floors !== null && listing.floor === undefined && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Total Building Floors</span>
                  <span className="font-semibold text-stone-900">{listing.total_floors} Floors</span>
                </div>
              )}

              {listing.facing_direction && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Facing Direction</span>
                  <span className="font-semibold text-stone-900 capitalize">
                    {listing.facing_direction.replace('-', ' ')}
                  </span>
                </div>
              )}

              {listing.balcony !== undefined && listing.balcony !== null && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Balconies</span>
                  <span className="font-semibold text-stone-900">
                    {listing.balcony} {listing.balcony === 1 ? 'Balcony' : 'Balconies'}
                  </span>
                </div>
              )}

              {listing.covered_parking !== undefined && listing.covered_parking !== null && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Covered Parking</span>
                  <span className="font-semibold text-stone-900">
                    {listing.covered_parking} {listing.covered_parking === 1 ? 'Space' : 'Spaces'}
                  </span>
                </div>
              )}

              {listing.apartment_name && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Apartment / Society</span>
                  <span className="font-semibold text-stone-900">{listing.apartment_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              About this Residence
            </h2>
            <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-line bg-stone-50/60 p-5 rounded-2xl border border-stone-100">
              {listing.description ? (
                listing.description
              ) : (
                <span className="text-stone-400 italic">No description provided by the seller.</span>
              )}
            </div>
          </div>

          {/* Associated Builder Project (Displayed ONLY if the listing links to one) */}
          {listing.project_id && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Associated Project
                </span>
                <div className="text-base font-bold text-stone-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0D3B2E]" />
                  <span>{listing.apartment_name || listing.project_id}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  View master specifications, tower plans, and all available configurations.
                </p>
              </div>

              <Link
                to={`/projects/${listing.project_id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold hover:bg-[#124b3b] transition-all shrink-0 shadow-xs"
              >
                <span>View Project Units</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Seller Contact Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Price Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4 shrink-0">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-400 font-bold block mb-1">
                Listed Price
              </span>
              <div className="text-3xl font-extrabold font-display text-stone-900">
                {formatPrice(listing.price)}
              </div>
              <div className="text-xs font-mono text-stone-500 mt-0.5">
                ₹{listing.price.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Rate / Carpet Sq.Ft:</span>
                <span className="font-bold text-stone-900">
                  {pricePerCarpetSqFt ? `₹${pricePerCarpetSqFt.toLocaleString('en-IN')} / sq ft` : 'N/A'}
                </span>
              </div>

              {pricePerSuperSqFt && (
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Rate / Super Built-up:</span>
                  <span className="font-bold text-stone-900">
                    ₹{pricePerSuperSqFt.toLocaleString('en-IN')} / sq ft
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1">
                <span className="text-stone-500">Carpet Area:</span>
                <span className="font-semibold text-stone-900">{listing.carpet_area} sq ft</span>
              </div>
            </div>
          </div>

          {/* Seller / Contact Box (Extended to match full column height) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Seller Contact
              </h3>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0D3B2E]/10 text-[#0D3B2E] flex items-center justify-center font-bold text-base shrink-0">
                  {listing.posted_by_name ? listing.posted_by_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 truncate">
                    {listing.posted_by_name || 'Listing Contact'}
                  </h4>
                  <p className="text-xs text-stone-500 capitalize">
                    Posted by {listing.posted_by || 'Owner'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
                <span className="text-stone-400 font-semibold block text-[10px] uppercase tracking-wider">Contact Number</span>
                <span className="font-mono font-bold text-sm text-stone-900 block mt-0.5">
                  {listing.posted_by_contact || 'Not available'}
                </span>
              </div>
            </div>

            {listing.posted_by_contact && (
              <div className="space-y-2.5 pt-6 mt-auto">
                <a
                  href={`tel:${listing.posted_by_contact}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#124b3b] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {listing.posted_by_contact}</span>
                </a>

                <button
                  onClick={handleCopyPhone}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Phone Number Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy Phone Number</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
