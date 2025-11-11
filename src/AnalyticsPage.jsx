import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Home, X, Download, FileText, Eye } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function AnalyticsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [currentPageIncidents, setCurrentPageIncidents] = useState(1)
  const itemsPerPageIncidents = 10

  // State untuk modal detail
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    setCurrentPageIncidents(1)
  }, [selectedYear, selectedMonth])

  // Fetch incidents from Supabase on mount
  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setIncidents(data || [])
    } catch (error) {
      console.error('Error fetching incidents:', error.message)
      alert('Gagal memuat data. Pastikan tabel "incidents" sudah dibuat di Supabase.')
    } finally {
      setLoading(false)
    }
  }

  // Filter incidents based on selected year and month
  const getFilteredIncidents = () => {
    return incidents.filter(inc => {
      const incDate = new Date(inc.date)
      const yearMatch = selectedYear === 'all' || incDate.getFullYear().toString() === selectedYear
      const monthMatch = selectedMonth === 'all' || incDate.getMonth().toString() === selectedMonth
      return yearMatch && monthMatch
    })
  }

  // Prepare monthly trend data
  const getMonthlyTrendData = () => {
    const filteredIncidents = getFilteredIncidents()

    if (selectedYear !== 'all') {
      // Show 12 months for selected year
      const yearData = []
      const year = parseInt(selectedYear)

      for (let month = 0; month < 12; month++) {
        const monthName = new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

        const monthData = filteredIncidents.filter(inc => {
          const incDate = new Date(inc.date)
          return incDate.getMonth() === month && incDate.getFullYear() === year
        })

        yearData.push({
          month: monthName,
          kejadian: monthData.length,
          quantity: monthData.reduce((sum, inc) => sum + (inc.quantity || 0), 0)
        })
      }

      return yearData
    } else {
      // Show last 6 months
      const last6Months = []
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

        const monthData = filteredIncidents.filter(inc => {
          const incDate = new Date(inc.date)
          return incDate.getMonth() === date.getMonth() &&
                 incDate.getFullYear() === date.getFullYear()
        })

        last6Months.push({
          month: monthName,
          kejadian: monthData.length,
          quantity: monthData.reduce((sum, inc) => sum + (inc.quantity || 0), 0)
        })
      }

      return last6Months
    }
  }

  // Prepare category analysis data
  const getCategoryData = (field) => {
    const categoryMap = {}
    const filteredIncidents = getFilteredIncidents()

    filteredIncidents.forEach(inc => {
      const value = inc[field] || 'Unknown'
      if (!categoryMap[value]) {
        categoryMap[value] = { name: value, value: 0, count: 0 }
      }
      categoryMap[value].value += inc.quantity || 0
      categoryMap[value].count += 1
    })

    return Object.values(categoryMap).sort((a, b) => b.value - a.value)
  }

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  // Export PDF function
  const exportToPDF = async (type) => {
    setExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Header Background
      pdf.setFillColor(59, 130, 246) // Blue color like system theme
      pdf.rect(0, 0, pageWidth, 50, 'F')

      // Header - Company Name
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255) // White text
      const companyText = 'PT. PRIMARINDO ARGATILE'
      const companyWidth = pdf.getTextWidth(companyText)
      pdf.text(companyText, (pageWidth - companyWidth) / 2, 20)

      // Title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      const titleText = 'LAPORAN ANALISIS BARANG PECAH'
      const titleWidth = pdf.getTextWidth(titleText)
      pdf.text(titleText, (pageWidth - titleWidth) / 2, 28)

      // Date
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const dateText = `Tanggal: ${currentDate}`
      const dateWidth = pdf.getTextWidth(dateText)
      pdf.text(dateText, (pageWidth - dateWidth) / 2, 38)

      // Reset text color for body content
      pdf.setTextColor(0, 0, 0)

      // Summary Statistics
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RINGKASAN STATISTIK', margin, 60)
      yPosition = 75

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const totalIncidents = incidents.length
      const totalQuantity = incidents.reduce((sum, inc) => sum + (inc.quantity || 0), 0)
      const avgPerIncident = totalIncidents > 0 ? Math.round(totalQuantity / totalIncidents) : 0

      // Current month data
      const currentMonth = new Date()
      const currentMonthIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.date)
        return incDate.getMonth() === currentMonth.getMonth() &&
               incDate.getFullYear() === currentMonth.getFullYear()
      })
      const currentMonthQuantity = currentMonthIncidents.reduce((sum, inc) => sum + (inc.quantity || 0), 0)

      const stats = [
        ['Total Kejadian (All Time)', totalIncidents.toString()],
        ['Total Quantity (All Time)', `${totalQuantity} Box`],
        ['Rata-rata per Kejadian', `${avgPerIncident} Box`],
        ['Kejadian Bulan Ini', currentMonthIncidents.length.toString()],
        ['Quantity Bulan Ini', `${currentMonthQuantity} Box`]
      ]

      stats.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, margin, yPosition)
        yPosition += 8
      })

      yPosition += 10

      // Add Charts Section (simplified representation)
      if (type === 'complete') {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('GRAFIK TREN BULANAN', margin, yPosition)
        yPosition += 15

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Grafik tren bulanan menunjukkan pola kejadian barang pecah dalam 6 bulan terakhir.', margin, yPosition)
        yPosition += 10

        // Monthly trend data
        const monthlyData = getMonthlyTrendData()
        monthlyData.forEach((item, index) => {
          pdf.text(`${item.month}: ${item.kejadian} kejadian, ${item.quantity} box`, margin + 10, yPosition)
          yPosition += 6
        })

        yPosition += 10

        // Category Analysis
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('ANALISIS PER KATEGORI', margin, yPosition)
        yPosition += 15

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')

        // Merk Analysis
        pdf.setFont('helvetica', 'bold')
        pdf.text('Per Merk:', margin, yPosition)
        yPosition += 10

        pdf.setFont('helvetica', 'normal')
        const merkData = getCategoryData('merk')
        merkData.slice(0, 5).forEach((item, index) => {
          const percentage = totalQuantity > 0 ? ((item.value / totalQuantity) * 100).toFixed(1) : 0
          pdf.text(`${index + 1}. ${item.name}: ${item.value} Box (${percentage}%)`, margin + 10, yPosition)
          yPosition += 8
        })

        yPosition += 10

        // Kualitas Analysis
        pdf.setFont('helvetica', 'bold')
        pdf.text('Per Kualitas:', margin, yPosition)
        yPosition += 10

        pdf.setFont('helvetica', 'normal')
        const kualitasData = getCategoryData('kualitas')
        kualitasData.forEach((item, index) => {
          pdf.text(`${index + 1}. ${item.name}: ${item.value} Box`, margin + 10, yPosition)
          yPosition += 8
        })

        yPosition += 10

        // Ukuran Analysis
        pdf.setFont('helvetica', 'bold')
        pdf.text('Per Ukuran:', margin, yPosition)
        yPosition += 10

        pdf.setFont('helvetica', 'normal')
        const ukuranData = getCategoryData('ukuran')
        ukuranData.forEach((item, index) => {
          pdf.text(`${index + 1}. ${item.name}: ${item.value} Box`, margin + 10, yPosition)
          yPosition += 8
        })

        yPosition += 10

        // Jenis Pecah Analysis
        pdf.setFont('helvetica', 'bold')
        pdf.text('Per Jenis Pecah:', margin, yPosition)
        yPosition += 10

        pdf.setFont('helvetica', 'normal')
        const jenisPecahData = getCategoryData('jenis_pecah')
        jenisPecahData.forEach((item, index) => {
          pdf.text(`${index + 1}. ${item.name}: ${item.value} Box`, margin + 10, yPosition)
          yPosition += 8
        })

        yPosition += 20
      }

      // Footer Background
      const pageCount = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)

        // Footer background
        pdf.setFillColor(59, 130, 246) // Blue color like system theme
        pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F')

        // Footer text
        pdf.setFontSize(11)
        pdf.setTextColor(255, 255, 255) // White text
        const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kec. Kibin - Kab. Serang'
        const factoryWidth = pdf.getTextWidth(factoryText)
        pdf.text(factoryText, (pageWidth - factoryWidth) / 2, pageHeight - 10)
      }

      // Save PDF
      const fileName = type === 'monthly' ? `laporan-analisis-barang-pecah-bulan-ini.pdf` : `laporan-analisis-barang-pecah-lengkap.pdf`
      pdf.save(fileName)

      alert('PDF berhasil diekspor!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal mengekspor PDF. Silakan coba lagi.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data analisis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo Perusahaan */}
              <div className="flex-shrink-0">
                <img
                  src="/logo-perusahaan.svg"
                  alt="Logo PT. Primarindo Argatile"
                  className="h-16 w-16 object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-blue-400/30 shadow-lg"
                  onError={(e) => {
                    // Fallback jika logo tidak ditemukan
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                {/* Fallback Icon jika logo tidak ada */}
                <div className="hidden p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl shadow-lg border border-blue-400/30">
                  <X className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Analisis Data Barang Pecah</h1>
                <p className="text-slate-300 text-sm mt-1">Dashboard analisis dan statistik lengkap</p>
              </div>
            </div>

            {/* Navigation */}
            <Link
              to="/"
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Home className="w-5 h-5" />
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Export Laporan</h2>
              <p className="text-slate-600 text-sm">Unduh laporan analisis dalam format PDF</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportToPDF('monthly')}
                disabled={exporting}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Mengekspor...' : 'Summary Bulan Ini'}
              </button>
              <button
                onClick={() => exportToPDF('complete')}
                disabled={exporting}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileText className="w-4 h-4" />
                {exporting ? 'Mengekspor...' : 'All Time Lengkap'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Filter Data</h2>
              <p className="text-slate-600 text-sm">Pilih tahun dan bulan untuk memfilter analisis</p>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-1">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Tahun</option>
                  {Array.from(new Set(incidents.map(inc => new Date(inc.date).getFullYear())))
                    .sort((a, b) => b - a)
                    .map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-1">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={selectedYear === 'all'}
                >
                  <option value="all">Semua Bulan</option>
                  {Array.from({ length: 12 }, (_, i) => i).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month, 1).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Kejadian</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{getFilteredIncidents().length}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Quantity</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {getFilteredIncidents().reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Rata-rata per Kejadian</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {getFilteredIncidents().length > 0 ? Math.round(getFilteredIncidents().reduce((sum, inc) => sum + (inc.quantity || 0), 0) / getFilteredIncidents().length) : 0} Box
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <PieChartIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Kategori Terbanyak</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {getCategoryData('merk').length > 0 ? getCategoryData('merk')[0].name : '-'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {incidents.length > 0 ? (
          <div className="space-y-8">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-slate-900">
                  Tren Bulanan {selectedYear !== 'all' ? `(${selectedYear})` : '(6 Bulan Terakhir)'}
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getMonthlyTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="kejadian" stroke="#3B82F6" strokeWidth={3} name="Jumlah Kejadian" />
                  <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#EF4444" strokeWidth={3} name="Total Box" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analisis per Merk */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Analisis per Merk</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={getCategoryData('merk')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData('merk').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Box`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Analisis per Kualitas */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Analisis per Kualitas</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={getCategoryData('kualitas')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} Box`} />
                    <Legend />
                    <Bar dataKey="value" fill="#10B981" name="Total Box" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Analisis per Ukuran */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Analisis per Ukuran</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={getCategoryData('ukuran')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} Box`} />
                    <Legend />
                    <Bar dataKey="value" fill="#8B5CF6" name="Total Box" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Analisis per Jenis Pecah */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Analisis per Jenis Pecah</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={getCategoryData('jenis_pecah')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData('jenis_pecah').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Box`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Statistics Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-slate-600" />
                <h3 className="text-xl font-semibold text-slate-900">Statistik Detail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Kategori</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Total Box</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Jumlah Kejadian</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Rata-rata per Kejadian</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCategoryData('merk')
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item, index) => {
                        const filteredQuantity = getFilteredIncidents().reduce((sum, inc) => sum + (inc.quantity || 0), 0)
                        const percentage = filteredQuantity > 0 ? ((item.value / filteredQuantity) * 100).toFixed(1) : 0
                        return (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                            <td className="py-3 px-4 text-center text-slate-700">{item.value}</td>
                            <td className="py-3 px-4 text-center text-slate-700">{item.count}</td>
                            <td className="py-3 px-4 text-center text-slate-700">{item.count > 0 ? Math.round(item.value / item.count) : 0}</td>
                            <td className="py-3 px-4 text-center text-slate-700">{percentage}%</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {getCategoryData('merk').length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-600">
                    Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, getCategoryData('merk').length)} - {Math.min(currentPage * itemsPerPage, getCategoryData('merk').length)} dari {getCategoryData('merk').length} kategori
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: Math.ceil(getCategoryData('merk').length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(getCategoryData('merk').length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(getCategoryData('merk').length / itemsPerPage)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Data Insiden Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-slate-600" />
                <h3 className="text-xl font-semibold text-slate-900">Data Insiden</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Merk</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Kualitas</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Ukuran</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Jenis Pecah</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Keterangan</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredIncidents()
                      .slice((currentPageIncidents - 1) * itemsPerPageIncidents, currentPageIncidents * itemsPerPageIncidents)
                      .map((incident, index) => (
                        <tr key={incident.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {new Date(incident.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{incident.merk || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">{incident.kualitas || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">{incident.ukuran || '-'}</td>
                          <td className="py-3 px-4 text-slate-700">{incident.jenis_pecah || '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-700">{incident.quantity || 0}</td>
                          <td className="py-3 px-4 text-slate-700">{incident.keterangan || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedIncident(incident)
                                setShowDetailModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Incidents */}
              {getFilteredIncidents().length > itemsPerPageIncidents && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-600">
                    Menampilkan {Math.min((currentPageIncidents - 1) * itemsPerPageIncidents + 1, getFilteredIncidents().length)} - {Math.min(currentPageIncidents * itemsPerPageIncidents, getFilteredIncidents().length)} dari {getFilteredIncidents().length} insiden
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPageIncidents(prev => Math.max(prev - 1, 1))}
                      disabled={currentPageIncidents === 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: Math.ceil(getFilteredIncidents().length / itemsPerPageIncidents) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPageIncidents(page)}
                        className={`px-3 py-1 text-sm border rounded-lg ${
                          currentPageIncidents === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPageIncidents(prev => Math.min(prev + 1, Math.ceil(getFilteredIncidents().length / itemsPerPageIncidents)))}
                      disabled={currentPageIncidents === Math.ceil(getFilteredIncidents().length / itemsPerPageIncidents)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada data untuk dianalisis</h3>
            <p className="text-slate-600 mb-4">Tambahkan data kejadian barang pecah terlebih dahulu untuk melihat analisis.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              Kembali ke Dashboard
            </Link>
          </div>
        )}
      </main>

      {/* Modal Detail Insiden */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Detail Insiden</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedIncident(null)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {new Date(selectedIncident.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Merk</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {selectedIncident.merk || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kualitas</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {selectedIncident.kualitas || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ukuran</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {selectedIncident.ukuran || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pecah</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {selectedIncident.jenis_pecah || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                    {selectedIncident.quantity || 0} Box
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg min-h-[60px]">
                  {selectedIncident.keterangan || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Dibuat</label>
                <p className="text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  {new Date(selectedIncident.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Foto Bukti</label>
                {selectedIncident.photo_url ? (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <img
                      src={selectedIncident.photo_url}
                      alt="Foto Bukti Insiden"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'block'
                      }}
                    />
                    <p className="hidden text-slate-500 text-sm mt-2">Gagal memuat gambar</p>
                  </div>
                ) : (
                  <p className="text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">Tidak ada foto bukti</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedIncident(null)
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Riyant Adhitya Adji, S.Kom. - Halaman Analisis Data
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AnalyticsPage
