import { Listing, Rental, Project } from './types';
import { CORRUPT_LISTING_IDS, FAKE_LISTING_IDS } from './data/invalidListingIds';

/**
 * Centralized Listing Validity Filtering.
 * A listing is valid only when:
 * 1. listing exists and has listing_id
 * 2. listing.is_live === true
 * 3. listing_id is not in CORRUPT_LISTING_IDS
 * 4. listing_id is not in FAKE_LISTING_IDS
 */
export const isValidListing = (listing: Listing | null | undefined): boolean => {
  if (!listing || !listing.listing_id) return false;
  if (listing.is_live !== true) return false;
  if (CORRUPT_LISTING_IDS.has(listing.listing_id)) return false;
  if (FAKE_LISTING_IDS.has(listing.listing_id)) return false;
  return true;
};

/**
 * A rental is valid only when:
 * 1. rental exists and has listing_id
 * 2. rental.is_live === true
 */
export const isValidRental = (rental: Rental | null | undefined): boolean => {
  if (!rental || !rental.listing_id) return false;
  if (rental.is_live !== true) return false;
  return true;
};

/**
 * A project is valid when:
 * 1. project exists and has project_id
 * 
 * Note: As specified in API_REFERENCE_FIXED.md and INTEGRATION_PLAN.md:
 * Projects must NOT be rejected due to unnormalized price_min / price_max.
 */
export const isValidProject = (project: Project | null | undefined): boolean => {
  if (!project || !project.project_id) return false;
  return true;
};

/**
 * Format project prices with their appropriate order (Lacs, Crores).
 * The Ivy Homes API provides project prices in normalized/compressed form:
 * - Values < 10 represent Crores (e.g. 1.04 -> ₹1.04 Cr, 2.74 -> ₹2.74 Cr, 4.89 -> ₹4.89 Cr)
 * - Values >= 10 represent Lacs (e.g. 38.9 -> ₹38.9 L, 98.0 -> ₹98 L)
 * - Raw integer rupees (>= 1,00,000) are also properly scaled to Lacs / Crores.
 */
export const formatProjectPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price) || price <= 0) {
    return 'Price on Request';
  }
  // Raw integer rupees
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  // Compressed/normalized API values
  if (price < 10) {
    return `₹${price.toFixed(2)} Cr`;
  }
  return `₹${price % 1 === 0 ? price.toFixed(0) : price.toFixed(1)} L`;
};

/**
 * Format indicative price range for projects with orders (Lacs, Crores).
 * Example outputs: "₹98 L – ₹2.74 Cr", "₹1.04 Cr – ₹2.95 Cr", "₹38.9 L – ₹81.8 L"
 */
export const formatPriceRange = (
  min: number | null | undefined,
  max: number | null | undefined
): string => {
  if (!min && !max) return 'Price on Request';
  if (min && !max) return `From ${formatProjectPrice(min)}`;
  if (!min && max) return `Up to ${formatProjectPrice(max)}`;
  return `${formatProjectPrice(min)} – ${formatProjectPrice(max)}`;
};
