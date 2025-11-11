import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AlertCircle, Plus, Trash2, Search, Calendar, User, Package, Upload, Image as ImageIcon, X, Download, FileText, FileSpreadsheet, BarChart3, Home } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AnalyticsPage from './AnalyticsPage'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

function Dashboard() {
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
    photoUrl: '',
    status: 'pending'
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
      alert('Gagal memuat data. Pastikan tabel "incidents" sudah dibuat di Supabase.')
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
          photo_url: photoUrl,
          status: 'pending'
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
        photoUrl: '',
        status: 'pending'
      })
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      
      setShowForm(false)
      alert('Data berhasil disimpan!')
    } catch (error) {
      console.error('Error:', error.message)
      alert('Gagal menyimpan data: ' + error.message)
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
        alert('Data berhasil dihapus!')
      } catch (error) {
        console.error('Error:', error.message)
        alert('Gagal menghapus data: ' + error.message)
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
      alert('Data berhasil diperbarui!')
    } catch (error) {
      console.error('Error:', error.message)
      alert('Gagal memperbarui data: ' + error.message)
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
      alert('Gagal mengubah status: ' + error.message)
    }
  }

  const filteredIncidents = incidents.filter(inc =>
    (inc.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.shading || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.sizing || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.merk || '').toLowerCase().includes(searchTerm.toLowerCase())
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
  const exportToPDF = () => {
    setExporting(true)
    try {
      const filteredData = filterDataByDate(incidents, exportDateRange.startDate, exportDateRange.endDate)

      if (filteredData.length === 0) {
        alert('Tidak ada data dalam rentang tanggal yang dipilih')
        setExporting(false)
        return
      }

      const doc = new jsPDF()

      // Header Background
      doc.setFillColor(59, 130, 246) // Blue color like system theme
      doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F')

      // Header - Company Name
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255) // White text
      const companyText = 'PT. PRIMARINDO ARGATILE'
      const companyWidth = doc.getTextWidth(companyText)
      doc.text(companyText, (doc.internal.pageSize.width - companyWidth) / 2, 20)

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const titleText = 'Berita Acara Keramik Pecah'
      const titleWidth = doc.getTextWidth(titleText)
      doc.text(titleText, (doc.internal.pageSize.width - titleWidth) / 2, 28)

      // BA Number
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const monthRoman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][currentMonth]
      const baNumber = `${exportDateRange.customNumber}/PA/SHIPP/BAKP/${monthRoman}/${currentYear}`
      const baText = `Nomor: ${baNumber}`
      const baWidth = doc.getTextWidth(baText)
      doc.text(baText, (doc.internal.pageSize.width - baWidth) / 2, 38)

      // Reset text color for body content
      doc.setTextColor(0, 0, 0)

      // Period info
      doc.setFontSize(10)
      doc.text(`Periode: ${new Date(exportDateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(exportDateRange.endDate).toLocaleDateString('id-ID')}`, 20, 56)

      // Total Quantity
      const totalQuantity = filteredData.reduce((sum, inc) => sum + (inc.quantity || 0), 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Quantity: ${totalQuantity} Box`, 20, 64)

      // Table data
      const tableData = filteredData.map((inc, index) => [
        index + 1,
        inc.item_name,
        new Date(inc.date).toLocaleDateString('id-ID'),
        inc.shading,
        inc.sizing,
        inc.ukuran,
        inc.merk,
        inc.kualitas,
        inc.quantity,
        inc.jenis_pecah,
        inc.description || '-'
      ])

      autoTable(doc, {
        head: [['No', 'Nama Motif', 'Tanggal', 'Shading', 'Sizing', 'Ukuran', 'Merk', 'Kualitas', 'Quantity', 'Jenis Pecah', 'Keterangan']],
        body: tableData,
        startY: 72,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      })

      // Signature areas - positioned just above footer
      const pageHeight = doc.internal.pageSize.height
      const signatureY = pageHeight - 70 // Position above footer (moved down slightly)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      // Calculate column positions for center alignment
      const pageWidth = doc.internal.pageSize.width
      const colWidth = pageWidth / 3
      const leftCol = colWidth / 2 - 25
      const middleCol = colWidth + colWidth / 2 - 25
      const rightCol = 2 * colWidth + colWidth / 2 - 25

      // Dibuat Oleh - Left column
      doc.text('Dibuat Oleh,', leftCol, signatureY)
      doc.text('Shipping', leftCol, signatureY + 30)
      doc.line(leftCol, signatureY + 23, leftCol + 50, signatureY + 23)

      // Mengetahui - Middle column
      doc.text('Mengetahui,', middleCol, signatureY)
      doc.text('Kasie Marketing & Shipping', middleCol, signatureY + 30)
      doc.line(middleCol, signatureY + 23, middleCol + 50, signatureY + 23)

      // Menyetujui - Right column
      doc.text('Menyetujui,', rightCol, signatureY)
      doc.text('Manager Produksi', rightCol, signatureY + 30)
      doc.line(rightCol, signatureY + 23, rightCol + 50, signatureY + 23)

      // Footer Background
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer background
        doc.setFillColor(59, 130, 246) // Blue color like system theme
        doc.rect(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, 20, 'F')

        // Footer text
        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255) // White text 
        const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kecamatan Kibin - Kabupaten Serang'
        const factoryWidth = doc.getTextWidth(factoryText)
        doc.text(factoryText, (doc.internal.pageSize.width - factoryWidth) / 2, doc.internal.pageSize.height - 10)
      }

      doc.save(`${baNumber}.pdf`)
      setShowExportModal(false)
      alert('PDF berhasil diexport!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal export PDF: ' + error.message)
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
        alert('Tidak ada data dalam rentang tanggal yang dipilih')
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
        'Keterangan': inc.description || '-',
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
        { wch: 30 }, // Keterangan
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
      alert('Excel berhasil diexport!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Gagal export Excel: ' + error.message)
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
        alert('Tidak ada foto dalam rentang tanggal yang dipilih')
        setExporting(false)
        return
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 8
      const photoWidth = (pageWidth - 4 * margin) / 3 // 3 photos per row
      const photoHeight = (pageHeight - 5 * margin) / 4 // 4 rows per page = 12 photos per page

      // Header Background
      doc.setFillColor(59, 130, 246) // Blue color like system theme
      doc.rect(0, 0, pageWidth, 35, 'F')

      // Header - Company Name
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255) // White text
      const companyText = 'PT. PRIMARINDO ARGATILE'
      const companyWidth = doc.getTextWidth(companyText)
      doc.text(companyText, (pageWidth - companyWidth) / 2, 15)

      // Title
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const titleText = 'DOKUMENTASI FOTO BARANG PECAH'
      const titleWidth = doc.getTextWidth(titleText)
      doc.text(titleText, (pageWidth - titleWidth) / 2, 23)

      // BA Number
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const monthRoman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][currentMonth]
      const baNumber = `${exportDateRange.customNumber}/PA/SHIPP/BAKP/${monthRoman}/${currentYear}`
      const baText = `Nomor: ${baNumber}`
      const baWidth = doc.getTextWidth(baText)
      doc.text(baText, (pageWidth - baWidth) / 2, 30)

      // Reset text color for body content
      doc.setTextColor(0, 0, 0)

      // Period info
      doc.setFontSize(10)
      doc.text(`Periode: ${new Date(exportDateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(exportDateRange.endDate).toLocaleDateString('id-ID')}`, margin, 40)

      let yPosition = 45
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
          // Add footer to previous page
          doc.setFillColor(59, 130, 246)
          doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(8)
          const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kec. Kibin - Kab. Serang'
          const factoryWidth = doc.getTextWidth(factoryText)
          doc.text(factoryText, (pageWidth - factoryWidth) / 2, pageHeight - 8)
          doc.text(`Halaman ${pageNumber}`, pageWidth - margin, pageHeight - 8)

          // New page
          doc.addPage()
          pageNumber++

          // Header for new page
          doc.setFillColor(59, 130, 246)
          doc.rect(0, 0, pageWidth, 35, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text(companyText, (pageWidth - companyWidth) / 2, 15)
          doc.setFontSize(12)
          doc.text(titleText, (pageWidth - titleWidth) / 2, 23)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const baNumberNew = `${exportDateRange.customNumber}/PA/SHIPP/BAKP/${monthRoman}/${currentYear}`
          const baTextNew = `Nomor: ${baNumberNew}`
          const baWidthNew = doc.getTextWidth(baTextNew)
          doc.text(baTextNew, (pageWidth - baWidthNew) / 2, 30)
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(10)
          doc.text(`Periode: ${new Date(exportDateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(exportDateRange.endDate).toLocaleDateString('id-ID')}`, margin, 40)

          yPosition = 50
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
            // Add footer to previous page
            doc.setFillColor(59, 130, 246)
            doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(8)
            const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kec. Kibin - Kab. Serang'
            const factoryWidth = doc.getTextWidth(factoryText)
            doc.text(factoryText, (pageWidth - factoryWidth) / 2, pageHeight - 8)
            doc.text(`Halaman ${pageNumber}`, pageWidth - margin, pageHeight - 8)

            // New page
            doc.addPage()
            pageNumber++

            // Header for new page
            doc.setFillColor(59, 130, 246)
            doc.rect(0, 0, pageWidth, 35, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text(companyText, (pageWidth - companyWidth) / 2, 15)
            doc.setFontSize(12)
            doc.text(titleText, (pageWidth - titleWidth) / 2, 23)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            const baNumberNewPage = `${exportDateRange.customNumber}/PA/SHIPP/BAKP/${monthRoman}/${currentYear}`
            const baTextNewPage = `Nomor: ${baNumberNewPage}`
            const baWidthNewPage = doc.getTextWidth(baTextNewPage)
            doc.text(baTextNewPage, (pageWidth - baWidthNewPage) / 2, 30)
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(10)
            doc.text(`Periode: ${new Date(exportDateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(exportDateRange.endDate).toLocaleDateString('id-ID')}`, margin, 40)

            yPosition = 50
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

      // Add footer to last page
      doc.setFillColor(59, 130, 246)
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      const factoryText = 'Factory : Jl. Raya Jakarta–Serang KM. 68 Desa Nambo Ilir, Kec. Kibin - Kab. Serang'
      const factoryWidth = doc.getTextWidth(factoryText)
      doc.text(factoryText, (pageWidth - factoryWidth) / 2, pageHeight - 8)

      doc.save(`dokumentasi-foto-barang-pecah-${exportDateRange.startDate}-to-${exportDateRange.endDate}.pdf`)
      setShowExportModal(false)
      alert('PDF foto berhasil diekspor!')
    } catch (error) {
      console.error('Error exporting photos PDF:', error)
      alert('Gagal export PDF foto: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Prepare monthly trend data


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <AlertCircle className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            
            {/* Title & Subtitle */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white drop-shadow-md">Sistem Pencatatan Barang Pecah PT. Primarindo Argatile</h1>
              <p className="text-slate-300 text-sm mt-1">Dibuat untuk pencatatan barang pecah yang terintegrasi ke Database</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <Link
              to="/analytics"
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
            >
              <BarChart3 className="w-5 h-5" />
              Lihat Analisis
            </Link>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Export Data
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Incident
            </button>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Menampilkan {filteredIncidents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredIncidents.length)} dari {filteredIncidents.length} data
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-slate-600">Tampilkan:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Kejadian</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{incidents.length}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Quantity (All Time)</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {incidents.reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Quantity (Bulan Ini)</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {incidents.filter(inc => {
                    const incDate = new Date(inc.date);
                    const now = new Date();
                    return incDate.getMonth() === now.getMonth() &&
                           incDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, inc) => sum + (inc.quantity || 0), 0)} Box
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Tanggal Terakhir Kejadian</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {incidents.length > 0
                    ? new Date(Math.max(...incidents.map(inc => new Date(inc.date)))).toLocaleDateString('id-ID')
                    : '-'
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Status Pending</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {incidents.filter(inc => inc.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <User className="w-6 h-6 text-red-600" />
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
                <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exportToPDF}
                    disabled={exporting || !exportDateRange.customNumber || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={exporting || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                    Export Excel
                  </button>
                  <button
                    onClick={exportPhotosToPDF}
                    disabled={exporting || !exportDateRange.startDate || !exportDateRange.endDate}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                    Export Foto
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
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
                <h2 className="text-2xl font-bold text-slate-900">Edit Data Pecah</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Reporter name"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <input
                      type="text"
                      required
                      value={editingIncident.merk || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, merk: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan merk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kualitas *
                    </label>
                    <select
                      required
                      value={editingIncident.kualitas || ''}
                      onChange={(e) => setEditingIncident({...editingIncident, kualitas: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih jenis pecah</option>
                    <option value="PECAH LOADING">PECAH LOADING</option>
                    <option value="PECAH GUDANG">PECAH GUDANG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    value={editingIncident.description || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Keterangan tambahan (opsional)..."
                  />
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Update Data'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
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
                <h2 className="text-2xl font-bold text-slate-900">Tambah Pecah Terbaru</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Reporter name"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  <input
                    type="text"
                    required
                    value={formData.merk}
                    onChange={(e) => setFormData({...formData, merk: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan merk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kualitas *
                  </label>
                  <select
                    required
                    value={formData.kualitas}
                    onChange={(e) => setFormData({...formData, kualitas: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Pilih jenis pecah</option>
                  <option value="PECAH LOADING">PECAH LOADING</option>
                  <option value="PECAH GUDANG">PECAH GUDANG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Keterangan tambahan (opsional)..."
                />
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
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
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Submit Incident'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
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
              <div key={incident.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {incident.photo_url ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img 
                            src={incident.photo_url} 
                            alt="Foto barang pecah" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-50 rounded-lg mt-1">
                          <Package className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{incident.item_name}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Tanggal:</span>
                            <span>{new Date(incident.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Shading:</span>
                            <span>{incident.shading}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Sizing:</span>
                            <span>{incident.sizing}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Ukuran:</span>
                            <span>{incident.ukuran}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Merk:</span>
                            <span>{incident.merk}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Kualitas:</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded">{incident.kualitas}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="font-medium">Quantity:</span>
                            <span className="font-semibold text-red-600">{incident.quantity} Box</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 col-span-2">
                            <span className="font-medium">Jenis Pecah:</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-semibold">{incident.jenis_pecah}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {incident.description && (
                      <p className="text-slate-700 mb-3 pl-24"><span className="font-medium">Keterangan:</span> {incident.description}</p>
                    )}
                    <div className="flex items-center gap-2 pl-24">
                      <label className="text-sm text-slate-600">Status:</label>
                      <select
                        value={incident.status}
                        onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(incident.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(incident)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit data"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(incident.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus data"
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
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
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
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-blue-400">PT. Primarindo Argatile</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Sistem Pencatatan Barang Pecah untuk manajemen dan tracking insiden barang rusak secara digital.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-blue-400">Fitur Utama</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  Pencatatan Data Lengkap
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  Upload Foto Bukti
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  Database Terintegrasi
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  Tracking Status Real-time
                </li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-blue-400">Informasi</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-slate-200">Version:</span>
                  <span>1.0.0</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-slate-200">Tech:</span>
                  <span>React + Vite + Supabase</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-slate-200">Tahun:</span>
                  <span>{new Date().getFullYear()}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-slate-700 mt-8 pt-6 text-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Riyant Adhitya Adji, S.Kom. All rights reserved.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Developed With ❤️ for Better Inventory Management
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Router>
  )
}

export default App
