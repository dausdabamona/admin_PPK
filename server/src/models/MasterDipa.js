import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const MasterDipa = sequelize.define('MasterDipa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tahun: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2000,
      max: 2100
    }
  },
  revisi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0 = DIPA Awal, 1 = Revisi 1, dst'
  },
  status: {
    type: DataTypes.ENUM('active', 'superseded', 'archived'),
    defaultValue: 'active'
  },
  kode: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  uraian: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('program', 'kegiatan', 'output', 'komponen', 'akun'),
    allowNull: false
  },
  pagu: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  realisasi: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  parentKode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Kode parent untuk hierarchy'
  }
}, {
  tableName: 'master_dipa',
  timestamps: true,
  indexes: [
    {
      fields: ['tahun', 'status']
    },
    {
      fields: ['tahun', 'revisi']
    },
    {
      fields: ['tahun', 'revisi', 'kode'],
      unique: true
    },
    {
      fields: ['kode']
    },
    {
      fields: ['level']
    }
  ]
})

/**
 * Instance methods
 */
MasterDipa.prototype.getSisa = function () {
  return parseFloat(this.pagu) - parseFloat(this.realisasi)
}

MasterDipa.prototype.getPercentRealisasi = function () {
  if (this.pagu === 0) return 0
  return (parseFloat(this.realisasi) / parseFloat(this.pagu)) * 100
}

export default MasterDipa
