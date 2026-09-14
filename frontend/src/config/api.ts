/**
 * Centralized API Configuration for Ivy Homes Frontend
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://solve.ivy.homes';

export const API_KEY: string = 
  import.meta.env.VITE_API_KEY || '';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ivy_access_token',
  REFRESH_TOKEN: 'ivy_refresh_token',
  USER: 'ivy_user',
  CACHED_ANALYTICS: 'ivy_cached_analytics',
} as const;

export const getEffectiveApiKey = (): string => {
  return API_KEY;
};

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const clearAuthStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};
