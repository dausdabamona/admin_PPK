import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, UsersRound, Eye, Printer, FileText
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { PERAN_TIM_SWAKELOLA } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'
import { generateSKTimSwakelolaPDF } from '../../utils/swakelolaDocGenerator'

const initialFormData = {
  kegiatanId: '',
  nomorSK: '',
  tanggalSK: '',
  pegawaiId: '',
  peran: 'anggota',
  honorPerBulan: '',
  jumlahBulan: '1'
}

export default function SwakelolaTim() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allTim = useLiveQuery(async () => {
    const tim = await db.swakelolaTim.orderBy('createdAt').reverse().toArray()
    return Promise.all(tim.map(async (t) => {
      const kegiatan = await db.swakelolaKegiatan.get(t.kegiatanId)
      const pegawai = await db.pegawai.get(t.pegawaiId)
      return { ...t, kegiatan, pegawai }
    }))
  }) || []

  const allKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []

  // Filter by kegiatan and search
  const filteredTim = allTim.filter(t => {
    const matchSearch = t.pegawai?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchKegiatan = !selectedKegiatan || t.kegiatanId === parseInt(selectedKegiatan)
    return matchSearch && matchKegiatan
  })

  // Pagination
  const totalPages = Math.ceil(filteredTim.length / itemsPerPage)
  const paginatedTim = filteredTim.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const kegiatanOptions = allKegiatan.map(k => ({
    value: k.id.toString(),
    label: `${k.kode} - ${k.nama}`
  }))

  const pegawaiOptions = allPegawai.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nip})`
  }))

  const peranOptions = PERAN_TIM_SWAKELOLA.map(p => ({
    value: p.id,
    label: p.nama
  }))

  // Calculate total honor
  const totalHonor = (parseInt(formData.honorPerBulan) || 0) * (parseInt(formData.jumlahBulan) || 1)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = async (tim = null) => {
    if (tim) {
      setEditingId(tim.id)
      setFormData({
        kegiatanId: tim.kegiatanId?.toString() || '',
        nomorSK: tim.nomorSK || '',
        tanggalSK: formatDateInput(tim.tanggalSK),
        pegawaiId: tim.pegawaiId?.toString() || '',
        peran: tim.peran || 'anggota',
        honorPerBulan: tim.honorPerBulan?.toString() || '',
        jumlahBulan: tim.jumlahBulan?.toString() || '1'
      })
    } else {
      setEditingId(null)
      setFormData({
        ...initialFormData,
        tanggalSK: formatDateInput(new Date())
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
      const pegawai = await db.pegawai.get(parseInt(formData.pegawaiId))

      const data = {
        kegiatanId: parseInt(formData.kegiatanId),
        nomorSK: formData.nomorSK,
        tanggalSK: formData.tanggalSK ? new Date(formData.tanggalSK) : null,
        pegawaiId: parseInt(formData.pegawaiId),
        peran: formData.peran,
        honorPerBulan: parseInt(formData.honorPerBulan) || 0,
        jumlahBulan: parseInt(formData.jumlahBulan) || 1,
        totalHonor: totalHonor,
        rekening: pegawai?.rekening || '',
        bank: pegawai?.bank || '',
        updatedAt: new Date()
      }

      if (editingId) {
        await db.swakelolaTim.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.swakelolaTim.add(data)
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
      await db.swakelolaTim.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (tim) => {
    setViewingData(tim)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrintSK = async (kegiatanId) => {
    const kegiatan = await db.swakelolaKegiatan.get(kegiatanId)
    const timList = await db.swakelolaTim.where('kegiatanId').equals(kegiatanId).toArray()

    const timWithPegawai = await Promise.all(timList.map(async (t) => {
      const pegawai = await db.pegawai.get(t.pegawaiId)
      return { ...t, pegawai }
    }))

    await generateSKTimSwakelolaPDF({
      kegiatan,
      tim: timWithPegawai
    })
  }

  const getPeranBadge = (peran) => {
    const variants = {
      ketua: 'success',
      sekretaris: 'info',
      bendahara: 'warning',
      anggota: 'default',
      pelaksana: 'default'
    }
    const label = PERAN_TIM_SWAKELOLA.find(p => p.id === peran)?.nama || peran
    return <Badge variant={variants[peran] || 'default'}>{label}</Badge>
  }

  return (
    <Layout title="Tim Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-primary-600" />
              Tim Swakelola
            </CardTitle>
            <CardDescription>
              Kelola anggota tim pelaksana kegiatan swakelola
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedKegiatan}
              onChange={(e) => {
                setSelectedKegiatan(e.target.value)
                setCurrentPage(1)
              }}
              options={kegiatanOptions}
              placeholder="Semua Kegiatan"
              className="w-full sm:w-48"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Anggota
            </Button>
          </div>
        </CardHeader>

        {/* Print SK Button */}
        {selectedKegiatan && (
          <div className="px-6 pb-4">
            <Button
              variant="secondary"
              icon={Printer}
              onClick={() => handlePrintSK(parseInt(selectedKegiatan))}
            >
              Cetak SK Tim
            </Button>
          </div>
        )}

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Kegiatan</TableHeader>
                <TableHeader>Nama Pegawai</TableHeader>
                <TableHeader>Peran</TableHeader>
                <TableHeader>Honor/Bulan</TableHeader>
                <TableHeader>Total Honor</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTim.length > 0 ? (
                paginatedTim.map((tim, index) => (
                  <TableRow key={tim.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-mono text-xs">{tim.kegiatan?.kode}</p>
                        <p className="text-xs text-gray-500 truncate">{tim.kegiatan?.nama}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tim.pegawai?.nama}</p>
                        <p className="text-xs text-gray-500">{tim.pegawai?.jabatan}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPeranBadge(tim.peran)}
                    </TableCell>
                    <TableCell>
                      {formatRupiah(tim.honorPerBulan)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(tim.totalHonor)}
                      <span className="text-xs text-gray-500 ml-1">
                        ({tim.jumlahBulan} bln)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(tim)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(tim)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(tim.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada anggota tim'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTim.length}
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
        title={editingId ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="Kegiatan Swakelola"
              name="kegiatanId"
              value={formData.kegiatanId}
              onChange={handleInputChange}
              options={kegiatanOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor SK Tim"
                name="nomorSK"
                value={formData.nomorSK}
                onChange={handleInputChange}
                placeholder="SK/001/PKP/2024"
              />
              <Input
                label="Tanggal SK"
                name="tanggalSK"
                type="date"
                value={formData.tanggalSK}
                onChange={handleInputChange}
              />
            </div>

            <Select
              label="Pegawai"
              name="pegawaiId"
              value={formData.pegawaiId}
              onChange={handleInputChange}
              options={pegawaiOptions}
              required
            />

            <Select
              label="Peran dalam Tim"
              name="peran"
              value={formData.peran}
              onChange={handleInputChange}
              options={peranOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput
                label="Honor per Bulan"
                name="honorPerBulan"
                value={formData.honorPerBulan}
                onChange={handleInputChange}
              />
              <Input
                label="Jumlah Bulan"
                name="jumlahBulan"
                type="number"
                min="1"
                value={formData.jumlahBulan}
                onChange={handleInputChange}
              />
            </div>

            {/* Total Honor Preview */}
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Total Honor:</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupiah(totalHonor)}
              </p>
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Anggota Tim"
        size="md"
      >
        {viewingData && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Kegiatan</label>
              <p className="font-mono text-sm">{viewingData.kegiatan?.kode}</p>
              <p className="font-medium">{viewingData.kegiatan?.nama}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor SK</label>
                <p>{viewingData.nomorSK || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal SK</label>
                <p>{viewingData.tanggalSK ? formatTanggal(viewingData.tanggalSK) : '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pegawai</label>
              <p className="font-medium">{viewingData.pegawai?.nama}</p>
              <p className="text-sm text-gray-500">{viewingData.pegawai?.jabatan}</p>
              <p className="text-sm text-gray-500">NIP: {viewingData.pegawai?.nip}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Peran</label>
              <p>{getPeranBadge(viewingData.peran)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Honor/Bulan:</span>
                  <p className="font-medium">{formatRupiah(viewingData.honorPerBulan)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Jumlah Bulan:</span>
                  <p className="font-medium">{viewingData.jumlahBulan} bulan</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <span className="text-gray-500">Total Honor:</span>
                <p className="text-xl font-bold text-green-600">{formatRupiah(viewingData.totalHonor)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Rekening</label>
              <p className="font-mono">{viewingData.rekening || viewingData.pegawai?.rekening}</p>
              <p className="text-sm text-gray-500">{viewingData.bank || viewingData.pegawai?.bank}</p>
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
          Apakah Anda yakin ingin menghapus anggota tim ini?
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
