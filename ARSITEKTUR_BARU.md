# ARSITEKTUR ASISTEN DIGITAL PPK

## 🎯 Filosofi Desain

**Dari:** Aplikasi dengan menu hierarkis → PPK harus tahu kemana harus klik
**Ke:** Asisten digital yang memandu → PPK tinggal pilih jenis pekerjaan

---

## 📁 Struktur Folder Baru

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx                    # [Existing] Top header
│   │   ├── Layout.jsx                    # [Existing] Main layout
│   │   └── Sidebar.jsx                   # [REFACTOR] Jenis pekerjaan, bukan menu
│   │
│   ├── ui/                                # [Existing] UI components
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   └── ...
│   │
│   └── workflow/                          # [NEW] Komponen workflow
│       ├── ProcessWizard.jsx              # Core wizard component
│       ├── WizardStep.jsx                 # Single step component
│       ├── WizardNavigation.jsx           # Step navigation
│       ├── WizardProgress.jsx             # Progress indicator
│       ├── DocumentChecklist.jsx          # Smart checklist
│       ├── TemplateGenerator.jsx          # Document generator UI
│       ├── TemplatePreview.jsx            # Preview before download
│       ├── SPJArchive.jsx                 # Archive browser
│       ├── SPJPackage.jsx                 # Package viewer
│       └── ProcessCard.jsx                # Card untuk dashboard
│
├── pages/
│   ├── home/
│   │   └── Dashboard.jsx                  # [REFACTOR] Dashboard workflow
│   │
│   ├── processes/                         # [NEW] Halaman proses utama
│   │   ├── up-tup/
│   │   │   └── UpTupProcess.jsx           # Wizard UP/TUP
│   │   │
│   │   ├── ls-kontrak/                    # [NEW] LS Kontrak (contoh lengkap)
│   │   │   ├── LsKontrakProcess.jsx       # Main wizard
│   │   │   ├── steps/
│   │   │   │   ├── DataKegiatanStep.jsx   # Step 1: Data kegiatan
│   │   │   │   ├── DataKontrakStep.jsx    # Step 2: Data kontrak
│   │   │   │   ├── DataPenyediaStep.jsx   # Step 3: Data penyedia
│   │   │   │   ├── ChecklistStep.jsx      # Step 4: Checklist dokumen
│   │   │   │   ├── GenerateStep.jsx       # Step 5: Generate dokumen
│   │   │   │   ├── UploadStep.jsx         # Step 6: Upload TTD
│   │   │   │   └── ArsipStep.jsx          # Step 7: Review & Arsip
│   │   │   └── config.js                  # Configuration & checklist data
│   │   │
│   │   ├── swakelola/
│   │   │   └── SwakelolaProcess.jsx       # Wizard Swakelola
│   │   │
│   │   ├── perjalanan-dinas/
│   │   │   └── PerjadinProcess.jsx        # Wizard Perjadin
│   │   │
│   │   └── honor-pjlp/
│   │       └── HonorPjlpProcess.jsx       # Wizard Honor/PJLP
│   │
│   ├── archive/                           # [NEW] Arsip SPJ
│   │   ├── ArchiveBrowser.jsx             # Browser arsip per tahun/kegiatan
│   │   └── PackageViewer.jsx              # Detail paket SPJ
│   │
│   ├── master/                            # [Keep] Master data
│   │   ├── Pegawai.jsx
│   │   ├── Kota.jsx
│   │   └── Pejabat.jsx
│   │
│   └── settings/                          # [Keep] Settings
│       └── Settings.jsx
│
├── db/
│   ├── database.js                        # [REFACTOR] Split jadi smaller modules
│   ├── schemas/                           # [NEW] Schema per domain
│   │   ├── master.schema.js
│   │   ├── uptup.schema.js
│   │   ├── lskontrak.schema.js
│   │   ├── swakelola.schema.js
│   │   ├── perjadin.schema.js
│   │   ├── pjlp.schema.js
│   │   └── archive.schema.js
│   └── index.js                           # [NEW] Re-export all schemas
│
├── utils/
│   ├── documentGenerator.js               # [Keep] Existing generators
│   ├── perjadinDocGenerator.js
│   ├── pjlpDocGenerator.js
│   ├── swakelolaDocGenerator.js
│   ├── lsKontrakDocGenerator.js           # [NEW] Generator LS Kontrak
│   ├── formatters.js                      # [Keep]
│   ├── autoNumber.js                      # [Keep]
│   ├── exportImport.js                    # [Keep]
│   └── workflow/                          # [NEW] Workflow utilities
│       ├── wizardStore.js                 # Shared state untuk wizard
│       ├── checklistValidator.js          # Smart validator
│       ├── documentMapper.js              # Map data ke template
│       └── archiveManager.js              # Archive operations
│
├── config/                                # [NEW] Configuration files
│   ├── processes.config.js                # Konfigurasi semua proses
│   ├── checklists/                        # Checklist config per proses
│   │   ├── uptup.checklist.js
│   │   ├── lskontrak.checklist.js
│   │   ├── swakelola.checklist.js
│   │   ├── perjadin.checklist.js
│   │   └── pjlp.checklist.js
│   └── templates/                         # Template metadata
│       ├── uptup.templates.js
│       ├── lskontrak.templates.js
│       └── ...
│
├── hooks/                                 # [NEW] Custom hooks
│   ├── useWizard.js                       # Hook untuk wizard navigation
│   ├── useChecklist.js                    # Hook untuk checklist logic
│   ├── useDocumentGenerator.js            # Hook untuk generate docs
│   ├── useArchive.js                      # Hook untuk archive operations
│   └── useFormPersist.js                  # Auto-save form state
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🔄 Perubahan Utama

### 1. Dashboard (Home)

**Dari:**
```
Dashboard dengan statistik + menu di sidebar
```

**Ke:**
```
Dashboard dengan 5 kartu proses utama:
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  💰 UP / TUP     │  │  📄 LS Kontrak   │  │  🏗️ Swakelola   │
│  Uang Persediaan │  │  Pembayaran LS   │  │  Belanja        │
│  & TUP           │  │  Kontrak         │  │  Swakelola      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐
│  ✈️ Perjadin     │  │  👥 Honor/PJLP   │
│  Perjalanan      │  │  Honorarium &    │
│  Dinas           │  │  PJLP            │
└──────────────────┘  └──────────────────┘

"Pilih jenis pekerjaan yang akan Anda lakukan"
```

---

### 2. Sidebar

**Dari:**
```
Sidebar dengan menu hierarkis:
- Dashboard
- Master Data
  - Pegawai
  - Kota
  - Pejabat
- Perjalanan Dinas
  - Surat Tugas
  - SPPD
  - Pembayaran
  - Rampung
  - Checklist
- Swakelola (6 submenu)
- PJLP (8 submenu)
- Pengadaan (8 submenu)
- Honorarium (6 submenu)
- Audit
- Settings
```

**Ke:**
```
Sidebar sederhana berbasis proses:
┌──────────────────────────────┐
│ 🏠 Beranda                   │
├──────────────────────────────┤
│ JENIS PEKERJAAN              │
│ 💰 UP / TUP                  │
│ 📄 LS Kontrak                │
│ 🏗️ Swakelola                │
│ ✈️ Perjalanan Dinas          │
│ 👥 Honor / PJLP              │
├──────────────────────────────┤
│ 📦 Arsip SPJ                 │
├──────────────────────────────┤
│ ⚙️ Master Data               │
│ 🔧 Pengaturan                │
└──────────────────────────────┘
```

---

### 3. Workflow Wizard

**Struktur Wizard LS Kontrak (7 Steps):**

```
┌────────────────────────────────────────────────────────────────┐
│  Step 1  →  Step 2  →  Step 3  →  Step 4  →  Step 5  →  ...   │
│  ═══════    ───────    ───────    ───────    ───────            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📝 Data Kegiatan                                        │  │
│  │                                                          │  │
│  │  Nama Kegiatan: [________________________]              │  │
│  │  Kode Kegiatan: [_______]  Tahun: [2024]               │  │
│  │  Pagu: [________________]                               │  │
│  │  PPK: [Pilih PPK ▼]                                     │  │
│  │  PPSPM: [Pilih PPSPM ▼]                                │  │
│  │  Bendahara: [Pilih Bendahara ▼]                        │  │
│  │                                                          │  │
│  │  [Kembali]           [Simpan & Lanjut →]               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  💾 Data tersimpan otomatis setiap 10 detik                    │
└────────────────────────────────────────────────────────────────┘
```

**7 Steps LS Kontrak:**
1. **Data Kegiatan** - Input data dasar kegiatan
2. **Data Kontrak** - Nomor kontrak, nilai, tanggal, jenis
3. **Data Penyedia** - Vendor, NPWP, alamat, rekening
4. **Checklist Dokumen** - Daftar dokumen yang dibutuhkan (wajib/opsional)
5. **Generate Dokumen** - Satu klik untuk generate semua template
6. **Upload Tanda Tangan** - Upload dokumen yang sudah ditandatangani
7. **Review & Arsip** - Preview final, arsipkan sebagai paket SPJ

---

### 4. Smart Checklist (Non-Blocking)

**Prinsip:**
- ✅ **WAJIB** = Harus ada, tapi tidak memblokir
- ⚠️ **DIANJURKAN** = Sebaiknya ada
- 🔵 **OPSIONAL** = Boleh ada/tidak

**Visual:**
```
┌──────────────────────────────────────────────────────┐
│  📋 Checklist Dokumen LS Kontrak                     │
│                                                       │
│  Progress: ████████░░  75% lengkap                   │
│                                                       │
│  ✅ WAJIB (6/8)                                      │
│  ✅ Kontrak/SPK                         [📄 Sudah]   │
│  ✅ SPMK                                [📄 Sudah]   │
│  ✅ BAST Penyedia                       [📄 Sudah]   │
│  ✅ Faktur/Kwitansi                     [📄 Sudah]   │
│  ✅ Bukti Transfer                      [📄 Sudah]   │
│  ✅ NPWP Penyedia                       [📄 Sudah]   │
│  ⭕ BAP Pemeriksaan                     [Belum]      │
│  ⭕ Foto Dokumentasi                    [Belum]      │
│                                                       │
│  ⚠️ DIANJURKAN (1/2)                                 │
│  ✅ Surat Penawaran                     [📄 Sudah]   │
│  ⭕ Berita Acara Klarifikasi            [Belum]      │
│                                                       │
│  🔵 OPSIONAL (0/3)                                   │
│  ⭕ Foto Progress Pekerjaan              [Belum]      │
│  ⭕ Email Korespondensi                  [Belum]      │
│  ⭕ Dokumen Pendukung Lainnya            [Belum]      │
│                                                       │
│  ⚠️ Anda masih bisa melanjutkan walau belum lengkap │
│  💡 Dokumen yang belum diunggah bisa ditambahkan    │
│     kapan saja dari menu Arsip SPJ                   │
│                                                       │
│  [Kembali]              [Lanjut ke Generate →]      │
└──────────────────────────────────────────────────────┘
```

---

### 5. Generator Dokumen (One-Click)

**Konsep:**
Input data sekali → Generate semua template otomatis

**Untuk LS Kontrak:**
```
┌──────────────────────────────────────────────────────┐
│  📄 Generate Dokumen                                 │
│                                                       │
│  Berdasarkan data yang telah Anda input, sistem     │
│  dapat membuat dokumen-dokumen berikut:             │
│                                                       │
│  Dokumen Pembayaran:                                 │
│  ☑️ SPP (Surat Permintaan Pembayaran)               │
│  ☑️ Ringkasan Kontrak                               │
│  ☑️ Rincian Pembayaran                              │
│                                                       │
│  Dokumen Administrasi:                               │
│  ☑️ Kwitansi                                        │
│  ☑️ Tanda Terima                                    │
│  ☑️ Daftar Nominatif                                │
│                                                       │
│  Dokumen Pelaporan:                                  │
│  ☑️ Berita Acara Serah Terima                       │
│  ☑️ Laporan Realisasi                               │
│  ☑️ Kartu Pengawasan                                │
│                                                       │
│  Format Output:                                       │
│  ◉ PDF (Print-ready)    ○ DOCX (Editable)           │
│                                                       │
│  [⚙️ Kustomisasi]  [📥 Generate Semua]              │
└──────────────────────────────────────────────────────┘

Klik "Generate Semua" →
  ⏳ Generating... (5 detik)
  ✅ 9 dokumen berhasil dibuat!
  📦 Disimpan di: Arsip/2024/LS-Kontrak-001/Dokumen
```

---

### 6. Arsip SPJ (Berbasis Paket)

**Struktur:**
```
Arsip SPJ/
├── 2024/
│   ├── UP-TUP/
│   │   ├── UP-2024-001/
│   │   │   ├── metadata.json
│   │   │   ├── Dokumen/
│   │   │   │   ├── SPP.pdf
│   │   │   │   ├── Kwitansi.pdf
│   │   │   │   └── ...
│   │   │   └── Lampiran/
│   │   │       ├── NPWP.pdf
│   │   │       └── ...
│   │   └── UP-2024-002/
│   │
│   ├── LS-Kontrak/
│   │   ├── LS-Kontrak-001-Renovasi-Kantor/
│   │   │   ├── metadata.json
│   │   │   ├── Dokumen/
│   │   │   │   ├── Kontrak.pdf
│   │   │   │   ├── SPMK.pdf
│   │   │   │   ├── SPP.pdf
│   │   │   │   ├── Kwitansi.pdf
│   │   │   │   ├── BAST.pdf
│   │   │   │   └── ...
│   │   │   └── Lampiran/
│   │   │       ├── Faktur.pdf
│   │   │       ├── NPWP-Vendor.pdf
│   │   │       └── Foto-Dokumentasi.zip
│   │   │
│   │   └── LS-Kontrak-002-Pengadaan-ATK/
│   │
│   ├── Swakelola/
│   ├── Perjalanan-Dinas/
│   └── Honor-PJLP/
│
└── 2025/
```

**Metadata Format (metadata.json):**
```json
{
  "packageId": "LS-Kontrak-001",
  "processType": "ls-kontrak",
  "title": "Renovasi Kantor Cabang Jakarta",
  "year": 2024,
  "createdAt": "2024-06-15T10:30:00",
  "completedAt": "2024-08-20T14:45:00",
  "status": "archived",
  "summary": {
    "kegiatanNama": "Renovasi Kantor Cabang Jakarta",
    "kontrakNomor": "001/SPK/SATKER/VI/2024",
    "penyediaNama": "PT. Berkah Jaya Konstruksi",
    "nilaiKontrak": 250000000,
    "ppk": "John Doe, S.E., M.M.",
    "tanggalKontrak": "2024-06-15",
    "tanggalSelesai": "2024-08-15"
  },
  "documents": [
    {
      "type": "kontrak",
      "filename": "Kontrak.pdf",
      "path": "Dokumen/Kontrak.pdf",
      "required": true,
      "uploaded": true,
      "uploadedAt": "2024-06-15T11:00:00"
    },
    {
      "type": "spmk",
      "filename": "SPMK.pdf",
      "path": "Dokumen/SPMK.pdf",
      "required": true,
      "uploaded": true,
      "uploadedAt": "2024-06-15T11:05:00"
    }
    // ... 20+ dokumen lainnya
  ],
  "checklist": {
    "total": 13,
    "completed": 11,
    "mandatory": 8,
    "recommended": 3,
    "optional": 2,
    "completionRate": 84.6
  }
}
```

---

### 7. Fitur "Unduh Paket SPJ Lengkap"

**Skenario:**
PPK selesai mengerjakan paket SPJ LS Kontrak → klik "Arsipkan" →

```
┌──────────────────────────────────────────────────────┐
│  ✅ Paket SPJ Berhasil Diarsipkan!                   │
│                                                       │
│  📦 LS-Kontrak-001-Renovasi-Kantor                   │
│  🗓️  15 Jun 2024 - 20 Agt 2024                      │
│  💰 Rp 250.000.000                                   │
│                                                       │
│  📊 Kelengkapan: 11/13 (84.6%)                       │
│  ✅ Wajib: 8/8  ⚠️ Dianjurkan: 2/3  🔵 Opsional: 1/2│
│                                                       │
│  Tersimpan di:                                        │
│  📂 Arsip/2024/LS-Kontrak/LS-Kontrak-001            │
│                                                       │
│  Anda dapat:                                          │
│  [📥 Unduh Semua (ZIP)]  [📄 Lihat Detail]          │
│  [📧 Kirim Email]        [🖨️ Print Checklist]       │
│                                                       │
│  [Kembali ke Beranda]  [Buat Paket Baru]            │
└──────────────────────────────────────────────────────┘
```

**File ZIP berisi:**
```
LS-Kontrak-001-Renovasi-Kantor.zip
├── README.txt                    # Ringkasan paket
├── CHECKLIST.pdf                 # Checklist print-ready
├── Dokumen/
│   ├── 01-Kontrak.pdf
│   ├── 02-SPMK.pdf
│   ├── 03-SPP.pdf
│   ├── 04-Kwitansi.pdf
│   ├── 05-BAST.pdf
│   └── ...
└── Lampiran/
    ├── Faktur.pdf
    ├── NPWP-Vendor.pdf
    └── Foto-Dokumentasi.zip
```

---

## 🎨 Bahasa & UX

### Dari Bahasa Teknis → Bahasa Administrasi

| ❌ Sebelum | ✅ Sesudah |
|-----------|-----------|
| "Submit form" | "Lanjutkan" / "Simpan & Lanjut" |
| "Validation failed" | "Mohon lengkapi data yang ditandai" |
| "Required field" | "Wajib diisi" |
| "Upload file" | "Unggah dokumen" |
| "Error 404" | "Halaman tidak ditemukan" |
| "Database error" | "Gagal menyimpan data" |
| "Delete record" | "Hapus data" |
| "Are you sure?" | "Apakah Anda yakin?" |

### Nada Sistem: Asisten, bukan Pengawas

| ❌ Nada Mengawasi | ✅ Nada Membantu |
|------------------|------------------|
| "Dokumen tidak lengkap!" | "Anda belum mengunggah 2 dokumen. Tetap lanjut?" |
| "Anda harus mengisi semua field" | "Mohon lengkapi beberapa data untuk melanjutkan" |
| "Data invalid" | "Format data belum sesuai, mohon periksa kembali" |
| "Access denied" | "Anda belum memiliki akses ke halaman ini" |
| "Checklist gagal" | "Masih ada beberapa dokumen yang dianjurkan untuk dilengkapi" |

### Contoh Notifikasi

**❌ Sebelum:**
```
ERROR: Document upload failed. Check file size.
```

**✅ Sesudah:**
```
⚠️ Dokumen gagal diunggah

File terlalu besar (maksimal 5 MB).
💡 Tips: Kompres PDF menggunakan tools online atau scan dengan resolusi lebih rendah.

[Coba Lagi]  [Bantuan]
```

---

## 🔄 Perbandingan User Flow

### Flow Lama (Menu-Based):
```
1. PPK buka aplikasi
2. Klik "Pengadaan Langsung" di sidebar
3. Klik submenu "Master Paket"
4. Input data paket → Simpan
5. Kembali ke sidebar → Klik "Perencanaan"
6. Input KAK → Simpan
7. Kembali ke sidebar → Klik "Kontrak"
8. Input kontrak → Simpan
9. ... (10+ klik submenu lagi)
10. Akhirnya: Klik "Checklist SPJ"
11. Upload satu per satu → 15+ file
12. Generate dokumen → Download satu per satu

Total: 30+ navigasi, 15+ form, 50+ klik
```

### Flow Baru (Workflow-Based):
```
1. PPK buka aplikasi
2. Dashboard → Klik kartu "LS Kontrak"
3. Wizard terbuka:
   Step 1: Input data kegiatan → Lanjut
   Step 2: Input data kontrak → Lanjut
   Step 3: Input data penyedia → Lanjut
   Step 4: Checklist (lihat status, opsional upload) → Lanjut
   Step 5: Klik "Generate Semua" → 9 dokumen sekaligus
   Step 6: Upload dokumen TTD (drag & drop) → Lanjut
   Step 7: Review → Arsipkan

Total: 7 steps, 1 form wizard, 20 klik
⚡ 60% lebih cepat, 70% lebih sedikit klik
```

---

## 📊 Database Schema Baru

### Tabel Baru untuk Workflow

```javascript
// Table: spjPackages
{
  id: uuid,
  packageCode: 'LS-Kontrak-001',
  processType: 'ls-kontrak', // 'up-tup', 'swakelola', 'perjadin', 'pjlp'
  title: 'Renovasi Kantor',
  year: 2024,
  status: 'draft', // 'in-progress', 'completed', 'archived'
  currentStep: 1, // Wizard step saat ini (untuk resume)

  // Data utama (varies per processType)
  data: {
    kegiatan: { nama, kode, pagu, ... },
    kontrak: { nomor, tanggal, nilai, ... },
    penyedia: { nama, npwp, alamat, ... },
    // ... sesuai jenis proses
  },

  // Checklist
  checklist: {
    items: [
      {
        code: 'kontrak',
        label: 'Kontrak/SPK',
        category: 'mandatory',
        status: 'completed',
        fileId: '...',
        uploadedAt: '...'
      },
      // ...
    ],
    completionRate: 84.6,
    mandatoryComplete: 8,
    mandatoryTotal: 8,
    recommendedComplete: 2,
    recommendedTotal: 3,
    optionalComplete: 1,
    optionalTotal: 2
  },

  // Generated documents
  generatedDocuments: [
    {
      templateCode: 'spp',
      filename: 'SPP.pdf',
      filePath: '...',
      generatedAt: '...',
      parameters: { ... }
    },
    // ...
  ],

  // Uploaded documents (TTD)
  uploadedDocuments: [
    {
      checklistCode: 'kontrak',
      filename: 'Kontrak-TTD.pdf',
      filePath: '...',
      uploadedAt: '...'
    },
    // ...
  ],

  // Archive info
  archivePath: '/Arsip/2024/LS-Kontrak/LS-Kontrak-001',
  archivedAt: null,

  // Metadata
  createdAt: '...',
  createdBy: 'admin',
  updatedAt: '...',
  completedAt: null
}
```

---

## 🛠️ Teknologi & Library

**Existing (Keep):**
- React 18.2.0
- React Router DOM v6
- Dexie (IndexedDB)
- Tailwind CSS
- Lucide React icons
- jsPDF + jspdf-autotable
- docx

**New (Recommended):**
- **React Hook Form** - Form state management yang lebih mudah
- **Zod** - Schema validation (opsional)
- **Framer Motion** - Animasi transisi wizard (opsional, untuk UX lebih smooth)
- **React Dropzone** - Drag & drop file upload
- **JSZip** - Generate ZIP untuk "Unduh Paket Lengkap"
- **date-fns** (sudah ada) - Date formatting

---

## 📐 Component Architecture

### 1. ProcessWizard (Core Component)

```jsx
<ProcessWizard
  processType="ls-kontrak"
  packageId={packageId}
  steps={LS_KONTRAK_STEPS}
  onComplete={handleComplete}
  onSave={handleAutoSave}
>
  <WizardStep name="data-kegiatan">
    <DataKegiatanStep />
  </WizardStep>

  <WizardStep name="data-kontrak">
    <DataKontrakStep />
  </WizardStep>

  <WizardStep name="data-penyedia">
    <DataPenyediaStep />
  </WizardStep>

  <WizardStep name="checklist">
    <ChecklistStep />
  </WizardStep>

  <WizardStep name="generate">
    <GenerateStep />
  </WizardStep>

  <WizardStep name="upload">
    <UploadStep />
  </WizardStep>

  <WizardStep name="review">
    <ReviewStep />
  </WizardStep>
</ProcessWizard>
```

### 2. DocumentChecklist (Smart Checklist)

```jsx
<DocumentChecklist
  checklist={LS_KONTRAK_CHECKLIST}
  packageId={packageId}
  mode="non-blocking" // Tidak memblokir navigasi
  onUpload={handleUpload}
  onStatusChange={handleStatusChange}
/>
```

### 3. TemplateGenerator

```jsx
<TemplateGenerator
  processType="ls-kontrak"
  packageData={packageData}
  templates={LS_KONTRAK_TEMPLATES}
  onGenerate={handleGenerate}
  onGenerateAll={handleGenerateAll}
  outputFormat="pdf" // or 'docx'
/>
```

### 4. SPJArchive

```jsx
<SPJArchive
  year={2024}
  processType="ls-kontrak" // Filter by process type
  onOpen={handleOpenPackage}
  onDownload={handleDownloadZip}
  onDelete={handleDelete}
/>
```

---

## 🎯 Prioritas Implementasi

### Phase 1: Foundation (Week 1-2)
1. ✅ Refactor Sidebar → Jenis Pekerjaan
2. ✅ Refactor Dashboard → Process Cards
3. ✅ Buat komponen ProcessWizard
4. ✅ Buat komponen WizardStep & Navigation
5. ✅ Buat schema database baru (spjPackages)

### Phase 2: Core Features (Week 3-4)
6. ✅ Implementasi DocumentChecklist (non-blocking)
7. ✅ Implementasi TemplateGenerator
8. ✅ Implementasi SPJArchive
9. ✅ Buat custom hooks (useWizard, useChecklist, etc)

### Phase 3: Full Implementation (Week 5-6)
10. ✅ Implementasi lengkap: LS Kontrak Process (7 steps)
11. ✅ Generator dokumen untuk LS Kontrak (9 templates)
12. ✅ Archive manager + ZIP download
13. ✅ Testing & refinement

### Phase 4: Scale Out (Week 7-8)
14. ⏳ Adaptasi proses lain: UP/TUP
15. ⏳ Adaptasi proses: Swakelola
16. ⏳ Adaptasi proses: Perjalanan Dinas
17. ⏳ Adaptasi proses: Honor/PJLP

---

## 🎨 Design Principles

1. **Progressive Disclosure**
   - Tampilkan informasi secara bertahap
   - Jangan overwhelm user dengan terlalu banyak field sekaligus

2. **Feedback Loops**
   - Setiap action ada feedback visual
   - Loading states yang jelas
   - Success/error messages yang helpful

3. **Forgiving UI**
   - Undo/redo support
   - Auto-save draft
   - Confirm before delete
   - Allow incomplete progress

4. **Contextual Help**
   - Tooltip untuk istilah teknis
   - Contoh format input
   - Link ke regulasi terkait (Kepmen KP 56/2024)

5. **Visual Hierarchy**
   - Warna untuk status (hijau=lengkap, kuning=pending, merah=error)
   - Icon yang konsisten
   - Typography yang jelas

---

## 🚀 Success Metrics

**Sebelum Refactor:**
- Rata-rata waktu untuk 1 paket SPJ: **~4 jam**
- Rata-rata klik: **50+ klik**
- Rata-rata navigasi menu: **30+ navigasi**
- Kesalahan input data: **15%** (karena harus input berkali-kali)
- Dokumen terlupa: **20%**

**Target Setelah Refactor:**
- Rata-rata waktu: **~1.5 jam** (⬇️ 62%)
- Rata-rata klik: **20 klik** (⬇️ 60%)
- Rata-rata navigasi: **7 steps** (⬇️ 77%)
- Kesalahan input: **<5%** (input sekali untuk semua)
- Dokumen terlupa: **<5%** (checklist otomatis)

---

## 📚 Next Steps

1. Review arsitektur ini dengan tim
2. Approve desain & prioritas
3. Mulai implementasi Phase 1
4. Iterasi berdasarkan feedback user (PPK)
5. Scale to all process types

---

**Prinsip Utama:**
> "Aplikasi ini adalah asisten administrasi pribadi PPK yang menyiapkan semuanya, bukan sistem yang mengaudit atau menghambat."

✅ Memandu, tidak menghakimi
✅ Menyarankan, tidak memblokir
✅ Membantu, tidak menghambat
