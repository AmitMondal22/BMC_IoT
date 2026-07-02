# Milk BMC IoT Monitoring Platform — Implementation Plan

## Overview

Build a full-stack Industrial IoT platform for monitoring Bulk Milk Coolers (BMCs) across dairy collection centers. The system ingests MQTT telemetry, stores time-series data, generates alerts, and provides real-time dashboards across Web Admin, Web User, and Android platforms.

> [!IMPORTANT]
> This is a very large system. We will build it incrementally across 5 phases, starting with the backend foundation and working toward full feature parity. Each phase produces a working, testable system.

---

## Phase 1 — Foundation (Current Focus)

### Goal
Project setup, authentication, organization hierarchy, user management, theming, and database schemas.

---

### 1.1 Backend Setup

#### [NEW] `backend/package.json`
- Fastify framework with plugins: `@fastify/cors`, `@fastify/jwt`, `@fastify/swagger`, `@fastify/rate-limit`, `@fastify/multipart`
- Database: `pg` (PostgreSQL), `influxdb-client`, `ioredis` (DragonflyDB-compatible)
- Validation: `joi`
- Auth: `bcrypt`, `jsonwebtoken`
- Logging: `pino`
- Email: `nodemailer`
- MQTT: `mqtt`
- Queue: `bullmq`

#### [NEW] `backend/src/server.js`
- Fastify app entry point with plugin registration, route loading, graceful shutdown
- Environment-based configuration
- Swagger documentation at `/docs`

#### [NEW] `backend/src/config/index.js`
- Centralized config from `.env`: DB credentials, JWT secret, MQTT broker, InfluxDB, DragonflyDB, SMTP

#### [NEW] `backend/src/config/database.js`
- PostgreSQL connection pool (`pg.Pool`)
- InfluxDB client initialization
- DragonflyDB (Redis-compatible) client

#### [NEW] `backend/.env.example`
- Template for all environment variables

---

### 1.2 Database Schema (PostgreSQL)

#### [NEW] `backend/src/database/migrations/001_initial_schema.sql`

**Tables:**

| Table | Key Columns |
|-------|-------------|
| `organizations` | id, name, logo, created_at |
| `regions` | id, org_id, name, code |
| `sub_regions` | id, region_id, name, code |
| `routes` | id, sub_region_id, name, code |
| `users` | id, org_id, name, email, password_hash, phone, role (super_admin/user), status |
| `user_assignments` | id, user_id, region_id, sub_region_id, route_id |
| `devices` | id, org_id, route_id, device_code, device_name, tank_capacity, min_tank_volume, set_temperature, diesel_consumption, alert_mobiles[], firmware, hardware_version, status, last_seen |
| `device_calibration` | id, device_id, type (temp/volume), offset, slope, created_by |
| `alerts` | id, device_id, type, severity, message, acknowledged, acknowledged_by, created_at |
| `alert_config` | id, org_id, alert_type, threshold, enabled, notification_channels[] |
| `audit_logs` | id, user_id, action, entity, entity_id, details, ip, created_at |
| `settings` | id, org_id, key, value |
| `email_config` | id, org_id, smtp_host, smtp_port, smtp_user, smtp_pass, from_email |
| `mqtt_config` | id, org_id, broker_url, username, password, client_id |

#### [NEW] `backend/src/database/seed.js`
- Default super admin user
- Sample organization, region, sub-region, route

---

### 1.3 Authentication Service

#### [NEW] `backend/src/modules/auth/auth.routes.js`
- `POST /api/auth/login` — Email + password login, returns JWT
- `POST /api/auth/otp/request` — Send OTP (for Android)
- `POST /api/auth/otp/verify` — Verify OTP
- `POST /api/auth/refresh` — Refresh JWT token
- `POST /api/auth/logout` — Invalidate session

#### [NEW] `backend/src/modules/auth/auth.controller.js`
- Login logic, bcrypt compare, JWT sign
- OTP generation & storage in DragonflyDB (60s TTL)
- Session tracking in DragonflyDB

#### [NEW] `backend/src/modules/auth/auth.schema.js`
- Joi validation schemas for all auth endpoints

#### [NEW] `backend/src/middleware/authenticate.js`
- JWT verification middleware
- Role extraction & attachment to request

#### [NEW] `backend/src/middleware/authorize.js`
- Role-based access control middleware
- Permission matrix for super_admin vs user

---

### 1.4 User Management (Admin)

#### [NEW] `backend/src/modules/users/user.routes.js`
- `GET /api/users` — List users (paginated, filterable)
- `POST /api/users` — Create user
- `GET /api/users/:id` — Get user details
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user
- `POST /api/users/:id/reset-password` — Reset password
- `PUT /api/users/:id/assignments` — Assign region/route/device

#### [NEW] `backend/src/modules/users/user.controller.js`
#### [NEW] `backend/src/modules/users/user.service.js`
#### [NEW] `backend/src/modules/users/user.schema.js`

---

### 1.5 Organization Hierarchy Management

#### [NEW] `backend/src/modules/regions/region.routes.js`
- CRUD for regions and sub-regions

#### [NEW] `backend/src/modules/routes/route.routes.js`
- CRUD for routes

Each module follows: `routes.js → controller.js → service.js → schema.js`

---

### 1.6 Frontend — Auth & Layout Shell

#### [MODIFY] `frontend/package.json`
Add dependencies:
- `react-router-dom` — routing
- `axios` — HTTP client
- `recharts` — charting
- `tailwindcss` `@tailwindcss/vite` — styling
- `lucide-react` — icons
- `react-hot-toast` — notifications
- `zustand` — state management
- `dayjs` — date formatting

#### [NEW] `frontend/src/styles/index.css`
- Tailwind CSS imports + custom theme tokens (primary `#ff9900`, secondary `#ff3366`, etc.)
- Dark/Light theme CSS variables
- Industrial dashboard aesthetic

#### [NEW] `frontend/src/store/authStore.js`
- Zustand store: user, token, login(), logout(), isAuthenticated

#### [NEW] `frontend/src/api/client.js`
- Axios instance with JWT interceptor, base URL config, error handling

#### [NEW] `frontend/src/pages/LoginPage.jsx`
- Modern login form with orange/dark theme, animated background
- Email + password fields, form validation

#### [NEW] `frontend/src/layouts/AdminLayout.jsx`
- Collapsible sidebar with navigation
- Top bar with user info, notifications bell, theme toggle
- Content area with breadcrumbs

#### [NEW] `frontend/src/layouts/UserLayout.jsx`
- Simplified sidebar for user role

#### [NEW] `frontend/src/components/common/`
- `Sidebar.jsx` — Navigation sidebar with icons
- `TopBar.jsx` — Header with search, notifications, profile
- `ThemeToggle.jsx` — Dark/Light mode switch
- `ProtectedRoute.jsx` — Auth guard component
- `DataTable.jsx` — Reusable sortable/filterable table
- `Modal.jsx` — Reusable modal dialog
- `Badge.jsx`, `Card.jsx`, `Button.jsx` — UI primitives

#### [NEW] `frontend/src/pages/admin/`
- `UsersPage.jsx` — User listing with CRUD
- `UserFormModal.jsx` — Create/edit user form
- `RegionsPage.jsx` — Region/sub-region management
- `RoutesPage.jsx` — Route management

#### [MODIFY] `frontend/src/App.jsx`
- React Router setup with protected routes
- Admin and User layout wrappers
- Login redirect logic

---

## Phase 2 — MQTT, Devices & Real-time Dashboard

### 2.1 Device Management (Backend)

#### [NEW] `backend/src/modules/devices/`
- Full CRUD for devices
- Device calibration endpoints
- Device assignment to routes
- Bulk device operations
- `device.routes.js`, `device.controller.js`, `device.service.js`, `device.schema.js`

### 2.2 MQTT Consumer Service

#### [NEW] `backend/src/services/mqtt/mqttClient.js`
- Connect to MQTT broker
- Subscribe to `bmc/device/+/telemetry`, `bmc/device/+/status`, `bmc/device/+/heartbeat`
- Parse, validate (Joi), and route messages

#### [NEW] `backend/src/services/mqtt/telemetryProcessor.js`
- Validate device exists
- Apply calibration offsets
- Write to InfluxDB (time-series)
- Update device last_seen in PostgreSQL
- Cache current state in DragonflyDB
- Emit events for alert engine

### 2.3 Dashboard Service (Backend)

#### [NEW] `backend/src/modules/dashboard/`
- `GET /api/dashboard/summary` — Aggregated stats (total, online, offline, alerts, etc.)
- `GET /api/dashboard/devices` — All devices with current status (from DragonflyDB cache)
- `GET /api/dashboard/device/:id/live` — Single device live data
- WebSocket endpoint for real-time push

### 2.4 Frontend — Dashboard & Device Pages

#### [NEW] `frontend/src/pages/DashboardPage.jsx`
- Widget grid: Total Devices, Online, Offline, Milk Volume, Avg Temp, Running Compressors, Running DG, Power Failure, CIP, Dispatch, High Temp
- Auto-refresh via polling or WebSocket
- Animated number counters

#### [NEW] `frontend/src/pages/admin/DevicesPage.jsx`
- Device listing with status indicators
- Add/Edit device modal with calibration fields

#### [NEW] `frontend/src/pages/DeviceDetailPage.jsx`
- Full device telemetry display (all 30+ parameters)
- Real-time updates
- Status indicators with color coding

#### [NEW] `frontend/src/components/dashboard/`
- `StatCard.jsx` — Animated stat widget
- `DeviceStatusGrid.jsx` — Grid of device cards
- `LiveIndicator.jsx` — Pulsing online/offline dot
- `TemperatureGauge.jsx` — Visual temp display
- `TankLevelBar.jsx` — Visual tank fill level

---

## Phase 3 — Alert Engine, Notifications & Android

### 3.1 Alert Engine (Backend)

#### [NEW] `backend/src/services/alerts/alertEngine.js`
- Rule-based alert processing on every telemetry message
- 16 alert types: High Temp, Offline, Power Failure, DG Running, etc.
- Configurable thresholds per organization
- Alert deduplication, auto-acknowledge on recovery
- Write to PostgreSQL alerts table

#### [NEW] `backend/src/services/notifications/notificationService.js`
- Multi-channel dispatch: Web push, Email, FCM (Android)
- Template-based messages

### 3.2 Frontend — Alerts

#### [NEW] `frontend/src/pages/AlertsPage.jsx`
- Alert feed with severity badges
- Acknowledge/dismiss actions
- Filter by type, device, date range

### 3.3 Android App Enhancement

#### [MODIFY] `native_app/` — Multiple files
- OTP login screen
- Dashboard with device summary cards
- Device list with route/sub-region filter
- Device detail screen
- Push notification integration (FCM)
- Snapshot capture & share
- Offline caching with AsyncStorage
- Dark mode support

---

## Phase 4 — Reports, Graphs, Email & Analytics

### 4.1 Reports Service (Backend)

#### [NEW] `backend/src/modules/reports/`
- Daily logbook generation (PDF/Excel/CSV)
- Device reports (hourly/daily/weekly/monthly)
- Dispatch reports
- CIP reports
- Energy reports
- Automated email scheduling via BullMQ

### 4.2 Graphs (Frontend)

#### [NEW] `frontend/src/pages/GraphsPage.jsx`
- Recharts-based: Milk Temp vs Volume, Hourly/Daily Temp, Power Usage, DG Usage, KWH, Volume Trend, Dispatch Trend, CIP Trend, Compressor Hours
- Date range picker, device selector

### 4.3 Email Reports

#### [NEW] `backend/src/services/email/emailService.js`
- SMTP integration via Nodemailer
- Scheduled daily/weekly report emails
- BullMQ recurring jobs

---

## Phase 5 — Optimization, Security & Deployment

### 5.1 Security Hardening
- Rate limiting on all endpoints
- IP restriction middleware
- Comprehensive audit logging
- Input sanitization
- CORS configuration
- Helmet security headers

### 5.2 Performance
- Database indexing optimization
- Query optimization
- DragonflyDB caching layer for hot paths
- Pagination on all list endpoints
- InfluxDB retention policies

### 5.3 Deployment

#### [NEW] `docker-compose.yml`
- Services: backend, frontend, postgres, influxdb, dragonfly, mqtt-broker (Mosquitto)
- Volume mounts, health checks, restart policies

#### [NEW] `Dockerfile.backend`, `Dockerfile.frontend`

### 5.4 Documentation

#### [NEW] `docs/API.md`
- Complete API reference (auto-generated from Swagger)

---

## Proposed File Structure

```
d:\amitelectric\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js
│   │   │   └── database.js
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql
│   │   │   └── seed.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── devices/
│   │   │   ├── regions/
│   │   │   ├── routes/
│   │   │   ├── dashboard/
│   │   │   ├── alerts/
│   │   │   └── reports/
│   │   ├── services/
│   │   │   ├── mqtt/
│   │   │   ├── alerts/
│   │   │   ├── notifications/
│   │   │   └── email/
│   │   ├── utils/
│   │   │   ├── response.js
│   │   │   └── logger.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── dashboard/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── user/
│   │   ├── store/
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
├── native_app/
│   └── (React Native project)
└── docker-compose.yml
```

---

## User Review Required

> [!IMPORTANT]
> **Database Infrastructure**: This plan assumes you have or will set up PostgreSQL, InfluxDB, and DragonflyDB. For development, we can use Docker containers or local installations. Which do you prefer?

> [!IMPORTANT]
> **MQTT Broker**: We need an MQTT broker (e.g., Mosquitto, EMQX, HiveMQ). Do you have one running, or should we include it in a Docker Compose setup?

> [!WARNING]
> **Tailwind CSS**: Your spec requests Tailwind CSS. The default system guideline prefers vanilla CSS, but since you explicitly specified Tailwind, we'll use **Tailwind CSS v4** (latest, compatible with Vite 8). Please confirm.

## Open Questions

> [!IMPORTANT]
> 1. **Do you have existing PostgreSQL, InfluxDB, DragonflyDB, and MQTT broker instances**, or should we set everything up via Docker Compose for local development?
> 2. **What port should the backend API run on?** (Default: 3000)
> 3. **What port should the frontend dev server run on?** (Default: 5173)
> 4. **Do you have Firebase project credentials** for Android push notifications, or should we defer FCM to Phase 3?
> 5. **Should we start with Phase 1 immediately** after your approval?

---

## Verification Plan

### Automated Tests
- `npm test` — Unit tests for auth, user CRUD, validation
- `npm run lint` — ESLint checks

### Manual Verification
- Backend: Swagger UI at `/docs` to test all API endpoints
- Frontend: Login flow → Admin Dashboard → User Management → Region/Route CRUD
- Database: Verify migrations run cleanly, seed data populates correctly
- Each phase will be verified before proceeding to the next
