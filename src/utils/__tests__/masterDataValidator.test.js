/**
 * Unit Tests for masterDataValidator.js
 */

import {
  validateMasterData,
  validateStep1SatkerPejabat,
  validateStep2KegiatanAnggaran,
  validateStep3Penyedia,
  validateStep4BankPembayaran,
  validateStep5Dokumen,
  validateForDocument,
  getValidationSummary
} from '../masterDataValidator'

// Sample valid master data
const validMasterData = {
  satker: {
    kode: '123456',
    nama: 'KPPN Jakarta I',
    alamat: {
      jalan: 'Jl. Sudirman No. 45',
      kota: 'Jakarta',
      provinsi: 'DKI Jakarta'
    },
    email: 'test@kemenkeu.go.id'
  },
  pejabat: {
    kpa: {
      nama: 'Ahmad Budiman',
      nip: '196501011990031001',
      jabatan: 'Kepala KPPN'
    },
    ppk: {
      nama: 'Budi Santoso',
      nip: '197203151995031002',
      jabatan: 'Kepala Seksi'
    },
    bendahara: {
      nama: 'Siti Nurhaliza',
      nip: '198005102005012001'
    },
    pphp: [
      {
        nama: 'Agus Wijaya',
        nip: '198506202010121001',
        role: 'ketua'
      }
    ]
  },
  kegiatan: {
    program: { nama: 'Program Dukungan' },
    kegiatan: { nama: 'Pengelolaan Layanan' },
    output: { nama: 'Layanan Manajemen' },
    akun: { kode: '521211', nama: 'Belanja Barang' },
    uraian: 'Pengadaan ATK',
    waktu: {
      mulai: '2024-01-15',
      selesai: '2024-03-30'
    }
  },
  anggaran: {
    sumberDana: 'APBN',
    pagu: 50000000,
    nilaiKontrak: 45000000,
    potongan: {
      pph23: 450000
    }
  },
  penyedia: {
    jenis: 'badan_usaha',
    nama: 'PT Maju Jaya',
    pimpinan: 'Bambang Setiawan',
    alamat: {
      jalan: 'Jl. Sudirman No. 45',
      kota: 'Jakarta'
    },
    identitas: {
      npwp: '123456789012345',
      nik: '3175012345678901'
    }
  },
  bank: {
    namaBank: 'Bank Mandiri',
    nomorRekening: '1370012345678',
    atasNama: 'PT Maju Jaya'
  },
  dokumen: {
    kontrak: {
      nomor: 'SPK-001/2024',
      tanggal: '2024-01-15'
    },
    bast: {
      nomor: 'BAST-001/2024',
      tanggal: '2024-03-30'
    },
    bap: {
      nomor: 'BAP-001/2024',
      tanggal: '2024-03-29'
    },
    spr: {
      nomor: 'SPR-001/2024',
      tanggal: '2024-03-31'
    },
    sppr: {
      nomor: 'SPPR-001/2024',
      tanggal: '2024-03-30'
    }
  }
}

describe('masterDataValidator', () => {
  describe('validateStep1SatkerPejabat', () => {
    test('should pass validation for valid data', () => {
      const errors = validateStep1SatkerPejabat(validMasterData)
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should fail if required satker fields missing', () => {
      const data = { satker: {} }
      const errors = validateStep1SatkerPejabat(data)
      expect(errors['satker.kode']).toBeDefined()
      expect(errors['satker.nama']).toBeDefined()
    })

    test('should fail if kode satker invalid', () => {
      const data = {
        ...validMasterData,
        satker: { ...validMasterData.satker, kode: '12345' } // Only 5 digits
      }
      const errors = validateStep1SatkerPejabat(data)
      expect(errors['satker.kode']).toBe('Kode Satker harus 6 digit angka')
    })

    test('should fail if email invalid', () => {
      const data = {
        ...validMasterData,
        satker: { ...validMasterData.satker, email: 'invalid.email' }
      }
      const errors = validateStep1SatkerPejabat(data)
      expect(errors['satker.email']).toBe('Format email tidak valid')
    })

    test('should fail if NIP invalid', () => {
      const data = {
        ...validMasterData,
        pejabat: {
          ...validMasterData.pejabat,
          ppk: { ...validMasterData.pejabat.ppk, nip: '12345' }
        }
      }
      const errors = validateStep1SatkerPejabat(data)
      expect(errors['pejabat.ppk.nip']).toBe('NIP PPK harus 18 digit angka')
    })

    test('should fail if no PPHP', () => {
      const data = {
        ...validMasterData,
        pejabat: {
          ...validMasterData.pejabat,
          pphp: []
        }
      }
      const errors = validateStep1SatkerPejabat(data)
      expect(errors['pejabat.pphp']).toBe('Minimal harus ada 1 PPHP')
    })
  })

  describe('validateStep2KegiatanAnggaran', () => {
    test('should pass validation for valid data', () => {
      const errors = validateStep2KegiatanAnggaran(validMasterData)
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should fail if tanggal selesai < tanggal mulai', () => {
      const data = {
        ...validMasterData,
        kegiatan: {
          ...validMasterData.kegiatan,
          waktu: {
            mulai: '2024-03-30',
            selesai: '2024-01-15' // Before mulai
          }
        }
      }
      const errors = validateStep2KegiatanAnggaran(data)
      expect(errors['kegiatan.waktu.selesai']).toBe(
        'Tanggal selesai tidak boleh sebelum tanggal mulai'
      )
    })

    test('should fail if nilai kontrak > pagu', () => {
      const data = {
        ...validMasterData,
        anggaran: {
          ...validMasterData.anggaran,
          pagu: 40000000,
          nilaiKontrak: 45000000 // Exceeds pagu
        }
      }
      const errors = validateStep2KegiatanAnggaran(data)
      expect(errors['anggaran.nilaiKontrak']).toContain('tidak boleh melebihi pagu')
    })

    test('should fail if nilai kontrak <= 0', () => {
      const data = {
        ...validMasterData,
        anggaran: {
          ...validMasterData.anggaran,
          nilaiKontrak: 0
        }
      }
      const errors = validateStep2KegiatanAnggaran(data)
      expect(errors['anggaran.nilaiKontrak']).toBe('Nilai kontrak harus lebih dari 0')
    })

    test('should fail if potongan > nilai kontrak', () => {
      const data = {
        ...validMasterData,
        anggaran: {
          ...validMasterData.anggaran,
          nilaiKontrak: 1000000,
          potongan: {
            pph23: 2000000 // Exceeds kontrak
          }
        }
      }
      const errors = validateStep2KegiatanAnggaran(data)
      expect(errors['anggaran.potongan']).toContain('tidak boleh melebihi nilai kontrak')
    })
  })

  describe('validateStep3Penyedia', () => {
    test('should pass validation for valid data', () => {
      const errors = validateStep3Penyedia(validMasterData)
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should fail if NPWP invalid', () => {
      const data = {
        ...validMasterData,
        penyedia: {
          ...validMasterData.penyedia,
          identitas: {
            npwp: '12345' // Only 5 digits
          }
        }
      }
      const errors = validateStep3Penyedia(data)
      expect(errors['penyedia.identitas.npwp']).toBe('NPWP harus 15 digit angka')
    })

    test('should fail if pimpinan not filled for badan_usaha', () => {
      const data = {
        ...validMasterData,
        penyedia: {
          ...validMasterData.penyedia,
          jenis: 'badan_usaha',
          pimpinan: ''
        }
      }
      const errors = validateStep3Penyedia(data)
      expect(errors['penyedia.pimpinan']).toContain('wajib diisi untuk badan usaha')
    })
  })

  describe('validateStep4BankPembayaran', () => {
    test('should pass validation for valid data', () => {
      const errors = validateStep4BankPembayaran(validMasterData)
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should fail if nomor rekening invalid', () => {
      const data = {
        ...validMasterData,
        bank: {
          ...validMasterData.bank,
          nomorRekening: '123' // Too short
        }
      }
      const errors = validateStep4BankPembayaran(data)
      expect(errors['bank.nomorRekening']).toBe('Nomor rekening harus 10-16 digit angka')
    })

    test('should warn if atas nama berbeda dengan penyedia', () => {
      const data = {
        ...validMasterData,
        bank: {
          ...validMasterData.bank,
          atasNama: 'PT Berbeda'
        }
      }
      const errors = validateStep4BankPembayaran(data)
      expect(errors['bank.atasNama.warning']).toContain('Nama pemilik rekening berbeda')
    })
  })

  describe('validateStep5Dokumen', () => {
    test('should pass validation for valid data', () => {
      const errors = validateStep5Dokumen(validMasterData)
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should fail if tanggal kontrak after tanggal mulai kegiatan', () => {
      const data = {
        ...validMasterData,
        dokumen: {
          ...validMasterData.dokumen,
          kontrak: {
            nomor: 'SPK-001/2024',
            tanggal: '2024-02-01' // After mulai (2024-01-15)
          }
        }
      }
      const errors = validateStep5Dokumen(data)
      expect(errors['dokumen.kontrak.tanggal']).toContain(
        'tidak boleh setelah tanggal mulai kegiatan'
      )
    })

    test('should fail if tanggal BAST before tanggal selesai kegiatan', () => {
      const data = {
        ...validMasterData,
        dokumen: {
          ...validMasterData.dokumen,
          bast: {
            nomor: 'BAST-001/2024',
            tanggal: '2024-03-20' // Before selesai (2024-03-30)
          }
        }
      }
      const errors = validateStep5Dokumen(data)
      expect(errors['dokumen.bast.tanggal']).toContain(
        'tidak boleh sebelum tanggal selesai kegiatan'
      )
    })

    test('should fail if tanggal BAP after tanggal BAST', () => {
      const data = {
        ...validMasterData,
        dokumen: {
          ...validMasterData.dokumen,
          bap: {
            nomor: 'BAP-001/2024',
            tanggal: '2024-04-01' // After BAST (2024-03-30)
          }
        }
      }
      const errors = validateStep5Dokumen(data)
      expect(errors['dokumen.bap.tanggal']).toContain('tidak boleh setelah tanggal BAST')
    })
  })

  describe('validateMasterData', () => {
    test('should validate all steps for review', () => {
      const errors = validateMasterData(validMasterData, 'review')
      expect(Object.keys(errors).length).toBe(0)
    })

    test('should only validate step 1 for satker step', () => {
      const data = {
        ...validMasterData,
        anggaran: {} // Invalid anggaran (should be ignored for step 1)
      }
      const errors = validateMasterData(data, 'satker')
      expect(Object.keys(errors).length).toBe(0) // Step 1 is valid
    })

    test('should accumulate errors from all steps for review', () => {
      const data = {
        satker: {}, // Invalid
        pejabat: {}, // Invalid
        anggaran: { pagu: -100 } // Invalid
      }
      const errors = validateMasterData(data, 'review')
      expect(Object.keys(errors).length).toBeGreaterThan(0)
    })

    test('should return general error for null data', () => {
      const errors = validateMasterData(null, 'review')
      expect(errors._general).toBe('Master data tidak valid')
    })
  })

  describe('validateForDocument', () => {
    test('should validate required fields for SPR', () => {
      const result = validateForDocument(validMasterData, 'SPR')
      expect(result.isValid).toBe(true)
    })

    test('should fail if SPR required fields missing', () => {
      const data = {
        ...validMasterData,
        dokumen: {
          ...validMasterData.dokumen,
          spr: {} // Missing nomor & tanggal
        }
      }
      const result = validateForDocument(data, 'SPR')
      expect(result.isValid).toBe(false)
      expect(result.errors['dokumen.spr.nomor']).toBeDefined()
    })
  })

  describe('getValidationSummary', () => {
    test('should return correct summary', () => {
      const errors = {
        'satker.kode': 'Invalid',
        'ppk.nip': 'Invalid',
        'bank.atasNama.warning': 'Warning message'
      }
      const summary = getValidationSummary(errors)

      expect(summary.total).toBe(3)
      expect(summary.critical).toBe(2)
      expect(summary.warnings).toBe(1)
      expect(summary.byCategory.satker).toBe(1)
      expect(summary.byCategory.ppk).toBe(1)
    })

    test('should return zero summary for null errors', () => {
      const summary = getValidationSummary(null)
      expect(summary.total).toBe(0)
      expect(summary.critical).toBe(0)
      expect(summary.warnings).toBe(0)
    })
  })
})
