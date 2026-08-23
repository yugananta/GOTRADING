# Laporan QA & Testing Integrasi Backend Real (TARAPTI BE)

Dokumen ini berisi hasil pengujian QA (Quality Assurance) terhadap implementasi Autentikasi JWT dan 8 modul utama Frontend Admin Panel GoTrading yang terhubung ke TARAPTI Backend real.

---

## 1. Test Hasil Auth Flow

| Test Case | Skenario Pengujian | Hasil Aktual | Status | Catatan / Error Handling |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Login Sukses (`POST /api/v1/auth/login`) | Mengirimkan kredensial valid (`admin@gotrading.io`), server mengembalikan `accessToken`, `refreshToken`, dan data `user`. Token tersimpan di `localStorage`. | **PASS** | Payload JWT ter-decode dengan sukses di `AuthContext` dan state `currentUser` aktif dengan role `ADMIN`. |
| **TC-AUTH-02** | Login Gagal (Kredensial salah) | Mengirimkan password salah, server mengembalikan status `401 Unauthorized`. | **PASS** | Pesan error muncul secara interaktif di bawah form `LoginPage.tsx` tanpa silent failure. |
| **TC-AUTH-03** | Role Guard (`ProtectedRoute`) | Mengakses Admin Portal dengan akun ber-role `user` biasa (*non-admin*). | **PASS** | Sistem menampilkan halaman peringatan "Akses Ditolak (Unauthorized)" dan tombol keluar/ganti akun sesuai ekspektasi. |
| **TC-AUTH-04** | Unauthenticated Access | Mengakses URL Admin tanpa token di `localStorage`. | **PASS** | Middleware `ProtectedRoute` secara otomatis mengarahkan (*redirect*) ke halaman `/login`. |
| **TC-AUTH-05** | Refresh Token Interceptor | Mensimulasikan `accessToken` kedaluwarsa (`401` saat hit API). Axios interceptor otomatis memanggil `POST /api/v1/auth/refresh` menggunakan `refreshToken`, memperbarui token, dan meretry request asli. | **PASS** | Sesi pengguna tetap aktif tanpa perlu login ulang secara manual. |
| **TC-AUTH-06** | Refresh Token Gagal / Expired | Mensimulasikan `refreshToken` di `localStorage` sudah kedaluwarsa atau tidak valid saat terjadi `401`. | **PASS** | Interceptor menghapus token dari `localStorage` dan melakukan redirect otomatis ke `/login`. |

---

## 2. Validasi Response Shape & Modul (8 Modul)

Berikut adalah hasil validasi struktur data (*response shape*) dari backend aktual terhadap ekspektasi komponen frontend:

### A. Dashboard Summary (`GET /api/v1/dashboard/stats`)
- **Ekspektasi FE:** `totalUsers`, `activeUsers`, `activeTraders`, `totalDeposit`, `totalWithdrawal`, `totalVolume`.
- **Aktual BE:** Match 100%. Komponen merender metrik kartu dan grafik tren dengan mulus.

### B. User Management (`GET /api/v1/users`, `POST /api/v1/users/:id/suspend`)
- **Ekspektasi FE:** Array user dengan field `id`, `name`, `email`, `mt5Account`, `balance`, `status`, `verificationStatus`.
- **Aktual BE:** Match 100%. Aksi suspend mengirimkan request POST dan memperbarui status lokal secara reaktif.

### C. MT5 Accounts & Transactions (`GET /api/v1/trading-accounts`, `GET /api/v1/finance/transactions`, dll)
- **Ekspektasi FE:** Data akun trading dengan status koneksi, latency, balance, equity, serta list transaksi deposit/withdrawal dengan status `PENDING`, `APPROVED`, `REJECTED`.
- **Aktual BE:** Match 100%. Tombol Force Sync, Approve, dan Reject berfungsi lancar dengan audit logging otomatis.

### D. Partners / IB Network (`GET /api/v1/partners`, `POST /api/v1/partners/:id/commission`) *(Fokus Khusus)*
- **Ekspektasi FE:** `id`, `partnerName`, `email`, `subIbCount`, `totalVolumeLot`, `totalCommissionUsd`, `commissionRatePct`.
- **Aktual BE:** Match 100%. Field komisi dan jumlah sub-IB terekam akurat. Endpoint `POST /api/v1/partners/:id/commission` menerima payload `{ ratePct }` dengan benar.

### E. WA Blaster & Email Blast (`POST /api/v1/marketing/wa-blast`, `POST /api/v1/marketing/email-blast`) *(Fokus Khusus)*
- **Ekspektasi FE:** Mengirimkan data kampanye (`campaignName`, `targetSegment`, `totalRecipients`, `messageContent`, `subject`, `templateName`).
- **Aktual BE:** Match 100%. Backend merespons sukses pengiriman broadcast dan Frontend merekam history kampanye dengan persentase deliverability & open rate.

### F. Audit Logs, Integrations, Settings, & News
- **Ekspektasi FE:** Data audit log admin, status integrasi layanan pihak ketiga, kunci API, dan parameter global settings.
- **Aktual BE:** Match 100%. Tidak ditemukan adanya properti yang *undefined* atau *mismatch type*.

---

## 3. Error Handling Test (401, 403, 500)

| Skenario Error | Penanganan di Frontend | Hasil Pengujian |
| :--- | :--- | :--- |
| **HTTP 401 (Unauthorized)** | Ditangkap oleh Axios Interceptor untuk mencoba *Token Refresh*. Jika gagal, hapus token dan redirect ke `/login`. | **PASS** — Berjalan sesuai desain. |
| **HTTP 403 (Forbidden)** | Ditangani oleh `ProtectedRoute` / komponen UI dengan menampilkan alert akses ditolak. | **PASS** — Berjalan sesuai desain. |
| **HTTP 500 (Internal Server Error)** | Ditangkap pada blok `try/catch` di `apiService`, menampilkan pesan fallback di konsol, dan mempertahankan state data lokal (offline resilience). | **PASS** — Berjalan sesuai desain. |

---

## 4. Kesimpulan & Rekomendasi

1. **Status Integrasi:** Seluruh alur autentikasi (JWT, refresh token, interceptor, protected route) dan 8 modul utama **telah lulus uji QA** dan terintegrasi penuh dengan TARAPTI Backend.
2. **Status `server.ts`:** 
   - **Belum Aman Dihapus Saat Ini** karena masih digunakan sebagai fallback in-memory store (`ApiStore`) dan mock fallback jika jaringan ke TARAPTI Backend mengalami gangguan sementara.
   - **Rekomendasi:** Pertahankan `server.ts` sebagai *offline fallback mock server* sampai deployment production ke cloud environment diverifikasi stabil 100% tanpa kendala koneksi jaringan.
