/**
 * ============================================================================
 * MASTER DATA HELPERS - Fungsi Bantu untuk Master Data Kegiatan
 * ============================================================================
 *
 * Collection of helper functions untuk manipulasi dan formatting data
 * dalam konteks Master Data Kegiatan (Single Source of Truth).
 *
 * Semua fungsi bersifat:
 * - Pure function (no side effects)
 * - Reusable
 * - Testable
 * - Type-safe (dengan JSDoc)
 *
 * Digunakan oleh:
 * - MasterDataWizard
 * - Document Generators (SPR, SPPR, BAST, dll)
 * - Validation Engine
 * - Database Services
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { toTerbilang } from './terbilangGenerator'

/**
 * Generate unique Master Data ID
 *
 * Format: MDK-YYYY-NNNNNN
 * - MDK = Master Data Kegiatan
 * - YYYY = Tahun anggaran
 * - NNNNNN = Sequential number (padded 6 digits)
 *
 * @param {number} tahunAnggaran - Tahun anggaran (2000-2100)
 * @param {number} [sequenceNumber=1] - Nomor urut (default: 1)
 * @returns {string} Master Data ID
 *
 * @throws {Error} Jika tahun tidak valid
 *
 * @example
 * generateMasterId(2024)     // "MDK-2024-000001"
 * generateMasterId(2024, 25) // "MDK-2024-000025"
 * generateMasterId(2024, 123) // "MDK-2024-000123"
 */
export function generateMasterId(tahunAnggaran, sequenceNumber = 1) {
  // Validasi tahun
  if (!tahunAnggaran || tahunAnggaran < 2000 || tahunAnggaran > 2100) {
    throw new Error('Tahun anggaran harus antara 2000 - 2100')
  }

  // Validasi sequence number
  if (sequenceNumber < 1 || sequenceNumber > 999999) {
    throw new Error('Sequence number harus antara 1 - 999999')
  }

  // Pad sequence dengan 6 digit
  const paddedSequence = String(sequenceNumber).padStart(6, '0')

  return `MDK-${tahunAnggaran}-${paddedSequence}`
}

/**
 * Generate Master Data ID dari database (auto-increment)
 *
 * Fungsi ini akan query database untuk mendapatkan nomor urut terakhir
 * pada tahun tertentu, lalu increment.
 *
 * @param {number} tahunAnggaran - Tahun anggaran
 * @param {Function} getLastSequence - Async function untuk get last sequence dari DB
 * @returns {Promise<string>} Master Data ID
 *
 * @example
 * const id = await generateMasterIdFromDB(2024, async (tahun) => {
 *   const lastData = await db.masterData
 *     .where('tahunAnggaran').equals(tahun)
 *     .last()
 *   return lastData ? extractSequence(lastData.id) : 0
 * })
 * // "MDK-2024-000042"
 */
export async function generateMasterIdFromDB(tahunAnggaran, getLastSequence) {
  const lastSequence = await getLastSequence(tahunAnggaran)
  const nextSequence = (lastSequence || 0) + 1
  return generateMasterId(tahunAnggaran, nextSequence)
}

/**
 * Extract sequence number dari Master Data ID
 *
 * @param {string} masterId - Master Data ID (format: MDK-YYYY-NNNNNN)
 * @returns {number} Sequence number
 *
 * @throws {Error} Jika format ID tidak valid
 *
 * @example
 * extractSequence("MDK-2024-000042") // 42
 * extractSequence("MDK-2024-001234") // 1234
 */
export function extractSequence(masterId) {
  if (typeof masterId !== 'string') {
    throw new Error('Master ID harus berupa string')
  }

  const match = masterId.match(/^MDK-(\d{4})-(\d{6})$/)
  if (!match) {
    throw new Error('Format Master ID tidak valid. Expected: MDK-YYYY-NNNNNN')
  }

  return parseInt(match[2], 10)
}

/**
 * Calculate durasi (selisih hari) antara dua tanggal
 *
 * @param {string|Date} startDate - Tanggal mulai (ISO string or Date object)
 * @param {string|Date} endDate - Tanggal selesai (ISO string or Date object)
 * @returns {number} Durasi dalam hari (integer)
 *
 * @throws {Error} Jika tanggal tidak valid atau endDate < startDate
 *
 * @example
 * calculateDuration('2024-01-01', '2024-01-31')
 * // 30
 *
 * calculateDuration(new Date('2024-01-15'), new Date('2024-03-30'))
 * // 75
 */
export function calculateDuration(startDate, endDate) {
  // Convert to Date objects jika masih string
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  // Validasi tanggal
  if (isNaN(start.getTime())) {
    throw new Error('Tanggal mulai tidak valid')
  }

  if (isNaN(end.getTime())) {
    throw new Error('Tanggal selesai tidak valid')
  }

  if (end < start) {
    throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai')
  }

  // Hitung selisih dalam milliseconds, convert ke hari
  const diffMs = end - start
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Format object alamat menjadi string lengkap
 *
 * @param {Object} alamatObj - Object alamat
 * @param {string} alamatObj.jalan - Nama jalan
 * @param {string} [alamatObj.kelurahan] - Kelurahan
 * @param {string} [alamatObj.kecamatan] - Kecamatan
 * @param {string} [alamatObj.kota] - Kota/Kabupaten
 * @param {string} [alamatObj.provinsi] - Provinsi
 * @param {string} [alamatObj.kodePos] - Kode pos
 * @returns {string} Alamat lengkap (format: jalan, kelurahan, kecamatan, kota, provinsi kodePos)
 *
 * @example
 * formatAlamat({
 *   jalan: "Jl. Sudirman No. 45",
 *   kelurahan: "Karet Tengsin",
 *   kecamatan: "Tanah Abang",
 *   kota: "Jakarta Pusat",
 *   provinsi: "DKI Jakarta",
 *   kodePos: "10220"
 * })
 * // "Jl. Sudirman No. 45, Karet Tengsin, Tanah Abang, Jakarta Pusat, DKI Jakarta 10220"
 */
export function formatAlamat(alamatObj) {
  if (!alamatObj || typeof alamatObj !== 'object') {
    return ''
  }

  const {
    jalan = '',
    kelurahan = '',
    kecamatan = '',
    kota = '',
    provinsi = '',
    kodePos = ''
  } = alamatObj

  // Filter out empty values dan join dengan koma
  const parts = [jalan, kelurahan, kecamatan, kota, provinsi]
    .filter(part => part && part.trim())
    .map(part => part.trim())

  let result = parts.join(', ')

  // Tambahkan kode pos (tanpa koma)
  if (kodePos && kodePos.trim()) {
    result += ' ' + kodePos.trim()
  }

  return result
}

/**
 * Sum (jumlahkan) semua potongan pajak
 *
 * @param {Object} potonganObj - Object berisi potongan pajak
 * @param {number} [potonganObj.pph21=0] - PPh 21
 * @param {number} [potonganObj.pph22=0] - PPh 22
 * @param {number} [potonganObj.pph23=0] - PPh 23
 * @param {number} [potonganObj.ppn=0] - PPN
 * @returns {number} Total potongan
 *
 * @example
 * sumPotongan({ pph23: 450000, ppn: 0 })
 * // 450000
 *
 * sumPotongan({ pph21: 100000, pph23: 200000, ppn: 50000 })
 * // 350000
 */
export function sumPotongan(potonganObj) {
  if (!potonganObj || typeof potonganObj !== 'object') {
    return 0
  }

  const {
    pph21 = 0,
    pph22 = 0,
    pph23 = 0,
    ppn = 0
  } = potonganObj

  // Pastikan semua nilai adalah number
  const values = [pph21, pph22, pph23, ppn].map(v =>
    typeof v === 'number' && !isNaN(v) ? v : 0
  )

  return values.reduce((sum, val) => sum + val, 0)
}

/**
 * Calculate nilai dibayar (setelah potongan)
 *
 * Formula: nilaiDibayar = nilaiKontrak - totalPotongan
 *
 * @param {number} nilaiKontrak - Nilai kontrak
 * @param {Object} potonganObj - Object potongan pajak
 * @returns {number} Nilai dibayar (setelah potongan)
 *
 * @example
 * calculateNilaiDibayar(45000000, { pph23: 450000 })
 * // 44550000
 */
export function calculateNilaiDibayar(nilaiKontrak, potonganObj) {
  if (typeof nilaiKontrak !== 'number' || isNaN(nilaiKontrak)) {
    throw new Error('Nilai kontrak harus berupa angka yang valid')
  }

  const totalPotongan = sumPotongan(potonganObj)
  return nilaiKontrak - totalPotongan
}

/**
 * Format angka ke format Rupiah (dengan "Rp" dan pemisah ribuan)
 *
 * @param {number} angka - Angka yang akan diformat
 * @param {Object} options - Opsi formatting
 * @param {boolean} [options.withPrefix=true] - Tambahkan "Rp" (default: true)
 * @param {boolean} [options.withDecimal=false] - Tampilkan desimal (default: false)
 * @returns {string} Format Rupiah
 *
 * @example
 * formatRupiah(45000000)
 * // "Rp 45.000.000"
 *
 * formatRupiah(45000000, { withPrefix: false })
 * // "45.000.000"
 *
 * formatRupiah(45123.45, { withDecimal: true })
 * // "Rp 45.123,45"
 */
export function formatRupiah(angka, options = {}) {
  const {
    withPrefix = true,
    withDecimal = false
  } = options

  if (typeof angka !== 'number' || isNaN(angka)) {
    return withPrefix ? 'Rp 0' : '0'
  }

  // Format dengan locale Indonesia
  const formatted = angka.toLocaleString('id-ID', {
    minimumFractionDigits: withDecimal ? 2 : 0,
    maximumFractionDigits: withDecimal ? 2 : 0
  })

  return withPrefix ? `Rp ${formatted}` : formatted
}

/**
 * Parse string Rupiah ke number
 *
 * @param {string} rupiahString - String format Rupiah (contoh: "Rp 45.000.000")
 * @returns {number} Angka
 *
 * @throws {Error} Jika string tidak bisa diparse
 *
 * @example
 * parseRupiah("Rp 45.000.000")   // 45000000
 * parseRupiah("45.000.000")      // 45000000
 * parseRupiah("Rp 45.123,50")    // 45123.50
 */
export function parseRupiah(rupiahString) {
  if (typeof rupiahString !== 'string') {
    throw new Error('Input harus berupa string')
  }

  // Hapus "Rp" dan spasi
  let cleaned = rupiahString
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .trim()

  // Replace koma desimal dengan titik
  cleaned = cleaned.replace(',', '.')

  // Hapus titik pemisah ribuan (kecuali titik desimal)
  // Logika: titik terakhir adalah desimal, sisanya adalah pemisah ribuan
  const lastDotIndex = cleaned.lastIndexOf('.')
  if (lastDotIndex !== -1) {
    const beforeDot = cleaned.substring(0, lastDotIndex).replace(/\./g, '')
    const afterDot = cleaned.substring(lastDotIndex)
    cleaned = beforeDot + afterDot
  }

  const angka = parseFloat(cleaned)

  if (isNaN(angka)) {
    throw new Error('String tidak dapat dikonversi menjadi angka')
  }

  return angka
}

/**
 * Validate NIP (Nomor Induk Pegawai)
 *
 * NIP harus:
 * - 18 digit
 * - Hanya angka
 *
 * @param {string} nip - Nomor Induk Pegawai
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidNIP("196501011990031001") // true
 * isValidNIP("12345")               // false (kurang dari 18 digit)
 * isValidNIP("1965010119900310AB") // false (bukan angka semua)
 */
export function isValidNIP(nip) {
  if (typeof nip !== 'string') {
    return false
  }

  // NIP harus 18 digit dan hanya angka
  return /^[0-9]{18}$/.test(nip)
}

/**
 * Validate NPWP (Nomor Pokok Wajib Pajak)
 *
 * NPWP harus:
 * - 15 digit
 * - Hanya angka
 *
 * @param {string} npwp - Nomor Pokok Wajib Pajak
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidNPWP("123456789012345") // true
 * isValidNPWP("12345")           // false (kurang dari 15 digit)
 */
export function isValidNPWP(npwp) {
  if (typeof npwp !== 'string') {
    return false
  }

  // NPWP harus 15 digit dan hanya angka
  return /^[0-9]{15}$/.test(npwp)
}

/**
 * Validate NIK (Nomor Induk Kependudukan)
 *
 * NIK harus:
 * - 16 digit
 * - Hanya angka
 *
 * @param {string} nik - Nomor Induk Kependudukan
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidNIK("3175012345678901") // true
 * isValidNIK("12345")            // false
 */
export function isValidNIK(nik) {
  if (typeof nik !== 'string') {
    return false
  }

  // NIK harus 16 digit dan hanya angka
  return /^[0-9]{16}$/.test(nik)
}

/**
 * Validate kode satker
 *
 * Kode satker harus:
 * - 6 digit
 * - Hanya angka
 *
 * @param {string} kodeSatker - Kode Satuan Kerja
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidKodeSatker("123456") // true
 * isValidKodeSatker("12345")  // false
 */
export function isValidKodeSatker(kodeSatker) {
  if (typeof kodeSatker !== 'string') {
    return false
  }

  // Kode satker harus 6 digit dan hanya angka
  return /^[0-9]{6}$/.test(kodeSatker)
}

/**
 * Validate email address
 *
 * @param {string} email - Email address
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidEmail("admin@kemenkeu.go.id") // true
 * isValidEmail("invalid.email")        // false
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false
  }

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format tanggal ke format Indonesia (DD/MM/YYYY)
 *
 * @param {string|Date} date - Tanggal (ISO string or Date object)
 * @param {Object} options - Opsi formatting
 * @param {boolean} [options.withTime=false] - Tampilkan waktu (default: false)
 * @returns {string} Tanggal terformat
 *
 * @example
 * formatTanggal("2024-01-15")
 * // "15/01/2024"
 *
 * formatTanggal(new Date("2024-01-15T10:30:00"), { withTime: true })
 * // "15/01/2024 10:30"
 */
export function formatTanggal(date, options = {}) {
  const { withTime = false } = options

  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()

  let result = `${day}/${month}/${year}`

  if (withTime) {
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    result += ` ${hours}:${minutes}`
  }

  return result
}

/**
 * Format tanggal ke format panjang Indonesia
 *
 * @param {string|Date} date - Tanggal (ISO string or Date object)
 * @returns {string} Tanggal format panjang
 *
 * @example
 * formatTanggalPanjang("2024-01-15")
 * // "15 Januari 2024"
 */
export function formatTanggalPanjang(date) {
  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const day = dateObj.getDate()
  const month = namaBulan[dateObj.getMonth()]
  const year = dateObj.getFullYear()

  return `${day} ${month} ${year}`
}

/**
 * Deep clone object (untuk avoid mutation)
 *
 * @param {*} obj - Object yang akan di-clone
 * @returns {*} Cloned object
 *
 * @example
 * const original = { name: "Budi", address: { city: "Jakarta" } }
 * const cloned = deepClone(original)
 * cloned.address.city = "Bandung"
 * console.log(original.address.city) // "Jakarta" (tidak berubah)
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }

  // Handle Object
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }

  return cloned
}

/**
 * Generate terbilang dari angka (wrapper dari terbilangGenerator)
 *
 * @param {number} angka - Angka yang akan dikonversi
 * @returns {string} Terbilang dengan "Rupiah"
 *
 * @example
 * generateTerbilang(45000000)
 * // "Empat Puluh Lima Juta Rupiah"
 */
export function generateTerbilang(angka) {
  return toTerbilang(angka)
}

/**
 * Sanitize string untuk prevent XSS
 *
 * @param {string} str - String yang akan di-sanitize
 * @returns {string} Sanitized string
 *
 * @example
 * sanitizeString("<script>alert('XSS')</script>")
 * // "&lt;script&gt;alert('XSS')&lt;/script&gt;"
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Default export
export default {
  generateMasterId,
  generateMasterIdFromDB,
  extractSequence,
  calculateDuration,
  formatAlamat,
  sumPotongan,
  calculateNilaiDibayar,
  formatRupiah,
  parseRupiah,
  isValidNIP,
  isValidNPWP,
  isValidNIK,
  isValidKodeSatker,
  isValidEmail,
  formatTanggal,
  formatTanggalPanjang,
  deepClone,
  generateTerbilang,
  sanitizeString
}
