import Dexie from 'dexie'

// Create database instance
export const db = new Dexie('SIPBJ_SPJ_Database')

// Database schema version 1
db.version(1).stores({
  // Master Data: Pegawai
  pegawai: '++id, nip, nama, jabatan, golongan, pangkat, rekening, bank, unitKerja, createdAt',

  // Master Data: Kota (dengan SBM tarif untuk Dalam Kota dan Luar Kota)
  kota: '++id, namaKota, provinsi, tarifHarianDalamKota, tarifHarianLuarKota, tarifPenginapan, tarifTransportLokal, tarifTransportAntarKota, createdAt',

  // Master Data: Pejabat (PPK, KPA)
  pejabat: '++id, nip, nama, jabatan, jenisPejabat, pangkat, golongan, createdAt',

  // Surat Tugas
  suratTugas: '++id, nomor, tanggal, perihal, dasar, tujuanKegiatan, pegawaiIds, kotaAsal, kotaTujuan, tanggalMulai, tanggalSelesai, transportasi, jenisPerjadin, status, createdAt',

  // SPPD - includes jenisPerjadin (dalam_kota / luar_kota)
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

  // Checklist SPJ SPPD - includes jenisPerjadin for different checklist types
  checklistSPJ: '++id, sppdId, jenisPerjadin, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt',

  // Settings / Konfigurasi
  settings: '++id, key, value, updatedAt',

  // Nomor Urut (untuk auto numbering)
  nomorUrut: '++id, jenis, tahun, bulan, nomorTerakhir'
})

// Checklist templates
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

// Jenis Perjadin constants
export const JENIS_PERJADIN = {
  DALAM_KOTA: 'dalam_kota',
  LUAR_KOTA: 'luar_kota'
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
