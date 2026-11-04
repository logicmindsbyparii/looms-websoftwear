# 🏭 LOOMUS 2.0 — Enterprise Textile Suite

LOOMUS 2.0 is a production-grade Textile Machine Management & Factory Automation Suite built for modern weaving and spinning mills. It features real-time loom telemetry, centralized automated HMI control, comprehensive inventory tracking, broker order workflows, multilingual operational reporting via WhatsApp, and an enterprise security architecture with RBAC and 2FA.

---

## 🌟 Key Features

- **Production-Grade Authentication**:
  - In-memory 15-minute JWT Access Tokens (zero token storage in `localStorage` to eliminate XSS risks).
  - 7-day Rotating Refresh Tokens stored in secure `httpOnly`, `SameSite=Strict` cookies.
  - Token Family Theft & Reuse Detection: Any replay of an expired or revoked refresh token triggers immediate revocation of all user sessions.
  - Brute-Force & Timing Attack Defense: 5 failed attempts locks the account for 15 minutes; constant-time bcrypt comparison prevents timing attacks.
  - Password Policy & Strength Meter: Requires uppercase, lowercase, number, and special character; rejects common passwords.
  - Two-Factor Authentication (TOTP): Compatible with Google Authenticator, Microsoft Authenticator, and Authy, complete with QR code generation and 8 single-use recovery codes.
  - 30-Minute Inactivity Idle Timeout: Displays a 60-second security warning modal before automated logout.
  - Multi-Tab Session Synchronization: Real-time logout synchronization across all browser tabs via `BroadcastChannel` and storage events.

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access across all 11 mill modules including factory data manager, user account administration, and "View As" read-only portal preview.
  - **Supervisor**: Floor oversight, loom telemetry, shift production quality audits, worker rostering, warp breakage alarms, and WhatsApp shift handovers.
  - **Operator**: High-contrast tactile HMI console, motor speed dials, air-jet nozzle pressure regulation, and one-touch defect callouts.

- **4-Language Native Indian Textile Support**:
  - **English (`en`)**, **Gujarati (`gu`)**, **Hindi (`hi`)**, and **Marathi (`mr`)**.
  - 100% key synchronization verified across all 372 translation keys via automated CI checks (`check-i18n.js`).
  - Native typography powered by Google Fonts: *Noto Sans Gujarati* and *Noto Sans Devanagari*.
  - Full Indian textile locale formatting: Currency (`₹` Lakhs/Crores), Weave Meters (`m`), and Indian standard dates (`DD/MM/YYYY`).

- **Real-Time Factory Floor Telemetry**:
  - Socket.IO live communication for machine metrics (RPM, motor temperature, beam tension, air-jet pressure, picks/min).
  - Synchronized start, stop, pause, and mill-wide emergency stops.

- **Multilingual 1-Click WhatsApp Operations**:
  - Inward Yarn Lot Challans (Supplier, kg, ₹/kg, total).
  - Ready Goods Roll Lot Slips (Fabric quality, rolls, meters, godown rack).
  - Sales Orders & Dispatch Slips (Buyer, broker, meters, advance, balance).
  - Supervisor Shift Handover Reports.
  - Daily Plant Executive Summary for mill owners (Running looms, efficiency %, production meters, yarn valuation, order turnover).
  - Multi-recipient dispatch routing (Admin, Godown, Sales, Registered Broker, or custom number).

---

## 🏗️ Architecture

```
                                 LOOMUS 2.0 TEXTILE SUITE
                                
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           React 18 Frontend                            │
  │   - Vite + Tailwind CSS + Lucide Icons                                 │
  │   - In-Memory JWT Access Token + Auto Refresh Interceptor              │
  │   - LanguageContext (en, gu, hi, mr) with Noto Sans Fonts              │
  │   - Socket.IO Client for Live Floor Telemetry & Alarms                 │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ REST APIs & WebSockets (/api & /socket.io)
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         Node.js / Express Backend                      │
  │   - Layered Architecture: Routes ➔ Controllers ➔ Services ➔ Models     │
  │   - Middlewares: authMiddleware, rbacMiddleware, rateLimiter, helmet   │
  │   - Security: bcrypt (cost 12), otplib TOTP, JWT rotation, auditLog    │
  │   - Socket.IO Server with JWT Handshake & Floor Simulator              │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ Mongoose ORM
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                            MongoDB Database                            │
  │   - Users, RefreshTokens, AuditLogs, Machines, Alarms, Workers         │
  │   - Stock (Yarn), ReadyGoods, Brokers, SalesOrders, Cameras, Settings  │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
loomus-main/
├── backend/
│   ├── src/
│   │   ├── config/             # DB, permissions, JWT & cookie options
│   │   ├── controllers/        # Express controllers (auth, machines, stock, sales, etc.)
│   │   ├── locales/            # en.json, gu.json, hi.json, mr.json error messages
│   │   ├── middlewares/        # auth, rbac, rate limiter, error handler
│   │   ├── models/             # Mongoose schemas (User, Machine, Stock, Alarm, etc.)
│   │   ├── routes/             # REST endpoint routing mounted under /api
│   │   ├── seeds/              # Database seeder (admin, supervisor, operator, initial looms)
│   │   ├── services/           # authService, auditService, socketService, emailService
│   │   ├── utils/              # i18n, password policy, TOTP helper, ApiError/ApiResponse
│   │   ├── app.js              # Express app setup with Helmet, CORS, sanitizers
│   │   └── server.js           # Server bootstrap with Socket.IO
│   ├── tests/                  # Jest + Supertest integration test suite
│   ├── .env                    # Backend environment configurations
│   ├── .env.example            # Reference environment template
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/                # client.js (in-memory token, refresh interceptor)
    │   ├── components/
    │   │   ├── auth/           # LoginScreen.jsx (with 2FA, lockout timer, password policy)
    │   │   ├── common/         # Header, Sidebar, MachineModal, WhatsApp Modals, LanguageSwitcher
    │   │   ├── operator/       # OperatorConsole.jsx (tactile touchscreen HMI)
    │   │   ├── supervisor/     # SupervisorFloor.jsx (floor oversight & shift handover)
    │   │   └── views/          # Dashboard, Machines, Control, Production, Camera, Alarms, etc.
    │   ├── context/            # AppContext.jsx (Preserved 30+ method signatures with real APIs)
    │   ├── i18n/               # LanguageContext.jsx & translations.js (en, gu, hi, mr)
    │   ├── utils/              # formatters.js, whatsapp.js
    │   ├── App.jsx             # RBAC routing, idle timeout modal, session splash
    │   ├── index.css           # Industrial high-contrast styling & Noto font stacks
    │   └── main.jsx
    ├── scripts/
    │   └── check-i18n.js       # Translation completeness checker
    ├── index.html              # Google Fonts (Noto Sans Gujarati & Devanagari)
    ├── vite.config.js          # Vite config with backend proxy for /api and /socket.io
    └── package.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0 or higher running locally on port `27017` (or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Seed the database with initial users & mill inventory
npm run seed

# Run the test suite (Verifies auth, token rotation, lockout, RBAC, domain flows)
npm test

# Start the backend server (Port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify translation integrity across all 4 languages
node scripts/check-i18n.js

# Start Vite development server (Port 5173 with auto-proxy to port 5000)
npm run dev

# Or build for production
npm run build
```

---

## 🔑 Default Seed Credentials

| Role | Username | Password | Access Privileges |
|---|---|---|---|
| **Admin** | `admin` | `Admin@Loomus2026!` | All 11 tabs, user administration, factory data wipe/demo, View As preview |
| **Supervisor** | `supervisor` | `Supervisor@Loomus2026!` | Floor oversight, looms, production logs, alarms, workers, cameras, raw material |
| **Operator** | `operator` | `Operator@Loomus2026!` | Operator touchscreen console, machine telemetry, alarms, production entry |

> **Security Note**: These default credentials are for local development and demonstration. For production deployments, change all passwords immediately or enforce `mustChangePassword=true`.

---

## 🌐 4-Language System Details

LOOMUS 2.0 provides native multilingual support across the entire interface without any page reload:

| Code | Language | Native Name | Script / Font Loaded |
|---|---|---|---|
| `en` | English | English | Inter / Outfit |
| `gu` | Gujarati | ગુજરાતી | Noto Sans Gujarati |
| `hi` | Hindi | हिन्दी | Noto Sans Devanagari |
| `mr` | Marathi | मराठी | Noto Sans Devanagari |

To verify translation parity at any time:
```bash
cd frontend
node scripts/check-i18n.js
```

---

## 📡 Core API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate with username & password; returns user and in-memory access token, sets `httpOnly` refresh cookie.
- `POST /api/auth/2fa/login`: Complete login step with 6-digit TOTP code.
- `POST /api/auth/refresh`: Perform single-flight token rotation; returns new access token and rotating refresh cookie.
- `POST /api/auth/logout`: Revoke current refresh token and clear cookie.
- `POST /api/auth/logout-all`: Invalidate all active sessions for the current user.
- `GET /api/auth/me`: Retrieve currently authenticated user profile.
- `GET /api/auth/sessions`: List active devices and sign-in locations.
- `DELETE /api/auth/sessions/:id`: Revoke session for a specific device.
- `PATCH /api/auth/change-password`: Update password (requires current password).
- `POST /api/auth/forgot-password`: Generate timed password reset token.
- `POST /api/auth/reset-password`: Reset password using one-time token.
- `POST /api/auth/view-as`: (Admin only) Generate temporary read-only token to preview Supervisor or Operator views.

### Domain Modules
- **Machines**: `GET /api/machines`, `POST /api/machines`, `PATCH /api/machines/:id/status`, `POST /api/machines/start-all`, `POST /api/machines/stop-all`, `POST /api/machines/emergency-stop`.
- **Alarms**: `GET /api/alarms`, `PATCH /api/alarms/:id/ack`, `POST /api/alarms/ack-all`, `POST /api/alarms/test`.
- **Workers**: `GET /api/workers`, `POST /api/workers`, `PATCH /api/workers/:id/status`, `DELETE /api/workers/:id`.
- **Stock (Yarn)**: `GET /api/stock`, `POST /api/stock`, `POST /api/stock/:id/movement`, `DELETE /api/stock/:id`.
- **Ready Goods**: `GET /api/ready-goods`, `POST /api/ready-goods`, `DELETE /api/ready-goods/:id`.
- **Brokers**: `GET /api/brokers`, `POST /api/brokers`, `DELETE /api/brokers/:id`.
- **Sales Orders**: `GET /api/sales-orders`, `POST /api/sales-orders`, `PATCH /api/sales-orders/:id/status`.
- **Cameras**: `GET /api/cameras`, `POST /api/cameras`, `PATCH /api/cameras/:id/toggle`, `DELETE /api/cameras/:id`.
- **Production Logs**: `GET /api/production-logs`, `POST /api/production-logs`, `DELETE /api/production-logs/:id`.
- **Factory Data Manager**: `GET /api/data/export`, `POST /api/data/import`, `POST /api/data/load-demo`, `POST /api/data/clear-all` (Requires admin password).

---

## 🔒 Security Hardening

- **Helmet**: Secures HTTP response headers against clickjacking, sniffing, and XSS.
- **Strict CORS**: Origin whitelist bound strictly to `CLIENT_URL`.
- **Rate Limiting**: Tiered rate limiters protect login, 2FA, password reset, and general API endpoints.
- **HPP & Mongo Sanitize**: Prevents HTTP parameter pollution and NoSQL query injection.
- **Zero Credentials in LocalStorage**: No JWTs, passwords, or session tokens are ever written to browser `localStorage`.
- **Audit Logging**: All administrative, security, and state-changing actions are permanently logged with timestamp, user ID, IP address, and user agent.

---

## 👥 Team Collaboration & Git Workflow

### For New Team Members (Getting Started):
1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd loomus-main
   ```
2. **Install Backend Dependencies & Configure Environment**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Ensure MongoDB is running locally or provide remote MONGO_URI in .env
   npm run seed       # Seeds initial Admin, Supervisor, Operator users & 50 looms
   npm run dev        # Starts backend server on http://localhost:5000
   ```
3. **Install Frontend Dependencies & Run**:
   ```bash
   cd ../frontend
   npm install
   npm run dev        # Starts Vite on http://localhost:5173
   ```

### Daily Commit & Sync Workflow:
```bash
# 1. Pull latest changes before starting work
git pull origin main

# 2. Make your edits and commit
git add .
git commit -m "feat/fix: description of your change"

# 3. Push to GitHub so your team gets your updates
git push origin main
```

---

## 📄 License

Proprietary © 2026 LOOMUS 2.0 Textile Suite. Built for industrial textile manufacturing.

