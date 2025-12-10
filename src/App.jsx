import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AlertCircle, Plus, Trash2, Search, Calendar, User, Package, Upload, Image as ImageIcon, X, Download, FileText, FileSpreadsheet, BarChart3, Home } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AnalyticsPage from './AnalyticsPage'
import Login from './Login'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const MERK_OPTIONS = [
  'OCTAGON',
  'VALENCIA',
  'ARLES',
  'MANDALAY',
  'PRIMATILES',
  'ARGA INDOTILE',
  'VANDAN',
  'VENETAS',
  'YUKA',
  'MAGNETO',
  'MIXED RIMPIL'
]

const REPORTER_OPTIONS = [
  'ASEP PEDIANTO',
  'ENDANG KURNIAWAN',
  'JAHUDI',
  'RAMIN'
]

const ensureOption = (options, value) => {
  if (value && !options.includes(value)) {
    return [...options, value]
  }
  return options
}

function Dashboard({ onLogout }) {
  const [incidents, setIncidents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingIncident, setEditingIncident] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: '',
    endDate: '',
    customNumber: ''
  })
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    itemName: '',
    date: new Date().toISOString().split('T')[0],
    reporter: '',
    location: '',
    ukuran: '',
    merk: '',
    kualitas: '',
    quantity: '',
    jenisPecah: '',
    description: '',
    photoFile: null,
    photoUrl: ''
  })

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
      // Silently handle error - show in console only
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Ukuran file terlalu besar. Maksimal 5MB')
        return
      }
      setFormData({...formData, photoFile: file})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      let photoUrl = ''
      
      // Upload photo to Supabase Storage if exists
      if (formData.photoFile) {
        const fileExt = formData.photoFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `incident-photos/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('incident-photos')
          .upload(filePath, formData.photoFile)
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(filePath)
        
        photoUrl = publicUrl
      }
      
      // Insert data into Supabase
      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          item_name: formData.itemName,
          date: formData.date,
          shading: formData.reporter,
          sizing: formData.location,
          ukuran: formData.ukuran,
          merk: formData.merk,
          kualitas: formData.kualitas,
          quantity: parseInt(formData.quantity) || 0,
          jenis_pecah: formData.jenisPecah,
          description: formData.description,
          photo_url: photoUrl
        }])
        .select()
      
      if (error) throw error
      
      // Refresh incidents list
      await fetchIncidents()
      
      // Reset form
      setFormData({
        itemName: '',
        date: new Date().toISOString().split('T')[0],
        reporter: '',
        location: '',
        ukuran: '',
        merk: '',
        kualitas: '',
        quantity: '',
        jenisPecah: '',
        description: '',
        photoFile: null,
        photoUrl: ''
      })
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      
      setShowForm(false)
      fetchIncidents()
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        const { error } = await supabase
          .from('incidents')
          .delete()
          .eq('id', id)

        if (error) throw error

        await fetchIncidents()
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  const handleEdit = (incident) => {
    setEditingIncident(incident)
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      let photoUrl = editingIncident.photo_url

      // Upload new photo if exists
      if (editingIncident.photoFile) {
        const fileExt = editingIncident.photoFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `incident-photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('incident-photos')
          .upload(filePath, editingIncident.photoFile)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(filePath)

        photoUrl = publicUrl
      }

      // Update data in Supabase
      const { data, error } = await supabase
        .from('incidents')
        .update({
          item_name: editingIncident.item_name,
          date: editingIncident.date,
          shading: editingIncident.shading,
          sizing: editingIncident.sizing,
          ukuran: editingIncident.ukuran,
          merk: editingIncident.merk,
          kualitas: editingIncident.kualitas,
          quantity: parseInt(editingIncident.quantity) || 0,
          jenis_pecah: editingIncident.jenis_pecah,
          description: editingIncident.description,
          photo_url: photoUrl,
          status: editingIncident.status
        })
        .eq('id', editingIncident.id)
        .select()

      if (error) throw error

      // Refresh incidents list
      await fetchIncidents()

      // Reset form
      setEditingIncident(null)
      setShowEditModal(false)
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleEditFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Ukuran file terlalu besar. Maksimal 5MB')
        return
      }
      setEditingIncident({...editingIncident, photoFile: file})
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      await fetchIncidents()
    } catch (error) {
      console.error('Error:', error.message)
    }
  }

  const filteredIncidents = incidents.filter(inc =>
    (inc.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.shading || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.sizing || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.merk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.description || inc.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentIncidents = filteredIncidents.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Filter data by date range for export
  const filterDataByDate = (data, startDate, endDate) => {
    if (!startDate || !endDate) return data
    const start = new Date(startDate)
    const end = new Date(endDate)
    return data.filter(inc => {
      const incDate = new Date(inc.date)
      return incDate >= start && incDate <= end
    })
  }

  // Generate Berita Acara number
  const generateBANumber = (date) => {
    const reportDate = new Date(date)
    const year = reportDate.getFullYear()
    const month = reportDate.getMonth() + 1

    // Roman numerals for months
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    const monthRoman = romanMonths[month - 1]

    // Get existing reports for this month to determine sequence number
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)
    const monthlyReports = incidents.filter(inc => {
      const incDate = new Date(inc.date)
      return incDate >= monthStart && incDate <= monthEnd
    }).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Find the sequence number for this report
    const currentReportIndex = monthlyReports.findIndex(inc => inc.date === date) + 1
    const sequenceNumber = String(currentReportIndex).padStart(4, '0')

    return `${sequenceNumber}/PA/SHIPP/BAKP/${monthRoman}/${year}`
  }

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true)
    try {
      const filteredData = filterDataByDate(incidents, exportDateRange.startDate, exportDateRange.endDate)

      if (filteredData.length === 0) {
        alert('Tidak ada data dalam rentang tanggal yang dipilih')
        setExporting(false)
        return
      }

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 14

      // Header dengan border
      doc.setLineWidth(0.5)
      doc.rect(10, 10, pageWidth - 20, 25)
      
      // Logo area - Load logo sebagai base64
      try {
        const loadImage = (url) => {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = url
          })
        }

        try {
          // Coba load logo PNG
          const logoImg = await loadImage('/logo-perusahaan.png')
          doc.addImage(logoImg, 'PNG', 15, 13, 20, 19)
        } catch (pngError) {
          try {
            // Jika PNG gagal, coba JPG
            const logoImg = await loadImage('/logo-perusahaan.jpg')
            doc.addImage(logoImg, 'JPEG', 15, 13, 20, 19)
          } catch (jpgError) {
            // Jika semua gagal, tampilkan kotak abu-abu
            doc.setFillColor(200, 200, 200)
            doc.rect(15, 13, 20, 19, 'F')
          }
        }
      } catch (e) {
        // Fallback kotak abu-abu jika logo tidak ada
        doc.setFillColor(200, 200, 200)
        doc.rect(15, 13, 20, 19, 'F')
      }
      
      // Company name - RATA TENGAH
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PT. PRIMARINDO ARGATILE', pageWidth / 2, 20, { align: 'center' })
      
      // Tagline - GABUNG DAN RATA TENGAH
      doc.setFontSize(9)
      const tagline = 'PRIMATILES  HIGH QUALITY CERAMIC TILES'
      doc.setFont('helvetica', 'normal')
      const primatilesPart = 'PRIMATILES  '
      const highQualityPart = 'HIGH QUALITY CERAMIC TILES'
      const primatileWidth = doc.getTextWidth(primatilesPart)
      const totalWidth = doc.getTextWidth(primatilesPart) + doc.getTextWidth(highQualityPart)
      const startX = (pageWidth - totalWidth) / 2
      
      doc.text(primatilesPart, startX, 26)
      doc.setFont('helvetica', 'bold')
      doc.text(highQualityPart, startX + primatileWidth, 26)

      // Berita Acara Title - RATA TENGAH
      doc.setLineWidth(0.5)
      doc.rect(10, 37, pageWidth - 20, 13)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('BERITA ACARA KERAMIK PECAH', pageWidth / 2, 44, { align: 'center' })
      
      // Nomor - FORMAT SESUAI TANGGAL DAN BULAN
      const startDate = exportDateRange.startDate ? new Date(exportDateRange.startDate) : new Date()
      const currentMonth = startDate.getMonth() + 1
      const currentYear = startDate.getFullYear()
      const monthRoman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][currentMonth]
      const baNumber = `NO.${exportDateRange.customNumber}/PA/SHIP/BAKP/${monthRoman}/${currentYear}`
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(baNumber, pageWidth / 2, 48, { align: 'center' })

      // Tanggal kejadian
      const endDate = exportDateRange.endDate ? new Date(exportDateRange.endDate) : startDate
      const startDateText = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
      
      doc.setFontSize(9)
      doc.text(`Pada Tanggal : ${startDateText}`, margin, 58)
      doc.text('Terdapat Barang Pecah dengan rincian sebagai berikut :', margin, 63)

      // Table data dengan format baru
      const tableData = filteredData.map((inc, index) => [
        index + 1,
        inc.item_name || '-',
        inc.shading || '-',
        inc.sizing || '-',
        inc.kualitas || '-',
        inc.ukuran || '-',
        inc.merk || '-',
        inc.quantity || 0,
        inc.jenis_pecah || '-'
      ])

      autoTable(doc, {
        head: [['No.', 'Type', 'Shad', 'Size', 'Quality', 'Ukuran', 'Brand', 'Qty', 'Keterangan']],
        body: tableData,
        startY: 68,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.3
        },
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.3
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 25 },
          7: { halign: 'center', cellWidth: 15 },
          8: { cellWidth: 30 }
        },
        theme: 'grid'
      })

      const tableEndY = doc.lastAutoTable.finalY || 68

      // Total quantity di bawah tabel - RATA KANAN
      const totalQuantity = filteredData.reduce((sum, inc) => sum + (inc.quantity || 0), 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Total', pageWidth - 50, tableEndY + 8)
      doc.text(`${totalQuantity}  Box`, pageWidth - margin, tableEndY + 8, { align: 'right' })

      // Closing text
      const closingY = tableEndY + 18
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const closingText = 'Adapun Barang Pecah tersebut disebabkan karna Operasional Perapihan Gudang dan Loading.'
      doc.text(closingText, margin, closingY)
      const closingText2 = 'Demikian Berita Acara ini dengan sebenar- benarnya untuk dapat digunakan sebagaimana mestinya'
      doc.text(closingText2, margin, closingY + 5)

      // SIGNATURE SECTION - POSISI DI BAWAH DEKAT FOOTER
      // Hitung posisi signature agar dekat dengan footer
      const footerY = pageHeight - 15
      const signatureY = footerY - 50  // 50mm di atas footer
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Dibuat Oleh - Kiri
      doc.text('Dibuat Oleh,', 30, signatureY)
      doc.line(25, signatureY + 20, 70, signatureY + 20)
      doc.text('Riyant Adhitya Adji', 30, signatureY + 26)
      doc.setFont('helvetica', 'bold')
      doc.text('Shipping', 30, signatureY + 31)
      
      // Mengetahui - Tengah
      doc.setFont('helvetica', 'normal')
      doc.text('Mengetahui,', 85, signatureY)
      doc.line(80, signatureY + 20, 135, signatureY + 20)
      doc.text('Arde Sanma', 85, signatureY + 26)
      doc.setFont('helvetica', 'bold')
      doc.text('Kasie Shipping & Marketing', 85, signatureY + 31)
      
      // Menyetujui - Kanan
      doc.setFont('helvetica', 'normal')
      doc.text('Menyetujui,', 155, signatureY)
      doc.line(150, signatureY + 20, 195, signatureY + 20)
      doc.text('Agus Priyanto', 155, signatureY + 26)
      doc.setFont('helvetica', 'bold')
      doc.text('Manager Produksi', 155, signatureY + 31)

      // Footer dengan border - DI PALING BAWAH
      doc.setLineWidth(0.5)
      doc.rect(10, footerY - 5, pageWidth - 20, 10)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kecamatan Kibin - Kabupaten Serang'
      doc.text(factoryText, pageWidth / 2, footerY, { align: 'center' })

      doc.save(`Berita-Acara-${baNumber.replace(/\//g, '-')}.pdf`)
      setShowExportModal(false)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  // Export to Excel
  const exportToExcel = () => {
    setExporting(true)
    try {
      const filteredData = filterDataByDate(incidents, exportDateRange.startDate, exportDateRange.endDate)

      if (filteredData.length === 0) {
        console.warn('Tidak ada data dalam rentang tanggal yang dipilih')
        setExporting(false)
        return
      }

      // Prepare data for Excel
      const excelData = filteredData.map((inc, index) => ({
        'No': index + 1,
        'Nama Motif': inc.item_name,
        'Tanggal': new Date(inc.date).toLocaleDateString('id-ID'),
        'Shading': inc.shading,
        'Sizing': inc.sizing,
        'Ukuran': inc.ukuran,
        'Merk': inc.merk,
        'Kualitas': inc.kualitas,
        'Quantity': inc.quantity,
        'Jenis Pecah': inc.jenis_pecah,
        'Reporter Name': inc.description || inc.keterangan || '-',
        'Status': inc.status
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No
        { wch: 20 }, // Nama Motif
        { wch: 12 }, // Tanggal
        { wch: 15 }, // Shading
        { wch: 15 }, // Sizing
        { wch: 10 }, // Ukuran
        { wch: 15 }, // Merk
        { wch: 10 }, // Kualitas
        { wch: 10 }, // Quantity
        { wch: 15 }, // Jenis Pecah
        { wch: 30 }, // Reporter Name
        { wch: 12 }  // Status
      ]
      ws['!cols'] = colWidths

      // Find the latest incident date
      const latestIncidentDate = filteredData.length > 0
        ? new Date(Math.max(...filteredData.map(inc => new Date(inc.date)))).toLocaleDateString('id-ID')
        : '-'

      // Add summary sheet
      const summaryData = [
        { 'Periode': `Dari ${new Date(exportDateRange.startDate).toLocaleDateString('id-ID')} sampai ${new Date(exportDateRange.endDate).toLocaleDateString('id-ID')}` },
        { 'Periode': '' },
        { 'Periode': 'RINGKASAN DATA' },
        { 'Periode': `Terakhir Tanggal Kejadian: ${latestIncidentDate}` },
        { 'Periode': `Total Quantity: ${filteredData.reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box` },
        { 'Periode': `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}` }
      ]
      const wsSummary = XLSX.utils.json_to_sheet(summaryData, { header: ['Periode'] })

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
      XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap')

      XLSX.writeFile(wb, `laporan-barang-pecah-${exportDateRange.startDate}-to-${exportDateRange.endDate}.xlsx`)
      setShowExportModal(false)
    } catch (error) {
      console.error('Error exporting Excel:', error)
    } finally {
      setExporting(false)
    }
  }

  // Export Photos to PDF
  const exportPhotosToPDF = async () => {
    setExporting(true)
    try {
      const filteredData = filterDataByDate(incidents, exportDateRange.startDate, exportDateRange.endDate)
      const photosData = filteredData.filter(inc => inc.photo_url)

      if (photosData.length === 0) {
        console.warn('Tidak ada foto dalam rentang tanggal yang dipilih')
        setExporting(false)
        return
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 8
      const photoWidth = (pageWidth - 4 * margin) / 3 // 3 photos per row
      const photoHeight = (pageHeight - 5 * margin) / 4 // 4 rows per page = 12 photos per page

      // HEADER - SAMA DENGAN BERITA ACARA
      doc.setLineWidth(0.5)
      doc.rect(10, 10, pageWidth - 20, 25)
      
      // Logo area
      try {
        const loadImage = (url) => {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = url
          })
        }

        try {
          const logoImg = await loadImage('/logo-perusahaan.png')
          doc.addImage(logoImg, 'PNG', 15, 13, 20, 19)
        } catch (pngError) {
          try {
            const logoImg = await loadImage('/logo-perusahaan.jpg')
            doc.addImage(logoImg, 'JPEG', 15, 13, 20, 19)
          } catch (jpgError) {
            doc.setFillColor(200, 200, 200)
            doc.rect(15, 13, 20, 19, 'F')
          }
        }
      } catch (e) {
        doc.setFillColor(200, 200, 200)
        doc.rect(15, 13, 20, 19, 'F')
      }
      
      // Company name - RATA TENGAH
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PT. PRIMARINDO ARGATILE', pageWidth / 2, 20, { align: 'center' })
      
      // Tagline - GABUNG DAN RATA TENGAH
      doc.setFontSize(9)
      const primatilesPart = 'PRIMATILES  '
      const highQualityPart = 'HIGH QUALITY CERAMIC TILES'
      const primatileWidth = doc.getTextWidth(primatilesPart)
      const totalWidth = doc.getTextWidth(primatilesPart) + doc.getTextWidth(highQualityPart)
      const startX = (pageWidth - totalWidth) / 2
      
      doc.setFont('helvetica', 'normal')
      doc.text(primatilesPart, startX, 26)
      doc.setFont('helvetica', 'bold')
      doc.text(highQualityPart, startX + primatileWidth, 26)

      // Title dengan border - SAMA DENGAN BERITA ACARA
      doc.setLineWidth(0.5)
      doc.rect(10, 37, pageWidth - 20, 13)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('DOKUMENTASI FOTO BARANG PECAH', pageWidth / 2, 44, { align: 'center' })
      
      // Nomor - FORMAT SAMA
      const startDate = exportDateRange.startDate ? new Date(exportDateRange.startDate) : new Date()
      const currentMonth = startDate.getMonth() + 1
      const currentYear = startDate.getFullYear()
      const monthRoman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][currentMonth]
      const baNumber = `NO.${exportDateRange.customNumber}/PA/SHIP/BAKP/${monthRoman}/${currentYear}`
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(baNumber, pageWidth / 2, 48, { align: 'center' })

      // Periode
      const startDateText = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
      doc.setFontSize(9)
      doc.text(`Periode: ${startDateText}`, 14, 58)

      let yPosition = 65
      let photoIndex = 0
      let pageNumber = 1

      // Group photos by date
      const photosByDate = {}
      photosData.forEach(inc => {
        const dateKey = new Date(inc.date).toISOString().split('T')[0]
        if (!photosByDate[dateKey]) {
          photosByDate[dateKey] = []
        }
        photosByDate[dateKey].push(inc)
      })

      // Sort dates
      const sortedDates = Object.keys(photosByDate).sort()

      // Function to load image as base64
      const loadImageAsBase64 = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)
              const base64 = canvas.toDataURL('image/jpeg', 0.8)
              resolve(base64)
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = url
        })
      }

      for (const dateKey of sortedDates) {
        const datePhotos = photosByDate[dateKey]
        const dateStr = new Date(dateKey).toLocaleDateString('id-ID')

        // Check if we need a new page before adding date header
        if (photoIndex > 0 && photoIndex % 12 === 0) {
          // Add footer - SAMA DENGAN BERITA ACARA
          const footerY = pageHeight - 15
          doc.setLineWidth(0.5)
          doc.rect(10, footerY - 5, pageWidth - 20, 10)
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kecamatan Kibin - Kabupaten Serang'
          doc.text(factoryText, pageWidth / 2, footerY, { align: 'center' })

          // New page
          doc.addPage()
          pageNumber++

          // Header untuk halaman baru - SAMA DENGAN BERITA ACARA
          doc.setLineWidth(0.5)
          doc.rect(10, 10, pageWidth - 20, 25)
          
          // Logo
          try {
            const loadImage = (url) => {
              return new Promise((resolve, reject) => {
                const img = new Image()
                img.crossOrigin = 'Anonymous'
                img.onload = () => resolve(img)
                img.onerror = () => reject(new Error('Failed to load image'))
                img.src = url
              })
            }

            try {
              const logoImg = await loadImage('/logo-perusahaan.png')
              doc.addImage(logoImg, 'PNG', 15, 13, 20, 19)
            } catch (pngError) {
              try {
                const logoImg = await loadImage('/logo-perusahaan.jpg')
                doc.addImage(logoImg, 'JPEG', 15, 13, 20, 19)
              } catch (jpgError) {
                doc.setFillColor(200, 200, 200)
                doc.rect(15, 13, 20, 19, 'F')
              }
            }
          } catch (e) {
            doc.setFillColor(200, 200, 200)
            doc.rect(15, 13, 20, 19, 'F')
          }
          
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text('PT. PRIMARINDO ARGATILE', pageWidth / 2, 20, { align: 'center' })
          
          doc.setFontSize(9)
          const primatilesPart = 'PRIMATILES  '
          const highQualityPart = 'HIGH QUALITY CERAMIC TILES'
          const primatileWidth = doc.getTextWidth(primatilesPart)
          const totalWidth = doc.getTextWidth(primatilesPart) + doc.getTextWidth(highQualityPart)
          const startX = (pageWidth - totalWidth) / 2
          
          doc.setFont('helvetica', 'normal')
          doc.text(primatilesPart, startX, 26)
          doc.setFont('helvetica', 'bold')
          doc.text(highQualityPart, startX + primatileWidth, 26)
          
          doc.setLineWidth(0.5)
          doc.rect(10, 37, pageWidth - 20, 13)
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('DOKUMENTASI FOTO BARANG PECAH', pageWidth / 2, 44, { align: 'center' })
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.text(baNumber, pageWidth / 2, 48, { align: 'center' })
          
          const startDateText = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
          doc.text(`Periode: ${startDateText}`, 14, 58)

          yPosition = 65
        }

        // Date header
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Tanggal: ${dateStr}`, margin, yPosition)
        yPosition += 8

        // Photos for this date
        for (const inc of datePhotos) {
          // Check if we need a new page before adding photo
          if (photoIndex > 0 && photoIndex % 12 === 0) {
            // Add footer - SAMA DENGAN BERITA ACARA
            const footerY = pageHeight - 15
            doc.setLineWidth(0.5)
            doc.rect(10, footerY - 5, pageWidth - 20, 10)
            
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kecamatan Kibin - Kabupaten Serang'
            doc.text(factoryText, pageWidth / 2, footerY, { align: 'center' })

            // New page
            doc.addPage()
            pageNumber++

            // Header untuk halaman baru - SAMA DENGAN BERITA ACARA
            doc.setLineWidth(0.5)
            doc.rect(10, 10, pageWidth - 20, 25)
            
            // Logo
            try {
              const loadImage = (url) => {
                return new Promise((resolve, reject) => {
                  const img = new Image()
                  img.crossOrigin = 'Anonymous'
                  img.onload = () => resolve(img)
                  img.onerror = () => reject(new Error('Failed to load image'))
                  img.src = url
                })
              }

              try {
                const logoImg = await loadImage('/logo-perusahaan.png')
                doc.addImage(logoImg, 'PNG', 15, 13, 20, 19)
              } catch (pngError) {
                try {
                  const logoImg = await loadImage('/logo-perusahaan.jpg')
                  doc.addImage(logoImg, 'JPEG', 15, 13, 20, 19)
                } catch (jpgError) {
                  doc.setFillColor(200, 200, 200)
                  doc.rect(15, 13, 20, 19, 'F')
                }
              }
            } catch (e) {
              doc.setFillColor(200, 200, 200)
              doc.rect(15, 13, 20, 19, 'F')
            }
            
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text('PT. PRIMARINDO ARGATILE', pageWidth / 2, 20, { align: 'center' })
            
            doc.setFontSize(9)
            const primatilesPart = 'PRIMATILES  '
            const highQualityPart = 'HIGH QUALITY CERAMIC TILES'
            const primatileWidth = doc.getTextWidth(primatilesPart)
            const totalWidth = doc.getTextWidth(primatilesPart) + doc.getTextWidth(highQualityPart)
            const startX = (pageWidth - totalWidth) / 2
            
            doc.setFont('helvetica', 'normal')
            doc.text(primatilesPart, startX, 26)
            doc.setFont('helvetica', 'bold')
            doc.text(highQualityPart, startX + primatileWidth, 26)
            
            doc.setLineWidth(0.5)
            doc.rect(10, 37, pageWidth - 20, 13)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('DOKUMENTASI FOTO BARANG PECAH', pageWidth / 2, 44, { align: 'center' })
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text(baNumber, pageWidth / 2, 48, { align: 'center' })
            
            const startDateText = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })
            doc.text(`Periode: ${startDateText}`, 14, 58)

            yPosition = 65
          }

          const x = margin + (photoIndex % 3) * (photoWidth + margin)
          const y = yPosition

          try {
            // Load image and add to PDF
            const imgData = await loadImageAsBase64(inc.photo_url)
            doc.addImage(imgData, 'JPEG', x, y, photoWidth, photoHeight)

            // Add photo info
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            const infoText = `${inc.item_name} (${inc.quantity} box)`
            const infoWidth = doc.getTextWidth(infoText)
            doc.text(infoText, x + (photoWidth - infoWidth) / 2, y + photoHeight + 5)

          } catch (error) {
            console.error('Error adding photo to PDF:', error)
            // Add placeholder for failed images
            doc.setFillColor(240, 240, 240)
            doc.rect(x, y, photoWidth, photoHeight, 'F')
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Foto tidak dapat dimuat', x + photoWidth / 2, y + photoHeight / 2, { align: 'center' })

            // Add photo info for failed images too
            doc.setFontSize(8)
            const infoText = `${inc.item_name} (${inc.quantity} box)`
            const infoWidth = doc.getTextWidth(infoText)
            doc.text(infoText, x + (photoWidth - infoWidth) / 2, y + photoHeight + 5)
          }

          photoIndex++

          // Move to next row after 3 photos
          if (photoIndex % 3 === 0) {
            yPosition += photoHeight + 12
          }
        }
      }

      // Add footer to last page - SAMA DENGAN BERITA ACARA
      const footerY = pageHeight - 15
      doc.setLineWidth(0.5)
      doc.rect(10, footerY - 5, pageWidth - 20, 10)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kecamatan Kibin - Kabupaten Serang'
      doc.text(factoryText, pageWidth / 2, footerY, { align: 'center' })

      doc.save(`Dokumentasi-Foto-${baNumber.replace(/\//g, '-')}.pdf`)
      setShowExportModal(false)
    } catch (error) {
      console.error('Error exporting photos PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Prepare monthly trend data


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient shadow-2xl sticky top-0 z-40 border-b-4 border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 animate-fadeIn">
            {/* Logo Perusahaan */}
            <div className="flex-shrink-0 animate-float">
              <div className="relative group">
                <div className="absolute -inset-1 bg-white/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <img 
                    src="/logo-perusahaan.svg" 
                    alt="Logo PT. Primarindo Argatile" 
                    className="h-16 w-16 object-contain bg-white/95 backdrop-blur-sm rounded-2xl p-2 border-2 border-white/40 shadow-2xl"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextElementSibling.style.display = 'flex'
                    }}
                  />
                  {/* Fallback Icon jika logo tidak ada */}
                  <div className="hidden p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/40">
                    <AlertCircle className="w-10 h-10 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Title & Subtitle */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                Sistem Pencatatan Barang Pecah
              </h1>
              <p className="text-white/90 text-sm md:text-base mt-1 drop-shadow font-medium">
                PT. Primarindo Argatile - Database Terintegrasi
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex flex-col gap-4 items-stretch animate-slideInLeft">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari data keramik pecah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base touch-manipulation shadow-sm hover:border-blue-300 transition-all input-glow bg-white/80 backdrop-blur-sm font-medium"
              inputMode="search"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/analytics"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50 touch-manipulation font-semibold btn-glow hover:scale-105 transform"
            >
              <BarChart3 className="w-5 h-5" />
              Lihat Analisis
            </Link>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/50 touch-manipulation font-semibold btn-glow hover:scale-105 transform"
            >
              <Download className="w-5 h-5" />
              Export Data
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-red-500/50 touch-manipulation font-semibold btn-glow hover:scale-105 transform"
            >
              <Plus className="w-5 h-5" />
              New Incident
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-500 to-slate-700 text-white px-6 py-4 rounded-xl hover:from-slate-600 hover:to-slate-800 transition-all shadow-lg hover:shadow-slate-500/50 touch-manipulation font-semibold btn-glow hover:scale-105 transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="mb-4 flex flex-col gap-4 items-stretch text-sm text-slate-600">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <span className="text-center sm:text-left">
              Menampilkan {filteredIncidents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredIncidents.length)} dari {filteredIncidents.length} data
            </span>
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <label htmlFor="itemsPerPage" className="text-slate-600">Tampilkan:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                inputMode="numeric"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 animate-scaleIn">
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border-2 border-slate-100 touch-manipulation card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-xs font-medium">Total Kejadian</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 group-hover:scale-110 transition-transform">{incidents.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-100 touch-manipulation card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-xs font-medium">Total Quantity (All Time)</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1 group-hover:scale-110 transition-transform">
                  {incidents.reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border-2 border-blue-100 touch-manipulation card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-xs font-medium">Total Quantity (Bulan Ini)</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 group-hover:scale-110 transition-transform">
                  {incidents.filter(inc => {
                    const incDate = new Date(inc.date);
                    const now = new Date();
                    return incDate.getMonth() === now.getMonth() &&
                           incDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border-2 border-green-100 touch-manipulation card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-xs font-medium">Tanggal Terakhir Kejadian</p>
                <p className="text-base sm:text-lg font-bold text-green-600 mt-1 group-hover:scale-110 transition-transform">
                  {incidents.length > 0
                    ? new Date(Math.max(...incidents.map(inc => new Date(inc.date)))).toLocaleDateString('id-ID')
                    : '-'
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border-2 border-purple-100 touch-manipulation card-hover group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-xs font-medium">Pelapor Terbanyak</p>
                <p className="text-sm sm:text-base font-bold text-purple-600 mt-1 group-hover:scale-110 transition-transform">
                  {(() => {
                    const reporterCount = {};
                    incidents.forEach(inc => {
                      const reporter = inc.description || inc.keterangan || 'Unknown';
                      reporterCount[reporter] = (reporterCount[reporter] || 0) + 1;
                    });
                    const mostReporter = Object.keys(reporterCount).reduce((a, b) => 
                      reporterCount[a] > reporterCount[b] ? a : b, 'Unknown'
                    );
                    return mostReporter !== 'Unknown' && reporterCount[mostReporter] > 0 
                      ? `${mostReporter} (${reporterCount[mostReporter]})`
                      : '-';
                  })()}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>



        {/* Export Modal */}
        {showExportModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Export Data</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
                  type="button"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="text-sm text-slate-600 mb-4">
                  Pilih rentang tanggal untuk export data. Jika tidak dipilih, akan export semua data.
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nomor Berita Acara *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0001"
                      value={exportDateRange.customNumber}
                      onChange={(e) => setExportDateRange({...exportDateRange, customNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Format lengkap: [nomor]/PA/SHIPP/BAKP/[bulan romawi]/[tahun]
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      value={exportDateRange.startDate}
                      onChange={(e) => setExportDateRange({...exportDateRange, startDate: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tanggal Akhir *
                    </label>
                    <input
                      type="date"
                      value={exportDateRange.endDate}
                      onChange={(e) => setExportDateRange({...exportDateRange, endDate: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={exportToPDF}
                    disabled={exporting || !exportDateRange.customNumber || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation text-base"
                  >
                    {exporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={exporting || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation text-base"
                  >
                    {exporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileSpreadsheet className="w-6 h-6" />
                    )}
                    Export Excel
                  </button>
                  <button
                    onClick={exportPhotosToPDF}
                    disabled={exporting || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex items-center justify-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation text-base"
                  >
                    {exporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                    Export Foto
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-full bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors touch-manipulation text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingIncident && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Data Pecah</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
                  type="button"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nama Motif *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingIncident.item_name || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, item_name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tanggal Kejadian *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingIncident.date || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, date: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Shading *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingIncident.shading || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, shading: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                      placeholder="Masukan Shading"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sizing *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingIncident.sizing || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, sizing: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                      placeholder="Masukkan sizing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ukuran *
                    </label>
                    <select
                      required
                      value={editingIncident.ukuran || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, ukuran: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    >
                      <option value="">Pilih ukuran</option>
                      <option value="50x50">50x50</option>
                      <option value="40x40">40x40</option>
                      <option value="25x40">25x40</option>
                      <option value="25x25">25x25</option>
                      <option value="20x40">20x40</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Merk *
                    </label>
                    <select
                      required
                      value={editingIncident.merk || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, merk: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    >
                      <option value="">Pilih merk</option>
                      {ensureOption(MERK_OPTIONS, editingIncident.merk).map((merk) => (
                        <option key={merk} value={merk}>
                          {merk}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kualitas *
                    </label>
                    <select
                      required
                      value={editingIncident.kualitas || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, kualitas: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                    >
                      <option value="">Pilih kualitas</option>
                      <option value="EXP">EXP</option>
                      <option value="ECN">ECN</option>
                      <option value="STD">STD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingIncident.quantity || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, quantity: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                      placeholder="Jumlah barang pecah"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Jenis Pecah *
                  </label>
                  <select
                    required
                    value={editingIncident.jenis_pecah || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, jenis_pecah: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                  >
                    <option value="">Pilih jenis pecah</option>
                    <option value="PECAH LOADING">PECAH LOADING</option>
                    <option value="PECAH GUDANG">PECAH GUDANG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reporter Name *
                  </label>
                  <select
                    required
                    value={editingIncident.description || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, description: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                  >
                    <option value="">Pilih nama reporter</option>
                    {ensureOption(REPORTER_OPTIONS, editingIncident.description).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Foto Bukti Pecah
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                      <Upload className="w-4 h-4" />
                      <span>Maksimal 5MB (JPG, PNG, JPEG) - Opsional, biarkan kosong jika tidak ingin mengubah foto</span>
                    </div>
                    {editingIncident.photo_url && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <ImageIcon className="w-4 h-4" />
                        <span>Foto sudah ada - Upload foto baru untuk mengganti</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-base"
                  >
                    {updating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Update Data'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors touch-manipulation text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Tambah Pecah Terbaru</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
                  type="button"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>
              
              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Motif *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Kejadian *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Shading *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reporter}
                    onChange={(e) => setFormData({...formData, reporter: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                    placeholder="Masukan Shading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sizing *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                    placeholder="Masukkan sizing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ukuran *
                  </label>
                  <select
                    required
                    value={formData.ukuran}
                    onChange={(e) => setFormData({...formData, ukuran: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                  >
                    <option value="">Pilih ukuran</option>
                    <option value="50x50">50x50</option>
                    <option value="40x40">40x40</option>
                    <option value="25x40">25x40</option>
                    <option value="25x25">25x25</option>
                    <option value="20x40">20x40</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Merk *
                  </label>
                  <select
                    required
                    value={formData.merk}
                    onChange={(e) => setFormData({...formData, merk: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                  >
                    <option value="">Pilih merk</option>
                    {MERK_OPTIONS.map((merk) => (
                      <option key={merk} value={merk}>
                        {merk}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kualitas *
                  </label>
                  <select
                    required
                    value={formData.kualitas}
                    onChange={(e) => setFormData({...formData, kualitas: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                  >
                    <option value="">Pilih kualitas</option>
                    <option value="EXP">EXP</option>
                    <option value="ECN">ECN</option>
                    <option value="STD">STD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                    placeholder="Jumlah barang pecah"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jenis Pecah *
                </label>
                <select
                  required
                  value={formData.jenisPecah}
                  onChange={(e) => setFormData({...formData, jenisPecah: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                >
                  <option value="">Pilih jenis pecah</option>
                  <option value="PECAH LOADING">PECAH LOADING</option>
                  <option value="PECAH GUDANG">PECAH GUDANG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reporter Name *
                </label>
                <select
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation"
                >
                  <option value="">Pilih nama reporter</option>
                  {REPORTER_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Foto Bukti Pecah
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base touch-manipulation file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                    <Upload className="w-4 h-4" />
                    <span>Maksimal 5MB (JPG, PNG, JPEG)</span>
                  </div>
                  {formData.photoFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <ImageIcon className="w-4 h-4" />
                      <span>{formData.photoFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-base"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Submit Incident'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors touch-manipulation text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Incidents List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat data...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Tidak ada data</h3>
              <p className="text-slate-600">
                {searchTerm ? 'Coba sesuaikan pencarian Anda' : 'Klik "New Incident" untuk menambah data'}
              </p>
            </div>
          ) : (
            currentIncidents.map((incident) => (
              <div key={incident.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                      <div className="flex flex-col sm:flex-row items-start gap-2 mb-2">
                      {incident.photo_url ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 mx-auto sm:mx-0">
                          <img
                            src={incident.photo_url}
                            alt="Foto barang pecah"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-50 rounded-lg mt-1 mx-auto sm:mx-0">
                          <Package className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-base font-semibold text-slate-900">{incident.item_name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 text-xs">
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">Tanggal:</span>
                            <span>{new Date(incident.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Shading:</span>
                            <span>{incident.shading}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Sizing:</span>
                            <span>{incident.sizing}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Ukuran:</span>
                            <span>{incident.ukuran}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Merk:</span>
                            <span>{incident.merk}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Kualitas:</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{incident.kualitas}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600">
                            <span className="font-medium">Quantity:</span>
                            <span className="font-semibold text-red-600">{incident.quantity} Box</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-600 col-span-1 sm:col-span-2">
                            <span className="font-medium">Jenis Pecah:</span>
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-semibold text-xs">{incident.jenis_pecah}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {(incident.description || incident.keterangan) && (
                      <p className="text-slate-700 mb-2 text-center sm:text-left text-xs">
                        <span className="font-medium">Reporter Name:</span> {incident.description || incident.keterangan}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                      <label className="text-xs text-slate-600">Status:</label>
                      <select
                        value={incident.status}
                        onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border touch-manipulation ${getStatusColor(incident.status)}`}
                        inputMode="text"
                      >
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-center sm:justify-end">
                    <button
                      onClick={() => handleEdit(incident)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                      title="Edit data"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(incident.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                      title="Hapus data"
                      type="button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredIncidents.length > itemsPerPage && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="text-sm text-slate-600">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      type="button"
                    >
                      Previous
                    </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 text-sm border rounded-lg transition-colors touch-manipulation ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                      type="button"
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient text-white mt-16 border-t-4 border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="animate-fadeIn">
              <h3 className="text-lg font-bold mb-3 text-white drop-shadow-lg">PT. Primarindo Argatile</h3>
              <p className="text-white/90 text-sm leading-relaxed drop-shadow">
                Sistem Pencatatan Barang Pecah untuk manajemen dan tracking insiden barang rusak secara digital.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-bold mb-3 text-white drop-shadow-lg">Fitur Utama</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2 drop-shadow">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  Pencatatan Data Lengkap
                </li>
                <li className="flex items-center gap-2 drop-shadow">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  Upload Foto Bukti
                </li>
                <li className="flex items-center gap-2 drop-shadow">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  Database Terintegrasi
                </li>
                <li className="flex items-center gap-2 drop-shadow">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  Tracking Status Real-time
                </li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-bold mb-3 text-white drop-shadow-lg">Informasi</h3>
              <div className="space-y-2 text-sm text-white/90">
                <p className="flex items-start gap-2 drop-shadow">
                  <span className="font-semibold text-white">Version:</span>
                  <span>1.0.0</span>
                </p>
                <p className="flex items-start gap-2 drop-shadow">
                  <span className="font-semibold text-white">Tech:</span>
                  <span>React + Vite + Supabase</span>
                </p>
                <p className="flex items-start gap-2 drop-shadow">
                  <span className="font-semibold text-white">Tahun:</span>
                  <span>{new Date().getFullYear()}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t-2 border-white/20 mt-8 pt-6 text-center">
            <p className="text-sm text-white font-medium drop-shadow">
              © {new Date().getFullYear()} Riyant Adhitya Adji, S.Kom. All rights reserved.
            </p>
            <p className="text-xs text-white/80 mt-2 drop-shadow">
              Developed With ❤️ for Better Inventory Management
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Router>
  )
}

export default App
