// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
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
  
  // Worker
  WORKER: {
    DASHBOARD: '/worker/dashboard',
    JOBS: '/worker/jobs',
    JOB_DETAIL: (id: string) => `/worker/jobs/${id}`,
    SEARCH_JOBS: '/worker/jobs/search',
    APPLY_JOB: (id: string) => `/worker/jobs/${id}/apply`,
    MY_APPLICATIONS: '/worker/applications',
    MY_JOBS: '/worker/my-jobs',
    JOB_HISTORY: '/worker/job-history',
    WALLET: '/worker/wallet',
    TRANSACTIONS: '/worker/transactions',
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
