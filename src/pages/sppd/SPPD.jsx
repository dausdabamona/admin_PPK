import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Plane, Eye, Printer,
  FileDown, Link2, ArrowRight
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
import { generateNomorSPPD } from '../../utils/autoNumber'
import { generateSPPDPDF } from '../../utils/documentGenerator'

const TRANSPORTASI_OPTIONS = [
  { value: 'pesawat', label: 'Pesawat Udara' },
  { value: 'kapal', label: 'Kapal Laut' },
  { value: 'kereta', label: 'Kereta Api' },
  { value: 'bus', label: 'Bus / Travel' },
  { value: 'mobil_dinas', label: 'Mobil Dinas' },
  { value: 'mobil_pribadi', label: 'Kendaraan Pribadi' }
]

const initialFormData = {
  suratTugasId: '',
  pegawaiId: '',
  jenisPerjadin: JENIS_PERJADIN.LUAR_KOTA,
  kotaAsal: '',
  kotaTujuan: '',
  tanggalBerangkat: '',
  tanggalKembali: '',
  maksudPerjalanan: '',
  transportasi: '',
  tingkatBiaya: 'C',
  keteranganLain: '',
  ppkId: '',
  kpaId: ''
}

export default function SPPD() {
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
  const allSPPD = useLiveQuery(async () => {
    const sppds = await db.sppd.orderBy('createdAt').reverse().toArray()
    // Enrich with pegawai data
    return Promise.all(sppds.map(async (sppd) => {
      const pegawai = await db.pegawai.get(sppd.pegawaiId)
      return { ...sppd, pegawai }
    }))
  }) || []

  const allSuratTugas = useLiveQuery(() =>
    db.suratTugas.orderBy('createdAt').reverse().toArray()
  ) || []

  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []
  const allKota = useLiveQuery(() => db.kota.toArray()) || []
  const allPejabat = useLiveQuery(() => db.pejabat.toArray()) || []

  // Filter by search query
  const filteredSPPD = allSPPD.filter(sppd =>
    sppd.nomor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sppd.pegawai?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sppd.kotaTujuan?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredSPPD.length / itemsPerPage)
  const paginatedSPPD = filteredSPPD.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const suratTugasOptions = allSuratTugas.map(st => ({
    value: st.id.toString(),
    label: `${st.nomor} - ${st.perihal?.substring(0, 40)}...`
  }))

  const pegawaiOptions = allPegawai.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nip})`
  }))

  const kotaOptions = allKota.map(k => ({
    value: k.namaKota,
    label: `${k.namaKota}, ${k.provinsi}`
  }))

  const ppkOptions = allPejabat.filter(p => p.jenisPejabat === 'PPK').map(p => ({
    value: p.id.toString(),
    label: `${p.nama} - ${p.jabatan}`
  }))

  const kpaOptions = allPejabat.filter(p => p.jenisPejabat === 'KPA').map(p => ({
    value: p.id.toString(),
    label: `${p.nama} - ${p.jabatan}`
  }))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Auto-fill from Surat Tugas
  const handleSuratTugasChange = async (e) => {
    const suratTugasId = parseInt(e.target.value)
    setFormData(prev => ({ ...prev, suratTugasId: e.target.value }))

    if (suratTugasId) {
      const st = await db.suratTugas.get(suratTugasId)
      if (st) {
        setFormData(prev => ({
          ...prev,
          suratTugasId: e.target.value,
          jenisPerjadin: st.jenisPerjadin || JENIS_PERJADIN.LUAR_KOTA,
          kotaAsal: st.kotaAsal,
          kotaTujuan: st.kotaTujuan,
          tanggalBerangkat: formatDateInput(st.tanggalMulai),
          tanggalKembali: formatDateInput(st.tanggalSelesai),
          maksudPerjalanan: st.perihal,
          transportasi: st.transportasi
        }))
      }
    }
  }

  const handleOpenModal = async (sppd = null) => {
    if (sppd) {
      setEditingId(sppd.id)
      setFormData({
        suratTugasId: sppd.suratTugasId?.toString() || '',
        pegawaiId: sppd.pegawaiId?.toString() || '',
        jenisPerjadin: sppd.jenisPerjadin || JENIS_PERJADIN.LUAR_KOTA,
        kotaAsal: sppd.kotaAsal || '',
        kotaTujuan: sppd.kotaTujuan || '',
        tanggalBerangkat: formatDateInput(sppd.tanggalBerangkat),
        tanggalKembali: formatDateInput(sppd.tanggalKembali),
        maksudPerjalanan: sppd.maksudPerjalanan || '',
        transportasi: sppd.transportasi || '',
        tingkatBiaya: sppd.tingkatBiaya || 'C',
        keteranganLain: sppd.keteranganLain || '',
        ppkId: sppd.ppkId?.toString() || '',
        kpaId: sppd.kpaId?.toString() || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        ...initialFormData,
        kotaAsal: 'Sorong'
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
        suratTugasId: parseInt(formData.suratTugasId) || null,
        pegawaiId: parseInt(formData.pegawaiId),
        jenisPerjadin: formData.jenisPerjadin,
        kotaAsal: formData.kotaAsal,
        kotaTujuan: formData.kotaTujuan,
        tanggalBerangkat: new Date(formData.tanggalBerangkat),
        tanggalKembali: new Date(formData.tanggalKembali),
        maksudPerjalanan: formData.maksudPerjalanan,
        transportasi: formData.transportasi,
        tingkatBiaya: formData.tingkatBiaya,
        keteranganLain: formData.keteranganLain,
        ppkId: parseInt(formData.ppkId) || null,
        kpaId: parseInt(formData.kpaId) || null,
        status: 'draft',
        updatedAt: new Date()
      }

      if (editingId) {
        await db.sppd.update(editingId, data)
      } else {
        data.nomor = await generateNomorSPPD()
        data.tanggal = new Date()
        data.createdAt = new Date()
        await db.sppd.add(data)
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
      await db.sppd.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (sppd) => {
    const pegawai = await db.pegawai.get(sppd.pegawaiId)
    const ppk = sppd.ppkId ? await db.pejabat.get(sppd.ppkId) : null
    const kpa = sppd.kpaId ? await db.pejabat.get(sppd.kpaId) : null
    const suratTugas = sppd.suratTugasId ? await db.suratTugas.get(sppd.suratTugasId) : null

    setViewingData({
      ...sppd,
      pegawai,
      ppk,
      kpa,
      suratTugas
    })
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (sppd) => {
    const pegawai = await db.pegawai.get(sppd.pegawaiId)
    const ppk = sppd.ppkId ? await db.pejabat.get(sppd.ppkId) : null

    await generateSPPDPDF({
      ...sppd,
      pegawai,
      ppk
    })
  }

  const getJenisPerjadinLabel = (jenis) => {
    return jenis === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'
  }

  return (
    <Layout title="SPPD">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary-600" />
            Surat Perjalanan Dinas (SPPD)
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari SPPD..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat SPPD
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nomor SPPD</TableHeader>
                <TableHeader>Pegawai</TableHeader>
                <TableHeader>Tujuan</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Jenis</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSPPD.length > 0 ? (
                paginatedSPPD.map((sppd, index) => (
                  <TableRow key={sppd.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {sppd.nomor}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sppd.pegawai?.nama}</p>
                        <p className="text-xs text-gray-500">{sppd.pegawai?.jabatan}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">{sppd.kotaAsal}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{sppd.kotaTujuan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTanggal(sppd.tanggalBerangkat, 'short')} - {formatTanggal(sppd.tanggalKembali, 'short')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sppd.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                        {getJenisPerjadinLabel(sppd.jenisPerjadin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sppd.status || 'draft'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(sppd)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(sppd)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(sppd)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(sppd.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada SPPD'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSPPD.length}
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
        title={editingId ? 'Edit SPPD' : 'Buat SPPD Baru'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Link to Surat Tugas */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Tarik dari Surat Tugas</span>
            </div>
            <Select
              name="suratTugasId"
              value={formData.suratTugasId}
              onChange={handleSuratTugasChange}
              options={suratTugasOptions}
              placeholder="Pilih Surat Tugas (opsional)..."
            />
            <p className="text-xs text-blue-600 mt-1">
              Data akan otomatis terisi dari Surat Tugas yang dipilih
            </p>
          </div>

          {/* Jenis Perjalanan */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="label mb-2">Jenis Perjalanan Dinas</label>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="jenisPerjadin"
                  value={JENIS_PERJADIN.DALAM_KOTA}
                  checked={formData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <span className="font-medium">Dalam Kota</span>
                  <p className="text-xs text-gray-500">Tanpa penginapan & boarding pass</p>
                </div>
              </label>
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="jenisPerjadin"
                  value={JENIS_PERJADIN.LUAR_KOTA}
                  checked={formData.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <span className="font-medium">Luar Kota</span>
                  <p className="text-xs text-gray-500">Full SBM + penginapan</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Select
                label="Pegawai"
                name="pegawaiId"
                value={formData.pegawaiId}
                onChange={handleInputChange}
                options={pegawaiOptions}
                required
              />
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
              label="Tanggal Berangkat"
              name="tanggalBerangkat"
              type="date"
              value={formData.tanggalBerangkat}
              onChange={handleInputChange}
              required
            />

            <Input
              label="Tanggal Kembali"
              name="tanggalKembali"
              type="date"
              value={formData.tanggalKembali}
              onChange={handleInputChange}
              required
            />

            <div className="md:col-span-2">
              <Textarea
                label="Maksud Perjalanan"
                name="maksudPerjalanan"
                value={formData.maksudPerjalanan}
                onChange={handleInputChange}
                rows={2}
                required
              />
            </div>

            <Select
              label="Transportasi"
              name="transportasi"
              value={formData.transportasi}
              onChange={handleInputChange}
              options={TRANSPORTASI_OPTIONS}
              required
            />

            <Select
              label="Tingkat Biaya"
              name="tingkatBiaya"
              value={formData.tingkatBiaya}
              onChange={handleInputChange}
              options={[
                { value: 'A', label: 'Tingkat A' },
                { value: 'B', label: 'Tingkat B' },
                { value: 'C', label: 'Tingkat C' }
              ]}
            />

            <Select
              label="PPK (Pejabat Pembuat Komitmen)"
              name="ppkId"
              value={formData.ppkId}
              onChange={handleInputChange}
              options={ppkOptions}
              placeholder="Pilih PPK..."
            />

            <Select
              label="KPA (Kuasa Pengguna Anggaran)"
              name="kpaId"
              value={formData.kpaId}
              onChange={handleInputChange}
              options={kpaOptions}
              placeholder="Pilih KPA..."
            />

            <div className="md:col-span-2">
              <Textarea
                label="Keterangan Lain"
                name="keteranganLain"
                value={formData.keteranganLain}
                onChange={handleInputChange}
                rows={2}
              />
            </div>
          </div>

          {/* Duration info */}
          {formData.tanggalBerangkat && formData.tanggalKembali && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">
                Durasi: {hitungHari(formData.tanggalBerangkat, formData.tanggalKembali)} hari
                {formData.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA && (
                  <span className="text-sm font-normal ml-2">
                    ({hitungHari(formData.tanggalBerangkat, formData.tanggalKembali) - 1} malam penginapan)
                  </span>
                )}
              </p>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Buat SPPD'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail SPPD"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor SPPD</label>
                <p className="font-mono font-medium">{viewingData.nomor}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Jenis</label>
                <p>
                  <Badge variant={viewingData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                    {getJenisPerjadinLabel(viewingData.jenisPerjadin)}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pegawai</label>
              <p className="font-medium">{viewingData.pegawai?.nama}</p>
              <p className="text-sm text-gray-500">
                {viewingData.pegawai?.jabatan} | NIP: {viewingData.pegawai?.nip}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Asal</label>
                <p>{viewingData.kotaAsal}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tujuan</label>
                <p className="font-medium">{viewingData.kotaTujuan}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Berangkat</label>
                <p>{formatTanggal(viewingData.tanggalBerangkat)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Kembali</label>
                <p>{formatTanggal(viewingData.tanggalKembali)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Maksud Perjalanan</label>
              <p>{viewingData.maksudPerjalanan}</p>
            </div>

            {viewingData.ppk && (
              <div>
                <label className="text-xs text-gray-500">PPK</label>
                <p>{viewingData.ppk.nama}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                icon={Printer}
                onClick={() => handlePrint(viewingData)}
              >
                Cetak SPPD
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
          Apakah Anda yakin ingin menghapus SPPD ini?
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
