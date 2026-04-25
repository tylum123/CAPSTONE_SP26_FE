import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './endpoints/config';
import { API_ENDPOINTS } from './endpoints/config';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    // Bypass ngrok browser interstitial page in local dev/testing
    // This header is a no-op in production environments
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage or cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
            refreshToken,
          });

          const accessToken =
            (response.data as any)?.data?.accessToken ||
            (response.data as any)?.data?.token ||
            (response.data as any)?.accessToken ||
            (response.data as any)?.token;

          if (!accessToken) {
            return Promise.reject(error);
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', accessToken);
          }

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Do not hard-redirect here. Let page-level auth handling decide what to do.
        return Promise.reject(refreshError);
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
