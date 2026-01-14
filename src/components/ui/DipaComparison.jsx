import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  TrendingUp, TrendingDown, Plus, Minus, Edit3,
  Search, Filter, Download, AlertCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Card, CardHeader, CardBody, CardTitle } from './Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from './Table'
import Button from './Button'
import DipaRevisionService from '../../services/DipaRevisionService'
import { db } from '../../db/database'

/**
 * DipaComparison - Comprehensive comparison view for two DIPA revisions
 *
 * Features:
 * - Side-by-side revision comparison
 * - Change type filtering (ADDED, REMOVED, CHANGED)
 * - Search functionality
 * - Statistics summary
 * - Export comparison to Excel
 *
 * Usage:
 * <DipaComparison
 *   year={2024}
 *   revisionA={0}
 *   revisionB={1}
 *   onClose={() => setShowComparison(false)}
 * />
 */
export default function DipaComparison({
  year,
  revisionA,
  revisionB,
  onClose,
  className = ''
}) {
  const [loading, setLoading] = useState(false)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [changeTypeFilter, setChangeTypeFilter] = useState('all') // 'all', 'ADDED', 'REMOVED', 'CHANGED'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch revision metadata
  const revisionAData = useLiveQuery(
    () => db.dipaRevisions
      .where('[tahun+revisi]')
      .equals([year, revisionA])
      .first(),
    [year, revisionA]
  )

  const revisionBData = useLiveQuery(
    () => db.dipaRevisions
      .where('[tahun+revisi]')
      .equals([year, revisionB])
      .first(),
    [year, revisionB]
  )

  // Perform comparison on mount
  useEffect(() => {
    performComparison()
  }, [year, revisionA, revisionB])

  const performComparison = async () => {
    setLoading(true)
    try {
      const result = await DipaRevisionService.compareRevisions(
        year,
        revisionA,
        revisionB
      )
      setComparisonResult(result)
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setLoading(false)
    }
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

  // Filter changes
  const filteredChanges = comparisonResult?.changes.filter(change => {
    const matchesSearch =
      change.kode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.uraian?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = changeTypeFilter === 'all' || change.type === changeTypeFilter

    return matchesSearch && matchesType
  }) || []

  // Pagination
  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage)
  const paginatedChanges = filteredChanges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Export to Excel
  const handleExport = () => {
    if (!comparisonResult || filteredChanges.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const exportData = filteredChanges.map(change => ({
      'Tipe Perubahan': change.type,
      'Kode': change.kode,
      'Uraian': change.uraian,
      'Level': change.level,
      'Pagu Lama': change.paguLama || 0,
      'Pagu Baru': change.paguBaru || 0,
      'Selisih': change.selisih
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison')

    const fileName = `DIPA_Comparison_${year}_Rev${revisionA}_vs_Rev${revisionB}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Membandingkan revisi...</p>
        </div>
      </div>
    )
  }

  if (!comparisonResult || !comparisonResult.success) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Gagal melakukan perbandingan</p>
          {comparisonResult?.error && (
            <p className="text-sm text-red-500 mt-2">{comparisonResult.error}</p>
          )}
        </div>
      </div>
    )
  }

  const { summary } = comparisonResult

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle>Perbandingan DIPA {year}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {revisionAData ? (
                revisionA === 0 ? 'DIPA Awal' : `Revisi ${revisionA}`
              ) : `Rev ${revisionA}`}
              {' vs '}
              {revisionBData ? (
                revisionB === 0 ? 'DIPA Awal' : `Revisi ${revisionB}`
              ) : `Rev ${revisionB}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={Download}
              size="sm"
              disabled={filteredChanges.length === 0}
            >
              Export
            </Button>
            {onClose && (
              <Button
                variant="secondary"
                onClick={onClose}
                size="sm"
              >
                Tutup
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Added */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ditambahkan</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{summary.added}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Removed */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dihapus</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{summary.removed}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Minus className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Changed */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Berubah</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{summary.changed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Net Change */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Change</p>
                <p className={`text-xl font-bold mt-1 ${
                  summary.netChange > 0 ? 'text-green-600' :
                  summary.netChange < 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {summary.netChange > 0 ? '+' : ''}{formatRupiah(summary.netChange)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                summary.netChange > 0 ? 'bg-green-100' :
                summary.netChange < 0 ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                {summary.netChange > 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : summary.netChange < 0 ? (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                ) : (
                  <Edit3 className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Changes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Perubahan</CardTitle>
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

            {/* Change type filter */}
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={changeTypeFilter}
                onChange={(e) => {
                  setChangeTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full"
              >
                <option value="all">Semua Perubahan</option>
                <option value="ADDED">Ditambahkan</option>
                <option value="REMOVED">Dihapus</option>
                <option value="CHANGED">Berubah</option>
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
                  <TableHeader>Tipe</TableHeader>
                  <TableHeader>Kode</TableHeader>
                  <TableHeader>Uraian</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader className="text-right">Pagu Lama</TableHeader>
                  <TableHeader className="text-right">Pagu Baru</TableHeader>
                  <TableHeader className="text-right">Selisih</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedChanges.length > 0 ? (
                  paginatedChanges.map((change, index) => (
                    <TableRow key={`${change.kode}-${index}`}>
                      <TableCell className="text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          change.type === 'ADDED' ? 'bg-green-100 text-green-700' :
                          change.type === 'REMOVED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {change.type === 'ADDED' ? (
                            <span className="flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Ditambah
                            </span>
                          ) : change.type === 'REMOVED' ? (
                            <span className="flex items-center gap-1">
                              <Minus className="w-3 h-3" /> Dihapus
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Edit3 className="w-3 h-3" /> Berubah
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {change.kode}
                      </TableCell>
                      <TableCell className="font-medium max-w-md">
                        {change.uraian}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          {change.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {change.paguLama ? formatRupiah(change.paguLama) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {change.paguBaru ? formatRupiah(change.paguBaru) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-medium ${
                        change.selisih > 0 ? 'text-green-600' :
                        change.selisih < 0 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {change.selisih > 0 ? '+' : ''}{formatRupiah(change.selisih)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty
                    message={
                      comparisonResult.changes.length === 0
                        ? 'Tidak ada perubahan antara kedua revisi'
                        : 'Tidak ada perubahan yang sesuai filter'
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
              totalItems={filteredChanges.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

/**
 * DipaComparisonSummary - Compact summary component for comparison
 *
 * Usage in modals or dashboards:
 * <DipaComparisonSummary
 *   year={2024}
 *   revisionA={0}
 *   revisionB={1}
 * />
 */
export function DipaComparisonSummary({
  year,
  revisionA,
  revisionB,
  className = ''
}) {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const fetchComparison = async () => {
      const result = await DipaRevisionService.compareRevisions(
        year,
        revisionA,
        revisionB
      )
      if (result.success) {
        setSummary(result.summary)
      }
    }
    fetchComparison()
  }, [year, revisionA, revisionB])

  if (!summary) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-20 ${className}`}></div>
    )
  }

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600">{summary.added}</p>
          <p className="text-xs text-gray-600 mt-1">Ditambah</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{summary.removed}</p>
          <p className="text-xs text-gray-600 mt-1">Dihapus</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{summary.changed}</p>
          <p className="text-xs text-gray-600 mt-1">Berubah</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${
            summary.netChange > 0 ? 'text-green-600' :
            summary.netChange < 0 ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {summary.netChange > 0 ? '+' : ''}{formatRupiah(summary.netChange)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Net Change</p>
        </div>
      </div>
    </div>
  )
}
