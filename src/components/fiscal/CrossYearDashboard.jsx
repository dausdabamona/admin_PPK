/**
 * ============================================================================
 * CROSS-YEAR DASHBOARD - Multi-Year Overview & Analytics
 * ============================================================================
 *
 * Dashboard untuk melihat summary lintas tahun anggaran.
 *
 * Features:
 * - Summary per tahun anggaran
 * - Compliance scores history
 * - Quick access to each year
 * - Statistics & trends
 * - Year comparison
 *
 * Use Case:
 * - Management overview
 * - Multi-year audit readiness tracking
 * - Historical performance analysis
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
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab
} from '@nextui-org/react'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Archive,
  Wrench,
  Award,
  FileText,
  Eye,
  BarChart3,
  Activity
} from 'lucide-react'

import { useFiscalYear } from '../../hooks/useFiscalYear.js'

/**
 * Year Summary Card
 */
const YearSummaryCard = ({ yearData, onViewDetails, onSwitchTo }) => {
  const isActive = yearData.isActive
  const isCurrent = yearData.year === new Date().getFullYear()

  const getStatusConfig = () => {
    if (isActive) {
      return {
        color: 'success',
        icon: Activity,
        label: 'Aktif',
        bgColor: 'from-green-500 to-green-600'
      }
    }

    if (yearData.hasReconstruction) {
      return {
        color: 'warning',
        icon: Wrench,
        label: 'Rekonstruksi',
        bgColor: 'from-orange-500 to-orange-600'
      }
    }

    return {
      color: 'primary',
      icon: Archive,
      label: 'Arsip',
      bgColor: 'from-blue-500 to-blue-600'
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card className={`${isActive ? 'border-2 border-green-500' : ''}`}>
      <CardHeader className="flex-col items-start gap-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${statusConfig.bgColor} text-white`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">TA {yearData.year}</h3>
              {isCurrent && (
                <span className="text-xs text-green-600 font-medium">Tahun Berjalan</span>
              )}
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
      </CardHeader>

      <Divider />

      <CardBody className="gap-3 py-3">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {yearData.totalPackages || 0}
            </div>
            <div className="text-xs text-gray-600">Paket SPJ</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {yearData.avgComplianceScore || 0}%
            </div>
            <div className="text-xs text-gray-600">Avg Score</div>
          </div>
        </div>

        {/* Compliance Progress */}
        <div>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="text-gray-600">Audit Readiness</span>
            <span className="font-medium">{yearData.avgComplianceScore || 0}%</span>
          </div>
          <Progress
            value={yearData.avgComplianceScore || 0}
            color={
              yearData.avgComplianceScore >= 95
                ? 'success'
                : yearData.avgComplianceScore >= 80
                ? 'warning'
                : 'danger'
            }
            size="sm"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Dokumen</span>
            <span className="font-medium">{yearData.totalDocuments || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Rekonstruksi</span>
            <span className="font-medium">{yearData.reconstructedCount || 0}</span>
          </div>
        </div>
      </CardBody>

      <Divider />

      <CardFooter className="gap-2 pt-2">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Eye className="w-3.5 h-3.5" />}
          onPress={() => onViewDetails(yearData)}
          fullWidth
        >
          Lihat Detail
        </Button>
        {!isActive && (
          <Button
            size="sm"
            variant="bordered"
            onPress={() => onSwitchTo(yearData.year)}
            fullWidth
          >
            Switch
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Trend Chart (simplified - placeholder for actual chart library)
 */
const TrendChart = ({ data }) => {
  // In production, use a charting library like recharts, victory, or chart.js
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Compliance Score Trend
        </h3>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">TA {item.year}</span>
              <Progress
                value={item.score}
                color={item.score >= 95 ? 'success' : item.score >= 80 ? 'warning' : 'danger'}
                className="flex-1"
              />
              <span className="text-sm font-bold w-12">{item.score}%</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Statistics Summary
 */
const StatisticsSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardBody className="text-center py-6">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{summary.totalYears || 0}</div>
          <div className="text-sm opacity-90 mt-1">Total Tahun</div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardBody className="text-center py-6">
          <FileText className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{summary.totalPackages || 0}</div>
          <div className="text-sm opacity-90 mt-1">Total Paket SPJ</div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardBody className="text-center py-6">
          <Award className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{summary.avgScore || 0}%</div>
          <div className="text-sm opacity-90 mt-1">Avg Compliance</div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <CardBody className="text-center py-6">
          <Wrench className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{summary.reconstructedTotal || 0}</div>
          <div className="text-sm opacity-90 mt-1">Rekonstruksi</div>
        </CardBody>
      </Card>
    </div>
  )
}

/**
 * MAIN COMPONENT: CrossYearDashboard
 */
const CrossYearDashboard = () => {
  const { activeYear, switchYear } = useFiscalYear()
  const [yearsData, setYearsData] = useState([])
  const [summary, setSummary] = useState({})
  const [trendData, setTrendData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Load cross-year data
  useEffect(() => {
    loadCrossYearData()
  }, [])

  const loadCrossYearData = async () => {
    try {
      setIsLoading(true)

      // TODO: Integrate with actual services
      // const data = await CrossYearService.getSummary()
      // setYearsData(data.years)
      // setSummary(data.summary)
      // setTrendData(data.trend)

      // Mock data for development
      const currentYear = new Date().getFullYear()
      const mockYears = []

      for (let year = currentYear; year >= 2020; year--) {
        mockYears.push({
          year,
          isActive: year === activeYear,
          totalPackages: Math.floor(Math.random() * 50) + 10,
          avgComplianceScore: Math.floor(Math.random() * 20) + 80,
          totalDocuments: Math.floor(Math.random() * 200) + 50,
          reconstructedCount: year < currentYear ? Math.floor(Math.random() * 5) : 0,
          hasReconstruction: year < currentYear && Math.random() > 0.5
        })
      }

      const mockSummary = {
        totalYears: mockYears.length,
        totalPackages: mockYears.reduce((sum, y) => sum + y.totalPackages, 0),
        avgScore: Math.round(
          mockYears.reduce((sum, y) => sum + y.avgComplianceScore, 0) / mockYears.length
        ),
        reconstructedTotal: mockYears.reduce((sum, y) => sum + y.reconstructedCount, 0)
      }

      const mockTrend = mockYears
        .slice(0, 5)
        .reverse()
        .map(y => ({ year: y.year, score: y.avgComplianceScore }))

      setYearsData(mockYears)
      setSummary(mockSummary)
      setTrendData(mockTrend)
      setIsLoading(false)
    } catch (error) {
      console.error('[CrossYearDashboard] Load error:', error)
      setIsLoading(false)
    }
  }

  const handleViewDetails = (yearData) => {
    console.log('[CrossYearDashboard] View details:', yearData.year)
    // Navigate to year-specific view or open modal
  }

  const handleSwitchToYear = async (year) => {
    console.log('[CrossYearDashboard] Switch to:', year)
    await switchYear(year, 'Switch from Cross-Year Dashboard')
    // Reload data after switch
    loadCrossYearData()
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat data lintas tahun...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard Lintas Tahun Anggaran</h1>
              <p className="text-sm text-indigo-100">
                Overview dan analytics semua tahun anggaran
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Statistics Summary */}
      <StatisticsSummary summary={summary} />

      {/* Main Content */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            aria-label="Cross-year tabs"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            fullWidth
            size="lg"
            className="px-4 pt-4"
          >
            <Tab
              key="overview"
              title={
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              }
            >
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearsData.map(yearData => (
                    <YearSummaryCard
                      key={yearData.year}
                      yearData={yearData}
                      onViewDetails={handleViewDetails}
                      onSwitchTo={handleSwitchToYear}
                    />
                  ))}
                </div>
              </div>
            </Tab>

            <Tab
              key="trend"
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trend</span>
                </div>
              }
            >
              <div className="p-4 space-y-4">
                <TrendChart data={trendData} />

                {/* Additional analytics can go here */}
                <Card className="bg-blue-50">
                  <CardBody>
                    <p className="text-sm text-blue-900">
                      <strong>Insight:</strong> Rata-rata compliance score Anda adalah{' '}
                      <strong>{summary.avgScore}%</strong>.
                      {summary.avgScore >= 95 && ' Excellent! Pertahankan kualitas ini.'}
                      {summary.avgScore < 95 && summary.avgScore >= 80 && ' Bagus, tapi masih bisa ditingkatkan.'}
                      {summary.avgScore < 80 && ' Mari fokus pada peningkatan kualitas dokumentasi.'}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="table"
              title={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Tabel</span>
                </div>
              }
            >
              <div className="p-4">
                <Table aria-label="Cross-year table">
                  <TableHeader>
                    <TableColumn>TAHUN</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>PAKET SPJ</TableColumn>
                    <TableColumn>AVG SCORE</TableColumn>
                    <TableColumn>DOKUMEN</TableColumn>
                    <TableColumn>REKONSTRUKSI</TableColumn>
                    <TableColumn>AKSI</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {yearsData.map(yearData => (
                      <TableRow key={yearData.year}>
                        <TableCell>
                          <span className="font-semibold">TA {yearData.year}</span>
                          {yearData.isActive && (
                            <Chip size="sm" color="success" variant="flat" className="ml-2">
                              Aktif
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          {yearData.hasReconstruction ? (
                            <Chip size="sm" color="warning" variant="flat">
                              Rekonstruksi
                            </Chip>
                          ) : (
                            <Chip size="sm" color="primary" variant="flat">
                              Arsip
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>{yearData.totalPackages}</TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              yearData.avgComplianceScore >= 95
                                ? 'text-green-600'
                                : yearData.avgComplianceScore >= 80
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {yearData.avgComplianceScore}%
                          </span>
                        </TableCell>
                        <TableCell>{yearData.totalDocuments}</TableCell>
                        <TableCell>{yearData.reconstructedCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => handleViewDetails(yearData)}
                            >
                              Detail
                            </Button>
                            {!yearData.isActive && (
                              <Button
                                size="sm"
                                variant="bordered"
                                onPress={() => handleSwitchToYear(yearData.year)}
                              >
                                Switch
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  )
}

export default CrossYearDashboard
