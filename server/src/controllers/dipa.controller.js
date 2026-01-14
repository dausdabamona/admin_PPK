import { Op } from 'sequelize'
import { MasterDipa, DipaRevision } from '../models/index.js'
import sequelize from '../config/database.js'

/**
 * Get all DIPA items with filters
 */
export const getDipaItems = async (req, res, next) => {
  try {
    const { year, revisi, level, kode, status } = req.query
    const { page, limit, offset } = req.pagination

    const where = {}

    if (year) where.tahun = parseInt(year)
    if (revisi !== undefined) where.revisi = parseInt(revisi)
    if (level) where.level = level
    if (kode) where.kode = { [Op.like]: `%${kode}%` }
    if (status) where.status = status

    const { count, rows } = await MasterDipa.findAndCountAll({
      where,
      limit,
      offset,
      order: [['kode', 'ASC']]
    })

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get active DIPA for a specific year
 */
export const getActiveDipa = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year)
    const { level } = req.query

    const where = {
      tahun: year,
      status: 'active'
    }

    if (level) where.level = level

    const items = await MasterDipa.findAll({
      where,
      order: [['kode', 'ASC']]
    })

    res.json({
      success: true,
      data: items
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get DIPA at specific revision
 */
export const getDipaAtRevision = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year)
    const revisi = parseInt(req.params.revisi)
    const { level } = req.query

    const where = {
      tahun: year,
      revisi
    }

    if (level) where.level = level

    const items = await MasterDipa.findAll({
      where,
      order: [['kode', 'ASC']]
    })

    res.json({
      success: true,
      data: items
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create new DIPA revision
 */
export const createRevision = async (req, res, next) => {
  const transaction = await sequelize.transaction()

  try {
    const { tahun, nomorRevisi, tanggalRevisi, keterangan } = req.body

    // Get current active revision
    const currentRevision = await DipaRevision.findOne({
      where: { tahun, status: 'active' },
      order: [['revisi', 'DESC']]
    })

    const newRevisiNumber = currentRevision ? currentRevision.revisi + 1 : 0

    // Create new revision record
    const newRevision = await DipaRevision.create({
      tahun,
      revisi: newRevisiNumber,
      nomorRevisi,
      tanggalRevisi,
      keterangan,
      status: 'active',
      createdBy: req.user.id
    }, { transaction })

    // Supersede old revision
    if (currentRevision) {
      await currentRevision.update({ status: 'superseded' }, { transaction })

      // Update old DIPA items status
      await MasterDipa.update(
        { status: 'superseded' },
        {
          where: {
            tahun,
            revisi: currentRevision.revisi,
            status: 'active'
          },
          transaction
        }
      )
    }

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'DIPA revision created',
      data: newRevision
    })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

/**
 * Import DIPA items (bulk create)
 */
export const importDipaItems = async (req, res, next) => {
  const transaction = await sequelize.transaction()

  try {
    const { tahun, revisi, items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      })
    }

    // Verify revision exists
    const revision = await DipaRevision.findOne({
      where: { tahun, revisi }
    })

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'DIPA revision not found'
      })
    }

    // Prepare items for bulk insert
    const dipaItems = items.map(item => ({
      tahun,
      revisi,
      kode: item.kode,
      uraian: item.uraian,
      level: item.level,
      pagu: item.pagu || 0,
      realisasi: item.realisasi || 0,
      parentKode: item.parentKode || null,
      status: 'active'
    }))

    // Bulk insert
    const created = await MasterDipa.bulkCreate(dipaItems, {
      transaction,
      validate: true
    })

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: `${created.length} DIPA items imported`,
      data: {
        count: created.length
      }
    })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

/**
 * Update DIPA realisasi
 */
export const updateRealisasi = async (req, res, next) => {
  try {
    const { id } = req.params
    const { realisasi } = req.body

    const item = await MasterDipa.findByPk(id)

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'DIPA item not found'
      })
    }

    await item.update({ realisasi })

    res.json({
      success: true,
      message: 'Realisasi updated',
      data: item
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Compare two DIPA revisions
 */
export const compareRevisions = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year)
    const revisiA = parseInt(req.query.revisiA)
    const revisiB = parseInt(req.query.revisiB)

    const [itemsA, itemsB] = await Promise.all([
      MasterDipa.findAll({
        where: { tahun: year, revisi: revisiA },
        order: [['kode', 'ASC']]
      }),
      MasterDipa.findAll({
        where: { tahun: year, revisi: revisiB },
        order: [['kode', 'ASC']]
      })
    ])

    // Create comparison map
    const mapA = new Map(itemsA.map(item => [item.kode, item]))
    const mapB = new Map(itemsB.map(item => [item.kode, item]))

    const comparison = []

    // Find changes
    for (const [kode, itemB] of mapB) {
      const itemA = mapA.get(kode)

      if (!itemA) {
        // New item
        comparison.push({
          kode,
          uraian: itemB.uraian,
          level: itemB.level,
          type: 'added',
          paguA: 0,
          paguB: parseFloat(itemB.pagu),
          selisih: parseFloat(itemB.pagu)
        })
      } else {
        const paguA = parseFloat(itemA.pagu)
        const paguB = parseFloat(itemB.pagu)
        const selisih = paguB - paguA

        if (selisih !== 0) {
          comparison.push({
            kode,
            uraian: itemB.uraian,
            level: itemB.level,
            type: 'modified',
            paguA,
            paguB,
            selisih
          })
        }
      }
    }

    // Find deleted items
    for (const [kode, itemA] of mapA) {
      if (!mapB.has(kode)) {
        comparison.push({
          kode,
          uraian: itemA.uraian,
          level: itemA.level,
          type: 'removed',
          paguA: parseFloat(itemA.pagu),
          paguB: 0,
          selisih: -parseFloat(itemA.pagu)
        })
      }
    }

    res.json({
      success: true,
      data: {
        revisiA,
        revisiB,
        comparison,
        summary: {
          total: comparison.length,
          added: comparison.filter(c => c.type === 'added').length,
          modified: comparison.filter(c => c.type === 'modified').length,
          removed: comparison.filter(c => c.type === 'removed').length
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all revisions for a year
 */
export const getRevisions = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year)

    const revisions = await DipaRevision.findAll({
      where: { tahun: year },
      order: [['revisi', 'DESC']]
    })

    res.json({
      success: true,
      data: revisions
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get DIPA statistics
 */
export const getDipaStats = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year)
    const revisi = req.query.revisi ? parseInt(req.query.revisi) : null

    const where = { tahun: year, status: 'active' }
    if (revisi !== null) where.revisi = revisi

    const stats = await MasterDipa.findAll({
      where,
      attributes: [
        'level',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('pagu')), 'totalPagu'],
        [sequelize.fn('SUM', sequelize.col('realisasi')), 'totalRealisasi']
      ],
      group: ['level']
    })

    const totals = await MasterDipa.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('pagu')), 'totalPagu'],
        [sequelize.fn('SUM', sequelize.col('realisasi')), 'totalRealisasi']
      ]
    })

    res.json({
      success: true,
      data: {
        byLevel: stats,
        totals: {
          pagu: parseFloat(totals.dataValues.totalPagu) || 0,
          realisasi: parseFloat(totals.dataValues.totalRealisasi) || 0,
          sisa: (parseFloat(totals.dataValues.totalPagu) || 0) - (parseFloat(totals.dataValues.totalRealisasi) || 0)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}
