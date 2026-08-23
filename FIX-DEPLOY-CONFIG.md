# LAPORAN INVESTIGASI & REKOMENDASI PERBAIKAN BUILD / DEPLOY CONFIG (RAILWAY)

**Dokumen:** `FIX-DEPLOY-CONFIG.md`  
**Target Platform:** Railway / Cloud Deployment  
**Aplikasi:** GoTrading Admin Panel (React 19 + Vite Frontend)

---

## 1. TEMUAN AUDIT & KONDISI SAAT INI

### A. Isi Script di `package.json`
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "clean": "rm -rf dist server.cjs",
    "lint": "tsc --noEmit"
  }
}
```
* **`build`**: Menjalankan `vite build` (menghasilkan folder `dist/` berisi `index.html` dan bundle React) **LALU** meng-compile `server.ts` menjadi `dist/server.cjs` menggunakan `esbuild`.
* **`start`**: Menjalankan `node dist/server.cjs` (Express server dummy).
* **`dev`**: Menjalankan `tsx server.ts` (Express server dengan Vite middleware).

### B. Struktur Project
* **Tipe:** Monolitik tunggal (Single `package.json` yang menggabungkan frontend React Vite di `/src` dan Express mock server di `/server.ts`).
* Tidak ada file konfigurasi Railway khusus (`railway.json`, `nixpacks.toml`, atau `Procfile`). Railway secara default menggunakan buildpack Node.js standar: menjalankan `npm run build` lalu `npm start`.

### C. Fungsi `server.ts`
1. **Mock API Server:** Berisi router Express dengan mock data (`/api/v1/health`, `/api/v1/dashboard/stats`, `/api/v1/users`, `/api/v1/trading-accounts`, dsb).
2. **Static File Serving (di Production):** Pada baris 236–248:
   ```ts
   if (process.env.NODE_ENV !== 'production') {
     const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
     app.use(vite.middlewares);
   } else {
     const distPath = path.join(process.cwd(), 'dist');
     app.use(express.static(distPath));
     app.get('*', (req, res) => {
       res.sendFile(path.join(distPath, 'index.html'));
     });
   }
   ```
3. **Hardcoded Port:** Di baris 30: `const PORT = 3000;` (tidak membaca `process.env.PORT`).

---

## 2. ROOT CAUSE ANALISIS (Kenapa Muncul "Cannot POST /api/v1/auth/login" & Log ApexTrader)

1. **Railway Menjalankan `npm start` (`node dist/server.cjs`)**:
   Saat di-deploy ke Railway, proses start otomatis mengeksekusi `node dist/server.cjs`. Log server mencatat:
   `"ApexTrader Admin Server running on http://0.0.0.0:3000"` karena baris 251 di `server.ts`.
2. **Endpoint Mock Express Mengintersepsi Routing**:
   Karena `server.ts` yang berjalan di port server tersebut, semua request HTTP yang masuk ke domain Railway akan diproses oleh Express di `server.ts`:
   - Jika ada request `POST /api/v1/auth/login` yang terkirim ke domain Railway (bukan ke backend TARAPTI `https://api.gotrading.io`), Express tidak menemukan route tersebut karena route auth tidak didefinisikan di `server.ts`, sehingga mengembalikan respon standar Express:
     ```html
     Cannot POST /api/v1/auth/login
     ```
3. **Issue Hardcoded Port di Railway**:
   Railway memberikan port dinamis melalui environment variable `PORT` (misal `PORT=8080` atau random port). Karena `server.ts` menggunakan hardcoded `PORT = 3000`, aplikasi berpotensi gagal routing / healthcheck jika Railway tidak meng-expose port 3000.
4. **Environment Variable `VITE_API_BASE_URL` Saat Build Time**:
   Vite melakukan embedding variabel environment `VITE_*` pada saat **BUILD TIME** (`vite build`). Jika di Railway Dashboard environment variable `VITE_API_BASE_URL` belum diset ke URL TARAPTI Backend (`https://api.gotrading.io`), frontend akan fallback ke default.

---

## 3. DUA OPSI SOLUSI DEPLOYMENT

Ada 2 pendekatan arsitektur untuk deployment Railway:

### OPSI A: Pure Static Frontend SPA (Rekomendasi Terbaik untuk Frontend Admin)
Karena TARAPTI Backend sudah memiliki server API terpisah (`https://api.gotrading.io`), Frontend Admin Panel idealnya di-deploy murni sebagai Static SPA web app tanpa server dummy Express.

* **Build Command:** `vite build`
* **Start Command:** Menggunakan HTTP static server ringan seperti `serve` atau static site provider Railway:
  ```bash
  npx serve -s dist -l $PORT
  ```
* **Kelebihan:** 
  - Loading super cepat, bebas beban Express overhead.
  - Bebas dari tabrakan route `/api/v1/*` mock data.
  - Semua request API dari React langsung mengarah ke TARAPTI Backend via CORS.

---

### OPSI B: Hybrid Server (Tetap Gunakan `server.ts` tapi Diperbaiki)
Jika tetap ingin mempertahankan `server.ts` sebagai fallback server / production server wrapper:

1. **Perbaikan Port:**
   Ubah `const PORT = 3000;` menjadi:
   ```ts
   const PORT = Number(process.env.PORT) || 3000;
   ```
2. **Perbaikan Environment Node:**
   Pastikan Railway memiliki environment variable `NODE_ENV=production` agar `server.ts` masuk ke blok `express.static(distPath)` dan `res.sendFile(index.html)`.
3. **Proxy / Forwarding API (Optional):**
   Jika ada request `/api/v1/auth/*` yang masuk ke `server.ts`, dapat di-forward langsung ke TARAPTI Backend atau biarkan frontend selalu menggunakan absolute URL `VITE_API_BASE_URL`.

---

## 4. PERUBAHAN KONKRET YANG DIREKOMENDASIKAN (PROPOSAL)

Berikut perubahan minimal yang aman dan tidak merusak logic manapun:

### 1. Update `package.json`
Tambahkan script static preview/start yang mendukung environment variable port Railway:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "serve:static": "vite build && npx serve -s dist -l $PORT",
    "lint": "tsc --noEmit"
  }
}
```

### 2. Update `server.ts` (Fix Port & Production Static Fallback)
```ts
// Ganti baris 30:
const PORT = Number(process.env.PORT) || 3000;

// Ganti baris 251:
console.log(`GoTrading Admin Server running on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
```

### 3. Konfigurasi di Railway Dashboard
Pastikan variabel berikut diset pada menu **Variables** di Railway:
* `NODE_ENV` = `production`
* `VITE_API_BASE_URL` = `https://api.gotrading.io` (atau URL TARAPTI Backend Anda)

---

## 6. 502 BAD GATEWAY ROOT CAUSE & PERBAIKAN

### A. Root Cause 502 Bad Gateway di Railway:
1. **Ambigu Jalur `distPath` Saat Runtime CJS:**
   Ketika `server.cjs` dijalankan di dalam container Railway (`node dist/server.cjs`), `process.cwd()` dapat bervariasi bergantung pada direktori kerja container (`/app`, `/app/dist`, dll). Menggunakan `path.join(process.cwd(), 'dist')` yang kaku dapat menghasilkan path yang salah (`/app/dist/dist`), menyebabkan `res.sendFile()` gagal menemukan `index.html` dan mengembalikan error tanpa callback error handler.
2. **Wildcard Route Syntax di Express 4/5:**
   Penggunaan `app.get('*', ...)` berisiko bentrok dengan perubahan `path-to-regexp` di Express atau mengintersepsi request non-GET.
3. **Ketiadaan Health Check Sederhana untuk Edge Proxy:**
   Edge proxy / load balancer Railway memverifikasi status container melalui probe endpoint dasar. Jika route catch-all gagal merespons, edge proxy langsung memutus koneksi dan menghasilkan response **502 Bad Gateway (5-31ms)**.
4. **Ketiadaan Process Exception Handling:**
   Jika terjadi unhandled rejection atau unhandled exception pada startup, proses Node dapat berhenti secara tiba-tiba tanpa mencetak stack trace yang informatif.

### B. Perbaikan Konkret yang Diterapkan di `server.ts`:
1. **Dynamic Multi-Path Resolution (`resolveDistPath`):**
   Mengecek keberadaan `index.html` di beberapa kandidat path (`process.cwd()/dist`, `__dirname`, `__dirname/../dist`, `dist`) dengan `fs.existsSync()` sehingga selalu menemukan lokasi aset statis yang tepat di container mana pun.
2. **Safe SPA Fallback Middleware:**
   Mengganti `app.get('*')` dengan middleware catch-all:
   ```ts
   app.use((req, res, next) => {
     if (req.method === 'GET' && !req.path.startsWith('/api/')) {
       return res.sendFile(path.join(distPath, 'index.html'), (err) => {
         if (err && !res.headersSent) {
           res.status(500).send('Frontend build not found.');
         }
       });
     }
     next();
   });
   ```
3. **Endpoint Health Check Standar:**
   Menambahkan `GET /health` dan `GET /api/health` yang mengembalikan status `200 OK` untuk Railway Edge Router/Healthcheck.
4. **Request Logging & Process Exception Guards:**
   Menambahkan `[HTTP]` access log untuk setiap request masuk ke Deploy Logs dan exception handlers (`uncaughtException`, `unhandledRejection`) untuk stabilitas proses container.

---

## 7. VITE_API_BASE_URL NOT EMBEDDED IN BUILD ROOT CAUSE & PERBAIKAN

### A. Root Cause:
1. **Bypass AST Static Analysis oleh TypeScript Casting:**
   Di `src/services/httpClient.ts`, deklarasi sebelumnya ditulis sebagai:
   ```ts
   const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://api.gotrading.io';
   ```
   Bundler Vite menggunakan analisis Abstract Syntax Tree (AST) untuk mencari pola token literal `import.meta.env.VITE_*` dan menggantinya dengan nilai string saat `vite build`. Karena penggunaan type cast `(import.meta as any).env?.`, parser Vite mengabaikan token tersebut sehingga menghasilkan ekspresi runtime kosong `Ip = {}, E3 = (Ip == null ? void 0 : Ip.VITE_API_BASE_URL) || "https://api.gotrading.io"`.
2. **Resiko Fallback Hardcoded:**
   Nilai fallback `'https://api.gotrading.io'` menyebabkan browser selalu mengirim request ke URL fallback alih-alih URL backend staging/production yang disetel di Railway Variables (`VITE_API_BASE_URL=https://be-gotrading-production.up.railway.app`).

### B. Perbaikan yang Diterapkan:
1. **Standardisasi Syntax `import.meta.env` di `src/services/httpClient.ts`:**
   ```ts
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
   if (!API_BASE_URL) {
     console.error('[httpClient] VITE_API_BASE_URL is not set. API calls will fail.');
   }
   ```
2. **Penambahan Type Declarations (`src/vite-env.d.ts`):**
   Mendefinisikan `ImportMetaEnv` agar TypeScript compiler mengenali `import.meta.env.VITE_API_BASE_URL` secara aman tanpa casting `as any`.
3. **Verifikasi Bundle Build:**
   Setelah build dengan `VITE_API_BASE_URL="https://be-gotrading-production.up.railway.app"`, bundle JS di `dist/assets/index-*.js` kini terbukti meng-embed literal string:
   ```js
   baseURL: "https://be-gotrading-production.up.railway.app"
   ```

### C. Catatan Integrasi Backend (CORS):
Pastikan server TARAPTI Backend (`https://be-gotrading-production.up.railway.app`) telah mengizinkan origin frontend:
- `https://admin.gotrading.id`
- `http://localhost:3000`
pada header CORS backend (`Access-Control-Allow-Origin`).

