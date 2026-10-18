require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('./pool');
const jobsRepo = require('../repositories/jobsRepo');
const usersRepo = require('../repositories/usersRepo');
const { buildSeedJobs } = require('./seedJobs');

const DEFAULT_ADMIN_EMAIL = 'admin@ilmgo.uz';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

async function applySchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('Schema is up to date.');
}

async function seedJobsIfEmpty() {
  const count = await jobsRepo.count();
  if (count > 0) {
    console.log(`Jobs table already has ${count} row(s), skipping job seed.`);
    return;
  }
  const jobs = buildSeedJobs();
  for (const job of jobs) await jobsRepo.create(job);
  console.log(`Seeded ${jobs.length} sample jobs.`);
}

/** Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD if it does not exist yet. */
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  if (await usersRepo.findByEmail(email)) {
    console.log(`Account ${email} already exists, leaving it unchanged.`);
    return;
  }
  if (usingDefaultPassword && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: ADMIN_PASSWORD is not set; refusing to create an admin with the default password in production.');
    return;
  }
  await usersRepo.create({
    id: uuid(),
    name: 'Ilmgo Administrator',
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin',
    title: 'Administrator',
  });
  console.log(`Created admin account ${email}.`);
  if (usingDefaultPassword || email === DEFAULT_ADMIN_EMAIL) {
    console.warn('WARNING: the admin uses default credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before deploying.');
  }
}

async function migrate() {
  console.log('Connecting to database...');
  await applySchema();
  await seedJobsIfEmpty();
  await ensureAdmin();
  console.log('Migration complete.');
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
