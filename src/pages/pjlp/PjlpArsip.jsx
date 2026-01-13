import { useState } from 'react'
import { db, generatePathArsipPjlp, generateNamaFileArsipPjlp } from '../../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  FolderArchive,
  Download,
  Eye,
  Filter,
  Folder,
  File,
  Calendar,
  User
} from 'lucide-react'

const JENIS_DOKUMEN = [
  { value: 'kontrak', label: 'Kontrak / SPK' },
  { value: 'spmk', label: 'SPMK' },
  { value: 'presensi', label: 'Rekap Presensi' },
  { value: 'laporan_bulanan', label: 'Laporan Bulanan' },
  { value: 'kwitansi', label: 'Kwitansi Pembayaran' },
  { value: 'penilaian', label: 'Penilaian Triwulan' },
  { value: 'checklist', label: 'Checklist SPJ' },
  { value: 'bpjs', label: 'Bukti BPJS' },
  { value: 'pajak', label: 'Bukti Potong Pajak' },
  { value: 'lainnya', label: 'Dokumen Lainnya' }
]

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

export default function PjlpArsip() {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [filterPjlp, setFilterPjlp] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'folder'
  const [formData, setFormData] = useState({
    pjlpId: '',
    tahun: new Date().getFullYear(),
    jenisDokumen: '',
    bulan: '',
    triwulan: '',
    namaDokumen: '',
    namaFile: '',
    ukuranFile: '',
    keterangan: ''
  })

  // Queries
  const arsipList = useLiveQuery(
    () => db.pjlpArsip.orderBy('createdAt').reverse().toArray(),
    []
  )

  const pjlpList = useLiveQuery(
    () => db.pjlpMaster.toArray(),
    []
  )

  // Get PJLP info
  const getPjlpInfo = (pjlpId) => {
    return pjlpList?.find(p => p.id === pjlpId)
  }

  // Filter data
  const filteredData = arsipList?.filter(item => {
    const pjlp = getPjlpInfo(item.pjlpId)
    const matchesSearch = !searchQuery ||
      item.namaDokumen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTahun = !filterTahun || item.tahun === parseInt(filterTahun)
    const matchesPjlp = !filterPjlp || item.pjlpId === parseInt(filterPjlp)
    const matchesJenis = !filterJenis || item.jenisDokumen === filterJenis
    return matchesSearch && matchesTahun && matchesPjlp && matchesJenis
  })

  // Stats by PJLP (for folder view)
  const folderStats = pjlpList?.reduce((acc, pjlp) => {
    const docs = arsipList?.filter(a =>
      a.pjlpId === pjlp.id &&
      (!filterTahun || a.tahun === parseInt(filterTahun))
    ) || []
    if (docs.length > 0) {
      acc.push({
        pjlp,
        count: docs.length,
        docs
      })
    }
    return acc
  }, []) || []

  // Stats
  const stats = {
    total: filteredData?.length || 0,
    totalPjlp: folderStats.length,
    totalSize: filteredData?.reduce((sum, a) => sum + (parseFloat(a.ukuranFile) || 0), 0) || 0
  }

  const resetForm = () => {
    setFormData({
      pjlpId: '',
      tahun: new Date().getFullYear(),
      jenisDokumen: '',
      bulan: '',
      triwulan: '',
      namaDokumen: '',
      namaFile: '',
      ukuranFile: '',
      keterangan: ''
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const pjlp = getPjlpInfo(parseInt(formData.pjlpId))
    const pathArsip = generatePathArsipPjlp(formData.tahun, pjlp?.nama || 'Unknown')

    // Generate filename if not provided
    let namaFile = formData.namaFile
    if (!namaFile) {
      const ext = 'pdf'
      const bulanOrTriwulan = formData.bulan || formData.triwulan || ''
      namaFile = generateNamaFileArsipPjlp(
        formData.tahun,
        formData.jenisDokumen,
        bulanOrTriwulan,
        pjlp?.nama || 'Unknown',
        ext
      )
    }

    const data = {
      pjlpId: parseInt(formData.pjlpId),
      tahun: parseInt(formData.tahun),
      jenisDokumen: formData.jenisDokumen,
      bulan: formData.bulan ? parseInt(formData.bulan) : null,
      triwulan: formData.triwulan ? parseInt(formData.triwulan) : null,
      namaDokumen: formData.namaDokumen,
      namaFile,
      ukuranFile: formData.ukuranFile,
      pathArsip,
      keterangan: formData.keterangan
    }

    try {
      if (editingId) {
        await db.pjlpArsip.update(editingId, data)
      } else {
        await db.pjlpArsip.add({
          ...data,
          createdAt: new Date().toISOString()
        })
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving arsip:', error)
      alert('Gagal menyimpan data arsip')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      pjlpId: item.pjlpId.toString(),
      tahun: item.tahun,
      jenisDokumen: item.jenisDokumen,
      bulan: item.bulan?.toString() || '',
      triwulan: item.triwulan?.toString() || '',
      namaDokumen: item.namaDokumen,
      namaFile: item.namaFile || '',
      ukuranFile: item.ukuranFile || '',
      keterangan: item.keterangan || ''
    })
    setEditingId(item.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus arsip dokumen ini?')) {
      try {
        await db.pjlpArsip.delete(id)
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const formatFileSize = (sizeInKB) => {
    if (!sizeInKB) return '-'
    if (sizeInKB < 1024) return `${sizeInKB} KB`
    return `${(sizeInKB / 1024).toFixed(2)} MB`
  }

  const getJenisLabel = (jenis) => {
    return JENIS_DOKUMEN.find(j => j.value === jenis)?.label || jenis
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arsip Dokumen PJLP</h1>
          <p className="text-gray-600">Pengelolaan arsip digital per PJLP</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Arsip
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Dokumen</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalPjlp}</p>
              <p className="text-xs text-gray-500">PJLP dengan Arsip</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderArchive className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</p>
              <p className="text-xs text-gray-500">Total Ukuran</p>
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
              placeholder="Cari dokumen atau nama PJLP..."
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
            value={filterPjlp}
            onChange={(e) => setFilterPjlp(e.target.value)}
            className="input-field w-full md:w-48"
          >
            <option value="">Semua PJLP</option>
            {pjlpList?.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="input-field w-full md:w-48"
          >
            <option value="">Semua Jenis</option>
            {JENIS_DOKUMEN.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Tampilan List"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('folder')}
              className={`p-2 rounded ${viewMode === 'folder' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Tampilan Folder"
            >
              <Folder className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content - List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Nama PJLP</th>
                  <th className="table-header">Dokumen</th>
                  <th className="table-header">Jenis</th>
                  <th className="table-header">Periode</th>
                  <th className="table-header">Path Arsip</th>
                  <th className="table-header text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Belum ada data arsip
                    </td>
                  </tr>
                ) : (
                  filteredData?.map((item) => {
                    const pjlp = getPjlpInfo(item.pjlpId)
                    const bulanLabel = item.bulan ? BULAN_OPTIONS.find(b => b.value === item.bulan)?.label : null
                    const triwulanLabel = item.triwulan ? `TW ${item.triwulan}` : null

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{pjlp?.nama || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{item.namaDokumen}</p>
                              <p className="text-xs text-gray-500">{item.namaFile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {getJenisLabel(item.jenisDokumen)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">
                              {bulanLabel || triwulanLabel || '-'} {item.tahun}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {item.pathArsip}
                          </code>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center justify-center gap-1">
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
      )}

      {/* Content - Folder View */}
      {viewMode === 'folder' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folderStats.length === 0 ? (
            <div className="col-span-full card p-8 text-center text-gray-500">
              Belum ada arsip dokumen
            </div>
          ) : (
            folderStats.map(({ pjlp, count, docs }) => (
              <div key={pjlp.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Folder className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{pjlp.nama}</h3>
                    <p className="text-xs text-gray-500">{pjlp.posisi}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{count} dokumen</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      <code>ARSIP/{filterTahun}/PJLP/{pjlp.nama.replace(/\s+/g, '_')}/</code>
                    </div>
                  </div>
                </div>
                {/* Document list preview */}
                <div className="mt-4 space-y-1 max-h-32 overflow-y-auto">
                  {docs.slice(0, 5).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs text-gray-600 p-1 hover:bg-gray-50 rounded">
                      <File className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{doc.namaDokumen}</span>
                    </div>
                  ))}
                  {docs.length > 5 && (
                    <p className="text-xs text-gray-400 pl-5">+{docs.length - 5} dokumen lainnya</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Arsip' : 'Tambah Arsip Baru'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* PJLP & Tahun */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PJLP <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pjlpId}
                    onChange={(e) => setFormData({ ...formData, pjlpId: e.target.value })}
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
              </div>

              {/* Jenis Dokumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Dokumen <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jenisDokumen}
                  onChange={(e) => setFormData({ ...formData, jenisDokumen: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Pilih Jenis</option>
                  {JENIS_DOKUMEN.map(j => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>

              {/* Periode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan (opsional)
                  </label>
                  <select
                    value={formData.bulan}
                    onChange={(e) => setFormData({ ...formData, bulan: e.target.value, triwulan: '' })}
                    className="input-field"
                  >
                    <option value="">-</option>
                    {BULAN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Triwulan (opsional)
                  </label>
                  <select
                    value={formData.triwulan}
                    onChange={(e) => setFormData({ ...formData, triwulan: e.target.value, bulan: '' })}
                    className="input-field"
                  >
                    <option value="">-</option>
                    <option value="1">Triwulan I</option>
                    <option value="2">Triwulan II</option>
                    <option value="3">Triwulan III</option>
                    <option value="4">Triwulan IV</option>
                  </select>
                </div>
              </div>

              {/* Nama Dokumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaDokumen}
                  onChange={(e) => setFormData({ ...formData, namaDokumen: e.target.value })}
                  className="input-field"
                  placeholder="Nama/judul dokumen"
                  required
                />
              </div>

              {/* Nama File & Ukuran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama File
                  </label>
                  <input
                    type="text"
                    value={formData.namaFile}
                    onChange={(e) => setFormData({ ...formData, namaFile: e.target.value })}
                    className="input-field"
                    placeholder="Auto-generate jika kosong"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ukuran File (KB)
                  </label>
                  <input
                    type="number"
                    value={formData.ukuranFile}
                    onChange={(e) => setFormData({ ...formData, ukuranFile: e.target.value })}
                    className="input-field"
                    placeholder="Ukuran dalam KB"
                  />
                </div>
              </div>

              {/* Path Preview */}
              {formData.pjlpId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Path Arsip:</p>
                  <code className="text-sm text-primary-600">
                    {generatePathArsipPjlp(formData.tahun, getPjlpInfo(parseInt(formData.pjlpId))?.nama || 'Unknown')}
                  </code>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Keterangan tambahan..."
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
