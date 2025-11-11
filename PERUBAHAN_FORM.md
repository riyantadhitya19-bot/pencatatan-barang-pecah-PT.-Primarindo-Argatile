# 📋 Perubahan Form Input - Update Terbaru

## ✅ Perubahan yang Sudah Dilakukan

### 1. **Kolom Ukuran** - Sekarang Dropdown
- ❌ Sebelum: Input text bebas
- ✅ Sekarang: Dropdown dengan pilihan tetap
  - 50x50
  - 40x40
  - 25x40
  - 25x25
  - 20x40

### 2. **Kolom Kualitas** - Pilihan Baru
- ❌ Sebelum: KW1, KW2, KW3, Reject
- ✅ Sekarang: 
  - **EXP** (Export)
  - **ECN** (Ekonomis)
  - **STD** (Standard)

### 3. **Kolom Jenis Pecah** - Field Baru (WAJIB)
- ✨ Dropdown baru sebelum keterangan
- Pilihan:
  - **PECAH LOADING**
  - **PECAH GUDANG**
- Field ini wajib diisi

### 4. **Kolom Description** - Sekarang Opsional
- ❌ Sebelum: Wajib diisi
- ✅ Sekarang: 
  - Label berubah menjadi "Keterangan Tambahan"
  - Tidak wajib diisi (opsional)
  - Untuk keterangan detail tambahan jika diperlukan

## 📝 Urutan Field di Form

1. **Nama Motif** * (wajib)
2. **Tanggal Kejadian** * (wajib)
3. **Shading** * (wajib)
4. **Sizing** * (wajib)
5. **Ukuran** * (wajib) - DROPDOWN ✨
6. **Merk** * (wajib)
7. **Kualitas** * (wajib) - PILIHAN BARU ✨
8. **Quantity** * (wajib)
9. **Jenis Pecah** * (wajib) - FIELD BARU ✨
10. **Keterangan Tambahan** (opsional) - LABEL BARU ✨
11. **Foto Bukti Pecah** (opsional)

## 💾 Update Database Supabase

### Jika Anda Sudah Punya Database Lama:

**PENTING:** Jalankan query berikut di Supabase SQL Editor:

```sql
-- Tambah kolom jenis_pecah
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS jenis_pecah TEXT;

-- Ubah description jadi opsional
ALTER TABLE incidents 
ALTER COLUMN description DROP NOT NULL;

-- Set default untuk data lama
UPDATE incidents 
SET jenis_pecah = 'PECAH GUDANG' 
WHERE jenis_pecah IS NULL;
```

File lengkap ada di: **`UPDATE_DATABASE.sql`**

### Jika Database Baru:

Gunakan file `supabase-setup.sql` yang sudah diupdate (sudah include kolom `jenis_pecah`)

## 🎨 Tampilan di List Data

Data yang tampil sekarang:
- ✅ Tanggal
- ✅ Shading
- ✅ Sizing
- ✅ Ukuran (dari dropdown)
- ✅ Merk
- ✅ Kualitas (EXP/ECN/STD)
- ✅ Quantity
- ✅ **Jenis Pecah** (dengan badge orange) ✨
- ✅ Keterangan tambahan (jika ada)
- ✅ Foto (jika ada)
- ✅ Status

## 🔄 Testing

Setelah refresh browser:

1. **Klik "New Incident"**
2. **Cek field Ukuran** - Harus dropdown dengan 5 pilihan
3. **Cek field Kualitas** - Harus ada EXP, ECN, STD
4. **Cek field Jenis Pecah** - Field baru dengan pilihan PECAH LOADING/GUDANG
5. **Cek field Keterangan** - Label berubah dan tidak ada tanda * (tidak wajib)

## ⚠️ Catatan Penting

1. **Jenis Pecah** adalah field WAJIB
2. **Keterangan Tambahan** sekarang OPSIONAL (tidak wajib)
3. **Ukuran** harus dipilih dari dropdown (tidak bisa input manual)
4. **Kualitas** hanya ada 3 pilihan: EXP, ECN, STD

## 🐛 Jika Ada Masalah

**Error saat submit form:**
- Pastikan sudah update database dengan query di `UPDATE_DATABASE.sql`
- Pastikan kolom `jenis_pecah` sudah ada di tabel Supabase

**Data lama tidak muncul:**
- Jalankan query UPDATE di `UPDATE_DATABASE.sql` untuk set default jenis_pecah

**Form tidak berubah:**
- Hard refresh browser: `Ctrl + Shift + R` atau `Ctrl + F5`
- Clear cache browser
- Restart dev server

---

**Update Date:** 11 November 2025
**Version:** 1.1.0
