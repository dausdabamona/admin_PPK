import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FileText, Eye, ClipboardList, Calculator,
  Package, ChevronRight, Save, X
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
  WORKFLOW_STATUS_PENGADAAN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS,
  TARIF_PPN,
  calculatePphPengadaan,
  calculatePpnPengadaan
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// KAK Form initial data
const initialKakData = {
  latarBelakang: '',
  maksudTujuan: '',
  sasaran: '',
  ruangLingkup: '',
  outputPekerjaan: '',
  spesifikasiTeknis: '',
  waktuPelaksanaan: '',
  lokasi: '',
  tenagaAhli: '',
  metodePelaksanaan: '',
  laporanPenyerahan: '',
  keterangan: ''
}

// HPS Form initial data
const initialHpsData = {
  tanggal: formatDateInput(new Date()),
  sumberData: '',
  metodePerhitungan: '',
  keterangan: ''
}

// HPS Item
const initialHpsItem = {
  uraian: '',
  volume: '',
  satuan: '',
  hargaSatuan: '',
  keterangan: ''
}

export default function PengadaanPerencanaan() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [activeTab, setActiveTab] = useState('kak') // 'kak' or 'hps'
  const [isKakModalOpen, setIsKakModalOpen] = useState(false)
  const [isHpsModalOpen, setIsHpsModalOpen] = useState(false)
  const [isViewKakOpen, setIsViewKakOpen] = useState(false)
  const [isViewHpsOpen, setIsViewHpsOpen] = useState(false)
  const [kakData, setKakData] = useState(initialKakData)
  const [hpsData, setHpsData] = useState(initialHpsData)
  const [hpsItems, setHpsItems] = useState([{ ...initialHpsItem }])
  const [editingKakId, setEditingKakId] = useState(null)
  const [editingHpsId, setEditingHpsId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch paket data
  const allPaket = useLiveQuery(() =>
    db.procurementPackage.orderBy('createdAt').reverse().toArray()
  ) || []

  // Fetch KAK for selected paket
  const existingKak = useLiveQuery(
    () => selectedPaket ? db.procurementKak.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch HPS for selected paket
  const existingHps = useLiveQuery(
    () => selectedPaket ? db.procurementHps.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch HPS Items
  const existingHpsItems = useLiveQuery(
    () => existingHps ? db.procurementHpsItem.where('hpsId').equals(existingHps.id).toArray() : [],
    [existingHps]
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

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const getJenisLabel = (jenisId) => {
    return JENIS_PENGADAAN.find(j => j.id === jenisId)?.nama || jenisId
  }

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
  }

  // KAK handlers
  const handleOpenKakModal = () => {
    if (existingKak) {
      setEditingKakId(existingKak.id)
      setKakData({
        latarBelakang: existingKak.latarBelakang || '',
        maksudTujuan: existingKak.maksudTujuan || '',
        sasaran: existingKak.sasaran || '',
        ruangLingkup: existingKak.ruangLingkup || '',
        outputPekerjaan: existingKak.outputPekerjaan || '',
        spesifikasiTeknis: existingKak.spesifikasiTeknis || '',
        waktuPelaksanaan: existingKak.waktuPelaksanaan || '',
        lokasi: existingKak.lokasi || '',
        tenagaAhli: existingKak.tenagaAhli || '',
        metodePelaksanaan: existingKak.metodePelaksanaan || '',
        laporanPenyerahan: existingKak.laporanPenyerahan || '',
        keterangan: existingKak.keterangan || ''
      })
    } else {
      setEditingKakId(null)
      setKakData(initialKakData)
    }
    setIsKakModalOpen(true)
  }

  const handleKakInputChange = (e) => {
    const { name, value } = e.target
    setKakData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveKak = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        paketId: selectedPaket.id,
        ...kakData,
        archivePath: selectedPaket.archivePath
      }

      if (editingKakId) {
        const existing = await db.procurementKak.get(editingKakId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementKak.update(editingKakId, updated)
        await recordHistory('procurementKak', editingKakId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementKak.add(newData)
        await recordHistory('procurementKak', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update paket workflow status
        if (selectedPaket.workflowStatus === WORKFLOW_STATUS_PENGADAAN.DRAFT) {
          await db.procurementPackage.update(selectedPaket.id, {
            workflowStatus: WORKFLOW_STATUS_PENGADAAN.PERENCANAAN,
            updatedAt: new Date()
          })
        }
      }

      setIsKakModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan KAK: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // HPS handlers
  const handleOpenHpsModal = () => {
    if (existingHps) {
      setEditingHpsId(existingHps.id)
      setHpsData({
        tanggal: formatDateInput(existingHps.tanggal),
        sumberData: existingHps.sumberData || '',
        metodePerhitungan: existingHps.metodePerhitungan || '',
        keterangan: existingHps.keterangan || ''
      })
      if (existingHpsItems && existingHpsItems.length > 0) {
        setHpsItems(existingHpsItems.map(item => ({
          id: item.id,
          uraian: item.uraian || '',
          volume: item.volume?.toString() || '',
          satuan: item.satuan || '',
          hargaSatuan: item.hargaSatuan?.toString() || '',
          keterangan: item.keterangan || ''
        })))
      } else {
        setHpsItems([{ ...initialHpsItem }])
      }
    } else {
      setEditingHpsId(null)
      setHpsData(initialHpsData)
      setHpsItems([{ ...initialHpsItem }])
    }
    setIsHpsModalOpen(true)
  }

  const handleHpsInputChange = (e) => {
    const { name, value } = e.target
    setHpsData(prev => ({ ...prev, [name]: value }))
  }

  const handleHpsItemChange = (index, field, value) => {
    setHpsItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addHpsItem = () => {
    setHpsItems(prev => [...prev, { ...initialHpsItem }])
  }

  const removeHpsItem = (index) => {
    if (hpsItems.length > 1) {
      setHpsItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateHpsTotals = () => {
    const subtotal = hpsItems.reduce((sum, item) => {
      const volume = parseFloat(item.volume) || 0
      const harga = parseInt(item.hargaSatuan) || 0
      return sum + (volume * harga)
    }, 0)

    const ppn = calculatePpnPengadaan(subtotal)
    const pph = calculatePphPengadaan(subtotal, selectedPaket?.jenisPengadaan)
    const total = subtotal + ppn

    return { subtotal, ppn, pph, total }
  }

  const handleSaveHps = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const totals = calculateHpsTotals()

      const data = {
        paketId: selectedPaket.id,
        tanggal: new Date(hpsData.tanggal),
        items: hpsItems.length,
        subtotal: totals.subtotal,
        ppn: totals.ppn,
        pph: totals.pph,
        overhead: 0,
        totalHps: totals.total,
        sumberData: hpsData.sumberData,
        metodePerhitungan: hpsData.metodePerhitungan,
        keterangan: hpsData.keterangan,
        archivePath: selectedPaket.archivePath
      }

      if (editingHpsId) {
        const existing = await db.procurementHps.get(editingHpsId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementHps.update(editingHpsId, updated)
        await recordHistory('procurementHps', editingHpsId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })

        // Delete old items and add new ones
        await db.procurementHpsItem.where('hpsId').equals(editingHpsId).delete()
        for (const item of hpsItems) {
          await db.procurementHpsItem.add({
            hpsId: editingHpsId,
            uraian: item.uraian,
            volume: parseFloat(item.volume) || 0,
            satuan: item.satuan,
            hargaSatuan: parseInt(item.hargaSatuan) || 0,
            jumlah: (parseFloat(item.volume) || 0) * (parseInt(item.hargaSatuan) || 0),
            keterangan: item.keterangan,
            createdAt: new Date()
          })
        }
      } else {
        const newData = withAuditCreate(data)
        const newHpsId = await db.procurementHps.add(newData)
        await recordHistory('procurementHps', newHpsId, AUDIT_ACTIONS.CREATE, null, newData)

        // Add items
        for (const item of hpsItems) {
          await db.procurementHpsItem.add({
            hpsId: newHpsId,
            uraian: item.uraian,
            volume: parseFloat(item.volume) || 0,
            satuan: item.satuan,
            hargaSatuan: parseInt(item.hargaSatuan) || 0,
            jumlah: (parseFloat(item.volume) || 0) * (parseInt(item.hargaSatuan) || 0),
            keterangan: item.keterangan,
            createdAt: new Date()
          })
        }

        // Update paket workflow status
        if (selectedPaket.workflowStatus === WORKFLOW_STATUS_PENGADAAN.DRAFT) {
          await db.procurementPackage.update(selectedPaket.id, {
            workflowStatus: WORKFLOW_STATUS_PENGADAAN.PERENCANAAN,
            updatedAt: new Date()
          })
        }
      }

      setIsHpsModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan HPS: ' + error.message)
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

  // Stats
  const totalDenganKak = allPaket.filter(p => {
    // This is a simplified check - in production you'd join with KAK table
    return p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.DRAFT
  }).length

  return (
    <Layout title="Perencanaan Pengadaan">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Sudah Ada KAK/HPS</p>
            <p className="text-2xl font-bold">{totalDenganKak}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Belum Ada KAK/HPS</p>
            <p className="text-2xl font-bold">{allPaket.length - totalDenganKak}</p>
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
                          <p className="text-xs text-green-600 font-medium mt-1">
                            {formatRupiah(paket.nilaiPagu)}
                          </p>
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
                      {formatRupiah(selectedPaket.nilaiPagu)}
                    </span>
                  </div>
                </CardBody>
              </Card>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('kak')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'kak'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 inline mr-2" />
                  Kerangka Acuan Kerja (KAK)
                </button>
                <button
                  onClick={() => setActiveTab('hps')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'hps'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calculator className="w-4 h-4 inline mr-2" />
                  Harga Perkiraan Sendiri (HPS)
                </button>
              </div>

              {/* KAK Tab */}
              {activeTab === 'kak' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Kerangka Acuan Kerja (KAK)</CardTitle>
                      <CardDescription>
                        {existingKak ? 'KAK sudah dibuat' : 'Belum ada KAK'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {existingKak && (
                        <Button variant="secondary" size="sm" onClick={() => setIsViewKakOpen(true)} icon={Eye}>
                          Lihat
                        </Button>
                      )}
                      <Button size="sm" onClick={handleOpenKakModal} icon={existingKak ? Pencil : Plus}>
                        {existingKak ? 'Edit KAK' : 'Buat KAK'}
                      </Button>
                    </div>
                  </CardHeader>
                  {existingKak && (
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Waktu Pelaksanaan</p>
                          <p className="font-medium">{existingKak.waktuPelaksanaan || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lokasi</p>
                          <p className="font-medium">{existingKak.lokasi || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Output Pekerjaan</p>
                          <p className="font-medium">{existingKak.outputPekerjaan || '-'}</p>
                        </div>
                      </div>
                    </CardBody>
                  )}
                </Card>
              )}

              {/* HPS Tab */}
              {activeTab === 'hps' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Harga Perkiraan Sendiri (HPS)</CardTitle>
                      <CardDescription>
                        {existingHps ? `Total: ${formatRupiah(existingHps.totalHps)}` : 'Belum ada HPS'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {existingHps && (
                        <Button variant="secondary" size="sm" onClick={() => setIsViewHpsOpen(true)} icon={Eye}>
                          Lihat
                        </Button>
                      )}
                      <Button size="sm" onClick={handleOpenHpsModal} icon={existingHps ? Pencil : Plus}>
                        {existingHps ? 'Edit HPS' : 'Buat HPS'}
                      </Button>
                    </div>
                  </CardHeader>
                  {existingHps && (
                    <CardBody className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal</span>
                          <span>{formatRupiah(existingHps.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">PPN (11%)</span>
                          <span>{formatRupiah(existingHps.ppn)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total HPS</span>
                          <span className="text-green-600">{formatRupiah(existingHps.totalHps)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                          <span>PPh yang akan dipotong</span>
                          <span>{formatRupiah(existingHps.pph)}</span>
                        </div>
                      </div>
                    </CardBody>
                  )}
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan dari daftar untuk melihat atau membuat KAK dan HPS</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* KAK Modal */}
      <Modal
        isOpen={isKakModalOpen}
        onClose={() => setIsKakModalOpen(false)}
        title={editingKakId ? 'Edit KAK' : 'Buat KAK'}
        size="xl"
      >
        <form onSubmit={handleSaveKak}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <Textarea
              label="Latar Belakang"
              name="latarBelakang"
              value={kakData.latarBelakang}
              onChange={handleKakInputChange}
              rows={3}
              required
            />
            <Textarea
              label="Maksud dan Tujuan"
              name="maksudTujuan"
              value={kakData.maksudTujuan}
              onChange={handleKakInputChange}
              rows={2}
              required
            />
            <Textarea
              label="Sasaran"
              name="sasaran"
              value={kakData.sasaran}
              onChange={handleKakInputChange}
              rows={2}
            />
            <Textarea
              label="Ruang Lingkup Pekerjaan"
              name="ruangLingkup"
              value={kakData.ruangLingkup}
              onChange={handleKakInputChange}
              rows={3}
              required
            />
            <Textarea
              label="Output Pekerjaan"
              name="outputPekerjaan"
              value={kakData.outputPekerjaan}
              onChange={handleKakInputChange}
              rows={2}
              required
            />
            <Textarea
              label="Spesifikasi Teknis"
              name="spesifikasiTeknis"
              value={kakData.spesifikasiTeknis}
              onChange={handleKakInputChange}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Waktu Pelaksanaan"
                name="waktuPelaksanaan"
                value={kakData.waktuPelaksanaan}
                onChange={handleKakInputChange}
                placeholder="30 hari kalender"
              />
              <Input
                label="Lokasi"
                name="lokasi"
                value={kakData.lokasi}
                onChange={handleKakInputChange}
                placeholder="Politeknik KP Sorong"
              />
            </div>
            <Textarea
              label="Tenaga Ahli (jika diperlukan)"
              name="tenagaAhli"
              value={kakData.tenagaAhli}
              onChange={handleKakInputChange}
              rows={2}
            />
            <Textarea
              label="Metode Pelaksanaan"
              name="metodePelaksanaan"
              value={kakData.metodePelaksanaan}
              onChange={handleKakInputChange}
              rows={2}
            />
            <Textarea
              label="Laporan dan Penyerahan"
              name="laporanPenyerahan"
              value={kakData.laporanPenyerahan}
              onChange={handleKakInputChange}
              rows={2}
            />
            <Textarea
              label="Keterangan Tambahan"
              name="keterangan"
              value={kakData.keterangan}
              onChange={handleKakInputChange}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsKakModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan KAK
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* HPS Modal */}
      <Modal
        isOpen={isHpsModalOpen}
        onClose={() => setIsHpsModalOpen(false)}
        title={editingHpsId ? 'Edit HPS' : 'Buat HPS'}
        size="xl"
      >
        <form onSubmit={handleSaveHps}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal HPS"
                name="tanggal"
                type="date"
                value={hpsData.tanggal}
                onChange={handleHpsInputChange}
                required
              />
              <Input
                label="Sumber Data Harga"
                name="sumberData"
                value={hpsData.sumberData}
                onChange={handleHpsInputChange}
                placeholder="e-Katalog, Survey Pasar, dll"
              />
            </div>
            <Input
              label="Metode Perhitungan"
              name="metodePerhitungan"
              value={hpsData.metodePerhitungan}
              onChange={handleHpsInputChange}
              placeholder="Harga Satuan berdasarkan e-Katalog"
            />

            {/* HPS Items */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Rincian Item HPS</h4>
                <Button type="button" variant="secondary" size="sm" onClick={addHpsItem} icon={Plus}>
                  Tambah Item
                </Button>
              </div>
              <div className="space-y-3">
                {hpsItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Item #{index + 1}</span>
                      {hpsItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHpsItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Input
                          placeholder="Uraian"
                          value={item.uraian}
                          onChange={(e) => handleHpsItemChange(index, 'uraian', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Volume"
                          type="number"
                          value={item.volume}
                          onChange={(e) => handleHpsItemChange(index, 'volume', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Satuan"
                          value={item.satuan}
                          onChange={(e) => handleHpsItemChange(index, 'satuan', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <CurrencyInput
                          placeholder="Harga Satuan"
                          value={item.hargaSatuan}
                          onChange={(e) => handleHpsItemChange(index, 'hargaSatuan', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-right text-sm">
                      <span className="text-gray-500">Jumlah: </span>
                      <span className="font-medium">
                        {formatRupiah((parseFloat(item.volume) || 0) * (parseInt(item.hargaSatuan) || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                {(() => {
                  const totals = calculateHpsTotals()
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatRupiah(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PPN (11%)</span>
                        <span>{formatRupiah(totals.ppn)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base border-t pt-1">
                        <span>Total HPS</span>
                        <span className="text-green-600">{formatRupiah(totals.total)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>PPh yang akan dipotong</span>
                        <span>{formatRupiah(totals.pph)}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <Textarea
              label="Keterangan"
              name="keterangan"
              value={hpsData.keterangan}
              onChange={handleHpsInputChange}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsHpsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan HPS
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View KAK Modal */}
      <Modal
        isOpen={isViewKakOpen}
        onClose={() => setIsViewKakOpen(false)}
        title="Detail KAK"
        size="lg"
      >
        {existingKak && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs text-gray-500 font-medium">LATAR BELAKANG</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.latarBelakang || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">MAKSUD DAN TUJUAN</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.maksudTujuan || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">SASARAN</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.sasaran || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">RUANG LINGKUP</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.ruangLingkup || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">OUTPUT PEKERJAAN</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.outputPekerjaan || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">SPESIFIKASI TEKNIS</label>
              <p className="text-sm whitespace-pre-wrap">{existingKak.spesifikasiTeknis || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">WAKTU PELAKSANAAN</label>
                <p className="text-sm">{existingKak.waktuPelaksanaan || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">LOKASI</label>
                <p className="text-sm">{existingKak.lokasi || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View HPS Modal */}
      <Modal
        isOpen={isViewHpsOpen}
        onClose={() => setIsViewHpsOpen(false)}
        title="Detail HPS"
        size="lg"
      >
        {existingHps && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal</label>
                <p className="font-medium">{formatTanggal(existingHps.tanggal)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Sumber Data</label>
                <p>{existingHps.sumberData || '-'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Uraian</th>
                    <th className="px-3 py-2 text-right">Vol</th>
                    <th className="px-3 py-2 text-left">Sat</th>
                    <th className="px-3 py-2 text-right">Harga</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {existingHpsItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{item.uraian}</td>
                      <td className="px-3 py-2 text-right">{item.volume}</td>
                      <td className="px-3 py-2">{item.satuan}</td>
                      <td className="px-3 py-2 text-right">{formatRupiah(item.hargaSatuan)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatRupiah(item.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(existingHps.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PPN (11%)</span>
                  <span>{formatRupiah(existingHps.ppn)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total HPS</span>
                  <span className="text-green-600">{formatRupiah(existingHps.totalHps)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>PPh yang akan dipotong</span>
                  <span>{formatRupiah(existingHps.pph)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
