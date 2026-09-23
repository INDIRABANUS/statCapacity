# BloodBridge – PS35 Blood Donor Management System
**BIZ HACK'26 Prototype**

A modern MERN stack web application built for **BIZ HACK'26 (Problem Statement PS35: Blood Donor Management System)**. It enables real-time discovery of active, available blood donors, streamlined donor profile management, and comprehensive admin moderation.

---

## Tech Stack

- **Frontend**: React.js 18 + Vite, Tailwind CSS, Lucide Icons, React Router DOM v6, Axios
- **Backend**: Node.js + Express.js
- **Database**: MongoDB / MongoDB Atlas (Mongoose ODM)
- **Authentication & Security**: JWT (JSON Web Tokens), bcryptjs password hashing
- **Architecture**: REST API with role-based access control (`DONOR`, `ADMIN`)

---

## Critical Business Rule

> [!IMPORTANT]
> A donor appears in public search (`GET /api/donors`) **ONLY** when:
> ```js
> status === 'ACTIVE' && availability === 'AVAILABLE'
> ```
> This is strictly enforced at the backend database query level, ensuring users and blood seekers never see inactive or unavailable donors.

---

## Demo Accounts & Seed Data

The application comes pre-configured with a seed script containing realistic demo accounts:

| Role | Email | Password | Status | Availability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@bizhack.com` | `Admin@123` | ACTIVE | N/A | Full moderation & stats access |
| **Donor (Active)** | `rajesh.erode@bizhack.com` | `Donor@123` | ACTIVE | AVAILABLE | Appears in Erode search (O+) |
| **Donor (Active)** | `priya.cbe@bizhack.com` | `Donor@123` | ACTIVE | AVAILABLE | Appears in Coimbatore search (A+) |
| **Donor (Active)** | `karthik.chennai@bizhack.com` | `Donor@123` | ACTIVE | AVAILABLE | Appears in Chennai search (B+) |
| **Donor (Active)** | `ananya.salem@bizhack.com` | `Donor@123` | ACTIVE | AVAILABLE | Appears in Salem search (AB+) |
| **Donor (Unavailable)** | `rahul.chennai@bizhack.com` | `Donor@123` | ACTIVE | UNAVAILABLE | Excluded from public search |
| **Donor (Inactive)** | `arvind.erode@bizhack.com` | `Donor@123` | INACTIVE | AVAILABLE | Deactivated by Admin (Excluded) |

*Tip: The login page includes 1-click Demo Fill buttons for quick testing during judging.*

---

## Features

### 1. Public / Seeker
- **Instant Search**: Filter donors by Blood Group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and Location (e.g. `Erode`, `Coimbatore`).
- **Direct Contact**: Instant 1-click direct calling (`tel:`) and phone number copying.
- **Clear Statuses**: Real-time availability indicator and last donation date counter.
- **Empty States**: Helpful guidance and 24/7 helpline links (108/104) when no donors match.

### 2. Donor Dashboard (`/profile`)
- **Live Readiness Toggle**: 1-click switch between `AVAILABLE` and `UNAVAILABLE`.
- **Profile Maintenance**: Update contact details, city, blood group, and last donation date.
- **Account Health Indicator**: Informs donor if account has been moderated/deactivated.

### 3. Admin Console (`/admin`)
- **Key Metrics Overview**: Total Donors, Active Donors, Search-Ready Available Donors, Inactive Donors.
- **Inventory Breakdown**: Visual blood group distribution and availability ratio.
- **Donor Moderation Table**: Search, filter by status/availability, activate/deactivate accounts, and override donor availability.

---

## API Reference

### Authentication
- `POST /api/auth/register` - Register user & donor profile
- `POST /api/auth/login` - Login with email & password (returns JWT)
- `GET /api/auth/me` - Validate session & get current profile

### Donors (Public & Owner)
- `GET /api/donors` - **Public search** (strictly filtered by `status=ACTIVE&availability=AVAILABLE`, query params: `bloodGroup`, `location`)
- `GET /api/donors/:id` - Fetch single donor details
- `PUT /api/donors/:id` - Update donor profile (Owner/Admin only)
- `PATCH /api/donors/:id/availability` - Toggle availability `AVAILABLE`/`UNAVAILABLE` (Owner/Admin only)

### Admin (Protected: `role=ADMIN`)
- `GET /api/admin/stats` - Summary counters and blood group breakdown
- `GET /api/admin/donors` - List all donors with search & filters
- `PATCH /api/admin/donors/:id/status` - Activate / Deactivate donor (`ACTIVE`/`INACTIVE`)
- `PATCH /api/admin/donors/:id/availability` - Modify availability

---

## Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **MongoDB**: Local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 1. Clone & Setup Backend
```bash
cd backend
npm install
# Copy environment variables
cp .env.example .env
# Seed demo data
npm run seed
# Start backend server (starts on http://localhost:5000)
npm run start
```

### 2. Setup Frontend
In a separate terminal:
```bash
cd frontend
npm install
# Copy environment variables
cp .env.example .env
# Start frontend Vite server (starts on http://localhost:3000)
npm run dev
```

### 3. Run Automated Tests
```bash
cd backend
npm test
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bizhack_blood_donor
JWT_SECRET=bizhack_secret_jwt_key_2026_blood_donor_app
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=/api
```
*(In development, Vite proxies `/api` requests to `http://localhost:5000`)*

---

## Deployment Ready

- **Frontend**: Ready for deployment on **Vercel** (`npm run build` generates `dist/`).
- **Backend**: Ready for deployment on **Render / Railway** with standard `npm start` and environment variables.
- **Database**: Compatible with **MongoDB Atlas** cluster connection strings.
