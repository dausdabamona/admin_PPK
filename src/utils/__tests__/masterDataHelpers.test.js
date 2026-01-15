/**
 * Unit Tests for masterDataHelpers.js
 */

import {
  generateMasterId,
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
  deepClone
} from '../masterDataHelpers'

describe('masterDataHelpers', () => {
  describe('generateMasterId', () => {
    test('should generate correct ID format', () => {
      expect(generateMasterId(2024, 1)).toBe('MDK-2024-000001')
      expect(generateMasterId(2024, 25)).toBe('MDK-2024-000025')
      expect(generateMasterId(2024, 123)).toBe('MDK-2024-000123')
    })

    test('should pad sequence with 6 digits', () => {
      expect(generateMasterId(2024, 1)).toBe('MDK-2024-000001')
      expect(generateMasterId(2024, 999999)).toBe('MDK-2024-999999')
    })

    test('should throw error for invalid year', () => {
      expect(() => generateMasterId(1999)).toThrow('Tahun anggaran harus antara 2000 - 2100')
      expect(() => generateMasterId(2101)).toThrow('Tahun anggaran harus antara 2000 - 2100')
    })

    test('should throw error for invalid sequence', () => {
      expect(() => generateMasterId(2024, 0)).toThrow('Sequence number harus antara 1 - 999999')
      expect(() => generateMasterId(2024, 1000000)).toThrow('Sequence number harus antara 1 - 999999')
    })
  })

  describe('extractSequence', () => {
    test('should extract sequence from valid ID', () => {
      expect(extractSequence('MDK-2024-000042')).toBe(42)
      expect(extractSequence('MDK-2024-001234')).toBe(1234)
    })

    test('should throw error for invalid format', () => {
      expect(() => extractSequence('invalid')).toThrow('Format Master ID tidak valid')
      expect(() => extractSequence(12345)).toThrow('Master ID harus berupa string')
    })
  })

  describe('calculateDuration', () => {
    test('should calculate duration correctly', () => {
      expect(calculateDuration('2024-01-01', '2024-01-31')).toBe(30)
      expect(calculateDuration('2024-01-15', '2024-03-30')).toBe(75)
    })

    test('should accept Date objects', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')
      expect(calculateDuration(start, end)).toBe(30)
    })

    test('should throw error for invalid dates', () => {
      expect(() => calculateDuration('invalid', '2024-01-31')).toThrow('Tanggal mulai tidak valid')
      expect(() => calculateDuration('2024-01-01', 'invalid')).toThrow('Tanggal selesai tidak valid')
    })

    test('should throw error if end < start', () => {
      expect(() => calculateDuration('2024-01-31', '2024-01-01')).toThrow(
        'Tanggal selesai tidak boleh sebelum tanggal mulai'
      )
    })
  })

  describe('formatAlamat', () => {
    test('should format complete address', () => {
      const alamat = {
        jalan: 'Jl. Sudirman No. 45',
        kelurahan: 'Karet Tengsin',
        kecamatan: 'Tanah Abang',
        kota: 'Jakarta Pusat',
        provinsi: 'DKI Jakarta',
        kodePos: '10220'
      }
      expect(formatAlamat(alamat)).toBe(
        'Jl. Sudirman No. 45, Karet Tengsin, Tanah Abang, Jakarta Pusat, DKI Jakarta 10220'
      )
    })

    test('should handle partial address', () => {
      const alamat = {
        jalan: 'Jl. Sudirman No. 45',
        kota: 'Jakarta',
        kodePos: '10220'
      }
      expect(formatAlamat(alamat)).toBe('Jl. Sudirman No. 45, Jakarta 10220')
    })

    test('should return empty string for null/undefined', () => {
      expect(formatAlamat(null)).toBe('')
      expect(formatAlamat(undefined)).toBe('')
    })
  })

  describe('sumPotongan', () => {
    test('should sum all potongan correctly', () => {
      const potongan = {
        pph21: 100000,
        pph22: 0,
        pph23: 450000,
        ppn: 0
      }
      expect(sumPotongan(potongan)).toBe(550000)
    })

    test('should handle missing fields', () => {
      expect(sumPotongan({ pph23: 450000 })).toBe(450000)
      expect(sumPotongan({})).toBe(0)
    })

    test('should return 0 for null/undefined', () => {
      expect(sumPotongan(null)).toBe(0)
      expect(sumPotongan(undefined)).toBe(0)
    })
  })

  describe('calculateNilaiDibayar', () => {
    test('should calculate nilai dibayar correctly', () => {
      const potongan = { pph23: 450000 }
      expect(calculateNilaiDibayar(45000000, potongan)).toBe(44550000)
    })

    test('should throw error for invalid nilai kontrak', () => {
      expect(() => calculateNilaiDibayar('invalid', {})).toThrow(
        'Nilai kontrak harus berupa angka yang valid'
      )
    })
  })

  describe('formatRupiah', () => {
    test('should format with Rp prefix by default', () => {
      expect(formatRupiah(45000000)).toBe('Rp 45.000.000')
    })

    test('should format without prefix if specified', () => {
      expect(formatRupiah(45000000, { withPrefix: false })).toBe('45.000.000')
    })

    test('should handle decimals if specified', () => {
      expect(formatRupiah(45123.45, { withDecimal: true })).toBe('Rp 45.123,45')
    })

    test('should return "Rp 0" for invalid input', () => {
      expect(formatRupiah(NaN)).toBe('Rp 0')
    })
  })

  describe('parseRupiah', () => {
    test('should parse Rupiah string to number', () => {
      expect(parseRupiah('Rp 45.000.000')).toBe(45000000)
      expect(parseRupiah('45.000.000')).toBe(45000000)
    })

    test('should handle decimals', () => {
      expect(parseRupiah('Rp 45.123,50')).toBe(45123.50)
    })

    test('should throw error for invalid input', () => {
      expect(() => parseRupiah(45000000)).toThrow('Input harus berupa string')
      expect(() => parseRupiah('invalid')).toThrow('String tidak dapat dikonversi menjadi angka')
    })
  })

  describe('isValidNIP', () => {
    test('should validate correct NIP', () => {
      expect(isValidNIP('196501011990031001')).toBe(true)
      expect(isValidNIP('198005102005012001')).toBe(true)
    })

    test('should reject invalid NIP', () => {
      expect(isValidNIP('12345')).toBe(false) // Too short
      expect(isValidNIP('1965010119900310AB')).toBe(false) // Contains letters
      expect(isValidNIP(123456789012345678)).toBe(false) // Not a string
    })
  })

  describe('isValidNPWP', () => {
    test('should validate correct NPWP', () => {
      expect(isValidNPWP('123456789012345')).toBe(true)
    })

    test('should reject invalid NPWP', () => {
      expect(isValidNPWP('12345')).toBe(false)
      expect(isValidNPWP('12345678901234A')).toBe(false)
    })
  })

  describe('isValidNIK', () => {
    test('should validate correct NIK', () => {
      expect(isValidNIK('3175012345678901')).toBe(true)
    })

    test('should reject invalid NIK', () => {
      expect(isValidNIK('12345')).toBe(false)
      expect(isValidNIK('317501234567890A')).toBe(false)
    })
  })

  describe('isValidKodeSatker', () => {
    test('should validate correct kode satker', () => {
      expect(isValidKodeSatker('123456')).toBe(true)
    })

    test('should reject invalid kode satker', () => {
      expect(isValidKodeSatker('12345')).toBe(false)
      expect(isValidKodeSatker('12345A')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    test('should validate correct email', () => {
      expect(isValidEmail('admin@kemenkeu.go.id')).toBe(true)
      expect(isValidEmail('test@example.com')).toBe(true)
    })

    test('should reject invalid email', () => {
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
    })
  })

  describe('formatTanggal', () => {
    test('should format date to DD/MM/YYYY', () => {
      expect(formatTanggal('2024-01-15')).toBe('15/01/2024')
    })

    test('should format with time if specified', () => {
      const date = new Date('2024-01-15T10:30:00')
      expect(formatTanggal(date, { withTime: true })).toBe('15/01/2024 10:30')
    })

    test('should return empty string for invalid date', () => {
      expect(formatTanggal('invalid')).toBe('')
    })
  })

  describe('formatTanggalPanjang', () => {
    test('should format date in Indonesian long format', () => {
      expect(formatTanggalPanjang('2024-01-15')).toBe('15 Januari 2024')
      expect(formatTanggalPanjang('2024-12-25')).toBe('25 Desember 2024')
    })
  })

  describe('deepClone', () => {
    test('should deep clone object', () => {
      const original = { name: 'Budi', address: { city: 'Jakarta' } }
      const cloned = deepClone(original)

      cloned.address.city = 'Bandung'

      expect(original.address.city).toBe('Jakarta')
      expect(cloned.address.city).toBe('Bandung')
    })

    test('should clone arrays', () => {
      const original = [1, 2, { value: 3 }]
      const cloned = deepClone(original)

      cloned[2].value = 99

      expect(original[2].value).toBe(3)
      expect(cloned[2].value).toBe(99)
    })

    test('should handle Date objects', () => {
      const date = new Date('2024-01-15')
      const cloned = deepClone(date)

      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date) // Different object reference
    })

    test('should handle primitives', () => {
      expect(deepClone(123)).toBe(123)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(null)).toBe(null)
    })
  })
})
