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

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
