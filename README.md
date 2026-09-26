# Bản đồ Sáng Da MIYOUNG

Web app soi da + phễu thu thông tin khách hàng cho MIYOUNG COSMETIC & LAB.
Xây đúng theo tài liệu đặc tả [`tai-lieu-goc/Dac-ta-Ban-do-Sang-Da-MIYOUNG-v4.0 (1).docx`](tai-lieu-goc/Dac-ta-Ban-do-Sang-Da-MIYOUNG-v4.0%20%281%29.docx) (v4.0, 24/09/2026). Khi có khác biệt, tài liệu đó là nguồn sự thật duy nhất.

## Cấu trúc dự án

```
public/soi-da-miyoung.html   Trang soi da công khai (S0-S3), không cookie, không theo dõi
public/assets/                CSS + JS của trang soi da (soi-da.css, soi-da.js)
public/admin-assets/          CSS + JS của trang quản trị

src/app.js                    Cấu hình Express, bảo mật (CSP/HSTS), CORS, session
src/server.js                 Điểm khởi động + lịch chạy nền (xóa hạn, sao lưu)
src/db.js                     Khởi tạo SQLite (node:sqlite có sẵn trong Node, không cần build native)
src/config.js                 Cấu hình từ .env + thông tin pháp nhân (mục 13.1)
src/routes/leadsApi.js        POST /api/leads - API công khai duy nhất (mục 9.4, 11.1)
src/routes/adminAuth.js       Đăng nhập/đăng xuất quản trị (mục 12.1)
src/routes/adminApi.js        API quản trị: leads, tài khoản, nhật ký, cẩm nang
src/routes/adminViews.js      Phục vụ các trang HTML quản trị (bảo vệ bằng session)
src/views/admin/*.html        Giao diện 5 màn hình quản trị + đăng nhập
src/cron/retention.js         Tự xóa lead quá 24 tháng (mục 11.4)
src/cron/backup.js            Sao lưu SQLite mã hóa AES-256-GCM, giữ 7 bản (mục 11.4)
src/cron/scheduler.js         Bộ lập lịch tự viết (chạy 02:00 giờ VN mỗi ngày), không phụ thuộc node-cron

data/                          File cơ sở dữ liệu SQLite + bản sao lưu (không commit)
cam_nang/                      Nơi đặt 3 file PDF cẩm nang nhánh A/B/C (nhanh-a.pdf, nhanh-b.pdf, nhanh-c.pdf)
tai-lieu-goc/                  Tài liệu đặc tả gốc + ảnh mô tả ý tưởng ban đầu (tham khảo lịch sử)
```

## Lựa chọn kỹ thuật khác với đề xuất ban đầu trong tài liệu

Tài liệu đề xuất `better-sqlite3` và `node-cron`. Trên máy phát triển (Windows, không có Visual Studio Build Tools) và để giảm bề mặt phụ thuộc, dự án dùng:

- **`node:sqlite`** (module dựng sẵn trong Node.js ≥ 22, cần cờ `--experimental-sqlite` ở Node 20) thay cho `better-sqlite3` — cùng là SQLite, không cần biên dịch native, API tương tự.
- **Bộ lập lịch tự viết** (`src/cron/scheduler.js`, kiểm tra mỗi 30 giây) thay cho `node-cron` — bớt một phụ thuộc cho một tác vụ chạy 1 lần/ngày.
- **`bcryptjs`** (JavaScript thuần) thay cho `bcrypt` — tránh chuỗi phụ thuộc `node-pre-gyp`/`tar` từng có lỗ hổng bảo mật đã công bố.

**Khi triển khai thật trên VPS Linux (Node 20 LTS trở lên), nên dùng Node 22 LTS trở lên** để `node:sqlite` chạy ổn định không cần cờ thử nghiệm. Nếu bắt buộc dùng đúng Node 20, thêm `NODE_OPTIONS=--experimental-sqlite` khi chạy.

## Cài đặt và chạy thử

```bash
npm install
cp .env.example .env      # rồi sửa các giá trị, đặc biệt SESSION_SECRET, SEED_ADMIN_PASSWORD
npm start
```

Mở `http://localhost:3000` để xem trang soi da, `http://localhost:3000/admin/login` để vào trang quản trị.

Tài khoản quản trị viên đầu tiên được tạo tự động từ `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` trong `.env` **chỉ khi bảng tài khoản đang trống**. Đổi mật khẩu này ngay sau lần đăng nhập đầu tiên (trang Tài khoản), hoặc tạo tài khoản quản trị viên khác rồi khóa tài khoản seed.

## Đã kiểm thử (mục 15 - Tiêu chí nghiệm thu)

| Mã | Nội dung | Kết quả |
|----|----------|---------|
| K1-K3 | 3 tổ hợp câu trả lời | Đúng mã kết quả + nhánh như bảng đặc tả |
| K4 | Chọn ảnh rồi xem Network | Không có yêu cầu mạng nào chứa ảnh (chỉ có `blob:` nội bộ, không rời trình duyệt) |
| K5 | Lưu PDF | Tạo file 2 trang A5, đúng tên file, tiếng Việt hiển thị đúng dấu |
| K6 | Nhánh Messenger | Đúng mẫu tin nhắn, mở đúng m.me/miyoungvn, không gửi gì về máy chủ |
| K7 | Gửi form thiếu/sai dữ liệu | Không gửi, đúng thông báo lỗi tương ứng |
| K8 | Giao diện | Đúng bảng màu, tự đổi sáng/tối, 360px không tràn ngang |
| K9 | POST hợp lệ | 201, lưu đúng cột, không lưu IP |
| K10 | POST sai/thiếu | 400 với thông báo tương ứng |
| K11 | Lead quá 24 tháng | Bị xóa khi chạy tác vụ, ghi audit_log |
| K12 | 2 lần "Không nghe máy" cùng ngày | Lần 2 bị chặn (409) |
| K13 | Xóa theo yêu cầu | Lead biến mất, audit_log có dòng `xoa_theo_yeu_cau` |

Đã kiểm qua trình duyệt thật (không chỉ đọc mã nguồn) cho toàn bộ luồng khách hàng (S0→S3, PDF, phễu) và toàn bộ 5 màn hình quản trị + phân quyền chuyên viên/quản trị viên.

## Việc còn cần chốt trước khi chạy thật (mục 16 của tài liệu)

1. **Tên miền** cho trang soi da → điền vào `SITE_ORIGIN` và cấu hình Nginx.
2. **Nhà cung cấp máy chủ tại Việt Nam** (Viettel IDC, VNPT, FPT Cloud, BizFly Cloud…) + người triển khai.
3. **Tài khoản chuyên viên/quản trị viên thật** → tạo qua trang Tài khoản, sau đó khóa tài khoản seed mặc định.
4. **Luật sư rà soát** toàn văn thông báo xử lý dữ liệu (mục 10.3) và quy tắc gọi điện (mục 10.5) trước khi chạy quảng cáo; xác định MIYOUNG có thuộc diện miễn trừ doanh nghiệp nhỏ hay không.
5. **3 file PDF cẩm nang** (Nhánh A/B/C, đã có sẵn ngoài phần mềm theo tài liệu) → đặt vào thư mục `cam_nang/` với tên đúng: `nhanh-a.pdf`, `nhanh-b.pdf`, `nhanh-c.pdf`.
6. **Logo Khải Minh Factory** (`logo_khai_minh.png`) chưa có file gốc trong thư mục cung cấp — hiện trang dùng logo dạng chữ (text). Khi có file thật, có thể thêm `<img>` vào `.brand-line` trong `public/soi-da-miyoung.html`.
7. **`BACKUP_ENCRYPTION_KEY`** trong `.env` production phải được đặt (64 ký tự hex) để tác vụ sao lưu hằng ngày hoạt động; nếu để trống, sao lưu sẽ bị bỏ qua kèm cảnh báo trong log.

## Triển khai (mục 2, giai đoạn 4)

- Máy chủ: VPS tại Việt Nam, chạy Node.js qua `pm2` hoặc `systemd`.
- Nginx làm reverse proxy, bật HTTPS (Let's Encrypt), chuyển toàn bộ HTTP sang HTTPS.
- Đặt `NODE_ENV=production`, `SITE_ORIGIN` đúng tên miền thật, `SESSION_SECRET` và `BACKUP_ENCRYPTION_KEY` ngẫu nhiên đủ dài.
- Trong `public/assets/soi-da.js`, `CONFIG.WEBHOOK_URL` đã đặt sẵn là `/api/leads` (đường dẫn tương đối, hoạt động ngay khi frontend và backend cùng tên miền như kiến trúc đề xuất).
