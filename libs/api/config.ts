// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5057',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/login',
    REGISTER: '/api/v1/register',
    GOOGLE_LOGIN: '/api/v1/google-login',
    LOGOUT: '/api/v1/logout',
    REFRESH_TOKEN: '/api/v1/refresh-token',
    VERIFY_EMAIL: '/api/v1/verify-email',
    FORGOT_PASSWORD: '/api/v1/forgot-password',
    RESET_PASSWORD: '/api/v1/reset-password',
  },
  
  // User
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/users/avatar',
  },
  
  // Farmer
  FARMER: {
    DASHBOARD: '/farmer/dashboard',
    JOBS: '/farmer/jobs',
    JOB_DETAIL: (id: string) => `/farmer/jobs/${id}`,
    CREATE_JOB: '/farmer/jobs',
    UPDATE_JOB: (id: string) => `/farmer/jobs/${id}`,
    DELETE_JOB: (id: string) => `/farmer/jobs/${id}`,
    APPLICANTS: '/farmer/applicants',
    APPLICANT_DETAIL: (id: string) => `/farmer/applicants/${id}`,
    APPROVE_APPLICANT: (id: string) => `/farmer/applicants/${id}/approve`,
    REJECT_APPLICANT: (id: string) => `/farmer/applicants/${id}/reject`,
    PAYMENTS: '/farmer/payments',
    PAYMENT_DETAIL: (id: string) => `/farmer/payments/${id}`,
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    DISPUTES: '/admin/disputes',
    DISPUTE_DETAIL: (id: string) => `/admin/disputes/${id}`,
    RESOLVE_DISPUTE: (id: string) => `/admin/disputes/${id}/resolve`,
    SETTINGS: '/admin/settings',
    STATISTICS: '/admin/statistics',
  },
  
  // Common
  NOTIFICATIONS: '/notifications',
  MESSAGES: '/messages',
  UPLOAD: '/upload',
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
