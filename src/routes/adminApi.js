const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { db, nowIso } = require('../db');
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');
const { isValidKhungGio, isValidNhanh, isValidGhiChu, isValidTenGoi } = require('../utils/validators');
const { todayVN } = require('../utils/dateVN');

const router = express.Router();
router.use(requireAuth);

const TRANG_THAI_HOP_LE = ['moi', 'da_goi', 'khong_nghe_1', 'khong_nghe_2', 'da_gui_cam_nang', 'dung_lien_he'];
const CALL_STATUSES = ['da_goi', 'khong_nghe_1', 'khong_nghe_2'];
const PAGE_SIZE = 50;

function parseLeadRow(row) {
  if (!row) return null;
  let dongY = null;
  try { dongY = JSON.parse(row.dong_y_json); } catch (e) { dongY = null; }
  return {
    id: row.id,
    created_at: row.created_at,
    ten_goi: row.ten_goi,
    so_dien_thoai: row.so_dien_thoai,
    khung_gio_goi: row.khung_gio_goi,
    ma_ket_qua: row.ma_ket_qua,
    nhanh_cam_nang: row.nhanh_cam_nang,
    dong_y: dongY,
    nhan_uu_dai: !!row.nhan_uu_dai,
    trang_thai: row.trang_thai,
    so_lan_goi: row.so_lan_goi,
    lan_goi_cuoi_ngay: row.lan_goi_cuoi_ngay,
    phu_trach: row.phu_trach,
    ghi_chu: row.ghi_chu,
    last_interaction_at: row.last_interaction_at,
  };
}

// Mục 12.2 - "Hôm nay cần gọi": lead trạng thái moi / khong_nghe_1, nhóm theo khung giờ
router.get('/leads/today', (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM leads WHERE trang_thai IN ('moi','khong_nghe_1') ORDER BY khung_gio_goi ASC, created_at ASC`)
    .all();
  res.json({ ok: true, leads: rows.map(parseLeadRow), today: todayVN() });
});

// Mục 12.2 - "Tất cả lead": lọc theo ngày tạo, khung giờ, nhánh, trạng thái, đồng ý ưu đãi; tìm theo số điện thoại; phân trang 50 dòng
router.get('/leads', (req, res) => {
  const { from, to, khung_gio_goi, nhanh_cam_nang, trang_thai, nhan_uu_dai, phone } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const clauses = [];
  const params = [];

  if (from) { clauses.push('created_at >= ?'); params.push(from); }
  if (to) { clauses.push('created_at <= ?'); params.push(to); }
  if (khung_gio_goi && isValidKhungGio(khung_gio_goi)) { clauses.push('khung_gio_goi = ?'); params.push(khung_gio_goi); }
  if (nhanh_cam_nang && isValidNhanh(nhanh_cam_nang)) { clauses.push('nhanh_cam_nang = ?'); params.push(nhanh_cam_nang); }
  if (trang_thai && TRANG_THAI_HOP_LE.includes(trang_thai)) { clauses.push('trang_thai = ?'); params.push(trang_thai); }
  if (nhan_uu_dai === '1' || nhan_uu_dai === '0') { clauses.push('nhan_uu_dai = ?'); params.push(nhan_uu_dai === '1' ? 1 : 0); }
  if (phone) { clauses.push('so_dien_thoai LIKE ?'); params.push(`%${phone.replace(/[^0-9]/g, '')}%`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM leads ${where}`).get(...params).n;
  const rows = db
    .prepare(`SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  res.json({ ok: true, leads: rows.map(parseLeadRow), total, page, pageSize: PAGE_SIZE });
});

// Mục 12.2 - Chi tiết lead
router.get('/leads/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Không tìm thấy lead.' });
  logAction({ userId: req.session.user.id, hanhDong: 'xem_lead', leadId: row.id });
  res.json({ ok: true, lead: parseLeadRow(row) });
});

// Mục 12.2 / 10.5 - cập nhật trạng thái, ghi chú, phụ trách, rút đồng ý ưu đãi; áp quy tắc gọi điện
router.patch('/leads/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Không tìm thấy lead.' });

  const updates = [];
  const params = [];
  const today = todayVN();
  let hint = null;

  if (req.body.trang_thai !== undefined) {
    const trangThaiMoi = req.body.trang_thai;
    if (!TRANG_THAI_HOP_LE.includes(trangThaiMoi)) {
      return res.status(400).json({ ok: false, error: 'Trạng thái không hợp lệ.' });
    }

    if (CALL_STATUSES.includes(trangThaiMoi)) {
      // Mục 10.5 / 12.2 - tối đa 1 cuộc/ngày, chặn khi đã gọi hôm nay
      if (row.lan_goi_cuoi_ngay === today) {
        return res.status(409).json({ ok: false, error: 'Đã ghi nhận cuộc gọi cho lead này trong hôm nay rồi (tối đa 1 cuộc/ngày).' });
      }
      updates.push('so_lan_goi = so_lan_goi + 1', 'lan_goi_cuoi_ngay = ?');
      params.push(today);
      if (trangThaiMoi === 'khong_nghe_2') {
        hint = 'Gửi 1 tin nhắn kèm cẩm nang rồi chuyển Dừng liên hệ.';
      }
    }

    updates.push('trang_thai = ?');
    params.push(trangThaiMoi);
  }

  if (req.body.ghi_chu !== undefined) {
    if (!isValidGhiChu(req.body.ghi_chu)) {
      return res.status(400).json({ ok: false, error: 'Ghi chú tối đa 300 ký tự.' });
    }
    updates.push('ghi_chu = ?');
    params.push(req.body.ghi_chu ? String(req.body.ghi_chu).slice(0, 300) : null);
  }

  if (req.body.phu_trach !== undefined) {
    updates.push('phu_trach = ?');
    params.push(req.body.phu_trach || null);
  }

  let rutDongYUuDai = false;
  if (req.body.nhan_uu_dai === false) {
    updates.push('nhan_uu_dai = 0');
    rutDongYUuDai = true;
  }

  if (!updates.length) {
    return res.status(400).json({ ok: false, error: 'Không có thay đổi nào.' });
  }

  updates.push('last_interaction_at = ?');
  params.push(nowIso());
  params.push(row.id);

  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  logAction({ userId: req.session.user.id, hanhDong: 'cap_nhat_trang_thai', leadId: row.id });
  if (rutDongYUuDai) {
    logAction({ userId: req.session.user.id, hanhDong: 'rut_dong_y_uu_dai', leadId: row.id });
  }

  const updated = parseLeadRow(db.prepare('SELECT * FROM leads WHERE id = ?').get(row.id));
  res.json({ ok: true, lead: updated, hint });
});

// Mục 12.2 - "Xóa theo yêu cầu khách" (chỉ quản trị viên), xác nhận 2 bước ở giao diện, buộc gửi confirm=true
router.delete('/leads/:id', requireRole('quan_tri_vien'), (req, res) => {
  if (req.body.confirm !== true) {
    return res.status(400).json({ ok: false, error: 'Thiếu xác nhận xóa.' });
  }
  const row = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Không tìm thấy lead.' });

  db.prepare('DELETE FROM leads WHERE id = ?').run(row.id);
  logAction({ userId: req.session.user.id, hanhDong: 'xoa_theo_yeu_cau', leadId: row.id });
  res.json({ ok: true });
});

// Mục 12.1 - quản lý tài khoản chuyên viên (chỉ quản trị viên)
router.get('/users', requireRole('quan_tri_vien'), (req, res) => {
  const rows = db.prepare('SELECT id, email, role, ten, active, created_at FROM users ORDER BY created_at ASC').all();
  res.json({ ok: true, users: rows });
});

router.post('/users', requireRole('quan_tri_vien'), (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = req.body.role;
  const ten = typeof req.body.ten === 'string' ? req.body.ten.trim().slice(0, 60) : null;

  if (!email || !email.includes('@')) return res.status(400).json({ ok: false, error: 'Email không hợp lệ.' });
  if (!password || password.length < 8) return res.status(400).json({ ok: false, error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
  if (!['quan_tri_vien', 'chuyen_vien'].includes(role)) return res.status(400).json({ ok: false, error: 'Vai trò không hợp lệ.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ ok: false, error: 'Email đã được dùng cho tài khoản khác.' });

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, ten, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(id, email, bcrypt.hashSync(password, 12), role, ten, nowIso());

  res.status(201).json({ ok: true, user: { id, email, role, ten, active: 1 } });
});

router.patch('/users/:id', requireRole('quan_tri_vien'), (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Không tìm thấy tài khoản.' });

  if (req.body.active !== undefined) {
    db.prepare('UPDATE users SET active = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?').run(req.body.active ? 1 : 0, row.id);
  }
  if (req.body.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ ok: false, error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(req.body.password, 12), row.id);
  }

  res.json({ ok: true });
});

// Mục 11.3 / 12.2 - Nhật ký (chỉ quản trị viên)
router.get('/audit-log', requireRole('quan_tri_vien'), (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const total = db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n;
  const rows = db
    .prepare(
      `SELECT a.*, u.email AS user_email FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.thoi_diem DESC LIMIT ? OFFSET ?`
    )
    .all(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  res.json({ ok: true, entries: rows, total, page, pageSize: PAGE_SIZE });
});

// Mục 12.2 - Tệp cẩm nang: trạng thái sẵn có của 3 file PDF nhánh A/B/C
router.get('/cam-nang', (req, res) => {
  const branches = ['A', 'B', 'C'].map((nhanh) => {
    const filePath = path.join(config.camNangDir, `nhanh-${nhanh.toLowerCase()}.pdf`);
    return { nhanh, available: fs.existsSync(filePath) };
  });
  res.json({ ok: true, branches });
});

module.exports = router;
