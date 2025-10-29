export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export const APP_NAME = import.meta.env.VITE_APP_NAME || "MasterGrade Admin";

export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    LOGIN: "/admin/login",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    STUDENTS: "/admin/students",
    TRAINERS: "/admin/trainers",
    ACADEMIES: "/admin/academies",
    USERS: "/admin/users",
    EVENTS: "/admin/events",
  },
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
  TRAINER: "trainer",
  USER: "user",
} as const;

export const STUDENT_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
} as const;

export const KIT_STATUS = {
  REQUESTED: "requested",
  PROCESSING: "processing",
  DELIVERED: "delivered",
} as const;

export const FEE_PERIODS = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
} as const;

export const PAYMENT_STATUS = {
  PAID: "paid",
  PENDING: "pending",
  OVERDUE: "overdue",
} as const;

export const SPORTS_LIST = [
  "Football",
  "Basketball",
  "Tennis",
  "Cricket",
  "Swimming",
  "Athletics",
  "Badminton",
  "Boxing",
  "Martial Arts",
  "Fitness",
] as const;

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "mg_auth_token",
  REFRESH_TOKEN: "mg_refresh_token",
  USER: "mg_user",
} as const;

// Event-related constants

export const EVENT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const EVENT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-blue-100 text-blue-800",
  ongoing: "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

export const EVENT_SORT_OPTIONS = [
  { value: "startDate", label: "Start Date" },
  { value: "name", label: "Name" },
  { value: "sport", label: "Sport" },
  { value: "createdAt", label: "Created Date" },
  { value: "participantCount", label: "Participants" },
] as const;
