import { axiosInstance } from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  GoogleLoginRequest,
} from '../types';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: credentials.email,
      password: credentials.password,
    });
    
    // Store token in localStorage
    if (response.data.data.token) {
      localStorage.setItem('access_token', response.data.data.token);
      localStorage.setItem('user_email', response.data.data.email);
    }
    
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data);
    
    // Store token in localStorage
    if (response.data.data.token) {
      localStorage.setItem('access_token', response.data.data.token);
      localStorage.setItem('user_email', response.data.data.email);
    }
    
    return response.data;
  },

  /**
   * Google login
   */
  googleLogin: async (googleToken: string, roleId: number): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, { 
      googleToken,
      roleId 
    });
    
    // Store token in localStorage
    if (response.data.data.token) {
      localStorage.setItem('access_token', response.data.data.token);
      localStorage.setItem('user_email', response.data.data.email);
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  /**
   * Reset password
   */
  resetPassword: async (token: string, password: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password,
    });
    return response.data;
  },
};
