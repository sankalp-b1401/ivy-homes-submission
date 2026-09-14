import { apiClient } from './client';
import { Listing, Rental, Project, PaginatedResponse } from '../types';

export const listingsApi = {
  getListings: async (params: Record<string, any>) => {
    const res = await apiClient.get<PaginatedResponse<Listing>>('/v1/listings', { params });
    return res.data;
  },
  getListing: async (id: string) => {
    const res = await apiClient.get<Listing>(`/v1/listings/${id}`);
    return res.data;
  }
};

export const rentalsApi = {
  getRentals: async (params: Record<string, any>) => {
    const res = await apiClient.get<PaginatedResponse<Rental>>('/v1/rentals', { params });
    return res.data;
  },
  getRental: async (id: string) => {
    const res = await apiClient.get<Rental>(`/v1/rentals/${id}`);
    return res.data;
  }
};

export const projectsApi = {
  getProjects: async (params: Record<string, any>) => {
    const res = await apiClient.get<PaginatedResponse<Project>>('/v1/projects', { params });
    return res.data;
  },
  getProject: async (id: string) => {
    const res = await apiClient.get<Project>(`/v1/projects/${id}`);
    return res.data;
  }
};

export const savedApi = {
  getSaved: async () => {
    const res = await apiClient.get<PaginatedResponse<Listing>>('/v1/saved');
    return res.data;
  },
  saveListing: async (listing_id: string) => {
    const res = await apiClient.post('/v1/saved', { listing_id });
    return res.data;
  },
  removeSaved: async (listing_id: string) => {
    const res = await apiClient.delete(`/v1/saved/${listing_id}`);
    return res.data;
  }
};

export const analyticsApi = {
  getSummary: async () => {
    const res = await apiClient.get('/v1/analytics/summary');
    return res.data;
  }
}
