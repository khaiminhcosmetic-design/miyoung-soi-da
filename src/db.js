const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Mục 11.2 - bảng leads
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    ten_goi TEXT,
    so_dien_thoai TEXT NOT NULL,
    khung_gio_goi TEXT NOT NULL,
    ma_ket_qua TEXT NOT NULL,
    nhanh_cam_nang TEXT NOT NULL,
    dong_y_json TEXT NOT NULL,
    nhan_uu_dai INTEGER NOT NULL DEFAULT 0,
    trang_thai TEXT NOT NULL DEFAULT 'moi',
    so_lan_goi INTEGER NOT NULL DEFAULT 0,
    lan_goi_cuoi_ngay TEXT,
    phu_trach TEXT,
    ghi_chu TEXT,
    last_interaction_at TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_so_dien_thoai ON leads(so_dien_thoai)');
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_last_interaction ON leads(last_interaction_at)');
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_trang_thai ON leads(trang_thai)');

// Mục 11.3 - bảng audit_log (không lưu nội dung cá nhân)
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    thoi_diem TEXT NOT NULL,
    user_id TEXT,
    hanh_dong TEXT NOT NULL,
    lead_id TEXT,
    so_luong INTEGER
  )
`);

// Mục 12.1 - tài khoản quản trị viên / chuyên viên
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('quan_tri_vien','chuyen_vien')),
    ten TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    created_at TEXT NOT NULL
  )
`);

// Kho lưu phiên đăng nhập cho express-session (thay cho connect-sqlite3, tránh phụ thuộc native)
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expires INTEGER NOT NULL
  )
`);

function nowIso() {
  return new Date().toISOString();
}

// Khởi tạo tài khoản quản trị viên đầu tiên nếu database chưa có tài khoản nào (mục 16 - "Danh sách tài khoản ban đầu")
function seedAdminIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (countRow.n > 0) return;
  if (!config.seedAdminEmail || !config.seedAdminPassword) {
    console.warn('[seed] Chưa có tài khoản nào và thiếu SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD trong .env - bỏ qua khởi tạo.');
    return;
  }
  const hash = bcrypt.hashSync(config.seedAdminPassword, 12);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, ten, active, created_at) VALUES (?, ?, ?, 'quan_tri_vien', ?, 1, ?)`
  ).run(crypto.randomUUID(), config.seedAdminEmail.toLowerCase(), hash, 'Quản trị viên', nowIso());
  console.log(`[seed] Đã tạo tài khoản quản trị viên khởi tạo: ${config.seedAdminEmail}`);
}
seedAdminIfEmpty();

module.exports = { db, nowIso };
