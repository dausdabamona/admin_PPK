import User from './User.js'
import MasterDipa from './MasterDipa.js'
import DipaRevision from './DipaRevision.js'
import SPJPackage from './SPJPackage.js'

/**
 * Define model relationships
 */

// DipaRevision -> User (created by)
DipaRevision.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
})

// SPJPackage -> User (created by)
SPJPackage.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
})

// SPJPackage -> DipaRevision (locked to specific revision)
SPJPackage.belongsTo(DipaRevision, {
  foreignKey: 'dipaRevision',
  targetKey: 'revisi',
  as: 'dipaRevisionData'
})

export {
  User,
  MasterDipa,
  DipaRevision,
  SPJPackage
}

export default {
  User,
  MasterDipa,
  DipaRevision,
  SPJPackage
}
