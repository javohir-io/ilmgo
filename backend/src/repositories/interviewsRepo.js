const pool = require('../db/pool');

const SELECT = `
  SELECT i.*, j.title AS job_title, j.company AS job_company, j.accent AS job_accent,
         u.name AS user_name, u.email AS user_email
    FROM interviews i
    JOIN jobs j ON j.id = i.job_id
    JOIN users u ON u.id = i.user_id`;

function rowToInterview(row, { withUser = false } = {}) {
  if (!row) return null;
  const interview = {
    id: row.id,
    userId: row.user_id,
    jobId: row.job_id,
    applicationId: row.application_id,
    date: row.date,
    time: row.time,
    durationMin: row.duration_min,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    job: { id: row.job_id, title: row.job_title, company: row.job_company, accent: row.job_accent },
  };
  if (withUser) interview.user = { id: row.user_id, name: row.user_name, email: row.user_email };
  return interview;
}

/** Times already taken (scheduled) for a job on a day. */
async function bookedTimes(jobId, date) {
  const { rows } = await pool.query(
    "SELECT time FROM interviews WHERE job_id = $1 AND date = $2 AND status = 'scheduled'",
    [jobId, date]
  );
  return rows.map((r) => r.time);
}

/** Inserts a scheduled interview. A taken slot raises pg error 23505. */
async function create(i, db = pool) {
  await db.query(
    `INSERT INTO interviews (id, user_id, job_id, application_id, date, time, duration_min, reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [i.id, i.userId, i.jobId, i.applicationId || null, i.date, i.time, i.durationMin || 30, i.reason || '', i.status || 'scheduled']
  );
}

async function findById(id, { userId, withUser = false } = {}, db = pool) {
  const values = [id];
  let sql = `${SELECT} WHERE i.id = $1`;
  if (userId) {
    values.push(userId);
    sql += ' AND i.user_id = $2';
  }
  const { rows } = await db.query(sql, values);
  return rowToInterview(rows[0], { withUser });
}

/** The user's scheduled interview for a job, or null. */
async function findScheduledForJob(userId, jobId, db = pool) {
  const { rows } = await db.query(
    "SELECT id FROM interviews WHERE user_id = $1 AND job_id = $2 AND status = 'scheduled' LIMIT 1",
    [userId, jobId]
  );
  return rows[0] || null;
}

/** Soonest first. */
async function listForUser(userId) {
  const { rows } = await pool.query(`${SELECT} WHERE i.user_id = $1 ORDER BY i.date, i.time, i.id`, [userId]);
  return rows.map((r) => rowToInterview(r));
}

/** All interviews for the admin console, soonest first. */
async function listAll() {
  const { rows } = await pool.query(`${SELECT} ORDER BY i.date, i.time, i.id`);
  return rows.map((r) => rowToInterview(r, { withUser: true }));
}

/**
 * Scheduled interviews that have not started yet, soonest first.
 * @param {{date:string,time:string}} now local calendar day + HH:mm
 */
async function listUpcoming({ date, time }, { userId, limit = 5, withUser = false } = {}) {
  const values = [date, time];
  let sql = `${SELECT} WHERE i.status = 'scheduled' AND (i.date > $1::date OR (i.date = $1::date AND i.time >= $2))`;
  if (userId) {
    values.push(userId);
    sql += ` AND i.user_id = $${values.length}`;
  }
  values.push(limit);
  sql += ` ORDER BY i.date, i.time, i.id LIMIT $${values.length}`;
  const { rows } = await pool.query(sql, values);
  return rows.map((r) => rowToInterview(r, { withUser }));
}

async function countScheduledForUser(userId) {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM interviews WHERE user_id = $1 AND status = 'scheduled'",
    [userId]
  );
  return rows[0].count;
}

/** Moves a scheduled interview to `status`; returns false if it was not scheduled. */
async function transition(id, status, db = pool) {
  const { rowCount } = await db.query(
    "UPDATE interviews SET status = $2 WHERE id = $1 AND status = 'scheduled'",
    [id, status]
  );
  return rowCount > 0;
}

/** Cancels every scheduled interview tied to an application (used on withdraw). */
async function cancelForApplication(applicationId, db = pool) {
  await db.query(
    "UPDATE interviews SET status = 'cancelled' WHERE application_id = $1 AND status = 'scheduled'",
    [applicationId]
  );
}

module.exports = {
  bookedTimes, create, findById, findScheduledForJob, listForUser, listAll, listUpcoming,
  countScheduledForUser, transition, cancelForApplication,
};
