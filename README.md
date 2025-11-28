# Sync Planner PWA - Frontend

Aplikasi web progresif (PWA) untuk Sync Planner yang bisa diakses via HP dan Laptop.

## Fitur

✅ Dashboard harian dengan statistik
✅ Tracking sholat 5 waktu + sunnah
✅ Checklist habit/ritual harian
✅ Input jurnal per jam
✅ Brain dump
✅ Pomodoro timer (25/60/90 menit)
✅ Manajemen goal 12 minggu
✅ Statistik pomodoro mingguan
✅ Responsive design (mobile-first)
✅ Installable (PWA)

---

## Cara Deploy

### Opsi 1: GitHub Pages (GRATIS & Mudah) ⭐ Rekomendasi

1. **Buat akun GitHub** (jika belum punya)
   - Buka https://github.com
   - Sign up

2. **Buat repository baru**
   - Klik tombol "+" → "New repository"
   - Nama: `sync-planner`
   - Pilih "Public"
   - Klik "Create repository"

3. **Upload file**
   - Klik "uploading an existing file"
   - Drag & drop semua file:
     - `index.html`
     - `app.js`
     - `sw.js`
     - `manifest.json`
     - `icon-192.png`
     - `icon-512.png`
   - Klik "Commit changes"

4. **Aktifkan GitHub Pages**
   - Klik tab "Settings"
   - Scroll ke "Pages" di sidebar kiri
   - Source: pilih "main" branch
   - Klik "Save"

5. **Akses aplikasi**
   - Tunggu 1-2 menit
   - URL: `https://[username].github.io/sync-planner`

---

### Opsi 2: Netlify (GRATIS)

1. Buka https://netlify.com
2. Sign up dengan GitHub
3. Klik "Add new site" → "Deploy manually"
4. Drag & drop folder `sync_planner_pwa`
5. Selesai! Dapat URL otomatis

---

### Opsi 3: Vercel (GRATIS)

1. Buka https://vercel.com
2. Sign up dengan GitHub
3. Import repository
4. Deploy otomatis

---

### Opsi 4: Google Drive (Alternatif Sederhana)

1. Upload semua file ke Google Drive
2. Gunakan DriveToWeb (https://drv.tw) untuk hosting
3. Atau gunakan Google Sites embed

---

## Konfigurasi

Setelah deploy, buka aplikasi dan:

1. Klik tab **⚙️ Pengaturan**
2. Pastikan **User ID** sudah benar: `7b53f70b-2793-4b64-98de-32188223c0dc`
3. Pastikan **API URL** sudah benar
4. Klik **Simpan**

---

## Install di HP (PWA)

### Android (Chrome)
1. Buka URL aplikasi di Chrome
2. Tap menu ⋮ (titik tiga)
3. Pilih "Add to Home screen"
4. Beri nama & tap "Add"
5. Icon akan muncul di home screen

### iPhone (Safari)
1. Buka URL aplikasi di Safari
2. Tap icon Share 📤
3. Scroll & tap "Add to Home Screen"
4. Beri nama & tap "Add"
5. Icon akan muncul di home screen

---

## Penggunaan

### Beranda
- **Sholat**: Tap untuk mencatat sholat yang sudah dilaksanakan
- **Habit**: Tap untuk checklist ritual harian
- **Jurnal**: Input catatan per jam
- **Brain Dump**: Tuangkan pikiran random

### Goals
- Lihat goal 12 minggu aktif
- Tambah goal baru
- Lihat progress task

### Statistik
- Lihat statistik pomodoro mingguan
- Streak, total fokus, completion rate

### Pengaturan
- Edit User ID dan API URL jika perlu

---

## Troubleshooting

**"Failed to fetch" atau API Error**
- Cek koneksi internet
- Pastikan API URL benar
- Cek apakah Apps Script masih aktif

**Data tidak update**
- Pull-to-refresh atau reload halaman
- Cek console browser untuk error

**Tidak bisa install di HP**
- Pastikan menggunakan HTTPS
- Gunakan Chrome (Android) atau Safari (iPhone)
- Clear cache browser

---

## Pengembangan Lanjutan

Untuk menambah fitur:

1. Edit `app.js` untuk logika
2. Edit `index.html` untuk tampilan
3. Commit & push ke GitHub
4. GitHub Pages akan auto-update

---

## Tech Stack

- HTML5
- CSS3 (No framework, pure CSS)
- JavaScript (Vanilla JS, no framework)
- PWA (Service Worker)
- Google Apps Script (Backend)
- Google Sheets (Database)

---

## Customization

### Ganti Warna Tema

Edit CSS variables di `index.html`:

```css
:root {
  --primary: #1565C0;      /* Warna utama */
  --primary-dark: #0D47A1; /* Warna utama gelap */
  --success: #2E7D32;      /* Hijau */
  --warning: #F57C00;      /* Orange */
  --danger: #C62828;       /* Merah */
}
```

### Ganti Icon

Buat icon PNG 192x192 dan 512x512, replace file:
- `icon-192.png`
- `icon-512.png`

---

Created for Sync Planner by Firdaus
