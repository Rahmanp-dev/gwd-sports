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
- **Phase 7 (Branding Unification & UX Overhaul):** Executed a global font swap to DM Sans. Unified 3 diverged branding surfaces into a single `AcademyBrandingEditor`. Implemented real content rendering on the homepage (replacing demo sports/testimonials with real academy data) and cascaded brand colors natively down to the trainer and student dashboards. Added a Cash Payment offline-settlement UI. Fixed a Vercel-breaking logger bug and moved superadmin credentials to `.env.local` for secure rotation.
- **Phase 8 (Pre-Launch Blockers & Cross-Browser Scanners):** Fixed login/logout 500 errors by replacing Mongoose `.save()` with atomic `$push`/`$pull` to bypass legacy document validation. Built a self-healing auto-repair mechanism for broken trainer profiles. Added `jsqr` as a robust fallback for the student QR Scanner to support iOS Safari and Chrome. Rebranded hardcoded tenant URLs (`/mgfc/trainer`) to neutral paths (`/portal/trainer`), and stripped PII from unauthenticated API endpoints.
- **Phase 9 (Launch Readiness & Data Integrity):** Migrated the messaging engine from Interakt directly to the official Meta WhatsApp Cloud API (`v21.0`) with HMAC-SHA256 signature verification. Added automated WhatsApp payment receipts. Fixed financial analytics to correctly isolate Academy net revenue from Platform gross GMV, and prevented cross-tenant data leakage on admin dashboards. Ran a live-DOM browser audit to strip all fabricated claims/stats from public pages so they only reflect real, dynamically-generated academy data. Fixed background-tab animation bugs.
- **Production Hardening:** Centralized branding studio with dynamic CSS variables, optimized Admin Dashboard using Next.js code splitting (saving ~85% on first load JS), and configured a GitHub Actions cron job (`cron.yml`) to bypass Vercel Hobby's 1-per-day limit and ensure 15-minute reliable WhatsApp message delivery.
- **Phase 10 (Partner Onboarding & Design Engineering):** Created an automated, print-ready DOCX and HTML onboarding guide generator (`docs/generate-booklet-docx.mjs`) featuring an 8-mockup visual design suite, dynamic GWD Red branding typography (`#DC2626`), and comprehensive operational blueprints (Discovery Map, 100% fee split model via Razorpay Route, and Meta WhatsApp Cloud API templates). Hardened query filtering across all student registers using semantic `ACTIVE = { $ne: false }` filter to prevent `undefined` match bugs.
- **Phase 11 (Theme Engine Overhaul, Hero Media & Customizable Footer):** Expanded theme engine to 7 named background treatments (`light`, `soft`, `gradient`, `dark`, `slate`, `vivid`, `midnight`) with automatic WCAG AA contrast derivation (`var(--page-fg)`, `var(--page-card)`, `var(--page-muted)`). Added admin controls in Branding Studio for Hero background mode (Video autoplay with custom URL/upload vs Multi-photo Carousel) and a fully theme-driven Footer supporting custom contact info (phone, email, address), tagline/blurb, copyright text, and social media handles (Facebook, Instagram, Twitter/X, YouTube).
- **Phase 12 (Business Expansion & Sales Strategy):** Transitioned to B2B sales engineering to drive exponential academy onboarding. Created a comprehensive Growth Playbook with cold call scripts and 20 growth strategies, a 25-minute live demo meeting flow with psychological triggers, and a premium Node.js-based DOCX Official Academy Partner Certificate generator (`docs/generate-partner-certificate.mjs`) designed to formalize partnerships with a warm, welcoming tone.
- **Phase 13 (Theme Engine Overhaul & Super Admin Depth):** Refactored the Branding Editor into a homepage-shaped canvas (`AcademyCanvasEditor`) allowing inline edits on live production components. Expanded the theme engine with rich gradients (linear/radial, custom angles, luminance-based contrast), custom owner-authored stats, YouTube/Instagram video embeds, and unlocked the "Elite Difference" highlights section. Secured `PUT /api/academy/[id]` against privilege escalation with a strict field allowlist and restricted `DELETE` to super-admins. Added a "Usage Insights" panel (`/api/admin/academy-engagement`) providing a 0–100 engagement score based on roster freshness, collection, and sign-in recency, and synced the Ecosystem Profile Map Editor across owner and super-admin surfaces.
- **Hotfix (API Route Slug Collision):** Resolved a critical Next.js router build failure by renaming `[academyId]` to `[id]` in `/api/admin/academies/[id]/insights/route.ts` to prevent dynamic segment collisions with sibling routes, successfully restoring the entire API.
- **Phase 14 (WhatsApp Delivery Pipeline Audit & Production Fixes):** Diagnosed and resolved 4 silent root-cause delivery blockers on the live Meta WhatsApp API pipeline: (1) Unblocked cron event draining by enabling Super Admin manual triggering (`POST /api/jobs/tick`) directly from the UI, (2) Fixed send-tick timestamp freezing where newly queued messages were skipped until the next tick, (3) Corrected template language code from `en` to `en_US` across all 9 registered templates, and (4) Centralized domain URL derivation (`lib/appUrl.ts`) to prevent dead `gwd.in` link generation. Upgraded `MessagingHealth` UI panel with real-time pending event tracking and exact Meta API error reporting. Built `npm run whatsapp:doctor` (`scripts/whatsapp-doctor.mjs`) for safe CLI verification of Meta tokens, WABA target asset permissions, and template status. Built `npm run whatsapp:templates` (`scripts/create-whatsapp-templates.mjs`) for automated single-command submission of all 9 official templates directly to target WABAs.
- **Phase 15 (Cascading Deletion, Roster Integrity & WhatsApp Permission Audit):** Hardened user deletion with `lib/auth/deleteUserCascade.ts` to perform safe cascading cleanup of StudentProfile and TrainerProfile records, Academy roster dereferencing, and Passport detachment (preserves child identity history). Fixed a critical null-pointer crash on the Admin Students tab caused by orphaned profiles. Enforced tenant isolation and self/superadmin deletion protection on `DELETE /api/admin/users/[id]`. Isolated WhatsApp `#200` send permission error to WABA System User task assignment (`MANAGE` vs `MESSAGING`).
- **Phase 16 (GPS Geofencing, Full Audit Fixes & High-Performance Analytics):** Built Haversine-based GPS location geofencing (`lib/attendance/geofence.ts`) for student QR check-ins with client-side accuracy radius caps (up to 100m) and failure-mode handling (`useDeviceLocation.ts`). Fixed draft serialization bugs (`draftPrune`) preventing silent validation failures when saving branding forms. Optimized admin engagement analytics (`/api/admin/academy-engagement`) from ~1,700 queries down to 9 fixed aggregations with compound indexes (`FeePayment`, `OutboundMessage`). Added a keyboard-driven ⌘K Command Palette (`CommandPalette.tsx`) with semantic keyword matching across 13 admin tabs. Applied global WCAG-compliant `prefers-reduced-motion` CSS rules.
- **Phase 17 (Ledger Overhaul, Sports Passport Records & Discovery Engine Fixes):** (1) Overhauled Financial Transaction Ledger (`/api/payments/admin/all`) with proper User/Passport population, student name search, Cash badge indicator, and responsive card-list layout eliminating horizontal scrolling. (2) Expanded Sports Passport (`models/Passport.ts`, `lib/passport/recordAccess.ts`) to store coach-authored sporting records (tournaments, leagues, trials, certifications) with tenant-isolated mutation gates and repaired non-conforming passport IDs (`scripts/repair-passports.js`). (3) Fixed public Discovery API (`/api/academy/discover`) to process real search/sport/city filters with `$regex` and true pagination. (4) Added `WhatItCosts.tsx` to landing page highlighting 100% fee split transparency, data privacy guarantees, and roadmap features.
- **Phase 18 (Video Aspect Ratios & User Identity Security Cascade):** (1) Enhanced video embedding (`VideoSection.tsx`, `videoEmbed.ts`) with smart aspect-ratio detection (`auto`, `16:9`, `9:16`, `1:1`, `4:5`, `21:9`) for YouTube Shorts and Instagram Reels, and made Canvas Editor video bands interactively playable when selected. (2) Secured `PUT /api/admin/users/[id]` against privilege escalation (`role` & `academyId` stripped from non-superadmin updates), enforced tenant scoping, and built `applyIdentityChange.ts` to cascade name and phone updates across `User`, `StudentProfile`, and `Passport` (rebuilding `identityKey` to preserve duplicate-detection guarantees). (3) Wired `UserManagement.tsx` with sync toast notifications ("Also synced across N enrolment record(s) and M Sports Passport(s)"). (4) Reframed homepage pricing card (`WhatItCosts.tsx`) to "Free for your academy. Actually free."
- **Phase 19 (Security Audit, Systemic Tenant Scoping & Trainer Resolution):** (1) Systematically audited and hardened admin endpoints against cross-tenant data leakage: `PATCH /api/payments/admin/override/[studentId]` (validates non-negative amounts, caps at ₹1cr, logs before/after audit trails), `PATCH /api/admin/users/[id]/toggle-status`, `GET /api/admin/students/[id]`, and `GET/PUT/DELETE /api/admin/trainers/[id]`. (2) Fixed trainer resolution bug where `GET /api/admin/trainers/[id]` failed by introducing `resolveTrainer` to match against both profile ID and user ID. (3) Added `POST /api/admin/backfill-passports` to automatically resolve and link missing passports for existing students across all academies.
- **Phase 20 (Portal Theme Engine & Student UX Overhaul):** (1) Built a comprehensive semantic CSS design layer (`globals.css` with `.pt-card`, `.pt-btn-brand`, `.pt-btn-accent`, `.pt-chip`, `.pt-header`, `.pt-stat`) that dynamically binds both Student (`StudentPage.tsx`) and Coach (`TrainerPage.tsx`) portals to academy brand palette tokens (`--brand`, `--accent`, `--page-bg`), eliminating hardcoded slate/green defaults. (2) Upgraded `StudentPage` error handling so network drops show an explicit retry screen confirming data safety instead of "Not in any academy". (3) Added `PassportCard.tsx` with scannable QR, shareable link, and native mobile sharing sheet. (4) Integrated `SportingRecordPanel.tsx` in the student dashboard to display verified coach tournament/league records directly from the public Passport endpoint.
- **Phase 21 (Auth Routing, Fee Reminders, Owner Coaching & Rename Cascade):** (1) **Auth Routing & Deep Links:** Fixed login redirects to use `getRoleHomePath` (routing students & trainers directly to `/student` and `/portal/trainer`) and preserved deep links on login. (2) **Fee Reminder Engine:** Built `lib/payments/feeStatus.ts` (21 unit tests) and `FeeReminderBar.tsx` to warn students 7 days out, aligning with WhatsApp reminder schedules and de-escalating past T+3. (3) **Owner Coaching Toolkit:** Built `CoachToolsDialog.tsx` on the Admin Students tab so academy owners can mark attendance, log performance evaluations, and record passport achievements directly. (4) **Atomic Academy Rename Cascade:** Created `lib/academy/renameCascade.ts` using MongoDB `arrayFilters` by `academyId` to atomically update denormalised academy names across `Passport.academyHistory`, `Passport.records`, and `Achievement` collections. (5) **Per-Academy Financial Books:** Extended `/api/admin/finance-analytics` with super-admin `?academyId=` filtering to inspect individual academy net earnings in `FinanceDashboard`.
- **Phase 22 (Systemic Route Logging Audit & Final Tenant Scoping):** (1) **Zero Silent 500s:** Audited all 115 API route handlers and added structured `console.error` logging across 52 silent catch blocks (73 total log lines), guaranteeing full error visibility for server issues. (2) **Tenant Scoping Completion:** Hardened `/api/academy/[id]/members` with `academyId` scoping checks to prevent unauthorized cross-tenant roster access. (3) **Integration Verification:** Verified the rename cascade, endpoint authentication, and discovery filters live against MongoDB Atlas.
- **Phase 23 (Ledger Basis Alignment, Razorpay Route Settlement UI & Go-Live Runbook):** (1) **Ledger Reconciliation:** Reconciled owner transaction ledger in `FeesManagement.tsx` with `FinanceDashboard` KPIs to report `academyAmountPaise` (net academy earnings) rather than `amount` (parent gross charge), eliminating ledger discrepancies. (2) **Razorpay Route Management:** Built `SettlementPanel.tsx` in Super Admin Revenue tab for explicit linking and validation of academy `rzp_account` (`acc_...` format validation) with live payout status badges (`Automatic` vs `Manual Payout`). (3) **Local Job Scheduler:** Created `scripts/local-cron.js` (`npm run cron:local` / `cron:once`) to reliably poll `POST /api/jobs/tick` for self-hosted environments. (4) **Production Go-Live Runbook:** Authored `docs/GO-LIVE-REAL-ACADEMIES.md` detailing step-by-step onboarding, Razorpay Route linked account verification, webhook configuration, and pre-launch checklists.
- **Phase 24 (Brand Identity Looks, Logo Palette Extractor & Mobile Canvas Sheet):** (1) **Identity Looks System:** Built `lib/branding/looks.ts` (12 unit tests) with 8 curated preset identities (Heritage, Matchday, Clubhouse, Academy Pro, Sunrise, etc.) fully WCAG AA contrast compliant. (2) **Logo Palette Extraction:** Built `lib/branding/logoPalette.ts` (15 unit tests) to extract primary and accent hex codes directly from uploaded academy logos using canvas sampling with alpha filtering, saturation floors, and contrast enforcement. (3) **Mobile Branding Canvas:** Fixed hover-only mobile bug in `AcademyCanvasEditor.tsx` by making section toolbars visible below `xl` and converting the controls panel into a responsive 62svh bottom sheet on mobile viewports.



