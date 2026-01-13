import { Routes, Route } from 'react-router-dom'

// Pages
import Dashboard from './pages/dashboard/Dashboard'
import MasterPegawai from './pages/master/MasterPegawai'
import MasterKota from './pages/master/MasterKota'
import MasterPejabat from './pages/master/MasterPejabat'
import SuratTugas from './pages/surat-tugas/SuratTugas'
import SPPD from './pages/sppd/SPPD'
import PembayaranLS from './pages/pembayaran/PembayaranLS'
import Rampung from './pages/rampung/Rampung'
import ChecklistSPJ from './pages/checklist/ChecklistSPJ'
import Settings from './pages/settings/Settings'

// Swakelola Pages
import SwakelolaKegiatan from './pages/swakelola/SwakelolaKegiatan'
import SwakelolaTim from './pages/swakelola/SwakelolaTim'
import SwakelolaUangMuka from './pages/swakelola/SwakelolaUangMuka'
import SwakelolaRealisasi from './pages/swakelola/SwakelolaRealisasi'
import SwakelolaRampung from './pages/swakelola/SwakelolaRampung'
import SwakelolaChecklist from './pages/swakelola/SwakelolaChecklist'

// PJLP Pages
import PjlpMaster from './pages/pjlp/PjlpMaster'
import PjlpPerencanaan from './pages/pjlp/PjlpPerencanaan'
import PjlpKontrak from './pages/pjlp/PjlpKontrak'
import PjlpPresensi from './pages/pjlp/PjlpPresensi'
import PjlpPembayaran from './pages/pjlp/PjlpPembayaran'
import PjlpPenilaian from './pages/pjlp/PjlpPenilaian'
import PjlpChecklist from './pages/pjlp/PjlpChecklist'
import PjlpArsip from './pages/pjlp/PjlpArsip'

// Audit
import AuditDashboard from './pages/audit/AuditDashboard'

// Pengadaan Langsung
import PengadaanMasterPaket from './pages/pengadaan/PengadaanMasterPaket'
import PengadaanMasterVendor from './pages/pengadaan/PengadaanMasterVendor'
import PengadaanPerencanaan from './pages/pengadaan/PengadaanPerencanaan'
import PengadaanKontrak from './pages/pengadaan/PengadaanKontrak'
import PengadaanSerahTerima from './pages/pengadaan/PengadaanSerahTerima'
import PengadaanBastKpa from './pages/pengadaan/PengadaanBastKpa'
import PengadaanPembayaran from './pages/pengadaan/PengadaanPembayaran'
import PengadaanChecklist from './pages/pengadaan/PengadaanChecklist'

// Honorarium & Jasa Profesi
import HonorMaster from './pages/honorarium/HonorMaster'
import HonorAssignment from './pages/honorarium/HonorAssignment'
import HonorNominatif from './pages/honorarium/HonorNominatif'
import HonorReceipt from './pages/honorarium/HonorReceipt'
import HonorRekap from './pages/honorarium/HonorRekap'
import HonorChecklist from './pages/honorarium/HonorChecklist'

function App() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Master Data */}
      <Route path="/master/pegawai" element={<MasterPegawai />} />
      <Route path="/master/kota" element={<MasterKota />} />
      <Route path="/master/pejabat" element={<MasterPejabat />} />

      {/* Perjalanan Dinas */}
      <Route path="/surat-tugas" element={<SuratTugas />} />
      <Route path="/sppd" element={<SPPD />} />
      <Route path="/pembayaran-ls" element={<PembayaranLS />} />
      <Route path="/rampung" element={<Rampung />} />

      {/* Checklist */}
      <Route path="/checklist" element={<ChecklistSPJ />} />

      {/* Swakelola */}
      <Route path="/swakelola/kegiatan" element={<SwakelolaKegiatan />} />
      <Route path="/swakelola/tim" element={<SwakelolaTim />} />
      <Route path="/swakelola/uang-muka" element={<SwakelolaUangMuka />} />
      <Route path="/swakelola/realisasi" element={<SwakelolaRealisasi />} />
      <Route path="/swakelola/rampung" element={<SwakelolaRampung />} />
      <Route path="/swakelola/checklist" element={<SwakelolaChecklist />} />

      {/* PJLP */}
      <Route path="/pjlp/master" element={<PjlpMaster />} />
      <Route path="/pjlp/perencanaan" element={<PjlpPerencanaan />} />
      <Route path="/pjlp/kontrak" element={<PjlpKontrak />} />
      <Route path="/pjlp/presensi" element={<PjlpPresensi />} />
      <Route path="/pjlp/pembayaran" element={<PjlpPembayaran />} />
      <Route path="/pjlp/penilaian" element={<PjlpPenilaian />} />
      <Route path="/pjlp/checklist" element={<PjlpChecklist />} />
      <Route path="/pjlp/arsip" element={<PjlpArsip />} />

      {/* Audit */}
      <Route path="/audit" element={<AuditDashboard />} />

      {/* Pengadaan Langsung */}
      <Route path="/pengadaan/paket" element={<PengadaanMasterPaket />} />
      <Route path="/pengadaan/penyedia" element={<PengadaanMasterVendor />} />
      <Route path="/pengadaan/perencanaan" element={<PengadaanPerencanaan />} />
      <Route path="/pengadaan/kontrak" element={<PengadaanKontrak />} />
      <Route path="/pengadaan/serah-terima" element={<PengadaanSerahTerima />} />
      <Route path="/pengadaan/bast-kpa" element={<PengadaanBastKpa />} />
      <Route path="/pengadaan/pembayaran" element={<PengadaanPembayaran />} />
      <Route path="/pengadaan/checklist" element={<PengadaanChecklist />} />

      {/* Honorarium & Jasa Profesi */}
      <Route path="/honorarium/master" element={<HonorMaster />} />
      <Route path="/honorarium/penugasan" element={<HonorAssignment />} />
      <Route path="/honorarium/nominatif" element={<HonorNominatif />} />
      <Route path="/honorarium/kwitansi" element={<HonorReceipt />} />
      <Route path="/honorarium/rekap" element={<HonorRekap />} />
      <Route path="/honorarium/checklist" element={<HonorChecklist />} />

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
