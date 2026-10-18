const { Pool, types } = require('pg');

// DATE (oid 1082) stays a plain "YYYY-MM-DD" string instead of a JS Date, so interview
// days never shift with the server time zone.
types.setTypeParser(1082, (value) => value);

if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Runs `fn(client)` inside a transaction; commits on success, rolls back on any error.
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* connection already broken; surface the original error */
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
