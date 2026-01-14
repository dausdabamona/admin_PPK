# Checklist Summary - Usage Guide

## Overview

Komponen **ChecklistSummaryCard** dirancang untuk menampilkan ringkasan kelengkapan checklist SPJ secara visual dan informatif **tanpa harus membuka detail checklist**.

## Features

✅ **Visual Progress Bar** - Progress kelengkapan dalam bentuk bar
✅ **Categorized Missing Docs** - Pisah dokumen wajib & opsional
✅ **Inline Status** - Badge status untuk table rows
✅ **Quick Actions** - Tombol untuk langsung ke checklist
✅ **Smart Coloring** - Warna berdasarkan completion percent
✅ **Last Updated Info** - Tampilkan kapan terakhir update

---

## Installation

```jsx
import ChecklistSummaryCard, {
  ChecklistInlineStatus,
  ChecklistQuickPreview
} from '../components/ui/ChecklistSummaryCard'
import { getSppdChecklistStatus } from '../utils/checklistValidator'
```

---

## Usage Examples

### 1. Full Summary Card (untuk Detail Page)

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ChecklistSummaryCard from '../components/ui/ChecklistSummaryCard'
import { getSppdChecklistStatus } from '../utils/checklistValidator'

export default function SppdDetail({ sppdId }) {
  const navigate = useNavigate()
  const [checklistStatus, setChecklistStatus] = useState(null)

  useEffect(() => {
    async function fetchChecklistStatus() {
      const status = await getSppdChecklistStatus(sppdId)
      setChecklistStatus(status)
    }
    fetchChecklistStatus()
  }, [sppdId])

  if (!checklistStatus) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1>Detail SPPD</h1>

      {/* Full Checklist Summary Card */}
      <ChecklistSummaryCard
        isComplete={checklistStatus.isComplete}
        completionPercent={checklistStatus.completionPercent}
        missingDocs={checklistStatus.missingDocs}
        mandatoryMissing={checklistStatus.mandatoryMissing}
        optionalMissing={checklistStatus.optionalMissing}
        totalMandatory={checklistStatus.totalMandatory}
        totalOptional={checklistStatus.totalOptional}
        lastUpdated={checklistStatus.lastUpdated}
        onViewDetail={() => navigate(`/sppd/${sppdId}/checklist`)}
      />

      {/* Rest of SPPD detail... */}
    </div>
  )
}
```

**Result:**

```
┌─────────────────────────────────────────────────┐
│ 📄 Kelengkapan Checklist SPJ            60%    │
│ 🕐 2 jam lalu                                   │
├─────────────────────────────────────────────────┤
│ Progress                                   60%  │
│ ███████████████░░░░░░░░░░░                     │
├─────────────────────────────────────────────────┤
│  ! Wajib Kurang    ○ Opsional Kurang          │
│     2                  3                        │
├─────────────────────────────────────────────────┤
│ Dokumen Wajib yang Belum Lengkap:             │
│ ! Surat Tugas                                  │
│ ! Kwitansi Asli                                │
├─────────────────────────────────────────────────┤
│ Dokumen Opsional yang Belum Lengkap:          │
│ ○ Foto Kegiatan                                │
│ ○ Daftar Hadir                                 │
│ +1 dokumen opsional lainnya                    │
├─────────────────────────────────────────────────┤
│ [Lengkapi Checklist Sekarang >]               │
├─────────────────────────────────────────────────┤
│ ⚠️ Catatan: Pembayaran dan cetak kwitansi     │
│ tidak dapat dilakukan sampai semua dokumen     │
│ wajib dilengkapi (100%).                       │
└─────────────────────────────────────────────────┘
```

---

### 2. Compact Mode (untuk Card/Table Cell)

```jsx
<ChecklistSummaryCard
  isComplete={checklistStatus.isComplete}
  completionPercent={checklistStatus.completionPercent}
  missingDocs={checklistStatus.missingDocs}
  onViewDetail={() => navigate(`/sppd/${sppdId}/checklist`)}
  compact={true}
/>
```

**Result:**

```
✓ 100%  |  [Lihat >]
```

atau jika belum lengkap:

```
⚠️ 60%  |  3 dokumen belum lengkap  |  [Lihat >]
```

---

### 3. Inline Status (untuk Table Rows)

```jsx
import { ChecklistInlineStatus } from '../components/ui/ChecklistSummaryCard'

<Table>
  <TableBody>
    {sppdList.map(sppd => (
      <TableRow key={sppd.id}>
        <TableCell>{sppd.nomor}</TableCell>
        <TableCell>{sppd.pegawai}</TableCell>
        <TableCell>
          <ChecklistInlineStatus
            isComplete={sppd.checklistComplete}
            completionPercent={sppd.checklistPercent}
            missingCount={sppd.missingDocsCount}
            onViewDetail={() => navigate(`/sppd/${sppd.id}/checklist`)}
          />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Result dalam Table:**

```
┌──────┬────────────┬─────────────────────────┐
│ No   │ Pegawai    │ Checklist               │
├──────┼────────────┼─────────────────────────┤
│ 001  │ Budi       │ ✓ Lengkap [Lihat]      │
│ 002  │ Siti       │ ⚠️ 60% 3 kurang [Lengkapi] │
│ 003  │ Ahmad      │ ⚠️ 40% 5 kurang [Lengkapi] │
└──────┴────────────┴─────────────────────────┘
```

---

### 4. Dashboard Summary (Multiple SPJ)

```jsx
export default function DashboardSPJ() {
  const [spjList, setSpjList] = useState([])

  useEffect(() => {
    async function fetchAllSPJ() {
      const allSppd = await db.sppd.toArray()

      const spjWithStatus = await Promise.all(
        allSppd.map(async (sppd) => {
          const checklistStatus = await getSppdChecklistStatus(sppd.id)
          return {
            ...sppd,
            checklistStatus
          }
        })
      )

      setSpjList(spjWithStatus)
    }
    fetchAllSPJ()
  }, [])

  // Filter yang belum lengkap
  const incompleteSpj = spjList.filter(spj => !spj.checklistStatus.isComplete)

  return (
    <div className="space-y-6">
      <h1>Dashboard SPJ</h1>

      {/* Alert untuk SPJ yang belum lengkap */}
      {incompleteSpj.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-3">
            ⚠️ {incompleteSpj.length} SPJ Belum Lengkap
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incompleteSpj.slice(0, 4).map(spj => (
              <ChecklistSummaryCard
                key={spj.id}
                isComplete={false}
                completionPercent={spj.checklistStatus.completionPercent}
                mandatoryMissing={spj.checklistStatus.mandatoryMissing}
                onViewDetail={() => navigate(`/sppd/${spj.id}/checklist`)}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rest of dashboard... */}
    </div>
  )
}
```

---

## Props API

### ChecklistSummaryCard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isComplete` | `boolean` | `false` | Checklist 100% lengkap |
| `completionPercent` | `number` | `0` | Persentase kelengkapan (0-100) |
| `missingDocs` | `string[]` | `[]` | Array dokumen yang belum lengkap |
| `mandatoryMissing` | `string[]` | `[]` | Dokumen wajib yang belum lengkap |
| `optionalMissing` | `string[]` | `[]` | Dokumen opsional yang belum lengkap |
| `totalMandatory` | `number` | `0` | Total dokumen wajib |
| `totalOptional` | `number` | `0` | Total dokumen opsional |
| `lastUpdated` | `Date\|null` | `null` | Waktu terakhir update |
| `onViewDetail` | `function` | `null` | Callback saat klik tombol detail |
| `compact` | `boolean` | `false` | Mode compact untuk card kecil |
| `className` | `string` | `''` | Custom CSS class |

### ChecklistInlineStatus

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isComplete` | `boolean` | - | Checklist lengkap |
| `completionPercent` | `number` | - | Persentase (0-100) |
| `missingCount` | `number` | - | Jumlah dokumen kurang |
| `onViewDetail` | `function` | `null` | Callback saat klik |
| `className` | `string` | `''` | Custom CSS class |

---

## Color Coding

Komponen otomatis menggunakan warna berdasarkan completion percent:

| Percent | Color | Meaning |
|---------|-------|---------|
| 100% | 🟢 Green | Lengkap, siap pembayaran |
| 80-99% | 🔵 Blue | Hampir selesai |
| 50-79% | 🟡 Yellow | Perlu perhatian |
| 0-49% | 🔴 Red | Sangat kurang |

---

## Integration with Existing Code

### Update Existing Page (Example: PjlpPembayaran.jsx)

**Before:**
```jsx
import { MissingDocsWarning } from '../utils/checklistValidator'

// ...

<MissingDocsWarning
  missingDocs={checklistStatus.missingDocs}
  completionPercent={checklistStatus.completionPercent}
/>
```

**After:**
```jsx
import ChecklistSummaryCard from '../components/ui/ChecklistSummaryCard'

// ...

<ChecklistSummaryCard
  isComplete={checklistStatus.isComplete}
  completionPercent={checklistStatus.completionPercent}
  mandatoryMissing={checklistStatus.mandatoryMissing}
  optionalMissing={checklistStatus.optionalMissing}
  totalMandatory={checklistStatus.totalMandatory}
  totalOptional={checklistStatus.totalOptional}
  lastUpdated={checklistStatus.lastUpdated}
  onViewDetail={() => navigate(`/pjlp/${pjlpId}/checklist`)}
/>
```

---

## Benefits

### Before (Old MissingDocsWarning):
- Hanya menampilkan list dokumen yang belum lengkap
- Tidak ada visual progress
- Tidak ada kategorisasi wajib/opsional
- Tidak ada quick action

### After (New ChecklistSummaryCard):
- ✅ Visual progress bar
- ✅ Kategorisasi wajib vs opsional
- ✅ Color coding berdasarkan urgency
- ✅ Quick action button
- ✅ Compact mode untuk listing
- ✅ Last updated timestamp
- ✅ Smart truncation (max 5 docs, sisanya collapsed)

---

## Performance Considerations

- Komponen menggunakan `useLiveQuery` dari Dexie untuk reactive updates
- Data fetching dilakukan sekali dan di-cache
- Compact mode lebih ringan untuk listing dengan banyak item
- Lazy loading untuk ChecklistQuickPreview (tooltip)

---

## Future Enhancements

1. **Real-time Sync**: WebSocket untuk update checklist real-time
2. **Bulk Actions**: Lengkapi multiple checklist sekaligus
3. **Templates**: Save checklist template untuk reuse
4. **Smart Suggestions**: AI-powered document suggestions
5. **Mobile Optimized**: Gesture support untuk mobile
6. **Export**: Export checklist status ke PDF/Excel

---

## Support

Dokumentasi lengkap arsitektur:
- `MASTER_DIPA_IMPLEMENTATION.md` - DIPA module
- `ARCHITECTURE.md` - Client-server architecture
- `API_DOCUMENTATION.md` - API endpoints

Source code:
- `/src/components/ui/ChecklistSummaryCard.jsx`
- `/src/utils/checklistValidator.jsx`
