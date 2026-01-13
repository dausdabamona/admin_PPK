import { useState, useEffect } from 'react'
import { db, POSISI_PJLP, TARIF_BPJS } from '../../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  ClipboardList,
  Calculator,
  Users,
  Clock,
  DollarSign,
  FileCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Constants
const JAM_KERJA_STANDAR = 173 // jam per bulan
const HARI_KERJA_BULAN = 22
const JAM_KERJA_HARI = 8

const TABS = [
  { id: 'ak', label: 'Analisis Kebutuhan', icon: ClipboardList },
  { id: 'abk', label: 'Analisis Beban Kerja', icon: Clock },
  { id: 'tor', label: 'TOR/KAK', icon: FileCheck },
  { id: 'hps', label: 'HPS/RAB', icon: Calculator }
]

export default function PjlpPerencanaan() {
  const [activeTab, setActiveTab] = useState('ak')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    nomorDokumen: '',
    tanggal: new Date().toISOString().split('T')[0],
    // Analisis Kebutuhan
    analisisKebutuhan: '',
    posisiDibutuhkan: '',
    jumlahOrang: 1,
    justifikasi: '',
    // Analisis Beban Kerja
    uraianTugas: [],
    totalJamKerja: 0,
    kesimpulanAbk: '',
    // TOR/KAK
    torKak: '',
    latarBelakang: '',
    tujuan: '',
    ruangLingkup: '',
    outputPekerjaan: '',
    kualifikasi: '',
    // HPS/RAB
    honorBulanan: '',
    durasiKontrak: 12,
    biayaBpjsKesehatan: 0,
    biayaBpjsKetenagakerjaan: 0,
    biayaThr: 0,
    estimasiPph: 0,
    totalHps: 0,
    keterangan: '',
    status: 'Draft'
  })

  // New state for ABK tasks
  const [abkTugas, setAbkTugas] = useState([
    { uraian: '', volume: 1, satuan: 'kali', waktuPenyelesaian: 1, jamPerTahun: 0 }
  ])

  // Queries
  const perencanaanList = useLiveQuery(
    () => db.pjlpPerencanaan.where('tahun').equals(filterTahun).reverse().toArray(),
    [filterTahun]
  )

  // Stats
  const stats = {
    total: perencanaanList?.length || 0,
    draft: perencanaanList?.filter(p => p.status === 'Draft').length || 0,
    approved: perencanaanList?.filter(p => p.status === 'Disetujui').length || 0
  }

  // Calculate ABK total
  useEffect(() => {
    const totalJam = abkTugas.reduce((sum, t) => sum + (parseFloat(t.jamPerTahun) || 0), 0)
    const jamPerBulan = totalJam / 12
    const jumlahOrang = Math.ceil(jamPerBulan / JAM_KERJA_STANDAR)
    setFormData(prev => ({
      ...prev,
      uraianTugas: abkTugas,
      totalJamKerja: totalJam,
      jumlahOrang: Math.max(1, jumlahOrang)
    }))
  }, [abkTugas])

  // Calculate HPS
  useEffect(() => {
    const honor = parseFloat(formData.honorBulanan) || 0
    const durasi = parseInt(formData.durasiKontrak) || 12
    const jumlah = parseInt(formData.jumlahOrang) || 1

    const totalHonor = honor * durasi * jumlah
    const bpjsKes = honor * TARIF_BPJS.kesehatan * durasi * jumlah
    const bpjsTk = honor * TARIF_BPJS.ketenagakerjaan * durasi * jumlah
    const thr = honor * jumlah // 1 bulan THR
    const pph = totalHonor * 0.025 // Estimasi dengan NPWP

    setFormData(prev => ({
      ...prev,
      biayaBpjsKesehatan: Math.round(bpjsKes),
      biayaBpjsKetenagakerjaan: Math.round(bpjsTk),
      biayaThr: Math.round(thr),
      estimasiPph: Math.round(pph),
      totalHps: Math.round(totalHonor + bpjsKes + bpjsTk + thr)
    }))
  }, [formData.honorBulanan, formData.durasiKontrak, formData.jumlahOrang])

  const resetForm = () => {
    setFormData({
      tahun: new Date().getFullYear(),
      nomorDokumen: '',
      tanggal: new Date().toISOString().split('T')[0],
      analisisKebutuhan: '',
      posisiDibutuhkan: '',
      jumlahOrang: 1,
      justifikasi: '',
      uraianTugas: [],
      totalJamKerja: 0,
      kesimpulanAbk: '',
      torKak: '',
      latarBelakang: '',
      tujuan: '',
      ruangLingkup: '',
      outputPekerjaan: '',
      kualifikasi: '',
      honorBulanan: '',
      durasiKontrak: 12,
      biayaBpjsKesehatan: 0,
      biayaBpjsKetenagakerjaan: 0,
      biayaThr: 0,
      estimasiPph: 0,
      totalHps: 0,
      keterangan: '',
      status: 'Draft'
    })
    setAbkTugas([{ uraian: '', volume: 1, satuan: 'kali', waktuPenyelesaian: 1, jamPerTahun: 0 }])
    setEditingId(null)
  }

  const addAbkTugas = () => {
    setAbkTugas([...abkTugas, { uraian: '', volume: 1, satuan: 'kali', waktuPenyelesaian: 1, jamPerTahun: 0 }])
  }

  const removeAbkTugas = (index) => {
    setAbkTugas(abkTugas.filter((_, i) => i !== index))
  }

  const updateAbkTugas = (index, field, value) => {
    const newTugas = [...abkTugas]
    newTugas[index] = { ...newTugas[index], [field]: value }

    // Calculate jam per tahun
    if (field === 'volume' || field === 'waktuPenyelesaian') {
      const vol = parseFloat(newTugas[index].volume) || 0
      const waktu = parseFloat(newTugas[index].waktuPenyelesaian) || 0
      newTugas[index].jamPerTahun = vol * waktu
    }

    setAbkTugas(newTugas)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = {
      ...formData,
      tahun: parseInt(formData.tahun),
      jumlahOrang: parseInt(formData.jumlahOrang) || 1,
      honorBulanan: parseFloat(formData.honorBulanan) || 0,
      durasiKontrak: parseInt(formData.durasiKontrak) || 12
    }

    try {
      if (editingId) {
        await db.pjlpPerencanaan.update(editingId, data)
      } else {
        await db.pjlpPerencanaan.add({
          ...data,
          createdAt: new Date().toISOString()
        })
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving perencanaan:', error)
      alert('Gagal menyimpan data perencanaan')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      tahun: item.tahun,
      nomorDokumen: item.nomorDokumen || '',
      tanggal: item.tanggal || '',
      analisisKebutuhan: item.analisisKebutuhan || '',
      posisiDibutuhkan: item.posisiDibutuhkan || '',
      jumlahOrang: item.jumlahOrang || 1,
      justifikasi: item.justifikasi || '',
      uraianTugas: item.uraianTugas || [],
      totalJamKerja: item.totalJamKerja || 0,
      kesimpulanAbk: item.kesimpulanAbk || '',
      torKak: item.torKak || '',
      latarBelakang: item.latarBelakang || '',
      tujuan: item.tujuan || '',
      ruangLingkup: item.ruangLingkup || '',
      outputPekerjaan: item.outputPekerjaan || '',
      kualifikasi: item.kualifikasi || '',
      honorBulanan: item.honorBulanan?.toString() || '',
      durasiKontrak: item.durasiKontrak || 12,
      biayaBpjsKesehatan: item.biayaBpjsKesehatan || 0,
      biayaBpjsKetenagakerjaan: item.biayaBpjsKetenagakerjaan || 0,
      biayaThr: item.biayaThr || 0,
      estimasiPph: item.estimasiPph || 0,
      totalHps: item.totalHps || 0,
      keterangan: item.keterangan || '',
      status: item.status || 'Draft'
    })
    setAbkTugas(item.uraianTugas?.length > 0 ? item.uraianTugas : [{ uraian: '', volume: 1, satuan: 'kali', waktuPenyelesaian: 1, jamPerTahun: 0 }])
    setEditingId(item.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus data perencanaan ini?')) {
      try {
        await db.pjlpPerencanaan.delete(id)
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const generateTorPDF = async (item) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('KERANGKA ACUAN KERJA (KAK)', 105, 20, { align: 'center' })
    doc.text('PENYEDIA JASA LAINNYA PERSEORANGAN (PJLP)', 105, 28, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    let y = 45

    // Content sections
    const sections = [
      { title: '1. LATAR BELAKANG', content: item.latarBelakang },
      { title: '2. TUJUAN', content: item.tujuan },
      { title: '3. RUANG LINGKUP PEKERJAAN', content: item.ruangLingkup },
      { title: '4. OUTPUT PEKERJAAN', content: item.outputPekerjaan },
      { title: '5. KUALIFIKASI', content: item.kualifikasi }
    ]

    sections.forEach(section => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, 20, y)
      y += 7
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(section.content || '-', 170)
      doc.text(lines, 20, y)
      y += lines.length * 6 + 10
    })

    // Footer info
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.text('6. INFORMASI TAMBAHAN', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.text(`Posisi: ${item.posisiDibutuhkan || '-'}`, 20, y)
    y += 6
    doc.text(`Jumlah Kebutuhan: ${item.jumlahOrang} orang`, 20, y)
    y += 6
    doc.text(`Durasi Kontrak: ${item.durasiKontrak} bulan`, 20, y)

    doc.save(`TOR_KAK_PJLP_${item.posisiDibutuhkan || 'Draft'}_${item.tahun}.pdf`)
  }

  const generateHpsPDF = async (item) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('HARGA PERKIRAAN SENDIRI (HPS)', 105, 20, { align: 'center' })
    doc.text('PENYEDIA JASA LAINNYA PERSEORANGAN', 105, 28, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tahun Anggaran: ${item.tahun}`, 20, 40)
    doc.text(`Posisi: ${item.posisiDibutuhkan || '-'}`, 20, 46)
    doc.text(`Jumlah Orang: ${item.jumlahOrang}`, 20, 52)

    // Table
    const tableData = [
      ['Honor Bulanan', formatCurrency(item.honorBulanan), `${item.durasiKontrak} bulan`, formatCurrency(item.honorBulanan * item.durasiKontrak * item.jumlahOrang)],
      ['BPJS Kesehatan (1%)', formatCurrency(item.honorBulanan * TARIF_BPJS.kesehatan), `${item.durasiKontrak} bulan`, formatCurrency(item.biayaBpjsKesehatan)],
      ['BPJS Ketenagakerjaan (2%)', formatCurrency(item.honorBulanan * TARIF_BPJS.ketenagakerjaan), `${item.durasiKontrak} bulan`, formatCurrency(item.biayaBpjsKetenagakerjaan)],
      ['THR', formatCurrency(item.honorBulanan), '1 bulan', formatCurrency(item.biayaThr)]
    ]

    doc.autoTable({
      startY: 60,
      head: [['Komponen', 'Satuan', 'Volume', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      foot: [['TOTAL HPS', '', '', formatCurrency(item.totalHps)]],
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    })

    // Notes
    const finalY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(9)
    doc.text('Catatan:', 20, finalY)
    doc.text('- Estimasi PPh 21 (2.5% dengan NPWP): ' + formatCurrency(item.estimasiPph), 20, finalY + 6)
    doc.text('- HPS ini bersifat perkiraan dan dapat berubah sesuai ketentuan yang berlaku', 20, finalY + 12)

    doc.save(`HPS_PJLP_${item.posisiDibutuhkan || 'Draft'}_${item.tahun}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perencanaan Kebutuhan PJLP</h1>
          <p className="text-gray-600">Analisis kebutuhan, beban kerja, TOR/KAK, dan HPS</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(parseInt(e.target.value))}
            className="input-field w-32"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Perencanaan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Perencanaan</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              <p className="text-xs text-gray-500">Draft</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-500">Disetujui</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">No. Dokumen</th>
                <th className="table-header">Posisi</th>
                <th className="table-header text-center">Jumlah</th>
                <th className="table-header text-right">Honor/Bulan</th>
                <th className="table-header text-right">Total HPS</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {perencanaanList?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Belum ada data perencanaan untuk tahun {filterTahun}
                  </td>
                </tr>
              ) : (
                perencanaanList?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium">{item.nomorDokumen || '-'}</p>
                      <p className="text-xs text-gray-500">{item.tanggal}</p>
                    </td>
                    <td className="table-cell font-medium">{item.posisiDibutuhkan || '-'}</td>
                    <td className="table-cell text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {item.jumlahOrang} orang
                      </span>
                    </td>
                    <td className="table-cell text-right">{formatCurrency(item.honorBulanan || 0)}</td>
                    <td className="table-cell text-right font-medium">{formatCurrency(item.totalHps || 0)}</td>
                    <td className="table-cell text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Disetujui'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => generateTorPDF(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Export TOR/KAK"
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateHpsPDF(item)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Export HPS"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form with Tabs */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Perencanaan' : 'Tambah Perencanaan Baru'}
              </h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {/* Tab: Analisis Kebutuhan */}
              {activeTab === 'ak' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Dokumen
                      </label>
                      <input
                        type="text"
                        value={formData.nomorDokumen}
                        onChange={(e) => setFormData({ ...formData, nomorDokumen: e.target.value })}
                        className="input-field"
                        placeholder="No. dokumen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tahun Anggaran
                      </label>
                      <select
                        value={formData.tahun}
                        onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                        className="input-field"
                      >
                        {[2024, 2025, 2026].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posisi yang Dibutuhkan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.posisiDibutuhkan}
                      onChange={(e) => setFormData({ ...formData, posisiDibutuhkan: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Pilih Posisi</option>
                      {POSISI_PJLP.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Analisis Kebutuhan
                    </label>
                    <textarea
                      value={formData.analisisKebutuhan}
                      onChange={(e) => setFormData({ ...formData, analisisKebutuhan: e.target.value })}
                      className="input-field"
                      rows={4}
                      placeholder="Jelaskan kebutuhan akan posisi ini..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Justifikasi Kebutuhan
                    </label>
                    <textarea
                      value={formData.justifikasi}
                      onChange={(e) => setFormData({ ...formData, justifikasi: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Justifikasi mengapa posisi ini diperlukan..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('abk')}
                      className="btn-primary flex items-center gap-2"
                    >
                      Lanjut ke ABK
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Analisis Beban Kerja */}
              {activeTab === 'abk' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Standar:</strong> Jam kerja efektif = {JAM_KERJA_STANDAR} jam/bulan ({HARI_KERJA_BULAN} hari × {JAM_KERJA_HARI} jam - {HARI_KERJA_BULAN * JAM_KERJA_HARI - JAM_KERJA_STANDAR} jam allowance)
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Uraian Tugas & Volume
                      </label>
                      <button
                        type="button"
                        onClick={addAbkTugas}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Tugas
                      </button>
                    </div>

                    <div className="space-y-3">
                      {abkTugas.map((tugas, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                value={tugas.uraian}
                                onChange={(e) => updateAbkTugas(index, 'uraian', e.target.value)}
                                className="input-field text-sm"
                                placeholder="Uraian tugas"
                              />
                            </div>
                            <div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={tugas.volume}
                                  onChange={(e) => updateAbkTugas(index, 'volume', e.target.value)}
                                  className="input-field text-sm w-20"
                                  placeholder="Vol"
                                />
                                <select
                                  value={tugas.satuan}
                                  onChange={(e) => updateAbkTugas(index, 'satuan', e.target.value)}
                                  className="input-field text-sm"
                                >
                                  <option value="kali">kali/thn</option>
                                  <option value="dokumen">dok/thn</option>
                                  <option value="kegiatan">keg/thn</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={tugas.waktuPenyelesaian}
                                  onChange={(e) => updateAbkTugas(index, 'waktuPenyelesaian', e.target.value)}
                                  className="input-field text-sm w-20"
                                  placeholder="Jam"
                                />
                                <span className="text-xs text-gray-500">jam/kali</span>
                                <span className="text-sm font-medium text-primary-600 ml-2">
                                  = {tugas.jamPerTahun} jam/thn
                                </span>
                              </div>
                            </div>
                          </div>
                          {abkTugas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAbkTugas(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ABK Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Jam/Tahun</p>
                        <p className="text-2xl font-bold text-gray-900">{formData.totalJamKerja.toLocaleString()} jam</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rata-rata Jam/Bulan</p>
                        <p className="text-2xl font-bold text-gray-900">{Math.round(formData.totalJamKerja / 12)} jam</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Kebutuhan Tenaga</p>
                        <p className="text-2xl font-bold text-primary-600">{formData.jumlahOrang} orang</p>
                        <p className="text-xs text-gray-500">
                          ({Math.round(formData.totalJamKerja / 12)} ÷ {JAM_KERJA_STANDAR} jam)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kesimpulan ABK
                    </label>
                    <textarea
                      value={formData.kesimpulanAbk}
                      onChange={(e) => setFormData({ ...formData, kesimpulanAbk: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Kesimpulan dari analisis beban kerja..."
                    />
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ak')}
                      className="btn-secondary"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tor')}
                      className="btn-primary flex items-center gap-2"
                    >
                      Lanjut ke TOR/KAK
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: TOR/KAK */}
              {activeTab === 'tor' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latar Belakang
                    </label>
                    <textarea
                      value={formData.latarBelakang}
                      onChange={(e) => setFormData({ ...formData, latarBelakang: e.target.value })}
                      className="input-field"
                      rows={4}
                      placeholder="Latar belakang kebutuhan PJLP..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan
                    </label>
                    <textarea
                      value={formData.tujuan}
                      onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Tujuan pengadaan PJLP..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ruang Lingkup Pekerjaan
                    </label>
                    <textarea
                      value={formData.ruangLingkup}
                      onChange={(e) => setFormData({ ...formData, ruangLingkup: e.target.value })}
                      className="input-field"
                      rows={4}
                      placeholder="Ruang lingkup dan uraian pekerjaan..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output Pekerjaan
                    </label>
                    <textarea
                      value={formData.outputPekerjaan}
                      onChange={(e) => setFormData({ ...formData, outputPekerjaan: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Output yang diharapkan..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kualifikasi yang Diperlukan
                    </label>
                    <textarea
                      value={formData.kualifikasi}
                      onChange={(e) => setFormData({ ...formData, kualifikasi: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Kualifikasi pendidikan, pengalaman, keahlian..."
                    />
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('abk')}
                      className="btn-secondary"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('hps')}
                      className="btn-primary flex items-center gap-2"
                    >
                      Lanjut ke HPS
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: HPS/RAB */}
              {activeTab === 'hps' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jumlah Orang
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.jumlahOrang}
                        onChange={(e) => setFormData({ ...formData, jumlahOrang: parseInt(e.target.value) || 1 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Honor Bulanan (Rp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.honorBulanan}
                        onChange={(e) => setFormData({ ...formData, honorBulanan: e.target.value })}
                        className="input-field"
                        placeholder="Contoh: 4500000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durasi Kontrak (bulan)
                      </label>
                      <select
                        value={formData.durasiKontrak}
                        onChange={(e) => setFormData({ ...formData, durasiKontrak: parseInt(e.target.value) })}
                        className="input-field"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                          <option key={m} value={m}>{m} bulan</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* HPS Calculation */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium text-gray-900">Perhitungan HPS</h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Honor ({formData.jumlahOrang} org × {formatCurrency(parseFloat(formData.honorBulanan) || 0)} × {formData.durasiKontrak} bln)</span>
                        <span>{formatCurrency((parseFloat(formData.honorBulanan) || 0) * formData.durasiKontrak * formData.jumlahOrang)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>BPJS Kesehatan (1%)</span>
                        <span>{formatCurrency(formData.biayaBpjsKesehatan)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>BPJS Ketenagakerjaan (2%)</span>
                        <span>{formatCurrency(formData.biayaBpjsKetenagakerjaan)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>THR (1 bulan)</span>
                        <span>{formatCurrency(formData.biayaThr)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-medium">
                        <span>Total HPS</span>
                        <span className="text-lg text-primary-600">{formatCurrency(formData.totalHps)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <p>Estimasi PPh 21 (2.5% dengan NPWP): {formatCurrency(formData.estimasiPph)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-field"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Disetujui">Disetujui</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={formData.keterangan}
                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                        className="input-field"
                        placeholder="Keterangan tambahan"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tor')}
                      className="btn-secondary"
                    >
                      Kembali
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false)
                          resetForm()
                        }}
                        className="btn-secondary"
                      >
                        Batal
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingId ? 'Update' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
