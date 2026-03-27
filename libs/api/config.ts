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
    JOBS: '/job/post',
    JOB_ID: (id: string) => `/job/post/${id}`,
    FILTERED_JOBS: '/job/post/filter',
    CREATE_JOB: '/job/post',
    UPDATE_JOB: (id: string) => `/job/post/${id}`,
    DELETE_JOB: (id: string) => `/job/post/${id}`,
    JOB_APPLICATIONS_BY_POST: (jobPostId: string) => `/job/application/post/${jobPostId}`,
    APPLICATION_DETAIL: (id: string) => `/job/application/${id}`,
    RESPOND_APPLICANT: (id: string) => `/job/application/respond/${id}`,
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
    UPLOAD_IMAGE: (id: string) => `/farm/${id}/upload-image`,
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
  SKILL: {
    SKILLS: '/skills',
    SKILL_DETAIL: (id: string) => `/skills/${id}`,
    CREATE_SKILL: '/skills',
    UPDATE_SKILL: (id: string) => `/skills/${id}`,
    DELETE_SKILL: (id: string) => `/skills/${id}`,
  },
  JOB_CATEGORY: {
    LIST: '/job/category',
    DETAIL: (id: string) => `/job/category/${id}`,
    CREATE: '/job/category',
    UPDATE: (id: string) => `/job/category/${id}`,
    DELETE: (id: string) => `/job/category/${id}`,
  },
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
