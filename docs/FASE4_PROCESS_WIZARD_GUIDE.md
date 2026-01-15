# 📘 FASE 4: Process Wizard & Compliance Dashboard - User Guide

## 🎯 Apa itu Process Wizard?

Process Wizard adalah sistem panduan berbasis proses yang mengubah cara PPK bekerja:

**SEBELUM:**
```
"Buat SPR... buat SPPR... apa lagi ya yang kurang?"
```

**SESUDAH:**
```
"Saya sedang proses LS Kontrak → Sistem membimbing saya langkah demi langkah → Saya tahu persis apa yang kurang dan kapan siap audit"
```

---

## 🚀 Demo Flow: Dari Pilih Proses sampai Generate Paket SPJ

### Step 1: Pilih Jenis Proses

PPK melihat 6 pilihan proses:

1. **LS Kontrak** - Pembayaran kepada penyedia (10 langkah, 2-3 jam, High complexity)
2. **UP** - Uang Persediaan (4 langkah, 30-45 menit, Low complexity)
3. **TUP** - Tambahan UP (5 langkah, 45 menit, Low complexity)
4. **Swakelola** - Kegiatan internal (9 langkah, 1.5-2 jam, Medium complexity)
5. **Perjadin** - Perjalanan Dinas (9 langkah, 1-1.5 jam, Medium complexity)
6. **Honorarium** - Pembayaran honor (8 langkah, 1-1.5 jam, Medium complexity)

**Contoh:** PPK memilih "LS Kontrak"

---

### Step 2: Sistem Menampilkan Dashboard

PPK melihat 3 panel utama:

#### Panel Kiri: ProcessStepper (Langkah-Langkah)
```
STEP 1: ✓ Input Master Data Kegiatan (Selesai)
STEP 2: ✓ Kontrak/Surat Perjanjian (Selesai)
STEP 3: ✓ Berita Acara Pemeriksaan (Selesai)
STEP 4: → Berita Acara Serah Terima (Sedang di sini)
STEP 5: ○ Surat Pernyataan Penyelesaian Pekerjaan (Belum)
...
STEP 10: ○ Cover & RPD (Belum)

Progress: 3/10 selesai (30%)
```

#### Panel Tengah: ComplianceChecklist
```
CHECKLIST COMPLIANCE

✅ Dokumen Wajib (2/10)
  ✅ Dokumen KONTRAK - Sudah lengkap
  ✅ Dokumen BAP - Sudah lengkap
  ❌ Dokumen BAST - Belum lengkap
  ❌ Dokumen SPPR - Belum lengkap
  ...

✅ Aturan Audit (8/10)
  ✅ Tanggal Kontrak ≤ Tanggal Mulai Kegiatan
  ✅ Tanggal BAP ≥ Tanggal Selesai Kegiatan
  ⚠️ Rekening tidak sesuai nama penyedia
  ...
```

#### Panel Kanan: AuditReadinessPanel
```
┌─────────────────────┐
│   KESIAPAN AUDIT   │
│                     │
│        60%         │  ← Circular score
│   Kesiapan Audit   │
└─────────────────────┘

🟡 Hampir Lengkap

"Progres bagus, tapi masih ada yang perlu dilengkapi."

Rincian Skor:
📄 Dokumen Lengkap: 20/40
✅ Langkah Selesai: 18/30
🛡️ Aturan Audit: 16/20
⚠️ Tanpa Warning: 6/10

Rekomendasi:
⚠️ Perbaiki masalah kritis berikut:
  - Lengkapi dokumen BAST

💡 Perhatian:
  - Periksa rekening penyedia

[Lengkapi Data (60% → 95%+)]  ← Button disabled
```

---

### Step 3: PPK Melengkapi Data

PPK mengklik STEP 4 → melihat detail:

```
STEP 4: Berita Acara Serah Terima (BAST)

Deskripsi:
Serahterima hasil pekerjaan dari penyedia ke PPK

⏱️ Estimasi Waktu: 5 menit

📄 Dokumen Terkait:
✅ BAST

💡 Tips:
BAST dibuat setelah BAP. Ini menandakan pekerjaan sudah diterima dengan baik oleh PPK.

⚠️ Catatan Audit:
Auditor akan memeriksa:
1. Tanggal BAST ≥ tanggal BAP
2. Ditandatangani penyedia dan PPK
3. Disaksikan PPHP

Aturan Bisnis:
- Tanggal BAST harus sama atau setelah tanggal BAP
- Tanggal BAST harus sama atau setelah tanggal selesai pekerjaan

[Tandai Selesai]
```

PPK mengisi form BAST → klik "Tandai Selesai"

**Sistem auto-update:**
- Score naik: 60% → 72%
- Checklist update: ✅ Dokumen BAST
- Rekomendasi berkurang

---

### Step 4: PPK Melanjutkan Sampai Selesai

PPK menyelesaikan STEP 5, 6, 7, 8, 9, 10...

**Real-time updates:**
```
Progress: 7/10 → 8/10 → 9/10 → 10/10
Score: 72% → 82% → 89% → 96%
Status: 🟡 Hampir Lengkap → 🟢 Siap Audit
```

---

### Step 5: Score Mencapai 95%+

```
┌─────────────────────┐
│   KESIAPAN AUDIT   │
│                     │
│        96%         │  ← Green circular
│   Kesiapan Audit   │
└─────────────────────┘

🟢 Siap Audit

"Data Anda sudah sangat rapi dan siap untuk audit! 🎉"

Semua terlihat sempurna! ✨

[✨ Generate Paket SPJ Sekarang]  ← Button AKTIF (hijau)
```

**Checklist:**
```
✅ Dokumen Wajib (10/10) - 100%
✅ Aturan Audit (10/10) - 100%
```

---

### Step 6: Generate Paket SPJ

PPK klik "Generate Paket SPJ Sekarang"

**Sistem:**
1. Validasi final ✓
2. Generate 10 dokumen PDF ✓
3. Merge jadi 1 PDF kronologis ✓
4. Create ZIP archive ✓
5. Generate audit trail ✓

**Output:**
```
/Paket_SPJ_MDK-2024-000001/
  ├── Paket_SPJ_Complete.pdf      ← Siap audit
  ├── Paket_SPJ_Complete.zip      ← Siap archive
  ├── 01_Cover/
  ├── 02_RPD/
  ├── 03_SPR/
  │   ├── SPR.html
  │   └── SPR.pdf
  ├── 04_SPPR/
  ...
  └── metadata.json
```

**Success message:**
```
🎉 Paket SPJ berhasil dibuat!

Semua dokumen sudah lengkap, valid, dan siap untuk:
✓ Audit internal
✓ Audit eksternal
✓ Pengarsipan
✓ Tanda tangan digital

Download: Paket_SPJ_MDK-2024-000001.zip
```

---

## 🎨 UX Principles yang Diterapkan

### 1. **Helpful, Not Blaming**

❌ "Data salah. Perbaiki sekarang."
✅ "Ada satu hal kecil yang perlu dilengkapi agar paket ini benar-benar siap audit."

### 2. **Calming, Not Intimidating**

❌ Score merah besar dengan bunyi alarm
✅ Score dengan warna lembut + pesan encouraging

### 3. **Guiding, Not Commanding**

❌ "Lengkapi BAST SEKARANG!"
✅ "💡 Tip: BAST dibuat setelah BAP untuk menandakan pekerjaan diterima dengan baik"

### 4. **Human Language, Not Technical**

❌ "Validation error: field 'bastTanggal' must be >= 'bapTanggal'"
✅ "Tanggal BAST sebaiknya setelah BAP agar sesuai urutan logis"

---

## 🧩 Komponen UI yang Dibangun

### 1. **ProcessSelector.jsx**
- Cards untuk 6 jenis proses
- Filter/search
- Complexity indicator
- Estimated time
- Use cases

### 2. **ProcessStepper.jsx**
- Vertical stepper
- Visual status: ✓ (done), → (current), ○ (pending)
- Clickable untuk detail
- Progress bar
- Modal dengan tips & audit notes

### 3. **ComplianceChecklist.jsx**
- Real-time checklist
- Grouped: Required docs, Optional docs, Audit rules
- Color-coded: ✅ green, ⚠️ yellow, ❌ red
- Action buttons untuk fix
- Progress per kategori

### 4. **AuditReadinessPanel.jsx**
- Circular score (0-100%) dengan animasi
- Compliance level badge (🟢/🟡/🔴)
- Tone-based messages (positive/encouraging/guiding/supportive)
- Score breakdown (4 kategori)
- Recommendations accordion
- Generate button (aktif jika ≥95%)
- Motivational footer

### 5. **useWorkflow Hook**
- Centralized state management
- Initialize workflow
- Track progress
- Complete steps
- Calculate compliance
- Auto-update

---

## 💡 Integrasi dengan Existing System

### Backend Integration:
```javascript
import workflowEngine from '../services/workflow/WorkflowEngine.js'
import complianceEngine from '../services/workflow/ComplianceEngine.js'

// Load workflow
const workflow = await workflowEngine.getWorkflow('LS_KONTRAK')

// Initialize instance
const instance = await workflowEngine.initializeWorkflow('LS_KONTRAK', masterData)

// Calculate compliance
const report = await complianceEngine.calculateAuditReadiness(instance, masterData)
```

### Frontend Integration:
```javascript
import { useWorkflow } from '../hooks/useWorkflow.js'
import { ProcessWizard } from '../components/process-wizard'

function App() {
  const [masterData, setMasterData] = useState({...})

  return (
    <ProcessWizard
      masterData={masterData}
      onMasterDataUpdate={setMasterData}
    />
  )
}
```

---

## 🎯 Hasil Akhir

### Transformasi Pengalaman PPK:

**BEFORE FASE 4:**
```
PPK feels: Confused, anxious, unsure
"Apa yang kurang? Sudah lengkap belum? Auditor bakal terima gak ya?"
```

**AFTER FASE 4:**
```
PPK feels: Guided, confident, calm
"Saya tahu persis posisi saya (60%), apa yang kurang (BAST),
dan kapan siap audit (skor 95%+). Sistem membimbing saya step by step."
```

### Mantra Sistem:

> **"Sekretaris Digital PPK yang selalu berkata:**
> **'Tenang Pak/Bu, saya bantu pastikan semua sudah rapi dan siap diperiksa.'"**

---

## 📊 Metrics & KPI

### Terukur:
- ✅ Audit readiness score: 0-100%
- ✅ Completion percentage: 0-100%
- ✅ Critical errors: 0
- ✅ Warnings: Minimal
- ✅ Time to complete: Reduced 50%

### Tidak Terukur (tapi lebih penting):
- ✅ PPK feels **calm** sebelum audit
- ✅ PPK feels **confident** tentang kelengkapan data
- ✅ PPK feels **guided** bukan confused
- ✅ PPK feels **safe** bukan anxious

---

## 🚀 Next Steps (Future Enhancements)

1. **Real-time collaboration**: Multiple users working on same package
2. **Auto-save**: Draft automatically saved every 30 seconds
3. **Version control**: Track changes and revert if needed
4. **Smart suggestions**: AI-powered recommendations based on past audits
5. **Mobile app**: Process wizard di mobile untuk field work
6. **Voice assistant**: "Alexa, bagaimana progress paket SPJ saya?"

---

**Developed with ❤️ by Admin PPK Development Team**
**Version 1.0.0 - January 2025**
