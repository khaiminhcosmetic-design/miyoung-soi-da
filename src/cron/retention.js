const crypto = require('crypto');
const { db, nowIso } = require('../db');
const config = require('../config');

// Mục 11.4 - mỗi ngày 02:00, xóa hẳn lead có last_interaction_at cũ hơn 24 tháng; ghi audit_log số lượng đã xóa.
function runRetentionCleanup() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - config.retentionMonths);
  const cutoffIso = cutoff.toISOString();

  const toDelete = db.prepare('SELECT id FROM leads WHERE last_interaction_at < ?').all(cutoffIso);
  if (toDelete.length === 0) return 0;

  const deleteStmt = db.prepare('DELETE FROM leads WHERE id = ?');
  db.exec('BEGIN');
  try {
    for (const row of toDelete) deleteStmt.run(row.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  db.prepare(
    `INSERT INTO audit_log (id, thoi_diem, user_id, hanh_dong, lead_id, so_luong) VALUES (?, ?, NULL, 'tu_dong_xoa', NULL, ?)`
  ).run(crypto.randomUUID(), nowIso(), toDelete.length);

  console.log(`[retention] Đã xóa ${toDelete.length} lead quá hạn ${config.retentionMonths} tháng.`);
  return toDelete.length;
}

module.exports = { runRetentionCleanup };
