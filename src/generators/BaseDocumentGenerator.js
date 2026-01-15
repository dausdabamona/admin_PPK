/**
 * ============================================================================
 * BASE DOCUMENT GENERATOR - Parent Class untuk Semua Document Generators
 * ============================================================================
 *
 * Abstract base class yang menjadi foundation untuk semua document generators
 * (SPR, SPPR, BAST, BAP, RPD, Kuitansi, Nominatif, Cover, Kontrak, SPTJB).
 *
 * Setiap generator harus:
 * - Extend class ini
 * - Implement method getTemplatePath() dan populateTemplate()
 * - Menggunakan master data sebagai single source of truth
 * - Auto-validate sebelum generate
 * - Auto-format semua field (tanggal, rupiah, terbilang)
 *
 * Output yang dihasilkan:
 * - HTML (siap print)
 * - PDF (via DocumentRenderService)
 * - DOCX (optional, via conversion)
 * - Metadata (hash, timestamp, dll)
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { validateForDocument } from '../utils/masterDataValidator.js'
import {
  formatTanggal,
  formatTanggalPanjang,
  formatRupiah,
  formatAlamat,
  generateTerbilang
} from '../utils/masterDataHelpers.js'
import { toTerbilang } from '../utils/terbilangGenerator.js'

/**
 * Base Document Generator Class
 *
 * @abstract
 */
export class BaseDocumentGenerator {
  constructor(masterData) {
    if (new.target === BaseDocumentGenerator) {
      throw new TypeError('Cannot construct BaseDocumentGenerator instances directly')
    }

    this.masterData = masterData
    this.documentType = this.getDocumentType()
    this.templatePath = this.getTemplatePath()
    this.errors = {}
    this.warnings = []
  }

  /**
   * Get document type (harus di-override oleh child class)
   * @abstract
   * @returns {string} Document type ('SPR', 'SPPR', 'BAST', dll)
   */
  getDocumentType() {
    throw new Error('Method getDocumentType() must be implemented by child class')
  }

  /**
   * Get template path (harus di-override oleh child class)
   * @abstract
   * @returns {string} Path to template file
   */
  getTemplatePath() {
    throw new Error('Method getTemplatePath() must be implemented by child class')
  }

  /**
   * Populate template dengan data (harus di-override oleh child class)
   * @abstract
   * @param {string} template - Template content
   * @returns {string} Populated template
   */
  populateTemplate(template) {
    throw new Error('Method populateTemplate() must be implemented by child class')
  }

  /**
   * Validate master data sebelum generate
   *
   * @returns {boolean} True jika valid
   */
  validate() {
    const result = validateForDocument(this.masterData, this.documentType)

    this.errors = result.errors
    this.warnings = result.warnings || []

    return result.isValid
  }

  /**
   * Get validation errors
   *
   * @returns {Object} Errors object
   */
  getErrors() {
    return this.errors
  }

  /**
   * Get validation warnings
   *
   * @returns {string[]} Array of warnings
   */
  getWarnings() {
    return this.warnings
  }

  /**
   * Format helper: Format tanggal to DD/MM/YYYY
   *
   * @param {string|Date} date - Date
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return formatTanggal(date)
  }

  /**
   * Format helper: Format tanggal to long format (DD Month YYYY)
   *
   * @param {string|Date} date - Date
   * @returns {string} Formatted date
   */
  formatDateLong(date) {
    return formatTanggalPanjang(date)
  }

  /**
   * Format helper: Format rupiah
   *
   * @param {number} amount - Amount
   * @param {Object} options - Options
   * @returns {string} Formatted rupiah
   */
  formatCurrency(amount, options = {}) {
    return formatRupiah(amount, options)
  }

  /**
   * Format helper: Convert angka to terbilang
   *
   * @param {number} amount - Amount
   * @returns {string} Terbilang
   */
  formatTerbilang(amount) {
    return toTerbilang(amount)
  }

  /**
   * Format helper: Format alamat
   *
   * @param {Object} addressObj - Address object
   * @returns {string} Formatted address
   */
  formatAddress(addressObj) {
    return formatAlamat(addressObj)
  }

  /**
   * Get common document data (dipakai oleh semua dokumen)
   *
   * @returns {Object} Common data
   */
  getCommonData() {
    const { satker, pejabat, tahunAnggaran, kegiatan, anggaran, penyedia, bank, dokumen } = this.masterData

    return {
      // Satker
      satkerKode: satker?.kode || '',
      satkerNama: satker?.nama || '',
      satkerAlamat: this.formatAddress(satker?.alamat) || '',
      satkerTelepon: satker?.telepon || '',
      satkerEmail: satker?.email || '',
      satkerKementerian: satker?.kementerian || '',
      satkerEselon1: satker?.unitEselon1 || '',

      // Tahun Anggaran
      tahunAnggaran: tahunAnggaran || new Date().getFullYear(),

      // KPA
      kpaNama: pejabat?.kpa?.nama || '',
      kpaNip: pejabat?.kpa?.nip || '',
      kpaJabatan: pejabat?.kpa?.jabatan || '',
      kpaPangkat: pejabat?.kpa?.pangkat || '',

      // PPK
      ppkNama: pejabat?.ppk?.nama || '',
      ppkNip: pejabat?.ppk?.nip || '',
      ppkJabatan: pejabat?.ppk?.jabatan || '',
      ppkPangkat: pejabat?.ppk?.pangkat || '',

      // Bendahara
      bendaharaNama: pejabat?.bendahara?.nama || '',
      bendaharaNip: pejabat?.bendahara?.nip || '',

      // PPHP (array)
      pphp: pejabat?.pphp || [],
      pphpKetua: pejabat?.pphp?.find(p => p.role === 'ketua') || pejabat?.pphp?.[0] || {},

      // Kegiatan
      programKode: kegiatan?.program?.kode || '',
      programNama: kegiatan?.program?.nama || '',
      kegiatanKode: kegiatan?.kegiatan?.kode || '',
      kegiatanNama: kegiatan?.kegiatan?.nama || '',
      outputKode: kegiatan?.output?.kode || '',
      outputNama: kegiatan?.output?.nama || '',
      outputVolume: kegiatan?.output?.volume || '',
      outputSatuan: kegiatan?.output?.satuan || '',
      komponenKode: kegiatan?.komponen?.kode || '',
      komponenNama: kegiatan?.komponen?.nama || '',
      akunKode: kegiatan?.akun?.kode || '',
      akunNama: kegiatan?.akun?.nama || '',
      kegiatanUraian: kegiatan?.uraian || '',
      kegiatanLokasi: kegiatan?.lokasi || '',
      kegiatanWaktuMulai: kegiatan?.waktu?.mulai || '',
      kegiatanWaktuSelesai: kegiatan?.waktu?.selesai || '',
      kegiatanDurasi: kegiatan?.waktu?.durasi || 0,

      // Kegiatan - Formatted
      kegiatanWaktuMulaiFormat: this.formatDate(kegiatan?.waktu?.mulai),
      kegiatanWaktuMulaiPanjang: this.formatDateLong(kegiatan?.waktu?.mulai),
      kegiatanWaktuSelesaiFormat: this.formatDate(kegiatan?.waktu?.selesai),
      kegiatanWaktuSelesaiPanjang: this.formatDateLong(kegiatan?.waktu?.selesai),

      // Anggaran
      sumberDana: anggaran?.sumberDana || 'APBN',
      dipaRevisi: anggaran?.dipaRevisi || 0,
      pagu: anggaran?.pagu || 0,
      nilaiKontrak: anggaran?.nilaiKontrak || 0,
      nilaiDibayar: anggaran?.nilaiDibayar || 0,
      potonganPph21: anggaran?.potongan?.pph21 || 0,
      potonganPph22: anggaran?.potongan?.pph22 || 0,
      potonganPph23: anggaran?.potongan?.pph23 || 0,
      potonganPpn: anggaran?.potongan?.ppn || 0,
      potonganTotal: anggaran?.potongan?.total || 0,
      terbilang: anggaran?.terbilang || '',

      // Anggaran - Formatted
      paguFormat: this.formatCurrency(anggaran?.pagu),
      nilaiKontrakFormat: this.formatCurrency(anggaran?.nilaiKontrak),
      nilaiDibayarFormat: this.formatCurrency(anggaran?.nilaiDibayar),
      potonganPph21Format: this.formatCurrency(anggaran?.potongan?.pph21),
      potonganPph23Format: this.formatCurrency(anggaran?.potongan?.pph23),
      potonganPpnFormat: this.formatCurrency(anggaran?.potongan?.ppn),
      potonganTotalFormat: this.formatCurrency(anggaran?.potongan?.total),

      // Penyedia
      penyediaJenis: penyedia?.jenis || '',
      penyediaNama: penyedia?.nama || '',
      penyediaPimpinan: penyedia?.pimpinan || '',
      penyediaJabatan: penyedia?.jabatan || '',
      penyediaAlamat: this.formatAddress(penyedia?.alamat) || '',
      penyediaTelepon: penyedia?.kontak?.telepon || '',
      penyediaEmail: penyedia?.kontak?.email || '',
      penyediaNpwp: penyedia?.identitas?.npwp || '',
      penyediaNik: penyedia?.identitas?.nik || '',
      penyediaNomorAkta: penyedia?.identitas?.nomorAkta || '',

      // Bank
      bankNama: bank?.namaBank || '',
      bankCabang: bank?.cabang || '',
      bankRekening: bank?.nomorRekening || '',
      bankAtasNama: bank?.atasNama || '',

      // Dokumen
      kontrakNomor: dokumen?.kontrak?.nomor || '',
      kontrakTanggal: dokumen?.kontrak?.tanggal || '',
      kontrakTanggalFormat: this.formatDate(dokumen?.kontrak?.tanggal),
      kontrakTanggalPanjang: this.formatDateLong(dokumen?.kontrak?.tanggal),

      sprNomor: dokumen?.spr?.nomor || '',
      sprTanggal: dokumen?.spr?.tanggal || '',
      sprTanggalFormat: this.formatDate(dokumen?.spr?.tanggal),
      sprTanggalPanjang: this.formatDateLong(dokumen?.spr?.tanggal),

      spprNomor: dokumen?.sppr?.nomor || '',
      spprTanggal: dokumen?.sppr?.tanggal || '',
      spprTanggalFormat: this.formatDate(dokumen?.sppr?.tanggal),
      spprTanggalPanjang: this.formatDateLong(dokumen?.sppr?.tanggal),

      bastNomor: dokumen?.bast?.nomor || '',
      bastTanggal: dokumen?.bast?.tanggal || '',
      bastTanggalFormat: this.formatDate(dokumen?.bast?.tanggal),
      bastTanggalPanjang: this.formatDateLong(dokumen?.bast?.tanggal),

      bapNomor: dokumen?.bap?.nomor || '',
      bapTanggal: dokumen?.bap?.tanggal || '',
      bapTanggalFormat: this.formatDate(dokumen?.bap?.tanggal),
      bapTanggalPanjang: this.formatDateLong(dokumen?.bap?.tanggal),

      sptjbNomor: dokumen?.sptjb?.nomor || '',
      sptjbTanggal: dokumen?.sptjb?.tanggal || '',
      sptjbTanggalFormat: this.formatDate(dokumen?.sptjb?.tanggal),
      sptjbTanggalPanjang: this.formatDateLong(dokumen?.sptjb?.tanggal),

      rpdNomor: dokumen?.rpd?.nomor || '',
      rpdTanggal: dokumen?.rpd?.tanggal || '',
      rpdTanggalFormat: this.formatDate(dokumen?.rpd?.tanggal),
      rpdTanggalPanjang: this.formatDateLong(dokumen?.rpd?.tanggal),

      sp2dNomor: dokumen?.sp2d?.nomor || '',
      sp2dTanggal: dokumen?.sp2d?.tanggal || '',
      sp2dTanggalFormat: this.formatDate(dokumen?.sp2d?.tanggal),
      sp2dTanggalPanjang: this.formatDateLong(dokumen?.sp2d?.tanggal),

      kuitansiNomor: dokumen?.kuitansi?.nomor || '',
      kuitansiTanggal: dokumen?.kuitansi?.tanggal || '',
      kuitansiTanggalFormat: this.formatDate(dokumen?.kuitansi?.tanggal),
      kuitansiTanggalPanjang: this.formatDateLong(dokumen?.kuitansi?.tanggal)
    }
  }

  /**
   * Replace placeholders in template
   *
   * Placeholder format: {{variableName}}
   *
   * @param {string} template - Template content
   * @param {Object} data - Data object
   * @returns {string} Replaced template
   */
  replacePlaceholders(template, data) {
    let result = template

    // Replace all {{variable}} with actual values
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      result = result.replace(regex, value !== null && value !== undefined ? String(value) : '')
    }

    return result
  }

  /**
   * Generate document metadata
   *
   * @returns {Object} Metadata
   */
  generateMetadata() {
    return {
      documentType: this.documentType,
      masterDataId: this.masterData.id,
      generatedAt: new Date().toISOString(),
      generatedBy: this.masterData.metadata?.createdBy || 'system',
      version: '1.0.0',
      templatePath: this.templatePath,
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  /**
   * Generate HTML document
   *
   * @param {string} template - Template content
   * @returns {Object} Result object
   */
  async generateHTML(template) {
    // Validate first
    if (!this.validate()) {
      throw new Error(`Validation failed for ${this.documentType}: ${JSON.stringify(this.errors)}`)
    }

    // Populate template
    const html = this.populateTemplate(template)

    // Generate metadata
    const metadata = this.generateMetadata()

    return {
      html,
      metadata,
      success: true
    }
  }

  /**
   * Generate document (main method)
   *
   * @param {string} template - Template content
   * @returns {Promise<Object>} Result object dengan html, pdf, metadata
   */
  async generate(template) {
    try {
      // Generate HTML
      const result = await this.generateHTML(template)

      return {
        ...result,
        documentType: this.documentType,
        masterDataId: this.masterData.id
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        documentType: this.documentType,
        masterDataId: this.masterData.id,
        metadata: this.generateMetadata()
      }
    }
  }
}

export default BaseDocumentGenerator
