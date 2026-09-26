const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { db, nowIso } = require('../db');
const config = require('../config');

const router = express.Router();

const findUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const bumpFailedStmt = db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?');
const lockUserStmt = db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?');
const resetLoginStmt = db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?');

// Giới hạn thêm ở tầng mạng để chống dò mật khẩu hàng loạt, độc lập với khóa tài khoản theo email
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ ok: false, error: 'Quá nhiều lần thử. Vui lòng thử lại sau.' }),
});

// Mục 12.1 - đăng nhập bằng email + mật khẩu (băm bcrypt), khóa 15 phút sau 5 lần sai
router.post('/api/login', loginRateLimiter, (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Nhập email và mật khẩu.' });
  }

  const user = findUserStmt.get(email);
  const genericError = 'Email hoặc mật khẩu không đúng.';

  if (!user || !user.active) {
    return res.status(401).json({ ok: false, error: genericError });
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
    return res.status(423).json({ ok: false, error: `Tài khoản đang tạm khóa do đăng nhập sai nhiều lần. Thử lại sau khoảng ${minutesLeft} phút.` });
  }

  const passwordOk = bcrypt.compareSync(password, user.password_hash);
  if (!passwordOk) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= config.loginLockout.maxAttempts) {
      lockUserStmt.run(new Date(Date.now() + config.loginLockout.lockoutMs).toISOString(), user.id);
      return res.status(423).json({ ok: false, error: 'Sai quá 5 lần. Tài khoản tạm khóa 15 phút.' });
    }
    bumpFailedStmt.run(attempts, user.id);
    return res.status(401).json({ ok: false, error: genericError });
  }

  resetLoginStmt.run(user.id);

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ ok: false, error: 'Không thể tạo phiên đăng nhập. Thử lại.' });
    req.session.user = { id: user.id, email: user.email, role: user.role, ten: user.ten || user.email };
    req.session.lastActiveAt = nowIso();
    res.json({ ok: true, user: req.session.user });
  });
});

router.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('miyoung.sid');
    res.json({ ok: true });
  });
});

router.get('/api/me', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: req.session.user });
});

module.exports = router;
