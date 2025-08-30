export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export const JWT_COOKIE_NAME =
  import.meta.env.VITE_JWT_COOKIE_NAME || "mg_auth_token";
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
