/**
 * Application-wide constants
 * Import using: import { ROUTES, API_ENDPOINTS, ROLES } from '@/constants'
 */

// Application routes
export const ROUTES = {
  HOME: "/",

  // Auth routes
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",

  // Farmer routes
  FARMER: "/farmer",
  FARMER_DASHBOARD: "/farmer/dashboard",
  FARMER_JOBS: "/farmer/jobs",
  FARMER_CREATE_JOB: "/farmer/create-job",
  FARMER_APPLICANTS: "/farmer/applicants",
  FARMER_APPLICATIONS: "/farmer/applications",
  FARMER_MESSAGES: "/farmer/messages",
  FARMER_PAYMENTS: "/farmer/payments",
  FARMER_SETTINGS: "/farmer/settings",

  // Worker routes
  WORKER: "/worker",
  WORKER_DASHBOARD: "/worker/dashboard",
  WORKER_JOBS: "/worker/jobs",
  WORKER_APPLICATIONS: "/worker/applications",
  WORKER_MESSAGES: "/worker/messages",
  WORKER_PROFILE: "/worker/profile",
  WORKER_SETTINGS: "/worker/settings",

  // Admin routes
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_DISPUTES: "/admin/disputes",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

// User roles
export const ROLES = {
  FARMER: "farmer",
  WORKER: "worker",
  ADMIN: "admin",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_WITH_TIME: "MMM dd, yyyy HH:mm",
  API: "yyyy-MM-dd",
} as const;

// Application status values
export const STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
