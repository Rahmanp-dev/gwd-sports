# MasterGrade

MasterGrade is a comprehensive sports academy management system designed to streamline administration, tracking, and communication between admins, trainers, and students.

## How To Setup Locally

Follow these steps to get the project up and running on your local machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (Running locally or an Atlas connection URI)

### Installation

1. Install dependencies for the root, frontend, and backend concurrently from the root directory:
```bash
npm run install:all
```

2. Setup the backend environment variables:
```bash
cd backend
cp .env.example .env
```
*Make sure to update the `.env` file with your actual `DB_URI` and JWT secret keys, then return to the root directory.*

### Running the Application

From the root directory, start both development servers concurrently:
```bash
npm run dev
```
The frontend should now be running at `http://localhost:5173` and the backend at `http://localhost:3000`.

---

## Tech Stack

### Frontend
- **Core Framework:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Shadcn UI, Radix Primitives
- **Animations:** Framer Motion
- **State Management & Fetching:** React Query, Redux Toolkit
- **Icons:** Lucide React
- **Charts:** Custom SVG-based charting (no external chart library dependency)

### Backend
- **Core Framework:** Node.js, Express.js, TypeScript
- **Database:** MongoDB, Mongoose ODM
- **Validation:** Zod, express-validator
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Payments:** Razorpay Integration

---

## Cutting-Edge Features

### 🚀 Technology
- **End-to-End Type Safety:** Strict TypeScript interfaces bridge the gap between Mongoose schemas and React components, virtually eliminating runtime type errors.
- **Modern Build Tooling:** Leveraging Vite for lightning-fast Hot Module Replacement (HMR) and highly optimized production builds.
- **Scalable Architecture:** Clean MVC (Model-View-Controller) architecture strictly followed in the backend, ensuring maintainability as the system grows.

### 🛠️ Implementation
- **Role-Based Workspaces:** Dedicated, purpose-built dashboards for Admins, Trainers, and Students ensuring personalized user experiences.
- **Bidirectional Data Relationships:** Advanced REST APIs intelligently sync relationships (such as automatically updating `StudentProfile` logic when a student gets added or removed from an `Academy`).
- **Responsive & Accessible Interfaces:** Mobile-first, completely responsive application interface using Tailwind CSS.
- **Fluid & Contextual Animations:** Premium user experience via Framer Motion—smooth page transitions, dialog popups, staggered list renders, and dynamic UI state changes.

### ⚡ Optimization
- **Smart Data Fetching:** React Query is deeply integrated to handle caching, background synchronization, reducing redundant fetching, and automating state invalidation after mutations.
- **Debounced Interactions:** Instant, non-intrusive API calls during searching and filtering using delayed execution (debouncing), minimizing server load.
- **Database Indexing:** Mongoose schemas heavily annotated with optimized structured indexes ensuring fast query resolutions, even on massively scaled data.
- **Aggregations & Pagination:** Fully paginated API resources reducing initial load times and payloads.

### 🛡️ Security
- **Robust Authentication:** Secure JWT implementation featuring dual-token strategies with rotation concepts.
- **Password Cryptography:** Industry standard safe salting and hashing handled by `bcryptjs`.
- **Strict Input Validation:** Data constraints and payload formats validated robustly via Zod and `express-validator` *before* hitting the controller logic.
- **Role-Based Access Control (RBAC):** Middleware-enforced strict route shielding based on token claims and role hierarchies.

---

## Deployment

### Railway (Production)
The application is deployed on [Railway](https://railway.app/) with separate services for the backend API and frontend static build.

| Service | URL |
|---------|-----|
| Frontend | `https://gwdspm.up.railway.app` |
| Backend API | Set via `VITE_API_BASE_URL` env var |

**Required Environment Variables (Backend):**
| Variable | Description |
|----------|-------------|
| `DB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32 chars, used for access tokens |
| `JWT_REFRESH_SECRET` | Min 32 chars, used for refresh tokens |
| `NODE_ENV` | Set to `production` for Railway |
| `RAZORPAY_KEY_ID` | Optional — Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Optional — Razorpay secret |
| `CORS_ORIGIN` | Optional — comma-separated custom origins |

**Required Environment Variables (Frontend):**
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Full backend API URL (e.g. `https://your-backend.up.railway.app/api`) |
| `VITE_BRAND_NAME` | Global brand name string used across the app (defaults to "MasterGrade") |

---

## Recent Development Log (May 2026)

### Landing Page & Brand Customization
- **Global Branding** — Introduced `VITE_BRAND_NAME` to seamlessly inject custom brand text across the footer, navigation, and auth pages.
- **Hero Section Customization** — Admin dashboard now controls whether the landing page shows a default background video or an interactive image carousel.
- **Dynamic Logo Engine** — Upload a high-quality brand logo directly from the Admin settings:
  - Supports structural alignment choices (Top Left or Middle hero replacement).
  - Built-in circular cropping mode.
  - Granular sizing control via a custom scale slider (50% to 300%).
- **Backend File Handling** — Implemented dedicated Multer endpoints for hero and logo image uploads, serving static assets cleanly while ensuring ES-module path safety (`process.cwd()`).

### Admin Command Center Dashboard
- **`GET /api/admin/dashboard`** — Unified KPI aggregation endpoint providing real-time student demographics, attendance rates with historical trends, financial health metrics, trainer load distribution, and automated "Drop-off Detection" for students absent 7+ days.
- **`CommandCenter.tsx`** — Responsive dashboard component with 4 KPI hero cards, live-data widgets, and actionable drop-off alert system with click-to-contact integration.
- **Top Performers Leaderboard** — Gold/silver/bronze medal ranking with click-to-view student detail dialog showing full performance history with color-coded progress bars.
- **Popular Sports Sidebar** — Visual breakdown of trainer distribution across sports.

### Financial Command Center
- **`GET /api/admin/finance-analytics`** — Deep financial analytics endpoint aggregating:
  - Lifetime, monthly, and quarterly revenue with period-over-period growth
  - Payment status breakdown (success/pending/failed) with collection rate
  - 12-month revenue trend data (gap-filled for missing months)
  - 30-day daily revenue granularity
  - Academy-wise revenue distribution
  - Top paying students with contact details
  - Fee defaulter list with outstanding amounts
  - Average transaction value computation
- **`FinanceDashboard.tsx`** — Rich SVG-based analytics dashboard featuring:
  - 6 KPI hero cards with growth indicators
  - Interactive 12-month revenue bar chart with hover tooltips
  - Daily revenue sparkline area chart
  - Payment status donut chart with amount breakdowns
  - Academy revenue distribution bars
  - Top payers leaderboard with direct contact links
  - Actionable fee defaulter list with phone/email shortcuts

### Cricket Performance Tracking
- **Bowling Strike Rate & Fielding Rating** — Added to student performance evaluations with real-world calculation formulas.
- **Student Performance Dialog** — Click any leaderboard entry to see full performance history with per-category progress bars and evaluator attribution.

### Production Stability Fixes
- **CORS Configuration** — Dynamic origin validation supporting any `*.railway.app` subdomain plus `CORS_ORIGIN` environment variable for custom domains.
- **Proxy Trust** — Added `app.set('trust proxy', 1)` to fix rate limiting on Railway (was blocking all users because it saw the load balancer's IP as a single client).
- **Rate Limiter Tuning** — Auth route limit increased from 5 to 20 attempts per 15-min window for smoother multi-account testing.
- **Razorpay Env** — Made `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` optional with empty defaults so the server boots without payment credentials.
- **TypeScript Build Fixes** — Resolved DTS generation errors by explicit `req.params` casting and Mongoose subdocument type handling.
- **JSX Structure** — Fixed missing `</TabsContent>` closing tags causing Babel parse failures.

### API Architecture Notes
- All dashboard endpoints use complex MongoDB aggregation pipelines server-side to minimize client computation.
- Frontend components are modularized under `frontend/src/components/admin/dashboard/` and `frontend/src/components/admin/fees/`.
- Charts are rendered as pure SVG (no external charting library) for zero-dependency, pixel-perfect control.

---

## Project Structure

```
academy/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env validation (Zod)
│   │   ├── controllers/     # Business logic (admin, payment, event, etc.)
│   │   ├── middleware/       # Auth, rate limiting, validation
│   │   ├── routers/          # Express route definitions
│   │   ├── schemas/          # Mongoose models & interfaces
│   │   └── utils/            # Logger, helpers
│   └── tsup.config.ts        # Build configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/   # CommandCenter, leaderboard
│   │   │   │   └── fees/        # FinanceDashboard, FeesManagement
│   │   │   ├── user/            # Student/trainer profile components
│   │   │   └── ui/              # Shadcn UI primitives
│   │   ├── pages/               # Route-level page components
│   │   ├── services/            # API service layer
│   │   └── store/               # Redux store & slices
│   └── vite.config.ts
└── package.json                 # Root workspace scripts
```
