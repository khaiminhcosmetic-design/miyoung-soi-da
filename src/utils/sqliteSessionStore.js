const session = require('express-session');
const { db } = require('../db');

const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000; // mục 12.1 - hết hạn sau 8 giờ không hoạt động

const getStmt = db.prepare('SELECT sess, expires FROM sessions WHERE sid = ?');
const upsertStmt = db.prepare(
  `INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
   ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires`
);
const destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
const touchStmt = db.prepare('UPDATE sessions SET expires = ? WHERE sid = ?');
const pruneStmt = db.prepare('DELETE FROM sessions WHERE expires < ?');

/**
 * Kho lưu phiên đăng nhập bằng SQLite (module node:sqlite có sẵn), thay cho connect-sqlite3
 * để tránh phụ thuộc module native cần biên dịch.
 */
class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const row = getStmt.get(sid);
      if (!row) return callback(null, null);
      if (row.expires < Date.now()) {
        destroyStmt.run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : DEFAULT_MAX_AGE_MS;
      const expires = Date.now() + maxAge;
      upsertStmt.run(sid, JSON.stringify(sessionData), expires);
      if (Math.random() < 0.02) pruneStmt.run(Date.now());
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      destroyStmt.run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : DEFAULT_MAX_AGE_MS;
      touchStmt.run(Date.now() + maxAge, sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = { SqliteSessionStore, DEFAULT_MAX_AGE_MS };
