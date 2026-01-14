import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'admin_ppk',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
})

export default sequelize

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('✓ Database connection established successfully')
    return true
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message)
    return false
  }
}

/**
 * Sync all models with database
 * @param {Object} options - Sequelize sync options
 */
export async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options)
    console.log('✓ Database synchronized successfully')
    return true
  } catch (error) {
    console.error('✗ Database sync failed:', error.message)
    return false
  }
}
