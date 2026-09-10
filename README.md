# Nugroho Store

Marketplace produk digital dengan pembayaran QRIS manual (tanpa payment gateway, tanpa potongan platform).

## Struktur folder

```
nugroho-store/
├── index.html                 # Landing + marketplace
├── pages/
│   ├── product.html           # Detail produk + checkout QRIS
│   ├── become-seller.html     # Daftar jadi penjual
│   ├── create-product.html    # Form buat produk (khusus penjual)
│   ├── dashboard-seller.html  # Notifikasi order + konfirmasi lunas
│   └── dashboard-buyer.html   # Riwayat & status pesanan
├── assets/
│   ├── styles/                # tokens.css, base.css, components.css
│   └── scripts/
│       ├── firebase-config.js
│       ├── auth.js            # Jembatan token dari Admin Auth System
│       ├── products.js
│       ├── orders.js
│       ├── sellers.js
│       ├── navbar.js
│       └── ui.js
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```

## Cara jalan (development)

Karena semua pakai ES Modules (`type="module"`), buka lewat server lokal, bukan `file://`:

```bash
npx serve .
# atau
python3 -m http.server 5500
```

## Deploy ke Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project store-6d392
```

Domain hosting default `store-6d392.web.app`, bisa dipasangkan custom domain (misal `nugroho.store`) lewat Firebase Console → Hosting → Add custom domain.

## Deploy ke Vercel (alternatif)

Karena project ini murni file statis (HTML/CSS/JS, tanpa backend/API sendiri), Vercel bisa langsung menampungnya tanpa perlu proses build apa pun:

1. Push folder `nugroho-store/` ke repo Git (GitHub/GitLab/Bitbucket).
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo ini.
3. Vercel akan mendeteksi `vercel.json` (sudah disiapkan, `framework: null`) dan langsung men-serve semua file apa adanya — tidak perlu isi Build Command atau Output Directory secara manual.
4. **Tidak perlu Environment Variables sama sekali** di sini — `apiKey` Firebase memang aman ditaruh langsung di kode frontend (lihat penjelasan di `assets/scripts/firebase-config.js`).
5. Deploy. Setelah selesai, update `ADMIN_AUTH_URL` di `assets/scripts/firebase-config.js` supaya menunjuk ke domain **Admin Auth System** kamu (misal `https://admin-auth-system.vercel.app`), lalu redeploy.
6. Firestore Rules, Indexes, dan Storage Rules **tetap harus di-deploy terpisah lewat Firebase CLI** (`firebase deploy --only firestore:rules,firestore:indexes,storage`) — Vercel cuma nge-host file statisnya, bukan konfigurasi Firebase backend-nya.

> Kalau kedua project (Nugroho Store & Admin Auth System) sama-sama di Vercel, pastikan domain masing-masing sudah final dulu sebelum saling isi `ADMIN_AUTH_URL` / `STORE_URL`, supaya redirect antar keduanya nyambung dengan benar.

## Bagaimana Nugroho Store "tahu" pengguna sudah login?

Nugroho Store **tidak punya halaman login sendiri**. Login & registrasi ada di project terpisah, **Admin Auth System**. Alurnya:

1. Pengguna klik "Masuk"/"Mulai Berjualan" di Nugroho Store tanpa login → dilempar ke `auth.nugroho.store/login.html?redirect=<url-asal>`.
2. Setelah login sukses, Admin Auth System memanggil backend kecilnya (`server/`) untuk menerbitkan **Firebase custom token**, lalu redirect balik ke Nugroho Store: `nugroho.store/...?authToken=xxxxx`.
3. `assets/scripts/auth.js` di Nugroho Store otomatis menukar `authToken` itu jadi sesi login asli lewat `signInWithCustomToken()`, lalu membersihkan token dari address bar.

Karena kedua project berbagi **project Firebase yang sama** (`store-6d392`), data user (`users`, `sellers`, dst) otomatis konsisten di kedua sisi tanpa perlu sinkronisasi manual.

## Model data Firestore

| Koleksi | Isi | Siapa yang boleh baca | Siapa yang boleh tulis |
|---|---|---|---|
| `users/{uid}` | nama, bio, avatar, no HP, status penjual | pengguna login | pemilik akun |
| `sellers/{uid}` | bio penjual, URL gambar QRIS | pengguna login | pemilik akun |
| `products/{id}` | data publik produk (harga, gambar, deskripsi, dll) — **tanpa** link Drive | publik (produk yang dipublish) | seller pemilik |
| `products_private/{id}` | link Google Drive produk | **hanya** seller pemilik | seller pemilik |
| `orders/{id}` | status transaksi & jejak waktu | buyer atau seller terkait | lihat `firestore.rules` — transisi status dibatasi ketat |
| `support_tickets/{id}` | pesan ke CS dari Admin Auth System | tidak bisa dibaca dari client | siapa saja bisa membuat (create-only) |

Lihat komentar di `firestore.rules` untuk detail kenapa setiap aturan dibuat begitu — terutama soal kenapa link Google Drive disimpan terpisah dari data produk publik, dan kenapa transisi status order dibatasi per-langkah (pembeli hanya bisa mengubah ke `menunggu_konfirmasi`, seller hanya bisa mengubah ke `lunas`).

## Yang perlu kamu sesuaikan sebelum deploy sungguhan

- `assets/scripts/firebase-config.js` → `ADMIN_AUTH_URL`: ganti ke domain asli Admin Auth System kamu.
- `admin-auth-system/assets/scripts/firebase-config.js` → `AUTH_BRIDGE_API` & `STORE_URL`.
- Deploy `firestore.rules`, `firestore.indexes.json`, dan `storage.rules` ke project Firebase (satu project dipakai bersama oleh kedua codebase).
- Untuk produksi, pertimbangkan menambah **Cloud Function terjadwal** yang otomatis menandai order `menunggu_bayar` yang sudah lewat 30 menit jadi `kedaluwarsa` (saat ini deteksi kedaluwarsa hanya dihitung di sisi tampilan/client, belum mengubah data di server).
- Gambar produk/QRIS/avatar sudah dikompres di browser sebelum upload ke Storage untuk menghindari file besar & limit 1 MiB dokumen Firestore (karena hanya URL yang disimpan di Firestore, bukan base64).
