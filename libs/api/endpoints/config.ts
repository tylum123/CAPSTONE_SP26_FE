// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5057/api/v1",
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  BANKLOOKUP_API_KEY: process.env.NEXT_PUBLIC_BANKLOOKUP_API_KEY || "",
  BANKLOOKUP_API_SECRET: process.env.NEXT_PUBLIC_BANKLOOKUP_API_SECRET || "",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_REGISTER: "/verify-email",
    RESEND_OTP: "/resend-verification",
    GOOGLE_LOGIN: "/google-login",
    LOGOUT: "/logout",
    REFRESH_TOKEN: "/refresh",
    VERIFY_EMAIL: "/verify",
    FORGOT_PASSWORD: "/forget",
    RESET_PASSWORD: "/reset",
  },

  // Farmer
  FARMER: {
    PROFILE: "/farmer",
    PROFILE_BY_ID: (id: string) => `/farmer/${id}`,
    UPDATEPROFILE: "/farmer",
    UPDATEAVATAR: "/farmer/upload-avatar",
    DASHBOARD: "/farmer/dashboard",
  },

  WORKER: {
    PROFILE: "/worker",
    PROFILE_BY_ID: (id: string) => `/worker/${id}`,
    UPDATEPROFILE: "/worker",
    UPDATEAVATAR: "/worker/upload-avatar",
  },

  JOBS: {
    GET: "/job/post",
    GET_BY_FARMER_HISTORY: "/job/post/farmer/history",
    GET_BY_FARMER: "/job/post/farmer",
    DETAIL: (id: string) => `/job/post/${id}`,
    FILTERED_JOBS: "/job/post/filter",
    FILTERED_JOBS_BY_FARMER: "/job/post/filter/farmer",
    CREATE: "/job/post",
    UPDATE: (id: string) => `/job/post/${id}`,
    CANCEL: (id: string) => `/job/post/cancel/${id}`,
    UPDATE_STATUS: (id: string) => `/job/post/update-status/${id}`,
    UPDATE_URGENCY: (id: string) => `/job/post/update-urgency/${id}`,
    DELETE: (id: string) => `/job/post/${id}`,
    JOB_APPLICATIONS: "/job/application",
    JOB_APPLICATIONS_BY_POST: (jobPostId: string) =>
      `/job/application/post/${jobPostId}`,
    JOB_APPLICATIONS_BY_FARMER: "/job/application/farmer",
    WORKERS_PER_DAY: (id: string) => `/job/post/${id}/workers-per-day`,
    APPLICATION_DETAIL: (id: string) => `/job/application/${id}`,
    RESPOND_APPLICANT: (id: string) => `/job/application/respond/${id}`,
    CANCEL_APPLICATION: (id: string) => `/job/application/cancel/farmer/${id}`,
    SAVE_DRAFT: "/job/post/draft",
    GET_DRAFTS: "/job/post/drafts",
    JOB_DETAILS: "/job/detail",
    JOB_DETAIL: (id: string) => `/job/detail/${id}`,
    JOB_DETAILS_BY_POST: (id: string) => `/job/detail/post/${id}`,
    APPROVE_JOB_DETAILS: (id: string) => `/job/detail/approve/${id}`,
  },

  // Farm
  FARM: {
    FARMS: "/farm",
    FARM: (id: string) => `/farm/${id}`,
    ADD_FARM: "/farm",
    UPDATE_FARM: (id: string) => `/farm/${id}`,
    REMOVE_FARM: (id: string) => `/farm/${id}`,
    UPLOAD_IMAGE: (id: string) => `/farm/${id}/upload-image`,
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/user",
    USER_DETAIL: (id: string) => `/user/${id}`,
    UPDATE_USER: (id: string) => `/user/${id}`,
    DELETE_USER: (id: string) => `/user/${id}`,
    WALLET_TRANSACTIONS: "/admin/wallet-transactions",
    WALLET_STATS: "/admin/wallet/stats",
    // DISPUTES: '/admin/disputes',
    // DISPUTE_DETAIL: (id: string) => `/admin/disputes/${id}`,
    // RESOLVE_DISPUTE: (id: string) => `/admin/disputes/${id}/resolve`,
    // SETTINGS: '/admin/settings',
    // STATISTICS: '/admin/statistics',
  },

  // User
  USER: {
    PROFILE: "/profile",
    UPDATE_PROFILE: "/profile/update",
    CHANGE_PASSWORD: "/profile/change-password",
    UPLOAD_AVATAR: "/profile/upload-avatar",
    FARMER_ID: (id: string) => `/profile/farmer/${id}`,
    WORKER_ID: (id: string) => `/profile/worker/${id}`,
  },

  // Common
  SKILL: {
    SKILLS: "/skills",
    SKILLS_CATEGORY: (categoryId: string) => `/skills/category/${categoryId}`,
    SKILL_DETAIL: (id: string) => `/skills/${id}`,
    CREATE_SKILL: "/skills",
    UPDATE_SKILL: (id: string) => `/skills/${id}`,
    DELETE_SKILL: (id: string) => `/skills/${id}`,
  },

  JOB_CATEGORY: {
    LIST: "/job/category",
    DETAIL: (id: string) => `/job/category/${id}`,
    CREATE: "/job/category",
    UPDATE: (id: string) => `/job/category/${id}`,
    DELETE: (id: string) => `/job/category/${id}`,
  },

  MEDIA: {
    UPLOAD_IMAGE: "/media/upload/image",
    UPLOAD_IMAGES: "/media/upload/images",
    UPLOAD_VIDEO: "/media/upload/video",
    UPLOAD_VIDEOS: "/media/upload/videos",
    UPLOAD_RAW_FILE: "/media/upload/raw-file",
    UPLOAD_RAW_FILES: "/media/upload/raw-files",
    DELETE_RESOURCE: "/media/delete/resource",
    DELETE_RESOURCES: "/media/delete/resources",
  },

  PAYMENT: {
    GET: (id: string) => `/payment/${id}`,
    CREATE: "/payment/",
    CANCEL: (id: string) => `/payment/${id}/cancel`,
    CALLBACK: "/payment/callback",
    VERIFY: "/payment/verify",
  },

  WALLET: {
    GET_ALL: "/wallet", // ADMIN
    GET_DETAIL: (id: string) => `/wallet/${id}`, // ADMIN
    CURRENT: "/wallet/me",
  },

  WALLET_TRANSACTION: {
    GET_ALL: "/wallet-transaction", // ADMIN
    GET_DETAIL: (id: string) => `/wallet-transaction/${id}`,
    GET_BY_WALLET: (walletId: string) =>
      `/wallet-transaction/wallet/${walletId}`,
  },

  WITHDRAWAL: {
    CREATE: "/withdraw",
    CURRENT: "/withdraw",
    GET_BY_ID: (id: string) => `/withdraw/${id}`,
    ACCOUNT_BALANCE: "/withdraw/account-balance",
  },

  NOTIFICATIONS: {
    GET_ALL: "/notification",
    MARK_READ: "/notification/read",
    MARK_ALL_READ: "/notification/read-all",
    GET_ALL_UNREAD: "/notification/unread",
    DELETE: (id: string) => `/notification/${id}`,
  },

  DISPUTES: {
    GET_ALL: "/disputes",
    GET_MINE: "/disputes/mine",
    GET_BY_ID: (id: string) => `/disputes/${id}`,
    CREATE: "/disputes",
    UPDATE: (id: string) => `/disputes/${id}`,
    DELETE: (id: string) => `/disputes/${id}`,
    REVIEW: (id: string) => `/disputes/${id}/review`,
    RESOLVE: (id: string) => `/disputes/${id}/resolve`,
    GET_COMMENTS: (id: string) => `/disputes/${id}/comments`,
    ADD_COMMENT: (id: string) => `/disputes/${id}/comments`,
  },
  
  MESSAGES: {
    GET: '/messages',
    SEND: '/messages',
    READ: '/messages/read',
    CONVERSATIONS: '/messages/conversations'
  },

  UPLOAD: "/upload",
};

export type ApiEndpoints = typeof API_ENDPOINTS;
