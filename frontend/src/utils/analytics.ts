import { Listing, AnalyticsSummary, LocalityMetric, BhkMetric } from '../types';
import { isValidListing } from '../utils';
import { listingsApi } from '../api';

export const PRECOMPUTED_ANALYTICS: AnalyticsSummary = {
  city: "bangalore",
  total_listings: 1240,
  median_price: 11200000,
  median_price_per_sqft: 8100,
  by_locality: [
    { locality: "whitefield", count: 184, median_price: 9800000 },
    { locality: "sarjapur road", count: 152, median_price: 10500000 },
    { locality: "bellandur", count: 128, median_price: 12400000 },
    { locality: "koramangala", count: 115, median_price: 18500000 },
    { locality: "indiranagar", count: 96, median_price: 21000000 },
    { locality: "electronic city", count: 92, median_price: 6500000 },
    { locality: "marathahalli", count: 84, median_price: 8900000 },
    { locality: "hebal", count: 76, median_price: 13500000 },
  ],
  by_bhk: [
    { bedroom: 1, count: 142 },
    { bedroom: 2, count: 486 },
    { bedroom: 3, count: 502 },
    { bedroom: 4, count: 110 }
  ]
};

export function calculateMedian(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return Math.round(sorted[mid]);
}

export function computeAnalyticsSummary(listings: Listing[], cityName: string = 'bangalore'): AnalyticsSummary {
  const valid = listings.filter(isValidListing);

  const prices = valid.map(l => l.price).filter(p => typeof p === 'number' && p > 0);
  const pricePerSqft = valid
    .filter(l => l.price > 0 && l.carpet_area > 0)
    .map(l => l.price / l.carpet_area);

  // Group by locality
  const localityMap = new Map<string, number[]>();
  for (const l of valid) {
    const loc = (l.locality || 'other').toLowerCase().trim();
    if (!localityMap.has(loc)) {
      localityMap.set(loc, []);
    }
    localityMap.get(loc)!.push(l.price);
  }

  const by_locality: LocalityMetric[] = Array.from(localityMap.entries())
    .map(([locality, locPrices]) => ({
      locality,
      count: locPrices.length,
      median_price: calculateMedian(locPrices),
    }))
    .sort((a, b) => b.count - a.count);

  // Group by BHK
  const bhkMap = new Map<number, number>();
  for (const l of valid) {
    const bhk = l.bedroom || 0;
    bhkMap.set(bhk, (bhkMap.get(bhk) || 0) + 1);
  }

  const by_bhk: BhkMetric[] = Array.from(bhkMap.entries())
    .map(([bedroom, count]) => ({
      bedroom,
      count,
    }))
    .sort((a, b) => a.bedroom - b.bedroom);

  return {
    city: cityName,
    total_listings: valid.length,
    median_price: calculateMedian(prices),
    median_price_per_sqft: calculateMedian(pricePerSqft),
    by_locality,
    by_bhk,
  };
}

export async function fetchAllListingsAndCompute(
  onProgress?: (loaded: number, total: number) => void
): Promise<{ summary: AnalyticsSummary; rawCount: number }> {
  const allListings: Listing[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let totalServer = 0;

  while (hasMore) {
    const response = await listingsApi.getListings({ limit, offset });
    totalServer = response.total || totalServer;
    allListings.push(...response.results);
    
    if (onProgress) {
      onProgress(allListings.length, totalServer || allListings.length);
    }

    if (!response.has_more || response.results.length === 0 || allListings.length >= 2000) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  const summary = computeAnalyticsSummary(allListings);
  return { summary, rawCount: allListings.length };
}
