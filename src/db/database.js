import Dexie from 'dexie'

// Create database instance
export const db = new Dexie('SIPBJ_SPJ_Database')

// Database schema version 2 - Added Swakelola tables
db.version(2).stores({
  // ==================== EXISTING TABLES ====================
  // Master Data: Pegawai
  pegawai: '++id, nip, nama, jabatan, golongan, pangkat, rekening, bank, unitKerja, createdAt',

  // Master Data: Kota (dengan SBM tarif untuk Dalam Kota dan Luar Kota)
  kota: '++id, namaKota, provinsi, tarifHarianDalamKota, tarifHarianLuarKota, tarifPenginapan, tarifTransportLokal, tarifTransportAntarKota, createdAt',

  // Master Data: Pejabat (PPK, KPA)
  pejabat: '++id, nip, nama, jabatan, jenisPejabat, pangkat, golongan, createdAt',

  // Surat Tugas
  suratTugas: '++id, nomor, tanggal, perihal, dasar, tujuanKegiatan, pegawaiIds, kotaAsal, kotaTujuan, tanggalMulai, tanggalSelesai, transportasi, jenisPerjadin, status, createdAt',

  // SPPD
  sppd: '++id, nomor, suratTugasId, pegawaiId, tanggal, jenisPerjadin, kotaAsal, kotaTujuan, tanggalBerangkat, tanggalKembali, maksudPerjalanan, tingkatBiaya, keteranganLain, ppkId, kpaId, status, createdAt',

  // Pembayaran LS (Awal)
  pembayaranLS: '++id, sppdId, pegawaiId, tanggal, uangHarian, jumlahHari, totalUangHarian, transport, penginapan, jumlahMalam, totalPenginapan, totalLS, keterangan, createdAt',

  // Rampung Perjalanan Dinas
  rampung: '++id, sppdId, pegawaiId, jenisPerjadin, tanggal, realisasiUangHarian, jumlahHariRealisasi, totalRealisasiUangHarian, realisasiTransport, realisasiPenginapan, jumlahMalamRealisasi, totalRealisasiPenginapan, totalPengeluaranRiil, totalRealisasi, nilaiLS, selisih, statusSelisih, keterangan, createdAt',

  // Detail Pengeluaran Riil
  pengeluaranRiil: '++id, rampungId, tanggal, uraian, jumlah, bukti, createdAt',

  // Rincian Biaya (untuk dokumen)
  rincianBiaya: '++id, rampungId, jenisBiaya, uraian, volume, satuan, hargaSatuan, jumlah, createdAt',

  // Kwitansi SPPD
  kwitansiSPPD: '++id, rampungId, sppdId, pegawaiId, nomor, tanggal, jumlah, terbilang, keterangan, ttdPegawai, ttdPPK, createdAt',

  // Checklist SPJ SPPD
  checklistSPJ: '++id, sppdId, jenisPerjadin, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt',

  // Settings / Konfigurasi
  settings: '++id, key, value, updatedAt',

  // Nomor Urut (untuk auto numbering)
  nomorUrut: '++id, jenis, tahun, bulan, nomorTerakhir',

  // ==================== SWAKELOLA TABLES ====================
  // Master Data: Kegiatan Swakelola
  swakelolaKegiatan: '++id, kode, nama, tahun, sumberDana, akun, pagu, deskripsi, tanggalMulai, tanggalSelesai, status, createdAt',

  // Tim Swakelola
  swakelolaTim: '++id, kegiatanId, nomorSK, tanggalSK, pegawaiId, peran, honorPerBulan, jumlahBulan, totalHonor, rekening, bank, createdAt',

  // Uang Muka / Panjar Swakelola
  swakelolaUangMuka: '++id, kegiatanId, nomorKwitansi, tanggal, penerimaId, tipePenerima, jumlah, terbilang, keterangan, rekeningTujuan, bankTujuan, status, createdAt',

  // Realisasi Biaya Swakelola
  swakelolaRealisasi: '++id, kegiatanId, uangMukaId, tanggal, items, totalRealisasi, keterangan, createdAt',

  // Item Realisasi Detail
  swakelolaRealisasiItem: '++id, realisasiId, kategori, uraian, volume, satuan, hargaSatuan, jumlah, tanggal, noBukti, createdAt',

  // Rampung Swakelola
  swakelolaRampung: '++id, kegiatanId, uangMukaId, realisasiId, tanggal, totalUangMuka, totalRealisasi, selisih, statusSelisih, nomorKwitansi, keterangan, createdAt',

  // Checklist SPJ Swakelola
  swakelolaChecklist: '++id, kegiatanId, rampungId, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt'
})

// Checklist templates for SPPD
export const CHECKLIST_DALAM_KOTA = [
  { id: 'surat_tugas', nama: 'Surat Tugas', wajib: true },
  { id: 'sppd', nama: 'SPPD Dalam Kota', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Perjalanan Dinas', wajib: true },
  { id: 'pengeluaran_riil', nama: 'Daftar Pengeluaran Riil', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh (jika ada)', wajib: false },
  { id: 'laporan_perjadin', nama: 'Laporan Perjalanan Dinas', wajib: true }
]

export const CHECKLIST_LUAR_KOTA = [
  { id: 'surat_tugas', nama: 'Surat Tugas', wajib: true },
  { id: 'sppd', nama: 'SPPD Luar Kota', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Perjalanan Dinas', wajib: true },
  { id: 'pengeluaran_riil', nama: 'Daftar Pengeluaran Riil', wajib: true },
  { id: 'boarding_pass', nama: 'Boarding Pass / Tiket', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh', wajib: false },
  { id: 'laporan_perjadin', nama: 'Laporan Perjalanan Dinas', wajib: true }
]

// Checklist template for Swakelola (Kepmen KP No.56 Tahun 2024)
export const CHECKLIST_SWAKELOLA = [
  { id: 'sk_tim', nama: 'SK / Surat Tugas Tim Swakelola', wajib: true },
  { id: 'rab', nama: 'RAB Swakelola', wajib: true },
  { id: 'kwitansi_uang_muka', nama: 'Kwitansi Uang Muka', wajib: true },
  { id: 'bukti_realisasi', nama: 'Bukti Realisasi (Nota, Kuitansi)', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Realisasi', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung Swakelola', wajib: true },
  { id: 'ssp_setoran', nama: 'SSP Setoran Sisa (jika lebih bayar)', wajib: false },
  { id: 'laporan_kegiatan', nama: 'Laporan Pelaksanaan Kegiatan', wajib: true }
]

// Kategori Realisasi Swakelola
export const KATEGORI_REALISASI_SWAKELOLA = [
  { id: 'belanja_bahan', nama: 'Belanja Bahan', kode: '521211' },
  { id: 'honor_tim', nama: 'Honor Tim Pelaksana', kode: '521213' },
  { id: 'transport_lokal', nama: 'Transport Lokal', kode: '524119' },
  { id: 'sewa_alat', nama: 'Sewa Peralatan', kode: '522141' },
  { id: 'konsumsi', nama: 'Konsumsi Rapat/Kegiatan', kode: '521211' },
  { id: 'pengeluaran_riil', nama: 'Pengeluaran Riil Lainnya', kode: '521219' },
  { id: 'fotocopy', nama: 'Fotocopy/ATK', kode: '521211' },
  { id: 'dokumentasi', nama: 'Dokumentasi', kode: '521219' }
]

// Peran dalam Tim Swakelola
export const PERAN_TIM_SWAKELOLA = [
  { id: 'ketua', nama: 'Ketua Tim' },
  { id: 'sekretaris', nama: 'Sekretaris' },
  { id: 'bendahara', nama: 'Bendahara' },
  { id: 'anggota', nama: 'Anggota' },
  { id: 'pelaksana', nama: 'Pelaksana' }
]

// Jenis Perjadin constants
export const JENIS_PERJADIN = {
  DALAM_KOTA: 'dalam_kota',
  LUAR_KOTA: 'luar_kota'
}

// Status Swakelola
export const STATUS_SWAKELOLA = {
  DRAFT: 'draft',
  AKTIF: 'aktif',
  PROSES: 'proses',
  SELESAI: 'selesai'
}

// Initialize default settings
export async function initializeDefaultSettings() {
  const existingSettings = await db.settings.count()

  if (existingSettings === 0) {
    await db.settings.bulkAdd([
      { key: 'nama_instansi', value: 'Politeknik Kelautan dan Perikanan Sorong', updatedAt: new Date() },
      { key: 'alamat_instansi', value: 'Jl. Kapitan Pattimura, Sorong, Papua Barat Daya', updatedAt: new Date() },
      { key: 'kode_satker', value: '032.11.423.585', updatedAt: new Date() },
      { key: 'tahun_anggaran', value: new Date().getFullYear().toString(), updatedAt: new Date() },
      { key: 'prefix_surat_tugas', value: 'ST', updatedAt: new Date() },
      { key: 'prefix_sppd', value: 'SPPD', updatedAt: new Date() },
      { key: 'prefix_swakelola', value: 'SWK', updatedAt: new Date() },
      { key: 'prefix_kwitansi', value: 'KWT', updatedAt: new Date() },
      { key: 'nama_ppk', value: '', updatedAt: new Date() },
      { key: 'nip_ppk', value: '', updatedAt: new Date() },
      { key: 'nama_kpa', value: '', updatedAt: new Date() },
      { key: 'nip_kpa', value: '', updatedAt: new Date() }
    ])
  }
}

// Initialize default kota with SBM tarif
export async function initializeDefaultKota() {
  const existingKota = await db.kota.count()

  if (existingKota === 0) {
    await db.kota.bulkAdd([
      {
        namaKota: 'Sorong',
        provinsi: 'Papua Barat Daya',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 0,
        createdAt: new Date()
      },
      {
        namaKota: 'Manokwari',
        provinsi: 'Papua Barat',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 1500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Jayapura',
        provinsi: 'Papua',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 640000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 2500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Makassar',
        provinsi: 'Sulawesi Selatan',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 710000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 3000000,
        createdAt: new Date()
      },
      {
        namaKota: 'Jakarta',
        provinsi: 'DKI Jakarta',
        tarifHarianDalamKota: 200000,
        tarifHarianLuarKota: 530000,
        tarifPenginapan: 1100000,
        tarifTransportLokal: 250000,
        tarifTransportAntarKota: 4500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Surabaya',
        provinsi: 'Jawa Timur',
        tarifHarianDalamKota: 170000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 760000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 3500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Bandung',
        provinsi: 'Jawa Barat',
        tarifHarianDalamKota: 170000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 660000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 4000000,
        createdAt: new Date()
      },
      {
        namaKota: 'Yogyakarta',
        provinsi: 'DI Yogyakarta',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 420000,
        tarifPenginapan: 610000,
        tarifTransportLokal: 180000,
        tarifTransportAntarKota: 3800000,
        createdAt: new Date()
      },
      {
        namaKota: 'Semarang',
        provinsi: 'Jawa Tengah',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 610000,
        tarifTransportLokal: 180000,
        tarifTransportAntarKota: 3700000,
        createdAt: new Date()
      },
      {
        namaKota: 'Ambon',
        provinsi: 'Maluku',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 2800000,
        createdAt: new Date()
      }
    ])
  }
}

// Initialize database
export async function initializeDatabase() {
  await initializeDefaultSettings()
  await initializeDefaultKota()
}

// Get setting value by key
export async function getSetting(key) {
  const setting = await db.settings.where('key').equals(key).first()
  return setting?.value
}

// Update setting value
export async function updateSetting(key, value) {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing) {
    await db.settings.update(existing.id, { value, updatedAt: new Date() })
  } else {
    await db.settings.add({ key, value, updatedAt: new Date() })
  }
}

export default db
