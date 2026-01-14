/**
 * ============================================================================
 * MASTER DATA VALIDATOR - Validation Engine untuk Master Data
 * ============================================================================
 *
 * Comprehensive validation engine untuk memastikan konsistensi dan kebenaran
 * Master Data Kegiatan sesuai dengan business rules, aturan hukum, dan
 * logical constraints.
 *
 * Validation Types:
 * 1. Field-level validation (format, length, type)
 * 2. Cross-field validation (dependencies between fields)
 * 3. Business rules validation (kontrak vs pagu, tanggal logic, dll)
 * 4. Document-specific validation (SPR, SPPR, BAST, dll)
 * 5. Legal/regulatory validation (aturan pemerintah)
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import {
  isValidNIP,
  isValidNPWP,
  isValidNIK,
  isValidKodeSatker,
  isValidEmail,
  calculateNilaiDibayar,
  sumPotongan
} from './masterDataHelpers'

/**
 * Validation error object structure
 *
 * @typedef {Object} ValidationError
 * @property {string} field - Field path (e.g., "ppk.nip")
 * @property {string} message - Error message
 * @property {string} [type] - Error type (required, format, business, etc.)
 * @property {*} [value] - Current value
 */

/**
 * Validation result object
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - True jika semua valid
 * @property {Object<string, string>} errors - Object dengan key=field, value=error message
 * @property {string[]} warnings - Array of warning messages
 */

/**
 * Validate required fields
 *
 * @param {Object} data - Data yang akan divalidasi
 * @param {string[]} requiredFields - Array of required field paths
 * @returns {Object<string, string>} Errors object
 * @private
 */
function validateRequiredFields(data, requiredFields) {
  const errors = {}

  for (const fieldPath of requiredFields) {
    const value = getNestedValue(data, fieldPath)

    if (value === undefined || value === null || value === '') {
      errors[fieldPath] = `${fieldPath} wajib diisi`
    }
  }

  return errors
}

/**
 * Get nested value from object using dot notation
 *
 * @param {Object} obj - Object
 * @param {string} path - Path with dot notation (e.g., "ppk.nip")
 * @returns {*} Value atau undefined
 * @private
 *
 * @example
 * getNestedValue({ ppk: { nip: "123" } }, "ppk.nip") // "123"
 */
function getNestedValue(obj, path) {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    // Handle array notation (e.g., "pphp[0].nama")
    const arrayMatch = key.match(/^(.+?)\[(\d+)\]$/)

    if (arrayMatch) {
      const arrayKey = arrayMatch[1]
      const index = parseInt(arrayMatch[2], 10)
      current = current?.[arrayKey]?.[index]
    } else {
      current = current?.[key]
    }

    if (current === undefined) {
      return undefined
    }
  }

  return current
}

/**
 * Validate Step 1: Data Satker & Pejabat
 *
 * @param {Object} masterData - Master data object
 * @returns {Object<string, string>} Errors
 */
export function validateStep1SatkerPejabat(masterData) {
  const errors = {}

  // Required fields untuk satker
  const satkerRequired = [
    'satker.kode',
    'satker.nama',
    'satker.alamat.jalan',
    'satker.alamat.kota',
    'satker.alamat.provinsi'
  ]

  Object.assign(errors, validateRequiredFields(masterData, satkerRequired))

  // Validate kode satker format
  if (masterData.satker?.kode && !isValidKodeSatker(masterData.satker.kode)) {
    errors['satker.kode'] = 'Kode Satker harus 6 digit angka'
  }

  // Validate email satker jika ada
  if (masterData.satker?.email && !isValidEmail(masterData.satker.email)) {
    errors['satker.email'] = 'Format email tidak valid'
  }

  // Validate KPA
  const kpaRequired = ['pejabat.kpa.nama', 'pejabat.kpa.nip', 'pejabat.kpa.jabatan']
  Object.assign(errors, validateRequiredFields(masterData, kpaRequired))

  if (masterData.pejabat?.kpa?.nip && !isValidNIP(masterData.pejabat.kpa.nip)) {
    errors['pejabat.kpa.nip'] = 'NIP KPA harus 18 digit angka'
  }

  // Validate PPK
  const ppkRequired = ['pejabat.ppk.nama', 'pejabat.ppk.nip', 'pejabat.ppk.jabatan']
  Object.assign(errors, validateRequiredFields(masterData, ppkRequired))

  if (masterData.pejabat?.ppk?.nip && !isValidNIP(masterData.pejabat.ppk.nip)) {
    errors['pejabat.ppk.nip'] = 'NIP PPK harus 18 digit angka'
  }

  // Validate Bendahara
  const bendaharaRequired = ['pejabat.bendahara.nama', 'pejabat.bendahara.nip']
  Object.assign(errors, validateRequiredFields(masterData, bendaharaRequired))

  if (masterData.pejabat?.bendahara?.nip && !isValidNIP(masterData.pejabat.bendahara.nip)) {
    errors['pejabat.bendahara.nip'] = 'NIP Bendahara harus 18 digit angka'
  }

  // Validate PPHP (at least 1 required)
  if (!masterData.pejabat?.pphp || masterData.pejabat.pphp.length === 0) {
    errors['pejabat.pphp'] = 'Minimal harus ada 1 PPHP'
  } else {
    masterData.pejabat.pphp.forEach((pphp, index) => {
      if (!pphp.nama) {
        errors[`pejabat.pphp[${index}].nama`] = 'Nama PPHP wajib diisi'
      }
      if (!pphp.nip) {
        errors[`pejabat.pphp[${index}].nip`] = 'NIP PPHP wajib diisi'
      } else if (!isValidNIP(pphp.nip)) {
        errors[`pejabat.pphp[${index}].nip`] = 'NIP PPHP harus 18 digit angka'
      }
    })
  }

  return errors
}

/**
 * Validate Step 2: Data Kegiatan & Anggaran
 *
 * @param {Object} masterData - Master data object
 * @returns {Object<string, string>} Errors
 */
export function validateStep2KegiatanAnggaran(masterData) {
  const errors = {}

  // Required fields untuk kegiatan
  const kegiatanRequired = [
    'kegiatan.program.nama',
    'kegiatan.kegiatan.nama',
    'kegiatan.output.nama',
    'kegiatan.akun.kode',
    'kegiatan.akun.nama',
    'kegiatan.uraian',
    'kegiatan.waktu.mulai',
    'kegiatan.waktu.selesai'
  ]

  Object.assign(errors, validateRequiredFields(masterData, kegiatanRequired))

  // Validate tanggal logic
  const { mulai, selesai } = masterData.kegiatan?.waktu || {}

  if (mulai && selesai) {
    const startDate = new Date(mulai)
    const endDate = new Date(selesai)

    if (endDate < startDate) {
      errors['kegiatan.waktu.selesai'] = 'Tanggal selesai tidak boleh sebelum tanggal mulai'
    }
  }

  // Required fields untuk anggaran
  const anggaranRequired = [
    'anggaran.sumberDana',
    'anggaran.pagu',
    'anggaran.nilaiKontrak'
  ]

  Object.assign(errors, validateRequiredFields(masterData, anggaranRequired))

  // Business rule: nilai kontrak tidak boleh melebihi pagu
  const { pagu, nilaiKontrak } = masterData.anggaran || {}

  if (pagu !== undefined && nilaiKontrak !== undefined) {
    if (nilaiKontrak > pagu) {
      errors['anggaran.nilaiKontrak'] = `Nilai kontrak (${nilaiKontrak.toLocaleString('id-ID')}) tidak boleh melebihi pagu (${pagu.toLocaleString('id-ID')})`
    }
  }

  // Validate nilai kontrak & pagu > 0
  if (nilaiKontrak !== undefined && nilaiKontrak <= 0) {
    errors['anggaran.nilaiKontrak'] = 'Nilai kontrak harus lebih dari 0'
  }

  if (pagu !== undefined && pagu <= 0) {
    errors['anggaran.pagu'] = 'Pagu anggaran harus lebih dari 0'
  }

  // Validate potongan tidak melebihi nilai kontrak
  const { potongan } = masterData.anggaran || {}
  if (potongan && nilaiKontrak) {
    const totalPotongan = sumPotongan(potongan)
    if (totalPotongan > nilaiKontrak) {
      errors['anggaran.potongan'] = `Total potongan (${totalPotongan.toLocaleString('id-ID')}) tidak boleh melebihi nilai kontrak`
    }
  }

  return errors
}

/**
 * Validate Step 3: Data Penyedia
 *
 * @param {Object} masterData - Master data object
 * @returns {Object<string, string>} Errors
 */
export function validateStep3Penyedia(masterData) {
  const errors = {}

  // Required fields
  const penyediaRequired = [
    'penyedia.jenis',
    'penyedia.nama',
    'penyedia.alamat.jalan',
    'penyedia.alamat.kota'
  ]

  Object.assign(errors, validateRequiredFields(masterData, penyediaRequired))

  // Validate NPWP jika ada
  const { npwp } = masterData.penyedia?.identitas || {}
  if (npwp && !isValidNPWP(npwp)) {
    errors['penyedia.identitas.npwp'] = 'NPWP harus 15 digit angka'
  }

  // Validate NIK jika ada
  const { nik } = masterData.penyedia?.identitas || {}
  if (nik && !isValidNIK(nik)) {
    errors['penyedia.identitas.nik'] = 'NIK harus 16 digit angka'
  }

  // Jika jenis badan usaha, pimpinan wajib diisi
  if (masterData.penyedia?.jenis === 'badan_usaha') {
    if (!masterData.penyedia?.pimpinan) {
      errors['penyedia.pimpinan'] = 'Nama pimpinan/direktur wajib diisi untuk badan usaha'
    }
  }

  return errors
}

/**
 * Validate Step 4: Data Bank & Pembayaran
 *
 * @param {Object} masterData - Master data object
 * @returns {Object<string, string>} Errors
 */
export function validateStep4BankPembayaran(masterData) {
  const errors = {}

  // Required fields
  const bankRequired = [
    'bank.namaBank',
    'bank.nomorRekening',
    'bank.atasNama'
  ]

  Object.assign(errors, validateRequiredFields(masterData, bankRequired))

  // Validate nomor rekening (10-16 digit)
  const { nomorRekening } = masterData.bank || {}
  if (nomorRekening && !/^[0-9]{10,16}$/.test(nomorRekening)) {
    errors['bank.nomorRekening'] = 'Nomor rekening harus 10-16 digit angka'
  }

  // Validate atas nama sesuai dengan nama penyedia (warning saja)
  const { atasNama } = masterData.bank || {}
  const { nama: namaPenyedia } = masterData.penyedia || {}

  if (atasNama && namaPenyedia && atasNama.toLowerCase() !== namaPenyedia.toLowerCase()) {
    // Ini warning, bukan error (tidak menghalangi submit)
    errors['bank.atasNama.warning'] = 'Nama pemilik rekening berbeda dengan nama penyedia. Pastikan sudah benar.'
  }

  return errors
}

/**
 * Validate Step 5: Nomor & Tanggal Dokumen
 *
 * @param {Object} masterData - Master data object
 * @returns {Object<string, string>} Errors
 */
export function validateStep5Dokumen(masterData) {
  const errors = {}

  // Required: Kontrak (minimal)
  const kontrakRequired = [
    'dokumen.kontrak.nomor',
    'dokumen.kontrak.tanggal'
  ]

  Object.assign(errors, validateRequiredFields(masterData, kontrakRequired))

  // Validate tanggal logic
  const { kontrak, bast, bap, sppr, spr } = masterData.dokumen || {}

  // Tanggal kontrak harus sebelum atau sama dengan tanggal kegiatan mulai
  if (kontrak?.tanggal && masterData.kegiatan?.waktu?.mulai) {
    const tanggalKontrak = new Date(kontrak.tanggal)
    const tanggalMulai = new Date(masterData.kegiatan.waktu.mulai)

    if (tanggalKontrak > tanggalMulai) {
      errors['dokumen.kontrak.tanggal'] = 'Tanggal kontrak tidak boleh setelah tanggal mulai kegiatan'
    }
  }

  // Tanggal BAST harus setelah atau sama dengan tanggal selesai kegiatan
  if (bast?.tanggal && masterData.kegiatan?.waktu?.selesai) {
    const tanggalBast = new Date(bast.tanggal)
    const tanggalSelesai = new Date(masterData.kegiatan.waktu.selesai)

    if (tanggalBast < tanggalSelesai) {
      errors['dokumen.bast.tanggal'] = 'Tanggal BAST tidak boleh sebelum tanggal selesai kegiatan'
    }
  }

  // Tanggal BAP harus sebelum atau sama dengan tanggal BAST
  if (bap?.tanggal && bast?.tanggal) {
    const tanggalBap = new Date(bap.tanggal)
    const tanggalBast = new Date(bast.tanggal)

    if (tanggalBap > tanggalBast) {
      errors['dokumen.bap.tanggal'] = 'Tanggal BAP tidak boleh setelah tanggal BAST'
    }
  }

  // Tanggal SPPR harus sebelum atau sama dengan tanggal SPR
  if (sppr?.tanggal && spr?.tanggal) {
    const tanggalSppr = new Date(sppr.tanggal)
    const tanggalSpr = new Date(spr.tanggal)

    if (tanggalSppr > tanggalSpr) {
      errors['dokumen.sppr.tanggal'] = 'Tanggal SPPR tidak boleh setelah tanggal SPR'
    }
  }

  // Tanggal SPR harus setelah atau sama dengan tanggal BAST
  if (spr?.tanggal && bast?.tanggal) {
    const tanggalSpr = new Date(spr.tanggal)
    const tanggalBast = new Date(bast.tanggal)

    if (tanggalSpr < tanggalBast) {
      errors['dokumen.spr.tanggal'] = 'Tanggal SPR tidak boleh sebelum tanggal BAST'
    }
  }

  return errors
}

/**
 * Validate Master Data untuk specific step
 *
 * @param {Object} masterData - Master data object
 * @param {string} step - Step ID ('satker', 'kegiatan', 'penyedia', 'bank', 'dokumen', 'review')
 * @returns {Object<string, string>} Errors
 *
 * @example
 * const errors = validateMasterData(masterData, 'satker')
 * if (Object.keys(errors).length > 0) {
 *   console.log('Validation failed:', errors)
 * }
 */
export function validateMasterData(masterData, step = 'review') {
  if (!masterData || typeof masterData !== 'object') {
    return { _general: 'Master data tidak valid' }
  }

  let errors = {}

  switch (step) {
    case 'satker':
      errors = validateStep1SatkerPejabat(masterData)
      break

    case 'kegiatan':
      errors = {
        ...validateStep1SatkerPejabat(masterData),
        ...validateStep2KegiatanAnggaran(masterData)
      }
      break

    case 'penyedia':
      errors = {
        ...validateStep1SatkerPejabat(masterData),
        ...validateStep2KegiatanAnggaran(masterData),
        ...validateStep3Penyedia(masterData)
      }
      break

    case 'bank':
      errors = {
        ...validateStep1SatkerPejabat(masterData),
        ...validateStep2KegiatanAnggaran(masterData),
        ...validateStep3Penyedia(masterData),
        ...validateStep4BankPembayaran(masterData)
      }
      break

    case 'dokumen':
      errors = {
        ...validateStep1SatkerPejabat(masterData),
        ...validateStep2KegiatanAnggaran(masterData),
        ...validateStep3Penyedia(masterData),
        ...validateStep4BankPembayaran(masterData),
        ...validateStep5Dokumen(masterData)
      }
      break

    case 'review':
      // Validate semua steps
      errors = {
        ...validateStep1SatkerPejabat(masterData),
        ...validateStep2KegiatanAnggaran(masterData),
        ...validateStep3Penyedia(masterData),
        ...validateStep4BankPembayaran(masterData),
        ...validateStep5Dokumen(masterData)
      }
      break

    default:
      errors = { _general: 'Step tidak dikenali' }
  }

  return errors
}

/**
 * Validate Master Data untuk generate specific dokumen
 *
 * @param {Object} masterData - Master data object
 * @param {string} dokumen - Dokumen type ('SPR', 'SPPR', 'BAST', dll)
 * @returns {ValidationResult} Validation result
 *
 * @example
 * const result = validateForDocument(masterData, 'SPR')
 * if (!result.isValid) {
 *   console.log('Cannot generate SPR:', result.errors)
 * }
 */
export function validateForDocument(masterData, dokumen) {
  // Mapping field requirements dari field-mapping.json
  const documentRequirements = {
    SPR: [
      'dokumen.spr.nomor', 'dokumen.spr.tanggal',
      'satker.nama', 'satker.kode', 'satker.alamat.lengkap',
      'pejabat.ppk.nama', 'pejabat.ppk.nip', 'pejabat.ppk.jabatan',
      'kegiatan.program.nama', 'kegiatan.kegiatan.nama', 'kegiatan.akun.kode',
      'anggaran.nilaiKontrak', 'anggaran.nilaiDibayar',
      'penyedia.nama', 'bank.namaBank', 'bank.nomorRekening',
      'dokumen.kontrak.nomor'
    ],
    SPPR: [
      'dokumen.sppr.nomor', 'dokumen.sppr.tanggal',
      'satker.nama', 'pejabat.ppk.nama', 'pejabat.ppk.nip',
      'kegiatan.kegiatan.nama', 'kegiatan.output.nama', 'kegiatan.uraian',
      'kegiatan.waktu.mulai', 'kegiatan.waktu.selesai',
      'anggaran.nilaiKontrak', 'penyedia.nama',
      'dokumen.kontrak.nomor', 'dokumen.bast.nomor'
    ],
    BAST: [
      'dokumen.bast.nomor', 'dokumen.bast.tanggal',
      'satker.nama', 'pejabat.ppk.nama', 'pejabat.ppk.nip',
      'pejabat.pphp', // at least one
      'kegiatan.kegiatan.nama', 'kegiatan.output.nama', 'kegiatan.uraian',
      'anggaran.nilaiKontrak', 'penyedia.nama',
      'dokumen.kontrak.nomor'
    ],
    // ... bisa ditambahkan untuk dokumen lain
  }

  const requiredFields = documentRequirements[dokumen] || []
  const errors = validateRequiredFields(masterData, requiredFields)

  // Additional business rules check
  const businessErrors = validateMasterData(masterData, 'review')

  // Merge errors
  const allErrors = { ...businessErrors, ...errors }

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    warnings: []
  }
}

/**
 * Get validation summary (for display)
 *
 * @param {Object<string, string>} errors - Errors object
 * @returns {Object} Summary
 *
 * @example
 * const summary = getValidationSummary(errors)
 * // { total: 5, critical: 3, warnings: 2, byCategory: {...} }
 */
export function getValidationSummary(errors) {
  if (!errors || typeof errors !== 'object') {
    return {
      total: 0,
      critical: 0,
      warnings: 0,
      byCategory: {}
    }
  }

  const total = Object.keys(errors).length
  let critical = 0
  let warnings = 0
  const byCategory = {}

  for (const [field, message] of Object.entries(errors)) {
    // Warnings have ".warning" suffix
    if (field.endsWith('.warning')) {
      warnings++
    } else {
      critical++
    }

    // Categorize by top-level key
    const category = field.split('.')[0]
    byCategory[category] = (byCategory[category] || 0) + 1
  }

  return {
    total,
    critical,
    warnings,
    byCategory
  }
}

// Default export
export default {
  validateMasterData,
  validateStep1SatkerPejabat,
  validateStep2KegiatanAnggaran,
  validateStep3Penyedia,
  validateStep4BankPembayaran,
  validateStep5Dokumen,
  validateForDocument,
  getValidationSummary
}
