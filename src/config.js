require('dotenv').config();

function required(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  }
  return v;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  siteOrigin: required('SITE_ORIGIN', 'http://localhost:3000'),
  sessionSecret: required('SESSION_SECRET'),
  dbPath: process.env.DB_PATH || './data/soida.db',
  camNangDir: process.env.CAM_NANG_DIR || './cam_nang',
  backupDir: process.env.BACKUP_DIR || './data/backups',
  backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY || null,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || null,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || null,
  noticeVersion: process.env.NOTICE_VERSION || 'TB-DLCN-SOIDA v1.2 (24/09/2026)',

  // Mục 9.4 / 10.2 / 10.3 / 10.4 / 13.1 - thông tin pháp nhân, giữ nguyên văn theo tài liệu đặc tả v4.0
  controller: {
    name: 'Công ty TNHH SX TM XNK Khải Minh Factory (thương hiệu MIYOUNG)',
    tax: '1102152606',
    address: 'K15, Khu B, Đường CN5, Khu xưởng Kizuna 3, Xã Cần Giuộc, Tỉnh Tây Ninh',
    phone: '090 398 88 08',
    email: 'Khaiminh.cosmetic@gmail.com',
  },

  // Mục 10.1 / 11.4 - thời hạn lưu dữ liệu
  retentionMonths: 24,

  // Mục 11.1 - giới hạn tần suất API công khai
  rateLimit: {
    windowMs: 60 * 1000,
    max: 5,
  },

  // Mục 12.1 - khóa tài khoản sau nhiều lần đăng nhập sai
  loginLockout: {
    maxAttempts: 5,
    lockoutMs: 15 * 60 * 1000,
  },

  // Mục 12.1 - hết hạn phiên quản trị sau 8 giờ không hoạt động
  adminSessionIdleMs: 8 * 60 * 60 * 1000,

  // Mục 10.5 - quy tắc gọi điện
  callRules: {
    maxCallsPerDay: 1,
    maxAttemptDays: 2,
  },

  messengerUrl: 'https://m.me/miyoungvn',
  fanpageUrl: 'https://facebook.com/miyoungvn',
};

module.exports = config;
