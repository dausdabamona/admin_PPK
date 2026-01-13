import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Settings as SettingsIcon, Save, Download, Upload, Trash2,
  Database, Building2, RefreshCw, AlertTriangle
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import db, { updateSetting } from '../../db/database'
import { exportAllData, downloadJSON, importAllData, readJSONFile, clearAllData } from '../../utils/exportImport'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  // Fetch settings
  const settings = useLiveQuery(async () => {
    const allSettings = await db.settings.toArray()
    return allSettings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {})
  }) || {}

  // Local form state
  const [formData, setFormData] = useState({
    nama_instansi: '',
    alamat_instansi: '',
    kode_satker: '',
    tahun_anggaran: '',
    prefix_surat_tugas: '',
    prefix_sppd: ''
  })

  // Sync form with settings
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setFormData({
        nama_instansi: settings.nama_instansi || '',
        alamat_instansi: settings.alamat_instansi || '',
        kode_satker: settings.kode_satker || '',
        tahun_anggaran: settings.tahun_anggaran || '',
        prefix_surat_tugas: settings.prefix_surat_tugas || '',
        prefix_sppd: settings.prefix_sppd || ''
      })
    }
  }, [settings])

  // Get database stats
  const dbStats = useLiveQuery(async () => {
    return {
      pegawai: await db.pegawai.count(),
      kota: await db.kota.count(),
      pejabat: await db.pejabat.count(),
      suratTugas: await db.suratTugas.count(),
      sppd: await db.sppd.count(),
      pembayaranLS: await db.pembayaranLS.count(),
      rampung: await db.rampung.count(),
      checklistSPJ: await db.checklistSPJ.count()
    }
  }) || {}

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      for (const [key, value] of Object.entries(formData)) {
        await updateSetting(key, value)
      }
      alert('Pengaturan berhasil disimpan')
    } catch (error) {
      alert('Gagal menyimpan pengaturan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const data = await exportAllData()
      downloadJSON(data, 'SIPBJ_SPJ_Backup')
      alert('Data berhasil diekspor')
    } catch (error) {
      alert('Gagal mengekspor data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const data = await readJSONFile(file)
      const result = await importAllData(data, { replace: false })

      setImportResult(result)

      if (result.success) {
        alert('Data berhasil diimpor')
      } else {
        alert('Import selesai dengan beberapa error. Lihat detail untuk info lebih lanjut.')
      }
    } catch (error) {
      alert('Gagal mengimpor data: ' + error.message)
    } finally {
      setLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleClearData = async () => {
    setLoading(true)
    try {
      await clearAllData()
      setIsClearModalOpen(false)
      alert('Semua data berhasil dihapus')
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Pengaturan">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengaturan Instansi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Pengaturan Instansi
            </CardTitle>
            <CardDescription>
              Konfigurasi data instansi untuk dokumen
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nama Instansi"
              name="nama_instansi"
              value={formData.nama_instansi}
              onChange={handleInputChange}
              placeholder="Politeknik Kelautan dan Perikanan Sorong"
            />
            <Input
              label="Alamat Instansi"
              name="alamat_instansi"
              value={formData.alamat_instansi}
              onChange={handleInputChange}
              placeholder="Jl. Kapitan Pattimura, Sorong"
            />
            <Input
              label="Kode Satker"
              name="kode_satker"
              value={formData.kode_satker}
              onChange={handleInputChange}
              placeholder="032.11.423.585"
            />
            <Input
              label="Tahun Anggaran"
              name="tahun_anggaran"
              value={formData.tahun_anggaran}
              onChange={handleInputChange}
              placeholder="2024"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prefix Surat Tugas"
                name="prefix_surat_tugas"
                value={formData.prefix_surat_tugas}
                onChange={handleInputChange}
                placeholder="ST"
              />
              <Input
                label="Prefix SPPD"
                name="prefix_sppd"
                value={formData.prefix_sppd}
                onChange={handleInputChange}
                placeholder="SPPD"
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              loading={loading}
              icon={Save}
              className="w-full"
            >
              Simpan Pengaturan
            </Button>
          </CardBody>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              Status Database
            </CardTitle>
            <CardDescription>
              Statistik data tersimpan di IndexedDB lokal
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.pegawai || 0}</p>
                <p className="text-sm text-gray-500">Pegawai</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.kota || 0}</p>
                <p className="text-sm text-gray-500">Kota & SBM</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.suratTugas || 0}</p>
                <p className="text-sm text-gray-500">Surat Tugas</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.sppd || 0}</p>
                <p className="text-sm text-gray-500">SPPD</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.pembayaranLS || 0}</p>
                <p className="text-sm text-gray-500">Pembayaran LS</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{dbStats.rampung || 0}</p>
                <p className="text-sm text-gray-500">Rampung</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Backup & Restore */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-600" />
              Backup & Restore
            </CardTitle>
            <CardDescription>
              Export dan import data untuk backup atau pindah ke perangkat lain
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Export */}
              <div className="p-6 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Export Backup</h4>
                    <p className="text-sm text-gray-500">Unduh semua data ke file JSON</p>
                  </div>
                </div>
                <Button
                  onClick={handleExport}
                  loading={loading}
                  variant="success"
                  className="w-full"
                  icon={Download}
                >
                  Export Data
                </Button>
              </div>

              {/* Import */}
              <div className="p-6 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Import Data</h4>
                    <p className="text-sm text-gray-500">Muat data dari file backup</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={handleImportClick}
                  loading={loading}
                  variant="primary"
                  className="w-full"
                  icon={Upload}
                >
                  Import Data
                </Button>
              </div>

              {/* Clear Data */}
              <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-900">Hapus Semua Data</h4>
                    <p className="text-sm text-red-600">Peringatan: Tidak dapat dibatalkan!</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsClearModalOpen(true)}
                  variant="danger"
                  className="w-full"
                  icon={Trash2}
                >
                  Hapus Data
                </Button>
              </div>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`mt-4 p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <h4 className="font-medium mb-2">Hasil Import:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(importResult.imported).map(([table, count]) => (
                    <div key={table}>
                      <span className="text-gray-600">{table}:</span>{' '}
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* App Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
              Informasi Aplikasi
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama Aplikasi</p>
                <p className="font-medium">SIPBJ & SPJ Offline</p>
              </div>
              <div>
                <p className="text-gray-500">Versi</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-500">Instansi</p>
                <p className="font-medium">PKP Sorong</p>
              </div>
              <div>
                <p className="text-gray-500">Tipe</p>
                <p className="font-medium">PWA Offline-First</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Catatan:</strong> Aplikasi ini berjalan sepenuhnya offline di browser Anda.
                Semua data tersimpan di IndexedDB lokal. Pastikan untuk melakukan backup secara berkala
                untuk menghindari kehilangan data.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Konfirmasi Hapus Semua Data"
        size="md"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-gray-600 mb-2">
              Anda akan menghapus <strong>SEMUA DATA</strong> dari aplikasi ini, termasuk:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
              <li>Data Pegawai</li>
              <li>Data Kota & SBM</li>
              <li>Surat Tugas</li>
              <li>SPPD</li>
              <li>Pembayaran LS</li>
              <li>Rampung</li>
              <li>Checklist SPJ</li>
            </ul>
            <p className="text-red-600 font-medium">
              Tindakan ini TIDAK DAPAT dibatalkan!
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleClearData} loading={loading}>
            Ya, Hapus Semua Data
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
