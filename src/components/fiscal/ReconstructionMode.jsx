/**
 * ============================================================================
 * RECONSTRUCTION MODE - Administrative Reconstruction for Historical Years
 * ============================================================================
 *
 * Komponen untuk rekonstruksi administrasi tahun anggaran lampau.
 *
 * Features:
 * - Complete incomplete master data
 * - Regenerate missing documents
 * - Re-run compliance checks
 * - Mark data as "reconstructed"
 * - Add watermarks to regenerated documents
 *
 * Use Case:
 * - Melengkapi SPJ yang belum sempurna
 * - Memperbaiki dokumen yang hilang/rusak
 * - Menyiapkan audit ulang
 * - Penyempurnaan administrasi tahun lampau
 *
 * Rules:
 * - Semua dokumen hasil rekonstruksi diberi watermark "REKONSTRUKSI"
 * - Data dicatat dalam audit trail
 * - Tidak mengubah historical fact, hanya melengkapi dokumentasi
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
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Input,
  Textarea
} from '@nextui-org/react'
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Save,
  Eye,
  Clock,
  Info,
  Lock,
  Unlock,
  Calendar,
  Play,
  Pause
} from 'lucide-react'

import { useFiscalYear } from '../../hooks/useFiscalYear.js'
import ProcessWizard from '../process-wizard/ProcessWizard.example.jsx'

/**
 * Reconstruction Task Card
 */
const ReconstructionTaskCard = ({ task, onStart, onComplete }) => {
  const getTaskIcon = (type) => {
    switch (type) {
      case 'complete-data':
        return FileText
      case 'regenerate-docs':
        return RefreshCw
      case 'recalculate-compliance':
        return CheckCircle2
      default:
        return Wrench
    }
  }

  const TaskIcon = getTaskIcon(task.type)
  const isCompleted = task.status === 'COMPLETED'
  const isPending = task.status === 'PENDING'

  return (
    <Card className={`${isCompleted ? 'bg-green-50' : ''}`}>
      <CardBody className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isCompleted ? 'bg-green-200' : 'bg-orange-200'
            }`}
          >
            <TaskIcon
              className={`w-5 h-5 ${
                isCompleted ? 'text-green-700' : 'text-orange-700'
              }`}
            />
          </div>
          <div>
            <p className="font-medium">{task.title}</p>
            <p className="text-xs text-gray-600">{task.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Chip color="success" variant="flat" size="sm">
              Selesai
            </Chip>
          ) : (
            <Button
              size="sm"
              color="warning"
              variant="flat"
              onPress={() => onStart(task)}
            >
              Mulai
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Reconstruction Warning Banner
 */
const ReconstructionWarning = () => (
  <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
    <CardBody className="flex flex-row items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-bold text-orange-900 text-lg mb-2">
          Mode Rekonstruksi Administrasi
        </h3>
        <div className="space-y-2 text-sm text-orange-800">
          <p>
            <strong>Penting:</strong> Mode ini digunakan untuk melengkapi atau
            memperbaiki administrasi tahun anggaran lampau.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Semua dokumen yang di-generate akan diberi watermark <strong>"REKONSTRUKSI ADMINISTRASI"</strong></li>
            <li>Perubahan dicatat dalam audit trail</li>
            <li>Tidak mengubah fakta historis, hanya melengkapi dokumentasi</li>
            <li>Data akan ditandai sebagai "reconstructed"</li>
          </ul>
        </div>
      </div>
    </CardBody>
  </Card>
)

/**
 * MAIN COMPONENT: ReconstructionMode
 */
const ReconstructionMode = () => {
  const { activeYear, isReconstruction, changeModeToReconstruction } = useFiscalYear()

  const [masterDataList, setMasterDataList] = useState([])
  const [selectedMasterData, setSelectedMasterData] = useState(null)
  const [reconstructionTasks, setReconstructionTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [reconstructionReason, setReconstructionReason] = useState('')

  // Load master data for reconstruction
  useEffect(() => {
    if (isReconstruction) {
      loadReconstructionData()
    }
  }, [activeYear, isReconstruction])

  const loadReconstructionData = async () => {
    try {
      setIsLoading(true)

      // TODO: Integrate with actual service
      // const data = await ReconstructionService.getMasterDataList(activeYear)
      // setMasterDataList(data)

      // Mock data for development
      const mockData = [
        {
          masterId: 'MDK-2023-001',
          kegiatanNama: 'Pengadaan Laptop (Incomplete)',
          status: 'INCOMPLETE',
          completionPercentage: 65,
          complianceScore: 72,
          missingDocuments: ['BAST', 'Kuitansi'],
          lastUpdated: '2023-12-01'
        },
        {
          masterId: 'MDK-2023-002',
          kegiatanNama: 'Workshop SAKTI',
          status: 'NEEDS_REGENERATION',
          completionPercentage: 85,
          complianceScore: 88,
          missingDocuments: ['SPM'],
          lastUpdated: '2023-11-15'
        }
      ]

      setMasterDataList(mockData)
      setIsLoading(false)
    } catch (error) {
      console.error('[ReconstructionMode] Load error:', error)
      setIsLoading(false)
    }
  }

  const handleStartReconstruction = (masterData) => {
    setSelectedMasterData(masterData)

    // Generate reconstruction tasks
    const tasks = [
      {
        id: 'task-1',
        type: 'complete-data',
        title: 'Lengkapi Data Master',
        description: 'Isi field yang masih kosong',
        status: 'PENDING'
      },
      {
        id: 'task-2',
        type: 'regenerate-docs',
        title: 'Generate Ulang Dokumen',
        description: `Generate ${masterData.missingDocuments.length} dokumen yang hilang`,
        status: 'PENDING'
      },
      {
        id: 'task-3',
        type: 'recalculate-compliance',
        title: 'Hitung Ulang Compliance',
        description: 'Re-run audit readiness check',
        status: 'PENDING'
      }
    ]

    setReconstructionTasks(tasks)
    setActiveTab('wizard')
  }

  const handleTaskStart = (task) => {
    console.log('[ReconstructionMode] Start task:', task.id)
    // TODO: Implement task execution logic
  }

  const handleCompleteReconstruction = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmReconstruction = async () => {
    console.log('[ReconstructionMode] Completing reconstruction:', {
      masterDataId: selectedMasterData.masterId,
      reason: reconstructionReason
    })

    // TODO: Mark as reconstructed in database
    // await ReconstructionService.markAsReconstructed(
    //   selectedMasterData.masterId,
    //   reconstructionReason
    // )

    setShowConfirmModal(false)
    alert('Rekonstruksi selesai! Data telah ditandai sebagai "RECONSTRUCTED".')
    loadReconstructionData()
    setSelectedMasterData(null)
    setActiveTab('list')
  }

  // Not in reconstruction mode
  if (!isReconstruction) {
    return (
      <Card>
        <CardBody className="text-center py-12 space-y-4">
          <Lock className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">
            Mode Rekonstruksi tidak aktif untuk tahun anggaran ini.
          </p>
          <Button
            color="warning"
            variant="flat"
            onPress={changeModeToReconstruction}
            startContent={<Unlock className="w-4 h-4" />}
          >
            Aktifkan Mode Rekonstruksi
          </Button>
        </CardBody>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat data rekonstruksi TA {activeYear}...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Rekonstruksi Administrasi TA {activeYear}
              </h1>
              <p className="text-sm text-orange-100">
                Lengkapi dan perbaiki SPJ tahun anggaran lampau
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <span className="font-medium">Active</span>
          </div>
        </CardBody>
      </Card>

      {/* Warning Banner */}
      <ReconstructionWarning />

      {/* Main Content */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            aria-label="Reconstruction tabs"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            fullWidth
            size="lg"
            className="px-4 pt-4"
          >
            <Tab
              key="list"
              title={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Daftar SPJ</span>
                  <Chip size="sm" variant="flat" color="warning">
                    {masterDataList.length}
                  </Chip>
                </div>
              }
            >
              <div className="p-4 space-y-4">
                {masterDataList.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      Semua SPJ untuk TA {activeYear} sudah lengkap
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Tidak ada yang perlu direkonstruksi
                    </p>
                  </div>
                ) : (
                  masterDataList.map((item) => (
                    <MasterDataReconstructionCard
                      key={item.masterId}
                      masterData={item}
                      onStart={handleStartReconstruction}
                    />
                  ))
                )}
              </div>
            </Tab>

            <Tab
              key="wizard"
              title={
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  <span>Wizard</span>
                </div>
              }
              isDisabled={!selectedMasterData}
            >
              <div className="p-4 space-y-4">
                {selectedMasterData && (
                  <>
                    {/* Selected Master Data Info */}
                    <Card className="bg-blue-50">
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{selectedMasterData.masterId}</h3>
                            <p className="text-sm text-gray-600">
                              {selectedMasterData.kegiatanNama}
                            </p>
                          </div>
                          <Chip color="warning" variant="flat">
                            {selectedMasterData.status}
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Reconstruction Tasks */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Langkah Rekonstruksi
                      </h3>
                      {reconstructionTasks.map((task) => (
                        <ReconstructionTaskCard
                          key={task.id}
                          task={task}
                          onStart={handleTaskStart}
                        />
                      ))}
                    </div>

                    {/* Process Wizard Integration */}
                    <Card>
                      <CardHeader>
                        <h3 className="font-semibold">Process Wizard</h3>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <ProcessWizard
                          masterData={selectedMasterData}
                          onMasterDataUpdate={(updated) => {
                            setSelectedMasterData(updated)
                          }}
                        />
                      </CardBody>
                    </Card>

                    {/* Complete Button */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="flat"
                        onPress={() => {
                          setSelectedMasterData(null)
                          setActiveTab('list')
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        color="success"
                        startContent={<Save className="w-4 h-4" />}
                        onPress={handleCompleteReconstruction}
                      >
                        Selesai Rekonstruksi
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Konfirmasi Rekonstruksi</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>
                Anda akan menandai <strong>{selectedMasterData?.masterId}</strong>{' '}
                sebagai "RECONSTRUCTED".
              </p>

              <Textarea
                label="Alasan Rekonstruksi"
                placeholder="Contoh: Melengkapi dokumen BAST yang hilang, memperbaiki kuitansi yang rusak, dll."
                value={reconstructionReason}
                onValueChange={setReconstructionReason}
                minRows={3}
                isRequired
              />

              <Card className="bg-yellow-50 border-yellow-200 border">
                <CardBody className="text-sm space-y-2">
                  <p className="font-medium text-yellow-900">
                    Yang akan dilakukan sistem:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    <li>Menandai data sebagai "RECONSTRUCTED"</li>
                    <li>Mencatat timestamp rekonstruksi</li>
                    <li>Menambahkan watermark ke semua dokumen yang di-generate</li>
                    <li>Menyimpan alasan rekonstruksi dalam audit trail</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowConfirmModal(false)}>
              Batal
            </Button>
            <Button
              color="success"
              onPress={handleConfirmReconstruction}
              isDisabled={!reconstructionReason.trim()}
            >
              Konfirmasi Rekonstruksi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

/**
 * Master Data Reconstruction Card
 */
const MasterDataReconstructionCard = ({ masterData, onStart }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{masterData.masterId}</h3>
            <p className="text-sm text-gray-600">{masterData.kegiatanNama}</p>
          </div>
          <Chip color="warning" variant="flat">
            {masterData.status}
          </Chip>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span>Kelengkapan</span>
            <span className="font-medium">{masterData.completionPercentage}%</span>
          </div>
          <Progress
            value={masterData.completionPercentage}
            color={masterData.completionPercentage >= 80 ? 'success' : 'warning'}
            size="sm"
          />
        </div>

        {/* Missing Documents */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Dokumen yang hilang:</p>
          <div className="flex flex-wrap gap-1">
            {masterData.missingDocuments.map((doc, i) => (
              <Chip key={i} size="sm" color="danger" variant="flat">
                {doc}
              </Chip>
            ))}
          </div>
        </div>

        <Divider className="my-3" />

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Terakhir diupdate: {new Date(masterData.lastUpdated).toLocaleDateString('id-ID')}
          </div>
          <Button
            size="sm"
            color="warning"
            variant="flat"
            startContent={<Wrench className="w-4 h-4" />}
            onPress={() => onStart(masterData)}
          >
            Mulai Rekonstruksi
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export default ReconstructionMode
