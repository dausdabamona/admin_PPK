import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Calendar,
  DollarSign,
  FileText,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  Info,
  Database
} from 'lucide-react'
import { db } from '../../db/database'
import { formatRupiah, parseRupiah, formatDateInput } from '../../utils/formatters'
import DipaRevisionSelector, { DipaItemSelector } from '../ui/DipaRevisionSelector'

/**
 * MasterActivityForm - Universal Activity Form
 *
 * Single Source of Truth untuk data kegiatan yang digunakan semua proses:
 * - Data Kegiatan (nama, kode, pagu, tahun)
 * - Data Pejabat (PPK, PPSPM, KPA, Bendahara)
 * - Data Satker (nama, kode, alamat, kota)
 *
 * Features:
 * - Auto-load dari master data
 * - Non-blocking validation
 * - Auto-save on change
 * - Field hints and helpers
 */
const MasterActivityForm = ({ data = {}, onUpdate, mode = 'normal' }) => {
  const [formData, setFormData] = useState({
    kegiatan: {
      nama: '',
      kode: '',
      pagu: 0,
      tahun: new Date().getFullYear(),
      output: '',
      dipaRevision: null,
      dipaItem: null,
      ...data.kegiatan
    },
    pejabat: {
      ppk: { nama: '', nip: '', pangkat: '', jabatan: '' },
      ppspm: { nama: '', nip: '', pangkat: '', jabatan: '' },
      kpa: { nama: '', nip: '', pangkat: '', jabatan: '' },
      bendahara: { nama: '', nip: '', pangkat: '', jabatan: '' },
      ...data.pejabat
    },
    settings: {
      satkerNama: '',
      kodeSatker: '',
      alamatSatker: '',
      kotaSatker: '',
      provinsiSatker: '',
      ...data.settings
    }
  })

  const [validation, setValidation] = useState({
    isValid: true,
    warnings: []
  })

  // Load master data
  const pejabatList = useLiveQuery(() => db.masterPegawai?.toArray()) || []
  const kotaList = useLiveQuery(() => db.masterKota?.toArray()) || []

  useEffect(() => {
    // Validate on data change
    validateForm()

    // Auto-save to parent
    if (onUpdate) {
      onUpdate(formData)
    }
  }, [formData])

  const validateForm = () => {
    const warnings = []

    // Kegiatan validation
    if (!formData.kegiatan.nama?.trim()) {
      warnings.push('Nama kegiatan belum diisi')
    }
    if (!formData.kegiatan.kode?.trim()) {
      warnings.push('Kode kegiatan (MAK/Output) belum diisi')
    }
    if (!formData.kegiatan.pagu || formData.kegiatan.pagu <= 0) {
      warnings.push('Pagu kegiatan belum diisi')
    }

    // Pejabat validation
    if (!formData.pejabat.ppk?.nama) {
      warnings.push('PPK belum dipilih')
    }

    // Satker validation
    if (!formData.settings.satkerNama?.trim()) {
      warnings.push('Nama satuan kerja belum diisi')
    }
    if (!formData.settings.kotaSatker?.trim()) {
      warnings.push('Kota satuan kerja belum dipilih')
    }

    setValidation({
      isValid: warnings.length === 0,
      warnings
    })
  }

  const handleKegiatanChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      kegiatan: {
        ...prev.kegiatan,
        [field]: value
      }
    }))
  }

  const handlePejabatChange = (role, field, value) => {
    setFormData(prev => ({
      ...prev,
      pejabat: {
        ...prev.pejabat,
        [role]: {
          ...prev.pejabat[role],
          [field]: value
        }
      }
    }))
  }

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }

  const handlePejabatSelect = (role, pegawaiId) => {
    const pegawai = pejabatList.find(p => p.id === parseInt(pegawaiId))
    if (pegawai) {
      setFormData(prev => ({
        ...prev,
        pejabat: {
          ...prev.pejabat,
          [role]: {
            id: pegawai.id,
            nama: pegawai.nama,
            nip: pegawai.nip,
            pangkat: pegawai.pangkat || '',
            jabatan: pegawai.jabatan || ''
          }
        }
      }))
    }
  }

  const handleKotaSelect = (kotaId) => {
    const kota = kotaList.find(k => k.id === parseInt(kotaId))
    if (kota) {
      handleSettingsChange('kotaSatker', kota.nama)
      handleSettingsChange('provinsiSatker', kota.provinsi || '')
    }
  }

  // DIPA handlers
  const handleDipaRevisionChange = (revision) => {
    setFormData(prev => ({
      ...prev,
      kegiatan: {
        ...prev.kegiatan,
        dipaRevision: revision,
        dipaItem: null // Reset item when revision changes
      }
    }))
  }

  const handleDipaItemChange = (item) => {
    setFormData(prev => ({
      ...prev,
      kegiatan: {
        ...prev.kegiatan,
        dipaItem: item,
        // Auto-populate from DIPA item
        kode: item?.kode || prev.kegiatan.kode,
        nama: item?.uraian || prev.kegiatan.nama,
        pagu: item?.pagu || prev.kegiatan.pagu
      }
    }))
  }

  const isReadOnly = mode === 'readonly'

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-2">
                Perhatian - Data belum lengkap
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                ⓘ Anda tetap bisa melanjutkan, tetapi kelengkapan data akan mempengaruhi kualitas dokumen yang di-generate.
              </p>
            </div>
          </div>
        </div>
      )}

      {validation.isValid && mode !== 'normal' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Data lengkap dan valid</span>
          </div>
        </div>
      )}

      {/* Section 1: Data Kegiatan */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Data Kegiatan</h3>
            <p className="text-sm text-gray-600">Informasi dasar kegiatan yang akan dipertanggungjawabkan</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nama Kegiatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.kegiatan.nama}
              onChange={(e) => handleKegiatanChange('nama', e.target.value)}
              disabled={isReadOnly}
              placeholder="Contoh: Pengadaan Peralatan Kantor"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nama kegiatan sesuai DPA/POK
            </p>
          </div>

          {/* Tahun Anggaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tahun Anggaran <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.kegiatan.tahun}
              onChange={(e) => handleKegiatanChange('tahun', parseInt(e.target.value))}
              disabled={isReadOnly}
              min="2020"
              max="2030"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* DIPA Integration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Integrasi DIPA</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Pilih revisi DIPA dan MAK untuk auto-populate data kegiatan dan validasi pagu
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* DIPA Revision Selector */}
              <DipaRevisionSelector
                year={formData.kegiatan.tahun}
                value={formData.kegiatan.dipaRevision}
                onChange={handleDipaRevisionChange}
                label="Revisi DIPA"
                disabled={isReadOnly}
                helper="Pilih revisi DIPA yang akan digunakan untuk kegiatan ini"
              />

              {/* DIPA Item (MAK) Selector */}
              <DipaItemSelector
                year={formData.kegiatan.tahun}
                revision={formData.kegiatan.dipaRevision}
                value={formData.kegiatan.dipaItem}
                onChange={handleDipaItemChange}
                label="MAK (Mata Anggaran Kegiatan)"
                levelFilter="akun"
                showPaguInfo={true}
                disabled={isReadOnly}
                helper="Pilih MAK dari DIPA. Data kode, nama, dan pagu akan auto-populate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kode MAK/Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode MAK/Output <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.kegiatan.kode}
                onChange={(e) => handleKegiatanChange('kode', e.target.value)}
                disabled={isReadOnly || !!formData.kegiatan.dipaItem}
                placeholder="Contoh: 524111"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.kegiatan.dipaItem
                  ? 'Auto-populated dari DIPA'
                  : '6 digit kode MAK atau input manual'}
              </p>
            </div>

            {/* Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output/Komponen
              </label>
              <input
                type="text"
                value={formData.kegiatan.output || ''}
                onChange={(e) => handleKegiatanChange('output', e.target.value)}
                disabled={isReadOnly}
                placeholder="Opsional"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Pagu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pagu Kegiatan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-500">Rp</div>
              <input
                type="text"
                value={formData.kegiatan.pagu > 0 ? formatRupiah(formData.kegiatan.pagu).replace('Rp', '').trim() : ''}
                onChange={(e) => {
                  const value = parseRupiah(e.target.value)
                  handleKegiatanChange('pagu', value)
                }}
                disabled={isReadOnly || !!formData.kegiatan.dipaItem}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            {formData.kegiatan.pagu > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formatRupiah(formData.kegiatan.pagu)}
              </p>
            )}
            {formData.kegiatan.dipaItem && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-populated dari DIPA
              </p>
            )}

            {/* DIPA Validation Warning */}
            {formData.kegiatan.dipaItem && formData.kegiatan.pagu > formData.kegiatan.dipaItem.sisa && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800">
                  <p className="font-medium">Perhatian: Pagu melebihi sisa DIPA</p>
                  <p className="mt-1">
                    Sisa pagu DIPA: <span className="font-mono">{formatRupiah(formData.kegiatan.dipaItem.sisa)}</span>
                  </p>
                  <p className="mt-0.5">
                    Kekurangan: <span className="font-mono text-red-600">{formatRupiah(formData.kegiatan.pagu - formData.kegiatan.dipaItem.sisa)}</span>
                  </p>
                </div>
              </div>
            )}

            {formData.kegiatan.dipaItem && formData.kegiatan.pagu <= formData.kegiatan.dipaItem.sisa && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-green-800">
                  <p className="font-medium">✓ Pagu sesuai dengan sisa DIPA</p>
                  <p className="mt-1">
                    Sisa setelah kegiatan ini: <span className="font-mono">{formatRupiah(formData.kegiatan.dipaItem.sisa - formData.kegiatan.pagu)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Data Pejabat */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Data Pejabat</h3>
            <p className="text-sm text-gray-600">Pilih pejabat yang terlibat dalam proses ini</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* PPK */}
          <PejabatSelector
            label="Pejabat Pembuat Komitmen (PPK)"
            role="ppk"
            data={formData.pejabat.ppk}
            pejabatList={pejabatList}
            onSelect={handlePejabatSelect}
            onChange={handlePejabatChange}
            required
            disabled={isReadOnly}
          />

          {/* PPSPM */}
          <PejabatSelector
            label="Pejabat Penguji SPM (PPSPM)"
            role="ppspm"
            data={formData.pejabat.ppspm}
            pejabatList={pejabatList}
            onSelect={handlePejabatSelect}
            onChange={handlePejabatChange}
            disabled={isReadOnly}
          />

          {/* KPA */}
          <PejabatSelector
            label="Kuasa Pengguna Anggaran (KPA)"
            role="kpa"
            data={formData.pejabat.kpa}
            pejabatList={pejabatList}
            onSelect={handlePejabatSelect}
            onChange={handlePejabatChange}
            disabled={isReadOnly}
          />

          {/* Bendahara */}
          <PejabatSelector
            label="Bendahara Pengeluaran"
            role="bendahara"
            data={formData.pejabat.bendahara}
            pejabatList={pejabatList}
            onSelect={handlePejabatSelect}
            onChange={handlePejabatChange}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Section 3: Data Satker */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Data Satuan Kerja</h3>
            <p className="text-sm text-gray-600">Informasi satuan kerja Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Satker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Satuan Kerja <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.settings.satkerNama}
                onChange={(e) => handleSettingsChange('satkerNama', e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Balai Besar Karantina Ikan..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Kode Satker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Satker
              </label>
              <input
                type="text"
                value={formData.settings.kodeSatker || ''}
                onChange={(e) => handleSettingsChange('kodeSatker', e.target.value)}
                disabled={isReadOnly}
                placeholder="6 digit"
                maxLength="6"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat Lengkap
            </label>
            <textarea
              value={formData.settings.alamatSatker || ''}
              onChange={(e) => handleSettingsChange('alamatSatker', e.target.value)}
              disabled={isReadOnly}
              rows="2"
              placeholder="Jalan, Nomor, Kelurahan, Kecamatan"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kota/Kabupaten <span className="text-red-500">*</span>
              </label>
              {kotaList.length > 0 ? (
                <select
                  value={kotaList.find(k => k.nama === formData.settings.kotaSatker)?.id || ''}
                  onChange={(e) => handleKotaSelect(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map(kota => (
                    <option key={kota.id} value={kota.id}>
                      {kota.nama}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.settings.kotaSatker}
                  onChange={(e) => handleSettingsChange('kotaSatker', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Nama Kota/Kabupaten"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              )}
            </div>

            {/* Provinsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provinsi
              </label>
              <input
                type="text"
                value={formData.settings.provinsiSatker || ''}
                onChange={(e) => handleSettingsChange('provinsiSatker', e.target.value)}
                disabled={isReadOnly}
                placeholder="Auto-fill dari kota"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">💡 Tips Pengisian</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Data yang diisi di sini akan otomatis terisi ke semua dokumen yang di-generate</li>
              <li>• Pastikan nama dan NIP pejabat sudah benar untuk menghindari revisi</li>
              <li>• Jika data pejabat tidak tersedia di dropdown, tambahkan di menu Master Data Pegawai</li>
              <li>• Field yang bertanda * (bintang) wajib diisi untuk hasil optimal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

const PejabatSelector = ({
  label,
  role,
  data,
  pejabatList,
  onSelect,
  onChange,
  required = false,
  disabled = false
}) => {
  const [isManual, setIsManual] = useState(false)

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          disabled={disabled}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {isManual ? 'Pilih dari Master' : 'Input Manual'}
        </button>
      </div>

      {!isManual && pejabatList.length > 0 ? (
        <div className="mb-3">
          <select
            value={data.id || ''}
            onChange={(e) => onSelect(role, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Pilih {label}</option>
            {pejabatList.map(pejabat => (
              <option key={pejabat.id} value={pejabat.id}>
                {pejabat.nama} - {pejabat.nip}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {(isManual || data.nama) && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={data.nama || ''}
              onChange={(e) => onChange(role, 'nama', e.target.value)}
              disabled={disabled}
              placeholder="Nama Lengkap"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <input
              type="text"
              value={data.nip || ''}
              onChange={(e) => onChange(role, 'nip', e.target.value)}
              disabled={disabled}
              placeholder="NIP (18 digit)"
              maxLength="18"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={data.pangkat || ''}
              onChange={(e) => onChange(role, 'pangkat', e.target.value)}
              disabled={disabled}
              placeholder="Pangkat/Golongan (opsional)"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <input
              type="text"
              value={data.jabatan || ''}
              onChange={(e) => onChange(role, 'jabatan', e.target.value)}
              disabled={disabled}
              placeholder="Jabatan (opsional)"
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterActivityForm
