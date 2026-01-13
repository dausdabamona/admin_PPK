import { useState, useEffect } from 'react'
import { Menu, Bell, Wifi, WifiOff, Download, Upload, RefreshCw } from 'lucide-react'
import { exportAllData, downloadJSON } from '../../utils/exportImport'

export default function Header({ title, onMenuClick }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportAllData()
      downloadJSON(data, 'SIPBJ_backup')
    } catch (error) {
      alert('Gagal mengekspor data: ' + error.message)
    } finally {
      setExporting(false)
      setShowExportMenu(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Online/Offline Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Export/Import Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Backup Data"
            >
              <Download className="w-5 h-5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {exporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Export Backup</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false)
                    window.location.href = '/settings#import'
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Data</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
