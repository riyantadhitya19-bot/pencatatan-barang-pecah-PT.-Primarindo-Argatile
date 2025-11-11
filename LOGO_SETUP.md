# 📷 Panduan Setup Logo Perusahaan

## ✅ Kode Sudah Siap!

Header sudah dikonfigurasi untuk menampilkan logo perusahaan. Tinggal tambahkan file logo Anda.

## 🎯 Cara Menambahkan Logo

### Opsi 1: Gunakan Logo Perusahaan Asli (RECOMMENDED)

1. **Siapkan file logo:**
   - Format: PNG (dengan background transparan) atau SVG
   - Ukuran: Minimal 200x200px untuk kualitas bagus
   - File size: Idealnya < 500KB

2. **Rename file menjadi:** `logo-perusahaan.png` atau `logo-perusahaan.svg`

3. **Letakkan di folder `public`:**
   ```
   Pencatatan Barang Pecah/
   ├── public/
   │   └── logo-perusahaan.png  ← Di sini
   ├── src/
   └── ...
   ```

4. **Refresh browser** - Logo akan muncul otomatis!

### Opsi 2: Gunakan Logo Placeholder Sementara

Jika belum punya logo, sudah ada file placeholder:
- File: `public/logo-perusahaan-placeholder.svg`
- Rename menjadi: `logo-perusahaan.svg`

### Opsi 3: Gunakan Logo dengan Nama Custom

Jika nama file logo berbeda (misal: `logo-pt-primarindo.png`):

Edit file `src/App.jsx` di baris 200:
```jsx
// Dari:
src="/logo-perusahaan.png"

// Menjadi:
src="/logo-pt-primarindo.png"
```

## 🎨 Spesifikasi Logo

**Ukuran tampilan di header:**
- Width: 64px (16rem)
- Height: 64px (16rem)
- Auto-fit dengan object-contain

**Styling:**
- Background: Glass effect (putih semi-transparan)
- Border: Biru dengan glow effect
- Border radius: Rounded corner
- Shadow: Soft shadow

## 📐 Tips Desain Logo

1. **Background Transparan**
   - Format PNG dengan alpha channel
   - Atau SVG untuk hasil terbaik

2. **Ukuran Ideal**
   - Square (1:1 ratio): 200x200px, 400x400px, atau 512x512px
   - Logo akan di-resize otomatis ke 64x64px

3. **Warna Logo**
   - Logo berwarna akan terlihat bagus di background dark header
   - Hindari logo yang terlalu gelap (akan hilang di background)

4. **Format Rekomendasi**
   - SVG: Terbaik (scalable, file kecil)
   - PNG: Bagus (pastikan transparent background)
   - JPG: Tidak direkomendasikan (no transparency)

## 🔧 Troubleshooting

### Logo tidak muncul?

**Cek:**
1. ✅ Nama file benar: `logo-perusahaan.png` atau `.svg`
2. ✅ File ada di folder `public/` (bukan `src/`)
3. ✅ Sudah refresh browser (Ctrl + F5)
4. ✅ Cek console browser (F12) untuk error

### Logo terlalu besar/kecil?

Edit di file `src/App.jsx` baris 202:
```jsx
// Ubah h-16 w-16 menjadi ukuran lain:
className="h-20 w-20 ..."  // Lebih besar
className="h-12 w-12 ..."  // Lebih kecil
```

### Logo blur/pixelated?

- Gunakan file logo dengan resolusi lebih tinggi (min 400x400px)
- Atau gunakan format SVG untuk hasil terbaik

### Logo background tidak transparan?

- Export ulang logo dari design tool dengan transparent background
- Atau edit foto dengan tool seperti remove.bg

## 🎯 Fallback System

Jika logo tidak ditemukan, sistem akan otomatis menampilkan icon default (AlertCircle biru).

## 📱 Responsive Design

Logo sudah responsive:
- Desktop: 64x64px
- Mobile: Tetap 64x64px (ukuran konsisten)

## 🚀 Setelah Logo Ditambahkan

Refresh browser dan logo akan muncul di:
- ✅ Header (kiri atas)
- ✅ Dengan glass effect background
- ✅ Border biru yang matching dengan tema

---

**Semua sudah siap! Tinggal drop logo file ke folder `public/` dan refresh browser.** 🎉
