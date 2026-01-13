import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Search, ClipboardCheck, Eye, Package, ChevronRight, Save,
  FileCheck, CheckCircle2, Clock, AlertTriangle, FileSignature
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_PENGADAAN,
  STATUS_PEMERIKSAAN_BAP,
  STATUS_KONTRAK_PENGADAAN,
  WORKFLOW_STATUS_PENGADAAN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// BAP Form
const initialBapData = {
  nomorBap: '',
  tanggalBap: formatDateInput(new Date()),
  terminKe: '1',
  hasilPemeriksaan: '',
  catatan: '',
  statusPemeriksaan: 'sesuai',
  timPemeriksa: ''
}

// BAST Form
const initialBastData = {
  nomorBast: '',
  tanggalBast: formatDateInput(new Date()),
  terminKe: '1',
  nilaiSerahTerima: '',
  kondisiBarang: 'Baik, sesuai spesifikasi',
  catatanSerahTerima: ''
}

// PHO Form
const initialPhoData = {
  nomorPho: '',
  tanggalPho: formatDateInput(new Date()),
  progresAkhir: '100',
  catatanPho: '',
  masaPemeliharaan: '',
  tanggalMulaiPemeliharaan: '',
  tanggalSelesaiPemeliharaan: ''
}

// FHO Form
const initialFhoData = {
  nomorFho: '',
  tanggalFho: formatDateInput(new Date()),
  kondisiAkhir: 'Baik, sesuai spesifikasi',
  catatanFho: ''
}

export default function PengadaanSerahTerima() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [activeTab, setActiveTab] = useState('bap')
  const [isBapModalOpen, setIsBapModalOpen] = useState(false)
  const [isBastModalOpen, setIsBastModalOpen] = useState(false)
  const [isPhoModalOpen, setIsPhoModalOpen] = useState(false)
  const [isFhoModalOpen, setIsFhoModalOpen] = useState(false)
  const [bapData, setBapData] = useState(initialBapData)
  const [bastData, setBastData] = useState(initialBastData)
  const [phoData, setPhoData] = useState(initialPhoData)
  const [fhoData, setFhoData] = useState(initialFhoData)
  const [editingBapId, setEditingBapId] = useState(null)
  const [editingBastId, setEditingBastId] = useState(null)
  const [editingPhoId, setEditingPhoId] = useState(null)
  const [editingFhoId, setEditingFhoId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  // Fetch paket data (with contract)
  const allPaket = useLiveQuery(() =>
    db.procurementPackage
      .where('workflowStatus')
      .anyOf([
        WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN,
        WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
        WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN,
        WORKFLOW_STATUS_PENGADAAN.SELESAI
      ])
      .reverse()
      .toArray()
  ) || []

  // Fetch kontrak for selected paket
  const existingKontrak = useLiveQuery(
    () => selectedPaket ? db.procurementContract.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch BAP list
  const bapList = useLiveQuery(
    () => existingKontrak ? db.procurementBap.where('contractId').equals(existingKontrak.id).toArray() : [],
    [existingKontrak]
  )

  // Fetch BAST list
  const bastList = useLiveQuery(
    () => existingKontrak ? db.procurementBast.where('contractId').equals(existingKontrak.id).toArray() : [],
    [existingKontrak]
  )

  // Fetch PHO
  const existingPho = useLiveQuery(
    () => existingKontrak ? db.procurementPho.where('contractId').equals(existingKontrak.id).first() : null,
    [existingKontrak]
  )

  // Fetch FHO
  const existingFho = useLiveQuery(
    () => existingPho ? db.procurementFho.where('phoId').equals(existingPho.id).first() : null,
    [existingPho]
  )

  // Filter paket
  const filteredPaket = allPaket.filter(p => {
    const matchSearch = p.namaPaket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePaket?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTahun = !filterTahun || p.tahun === filterTahun
    return matchSearch && matchTahun
  })

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const statusPemeriksaanOptions = [
    { value: 'sesuai', label: 'Sesuai' },
    { value: 'sesuai_dengan_catatan', label: 'Sesuai dengan Catatan' },
    { value: 'tidak_sesuai', label: 'Tidak Sesuai' }
  ]

  const isKonstruksi = selectedPaket?.jenisPengadaan === 'konstruksi'

  const getJenisLabel = (jenisId) => {
    return JENIS_PENGADAAN.find(j => j.id === jenisId)?.nama || jenisId
  }

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
    setActiveTab('bap')
  }

  // ==================== BAP Handlers ====================
  const handleOpenBapModal = (bap = null) => {
    if (bap) {
      setEditingBapId(bap.id)
      setBapData({
        nomorBap: bap.nomorBap || '',
        tanggalBap: formatDateInput(bap.tanggalBap),
        terminKe: bap.terminKe?.toString() || '1',
        hasilPemeriksaan: bap.hasilPemeriksaan || '',
        catatan: bap.catatan || '',
        statusPemeriksaan: bap.statusPemeriksaan || 'sesuai',
        timPemeriksa: bap.timPemeriksa || ''
      })
    } else {
      setEditingBapId(null)
      const nextTermin = (bapList?.length || 0) + 1
      setBapData({ ...initialBapData, terminKe: nextTermin.toString() })
    }
    setIsBapModalOpen(true)
  }

  const handleSaveBap = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        nomorBap: bapData.nomorBap,
        tanggalBap: new Date(bapData.tanggalBap),
        terminKe: parseInt(bapData.terminKe) || 1,
        hasilPemeriksaan: bapData.hasilPemeriksaan,
        catatan: bapData.catatan,
        statusPemeriksaan: bapData.statusPemeriksaan,
        timPemeriksa: bapData.timPemeriksa,
        archivePath: selectedPaket.archivePath
      }

      if (editingBapId) {
        const existing = await db.procurementBap.get(editingBapId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementBap.update(editingBapId, updated)
        await recordHistory('procurementBap', editingBapId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementBap.add(newData)
        await recordHistory('procurementBap', newId, AUDIT_ACTIONS.CREATE, null, newData)
      }

      setIsBapModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan BAP: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== BAST Handlers ====================
  const handleOpenBastModal = (bast = null) => {
    if (bast) {
      setEditingBastId(bast.id)
      setBastData({
        nomorBast: bast.nomorBast || '',
        tanggalBast: formatDateInput(bast.tanggalBast),
        terminKe: bast.terminKe?.toString() || '1',
        nilaiSerahTerima: bast.nilaiSerahTerima?.toString() || '',
        kondisiBarang: bast.kondisiBarang || '',
        catatanSerahTerima: bast.catatanSerahTerima || ''
      })
    } else {
      setEditingBastId(null)
      const nextTermin = (bastList?.length || 0) + 1
      setBastData({
        ...initialBastData,
        terminKe: nextTermin.toString(),
        nilaiSerahTerima: existingKontrak?.nilaiKontrak?.toString() || ''
      })
    }
    setIsBastModalOpen(true)
  }

  const handleSaveBast = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        nomorBast: bastData.nomorBast,
        tanggalBast: new Date(bastData.tanggalBast),
        terminKe: parseInt(bastData.terminKe) || 1,
        nilaiSerahTerima: parseInt(bastData.nilaiSerahTerima) || 0,
        kondisiBarang: bastData.kondisiBarang,
        catatanSerahTerima: bastData.catatanSerahTerima,
        archivePath: selectedPaket.archivePath
      }

      if (editingBastId) {
        const existing = await db.procurementBast.get(editingBastId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementBast.update(editingBastId, updated)
        await recordHistory('procurementBast', editingBastId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementBast.add(newData)
        await recordHistory('procurementBast', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update workflow if not konstruksi
        if (!isKonstruksi) {
          await db.procurementPackage.update(selectedPaket.id, {
            workflowStatus: WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
            updatedAt: new Date()
          })
          await db.procurementContract.update(existingKontrak.id, {
            status: STATUS_KONTRAK_PENGADAAN.SERAH_TERIMA,
            updatedAt: new Date()
          })
        }
      }

      setIsBastModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan BAST: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== PHO Handlers ====================
  const handleOpenPhoModal = () => {
    if (existingPho) {
      setEditingPhoId(existingPho.id)
      setPhoData({
        nomorPho: existingPho.nomorPho || '',
        tanggalPho: formatDateInput(existingPho.tanggalPho),
        progresAkhir: existingPho.progresAkhir?.toString() || '100',
        catatanPho: existingPho.catatanPho || '',
        masaPemeliharaan: existingPho.masaPemeliharaan?.toString() || '',
        tanggalMulaiPemeliharaan: formatDateInput(existingPho.tanggalMulaiPemeliharaan),
        tanggalSelesaiPemeliharaan: formatDateInput(existingPho.tanggalSelesaiPemeliharaan)
      })
    } else {
      setEditingPhoId(null)
      setPhoData(initialPhoData)
    }
    setIsPhoModalOpen(true)
  }

  const handleSavePho = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        nomorPho: phoData.nomorPho,
        tanggalPho: new Date(phoData.tanggalPho),
        progresAkhir: parseFloat(phoData.progresAkhir) || 100,
        catatanPho: phoData.catatanPho,
        masaPemeliharaan: parseInt(phoData.masaPemeliharaan) || 0,
        tanggalMulaiPemeliharaan: phoData.tanggalMulaiPemeliharaan ? new Date(phoData.tanggalMulaiPemeliharaan) : null,
        tanggalSelesaiPemeliharaan: phoData.tanggalSelesaiPemeliharaan ? new Date(phoData.tanggalSelesaiPemeliharaan) : null,
        archivePath: selectedPaket.archivePath
      }

      if (editingPhoId) {
        const existing = await db.procurementPho.get(editingPhoId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementPho.update(editingPhoId, updated)
        await recordHistory('procurementPho', editingPhoId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementPho.add(newData)
        await recordHistory('procurementPho', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update workflow
        await db.procurementPackage.update(selectedPaket.id, {
          workflowStatus: WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
          updatedAt: new Date()
        })
        await db.procurementContract.update(existingKontrak.id, {
          status: STATUS_KONTRAK_PENGADAAN.SERAH_TERIMA,
          updatedAt: new Date()
        })
      }

      setIsPhoModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan PHO: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== FHO Handlers ====================
  const handleOpenFhoModal = () => {
    if (!existingPho) {
      alert('Buat PHO terlebih dahulu')
      return
    }

    if (existingFho) {
      setEditingFhoId(existingFho.id)
      setFhoData({
        nomorFho: existingFho.nomorFho || '',
        tanggalFho: formatDateInput(existingFho.tanggalFho),
        kondisiAkhir: existingFho.kondisiAkhir || '',
        catatanFho: existingFho.catatanFho || ''
      })
    } else {
      setEditingFhoId(null)
      setFhoData({
        ...initialFhoData,
        tanggalFho: formatDateInput(existingPho.tanggalSelesaiPemeliharaan || new Date())
      })
    }
    setIsFhoModalOpen(true)
  }

  const handleSaveFho = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        phoId: existingPho.id,
        nomorFho: fhoData.nomorFho,
        tanggalFho: new Date(fhoData.tanggalFho),
        kondisiAkhir: fhoData.kondisiAkhir,
        catatanFho: fhoData.catatanFho,
        archivePath: selectedPaket.archivePath
      }

      if (editingFhoId) {
        const existing = await db.procurementFho.get(editingFhoId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementFho.update(editingFhoId, updated)
        await recordHistory('procurementFho', editingFhoId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementFho.add(newData)
        await recordHistory('procurementFho', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update kontrak to selesai
        await db.procurementContract.update(existingKontrak.id, {
          status: STATUS_KONTRAK_PENGADAAN.SELESAI,
          updatedAt: new Date()
        })
      }

      setIsFhoModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan FHO: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      [WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'success'
    }
    return <Badge variant={variants[status] || 'default'}>{getWorkflowStatusLabel(status)}</Badge>
  }

  const getPemeriksaanBadge = (status) => {
    const variants = {
      sesuai: 'success',
      sesuai_dengan_catatan: 'warning',
      tidak_sesuai: 'danger'
    }
    const labels = {
      sesuai: 'Sesuai',
      sesuai_dengan_catatan: 'Dengan Catatan',
      tidak_sesuai: 'Tidak Sesuai'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  return (
    <Layout title="Serah Terima">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket (Dalam Pelaksanaan)</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Proses Serah Terima</p>
            <p className="text-2xl font-bold">
              {allPaket.filter(p => p.workflowStatus === WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA).length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Siap Pembayaran</p>
            <p className="text-2xl font-bold">
              {allPaket.filter(p => p.workflowStatus === WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN).length}
            </p>
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
              {filteredPaket.length > 0 ? (
                <div className="divide-y">
                  {filteredPaket.map(paket => (
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
                  Tidak ada paket dalam pelaksanaan
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedPaket && existingKontrak ? (
            <div className="space-y-4">
              {/* Paket Info */}
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-500">{selectedPaket.kodePaket}</p>
                      <h3 className="text-lg font-bold">{selectedPaket.namaPaket}</h3>
                      <p className="text-sm text-gray-600">Kontrak: {existingKontrak.nomorKontrak}</p>
                    </div>
                    {getStatusBadge(selectedPaket.workflowStatus)}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <Badge variant="info">{getJenisLabel(selectedPaket.jenisPengadaan)}</Badge>
                    <span className="text-lg font-bold text-green-600">
                      {formatRupiah(existingKontrak.nilaiKontrak)}
                    </span>
                  </div>
                </CardBody>
              </Card>

              {/* Tabs */}
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('bap')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'bap'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-1" />
                  BAP
                </button>
                <button
                  onClick={() => setActiveTab('bast')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'bast'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileCheck className="w-4 h-4 inline mr-1" />
                  BAST
                </button>
                {isKonstruksi && (
                  <>
                    <button
                      onClick={() => setActiveTab('pho')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'pho'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      PHO
                    </button>
                    <button
                      onClick={() => setActiveTab('fho')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'fho'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FileSignature className="w-4 h-4 inline mr-1" />
                      FHO
                    </button>
                  </>
                )}
              </div>

              {/* BAP Tab */}
              {activeTab === 'bap' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Berita Acara Pemeriksaan (BAP)</CardTitle>
                      <CardDescription>
                        {bapList?.length || 0} BAP tercatat
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenBapModal()} icon={Plus}>
                      Tambah BAP
                    </Button>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {bapList && bapList.length > 0 ? (
                      <div className="space-y-3">
                        {bapList.map(bap => (
                          <div key={bap.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{bap.nomorBap}</p>
                                <p className="text-sm text-gray-500">
                                  Termin {bap.terminKe} - {formatTanggal(bap.tanggalBap)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getPemeriksaanBadge(bap.statusPemeriksaan)}
                                <button
                                  onClick={() => handleOpenBapModal(bap)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">Belum ada BAP</p>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* BAST Tab */}
              {activeTab === 'bast' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Berita Acara Serah Terima (BAST)</CardTitle>
                      <CardDescription>
                        {bastList?.length || 0} BAST tercatat
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenBastModal()} icon={Plus}>
                      Tambah BAST
                    </Button>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {bastList && bastList.length > 0 ? (
                      <div className="space-y-3">
                        {bastList.map(bast => (
                          <div key={bast.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{bast.nomorBast}</p>
                                <p className="text-sm text-gray-500">
                                  Termin {bast.terminKe} - {formatTanggal(bast.tanggalBast)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-green-600">
                                  {formatRupiah(bast.nilaiSerahTerima)}
                                </span>
                                <button
                                  onClick={() => handleOpenBastModal(bast)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">Belum ada BAST</p>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* PHO Tab */}
              {activeTab === 'pho' && isKonstruksi && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Provisional Hand Over (PHO)</CardTitle>
                      <CardDescription>
                        {existingPho ? `No: ${existingPho.nomorPho}` : 'Belum ada PHO'}
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleOpenPhoModal} icon={existingPho ? Pencil : Plus}>
                      {existingPho ? 'Edit PHO' : 'Buat PHO'}
                    </Button>
                  </CardHeader>
                  {existingPho && (
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tanggal PHO</p>
                          <p className="font-medium">{formatTanggal(existingPho.tanggalPho)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Progress Akhir</p>
                          <p className="font-medium">{existingPho.progresAkhir}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Masa Pemeliharaan</p>
                          <p className="font-medium">{existingPho.masaPemeliharaan || '-'} hari</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Selesai Pemeliharaan</p>
                          <p className="font-medium">
                            {existingPho.tanggalSelesaiPemeliharaan
                              ? formatTanggal(existingPho.tanggalSelesaiPemeliharaan)
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  )}
                </Card>
              )}

              {/* FHO Tab */}
              {activeTab === 'fho' && isKonstruksi && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Final Hand Over (FHO)</CardTitle>
                      <CardDescription>
                        {existingFho ? `No: ${existingFho.nomorFho}` : 'Belum ada FHO'}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleOpenFhoModal}
                      icon={existingFho ? Pencil : Plus}
                      disabled={!existingPho}
                    >
                      {existingFho ? 'Edit FHO' : 'Buat FHO'}
                    </Button>
                  </CardHeader>
                  {!existingPho && (
                    <CardBody className="pt-0">
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Buat PHO terlebih dahulu sebelum membuat FHO</span>
                      </div>
                    </CardBody>
                  )}
                  {existingFho && (
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tanggal FHO</p>
                          <p className="font-medium">{formatTanggal(existingFho.tanggalFho)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Kondisi Akhir</p>
                          <p className="font-medium">{existingFho.kondisiAkhir}</p>
                        </div>
                      </div>
                    </CardBody>
                  )}
                </Card>
              )}
            </div>
          ) : selectedPaket && !existingKontrak ? (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <p>Paket ini belum memiliki kontrak. Buat kontrak terlebih dahulu.</p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan dari daftar untuk mengelola serah terima</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* BAP Modal */}
      <Modal
        isOpen={isBapModalOpen}
        onClose={() => setIsBapModalOpen(false)}
        title={editingBapId ? 'Edit BAP' : 'Buat BAP'}
        size="md"
      >
        <form onSubmit={handleSaveBap}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor BAP"
                name="nomorBap"
                value={bapData.nomorBap}
                onChange={(e) => setBapData(prev => ({ ...prev, nomorBap: e.target.value }))}
                placeholder="BAP/001/2024"
                required
              />
              <Input
                label="Termin Ke"
                name="terminKe"
                type="number"
                value={bapData.terminKe}
                onChange={(e) => setBapData(prev => ({ ...prev, terminKe: e.target.value }))}
                min="1"
                required
              />
            </div>
            <Input
              label="Tanggal BAP"
              name="tanggalBap"
              type="date"
              value={bapData.tanggalBap}
              onChange={(e) => setBapData(prev => ({ ...prev, tanggalBap: e.target.value }))}
              required
            />
            <Select
              label="Status Pemeriksaan"
              name="statusPemeriksaan"
              value={bapData.statusPemeriksaan}
              onChange={(e) => setBapData(prev => ({ ...prev, statusPemeriksaan: e.target.value }))}
              options={statusPemeriksaanOptions}
              required
            />
            <Textarea
              label="Hasil Pemeriksaan"
              name="hasilPemeriksaan"
              value={bapData.hasilPemeriksaan}
              onChange={(e) => setBapData(prev => ({ ...prev, hasilPemeriksaan: e.target.value }))}
              rows={3}
              required
            />
            <Input
              label="Tim Pemeriksa"
              name="timPemeriksa"
              value={bapData.timPemeriksa}
              onChange={(e) => setBapData(prev => ({ ...prev, timPemeriksa: e.target.value }))}
              placeholder="Nama-nama pemeriksa"
            />
            <Textarea
              label="Catatan"
              name="catatan"
              value={bapData.catatan}
              onChange={(e) => setBapData(prev => ({ ...prev, catatan: e.target.value }))}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsBapModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan BAP
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* BAST Modal */}
      <Modal
        isOpen={isBastModalOpen}
        onClose={() => setIsBastModalOpen(false)}
        title={editingBastId ? 'Edit BAST' : 'Buat BAST'}
        size="md"
      >
        <form onSubmit={handleSaveBast}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor BAST"
                name="nomorBast"
                value={bastData.nomorBast}
                onChange={(e) => setBastData(prev => ({ ...prev, nomorBast: e.target.value }))}
                placeholder="BAST/001/2024"
                required
              />
              <Input
                label="Termin Ke"
                name="terminKe"
                type="number"
                value={bastData.terminKe}
                onChange={(e) => setBastData(prev => ({ ...prev, terminKe: e.target.value }))}
                min="1"
                required
              />
            </div>
            <Input
              label="Tanggal BAST"
              name="tanggalBast"
              type="date"
              value={bastData.tanggalBast}
              onChange={(e) => setBastData(prev => ({ ...prev, tanggalBast: e.target.value }))}
              required
            />
            <Input
              label="Nilai Serah Terima (Rp)"
              name="nilaiSerahTerima"
              type="number"
              value={bastData.nilaiSerahTerima}
              onChange={(e) => setBastData(prev => ({ ...prev, nilaiSerahTerima: e.target.value }))}
              required
            />
            <Input
              label="Kondisi Barang/Pekerjaan"
              name="kondisiBarang"
              value={bastData.kondisiBarang}
              onChange={(e) => setBastData(prev => ({ ...prev, kondisiBarang: e.target.value }))}
              placeholder="Baik, sesuai spesifikasi"
            />
            <Textarea
              label="Catatan Serah Terima"
              name="catatanSerahTerima"
              value={bastData.catatanSerahTerima}
              onChange={(e) => setBastData(prev => ({ ...prev, catatanSerahTerima: e.target.value }))}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsBastModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan BAST
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* PHO Modal */}
      <Modal
        isOpen={isPhoModalOpen}
        onClose={() => setIsPhoModalOpen(false)}
        title={editingPhoId ? 'Edit PHO' : 'Buat PHO'}
        size="md"
      >
        <form onSubmit={handleSavePho}>
          <div className="space-y-4">
            <Input
              label="Nomor PHO"
              name="nomorPho"
              value={phoData.nomorPho}
              onChange={(e) => setPhoData(prev => ({ ...prev, nomorPho: e.target.value }))}
              placeholder="PHO/001/2024"
              required
            />
            <Input
              label="Tanggal PHO"
              name="tanggalPho"
              type="date"
              value={phoData.tanggalPho}
              onChange={(e) => setPhoData(prev => ({ ...prev, tanggalPho: e.target.value }))}
              required
            />
            <Input
              label="Progress Akhir (%)"
              name="progresAkhir"
              type="number"
              value={phoData.progresAkhir}
              onChange={(e) => setPhoData(prev => ({ ...prev, progresAkhir: e.target.value }))}
              max="100"
              required
            />
            <Input
              label="Masa Pemeliharaan (hari)"
              name="masaPemeliharaan"
              type="number"
              value={phoData.masaPemeliharaan}
              onChange={(e) => setPhoData(prev => ({ ...prev, masaPemeliharaan: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Mulai Pemeliharaan"
                name="tanggalMulaiPemeliharaan"
                type="date"
                value={phoData.tanggalMulaiPemeliharaan}
                onChange={(e) => setPhoData(prev => ({ ...prev, tanggalMulaiPemeliharaan: e.target.value }))}
              />
              <Input
                label="Selesai Pemeliharaan"
                name="tanggalSelesaiPemeliharaan"
                type="date"
                value={phoData.tanggalSelesaiPemeliharaan}
                onChange={(e) => setPhoData(prev => ({ ...prev, tanggalSelesaiPemeliharaan: e.target.value }))}
              />
            </div>
            <Textarea
              label="Catatan"
              name="catatanPho"
              value={phoData.catatanPho}
              onChange={(e) => setPhoData(prev => ({ ...prev, catatanPho: e.target.value }))}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsPhoModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan PHO
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* FHO Modal */}
      <Modal
        isOpen={isFhoModalOpen}
        onClose={() => setIsFhoModalOpen(false)}
        title={editingFhoId ? 'Edit FHO' : 'Buat FHO'}
        size="md"
      >
        <form onSubmit={handleSaveFho}>
          <div className="space-y-4">
            <Input
              label="Nomor FHO"
              name="nomorFho"
              value={fhoData.nomorFho}
              onChange={(e) => setFhoData(prev => ({ ...prev, nomorFho: e.target.value }))}
              placeholder="FHO/001/2024"
              required
            />
            <Input
              label="Tanggal FHO"
              name="tanggalFho"
              type="date"
              value={fhoData.tanggalFho}
              onChange={(e) => setFhoData(prev => ({ ...prev, tanggalFho: e.target.value }))}
              required
            />
            <Input
              label="Kondisi Akhir"
              name="kondisiAkhir"
              value={fhoData.kondisiAkhir}
              onChange={(e) => setFhoData(prev => ({ ...prev, kondisiAkhir: e.target.value }))}
              placeholder="Baik, sesuai spesifikasi"
            />
            <Textarea
              label="Catatan"
              name="catatanFho"
              value={fhoData.catatanFho}
              onChange={(e) => setFhoData(prev => ({ ...prev, catatanFho: e.target.value }))}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsFhoModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan FHO
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </Layout>
  )
}
