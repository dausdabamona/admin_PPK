import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DipaRevision = sequelize.define('DipaRevision', {
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
    comment: '0 = DIPA Awal, 1 = Revisi 1, dst'
  },
  nomorRevisi: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nomor surat revisi resmi'
  },
  tanggalRevisi: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'superseded', 'archived'),
    defaultValue: 'active'
  },
  fileAttachment: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to uploaded DIPA document'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'dipa_revisions',
  timestamps: true,
  indexes: [
    {
      fields: ['tahun', 'status']
    },
    {
      fields: ['tahun', 'revisi'],
      unique: true
    }
  ]
})

export default DipaRevision
