import db from '../db/database'

// Export all data to JSON
export async function exportAllData() {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    appName: 'SIPBJ & SPJ Offline - PKP Sorong',
    tables: {}
  }

  // Export all tables
  data.tables.pegawai = await db.pegawai.toArray()
  data.tables.kota = await db.kota.toArray()
  data.tables.pejabat = await db.pejabat.toArray()
  data.tables.suratTugas = await db.suratTugas.toArray()
  data.tables.sppd = await db.sppd.toArray()
  data.tables.pembayaranLS = await db.pembayaranLS.toArray()
  data.tables.rampung = await db.rampung.toArray()
  data.tables.pengeluaranRiil = await db.pengeluaranRiil.toArray()
  data.tables.checklistSPJ = await db.checklistSPJ.toArray()
  data.tables.settings = await db.settings.toArray()
  data.tables.nomorUrut = await db.nomorUrut.toArray()

  return data
}

// Export specific table to JSON
export async function exportTable(tableName) {
  if (!db[tableName]) {
    throw new Error(`Table ${tableName} not found`)
  }

  const data = {
    exportDate: new Date().toISOString(),
    tableName,
    records: await db[tableName].toArray()
  }

  return data
}

// Download data as JSON file
export function downloadJSON(data, filename = 'backup') {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Import data from JSON
export async function importAllData(jsonData, options = { replace: false }) {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

  if (!data.tables) {
    throw new Error('Invalid backup file format')
  }

  const results = {
    success: true,
    imported: {},
    errors: []
  }

  // Process each table
  for (const [tableName, records] of Object.entries(data.tables)) {
    if (!db[tableName]) {
      results.errors.push(`Table ${tableName} not found, skipped`)
      continue
    }

    try {
      if (options.replace) {
        // Clear existing data
        await db[tableName].clear()
      }

      // Remove id field for import (let IndexedDB assign new IDs)
      const cleanRecords = records.map(record => {
        const { id, ...rest } = record
        return rest
      })

      // Bulk add
      const count = await db[tableName].bulkAdd(cleanRecords)
      results.imported[tableName] = cleanRecords.length
    } catch (error) {
      results.errors.push(`Error importing ${tableName}: ${error.message}`)
    }
  }

  results.success = results.errors.length === 0

  return results
}

// Import specific table from JSON
export async function importTable(tableName, records, options = { replace: false }) {
  if (!db[tableName]) {
    throw new Error(`Table ${tableName} not found`)
  }

  if (options.replace) {
    await db[tableName].clear()
  }

  const cleanRecords = records.map(record => {
    const { id, ...rest } = record
    return rest
  })

  return await db[tableName].bulkAdd(cleanRecords)
}

// Read JSON file
export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

// Clear all data (with confirmation)
export async function clearAllData() {
  await db.pegawai.clear()
  await db.kota.clear()
  await db.pejabat.clear()
  await db.suratTugas.clear()
  await db.sppd.clear()
  await db.pembayaranLS.clear()
  await db.rampung.clear()
  await db.pengeluaranRiil.clear()
  await db.checklistSPJ.clear()
  await db.nomorUrut.clear()
  // Keep settings
}
