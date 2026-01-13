import { useState, useEffect } from 'react'
import { db, BOBOT_PENILAIAN_PJLP } from '../../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Star,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { generatePenilaianPjlpPDF } from '../../utils/pjlpDocGenerator'

const KATEGORI_PENILAIAN = [
  { min: 0, max: 50, label: 'Kurang', color: 'bg-red-100 text-red-800' },
  { min: 50.01, max: 65, label: 'Cukup', color: 'bg-yellow-100 text-yellow-800' },
  { min: 65.01, max: 80, label: 'Baik', color: 'bg-blue-100 text-blue-800' },
  { min: 80.01, max: 100, label: 'Sangat Baik', color: 'bg-green-100 text-green-800' }
]

const TRIWULAN_OPTIONS = [
  { value: 1, label: 'Triwulan I (Jan-Mar)' },
  { value: 2, label: 'Triwulan II (Apr-Jun)' },
  { value: 3, label: 'Triwulan III (Jul-Sep)' },
  { value: 4, label: 'Triwulan IV (Okt-Des)' }
]

function getKategori(nilaiAkhir) {
  for (const k of KATEGORI_PENILAIAN) {
    if (nilaiAkhir >= k.min && nilaiAkhir <= k.max) {
      return k
    }
  }
  return KATEGORI_PENILAIAN[0]
}

function calculateNilaiAkhir(nilai) {
  const kualitas = (parseFloat(nilai.nilaiKualitas) || 0) * (BOBOT_PENILAIAN_PJLP.kualitas / 100)
  const waktu = (parseFloat(nilai.nilaiWaktu) || 0) * (BOBOT_PENILAIAN_PJLP.waktu / 100)
  const biaya = (parseFloat(nilai.nilaiBiaya) || 0) * (BOBOT_PENILAIAN_PJLP.biaya / 100)
  const layanan = (parseFloat(nilai.nilaiLayanan) || 0) * (BOBOT_PENILAIAN_PJLP.layanan / 100)
  return kualitas + waktu + biaya + layanan
}

export default function PjlpPenilaian() {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [filterTriwulan, setFilterTriwulan] = useState('')
  const [previewNilai, setPreviewNilai] = useState(0)
  const [formData, setFormData] = useState({
    pjlpId: '',
    kontrakId: '',
    tahun: new Date().getFullYear(),
    triwulan: 1,
    nilaiKualitas: '',
    nilaiWaktu: '',
    nilaiBiaya: '',
    nilaiLayanan: '',
    catatanPenilai: '',
    namaPenilai: '',
    tanggalPenilaian: new Date().toISOString().split('T')[0]
  })

  // Queries
  const penilaianList = useLiveQuery(
    () => db.pjlpPenilaian.orderBy('createdAt').reverse().toArray(),
    []
  )

  const pjlpList = useLiveQuery(
    () => db.pjlpMaster.where('statusAktif').equals('Aktif').toArray(),
    []
  )

  const kontrakList = useLiveQuery(
    () => db.pjlpKontrak.toArray(),
    []
  )

  // Update preview when form values change
  useEffect(() => {
    const nilaiAkhir = calculateNilaiAkhir(formData)
    setPreviewNilai(nilaiAkhir)
  }, [formData.nilaiKualitas, formData.nilaiWaktu, formData.nilaiBiaya, formData.nilaiLayanan])

  // Get PJLP info
  const getPjlpInfo = (pjlpId) => {
    return pjlpList?.find(p => p.id === pjlpId)
  }

  // Filter data
  const filteredData = penilaianList?.filter(item => {
    const pjlp = getPjlpInfo(item.pjlpId)
    const matchesSearch = !searchQuery ||
      pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTahun = !filterTahun || item.tahun === parseInt(filterTahun)
    const matchesTriwulan = !filterTriwulan || item.triwulan === parseInt(filterTriwulan)
    return matchesSearch && matchesTahun && matchesTriwulan
  })

  // Stats
  const stats = {
    total: filteredData?.length || 0,
    sangatBaik: filteredData?.filter(p => p.nilaiAkhir > 80).length || 0,
    baik: filteredData?.filter(p => p.nilaiAkhir > 65 && p.nilaiAkhir <= 80).length || 0,
    cukup: filteredData?.filter(p => p.nilaiAkhir > 50 && p.nilaiAkhir <= 65).length || 0,
    kurang: filteredData?.filter(p => p.nilaiAkhir <= 50).length || 0
  }

  // Get active kontrak for selected PJLP
  const getKontrakForPjlp = (pjlpId) => {
    return kontrakList?.filter(k => k.pjlpId === parseInt(pjlpId) && k.status === 'Aktif') || []
  }

  const resetForm = () => {
    setFormData({
      pjlpId: '',
      kontrakId: '',
      tahun: new Date().getFullYear(),
      triwulan: 1,
      nilaiKualitas: '',
      nilaiWaktu: '',
      nilaiBiaya: '',
      nilaiLayanan: '',
      catatanPenilai: '',
      namaPenilai: '',
      tanggalPenilaian: new Date().toISOString().split('T')[0]
    })
    setEditingId(null)
    setPreviewNilai(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nilaiAkhir = calculateNilaiAkhir(formData)
    const kategori = getKategori(nilaiAkhir).label

    const data = {
      ...formData,
      pjlpId: parseInt(formData.pjlpId),
      kontrakId: parseInt(formData.kontrakId),
      tahun: parseInt(formData.tahun),
      triwulan: parseInt(formData.triwulan),
      nilaiKualitas: parseFloat(formData.nilaiKualitas) || 0,
      bobotKualitas: BOBOT_PENILAIAN_PJLP.kualitas,
      nilaiWaktu: parseFloat(formData.nilaiWaktu) || 0,
      bobotWaktu: BOBOT_PENILAIAN_PJLP.waktu,
      nilaiBiaya: parseFloat(formData.nilaiBiaya) || 0,
      bobotBiaya: BOBOT_PENILAIAN_PJLP.biaya,
      nilaiLayanan: parseFloat(formData.nilaiLayanan) || 0,
      bobotLayanan: BOBOT_PENILAIAN_PJLP.layanan,
      nilaiAkhir,
      kategori
    }

    try {
      if (editingId) {
        await db.pjlpPenilaian.update(editingId, data)
      } else {
        await db.pjlpPenilaian.add({
          ...data,
          createdAt: new Date().toISOString()
        })
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving penilaian:', error)
      alert('Gagal menyimpan data penilaian')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      pjlpId: item.pjlpId.toString(),
      kontrakId: item.kontrakId.toString(),
      tahun: item.tahun,
      triwulan: item.triwulan,
      nilaiKualitas: item.nilaiKualitas.toString(),
      nilaiWaktu: item.nilaiWaktu.toString(),
      nilaiBiaya: item.nilaiBiaya.toString(),
      nilaiLayanan: item.nilaiLayanan.toString(),
      catatanPenilai: item.catatanPenilai || '',
      namaPenilai: item.namaPenilai || '',
      tanggalPenilaian: item.tanggalPenilaian || ''
    })
    setEditingId(item.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus data penilaian ini?')) {
      try {
        await db.pjlpPenilaian.delete(id)
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const handleExportPDF = async (item) => {
    const pjlp = getPjlpInfo(item.pjlpId)
    const kontrak = kontrakList?.find(k => k.id === item.kontrakId)

    await generatePenilaianPjlpPDF({
      ...item,
      namaPjlp: pjlp?.nama || '-',
      posisi: pjlp?.posisi || kontrak?.posisi || '-',
      unitKerja: pjlp?.unitKerja || '-',
      nomorKontrak: kontrak?.nomorKontrak || '-'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penilaian Triwulan PJLP</h1>
          <p className="text-gray-600">Penilaian kinerja PJLP per triwulan</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Penilaian
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Star className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Penilaian</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.sangatBaik}</p>
              <p className="text-xs text-gray-500">Sangat Baik</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.baik}</p>
              <p className="text-xs text-gray-500">Baik</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.cukup}</p>
              <p className="text-xs text-gray-500">Cukup</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.kurang}</p>
              <p className="text-xs text-gray-500">Kurang</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama PJLP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="input-field w-full md:w-32"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={filterTriwulan}
            onChange={(e) => setFilterTriwulan(e.target.value)}
            className="input-field w-full md:w-48"
          >
            <option value="">Semua Triwulan</option>
            {TRIWULAN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Nama PJLP</th>
                <th className="table-header">Periode</th>
                <th className="table-header text-center">Kualitas (40%)</th>
                <th className="table-header text-center">Waktu (20%)</th>
                <th className="table-header text-center">Biaya (20%)</th>
                <th className="table-header text-center">Layanan (20%)</th>
                <th className="table-header text-center">Nilai Akhir</th>
                <th className="table-header text-center">Kategori</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData?.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    Belum ada data penilaian
                  </td>
                </tr>
              ) : (
                filteredData?.map((item) => {
                  const pjlp = getPjlpInfo(item.pjlpId)
                  const kategori = getKategori(item.nilaiAkhir)
                  const triwulanLabel = TRIWULAN_OPTIONS.find(t => t.value === item.triwulan)?.label || ''

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{pjlp?.nama || '-'}</p>
                          <p className="text-xs text-gray-500">{pjlp?.posisi || '-'}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium">{triwulanLabel}</p>
                          <p className="text-xs text-gray-500">{item.tahun}</p>
                        </div>
                      </td>
                      <td className="table-cell text-center">{item.nilaiKualitas}</td>
                      <td className="table-cell text-center">{item.nilaiWaktu}</td>
                      <td className="table-cell text-center">{item.nilaiBiaya}</td>
                      <td className="table-cell text-center">{item.nilaiLayanan}</td>
                      <td className="table-cell text-center">
                        <span className="font-bold text-lg">{item.nilaiAkhir.toFixed(2)}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${kategori.color}`}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleExportPDF(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Export PDF"
                          >
                            <FileText className="w-4 h-4" />
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Penilaian' : 'Tambah Penilaian Baru'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* PJLP & Kontrak Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PJLP <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pjlpId}
                    onChange={(e) => setFormData({ ...formData, pjlpId: e.target.value, kontrakId: '' })}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih PJLP</option>
                    {pjlpList?.map(pjlp => (
                      <option key={pjlp.id} value={pjlp.id}>
                        {pjlp.nama} - {pjlp.posisi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontrak <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kontrakId}
                    onChange={(e) => setFormData({ ...formData, kontrakId: e.target.value })}
                    className="input-field"
                    required
                    disabled={!formData.pjlpId}
                  >
                    <option value="">Pilih Kontrak</option>
                    {getKontrakForPjlp(formData.pjlpId)?.map(kontrak => (
                      <option key={kontrak.id} value={kontrak.id}>
                        {kontrak.nomorKontrak}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Periode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Triwulan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.triwulan}
                    onChange={(e) => setFormData({ ...formData, triwulan: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {TRIWULAN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nilai-nilai */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Komponen Penilaian</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kualitas (40%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.nilaiKualitas}
                      onChange={(e) => setFormData({ ...formData, nilaiKualitas: e.target.value })}
                      className="input-field"
                      placeholder="0-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waktu (20%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.nilaiWaktu}
                      onChange={(e) => setFormData({ ...formData, nilaiWaktu: e.target.value })}
                      className="input-field"
                      placeholder="0-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Biaya (20%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.nilaiBiaya}
                      onChange={(e) => setFormData({ ...formData, nilaiBiaya: e.target.value })}
                      className="input-field"
                      placeholder="0-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Layanan (20%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.nilaiLayanan}
                      onChange={(e) => setFormData({ ...formData, nilaiLayanan: e.target.value })}
                      className="input-field"
                      placeholder="0-100"
                      required
                    />
                  </div>
                </div>

                {/* Preview Nilai */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Nilai Akhir:</p>
                    <p className="text-3xl font-bold text-primary-600">{previewNilai.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Kategori:</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getKategori(previewNilai).color}`}>
                      {getKategori(previewNilai).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan & Penilai */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Penilai
                  </label>
                  <input
                    type="text"
                    value={formData.namaPenilai}
                    onChange={(e) => setFormData({ ...formData, namaPenilai: e.target.value })}
                    className="input-field"
                    placeholder="Nama penilai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Penilaian
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPenilaian}
                    onChange={(e) => setFormData({ ...formData, tanggalPenilaian: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Penilai
                </label>
                <textarea
                  value={formData.catatanPenilai}
                  onChange={(e) => setFormData({ ...formData, catatanPenilai: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Catatan atau rekomendasi..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
