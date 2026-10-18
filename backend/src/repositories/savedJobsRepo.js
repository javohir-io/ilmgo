const pool = require('../db/pool');
const { rowToJob } = require('./jobsRepo');

/** Toggles a bookmark atomically and returns the new state (true = now saved). */
async function toggle(userId, jobId) {
  const removed = await pool.query(
    'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
    [userId, jobId]
  );
  if (removed.rowCount > 0) return false;
  await pool.query(
    'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, jobId]
  );
  return true;
}

/** Saved jobs, most recently saved first. */
async function listJobs(userId) {
  const { rows } = await pool.query(
    `SELECT j.* FROM saved_jobs s JOIN jobs j ON j.id = s.job_id
      WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows.map(rowToJob);
}

/** Ids of the user's saved jobs, as a Set. */
async function savedIdSet(userId) {
  const { rows } = await pool.query('SELECT job_id FROM saved_jobs WHERE user_id = $1', [userId]);
  return new Set(rows.map((r) => r.job_id));
}

async function countForUser(userId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM saved_jobs WHERE user_id = $1', [userId]);
  return rows[0].count;
}

module.exports = { toggle, listJobs, savedIdSet, countForUser };
