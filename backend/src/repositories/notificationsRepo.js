const { v4: uuid } = require('uuid');
const pool = require('../db/pool');

function rowToNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: { kind: row.link_kind || null, id: row.link_id || null },
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * @param {{userId:string,type:string,title:string,body?:string,link?:{kind:string,id:string}|null,createdAt?:Date|string}} n
 * @param {import('pg').Pool|import('pg').PoolClient} [db] pass a transaction client to join it
 */
async function create(n, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, user_id, type, title, body, link_kind, link_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8, now())) RETURNING *`,
    [uuid(), n.userId, n.type, n.title, n.body || '', n.link ? n.link.kind : null, n.link ? n.link.id : null, n.createdAt || null]
  );
  return rowToNotification(rows[0]);
}

async function listForUser(userId, limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id LIMIT $2',
    [userId, limit]
  );
  return rows.map(rowToNotification);
}

async function unreadCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return rows[0].count;
}

async function markAllRead(userId) {
  await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [userId]);
}

/** @returns {Promise<boolean>} false if the notification does not exist for this user */
async function markRead(userId, id) {
  const { rowCount } = await pool.query(
    'UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}

module.exports = { create, listForUser, unreadCount, markAllRead, markRead };
