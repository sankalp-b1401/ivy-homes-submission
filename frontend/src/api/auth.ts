import { API_BASE_URL, API_KEY, STORAGE_KEYS } from '../config/api';
import axios from 'axios';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_url: string;
  user: {
    email: string;
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      { email, password },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  },

  logout: async (): Promise<{ ok: boolean; note?: string }> => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const headers: Record<string, string> = {
        'X-API-Key': API_KEY,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { headers }
      );
      return res.data;
    } catch {
      // Tokens are stateless, discard client-side regardless of network failure
      return { ok: true, note: 'Tokens discarded client-side' };
    }
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const res = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  },
};
