const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { db, nowIso } = require('../db');
const config = require('../config');
const { validateLeadPayload } = require('../utils/validators');

const router = express.Router();

// Mục 11.1 - giới hạn 5 yêu cầu/phút/IP; IP chỉ dùng tạm trong bộ nhớ để chống spam, không lưu vào cơ sở dữ liệu.
const leadsRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' });
  },
});

const findRecentByPhoneStmt = db.prepare(
  `SELECT id FROM leads WHERE so_dien_thoai = ? AND last_interaction_at > ? ORDER BY last_interaction_at DESC LIMIT 1`
);

const updateLeadStmt = db.prepare(`
  UPDATE leads SET
    ten_goi = ?,
    khung_gio_goi = ?,
    ma_ket_qua = ?,
    nhanh_cam_nang = ?,
    dong_y_json = ?,
    nhan_uu_dai = ?,
    last_interaction_at = ?
  WHERE id = ?
`);

const insertLeadStmt = db.prepare(`
  INSERT INTO leads (
    id, created_at, ten_goi, so_dien_thoai, khung_gio_goi, ma_ket_qua, nhanh_cam_nang,
    dong_y_json, nhan_uu_dai, trang_thai, so_lan_goi, last_interaction_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'moi', 0, ?)
`);

// Mục 9.4 / 11.1 - API công khai duy nhất của hệ thống
router.post('/leads', leadsRateLimiter, (req, res) => {
  const result = validateLeadPayload(req.body);
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error });
  }
  const data = result.data;
  const now = nowIso();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const existing = findRecentByPhoneStmt.get(data.so_dien_thoai, twentyFourHoursAgo);

  if (existing) {
    updateLeadStmt.run(
      data.ten_goi,
      data.khung_gio_goi,
      data.ma_ket_qua,
      data.nhanh_cam_nang,
      JSON.stringify(data.dong_y),
      data.nhan_uu_dai ? 1 : 0,
      now,
      existing.id
    );
  } else {
    insertLeadStmt.run(
      crypto.randomUUID(),
      now,
      data.ten_goi,
      data.so_dien_thoai,
      data.khung_gio_goi,
      data.ma_ket_qua,
      data.nhanh_cam_nang,
      JSON.stringify(data.dong_y),
      data.nhan_uu_dai ? 1 : 0,
      now
    );
  }

  return res.status(201).json({ ok: true });
});

module.exports = router;
