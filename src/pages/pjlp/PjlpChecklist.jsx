import { useState, useEffect } from 'react'
import { db, CHECKLIST_PJLP } from '../../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClipboardCheck
} from 'lucide-react'
import { generateChecklistPjlpPDF } from '../../utils/pjlpDocGenerator'

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

export default function PjlpChecklist() {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [filterBulan, setFilterBulan] = useState('')
  const [formData, setFormData] = useState({
    pjlpId: '',
    kontrakId: '',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    items: CHECKLIST_PJLP.map(item => ({ ...item, checked: false, keterangan: '' })),
    namaPemeriksa: '',
    tanggalPemeriksaan: new Date().toISOString().split('T')[0],
    catatan: ''
  })

  // Queries
  const checklistList = useLiveQuery(
    () => db.pjlpChecklist.orderBy('createdAt').reverse().toArray(),
    []
  )

  const pjlpList = useLiveQuery(
    () => db.pjlpMaster.where('statusAktif').equals('aktif').toArray(),
    []
  )

  const kontrakList = useLiveQuery(
    () => db.pjlpKontrak.toArray(),
    []
  )

  // Get PJLP info
  const getPjlpInfo = (pjlpId) => {
    return pjlpList?.find(p => p.id === pjlpId)
  }

  // Filter data
  const filteredData = checklistList?.filter(item => {
    const pjlp = getPjlpInfo(item.pjlpId)
    const matchesSearch = !searchQuery ||
      pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTahun = !filterTahun || item.tahun === parseInt(filterTahun)
    const matchesBulan = !filterBulan || item.bulan === parseInt(filterBulan)
    return matchesSearch && matchesTahun && matchesBulan
  })

  // Stats
  const stats = {
    total: filteredData?.length || 0,
    lengkap: filteredData?.filter(c => c.statusKelengkapan === 'Lengkap').length || 0,
    belumLengkap: filteredData?.filter(c => c.statusKelengkapan === 'Belum Lengkap').length || 0
  }

  // Get active kontrak for selected PJLP
  const getKontrakForPjlp = (pjlpId) => {
    return kontrakList?.filter(k => k.pjlpId === parseInt(pjlpId) && k.status === 'Aktif') || []
  }

  const resetForm = () => {
    setFormData({
      pjlpId: '',
      kontrakId: '',
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
      items: CHECKLIST_PJLP.map(item => ({ ...item, checked: false, keterangan: '' })),
      namaPemeriksa: '',
      tanggalPemeriksaan: new Date().toISOString().split('T')[0],
      catatan: ''
    })
    setEditingId(null)
  }

  const handleCheckItem = (index, checked) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], checked }
    setFormData({ ...formData, items: newItems })
  }

  const handleItemKeterangan = (index, keterangan) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], keterangan }
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const totalItem = formData.items.length
    const itemLengkap = formData.items.filter(i => i.checked).length
    const statusKelengkapan = itemLengkap === totalItem ? 'Lengkap' : 'Belum Lengkap'

    const data = {
      pjlpId: parseInt(formData.pjlpId),
      kontrakId: parseInt(formData.kontrakId),
      bulan: parseInt(formData.bulan),
      tahun: parseInt(formData.tahun),
      items: formData.items,
      statusKelengkapan,
      totalItem,
      itemLengkap,
      namaPemeriksa: formData.namaPemeriksa,
      tanggalPemeriksaan: formData.tanggalPemeriksaan,
      catatan: formData.catatan
    }

    try {
      if (editingId) {
        await db.pjlpChecklist.update(editingId, data)
      } else {
        await db.pjlpChecklist.add({
          ...data,
          createdAt: new Date().toISOString()
        })
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving checklist:', error)
      alert('Gagal menyimpan data checklist')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      pjlpId: item.pjlpId.toString(),
      kontrakId: item.kontrakId.toString(),
      bulan: item.bulan,
      tahun: item.tahun,
      items: item.items || CHECKLIST_PJLP.map(i => ({ ...i, checked: false, keterangan: '' })),
      namaPemeriksa: item.namaPemeriksa || '',
      tanggalPemeriksaan: item.tanggalPemeriksaan || '',
      catatan: item.catatan || ''
    })
    setEditingId(item.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus data checklist ini?')) {
      try {
        await db.pjlpChecklist.delete(id)
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const handleExportPDF = async (item) => {
    const pjlp = getPjlpInfo(item.pjlpId)
    const kontrak = kontrakList?.find(k => k.id === item.kontrakId)
    const bulanLabel = BULAN_OPTIONS.find(b => b.value === item.bulan)?.label || ''

    await generateChecklistPjlpPDF({
      ...item,
      namaPjlp: pjlp?.nama || '-',
      posisi: pjlp?.posisi || kontrak?.posisi || '-',
      nomorKontrak: kontrak?.nomorKontrak || '-',
      bulanLabel
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist SPJ PJLP</h1>
          <p className="text-gray-600">Berdasarkan Kepmen KP No.56 Tahun 2024</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Checklist
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Checklist</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.lengkap}</p>
              <p className="text-xs text-gray-500">SPJ Lengkap</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.belumLengkap}</p>
              <p className="text-xs text-gray-500">Belum Lengkap</p>
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
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="input-field w-full md:w-40"
          >
            <option value="">Semua Bulan</option>
            {BULAN_OPTIONS.map(opt => (
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
                <th className="table-header text-center">Progress</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header">Pemeriksa</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Belum ada data checklist
                  </td>
                </tr>
              ) : (
                filteredData?.map((item) => {
                  const pjlp = getPjlpInfo(item.pjlpId)
                  const bulanLabel = BULAN_OPTIONS.find(b => b.value === item.bulan)?.label || ''
                  const progressPercent = Math.round((item.itemLengkap / item.totalItem) * 100)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{pjlp?.nama || '-'}</p>
                          <p className="text-xs text-gray-500">{pjlp?.posisi || '-'}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium">{bulanLabel} {item.tahun}</p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.itemLengkap}/{item.totalItem}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        {item.statusKelengkapan === 'Lengkap' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-3 h-3" />
                            Lengkap
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1 justify-center">
                            <AlertCircle className="w-3 h-3" />
                            Belum Lengkap
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="text-sm">{item.namaPemeriksa || '-'}</p>
                          <p className="text-xs text-gray-500">{item.tanggalPemeriksaan || '-'}</p>
                        </div>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Checklist SPJ' : 'Tambah Checklist SPJ Baru'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Kepmen KP No.56 Tahun 2024</p>
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
                    Bulan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bulan}
                    onChange={(e) => setFormData({ ...formData, bulan: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {BULAN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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

              {/* Checklist Items */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Kelengkapan Dokumen SPJ</h3>
                  <span className="text-sm text-gray-500">
                    {formData.items.filter(i => i.checked).length}/{formData.items.length} item
                  </span>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleCheckItem(index, e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">{index + 1}.</span>
                        <label className={`text-sm ${item.checked ? 'text-gray-900' : 'text-gray-600'}`}>
                          {item.nama}
                        </label>
                        {item.wajib && (
                          <span className="text-xs text-red-500">*wajib</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Keterangan (opsional)"
                        value={item.keterangan || ''}
                        onChange={(e) => handleItemKeterangan(index, e.target.value)}
                        className="mt-2 input-field text-sm"
                      />
                    </div>
                    {item.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 mt-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Pemeriksa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pemeriksa
                  </label>
                  <input
                    type="text"
                    value={formData.namaPemeriksa}
                    onChange={(e) => setFormData({ ...formData, namaPemeriksa: e.target.value })}
                    className="input-field"
                    placeholder="Nama pemeriksa SPJ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pemeriksaan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPemeriksaan}
                    onChange={(e) => setFormData({ ...formData, tanggalPemeriksaan: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Catatan tambahan..."
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
