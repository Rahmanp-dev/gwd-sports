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

### Backend
- **Core Framework:** Node.js, Express.js, TypeScript
- **Database:** MongoDB, Mongoose ODM
- **Validation:** Zod, express-validator
- **Authentication:** JWT (JSON Web Tokens), bcryptjs

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

