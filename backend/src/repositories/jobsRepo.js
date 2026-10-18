const pool = require('../db/pool');

function rowToJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    type: row.type,
    workMode: row.work_mode,
    level: row.level,
    stipend: row.stipend,
    deadline: row.deadline,
    status: row.status,
    featured: row.featured,
    accent: row.accent,
    skills: row.skills || [],
    description: row.description,
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    companyAbout: row.company_about,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

/** Escapes LIKE wildcards in user input. */
const likeEscape = (text) => text.replace(/[\\%_]/g, '\\$&');

/**
 * Lists jobs. All filters are optional; `sort` is 'recent' (default) or 'deadline'
 * ('match' is applied by the caller after personalisation).
 * @param {{search?:string,type?:string,workMode?:string,level?:string,skill?:string,
 *          featured?:boolean,status?:'open'|'closed'|'all',sort?:string}} filters
 */
async function list(filters = {}) {
  const where = [];
  const values = [];
  const param = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.status && filters.status !== 'all') where.push(`status = ${param(filters.status)}`);
  if (filters.type) where.push(`type = ${param(filters.type)}`);
  if (filters.workMode) where.push(`work_mode = ${param(filters.workMode)}`);
  if (filters.level) where.push(`level = ${param(filters.level)}`);
  if (filters.featured) where.push('featured = true');
  if (filters.skill) {
    where.push(`EXISTS (SELECT 1 FROM unnest(skills) AS s WHERE lower(s) = lower(${param(filters.skill)}))`);
  }
  if (filters.search) {
    const p = param(`%${likeEscape(filters.search)}%`);
    where.push(`(title ILIKE ${p} OR company ILIKE ${p} OR location ILIKE ${p}
                 OR array_to_string(skills, ' ') ILIKE ${p})`);
  }

  const order = filters.sort === 'deadline'
    ? 'deadline ASC NULLS LAST, created_at DESC'
    : 'created_at DESC, id';
  const { rows } = await pool.query(
    `SELECT * FROM jobs ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`,
    values
  );
  return rows.map(rowToJob);
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return rowToJob(rows[0]);
}

/** @param {object} job full job (see parseJobInput) plus id */
async function create(job, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO jobs
       (id, title, company, location, type, work_mode, level, stipend, deadline, status, featured,
        accent, skills, description, requirements, benefits, company_about, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      job.id, job.title, job.company, job.location, job.type, job.workMode, job.level,
      job.stipend || '', job.deadline || null, job.status, job.featured, job.accent,
      job.skills || [], job.description, job.requirements || [], job.benefits || [],
      job.companyAbout || '', job.imageUrl || null,
    ]
  );
  return rowToJob(rows[0]);
}

const COLUMN_BY_FIELD = {
  title: 'title',
  company: 'company',
  location: 'location',
  type: 'type',
  workMode: 'work_mode',
  level: 'level',
  stipend: 'stipend',
  deadline: 'deadline',
  status: 'status',
  featured: 'featured',
  accent: 'accent',
  skills: 'skills',
  description: 'description',
  requirements: 'requirements',
  benefits: 'benefits',
  companyAbout: 'company_about',
  imageUrl: 'image_url',
};

/** Partial update; returns null if the job does not exist. */
async function update(id, fields) {
  const sets = [];
  const values = [];
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (fields[field] !== undefined) {
      values.push(fields[field]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE jobs SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rowToJob(rows[0]);
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Most used skills across open jobs (case-insensitive), for the filter chips. */
async function topSkills(limit = 30) {
  const { rows } = await pool.query(
    `SELECT min(s) AS name, COUNT(*)::int AS count
       FROM jobs, unnest(skills) AS s
      WHERE status = 'open' AND btrim(s) <> ''
      GROUP BY lower(s)
      ORDER BY count DESC, lower(min(s))
      LIMIT $1`,
    [limit]
  );
  return rows;
}

async function count(db = pool) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM jobs');
  return rows[0].count;
}

module.exports = { rowToJob, list, findById, create, update, remove, topSkills, count };
