# FASE 4.5 - Multi Tahun Anggaran & Arsip Audit Hidup
## Complete Architecture Documentation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [Core Services](#core-services)
4. [UI Components](#ui-components)
5. [Database Schema](#database-schema)
6. [Integration Guide](#integration-guide)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)

---

## 1. Overview

### Problem Statement

Sebelum FASE 4.5, sistem Admin PPK hanya mendukung single tahun anggaran. Masalah yang muncul:
- Data dari tahun sebelumnya tercampur dengan tahun berjalan
- Tidak ada mekanisme untuk melengkapi SPJ tahun lalu
- Sulit tracking compliance score lintas tahun
- Tidak ada watermark untuk dokumen rekonstruksi
- Risk: audit findings karena data tidak terorganisir per tahun

### Solution: FASE 4.5

Transformasi sistem menjadi **Multi-Year Financial Accountability Management System** dengan:

1. **Fiscal Year Context** - Semua operasi ter-scope ke tahun anggaran
2. **Archive Mode** - View & download SPJ final tahun lampau
3. **Reconstruction Mode** - Lengkapi/perbaiki administrasi tahun lampau
4. **Cross-Year Dashboard** - Overview & analytics lintas tahun
5. **Data Isolation** - Strict separation antar tahun

### Key Benefits

- ✅ **Clarity**: Setiap tahun punya data & dokumentasi sendiri
- ✅ **Safety**: Kerja di tahun aktif tidak ganggu data historis
- ✅ **Flexibility**: Bisa melengkapi SPJ tahun lampau kapan saja
- ✅ **Compliance**: Watermark otomatis untuk dokumen rekonstruksi
- ✅ **Audit Ready**: Multi-year tracking & historical analysis

---

## 2. Architecture Components

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  - FiscalYearSwitcher                                       │
│  - ArchiveMode                                              │
│  - ReconstructionMode                                       │
│  - CrossYearDashboard                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      HOOK LAYER                              │
│  - useFiscalYear                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  - FiscalYearContext (Core Engine)                          │
│  - WorkflowEngine (Updated)                                 │
│  - ComplianceEngine (Updated)                               │
│  - DocumentGenerationService (Updated)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  - MasterData (+ tahunAnggaran)                             │
│  - WorkflowInstances (+ tahunAnggaran)                      │
│  - Documents (+ tahunAnggaran)                              │
│  - ComplianceReports (+ tahunAnggaran)                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User → FiscalYearSwitcher → useFiscalYear → FiscalYearContext
                                                    ↓
                                      (emits 'yearChanged' event)
                                                    ↓
                    ┌───────────────────────────────┴───────────────┐
                    ↓                                               ↓
            WorkflowEngine                                 ComplianceEngine
         (filters by tahunAnggaran)                    (filters by tahunAnggaran)
                    ↓                                               ↓
               UI Components                                  UI Components
            (auto re-render)                                (auto re-render)
```

---

## 3. Core Services

### 3.1 FiscalYearContext

**Location**: `src/services/fiscal/FiscalYearContext.js`

**Purpose**: Central service untuk manage active fiscal year & mode.

**Key Features**:
- Singleton pattern
- EventEmitter-based (reactive)
- localStorage persistence
- Audit trail logging

**API**:

```javascript
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

// Initialization
await fiscalYearContext.initialize()

// Get active year
const activeYear = fiscalYearContext.getActiveYear()  // 2024

// Switch year
await fiscalYearContext.switchYear(2023, 'User switch')

// Get mode
const mode = fiscalYearContext.getMode()  // 'OPERATIONAL' | 'ARCHIVE' | 'RECONSTRUCTION'

// Change mode
fiscalYearContext.setMode('RECONSTRUCTION')

// Create query filter
const filter = fiscalYearContext.createFilter({ satkerKode: 'SATKER123' })
// { tahunAnggaran: 2024, satkerKode: 'SATKER123' }

// Wrap data with context
const data = fiscalYearContext.wrapWithContext({ foo: 'bar' })
// { foo: 'bar', tahunAnggaran: 2024, fiscalYearMode: 'OPERATIONAL', contextTimestamp: '...' }

// Listen to changes
fiscalYearContext.on('yearChanged', (event) => {
  console.log(`Year changed from ${event.oldYear} to ${event.newYear}`)
})
```

**Modes**:

| Mode | Description | Use Case |
|------|-------------|----------|
| `OPERATIONAL` | Normal working mode for active year | Daily operations |
| `ARCHIVE` | Read-only mode for previous years | View & download final SPJ |
| `RECONSTRUCTION` | Edit mode for previous years | Complete/fix old documents |

### 3.2 WorkflowEngine (Updated)

**Location**: `src/services/workflow/WorkflowEngine.js`

**Changes in FASE 4.5**:

```javascript
// Before FASE 4.5
const instance = await workflowEngine.initializeWorkflow('LS_KONTRAK', masterData)

// After FASE 4.5
const instance = await workflowEngine.initializeWorkflow('LS_KONTRAK', masterData, {
  tahunAnggaran: 2023,          // Explicit year
  isReconstruction: true         // Flag as reconstruction
})

// Result includes fiscal year context:
{
  workflowType: 'LS_KONTRAK',
  masterData: { ... },
  tahunAnggaran: 2023,
  fiscalYearMode: 'RECONSTRUCTION',
  isReconstruction: true,
  reconstructionDate: '2024-01-15T...',
  // ... other fields
}
```

**New Methods**:
- `getInstancesByFiscalYear(tahunAnggaran)` - Query by year
- `createFiscalYearFilter(additionalFilters)` - Create filter
- `wrapWithFiscalYearContext(instance)` - Wrap with context
- `isReconstructionWorkflow(instance)` - Check if reconstruction
- `getReconstructionMetadata(instance)` - Get reconstruction info

### 3.3 ComplianceEngine (Updated)

**Location**: `src/services/workflow/ComplianceEngine.js`

**Changes in FASE 4.5**:

```javascript
// calculateAuditReadiness now returns fiscal year context
const report = await complianceEngine.calculateAuditReadiness(workflowInstance, masterData)

// Result includes:
{
  score: 95,
  complianceLevel: { ... },
  issues: { ... },
  recommendations: [ ... ],
  // FASE 4.5: Fiscal Year Context
  tahunAnggaran: 2023,
  fiscalYearMode: 'RECONSTRUCTION',
  isReconstruction: true
}

// For reconstruction, add watermark
if (report.isReconstruction) {
  const reportWithWatermark = complianceEngine.addReconstructionWatermark(report)
  // Adds watermark: "REKONSTRUKSI ADMINISTRASI TAHUN ANGGARAN 2023"
}
```

**New Methods**:
- `getReportsByFiscalYear(tahunAnggaran)` - Query reports by year
- `getCrossYearSummary()` - Get summary across all years
- `addReconstructionWatermark(report)` - Add watermark to report
- `createFiscalYearFilter(additionalFilters)` - Create filter

---

## 4. UI Components

### 4.1 FiscalYearSwitcher

**Location**: `src/components/fiscal/FiscalYearSwitcher.jsx`

**Purpose**: Header component for switching fiscal years.

**Usage**:

```jsx
import { FiscalYearSwitcher } from './components/fiscal'

function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <Logo />

      {/* Full mode */}
      <FiscalYearSwitcher
        onYearChange={(year) => {
          console.log('Year changed to:', year)
        }}
      />

      {/* Compact mode */}
      <FiscalYearSwitcher compact={true} size="sm" />

      <UserMenu />
    </header>
  )
}
```

**Features**:
- Dropdown dengan available years (2015 - current year + 1)
- Status badge (Aktif/Arsip/Rekonstruksi)
- Visual indicators (colors, icons)
- Auto-reload data saat year berganti

### 4.2 ArchiveMode

**Location**: `src/components/fiscal/ArchiveMode.jsx`

**Purpose**: View & download archived SPJ packages (read-only).

**Usage**:

```jsx
import { ArchiveMode } from './components/fiscal'

function ArchivePage() {
  return <ArchiveMode />
}
```

**Features**:
- List semua SPJ packages untuk tahun arsip
- Compliance score display
- Download button untuk setiap paket
- View details (documents, audit score, etc.)
- Read-only mode (no modifications)
- Show reconstruction history

### 4.3 ReconstructionMode

**Location**: `src/components/fiscal/ReconstructionMode.jsx`

**Purpose**: Complete/fix SPJ packages from previous years.

**Usage**:

```jsx
import { ReconstructionMode } from './components/fiscal'

function ReconstructionPage() {
  return <ReconstructionMode />
}
```

**Features**:
- List incomplete SPJ dari tahun lampau
- Step-by-step reconstruction wizard
- Integration dengan ProcessWizard
- Validation & compliance re-calculation
- Confirmation modal dengan reason
- Auto-watermark untuk dokumen hasil rekonstruksi

**Flow**:
1. User selects incomplete SPJ
2. System shows reconstruction tasks
3. User completes missing data/documents
4. User confirms reconstruction dengan reason
5. System marks as "RECONSTRUCTED" + adds watermark

### 4.4 CrossYearDashboard

**Location**: `src/components/fiscal/CrossYearDashboard.jsx`

**Purpose**: Multi-year overview & analytics.

**Usage**:

```jsx
import { CrossYearDashboard } from './components/fiscal'

function DashboardPage() {
  return <CrossYearDashboard />
}
```

**Features**:
- Summary cards per tahun anggaran
- Compliance score trend chart
- Quick switch antar tahun
- Statistics (total packages, avg score, reconstructed count)
- Table view dengan full details
- Year comparison

---

## 5. Database Schema

### Schema Changes

All main entities must have `tahunAnggaran` field:

```javascript
// Base schema for all entities
{
  tahunAnggaran: {
    type: Number,
    required: true,
    index: true,
    min: 2015,
    max: 2100,
    default: () => new Date().getFullYear()
  }
}
```

### Compound Indexes

```javascript
// MasterData
masterDataSchema.index({ tahunAnggaran: 1, masterId: 1 }, { unique: true })
masterDataSchema.index({ tahunAnggaran: 1, status: 1 })
masterDataSchema.index({ tahunAnggaran: 1, satkerKode: 1 })

// WorkflowInstances
workflowInstanceSchema.index({ tahunAnggaran: 1, instanceId: 1 }, { unique: true })
workflowInstanceSchema.index({ tahunAnggaran: 1, workflowType: 1 })

// Documents
documentSchema.index({ tahunAnggaran: 1, documentId: 1 }, { unique: true })
documentSchema.index({ tahunAnggaran: 1, masterDataId: 1 })

// ComplianceReports
complianceReportSchema.index({ tahunAnggaran: 1, reportId: 1 }, { unique: true })
complianceReportSchema.index({ tahunAnggaran: 1, score: 1 })
```

### Reconstruction Fields

Add to entities that support reconstruction:

```javascript
{
  isReconstruction: {
    type: Boolean,
    default: false
  },
  reconstructionDate: {
    type: Date,
    default: null
  },
  reconstructionReason: {
    type: String,
    default: null
  }
}
```

**Full migration guide**: See `docs/database/FASE-4.5-Schema-Migration.md`

---

## 6. Integration Guide

### 6.1 Integrating FiscalYearContext into Existing Code

#### Step 1: Import the context

```javascript
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'
```

#### Step 2: Initialize on app start

```javascript
// In your main app initialization
async function initializeApp() {
  await fiscalYearContext.initialize()
  console.log('Active year:', fiscalYearContext.getActiveYear())
}
```

#### Step 3: Update query methods

```javascript
// Before
async function getAllMasterData() {
  return await MasterData.find()
}

// After
async function getAllMasterData() {
  const filter = fiscalYearContext.createFilter()
  return await MasterData.find(filter)
  // Automatically scoped to active year
}
```

#### Step 4: Update create methods

```javascript
// Before
async function createMasterData(data) {
  const masterData = new MasterData(data)
  return await masterData.save()
}

// After
async function createMasterData(data) {
  const contextData = fiscalYearContext.wrapWithContext(data)
  const masterData = new MasterData(contextData)
  return await masterData.save()
  // Automatically tagged with active year
}
```

### 6.2 Integrating useFiscalYear into Components

```jsx
import { useFiscalYear } from './hooks/useFiscalYear.js'

function MyComponent() {
  const {
    activeYear,
    mode,
    isActive,
    isArchive,
    isReconstruction,
    switchYear,
    createFilter
  } = useFiscalYear()

  // Component automatically re-renders when fiscal year changes

  return (
    <div>
      <p>Currently viewing: TA {activeYear}</p>
      <p>Mode: {mode}</p>

      {isArchive && <p>Read-only mode</p>}
      {isReconstruction && <p>Reconstruction mode enabled</p>}
    </div>
  )
}
```

### 6.3 Integrating with Document Generation

```javascript
import documentGenerationService from './services/DocumentGenerationService.js'
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

async function generateDocument(masterData, documentType) {
  const isReconstruction = fiscalYearContext.isReconstructionMode()

  const options = {
    documentType,
    tahunAnggaran: fiscalYearContext.getActiveYear(),
    // Add watermark if reconstruction
    watermark: isReconstruction ? {
      text: `REKONSTRUKSI ADMINISTRASI TA ${fiscalYearContext.getActiveYear()}`,
      position: 'footer',
      opacity: 0.5
    } : null
  }

  return await documentGenerationService.generate(masterData, options)
}
```

---

## 7. Usage Examples

### Example 1: Switch to Archive Mode

```javascript
// User wants to view SPJ from 2023
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

// Switch to 2023
await fiscalYearContext.switchYear(2023, 'User viewing archive')

// Mode automatically becomes ARCHIVE (because 2023 is not current year)
console.log(fiscalYearContext.getMode())  // 'ARCHIVE'
console.log(fiscalYearContext.isArchiveMode())  // true

// All queries now scoped to 2023
const filter = fiscalYearContext.createFilter()
// { tahunAnggaran: 2023 }

const masterData = await MasterData.find(filter)
// Returns only 2023 data
```

### Example 2: Reconstruction Flow

```javascript
// User wants to complete SPJ from 2022
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

// 1. Switch to 2022
await fiscalYearContext.switchYear(2022, 'Reconstruction needed')

// 2. Enable reconstruction mode
fiscalYearContext.setMode('RECONSTRUCTION')
console.log(fiscalYearContext.isReconstructionMode())  // true

// 3. Load incomplete master data
const filter = fiscalYearContext.createFilter({ status: 'INCOMPLETE' })
const incompleteSPJ = await MasterData.find(filter)

// 4. User completes the data in UI

// 5. Regenerate documents with watermark
const document = await generateDocument(masterData, 'KUITANSI')
// Document will have watermark: "REKONSTRUKSI ADMINISTRASI TA 2022"

// 6. Mark as reconstructed
await MasterData.updateOne(
  { masterId: 'MDK-2022-001' },
  {
    status: 'COMPLETED',
    isReconstruction: true,
    reconstructionDate: new Date(),
    reconstructionReason: 'Melengkapi dokumen BAST yang hilang'
  }
)
```

### Example 3: Cross-Year Query

```javascript
// For dashboard: get summary of all years
async function getCrossYearSummary() {
  const summary = await MasterData.aggregate([
    {
      $group: {
        _id: '$tahunAnggaran',
        totalRecords: { $sum: 1 },
        completedRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: -1 } }
  ])

  return summary
  // [
  //   { _id: 2024, totalRecords: 50, completedRecords: 45 },
  //   { _id: 2023, totalRecords: 48, completedRecords: 48 },
  //   { _id: 2022, totalRecords: 42, completedRecords: 40 }
  // ]
}
```

---

## 8. Best Practices

### DO's ✅

1. **Always use FiscalYearContext for queries**
   ```javascript
   // ✅ Good
   const filter = fiscalYearContext.createFilter({ satkerKode: 'X' })
   const data = await MasterData.find(filter)
   ```

2. **Always wrap new data with context**
   ```javascript
   // ✅ Good
   const contextData = fiscalYearContext.wrapWithContext(data)
   await MasterData.create(contextData)
   ```

3. **Listen to yearChanged events in components**
   ```javascript
   // ✅ Good
   useEffect(() => {
     const handleYearChanged = () => {
       loadData()  // Reload when year changes
     }
     fiscalYearContext.on('yearChanged', handleYearChanged)
     return () => fiscalYearContext.off('yearChanged', handleYearChanged)
   }, [])
   ```

4. **Add watermarks to reconstruction documents**
   ```javascript
   // ✅ Good
   if (fiscalYearContext.isReconstructionMode()) {
     options.watermark = {
       text: `REKONSTRUKSI ADMINISTRASI TA ${fiscalYearContext.getActiveYear()}`
     }
   }
   ```

### DON'Ts ❌

1. **Don't query without fiscal year filter**
   ```javascript
   // ❌ Bad - will mix data from all years
   const data = await MasterData.find()
   ```

2. **Don't hardcode tahunAnggaran**
   ```javascript
   // ❌ Bad
   const data = { ...formData, tahunAnggaran: 2024 }

   // ✅ Good
   const data = fiscalYearContext.wrapWithContext(formData)
   ```

3. **Don't skip reconstruction flag**
   ```javascript
   // ❌ Bad - reconstruction data looks like original
   await MasterData.create(data)

   // ✅ Good
   await MasterData.create({
     ...data,
     isReconstruction: true,
     reconstructionDate: new Date()
   })
   ```

4. **Don't allow writes in Archive mode**
   ```javascript
   // ✅ Good - check before write operations
   if (fiscalYearContext.isArchiveMode()) {
     throw new Error('Cannot modify data in Archive mode')
   }
   ```

---

## 9. Testing Strategy

### Unit Tests

```javascript
// Test FiscalYearContext
describe('FiscalYearContext', () => {
  it('should initialize with current year', async () => {
    await fiscalYearContext.initialize()
    expect(fiscalYearContext.getActiveYear()).toBe(new Date().getFullYear())
  })

  it('should switch year and emit event', async () => {
    const listener = jest.fn()
    fiscalYearContext.on('yearChanged', listener)

    await fiscalYearContext.switchYear(2023)

    expect(listener).toHaveBeenCalledWith({
      oldYear: expect.any(Number),
      newYear: 2023,
      mode: 'ARCHIVE'
    })
  })

  it('should create filter with active year', () => {
    const filter = fiscalYearContext.createFilter({ status: 'COMPLETED' })
    expect(filter).toEqual({
      tahunAnggaran: fiscalYearContext.getActiveYear(),
      status: 'COMPLETED'
    })
  })
})
```

### Integration Tests

```javascript
// Test WorkflowEngine integration
describe('WorkflowEngine with Fiscal Year', () => {
  it('should create workflow instance with fiscal year context', async () => {
    const instance = await workflowEngine.initializeWorkflow('LS_KONTRAK', masterData, {
      tahunAnggaran: 2023,
      isReconstruction: true
    })

    expect(instance.tahunAnggaran).toBe(2023)
    expect(instance.isReconstruction).toBe(true)
    expect(instance.reconstructionDate).toBeTruthy()
  })
})
```

### E2E Tests

```javascript
// Test full reconstruction flow
describe('Reconstruction Flow', () => {
  it('should complete reconstruction and add watermark', async () => {
    // 1. Switch to previous year
    await fiscalYearContext.switchYear(2023)

    // 2. Enable reconstruction mode
    fiscalYearContext.setMode('RECONSTRUCTION')

    // 3. Complete master data
    const masterData = await completeMasterData('MDK-2023-001')

    // 4. Generate document
    const document = await generateDocument(masterData, 'KUITANSI')

    // 5. Verify watermark
    expect(document.watermark).toBeTruthy()
    expect(document.watermark.text).toContain('REKONSTRUKSI')

    // 6. Verify reconstruction flag
    const updated = await MasterData.findOne({ masterId: 'MDK-2023-001' })
    expect(updated.isReconstruction).toBe(true)
  })
})
```

---

## 10. Deployment

### Pre-Deployment Checklist

- [ ] Run database migration (add `tahunAnggaran` field)
- [ ] Create indexes for performance
- [ ] Migrate existing data to appropriate years
- [ ] Test FiscalYearContext initialization
- [ ] Test year switching
- [ ] Test archive mode (read-only enforcement)
- [ ] Test reconstruction mode (watermark generation)
- [ ] Verify no cross-year data leakage
- [ ] Test dashboard loads correctly
- [ ] Performance test with large datasets

### Deployment Steps

1. **Backup Database**
   ```bash
   mongodump --out=/backup/pre-fase45-$(date +%Y%m%d)
   ```

2. **Run Migration**
   ```bash
   node scripts/migrate-fase45.js
   ```

3. **Verify Migration**
   ```bash
   node scripts/verify-migration.js
   ```

4. **Deploy Code**
   ```bash
   git checkout claude/ppk-document-assistant-CFlyn
   npm run build
   npm run deploy
   ```

5. **Smoke Test**
   - Login to system
   - Switch between years
   - Verify data isolation
   - Test archive mode
   - Test reconstruction mode

### Rollback Plan

If issues occur:

```bash
# 1. Restore database backup
mongorestore /backup/pre-fase45-YYYYMMDD

# 2. Revert code
git revert <commit-hash>

# 3. Redeploy
npm run deploy
```

---

## 📚 Related Documentation

- [Database Migration Guide](./database/FASE-4.5-Schema-Migration.md)
- [API Documentation](./api/FiscalYear-API.md)
- [User Guide](./user/Multi-Year-User-Guide.md)

---

## ✅ Implementation Checklist

### Core Services
- [x] FiscalYearContext service
- [x] useFiscalYear hook
- [x] WorkflowEngine integration
- [x] ComplianceEngine integration

### UI Components
- [x] FiscalYearSwitcher
- [x] ArchiveMode
- [x] ReconstructionMode
- [x] CrossYearDashboard

### Database
- [x] Schema migration documentation
- [ ] Migration scripts
- [ ] Index creation scripts

### Testing
- [ ] Unit tests for FiscalYearContext
- [ ] Integration tests for engines
- [ ] E2E tests for reconstruction flow
- [ ] Performance tests

### Documentation
- [x] Architecture documentation
- [x] Integration guide
- [x] Usage examples
- [x] Best practices

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup

---

**Version**: 1.0.0
**Last Updated**: January 2024
**Author**: Admin PPK Development Team
**Status**: ✅ Complete - Ready for Implementation

---

## 🎉 Summary

FASE 4.5 transforms Admin PPK into a **Multi-Year Financial Accountability Management System**.

Key achievements:
- ✅ Fiscal year isolation (no more data mixing!)
- ✅ Archive & Reconstruction capabilities
- ✅ Automatic watermarking for reconstructed documents
- ✅ Cross-year analytics & dashboard
- ✅ Audit-ready historical tracking

The system is now ready to manage financial accountability across multiple fiscal years safely and efficiently. 🚀
