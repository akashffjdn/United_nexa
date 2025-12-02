// src/utils/api.ts
import axios from 'axios';
import { loadingManager } from './loadingManager';
export const API_URL = 'https://unitedtransportbackend-443415591723.asia-south1.run.app/api';
// export const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 🟢 CRITICAL: Send cookies with every request
  paramsSerializer: (params) => {
    const parts: string[] = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val === null || typeof val === 'undefined') return;
      if (Array.isArray(val)) {
        val.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`));
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });
    return parts.join('&');
  },
});

// --- HELPER: Generate Dynamic Message ---
const getLoadingMessage = (method: string = 'GET', url: string = '') => {
  if (url.includes('/auth/login')) return 'Authenticating...';
  if (url.includes('/report')) return 'Generating Report...';
  switch (method.toUpperCase()) {
    case 'POST': return 'Saving Data...';
    case 'PUT': return 'Updating Records...';
    case 'DELETE': return 'Deleting Entry...';
    case 'GET': return 'Fetching Data...';
    default: return 'Processing Request...';
  }
};

// 1. Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Only show loader if not a silent refresh
    if (!config.url?.includes('/refresh')) {
        const msg = getLoadingMessage(config.method, config.url);
        loadingManager.show(msg);
    }

    const userInfo = localStorage.getItem('authUser');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingManager.hide();
    return Promise.reject(error);
  }
);

// 🟢 2. Response Interceptor (With Refresh Logic)
api.interceptors.response.use(
  (response) => {
    loadingManager.hide();
    if (response.data) response.data = transformId(response.data);
    return response;
  },
  async (error) => {
    loadingManager.hide();
    const originalRequest = error.config;

    // Check for 401 (Unauthorized) and ensure we haven't already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried

      try {
        // Attempt to get a new access token using the HTTPOnly cookie
        const { data } = await api.post('/auth/refresh');
        
        // Update LocalStorage with new Access Token
        const userInfo = localStorage.getItem('authUser');
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            parsedUser.token = data.token;
            localStorage.setItem('authUser', JSON.stringify(parsedUser));
        }

        // Update default headers and retry original request
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed (Cookie expired or invalid) -> Logout user
        console.error("Session expired", refreshError);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authYear');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ID Helper
const transformId = (data: any): any => {
  if (Array.isArray(data)) return data.map(transformId);
  else if (data !== null && typeof data === 'object') {
    const { _id, ...rest } = data;
    const newObj = _id ? { ...rest, id: _id } : { ...rest };
    Object.keys(newObj).forEach((key) => { newObj[key] = transformId(newObj[key]); });
    return newObj;
  }
  return data;
};

export default api;