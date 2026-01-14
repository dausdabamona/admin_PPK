import { db } from '../db/database'
import { enrichPackageData, validatePackageData, extractSummary } from '../utils/workflow/dataMapper'
import { generateAuditTrail } from '../utils/audit/auditTrail'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * SPJPackageService - Service Layer untuk SPJ Package Management
 *
 * Prinsip:
 * - Business logic terpisah dari UI
 * - Single responsibility
 * - Testable & maintainable
 */

class SPJPackageService {
  /**
   * Create new SPJ package
   */
  async createPackage(processType, initialData = {}) {
    try {
      const now = new Date()
      const year = initialData.kegiatan?.tahun || now.getFullYear()

      // Generate package code
      const packageCode = await this.generatePackageCode(processType, year)

      const packageData = {
        packageCode,
        processType,
        year,
        status: 'draft',
        currentStep: 0,
        title: initialData.kegiatan?.nama || 'Paket SPJ Baru',
        data: initialData,
        checklist: {
          items: [],
          completionRate: 0,
          mandatoryComplete: 0,
          mandatoryTotal: 0
        },
        generatedDocuments: [],
        uploadedDocuments: [],
        auditTrail: [
          {
            action: 'CREATE',
            timestamp: now,
            user: 'admin',
            description: 'Paket SPJ dibuat'
          }
        ],
        createdAt: now,
        createdBy: 'admin',
        updatedAt: now
      }

      const id = await db.spjPackages?.add(packageData)

      return {
        success: true,
        id,
        packageCode,
        message: 'Paket SPJ berhasil dibuat'
      }
    } catch (error) {
      console.error('Failed to create package:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update package data
   */
  async updatePackage(packageId, updates, action = 'UPDATE') {
    try {
      const existing = await db.spjPackages?.get(packageId)
      if (!existing) {
        throw new Error('Package not found')
      }

      const now = new Date()

      // Append to audit trail
      const auditEntry = {
        action,
        timestamp: now,
        user: 'admin',
        description: this.getActionDescription(action, updates),
        changes: this.detectChanges(existing, updates)
      }

      const updatedData = {
        ...updates,
        updatedAt: now,
        auditTrail: [...(existing.auditTrail || []), auditEntry]
      }

      await db.spjPackages?.update(packageId, updatedData)

      return {
        success: true,
        message: 'Paket berhasil diperbarui'
      }
    } catch (error) {
      console.error('Failed to update package:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get package by ID with enrichment
   */
  async getPackage(packageId, options = {}) {
    try {
      const pkg = await db.spjPackages?.get(packageId)
      if (!pkg) {
        throw new Error('Package not found')
      }

      // Enrich if requested
      if (options.enrich) {
        const enrichedData = await enrichPackageData(pkg.data)
        pkg.enrichedData = enrichedData
      }

      // Validate if requested
      if (options.validate) {
        const validation = validatePackageData(pkg.data)
        pkg.validation = validation
      }

      // Extract summary if requested
      if (options.summary) {
        const summary = extractSummary(pkg.data)
        pkg.summary = summary
      }

      return {
        success: true,
        package: pkg
      }
    } catch (error) {
      console.error('Failed to get package:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Complete package and archive
   */
  async completePackage(packageId) {
    try {
      const result = await this.getPackage(packageId, { validate: true, summary: true })
      if (!result.success) {
        throw new Error(result.error)
      }

      const pkg = result.package
      const now = new Date()

      await this.updatePackage(packageId, {
        status: 'archived',
        completedAt: now,
        archivedAt: now,
        archivePath: this.generateArchivePath(pkg)
      }, 'ARCHIVE')

      return {
        success: true,
        message: 'Paket berhasil diarsipkan',
        archivePath: this.generateArchivePath(pkg)
      }
    } catch (error) {
      console.error('Failed to complete package:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Download package as ZIP
   */
  async downloadPackageZip(packageId) {
    try {
      const result = await this.getPackage(packageId, { summary: true })
      if (!result.success) {
        throw new Error(result.error)
      }

      const pkg = result.package
      const zip = new JSZip()

      // Add README
      zip.file('README.txt', this.generateReadme(pkg))

      // Add checklist summary
      zip.file('CHECKLIST.txt', this.generateChecklistSummary(pkg))

      // Add audit trail
      zip.file('AUDIT_TRAIL.txt', this.generateAuditTrailReport(pkg))

      // Add metadata
      zip.file('metadata.json', JSON.stringify(pkg, null, 2))

      // Create folders
      const docsFolder = zip.folder('Dokumen')
      const attachmentsFolder = zip.folder('Lampiran')

      // TODO: Add actual document files
      // For now, add placeholders
      pkg.generatedDocuments?.forEach((doc, idx) => {
        docsFolder.file(`${idx + 1}-${doc.filename}`, `Placeholder for ${doc.filename}`)
      })

      pkg.uploadedDocuments?.forEach((doc, idx) => {
        attachmentsFolder.file(`${idx + 1}-${doc.filename}`, `Placeholder for ${doc.filename}`)
      })

      // Generate ZIP
      const content = await zip.generateAsync({ type: 'blob' })

      // Download
      const filename = `${pkg.packageCode}-${pkg.title?.replace(/\s+/g, '-')}.zip`
      saveAs(content, filename)

      // Log download action
      await this.updatePackage(packageId, {}, 'DOWNLOAD_ZIP')

      return {
        success: true,
        message: 'Paket berhasil diunduh',
        filename
      }
    } catch (error) {
      console.error('Failed to download package:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get audit trail for package
   */
  async getAuditTrail(packageId) {
    try {
      const pkg = await db.spjPackages?.get(packageId)
      if (!pkg) {
        throw new Error('Package not found')
      }

      return {
        success: true,
        auditTrail: pkg.auditTrail || []
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get chronology/timeline of package
   */
  async getChronology(packageId) {
    try {
      const pkg = await db.spjPackages?.get(packageId)
      if (!pkg) {
        throw new Error('Package not found')
      }

      const timeline = [
        {
          event: 'Paket Dibuat',
          timestamp: pkg.createdAt,
          icon: 'create',
          color: 'blue'
        }
      ]

      // Add audit trail events
      pkg.auditTrail?.forEach(entry => {
        timeline.push({
          event: entry.description,
          timestamp: entry.timestamp,
          icon: this.getIconForAction(entry.action),
          color: this.getColorForAction(entry.action),
          details: entry.changes
        })
      })

      if (pkg.completedAt) {
        timeline.push({
          event: 'Paket Diselesaikan',
          timestamp: pkg.completedAt,
          icon: 'complete',
          color: 'green'
        })
      }

      if (pkg.archivedAt) {
        timeline.push({
          event: 'Paket Diarsipkan',
          timestamp: pkg.archivedAt,
          icon: 'archive',
          color: 'purple'
        })
      }

      // Sort by timestamp descending
      timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return {
        success: true,
        chronology: timeline
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== HELPER METHODS ====================

  async generatePackageCode(processType, year) {
    const prefix = this.getProcessPrefix(processType)

    // Get count for this year & process type
    const existing = await db.spjPackages
      ?.where('year').equals(year)
      .and(pkg => pkg.processType === processType)
      .count()

    const number = (existing || 0) + 1
    const paddedNumber = String(number).padStart(3, '0')

    return `${prefix}-${year}-${paddedNumber}`
  }

  getProcessPrefix(processType) {
    const prefixes = {
      'up-tup': 'UP',
      'ls-kontrak': 'LSK',
      'swakelola': 'SWK',
      'perjadin': 'PJD',
      'pjlp': 'PJLP'
    }
    return prefixes[processType] || 'PKG'
  }

  generateArchivePath(pkg) {
    return `/Arsip/${pkg.year}/${this.getProcessLabel(pkg.processType)}/${pkg.packageCode}`
  }

  getProcessLabel(processType) {
    const labels = {
      'up-tup': 'UP-TUP',
      'ls-kontrak': 'LS-Kontrak',
      'swakelola': 'Swakelola',
      'perjadin': 'Perjalanan-Dinas',
      'pjlp': 'Honor-PJLP'
    }
    return labels[processType] || 'Lainnya'
  }

  getActionDescription(action, updates) {
    const descriptions = {
      'CREATE': 'Paket dibuat',
      'UPDATE': 'Data diperbarui',
      'UPDATE_STEP': `Melanjutkan ke step ${updates.currentStep + 1}`,
      'GENERATE_DOCS': 'Dokumen di-generate',
      'UPLOAD_DOC': 'Dokumen diunggah',
      'DELETE_DOC': 'Dokumen dihapus',
      'ARCHIVE': 'Paket diarsipkan',
      'DOWNLOAD_ZIP': 'Paket diunduh sebagai ZIP'
    }
    return descriptions[action] || action
  }

  detectChanges(oldData, newData) {
    const changes = []

    // Detect changed fields
    if (newData.data && oldData.data) {
      Object.keys(newData.data).forEach(key => {
        if (JSON.stringify(newData.data[key]) !== JSON.stringify(oldData.data[key])) {
          changes.push({
            field: key,
            oldValue: oldData.data[key],
            newValue: newData.data[key]
          })
        }
      })
    }

    return changes
  }

  getIconForAction(action) {
    const icons = {
      'CREATE': 'plus-circle',
      'UPDATE': 'edit',
      'UPDATE_STEP': 'arrow-right',
      'GENERATE_DOCS': 'file-text',
      'UPLOAD_DOC': 'upload',
      'DELETE_DOC': 'trash',
      'ARCHIVE': 'archive',
      'DOWNLOAD_ZIP': 'download'
    }
    return icons[action] || 'circle'
  }

  getColorForAction(action) {
    const colors = {
      'CREATE': 'blue',
      'UPDATE': 'yellow',
      'UPDATE_STEP': 'blue',
      'GENERATE_DOCS': 'green',
      'UPLOAD_DOC': 'purple',
      'DELETE_DOC': 'red',
      'ARCHIVE': 'green',
      'DOWNLOAD_ZIP': 'blue'
    }
    return colors[action] || 'gray'
  }

  generateReadme(pkg) {
    return `
PAKET SPJ - ${pkg.packageCode}
${pkg.title}

Tahun Anggaran: ${pkg.year}
Jenis: ${this.getProcessLabel(pkg.processType)}
Status: ${pkg.status}

Dibuat: ${new Date(pkg.createdAt).toLocaleString('id-ID')}
Diarsipkan: ${pkg.archivedAt ? new Date(pkg.archivedAt).toLocaleString('id-ID') : '-'}

Kelengkapan Dokumen: ${pkg.checklist?.completionRate || 0}%
- Wajib: ${pkg.checklist?.mandatoryComplete || 0}/${pkg.checklist?.mandatoryTotal || 0}
- Dianjurkan: ${pkg.checklist?.recommendedComplete || 0}/${pkg.checklist?.recommendedTotal || 0}
- Opsional: ${pkg.checklist?.optionalComplete || 0}/${pkg.checklist?.optionalTotal || 0}

Total Dokumen: ${(pkg.generatedDocuments?.length || 0) + (pkg.uploadedDocuments?.length || 0)} file
- Dokumen Ter-generate: ${pkg.generatedDocuments?.length || 0}
- Dokumen Diunggah: ${pkg.uploadedDocuments?.length || 0}

Path Arsip: ${pkg.archivePath || '-'}

---
Generated by Asisten Digital PPK
${new Date().toLocaleString('id-ID')}
`.trim()
  }

  generateChecklistSummary(pkg) {
    let summary = `CHECKLIST DOKUMEN SPJ\n`
    summary += `Paket: ${pkg.packageCode} - ${pkg.title}\n`
    summary += `\n`
    summary += `Progress: ${pkg.checklist?.completionRate || 0}%\n`
    summary += `\n`

    if (pkg.checklist?.items) {
      // Group by category
      const grouped = {
        mandatory: [],
        recommended: [],
        optional: []
      }

      pkg.checklist.items.forEach(item => {
        grouped[item.category]?.push(item)
      })

      // Mandatory
      summary += `DOKUMEN WAJIB (${grouped.mandatory.length}):\n`
      grouped.mandatory.forEach((item, idx) => {
        const status = item.status === 'completed' ? '✓' : '○'
        summary += `${idx + 1}. [${status}] ${item.label}\n`
      })
      summary += `\n`

      // Recommended
      summary += `DOKUMEN DIANJURKAN (${grouped.recommended.length}):\n`
      grouped.recommended.forEach((item, idx) => {
        const status = item.status === 'completed' ? '✓' : '○'
        summary += `${idx + 1}. [${status}] ${item.label}\n`
      })
      summary += `\n`

      // Optional
      summary += `DOKUMEN OPSIONAL (${grouped.optional.length}):\n`
      grouped.optional.forEach((item, idx) => {
        const status = item.status === 'completed' ? '✓' : '○'
        summary += `${idx + 1}. [${status}] ${item.label}\n`
      })
    }

    return summary
  }

  generateAuditTrailReport(pkg) {
    let report = `AUDIT TRAIL\n`
    report += `Paket: ${pkg.packageCode}\n`
    report += `\n`

    pkg.auditTrail?.forEach((entry, idx) => {
      report += `${idx + 1}. [${new Date(entry.timestamp).toLocaleString('id-ID')}] ${entry.description}\n`
      report += `   Action: ${entry.action}\n`
      report += `   User: ${entry.user}\n`

      if (entry.changes && entry.changes.length > 0) {
        report += `   Changes:\n`
        entry.changes.forEach(change => {
          report += `   - ${change.field}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}\n`
        })
      }

      report += `\n`
    })

    return report
  }
}

// Export singleton instance
export default new SPJPackageService()
