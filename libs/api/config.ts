// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5057/api/v1',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    GOOGLE_LOGIN: '/google-login',
    LOGOUT: '/logout',
    REFRESH_TOKEN: '/refresh',
    VERIFY_EMAIL: '/verify',
    FORGOT_PASSWORD: '/forget',
    RESET_PASSWORD: '/reset',
  },

  // Farmer
  FARMER: {
    PROFILE: '/farmer',
    UPDATEPROFILE: '/farmer',
    UPDATEAVATAR: '/farmer/upload-avatar',
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

  // Farm
  FARM: {
    FARMS: '/farm',
    FARM: (id: string) => `/farm/${id}`,
    ADD_FARM: '/farm',
    UPDATE_FARM: (id: string) => `/farm/${id}`,
    REMOVE_FARM: (id: string) => `/farm/${id}`,
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/user',
    USER_DETAIL: (id: string) => `/user/${id}`,
    UPDATE_USER: (id: string) => `/user/${id}`,
    DELETE_USER: (id: string) => `/user/${id}`,
    // DISPUTES: '/admin/disputes',
    // DISPUTE_DETAIL: (id: string) => `/admin/disputes/${id}`,
    // RESOLVE_DISPUTE: (id: string) => `/admin/disputes/${id}/resolve`,
    // SETTINGS: '/admin/settings',
    // STATISTICS: '/admin/statistics',
  },

  // Common
  MEDIA: {
    UPLOAD_IMAGE: '/media/upload/image',
    UPLOAD_IMAGES: '/media/upload/images',
    UPLOAD_VIDEO: '/media/upload/video',
    UPLOAD_VIDEOS: '/media/upload/videos',
    UPLOAD_RAW_FILE: '/media/upload/raw-file',
    UPLOAD_RAW_FILES: '/media/upload/raw-files',
    DELETE_RESOURCE: '/media/delete/resource',
    DELETE_RESOURCES: '/media/delete/resources',
  },
  NOTIFICATIONS: '/notifications',
  MESSAGES: '/messages',
  UPLOAD: '/upload',
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
