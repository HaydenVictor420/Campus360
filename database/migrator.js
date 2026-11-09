const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../src/config/database');
const UserModel = require('../src/models/userModel');
const logger = require('../src/utils/logger');
const config = require('../src/config');

async function runMigrations() {
  logger.info('Checking and running database schema migrations...');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath) && db.isMySQL) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await db.query(statement);
        } catch (err) {
          // Ignore table already exists or database creation notice
          if (!err.message.includes('already exists')) {
            logger.warn(`Migration statement note: ${err.message}`);
          }
        }
      }
      logger.info('Database schema migration applied successfully to MySQL.');
    } else {
      logger.info('Database schema active and initialized.');
    }

    // Seed default administrative and demo accounts if not existing
    const existingAdmin = await UserModel.findByEmail('admin@campus360.internal');
    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('Admin@12345', config.security.bcryptSaltRounds);
      await UserModel.create({
        email: 'admin@campus360.internal',
        username: 'superadmin',
        password_hash: adminPasswordHash,
        first_name: 'Campus',
        last_name: 'Administrator',
        role: 'admin',
        is_active: 1,
        is_verified: 1
      });
      logger.info('Default Administrator account initialized: admin@campus360.internal (Password: Admin@12345)');
    }

    const existingStudent = await UserModel.findByEmail('student@campus360.internal');
    if (!existingStudent) {
      const studentPasswordHash = await bcrypt.hash('Student@12345', config.security.bcryptSaltRounds);
      await UserModel.create({
        email: 'student@campus360.internal',
        username: 'sanjay',
        password_hash: studentPasswordHash,
        first_name: 'Sanjay',
        last_name: 'Kumar',
        role: 'student',
        is_active: 1,
        is_verified: 1
      });
      logger.info('Default Student account initialized: student@campus360.internal (Password: Student@12345)');
    }

    const existingFaculty = await UserModel.findByEmail('faculty@campus360.internal');
    if (!existingFaculty) {
      const facultyPasswordHash = await bcrypt.hash('Faculty@12345', config.security.bcryptSaltRounds);
      await UserModel.create({
        email: 'faculty@campus360.internal',
        username: 'prof_victor',
        password_hash: facultyPasswordHash,
        first_name: 'Victor',
        last_name: 'Professor',
        role: 'faculty',
        is_active: 1,
        is_verified: 1
      });
      logger.info('Default Faculty account initialized: faculty@campus360.internal (Password: Faculty@12345)');
    }

    return true;
  } catch (err) {
    logger.error(`Migration error: ${err.message}`);
    return false;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
