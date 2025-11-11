# 🚀 Quick Start Guide

## Langkah-langkah untuk Memulai

### ✅ Yang Sudah Dilakukan

1. ✅ Project sudah di-setup dengan React + Vite
2. ✅ TailwindCSS sudah terkonfigurasi
3. ✅ Supabase client sudah terinstall
4. ✅ Form dengan 8 field input sudah dibuat:
   - Nama Motif
   - Tanggal Kejadian
   - Shading
   - Sizing
   - Ukuran
   - Merk
   - Kualitas (dropdown: KW1, KW2, KW3, Reject)
   - Quantity
   - Description
5. ✅ Upload foto bukti sudah terintegrasi
6. ✅ Semua data akan disimpan ke Supabase

### ⚠️ Yang Perlu Anda Lakukan Sekarang

#### 1. Setup Supabase (WAJIB)

Aplikasi ini memerlukan Supabase untuk berfungsi. Tanpa Supabase, data tidak akan tersimpan.

**Ikuti langkah di file `SETUP_SUPABASE.md` untuk:**
- Membuat project Supabase (gratis)
- Menjalankan SQL untuk membuat tabel
- Membuat storage bucket untuk foto
- Mendapatkan API keys

#### 2. Buat File .env

Setelah mendapat API keys dari Supabase, buat file `.env` di root folder:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**PENTING:** Ganti dengan URL dan Key dari project Supabase Anda!

#### 3. Jalankan Aplikasi

```bash
# Jika dev server belum jalan, jalankan:
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (atau port lain jika 5173 sedang digunakan)

### 📋 Checklist Setup

- [ ] Buat project Supabase
- [ ] Jalankan SQL dari file `supabase-setup.sql`
- [ ] Buat storage bucket `incident-photos` (public)
- [ ] Buat file `.env` dengan URL dan Key yang benar
- [ ] Restart dev server setelah membuat `.env`
- [ ] Buka aplikasi di browser
- [ ] Test input data dan upload foto

### 🎯 Test Aplikasi

Setelah setup selesai:

1. Buka http://localhost:5173
2. Klik "New Incident"
3. Isi semua field dengan data test
4. Upload foto (max 5MB)
5. Klik "Submit Incident"
6. Cek di Supabase Dashboard apakah data masuk

### 📸 Screenshot Form

Form memiliki field:
- Nama Motif (text)
- Tanggal Kejadian (date picker)
- Shading (text)
- Sizing (text)
- Ukuran (text) - contoh: 60x60, 40x40
- Merk (text)
- Kualitas (dropdown) - KW1, KW2, KW3, Reject
- Quantity (number) - jumlah barang pecah
- Description (textarea) - deskripsi kejadian
- Foto Bukti Pecah (file upload) - max 5MB

### ❓ Masalah?

**"Data tidak muncul"**
→ Pastikan file `.env` sudah dibuat dan diisi dengan benar
→ Restart dev server setelah membuat `.env`

**"Failed to fetch" atau error Supabase**
→ Cek apakah tabel `incidents` sudah dibuat di Supabase
→ Cek apakah URL dan Key di `.env` sudah benar

**"Upload foto gagal"**
→ Pastikan storage bucket `incident-photos` sudah dibuat
→ Pastikan bucket setting adalah PUBLIC

### 📚 File Penting

- `SETUP_SUPABASE.md` - Panduan lengkap setup Supabase
- `supabase-setup.sql` - SQL untuk membuat tabel dan policies
- `.env.example` - Template untuk file .env
- `README.md` - Dokumentasi lengkap aplikasi

### 💡 Tips

1. Gunakan Supabase free tier untuk development (cukup untuk testing)
2. Foto akan disimpan di Supabase Storage dengan URL public
3. Data akan otomatis refresh setelah submit
4. Bisa search berdasarkan motif, merk, shading, atau sizing
5. Status bisa diubah langsung dari list

### ✨ Fitur yang Sudah Jadi

✅ Form input lengkap dengan 8 field + foto
✅ Upload foto ke Supabase Storage
✅ Simpan data ke database Supabase
✅ Tampilan list dengan foto thumbnail
✅ Search & filter data
✅ Update status (Pending, Investigating, Resolved)
✅ Delete data
✅ Statistics dashboard
✅ Loading states
✅ Error handling
✅ Responsive design

---

**Selamat menggunakan Sistem Pencatatan Barang Pecah! 🎉**

Jika ada pertanyaan, lihat file `SETUP_SUPABASE.md` atau `README.md` untuk detail lebih lanjut.
