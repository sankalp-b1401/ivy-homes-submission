import { Listing, Rental, Project } from './types';

// Centralized filtering logic for excluding invalid, corrupt, or fake data
// based on the assignment requirements.
// You can refine these rules as you discover anomalies in the data.

export const isValidListing = (listing: Listing): boolean => {
  // Exclude inactive listings
  if (!listing.is_live) return false;
  
  // Basic sanity checks for corrupt data
  if (!listing.listing_id || typeof listing.price !== 'number' || listing.price <= 0) return false;
  if (typeof listing.carpet_area !== 'number' || listing.carpet_area <= 0) return false;
  
  // Fake listings rule placeholder (to be updated after data analysis)
  // Example: if (listing.posted_by_contact === '+910000000000') return false;
  
  return true;
};

export const isValidRental = (rental: Rental): boolean => {
  // Exclude inactive rentals
  if (!rental.is_live) return false;
  
  // Basic sanity checks for corrupt data
  if (!rental.listing_id || typeof rental.price !== 'number' || rental.price <= 0) return false;
  if (typeof rental.carpet_area !== 'number' || rental.carpet_area <= 0) return false;
  
  return true;
};

export const isValidProject = (project: Project): boolean => {
  // Basic sanity checks for corrupt data
  if (!project.project_id) return false;
  if (typeof project.price_min !== 'number' || project.price_min <= 0) return false;
  if (typeof project.price_max !== 'number' || project.price_max < project.price_min) return false;
  
  return true;
};
