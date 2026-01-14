import React from 'react'
import { Input, Select, CurrencyInput } from '../../../../components/ui/Input'
import { JENIS_KONTRAK_OPTIONS, METODE_PENGADAAN_OPTIONS } from '../config'
import { Info } from 'lucide-react'

/**
 * Step 2: Data Kontrak
 * Input data kontrak/SPK
 */
const DataKontrakStep = ({ data = {}, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value })
  }

  const jenisKontrakOptions = JENIS_KONTRAK_OPTIONS || [
    { value: 'barang', label: 'Pengadaan Barang' },
    { value: 'jasa', label: 'Jasa Konsultansi' },
    { value: 'konstruksi', label: 'Pekerjaan Konstruksi' },
    { value: 'jasa-lainnya', label: 'Jasa Lainnya' }
  ]

  const metodeOptions = METODE_PENGADAAN_OPTIONS || [
    { value: 'tender', label: 'Tender' },
    { value: 'penunjukan-langsung', label: 'Penunjukan Langsung' },
    { value: 'pengadaan-langsung', label: 'Pengadaan Langsung' }
  ]

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Langkah 2: Data Kontrak</p>
            <p>
              Masukkan informasi kontrak/SPK yang akan dibayarkan.
              Data ini akan digunakan untuk mengisi SPP, Kwitansi, BAST, dan dokumen lainnya.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nomor Kontrak */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Kontrak / SPK <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: 001/SPK/SATKER/VI/2024"
            value={data.nomor || ''}
            onChange={(e) => handleChange('nomor', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Nomor kontrak atau Surat Perintah Kerja (SPK)
          </p>
        </div>

        {/* Tanggal Kontrak */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Kontrak <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={data.tanggal || ''}
            onChange={(e) => handleChange('tanggal', e.target.value)}
          />
        </div>

        {/* Nomor Urut (untuk nomor surat) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Urut Kontrak
          </label>
          <Input
            type="text"
            placeholder="001"
            value={data.nomorUrut || ''}
            onChange={(e) => handleChange('nomorUrut', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Untuk penomoran dokumen SPP, BAST, dll
          </p>
        </div>

        {/* Nilai Kontrak */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nilai Kontrak (DPP) <span className="text-red-500">*</span>
          </label>
          <CurrencyInput
            value={data.nilai || ''}
            onChange={(value) => handleChange('nilai', value)}
            placeholder="Masukkan nilai kontrak"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nilai Dasar Pengenaan Pajak (belum termasuk PPN)
          </p>
        </div>

        {/* Jenis Kontrak */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Pengadaan <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.jenisKontrak || ''}
            onChange={(e) => handleChange('jenisKontrak', e.target.value)}
          >
            <option value="">Pilih Jenis</option>
            {jenisKontrakOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {/* Metode Pengadaan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metode Pengadaan
          </label>
          <Select
            value={data.metodePengadaan || 'pengadaan-langsung'}
            onChange={(e) => handleChange('metodePengadaan', e.target.value)}
          >
            {metodeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {/* PPN & PPh */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PPN (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={data.ppn || 11}
            onChange={(e) => handleChange('ppn', parseFloat(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 11% (sesuai regulasi terbaru)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PPh Pasal 22 (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={data.pph || 2}
            onChange={(e) => handleChange('pph', parseFloat(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 2% untuk pengadaan pemerintah
          </p>
        </div>

        {/* Jangka Waktu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jangka Waktu Pelaksanaan (Hari)
          </label>
          <Input
            type="number"
            placeholder="30"
            value={data.jangkaWaktu || ''}
            onChange={(e) => handleChange('jangkaWaktu', parseInt(e.target.value))}
          />
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Mulai Kerja
          </label>
          <Input
            type="date"
            value={data.tanggalMulai || data.tanggal || ''}
            onChange={(e) => handleChange('tanggalMulai', e.target.value)}
          />
        </div>

        {/* Tanggal Selesai */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Selesai Pekerjaan
          </label>
          <Input
            type="date"
            value={data.tanggalSelesai || ''}
            onChange={(e) => handleChange('tanggalSelesai', e.target.value)}
          />
        </div>
      </div>

      {/* Perhitungan Otomatis */}
      {data.nilai && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">Perhitungan Otomatis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Nilai Kontrak (DPP)</div>
              <div className="font-bold text-gray-900">
                {formatRupiah(parseFloat(data.nilai))}
              </div>
            </div>
            <div>
              <div className="text-gray-600">PPN {data.ppn || 11}%</div>
              <div className="font-bold text-gray-900">
                {formatRupiah(parseFloat(data.nilai) * ((data.ppn || 11) / 100))}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Bruto</div>
              <div className="font-bold text-gray-900">
                {formatRupiah(parseFloat(data.nilai) * (1 + (data.ppn || 11) / 100))}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Netto (Dibayar)</div>
              <div className="font-bold text-green-700 text-base">
                {formatRupiah(
                  parseFloat(data.nilai) * (1 + (data.ppn || 11) / 100) -
                  parseFloat(data.nilai) * ((data.pph || 2) / 100)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keterangan */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keterangan / Deskripsi Pekerjaan (Opsional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Deskripsi singkat tentang pekerjaan/barang/jasa yang dikontrakkan..."
          value={data.keterangan || ''}
          onChange={(e) => handleChange('keterangan', e.target.value)}
        />
      </div>
    </div>
  )
}

// Helper function for formatting
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

export default DataKontrakStep
