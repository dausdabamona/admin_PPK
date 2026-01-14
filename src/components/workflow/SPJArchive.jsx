import React, { useState, useEffect } from 'react'
import {
  Package,
  Calendar,
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Archive,
  FolderOpen
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card'
import { Input } from '../ui/Input'
import { formatRupiah, formatTanggal } from '../../utils/formatters'
import { db } from '../../db/database'

/**
 * SPJArchive - Browser arsip paket SPJ
 *
 * Features:
 * - Browse by year & process type
 * - Search & filter
 * - Download paket lengkap (ZIP)
 * - Preview dokumen
 * - Stats per paket
 */
const SPJArchive = ({
  year,
  processType,
  onOpenPackage,
  onDownloadZip,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear())
  const [selectedType, setSelectedType] = useState(processType || 'all')
  const [sortBy, setSortBy] = useState('updatedAt') // 'updatedAt' | 'createdAt' | 'completionRate'
  const [sortOrder, setSortOrder] = useState('desc')

  // Load packages from database
  const allPackages = useLiveQuery(
    async () => {
      let query = db.spjPackages?.where('year').equals(selectedYear)

      if (selectedType !== 'all') {
        query = query.and(pkg => pkg.processType === selectedType)
      }

      const packages = await query.reverse().sortBy(sortBy)
      return sortOrder === 'desc' ? packages.reverse() : packages
    },
    [selectedYear, selectedType, sortBy, sortOrder]
  )

  // Filter by search query
  const filteredPackages = allPackages?.filter(pkg => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      pkg.title?.toLowerCase().includes(query) ||
      pkg.packageCode?.toLowerCase().includes(query) ||
      pkg.data?.kegiatan?.nama?.toLowerCase().includes(query) ||
      pkg.data?.kontrak?.nomor?.toLowerCase().includes(query) ||
      pkg.data?.penyedia?.nama?.toLowerCase().includes(query)
    )
  })

  // Get available years
  const availableYears = useLiveQuery(
    async () => {
      const years = await db.spjPackages?.orderBy('year').uniqueKeys()
      return years || []
    },
    []
  )

  const processTypes = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'up-tup', label: 'UP / TUP' },
    { value: 'ls-kontrak', label: 'LS Kontrak' },
    { value: 'swakelola', label: 'Swakelola' },
    { value: 'perjadin', label: 'Perjalanan Dinas' },
    { value: 'pjlp', label: 'Honor / PJLP' }
  ]

  const handleDownloadZip = async (pkg) => {
    if (onDownloadZip) {
      try {
        await onDownloadZip(pkg)
      } catch (error) {
        console.error('Download failed:', error)
        alert('Gagal mengunduh paket: ' + error.message)
      }
    }
  }

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Hapus paket "${pkg.title}"?\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    if (onDelete) {
      try {
        await onDelete(pkg)
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Gagal menghapus paket: ' + error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'gray'
      case 'in-progress': return 'yellow'
      case 'completed': return 'green'
      case 'archived': return 'blue'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'in-progress': return 'Dalam Progress'
      case 'completed': return 'Selesai'
      case 'archived': return 'Terarsip'
      default: return status
    }
  }

  const getProcessTypeLabel = (type) => {
    const found = processTypes.find(pt => pt.value === type)
    return found?.label || type
  }

  const renderPackageCard = (pkg) => {
    const completionRate = pkg.checklist?.completionRate || 0
    const isComplete = completionRate >= 80

    return (
      <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 truncate">
                  {pkg.title || pkg.packageCode}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge color={getStatusColor(pkg.status)} size="sm">
                  {getStatusLabel(pkg.status)}
                </Badge>
                <Badge color="blue" size="sm">
                  {getProcessTypeLabel(pkg.processType)}
                </Badge>
                {isComplete && (
                  <Badge color="green" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Lengkap
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {pkg.packageCode}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
            <div>
              <div className="text-xs text-gray-500 mb-1">Kelengkapan</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      completionRate >= 80 ? 'bg-green-500' :
                      completionRate >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {completionRate}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Dokumen</div>
              <div className="text-sm font-medium text-gray-900">
                {pkg.checklist?.items?.filter(i => i.status === 'completed').length || 0}
                {' / '}
                {pkg.checklist?.items?.length || 0}
              </div>
            </div>
          </div>

          {/* Summary Info */}
          {pkg.data && (
            <div className="space-y-2 mb-4 text-sm">
              {pkg.data.kegiatan?.nama && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Kegiatan:</span>
                  <span className="text-gray-900 font-medium truncate">
                    {pkg.data.kegiatan.nama}
                  </span>
                </div>
              )}
              {pkg.data.kontrak?.nomor && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Kontrak:</span>
                  <span className="text-gray-900 truncate">{pkg.data.kontrak.nomor}</span>
                </div>
              )}
              {pkg.data.penyedia?.nama && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Penyedia:</span>
                  <span className="text-gray-900 truncate">{pkg.data.penyedia.nama}</span>
                </div>
              )}
              {pkg.data.kontrak?.nilai && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Nilai:</span>
                  <span className="text-gray-900 font-semibold">
                    {formatRupiah(pkg.data.kontrak.nilai)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatTanggal(pkg.createdAt, 'short')}</span>
            </div>
            {pkg.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{formatTanggal(pkg.completedAt, 'short')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onOpenPackage && onOpenPackage(pkg)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Lihat Detail
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownloadZip(pkg)}
              title="Download paket lengkap (ZIP)"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDelete(pkg)}
              title="Hapus paket"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Arsip SPJ
            </CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Cari paket, kegiatan, kontrak, penyedia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears?.map(y => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>
            </div>

            {/* Process Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {processTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {filteredPackages && filteredPackages.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Menampilkan {filteredPackages.length} paket
            </span>
            <div className="flex items-center gap-2">
              <span>Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="updatedAt">Terakhir Diubah</option>
                <option value="createdAt">Tanggal Dibuat</option>
                <option value="completionRate">Kelengkapan</option>
              </select>
              <button
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map(renderPackageCard)}
          </div>
        </>
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada paket SPJ
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Tidak ditemukan paket yang sesuai dengan pencarian'
                  : 'Belum ada paket SPJ yang terarsip'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Reset Pencarian
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default SPJArchive
