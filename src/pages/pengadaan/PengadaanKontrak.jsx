import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FileSignature, Eye, ClipboardCheck, Play,
  Package, ChevronRight, Save, Building2, Calendar, DollarSign, AlertTriangle
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_PENGADAAN,
  JENIS_KONTRAK_PENGADAAN,
  JENIS_PEMBAYARAN_PENGADAAN,
  STATUS_KONTRAK_PENGADAAN,
  WORKFLOW_STATUS_PENGADAAN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// Kontrak Form initial data
const initialKontrakData = {
  paketId: '',
  vendorId: '',
  nomorKontrak: '',
  tanggalKontrak: formatDateInput(new Date()),
  nilaiKontrak: '',
  jangkaWaktu: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  denda: '1', // 1 permil per hari
  jenisKontrak: 'lumsum',
  lingkupPekerjaan: '',
  syaratPembayaran: '',
  jenisPembayaran: 'sekaligus',
  jumlahTermin: '1',
  keterangan: ''
}

// SPMK Form initial data
const initialSpmkData = {
  nomorSpmk: '',
  tanggalSpmk: formatDateInput(new Date()),
  tanggalMulaiKerja: formatDateInput(new Date()),
  keterangan: ''
}

export default function PengadaanKontrak() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [isKontrakModalOpen, setIsKontrakModalOpen] = useState(false)
  const [isSpmkModalOpen, setIsSpmkModalOpen] = useState(false)
  const [isViewKontrakOpen, setIsViewKontrakOpen] = useState(false)
  const [isViewSpmkOpen, setIsViewSpmkOpen] = useState(false)
  const [kontrakData, setKontrakData] = useState(initialKontrakData)
  const [spmkData, setSpmkData] = useState(initialSpmkData)
  const [editingKontrakId, setEditingKontrakId] = useState(null)
  const [editingSpmkId, setEditingSpmkId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch paket data (only those with perencanaan)
  const allPaket = useLiveQuery(() =>
    db.procurementPackage
      .where('workflowStatus')
      .anyOf([
        WORKFLOW_STATUS_PENGADAAN.PERENCANAAN,
        WORKFLOW_STATUS_PENGADAAN.PEMILIHAN_PENYEDIA,
        WORKFLOW_STATUS_PENGADAAN.KONTRAK,
        WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN,
        WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
        WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN,
        WORKFLOW_STATUS_PENGADAAN.SELESAI
      ])
      .reverse()
      .toArray()
  ) || []

  // Fetch all vendors
  const allVendors = useLiveQuery(() =>
    db.procurementVendor.orderBy('nama').toArray()
  ) || []

  // Fetch kontrak for selected paket
  const existingKontrak = useLiveQuery(
    () => selectedPaket ? db.procurementContract.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch SPMK for existing kontrak
  const existingSpmk = useLiveQuery(
    () => existingKontrak ? db.procurementSpmk.where('contractId').equals(existingKontrak.id).first() : null,
    [existingKontrak]
  )

  // Get vendor for kontrak
  const kontrakVendor = useLiveQuery(
    () => existingKontrak?.vendorId ? db.procurementVendor.get(existingKontrak.vendorId) : null,
    [existingKontrak]
  )

  // Filter paket
  const filteredPaket = allPaket.filter(p => {
    const matchSearch = p.namaPaket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePaket?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTahun = !filterTahun || p.tahun === filterTahun
    return matchSearch && matchTahun
  })

  // Pagination
  const totalPages = Math.ceil(filteredPaket.length / itemsPerPage)
  const paginatedPaket = filteredPaket.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const vendorOptions = allVendors.map(v => ({
    value: v.id,
    label: `${v.nama} (${v.npwp || 'No NPWP'})`
  }))

  const jenisKontrakOptions = JENIS_KONTRAK_PENGADAAN.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const jenisPembayaranOptions = JENIS_PEMBAYARAN_PENGADAAN.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const getJenisLabel = (jenisId) => {
    return JENIS_PENGADAAN.find(j => j.id === jenisId)?.nama || jenisId
  }

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
  }

  // Kontrak handlers
  const handleOpenKontrakModal = () => {
    if (existingKontrak) {
      setEditingKontrakId(existingKontrak.id)
      setKontrakData({
        paketId: existingKontrak.paketId,
        vendorId: existingKontrak.vendorId?.toString() || '',
        nomorKontrak: existingKontrak.nomorKontrak || '',
        tanggalKontrak: formatDateInput(existingKontrak.tanggalKontrak),
        nilaiKontrak: existingKontrak.nilaiKontrak?.toString() || '',
        jangkaWaktu: existingKontrak.jangkaWaktu?.toString() || '',
        tanggalMulai: formatDateInput(existingKontrak.tanggalMulai),
        tanggalSelesai: formatDateInput(existingKontrak.tanggalSelesai),
        denda: existingKontrak.denda?.toString() || '1',
        jenisKontrak: existingKontrak.jenisKontrak || 'lumsum',
        lingkupPekerjaan: existingKontrak.lingkupPekerjaan || '',
        syaratPembayaran: existingKontrak.syaratPembayaran || '',
        jenisPembayaran: existingKontrak.jenisPembayaran || 'sekaligus',
        jumlahTermin: existingKontrak.jumlahTermin?.toString() || '1',
        keterangan: existingKontrak.keterangan || ''
      })
    } else {
      setEditingKontrakId(null)
      setKontrakData({
        ...initialKontrakData,
        paketId: selectedPaket.id,
        nilaiKontrak: selectedPaket.nilaiPagu?.toString() || ''
      })
    }
    setIsKontrakModalOpen(true)
  }

  const handleKontrakInputChange = (e) => {
    const { name, value } = e.target
    setKontrakData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveKontrak = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const nilaiKontrak = parseInt(kontrakData.nilaiKontrak) || 0

      // Validate nilai kontrak vs HPS
      if (nilaiKontrak > selectedPaket.nilaiPagu) {
        alert('Nilai kontrak tidak boleh melebihi nilai pagu/HPS')
        setLoading(false)
        return
      }

      const data = {
        paketId: selectedPaket.id,
        vendorId: parseInt(kontrakData.vendorId, 10) || null,
        nomorKontrak: kontrakData.nomorKontrak,
        tanggalKontrak: new Date(kontrakData.tanggalKontrak),
        nilaiKontrak: nilaiKontrak,
        jangkaWaktu: parseInt(kontrakData.jangkaWaktu) || 0,
        tanggalMulai: kontrakData.tanggalMulai ? new Date(kontrakData.tanggalMulai) : null,
        tanggalSelesai: kontrakData.tanggalSelesai ? new Date(kontrakData.tanggalSelesai) : null,
        denda: parseFloat(kontrakData.denda) || 1,
        jenisKontrak: kontrakData.jenisKontrak,
        lingkupPekerjaan: kontrakData.lingkupPekerjaan,
        syaratPembayaran: kontrakData.syaratPembayaran,
        jenisPembayaran: kontrakData.jenisPembayaran,
        jumlahTermin: parseInt(kontrakData.jumlahTermin) || 1,
        keterangan: kontrakData.keterangan,
        status: STATUS_KONTRAK_PENGADAAN.DRAFT,
        archivePath: selectedPaket.archivePath
      }

      if (editingKontrakId) {
        const existing = await db.procurementContract.get(editingKontrakId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementContract.update(editingKontrakId, updated)
        await recordHistory('procurementContract', editingKontrakId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementContract.add(newData)
        await recordHistory('procurementContract', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update paket workflow status
        await db.procurementPackage.update(selectedPaket.id, {
          workflowStatus: WORKFLOW_STATUS_PENGADAAN.KONTRAK,
          updatedAt: new Date()
        })
      }

      setIsKontrakModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan Kontrak: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // SPMK handlers
  const handleOpenSpmkModal = () => {
    if (!existingKontrak) {
      alert('Buat kontrak terlebih dahulu')
      return
    }

    if (existingSpmk) {
      setEditingSpmkId(existingSpmk.id)
      setSpmkData({
        nomorSpmk: existingSpmk.nomorSpmk || '',
        tanggalSpmk: formatDateInput(existingSpmk.tanggalSpmk),
        tanggalMulaiKerja: formatDateInput(existingSpmk.tanggalMulaiKerja),
        keterangan: existingSpmk.keterangan || ''
      })
    } else {
      setEditingSpmkId(null)
      setSpmkData({
        ...initialSpmkData,
        tanggalMulaiKerja: formatDateInput(existingKontrak.tanggalMulai)
      })
    }
    setIsSpmkModalOpen(true)
  }

  const handleSpmkInputChange = (e) => {
    const { name, value } = e.target
    setSpmkData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveSpmk = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        nomorSpmk: spmkData.nomorSpmk,
        tanggalSpmk: new Date(spmkData.tanggalSpmk),
        tanggalMulaiKerja: new Date(spmkData.tanggalMulaiKerja),
        keterangan: spmkData.keterangan,
        archivePath: selectedPaket.archivePath
      }

      if (editingSpmkId) {
        const existing = await db.procurementSpmk.get(editingSpmkId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementSpmk.update(editingSpmkId, updated)
        await recordHistory('procurementSpmk', editingSpmkId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementSpmk.add(newData)
        await recordHistory('procurementSpmk', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update kontrak status to aktif
        await db.procurementContract.update(existingKontrak.id, {
          status: STATUS_KONTRAK_PENGADAAN.DALAM_PELAKSANAAN,
          updatedAt: new Date()
        })

        // Update paket workflow status
        await db.procurementPackage.update(selectedPaket.id, {
          workflowStatus: WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN,
          updatedAt: new Date()
        })
      }

      setIsSpmkModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan SPMK: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      [WORKFLOW_STATUS_PENGADAAN.DRAFT]: 'default',
      [WORKFLOW_STATUS_PENGADAAN.PERENCANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.PEMILIHAN_PENYEDIA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.KONTRAK]: 'primary',
      [WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.BATAL]: 'danger'
    }
    return <Badge variant={variants[status] || 'default'}>{getWorkflowStatusLabel(status)}</Badge>
  }

  const getKontrakStatusBadge = (status) => {
    const variants = {
      [STATUS_KONTRAK_PENGADAAN.DRAFT]: 'default',
      [STATUS_KONTRAK_PENGADAAN.AKTIF]: 'info',
      [STATUS_KONTRAK_PENGADAAN.DALAM_PELAKSANAAN]: 'warning',
      [STATUS_KONTRAK_PENGADAAN.SERAH_TERIMA]: 'primary',
      [STATUS_KONTRAK_PENGADAAN.SELESAI]: 'success',
      [STATUS_KONTRAK_PENGADAAN.BATAL]: 'danger'
    }
    const labels = {
      [STATUS_KONTRAK_PENGADAAN.DRAFT]: 'Draft',
      [STATUS_KONTRAK_PENGADAAN.AKTIF]: 'Aktif',
      [STATUS_KONTRAK_PENGADAAN.DALAM_PELAKSANAAN]: 'Dalam Pelaksanaan',
      [STATUS_KONTRAK_PENGADAAN.SERAH_TERIMA]: 'Serah Terima',
      [STATUS_KONTRAK_PENGADAAN.SELESAI]: 'Selesai',
      [STATUS_KONTRAK_PENGADAAN.BATAL]: 'Batal'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Stats
  const totalDenganKontrak = allPaket.filter(p =>
    p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.DRAFT &&
    p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.PERENCANAAN
  ).length

  return (
    <Layout title="Kontrak & SPMK">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket (Siap Kontrak)</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Sudah Ada Kontrak</p>
            <p className="text-2xl font-bold">{totalDenganKontrak}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Belum Kontrak</p>
            <p className="text-2xl font-bold">{allPaket.length - totalDenganKontrak}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paket List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Pilih Paket
              </CardTitle>
              <div className="mt-3 space-y-2">
                <Select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  options={tahunOptions}
                  placeholder="Tahun"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari paket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0 max-h-[500px] overflow-y-auto">
              {paginatedPaket.length > 0 ? (
                <div className="divide-y">
                  {paginatedPaket.map(paket => (
                    <div
                      key={paket.id}
                      onClick={() => handleSelectPaket(paket)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPaket?.id === paket.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-gray-500">{paket.kodePaket}</p>
                          <p className="font-medium text-sm truncate">{paket.namaPaket}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(paket.workflowStatus)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada paket
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedPaket ? (
            <div className="space-y-4">
              {/* Paket Info */}
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-500">{selectedPaket.kodePaket}</p>
                      <h3 className="text-lg font-bold">{selectedPaket.namaPaket}</h3>
                      <p className="text-sm text-gray-600">{selectedPaket.unitPengusul}</p>
                    </div>
                    {getStatusBadge(selectedPaket.workflowStatus)}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <Badge variant="info">{getJenisLabel(selectedPaket.jenisPengadaan)}</Badge>
                    <span className="text-lg font-bold text-green-600">
                      Pagu: {formatRupiah(selectedPaket.nilaiPagu)}
                    </span>
                  </div>
                </CardBody>
              </Card>

              {/* Kontrak Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSignature className="w-5 h-5" />
                      Kontrak / SPK
                    </CardTitle>
                    <CardDescription>
                      {existingKontrak ? `No: ${existingKontrak.nomorKontrak}` : 'Belum ada kontrak'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {existingKontrak && (
                      <Button variant="secondary" size="sm" onClick={() => setIsViewKontrakOpen(true)} icon={Eye}>
                        Lihat
                      </Button>
                    )}
                    <Button size="sm" onClick={handleOpenKontrakModal} icon={existingKontrak ? Pencil : Plus}>
                      {existingKontrak ? 'Edit' : 'Buat Kontrak'}
                    </Button>
                  </div>
                </CardHeader>
                {existingKontrak && (
                  <CardBody className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Penyedia</p>
                        <p className="font-medium">{kontrakVendor?.nama || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Nilai Kontrak</p>
                        <p className="font-bold text-green-600">{formatRupiah(existingKontrak.nilaiKontrak)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tanggal Kontrak</p>
                        <p className="font-medium">{formatTanggal(existingKontrak.tanggalKontrak)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        {getKontrakStatusBadge(existingKontrak.status)}
                      </div>
                    </div>
                  </CardBody>
                )}
              </Card>

              {/* SPMK Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Surat Perintah Mulai Kerja (SPMK)
                    </CardTitle>
                    <CardDescription>
                      {existingSpmk ? `No: ${existingSpmk.nomorSpmk}` : 'Belum ada SPMK'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {existingSpmk && (
                      <Button variant="secondary" size="sm" onClick={() => setIsViewSpmkOpen(true)} icon={Eye}>
                        Lihat
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleOpenSpmkModal}
                      icon={existingSpmk ? Pencil : Plus}
                      disabled={!existingKontrak}
                    >
                      {existingSpmk ? 'Edit' : 'Buat SPMK'}
                    </Button>
                  </div>
                </CardHeader>
                {!existingKontrak && (
                  <CardBody className="pt-0">
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Buat kontrak terlebih dahulu sebelum membuat SPMK</span>
                    </div>
                  </CardBody>
                )}
                {existingSpmk && (
                  <CardBody className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tanggal SPMK</p>
                        <p className="font-medium">{formatTanggal(existingSpmk.tanggalSpmk)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tanggal Mulai Kerja</p>
                        <p className="font-medium">{formatTanggal(existingSpmk.tanggalMulaiKerja)}</p>
                      </div>
                    </div>
                  </CardBody>
                )}
              </Card>
            </div>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan dari daftar untuk membuat atau melihat Kontrak dan SPMK</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Kontrak Modal */}
      <Modal
        isOpen={isKontrakModalOpen}
        onClose={() => setIsKontrakModalOpen(false)}
        title={editingKontrakId ? 'Edit Kontrak' : 'Buat Kontrak'}
        size="xl"
      >
        <form onSubmit={handleSaveKontrak}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Penyedia */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Penyedia</h4>
              <Select
                label="Pilih Penyedia"
                name="vendorId"
                value={kontrakData.vendorId}
                onChange={handleKontrakInputChange}
                options={vendorOptions}
                required
              />
            </div>

            {/* Nomor & Tanggal */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Identitas Kontrak</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nomor Kontrak/SPK"
                  name="nomorKontrak"
                  value={kontrakData.nomorKontrak}
                  onChange={handleKontrakInputChange}
                  placeholder="SPK/001/2024"
                  required
                />
                <Input
                  label="Tanggal Kontrak"
                  name="tanggalKontrak"
                  type="date"
                  value={kontrakData.tanggalKontrak}
                  onChange={handleKontrakInputChange}
                  required
                />
              </div>
            </div>

            {/* Nilai & Jenis */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Nilai & Jenis Kontrak</h4>
              <div className="grid grid-cols-2 gap-4">
                <CurrencyInput
                  label="Nilai Kontrak (Rp)"
                  name="nilaiKontrak"
                  value={kontrakData.nilaiKontrak}
                  onChange={handleKontrakInputChange}
                  required
                />
                <Select
                  label="Jenis Kontrak"
                  name="jenisKontrak"
                  value={kontrakData.jenisKontrak}
                  onChange={handleKontrakInputChange}
                  options={jenisKontrakOptions}
                  required
                />
              </div>
              {parseInt(kontrakData.nilaiKontrak) > selectedPaket?.nilaiPagu && (
                <p className="text-sm text-red-600 mt-1">
                  Nilai kontrak melebihi nilai pagu/HPS!
                </p>
              )}
            </div>

            {/* Waktu Pelaksanaan */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Waktu Pelaksanaan</h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Jangka Waktu (hari)"
                  name="jangkaWaktu"
                  type="number"
                  value={kontrakData.jangkaWaktu}
                  onChange={handleKontrakInputChange}
                  required
                />
                <Input
                  label="Tanggal Mulai"
                  name="tanggalMulai"
                  type="date"
                  value={kontrakData.tanggalMulai}
                  onChange={handleKontrakInputChange}
                />
                <Input
                  label="Tanggal Selesai"
                  name="tanggalSelesai"
                  type="date"
                  value={kontrakData.tanggalSelesai}
                  onChange={handleKontrakInputChange}
                />
              </div>
              <Input
                label="Denda Keterlambatan (permil/hari)"
                name="denda"
                type="number"
                step="0.1"
                value={kontrakData.denda}
                onChange={handleKontrakInputChange}
                className="mt-3"
              />
            </div>

            {/* Pembayaran */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Ketentuan Pembayaran</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Jenis Pembayaran"
                  name="jenisPembayaran"
                  value={kontrakData.jenisPembayaran}
                  onChange={handleKontrakInputChange}
                  options={jenisPembayaranOptions}
                  required
                />
                {kontrakData.jenisPembayaran === 'termin' && (
                  <Input
                    label="Jumlah Termin"
                    name="jumlahTermin"
                    type="number"
                    value={kontrakData.jumlahTermin}
                    onChange={handleKontrakInputChange}
                    min="2"
                  />
                )}
              </div>
              <Textarea
                label="Syarat Pembayaran"
                name="syaratPembayaran"
                value={kontrakData.syaratPembayaran}
                onChange={handleKontrakInputChange}
                rows={2}
                className="mt-3"
                placeholder="Pembayaran dilakukan setelah pekerjaan selesai dan diterima dengan baik"
              />
            </div>

            {/* Lingkup Pekerjaan */}
            <div>
              <Textarea
                label="Lingkup Pekerjaan"
                name="lingkupPekerjaan"
                value={kontrakData.lingkupPekerjaan}
                onChange={handleKontrakInputChange}
                rows={3}
              />
              <Textarea
                label="Keterangan"
                name="keterangan"
                value={kontrakData.keterangan}
                onChange={handleKontrakInputChange}
                rows={2}
                className="mt-3"
              />
            </div>
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsKontrakModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan Kontrak
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* SPMK Modal */}
      <Modal
        isOpen={isSpmkModalOpen}
        onClose={() => setIsSpmkModalOpen(false)}
        title={editingSpmkId ? 'Edit SPMK' : 'Buat SPMK'}
        size="md"
      >
        <form onSubmit={handleSaveSpmk}>
          <div className="space-y-4">
            <Input
              label="Nomor SPMK"
              name="nomorSpmk"
              value={spmkData.nomorSpmk}
              onChange={handleSpmkInputChange}
              placeholder="SPMK/001/2024"
              required
            />
            <Input
              label="Tanggal SPMK"
              name="tanggalSpmk"
              type="date"
              value={spmkData.tanggalSpmk}
              onChange={handleSpmkInputChange}
              required
            />
            <Input
              label="Tanggal Mulai Kerja"
              name="tanggalMulaiKerja"
              type="date"
              value={spmkData.tanggalMulaiKerja}
              onChange={handleSpmkInputChange}
              required
            />
            <Textarea
              label="Keterangan"
              name="keterangan"
              value={spmkData.keterangan}
              onChange={handleSpmkInputChange}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsSpmkModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan SPMK
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Kontrak Modal */}
      <Modal
        isOpen={isViewKontrakOpen}
        onClose={() => setIsViewKontrakOpen(false)}
        title="Detail Kontrak"
        size="lg"
      >
        {existingKontrak && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Nomor Kontrak</label>
                <p className="font-bold text-lg">{existingKontrak.nomorKontrak}</p>
              </div>
              {getKontrakStatusBadge(existingKontrak.status)}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="text-xs text-blue-700">Penyedia</label>
              <p className="font-bold">{kontrakVendor?.nama}</p>
              <p className="text-sm text-gray-600">{kontrakVendor?.alamat}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Nilai Kontrak</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(existingKontrak.nilaiKontrak)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Kontrak</label>
                <p>{formatTanggal(existingKontrak.tanggalKontrak)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Jangka Waktu</label>
                <p>{existingKontrak.jangkaWaktu} hari kalender</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Mulai</label>
                <p>{existingKontrak.tanggalMulai ? formatTanggal(existingKontrak.tanggalMulai) : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Selesai</label>
                <p>{existingKontrak.tanggalSelesai ? formatTanggal(existingKontrak.tanggalSelesai) : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Jenis Kontrak</label>
                <p>{JENIS_KONTRAK_PENGADAAN.find(j => j.id === existingKontrak.jenisKontrak)?.nama}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Jenis Pembayaran</label>
                <p>{JENIS_PEMBAYARAN_PENGADAAN.find(j => j.id === existingKontrak.jenisPembayaran)?.nama}</p>
              </div>
            </div>

            {existingKontrak.lingkupPekerjaan && (
              <div>
                <label className="text-xs text-gray-500">Lingkup Pekerjaan</label>
                <p className="text-sm whitespace-pre-wrap">{existingKontrak.lingkupPekerjaan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* View SPMK Modal */}
      <Modal
        isOpen={isViewSpmkOpen}
        onClose={() => setIsViewSpmkOpen(false)}
        title="Detail SPMK"
        size="md"
      >
        {existingSpmk && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Nomor SPMK</label>
              <p className="font-bold text-lg">{existingSpmk.nomorSpmk}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal SPMK</label>
                <p>{formatTanggal(existingSpmk.tanggalSpmk)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Mulai Kerja</label>
                <p className="font-medium text-green-600">{formatTanggal(existingSpmk.tanggalMulaiKerja)}</p>
              </div>
            </div>

            {existingSpmk.keterangan && (
              <div>
                <label className="text-xs text-gray-500">Keterangan</label>
                <p className="text-sm">{existingSpmk.keterangan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
