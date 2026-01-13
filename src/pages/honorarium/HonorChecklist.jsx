import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, Eye, CheckCircle, XCircle, AlertCircle, FileCheck, Upload, Folder
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { CHECKLIST_HONOR, BULAN_INDONESIA } from '../../db/database'
import { formatTanggal, formatDateInput } from '../../utils/formatters'

export default function HonorChecklist() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [selectedNominatif, setSelectedNominatif] = useState('')
  const [checkItems, setCheckItems] = useState([])
  const [namaPemeriksa, setNamaPemeriksa] = useState('')
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState('')
  const [catatan, setCatatan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allChecklists = useLiveQuery(() =>
    db.honorChecklist.orderBy('createdAt').reverse().toArray()
  ) || []

  const allAssignments = useLiveQuery(() =>
    db.honorAssignment.toArray()
  ) || []

  const allNominatifs = useLiveQuery(() =>
    db.honorNominatif.toArray()
  ) || []

  // Filter nominatifs by selected assignment
  const filteredNominatifs = selectedAssignment
    ? allNominatifs.filter(n => n.assignmentId?.toString() === selectedAssignment)
    : allNominatifs

  // Filter checklists
  const filteredChecklists = allChecklists.filter(c => {
    const assignment = allAssignments.find(a => a.id === c.assignmentId)
    const matchSearch = assignment?.nomorSK?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment?.perihal?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !filterStatus || c.statusKelengkapan === filterStatus
    return matchSearch && matchStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredChecklists.length / itemsPerPage)
  const paginatedChecklists = filteredChecklists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const assignmentOptions = allAssignments.map(a => ({
    value: a.id.toString(),
    label: `${a.nomorSK} - ${a.perihal}`
  }))

  const nominatifOptions = filteredNominatifs.map(n => ({
    value: n.id.toString(),
    label: `${n.nomorNominatif} - ${getBulanLabel(n.bulan)} ${n.tahun}`
  }))

  const statusOptions = [
    { value: 'lengkap', label: 'Lengkap' },
    { value: 'tidak_lengkap', label: 'Tidak Lengkap' },
    { value: 'pending', label: 'Menunggu' }
  ]

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    tahunOptions.push({ value: i.toString(), label: i.toString() })
  }

  function getBulanLabel(bulan) {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  // Initialize checkItems with template
  useEffect(() => {
    if (isModalOpen && checkItems.length === 0) {
      setCheckItems(CHECKLIST_HONOR.map(item => ({
        ...item,
        ada: false,
        keterangan: ''
      })))
    }
  }, [isModalOpen])

  const handleOpenModal = (checklist = null) => {
    if (checklist) {
      setEditingId(checklist.id)
      setSelectedAssignment(checklist.assignmentId?.toString() || '')
      setSelectedNominatif(checklist.nominatifId?.toString() || '')
      setCheckItems(checklist.items || CHECKLIST_HONOR.map(item => ({
        ...item,
        ada: false,
        keterangan: ''
      })))
      setNamaPemeriksa(checklist.namaPemeriksa || '')
      setTanggalPemeriksaan(checklist.tanggalPemeriksaan ? formatDateInput(checklist.tanggalPemeriksaan) : '')
      setCatatan(checklist.catatan || '')
    } else {
      setEditingId(null)
      setSelectedAssignment('')
      setSelectedNominatif('')
      setCheckItems(CHECKLIST_HONOR.map(item => ({
        ...item,
        ada: false,
        keterangan: ''
      })))
      setNamaPemeriksa('')
      setTanggalPemeriksaan('')
      setCatatan('')
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setSelectedAssignment('')
    setSelectedNominatif('')
    setCheckItems([])
    setNamaPemeriksa('')
    setTanggalPemeriksaan('')
    setCatatan('')
  }

  const handleCheckItem = (index, field, value) => {
    setCheckItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const itemLengkap = checkItems.filter(item => item.ada).length
      const totalItem = checkItems.length
      const wajibLengkap = checkItems.filter(item => item.wajib && item.ada).length
      const totalWajib = checkItems.filter(item => item.wajib).length

      const data = {
        assignmentId: selectedAssignment ? parseInt(selectedAssignment) : null,
        nominatifId: selectedNominatif ? parseInt(selectedNominatif) : null,
        items: checkItems,
        statusKelengkapan: wajibLengkap === totalWajib ? 'lengkap' : 'tidak_lengkap',
        totalItem,
        itemLengkap,
        namaPemeriksa,
        tanggalPemeriksaan: tanggalPemeriksaan ? new Date(tanggalPemeriksaan) : null,
        catatan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.honorChecklist.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.honorChecklist.add(data)
      }

      handleCloseModal()
    } catch (error) {
      alert('Gagal menyimpan data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (checklist) => {
    const assignment = allAssignments.find(a => a.id === checklist.assignmentId)
    const nominatif = allNominatifs.find(n => n.id === checklist.nominatifId)
    setViewingData({ ...checklist, assignment, nominatif })
    setIsViewModalOpen(true)
  }

  const getStatusBadge = (status) => {
    if (status === 'lengkap') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Lengkap
        </Badge>
      )
    } else if (status === 'tidak_lengkap') {
      return (
        <Badge variant="danger" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Tidak Lengkap
        </Badge>
      )
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Menunggu
      </Badge>
    )
  }

  const getAssignmentInfo = (id) => {
    return allAssignments.find(a => a.id === id)
  }

  // Stats
  const totalChecklists = allChecklists.length
  const totalLengkap = allChecklists.filter(c => c.statusKelengkapan === 'lengkap').length
  const totalTidakLengkap = allChecklists.filter(c => c.statusKelengkapan === 'tidak_lengkap').length

  return (
    <Layout title="Checklist SPJ Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Checklist</p>
            <p className="text-2xl font-bold">{totalChecklists}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">SPJ Lengkap</p>
            <p className="text-2xl font-bold">{totalLengkap}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Tidak Lengkap</p>
            <p className="text-2xl font-bold">{totalTidakLengkap}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              Checklist SPJ Honorarium
            </CardTitle>
            <CardDescription>
              Kelola checklist kelengkapan SPJ honor
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
              className="w-full sm:w-40"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari SK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-40"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Checklist
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>SK Penugasan</TableHeader>
                <TableHeader>Nominatif</TableHeader>
                <TableHeader>Kelengkapan</TableHeader>
                <TableHeader>Pemeriksa</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChecklists.length > 0 ? (
                paginatedChecklists.map((checklist, index) => {
                  const assignment = getAssignmentInfo(checklist.assignmentId)
                  const nominatif = allNominatifs.find(n => n.id === checklist.nominatifId)
                  return (
                    <TableRow key={checklist.id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{assignment?.nomorSK || '-'}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{assignment?.perihal}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {nominatif?.nomorNominatif || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{checklist.itemLengkap}/{checklist.totalItem}</span>
                        <span className="text-gray-400 text-sm"> item</span>
                      </TableCell>
                      <TableCell>
                        {checklist.namaPemeriksa || '-'}
                      </TableCell>
                      <TableCell>
                        {checklist.tanggalPemeriksaan ? formatTanggal(checklist.tanggalPemeriksaan, 'short') : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(checklist.statusKelengkapan)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(checklist)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Lihat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(checklist)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada checklist SPJ'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredChecklists.length}
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
        title={editingId ? 'Edit Checklist SPJ' : 'Buat Checklist SPJ'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="SK Penugasan"
                value={selectedAssignment}
                onChange={(e) => {
                  setSelectedAssignment(e.target.value)
                  setSelectedNominatif('')
                }}
                options={assignmentOptions}
                required
              />
              <Select
                label="Nominatif (Opsional)"
                value={selectedNominatif}
                onChange={(e) => setSelectedNominatif(e.target.value)}
                options={nominatifOptions}
                placeholder="Pilih nominatif..."
              />
            </div>

            {/* Checklist Items */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">No</th>
                    <th className="px-4 py-2 text-left">Dokumen</th>
                    <th className="px-4 py-2 text-center">Wajib</th>
                    <th className="px-4 py-2 text-center">Ada</th>
                    <th className="px-4 py-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {checkItems.map((item, index) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{item.nama}</td>
                      <td className="px-4 py-2 text-center">
                        {item.wajib ? (
                          <Badge variant="danger" className="text-xs">Wajib</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Opsional</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.ada}
                          onChange={(e) => handleCheckItem(index, 'ada', e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.keterangan || ''}
                          onChange={(e) => handleCheckItem(index, 'keterangan', e.target.value)}
                          className="input py-1 px-2 text-sm w-full"
                          placeholder="Keterangan..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Pemeriksa"
                value={namaPemeriksa}
                onChange={(e) => setNamaPemeriksa(e.target.value)}
                required
              />
              <Input
                label="Tanggal Pemeriksaan"
                type="date"
                value={tanggalPemeriksaan}
                onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                required
              />
            </div>
            <Textarea
              label="Catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan..."
            />

            {/* Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                Kelengkapan: <span className="font-bold">{checkItems.filter(i => i.ada).length}/{checkItems.length}</span> item
                {' '}|{' '}
                Wajib: <span className="font-bold">{checkItems.filter(i => i.wajib && i.ada).length}/{checkItems.filter(i => i.wajib).length}</span>
              </p>
            </div>
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
        title="Detail Checklist SPJ"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs text-gray-500">SK Penugasan</label>
                <p className="font-medium">{viewingData.assignment?.nomorSK || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Nominatif</label>
                <p>{viewingData.nominatif?.nomorNominatif || '-'}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
              <div>
                <p className="text-sm text-gray-500">Status Kelengkapan</p>
                <div className="mt-1">{getStatusBadge(viewingData.statusKelengkapan)}</div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Kelengkapan</p>
                <p className="text-2xl font-bold">{viewingData.itemLengkap}/{viewingData.totalItem}</p>
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Dokumen</th>
                    <th className="px-4 py-2 text-center">Wajib</th>
                    <th className="px-4 py-2 text-center">Ada</th>
                    <th className="px-4 py-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingData.items || []).map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.nama}</td>
                      <td className="px-4 py-2 text-center">
                        {item.wajib ? (
                          <Badge variant="danger" className="text-xs">Wajib</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Opsional</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.ada ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-500">{item.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Pemeriksa</label>
                <p className="font-medium">{viewingData.namaPemeriksa || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Pemeriksaan</label>
                <p>{viewingData.tanggalPemeriksaan ? formatTanggal(viewingData.tanggalPemeriksaan) : '-'}</p>
              </div>
            </div>

            {viewingData.catatan && (
              <div>
                <label className="text-xs text-gray-500">Catatan</label>
                <p className="text-sm">{viewingData.catatan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
