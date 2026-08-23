# PATH AUDIT REPORT: Frontend vs Backend (TARAPTI) API Endpoints

Berikut adalah audit komprehensif seluruh endpoint yang digunakan di Frontend Admin Panel (`src/services/api.ts`, `src/context/AuthContext.tsx`, `src/services/httpClient.ts`) dibandingkan dengan konfirmasi pola route TARAPTI Backend (`/api/auth/*`, `/api/admin/*`, `/api/metatrader/*`, `/api/news/*`, dll).

---

## 1. Modul Autentikasi (STATUS: SUDAH DIPERBAIKI 100%)

| Modul | Method | Path Lama FE | Path Baru FE (Terkonfirmasi) | Status Konfirmasi | Lokasi File |
|---|---|---|---|---|---|
| **Auth** | POST | `/api/v1/auth/login` | `/api/auth/login` | **TERKONFIRMASI 100%** | `AuthContext.tsx`, `httpClient.ts` |
| **Auth** | POST | `/api/v1/auth/refresh` | `/api/auth/refresh` | **TERKONFIRMASI 100%** | `httpClient.ts` |
| **Auth** | POST | `/api/v1/auth/logout` | `/api/auth/logout` | **TERKONFIRMASI 100%** | `AuthContext.tsx` |
| **Auth** | GET | *(Belum ada di FE)* | `/api/auth/me` | **TERKONFIRMASI 100%** | Tersedia di BE |
| **Auth** | POST | *(Belum ada di FE)* | `/api/auth/register` | **TERKONFIRMASI 100%** | Tersedia di BE |

---

## 2. Audit 8 Modul Admin Panel (STATUS: MEMERLUKAN KONFIRMASI DARI BE REPO)

> ⚠️ **PENTING:** Sesuai instruksi, path pada tabel di bawah ini **BELUM diubah di kode FE** dan dicatat untuk dikonfirmasikan ke repo TARAPTI Backend terlebih dahulu agar tidak terjadi salah tebak nama route/parameter.

| No | Modul Admin | Method | Path Lama FE | Kemungkinan Path BE Berdasarkan Pola `/api/admin/*` | Perlu Konfirmasi | Catatan / Parameter |
|:---:|---|:---:|---|---|:---:|---|
| **1** | **Dashboard** | GET | `/api/v1/dashboard/stats` | `/api/admin/dashboard/summary` | **TIDAK** *(Sudah Dikonfirmasi)* | Mengembalikan total user, volume MT5, komisi, dll. |
| **2** | **Users** | GET | `/api/v1/users` | `/api/admin/users` atau `/api/admin/users/list` | **YA** | Mengambil list seluruh user |
| **2** | **Users** | POST | `/api/v1/users/:id/suspend` | `/api/admin/users/:id/suspend` atau `/api/admin/users/:id/status` | **YA** | Toggle suspend / activate user |
| **3** | **MT5 Accounts** | GET | `/api/v1/trading-accounts` | `/api/admin/mt5-accounts` | **TIDAK** *(Sudah Dikonfirmasi)* | Mengambil list akun MT5 klien |
| **3** | **MT5 Accounts** | POST | `/api/v1/trading-accounts/:id/sync` | `/api/admin/mt5-accounts/:id/sync` atau `/api/metatrader/accounts/:id/sync` | **YA** | Force sync data akun MT5 |
| **3** | **Trading Health** | GET | `/api/v1/trading-health` | `/api/admin/trading-health` atau `/api/metatrader/health` | **YA** | Mengambil monitoring drawdown/risk limit |
| **3** | **Trading Health** | POST | `/api/v1/trading-health/warning` | `/api/admin/trading-health/warning` | **YA** | Kirim notifikasi warning limit risiko |
| **4** | **Finance** | GET | `/api/v1/finance/transactions` | `/api/admin/finance/transactions` atau `/api/admin/transactions` | **YA** | List deposit/withdrawal pending & history |
| **4** | **Finance** | POST | `/api/v1/finance/transactions/:id/approve` | `/api/admin/finance/transactions/:id/approve` | **YA** | Approval deposit / withdrawal |
| **4** | **Finance** | POST | `/api/v1/finance/transactions/:id/reject` | `/api/admin/finance/transactions/:id/reject` | **YA** | Reject deposit / withdrawal |
| **5** | **IB & Payouts** | GET | `/api/v1/partners` | `/api/admin/ib/partners` atau `/api/admin/ib/list` atau `/api/admin/ib` | **YA** | List data Master IB & Sub IB |
| **5** | **IB & Payouts** | POST | `/api/v1/partners/:id/commission` | `/api/admin/ib/:id/commission` atau `/api/admin/ib/commission-rate` | **YA** | Update rate komisi IB share |
| **6** | **Integrations** | GET | `/api/v1/integrations` | `/api/admin/integrations` atau `/api/admin/system/integrations` | **YA** | Status koneksi MT5 Bridge, Gateway, CRM |
| **6** | **Integrations** | POST | `/api/v1/integrations/:id/test` | `/api/admin/integrations/:id/test` | **YA** | Ping / test latency koneksi eksternal |
| **6** | **Integrations** | POST | `/api/v1/integrations/credentials/rotate` | `/api/admin/integrations/credentials/rotate` | **YA** | Rotasi API Key secret |
| **7** | **Audit Logs** | GET | `/api/v1/audit-logs` | `/api/admin/audit-logs` atau `/api/admin/logs` | **YA** | Log aktivitas seluruh admin & sistem |
| **8** | **Settings** | GET | `/api/v1/settings` | `/api/admin/settings` atau `/api/admin/system/settings` | **YA** | Parameter global platform & limit risk |
| **8** | **Settings** | PUT | `/api/v1/settings` | `/api/admin/settings` atau `/api/admin/system/settings` | **YA** | Update konfigurasi global sistem |
| **9** | **Marketing WA** | POST | `/api/v1/marketing/wa-blast` | `/api/admin/broadcast/wa` atau `/api/admin/marketing/wa-blast` | **YA** | Trigger pengiriman WA Blast |
| **10**| **Marketing Email** | POST | `/api/v1/marketing/email-blast` | `/api/admin/broadcast/email` atau `/api/admin/marketing/email-blast` | **YA** | Trigger pengiriman Email Blast |

---

## 3. Modul Ekstra yang Tersedia di Pola BE

Berdasarkan konfirmasi BE:
* `/api/metatrader/*` : Modul engine MT5 / Trading bridge.
* `/api/news/*` : Modul CMS News / Analisa Pasar.
* `/api/calendar/*` : Modul Kalender Ekonomi.
* `/api/community/*` : Modul Social / Feed Komunitas / Diskusi.
