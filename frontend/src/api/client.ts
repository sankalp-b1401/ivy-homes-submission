import axios from 'axios';

const BASE_URL = 'https://solve.ivy.homes';

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('ivy_api_key');
  const token = localStorage.getItem('ivy_access_token');
  
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('ivy_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: {
              'X-API-Key': localStorage.getItem('ivy_api_key'),
              'refresh_token': refreshToken
            }
          });
          
          if (res.data.access_token) {
            localStorage.setItem('ivy_access_token', res.data.access_token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
            originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('ivy_access_token');
        localStorage.removeItem('ivy_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
