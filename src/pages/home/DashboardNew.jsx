import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  DollarSign,
  FileText,
  Building2,
  Plane,
  Users,
  Archive,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Card, CardBody } from '../../components/ui/Card'
import { db } from '../../db/database'

/**
 * Dashboard Baru - Asisten Digital PPK
 * Workflow-oriented dengan process cards
 */
const DashboardNew = () => {
  const navigate = useNavigate()

  // Load statistics
  const packages = useLiveQuery(() => db.spjPackages?.toArray()) || []
  const currentYear = new Date().getFullYear()
  const thisYearPackages = packages.filter(p => p.year === currentYear)

  const stats = {
    total: thisYearPackages.length,
    draft: thisYearPackages.filter(p => p.status === 'draft').length,
    inProgress: thisYearPackages.filter(p => p.status === 'in-progress').length,
    completed: thisYearPackages.filter(p => p.status === 'completed' || p.status === 'archived').length
  }

  const processes = [
    {
      id: 'up-tup',
      title: 'UP / TUP',
      description: 'Uang Persediaan & Tambahan Uang Persediaan',
      icon: DollarSign,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100',
      path: '/proses/up-tup',
      count: 0, // TODO: Count dari DB
      status: 'coming-soon'
    },
    {
      id: 'ls-kontrak',
      title: 'LS Kontrak',
      description: 'Pembayaran Langsung untuk Kontrak Pengadaan',
      icon: FileText,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      path: '/proses/ls-kontrak',
      count: thisYearPackages.filter(p => p.processType === 'ls-kontrak').length,
      status: 'active',
      features: ['Auto-generate 5+ dokumen', 'Single input', 'Non-blocking']
    },
    {
      id: 'swakelola',
      title: 'Swakelola',
      description: 'Belanja Swakelola dan Pertanggungjawaban',
      icon: Building2,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-100',
      path: '/proses/swakelola',
      count: 0,
      status: 'coming-soon'
    },
    {
      id: 'perjadin',
      title: 'Perjalanan Dinas',
      description: 'SPJ Perjalanan Dinas dan Pembayaran',
      icon: Plane,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-100',
      path: '/proses/perjalanan-dinas',
      count: 0,
      status: 'coming-soon'
    },
    {
      id: 'honor-pjlp',
      title: 'Honor / PJLP',
      description: 'Honorarium dan Pegawai Tidak Tetap',
      icon: Users,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      hoverBg: 'hover:bg-pink-100',
      path: '/proses/honor-pjlp',
      count: 0,
      status: 'coming-soon'
    }
  ]

  const handleProcessClick = (process) => {
    if (process.status === 'coming-soon') {
      alert('Fitur ini akan segera hadir! 🚀\n\nUntuk saat ini, silakan gunakan menu lama dari sidebar.')
      return
    }
    navigate(process.path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang di Asisten Digital PPK
          </h1>
          <p className="text-gray-600 text-lg">
            Pilih jenis pekerjaan yang akan Anda lakukan hari ini
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Paket SPJ</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Tahun {currentYear}</div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Dalam Progress</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.draft + stats.inProgress}</div>
                  <div className="text-xs text-gray-500 mt-1">Butuh diselesaikan</div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Selesai</div>
                  <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-gray-500 mt-1">Terarsip</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Target: 95%</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Process Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Jenis Pekerjaan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map(process => {
              const IconComponent = process.icon

              return (
                <Card
                  key={process.id}
                  className={`relative overflow-hidden transition-all duration-200 cursor-pointer border-2 ${process.borderColor} ${process.hoverBg} hover:shadow-xl`}
                  onClick={() => handleProcessClick(process)}
                >
                  <CardBody className="p-6">
                    {/* Status Badge */}
                    {process.status === 'coming-soon' && (
                      <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Segera Hadir
                        </span>
                      </div>
                    )}

                    {process.status === 'active' && (
                      <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✓ Aktif
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-16 h-16 ${process.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-8 h-8 ${process.iconColor}`} />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {process.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {process.description}
                    </p>

                    {/* Features (if active) */}
                    {process.features && (
                      <div className="mb-4 space-y-1">
                        {process.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Count & Action */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {process.count > 0 ? (
                        <div className="text-sm text-gray-600">
                          {process.count} paket tahun ini
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          {process.status === 'active' ? 'Mulai buat paket baru' : 'Belum tersedia'}
                        </div>
                      )}

                      <ChevronRight className={`w-5 h-5 ${process.iconColor}`} />
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Akses Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/arsip')}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Archive className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Arsip SPJ</div>
                <div className="text-xs text-gray-600">Lihat semua paket SPJ</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/master/pegawai')}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <Users className="w-6 h-6 text-gray-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Master Data</div>
                <div className="text-xs text-gray-600">Kelola data pegawai, pejabat</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <svg className="w-6 h-6 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Pengaturan</div>
                <div className="text-xs text-gray-600">Konfigurasi sistem</div>
              </div>
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tips Menggunakan Asisten Digital PPK</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <strong>Single Source of Truth:</strong> Input data sekali, otomatis terisi ke semua dokumen</li>
                <li>• <strong>Non-blocking:</strong> Anda tetap bisa lanjut walau ada dokumen yang belum lengkap</li>
                <li>• <strong>Auto-save:</strong> Data tersimpan otomatis setiap 10 detik</li>
                <li>• <strong>Arsip Lengkap:</strong> Semua dokumen dalam 1 paket, download sebagai ZIP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardNew
