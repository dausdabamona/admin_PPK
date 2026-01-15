/**
 * ============================================================================
 * TERBILANG GENERATOR - Konversi Angka ke Kata Bahasa Indonesia
 * ============================================================================
 *
 * Module untuk mengkonversi angka (number) menjadi kata-kata dalam Bahasa
 * Indonesia sesuai dengan Ejaan Yang Disempurnakan (EYD).
 *
 * Digunakan oleh:
 * - SPR (Surat Permintaan Pembayaran)
 * - SPPR (Surat Pernyataan Penyelesaian Pekerjaan)
 * - BAST (Berita Acara Serah Terima)
 * - Kuitansi
 * - Nominatif
 * - SPTJB
 * - Cover SPJ
 *
 * Support:
 * - Hingga triliunan (999.999.999.999.999)
 * - Angka negatif
 * - Desimal (2 digit)
 * - Format: "Rp X.XXX.XXX"
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

/**
 * Satuan angka 0-9
 */
const SATUAN = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'
]

/**
 * Angka belasan 10-19
 */
const BELASAN = [
  'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas',
  'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'
]

/**
 * Konversi angka 1-99 ke terbilang
 *
 * @param {number} num - Angka 1-99
 * @returns {string} Terbilang
 * @private
 *
 * @example
 * terbilangPuluhan(25) // "Dua Puluh Lima"
 * terbilangPuluhan(10) // "Sepuluh"
 * terbilangPuluhan(5)  // "Lima"
 */
function terbilangPuluhan(num) {
  if (num < 10) {
    return SATUAN[num]
  }

  if (num < 20) {
    return BELASAN[num - 10]
  }

  const puluhan = Math.floor(num / 10)
  const satuan = num % 10

  let result = SATUAN[puluhan] + ' Puluh'
  if (satuan > 0) {
    result += ' ' + SATUAN[satuan]
  }

  return result
}

/**
 * Konversi angka 1-999 ke terbilang
 *
 * @param {number} num - Angka 1-999
 * @returns {string} Terbilang
 * @private
 *
 * @example
 * terbilangRatusan(125) // "Seratus Dua Puluh Lima"
 * terbilangRatusan(100) // "Seratus"
 * terbilangRatusan(25)  // "Dua Puluh Lima"
 */
function terbilangRatusan(num) {
  if (num < 100) {
    return terbilangPuluhan(num)
  }

  const ratusan = Math.floor(num / 100)
  const sisaRatusan = num % 100

  let result = ''

  // Special case: 100 = "Seratus" bukan "Satu Ratus"
  if (ratusan === 1) {
    result = 'Seratus'
  } else {
    result = SATUAN[ratusan] + ' Ratus'
  }

  if (sisaRatusan > 0) {
    result += ' ' + terbilangPuluhan(sisaRatusan)
  }

  return result
}

/**
 * Konversi angka ribuan (1.000 - 999.999.999.999.999)
 *
 * @param {number} num - Angka dalam ribuan
 * @returns {string} Terbilang
 * @private
 *
 * @example
 * terbilangRibuan(1250000) // "Satu Juta Dua Ratus Lima Puluh Ribu"
 */
function terbilangRibuan(num) {
  if (num < 1000) {
    return terbilangRatusan(num)
  }

  // Definisi skala
  const SKALA = [
    { nilai: 1000000000000, nama: 'Triliun' },
    { nilai: 1000000000, nama: 'Miliar' },
    { nilai: 1000000, nama: 'Juta' },
    { nilai: 1000, nama: 'Ribu' }
  ]

  let result = ''
  let sisa = num

  for (const skala of SKALA) {
    if (sisa >= skala.nilai) {
      const pembagian = Math.floor(sisa / skala.nilai)

      // Special case: 1000 = "Seribu" bukan "Satu Ribu"
      if (skala.nama === 'Ribu' && pembagian === 1) {
        result += 'Seribu'
      } else {
        result += terbilangRatusan(pembagian) + ' ' + skala.nama
      }

      sisa = sisa % skala.nilai

      if (sisa > 0) {
        result += ' '
      }
    }
  }

  // Tambahkan sisa jika ada
  if (sisa > 0) {
    result += terbilangRatusan(sisa)
  }

  return result
}

/**
 * Konversi angka desimal (sen/koma) ke terbilang
 *
 * @param {number} desimal - Angka desimal (0-99)
 * @returns {string} Terbilang desimal
 * @private
 *
 * @example
 * terbilangDesimal(50) // "Koma Lima Puluh"
 * terbilangDesimal(5)  // "Koma Nol Lima"
 */
function terbilangDesimal(desimal) {
  if (desimal === 0) {
    return ''
  }

  // Pastikan 2 digit (mis: 5 → 50, 05 → 5)
  const normalized = Math.floor(desimal)

  if (normalized < 10) {
    return 'Koma Nol ' + SATUAN[normalized]
  }

  return 'Koma ' + terbilangPuluhan(normalized)
}

/**
 * Konversi angka ke terbilang Bahasa Indonesia (tanpa "Rupiah")
 *
 * @param {number} angka - Angka yang akan dikonversi
 * @returns {string} Terbilang (tanpa "Rupiah")
 *
 * @example
 * toTerbilangOnly(0)          // "Nol"
 * toTerbilangOnly(45000000)   // "Empat Puluh Lima Juta"
 * toTerbilangOnly(1500)       // "Seribu Lima Ratus"
 * toTerbilangOnly(-10000)     // "Minus Sepuluh Ribu"
 * toTerbilangOnly(123.45)     // "Seratus Dua Puluh Tiga Koma Empat Puluh Lima"
 */
export function toTerbilangOnly(angka) {
  // Validasi input
  if (typeof angka !== 'number' || isNaN(angka)) {
    throw new Error('Input harus berupa angka yang valid')
  }

  // Handle angka 0
  if (angka === 0) {
    return 'Nol'
  }

  // Handle angka negatif
  let result = ''
  let absoluteValue = angka

  if (angka < 0) {
    result = 'Minus '
    absoluteValue = Math.abs(angka)
  }

  // Pisahkan bulat dan desimal
  const bulat = Math.floor(absoluteValue)
  const desimal = Math.round((absoluteValue - bulat) * 100)

  // Konversi bagian bulat
  result += terbilangRibuan(bulat)

  // Konversi bagian desimal jika ada
  if (desimal > 0) {
    result += ' ' + terbilangDesimal(desimal)
  }

  return result.trim()
}

/**
 * Konversi angka ke terbilang dengan "Rupiah"
 *
 * @param {number} angka - Angka yang akan dikonversi
 * @param {Object} options - Opsi tambahan
 * @param {boolean} options.withPrefix - Tambahkan "Rp" di depan (default: false)
 * @param {boolean} options.capitalize - Kapital huruf pertama (default: true)
 * @returns {string} Terbilang dengan "Rupiah"
 *
 * @example
 * toTerbilang(45000000)
 * // "Empat Puluh Lima Juta Rupiah"
 *
 * toTerbilang(45000000, { withPrefix: true })
 * // "Rp Empat Puluh Lima Juta Rupiah"
 *
 * toTerbilang(45000000, { capitalize: false })
 * // "empat puluh lima juta rupiah"
 *
 * toTerbilang(1250000)
 * // "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function toTerbilang(angka, options = {}) {
  const {
    withPrefix = false,
    capitalize = true
  } = options

  // Validasi input
  if (typeof angka !== 'number' || isNaN(angka)) {
    throw new Error('Input harus berupa angka yang valid')
  }

  // Untuk angka negatif, tidak masuk akal pakai "Rupiah"
  // tapi tetap support untuk fleksibilitas
  let result = toTerbilangOnly(angka)

  // Tambahkan "Rupiah"
  result += ' Rupiah'

  // Tambahkan prefix "Rp" jika diminta
  if (withPrefix) {
    result = 'Rp ' + result
  }

  // Handle kapitalisasi
  if (!capitalize) {
    result = result.toLowerCase()
  }

  return result
}

/**
 * Konversi angka ke terbilang untuk dokumen formal
 * (Format standar untuk dokumen SPJ)
 *
 * @param {number} angka - Angka yang akan dikonversi
 * @returns {string} Terbilang format formal
 *
 * @example
 * toTerbilangFormal(45000000)
 * // "Empat Puluh Lima Juta Rupiah"
 *
 * toTerbilangFormal(0)
 * // "Nol Rupiah"
 */
export function toTerbilangFormal(angka) {
  return toTerbilang(angka, { capitalize: true, withPrefix: false })
}

/**
 * Validasi apakah input adalah angka yang bisa dikonversi
 *
 * @param {*} input - Input yang akan divalidasi
 * @returns {boolean} True jika valid
 *
 * @example
 * isValidNumber(45000000)  // true
 * isValidNumber("45000000") // false
 * isValidNumber(null)      // false
 * isValidNumber(NaN)       // false
 */
export function isValidNumber(input) {
  return typeof input === 'number' && !isNaN(input) && isFinite(input)
}

/**
 * Parse string rupiah ke number, lalu convert ke terbilang
 *
 * @param {string} rupiahString - String format rupiah (contoh: "Rp 45.000.000")
 * @returns {string} Terbilang
 *
 * @example
 * parseRupiahToTerbilang("Rp 45.000.000")
 * // "Empat Puluh Lima Juta Rupiah"
 *
 * parseRupiahToTerbilang("45.000.000")
 * // "Empat Puluh Lima Juta Rupiah"
 */
export function parseRupiahToTerbilang(rupiahString) {
  if (typeof rupiahString !== 'string') {
    throw new Error('Input harus berupa string')
  }

  // Hapus "Rp", ".", ",", dan spasi
  const cleaned = rupiahString
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim()

  const angka = parseFloat(cleaned)

  if (isNaN(angka)) {
    throw new Error('String tidak dapat dikonversi menjadi angka')
  }

  return toTerbilang(angka)
}

/**
 * Batch convert: array of numbers to array of terbilang
 *
 * @param {number[]} arrayAngka - Array berisi angka-angka
 * @returns {string[]} Array berisi terbilang
 *
 * @example
 * batchToTerbilang([1000, 2000, 3000])
 * // ["Seribu Rupiah", "Dua Ribu Rupiah", "Tiga Ribu Rupiah"]
 */
export function batchToTerbilang(arrayAngka) {
  if (!Array.isArray(arrayAngka)) {
    throw new Error('Input harus berupa array')
  }

  return arrayAngka.map(angka => {
    try {
      return toTerbilang(angka)
    } catch (error) {
      return `Error: ${error.message}`
    }
  })
}

/**
 * Test function untuk menampilkan contoh output
 * (Hanya untuk development/testing)
 *
 * @private
 */
export function testTerbilang() {
  const testCases = [
    0,
    1,
    10,
    11,
    25,
    100,
    250,
    1000,
    1500,
    10000,
    25000,
    100000,
    250000,
    1000000,
    1250000,
    10000000,
    45000000,
    100000000,
    1000000000,
    1500000000,
    1000000000000,
    999999999999999,
    -5000,
    123.45
  ]

  console.log('=== TEST TERBILANG GENERATOR ===\n')

  testCases.forEach(angka => {
    try {
      const terbilang = toTerbilang(angka)
      console.log(`${angka.toLocaleString('id-ID')} → ${terbilang}`)
    } catch (error) {
      console.log(`${angka} → ERROR: ${error.message}`)
    }
  })
}

// Default export
export default {
  toTerbilang,
  toTerbilangOnly,
  toTerbilangFormal,
  parseRupiahToTerbilang,
  batchToTerbilang,
  isValidNumber,
  testTerbilang
}
