const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const config = require('./config');
const { SqliteSessionStore, DEFAULT_MAX_AGE_MS } = require('./utils/sqliteSessionStore');

const leadsApiRouter = require('./routes/leadsApi');
const adminAuthRouter = require('./routes/adminAuth');
const adminApiRouter = require('./routes/adminApi');
const adminViewsRouter = require('./routes/adminViews');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // đứng sau Nginx reverse proxy (mục 2)

// Mục 13.2 - HTTPS/HSTS do Nginx đảm nhiệm ở tầng biên; ở đây chuyển hướng khi phát hiện HTTP qua proxy
app.use((req, res, next) => {
  if (config.env === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// Mục 13.2 - Content-Security-Policy chỉ cho phép script từ chính tên miền và cdnjs.cloudflare.com, font từ Google Fonts.
// Không có script theo dõi bên thứ ba nào được phép.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        // 'unsafe-inline' chỉ áp cho style (đổi độ rộng thanh chỉ số, độ mờ vùng da qua JS),
        // không áp cho script - giữ đúng yêu cầu "chỉ script từ chính tên miền và cdnjs".
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: config.env === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '32kb' }));

// Mục 11.1 - CORS chỉ cho phép tên miền của trang soi da, chỉ áp dụng cho API công khai
const publicApiCors = cors({ origin: config.siteOrigin, methods: ['POST', 'OPTIONS'] });
app.use('/api', publicApiCors, leadsApiRouter);

// Mục 13.2 - không dùng cookie trên trang soi da: session chỉ được nạp trong không gian /admin
const adminSession = session({
  name: 'miyoung.sid',
  secret: config.sessionSecret,
  store: new SqliteSessionStore(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // mục 12.1 - hết hạn sau 8 giờ KHÔNG HOẠT ĐỘNG (rolling reset mỗi request)
  cookie: {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: DEFAULT_MAX_AGE_MS,
  },
});

app.use('/admin', adminSession);
app.use('/admin', adminAuthRouter);
app.use('/admin/api', adminApiRouter);
app.use('/admin', adminViewsRouter);
app.use('/admin-assets', express.static(path.join(__dirname, '..', 'public', 'admin-assets')));

// Trang soi da tĩnh (frontend công khai, không cookie, không theo dõi)
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'soi-da-miyoung.html' }));

app.use((req, res) => res.status(404).send('Không tìm thấy trang.'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Có lỗi ở máy chủ. Vui lòng thử lại.' });
});

module.exports = app;
