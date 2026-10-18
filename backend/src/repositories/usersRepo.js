const pool = require('../db/pool');
const { profileCompleteness } = require('../lib/completeness');

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    university: row.university,
    degreeProgram: row.degree_program,
    graduationYear: row.graduation_year,
    phone: row.phone,
    about: row.about,
    title: row.title,
    skills: row.skills || [],
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    profilePhotoUrl: row.profile_photo_url,
    createdAt: row.created_at,
  };
}

/** API shape of a user: no password hash, plus the computed profile completeness. */
function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return { ...rest, profileCompleteness: profileCompleteness(user) };
}

async function findByEmail(email, db = pool) {
  const { rows } = await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rowToUser(rows[0]);
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rowToUser(rows[0]);
}

/** @param {object} user fields incl. id and passwordHash; role defaults to 'student' */
async function create(user, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO users
       (id, name, email, password_hash, role, university, degree_program, phone, about, title,
        skills, graduation_year, github_url, linkedin_url, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,COALESCE($15, now()))
     RETURNING *`,
    [
      user.id, user.name, user.email, user.passwordHash, user.role || 'student',
      user.university || '', user.degreeProgram || '', user.phone || '', user.about || '',
      user.title || 'Student', user.skills || [], user.graduationYear || null,
      user.githubUrl || '', user.linkedinUrl || '', user.createdAt || null,
    ]
  );
  return rowToUser(rows[0]);
}

const COLUMN_BY_FIELD = {
  name: 'name',
  university: 'university',
  degreeProgram: 'degree_program',
  graduationYear: 'graduation_year',
  phone: 'phone',
  about: 'about',
  title: 'title',
  skills: 'skills',
  githubUrl: 'github_url',
  linkedinUrl: 'linkedin_url',
  profilePhotoUrl: 'profile_photo_url',
};

/** Partial update of whitelisted profile fields. */
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
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rowToUser(rows[0]);
}

/** All users with their application count (admin console). */
async function listWithApplicationCounts() {
  const { rows } = await pool.query(
    `SELECT u.*, (SELECT COUNT(*)::int FROM applications a WHERE a.user_id = u.id) AS application_count
       FROM users u
      ORDER BY u.created_at DESC`
  );
  return rows.map((row) => ({ ...publicUser(rowToUser(row)), applications: row.application_count }));
}

module.exports = { publicUser, findByEmail, findById, create, update, listWithApplicationCounts };
