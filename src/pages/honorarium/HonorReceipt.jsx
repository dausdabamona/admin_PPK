import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, Eye, Printer, Receipt, Download
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { BULAN_INDONESIA } from '../../db/database'
import { formatTanggal, formatRupiah, terbilang } from '../../utils/formatters'

export default function HonorReceipt() {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [viewingData, setViewingData] = useState(null)
  const [selectedNominatif, setSelectedNominatif] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterBulan, setFilterBulan] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allReceipts = useLiveQuery(() =>
    db.honorReceipt.orderBy('createdAt').reverse().toArray()
  ) || []

  const allNominatifs = useLiveQuery(() =>
    db.honorNominatif.where('status').anyOf(['siap_bayar', 'dibayar']).toArray()
  ) || []

  const allRecipients = useLiveQuery(() =>
    db.honorRecipient.toArray()
  ) || []

  // Filter
  const filteredReceipts = allReceipts.filter(r => {
    const recipient = allRecipients.find(rec => rec.id === r.recipientId)
    const matchSearch = r.nomorKwitansi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage)
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const nominatifOptions = allNominatifs.map(n => ({
    value: n.id.toString(),
    label: `${n.nomorNominatif} - ${getBulanLabel(n.bulan)} ${n.tahun}`
  }))

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    tahunOptions.push({ value: i.toString(), label: i.toString() })
  }

  const bulanOptions = BULAN_INDONESIA.map(b => ({
    value: b.value.toString(),
    label: b.label
  }))

  function getBulanLabel(bulan) {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  const getRecipientById = (id) => allRecipients.find(r => r.id === id)

  const handleView = (receipt) => {
    const recipient = getRecipientById(receipt.recipientId)
    setViewingData({ ...receipt, recipient })
    setIsViewModalOpen(true)
  }

  const handleGenerateReceipts = async () => {
    if (!selectedNominatif) {
      alert('Pilih nominatif terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const nominatifId = parseInt(selectedNominatif)
      const nominatif = await db.honorNominatif.get(nominatifId)
      const items = await db.honorNominatifItem.where('nominatifId').equals(nominatifId).toArray()

      // Check if receipts already exist
      const existingReceipts = await db.honorReceipt.where('nominatifId').equals(nominatifId).count()
      if (existingReceipts > 0) {
        if (!confirm('Kwitansi untuk nominatif ini sudah ada. Lanjutkan untuk membuat ulang?')) {
          setLoading(false)
          return
        }
        // Delete existing
        await db.honorReceipt.where('nominatifId').equals(nominatifId).delete()
      }

      // Generate receipts for each item
      const receipts = items.map((item, index) => ({
        nominatifId,
        nominatifItemId: item.id,
        recipientId: item.recipientId,
        nomorKwitansi: `KWT-${nominatif.nomorNominatif}-${String(index + 1).padStart(3, '0')}`,
        tanggal: new Date(),
        jumlahBruto: item.jumlahBruto,
        pph: item.pphDipotong,
        jumlahNetto: item.jumlahNetto,
        terbilang: terbilang(item.jumlahNetto),
        status: 'generated',
        createdAt: new Date()
      }))

      await db.honorReceipt.bulkAdd(receipts)
      setIsGenerateModalOpen(false)
      setSelectedNominatif('')
      alert(`Berhasil membuat ${receipts.length} kwitansi`)
    } catch (error) {
      alert('Gagal membuat kwitansi: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      generated: 'default',
      printed: 'success'
    }
    const labels = {
      generated: 'Dibuat',
      printed: 'Dicetak'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Stats
  const totalReceipts = allReceipts.length
  const totalNetto = allReceipts.reduce((sum, r) => sum + (r.jumlahNetto || 0), 0)

  return (
    <Layout title="Kwitansi Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Kwitansi</p>
            <p className="text-2xl font-bold">{totalReceipts}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Nilai Netto</p>
            <p className="text-xl font-bold">{formatRupiah(totalNetto)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Nominatif Siap</p>
            <p className="text-2xl font-bold">{allNominatifs.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              Daftar Kwitansi Honorarium
            </CardTitle>
            <CardDescription>
              Kelola kwitansi penerima honor
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor/nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => setIsGenerateModalOpen(true)} icon={Plus}>
              Generate Kwitansi
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nomor Kwitansi</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Penerima</TableHeader>
                <TableHeader>Bruto</TableHeader>
                <TableHeader>PPh</TableHeader>
                <TableHeader>Netto</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReceipts.length > 0 ? (
                paginatedReceipts.map((receipt, index) => {
                  const recipient = getRecipientById(receipt.recipientId)
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {receipt.nomorKwitansi}
                      </TableCell>
                      <TableCell>
                        {receipt.tanggal ? formatTanggal(receipt.tanggal, 'short') : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{recipient?.nama || '-'}</p>
                          <p className="text-xs text-gray-500">{recipient?.jabatan}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatRupiah(receipt.jumlahBruto)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatRupiah(receipt.pph)}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {formatRupiah(receipt.jumlahNetto)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(receipt)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Lihat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Cetak"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada kwitansi'}
                  colSpan={9}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReceipts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>

      {/* Generate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Kwitansi"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pilih nominatif yang sudah siap bayar untuk membuat kwitansi secara otomatis untuk semua penerima.
          </p>
          <Select
            label="Pilih Nominatif"
            value={selectedNominatif}
            onChange={(e) => setSelectedNominatif(e.target.value)}
            options={nominatifOptions}
            placeholder="Pilih nominatif..."
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleGenerateReceipts} loading={loading} icon={Plus}>
            Generate Kwitansi
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Kwitansi"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            {/* Kwitansi Preview */}
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold">KWITANSI</h3>
                <p className="text-sm text-gray-500">No: {viewingData.nomorKwitansi}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Sudah terima dari:</span>
                  <span className="font-medium">Bendahara Pengeluaran</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Nama Penerima:</span>
                  <span className="font-bold">{viewingData.recipient?.nama}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Jabatan:</span>
                  <span>{viewingData.recipient?.jabatan || '-'}</span>
                </div>

                <div className="p-4 bg-gray-50 rounded">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Bruto</p>
                      <p className="font-medium text-green-600">{formatRupiah(viewingData.jumlahBruto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PPh 21</p>
                      <p className="font-medium text-red-600">{formatRupiah(viewingData.pph)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Netto</p>
                      <p className="font-bold text-blue-600">{formatRupiah(viewingData.jumlahNetto)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600">Terbilang:</span>
                  <p className="italic font-medium">{viewingData.terbilang} rupiah</p>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Untuk pembayaran:</span>
                  <span>Honorarium</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span>{viewingData.tanggal ? formatTanggal(viewingData.tanggal) : '-'}</span>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Mengetahui,</p>
                  <p className="text-sm font-medium">PPK</p>
                  <div className="h-16"></div>
                  <p className="border-t pt-1 text-sm">(...........................)</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Penerima,</p>
                  <div className="h-20"></div>
                  <p className="border-t pt-1 text-sm font-medium">{viewingData.recipient?.nama}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Tutup
              </Button>
              <Button icon={Printer}>
                Cetak Kwitansi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
