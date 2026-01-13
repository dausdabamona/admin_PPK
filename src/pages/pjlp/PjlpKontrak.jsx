import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FileSignature, Eye, Printer, FileText
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { POSISI_PJLP, STATUS_KONTRAK_PJLP } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'
import { generateSpkPjlpPDF, generateSpmkPjlpPDF } from '../../utils/pjlpDocGenerator'

const initialFormData = {
  pjlpId: '',
  nomorKontrak: '',
  tanggalKontrak: '',
  periodeAwal: '',
  periodeAkhir: '',
  honorBulanan: '',
  posisi: '',
  lokasiKerja: '',
  lingkupPekerjaan: '',
  outputPekerjaan: '',
  status: 'draft'
}

export default function PjlpKontrak() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSpmkModalOpen, setIsSpmkModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [spmkData, setSpmkData] = useState({ nomorSpmk: '', tanggalMulaiKerja: '' })
  const [selectedKontrak, setSelectedKontrak] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allKontrak = useLiveQuery(async () => {
    const kontrak = await db.pjlpKontrak.orderBy('createdAt').reverse().toArray()
    return Promise.all(kontrak.map(async (k) => {
      const pjlp = await db.pjlpMaster.get(k.pjlpId)
      const spk = await db.pjlpSpk.where('kontrakId').equals(k.id).first()
      const spmk = await db.pjlpSpmk.where('kontrakId').equals(k.id).first()
      return { ...k, pjlp, spk, spmk }
    }))
  }) || []

  const allPjlp = useLiveQuery(() =>
    db.pjlpMaster.where('statusAktif').equals('aktif').toArray()
  ) || []

  // Filter
  const filteredKontrak = allKontrak.filter(k => {
    const matchSearch = k.pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nomorKontrak?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !filterStatus || k.status === filterStatus
    return matchSearch && matchStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredKontrak.length / itemsPerPage)
  const paginatedKontrak = filteredKontrak.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const pjlpOptions = allPjlp.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nik})`
  }))

  const posisiOptions = POSISI_PJLP.map(p => ({
    value: p.id,
    label: p.nama
  }))

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'aktif', label: 'Aktif' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'batal', label: 'Batal' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-fill from PJLP when selected
    if (name === 'pjlpId' && value) {
      const pjlp = allPjlp.find(p => p.id === parseInt(value))
      if (pjlp) {
        setFormData(prev => ({
          ...prev,
          pjlpId: value,
          honorBulanan: pjlp.honorBulanan?.toString() || '',
          posisi: pjlp.posisi || ''
        }))
      }
    }
  }

  const generateNomorKontrak = async () => {
    const currentYear = new Date().getFullYear()
    const count = await db.pjlpKontrak.count()
    return `SPK-PJLP/${String(count + 1).padStart(4, '0')}/${currentYear}`
  }

  const calculateNilaiKontrak = () => {
    if (!formData.periodeAwal || !formData.periodeAkhir || !formData.honorBulanan) return 0
    const start = new Date(formData.periodeAwal)
    const end = new Date(formData.periodeAkhir)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
    return months * (parseInt(formData.honorBulanan) || 0)
  }

  const handleOpenModal = async (kontrak = null) => {
    if (kontrak) {
      setEditingId(kontrak.id)
      setFormData({
        pjlpId: kontrak.pjlpId?.toString() || '',
        nomorKontrak: kontrak.nomorKontrak || '',
        tanggalKontrak: kontrak.tanggalKontrak ? formatDateInput(kontrak.tanggalKontrak) : formatDateInput(new Date()),
        periodeAwal: kontrak.periodeAwal ? formatDateInput(kontrak.periodeAwal) : '',
        periodeAkhir: kontrak.periodeAkhir ? formatDateInput(kontrak.periodeAkhir) : '',
        honorBulanan: kontrak.honorBulanan?.toString() || '',
        posisi: kontrak.posisi || '',
        lokasiKerja: kontrak.lokasiKerja || '',
        lingkupPekerjaan: kontrak.lingkupPekerjaan || '',
        outputPekerjaan: kontrak.outputPekerjaan || '',
        status: kontrak.status || 'draft'
      })
    } else {
      setEditingId(null)
      const nomorKontrak = await generateNomorKontrak()
      setFormData({
        ...initialFormData,
        nomorKontrak,
        tanggalKontrak: formatDateInput(new Date())
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
      const nilaiKontrak = calculateNilaiKontrak()

      const data = {
        pjlpId: parseInt(formData.pjlpId),
        nomorKontrak: formData.nomorKontrak,
        tanggalKontrak: formData.tanggalKontrak ? new Date(formData.tanggalKontrak) : new Date(),
        periodeAwal: formData.periodeAwal ? new Date(formData.periodeAwal) : null,
        periodeAkhir: formData.periodeAkhir ? new Date(formData.periodeAkhir) : null,
        honorBulanan: parseInt(formData.honorBulanan) || 0,
        nilaiKontrak,
        posisi: formData.posisi,
        lokasiKerja: formData.lokasiKerja,
        lingkupPekerjaan: formData.lingkupPekerjaan,
        outputPekerjaan: formData.outputPekerjaan,
        status: formData.status,
        updatedAt: new Date()
      }

      let kontrakId

      if (editingId) {
        await db.pjlpKontrak.update(editingId, data)
        kontrakId = editingId
      } else {
        data.createdAt = new Date()
        kontrakId = await db.pjlpKontrak.add(data)

        // Auto-create SPK
        await db.pjlpSpk.add({
          kontrakId,
          pjlpId: data.pjlpId,
          nomorSpk: formData.nomorKontrak,
          tanggalSpk: data.tanggalKontrak,
          periodeAwal: data.periodeAwal,
          periodeAkhir: data.periodeAkhir,
          nilaiKontrak,
          keterangan: '',
          createdAt: new Date()
        })
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
      // Delete related SPK and SPMK
      await db.pjlpSpk.where('kontrakId').equals(deletingId).delete()
      await db.pjlpSpmk.where('kontrakId').equals(deletingId).delete()
      await db.pjlpKontrak.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (kontrak) => {
    setViewingData(kontrak)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  // SPMK Handlers
  const openSpmkModal = async (kontrak) => {
    setSelectedKontrak(kontrak)
    const count = await db.pjlpSpmk.count()
    const currentYear = new Date().getFullYear()
    setSpmkData({
      nomorSpmk: `SPMK-PJLP/${String(count + 1).padStart(4, '0')}/${currentYear}`,
      tanggalMulaiKerja: kontrak.periodeAwal ? formatDateInput(kontrak.periodeAwal) : formatDateInput(new Date())
    })
    setIsSpmkModalOpen(true)
  }

  const handleCreateSpmk = async () => {
    if (!selectedKontrak) return
    setLoading(true)
    try {
      await db.pjlpSpmk.add({
        kontrakId: selectedKontrak.id,
        pjlpId: selectedKontrak.pjlpId,
        spkId: selectedKontrak.spk?.id,
        nomorSpmk: spmkData.nomorSpmk,
        tanggalSpmk: new Date(),
        tanggalMulaiKerja: spmkData.tanggalMulaiKerja ? new Date(spmkData.tanggalMulaiKerja) : new Date(),
        keterangan: '',
        createdAt: new Date()
      })

      // Update kontrak status to aktif
      await db.pjlpKontrak.update(selectedKontrak.id, { status: 'aktif' })

      setIsSpmkModalOpen(false)
      setSelectedKontrak(null)
    } catch (error) {
      alert('Gagal membuat SPMK: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Print handlers
  const handlePrintSpk = async (kontrak) => {
    try {
      await generateSpkPjlpPDF(kontrak)
    } catch (error) {
      alert('Gagal mencetak SPK: ' + error.message)
    }
  }

  const handlePrintSpmk = async (kontrak) => {
    try {
      await generateSpmkPjlpPDF(kontrak)
    } catch (error) {
      alert('Gagal mencetak SPMK: ' + error.message)
    }
  }

  const getPosisiLabel = (posisiId) => {
    return POSISI_PJLP.find(p => p.id === posisiId)?.nama || posisiId
  }

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      aktif: 'success',
      selesai: 'info',
      batal: 'danger'
    }
    const labels = {
      draft: 'Draft',
      aktif: 'Aktif',
      selesai: 'Selesai',
      batal: 'Batal'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const nilaiKontrak = calculateNilaiKontrak()

  return (
    <Layout title="Kontrak PJLP">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary-600" />
              Kontrak PJLP
            </CardTitle>
            <CardDescription>
              Kelola kontrak dan generate SPK/SPMK
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              options={statusOptions}
              placeholder="Semua Status"
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
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Kontrak
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>No. Kontrak</TableHeader>
                <TableHeader>PJLP</TableHeader>
                <TableHeader>Posisi</TableHeader>
                <TableHeader>Periode</TableHeader>
                <TableHeader>Nilai Kontrak</TableHeader>
                <TableHeader>SPK/SPMK</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedKontrak.length > 0 ? (
                paginatedKontrak.map((kontrak, index) => (
                  <TableRow key={kontrak.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {kontrak.nomorKontrak}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{kontrak.pjlp?.nama}</p>
                      <p className="text-xs text-gray-500">{kontrak.pjlp?.nik}</p>
                    </TableCell>
                    <TableCell>
                      {getPosisiLabel(kontrak.posisi)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {kontrak.periodeAwal && kontrak.periodeAkhir ? (
                        <div>
                          <p>{formatTanggal(kontrak.periodeAwal, 'short')}</p>
                          <p className="text-gray-500">s/d {formatTanggal(kontrak.periodeAkhir, 'short')}</p>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(kontrak.nilaiKontrak)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {kontrak.spk && (
                          <Badge variant="info" className="text-xs">SPK</Badge>
                        )}
                        {kontrak.spmk ? (
                          <Badge variant="success" className="text-xs">SPMK</Badge>
                        ) : kontrak.spk && (
                          <button
                            onClick={() => openSpmkModal(kontrak)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            + Buat SPMK
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(kontrak.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(kontrak)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {kontrak.spk && (
                          <button
                            onClick={() => handlePrintSpk(kontrak)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Cetak SPK"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {kontrak.spmk && (
                          <button
                            onClick={() => handlePrintSpmk(kontrak)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Cetak SPMK"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(kontrak)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(kontrak.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada kontrak'}
                  colSpan={9}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredKontrak.length}
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
        title={editingId ? 'Edit Kontrak' : 'Buat Kontrak Baru'}
        size="xl"
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
              <Input
                label="Nomor Kontrak"
                name="nomorKontrak"
                value={formData.nomorKontrak}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Tanggal Kontrak"
                name="tanggalKontrak"
                type="date"
                value={formData.tanggalKontrak}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Periode Awal"
                name="periodeAwal"
                type="date"
                value={formData.periodeAwal}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Periode Akhir"
                name="periodeAkhir"
                type="date"
                value={formData.periodeAkhir}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput
                label="Honor Bulanan"
                name="honorBulanan"
                value={formData.honorBulanan}
                onChange={handleInputChange}
                required
              />
              <Select
                label="Posisi"
                name="posisi"
                value={formData.posisi}
                onChange={handleInputChange}
                options={posisiOptions}
                required
              />
            </div>

            {/* Nilai Kontrak Preview */}
            {nilaiKontrak > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700">Nilai Kontrak (Auto-calculated):</p>
                <p className="text-lg font-bold text-green-600">{formatRupiah(nilaiKontrak)}</p>
              </div>
            )}

            <Input
              label="Lokasi Kerja"
              name="lokasiKerja"
              value={formData.lokasiKerja}
              onChange={handleInputChange}
            />

            <Textarea
              label="Lingkup Pekerjaan"
              name="lingkupPekerjaan"
              value={formData.lingkupPekerjaan}
              onChange={handleInputChange}
              rows={3}
            />

            <Textarea
              label="Output Pekerjaan"
              name="outputPekerjaan"
              value={formData.outputPekerjaan}
              onChange={handleInputChange}
              rows={2}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={statusOptions}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Simpan & Buat SPK'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* SPMK Modal */}
      <Modal
        isOpen={isSpmkModalOpen}
        onClose={() => setIsSpmkModalOpen(false)}
        title="Buat SPMK"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              SPMK untuk: <strong>{selectedKontrak?.pjlp?.nama}</strong>
            </p>
            <p className="text-xs text-blue-600">
              No. SPK: {selectedKontrak?.spk?.nomorSpk}
            </p>
          </div>

          <Input
            label="Nomor SPMK"
            value={spmkData.nomorSpmk}
            onChange={(e) => setSpmkData(prev => ({ ...prev, nomorSpmk: e.target.value }))}
            required
          />

          <Input
            label="Tanggal Mulai Kerja"
            type="date"
            value={spmkData.tanggalMulaiKerja}
            onChange={(e) => setSpmkData(prev => ({ ...prev, tanggalMulaiKerja: e.target.value }))}
            required
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsSpmkModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleCreateSpmk} loading={loading}>
            Buat SPMK
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Kontrak"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor Kontrak</label>
                <p className="font-mono">{viewingData.nomorKontrak}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Kontrak</label>
                <p>{formatTanggal(viewingData.tanggalKontrak)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">PJLP</label>
              <p className="text-lg font-bold">{viewingData.pjlp?.nama}</p>
              <p className="text-sm text-gray-500">NIK: {viewingData.pjlp?.nik}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Posisi</label>
                <p>{getPosisiLabel(viewingData.posisi)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Lokasi Kerja</label>
                <p>{viewingData.lokasiKerja || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Periode</label>
                <p>{formatTanggal(viewingData.periodeAwal)} - {formatTanggal(viewingData.periodeAkhir)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Honor Bulanan</label>
                <p className="font-medium text-green-600">{formatRupiah(viewingData.honorBulanan)}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Nilai Kontrak</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.nilaiKontrak)}</p>
            </div>

            {viewingData.lingkupPekerjaan && (
              <div>
                <label className="text-xs text-gray-500">Lingkup Pekerjaan</label>
                <p className="whitespace-pre-line">{viewingData.lingkupPekerjaan}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">No. SPK</label>
                <p className="font-mono">{viewingData.spk?.nomorSpk || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">No. SPMK</label>
                <p className="font-mono">{viewingData.spmk?.nomorSpmk || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(viewingData.status)}</div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              {viewingData.spk && (
                <Button
                  onClick={() => handlePrintSpk(viewingData)}
                  icon={FileText}
                  variant="secondary"
                  className="flex-1"
                >
                  Cetak SPK
                </Button>
              )}
              {viewingData.spmk && (
                <Button
                  onClick={() => handlePrintSpmk(viewingData)}
                  icon={Printer}
                  className="flex-1"
                >
                  Cetak SPMK
                </Button>
              )}
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
          Apakah Anda yakin ingin menghapus kontrak ini? SPK dan SPMK terkait juga akan dihapus.
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
