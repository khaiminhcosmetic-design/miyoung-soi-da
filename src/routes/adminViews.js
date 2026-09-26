const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const viewsDir = path.join(__dirname, '..', 'views', 'admin');

function sendView(name) {
  return (req, res) => res.sendFile(path.join(viewsDir, name));
}

router.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/admin');
  res.sendFile(path.join(viewsDir, 'login.html'));
});

router.get('/', requireAuth, sendView('dashboard.html'));
router.get('/leads', requireAuth, sendView('leads.html'));
router.get('/leads/:id', requireAuth, sendView('lead-detail.html'));
router.get('/cam-nang', requireAuth, sendView('cam-nang.html'));
router.get('/accounts', requireAuth, requireRole('quan_tri_vien'), sendView('accounts.html'));
router.get('/audit-log', requireAuth, requireRole('quan_tri_vien'), sendView('audit-log.html'));

// Mục 12.2 - tải file PDF cẩm nang đúng nhánh (chuyên viên + quản trị viên)
router.get('/cam-nang/download/:nhanh', requireAuth, (req, res) => {
  const nhanh = String(req.params.nhanh || '').toUpperCase();
  if (!['A', 'B', 'C'].includes(nhanh)) return res.status(400).send('Nhánh không hợp lệ.');
  const filePath = path.join(config.camNangDir, `nhanh-${nhanh.toLowerCase()}.pdf`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`Chưa có file cẩm nang Nhánh ${nhanh} trên máy chủ. Liên hệ quản trị viên để đặt file vào thư mục cấu hình.`);
  }
  res.download(filePath, `Cam-nang-7-ngay-Nhanh-${nhanh}.pdf`);
});

module.exports = router;
