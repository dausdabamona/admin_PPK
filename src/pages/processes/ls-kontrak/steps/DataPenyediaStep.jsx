import React from 'react'
import { Input } from '../../../../components/ui/Input'
import { Info } from 'lucide-react'

/**
 * Step 3: Data Penyedia
 * Input data penyedia/vendor/rekanan
 */
const DataPenyediaStep = ({ data = {}, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value })
  }

  const formatNPWP = (value) => {
    // Format: 00.000.000.0-000.000
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}.${numbers.slice(8)}`
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}.${numbers.slice(8, 9)}-${numbers.slice(9)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}.${numbers.slice(8, 9)}-${numbers.slice(9, 12)}.${numbers.slice(12, 15)}`
  }

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Langkah 3: Data Penyedia</p>
            <p>
              Masukkan informasi penyedia/vendor/rekanan yang akan menerima pembayaran.
              Pastikan data rekening benar untuk transfer pembayaran.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nama Penyedia */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Penyedia / Perusahaan <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: PT. Berkah Jaya Konstruksi"
            value={data.nama || ''}
            onChange={(e) => handleChange('nama', e.target.value)}
          />
        </div>

        {/* NPWP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NPWP <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="00.000.000.0-000.000"
            value={data.npwp || ''}
            onChange={(e) => handleChange('npwp', formatNPWP(e.target.value))}
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format otomatis: 00.000.000.0-000.000
          </p>
        </div>

        {/* NIB / No Izin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIB / Nomor Izin Usaha
          </label>
          <Input
            type="text"
            placeholder="Nomor Induk Berusaha"
            value={data.nib || ''}
            onChange={(e) => handleChange('nib', e.target.value)}
          />
        </div>

        {/* Alamat */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Alamat lengkap penyedia/perusahaan"
            value={data.alamat || ''}
            onChange={(e) => handleChange('alamat', e.target.value)}
          />
        </div>

        {/* Telepon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telepon
          </label>
          <Input
            type="tel"
            placeholder="021-12345678"
            value={data.telepon || ''}
            onChange={(e) => handleChange('telepon', e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <Input
            type="email"
            placeholder="email@perusahaan.com"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>
      </div>

      {/* Data Rekening */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Data Rekening (Untuk Pembayaran)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama Bank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Bank <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: Bank Mandiri"
              value={data.namaBank || ''}
              onChange={(e) => handleChange('namaBank', e.target.value)}
            />
          </div>

          {/* Cabang Bank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabang Bank
            </label>
            <Input
              type="text"
              placeholder="Contoh: KCP Jakarta Pusat"
              value={data.cabangBank || ''}
              onChange={(e) => handleChange('cabangBank', e.target.value)}
            />
          </div>

          {/* Nomor Rekening */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Rekening <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="1234567890"
              value={data.rekening || ''}
              onChange={(e) => handleChange('rekening', e.target.value)}
            />
            <p className="text-xs text-red-500 mt-1">
              ⚠️ Pastikan nomor rekening benar untuk menghindari kesalahan transfer
            </p>
          </div>

          {/* Nama Pemilik Rekening */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atas Nama <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Nama pemilik rekening"
              value={data.namaPemilikRekening || ''}
              onChange={(e) => handleChange('namaPemilikRekening', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Harus sesuai dengan nama di buku rekening
            </p>
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Contact Person (Opsional)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Contact Person
            </label>
            <Input
              type="text"
              placeholder="Nama PIC"
              value={data.contactPerson || ''}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. HP Contact Person
            </label>
            <Input
              type="tel"
              placeholder="08123456789"
              value={data.hpContactPerson || ''}
              onChange={(e) => handleChange('hpContactPerson', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Validasi Data */}
      {data.nama && data.npwp && data.rekening && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">Data penyedia lengkap!</p>
              <p>
                Pastikan kembali nomor rekening <strong>{data.rekening}</strong> atas nama{' '}
                <strong>{data.namaPemilikRekening || data.nama}</strong> sudah benar sebelum melanjutkan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataPenyediaStep
