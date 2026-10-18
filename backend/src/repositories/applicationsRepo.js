const pool = require('../db/pool');

const SELECT = `
  SELECT a.*, j.title AS job_title, j.company AS job_company, j.accent AS job_accent,
         j.location AS job_location, j.type AS job_type,
         u.name AS user_name, u.email AS user_email
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = a.user_id`;

function rowToApplication(row, { withUser = false } = {}) {
  const application = {
    id: row.id,
    userId: row.user_id,
    jobId: row.job_id,
    firstName: row.first_name,
    lastName: row.last_name,
    address: row.address,
    city: row.city,
    university: row.university,
    phone: row.phone,
    email: row.email,
    skillLevel: row.skill_level,
    coverNote: row.cover_note,
    resumeOriginalName: row.resume_original_name,
    resumeUrl: row.resume_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    job: {
      id: row.job_id,
      title: row.job_title,
      company: row.job_company,
      accent: row.job_accent,
      location: row.job_location,
      type: row.job_type,
    },
    events: [],
  };
  if (withUser) application.user = { id: row.user_id, name: row.user_name, email: row.user_email };
  return application;
}

/** Attaches `events` (oldest first) to a list of applications with one batched query. */
async function attachEvents(applications, db = pool) {
  if (applications.length === 0) return applications;
  const { rows } = await db.query(
    `SELECT application_id, status, note, created_at FROM application_events
      WHERE application_id = ANY($1) ORDER BY created_at, id`,
    [applications.map((a) => a.id)]
  );
  const byApplication = new Map(applications.map((a) => [a.id, a]));
  for (const row of rows) {
    byApplication.get(row.application_id).events.push({
      status: row.status, note: row.note, createdAt: row.created_at,
    });
  }
  return applications;
}

/**
 * Applications, newest first.
 * @param {{userId?:string,status?:string,jobId?:string,q?:string,limit?:number,withUser?:boolean}} opts
 */
async function list({ userId, status, jobId, q, limit, withUser = false } = {}) {
  const where = [];
  const values = [];
  const param = (v) => {
    values.push(v);
    return `$${values.length}`;
  };
  if (userId) where.push(`a.user_id = ${param(userId)}`);
  if (status) where.push(`a.status = ${param(status)}`);
  if (jobId) where.push(`a.job_id = ${param(jobId)}`);
  if (q) {
    const p = param(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(a.first_name || ' ' || a.last_name ILIKE ${p} OR a.email ILIKE ${p}
                 OR u.name ILIKE ${p} OR j.title ILIKE ${p} OR j.company ILIKE ${p})`);
  }
  let sql = `${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.created_at DESC, a.id`;
  if (limit) sql += ` LIMIT ${param(limit)}`;
  const { rows } = await pool.query(sql, values);
  return attachEvents(rows.map((row) => rowToApplication(row, { withUser })));
}

/** One application (with events), optionally restricted to an owner. Null if not found. */
async function findById(id, { userId, withUser = false } = {}) {
  const values = [id];
  let sql = `${SELECT} WHERE a.id = $1`;
  if (userId) {
    values.push(userId);
    sql += ' AND a.user_id = $2';
  }
  const { rows } = await pool.query(sql, values);
  if (!rows[0]) return null;
  const [application] = await attachEvents([rowToApplication(rows[0], { withUser })]);
  return application;
}

/** The user's application for a job (any status), or null. Lightweight (no events). */
async function findForUserAndJob(userId, jobId, db = pool) {
  const { rows } = await db.query(
    `${SELECT} WHERE a.user_id = $1 AND a.job_id = $2`,
    [userId, jobId]
  );
  return rows[0] ? rowToApplication(rows[0]) : null;
}

/** Inserts an application row. A duplicate (user, job) raises pg error 23505. */
async function create(app, db = pool) {
  await db.query(
    `INSERT INTO applications
       (id, user_id, job_id, first_name, last_name, address, city, university, phone, email,
        skill_level, cover_note, resume_file_name, resume_original_name, resume_url, status,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
             COALESCE($17, now()), COALESCE($17, now()))`,
    [
      app.id, app.userId, app.jobId, app.firstName, app.lastName, app.address || '', app.city || '',
      app.university || '', app.phone, app.email, app.skillLevel, app.coverNote || '',
      app.resumeFileName, app.resumeOriginalName, app.resumeUrl, app.status || 'submitted',
      app.createdAt || null,
    ]
  );
}

async function setStatus(id, status, db = pool) {
  await db.query('UPDATE applications SET status = $2, updated_at = now() WHERE id = $1', [id, status]);
}

async function addEvent(applicationId, status, note = '', db = pool, createdAt = null) {
  await db.query(
    `INSERT INTO application_events (application_id, status, note, created_at)
     VALUES ($1, $2, $3, COALESCE($4, now()))`,
    [applicationId, status, note, createdAt]
  );
}

async function countsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE status <> 'withdrawn')::int AS applied,
            COUNT(*) FILTER (WHERE status = 'offer')::int AS offers
       FROM applications WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
}

/** Job ids the user has applied to (any status). */
async function appliedJobIds(userId) {
  const { rows } = await pool.query('SELECT job_id FROM applications WHERE user_id = $1', [userId]);
  return new Set(rows.map((r) => r.job_id));
}

/** Map jobId -> status for the given jobs and user (one query). */
async function statusByJob(userId, jobIds) {
  if (jobIds.length === 0) return new Map();
  const { rows } = await pool.query(
    'SELECT job_id, status FROM applications WHERE user_id = $1 AND job_id = ANY($2)',
    [userId, jobIds]
  );
  return new Map(rows.map((r) => [r.job_id, r.status]));
}

module.exports = {
  list, findById, findForUserAndJob, create, setStatus, addEvent,
  countsForUser, appliedJobIds, statusByJob,
};
