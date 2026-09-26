// Mục 12.1 - phiên đăng nhập quản trị, phân quyền quản trị viên / chuyên viên

function isApiRequest(req) {
  // Dùng originalUrl vì middleware này chạy trong router con được mount ở /admin hoặc /admin/api,
  // nơi req.path chỉ còn phần đường dẫn tương đối.
  return req.originalUrl.startsWith('/admin/api/');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (isApiRequest(req)) {
    return res.status(401).json({ ok: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }
  return res.redirect('/admin/login');
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (isApiRequest(req)) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
      return res.redirect('/admin/login');
    }
    if (!roles.includes(req.session.user.role)) {
      if (isApiRequest(req)) return res.status(403).json({ ok: false, error: 'Bạn không có quyền thực hiện thao tác này.' });
      return res.status(403).send('Bạn không có quyền truy cập trang này.');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
