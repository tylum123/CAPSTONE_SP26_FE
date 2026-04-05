// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5057/api/v1',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  BANKLOOKUP_API_KEY: process.env.NEXT_PUBLIC_BANKLOOKUP_API_KEY || '',
  BANKLOOKUP_API_SECRET: process.env.NEXT_PUBLIC_BANKLOOKUP_API_SECRET || '',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_REGISTER: '/verify-email',
    RESEND_OTP: '/resend-verification',
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
    DASHBOARD: '/dashboard/farmer',
  },

  JOBS: {
    GET: '/job/post',
    MY_JOB_POSTS: '/job/post/farmer/history',
    GET_BY_FARMER: (farmerId: string) => `/job/post/farmer/${farmerId}`,
    DETAIL: (id: string) => `/job/post/${id}`,
    FILTERED_JOBS: '/job/post/filter',
    FILTERED_JOBS_BY_FARMER: '/job/post/filter/farmer',
    CREATE: '/job/post',
    UPDATE: (id: string) => `/job/post/${id}`,
    DELETE: (id: string) => `/job/post/${id}`,
    JOB_APPLICATIONS: '/job/application',
    JOB_APPLICATIONS_BY_POST: (jobPostId: string) => `/job/application/post/${jobPostId}`,
    APPLICATION_DETAIL: (id: string) => `/job/application/${id}`,
    RESPOND_APPLICANT: (id: string) => `/job/application/respond/${id}`,
    SAVE_DRAFT: '/job/post/draft',
    GET_DRAFTS: '/job/post/drafts'
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

  // User
  USER: {
    PROFILE: '/profile',
    UPDATE_PROFILE: '/profile/update',
    CHANGE_PASSWORD: '/profile/change-password',
    UPLOAD_AVATAR: '/profile/upload-avatar',
  },

  // Common
  SKILL: {
    SKILLS: '/skills',
    SKILLS_CATEGORY: (categoryId: string) => `/skills/category/${categoryId}`,
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

  PAYMENT: {
    GET: (id: string) => `/payment/${id}`,
    CREATE: '/payment/',
    CANCEL: (id: string) => `/payment/${id}/cancel`,
    CALLBACK: '/payment/callback',
    VERIFY: '/payment/verify'
  },

  WALLET: {
    GET_ALL: '/wallet', // ADMIN
    GET_DETAIL: (id: string) => `/wallet/${id}`, // ADMIN
    CURRENT: '/wallet/me',
  },

  WALLET_TRANSACTION: {
    GET_ALL: '/wallet-transaction', // ADMIN
    GET_DETAIL: (id: string) => `/wallet-transaction/${id}`,
    GET_BY_WALLET: (walletId: string) => `/wallet-transaction/wallet/${walletId}`,
  },

  WITHDRAWAL: {
    CREATE: '/withdraw',
    CURRENT: '/withdraw',
    GET_BY_ID: (id: string) => `/withdraw/${id}`,
    ACCOUNT_BALANCE: '/withdraw/account-balance',
  },

  NOTIFICATIONS: {
    GET_ALL: '/notification',
    MARK_READ: '/notification/read',
    MARK_ALL_READ: '/notification/read-all',
    GET_ALL_UNREAD: '/notification/unread',
    DELETE: (id: string) => `/notification/${id}`
  },


  MESSAGES: {
    GET: '/messages',
    SEND: '/messages',
    READ: '/messages/read'
  },

  UPLOAD: '/upload',
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
