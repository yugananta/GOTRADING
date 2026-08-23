# Laporan Analisis & Integrasi: GoTrading Admin Panel vs Backend

Laporan ini menyajikan hasil audit mendalam terhadap struktur Backend GoTrading (`server.ts`) dan Frontend Admin Panel (`src/`), serta pemetaan gap untuk persiapan integrasi production.

---

## 1. Analisis Backend GoTrading (`server.ts`)

### A. Status Endpoint Auth (Login, Register, Refresh Token, Logout)
* **Status di Backend (`server.ts`):** **BELUM ADA**.
* **Detail:** Saat ini backend Express di `server.ts` tidak menyediakan satupun endpoint autentikasi seperti `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, maupun `/api/auth/logout`.
* **Dampak:** Sesi admin saat ini sepenuhnya disimulasikan di frontend melalui state lokal (`initialAdmins`).

### B. Mekanisme Token & Keamanan Sesi
* **Status:** **BELUM DIIMPLEMENTASIKAN**.
* **Detail:** Tidak ada penggunaan JWT (JSON Web Token), token access/refresh, penyimpanan token di `localStorage`, maupun cookie `httpOnly`.
* **Proteksi:** Seluruh permintaan API di `server.ts` terbuka tanpa verifikasi header `Authorization: Bearer <token>`.

### C. Sistem Role & Permission
* **Model Data Admin:** Di `initialState.ts`, terdapat data `initialAdmins` yang memiliki field `role` (contoh: `OWNER`, `ADMIN`, `FINANCE`, `IB_MANAGER`, `SUPPORT`) dan `permissions` (array string).
* **Middleware Validasi:** Di tingkat Express server (`server.ts`), **tidak ada middleware guard** yang memeriksa role atau permission tersebut saat endpoint dipanggil. Validasi hak akses saat ini hanya berupa tampilan UI (conditional rendering tombol/menu di frontend).

### D. List Endpoint Admin yang Tersedia di Backend (`server.ts`)

1. **Health Check**
   - **Path:** `GET /api/v1/health`
   - **Response Shape:**
     ```json
     {
       "status": "CONNECTED",
       "serverTime": "2026-08-22T06:00:00.000Z",
       "activeAdmins": 3,
       "mt5Bridge": "CONNECTED",
       "database": "CONNECTED"
     }
     ```

2. **Dashboard Statistics**
   - **Path:** `GET /api/v1/dashboard/stats`
   - **Response Shape:**
     ```json
     {
       "totalUsers": 1540,
       "activeUsers": 1420,
       "newUsers": 12,
       "activeTraders": 480,
       "totalDeposit": 1250000.00,
       "totalWithdrawal": 420000.00,
       "totalVolume": 18450.5,
       "totalPnl": 84200.00,
       "avgWinRate": "58.4",
       "usersAtRisk": 3,
       "systemStatus": { "backendApi": "CONNECTED", "database": "CONNECTED", ... }
     }
     ```

3. **Users Management**
   - **Path:** `GET /api/v1/users` (Response: Array of `UserProfile`)
   - **Path:** `POST /api/v1/users/:id/suspend` (Response: `{ success: true, user }`)

4. **Trading Accounts**
   - **Path:** `GET /api/v1/trading-accounts` (Response: Array of `TradingAccount`)
   - **Path:** `POST /api/v1/trading-accounts/:id/sync` (Response: `{ success: true, account }`)

5. **Trading Health / Risk Sentinel**
   - **Path:** `GET /api/v1/trading-health` (Response: Array of `TradingHealthRecord`)
   - **Path:** `POST /api/v1/trading-health/warning` (Body: `{ userId, note }`, Response: `{ success: true, record }`)

6. **Finance Transactions**
   - **Path:** `GET /api/v1/finance/transactions` (Response: Array of `FinancialTransaction`)
   - **Path:** `POST /api/v1/finance/transactions/:id/approve` (Body: `{ adminName }`, Response: `{ success: true, transaction }`)

7. **Integrations & API Credentials**
   - **Path:** `GET /api/v1/integrations` (Response: `{ integrations, credentials, webhooks }`)
   - **Path:** `POST /api/v1/integrations/:id/test` (Response: `{ success: true, status, latencyMs }`)
   - **Path:** `POST /api/v1/integrations/credentials/rotate` (Body: `{ credId, newKeyHint }`, Response: `{ success: true, credential }`)

8. **Audit Logs & Settings**
   - **Path:** `GET /api/v1/audit-logs` (Response: Array of `AuditLog`)
   - **Path:** `GET /api/v1/settings` & `PUT /api/v1/settings` (Response: `SystemSettings`)

---

## 2. Analisis Frontend Admin Panel GoTrading

### A. Tech Stack
* **Framework:** React 19 + TypeScript, dibangun menggunakan Vite.
* **Styling:** Tailwind CSS (via `@tailwindcss/vite`).
* **Icons & Charts:** `lucide-react` dan `recharts`.
* **State Management & Data Fetching:** 
  - Menggunakan class in-memory `ApiStore` (`src/services/api.ts`) yang berisi array tiruan dari `src/mockData/initialState.ts`.
  - Fungsi `apiService` mencoba melakukan `fetch('/api/v1/...')` ke Express backend; jika gagal/offline, otomatis melakukan fallback ke state lokal `ApiStore`.

### B. Lokasi Dummy Data / Mock Data
* `src/mockData/initialState.ts` (Menampung seluruh data awal: users, trading accounts, trades, health records, journal entries, plans, social posts, campaigns, competitions, transactions, partners, tickets, CMS, integrations, credentials, webhooks, admins, audit logs, WA campaigns, Email campaigns).
* `src/services/api.ts` (Instance `ApiStore` menyimpan mutable state untuk simulasi operasi CRUD di frontend).

### C. Skeleton Auth di Frontend
* **Status:** **BELUM ADA**.
* Tidak ada komponen `LoginPage`, `AuthProvider`, `ProtectedRoute`, ataupun interceptor HTTP untuk token autentikasi. Aplikasi langsung merender `App.tsx` dengan role default `Owner (Master)`.

### D. Konfigurasi Base URL / Env
* Tidak ada variabel environment `VITE_API_BASE_URL` di `.env.example`.
* Komunikasi API menggunakan relative path (`/api/v1/...`) yang di-handle langsung oleh Express middleware di `server.ts` saat mode development maupun production bundling.

---

## 3. Tabel Mapping: [Dummy Data di FE] → [Endpoint BE] → [Status]

| Dummy Data di Frontend (`initialState.ts` / `ApiStore`) | Endpoint Backend yang Sesuai (`server.ts`) | Status Integrasi |
| :--- | :--- | :--- |
| `initialUsers` / User Profile Management | `GET /api/v1/users`, `POST /api/v1/users/:id/suspend` | **Ada di BE** (Sebagian) |
| `initialTradingAccounts` / MT5 Accounts | `GET /api/v1/trading-accounts`, `POST /api/v1/trading-accounts/:id/sync` | **Ada di BE** |
| `initialHealthRecords` / Risk Sentinel | `GET /api/v1/trading-health`, `POST /api/v1/trading-health/warning` | **Ada di BE** |
| `initialTransactions` / Finance & Payouts | `GET /api/v1/finance/transactions`, `POST /api/v1/finance/transactions/:id/approve` | **Ada di BE** |
| `initialIntegrations`, `credentials`, `webhooks` | `GET /api/v1/integrations`, `POST /api/v1/integrations/:id/test`, `POST /api/v1/integrations/credentials/rotate` | **Ada di BE** |
| `initialAuditLogs` / Admin Audit Trail | `GET /api/v1/audit-logs` | **Ada di BE** |
| `defaultSystemSettings` / Global Settings | `GET /api/v1/settings`, `PUT /api/v1/settings` | **Ada di BE** |
| Dashboard Metric Cards (`DashboardView.tsx`) | `GET /api/v1/dashboard/stats` | **Ada di BE** |
| `initialTrades` / Trading Journal & History | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialPlans` / Trading Plans | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialSocialPosts`, `initialSocialReports` / Social Media | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialCampaigns` / Marketing Campaigns | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialCompetitions`, `initialParticipants` | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialPartners` / IB & Sub-IB Network | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialTickets` / Support Helpdesk | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialCMSContent` / CMS & Banner Management | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialWaCampaigns` / WA Blaster | *Belum ada endpoint khusus* | **Belum ada di BE** |
| `initialEmailCampaigns` / Email Blast | *Belum ada endpoint khusus* | **Belum ada di BE** |

---

## 4. Gap List (Endpoint yang Dibutuhkan Admin Panel tapi Belum Ada di BE)

1. **Authentication & Authorization Endpoints:**
   - `POST /api/v1/auth/login` (Autentikasi admin & penerbitan token)
   - `POST /api/v1/auth/refresh` (Refresh token session)
   - `POST /api/v1/auth/logout` (Revoke session)
   - `GET /api/v1/auth/me` (Validasi token & get current admin info + permissions)
2. **Partners / IB Network Endpoints:**
   - `GET /api/v1/partners` & `POST /api/v1/partners/:id/commission`
3. **Trading Journal & Plans Endpoints:**
   - `GET /api/v1/trading-journal`, `GET /api/v1/trading-plans`
4. **Marketing & Blaster Endpoints:**
   - `POST /api/v1/marketing/wa-blast`
   - `POST /api/v1/marketing/email-blast`
   - `GET /api/v1/marketing/campaigns`
5. **Support Helpdesk & Competitions Endpoints:**
   - `GET /api/v1/support/tickets`, `PATCH /api/v1/support/tickets/:id`
   - `GET /api/v1/competitions`

---

## 5. Rekomendasi Urutan Implementasi

Untuk mempersiapkan aplikasi menuju *production-ready* bersama client, disarankan mengikuti tahapan berikut:

1. **Tahap 1: Implementasi Sistem Autentikasi Backend & Frontend**
   - Buat endpoint `/api/v1/auth/login`, `/logout`, dan `/me` di Express backend dengan enkripsi password (bcrypt) dan JWT / Cookie httpOnly.
   - Buat halaman `LoginPage.tsx` dan `AuthContext` di frontend untuk membatasi akses sebelum masuk ke Dashboard.
   - Tambahkan middleware `authenticateToken` pada seluruh rute `/api/v1/*`.

2. **Tahap 2: Ekspansi Endpoint CRUD untuk Modul Pendukung**
   - Tambahkan endpoint backend untuk modul yang saat ini datanya masih murni di frontend (`Partners/IB`, `WA Blaster`, `Email Blast`, `Trading Journal`, `Support Tickets`, `Competitions`).

3. **Tahap 3: Migrasi dari In-Memory Array ke Database Riil (Supabase / PostgreSQL)**
   - Ganti variabel array di `server.ts` dengan query ORM / Supabase Client (`@supabase/supabase-js`) sehingga data persisten dan aman.

4. **Tahap 4: Integrasi MTS Bridge Live WebSocket / REST API**
   - Ganti simulasi `syncTradingAccount` dan `tradingHealth` agar terhubung langsung ke MT5 Manager API / Gateway Bridge yang sebenarnya.
