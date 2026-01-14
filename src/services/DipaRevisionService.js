import { db } from '../db/database'
import * as XLSX from 'xlsx'

/**
 * DipaRevisionService - Service Layer untuk DIPA Revision Management
 *
 * Handles:
 * - DIPA versioning (Awal, Revisi 1, 2, 3, dst)
 * - Import Excel DIPA
 * - Revision comparison
 * - Active revision management
 * - Historical data tracking
 */

class DipaRevisionService {
  /**
   * Create new DIPA revision
   */
  async createRevision(tahun, nomorRevisi, keterangan, fileAttachment = null) {
    try {
      const now = new Date()

      // Step 1: Get current active revision
      const currentRevisi = await db.dipaRevisions
        .where('[tahun+status]').equals([tahun, 'active'])
        .first()

      const nextRevisiNumber = (currentRevisi?.revisi ?? -1) + 1

      // Step 2: Mark old data as superseded
      if (currentRevisi) {
        const oldItems = await db.masterDipa
          .where('[tahun+status]').equals([tahun, 'active'])
          .toArray()

        await Promise.all(
          oldItems.map(item =>
            db.masterDipa.update(item.id, {
              status: 'superseded',
              supersededAt: now,
              supersededBy: nextRevisiNumber
            })
          )
        )

        // Mark old revision as superseded
        await db.dipaRevisions.update(currentRevisi.id, {
          status: 'superseded',
          supersededAt: now
        })
      }

      // Step 3: Create new revision metadata
      const revisionId = await db.dipaRevisions.add({
        tahun,
        revisi: nextRevisiNumber,
        nomorRevisi,
        tanggalRevisi: now,
        status: 'active',
        keterangan,
        fileAttachment,
        totalPagu: 0, // Will be calculated after import
        perubahanPagu: 0,
        createdAt: now,
        createdBy: 'admin'
      })

      return {
        success: true,
        revisi: nextRevisiNumber,
        revisionId,
        message: nextRevisiNumber === 0
          ? 'DIPA Awal berhasil dibuat'
          : `Revisi ${nextRevisiNumber} berhasil dibuat`
      }
    } catch (error) {
      console.error('Failed to create revision:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Import DIPA data from Excel file
   */
  async importFromExcel(file, tahun, revisi) {
    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet)

      if (rows.length === 0) {
        throw new Error('File Excel kosong')
      }

      // Get previous revision data for comparison
      const previousData = revisi > 0
        ? await this.getDipaAtRevision(tahun, revisi - 1)
        : []

      // Parse and enrich data
      const parsedData = rows.map(row => {
        const kode = this.parseKode(row['Kode'] || row['kode'] || row['MAK'] || row['mak'])
        const uraian = row['Uraian'] || row['uraian'] || row['Nama'] || row['nama'] || ''
        const pagu = this.parseRupiah(row['Pagu'] || row['pagu'] || row['Anggaran'] || row['anggaran'] || 0)
        const level = this.detectLevel(kode)

        // Find previous data for this item
        const previous = previousData.find(p => p.kode === kode)

        return {
          tahun,
          revisi,
          status: 'active',
          kode,
          kodeFullPath: kode,
          uraian,
          level,
          parentId: this.getParentId(kode, level),
          pagu,
          paguSebelumnya: previous?.pagu || 0,
          selisih: pagu - (previous?.pagu || 0),
          realisasi: previous?.realisasi || 0,
          sisa: pagu - (previous?.realisasi || 0),
          createdAt: new Date(),
          createdBy: 'admin'
        }
      })

      // Bulk insert
      await db.masterDipa.bulkAdd(parsedData)

      // Update revision metadata
      const totalPagu = parsedData
        .filter(item => item.level === 'akun')
        .reduce((sum, item) => sum + item.pagu, 0)

      const perubahanPagu = parsedData
        .filter(item => item.level === 'akun')
        .reduce((sum, item) => sum + item.selisih, 0)

      const revisionRecord = await db.dipaRevisions
        .where('[tahun+revisi]').equals([tahun, revisi])
        .first()

      if (revisionRecord) {
        await db.dipaRevisions.update(revisionRecord.id, {
          totalPagu,
          perubahanPagu,
          jumlahItem: parsedData.length
        })
      }

      return {
        success: true,
        count: parsedData.length,
        totalPagu,
        perubahanPagu,
        message: `Berhasil import ${parsedData.length} item DIPA`
      }
    } catch (error) {
      console.error('Failed to import Excel:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get active DIPA data for a year
   */
  async getActiveDipa(tahun, options = {}) {
    try {
      let query = db.masterDipa
        .where('[tahun+status]').equals([tahun, 'active'])

      if (options.kode) {
        query = query.and(item => item.kode === options.kode)
      }

      if (options.level) {
        query = query.and(item => item.level === options.level)
      }

      const data = await query.toArray()

      return {
        success: true,
        data,
        count: data.length
      }
    } catch (error) {
      console.error('Failed to get active DIPA:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  /**
   * Get DIPA data at specific revision
   */
  async getDipaAtRevision(tahun, revisi) {
    try {
      const data = await db.masterDipa
        .where('[tahun+revisi]').equals([tahun, revisi])
        .toArray()

      return data
    } catch (error) {
      console.error('Failed to get DIPA at revision:', error)
      return []
    }
  }

  /**
   * Get active revision for a year
   */
  async getActiveRevision(tahun) {
    try {
      const revision = await db.dipaRevisions
        .where('[tahun+status]').equals([tahun, 'active'])
        .first()

      return revision || null
    } catch (error) {
      console.error('Failed to get active revision:', error)
      return null
    }
  }

  /**
   * Get revision history for a year
   */
  async getRevisionHistory(tahun) {
    try {
      const history = await db.dipaRevisions
        .where('tahun').equals(tahun)
        .reverse()
        .sortBy('revisi')

      return {
        success: true,
        data: history
      }
    } catch (error) {
      console.error('Failed to get revision history:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  /**
   * Compare two revisions
   */
  async compareRevisions(tahun, revisiA, revisiB) {
    try {
      const dataA = await this.getDipaAtRevision(tahun, revisiA)
      const dataB = await this.getDipaAtRevision(tahun, revisiB)

      const changes = []
      const allKodes = new Set([
        ...dataA.map(d => d.kode),
        ...dataB.map(d => d.kode)
      ])

      for (const kode of allKodes) {
        const itemA = dataA.find(a => a.kode === kode)
        const itemB = dataB.find(b => b.kode === kode)

        if (!itemA && itemB) {
          // Added
          changes.push({
            kode: itemB.kode,
            uraian: itemB.uraian,
            level: itemB.level,
            type: 'ADDED',
            paguBaru: itemB.pagu,
            selisih: itemB.pagu
          })
        } else if (itemA && !itemB) {
          // Removed
          changes.push({
            kode: itemA.kode,
            uraian: itemA.uraian,
            level: itemA.level,
            type: 'REMOVED',
            paguLama: itemA.pagu,
            selisih: -itemA.pagu
          })
        } else if (itemA && itemB && itemA.pagu !== itemB.pagu) {
          // Changed
          changes.push({
            kode: itemB.kode,
            uraian: itemB.uraian,
            level: itemB.level,
            type: 'CHANGED',
            paguLama: itemA.pagu,
            paguBaru: itemB.pagu,
            selisih: itemB.pagu - itemA.pagu
          })
        }
      }

      return {
        success: true,
        changes,
        summary: {
          added: changes.filter(c => c.type === 'ADDED').length,
          removed: changes.filter(c => c.type === 'REMOVED').length,
          changed: changes.filter(c => c.type === 'CHANGED').length,
          totalChanges: changes.length,
          netChange: changes.reduce((sum, c) => sum + c.selisih, 0)
        }
      }
    } catch (error) {
      console.error('Failed to compare revisions:', error)
      return {
        success: false,
        error: error.message,
        changes: []
      }
    }
  }

  /**
   * Update realisasi for a DIPA item
   */
  async updateRealisasi(tahun, kode, realisasi) {
    try {
      const item = await db.masterDipa
        .where('[tahun+status]').equals([tahun, 'active'])
        .and(d => d.kode === kode)
        .first()

      if (!item) {
        throw new Error(`DIPA item ${kode} tidak ditemukan`)
      }

      const newRealisasi = item.realisasi + realisasi
      const sisa = item.pagu - newRealisasi

      await db.masterDipa.update(item.id, {
        realisasi: newRealisasi,
        sisa,
        updatedAt: new Date()
      })

      return {
        success: true,
        message: 'Realisasi berhasil diupdate',
        data: {
          kode,
          pagu: item.pagu,
          realisasi: newRealisasi,
          sisa
        }
      }
    } catch (error) {
      console.error('Failed to update realisasi:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Check if nilai kontrak exceeds available DIPA
   */
  async checkPagu(tahun, kode, nilaiKontrak) {
    try {
      const item = await db.masterDipa
        .where('[tahun+status]').equals([tahun, 'active'])
        .and(d => d.kode === kode)
        .first()

      if (!item) {
        return {
          valid: false,
          message: `MAK ${kode} tidak ditemukan di DIPA ${tahun}`
        }
      }

      if (nilaiKontrak > item.sisa) {
        return {
          valid: false,
          message: `Nilai kontrak (${nilaiKontrak}) melebihi sisa pagu (${item.sisa})`,
          data: {
            pagu: item.pagu,
            realisasi: item.realisasi,
            sisa: item.sisa,
            kekurangan: nilaiKontrak - item.sisa
          }
        }
      }

      return {
        valid: true,
        message: 'Pagu mencukupi',
        data: {
          pagu: item.pagu,
          realisasi: item.realisasi,
          sisa: item.sisa,
          sisaSetelah: item.sisa - nilaiKontrak
        }
      }
    } catch (error) {
      console.error('Failed to check pagu:', error)
      return {
        valid: false,
        error: error.message
      }
    }
  }

  /**
   * Get DIPA summary statistics
   */
  async getDipaSummary(tahun, revisi = null) {
    try {
      let data
      if (revisi !== null) {
        data = await this.getDipaAtRevision(tahun, revisi)
      } else {
        const result = await this.getActiveDipa(tahun)
        data = result.data
      }

      const summary = {
        total: data.length,
        byLevel: {},
        totalPagu: 0,
        totalRealisasi: 0,
        totalSisa: 0,
        persentaseRealisasi: 0
      }

      // Group by level
      data.forEach(item => {
        if (!summary.byLevel[item.level]) {
          summary.byLevel[item.level] = {
            count: 0,
            pagu: 0,
            realisasi: 0,
            sisa: 0
          }
        }

        summary.byLevel[item.level].count++
        summary.byLevel[item.level].pagu += item.pagu
        summary.byLevel[item.level].realisasi += item.realisasi
        summary.byLevel[item.level].sisa += item.sisa

        if (item.level === 'akun') {
          summary.totalPagu += item.pagu
          summary.totalRealisasi += item.realisasi
          summary.totalSisa += item.sisa
        }
      })

      summary.persentaseRealisasi = summary.totalPagu > 0
        ? (summary.totalRealisasi / summary.totalPagu) * 100
        : 0

      return {
        success: true,
        summary
      }
    } catch (error) {
      console.error('Failed to get DIPA summary:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== HELPER METHODS ====================

  parseKode(value) {
    if (!value) return ''
    return String(value).trim()
  }

  parseRupiah(value) {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
    }
    return 0
  }

  detectLevel(kode) {
    if (!kode) return 'unknown'

    // Format DIPA umumnya: XXXX.XXX.XXX.XXX.XXXXXX
    // - 4 digit = Program
    // - .XXX = Kegiatan
    // - .XXX = Output
    // - .XXX = Komponen
    // - .XXXXXX = Akun (6 digit MAK)

    const parts = kode.split('.')

    if (parts.length === 1) {
      if (parts[0].length === 4) return 'program'
      if (parts[0].length === 6) return 'akun'
    }

    if (parts.length === 2) return 'kegiatan'
    if (parts.length === 3) return 'output'
    if (parts.length === 4) return 'komponen'
    if (parts.length === 5) return 'akun'

    return 'detail'
  }

  getParentId(kode, level) {
    // For tree structure (optional)
    // Returns parent kode based on hierarchy
    const parts = kode.split('.')
    if (parts.length <= 1) return null

    return parts.slice(0, -1).join('.')
  }

  async deleteRevision(tahun, revisi) {
    try {
      // Prevent deleting active revision
      const revision = await db.dipaRevisions
        .where('[tahun+revisi]').equals([tahun, revisi])
        .first()

      if (!revision) {
        throw new Error('Revisi tidak ditemukan')
      }

      if (revision.status === 'active') {
        throw new Error('Tidak dapat menghapus revisi yang masih aktif')
      }

      // Delete DIPA data
      const items = await db.masterDipa
        .where('[tahun+revisi]').equals([tahun, revisi])
        .toArray()

      await Promise.all(
        items.map(item => db.masterDipa.delete(item.id))
      )

      // Delete revision metadata
      await db.dipaRevisions.delete(revision.id)

      return {
        success: true,
        message: `Revisi ${revisi} berhasil dihapus`
      }
    } catch (error) {
      console.error('Failed to delete revision:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Export singleton
export default new DipaRevisionService()
