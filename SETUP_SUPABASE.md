# Setup Supabase untuk Sistem Pencatatan Barang Pecah

## Langkah 1: Buat Project Supabase

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Sign up atau login ke akun Anda
3. Klik "New Project"
4. Isi detail project:
   - Project Name: `Pencatatan Barang Pecah`
   - Database Password: Buat password yang kuat dan simpan dengan aman
   - Region: Pilih yang terdekat dengan lokasi Anda (Singapore untuk Indonesia)
5. Klik "Create new project" dan tunggu beberapa menit hingga project selesai dibuat

## Langkah 2: Setup Database

1. Buka project Anda di Supabase Dashboard
2. Klik menu "SQL Editor" di sidebar kiri
3. Klik "New Query"
4. Copy seluruh isi file `supabase-setup.sql` dan paste ke SQL Editor
5. Klik "Run" untuk menjalankan query
6. Pastikan semua query berhasil dijalankan tanpa error

## Langkah 3: Setup Storage untuk Foto

1. Klik menu "Storage" di sidebar kiri
2. Klik "Create a new bucket"
3. Isi detail bucket:
   - Name: `incident-photos`
   - Public bucket: ✅ (centang)
4. Klik "Create bucket"

## Langkah 4: Dapatkan API Keys

1. Klik menu "Settings" (ikon gear) di sidebar kiri
2. Klik "API" di submenu
3. Anda akan melihat:
   - **Project URL**: Salin URL ini
   - **Project API keys**:
     - `anon` `public`: Salin key ini (ini adalah public/anon key)

## Langkah 5: Konfigurasi Aplikasi

1. Buat file `.env` di root folder project (sejajar dengan package.json)
2. Isi file `.env` dengan:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Ganti `https://your-project-ref.supabase.co` dengan Project URL Anda
4. Ganti `your-anon-key-here` dengan anon key Anda

⚠️ **PENTING**: Jangan commit file `.env` ke Git! File ini sudah ada di `.gitignore`

## Langkah 6: Install Dependencies dan Jalankan Aplikasi

```bash
# Install dependencies (jika belum)
npm install

# Jalankan aplikasi
npm run dev
```

## Verifikasi Setup

Setelah aplikasi berjalan:

1. Buka aplikasi di browser (biasanya http://localhost:5173)
2. Klik tombol "New Incident"
3. Isi form dengan data test
4. Upload foto (opsional)
5. Submit form
6. Cek di Supabase Dashboard:
   - Table Editor > incidents: Pastikan data masuk
   - Storage > incident-photos: Pastikan foto terupload (jika ada)

## Troubleshooting

### Error: "Failed to fetch"
- Pastikan Project URL dan Anon Key sudah benar di file `.env`
- Pastikan Supabase project sudah aktif (tidak dalam status paused)

### Error: "relation 'incidents' does not exist"
- Pastikan sudah menjalankan query SQL di Langkah 2
- Cek di Table Editor apakah tabel `incidents` sudah ada

### Error upload foto: "new row violates row-level security policy"
- Pastikan bucket `incident-photos` sudah dibuat dengan setting Public
- Pastikan RLS policies untuk storage sudah dijalankan (ada di file `supabase-setup.sql`)

### Foto tidak muncul
- Pastikan bucket `incident-photos` adalah public bucket
- Cek di Storage > incident-photos apakah foto sudah terupload
- Klik foto dan pastikan bisa diakses public URL-nya

## Keamanan (Production)

Untuk production, sebaiknya:

1. **Aktifkan Authentication**
   - Implementasikan Supabase Auth
   - Update RLS policies untuk membatasi akses berdasarkan user

2. **Batasi akses Storage**
   - Hanya authenticated users yang bisa upload
   - Implementasi size limit di backend

3. **Backup Database**
   - Setup automated backup di Supabase Dashboard
   - Export data secara berkala

4. **Monitor Usage**
   - Cek dashboard untuk usage statistics
   - Upgrade plan jika diperlukan

## Database Schema

Tabel `incidents` memiliki kolom:
- `id` (BIGSERIAL): Primary key auto-increment
- `item_name` (TEXT): Nama motif
- `date` (DATE): Tanggal kejadian
- `shading` (TEXT): Shading
- `sizing` (TEXT): Sizing
- `ukuran` (TEXT): Ukuran (contoh: 60x60)
- `merk` (TEXT): Merk
- `kualitas` (TEXT): Kualitas (KW1, KW2, KW3, Reject)
- `quantity` (INTEGER): Jumlah barang pecah
- `description` (TEXT): Deskripsi kejadian
- `photo_url` (TEXT): URL foto bukti
- `status` (TEXT): Status (pending, investigating, resolved)
- `created_at` (TIMESTAMP): Waktu pembuatan
- `updated_at` (TIMESTAMP): Waktu update terakhir

## Support

Jika ada masalah, cek:
1. Console browser (F12) untuk error messages
2. Supabase Dashboard > Logs untuk server-side errors
3. Network tab untuk melihat request/response

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
