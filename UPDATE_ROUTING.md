# UPDATE ROUTING - Asisten Digital PPK

Panduan untuk mengintegrasikan routes baru ke dalam aplikasi existing.

## ⚠️ Penting

Anda memiliki 2 opsi untuk implementasi:

1. **Opsi A (Recommended):** Gunakan Dashboard baru di route `/` dan menu lama masih bisa diakses
2. **Opsi B:** Keep everything separate, akses dashboard baru di `/dashboard-new`

---

## 📝 Opsi A: Update App.jsx (Recommended)

### 1. Tambahkan Imports Baru di bagian atas file

```jsx
// Di bagian atas App.jsx, tambahkan imports berikut:

// NEW: Workflow-oriented pages
import DashboardNew from './pages/home/DashboardNew'
import LsKontrakProcess from './pages/processes/ls-kontrak/LsKontrakProcess'
import SPJArchive from './components/workflow/SPJArchive'
```

### 2. Update Route untuk Dashboard

```jsx
// Di dalam <Routes>, REPLACE route dashboard existing:

// ❌ SEBELUM:
<Route path="/" element={<Dashboard />} />

// ✅ SESUDAH:
<Route path="/" element={<DashboardNew />} />

// Keep old dashboard accessible (opsional):
<Route path="/dashboard-old" element={<Dashboard />} />
```

### 3. Tambahkan Routes Baru

```jsx
// Tambahkan routes baru di dalam <Routes>, setelah route dashboard:

{/* NEW ROUTES - Workflow Processes */}
<Route path="/proses/ls-kontrak" element={<LsKontrakProcess />} />
<Route path="/proses/ls-kontrak/:id" element={<LsKontrakProcess />} />

{/* Archive */}
<Route path="/arsip" element={<SPJArchive />} />

{/* OLD ROUTES - Keep semua route existing */}
{/* Master Data */}
<Route path="/master/pegawai" element={<MasterPegawai />} />
<Route path="/master/kota" element={<MasterKota />} />
{/* ... sisanya tetap sama ... */}
```

### 4. Update Sidebar

Ganti import Sidebar dengan SidebarNew:

```jsx
// Di file Layout.jsx atau component yang render sidebar

// ❌ SEBELUM:
import Sidebar from './Sidebar'

// ✅ SESUDAH:
import Sidebar from './SidebarNew'

// ATAU keep both dan bisa toggle:
import SidebarNew from './SidebarNew'
import SidebarOld from './Sidebar'

// Lalu render based on preference:
const [useNewSidebar, setUseNewSidebar] = useState(true)
{useNewSidebar ? <SidebarNew /> : <SidebarOld />}
```

---

## 📝 Opsi B: Keep Separate

Jika Anda ingin keep old dashboard dan test new dashboard dulu:

```jsx
// Tambahkan routes tambahan tanpa replace existing:

<Route path="/" element={<Dashboard />} /> {/* OLD */}
<Route path="/dashboard-new" element={<DashboardNew />} /> {/* NEW */}

<Route path="/proses/ls-kontrak" element={<LsKontrakProcess />} />
<Route path="/proses/ls-kontrak/:id" element={<LsKontrakProcess />} />
<Route path="/arsip" element={<SPJArchive />} />
```

Akses dashboard baru di: `http://localhost:5173/dashboard-new`

---

## 🗂️ Update Database Schema

Tambahkan table baru di `/src/db/database.js`:

```javascript
// Di dalam version upgrade (atau buat version baru):

this.version(10).stores({
  ...existingStores, // Keep semua stores existing

  // NEW TABLE untuk workflow
  spjPackages: '++id, packageCode, processType, year, status, createdAt, updatedAt'
})
```

**PENTING:** Increment version number dari version terakhir yang ada.

---

## 🧪 Testing

### Test Routes Baru:

1. **Dashboard Baru:** http://localhost:5173/
2. **LS Kontrak Process:** http://localhost:5173/proses/ls-kontrak
3. **Arsip:** http://localhost:5173/arsip

### Test Flow End-to-End:

1. Buka Dashboard baru
2. Klik card "LS Kontrak"
3. Isi wizard 7 steps:
   - Step 1: Data Kegiatan
   - Step 2: Data Kontrak
   - Step 3: Data Penyedia
   - Step 4: Checklist (skip/upload beberapa)
   - Step 5: Klik "Generate Semua" → Download 5 PDF
   - Step 6: Upload dokumen (optional)
   - Step 7: Review → Klik "Selesai & Arsipkan"
4. Redirect ke Arsip → Lihat paket SPJ yang baru dibuat

---

## 🔧 Troubleshooting

### Error: "spjPackages is not defined"

**Solusi:** Database schema belum di-update. Refresh browser atau clear IndexedDB dari DevTools.

```javascript
// Application → IndexedDB → SIPBJ_SPJ_Database → Delete
// Lalu refresh browser
```

### Error: "Cannot find module './pages/home/DashboardNew'"

**Solusi:** File belum ter-commit atau path salah. Check file structure:

```
src/
├── pages/
│   ├── home/
│   │   └── DashboardNew.jsx  ← harus ada
│   └── processes/
│       └── ls-kontrak/
│           ├── LsKontrakProcess.jsx  ← harus ada
│           ├── config.js
│           └── steps/
│               ├── DataKegiatanStep.jsx
│               ├── DataKontrakStep.jsx
│               └── ...
```

### Document Generator Error

**Solusi:** Pastikan jsPDF sudah ter-install:

```bash
npm install jspdf jspdf-autotable
```

---

## 📋 Checklist Implementasi

- [ ] Update database schema (version bump)
- [ ] Tambahkan imports baru di App.jsx
- [ ] Update atau tambahkan routes
- [ ] Update Sidebar import (atau keep both)
- [ ] Test database connection (buat 1 dummy package)
- [ ] Test LS Kontrak flow end-to-end
- [ ] Verify PDF generation
- [ ] Test Archive functionality

---

## 🎯 Next Steps Setelah LS Kontrak Works

1. **Adaptasi proses lainnya:**
   - Copy struktur LS Kontrak
   - Sesuaikan config, checklist, templates
   - Buat generator dokumen spesifik

2. **Enhance Archive:**
   - Implement ZIP download
   - Add search & filter
   - Add metadata export

3. **Polish UX:**
   - Add loading states
   - Add error boundaries
   - Add toast notifications
   - Add confirmation dialogs

---

## 📞 Support

Jika ada issue:
1. Check console untuk error messages
2. Check Network tab untuk failed requests
3. Check IndexedDB untuk data structure
4. Refer to PANDUAN_IMPLEMENTASI.md

---

**Happy Coding! 🚀**

Ingat prinsip utama:
> "Aplikasi ini adalah asisten administrasi pribadi PPK yang menyiapkan, mengingatkan, dan merapikan dokumen, bukan sistem yang mengaudit atau menghambat."
