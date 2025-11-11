# Sistem Pencatatan Barang Pecah PT. Primarindo Argatile

Aplikasi web modern untuk mencatat dan mengelola data barang pecah dengan integrasi database Supabase.

## ✨ Fitur

- ✅ Pencatatan barang pecah dengan detail lengkap
- ✅ Upload foto bukti barang pecah
- ✅ Tracking status (Pending, Investigating, Resolved)
- ✅ Pencarian berdasarkan motif, merk, shading, sizing
- ✅ Dashboard statistik
- ✅ Integrasi database Supabase
- ✅ Upload dan penyimpanan foto di cloud
- ✅ UI modern dan responsive dengan TailwindCSS

## 📋 Data yang Dicatat

- Nama Motif
- Tanggal Kejadian
- Shading
- Sizing
- Ukuran (contoh: 60x60, 40x40)
- Merk
- Kualitas (KW1, KW2, KW3, Reject)
- Quantity (jumlah barang pecah)
- Deskripsi kejadian
- Foto bukti pecah
- Status (Pending, Investigating, Resolved)

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

**PENTING:** Aplikasi ini memerlukan Supabase untuk database dan storage foto.

Ikuti panduan lengkap di file **`SETUP_SUPABASE.md`** untuk:
1. Membuat project Supabase
2. Setup database dan tabel
3. Setup storage untuk foto
4. Mendapatkan API keys
5. Konfigurasi environment variables

**Quick Setup:**

1. Buat project di [https://supabase.com](https://supabase.com)
2. Jalankan query SQL dari file `supabase-setup.sql` di Supabase SQL Editor
3. Buat storage bucket bernama `incident-photos`
4. Buat file `.env` di root folder:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Jalankan Aplikasi

```bash
# Development mode
npm run dev

# Build untuk production
npm run build

# Preview production build
npm preview
```

## 📱 Cara Penggunaan

1. **Tambah Data Pecah Baru**
   - Klik tombol "New Incident"
   - Isi semua field yang diperlukan:
     - Nama Motif
     - Tanggal Kejadian
     - Shading
     - Sizing
     - Ukuran
     - Merk
     - Kualitas (pilih dari dropdown)
     - Quantity
     - Deskripsi
   - Upload foto bukti pecah (opsional, max 5MB)
   - Klik "Submit Incident"

2. **Cari Data**
   - Gunakan search bar untuk mencari berdasarkan motif, merk, shading, atau sizing

3. **Update Status**
   - Klik dropdown status pada setiap data
   - Pilih status baru: Pending, Investigating, atau Resolved

4. **Hapus Data**
   - Klik icon trash (🗑️) pada data yang ingin dihapus
   - Konfirmasi penghapusan

## 🛠️ Teknologi

- **Frontend:**
  - React 18
  - Vite (build tool)
  - TailwindCSS (styling)
  - Lucide React (icons)

- **Backend & Database:**
  - Supabase (PostgreSQL database)
  - Supabase Storage (file storage)
  - Supabase Realtime (opsional)

## 📂 Struktur Project

```
Pencatatan Barang Pecah/
├── src/
│   ├── App.jsx              # Main component
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global styles
│   └── supabaseClient.js    # Supabase configuration
├── public/
├── supabase-setup.sql       # Database schema
├── SETUP_SUPABASE.md        # Setup guide
├── .env.example             # Environment variables template
├── .env                     # Your environment variables (tidak di-commit)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔒 Keamanan

- ⚠️ File `.env` tidak boleh di-commit ke Git
- ⚠️ Untuk production, aktifkan Supabase Authentication
- ⚠️ Update Row Level Security (RLS) policies sesuai kebutuhan
- ⚠️ Batasi ukuran file upload di backend

## 🐛 Troubleshooting

Jika ada masalah:

1. **Data tidak muncul**
   - Cek console browser (F12) untuk error
   - Pastikan `.env` sudah diisi dengan benar
   - Pastikan tabel `incidents` sudah dibuat di Supabase

2. **Upload foto gagal**
   - Pastikan storage bucket `incident-photos` sudah dibuat
   - Pastikan bucket adalah public
   - Cek ukuran file (max 5MB)

3. **Connection error**
   - Pastikan Supabase project aktif
   - Cek URL dan API key di `.env`
   - Restart development server setelah update `.env`

Lihat file `SETUP_SUPABASE.md` untuk troubleshooting lebih lengkap.

## 📞 Support

Untuk pertanyaan dan support, hubungi tim IT PT. Primarindo Argatile.

## 📄 License

Internal use only - PT. Primarindo Argatile
