# KarMetra — National Employment, Skills & Hiring Platform

KarMetra is an integrated enterprise employment ecosystem connecting job seekers, certified skill academies, and verified corporate recruiters across India.

---

## 1. System Architecture Overview

KarMetra is architected as a modular platform with dedicated, high-speed interfaces for candidates, recruiters, administrators, and the public, backed by a unified REST API and shared database.

```
                               ┌────────────────────────┐
                               │       GoDaddy DNS      │
                               │      (karmetra.in)     │
                               └───────────┬────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│   Netlify Site 1 │             │   Netlify Site 2 │             │   Netlify Site 3 │
│  (Candidate App) │             │ (Recruiter Suite)│             │  (Admin Console) │
│  job.karmetra.in │             │recruiter.karmetra│             │ admin.karmetra.in│
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         │   (VITE_API_BASE_URL)          │   (VITE_API_BASE_URL)          │   (VITE_API_BASE_URL)
         └────────────────────────┬───────┴────────────────────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │ Shared Production Backend│
                     │    Node.js / Express     │
                     │  (api.karmetra.in / API) │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │  Production Database     │
                     │   (PostgreSQL / Schema)  │
                     └──────────────────────────┘
```

### Production Domain Topology

| Subdomain | Target Site / Interface | Description & Access Scope |
| :--- | :--- | :--- |
| **`karmetra.in`** | Main Website & Discovery Hub | Public landing page, search, LMS highlights, certificate verification. |
| **`job.karmetra.in`** | Candidate / Job Seeker App | OTP login, ATS resume builder, 1-click apply, course assessments, certificate downloads. |
| **`recruiter.karmetra.in`** | Employer & Recruiter Suite | Job posting, verified applicant pipeline, candidate screening, interview scheduling. |
| **`admin.karmetra.in`** | Admin Operations & Security | Restricted management console. Master Admin OTP & credentials verification. |

---

## 2. Directory Structure

```
├── .env.example              # Template of all environment variables (No secrets committed)
├── .gitignore                # Production ignore rules (Excludes .env, build, dist, logs)
├── netlify.toml              # Netlify build, routing, and security headers configuration
├── package.json              # NPM dependencies and production build scripts
├── public/
│   ├── _redirects            # Netlify SPA routing fallback rule (/* /index.html 200)
│   └── karmetra-logo.svg     # Official KarMetra vector brandmark
├── server/                   # Shared Production Backend (Express.js)
│   ├── authMiddleware.ts     # JWT session verification & role-based RBAC
│   ├── db.ts                 # Database persistence layer & schema interfaces
│   ├── otp/                  # Secure OTP engine (Fast2SMS, MSG91, Twilio)
│   ├── routes.ts             # REST API routes (Auth, Candidates, Employers, Admin, LMS)
│   ├── seedCategories.ts     # Dynamic job category taxonomies
│   ├── seedGovtJobs.ts       # Central & state government recruitment data
│   └── smsService.ts         # SMS gateway integration & delivery fallback
├── src/                      # Frontend Application (React 19 + TypeScript + Tailwind CSS)
│   ├── components/
│   │   ├── admin/            # Admin console views & domain management
│   │   ├── auth/             # OTP authentication modal & protected route guards
│   │   ├── candidate/        # Job seeker dashboard, applications, learning & resume builder
│   │   ├── common/           # Header, footer, official logo, QR verification, support
│   │   ├── employer/         # Recruiter job posting, talent search & candidate management
│   │   └── landing/          # Public flagship landing page & industry explorer
│   ├── context/              # React AuthContext & state providers
│   ├── locales/              # Multi-language localization (English & Hindi)
│   ├── services/             # Dynamic typed API client (apiClient.ts)
│   ├── types.ts              # Global TypeScript interfaces & data contracts
│   ├── utils/                # Domain & subdomain resolver (domainConfig.ts)
│   ├── App.tsx               # Main routing orchestrator
│   └── main.tsx              # React DOM entry point
└── server.ts                 # Backend server entry point (supports local dev + Vite SSR)
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in your deployment environment. **Never commit `.env` or secret keys to GitHub.**

### A. Frontend Environment Variables (Safe for Netlify)

Configure these in your Netlify site dashboards (**Site settings → Environment variables**):

| Variable | Required For | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | All Netlify Sites | `https://api.karmetra.in` | Base URL of your shared backend API |
| `VITE_DEFAULT_PORTAL` | Netlify Sites 1, 2, 3 | `candidate` / `employer` / `admin` | Sets the default active portal for that Netlify site |
| `VITE_PUBLIC_APP_URL` | Main Site | `https://karmetra.in` | Canonical URL of public landing hub |
| `VITE_CANDIDATE_APP_URL` | Candidate Site | `https://job.karmetra.in` | Canonical URL of candidate portal |
| `VITE_RECRUITER_APP_URL` | Recruiter Site | `https://recruiter.karmetra.in` | Canonical URL of recruiter portal |
| `VITE_ADMIN_APP_URL` | Admin Site | `https://admin.karmetra.in` | Canonical URL of admin portal |

### B. Backend Environment Variables (Server-Only Secrets)

Configure these on your backend host (e.g. Render, Railway, Cloud Run, VPS):

| Variable | Category | Description |
| :--- | :--- | :--- |
| `APP_ENV` | Mode | `production` (enforces strict OTP delivery & disables debug info) |
| `NODE_ENV` | Mode | `production` |
| `DATABASE_URL` | Database | PostgreSQL connection string (`postgres://user:pass@host:5432/db`) |
| `JWT_SECRET` | Security | Secret string for HMAC-SHA256 session token signatures |
| `ADMIN_SECRET` | Security | Secondary cryptographic salt for administrative operations |
| `ADMIN_EMAIL` | Admin Auth | Master super-administrator login identifier |
| `ADMIN_PASSWORD` | Admin Auth | Master super-administrator login password |
| `OTP_PROVIDER` | SMS Gateway | `fast2sms` or `msg91` |
| `OTP_DEMO_MODE` | OTP Safety | `false` in production (forces real SMS delivery) |
| `FAST2SMS_API_KEY` | SMS Gateway | Fast2SMS authorization key |
| `MSG91_AUTH_KEY` | SMS Gateway | MSG91 authorization key |
| `GEMINI_API_KEY` | AI Service | Google Gemini API key (kept strictly on server) |

---

## 4. Local Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Steps

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/karmetra.git
   cd karmetra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up local environment**:
   ```bash
   cp .env.example .env
   ```

4. **Start unified development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 5. Production Build

To build the static frontend assets and the bundled backend server:

```bash
npm run build
```

This compiles:
- Frontend static SPA assets into `dist/`
- Backend CommonJS server bundle into `dist/server.cjs`

To test the compiled production build locally:
```bash
npm run start
```

---

## 6. Netlify Frontend Deployment Guide

You can deploy three dedicated Netlify sites (plus the main apex site) from this single repository:

### SITE 1: Candidate App (`job.karmetra.in`)
1. Create a new site in Netlify connected to this GitHub repository.
2. **Build Settings**:
   - Build command: `npm run build:frontend` (or `npm run build`)
   - Publish directory: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://api.karmetra.in` (your backend API URL)
   - `VITE_DEFAULT_PORTAL`: `candidate`
   - `VITE_CANDIDATE_APP_URL`: `https://job.karmetra.in`
4. **Custom Domain**:
   - Add `job.karmetra.in` under **Domain management**.

### SITE 2: Recruiter Suite (`recruiter.karmetra.in`)
1. Create a second site in Netlify connected to the same GitHub repository.
2. **Build Settings**:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://api.karmetra.in`
   - `VITE_DEFAULT_PORTAL`: `employer`
   - `VITE_RECRUITER_APP_URL`: `https://recruiter.karmetra.in`
4. **Custom Domain**:
   - Add `recruiter.karmetra.in` under **Domain management**.

### SITE 3: Admin Console (`admin.karmetra.in`)
1. Create a third site in Netlify connected to the same GitHub repository.
2. **Build Settings**:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://api.karmetra.in`
   - `VITE_DEFAULT_PORTAL`: `admin`
   - `VITE_ADMIN_APP_URL`: `https://admin.karmetra.in`
4. **Custom Domain**:
   - Add `admin.karmetra.in` under **Domain management**.

### MAIN SITE: Discovery & Landing Hub (`karmetra.in`)
1. Create a site for the apex domain `karmetra.in` and `www.karmetra.in`.
2. **Build Settings**:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://api.karmetra.in`
   - `VITE_DEFAULT_PORTAL`: `main`

---

## 7. Shared Backend Deployment

Deploy the Node.js Express backend to a cloud provider (e.g. Render, Railway, AWS ECS, Google Cloud Run, or a VPS).

1. **Build & Start Commands**:
   - Build command: `npm install && npm run build:server`
   - Start command: `node dist/server.cjs`
2. **Configure Backend Environment Variables** from Section 3.B.
3. **CORS Security**:
   The backend automatically validates incoming origins against:
   - `https://karmetra.in`
   - `https://www.karmetra.in`
   - `https://job.karmetra.in`
   - `https://recruiter.karmetra.in`
   - `https://admin.karmetra.in`

---

## 8. GoDaddy Custom Domain & DNS Setup

Log in to your **GoDaddy DNS Management Console** for `karmetra.in`:

| Record Type | Name / Host | Value / Target | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `job` | Netlify Site 1 Target (e.g. `karmetra-job.netlify.app`) | 3600 | Routes `job.karmetra.in` to Candidate App |
| **CNAME** | `recruiter` | Netlify Site 2 Target (e.g. `karmetra-recruiter.netlify.app`) | 3600 | Routes `recruiter.karmetra.in` to Recruiter App |
| **CNAME** | `admin` | Netlify Site 3 Target (e.g. `karmetra-admin.netlify.app`) | 3600 | Routes `admin.karmetra.in` to Admin Console |
| **A** | `@` | Netlify Load Balancer IP (`75.2.60.5` / `99.83.231.189`) | 3600 | Routes `karmetra.in` to Main Landing Hub |
| **CNAME** | `www` | `karmetra.in` | 3600 | Redirects `www.karmetra.in` to apex |
| **CNAME** | `api` | Backend Server Host (e.g. `karmetra-api.onrender.com`) | 3600 | Maps `api.karmetra.in` to Shared Backend |

*(Note: Always verify the exact DNS target provided inside your Netlify site domain dashboard).*

---

## 9. Security & Role-Based Access Control (RBAC)

1. **Role Enforcement on Backend**:
   - Candidate endpoints (`/api/candidate/*`) require tokens with `role: "candidate"`.
   - Recruiter endpoints (`/api/employer/*`) require tokens with `role: "employer"`.
   - Admin endpoints (`/api/admin/*`) require tokens with `role: "admin"` and `adminRole: "MASTER_ADMIN"`.
2. **Zero Plaintext Secrets**:
   - Passwords and master admin tokens are authenticated using cryptographic comparisons.
   - OTP codes are hashed with random cryptographic salts in storage.
3. **Enterprise Helpline & Contact**:
   - Official Helpline: **`9049217304`** (`+91 90492 17304`)
   - Corporate Address: KarMetra Enterprise Hub, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051.

---

## 10. Verification & Quality Checks

Run the following checks before committing code to GitHub:

```bash
# 1. Type-checking and lint validation
npm run lint

# 2. Full production build verification
npm run build
```
