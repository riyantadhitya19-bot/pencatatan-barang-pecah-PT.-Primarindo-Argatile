# 📊 Grafik dan Analisis Data - Dokumentasi

## ✅ Fitur yang Sudah Ditambahkan

### 1. **Grafik Tren Bulanan** 📈

**Lokasi:** Ditampilkan setelah dashboard statistik (hanya muncul jika ada data)

**Fitur:**
- Menampilkan tren **6 bulan terakhir**
- **Dual-axis chart** (2 sumbu Y):
  - Sumbu kiri (biru): Jumlah kejadian
  - Sumbu kanan (merah): Total quantity (Box)
- Format bulan: "Nov 2025", "Okt 2025", dll

**Data yang Ditampilkan:**
- Jumlah kejadian per bulan
- Total Box pecah per bulan
- Perbandingan antar bulan

### 2. **Analisis per Merk** 🎯

**Jenis Chart:** Pie Chart (Lingkaran)

**Fitur:**
- Menampilkan distribusi quantity berdasarkan merk
- Persentase untuk setiap merk
- Warna berbeda untuk setiap kategori
- Tooltip menampilkan jumlah Box

**Contoh Data:**
- Merk A: 45%
- Merk B: 30%
- Merk C: 25%

### 3. **Analisis per Kualitas** ⭐

**Jenis Chart:** Bar Chart (Batang)

**Fitur:**
- Menampilkan total Box untuk setiap kualitas (EXP, ECN, STD)
- Warna hijau untuk bar
- Mudah membandingkan antar kualitas

**Contoh Data:**
- EXP: 120 Box
- ECN: 80 Box
- STD: 50 Box

### 4. **Analisis per Ukuran** 📏

**Jenis Chart:** Bar Chart (Batang)

**Fitur:**
- Menampilkan total Box untuk setiap ukuran
- Warna ungu untuk bar
- Mengurutkan berdasarkan jumlah terbanyak

**Contoh Data:**
- 40x40: 100 Box
- 50x50: 75 Box
- 25x40: 45 Box
- 25x25: 30 Box
- 20x40: 20 Box

### 5. **Analisis per Jenis Pecah** 📦

**Jenis Chart:** Pie Chart (Lingkaran)

**Fitur:**
- Distribusi antara PECAH LOADING vs PECAH GUDANG
- Persentase untuk setiap jenis
- Warna berbeda untuk visualisasi

**Contoh Data:**
- PECAH LOADING: 60%
- PECAH GUDANG: 40%

## 🎨 Tampilan & Layout

### Layout Grid:
```
┌─────────────────────────────────────────┐
│     Tren Bulanan (Full Width)          │
│     Line Chart - 6 Months               │
└─────────────────────────────────────────┘

┌────────────────────┬────────────────────┐
│  Analisis Merk     │  Analisis Kualitas │
│  (Pie Chart)       │  (Bar Chart)       │
└────────────────────┴────────────────────┘

┌────────────────────┬────────────────────┐
│  Analisis Ukuran   │  Analisis Jenis    │
│  (Bar Chart)       │  Pecah (Pie)       │
└────────────────────┴────────────────────┘
```

### Responsive Design:
- **Desktop:** 2 kolom grid untuk analisis kategori
- **Mobile/Tablet:** 1 kolom (stack vertical)

## 📐 Spesifikasi Teknis

### Library yang Digunakan:
- **Recharts v2.10.3** - Library charting untuk React
- Responsive dan mudah dikustomisasi

### Komponen Charts:
1. `LineChart` - Untuk tren bulanan
2. `BarChart` - Untuk analisis kualitas dan ukuran
3. `PieChart` - Untuk analisis merk dan jenis pecah

### Warna Pallet:
- Biru: `#3B82F6`
- Merah: `#EF4444`
- Hijau: `#10B981`
- Kuning: `#F59E0B`
- Ungu: `#8B5CF6`
- Pink: `#EC4899`
- Teal: `#14B8A6`
- Orange: `#F97316`

## 🔄 Cara Kerja Data

### Tren Bulanan:
```javascript
// Mengambil data 6 bulan terakhir
// Menghitung jumlah kejadian dan total quantity per bulan
// Format: { month: "Nov 2025", kejadian: 5, quantity: 150 }
```

### Analisis Kategori:
```javascript
// Group data berdasarkan field (merk, kualitas, ukuran, jenis_pecah)
// Aggregate quantity untuk setiap kategori
// Sort berdasarkan jumlah terbanyak
```

## 📊 Contoh Data Output

### Monthly Trend:
```json
[
  { "month": "Jun 2025", "kejadian": 3, "quantity": 80 },
  { "month": "Jul 2025", "kejadian": 5, "quantity": 120 },
  { "month": "Ags 2025", "kejadian": 4, "quantity": 100 },
  { "month": "Sep 2025", "kejadian": 6, "quantity": 150 },
  { "month": "Okt 2025", "kejadian": 7, "quantity": 180 },
  { "month": "Nov 2025", "kejadian": 8, "quantity": 200 }
]
```

### Category Data:
```json
[
  { "name": "Merk A", "value": 150, "count": 8 },
  { "name": "Merk B", "value": 100, "count": 5 },
  { "name": "Merk C", "value": 80, "count": 4 }
]
```

## 💡 Fitur Interaktif

### Tooltip:
- **Hover** pada chart untuk melihat detail
- Menampilkan nilai exact dan label

### Legend:
- Klik legend untuk show/hide data series
- Tersedia pada line chart dan bar chart

### Label:
- Pie chart menampilkan nama kategori dan persentase
- Bar chart menampilkan nama kategori di axis X

## 🎯 Use Cases

### 1. Monitoring Tren
- Lihat apakah kejadian pecah meningkat atau menurun
- Identifikasi bulan dengan kejadian tertinggi
- Planning untuk preventive action

### 2. Analisis Root Cause
- Merk mana yang paling sering pecah?
- Kualitas mana yang paling bermasalah?
- Ukuran mana yang paling rentan?
- Pecah lebih sering terjadi di loading atau gudang?

### 3. Decision Making
- Tentukan fokus improvement
- Alokasi resource untuk handling
- Evaluasi supplier/vendor

### 4. Reporting
- Visual yang mudah dipahami management
- Export untuk presentasi
- Track KPI dan target reduction

## 🚀 Penggunaan

### Melihat Grafik:
1. **Pastikan ada data** - Grafik hanya muncul jika ada data incident
2. **Scroll ke bawah** setelah dashboard statistik
3. **Hover** pada grafik untuk detail

### Interpretasi:
- **Tren naik**: Perlu action preventif
- **Kategori dominan**: Focus area untuk improvement
- **Distribusi merata**: Masalah sistemik vs spesifik

## 📱 Responsive

### Desktop (>1024px):
- Tren bulanan: Full width
- Analisis kategori: 2 kolom grid

### Tablet (768px - 1024px):
- Tren bulanan: Full width
- Analisis kategori: 2 kolom grid (lebih compact)

### Mobile (<768px):
- Semua chart: Full width 1 kolom
- Stack vertical untuk mudah scroll

## ⚙️ Kustomisasi (Opsional)

### Ubah Jumlah Bulan:
```javascript
// Di function getMonthlyTrendData()
for (let i = 5; i >= 0; i--) // 6 bulan
// Ubah jadi:
for (let i = 11; i >= 0; i--) // 12 bulan
```

### Ubah Warna:
```javascript
const COLORS = ['#3B82F6', ...] // Ganti dengan warna favorit
```

### Ubah Tinggi Chart:
```jsx
<ResponsiveContainer width="100%" height={300}> // Ubah 300
```

## 🐛 Troubleshooting

### Grafik tidak muncul?
- ✅ Pastikan ada data incident
- ✅ Cek console browser untuk error
- ✅ Pastikan recharts sudah terinstall: `npm install`

### Data tidak akurat?
- ✅ Cek field name di database (merk, kualitas, ukuran, jenis_pecah)
- ✅ Pastikan tanggal terisi dengan benar

### Chart terlalu kecil?
- ✅ Adjust height di ResponsiveContainer
- ✅ Zoom out browser (Ctrl + -)

---

**Update Date:** 11 November 2025
**Version:** 1.2.0 - Grafik & Analisis
