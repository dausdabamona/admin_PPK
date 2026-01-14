import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { db } from '../../db/database'

/**
 * DipaRevisionSelector - Dropdown component for selecting DIPA revision
 *
 * Features:
 * - Auto-fetch revisions for selected year
 * - Show active revision badge
 * - Display revision metadata
 * - Validation warnings for missing DIPA
 *
 * Usage:
 * <DipaRevisionSelector
 *   year={2024}
 *   value={selectedRevision}
 *   onChange={(revision) => setSelectedRevision(revision)}
 *   label="Pilih DIPA"
 *   required
 * />
 */
export default function DipaRevisionSelector({
  year,
  value,
  onChange,
  label = 'Revisi DIPA',
  placeholder = '-- Pilih Revisi DIPA --',
  required = false,
  disabled = false,
  error = null,
  helper = null,
  showMetadata = false,
  className = ''
}) {
  // Fetch all revisions for the year
  const revisions = useLiveQuery(
    () => db.dipaRevisions
      .where('tahun')
      .equals(year)
      .reverse()
      .sortBy('revisi'),
    [year]
  ) || []

  // Fetch active revision
  const activeRevision = useLiveQuery(
    () => db.dipaRevisions
      .where('[tahun+status]')
      .equals([year, 'active'])
      .first(),
    [year]
  )

  // Handle change
  const handleChange = (e) => {
    const selectedRevisionNumber = parseInt(e.target.value)
    const selectedRevision = revisions.find(r => r.revisi === selectedRevisionNumber)

    if (onChange) {
      onChange(selectedRevision || null)
    }
  }

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Format rupiah
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selector */}
      <div className="relative">
        <select
          value={value?.revisi ?? ''}
          onChange={handleChange}
          disabled={disabled || revisions.length === 0}
          required={required}
          className={`select ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
        >
          <option value="">{placeholder}</option>
          {revisions.map((revision) => (
            <option key={revision.id} value={revision.revisi}>
              {revision.revisi === 0 ? 'DIPA Awal' : `Revisi ${revision.revisi}`}
              {revision.status === 'active' ? ' (Aktif)' : ''}
              {' - '}
              {revision.nomorRevisi}
            </option>
          ))}
        </select>

        {/* Active indicator */}
        {activeRevision && value?.revisi === activeRevision.revisi && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Helper text */}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}

      {/* No DIPA warning */}
      {revisions.length === 0 && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Belum ada DIPA untuk tahun {year}</p>
            <p className="text-xs mt-1">
              Silakan buat DIPA baru di menu Master DIPA
            </p>
          </div>
        </div>
      )}

      {/* Metadata (optional) */}
      {showMetadata && value && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                value.status === 'active' ? 'text-green-600' :
                value.status === 'superseded' ? 'text-gray-600' :
                'text-gray-500'
              }`}>
                {value.status === 'active' ? 'Aktif' :
                 value.status === 'superseded' ? 'Superseded' :
                 value.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal Revisi:</span>
              <span className="font-medium">{formatDate(value.tanggalRevisi)}</span>
            </div>

            {value.totalPagu !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pagu:</span>
                <span className="font-medium font-mono">{formatRupiah(value.totalPagu)}</span>
              </div>
            )}

            {value.perubahanPagu !== 0 && value.perubahanPagu !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Perubahan:</span>
                <span className={`font-medium font-mono ${
                  value.perubahanPagu > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {value.perubahanPagu > 0 ? '+' : ''}{formatRupiah(value.perubahanPagu)}
                </span>
              </div>
            )}

            {value.jumlahItem !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah Item:</span>
                <span className="font-medium">{value.jumlahItem} item</span>
              </div>
            )}

            {value.keterangan && (
              <div className="pt-1.5 border-t border-gray-200">
                <p className="text-xs text-gray-600">{value.keterangan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * DipaItemSelector - Dropdown component for selecting DIPA item (MAK)
 *
 * Features:
 * - Filter by level (akun only, or all levels)
 * - Show kode and uraian
 * - Display pagu and sisa
 * - Search functionality (optional)
 *
 * Usage:
 * <DipaItemSelector
 *   year={2024}
 *   revision={activeRevision}
 *   value={selectedItem}
 *   onChange={(item) => setSelectedItem(item)}
 *   levelFilter="akun"
 * />
 */
export function DipaItemSelector({
  year,
  revision,
  value,
  onChange,
  label = 'MAK / Kode DIPA',
  placeholder = '-- Pilih MAK --',
  required = false,
  disabled = false,
  error = null,
  helper = null,
  levelFilter = 'akun', // 'akun', 'all', or specific level
  showPaguInfo = true,
  className = ''
}) {
  // Fetch DIPA items
  const dipaItems = useLiveQuery(
    () => {
      if (!revision) return []

      let query = db.masterDipa
        .where('[tahun+revisi]')
        .equals([year, revision.revisi])

      return query.toArray()
    },
    [year, revision]
  ) || []

  // Filter by level
  const filteredItems = levelFilter === 'all'
    ? dipaItems
    : dipaItems.filter(item => item.level === levelFilter)

  // Handle change
  const handleChange = (e) => {
    const selectedId = parseInt(e.target.value)
    const selectedItem = filteredItems.find(item => item.id === selectedId)

    if (onChange) {
      onChange(selectedItem || null)
    }
  }

  // Format rupiah
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selector */}
      <select
        value={value?.id ?? ''}
        onChange={handleChange}
        disabled={disabled || filteredItems.length === 0}
        required={required}
        className={`select ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
      >
        <option value="">{placeholder}</option>
        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.kode} - {item.uraian}
          </option>
        ))}
      </select>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Helper text */}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}

      {/* No items warning */}
      {!revision && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Pilih revisi DIPA terlebih dahulu</p>
          </div>
        </div>
      )}

      {revision && filteredItems.length === 0 && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Tidak ada item DIPA dengan level "{levelFilter}"</p>
            <p className="text-xs mt-1">
              Pastikan data DIPA sudah diimport
            </p>
          </div>
        </div>
      )}

      {/* Pagu info (optional) */}
      {showPaguInfo && value && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Pagu:</span>
              <span className="font-medium font-mono text-blue-900">
                {formatRupiah(value.pagu)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-blue-700">Realisasi:</span>
              <span className="font-medium font-mono text-blue-900">
                {formatRupiah(value.realisasi)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1.5 border-t border-blue-300">
              <span className="text-blue-700 font-medium">Sisa:</span>
              <span className={`font-bold font-mono text-lg ${
                value.sisa > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatRupiah(value.sisa)}
              </span>
            </div>

            {value.selisih !== 0 && (
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-600">Selisih dari revisi sebelumnya:</span>
                <span className={`font-medium ${
                  value.selisih > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {value.selisih > 0 ? '+' : ''}{formatRupiah(value.selisih)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
