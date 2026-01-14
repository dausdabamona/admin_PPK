import LS_KONTRAK_CHECKLIST from '../../../config/checklists/lskontrak.checklist'
import LS_KONTRAK_TEMPLATES from '../../../config/templates/lskontrak.templates'

/**
 * Configuration untuk LS Kontrak Process
 */

export const LS_KONTRAK_STEPS = [
  {
    name: 'data-kegiatan',
    title: 'Data Kegiatan',
    label: 'Kegiatan',
    description: 'Input data kegiatan dan anggaran',
    validate: (data) => {
      const warnings = []
      if (!data?.nama) warnings.push('Nama kegiatan belum diisi')
      if (!data?.kode) warnings.push('Kode kegiatan belum diisi')
      if (!data?.pagu) warnings.push('Pagu anggaran belum diisi')
      return warnings
    }
  },
  {
    name: 'data-kontrak',
    title: 'Data Kontrak',
    label: 'Kontrak',
    description: 'Input data kontrak/SPK',
    validate: (data) => {
      const warnings = []
      if (!data?.nomor) warnings.push('Nomor kontrak belum diisi')
      if (!data?.tanggal) warnings.push('Tanggal kontrak belum diisi')
      if (!data?.nilai) warnings.push('Nilai kontrak belum diisi')
      if (!data?.jenisKontrak) warnings.push('Jenis kontrak belum dipilih')
      return warnings
    }
  },
  {
    name: 'data-penyedia',
    title: 'Data Penyedia',
    label: 'Penyedia',
    description: 'Input data penyedia/vendor',
    validate: (data) => {
      const warnings = []
      if (!data?.nama) warnings.push('Nama penyedia belum diisi')
      if (!data?.npwp) warnings.push('NPWP penyedia belum diisi')
      if (!data?.alamat) warnings.push('Alamat penyedia belum diisi')
      if (!data?.rekening) warnings.push('Nomor rekening belum diisi')
      if (!data?.namaBank) warnings.push('Nama bank belum diisi')
      return warnings
    }
  },
  {
    name: 'checklist',
    title: 'Checklist Dokumen',
    label: 'Checklist',
    description: 'Daftar dokumen yang dibutuhkan (dapat dilengkapi nanti)',
    validate: () => [] // Non-blocking
  },
  {
    name: 'generate',
    title: 'Generate Dokumen',
    label: 'Generate',
    description: 'Generate dokumen otomatis dari data yang telah diinput',
    validate: () => []
  },
  {
    name: 'upload',
    title: 'Upload Dokumen TTD',
    label: 'Upload',
    description: 'Upload dokumen yang sudah ditandatangani',
    validate: () => []
  },
  {
    name: 'review',
    title: 'Review & Arsip',
    label: 'Review',
    description: 'Review final dan arsipkan paket SPJ',
    validate: () => []
  }
]

export const JENIS_KONTRAK_OPTIONS = [
  { value: 'barang', label: 'Pengadaan Barang' },
  { value: 'jasa', label: 'Jasa Konsultansi' },
  { value: 'konstruksi', label: 'Pekerjaan Konstruksi' },
  { value: 'jasa-lainnya', label: 'Jasa Lainnya' }
]

export const METODE_PENGADAAN_OPTIONS = [
  { value: 'tender', label: 'Tender' },
  { value: 'penunjukan-langsung', label: 'Penunjukan Langsung' },
  { value: 'pengadaan-langsung', label: 'Pengadaan Langsung' }
]

export { LS_KONTRAK_CHECKLIST, LS_KONTRAK_TEMPLATES }
