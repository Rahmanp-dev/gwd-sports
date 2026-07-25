# GWD Sports Ecosystem — Complete System Architecture & Handoff Document

> **Last Updated:** July 25, 2026  
> **Purpose:** Master reference for any AI agent, developer, or team member to fully understand and continue development on this codebase.  
> **Stack:** Next.js 15 (App Router) · React 18 · TypeScript · MongoDB (Mongoose) · Razorpay · Tailwind CSS 4

---

## Table of Contents

1. [Project Overview & Business Context](#1-project-overview--business-context)
2. [Multi-Tenant Architecture](#2-multi-tenant-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema (All 9 Models)](#4-database-schema-all-9-models)
5. [Authentication & Authorization System](#5-authentication--authorization-system)
6. [API Routes (Complete Reference)](#6-api-routes-complete-reference)
7. [Payment System & Fee Split Logic](#7-payment-system--fee-split-logic)
8. [Subscription Engine (Razorpay Subscriptions)](#8-subscription-engine-razorpay-subscriptions)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Redux State Management](#10-redux-state-management)
11. [Service Layer](#11-service-layer)
12. [Communication Engine (Email & SMS)](#12-communication-engine-email--sms)
13. [Media Storage (Cloudinary)](#13-media-storage-cloudinary)
14. [Observability Stack (Sentry + PostHog)](#14-observability-stack-sentry--posthog)
15. [Key Data Flows (End-to-End)](#15-key-data-flows-end-to-end)
16. [Environment Variables](#16-environment-variables)
17. [Dependencies](#17-dependencies)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Business Rules & Constraints](#19-business-rules--constraints)
20. [Known Limitations & Future Work](#20-known-limitations--future-work)

---

## 1. Project Overview & Business Context

**GWD Sports Ecosystem** is a **multi-tenant SaaS platform** that enables independent sports academies across India to digitize their operations. Think of it as "Shopify for Sports Academies."

### What It Does
- **Academy Owners** register their academy on the platform, get a branded microsite (`/{slug}`), and manage students, trainers, attendance, performance metrics, fees, kits, and events.
- **Students** register, join an academy, pay fees (one-time or recurring subscriptions), view attendance/performance, and request sports kits.
- **Trainers** manage their assigned students, mark attendance, and evaluate performance.
- **GWD Super Admin** (platform owner) manages all tenant academies, monitors platform revenue, onboards new academies, and controls the ecosystem map/discovery portal.

### Revenue Model
- **Platform Fee:** GWD takes a configurable percentage (default 1%) of every student fee payment. This stays in the main Razorpay account.
- **Academy Revenue:** The remaining amount is transferred to the academy's linked Razorpay account via **Razorpay Route** (payment splits).
- **Gateway Fee:** Razorpay's standard 2.36% is handled separately by Razorpay.

### Tenant Isolation Model
This is a **shared database, shared schema** multi-tenant architecture. All tenants (academies) share the same MongoDB database and collections. Tenant isolation is enforced at the **application layer** via `academyId` filtering on every query.

---

## 2. Multi-Tenant Architecture

### How Tenancy Works

```
┌─────────────────────────────────────────────────────────────┐
│                    GWD SPORTS ECOSYSTEM                      │
│                   (Single Next.js App)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Academy A   │  │  Academy B   │  │  Academy C   │  ...   │
│  │  slug: mgfc  │  │  slug: csk   │  │  slug: rca   │        │
│  │  academyId:  │  │  academyId:  │  │  academyId:  │        │
│  │  abc123      │  │  def456      │  │  ghi789      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│              ┌───────────▼───────────┐                       │
│              │   Shared MongoDB DB   │                       │
│              │   (MongoDB Atlas)      │                       │
│              │                        │                       │
│              │  academies collection  │                       │
│              │  users collection      │                       │
│              │  studentprofiles       │                       │
│              │  trainerprofiles       │                       │
│              │  feepayments           │                       │
│              │  events                │                       │
│              │  subscriptions         │                       │
│              │  globalsettings        │                       │
│              └────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Identity Chain

1. **User Registration:** When a user registers, they can specify an `academyId`. This links them to a specific tenant.
2. **JWT Token:** On login, the user's `academyId` is signed into the JWT payload as `academy_id`.
3. **Edge Middleware** (`src/middleware.ts`): Verifies the JWT using `jose`, extracts `academy_id`, and injects it as the `x-academy-id` HTTP header on every request.
4. **Auth Middleware** (`src/lib/middleware/auth.ts`): Reads the `x-academy-id` header and attaches it to the `auth` object as `auth.academyId`.
5. **API Routes:** Every data-fetching route filters by `academyId` to ensure tenants only see their own data.
6. **Super Admin Exception:** Users with role `gwd_super_admin` bypass tenant filters and can see/manage all data across all academies.

### URL Structure

| URL Pattern | Purpose | Tenant Scope |
|---|---|---|
| `/` | Ecosystem landing page (map + discovery) | Global |
| `/discover` | Academy search portal | Global |
| `/[slug]` | Academy public microsite | Per-Academy |
| `/admin/dashboard` | Admin panel | Per-Academy (or Global for super admin) |
| `/mgfc/student/*` | Student portal | Per-Academy |
| `/mgfc/trainer/*` | Trainer portal | Per-Academy |
| `/user/auth` | Login/Register | Global |

---

## 3. Directory Structure

```
academy/
├── src/
│   ├── app/                          # Next.js App Router (pages & API)
│   │   ├── api/                      # All REST API routes
│   │   │   ├── academy/              # Academy CRUD + discover
│   │   │   ├── admin/                # Admin panel APIs
│   │   │   ├── events/               # Event management
│   │   │   ├── payments/             # Razorpay payments & subscriptions
│   │   │   ├── student/              # Student profile APIs
│   │   │   ├── trainer/              # Trainer profile APIs
│   │   │   ├── upload/               # Cloudinary image upload
│   │   │   └── user/                 # Auth (login/register/refresh/reset)
│   │   ├── [slug]/                   # Dynamic academy microsites
│   │   ├── admin/                    # Admin dashboard pages
│   │   ├── discover/                 # Discovery portal page
│   │   ├── events/                   # Event pages
│   │   ├── mgfc/                     # Student & trainer portals
│   │   ├── programs/                 # Program landing pages
│   │   ├── user/                     # Auth & profile pages
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── page.tsx                  # Homepage (LandingPage)
│   │   ├── globals.css               # Design system tokens
│   │   └── global-error.tsx          # Sentry error boundary
│   ├── components/                   # Reusable React components
│   │   ├── admin/                    # Admin panel components
│   │   ├── auth/                     # Route guards
│   │   ├── ecosystem/               # Map & discovery components
│   │   ├── landing/                  # Homepage sections
│   │   ├── layout/                   # Footer, etc.
│   │   ├── payment/                  # Razorpay button
│   │   ├── providers/                # Analytics provider
│   │   ├── shared/                   # Cross-cutting components
│   │   ├── ui/                       # Radix UI primitives (25 components)
│   │   └── user/                     # Student/Trainer profile components
│   ├── lib/                          # Server-side utilities
│   │   ├── models/                   # Mongoose schemas (9 models)
│   │   ├── middleware/               # Auth middleware
│   │   ├── db.ts                     # MongoDB connection singleton
│   │   ├── jwt.ts                    # JWT generation/verification
│   │   ├── email.ts                  # Resend email service
│   │   ├── sms.ts                    # MSG91 SMS service
│   │   ├── cloudinary.ts            # Cloudinary upload service
│   │   ├── analytics.ts             # PostHog client wrapper
│   │   └── env.ts                    # Zod environment validation
│   ├── services/                     # Frontend API service classes
│   │   ├── apiService.ts            # Axios instance with interceptors
│   │   ├── authService.ts           # Login/register/refresh
│   │   ├── academyService.ts        # Academy CRUD operations
│   │   └── eventService.ts          # Event operations
│   ├── store/                        # Redux Toolkit store
│   │   ├── index.ts                  # Store configuration
│   │   └── slices/authSlice.ts      # Auth state management
│   ├── types/                        # TypeScript interfaces
│   │   └── index.ts                  # All shared type definitions
│   ├── middleware.ts                 # Next.js edge middleware
│   └── instrumentation.ts           # Sentry server instrumentation
├── instrumentation-client.ts         # Sentry client instrumentation
├── sentry.client.config.ts           # Sentry client config
├── next.config.ts                    # Next.js + Sentry config
├── package.json                      # Dependencies
├── .env.example                      # Environment variable template
└── README.md                         # Project documentation
```

---

## 4. Database Schema (All 9 Models)

### 4.1 User (`users` collection)

The central identity model. Every person in the system is a User first.

```typescript
interface IUser {
  _id: ObjectId;
  name: string;                    // 2-50 chars, trimmed
  email: string;                   // Unique, lowercase, validated
  password: string;                // select: false, bcrypt hashed (salt 12)
  phone: string;                   // Regex validated
  role: "admin" | "trainer" | "student" | "user" | "gwd_super_admin";
  academyId?: ObjectId;            // Ref: Academy — tenant link
  sports: string[];
  refreshTokens: string[];         // select: false — active JWT refresh tokens
  isActive: boolean;               // default: true
  lastLogin?: Date;
  resetPasswordToken?: string;     // For forgot-password flow
  resetPasswordExpires?: Date;
}
```

**Key Behaviors:**
- **Pre-save hook:** Hashes password with bcrypt (12 rounds) on every modification.
- **Instance methods:** `comparePassword()`, `addRefreshToken()`, `removeRefreshToken()`.
- **toJSON transform:** Strips `password`, `refreshTokens`, `__v`.
- **Indexes:** `{ email: 1 }` (unique), `{ role: 1 }`, `{ academyId: 1 }`, `{ role: 1, academyId: 1 }`.

### 4.2 Academy (`academies` collection)

The tenant entity. Each academy is an independent business operating on the platform.

```typescript
interface IAcademy {
  _id: ObjectId;
  name: string;                           // 3-100 chars
  description: string;                    // max 1000
  location: string;                       // City/area
  address: string;
  sports: string[];                       // lowercase
  trainers: ObjectId[];                   // Ref: User
  students: ObjectId[];                   // Ref: User
  fees: {
    monthly: number;
    quarterly: number;
    halfYearly: number;                   // default: 0
    yearly: number;
  };
  contactInfo: { name, phone, email };
  facilities: string[];
  timings: { opening, closing, workingDays[] };
  capacity: number;                       // min: 1
  images: string[];                       // Validated URL format
  isActive: boolean;                      // default: true
  createdBy: ObjectId;                    // Ref: User
  ownerId: ObjectId;                      // Ref: User — academy admin
  slug: string;                           // Unique, lowercase, alphanumeric+hyphens
  rzp_account?: string;                  // Razorpay linked account ID for Route splits
  theme: {
    primaryColor: string;                 // default: '#7c3aed'
    accentColor: string;                  // default: '#c8971a'
    logoUrl: string;
    heroImages: string[];
    tagline: string;
  };
  platformFeePercent: number;             // default: 1, range 0-10
  coordinates?: { lat, lng };             // For map positioning
  ecosystemScore: number;                 // 0-100, for leaderboard ranking
  establishedYear?: number;
  achievements: string[];
  coachName?: string;
  starPlayers: { name, role, badge, avatarUrl }[];
  registeredTeams: { name, category, winRate }[];
  gwdFoundingAcademy: boolean;            // default: false
  verificationStatus: 'pending' | 'verified' | 'founding';
  customDomain?: string;                  // Unique, sparse — future feature
}
```

**Virtual Fields:** `studentCount`, `trainerCount` (computed from array lengths).  
**Indexes:** `{ ownerId: 1 }`, `{ isActive: 1 }`, `{ slug: 1 }` (unique), `{ location: 1, sports: 1 }`, `{ 'coordinates.lat': 1, 'coordinates.lng': 1 }`.

### 4.3 StudentProfile (`studentprofiles` collection)

Extended profile linked 1:1 to a User with role "student".

```typescript
interface IStudentProfile {
  userId: ObjectId;              // Ref: User — UNIQUE
  academyId?: ObjectId;          // Ref: Academy — tenant link
  trainers: ObjectId[];          // Ref: User
  enrollmentDate?: Date;
  feePayments: [{                // Embedded payment history
    amount: number;
    paymentDate: Date;
    period: 'monthly' | 'quarterly' | 'yearly';
    status: 'paid' | 'pending' | 'overdue';
    transactionId?: string;
  }];
  totalFeesPaid: number;
  outstandingFees: number;
  attendance: [{                 // Embedded attendance log
    date: Date;
    present: boolean;
    markedBy: ObjectId;          // Ref: User (trainer)
    remarks?: string;
  }];
  kits: [{                       // Embedded kit orders
    kitName: string;
    status: 'delivered' | 'requested' | 'processing' | 'rejected';
    requestedAt: Date;
    deliveredAt?: Date;
    cost?: number;
  }];
  performance: [{                // Embedded performance evaluations
    sport: string;
    score: number;
    maxScore: number;
    remarks: string;
    evaluatedBy: ObjectId;       // Ref: User (trainer)
    evaluatedAt: Date;
    category: string;            // e.g. 'dribble', 'running', 'strike'
  }];
  sports: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'U12' | 'U14' | 'U16' | 'U19' | 'U23';
  medicalInfo?: {
    allergies: string[];
    medications: string[];
    emergencyContact: { name, phone, relation };
  };
  isActive: boolean;
}
```

### 4.4 TrainerProfile (`trainerprofiles` collection)

Extended profile linked 1:1 to a User with role "trainer".

```typescript
interface ITrainerProfile {
  userId: ObjectId;              // Ref: User — UNIQUE
  academyId?: ObjectId;          // Ref: Academy
  sports: string[];
  students: ObjectId[];          // Ref: User — assigned students
  specializations: string[];
  qualifications: [{
    certification: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
  }];
  experience: [{
    organization: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description: string;
  }];
  hourlyRate?: number;
  availability: {
    days: ('monday' | ... | 'sunday')[];
    timeSlots: [{ start: string, end: string }];  // HH:MM format
  };
  rating: { average: number, totalReviews: number };
  isActive: boolean;
}
```

### 4.5 FeePayment (`feepayments` collection)

Tracks every Razorpay payment transaction.

```typescript
interface IFeePayment {
  orderId: string;               // UNIQUE — Razorpay order ID
  paymentId?: string;            // Razorpay payment ID (sparse index)
  signature?: string;            // Razorpay HMAC signature
  amount: number;                // Total charged to student
  baseAmount: number;            // Net fee before platform/gateway fees
  platformFee: number;           // GWD's cut (default 1%)
  gatewayFee: number;            // Estimated Razorpay cut (~2.36%)
  currency: string;              // default: "INR"
  status: 'pending' | 'success' | 'failed';
  receipt: string;
  studentId: ObjectId;           // Ref: User
  academyId?: ObjectId;          // Ref: Academy — tenant link
  transferId?: string;           // Razorpay Route transfer ID
  transferStatus: 'pending' | 'processed' | 'failed';
  description?: string;
  period?: string;               // 'monthly', 'quarterly', etc.
}
```

### 4.6 Subscription (`subscriptions` collection)

Tracks Razorpay recurring subscription lifecycle.

```typescript
interface ISubscription {
  studentId: ObjectId;                    // Ref: User
  academyId: ObjectId;                    // Ref: Academy
  razorpaySubscriptionId: string;         // UNIQUE
  razorpayPlanId: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
  amount: number;
  currentStart?: Date;
  currentEnd?: Date;
  nextBillingAt?: Date;
  chargeAt?: Date;
}
```

### 4.7 Event (`events` collection)

Sports tournaments, trials, and workshops.

```typescript
interface IEvent {
  name: string;                  // 3-100 chars
  description: string;           // max 2000
  sport: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  venue: string;
  participants: ObjectId[];      // Ref: User
  maxParticipants?: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isPublic: boolean;
  registrationOpen: boolean;
  registrationDeadline?: Date;
  entryFee: number;
  contactInfo: { name, phone, email };
  tags: string[];
  requirements?: string;
  prizes: string[];
  createdBy: ObjectId;           // Ref: User
  academyId?: ObjectId;          // Ref: Academy — tenant scoping
  isActive: boolean;
}
```

**Virtual Fields:** `participantCount`, `canRegister` (computed boolean).

### 4.8 GlobalSettings (`globalsettings` collection)

Per-academy or global platform settings.

```typescript
interface IGlobalSettings {
  academyId?: ObjectId;          // Ref: Academy — UNIQUE, SPARSE
  performanceMetrics: string[];  // default: ["dribble", "running", "defending", "strike", "stamina"]
  defaultFeeAmount: number;
  currency: string;              // default: 'INR'
  heroMode: 'video' | 'carousel';
  heroImages: string[];
  logoUrl: string;
  logoAlignment: 'top_left' | 'middle';
  logoIsCircular: boolean;
  logoScale: number;             // percentage
  themeColor: string;            // hex
}
```

### 4.9 LandingPageEventCard (`landingpageeventcards` collection)

Controls which events appear on the homepage carousel.

```typescript
interface ILandingPageEventCard {
  eventId: ObjectId;             // Ref: Event — UNIQUE
  order: number;                 // Display order
  colorScheme: string;           // Tailwind gradient class
  isActive: boolean;
}
```

---

## 5. Authentication & Authorization System

### 5.1 Auth Flow Overview

```
┌──────────┐    POST /api/user/login     ┌──────────────┐
│  Client   │ ─────────────────────────► │  Login Route  │
│  (React)  │                            │               │
│           │ ◄───────────────────────── │  Returns:     │
│           │   { accessToken,           │  - JWT Access  │
│           │     refreshToken,          │  - JWT Refresh │
│           │     user }                 │  - User object │
└──────────┘                            └──────────────┘
     │                                         │
     │  Stores in:                             │  Signs into JWT:
     │  - localStorage                         │  - user_id
     │  - Cookie (gwd_token)                   │  - email
     │                                         │  - role
     │                                         │  - academy_id  ◄── TENANT KEY
     ▼                                         │
┌──────────┐    Every API Request        ┌──────────────┐
│  Client   │ ─────────────────────────► │ Edge          │
│  Axios    │   Authorization: Bearer    │ Middleware    │
│  Intercep │   <accessToken>            │ (middleware.ts)│
│           │                            │               │
│           │                            │ Verifies JWT  │
│           │                            │ with jose     │
│           │                            │               │
│           │                            │ Injects:      │
│           │                            │ x-user-id     │
│           │                            │ x-user-role   │
│           │                            │ x-academy-id  │
└──────────┘                            └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ API Route     │
                                        │ Handler       │
                                        │               │
                                        │ authMiddleware │
                                        │ reads headers │
                                        │ returns:      │
                                        │ { user,       │
                                        │   academyId } │
                                        └──────────────┘
```

### 5.2 JWT Token Structure

```typescript
interface TokenPayload {
  user_id: string;
  email: string;
  role: UserRole;
  academy_id: string | null;    // The tenant identifier
}
```

- **Access Token:** Expires in `7d` (configurable via `JWT_EXPIRES_IN`).
- **Refresh Token:** Expires in `7d` (configurable via `JWT_REFRESH_EXPIRES_IN`).
- **Signing:** `jsonwebtoken` for generation, `jose` for Edge Runtime verification.

### 5.3 Middleware Layers

| Layer | File | Runtime | Purpose |
|---|---|---|---|
| Edge Middleware | `src/middleware.ts` | Edge | JWT verification, header injection, public route bypass |
| authMiddleware | `src/lib/middleware/auth.ts` | Node.js | Extracts user + academyId from headers |
| adminMiddleware | `src/lib/middleware/auth.ts` | Node.js | Checks role is `admin` or `gwd_super_admin` |
| roleMiddleware | `src/lib/middleware/auth.ts` | Node.js | Checks role against allowed list (e.g., `['gwd_super_admin']`) |

### 5.4 Role-Based Access Control

| Role | Scope | Can Do |
|---|---|---|
| `user` | Global | Browse academies, view events, register |
| `student` | Per-Academy | View own profile, pay fees, request kits, view attendance |
| `trainer` | Per-Academy | Manage assigned students, mark attendance, evaluate performance |
| `admin` | Per-Academy | Full CRUD on own academy's students, trainers, events, settings |
| `gwd_super_admin` | Platform-wide | All of the above + manage all academies, view global revenue, onboard new tenants |

### 5.5 Public Routes (No Auth Required)

The Edge Middleware skips JWT verification for these paths:
- `/api/user/login`, `/api/user/register`, `/api/user/refresh-token`
- `/api/user/forgot-password`, `/api/user/reset-password`
- `/api/academy/discover`, `/api/academy/[id]/public`
- `/api/events` (GET only)
- `/api/homepage-event-cards`
- `/api/payments/subscription/webhook`
- All static pages: `/`, `/about`, `/contact`, `/discover`, `/privacy-policy`, `/terms-and-conditions`, `/refund-policy`
- All `[slug]` pages (academy microsites)
- `/_next/*`, `/favicon.ico`

---

## 6. API Routes (Complete 84-Route Inventory)

### 6.1 User Management (`/api/user/`) — 10 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 1 | POST | `/api/user/login` | Public | Validates email/password, returns JWT pair + user object. Signs `academy_id` into token. Sets `gwd_token` cookie. | No |
| 2 | POST | `/api/user/register` | Public | Creates User + optional StudentProfile. Accepts `academyId` to join an academy on signup. Sends welcome email. | Yes (stores `academyId`) |
| 3 | POST | `/api/user/refresh-token` | Public | Validates refresh token, verifies active status, issues fresh token pair. | No |
| 4 | POST | `/api/user/logout` | Auth | Removes refresh token from user's active refresh tokens array. | No |
| 5 | GET/PUT | `/api/user/profile` | Auth | GET: Fetches user profile. PUT: Updates user profile fields (sanitizes sensitive fields). | No |
| 6 | PUT | `/api/user/change-password` | Auth | Validates current password and updates user's password. | No |
| 7 | POST | `/api/user/check-email` | Public | Checks if email exists and fetches linked Student/Trainer profiles. | No |
| 8 | PUT | `/api/user/deactivate` | Auth | Deactivates authenticated user's account (`isActive = false`). | No |
| 9 | POST | `/api/user/forgot-password` | Public | Generates SHA-256 reset token (1hr expiry) & sends reset email via Resend. | No |
| 10 | POST | `/api/user/reset-password` | Public | Resets password using reset token, clears all active refresh tokens. | No |

### 6.2 Academy Operations (`/api/academy/`) — 9 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 11 | GET/POST | `/api/academy` | GET: Public, POST: Admin | GET: Paginated list of active academies. POST: Creates new academy. | POST scoped to new academy |
| 12 | GET/PUT/DELETE | `/api/academy/[id]` | GET: Public, PUT/DELETE: Admin | GET: Academy details. PUT: Updates. DELETE: Removes. | PUT enforces `gwd_super_admin` OR `auth.academyId === id` |
| 13 | GET | `/api/academy/[id]/members` | Admin | Fetches populated trainers and students in academy. | Scoped to academy `[id]` |
| 14 | GET | `/api/academy/[id]/public` | Public | Public academy detail (excludes `rzp_account`, `platformFeePercent`). | Single academy |
| 15 | POST | `/api/academy/add-student` | Admin | Enrolls student into academy, checks capacity, creates/updates StudentProfile. | Yes |
| 16 | POST | `/api/academy/add-trainer` | Admin | Assigns trainer to academy, creates/updates TrainerProfile. | Yes |
| 17 | GET | `/api/academy/discover` | Public | Discovery endpoint with `?search`, `?sport`, `?city`, `?verified`, `?page`, `?limit`, `?sort`. | No (global) |
| 18 | POST | `/api/academy/remove-student` | Admin | Unassigns student from academy, unsets `academyId` in StudentProfile. | Yes |
| 19 | POST | `/api/academy/remove-trainer` | Admin | Unassigns trainer from academy, unsets `academyId` in TrainerProfile. | Yes |

### 6.3 Admin Portal (`/api/admin/`) — 21 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 20 | GET/POST | `/api/admin/academies` | SuperAdmin | GET: Search/list all academies. POST: Onboards academy + admin in DB transaction. | SuperAdmin global |
| 21 | GET/PUT/DELETE | `/api/admin/academies/[id]` | SuperAdmin/Admin | GET: Populated details. PUT: Updates fields. DELETE: Soft-deletes (`isActive: false`). | PUT enforces ownership |
| 22 | PATCH | `/api/admin/academies/[id]/custom-domain` | SuperAdmin | Assigns/clears custom domain after regex & uniqueness validation. | Scoped to `[id]` |
| 23 | POST | `/api/admin/academies/[id]/onboard` | SuperAdmin | Creates Admin user + Academy in one transaction. | Creates new tenant |
| 24 | GET | `/api/admin/dashboard` | Admin | Dashboard analytics (students, revenue, trainers, attendance %, drop-off risk). | **Yes** — filters by `auth.academyId` |
| 25 | GET | `/api/admin/finance-analytics` | Admin | Financial intelligence (lifetime/monthly/quarterly revenue, collection rate, defaulters). | **Yes** — filters by `auth.academyId` |
| 26 | GET | `/api/admin/get-kits` | Admin | Aggregates all kit requests/deliveries across student profiles. | **Yes** — scoped by `auth.academyId` |
| 27 | GET | `/api/admin/platform-stats` | SuperAdmin | Ecosystem-wide stats (total academies, students, revenue, platform fees). | No (platform-wide) |
| 28 | GET/PUT | `/api/admin/settings` | Admin | GET: Academy branding/settings. PUT: Updates hero mode, logo, fees, theme. | **Yes** — filters by `academyId` |
| 29 | POST | `/api/admin/settings/upload-hero` | Admin | Uploads hero images to `public/uploads/hero/`. | Admin scope |
| 30 | POST | `/api/admin/settings/upload-logo` | Admin | Uploads logo image to `public/uploads/logo/`. | Admin scope |
| 31 | GET | `/api/admin/students` | Admin | Lists student profiles with pagination and populated user/academy data. | **Yes** — scoped by `auth.academyId` |
| 32 | GET/PUT | `/api/admin/students/[id]` | Admin | GET: Single student profile. PUT: Updates student profile data. | Admin scope |
| 33 | GET | `/api/admin/students/leaderboard` | Admin | Top 10 students by average performance score. | Global aggregation |
| 34 | GET | `/api/admin/students/stats` | Admin | Student totals, skill level distribution, sport participation breakdown. | Global stats |
| 35 | GET/POST | `/api/admin/trainers` | Admin | GET: Paginated trainers with search. POST: Creates new trainer profile. | **Yes** — forces `auth.academyId` |
| 36 | GET/PUT/DELETE | `/api/admin/trainers/[id]` | Admin | GET: Trainer by ID. PUT: Updates. DELETE: Soft-deletes & cleans references. | Admin scope |
| 37 | GET | `/api/admin/trainers/stats` | Admin | Trainer statistics (totals, avg rating, sport & academy distribution). | Global stats |
| 38 | GET/POST | `/api/admin/users` | Admin | GET: Lists users with role/status filters. POST: Creates new user account. | **Yes** — forces `auth.academyId` |
| 39 | GET/PUT/DELETE | `/api/admin/users/[id]` | Admin | GET: User by ID. PUT: Updates. DELETE: Permanently deletes. | Admin scope |
| 40 | GET | `/api/admin/users/stats` | Admin | User role distribution and active vs inactive counts. | System-wide |

### 6.4 Event Management (`/api/events/`) — 7 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 41 | GET/POST | `/api/events` | GET: Public, POST: Admin | GET: Lists published events. POST: Creates event. | **Yes** — POST forces `auth.academyId` |
| 42 | GET/PUT/DELETE | `/api/events/[id]` | GET: Public, PUT/DELETE: Admin | GET: Event details. PUT: Updates. DELETE: Deletes. | Scoped to event |
| 43 | POST | `/api/events/[id]/join` | Auth | Registers user (validates capacity, open status, duplicates). | Scoped to event |
| 44 | DELETE | `/api/events/[id]/leave` | Auth | Unregisters user from event prior to start date. | Scoped to user |
| 45 | GET | `/api/events/admin/all-events` | Admin | Admin listing with sport/status filters and participant population. | Admin scope |
| 46 | GET | `/api/events/admin/stats` | Admin | Event statistics (upcoming, ongoing, totals by sport and status). | Active events |
| 47 | GET | `/api/events/user/my-events` | Auth | Events where current user is a participant. | **Yes** — scoped to `auth.user._id` |

### 6.5 Homepage & Landing Content (`/api/homepage/`) — 5 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 48 | GET/POST | `/api/homepage/admin/events` | Admin | GET: Landing page event cards. POST: Adds event card. | Global landing |
| 49 | PUT/DELETE | `/api/homepage/admin/events/[id]` | Admin | PUT: Updates card order/theme. DELETE: Removes card. | Global landing |
| 50 | PUT | `/api/homepage/admin/events/bulk/reorder` | Admin | Bulk reorder landing page event cards. | Global landing |
| 51 | GET | `/api/homepage/events` | Public | Public curated landing page event cards. | Public |
| 52 | GET | `/api/homepage/settings` | Public | Public hero and branding settings. | Public |

### 6.6 Payment & Billing (`/api/payments/`) — 13 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 53 | GET | `/api/payments/admin/all` | Admin | Master payment transaction log with status/amount filters. | **Yes** — scoped by `auth.academyId` |
| 54 | GET | `/api/payments/admin/defaulters` | Admin | Students owing outstanding fees, sorted by balance. | **Yes** — scoped by `auth.academyId` |
| 55 | PATCH | `/api/payments/admin/override/[studentId]` | Admin | Manually override outstanding fee balance or total fees paid. | Scoped to student |
| 56 | POST | `/api/payments/create-order` | Auth | Calculates platform fee + gateway fee, configures Razorpay Route transfers, creates order + pending FeePayment. | **Yes** — reads `auth.academyId` |
| 57 | GET | `/api/payments/history` | Auth | Paginated payment history for current student. | **Yes** — scoped to `auth.user._id` |
| 58 | GET | `/api/payments/outstanding` | Auth | Checks monthly fee status, auto-updates dues, returns outstanding fees. | Scoped to user's StudentProfile |
| 59 | POST | `/api/payments/pay` | Admin | Records manual payment, creates FeePayment, reduces outstanding fees. | **Yes** — links to `auth.academyId` |
| 60 | POST | `/api/payments/verify-payment` | Auth | Verifies Razorpay HMAC, fetches transfer details, marks payment success, updates student fee totals. | Scoped to `auth.user._id` |
| 61 | GET | `/api/payments/transactions/[id]` | Auth | Single fee payment transaction with populated student profile. | Scoped to transaction |
| 62 | POST | `/api/payments/subscription/create` | Auth | Cancels existing active subs, resolves academy pricing, creates Razorpay subscription + local Subscription doc. | **Yes** — uses `auth.academyId` |
| 63 | GET | `/api/payments/subscription/status` | Auth | Current active/latest subscription for student. | **Yes** — scoped by `studentId` + `academyId` |
| 64 | DELETE | `/api/payments/subscription/[id]/cancel` | Auth | Cancels Razorpay subscription at period end, updates status. | **Yes** — verifies ownership |
| 65 | POST | `/api/payments/subscription/webhook` | Public (HMAC) | Handles `subscription.charged`, `.activated`, `.halted`, `.cancelled`. Creates FeePayment records, sends receipt emails. | Scoped via stored `academyId` |

### 6.7 Student Services (`/api/student/`) — 7 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 66 | GET/POST | `/api/student/profile` | Auth | GET: Full student profile (populated academy, trainers, user). POST: Creates profile, sets role to `student`. | Scoped to `auth.user._id` |
| 67 | GET | `/api/student/attendance` | Auth | Paginated attendance records with stats (present %, total records). | Scoped to `auth.user._id` |
| 68 | POST | `/api/student/join-academy` | Auth | Enrolls student into academy, verifies capacity, updates StudentProfile + Academy. | Assigns to specified `academyId` |
| 69 | GET | `/api/student/kits` | Auth | Kit requests/deliveries for current student. | Scoped to current student |
| 70 | GET | `/api/student/performance` | Auth | Performance evaluations filtered by sport/category with evaluator populates. | Scoped to current student |
| 71 | POST | `/api/student/pay-fees` | Admin | Admin records fee payment on behalf of student. | Scoped to target student |
| 72 | POST | `/api/student/request-kit` | Auth | Requests new kit item if no pending request exists. | Scoped to current student |

### 6.8 Trainer Operations (`/api/trainer/`) — 9 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 73 | GET | `/api/trainer/profile` | Auth | Trainer profile with populated user, academy, and students list. | Scoped to `auth.user._id` |
| 74 | GET | `/api/trainer/students` | Trainer/Admin | Paginated list of assigned students with aggregated metrics. | **Yes** — scoped to trainer's student array |
| 75 | GET | `/api/trainer/academy-settings` | Trainer/Admin | Academy performance metrics config (evaluation categories, default fees, currency). | **Yes** — uses `auth.academyId` |
| 76 | POST | `/api/trainer/add-student` | Trainer/Admin | Assigns student to trainer (updates reciprocal arrays). | Scoped to trainer + student |
| 77 | POST | `/api/trainer/remove-student` | Trainer/Admin | Unassigns student from trainer (clears reciprocal arrays). | Scoped to trainer + student |
| 78 | POST | `/api/trainer/mark-attendance` | Trainer/Admin | Marks/updates daily attendance record for student. | Scoped by student ID |
| 79 | POST | `/api/trainer/add-performance` | Trainer/Admin | Appends performance evaluation (sport, score, maxScore, remarks, category). | Evaluated by `auth.user._id` |
| 80 | PUT/DELETE | `/api/trainer/performance/[studentId]/[performanceId]` | Trainer/Admin | PUT: Updates evaluation. DELETE: Removes evaluation from student profile. | Scoped to student + subdoc |
| 81 | GET | `/api/trainer/student/[studentId]/attendance` | Trainer/Admin | Student's attendance history and attendance % stats. | Scoped to target student |

### 6.9 File & Media Uploads (`/api/upload/`) — 2 Routes

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 82 | POST | `/api/upload/image` | Auth | Uploads to Cloudinary `{academyId}/{folder}` (max 5MB, auto quality/format). | **Yes** — folder prefixed by `auth.academyId` |
| 83 | POST | `/api/upload/hero` | Auth | Uploads hero image to Cloudinary `{academyId}/heroes` (1920×1080 crop, max 10MB). | **Yes** — folder prefixed by `auth.academyId` |

### 6.10 System Diagnostics — 1 Route

| # | Method | Path | Auth | Description | Tenant Isolated? |
|---|---|---|---|---|---|
| 84 | POST | `/api/logs` | Public | Non-blocking client log ingestion sink (logs errors in dev, returns `204`). | N/A |

---

## 7. Payment System & Fee Split Logic

### One-Time Payment Flow

```
Student clicks "Pay Fees"
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /api/payments/create-order        │
│                                          │
│  1. Auth: Get user + academyId           │
│  2. Fetch Academy (for platformFeePercent│
│     and rzp_account)                     │
│  3. Calculate fees:                      │
│     baseAmount = ₹3000 (student pays)    │
│     platformFee = baseAmount × 1% = ₹30  │
│     gatewayFee = (base+platform) × 2.36% │
│     totalAmount = base + platform + gw   │
│     transferAmount = baseAmount (to acad)│
│                                          │
│  4. If academy.rzp_account exists:       │
│     Add Razorpay Route transfer          │
│     { account: rzp_account,              │
│       amount: baseAmount × 100 }         │
│                                          │
│  5. Create Razorpay Order                │
│  6. Save FeePayment (status: pending)    │
│  7. Return order + key_id to client      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Client: Opens Razorpay Checkout Modal   │
│  Student completes payment               │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /api/payments/verify-payment       │
│                                          │
│  1. Verify HMAC signature:               │
│     hmac(orderId + "|" + paymentId,      │
│          RAZORPAY_KEY_SECRET)            │
│  2. Update FeePayment:                   │
│     status → "success"                   │
│     paymentId, signature saved           │
│  3. Update StudentProfile:               │
│     Push to feePayments[]                │
│     Increment totalFeesPaid              │
│  4. Send receipt email + SMS             │
└─────────────────────────────────────────┘
```

### Fee Split Breakdown

For a ₹3,000 monthly fee with 1% platform fee:

| Component | Amount | Goes To |
|---|---|---|
| Base Amount | ₹3,000 | Academy (via Razorpay Route) |
| Platform Fee (1%) | ₹30 | GWD (stays in main account) |
| Gateway Fee (~2.36%) | ~₹71.51 | Razorpay |
| **Student Pays** | **₹3,101.51** | — |

> **Note:** If `rzp_account` is not set on the academy (Razorpay Route not activated), the entire amount stays in GWD's main account. The code handles this gracefully — transfers array stays empty.

---

## 8. Subscription Engine (Razorpay Subscriptions)

### Subscription Creation Flow

```
POST /api/payments/subscription/create
  Body: { planType: 'monthly' | 'quarterly' | 'yearly' }

1. Map planType to Razorpay Plan ID from env vars:
   - monthly  → RAZORPAY_PLAN_ID_MONTHLY
   - quarterly → RAZORPAY_PLAN_ID_QUARTERLY
   - yearly   → RAZORPAY_PLAN_ID_YEARLY

2. Create Razorpay Subscription via SDK

3. Save Subscription document:
   { studentId, academyId, razorpaySubscriptionId,
     razorpayPlanId, planType, status: 'created', amount }

4. Return subscription short_url for client redirect
```

### Webhook Event Handling

```
POST /api/payments/subscription/webhook
  (Public — verified by HMAC)

Events handled:
  subscription.authenticated → status = 'authenticated'
  subscription.activated     → status = 'active', set currentStart/End, nextBillingAt
  subscription.charged       → Create FeePayment record, update StudentProfile
  subscription.cancelled     → status = 'cancelled'
  subscription.paused        → status = 'paused'
  subscription.halted        → status = 'halted'
  subscription.completed     → status = 'completed'

HMAC Verification:
  hmac_sha256(request_body, RAZORPAY_WEBHOOK_SECRET)
  Compare with x-razorpay-signature header
```

---

## 9. Frontend Architecture

### 9.1 All 27 Pages/Routes

| Route | Page Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Ecosystem map + bento grids |
| `/[slug]` | `AcademyPublicPage` | Academy microsite (SSR with metadata) |
| `/about` | `About` | About page |
| `/admin/dashboard` | `AdminPage` / `SuperAdminDashboard` | Admin portal (role-conditional) |
| `/admin/login` | `AdminLogin` | Admin auth |
| `/contact` | `Contact` | Contact form |
| `/discover` | `DiscoverPage` | Search & filter academies |
| `/events` | `EventPage` | Events directory |
| `/events/[eventId]` | `EventDetailsPage` | Event detail + registration |
| `/events/my-events` | `MyEventsPage` | User's registered events |
| `/gallery` | `Gallery` | Visual gallery |
| `/mgfc/student` | `MGFCStudentPage` | Student dashboard |
| `/mgfc/student/pay-fees` | `PayFeesPage` | Fee payment with Razorpay |
| `/mgfc/student/register` | `StudentAuth` | Student registration step 1 |
| `/mgfc/student/register/complete` | `StudentComplete` | Registration complete |
| `/mgfc/student/register/create` | `StudentCreate` | Profile creation |
| `/mgfc/trainer` | `TrainerPage` | Trainer dashboard |
| `/privacy-policy` | `PrivacyPolicy` | Legal |
| `/programs/basketball` | `MGBCPage` | Basketball program |
| `/programs/football` | `MGFCPage` | Football program |
| `/programs/galaxy-events` | `GalaxyEventsPage` | Events program |
| `/programs/mun` | `MgMunPage` | MUN program |
| `/programs/racing-league` | `MGRLPage` | Racing League |
| `/refund-policy` | `RefundPolicy` | Legal |
| `/terms-and-conditions` | `TermsAndConditions` | Legal |
| `/user/auth` | `UserAuth` | Login/Register |
| `/user/profile` | `UserProfile` | Profile management |

### 9.2 Root Layout Provider Hierarchy

```
<html>
  <body>
    <AnalyticsProvider>           ← PostHog tracking
      <ErrorBoundary>             ← React error boundary
        <Provider store={store}>  ← Redux store
          <QueryClientProvider>   ← React Query
            <Router>              ← React Router (SSR-safe)
              <Toaster />         ← Sonner toast notifications
              {children}
            </Router>
          </QueryClientProvider>
        </Provider>
      </ErrorBoundary>
    </AnalyticsProvider>
  </body>
</html>
```

### 9.3 Design System

- **Fonts:** Playfair Display (headers), Plus Jakarta Sans (body), Inter (UI), Bebas Neue (stats), JetBrains Mono (code/numbers), Clash Display (brand).
- **Color Tokens:** OKLCH-based CSS variables supporting light/dark modes.
- **UI Components:** 25 Radix UI primitives wrapped with Tailwind CSS (button, dialog, dropdown, form, input, select, table, tabs, etc.).
- **Animations:** Framer Motion for page transitions, Leaflet/Mapbox for map interactions.

---

## 10. Redux State Management

### Auth Slice (Primary State)

```typescript
interface AuthState {
  token: string | null;          // JWT access token
  refreshToken: string | null;   // JWT refresh token
  user: User | null;             // Full user object
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

**Persistence:** Access token, refresh token, and user object are stored in `localStorage` with keys `mg_auth_token`, `mg_refresh_token`, `mg_user`. Access token is also set as cookie `gwd_token` for SSR.

**Async Thunks:**
- `loginUser({ email, password })` → calls `authService.login`
- `registerUser(userData)` → calls `authService.register`

**Sync Actions:** `logout`, `clearError`, `setUser`, `setSession`.

---

## 11. Service Layer

### apiService (`src/services/apiService.ts`)
- Axios instance with base URL `/api`.
- **Request Interceptor:** Attaches `Authorization: Bearer <token>` from localStorage.
- **Response Interceptor:** On 401, attempts token refresh via `/api/user/refresh-token`. On refresh success, retries original request. On refresh failure, dispatches `logout()`.

### authService (`src/services/authService.ts`)
- `login(email, password)`: POST to `/api/user/login`.
- `register(data)`: POST to `/api/user/register`.
- `refreshToken(refreshToken)`: POST to `/api/user/refresh-token`.
- `getCurrentUser()`: GET from `/api/user/me`.

### academyService (`src/services/academyService.ts`)
- Full CRUD for academies including onboarding, member management.
- `getAllAcademies()`, `getAcademyById()`, `createAcademy()`, `onboardAcademy()`, `updateAcademy()`, `deleteAcademy()`, `getAcademyMembers()`, `addStudentToAcademy()`, `removeStudentFromAcademy()`, `addTrainerToAcademy()`, `removeTrainerFromAcademy()`.

### eventService (`src/services/eventService.ts`)
- `getEvents()`, `getEventById()`, `createEvent()`, `updateEvent()`, `deleteEvent()`, `joinEvent()`, `leaveEvent()`, `getMyEvents()`.

---

## 12. Communication Engine (Email & SMS)

### Email (Resend SDK)

| Function | Trigger | Content |
|---|---|---|
| `sendWelcomeEmail()` | User registration | Welcome message with academy landing page link |
| `sendPaymentReceiptEmail()` | Successful payment | Itemized receipt (amount, period, orderId, date) |
| `sendPasswordResetEmail()` | Forgot password request | Reset URL valid for 1 hour |
| `sendAbsenceAlertEmail()` | Consecutive absences | Alert to parent with missed day count |

**Graceful Degradation:** All functions check for `RESEND_API_KEY` and silently return if not configured.

### SMS (MSG91 Flow API)

| Function | Trigger | Template Variables |
|---|---|---|
| `sendPaymentConfirmationSMS()` | Successful payment | `var1` = amount, `var2` = academyName |
| `sendAbsenceAlertSMS()` | Consecutive absences | `var1` = studentName, `var2` = daysMissed |

---

## 13. Media Storage (Cloudinary)

- **SDK:** Cloudinary v2 Node.js SDK.
- **Upload Function:** `uploadImage(buffer, { folder, public_id?, transformation? })` → streams buffer to `gwd/{folder}`.
- **Delete Function:** `deleteImage(publicId)`.
- **Use Cases:** Academy logos → `gwd/academy-images`, Hero images → `gwd/hero-images`.
- **Why Cloudinary:** Vercel's filesystem is ephemeral — uploaded files are lost on redeploy. Cloudinary provides persistent CDN-backed storage.

---

## 14. Observability Stack (Sentry + PostHog)

### Sentry (Error Tracking)
- **Client:** `@sentry/nextjs` initialized in `instrumentation-client.ts`. Captures errors, replays (100% on error), and router transitions.
- **Server:** Initialized in `src/instrumentation.ts` for both `nodejs` and `edge` runtimes. Captures unhandled request errors.
- **Global Error Boundary:** `src/app/global-error.tsx` wraps the entire app.

### PostHog (Product Analytics)
- **Client:** Lazy-loaded `posthog-js` in `AnalyticsProvider`.
- **Events Tracked:**
  - `user_registered` (userId, academySlug)
  - `payment_completed` (userId, amount, planType, academySlug)
  - `registration_dropoff` (step, metadata)
- **Functions:** `trackEvent()`, `trackRegistration()`, `trackPayment()`, `trackDropoff()`, `identifyUser()`.

---

## 15. Key Data Flows (End-to-End)

### Flow 1: Academy Onboarding (Super Admin)

```
1. Super Admin opens /admin/dashboard → SuperAdminDashboard
2. Clicks "Onboard New Academy"
3. Fills form: academy details + admin credentials
4. POST /api/admin/academies/[id]/onboard
   → Creates Academy document (generates slug)
   → Creates User with role: 'admin', academyId set
   → Returns both objects
5. Academy appears on /discover and ecosystem map
6. Academy admin can login and manage their tenant
```

### Flow 2: Student Registration & Academy Join

```
1. Student visits /[slug] (academy microsite)
2. Clicks "Join Academy" → redirects to /user/auth
3. Registers with academyId pre-filled
4. POST /api/user/register
   → Creates User with role: 'student', academyId set
   → Creates StudentProfile linked to User + Academy
   → Adds user._id to academy.students[]
   → Sends welcome email
   → Returns JWT with academy_id embedded
5. Student redirected to /mgfc/student (dashboard)
```

### Flow 3: Fee Payment (One-Time)

```
1. Student opens /mgfc/student/pay-fees
2. StudentPaymentPanel fetches academy fees from API
3. Student selects plan (Monthly/Quarterly/Yearly)
4. POST /api/payments/create-order
   → Calculates platform fee + gateway fee
   → Creates Razorpay order (with Route transfer if rzp_account exists)
   → Saves FeePayment (pending)
5. Client opens Razorpay checkout modal
6. Student completes payment
7. POST /api/payments/verify-payment
   → Verifies HMAC signature
   → Updates FeePayment → success
   → Updates StudentProfile (feePayments[], totalFeesPaid)
   → Sends receipt email + SMS
8. UI shows success toast
```

### Flow 4: Attendance Marking (Trainer)

```
1. Trainer opens /mgfc/trainer
2. Views assigned students list
3. Marks present/absent for each student
4. POST /api/trainer/attendance
   → Pushes entry to StudentProfile.attendance[]
   → If 3+ consecutive absences → sends alert email + SMS
```

### Flow 5: Recurring Subscription

```
1. Student selects "Subscribe" on payment page
2. POST /api/payments/subscription/create
   → Creates Razorpay Subscription with plan ID
   → Saves Subscription document (status: created)
   → Returns checkout URL
3. Student completes mandate on Razorpay
4. Razorpay webhook fires:
   subscription.authenticated → status = authenticated
   subscription.activated → status = active
   subscription.charged → FeePayment created + StudentProfile updated
5. Recurring charges happen automatically per plan cycle
```

---

## 16. Environment Variables

```env
# ─── Core App ───
APP_NAME="GWD Sports Ecosystem"
APP_ID="GWD_1"
NODE_ENV="production"
PORT=3000

# ─── Database ───
DB_URI="mongodb+srv://..."           # MongoDB Atlas connection string
DB_NAME="sports"

# ─── JWT ───
JWT_SECRET="..."                      # Min 32 chars
JWT_REFRESH_SECRET="..."              # Min 32 chars
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12

# ─── Razorpay ───
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
RAZORPAY_PLAN_ID_MONTHLY="plan_..."
RAZORPAY_PLAN_ID_QUARTERLY="plan_..."
RAZORPAY_PLAN_ID_YEARLY="plan_..."

# ─── Cloudinary ───
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# ─── Email (Resend) ───
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@gwd.in"

# ─── SMS (MSG91) ───
MSG91_API_KEY="..."
MSG91_TEMPLATE_ID_OTP="..."
MSG91_TEMPLATE_ID_PAYMENT="..."
MSG91_TEMPLATE_ID_ABSENCE="..."

# ─── Monitoring ───
SENTRY_DSN="https://..."
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# ─── Mapping ───
NEXT_PUBLIC_MAPBOX_TOKEN="pk.ey..."

# ─── Rate Limiting ───
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 17. Dependencies

### Core
| Package | Version | Purpose |
|---|---|---|
| `next` | 15.3.3 | Framework (App Router, SSR, Edge Runtime) |
| `react` / `react-dom` | 18.3.1 | UI library |
| `typescript` | 5.x | Type safety |

### Data & State
| Package | Version | Purpose |
|---|---|---|
| `mongoose` | 8.17.0 | MongoDB ODM |
| `@reduxjs/toolkit` | 2.6.1 | State management |
| `react-redux` | 9.2.0 | React bindings for Redux |
| `@tanstack/react-query` | 5.75.5 | Server state management |
| `axios` | 1.9.0 | HTTP client |

### Auth & Security
| Package | Version | Purpose |
|---|---|---|
| `jose` | 6.2.4 | JWT verification (Edge Runtime compatible) |
| `jsonwebtoken` | 9.0.2 | JWT generation (Node.js) |
| `bcryptjs` | 3.0.2 | Password hashing |
| `zod` | 3.x | Environment/input validation |

### Payments
| Package | Version | Purpose |
|---|---|---|
| `razorpay` | 2.9.6 | Razorpay SDK (orders, subscriptions, transfers) |

### UI & Styling
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | 4.1.0 | Utility-first CSS |
| `framer-motion` / `motion` | 12.x | Animations |
| `lucide-react` | 0.487.0 | Icons |
| `sonner` | 2.0.3 | Toast notifications |
| Radix UI | Various | Accessible UI primitives (25 components) |

### Maps
| Package | Version | Purpose |
|---|---|---|
| `leaflet` | 1.9.4 | Map rendering |
| `leaflet.markercluster` | 1.5.3 | Marker clustering |
| `mapbox-gl` | 3.27.0 | Alternative map rendering |

### Communication
| Package | Version | Purpose |
|---|---|---|
| `resend` | Latest | Transactional email |

### Monitoring
| Package | Version | Purpose |
|---|---|---|
| `@sentry/nextjs` | 10.67.0 | Error tracking & performance |
| `posthog-js` | 1.407.2 | Product analytics |

### Media
| Package | Version | Purpose |
|---|---|---|
| `cloudinary` | v2 | Image upload & CDN |

---

## 18. Deployment & Infrastructure

### Current Setup
- **Hosting:** Vercel (recommended) or Railway
- **Database:** MongoDB Atlas (cloud cluster)
- **CDN/Media:** Cloudinary
- **Payments:** Razorpay (Live mode)
- **Email:** Resend
- **SMS:** MSG91
- **Error Tracking:** Sentry
- **Analytics:** PostHog (Cloud)
- **Domain:** gwd.in (planned)
- **Git:** GitHub (`Rahmanp-dev/gwd-sports`)

### Build Configuration
- `next.config.ts` wrapped with `@sentry/nextjs` (`withSentryConfig`)
- Server Action body size limit: `10mb`
- Remote image patterns: All HTTPS hostnames
- React Strict Mode: Enabled

### Key Deployment Notes
1. **Vercel requires** all environment variables to be set in the dashboard.
2. **Razorpay webhook URL** must be configured in the Razorpay Dashboard pointing to `/api/payments/subscription/webhook`.
3. **Razorpay Route** requires separate activation (pending — Ticket #19993905).
4. **MongoDB Atlas** — ensure IP whitelist includes `0.0.0.0/0` for Vercel's dynamic IPs.
5. **Cloudinary** — create folders `gwd/academy-images` and `gwd/hero-images`.

---

## 19. Business Rules & Constraints

### Tenant Isolation Rules
1. Every API route that returns tenant-specific data MUST filter by `auth.academyId`.
2. `gwd_super_admin` bypasses tenant filters (can see all data).
3. Regular `admin` users can only manage their own academy.
4. Students and trainers are always scoped to their `academyId`.

### Payment Rules
1. Platform fee percentage is configurable per academy (`platformFeePercent`, default 1%, range 0-10%).
2. If an academy has no `rzp_account`, payments go entirely to GWD's main account.
3. Gateway fee (Razorpay's cut) is estimated at 2.36% and added to the total charged to the student.
4. All amounts are stored in INR and converted to paise (×100) for Razorpay API calls.

### Academy Rules
1. `slug` must be unique, lowercase, and match `/^[a-z0-9-]+$/`.
2. Academies can be soft-deleted (`isActive: false`) but not hard-deleted.
3. `verificationStatus` can be `pending`, `verified`, or `founding`.
4. `gwdFoundingAcademy` flag marks initial/partner academies.

### User Rules
1. Email must be unique across the entire platform (not per-tenant).
2. Password minimum length: 8 characters, hashed with bcrypt (12 salt rounds).
3. Refresh tokens are stored as an array on the User document (supports multiple active sessions).
4. Users can only belong to one academy at a time (`academyId` is singular).

---

## 20. Known Limitations & Future Work

### Current Limitations
1. **Single Academy per User:** A user can only be linked to one academy. Multi-academy membership requires a junction table or array refactor.
2. **Custom Domains:** Schema field exists (`customDomain`) but routing logic is not implemented. Requires Vercel domain configuration or reverse proxy.
3. **Razorpay Route Pending:** Awaiting approval from Razorpay (Ticket #19993905). Until activated, all payments go to GWD's main account.
4. **No Real-Time Features:** No WebSocket/SSE for live attendance updates, chat, or notifications.
5. **No Image Optimization:** Uploaded images are served as-is from Cloudinary. No automatic resizing/WebP conversion configured.
6. **Rate Limiting:** Environment variables exist but no middleware implementation.

### Planned Features
1. **Custom Domain Routing** for academy microsites.
2. **Parent Portal** for guardians to track their child's academy progress.
3. **Team Management** for inter-academy leagues and tournaments.
4. **Mobile App** (React Native) using the same API backend.
5. **Advanced Analytics Dashboard** with cohort analysis, retention metrics, and revenue forecasting.
6. **Multi-Sport Profiles** allowing students to be in multiple academies simultaneously.
7. **Academy-to-Academy Transfers** with profile portability.

---

> **End of Document**  
> This document was auto-generated from codebase analysis on July 25, 2026.  
> For questions, contact the GWD development team.
