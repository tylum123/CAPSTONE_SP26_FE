import axiosInstance from '../axios-instance';
import { API_ENDPOINTS } from '../config';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../types';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
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
