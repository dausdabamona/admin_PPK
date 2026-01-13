import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, CalendarDays, Eye, Printer
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, TextArea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { BULAN_INDONESIA } from '../../db/database'
import { formatRupiah } from '../../utils/formatters'
import { generatePresensiPjlpPDF } from '../../utils/pjlpDocGenerator'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const initialFormData = {
  pjlpId: '',
  kontrakId: '',
  bulan: currentMonth.toString(),
  tahun: currentYear.toString(),
  hariKerja: '22',
  hadir: '',
  izin: '0',
  sakit: '0',
  alpa: '0',
  terlambat: '0',
  keterangan: ''
}

export default function PjlpPresensi() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [filterBulan, setFilterBulan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allPresensi = useLiveQuery(async () => {
    const presensi = await db.pjlpPresensi.orderBy('createdAt').reverse().toArray()
    return Promise.all(presensi.map(async (p) => {
      const pjlp = await db.pjlpMaster.get(p.pjlpId)
      const kontrak = p.kontrakId ? await db.pjlpKontrak.get(p.kontrakId) : null
      return { ...p, pjlp, kontrak }
    }))
  }) || []

  const allPjlp = useLiveQuery(() =>
    db.pjlpMaster.where('statusAktif').equals('aktif').toArray()
  ) || []

  const allKontrak = useLiveQuery(() =>
    db.pjlpKontrak.where('status').equals('aktif').toArray()
  ) || []

  // Filter
  const filteredPresensi = allPresensi.filter(p => {
    const matchSearch = p.pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchBulan = !filterBulan || p.bulan === parseInt(filterBulan)
    return matchSearch && matchBulan
  })

  // Pagination
  const totalPages = Math.ceil(filteredPresensi.length / itemsPerPage)
  const paginatedPresensi = filteredPresensi.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const pjlpOptions = allPjlp.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nik})`
  }))

  const kontrakOptions = allKontrak
    .filter(k => !formData.pjlpId || k.pjlpId === parseInt(formData.pjlpId))
    .map(k => ({
      value: k.id.toString(),
      label: k.nomorKontrak
    }))

  const bulanOptions = BULAN_INDONESIA.map(b => ({
    value: b.value.toString(),
    label: b.label
  }))

  const tahunOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - 2 + i).toString(),
    label: (currentYear - 2 + i).toString()
  }))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-calculate hadir
    if (['hariKerja', 'izin', 'sakit', 'alpa'].includes(name)) {
      const hariKerja = name === 'hariKerja' ? parseInt(value) || 0 : parseInt(formData.hariKerja) || 0
      const izin = name === 'izin' ? parseInt(value) || 0 : parseInt(formData.izin) || 0
      const sakit = name === 'sakit' ? parseInt(value) || 0 : parseInt(formData.sakit) || 0
      const alpa = name === 'alpa' ? parseInt(value) || 0 : parseInt(formData.alpa) || 0
      const hadir = hariKerja - izin - sakit - alpa

      setFormData(prev => ({
        ...prev,
        [name]: value,
        hadir: Math.max(0, hadir).toString()
      }))
    }
  }

  const handleOpenModal = (presensi = null) => {
    if (presensi) {
      setEditingId(presensi.id)
      setFormData({
        pjlpId: presensi.pjlpId?.toString() || '',
        kontrakId: presensi.kontrakId?.toString() || '',
        bulan: presensi.bulan?.toString() || currentMonth.toString(),
        tahun: presensi.tahun?.toString() || currentYear.toString(),
        hariKerja: presensi.hariKerja?.toString() || '22',
        hadir: presensi.hadir?.toString() || '',
        izin: presensi.izin?.toString() || '0',
        sakit: presensi.sakit?.toString() || '0',
        alpa: presensi.alpa?.toString() || '0',
        terlambat: presensi.terlambat?.toString() || '0',
        keterangan: presensi.keterangan || ''
      })
    } else {
      setEditingId(null)
      setFormData(initialFormData)
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
        pjlpId: parseInt(formData.pjlpId),
        kontrakId: formData.kontrakId ? parseInt(formData.kontrakId) : null,
        bulan: parseInt(formData.bulan),
        tahun: parseInt(formData.tahun),
        hariKerja: parseInt(formData.hariKerja) || 22,
        hadir: parseInt(formData.hadir) || 0,
        izin: parseInt(formData.izin) || 0,
        sakit: parseInt(formData.sakit) || 0,
        alpa: parseInt(formData.alpa) || 0,
        terlambat: parseInt(formData.terlambat) || 0,
        keterangan: formData.keterangan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pjlpPresensi.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pjlpPresensi.add(data)
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
      await db.pjlpPresensi.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (presensi) => {
    setViewingData(presensi)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (presensi) => {
    try {
      await generatePresensiPjlpPDF(presensi, presensi.pjlp)
    } catch (error) {
      alert('Gagal mencetak presensi: ' + error.message)
    }
  }

  const getBulanLabel = (bulan) => {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  const getPersentaseHadir = (hadir, hariKerja) => {
    if (!hariKerja || hariKerja === 0) return 0
    return ((hadir / hariKerja) * 100).toFixed(1)
  }

  const getPersentaseBadge = (persentase) => {
    if (persentase >= 95) return <Badge variant="success">{persentase}%</Badge>
    if (persentase >= 80) return <Badge variant="warning">{persentase}%</Badge>
    return <Badge variant="danger">{persentase}%</Badge>
  }

  return (
    <Layout title="Presensi PJLP">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-600" />
              Presensi Bulanan PJLP
            </CardTitle>
            <CardDescription>
              Kelola data presensi bulanan PJLP
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value)
                setCurrentPage(1)
              }}
              options={bulanOptions}
              placeholder="Semua Bulan"
              className="w-full sm:w-36"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-40"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Input Presensi
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Bulan/Tahun</TableHeader>
                <TableHeader>PJLP</TableHeader>
                <TableHeader>Hari Kerja</TableHeader>
                <TableHeader>Hadir</TableHeader>
                <TableHeader>Izin/Sakit/Alpa</TableHeader>
                <TableHeader>Kehadiran</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPresensi.length > 0 ? (
                paginatedPresensi.map((presensi, index) => (
                  <TableRow key={presensi.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      {getBulanLabel(presensi.bulan)} {presensi.tahun}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{presensi.pjlp?.nama}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      {presensi.hariKerja}
                    </TableCell>
                    <TableCell className="text-center font-medium text-green-600">
                      {presensi.hadir}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600">{presensi.izin}</span>/
                      <span className="text-yellow-600">{presensi.sakit}</span>/
                      <span className="text-red-600">{presensi.alpa}</span>
                    </TableCell>
                    <TableCell>
                      {getPersentaseBadge(getPersentaseHadir(presensi.hadir, presensi.hariKerja))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(presensi)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(presensi)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(presensi)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(presensi.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data presensi'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPresensi.length}
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
        title={editingId ? 'Edit Presensi' : 'Input Presensi Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="PJLP"
              name="pjlpId"
              value={formData.pjlpId}
              onChange={handleInputChange}
              options={pjlpOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Bulan"
                name="bulan"
                value={formData.bulan}
                onChange={handleInputChange}
                options={bulanOptions}
                required
              />
              <Select
                label="Tahun"
                name="tahun"
                value={formData.tahun}
                onChange={handleInputChange}
                options={tahunOptions}
                required
              />
            </div>

            <Input
              label="Total Hari Kerja"
              name="hariKerja"
              type="number"
              min="1"
              max="31"
              value={formData.hariKerja}
              onChange={handleInputChange}
              required
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Izin"
                name="izin"
                type="number"
                min="0"
                value={formData.izin}
                onChange={handleInputChange}
              />
              <Input
                label="Sakit"
                name="sakit"
                type="number"
                min="0"
                value={formData.sakit}
                onChange={handleInputChange}
              />
              <Input
                label="Alpa"
                name="alpa"
                type="number"
                min="0"
                value={formData.alpa}
                onChange={handleInputChange}
              />
              <Input
                label="Terlambat"
                name="terlambat"
                type="number"
                min="0"
                value={formData.terlambat}
                onChange={handleInputChange}
              />
            </div>

            {/* Hadir Preview */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Jumlah Hadir (Auto-calculated):</span>
                <span className="text-2xl font-bold text-green-600">{formData.hadir || 0} hari</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Persentase: {getPersentaseHadir(parseInt(formData.hadir) || 0, parseInt(formData.hariKerja) || 1)}%
              </p>
            </div>

            <TextArea
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Presensi"
        size="md"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Periode</label>
                <p className="font-medium">{getBulanLabel(viewingData.bulan)} {viewingData.tahun}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">% Kehadiran</label>
                <div className="mt-1">{getPersentaseBadge(getPersentaseHadir(viewingData.hadir, viewingData.hariKerja))}</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">PJLP</label>
              <p className="text-lg font-bold">{viewingData.pjlp?.nama}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{viewingData.hariKerja}</p>
                <p className="text-xs text-gray-500">Hari Kerja</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{viewingData.hadir}</p>
                <p className="text-xs text-green-600">Hadir</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{viewingData.alpa}</p>
                <p className="text-xs text-red-600">Alpa</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Izin</label>
                <p>{viewingData.izin} hari</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Sakit</label>
                <p>{viewingData.sakit} hari</p>
              </div>
            </div>

            {viewingData.keterangan && (
              <div>
                <label className="text-xs text-gray-500">Keterangan</label>
                <p>{viewingData.keterangan}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={() => handlePrint(viewingData)}
                icon={Printer}
                className="w-full"
              >
                Cetak Rekap Presensi
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
          Apakah Anda yakin ingin menghapus data presensi ini?
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
