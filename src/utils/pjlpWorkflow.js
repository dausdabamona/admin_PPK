/**
 * PJLP Workflow & Document Generator
 * Berdasarkan:
 * - Perpres 16/2018 jo 12/2021 tentang PBJ Pemerintah
 * - PerLKPP 12/2021 tentang Pedoman Pengadaan melalui Penyedia
 * - SE Menteri KP No. 1946/MEN-KP/XI/2023
 * - Panduan Teknis Pengadaan Penyedia Jasa Lainnya Perseorangan KKP 2024
 */

// ==================== STATE MACHINE ====================
export const PJLP_WORKFLOW_STATES = {
  DRAFT: 'DRAFT',
  PERENCANAAN: 'PERENCANAAN',
  PERSETUJUAN_KPA: 'PERSETUJUAN_KPA',
  PERSIAPAN: 'PERSIAPAN',
  PEMILIHAN: 'PEMILIHAN',
  KONTRAK: 'KONTRAK',
  PELAKSANAAN: 'PELAKSANAAN',
  SERAH_TERIMA: 'SERAH_TERIMA',
  PEMBAYARAN: 'PEMBAYARAN',
  EVALUASI: 'EVALUASI',
  ARSIP: 'ARSIP'
}

export const PJLP_STATE_LABELS = {
  DRAFT: 'Draft',
  PERENCANAAN: 'Perencanaan',
  PERSETUJUAN_KPA: 'Persetujuan KPA',
  PERSIAPAN: 'Persiapan',
  PEMILIHAN: 'Pemilihan',
  KONTRAK: 'Kontrak',
  PELAKSANAAN: 'Pelaksanaan',
  SERAH_TERIMA: 'Serah Terima',
  PEMBAYARAN: 'Pembayaran',
  EVALUASI: 'Evaluasi',
  ARSIP: 'Arsip'
}

// State transitions yang diizinkan
export const PJLP_STATE_TRANSITIONS = {
  DRAFT: ['PERENCANAAN'],
  PERENCANAAN: ['PERSETUJUAN_KPA', 'DRAFT'],
  PERSETUJUAN_KPA: ['PERSIAPAN', 'PERENCANAAN'],
  PERSIAPAN: ['PEMILIHAN', 'PERSETUJUAN_KPA'],
  PEMILIHAN: ['KONTRAK', 'PERSIAPAN'],
  KONTRAK: ['PELAKSANAAN', 'PEMILIHAN'],
  PELAKSANAAN: ['SERAH_TERIMA', 'KONTRAK'],
  SERAH_TERIMA: ['PEMBAYARAN', 'PELAKSANAAN'],
  PEMBAYARAN: ['EVALUASI', 'SERAH_TERIMA'],
  EVALUASI: ['ARSIP', 'PEMBAYARAN'],
  ARSIP: []
}

// Dokumen yang diperlukan per state
export const PJLP_STATE_DOCUMENTS = {
  PERENCANAAN: [
    { id: 'identifikasi_kebutuhan', nama: 'Identifikasi Kebutuhan PJLP', wajib: true },
    { id: 'analisis_jenis_pekerjaan', nama: 'Analisis Jenis Pekerjaan', wajib: true },
    { id: 'analisis_beban_kerja', nama: 'Analisis Beban Kerja (ABK)', wajib: true },
    { id: 'form_perencanaan', nama: 'Form Perencanaan Pengadaan', wajib: true }
  ],
  PERSETUJUAN_KPA: [
    { id: 'penetapan_kpa', nama: 'Penetapan Perencanaan oleh KPA', wajib: true }
  ],
  PERSIAPAN: [
    { id: 'kak', nama: 'Kerangka Acuan Kerja (KAK)', wajib: true },
    { id: 'spesifikasi_teknis', nama: 'Spesifikasi Teknis', wajib: true },
    { id: 'hps', nama: 'Harga Perkiraan Sendiri (HPS)', wajib: true },
    { id: 'kertas_kerja_hps', nama: 'Kertas Kerja HPS', wajib: true },
    { id: 'draft_spk', nama: 'Draft Surat Perintah Kerja (SPK)', wajib: false }
  ],
  PEMILIHAN: [
    { id: 'pengumuman', nama: 'Pengumuman PJLP', wajib: true },
    { id: 'undangan', nama: 'Undangan', wajib: true },
    { id: 'dokumen_lamaran', nama: 'Dokumen Lamaran', wajib: true },
    { id: 'form_kualifikasi', nama: 'Form Isian Kualifikasi', wajib: true },
    { id: 'ba_evaluasi', nama: 'Berita Acara Evaluasi', wajib: true },
    { id: 'ba_klarifikasi_negosiasi', nama: 'BA Klarifikasi & Negosiasi', wajib: true },
    { id: 'laporan_pengadaan', nama: 'Laporan Hasil Pengadaan Langsung', wajib: true }
  ],
  KONTRAK: [
    { id: 'sppbj', nama: 'Surat Penunjukan Penyedia (SPPBJ)', wajib: true },
    { id: 'spk', nama: 'Surat Perintah Kerja (SPK)', wajib: true },
    { id: 'spmk', nama: 'Surat Perintah Mulai Kerja (SPMK)', wajib: true }
  ],
  PELAKSANAAN: [
    { id: 'laporan_harian', nama: 'Laporan Harian', wajib: false },
    { id: 'laporan_bulanan', nama: 'Laporan Bulanan', wajib: true }
  ],
  SERAH_TERIMA: [
    { id: 'ba_pemeriksaan', nama: 'Berita Acara Pemeriksaan', wajib: true },
    { id: 'ba_penyelesaian', nama: 'BA Penyelesaian Pekerjaan', wajib: true },
    { id: 'bast', nama: 'Berita Acara Serah Terima (BAST)', wajib: true }
  ],
  PEMBAYARAN: [
    { id: 'ba_pembayaran', nama: 'Berita Acara Pembayaran', wajib: true },
    { id: 'kuitansi', nama: 'Kuitansi', wajib: true },
    { id: 'daftar_nominatif', nama: 'Daftar Nominatif', wajib: true },
    { id: 'spp', nama: 'SPP', wajib: false },
    { id: 'spm', nama: 'SPM', wajib: false },
    { id: 'ssp', nama: 'SSP', wajib: true },
    { id: 'faktur_pajak', nama: 'Faktur Pajak', wajib: false }
  ],
  EVALUASI: [
    { id: 'form_penilaian', nama: 'Form Penilaian Kinerja PJLP', wajib: true },
    { id: 'rekap_nilai', nama: 'Rekap Nilai Kinerja', wajib: false }
  ]
}

// ==================== RULE ENGINE KEPATUHAN ====================
export const PJLP_COMPLIANCE_RULES = {
  // Jika nilai > 200 juta → wajib SPK + SPMK
  nilaiKontrak: {
    threshold200jt: 200000000,
    above200jt: ['spk', 'spmk', 'jaminan_pelaksanaan']
  },
  // Jika metode LS → aktifkan SPP, SPM, SSP, Faktur
  metodePembayaran: {
    LS: ['spp', 'spm', 'ssp', 'faktur_pajak'],
    UP: ['kuitansi', 'ssp']
  },
  // Jenis pekerjaan yang memerlukan sertifikat
  sertifikatWajib: {
    keamanan: ['sertifikat_satpam', 'kta_satpam'],
    pengemudi: ['sim_a', 'sim_b'],
    cleaning_service: []
  }
}

// ==================== AUTO NUMBERING ====================
export const PJLP_NOMOR_FORMAT = {
  // Format: [Urut]/[Jenis]/[Satker]/[Bulan]/[Tahun]
  KAK: '{urut}/KAK-PJLP/{satker}/{bulan}/{tahun}',
  HPS: '{urut}/HPS-PJLP/{satker}/{bulan}/{tahun}',
  SPK: '{urut}/SPK-PJLP/{satker}/{bulan}/{tahun}',
  SPMK: '{urut}/SPMK-PJLP/{satker}/{bulan}/{tahun}',
  SPPBJ: '{urut}/SPPBJ-PJLP/{satker}/{bulan}/{tahun}',
  BAST: '{urut}/BAST-PJLP/{satker}/{bulan}/{tahun}',
  KUITANSI: '{urut}/KWT-PJLP/{satker}/{bulan}/{tahun}',
  BA_EVALUASI: '{urut}/BA-EVAL/{satker}/{bulan}/{tahun}',
  BA_NEGOSIASI: '{urut}/BA-NEGO/{satker}/{bulan}/{tahun}'
}

// ==================== STRUKTUR ARSIP ====================
export const PJLP_ARSIP_STRUKTUR = {
  // Tahun → Satker → Paket → Tahap → Dokumen
  getPath: (tahun, satker, namaPjlp, tahap) => {
    const namaClean = namaPjlp?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'
    return `ARSIP/${tahun}/PJLP/${satker}/${namaClean}/${tahap}/`
  }
}

// ==================== JENIS PEKERJAAN PJLP ====================
export const JENIS_PEKERJAAN_PJLP = [
  { id: 'keamanan', nama: 'Tenaga Keamanan', kualifikasi: ['Sertifikat Gada Pratama', 'KTA Satpam'] },
  { id: 'kebersihan', nama: 'Tenaga Kebersihan', kualifikasi: [] },
  { id: 'pengemudi', nama: 'Pengemudi', kualifikasi: ['SIM A/B'] },
  { id: 'resepsionis', nama: 'Resepsionis', kualifikasi: [] },
  { id: 'operator', nama: 'Operator Komputer', kualifikasi: [] },
  { id: 'teknisi', nama: 'Teknisi', kualifikasi: ['Sertifikat Keahlian'] },
  { id: 'pramubakti', nama: 'Pramubakti', kualifikasi: [] },
  { id: 'caraka', nama: 'Caraka/Kurir', kualifikasi: ['SIM C'] }
]

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if state transition is valid
 */
export function canTransitionTo(currentState, targetState) {
  const allowedTransitions = PJLP_STATE_TRANSITIONS[currentState] || []
  return allowedTransitions.includes(targetState)
}

/**
 * Get required documents for a state
 */
export function getRequiredDocuments(state) {
  return PJLP_STATE_DOCUMENTS[state] || []
}

/**
 * Check if all required documents are complete for a state
 */
export function isStateComplete(state, completedDocuments) {
  const requiredDocs = getRequiredDocuments(state).filter(d => d.wajib)
  return requiredDocs.every(doc => completedDocuments.includes(doc.id))
}

/**
 * Generate nomor dokumen otomatis
 */
export function generateNomorDokumen(jenis, urut, satker, tanggal = new Date()) {
  const format = PJLP_NOMOR_FORMAT[jenis]
  if (!format) return null

  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0')
  const tahun = tanggal.getFullYear()
  const urutPadded = String(urut).padStart(3, '0')

  return format
    .replace('{urut}', urutPadded)
    .replace('{satker}', satker || 'PKP-SRG')
    .replace('{bulan}', bulan)
    .replace('{tahun}', tahun)
}

/**
 * Check compliance rules
 */
export function checkComplianceRules(kontrak) {
  const warnings = []
  const requirements = []

  // Check nilai kontrak
  if (kontrak.nilaiKontrak > PJLP_COMPLIANCE_RULES.nilaiKontrak.threshold200jt) {
    requirements.push(...PJLP_COMPLIANCE_RULES.nilaiKontrak.above200jt)
    warnings.push('Nilai kontrak > 200 juta, wajib SPK + SPMK + Jaminan Pelaksanaan')
  }

  // Check metode pembayaran
  const metodeDocs = PJLP_COMPLIANCE_RULES.metodePembayaran[kontrak.metodePembayaran] || []
  requirements.push(...metodeDocs)

  // Check sertifikat berdasarkan jenis pekerjaan
  const sertifikat = PJLP_COMPLIANCE_RULES.sertifikatWajib[kontrak.jenisPekerjaan] || []
  if (sertifikat.length > 0) {
    requirements.push(...sertifikat)
    warnings.push(`Jenis pekerjaan ${kontrak.jenisPekerjaan} memerlukan: ${sertifikat.join(', ')}`)
  }

  return { warnings, requirements }
}

/**
 * Get next available states from current state
 */
export function getNextStates(currentState) {
  return PJLP_STATE_TRANSITIONS[currentState] || []
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentState) {
  const states = Object.keys(PJLP_WORKFLOW_STATES)
  const currentIndex = states.indexOf(currentState)
  return Math.round((currentIndex / (states.length - 1)) * 100)
}

// ==================== TEMPLATE VARIABLES ====================
export const PJLP_TEMPLATE_VARIABLES = {
  // Identitas Satker
  satker: '{{satker}}',
  alamat_satker: '{{alamat_satker}}',
  kota: '{{kota}}',
  kode_satker: '{{kode_satker}}',

  // Pejabat
  ppk: '{{ppk}}',
  nip_ppk: '{{nip_ppk}}',
  jabatan_ppk: '{{jabatan_ppk}}',
  kpa: '{{kpa}}',
  nip_kpa: '{{nip_kpa}}',
  bendahara: '{{bendahara}}',
  nip_bendahara: '{{nip_bendahara}}',

  // PJLP
  nama_pjlp: '{{nama_pjlp}}',
  nik_pjlp: '{{nik_pjlp}}',
  npwp_pjlp: '{{npwp_pjlp}}',
  alamat_pjlp: '{{alamat_pjlp}}',
  rekening_pjlp: '{{rekening_pjlp}}',
  bank_pjlp: '{{bank_pjlp}}',

  // Kontrak
  jenis_pekerjaan: '{{jenis_pekerjaan}}',
  uraian_pekerjaan: '{{uraian_pekerjaan}}',
  lokasi_kerja: '{{lokasi_kerja}}',
  nilai_kontrak: '{{nilai_kontrak}}',
  nilai_terbilang: '{{nilai_terbilang}}',
  periode_awal: '{{periode_awal}}',
  periode_akhir: '{{periode_akhir}}',
  durasi_kontrak: '{{durasi_kontrak}}',

  // Dokumen
  nomor_dokumen: '{{nomor_dokumen}}',
  tanggal: '{{tanggal}}',
  tahun_anggaran: '{{tahun_anggaran}}'
}

export default {
  PJLP_WORKFLOW_STATES,
  PJLP_STATE_LABELS,
  PJLP_STATE_TRANSITIONS,
  PJLP_STATE_DOCUMENTS,
  PJLP_COMPLIANCE_RULES,
  PJLP_NOMOR_FORMAT,
  PJLP_ARSIP_STRUKTUR,
  JENIS_PEKERJAAN_PJLP,
  PJLP_TEMPLATE_VARIABLES,
  canTransitionTo,
  getRequiredDocuments,
  isStateComplete,
  generateNomorDokumen,
  checkComplianceRules,
  getNextStates,
  calculateProgress
}
