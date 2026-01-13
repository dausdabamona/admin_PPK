import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Search, Calculator, FileText, Download, Printer, BarChart3
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { BULAN_INDONESIA, JENIS_HONOR } from '../../db/database'
import { formatRupiah } from '../../utils/formatters'

export default function HonorRekap() {
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterBulan, setFilterBulan] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [viewMode, setViewMode] = useState('bulanan') // bulanan, penerima, jenis

  // Fetch data
  const allNominatifs = useLiveQuery(() =>
    db.honorNominatif.toArray()
  ) || []

  const allNominatifItems = useLiveQuery(() =>
    db.honorNominatifItem.toArray()
  ) || []

  const allRecipients = useLiveQuery(() =>
    db.honorRecipient.toArray()
  ) || []

  const allAssignments = useLiveQuery(() =>
    db.honorAssignment.toArray()
  ) || []

  // Options
  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    tahunOptions.push({ value: i.toString(), label: i.toString() })
  }

  const bulanOptions = BULAN_INDONESIA.map(b => ({
    value: b.value.toString(),
    label: b.label
  }))

  const jenisOptions = JENIS_HONOR.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const viewModeOptions = [
    { value: 'bulanan', label: 'Per Bulan' },
    { value: 'penerima', label: 'Per Penerima' },
    { value: 'jenis', label: 'Per Jenis Honor' }
  ]

  function getBulanLabel(bulan) {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  function getJenisLabel(jenisId) {
    return JENIS_HONOR.find(j => j.id === jenisId)?.nama || jenisId
  }

  // Calculate rekap data
  const rekapData = useMemo(() => {
    // Filter nominatifs by year
    let filtered = allNominatifs.filter(n => n.tahun === filterTahun)

    // Filter by bulan if selected
    if (filterBulan) {
      filtered = filtered.filter(n => n.bulan?.toString() === filterBulan)
    }

    // Filter by jenis if selected
    if (filterJenis) {
      filtered = filtered.filter(n => n.jenisHonor === filterJenis)
    }

    const nominatifIds = filtered.map(n => n.id)
    const filteredItems = allNominatifItems.filter(item => nominatifIds.includes(item.nominatifId))

    if (viewMode === 'bulanan') {
      // Group by month
      const byMonth = {}
      filtered.forEach(n => {
        const key = n.bulan || 0
        if (!byMonth[key]) {
          byMonth[key] = {
            bulan: key,
            jumlahNominatif: 0,
            jumlahPenerima: 0,
            totalBruto: 0,
            totalPph: 0,
            totalNetto: 0
          }
        }
        byMonth[key].jumlahNominatif++
        byMonth[key].totalBruto += n.totalBruto || 0
        byMonth[key].totalPph += n.totalPph || 0
        byMonth[key].totalNetto += n.totalNetto || 0
      })

      // Count recipients per month
      Object.keys(byMonth).forEach(bulan => {
        const monthNominatifs = filtered.filter(n => (n.bulan || 0).toString() === bulan)
        const monthNominatifIds = monthNominatifs.map(n => n.id)
        const uniqueRecipients = new Set(
          filteredItems.filter(i => monthNominatifIds.includes(i.nominatifId)).map(i => i.recipientId)
        )
        byMonth[bulan].jumlahPenerima = uniqueRecipients.size
      })

      return Object.values(byMonth).sort((a, b) => a.bulan - b.bulan)
    } else if (viewMode === 'penerima') {
      // Group by recipient
      const byRecipient = {}
      filteredItems.forEach(item => {
        const key = item.recipientId
        if (!byRecipient[key]) {
          const recipient = allRecipients.find(r => r.id === key)
          byRecipient[key] = {
            recipientId: key,
            nama: recipient?.nama || 'Unknown',
            golongan: recipient?.golongan,
            statusPns: recipient?.statusPns,
            jumlahTransaksi: 0,
            totalBruto: 0,
            totalPph: 0,
            totalNetto: 0
          }
        }
        byRecipient[key].jumlahTransaksi++
        byRecipient[key].totalBruto += item.jumlahBruto || 0
        byRecipient[key].totalPph += item.pphDipotong || 0
        byRecipient[key].totalNetto += item.jumlahNetto || 0
      })

      return Object.values(byRecipient).sort((a, b) => b.totalBruto - a.totalBruto)
    } else {
      // Group by jenis honor
      const byJenis = {}
      filtered.forEach(n => {
        const key = n.jenisHonor || 'lainnya'
        if (!byJenis[key]) {
          byJenis[key] = {
            jenisHonor: key,
            jumlahNominatif: 0,
            totalBruto: 0,
            totalPph: 0,
            totalNetto: 0
          }
        }
        byJenis[key].jumlahNominatif++
        byJenis[key].totalBruto += n.totalBruto || 0
        byJenis[key].totalPph += n.totalPph || 0
        byJenis[key].totalNetto += n.totalNetto || 0
      })

      return Object.values(byJenis).sort((a, b) => b.totalBruto - a.totalBruto)
    }
  }, [allNominatifs, allNominatifItems, allRecipients, filterTahun, filterBulan, filterJenis, viewMode])

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return rekapData.reduce((acc, row) => ({
      totalBruto: acc.totalBruto + (row.totalBruto || 0),
      totalPph: acc.totalPph + (row.totalPph || 0),
      totalNetto: acc.totalNetto + (row.totalNetto || 0)
    }), { totalBruto: 0, totalPph: 0, totalNetto: 0 })
  }, [rekapData])

  return (
    <Layout title="Rekap Pembayaran Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Nominatif</p>
            <p className="text-2xl font-bold">
              {allNominatifs.filter(n => n.tahun === filterTahun).length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Bruto</p>
            <p className="text-xl font-bold">{formatRupiah(grandTotals.totalBruto)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total PPh</p>
            <p className="text-xl font-bold">{formatRupiah(grandTotals.totalPph)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Netto</p>
            <p className="text-xl font-bold">{formatRupiah(grandTotals.totalNetto)}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Rekap Pembayaran Honorarium
            </CardTitle>
            <CardDescription>
              Laporan rekapitulasi pembayaran honor tahun {filterTahun}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              options={tahunOptions}
              className="w-full sm:w-28"
            />
            <Select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              options={bulanOptions}
              placeholder="Semua Bulan"
              className="w-full sm:w-36"
            />
            <Select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              options={jenisOptions}
              placeholder="Semua Jenis"
              className="w-full sm:w-40"
            />
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              options={viewModeOptions}
              className="w-full sm:w-36"
            />
            <Button variant="secondary" icon={Printer}>
              Cetak
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {viewMode === 'bulanan' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>No</TableHeader>
                  <TableHeader>Bulan</TableHeader>
                  <TableHeader>Jml Nominatif</TableHeader>
                  <TableHeader>Jml Penerima</TableHeader>
                  <TableHeader className="text-right">Total Bruto</TableHeader>
                  <TableHeader className="text-right">Total PPh</TableHeader>
                  <TableHeader className="text-right">Total Netto</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rekapData.length > 0 ? (
                  <>
                    {rekapData.map((row, index) => (
                      <TableRow key={row.bulan}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {row.bulan ? getBulanLabel(row.bulan) : 'Tidak Ada Bulan'}
                        </TableCell>
                        <TableCell className="text-center">{row.jumlahNominatif}</TableCell>
                        <TableCell className="text-center">{row.jumlahPenerima}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatRupiah(row.totalBruto)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatRupiah(row.totalPph)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {formatRupiah(row.totalNetto)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={4} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(grandTotals.totalBruto)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatRupiah(grandTotals.totalPph)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatRupiah(grandTotals.totalNetto)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableEmpty message="Tidak ada data untuk periode ini" colSpan={7} />
                )}
              </TableBody>
            </Table>
          )}

          {viewMode === 'penerima' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>No</TableHeader>
                  <TableHeader>Nama Penerima</TableHeader>
                  <TableHeader>Golongan</TableHeader>
                  <TableHeader>Tipe</TableHeader>
                  <TableHeader className="text-center">Jml Transaksi</TableHeader>
                  <TableHeader className="text-right">Total Bruto</TableHeader>
                  <TableHeader className="text-right">Total PPh</TableHeader>
                  <TableHeader className="text-right">Total Netto</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rekapData.length > 0 ? (
                  <>
                    {rekapData.map((row, index) => (
                      <TableRow key={row.recipientId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{row.nama}</TableCell>
                        <TableCell>{row.golongan || '-'}</TableCell>
                        <TableCell>
                          {row.statusPns === 'pns' ? (
                            <Badge variant="primary">PNS</Badge>
                          ) : (
                            <Badge variant="warning">Non PNS</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{row.jumlahTransaksi}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatRupiah(row.totalBruto)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatRupiah(row.totalPph)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {formatRupiah(row.totalNetto)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={5} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(grandTotals.totalBruto)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatRupiah(grandTotals.totalPph)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatRupiah(grandTotals.totalNetto)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableEmpty message="Tidak ada data untuk periode ini" colSpan={8} />
                )}
              </TableBody>
            </Table>
          )}

          {viewMode === 'jenis' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>No</TableHeader>
                  <TableHeader>Jenis Honorarium</TableHeader>
                  <TableHeader className="text-center">Jml Nominatif</TableHeader>
                  <TableHeader className="text-right">Total Bruto</TableHeader>
                  <TableHeader className="text-right">Total PPh</TableHeader>
                  <TableHeader className="text-right">Total Netto</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rekapData.length > 0 ? (
                  <>
                    {rekapData.map((row, index) => (
                      <TableRow key={row.jenisHonor}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{getJenisLabel(row.jenisHonor)}</TableCell>
                        <TableCell className="text-center">{row.jumlahNominatif}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatRupiah(row.totalBruto)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatRupiah(row.totalPph)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {formatRupiah(row.totalNetto)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(grandTotals.totalBruto)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatRupiah(grandTotals.totalPph)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatRupiah(grandTotals.totalNetto)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableEmpty message="Tidak ada data untuk periode ini" colSpan={6} />
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}
