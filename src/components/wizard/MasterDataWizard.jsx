import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Progress,
  Chip,
  Divider
} from '@nextui-org/react'
import { ChevronLeft, ChevronRight, Save, Check, AlertCircle } from 'lucide-react'
import { generateId, generateTerbilang, calculateDuration } from '../../utils/masterDataHelpers'
import { validateMasterData } from '../../utils/masterDataValidator'

/**
 * MasterDataWizard - Multi-step form untuk input Single Source of Truth
 *
 * Form ini adalah fondasi sistem yang memastikan SEMUA data diinput SEKALI saja,
 * dan dipakai oleh SEMUA dokumen tanpa duplikasi.
 *
 * Steps:
 * 1. Data Satker & Pejabat
 * 2. Data Kegiatan & Anggaran
 * 3. Data Penyedia / Penerima
 * 4. Data Bank & Pembayaran
 * 5. Nomor & Tanggal Dokumen
 * 6. Review & Submit
 */

const MasterDataWizard = () => {
  const navigate = useNavigate()

  // State untuk tracking step
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])

  // State untuk Master Data (Single Source of Truth)
  const [masterData, setMasterData] = useState({
    id: '',
    tahunAnggaran: new Date().getFullYear(),
    status: 'draft',
    satker: {
      kementerian: '',
      unitEselon1: '',
      kode: '',
      nama: '',
      alamat: {
        jalan: '',
        kelurahan: '',
        kecamatan: '',
        kota: '',
        provinsi: '',
        kodePos: '',
        lengkap: ''
      },
      telepon: '',
      email: ''
    },
    pejabat: {
      kpa: { nama: '', nip: '', jabatan: '', pangkat: '', ttd: '' },
      ppk: { nama: '', nip: '', jabatan: '', pangkat: '', ttd: '' },
      bendahara: { nama: '', nip: '', ttd: '' },
      pphp: [{ nama: '', nip: '', jabatan: '', role: 'ketua', ttd: '' }]
    },
    kegiatan: {
      program: { kode: '', nama: '' },
      kegiatan: { kode: '', nama: '' },
      output: { kode: '', nama: '', volume: '', satuan: '' },
      komponen: { kode: '', nama: '' },
      akun: { kode: '', nama: '' },
      uraian: '',
      lokasi: '',
      waktu: { mulai: '', selesai: '', durasi: 0 }
    },
    anggaran: {
      sumberDana: 'APBN',
      dipaRevisi: 0,
      pagu: 0,
      nilaiKontrak: 0,
      nilaiDibayar: 0,
      potongan: { pph21: 0, pph22: 0, pph23: 0, ppn: 0, total: 0 },
      terbilang: ''
    },
    penyedia: {
      jenis: 'badan_usaha',
      nama: '',
      pimpinan: '',
      jabatan: '',
      alamat: {
        jalan: '',
        kelurahan: '',
        kecamatan: '',
        kota: '',
        provinsi: '',
        kodePos: '',
        lengkap: ''
      },
      kontak: { telepon: '', email: '' },
      identitas: { npwp: '', nik: '', nomorAkta: '' }
    },
    bank: {
      namaBank: '',
      cabang: '',
      nomorRekening: '',
      atasNama: ''
    },
    dokumen: {
      kontrak: { nomor: '', tanggal: '' },
      spr: { nomor: '', tanggal: '' },
      sppr: { nomor: '', tanggal: '' },
      bast: { nomor: '', tanggal: '' },
      bap: { nomor: '', tanggal: '' },
      sptjb: { nomor: '', tanggal: '' },
      rpd: { nomor: '', tanggal: '' },
      sp2d: { nomor: '', tanggal: '' },
      kuitansi: { nomor: '', tanggal: '' }
    },
    lampiran: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id',
      version: 1,
      history: []
    }
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Steps definition
  const steps = [
    {
      id: 'satker',
      title: 'Data Satker & Pejabat',
      description: 'Identitas satuan kerja dan pejabat pengelola',
      icon: '🏢'
    },
    {
      id: 'kegiatan',
      title: 'Data Kegiatan & Anggaran',
      description: 'Program, kegiatan, output, dan pagu anggaran',
      icon: '📋'
    },
    {
      id: 'penyedia',
      title: 'Data Penyedia / Penerima',
      description: 'Identitas penyedia barang/jasa atau penerima',
      icon: '🏪'
    },
    {
      id: 'bank',
      title: 'Data Bank & Pembayaran',
      description: 'Rekening bank dan rincian pembayaran',
      icon: '💰'
    },
    {
      id: 'dokumen',
      title: 'Nomor & Tanggal Dokumen',
      description: 'Metadata dokumen SPJ',
      icon: '📄'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Periksa kembali data sebelum disimpan',
      icon: '✅'
    }
  ]

  // Auto-generate values when dependencies change
  useEffect(() => {
    // Generate alamat lengkap satker
    const alamatSatker = masterData.satker.alamat
    if (alamatSatker.jalan || alamatSatker.kota) {
      const lengkap = [
        alamatSatker.jalan,
        alamatSatker.kelurahan,
        alamatSatker.kecamatan,
        alamatSatker.kota,
        alamatSatker.provinsi,
        alamatSatker.kodePos
      ].filter(Boolean).join(', ')

      setMasterData(prev => ({
        ...prev,
        satker: {
          ...prev.satker,
          alamat: { ...prev.satker.alamat, lengkap }
        }
      }))
    }

    // Generate alamat lengkap penyedia
    const alamatPenyedia = masterData.penyedia.alamat
    if (alamatPenyedia.jalan || alamatPenyedia.kota) {
      const lengkap = [
        alamatPenyedia.jalan,
        alamatPenyedia.kelurahan,
        alamatPenyedia.kecamatan,
        alamatPenyedia.kota,
        alamatPenyedia.provinsi,
        alamatPenyedia.kodePos
      ].filter(Boolean).join(', ')

      setMasterData(prev => ({
        ...prev,
        penyedia: {
          ...prev.penyedia,
          alamat: { ...prev.penyedia.alamat, lengkap }
        }
      }))
    }
  }, [
    masterData.satker.alamat.jalan,
    masterData.satker.alamat.kota,
    masterData.penyedia.alamat.jalan,
    masterData.penyedia.alamat.kota
  ])

  // Calculate nilai dibayar when potongan changes
  useEffect(() => {
    const { nilaiKontrak, potongan } = masterData.anggaran
    const totalPotongan = (potongan.pph21 || 0) + (potongan.pph22 || 0) +
                          (potongan.pph23 || 0) + (potongan.ppn || 0)
    const nilaiDibayar = nilaiKontrak - totalPotongan
    const terbilang = generateTerbilang(nilaiDibayar)

    setMasterData(prev => ({
      ...prev,
      anggaran: {
        ...prev.anggaran,
        nilaiDibayar,
        potongan: { ...prev.anggaran.potongan, total: totalPotongan },
        terbilang
      }
    }))
  }, [
    masterData.anggaran.nilaiKontrak,
    masterData.anggaran.potongan.pph21,
    masterData.anggaran.potongan.pph22,
    masterData.anggaran.potongan.pph23,
    masterData.anggaran.potongan.ppn
  ])

  // Calculate durasi when waktu changes
  useEffect(() => {
    const { mulai, selesai } = masterData.kegiatan.waktu
    if (mulai && selesai) {
      const durasi = calculateDuration(mulai, selesai)
      setMasterData(prev => ({
        ...prev,
        kegiatan: {
          ...prev.kegiatan,
          waktu: { ...prev.kegiatan.waktu, durasi }
        }
      }))
    }
  }, [masterData.kegiatan.waktu.mulai, masterData.kegiatan.waktu.selesai])

  // Generate ID on mount
  useEffect(() => {
    if (!masterData.id) {
      const newId = generateId(masterData.tahunAnggaran)
      setMasterData(prev => ({ ...prev, id: newId }))
    }
  }, [])

  // Handle input change
  const handleInputChange = (path, value) => {
    const keys = path.split('.')
    setMasterData(prev => {
      const newData = { ...prev }
      let current = newData

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newData
    })

    // Clear error for this field
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[path]
        return newErrors
      })
    }
  }

  // Handle array input (for PPHP)
  const addPPHP = () => {
    setMasterData(prev => ({
      ...prev,
      pejabat: {
        ...prev.pejabat,
        pphp: [
          ...prev.pejabat.pphp,
          { nama: '', nip: '', jabatan: '', role: 'anggota', ttd: '' }
        ]
      }
    }))
  }

  const removePPHP = (index) => {
    setMasterData(prev => ({
      ...prev,
      pejabat: {
        ...prev.pejabat,
        pphp: prev.pejabat.pphp.filter((_, i) => i !== index)
      }
    }))
  }

  const updatePPHP = (index, field, value) => {
    setMasterData(prev => ({
      ...prev,
      pejabat: {
        ...prev.pejabat,
        pphp: prev.pejabat.pphp.map((p, i) =>
          i === index ? { ...p, [field]: value } : p
        )
      }
    }))
  }

  // Validate current step
  const validateStep = (stepId) => {
    const validationErrors = validateMasterData(masterData, stepId)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  // Navigate steps
  const goToNextStep = () => {
    if (validateStep(steps[currentStep].id)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep])
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const goToStep = (stepIndex) => {
    // Can only jump to completed steps or next step
    if (stepIndex <= Math.max(...completedSteps, -1) + 1) {
      setCurrentStep(stepIndex)
    }
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep('review')) {
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Save to database via API
      // await MasterDataService.create(masterData)

      console.log('Master Data to be saved:', masterData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('Master Data berhasil disimpan! Semua dokumen dapat di-generate dari data ini.')
      navigate('/master-data')
    } catch (error) {
      console.error('Error saving master data:', error)
      alert('Gagal menyimpan data. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1SatkerPejabat
          data={masterData}
          onChange={handleInputChange}
          onUpdatePPHP={updatePPHP}
          onAddPPHP={addPPHP}
          onRemovePPHP={removePPHP}
          errors={errors}
        />
      case 1:
        return <Step2KegiatanAnggaran
          data={masterData}
          onChange={handleInputChange}
          errors={errors}
        />
      case 2:
        return <Step3Penyedia
          data={masterData}
          onChange={handleInputChange}
          errors={errors}
        />
      case 3:
        return <Step4BankPembayaran
          data={masterData}
          onChange={handleInputChange}
          errors={errors}
        />
      case 4:
        return <Step5Dokumen
          data={masterData}
          onChange={handleInputChange}
          errors={errors}
        />
      case 5:
        return <Step6Review
          data={masterData}
        />
      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Master Data Kegiatan</h1>
        <p className="text-gray-600">
          Single Source of Truth - Input sekali, pakai di semua dokumen
        </p>
        {masterData.id && (
          <Chip color="primary" variant="flat" size="sm" className="mt-2">
            ID: {masterData.id}
          </Chip>
        )}
      </div>

      {/* Progress Stepper */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    index === currentStep
                      ? 'scale-110'
                      : index <= Math.max(...completedSteps, -1)
                        ? 'opacity-100'
                        : 'opacity-50'
                  }`}
                  onClick={() => goToStep(index)}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2
                    ${index === currentStep
                      ? 'bg-blue-500 text-white shadow-lg'
                      : completedSteps.includes(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {completedSteps.includes(index) ? <Check size={24} /> : step.icon}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${
                      index === currentStep ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 max-w-[120px]">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            color="primary"
            className="mt-4"
          />
          <div className="text-center text-sm text-gray-600 mt-2">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardBody>
      </Card>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader className="border-b">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{steps[currentStep].icon}</span>
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mt-1">
              {steps[currentStep].description}
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {renderStepContent()}
        </CardBody>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          color="default"
          variant="flat"
          startContent={<ChevronLeft size={20} />}
          onClick={goToPreviousStep}
          isDisabled={currentStep === 0}
        >
          Sebelumnya
        </Button>

        <div className="flex gap-2">
          <Button
            color="default"
            variant="bordered"
            startContent={<Save size={20} />}
            onClick={() => console.log('Save draft:', masterData)}
          >
            Simpan Draft
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              color="primary"
              endContent={<ChevronRight size={20} />}
              onClick={goToNextStep}
            >
              Selanjutnya
            </Button>
          ) : (
            <Button
              color="success"
              endContent={<Check size={20} />}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Submit Master Data
            </Button>
          )}
        </div>
      </div>

      {/* Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="mt-4 border-red-500">
          <CardBody className="bg-red-50">
            <div className="flex items-start gap-2 text-red-700">
              <AlertCircle size={20} className="mt-0.5" />
              <div>
                <div className="font-semibold">Ada {Object.keys(errors).length} kesalahan:</div>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default MasterDataWizard

// Individual step components will be in separate files:
// - Step1SatkerPejabat.jsx
// - Step2KegiatanAnggaran.jsx
// - Step3Penyedia.jsx
// - Step4BankPembayaran.jsx
// - Step5Dokumen.jsx
// - Step6Review.jsx
