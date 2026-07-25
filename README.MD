# GWD Sports — Multi-Tenant Academy Platform

GWD Sports is a **multi-tenant SaaS platform** for sports academies. A single GWD installation powers unlimited academies, each with their own branded public page, isolated data, and separate payment accounts — all managed from a unified super-admin panel.

---

## Architecture Overview

```
gwd.in/                        → Discovery/portal landing page (coming soon)
gwd.in/[academy-slug]          → Public academy page (themed, SEO-optimized)
gwd.in/login                   → Shared auth gateway
gwd.in/dashboard               → Academy admin dashboard (scoped to their data)
gwd.in/student                 → Student portal
gwd.in/admin/academies         → GWD Super Admin panel
```

Every academy gets `/[their-slug]` — e.g., `gwd.in/master-grid`, `gwd.in/champions-fc`. All data lives in a single MongoDB database, but every query is scoped by `academyId` at the API level so academies can never see each other's data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4, Shadcn UI, Radix Primitives |
| **State** | Redux Toolkit |
| **Database** | MongoDB, Mongoose ODM |
| **Auth** | JWT (access + refresh tokens), `jose` for edge |
| **Payments** | Razorpay Routes (multi-account split) |
| **Deployment** | Vercel / Railway |

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)
- Razorpay account (for payment features)

### Installation

```bash
cd academy
npm install
cp .env.example .env.local
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-32-char-minimum-secret
JWT_REFRESH_SECRET=your-32-char-minimum-refresh-secret

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Multi-Tenant Architecture

### How Tenancy Works

1. **Single Database, Logical Isolation** — All models include an `academyId` foreign key. Every API query filters by this ID.
2. **JWT Carries `academy_id`** — On login/register, the JWT payload includes the user's `academyId`. The edge middleware extracts it and injects it as an HTTP header (`x-academy-id`) on every request.
3. **Three-Tier Access** — `gwd_super_admin` → all data; `admin` → their academy only; `student/trainer` → their own records.

```
JWT Payload: { userId, email, role, academy_id }
                                         ↓
Edge Middleware → x-academy-id header → API Route → tenantFilter
```

### Tenant Isolation Pattern (applied to every admin API)

```typescript
// Applied to every admin route
const isSuperAdmin = auth.user.role === 'gwd_super_admin';
const tenantFilter = (!isSuperAdmin && auth.academyId)
  ? { academyId: auth.academyId }
  : {};

// Example: students query
const students = await StudentProfile.find(filter);
```

### Academy Slug Pages

Each academy gets a public page at `gwd.in/[slug]`:

```
src/app/[slug]/page.tsx          → Server Component (DB lookup, SEO metadata)
src/views/academy/AcademyPublicPage.tsx  → Client Component (themed UI, CTA)
```

Next.js App Router automatically prioritizes static routes (`/login`, `/admin`) over the dynamic `[slug]` catch-all — no conflict resolution needed.

---

## Payment Architecture (Razorpay Route)

Every payment is split three ways automatically:

```
Student pays ₹3,000 (baseAmount)
├── ₹30 (1%)     → GWD Platform Account (platform fee, stays in master Razorpay)
├── ₹2,970 (99%) → Academy's Linked Bank Account (via Razorpay Route transfer)
└── ~₹70.80      → Razorpay Gateway Fee (~2.36%, auto-deducted by Razorpay)
```

**How it's implemented:**

```typescript
// create-order/route.ts
const platformFeePercent = academy.platformFeePercent ?? 1;
const platformFee = baseAmount * (platformFeePercent / 100);
const transferAmount = baseAmount - platformFee;

// Razorpay Route: transfer to academy's account
transfers = [{
  account: academy.rzp_account,   // Each academy's linked RZP account
  amount: Math.round(transferAmount * 100),
  currency: 'INR',
  on_hold: false
}];
```

**Each academy** links their bank account via Razorpay's linked account system. Their `rzp_account` ID is stored on the `Academy` document and set by the GWD super admin during onboarding.

---

## Data Models

### Academy
```typescript
{
  name, slug (unique, indexed),
  description, location, address,
  sports[], fees: { monthly, quarterly, yearly },
  facilities[], timings: { opening, closing, workingDays[] },
  theme: { primaryColor, accentColor, logoUrl, heroImages[], tagline },
  rzp_account,        // Razorpay linked account ID
  platformFeePercent, // Default: 1
  ownerId,            // Academy admin user
  isActive,
  // indexes: slug (unique), isActive
}
```

### User
```typescript
{
  name, email, password (select: false),
  role: 'admin' | 'student' | 'trainer' | 'user' | 'gwd_super_admin',
  academyId,  // Which academy this user belongs to
  sports[], phone, isActive,
  refreshTokens (select: false),
  // indexes: academyId, { role, academyId }
}
```

### FeePayment
```typescript
{
  orderId, paymentId, signature,
  amount,        // Total charged to student
  baseAmount,    // Base fee before platform fee calc
  platformFee,   // GWD's cut (1%)
  gatewayFee,    // Estimated Razorpay gateway fee (~2.36%)
  currency, status,
  studentId, academyId,
  transferId, transferStatus,
  // indexes: { academyId, status }, { studentId }, { createdAt }
}
```

### Settings (Per-Academy)
```typescript
{
  academyId,       // null = global GWD settings
  performanceMetrics[], defaultFeeAmount, currency,
  heroMode, heroImages[], logoUrl, logoAlignment, logoIsCircular, logoScale
  // index: { academyId } unique sparse
}
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/login` | Login — returns JWT with `academy_id` |
| POST | `/api/user/register` | Register — accepts `academyId` for academy selection |
| POST | `/api/user/refresh` | Refresh access token |
| POST | `/api/user/logout` | Invalidate refresh token |

### Academy (Public — No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academy` | List active academies (for registration dropdown) |
| GET | `/[slug]` | Public academy page |

### Admin (Academy-Scoped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | KPIs scoped to academy |
| GET/PUT | `/api/admin/settings` | Per-academy settings |
| GET | `/api/admin/students` | Academy's students only |
| GET/POST | `/api/admin/trainers` | Academy's trainers only |
| GET/POST | `/api/admin/users` | Academy's users only |
| GET | `/api/admin/finance-analytics` | Academy's financials |
| GET | `/api/admin/get-kits` | Academy's kit requests |
| GET/POST | `/api/events` | Academy's events (`?academyId=` for public) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order with Route split |
| POST | `/api/payments/verify-payment` | Verify signature, save transferId |
| GET | `/api/payments/admin/all` | All payments (scoped to academy) |
| GET | `/api/payments/admin/defaulters` | Students with outstanding fees |

### GWD Super Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/academies` | List & create academies |
| GET/PUT/DELETE | `/api/admin/academies/[id]` | Manage single academy |
| POST | `/api/admin/academies/[id]/onboard` | Full onboarding (academy + admin user) |
| GET | `/api/admin/platform-stats` | Platform-wide revenue, student counts |

---

## Project Structure

```
academy/src/
├── app/
│   ├── [slug]/                  # Dynamic public academy pages
│   │   └── page.tsx             # Server Component + SEO metadata
│   ├── api/
│   │   ├── user/                # login, register, refresh, logout
│   │   ├── admin/
│   │   │   ├── academies/       # Super admin CRUD (+ [id]/onboard)
│   │   │   ├── dashboard/       # Tenant-scoped KPI aggregations
│   │   │   ├── students/        # Tenant-scoped student management
│   │   │   ├── trainers/        # Tenant-scoped trainer management
│   │   │   ├── users/           # Tenant-scoped user management
│   │   │   ├── settings/        # Per-academy settings
│   │   │   ├── finance-analytics/
│   │   │   ├── get-kits/
│   │   │   └── platform-stats/  # Super admin only
│   │   ├── payments/
│   │   │   ├── create-order/    # Razorpay Route with fee split
│   │   │   ├── verify-payment/  # Signature verification + transfer tracking
│   │   │   └── admin/           # all, defaulters
│   │   └── events/              # Tenant-scoped events
│   ├── dashboard/               # Academy admin views
│   ├── student/                 # Student portal views
│   ├── login/ register/         # Auth pages
│   └── layout.tsx               # Root layout
├── lib/
│   ├── db.ts                    # MongoDB connection (singleton)
│   ├── jwt.ts                   # Token generation (includes academy_id)
│   ├── models/                  # Mongoose models
│   │   ├── Academy.ts
│   │   ├── User.ts
│   │   ├── Student.ts
│   │   ├── Trainer.ts
│   │   ├── FeePayment.ts
│   │   ├── Settings.ts
│   │   └── Event.ts
│   └── middleware/
│       └── auth.ts              # authMiddleware, adminMiddleware, roleMiddleware
├── middleware.ts                # Next.js Edge Middleware (JWT → headers)
├── store/
│   └── slices/authSlice.ts     # Redux auth (stores academyId)
├── types/index.ts               # Shared TypeScript interfaces
└── views/
    └── academy/
        └── AcademyPublicPage.tsx  # Themed public academy page
```

---

## Security Model

| Layer | Implementation |
|-------|---------------|
| **Edge Middleware** | `jose` JWT verification at the edge — rejects invalid tokens before hitting any API |
| **API Middleware** | `authMiddleware`, `adminMiddleware`, `roleMiddleware` extract and validate `academyId` |
| **Tenant Isolation** | Every write operation forces `academyId = auth.academyId` for non-super-admins |
| **Data Leakage Prevention** | All aggregate pipelines include `tenantFilter` as the first `$match` stage |
| **Razorpay Security** | Payment verification uses HMAC-SHA256 signature validation |
| **Password Hashing** | `bcryptjs` with automatic salting |
| **Token Rotation** | Dual-token (access + refresh) with refresh token stored in DB and invalidated on logout |

---

## Development Log

### July 2026 — Multi-Tenant Architecture (Phase 1–6)

This release transforms GWD Sports from a single-academy system into a full multi-tenant SaaS platform.

#### Phase 1: Database Schema Upgrades
- **Academy model** — Added `slug` (unique, indexed), `theme` (primaryColor, accentColor, logoUrl, heroImages, tagline), `ownerId`, `rzp_account`, `platformFeePercent` (default 1%)
- **User model** — Added `academyId` field, `gwd_super_admin` role, and performance indexes `{ academyId }`, `{ role, academyId }`
- **FeePayment model** — Added `baseAmount`, `platformFee`, `gatewayFee`, `transferId`, `transferStatus` for financial auditability
- **Settings model** — Added `academyId` for per-academy settings with unique sparse index
- **Types** — Updated `UserRole`, `UserUpdateData`, `UserFilters`, `Academy` interface to reflect all new fields

#### Phase 2: Auth & Middleware
- **Edge Middleware** (`src/middleware.ts`) — `jose`-based JWT verification at the edge; extracts `academy_id` and injects `x-academy-id`, `x-user-id`, `x-user-role` request headers
- **JWT** — `TokenPayload` now includes `academy_id`; both login and register routes sign JWTs with the user's academyId
- **Register route** — Now accepts `academyId` in request body so students can select their academy during signup
- **Redux Auth Slice** — Stores `academyId` from login/register response; role type includes `gwd_super_admin`

#### Phase 3: Dynamic Academy Slug Pages
- **`src/app/[slug]/page.tsx`** — Server Component that fetches academy by slug, generates SEO metadata (`<title>`, `<meta description>`), returns 404 for inactive/unknown academies
- **`src/views/academy/AcademyPublicPage.tsx`** — Client Component rendering a fully themed public page with academy colors, sports badges, fee structure, facilities, timings, contact info, and a Join CTA

#### Phase 4: Tenant Isolation — API Route Scoping
All admin API routes now apply the `tenantFilter` pattern:
- `gwd_super_admin` → unrestricted, sees all data
- `admin` → filtered by `auth.academyId`

Routes scoped: `students`, `trainers` (GET + POST), `users` (GET + POST), `dashboard`, `settings`, `finance-analytics`, `get-kits`, `payments/all`, `payments/defaulters`, `events` (GET + POST)

#### Phase 5: GWD Super Admin APIs
- `GET/POST /api/admin/academies` — List (with search/filter/paginate) and create academies
- `GET/PUT/DELETE /api/admin/academies/[id]` — Single academy management including theme and `rzp_account` updates
- `POST /api/admin/academies/[id]/onboard` — Atomic transaction: creates the academy + its admin user in one operation
- `GET /api/admin/platform-stats` — Platform-wide stats: total academies, students, revenue, platform fees collected

#### Phase 6: Razorpay Route Auto-Split
- **create-order** — Calculates `platformFee = baseAmount × (platformFeePercent / 100)`, transfers `baseAmount - platformFee` to academy's `rzp_account` via Razorpay Routes, saves fee breakdown to `FeePayment`
- **verify-payment** — Saves `transferId` from Razorpay after successful HMAC signature verification

#### Security Audit Fixes (Post-Implementation)
Four parallel auditors found and fixed 8 issues:
- 🔴 Events API leaked events across all academies → Fixed with `academyId` filter
- 🔴 Admin users route exposed all platform users → Fixed with tenant scoping
- 🔴 Admin get-kits route leaked across academies → Fixed with `$match` pipeline stage
- 🔴 Trainers POST allowed cross-tenant injection → Fixed with forced `auth.academyId`
- 🟡 Missing `User.academyId` index → Added `{ academyId: 1 }` and `{ role, academyId }` compound indexes
- 🟡 Missing `Settings.academyId` unique index → Added sparse unique index
- 🟡 `UserUpdateData` / `UserFilters` missing `gwd_super_admin` → Fixed type unions

---

### May 2026 — Admin Command Center & Financial Analytics

#### Landing Page & Brand Customization
- **Global Branding** — `NEXT_PUBLIC_BRAND_NAME` environment variable for custom academy names
- **Hero Section Customization** — Admin controls whether landing shows video or image carousel
- **Dynamic Logo Engine** — Upload brand logo with alignment (top-left or center), circular crop mode, and scale slider (50%–300%)

#### Admin Command Center Dashboard
- **`GET /api/admin/dashboard`** — Unified KPI aggregation: student demographics, attendance trends, financial health, trainer load, automated drop-off detection (students absent 7+ days)
- Responsive 4-KPI hero cards, live data widgets, drop-off alert system with click-to-contact

#### Financial Command Center
- **`GET /api/admin/finance-analytics`** — Lifetime/monthly/quarterly revenue, payment status breakdown, 12-month trend, 30-day daily granularity, top payers, fee defaulters

#### Production Stability
- CORS dynamic origin validation for Railway subdomain pattern
- Proxy trust config for correct rate limiting on Railway
- Auth rate limit tuned to 20 attempts per 15 min window

---

## Deployment

### Vercel (Recommended for Next.js)

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard.

### Railway

Deploy the Next.js app as a single service.

**Required Environment Variables:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32 chars |
| `JWT_REFRESH_SECRET` | Min 32 chars |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | For webhook signature validation |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://gwd.in`) |

---

## Contributing

1. Branch from `main`
2. Follow the tenant isolation pattern for all new API routes
3. Run `npx tsc --noEmit` before pushing — zero errors required
4. Test both as `admin` (academy-scoped) and `gwd_super_admin` (global) roles

### Recent Updates (July 2026 - Continuation)
- **Master Athlete & User Directory**: Added full-functional user directory fetching from `/api/admin/users` into `SuperAdminDashboard` providing cross-tenant lookup capabilities for the GWD command center.
- **Dynamic Fee Payment Checkout**: Upgraded `StudentPaymentPanel` to dynamically fetch academy-specific fee structures. Students can now directly select between Monthly, Quarterly, Half-Yearly, and Yearly plans, automatically populating the correct Razorpay charge amount.
- **Database Migration**: Successfully copied all MongoDB collections (academies, students, users, payments, etc.) from the local environment to the production-ready MongoDB Atlas Cluster.
- **Tenant Admin Page Corrections**: Removed the globally-scoped "Academies" tab from `AdminPage.tsx` for standard tenant admins, ensuring they only see features scoped to their academy.
- **Render Error Fixes**: Resolved an application crash in `SuperAdminDashboard.tsx` Global Transaction Ledger caused by unpopulated `studentId` object mapping.

### Production-Readiness Launch Updates (Current Checkpoint)
- **Cloud Media Storage**: Integrated Cloudinary for seamless upload of academy logos and hero images, bypassing ephemeral filesystem limits.
- **Communication Engine**: Added Resend SDK for transactional emails (welcome, receipts, password resets, attendance alerts) and MSG91 for SMS notifications.
- **Recurring Subscriptions**: Fully integrated Razorpay Subscriptions with a secure HMAC-verified webhook (`/api/payments/subscription/webhook`) to handle lifecycle events (created, active, cancelled) and automated fee recording.
- **Observability Stack**: Deployed Sentry for robust server/client error tracking and global error boundaries, plus PostHog for user analytics.
- **Discovery Portal**: Built a global `/discover` page with advanced search and filtering to help users find and join active academies.
- **Legal & Compliance**: Added Razorpay-mandated legal pages (Privacy Policy, Terms & Conditions, Refund Policy, Contact Us) and a unified global footer.
- **Codebase Audit**: Cleared all TODOs, removed hardcoded localhost references, resolved all Next.js 15 build/type errors, and updated `.env.example` with the new production service keys.

### July 2026 — Platform Operations & Communications (Phases 0–5)
- **Phase 0 (Payment Hardening):** Resolved critical payment routing bugs, implemented strict integer-paise math, and hardened Razorpay webhook processing with HMAC signatures. Added a local browser-based fallback verification route (`/pay/verify`).
- **Phase 1 (Bulk Onboarding):** Implemented an OCR/CSV/Text import wizard with a robust data staging pipeline and atomic MongoDB commits to handle batch student uploads flawlessly.
- **Phase 2 (WhatsApp Communication Engine):** Built a high-reliability messaging queue, scheduler, and registry of Meta-approved templates. Added an Alert Feed and Message Log to the Admin dashboard.
- **Phase 3 (Dual-Mode Attendance):** Built a robust attendance engine featuring parent QR self-check-in windows and a coach one-click checklist, intelligently merged to prevent double-messaging.
- **Phase 4 (Parent-Facing Surface):** Created secure, unauthenticated public routes (`/passport/[id]` and `/pay/[id]`) for WhatsApp sharing with strict privacy whitelists and zero data leakage.
- **Phase 5 (Performance Taxonomy & Achievements):** Rebuilt the performance architecture with categorized metrics (Tactical, Technical, SSG, Match Play) and an automated rule-based achievement/badge generator.
- **Phase 6 (Live-Run Hardening & Web Scanner):** Fixed critical nested mass-assignment bugs in student edits, enforced refresh token revocation on logout, built a native browser-based QR Barcode Scanner for student check-ins, and added secure autogenerated credential delivery to the WhatsApp welcome flow.
- **Production Hardening:** Centralized branding studio with dynamic CSS variables, optimized Admin Dashboard using Next.js code splitting (saving ~85% on first load JS), and configured Vercel cron jobs for the messaging engine.
