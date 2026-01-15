/**
 * Unit Tests for terbilangGenerator.js
 */

import {
  toTerbilang,
  toTerbilangOnly,
  toTerbilangFormal,
  parseRupiahToTerbilang,
  batchToTerbilang,
  isValidNumber
} from '../terbilangGenerator'

describe('terbilangGenerator', () => {
  describe('toTerbilang', () => {
    test('should convert 0 correctly', () => {
      expect(toTerbilang(0)).toBe('Nol Rupiah')
    })

    test('should convert single digits correctly', () => {
      expect(toTerbilang(1)).toBe('Satu Rupiah')
      expect(toTerbilang(5)).toBe('Lima Rupiah')
      expect(toTerbilang(9)).toBe('Sembilan Rupiah')
    })

    test('should convert tens correctly', () => {
      expect(toTerbilang(10)).toBe('Sepuluh Rupiah')
      expect(toTerbilang(11)).toBe('Sebelas Rupiah')
      expect(toTerbilang(25)).toBe('Dua Puluh Lima Rupiah')
      expect(toTerbilang(99)).toBe('Sembilan Puluh Sembilan Rupiah')
    })

    test('should convert hundreds correctly', () => {
      expect(toTerbilang(100)).toBe('Seratus Rupiah')
      expect(toTerbilang(250)).toBe('Dua Ratus Lima Puluh Rupiah')
      expect(toTerbilang(999)).toBe('Sembilan Ratus Sembilan Puluh Sembilan Rupiah')
    })

    test('should convert thousands correctly', () => {
      expect(toTerbilang(1000)).toBe('Seribu Rupiah')
      expect(toTerbilang(1500)).toBe('Seribu Lima Ratus Rupiah')
      expect(toTerbilang(25000)).toBe('Dua Puluh Lima Ribu Rupiah')
    })

    test('should convert millions correctly', () => {
      expect(toTerbilang(1000000)).toBe('Satu Juta Rupiah')
      expect(toTerbilang(1250000)).toBe('Satu Juta Dua Ratus Lima Puluh Ribu Rupiah')
      expect(toTerbilang(45000000)).toBe('Empat Puluh Lima Juta Rupiah')
    })

    test('should convert billions correctly', () => {
      expect(toTerbilang(1000000000)).toBe('Satu Miliar Rupiah')
      expect(toTerbilang(1500000000)).toBe('Satu Miliar Lima Ratus Juta Rupiah')
    })

    test('should convert trillions correctly', () => {
      expect(toTerbilang(1000000000000)).toBe('Satu Triliun Rupiah')
      expect(toTerbilang(999999999999999)).toBe(
        'Sembilan Ratus Sembilan Puluh Sembilan Triliun Sembilan Ratus Sembilan Puluh Sembilan Miliar Sembilan Ratus Sembilan Puluh Sembilan Juta Sembilan Ratus Sembilan Puluh Sembilan Ribu Sembilan Ratus Sembilan Puluh Sembilan Rupiah'
      )
    })

    test('should handle negative numbers', () => {
      expect(toTerbilang(-5000)).toBe('Minus Lima Ribu Rupiah')
    })

    test('should handle decimals', () => {
      expect(toTerbilang(123.45)).toBe('Seratus Dua Puluh Tiga Koma Empat Puluh Lima Rupiah')
    })

    test('should throw error for invalid input', () => {
      expect(() => toTerbilang('invalid')).toThrow('Input harus berupa angka yang valid')
      expect(() => toTerbilang(NaN)).toThrow('Input harus berupa angka yang valid')
    })
  })

  describe('toTerbilangOnly', () => {
    test('should convert without "Rupiah"', () => {
      expect(toTerbilangOnly(45000000)).toBe('Empat Puluh Lima Juta')
      expect(toTerbilangOnly(1000)).toBe('Seribu')
    })
  })

  describe('toTerbilangFormal', () => {
    test('should use formal format', () => {
      expect(toTerbilangFormal(45000000)).toBe('Empat Puluh Lima Juta Rupiah')
    })
  })

  describe('parseRupiahToTerbilang', () => {
    test('should parse "Rp X.XXX.XXX" format', () => {
      expect(parseRupiahToTerbilang('Rp 45.000.000')).toBe('Empat Puluh Lima Juta Rupiah')
    })

    test('should parse "X.XXX.XXX" format (without Rp)', () => {
      expect(parseRupiahToTerbilang('45.000.000')).toBe('Empat Puluh Lima Juta Rupiah')
    })

    test('should throw error for invalid string', () => {
      expect(() => parseRupiahToTerbilang('invalid')).toThrow()
    })

    test('should throw error for non-string input', () => {
      expect(() => parseRupiahToTerbilang(45000000)).toThrow('Input harus berupa string')
    })
  })

  describe('batchToTerbilang', () => {
    test('should convert array of numbers', () => {
      const result = batchToTerbilang([1000, 2000, 3000])
      expect(result).toEqual([
        'Seribu Rupiah',
        'Dua Ribu Rupiah',
        'Tiga Ribu Rupiah'
      ])
    })

    test('should throw error for non-array input', () => {
      expect(() => batchToTerbilang('not an array')).toThrow('Input harus berupa array')
    })

    test('should handle errors in array', () => {
      const result = batchToTerbilang([1000, 'invalid', 3000])
      expect(result[1]).toContain('Error')
    })
  })

  describe('isValidNumber', () => {
    test('should return true for valid numbers', () => {
      expect(isValidNumber(45000000)).toBe(true)
      expect(isValidNumber(0)).toBe(true)
      expect(isValidNumber(-100)).toBe(true)
      expect(isValidNumber(123.45)).toBe(true)
    })

    test('should return false for invalid inputs', () => {
      expect(isValidNumber('45000000')).toBe(false)
      expect(isValidNumber(NaN)).toBe(false)
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(null)).toBe(false)
      expect(isValidNumber(undefined)).toBe(false)
    })
  })
})
