/**
 * ============================================================================
 * PROCESS SELECTOR - Process Type Selection
 * ============================================================================
 *
 * Landing page untuk memilih jenis proses pembayaran.
 * Transformasi dari "pilih dokumen" → "pilih proses yang sedang dikerjakan"
 *
 * Features:
 * - 6 process types: LS Kontrak, UP, TUP, Swakelola, Perjadin, Honorarium
 * - Show: icon, description, steps count, estimated time, complexity
 * - Click → initialize workflow → go to wizard
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
  Divider,
  Input
} from '@nextui-org/react'
import {
  FileText,
  Wallet,
  PlusCircle,
  Briefcase,
  Plane,
  Users,
  ArrowRight,
  Clock,
  BarChart3,
  Search,
  Info
} from 'lucide-react'

/**
 * Process configuration dengan metadata visual
 */
const PROCESS_TYPES = [
  {
    id: 'LS_KONTRAK',
    name: 'LS Kontrak',
    description: 'Pembayaran langsung kepada penyedia barang/jasa berdasarkan kontrak',
    icon: FileText,
    color: 'from-blue-500 to-blue-600',
    complexity: 'High',
    complexityColor: 'danger',
    estimatedTime: '2-3 jam',
    stepsCount: 10,
    category: 'Belanja Barang/Jasa',
    tags: ['Kontrak', 'Penyedia', 'BAP', 'BAST'],
    useCases: [
      'Pengadaan barang',
      'Jasa konsultansi',
      'Pekerjaan konstruksi',
      'Jasa lainnya'
    ]
  },
  {
    id: 'UP',
    name: 'Uang Persediaan (UP)',
    description: 'Permintaan Uang Persediaan untuk keperluan operasional satker',
    icon: Wallet,
    color: 'from-green-500 to-green-600',
    complexity: 'Low',
    complexityColor: 'success',
    estimatedTime: '30-45 menit',
    stepsCount: 4,
    category: 'Belanja Operasional',
    tags: ['UP', 'Operasional', 'Rutin'],
    useCases: [
      'Keperluan ATK',
      'Biaya operasional kantor',
      'Belanja rutin bulanan'
    ]
  },
  {
    id: 'TUP',
    name: 'Tambahan UP (TUP)',
    description: 'Tambahan Uang Persediaan untuk menutup kekurangan UP yang ada',
    icon: PlusCircle,
    color: 'from-emerald-500 to-emerald-600',
    complexity: 'Low',
    complexityColor: 'success',
    estimatedTime: '45 menit - 1 jam',
    stepsCount: 5,
    category: 'Belanja Operasional',
    tags: ['TUP', 'Tambahan', 'UP'],
    useCases: [
      'Tambahan kebutuhan operasional',
      'Kekurangan UP'
    ]
  },
  {
    id: 'SWAKELOLA',
    name: 'Swakelola',
    description: 'Kegiatan yang dilaksanakan secara swakelola (dikerjakan sendiri)',
    icon: Briefcase,
    color: 'from-purple-500 to-purple-600',
    complexity: 'Medium',
    complexityColor: 'warning',
    estimatedTime: '1.5-2 jam',
    stepsCount: 9,
    category: 'Belanja Kegiatan',
    tags: ['Swakelola', 'Internal', 'Workshop'],
    useCases: [
      'Workshop/Pelatihan',
      'Sosialisasi',
      'Kegiatan internal',
      'Rapat koordinasi'
    ]
  },
  {
    id: 'PERJADIN',
    name: 'Perjalanan Dinas',
    description: 'Pembayaran biaya perjalanan dinas dalam/luar negeri',
    icon: Plane,
    color: 'from-orange-500 to-orange-600',
    complexity: 'Medium',
    complexityColor: 'warning',
    estimatedTime: '1-1.5 jam',
    stepsCount: 9,
    category: 'Belanja Perjalanan Dinas',
    tags: ['Perjadin', 'Travel', 'SPPD'],
    useCases: [
      'Perjalanan dinas dalam negeri',
      'Perjalanan dinas luar negeri',
      'Kunjungan kerja'
    ]
  },
  {
    id: 'HONORARIUM',
    name: 'Honorarium / PJLP',
    description: 'Pembayaran honorarium atau Pegawai Tidak Tetap/PJLP',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    complexity: 'Medium',
    complexityColor: 'warning',
    estimatedTime: '1-1.5 jam',
    stepsCount: 8,
    category: 'Belanja Pegawai',
    tags: ['Honor', 'PJLP', 'Tenaga Ahli'],
    useCases: [
      'Honor narasumber',
      'Honor tim kegiatan',
      'PJLP bulanan',
      'Tenaga ahli'
    ]
  }
]

/**
 * Process Card Component
 */
const ProcessCard = ({ process, onSelect }) => {
  const Icon = process.icon

  return (
    <Card
      isPressable
      onPress={() => onSelect(process)}
      className="transition-all hover:scale-105 hover:shadow-xl"
    >
      <CardHeader className="flex-col items-start gap-2 pb-0">
        {/* Icon & Title */}
        <div className="flex items-center justify-between w-full">
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${process.color} text-white`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <Chip
            size="sm"
            color={process.complexityColor}
            variant="flat"
          >
            {process.complexity}
          </Chip>
        </div>

        <div className="w-full">
          <h3 className="text-xl font-bold">{process.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{process.category}</p>
        </div>
      </CardHeader>

      <CardBody className="gap-3 py-4">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {process.description}
        </p>

        <Divider />

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <BarChart3 className="w-4 h-4" />
            <span>{process.stepsCount} langkah</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{process.estimatedTime}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {process.tags.slice(0, 3).map((tag, i) => (
            <Chip key={i} size="sm" variant="flat" className="text-xs">
              {tag}
            </Chip>
          ))}
        </div>
      </CardBody>

      <CardFooter className="pt-0">
        <Button
          color="primary"
          variant="flat"
          fullWidth
          endContent={<ArrowRight className="w-4 h-4" />}
          onPress={() => onSelect(process)}
        >
          Pilih Proses Ini
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Process Detail Modal/Drawer (Optional - for more info before selecting)
 */
const ProcessInfoCard = ({ process }) => {
  if (!process) return null

  return (
    <Card className="mb-6">
      <CardBody className="gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-4 rounded-xl bg-gradient-to-br ${process.color} text-white flex-shrink-0`}
          >
            <process.icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{process.name}</h3>
            <p className="text-sm text-gray-600">{process.description}</p>
          </div>
        </div>

        <Divider />

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Cocok untuk:
          </h4>
          <ul className="space-y-1">
            {process.useCases.map((useCase, i) => (
              <li key={i} className="text-sm text-gray-700 list-disc ml-5">
                {useCase}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * MAIN COMPONENT: Process Selector
 */
const ProcessSelector = ({ onProcessSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProcesses, setFilteredProcesses] = useState(PROCESS_TYPES)
  const [selectedProcess, setSelectedProcess] = useState(null)

  // Filter processes based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProcesses(PROCESS_TYPES)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = PROCESS_TYPES.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query)) ||
        p.useCases.some(uc => uc.toLowerCase().includes(query))
    )

    setFilteredProcesses(filtered)
  }, [searchQuery])

  const handleProcessSelect = (process) => {
    setSelectedProcess(process)
    if (onProcessSelect) {
      onProcessSelect(process.id)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Pilih Jenis Proses
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Sistem akan memandu Anda langkah demi langkah sesuai dengan jenis proses yang Anda pilih
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto">
        <Input
          placeholder="Cari proses (contoh: kontrak, honor, perjalanan)..."
          startContent={<Search className="w-4 h-4 text-gray-400" />}
          size="lg"
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full"
        />
      </div>

      {/* Selected Process Info (if any) */}
      {selectedProcess && (
        <ProcessInfoCard process={selectedProcess} />
      )}

      {/* Process Cards Grid */}
      {filteredProcesses.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">
              Tidak ada proses yang cocok dengan pencarian "{searchQuery}"
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map(process => (
            <ProcessCard
              key={process.id}
              process={process}
              onSelect={handleProcessSelect}
            />
          ))}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none mt-8">
        <CardBody className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Tidak yakin pilih yang mana?</h3>
          <p className="text-gray-700 mb-4">
            Tidak masalah! Setelah memilih, sistem akan memandu Anda step by step.
            Anda akan tahu persis apa yang perlu dilakukan dan kapan pekerjaan Anda siap audit.
          </p>
          <p className="text-sm text-gray-600 italic">
            💡 Tip: Pilih sesuai dengan jenis pembayaran yang sedang Anda proses saat ini
          </p>
        </CardBody>
      </Card>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardBody className="text-center py-4">
            <div className="text-3xl font-bold text-blue-500">6</div>
            <div className="text-xs text-gray-500 mt-1">Jenis Proses</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <div className="text-3xl font-bold text-green-500">
              {PROCESS_TYPES.reduce((sum, p) => sum + p.stepsCount, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Langkah</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <div className="text-3xl font-bold text-purple-500">100%</div>
            <div className="text-xs text-gray-500 mt-1">Compliance</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <div className="text-3xl font-bold text-orange-500">Auto</div>
            <div className="text-xs text-gray-500 mt-1">Generate Docs</div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ProcessSelector
