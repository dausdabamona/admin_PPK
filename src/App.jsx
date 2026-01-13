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

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
