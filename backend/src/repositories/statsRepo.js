const pool = require('../db/pool');
const { APPLICATION_STATUSES } = require('../lib/constants');

/** Aggregates for the admin dashboard (everything except upcoming interviews). */
async function dashboard() {
  const [totals, byStatus, perDay, topJobs] = await Promise.all([
    pool.query(
      `SELECT (SELECT COUNT(*) FROM users)::int AS users,
              (SELECT COUNT(*) FROM jobs)::int AS jobs,
              (SELECT COUNT(*) FROM jobs WHERE status = 'open')::int AS "openJobs",
              (SELECT COUNT(*) FROM applications)::int AS applications,
              (SELECT COUNT(*) FROM interviews WHERE status <> 'cancelled')::int AS interviews,
              (SELECT COUNT(*) FROM applications WHERE status = 'offer')::int AS offers`
    ),
    pool.query('SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status'),
    // Days are UTC calendar days, zero-filled for the last 14 days including today.
    pool.query(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COUNT(a.id)::int AS count
         FROM generate_series(((now() AT TIME ZONE 'UTC')::date - 13)::timestamp, (now() AT TIME ZONE 'UTC')::date::timestamp, interval '1 day') AS d(day)
         LEFT JOIN applications a ON (a.created_at AT TIME ZONE 'UTC')::date = d.day::date
        GROUP BY d.day ORDER BY d.day`
    ),
    pool.query(
      `SELECT j.id, j.title, j.company, j.accent, COUNT(a.id)::int AS applications
         FROM jobs j JOIN applications a ON a.job_id = j.id
        GROUP BY j.id ORDER BY applications DESC, j.title LIMIT 5`
    ),
  ]);

  const applicationsByStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  for (const row of byStatus.rows) applicationsByStatus[row.status] = row.count;

  return {
    totals: totals.rows[0],
    applicationsByStatus,
    applicationsPerDay: perDay.rows,
    topJobs: topJobs.rows,
  };
}

module.exports = { dashboard };
