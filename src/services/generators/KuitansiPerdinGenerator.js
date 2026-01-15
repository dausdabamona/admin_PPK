/**
 * ============================================================================
 * KUITANSI PERJALANAN DINAS GENERATOR
 * ============================================================================
 *
 * Service untuk generate dokumen-dokumen Perjalanan Dinas (Perdin):
 * 1. Kuitansi Uang Muka Perjalanan Dinas
 * 2. Kuitansi Rampung Perjalanan Dinas (Settlement)
 * 3. Rincian Biaya Perjalanan Dinas
 *
 * Features:
 * - Auto-calculate tarif based on golongan, tujuan, dan durasi
 * - Auto-settlement calculation (Rampung = Total Riil - Uang Muka)
 * - Support materai requirement
 * - FASE 4.5 fiscal year integration
 * - Indonesian formatting (currency, dates, terbilang)
 * - Export to PDF/HTML
 * - Bundle all 3 documents in one workflow
 *
 * Templates:
 * - src/templates/documents/KuitansiUangMukaPerdin.template.html
 * - src/templates/documents/KuitansiRampungPerdin.template.html
 * - src/templates/documents/RincianBiayaPerdin.template.html
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'
import fiscalYearContext from '../fiscal/FiscalYearContext.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Default tarif perjalanan dinas berdasarkan golongan
 * Sesuai PMK tentang Standar Biaya Masukan (SBM)
 */
const TARIF_PERDIN = {
  // Uang Harian (per hari)
  uangHarian: {
    'I': { dalam_kota: 0, luar_kota: 390000, luar_negeri: 0 },
    'II': { dalam_kota: 0, luar_kota: 410000, luar_negeri: 0 },
    'III': { dalam_kota: 0, luar_kota: 470000, luar_negeri: 0 },
    'IV': { dalam_kota: 0, luar_kota: 570000, luar_negeri: 0 }
  },

  // Transport (PP - Pergi Pulang)
  transport: {
    'dalam_kota': 150000,
    'luar_kota_provinsi': 600000,
    'luar_kota_jabodetabek': 400000,
    'antar_provinsi': 1200000,
    'pesawat': 2500000
  },

  // Penginapan (per malam)
  penginapan: {
    'hotel_bintang_3': 550000,
    'hotel_bintang_4': 750000,
    'hotel_bintang_5': 1000000,
    'rumah_dinas': 0
  }
}

/**
 * Kuitansi Perjalanan Dinas Generator Class
 */
export class KuitansiPerdinGenerator {
  constructor() {
    this.templates = {
      uangMuka: path.resolve(__dirname, '../../templates/documents/KuitansiUangMukaPerdin.template.html'),
      rampung: path.resolve(__dirname, '../../templates/documents/KuitansiRampungPerdin.template.html'),
      rincian: path.resolve(__dirname, '../../templates/documents/RincianBiayaPerdin.template.html')
    }
    this.compiledTemplates = {}

    // Register Handlebars helpers
    this._registerHelpers()
  }

  /**
   * Register Handlebars helpers
   * @private
   */
  _registerHelpers() {
    Handlebars.registerHelper('formatCurrency', (amount) => {
      return this._formatCurrency(amount)
    })

    Handlebars.registerHelper('increment', (index) => {
      return index + 1
    })
  }

  /**
   * Load all templates
   * @returns {Promise<void>}
   */
  async loadTemplates() {
    if (Object.keys(this.compiledTemplates).length === 3) return

    try {
      for (const [key, templatePath] of Object.entries(this.templates)) {
        const templateContent = await fs.readFile(templatePath, 'utf-8')
        this.compiledTemplates[key] = Handlebars.compile(templateContent)
      }
      console.log('[KuitansiPerdinGenerator] All templates loaded successfully')
    } catch (error) {
      console.error('[KuitansiPerdinGenerator] Failed to load templates:', error)
      throw new Error(`Failed to load Perdin templates: ${error.message}`)
    }
  }

  /**
   * Generate Kuitansi Uang Muka
   *
   * @param {Object} masterData - Master data dari Surat Tugas
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated document
   */
  async generateUangMuka(masterData, options = {}) {
    await this.loadTemplates()

    // Get fiscal year context
    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    // Extract data
    const data = this._extractDataUangMuka(masterData, tahunAnggaran, isReconstruction)

    // Validate
    this._validateUangMuka(data)

    // Generate HTML
    const html = this.compiledTemplates.uangMuka(data)

    const document = {
      type: 'KUITANSI_UM_PERDIN',
      title: `Kuitansi Uang Muka Perjalanan Dinas - ${data.nama_pegawai}`,
      html,
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        tahunAnggaran,
        isReconstruction,
        masterDataId: masterData.masterId || masterData.id,
        materai: true
      }
    }

    console.log('[KuitansiPerdinGenerator] Uang Muka generated:', data.nama_pegawai)
    return document
  }

  /**
   * Generate Kuitansi Rampung
   *
   * @param {Object} masterData - Master data dengan data riil pengeluaran
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated document
   */
  async generateRampung(masterData, options = {}) {
    await this.loadTemplates()

    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    // Extract data + calculate settlement
    const data = this._extractDataRampung(masterData, tahunAnggaran, isReconstruction)

    // Validate
    this._validateRampung(data)

    // Generate HTML
    const html = this.compiledTemplates.rampung(data)

    const document = {
      type: 'KUITANSI_RAMPUNG_PERDIN',
      title: `Kuitansi Rampung Perjalanan Dinas - ${data.nama_pegawai}`,
      html,
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        tahunAnggaran,
        isReconstruction,
        masterDataId: masterData.masterId || masterData.id,
        materai: true,
        settlement: {
          totalRiil: data.total_biaya_riil,
          uangMuka: data.uang_muka,
          sisa: data.jumlah_rampung,
          isKelebihan: data.isKelebihanUangMuka
        }
      }
    }

    console.log('[KuitansiPerdinGenerator] Rampung generated:', data.nama_pegawai, '- Settlement:', data.jumlah_rampung)
    return document
  }

  /**
   * Generate Rincian Biaya
   *
   * @param {Object} masterData - Master data dengan breakdown biaya
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated document
   */
  async generateRincian(masterData, options = {}) {
    await this.loadTemplates()

    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    // Extract data + calculate totals
    const data = this._extractDataRincian(masterData, tahunAnggaran, isReconstruction)

    // Validate
    this._validateRincian(data)

    // Generate HTML
    const html = this.compiledTemplates.rincian(data)

    const document = {
      type: 'RINCIAN_BIAYA_PERDIN',
      title: `Rincian Biaya Perjalanan Dinas - ${data.nama_pegawai}`,
      html,
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        tahunAnggaran,
        isReconstruction,
        masterDataId: masterData.masterId || masterData.id,
        grandTotal: data.grand_total
      }
    }

    console.log('[KuitansiPerdinGenerator] Rincian generated:', data.nama_pegawai, '- Total:', data.grand_total)
    return document
  }

  /**
   * Generate ALL perdin documents (UM + Rampung + Rincian)
   * One-click generation from Surat Tugas
   *
   * @param {Object} masterData - Complete master data
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Bundle of all 3 documents
   */
  async generateComplete(masterData, options = {}) {
    console.log('[KuitansiPerdinGenerator] Generating complete package for:', masterData.namaPegawai || masterData.nama_pegawai)

    // Auto-calculate tarif if not provided
    const enrichedData = this._autoCalculateTarif(masterData)

    // Generate all 3 documents
    const [uangMuka, rincian, rampung] = await Promise.all([
      this.generateUangMuka(enrichedData, options),
      this.generateRincian(enrichedData, options),
      this.generateRampung(enrichedData, options)
    ])

    return {
      type: 'PERDIN_PACKAGE',
      title: `Paket Perjalanan Dinas - ${enrichedData.namaPegawai || enrichedData.nama_pegawai}`,
      documents: {
        uangMuka,
        rincian,
        rampung
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        masterDataId: masterData.masterId || masterData.id,
        tujuan: enrichedData.tujuan,
        tanggalBerangkat: enrichedData.tanggalBerangkat,
        tanggalKembali: enrichedData.tanggalKembali
      }
    }
  }

  /**
   * Extract data for Kuitansi Uang Muka
   * @private
   */
  _extractDataUangMuka(masterData, tahunAnggaran, isReconstruction) {
    const now = new Date()

    return {
      // Kop Satker
      logo_satker: masterData.logo_satker || '/assets/logo-kkp.png',
      nama_unit_eselon1: masterData.nama_unit_eselon1 || 'DIREKTORAT JENDERAL ...',
      nama_satuan_kerja: masterData.nama_satuan_kerja || masterData.satkerNama || 'SATUAN KERJA ...',
      nama_satker: masterData.satkerNama || masterData.nama_satker || '',
      alamat_satker: masterData.alamat_satker || masterData.alamatSatker || '',
      telepon: masterData.telepon || masterData.telpSatker || '',
      email: masterData.email || masterData.emailSatker || '',

      // Nomor Kuitansi
      nomor_kuitansi: this._generateNomorKuitansi(masterData, 'UM', tahunAnggaran),

      // Data Pegawai
      nama_pegawai: masterData.namaPegawai || masterData.nama_pegawai || '',
      nip_pegawai: masterData.nipPegawai || masterData.nip_pegawai || '',
      jabatan_pegawai: masterData.jabatanPegawai || masterData.jabatan_pegawai || '',

      // Data Perjalanan
      tujuan: masterData.tujuan || '',
      tanggal_berangkat: this._formatTanggalSurat(masterData.tanggalBerangkat || now),
      tanggal_kembali: this._formatTanggalSurat(masterData.tanggalKembali || now),
      nomor_surat_tugas: masterData.nomorSuratTugas || masterData.nomor_surat_tugas || '',
      tanggal_surat_tugas: this._formatTanggalSurat(masterData.tanggalSuratTugas || now),

      // Uang Muka
      jumlah_uang_muka: this._formatCurrency(masterData.uangMuka || masterData.jumlah_uang_muka || 0),
      terbilang_uang_muka: this._numberToWords(masterData.uangMuka || masterData.jumlah_uang_muka || 0),

      // Akun
      kode_akun: masterData.kodeAkun || masterData.kode_akun || '524111',

      // Pejabat
      nama_ppk: masterData.ppkNama || masterData.nama_ppk || '',
      nip_ppk: masterData.ppkNip || masterData.nip_ppk || '',
      nama_bendahara: masterData.bendaharaNama || masterData.nama_bendahara || '',
      nip_bendahara: masterData.bendaharaNip || masterData.nip_bendahara || '',

      // Tanggal & Tempat
      kota: masterData.kota || masterData.kotaSatker || 'Jakarta',
      tanggal: this._formatTanggalSurat(masterData.tanggalKuitansi || now),

      // FASE 4.5
      tahunAnggaran,
      isReconstruction,
      reconstructionDate: isReconstruction ? this._formatTanggalSurat(new Date()) : null
    }
  }

  /**
   * Extract data for Kuitansi Rampung
   * @private
   */
  _extractDataRampung(masterData, tahunAnggaran, isReconstruction) {
    const now = new Date()

    // Get base data (same as Uang Muka)
    const baseData = this._extractDataUangMuka(masterData, tahunAnggaran, isReconstruction)

    // Calculate settlement
    const totalRiil = masterData.totalBiayaRiil || masterData.total_biaya_riil || 0
    const uangMuka = masterData.uangMuka || masterData.uang_muka || 0
    const sisa = totalRiil - uangMuka
    const isKelebihan = sisa < 0

    return {
      ...baseData,

      // Override nomor kuitansi
      nomor_kuitansi: this._generateNomorKuitansi(masterData, 'RAMPUNG', tahunAnggaran),

      // Settlement calculation
      total_biaya_riil: this._formatCurrency(totalRiil),
      uang_muka: this._formatCurrency(uangMuka),
      jumlah_rampung: this._formatCurrency(Math.abs(sisa)),
      terbilang_rampung: this._numberToWords(Math.abs(sisa)),

      // Kelebihan handling
      isKelebihanUangMuka: isKelebihan,
      kelebihan_uang_muka: isKelebihan ? this._formatCurrency(Math.abs(sisa)) : null
    }
  }

  /**
   * Extract data for Rincian Biaya
   * @private
   */
  _extractDataRincian(masterData, tahunAnggaran, isReconstruction) {
    const now = new Date()

    // Get base data
    const baseData = this._extractDataUangMuka(masterData, tahunAnggaran, isReconstruction)

    // Calculate durasi
    const tanggalBerangkat = new Date(masterData.tanggalBerangkat || now)
    const tanggalKembali = new Date(masterData.tanggalKembali || now)
    const diffTime = Math.abs(tanggalKembali - tanggalBerangkat)
    const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both days
    const jumlahMalam = Math.max(0, jumlahHari - 1)

    // Get rincian biaya
    const rincianBiaya = masterData.rincianBiaya || {}

    const totalHarian = rincianBiaya.totalHarian || (rincianBiaya.tarifHarian || 0) * jumlahHari
    const totalTransportBerangkat = rincianBiaya.totalTransportBerangkat || rincianBiaya.tarifTransportBerangkat || 0
    const totalTransportKembali = rincianBiaya.totalTransportKembali || rincianBiaya.tarifTransportKembali || 0
    const totalPenginapan = rincianBiaya.totalPenginapan || (rincianBiaya.tarifPenginapan || 0) * jumlahMalam
    const totalBiayaLain = rincianBiaya.totalBiayaLain || 0

    const grandTotal = totalHarian + totalTransportBerangkat + totalTransportKembali + totalPenginapan + totalBiayaLain

    return {
      ...baseData,

      // Rincian items
      satuan_harian: jumlahHari,
      jumlah_harian: jumlahHari,
      tarif_harian: rincianBiaya.tarifHarian || 0,
      total_harian: totalHarian,

      tarif_transport_berangkat: rincianBiaya.tarifTransportBerangkat || 0,
      total_transport_berangkat: totalTransportBerangkat,

      tarif_transport_kembali: rincianBiaya.tarifTransportKembali || 0,
      total_transport_kembali: totalTransportKembali,

      jumlah_malam: jumlahMalam,
      tarif_penginapan: rincianBiaya.tarifPenginapan || 0,
      total_penginapan: totalPenginapan,

      has_biaya_lain: totalBiayaLain > 0,
      uraian_biaya_lain: rincianBiaya.uraianBiayaLain || 'Biaya transportasi lokal',
      tarif_biaya_lain: totalBiayaLain,
      total_biaya_lain: totalBiayaLain,
      nomor_biaya_lain: jumlahMalam > 0 ? 5 : 4,

      // Custom items
      custom_items: masterData.customItems || [],

      // Grand total
      grand_total: this._formatCurrency(grandTotal),
      terbilang_grand_total: this._numberToWords(grandTotal)
    }
  }

  /**
   * Auto-calculate tarif based on golongan, tujuan, and durasi
   * @private
   */
  _autoCalculateTarif(masterData) {
    // If already has complete rincianBiaya, return as is
    if (masterData.rincianBiaya && masterData.rincianBiaya.tarifHarian) {
      return masterData
    }

    const golongan = masterData.golongan || 'III'
    const tujuan = masterData.tujuan || ''
    const kategoriTujuan = this._detectKategoriTujuan(tujuan)

    // Calculate durasi
    const tanggalBerangkat = new Date(masterData.tanggalBerangkat || new Date())
    const tanggalKembali = new Date(masterData.tanggalKembali || new Date())
    const diffTime = Math.abs(tanggalKembali - tanggalBerangkat)
    const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    const jumlahMalam = Math.max(0, jumlahHari - 1)

    // Get tarif
    const tarifHarian = TARIF_PERDIN.uangHarian[golongan]?.[kategoriTujuan] || 470000
    const tarifTransport = TARIF_PERDIN.transport[this._detectTransport(tujuan)] || 1200000
    const tarifPenginapan = TARIF_PERDIN.penginapan['hotel_bintang_3'] || 550000

    // Calculate totals
    const totalHarian = tarifHarian * jumlahHari
    const totalTransport = tarifTransport // PP (pergi-pulang)
    const totalPenginapan = tarifPenginapan * jumlahMalam
    const totalRiil = totalHarian + totalTransport + totalPenginapan

    // Calculate uang muka (80% of estimated total)
    const uangMuka = Math.floor(totalRiil * 0.8)

    return {
      ...masterData,
      uangMuka,
      totalBiayaRiil: totalRiil,
      rincianBiaya: {
        tarifHarian,
        totalHarian,
        tarifTransportBerangkat: tarifTransport / 2,
        totalTransportBerangkat: tarifTransport / 2,
        tarifTransportKembali: tarifTransport / 2,
        totalTransportKembali: tarifTransport / 2,
        tarifPenginapan,
        totalPenginapan,
        totalBiayaLain: 0
      }
    }
  }

  /**
   * Detect kategori tujuan (dalam_kota, luar_kota, etc.)
   * @private
   */
  _detectKategoriTujuan(tujuan) {
    const tujuanLower = tujuan.toLowerCase()

    if (tujuanLower.includes('jakarta') || tujuanLower.includes('kantor')) {
      return 'dalam_kota'
    }

    return 'luar_kota'
  }

  /**
   * Detect transport type
   * @private
   */
  _detectTransport(tujuan) {
    const tujuanLower = tujuan.toLowerCase()

    const keywords = {
      pesawat: ['bali', 'makassar', 'papua', 'surabaya', 'medan'],
      antar_provinsi: ['bandung', 'yogyakarta', 'semarang', 'solo'],
      luar_kota_jabodetabek: ['bogor', 'depok', 'tangerang', 'bekasi']
    }

    for (const [type, cities] of Object.entries(keywords)) {
      if (cities.some(city => tujuanLower.includes(city))) {
        return type
      }
    }

    return 'antar_provinsi'
  }

  /**
   * Validate Uang Muka data
   * @private
   */
  _validateUangMuka(data) {
    const required = [
      'nama_pegawai', 'nip_pegawai', 'jabatan_pegawai',
      'tujuan', 'tanggal_berangkat', 'tanggal_kembali',
      'nomor_surat_tugas', 'tanggal_surat_tugas',
      'jumlah_uang_muka', 'kode_akun',
      'nama_ppk', 'nip_ppk',
      'nama_bendahara', 'nip_bendahara'
    ]

    const missing = required.filter(field => !data[field])
    if (missing.length > 0) {
      throw new Error(`Kuitansi UM validation failed. Missing: ${missing.join(', ')}`)
    }
  }

  /**
   * Validate Rampung data
   * @private
   */
  _validateRampung(data) {
    this._validateUangMuka(data)

    const required = ['total_biaya_riil', 'uang_muka', 'jumlah_rampung']
    const missing = required.filter(field => !data[field])
    if (missing.length > 0) {
      throw new Error(`Kuitansi Rampung validation failed. Missing: ${missing.join(', ')}`)
    }
  }

  /**
   * Validate Rincian data
   * @private
   */
  _validateRincian(data) {
    const required = [
      'nama_pegawai', 'nip_pegawai', 'jabatan_pegawai',
      'tujuan', 'grand_total',
      'nama_ppk', 'nip_ppk'
    ]

    const missing = required.filter(field => !data[field])
    if (missing.length > 0) {
      throw new Error(`Rincian Biaya validation failed. Missing: ${missing.join(', ')}`)
    }
  }

  /**
   * Generate nomor kuitansi
   * @private
   */
  _generateNomorKuitansi(masterData, type, tahunAnggaran) {
    if (masterData.nomorKuitansi || masterData.nomor_kuitansi) {
      return masterData.nomorKuitansi || masterData.nomor_kuitansi
    }

    // Format: KUIT-{type}-{sequence}/{kode_satker}/{bulan}/{tahun}
    const sequence = masterData.sequence || '001'
    const kodeSatker = masterData.satkerKode || 'XXXX'
    const bulan = this._toRoman(new Date().getMonth() + 1)

    return `KUIT-${type}-${sequence}/${kodeSatker}/${bulan}/${tahunAnggaran}`
  }

  // ============================================================================
  // HELPER METHODS (same as SPRGenerator)
  // ============================================================================

  /**
   * Format currency (IDR)
   * @private
   */
  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Convert number to Indonesian words (terbilang)
   * @private
   */
  _numberToWords(num) {
    if (num === 0) return 'Nol Rupiah'

    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
    const teens = [
      'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas',
      'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'
    ]

    const convert = (n) => {
      if (n === 0) return ''
      if (n < 10) return units[n]
      if (n >= 10 && n < 20) return teens[n - 10]
      if (n >= 20 && n < 100) {
        return units[Math.floor(n / 10)] + ' Puluh ' + units[n % 10]
      }
      if (n >= 100 && n < 200) {
        return 'Seratus ' + convert(n - 100)
      }
      if (n >= 200 && n < 1000) {
        return units[Math.floor(n / 100)] + ' Ratus ' + convert(n % 100)
      }
      if (n >= 1000 && n < 2000) {
        return 'Seribu ' + convert(n - 1000)
      }
      if (n >= 2000 && n < 1000000) {
        return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000)
      }
      if (n >= 1000000 && n < 1000000000) {
        return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000)
      }
      if (n >= 1000000000 && n < 1000000000000) {
        return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000)
      }
      return n.toString()
    }

    return convert(num).trim() + ' Rupiah'
  }

  /**
   * Format tanggal surat (e.g., "15 Januari 2024")
   * @private
   */
  _formatTanggalSurat(date) {
    const d = typeof date === 'string' ? new Date(date) : date

    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Convert number to Roman numerals
   * @private
   */
  _toRoman(num) {
    const lookup = {
      M: 1000, CM: 900, D: 500, CD: 400,
      C: 100, XC: 90, L: 50, XL: 40,
      X: 10, IX: 9, V: 5, IV: 4, I: 1
    }

    let roman = ''
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i
        num -= lookup[i]
      }
    }
    return roman
  }

  /**
   * Save document to file
   *
   * @param {Object} document - Generated document
   * @param {string} outputPath - Output file path
   * @returns {Promise<void>}
   */
  async save(document, outputPath) {
    try {
      await fs.writeFile(outputPath, document.html, 'utf-8')
      console.log(`[KuitansiPerdinGenerator] Document saved: ${outputPath}`)
    } catch (error) {
      console.error(`[KuitansiPerdinGenerator] Failed to save document:`, error)
      throw error
    }
  }
}

// Export singleton instance
const kuitansiPerdinGenerator = new KuitansiPerdinGenerator()
export default kuitansiPerdinGenerator
