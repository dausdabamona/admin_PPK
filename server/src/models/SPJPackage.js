import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const SPJPackage = sequelize.define('SPJPackage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  packageCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  processType: {
    type: DataTypes.ENUM('sppd', 'swakelola', 'pjlp', 'honor'),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'in_progress', 'completed', 'archived'),
    defaultValue: 'draft'
  },
  dipaRevision: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Locked to specific DIPA revision'
  },
  dipaMakCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Kode MAK from DIPA'
  },
  totalPagu: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  totalRealisasi: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional package-specific data'
  },
  checklistComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  checklistData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Checklist status and missing documents'
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
  tableName: 'spj_packages',
  timestamps: true,
  indexes: [
    {
      fields: ['processType', 'year']
    },
    {
      fields: ['year', 'status']
    },
    {
      fields: ['packageCode'],
      unique: true
    }
  ]
})

export default SPJPackage
