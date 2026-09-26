const crypto = require('crypto');
const { db, nowIso } = require('../db');

const insertStmt = db.prepare(
  `INSERT INTO audit_log (id, thoi_diem, user_id, hanh_dong, lead_id, so_luong) VALUES (?, ?, ?, ?, ?, ?)`
);

// Mục 11.3 - ghi hành động, không ghi nội dung cá nhân
// hanh_dong: xem_lead | cap_nhat_trang_thai | rut_dong_y_uu_dai | xoa_theo_yeu_cau | tu_dong_xoa
function logAction({ userId = null, hanhDong, leadId = null, soLuong = null }) {
  insertStmt.run(crypto.randomUUID(), nowIso(), userId, hanhDong, leadId, soLuong);
}

module.exports = { logAction };
