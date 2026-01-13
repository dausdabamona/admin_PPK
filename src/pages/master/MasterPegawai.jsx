import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Search, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import db from '../../db/database'

const GOLONGAN_OPTIONS = [
  { value: 'I/a', label: 'I/a - Juru Muda' },
  { value: 'I/b', label: 'I/b - Juru Muda Tingkat I' },
  { value: 'I/c', label: 'I/c - Juru' },
  { value: 'I/d', label: 'I/d - Juru Tingkat I' },
  { value: 'II/a', label: 'II/a - Pengatur Muda' },
  { value: 'II/b', label: 'II/b - Pengatur Muda Tingkat I' },
  { value: 'II/c', label: 'II/c - Pengatur' },
  { value: 'II/d', label: 'II/d - Pengatur Tingkat I' },
  { value: 'III/a', label: 'III/a - Penata Muda' },
  { value: 'III/b', label: 'III/b - Penata Muda Tingkat I' },
  { value: 'III/c', label: 'III/c - Penata' },
  { value: 'III/d', label: 'III/d - Penata Tingkat I' },
  { value: 'IV/a', label: 'IV/a - Pembina' },
  { value: 'IV/b', label: 'IV/b - Pembina Tingkat I' },
  { value: 'IV/c', label: 'IV/c - Pembina Utama Muda' },
  { value: 'IV/d', label: 'IV/d - Pembina Utama Madya' },
  { value: 'IV/e', label: 'IV/e - Pembina Utama' }
]

const BANK_OPTIONS = [
  { value: 'BRI', label: 'Bank BRI' },
  { value: 'BNI', label: 'Bank BNI' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'Bank BTN' },
  { value: 'BSI', label: 'Bank Syariah Indonesia' }
]

const initialFormData = {
  nip: '',
  nama: '',
  jabatan: '',
  golongan: '',
  pangkat: '',
  rekening: '',
  bank: '',
  unitKerja: ''
}

export default function MasterPegawai() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importData, setImportData] = useState([])
  const [importPreview, setImportPreview] = useState([])
  const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, errors: [] })
  const [importStep, setImportStep] = useState(1) // 1: upload, 2: preview, 3: result
  const fileInputRef = useRef(null)
  const itemsPerPage = 10

  // Fetch pegawai data with live query
  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []

  // Filter by search query
  const filteredPegawai = allPegawai.filter(p =>
    p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nip?.includes(searchQuery) ||
    p.jabatan?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage)
  const paginatedPegawai = filteredPegawai.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get pangkat based on golongan
  const getPangkat = (golongan) => {
    const pangkatMap = {
      'I/a': 'Juru Muda',
      'I/b': 'Juru Muda Tingkat I',
      'I/c': 'Juru',
      'I/d': 'Juru Tingkat I',
      'II/a': 'Pengatur Muda',
      'II/b': 'Pengatur Muda Tingkat I',
      'II/c': 'Pengatur',
      'II/d': 'Pengatur Tingkat I',
      'III/a': 'Penata Muda',
      'III/b': 'Penata Muda Tingkat I',
      'III/c': 'Penata',
      'III/d': 'Penata Tingkat I',
      'IV/a': 'Pembina',
      'IV/b': 'Pembina Tingkat I',
      'IV/c': 'Pembina Utama Muda',
      'IV/d': 'Pembina Utama Madya',
      'IV/e': 'Pembina Utama'
    }
    return pangkatMap[golongan] || ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-fill pangkat when golongan changes
      if (name === 'golongan') {
        updated.pangkat = getPangkat(value)
      }
      return updated
    })
  }

  const handleOpenModal = (pegawai = null) => {
    if (pegawai) {
      setEditingId(pegawai.id)
      setFormData({
        nip: pegawai.nip || '',
        nama: pegawai.nama || '',
        jabatan: pegawai.jabatan || '',
        golongan: pegawai.golongan || '',
        pangkat: pegawai.pangkat || '',
        rekening: pegawai.rekening || '',
        bank: pegawai.bank || '',
        unitKerja: pegawai.unitKerja || ''
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
        ...formData,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pegawai.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pegawai.add(data)
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
      await db.pegawai.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  // Import CSV functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      alert('File CSV tidak valid atau kosong')
      return
    }

    // Get headers (first row)
    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ''))

    // Map column indexes
    const nipIdx = headers.findIndex(h => h.includes('nip') || h === 'nip')
    const namaIdx = headers.findIndex(h => h.includes('nama') && !h.includes('golongan'))
    const jabatanIdx = headers.findIndex(h => h.includes('jabatan'))
    const golonganIdx = headers.findIndex(h => h.includes('golongan') || h.includes('gol'))
    const pangkatIdx = headers.findIndex(h => h.includes('pangkat'))
    const rekeningIdx = headers.findIndex(h => h.includes('rekening') || h.includes('norek'))
    const bankIdx = headers.findIndex(h => h.includes('bank'))
    const unitKerjaIdx = headers.findIndex(h => h.includes('unit') || h.includes('satker'))

    // Parse data rows
    const parsedData = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/"/g, ''))

      if (values.length < 2) continue

      const nip = nipIdx >= 0 ? values[nipIdx] : ''
      const nama = namaIdx >= 0 ? values[namaIdx] : ''

      if (!nip && !nama) continue

      // Determine golongan from nama_golongan or golongan column
      let golongan = ''
      if (golonganIdx >= 0) {
        const golVal = values[golonganIdx]
        // Try to extract golongan pattern like III/a, IV/b etc
        const golMatch = golVal.match(/([IVX]+\/[a-e])/i)
        if (golMatch) {
          golongan = golMatch[1].toUpperCase()
        } else if (golVal.includes('Penata') || golVal.includes('Pembina') || golVal.includes('Pengatur') || golVal.includes('Juru')) {
          // Try to map from pangkat name
          golongan = mapPangkatToGolongan(golVal)
        }
      }

      parsedData.push({
        nip: nip,
        nama: nama,
        jabatan: jabatanIdx >= 0 ? values[jabatanIdx] : '',
        golongan: golongan,
        pangkat: golongan ? getPangkat(golongan) : (pangkatIdx >= 0 ? values[pangkatIdx] : ''),
        rekening: rekeningIdx >= 0 ? values[rekeningIdx] : '',
        bank: bankIdx >= 0 ? values[bankIdx] : '',
        unitKerja: unitKerjaIdx >= 0 ? values[unitKerjaIdx] : ''
      })
    }

    setImportData(parsedData)
    setImportPreview(parsedData.slice(0, 10))
    setImportStep(2)
  }

  const mapPangkatToGolongan = (pangkat) => {
    const map = {
      'juru muda tingkat i': 'I/b',
      'juru muda': 'I/a',
      'juru tingkat i': 'I/d',
      'juru': 'I/c',
      'pengatur muda tingkat i': 'II/b',
      'pengatur muda': 'II/a',
      'pengatur tingkat i': 'II/d',
      'pengatur': 'II/c',
      'penata muda tingkat i': 'III/b',
      'penata muda': 'III/a',
      'penata tingkat i': 'III/d',
      'penata': 'III/c',
      'pembina utama madya': 'IV/d',
      'pembina utama muda': 'IV/c',
      'pembina utama': 'IV/e',
      'pembina tingkat i': 'IV/b',
      'pembina': 'IV/a'
    }
    const key = pangkat.toLowerCase().trim()
    return map[key] || ''
  }

  const handleImport = async () => {
    setLoading(true)
    setImportStatus({ success: 0, failed: 0, errors: [] })

    let success = 0
    let failed = 0
    const errors = []

    for (const row of importData) {
      try {
        // Check if NIP already exists
        if (row.nip) {
          const existing = await db.pegawai.where('nip').equals(row.nip).first()
          if (existing) {
            // Update existing
            await db.pegawai.update(existing.id, {
              ...row,
              updatedAt: new Date()
            })
            success++
            continue
          }
        }

        // Add new
        await db.pegawai.add({
          ...row,
          createdAt: new Date()
        })
        success++
      } catch (error) {
        failed++
        errors.push(`${row.nama || row.nip}: ${error.message}`)
      }
    }

    setImportStatus({ success, failed, errors })
    setImportStep(3)
    setLoading(false)
  }

  const resetImport = () => {
    setImportData([])
    setImportPreview([])
    setImportStatus({ success: 0, failed: 0, errors: [] })
    setImportStep(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const closeImportModal = () => {
    setIsImportModalOpen(false)
    resetImport()
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['nip', 'nama', 'jabatan', 'golongan', 'pangkat', 'rekening', 'bank', 'unitKerja']
    const csvContent = [
      headers.join(','),
      ...allPegawai.map(p => headers.map(h => `"${p[h] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pegawai_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <Layout title="Master Pegawai">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Data Pegawai</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pegawai..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            {/* Import/Export Buttons */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsImportModalOpen(true)} icon={Upload}>
                Import
              </Button>
              <Button variant="secondary" onClick={handleExportCSV} icon={Download}>
                Export
              </Button>
            </div>
            {/* Add Button */}
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Pegawai
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>NIP</TableHeader>
                <TableHeader>Nama</TableHeader>
                <TableHeader>Jabatan</TableHeader>
                <TableHeader>Golongan</TableHeader>
                <TableHeader>Rekening</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPegawai.length > 0 ? (
                paginatedPegawai.map((pegawai, index) => (
                  <TableRow key={pegawai.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {pegawai.nip}
                    </TableCell>
                    <TableCell className="font-medium">
                      {pegawai.nama}
                    </TableCell>
                    <TableCell>{pegawai.jabatan}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {pegawai.golongan} - {pegawai.pangkat}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {pegawai.rekening}
                      </span>
                      <br />
                      <span className="text-xs text-gray-500">
                        {pegawai.bank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(pegawai)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(pegawai.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data pegawai'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPegawai.length}
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
        title={editingId ? 'Edit Pegawai' : 'Tambah Pegawai'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NIP"
              name="nip"
              value={formData.nip}
              onChange={handleInputChange}
              placeholder="198501012010011001"
              required
            />
            <Input
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              placeholder="Nama lengkap dengan gelar"
              required
            />
            <Input
              label="Jabatan"
              name="jabatan"
              value={formData.jabatan}
              onChange={handleInputChange}
              placeholder="Analis Kepegawaian"
              required
            />
            <Select
              label="Golongan"
              name="golongan"
              value={formData.golongan}
              onChange={handleInputChange}
              options={GOLONGAN_OPTIONS}
              required
            />
            <Input
              label="Pangkat"
              name="pangkat"
              value={formData.pangkat}
              onChange={handleInputChange}
              placeholder="Auto-filled dari Golongan"
              disabled
            />
            <Input
              label="Unit Kerja"
              name="unitKerja"
              value={formData.unitKerja}
              onChange={handleInputChange}
              placeholder="Sub Bagian Umum"
            />
            <Input
              label="Nomor Rekening"
              name="rekening"
              value={formData.rekening}
              onChange={handleInputChange}
              placeholder="1234567890"
              required
            />
            <Select
              label="Bank"
              name="bank"
              value={formData.bank}
              onChange={handleInputChange}
              options={BANK_OPTIONS}
              required
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-gray-600">
          Apakah Anda yakin ingin menghapus data pegawai ini? Tindakan ini tidak dapat dibatalkan.
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

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        title="Import Data Pegawai"
        size="xl"
      >
        {/* Step 1: Upload File */}
        {importStep === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Format File</p>
                  <p className="text-blue-700 mt-1">
                    Upload file CSV atau Excel (.csv, .xls, .xlsx) dengan kolom:
                  </p>
                  <ul className="text-blue-700 mt-2 list-disc list-inside">
                    <li><strong>nip</strong> - Nomor Induk Pegawai</li>
                    <li><strong>nama</strong> - Nama lengkap</li>
                    <li><strong>jabatan</strong> - Jabatan</li>
                    <li><strong>golongan</strong> - Golongan (misal: III/a) atau nama pangkat</li>
                    <li><strong>rekening</strong> - Nomor rekening (opsional)</li>
                    <li><strong>bank</strong> - Nama bank (opsional)</li>
                    <li><strong>unitKerja / satker</strong> - Unit kerja (opsional)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Pilih file CSV untuk diimport</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="csvFileInput"
              />
              <label
                htmlFor="csvFileInput"
                className="btn btn-primary cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Pilih File CSV
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
                <strong>{importData.length}</strong> data pegawai ditemukan. Preview 10 data pertama:
              </p>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">NIP</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Jabatan</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Golongan</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Kerja</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importPreview.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.nip || '-'}</td>
                      <td className="px-3 py-2 font-medium">{row.nama || '-'}</td>
                      <td className="px-3 py-2">{row.jabatan || '-'}</td>
                      <td className="px-3 py-2">{row.golongan || '-'}</td>
                      <td className="px-3 py-2">{row.unitKerja || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importData.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                ... dan {importData.length - 10} data lainnya
              </p>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={resetImport}>
                Kembali
              </Button>
              <Button onClick={handleImport} loading={loading} icon={Upload}>
                Import {importData.length} Data
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Step 3: Result */}
        {importStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-8 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{importStatus.success}</p>
                <p className="text-sm text-gray-500">Berhasil</p>
              </div>
              {importStatus.failed > 0 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{importStatus.failed}</p>
                  <p className="text-sm text-gray-500">Gagal</p>
                </div>
              )}
            </div>

            {importStatus.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 mb-2">Error:</p>
                <ul className="text-sm text-red-700 list-disc list-inside max-h-32 overflow-auto">
                  {importStatus.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
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
    </Layout>
  )
}
