# TARAPTI - Panduan Build Aplikasi Android (APK)

Aplikasi **TARAPTI** telah berhasil dikonfigurasi dengan **Ionic Capacitor** untuk platform Android. Semua file konfigurasi native (`capacitor.config.ts`, `android/` directory, dan package dependencies) sudah disiapkan dan disinkronkan dengan React build terbaru Anda.

Karena container hosting di cloud dioptimalkan khusus untuk pengembangan web dan tidak menyertakan Android SDK/Java JDK secara bawaan, Anda perlu melakukan kompilasi akhir APK di komputer lokal Anda.

Ikuti langkah-langkah mudah berikut untuk membuat file APK:

---

## 📋 Prasyarat di Komputer Lokal Anda
1. **Node.js** (versi 18+)
2. **Java Development Kit (JDK)** versi 17 (disarankan mendownload bersama Android Studio)
3. **Android Studio** (untuk mengelola emulator atau mengekspor APK langsung)

---

## 🚀 Langkah-langkah Kompilasi APK

### Langkah 1: Unduh Kode Proyek Anda
Unduh seluruh kode proyek ini sebagai file **ZIP** melalui menu pengaturan (**Settings > Export to ZIP**) di AI Studio Build, lalu ekstrak ke komputer lokal Anda.

### Langkah 2: Instalasi Dependensi & Sinkronisasi
Buka terminal/command prompt di dalam folder hasil ekstrak proyek tersebut, lalu jalankan perintah berikut:
```bash
# Menginstal semua package pendukung
npm install

# Melakukan kompilasi React dan menyinkronkan file aset web ke folder Android
npm run build
npx cap sync
```

### Langkah 3: Membuat File APK (2 Cara Mudah)

#### Cara A: Menggunakan Command Line (Terminal)
Jalankan perintah pintas yang sudah dikonfigurasi di `package.json`:
```bash
npm run android:build
```
Setelah proses Gradle selesai, file APK Anda akan terbentuk di folder:
📂 `android/app/build/outputs/apk/debug/app-debug.apk`

#### Cara B: Menggunakan Android Studio (Sangat Direkomendasikan)
1. Jalankan perintah berikut untuk membuka proyek di Android Studio secara otomatis:
   ```bash
   npm run cap:open
   ```
   *(Atau buka **Android Studio** -> Pilih **Open** -> Arahkan ke folder `android` di dalam direktori proyek Anda)*.
2. Tunggu Gradle selesai melakukan sinkronisasi otomatis pertama kali.
3. Di menu atas Android Studio, klik: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Android Studio akan mulai merakit APK Anda. Setelah selesai, pemberitahuan akan muncul di sudut kanan bawah dengan tombol **Locate** untuk langsung membuka folder file APK Anda.

---

## 🛠️ Perintah Berguna Lainnya
* **`npm run build`**: Mengompilasi kode React Anda.
* **`npx cap sync`**: Menyalin perubahan UI web terbaru dari folder `dist` ke dalam aplikasi native Android.
* **`npx cap open android`**: Membuka langsung kode Android Anda di Android Studio.
