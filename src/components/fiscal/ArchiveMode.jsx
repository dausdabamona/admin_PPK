/**
 * ============================================================================
 * ARCHIVE MODE - Read-Only View for Historical Fiscal Years
 * ============================================================================
 *
 * Komponen untuk viewing arsip SPJ tahun anggaran lampau.
 *
 * Features:
 * - Read-only mode (no modifications)
 * - Display final SPJ packages
 * - Show audit readiness scores
 * - Download documents
 * - View compliance reports
 * - Show reconstruction history (if any)
 *
 * Use Case:
 * - Lihat SPJ yang sudah final
 * - Download dokumen untuk keperluan audit
 * - Review compliance score historical
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
  Tooltip,
  Badge
} from '@nextui-org/react'
import {
  Archive,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  History,
  Lock,
  Eye,
  Folder,
  Award,
  Calendar
} from 'lucide-react'

import { useFiscalYear } from '../../hooks/useFiscalYear.js'

/**
 * Archive Package Card - Single SPJ Package Display
 */
const ArchivePackageCard = ({ package: pkg, onDownload, onViewDetails }) => {
  const isReconstructed = pkg.isReconstruction || false
  const complianceScore = pkg.complianceScore || 0
  const status = pkg.status || 'UNKNOWN'

  const getStatusConfig = (status) => {
    switch (status) {
      case 'FINAL':
        return {
          color: 'success',
          icon: CheckCircle2,
          label: 'Final'
        }
      case 'RECONSTRUCTED':
        return {
          color: 'warning',
          icon: History,
          label: 'Rekonstruksi'
        }
      default:
        return {
          color: 'default',
          icon: Archive,
          label: status
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{pkg.masterDataId}</h3>
              <p className="text-xs text-gray-500">{pkg.kegiatanNama}</p>
            </div>
          </div>
          <Chip
            color={statusConfig.color}
            variant="flat"
            size="sm"
            startContent={<StatusIcon className="w-3.5 h-3.5" />}
          >
            {statusConfig.label}
          </Chip>
        </div>

        {isReconstructed && (
          <div className="w-full">
            <Chip
              color="warning"
              variant="bordered"
              size="sm"
              startContent={<History className="w-3 h-3" />}
              className="w-full justify-start"
            >
              Rekonstruksi: {new Date(pkg.reconstructionDate).toLocaleDateString('id-ID')}
            </Chip>
          </div>
        )}
      </CardHeader>

      <Divider />

      <CardBody className="gap-3 py-3">
        {/* Compliance Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Audit Readiness</span>
            <span className="text-sm font-bold text-green-600">
              {complianceScore}%
            </span>
          </div>
          <Progress
            value={complianceScore}
            color={complianceScore >= 95 ? 'success' : complianceScore >= 80 ? 'warning' : 'danger'}
            size="sm"
            className="w-full"
          />
        </div>

        {/* Document Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Dokumen SPJ</span>
          <span className="font-medium">{pkg.documentCount || 0} file</span>
        </div>

        {/* Package Date */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tanggal Paket</span>
          <span className="font-medium">
            {new Date(pkg.packageDate).toLocaleDateString('id-ID')}
          </span>
        </div>

        {/* File Size */}
        {pkg.packageSize && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Ukuran Paket</span>
            <span className="font-medium">{formatFileSize(pkg.packageSize)}</span>
          </div>
        )}
      </CardBody>

      <Divider />

      <CardFooter className="gap-2 pt-2">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Eye className="w-4 h-4" />}
          onPress={() => onViewDetails(pkg)}
          fullWidth
        >
          Lihat Detail
        </Button>
        <Button
          size="sm"
          variant="flat"
          color="success"
          startContent={<Download className="w-4 h-4" />}
          onPress={() => onDownload(pkg)}
          fullWidth
        >
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Archive Summary Panel
 */
const ArchiveSummary = ({ summary }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {summary.totalPackages || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Paket SPJ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {summary.avgComplianceScore || 0}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Rata-rata Skor</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {summary.totalDocuments || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Dokumen</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {summary.reconstructedCount || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Rekonstruksi</div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * MAIN COMPONENT: ArchiveMode
 */
const ArchiveMode = () => {
  const { activeYear, isArchive } = useFiscalYear()
  const [packages, setPackages] = useState([])
  const [summary, setSummary] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')

  // Load archive data
  useEffect(() => {
    if (isArchive) {
      loadArchiveData()
    }
  }, [activeYear, isArchive])

  const loadArchiveData = async () => {
    try {
      setIsLoading(true)

      // TODO: Integrate with actual service
      // const data = await ArchiveService.getPackages(activeYear)
      // setPackages(data.packages)
      // setSummary(data.summary)

      // Mock data for development
      const mockPackages = [
        {
          packageId: 'PKG-2023-001',
          masterDataId: 'MDK-2023-001',
          kegiatanNama: 'Pengadaan Laptop 2023',
          status: 'FINAL',
          complianceScore: 98,
          documentCount: 12,
          packageDate: '2023-12-15',
          packageSize: 15728640, // 15 MB
          isReconstruction: false
        },
        {
          packageId: 'PKG-2023-002',
          masterDataId: 'MDK-2023-002',
          kegiatanNama: 'Workshop SAKTI',
          status: 'RECONSTRUCTED',
          complianceScore: 95,
          documentCount: 10,
          packageDate: '2023-11-20',
          packageSize: 12582912, // 12 MB
          isReconstruction: true,
          reconstructionDate: '2024-01-10'
        }
      ]

      const mockSummary = {
        totalPackages: mockPackages.length,
        avgComplianceScore: 96.5,
        totalDocuments: 22,
        reconstructedCount: 1
      }

      setPackages(mockPackages)
      setSummary(mockSummary)
      setIsLoading(false)
    } catch (error) {
      console.error('[ArchiveMode] Load error:', error)
      setIsLoading(false)
    }
  }

  const handleDownload = (pkg) => {
    console.log('[ArchiveMode] Download package:', pkg.packageId)
    // TODO: Implement actual download
    alert(`Download paket: ${pkg.packageId}\nFilename: SPJ_${pkg.masterDataId}_TA${activeYear}.zip`)
  }

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg)
    setActiveTab('details')
  }

  // Not in archive mode
  if (!isArchive) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Mode Arsip hanya tersedia untuk tahun anggaran lampau.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Silakan switch ke tahun anggaran sebelumnya untuk mengakses arsip.
          </p>
        </CardBody>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat arsip TA {activeYear}...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Archive className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Arsip Tahun Anggaran {activeYear}</h1>
              <p className="text-sm text-blue-100">
                Mode read-only - Lihat dan download SPJ final
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Read Only</span>
          </div>
        </CardBody>
      </Card>

      {/* Summary */}
      <ArchiveSummary summary={summary} />

      {/* Main Content */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            aria-label="Archive tabs"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            fullWidth
            size="lg"
            className="px-4 pt-4"
          >
            <Tab
              key="packages"
              title={
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>Paket SPJ</span>
                  <Chip size="sm" variant="flat">{packages.length}</Chip>
                </div>
              }
            >
              <div className="p-4">
                {packages.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Tidak ada paket SPJ untuk TA {activeYear}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <ArchivePackageCard
                        key={pkg.packageId}
                        package={pkg}
                        onDownload={handleDownload}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="details"
              title={
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Detail</span>
                </div>
              }
            >
              <div className="p-4">
                {selectedPackage ? (
                  <PackageDetails package={selectedPackage} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Pilih paket SPJ untuk melihat detail
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Info Footer */}
      <Card className="bg-yellow-50 border-yellow-200 border">
        <CardBody className="flex flex-row items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-900">Mode Arsip - Read Only</p>
            <p className="text-sm text-yellow-700 mt-1">
              Data tahun {activeYear} tidak dapat dimodifikasi. Jika perlu melengkapi
              atau memperbaiki dokumen, gunakan <strong>Mode Rekonstruksi</strong>.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/**
 * Package Details View
 */
const PackageDetails = ({ package: pkg }) => {
  return (
    <div className="space-y-6">
      {/* Package Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Informasi Paket</h3>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          <InfoRow label="Package ID" value={pkg.packageId} />
          <InfoRow label="Master Data ID" value={pkg.masterDataId} />
          <InfoRow label="Nama Kegiatan" value={pkg.kegiatanNama} />
          <InfoRow label="Status" value={pkg.status} />
          <InfoRow label="Tanggal Paket" value={new Date(pkg.packageDate).toLocaleDateString('id-ID')} />
          {pkg.isReconstruction && (
            <InfoRow
              label="Tanggal Rekonstruksi"
              value={new Date(pkg.reconstructionDate).toLocaleDateString('id-ID')}
              highlight
            />
          )}
        </CardBody>
      </Card>

      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5" />
            Audit Readiness Score
          </h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {pkg.complianceScore}%
            </div>
            <Progress
              value={pkg.complianceScore}
              color="success"
              size="lg"
              className="max-w-md mx-auto"
            />
            <p className="text-sm text-gray-600 mt-4">
              Skor audit readiness final untuk paket ini
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen SPJ ({pkg.documentCount})
          </h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <p className="text-sm text-gray-600 text-center py-4">
            Daftar dokumen akan ditampilkan di sini
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

/**
 * Helper Components
 */
const InfoRow = ({ label, value, highlight = false }) => (
  <div className={`flex items-center justify-between ${highlight ? 'bg-yellow-50 p-2 rounded' : ''}`}>
    <span className="text-sm text-gray-600">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-orange-600' : ''}`}>
      {value}
    </span>
  </div>
)

/**
 * Helper Functions
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default ArchiveMode
