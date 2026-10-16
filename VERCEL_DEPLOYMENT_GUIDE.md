# 🚀 Vercel Deployment & Environment Configuration Guide
## Hawassa MESOB Public Service Management System

This guide provides the exact configuration and step-by-step instructions to deploy the **Hawassa MESOB** system to **Vercel**.

---

## 📋 Overview of Deployment Architecture

| Component | Technology | Recommended Host | Production URL Example |
|---|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS | **Vercel** (Global CDN) | `https://hawassa-mesob.vercel.app` |
| **Backend API** | Node.js + Express + JWT | **Render / Railway / Vercel Serverless** | `https://hawassa-mesob-api.onrender.com/api` |
| **Database** | PostgreSQL + RLS + Triggers | **Supabase** | `https://[PROJECT-ID].supabase.co` |

---

## 1. 🌐 Frontend Deployment on Vercel (Step-by-Step)

### Step 1: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository: `Hawssa-mesob-F-B`.

### Step 2: Configure Project Settings in Vercel
In the Vercel project configuration screen, set:
- **Framework Preset**: `Vite`
- **Root Directory**: Click `Edit` and select `frontend` *(Important!)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Frontend Environment Variables in Vercel
In the **Environment Variables** section, add:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-backend-api.onrender.com/api` | Base URL pointing to your backend API. *(If testing locally, use your deployed API URL)* |
| `VITE_APP_TITLE` | `Hawassa MESOB Public Service Management System` | Browser tab title |

> ⚠️ **Note on React Router:** The file `frontend/vercel.json` is already configured in this repository with SPA rewrite rules (`/(.*)` → `/index.html`) so that reloading pages (e.g., `/dashboard/mesob-manager`, `/login`) will never return a 404 error.

---

## 2. ⚙️ Backend Deployment (Render / Railway / Serverless)

The backend Express server requires a long-running Node.js process with persistent WebSocket / HTTP connections.

### Backend Environment Variables
In your backend hosting dashboard (e.g. Render, Railway, or Vercel Environment Variables), configure:

| Variable Name | Required | Example / Recommended Value | Description |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations |
| `PORT` | **Yes** | `5000` *(or auto-assigned by host)* | API listening port |
| `SUPABASE_URL` | **Yes** | `https://xyzcompany.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | `eyJhbGciOi...` | Supabase Service Role Secret Key (bypasses RLS for secure server operations) |
| `JWT_SECRET` | **Yes** | `b78e24c3a8f1...` | 64+ char random hex string for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiration duration |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token duration |
| `FRONTEND_URL` | **Yes** | `https://hawassa-mesob.vercel.app` | Your Vercel frontend domain (used for CORS allowlist) |
| `AFRICASTALKING_USERNAME` | No | `sandbox` | Africa's Talking SMS API username |
| `AFRICASTALKING_API_KEY` | No | `atsk_...` | Africa's Talking API key |

---

## 3. 🔐 CORS & Domain Allowlist Protection

The backend CORS configuration in `backend/src/middleware/corsConfig.js` has been pre-configured to automatically allow:
1. `config.frontendUrl` (your custom production Vercel domain).
2. Any `*.vercel.app` preview URL (automatic branch preview deployments).
3. Local development ports (`localhost:5173`, `localhost:5174`, `localhost:3000`).

---

## 4. 🧪 Post-Deployment Verification Checklist

Once deployed to Vercel, verify all 6 roles can log in and view their dashboards:

| Role | Email | Password | Target Dashboard |
|---|---|---|---|
| **Super Admin** | `superadmin@mesobcenter.et` | `SuperAdmin@2026` | `/dashboard/super-admin` |
| **Mesob Manager** | `manager@mesobcenter.et` | `MesobManager@2026` | `/dashboard/mesob-manager` |
| **Institution Manager** | `inst.manager@mesobcenter.et` | `InstManager@2026` | `/dashboard/institution-manager` |
| **Employee** | `employee@mesobcenter.et` | `Employee@2026` | `/dashboard/employee` |
| **Technician** | `tech@mesobcenter.et` | `tech@2026` | `/dashboard/technician` |
| **Customer** | `customer@mesobcenter.et` | `customer@2026` | `/dashboard/customer` |
