import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FileText, Eye, Printer,
  FileDown, MapPin, Calendar, Users
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import db, { JENIS_PERJADIN } from '../../db/database'
import { formatTanggal, formatDateInput, hitungHari } from '../../utils/formatters'
import { generateNomorSuratTugas } from '../../utils/autoNumber'
import { generateSuratTugasDocx, generateSuratTugasPDF } from '../../utils/documentGenerator'

const TRANSPORTASI_OPTIONS = [
  { value: 'pesawat', label: 'Pesawat Udara' },
  { value: 'kapal', label: 'Kapal Laut' },
  { value: 'kereta', label: 'Kereta Api' },
  { value: 'bus', label: 'Bus / Travel' },
  { value: 'mobil_dinas', label: 'Mobil Dinas' },
  { value: 'mobil_pribadi', label: 'Kendaraan Pribadi' }
]

const JENIS_PERJADIN_OPTIONS = [
  { value: JENIS_PERJADIN.DALAM_KOTA, label: 'Perjalanan Dinas Dalam Kota' },
  { value: JENIS_PERJADIN.LUAR_KOTA, label: 'Perjalanan Dinas Luar Kota' }
]

const initialFormData = {
  perihal: '',
  dasar: '',
  tujuanKegiatan: '',
  pegawaiIds: [],
  kotaAsal: '',
  kotaTujuan: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  transportasi: '',
  jenisPerjadin: JENIS_PERJADIN.LUAR_KOTA
}

export default function SuratTugas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allSuratTugas = useLiveQuery(() =>
    db.suratTugas.orderBy('createdAt').reverse().toArray()
  ) || []

  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []
  const allKota = useLiveQuery(() => db.kota.toArray()) || []

  // Filter by search query
  const filteredSuratTugas = allSuratTugas.filter(st =>
    st.nomor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.perihal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.kotaTujuan?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredSuratTugas.length / itemsPerPage)
  const paginatedSuratTugas = filteredSuratTugas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const kotaOptions = allKota.map(k => ({
    value: k.namaKota,
    label: `${k.namaKota}, ${k.provinsi}`
  }))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePegawaiChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
    setFormData(prev => ({ ...prev, pegawaiIds: selectedOptions }))
  }

  const handleOpenModal = async (suratTugas = null) => {
    if (suratTugas) {
      setEditingId(suratTugas.id)
      setFormData({
        perihal: suratTugas.perihal || '',
        dasar: suratTugas.dasar || '',
        tujuanKegiatan: suratTugas.tujuanKegiatan || '',
        pegawaiIds: suratTugas.pegawaiIds || [],
        kotaAsal: suratTugas.kotaAsal || '',
        kotaTujuan: suratTugas.kotaTujuan || '',
        tanggalMulai: formatDateInput(suratTugas.tanggalMulai),
        tanggalSelesai: formatDateInput(suratTugas.tanggalSelesai),
        transportasi: suratTugas.transportasi || '',
        jenisPerjadin: suratTugas.jenisPerjadin || JENIS_PERJADIN.LUAR_KOTA
      })
    } else {
      setEditingId(null)
      setFormData({
        ...initialFormData,
        kotaAsal: 'Sorong' // Default kota asal
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        tanggalMulai: new Date(formData.tanggalMulai),
        tanggalSelesai: new Date(formData.tanggalSelesai),
        status: 'draft',
        updatedAt: new Date()
      }

      if (editingId) {
        await db.suratTugas.update(editingId, data)
      } else {
        // Generate nomor otomatis
        data.nomor = await generateNomorSuratTugas()
        data.tanggal = new Date()
        data.createdAt = new Date()
        await db.suratTugas.add(data)
      }

      handleCloseModal()
    } catch (error) {
      alert('Gagal menyimpan data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await db.suratTugas.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (suratTugas) => {
    // Get pegawai names
    const pegawaiNames = await Promise.all(
      (suratTugas.pegawaiIds || []).map(async (id) => {
        const p = await db.pegawai.get(id)
        return p ? { nama: p.nama, nip: p.nip, jabatan: p.jabatan } : null
      })
    )

    setViewingData({
      ...suratTugas,
      pegawaiList: pegawaiNames.filter(Boolean)
    })
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handleGenerateDocument = async (suratTugas, format) => {
    try {
      const pegawaiList = await Promise.all(
        (suratTugas.pegawaiIds || []).map(async (id) => {
          return await db.pegawai.get(id)
        })
      )

      const data = {
        ...suratTugas,
        pegawaiList: pegawaiList.filter(Boolean)
      }

      if (format === 'docx') {
        await generateSuratTugasDocx(data)
      } else {
        await generateSuratTugasPDF(data)
      }
    } catch (error) {
      alert('Gagal membuat dokumen: ' + error.message)
    }
  }

  const getJenisPerjadinLabel = (jenis) => {
    return jenis === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'
  }

  return (
    <Layout title="Surat Tugas">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Daftar Surat Tugas
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari surat tugas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Surat Tugas
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nomor ST</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Perihal</TableHeader>
                <TableHeader>Tujuan</TableHeader>
                <TableHeader>Jenis</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSuratTugas.length > 0 ? (
                paginatedSuratTugas.map((st, index) => (
                  <TableRow key={st.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {st.nomor}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTanggal(st.tanggal, 'short')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {st.perihal}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {st.kotaTujuan}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                        {getJenisPerjadinLabel(st.jenisPerjadin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={st.status || 'draft'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(st)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(st)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateDocument(st, 'pdf')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(st.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada surat tugas'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSuratTugas.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Surat Tugas' : 'Buat Surat Tugas Baru'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Jenis Perjalanan Dinas */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="label mb-2">Jenis Perjalanan Dinas</label>
            <div className="flex gap-4">
              {JENIS_PERJADIN_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.jenisPerjadin === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="jenisPerjadin"
                    value={option.value}
                    checked={formData.jenisPerjadin === option.value}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Perihal / Judul Kegiatan"
                name="perihal"
                value={formData.perihal}
                onChange={handleInputChange}
                placeholder="Mengikuti Rapat Koordinasi..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Dasar Surat Tugas"
                name="dasar"
                value={formData.dasar}
                onChange={handleInputChange}
                placeholder="1. Undangan Nomor...&#10;2. DIPA Tahun Anggaran..."
                rows={3}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Tujuan Kegiatan"
                name="tujuanKegiatan"
                value={formData.tujuanKegiatan}
                onChange={handleInputChange}
                placeholder="Untuk mengikuti kegiatan..."
                rows={2}
              />
            </div>

            {/* Pegawai Selection */}
            <div className="md:col-span-2">
              <label className="label">
                Pegawai yang Ditugaskan <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                value={formData.pegawaiIds.map(String)}
                onChange={handlePegawaiChange}
                className="input h-32"
                required
              >
                {allPegawai.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama} - {p.jabatan} ({p.nip})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Tahan Ctrl/Cmd untuk memilih beberapa pegawai
              </p>
            </div>

            <Select
              label="Kota Asal"
              name="kotaAsal"
              value={formData.kotaAsal}
              onChange={handleInputChange}
              options={kotaOptions}
              required
            />

            <Select
              label="Kota Tujuan"
              name="kotaTujuan"
              value={formData.kotaTujuan}
              onChange={handleInputChange}
              options={kotaOptions}
              required
            />

            <Input
              label="Tanggal Mulai"
              name="tanggalMulai"
              type="date"
              value={formData.tanggalMulai}
              onChange={handleInputChange}
              required
            />

            <Input
              label="Tanggal Selesai"
              name="tanggalSelesai"
              type="date"
              value={formData.tanggalSelesai}
              onChange={handleInputChange}
              required
            />

            <div className="md:col-span-2">
              <Select
                label="Alat Transportasi"
                name="transportasi"
                value={formData.transportasi}
                onChange={handleInputChange}
                options={TRANSPORTASI_OPTIONS}
                required
              />
            </div>
          </div>

          {/* Summary */}
          {formData.tanggalMulai && formData.tanggalSelesai && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  Durasi: {hitungHari(formData.tanggalMulai, formData.tanggalSelesai)} hari
                </span>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Buat Surat Tugas'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Surat Tugas"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor Surat</label>
                <p className="font-mono font-medium">{viewingData.nomor}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal</label>
                <p>{formatTanggal(viewingData.tanggal)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Jenis Perjalanan Dinas</label>
              <p>
                <Badge variant={viewingData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                  {getJenisPerjadinLabel(viewingData.jenisPerjadin)}
                </Badge>
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Perihal</label>
              <p className="font-medium">{viewingData.perihal}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Dasar</label>
              <p className="whitespace-pre-line text-sm">{viewingData.dasar}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pegawai yang Ditugaskan</label>
              <div className="mt-2 space-y-2">
                {viewingData.pegawaiList?.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{p.nama}</p>
                      <p className="text-xs text-gray-500">{p.jabatan} - {p.nip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Kota Asal</label>
                <p>{viewingData.kotaAsal}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Kota Tujuan</label>
                <p>{viewingData.kotaTujuan}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Mulai</label>
                <p>{formatTanggal(viewingData.tanggalMulai)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Selesai</label>
                <p>{formatTanggal(viewingData.tanggalSelesai)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                icon={FileDown}
                onClick={() => handleGenerateDocument(viewingData, 'docx')}
              >
                Download Word
              </Button>
              <Button
                icon={Printer}
                onClick={() => handleGenerateDocument(viewingData, 'pdf')}
              >
                Cetak PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-gray-600">
          Apakah Anda yakin ingin menghapus surat tugas ini? SPPD terkait juga akan terhapus.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            Hapus
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
