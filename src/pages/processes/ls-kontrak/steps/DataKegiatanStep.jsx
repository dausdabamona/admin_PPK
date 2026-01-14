import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Input, Select, CurrencyInput } from '../../../../components/ui/Input'
import { db } from '../../../../db/database'
import { Info } from 'lucide-react'

/**
 * Step 1: Data Kegiatan
 * Input data kegiatan dan anggaran
 */
const DataKegiatanStep = ({ data = {}, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value })
  }

  // Load master data pejabat
  const pejabatList = useLiveQuery(() => db.pejabat?.toArray()) || []

  const ppkOptions = pejabatList
    .filter(p => p.jabatan === 'PPK')
    .map(p => ({ value: p.id, label: `${p.nama} - ${p.nip}` }))

  const ppspmOptions = pejabatList
    .filter(p => p.jabatan === 'PPSPM')
    .map(p => ({ value: p.id, label: `${p.nama} - ${p.nip}` }))

  const bendaharaOptions = pejabatList
    .filter(p => p.jabatan === 'Bendahara')
    .map(p => ({ value: p.id, label: `${p.nama} - ${p.nip}` }))

  const currentYear = new Date().getFullYear()
  const tahunOptions = [
    { value: currentYear, label: currentYear.toString() },
    { value: currentYear + 1, label: (currentYear + 1).toString() }
  ]

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Langkah 1: Data Kegiatan</p>
            <p>
              Masukkan informasi dasar kegiatan yang akan dilakukan pembayaran LS Kontrak.
              Data ini akan digunakan untuk mengisi semua dokumen yang akan di-generate.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nama Kegiatan */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Kegiatan <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: Renovasi Kantor Cabang Jakarta"
            value={data.nama || ''}
            onChange={(e) => handleChange('nama', e.target.value)}
          />
        </div>

        {/* Kode Kegiatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Kegiatan <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: 5201.ABC.001"
            value={data.kode || ''}
            onChange={(e) => handleChange('kode', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: Kode MAK atau kode kegiatan dari DIPA
          </p>
        </div>

        {/* Tahun Anggaran */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun Anggaran <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.tahun || currentYear}
            onChange={(e) => handleChange('tahun', parseInt(e.target.value))}
          >
            {tahunOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {/* Pagu Anggaran */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pagu Anggaran <span className="text-red-500">*</span>
          </label>
          <CurrencyInput
            value={data.pagu || ''}
            onChange={(value) => handleChange('pagu', value)}
            placeholder="Masukkan pagu anggaran"
          />
          <p className="text-xs text-gray-500 mt-1">
            Total pagu anggaran untuk kegiatan ini
          </p>
        </div>

        {/* Sumber Dana */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sumber Dana
          </label>
          <Select
            value={data.sumberDana || 'APBN'}
            onChange={(e) => handleChange('sumberDana', e.target.value)}
          >
            <option value="APBN">APBN</option>
            <option value="APBD">APBD</option>
            <option value="PNBP">PNBP</option>
            <option value="Lainnya">Lainnya</option>
          </Select>
        </div>

        {/* Output Kegiatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Kegiatan
          </label>
          <Input
            type="text"
            placeholder="Contoh: Ruang kantor yang renovasi"
            value={data.output || ''}
            onChange={(e) => handleChange('output', e.target.value)}
          />
        </div>
      </div>

      {/* Pejabat */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pejabat Terkait</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PPK */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PPK <span className="text-red-500">*</span>
            </label>
            <Select
              value={data.ppkId || ''}
              onChange={(e) => handleChange('ppkId', e.target.value)}
            >
              <option value="">Pilih PPK</option>
              {ppkOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            {ppkOptions.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Belum ada data PPK. Silakan tambahkan di Master Pejabat.
              </p>
            )}
          </div>

          {/* PPSPM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PPSPM <span className="text-red-500">*</span>
            </label>
            <Select
              value={data.ppspmId || ''}
              onChange={(e) => handleChange('ppspmId', e.target.value)}
            >
              <option value="">Pilih PPSPM</option>
              {ppspmOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          {/* Bendahara */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bendahara <span className="text-red-500">*</span>
            </label>
            <Select
              value={data.bendaharaId || ''}
              onChange={(e) => handleChange('bendaharaId', e.target.value)}
            >
              <option value="">Pilih Bendahara</option>
              {bendaharaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Catatan */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catatan Tambahan (Opsional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Catatan atau keterangan tambahan tentang kegiatan ini..."
          value={data.catatan || ''}
          onChange={(e) => handleChange('catatan', e.target.value)}
        />
      </div>
    </div>
  )
}

export default DataKegiatanStep
