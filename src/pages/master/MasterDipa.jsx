import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, Upload, FileSpreadsheet, AlertCircle,
  CheckCircle2, TrendingUp, TrendingDown, Info, History,
  GitCompare, BarChart3, Filter, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import DipaRevisionService from '../../services/DipaRevisionService'
import { db } from '../../db/database'

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Semua Level' },
  { value: 'program', label: 'Program' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'output', label: 'Output' },
  { value: 'komponen', label: 'Komponen' },
  { value: 'akun', label: 'Akun (MAK)' }
]

const LEVEL_COLORS = {
  program: 'bg-purple-100 text-purple-700 border-purple-200',
  kegiatan: 'bg-blue-100 text-blue-700 border-blue-200',
  output: 'bg-green-100 text-green-700 border-green-200',
  komponen: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  akun: 'bg-orange-100 text-orange-700 border-orange-200',
  detail: 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function MasterDipa() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isNewRevisionModalOpen, setIsNewRevisionModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // New revision form
  const [revisionForm, setRevisionForm] = useState({
    nomorRevisi: '',
    keterangan: ''
  })

  // Import state
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importStep, setImportStep] = useState(1) // 1: upload, 2: preview, 3: result
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  // Compare state
  const [compareRevisionA, setCompareRevisionA] = useState(null)
  const [compareRevisionB, setCompareRevisionB] = useState(null)
  const [compareResult, setCompareResult] = useState(null)

  const itemsPerPage = 20

  // Fetch active DIPA data
  const activeDipaData = useLiveQuery(
    () => db.masterDipa
      .where('[tahun+status]')
      .equals([selectedYear, 'active'])
      .toArray(),
    [selectedYear]
  ) || []

  // Fetch active revision
  const activeRevision = useLiveQuery(
    () => db.dipaRevisions
      .where('[tahun+status]')
      .equals([selectedYear, 'active'])
      .first(),
    [selectedYear]
  )

  // Fetch all revisions for this year
  const allRevisions = useLiveQuery(
    () => db.dipaRevisions
      .where('tahun')
      .equals(selectedYear)
      .reverse()
      .sortBy('revisi'),
    [selectedYear]
  ) || []

  // Filter data
  const filteredData = activeDipaData.filter(item => {
    const matchesSearch =
      item.kode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uraian?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLevel = levelFilter === 'all' || item.level === levelFilter

    return matchesSearch && matchesLevel
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Statistics
  const stats = {
    total: activeDipaData.length,
    totalPagu: activeDipaData.reduce((sum, item) => sum + (item.pagu || 0), 0),
    totalRealisasi: activeDipaData.reduce((sum, item) => sum + (item.realisasi || 0), 0),
    totalSisa: activeDipaData.reduce((sum, item) => sum + (item.sisa || 0), 0),
    persentaseRealisasi: 0
  }

  if (stats.totalPagu > 0) {
    stats.persentaseRealisasi = (stats.totalRealisasi / stats.totalPagu) * 100
  }

  // Format rupiah
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  // Handle create new revision
  const handleCreateRevision = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await DipaRevisionService.createRevision(
        selectedYear,
        revisionForm.nomorRevisi,
        revisionForm.keterangan
      )

      if (result.success) {
        setIsNewRevisionModalOpen(false)
        setRevisionForm({ nomorRevisi: '', keterangan: '' })
        setIsImportModalOpen(true)
      } else {
        alert('Gagal membuat revisi: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportFile(file)

    try {
      // Read and preview Excel
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet)

      if (rows.length === 0) {
        alert('File Excel kosong')
        return
      }

      // Preview first 10 rows
      setImportPreview(rows.slice(0, 10))
      setImportStep(2)
    } catch (error) {
      alert('Gagal membaca file: ' + error.message)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!importFile || !activeRevision) {
      alert('File atau revisi tidak valid')
      return
    }

    setLoading(true)

    try {
      const result = await DipaRevisionService.importFromExcel(
        importFile,
        selectedYear,
        activeRevision.revisi
      )

      setImportResult(result)
      setImportStep(3)
    } catch (error) {
      alert('Error import: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset import
  const resetImport = () => {
    setImportFile(null)
    setImportPreview([])
    setImportStep(1)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Close import modal
  const closeImportModal = () => {
    setIsImportModalOpen(false)
    resetImport()
  }

  // Handle compare revisions
  const handleCompare = async () => {
    if (compareRevisionA === null || compareRevisionB === null) {
      alert('Pilih dua revisi untuk dibandingkan')
      return
    }

    setLoading(true)

    try {
      const result = await DipaRevisionService.compareRevisions(
        selectedYear,
        parseInt(compareRevisionA),
        parseInt(compareRevisionB)
      )

      setCompareResult(result)
    } catch (error) {
      alert('Error comparing: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Export to Excel
  const handleExport = () => {
    if (activeDipaData.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const exportData = activeDipaData.map(item => ({
      'Kode': item.kode,
      'Uraian': item.uraian,
      'Level': item.level,
      'Pagu': item.pagu,
      'Pagu Sebelumnya': item.paguSebelumnya,
      'Selisih': item.selisih,
      'Realisasi': item.realisasi,
      'Sisa': item.sisa
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DIPA')

    const fileName = `DIPA_${selectedYear}_Rev${activeRevision?.revisi || 0}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <Layout title="Master DIPA">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Item</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pagu</p>
                <p className="text-lg font-bold mt-1">{formatRupiah(stats.totalPagu)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Realisasi</p>
                <p className="text-lg font-bold mt-1">{formatRupiah(stats.totalRealisasi)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.persentaseRealisasi.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sisa Pagu</p>
                <p className="text-lg font-bold mt-1">{formatRupiah(stats.totalSisa)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle>Data DIPA {selectedYear}</CardTitle>
            {activeRevision && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {activeRevision.revisi === 0 ? 'DIPA Awal' : `Revisi ${activeRevision.revisi}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value))
                setCurrentPage(1)
              }}
              className="input w-32"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Action buttons */}
            <Button
              variant="secondary"
              onClick={() => setIsHistoryModalOpen(true)}
              icon={History}
              size="sm"
            >
              Riwayat
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsCompareModalOpen(true)}
              icon={GitCompare}
              size="sm"
              disabled={allRevisions.length < 2}
            >
              Bandingkan
            </Button>

            <Button
              variant="secondary"
              onClick={handleExport}
              icon={Download}
              size="sm"
              disabled={activeDipaData.length === 0}
            >
              Export
            </Button>

            <Button
              onClick={() => setIsNewRevisionModalOpen(true)}
              icon={Plus}
              size="sm"
            >
              Revisi Baru
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau uraian..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full"
              />
            </div>

            {/* Level filter */}
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full"
              >
                {LEVEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>

        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>No</TableHeader>
                  <TableHeader>Kode</TableHeader>
                  <TableHeader>Uraian</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader className="text-right">Pagu</TableHeader>
                  <TableHeader className="text-right">Selisih</TableHeader>
                  <TableHeader className="text-right">Realisasi</TableHeader>
                  <TableHeader className="text-right">Sisa</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.kode}
                      </TableCell>
                      <TableCell className="font-medium max-w-md">
                        {item.uraian}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded border ${LEVEL_COLORS[item.level] || LEVEL_COLORS.detail}`}>
                          {item.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRupiah(item.pagu)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.selisih !== 0 && (
                          <span className={item.selisih > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.selisih > 0 ? '+' : ''}{formatRupiah(item.selisih)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRupiah(item.realisasi)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatRupiah(item.sisa)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty
                    message={
                      activeDipaData.length === 0
                        ? 'Belum ada data DIPA. Silakan buat revisi baru dan import data.'
                        : 'Tidak ada data yang sesuai filter'
                    }
                    colSpan={8}
                  />
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>

      {/* New Revision Modal */}
      <Modal
        isOpen={isNewRevisionModalOpen}
        onClose={() => setIsNewRevisionModalOpen(false)}
        title="Buat Revisi DIPA Baru"
        size="md"
      >
        <form onSubmit={handleCreateRevision}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Informasi</p>
                  <p className="mt-1">
                    {activeRevision
                      ? `Revisi saat ini: ${activeRevision.revisi === 0 ? 'DIPA Awal' : `Revisi ${activeRevision.revisi}`}. Data lama akan ditandai sebagai "superseded".`
                      : 'Belum ada DIPA untuk tahun ini. Ini akan menjadi DIPA Awal.'}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Nomor DIPA / SK Revisi"
              name="nomorRevisi"
              value={revisionForm.nomorRevisi}
              onChange={(e) => setRevisionForm(prev => ({ ...prev, nomorRevisi: e.target.value }))}
              placeholder="DIPA-015.01.2.XXXXXX/2024"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={revisionForm.keterangan}
                onChange={(e) => setRevisionForm(prev => ({ ...prev, keterangan: e.target.value }))}
                className="input w-full"
                rows="3"
                placeholder="Keterangan revisi (opsional)"
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewRevisionModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              Buat Revisi
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        title="Import Data DIPA"
        size="xl"
      >
        {/* Step 1: Upload File */}
        {importStep === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Format File Excel</p>
                  <p className="text-blue-700 mt-1">
                    Upload file Excel (.xlsx, .xls) dengan kolom:
                  </p>
                  <ul className="text-blue-700 mt-2 list-disc list-inside">
                    <li><strong>Kode / MAK</strong> - Kode akun (6 digit atau full path)</li>
                    <li><strong>Uraian / Nama</strong> - Nama item</li>
                    <li><strong>Pagu / Anggaran</strong> - Nilai pagu (Rupiah)</li>
                  </ul>
                  <p className="text-blue-700 mt-2">
                    System akan otomatis mendeteksi level dan menghitung selisih dari revisi sebelumnya.
                  </p>
                </div>
              </div>
            </div>

            {activeRevision && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Import untuk: <strong>{selectedYear} - {activeRevision.revisi === 0 ? 'DIPA Awal' : `Revisi ${activeRevision.revisi}`}</strong>
                </p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Pilih file Excel untuk diimport</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excelFileInput"
              />
              <label
                htmlFor="excelFileInput"
                className="btn btn-primary cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Pilih File Excel
              </label>
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={closeImportModal}>
                Batal
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Step 2: Preview Data */}
        {importStep === 2 && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Preview 10 data pertama dari file Excel:
              </p>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kode</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Pagu</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importPreview.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {row['Kode'] || row['kode'] || row['MAK'] || row['mak'] || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {row['Uraian'] || row['uraian'] || row['Nama'] || row['nama'] || '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatRupiah(row['Pagu'] || row['pagu'] || row['Anggaran'] || row['anggaran'] || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ModalFooter>
              <Button variant="secondary" onClick={resetImport}>
                Kembali
              </Button>
              <Button onClick={handleImport} loading={loading} icon={Upload}>
                Import Data
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Step 3: Result */}
        {importStep === 3 && importResult && (
          <div className="space-y-4">
            {importResult.success ? (
              <>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{importResult.count}</p>
                    <p className="text-sm text-gray-500">Item berhasil diimport</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Pagu:</span>
                    <span className="font-mono font-medium">{formatRupiah(importResult.totalPagu)}</span>
                  </div>
                  {importResult.perubahanPagu !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Perubahan Pagu:</span>
                      <span className={`font-mono font-medium ${importResult.perubahanPagu > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {importResult.perubahanPagu > 0 ? '+' : ''}{formatRupiah(importResult.perubahanPagu)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-lg font-medium text-red-600">Import Gagal</p>
                  <p className="text-sm text-gray-500 mt-2">{importResult.error}</p>
                </div>
              </div>
            )}

            <ModalFooter>
              <Button onClick={closeImportModal}>
                Selesai
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Riwayat Revisi DIPA ${selectedYear}`}
        size="lg"
      >
        <div className="space-y-3">
          {allRevisions.length > 0 ? (
            allRevisions.map((rev) => (
              <div
                key={rev.id}
                className={`border rounded-lg p-4 ${
                  rev.status === 'active'
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {rev.revisi === 0 ? 'DIPA Awal' : `Revisi ${rev.revisi}`}
                      </h4>
                      {rev.status === 'active' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rev.nomorRevisi}</p>
                    {rev.keterangan && (
                      <p className="text-sm text-gray-500 mt-1">{rev.keterangan}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(rev.tanggalRevisi).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatRupiah(rev.totalPagu)}</p>
                    {rev.perubahanPagu !== 0 && rev.perubahanPagu !== undefined && (
                      <p className={`text-xs mt-1 ${rev.perubahanPagu > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rev.perubahanPagu > 0 ? '+' : ''}{formatRupiah(rev.perubahanPagu)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{rev.jumlahItem || 0} item</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              Belum ada revisi untuk tahun {selectedYear}
            </p>
          )}
        </div>

        <ModalFooter>
          <Button onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        </ModalFooter>
      </Modal>

      {/* Compare Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => {
          setIsCompareModalOpen(false)
          setCompareResult(null)
        }}
        title={`Bandingkan Revisi DIPA ${selectedYear}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Revisi A"
              value={compareRevisionA || ''}
              onChange={(e) => setCompareRevisionA(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Revisi --' },
                ...allRevisions.map(rev => ({
                  value: rev.revisi.toString(),
                  label: rev.revisi === 0 ? 'DIPA Awal' : `Revisi ${rev.revisi}`
                }))
              ]}
            />

            <Select
              label="Revisi B"
              value={compareRevisionB || ''}
              onChange={(e) => setCompareRevisionB(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Revisi --' },
                ...allRevisions.map(rev => ({
                  value: rev.revisi.toString(),
                  label: rev.revisi === 0 ? 'DIPA Awal' : `Revisi ${rev.revisi}`
                }))
              ]}
            />
          </div>

          <Button
            onClick={handleCompare}
            loading={loading}
            disabled={compareRevisionA === null || compareRevisionB === null}
            className="w-full"
          >
            Bandingkan
          </Button>

          {compareResult && compareResult.success && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{compareResult.summary.added}</p>
                  <p className="text-xs text-green-700">Ditambah</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{compareResult.summary.removed}</p>
                  <p className="text-xs text-red-700">Dihapus</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{compareResult.summary.changed}</p>
                  <p className="text-xs text-blue-700">Berubah</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{formatRupiah(compareResult.summary.netChange)}</p>
                  <p className="text-xs text-gray-700">Net Change</p>
                </div>
              </div>

              {/* Changes List */}
              {compareResult.changes.length > 0 && (
                <div className="max-h-96 overflow-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tipe</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kode</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Pagu Lama</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Pagu Baru</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {compareResult.changes.map((change, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              change.type === 'ADDED' ? 'bg-green-100 text-green-700' :
                              change.type === 'REMOVED' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {change.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{change.kode}</td>
                          <td className="px-3 py-2 text-xs">{change.uraian}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {change.paguLama ? formatRupiah(change.paguLama) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {change.paguBaru ? formatRupiah(change.paguBaru) : '-'}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono text-xs ${
                            change.selisih > 0 ? 'text-green-600' : change.selisih < 0 ? 'text-red-600' : ''
                          }`}>
                            {change.selisih > 0 ? '+' : ''}{formatRupiah(change.selisih)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <ModalFooter>
          <Button onClick={() => {
            setIsCompareModalOpen(false)
            setCompareResult(null)
          }}>
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
