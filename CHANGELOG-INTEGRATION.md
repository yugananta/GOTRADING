# Changelog Integrasi Backend GoTrading (TARAPTI BE)

Catatan perkembangan integrasi frontend admin panel dengan TARAPTI Backend real.

## [1.1.0] - 2026-08-22
### 1. Auth Module & Interceptor
- **Endpoints:** `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- **Status:** Selesai & Terverifikasi (Diperbarui dari prefix `/api/v1/auth/*` menjadi `/api/auth/*`).
- **Keterangan:** Implementasi `AuthContext`, halaman `LoginPage` dengan Tailwind CSS, JWT access & refresh token (simpan di `localStorage`), HTTP request/response interceptor di `httpClient.ts` untuk automatic Bearer token injection dan 401 token refresh queue, serta `ProtectedRoute` wrapper.

### 2. Dashboard Summary
- **Endpoint:** `GET /api/admin/dashboard/summary` (diperbarui dari `/api/v1/dashboard/stats`)
- **Status:** Selesai dengan fallback lokal.
- **Keterangan:** Mengambil statistik ringkasan operasional dan keuangan dari endpoint summary backend.

### 3. User Management
- **Endpoints:** `GET /api/admin/users`, `PATCH /api/admin/users/:id` (body `{ status: 'suspended' | 'active' }`)
- **Status:** Selesai (diperbarui dari `/api/v1/users` & `POST /api/v1/users/:id/suspend`).
- **Keterangan:** Integrasi list user dan update status user via generic PATCH endpoint.

### 4. MT5 Accounts
- **Endpoints:** `GET /api/admin/mt5-accounts`, `POST /api/admin/mt5-accounts/:id/resync`
- **Helper Endpoints:** `GET /api/admin/mt5-accounts/:id/analytics`, `GET /api/admin/mt5-accounts/:id/transactions`
- **Status:** Selesai (diperbarui dari `/api/v1/trading-accounts` & `/api/v1/trading-accounts/:id/sync`).
- **Keterangan:** Sinkronisasi akun trading MT4/MT5 dan helper query analytics/transactions.

### 5. IB & Partners
- **Endpoints:** `GET /api/admin/ib`, `PUT /api/admin/ib/tiers`
- **Payouts Endpoints:** `GET /api/admin/ib/payouts`, `PATCH /api/admin/ib/payouts/:id` (body `{ status: 'paid' | 'rejected' }`)
- **Status:** Selesai (diperbarui dari `/api/v1/partners` & `POST /api/v1/partners/:id/commission`).
- **Keterangan:** Pengelolaan jaringan IB, tier rate, dan approval payout IB.

### 6. Audit Logs
- **Endpoint:** `GET /api/admin/logs/audit` (diperbarui dari `/api/v1/audit-logs`)
- **Status:** Selesai.
- **Keterangan:** Audit trail aktivitas admin yang terhubung ke backend logging.

### 7. Settings Module
- **Endpoints:** `GET /api/admin/settings`, `POST /api/admin/settings` (diperbarui dari `/api/v1/settings` dan method `PUT` diganti `POST`)
- **Status:** Selesai.
- **Keterangan:** Pengaturan parameter operasional global platform.

### 8. Broadcast (WA & Email)
- **Endpoint:** `POST /api/admin/broadcast` (body dengan discriminator `{ channel: 'whatsapp' | 'email', ...payload }`)
- **Status:** Selesai (menggabungkan `/api/v1/marketing/wa-blast` & `/api/v1/marketing/email-blast`).
- **Keterangan:** Peluncuran kampanye broadcast WhatsApp dan Email terpadu melalui satu endpoint broadcast.

---

## Modul yang Sementera Disembunyikan (Menunggu Endpoint BE):
1. **Trading Health**: Disembunyikan dari navigasi `Sidebar.tsx`. Komponen `TradingHealthView` tetap dipertahankan.
2. **Finance Global Transactions**: Disembunyikan dari navigasi `Sidebar.tsx`. Transaksi spesifik akun dapat diakses via `/api/admin/mt5-accounts/:id/transactions`. Komponen `FinanceView` tetap dipertahankan.
3. **API & Integrations**: Disembunyikan dari navigasi `Sidebar.tsx`. Komponen `IntegrationsView` tetap dipertahankan.

