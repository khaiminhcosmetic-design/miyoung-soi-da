# Bản đồ Sáng Da MIYOUNG

Web app soi da tặng trải nghiệm miễn phí cho khách hàng của MIYOUNG COSMETIC & LAB. Xây theo tài liệu đặc tả [`tai-lieu-goc/Dac-ta-Ban-do-Sang-Da-MIYOUNG-v4.0 (1).docx`](tai-lieu-goc/Dac-ta-Ban-do-Sang-Da-MIYOUNG-v4.0%20%281%29.docx), đã lược bỏ phần máy chủ nhận lead và trang quản trị (mục 9.2–9.5, 11, 12 của tài liệu) theo yêu cầu: đây thuần túy là món quà trải nghiệm, không thu thập thông tin khách hàng.

**Đây là trang web tĩnh 100%** — chỉ HTML + CSS + JavaScript chạy trong trình duyệt, không có máy chủ, không cơ sở dữ liệu, không cần Node.js để chạy production. Toàn bộ xử lý (câu trả lời, ảnh, chấm điểm, tạo PDF) diễn ra ngay trên thiết bị của khách; không có gì được gửi đi đâu cả, trừ khi khách tự bấm nút để mở Messenger.

## Cấu trúc

```
index.html          Toàn bộ 4 màn hình (mở đầu, câu hỏi, ảnh selfie, kết quả)
assets/soi-da.css    Giao diện: bảng màu mint/trắng/vàng/đen, sáng/tối tự động
assets/soi-da.js     Thuật toán chấm điểm, đo ảnh, hành trình 7 ngày, tạo PDF, mời nhắn Messenger
tai-lieu-goc/        Tài liệu đặc tả gốc + ảnh mô tả ý tưởng ban đầu (tham khảo lịch sử)
```

## Chạy thử

Không cần cài đặt gì. Mở trực tiếp `index.html` bằng trình duyệt, hoặc để đúng nhất với hành vi `fetch`/font/thao tác ảnh, chạy một server tĩnh bất kỳ, ví dụ:

```bash
npx serve .
# hoặc: python -m http.server 8080
```

## Những gì trang này làm

- Khách trả lời 4 câu hỏi, có thể thêm ảnh selfie (đo ngay trên thiết bị bằng canvas, xóa khỏi bộ nhớ ngay sau khi đo — không bao giờ gửi đi hay lưu lại).
- Hiện Bản đồ Sáng Da cá nhân (mã kết quả, 3 chỉ số, gợi ý chăm sóc) và hành trình 7 ngày (Ngày 1 mở sẵn).
- Tạo file PDF 2 trang (Bản đồ Sáng Da + Ngày 1) ngay trên thiết bị bằng jsPDF — file chỉ lưu trên máy khách.
- Mời khách nhắn fanpage Messenger để nhận cẩm nang trọn bộ 7 ngày và tư vấn 1:1 — soạn sẵn tin nhắn, sao chép vào bộ nhớ tạm rồi mở `m.me/miyoungvn`. Không có form để lại số điện thoại, không API, không nơi nào lưu thông tin khách.

## Không có (đã bỏ so với đặc tả gốc)

Theo yêu cầu "app tặng trải nghiệm, không quản trị":
- Không có form "để lại số điện thoại", không thu thập tên/SĐT/sự đồng ý nào.
- Không có máy chủ Node/Express, không cơ sở dữ liệu, không API `/api/leads`.
- Không có trang quản trị, không tài khoản đăng nhập, không nhật ký, không quản lý lead.
- Không có sao lưu hay tác vụ tự xóa dữ liệu (vì không còn dữ liệu nào để lưu).

## Đã kiểm thử qua trình duyệt

- 3 tổ hợp câu trả lời cho đúng mã kết quả + nhánh cẩm nang như bảng đặc tả.
- Chọn ảnh rồi kiểm tra tab Network: không có yêu cầu mạng nào chứa ảnh.
- Bấm "Lưu PDF": tạo đúng file 2 trang A5, tiếng Việt hiển thị đúng dấu.
- Nhắn Messenger: đúng mẫu tin nhắn, sao chép vào bộ nhớ tạm, mở đúng `m.me/miyoungvn`.
- Giao diện: đúng bảng màu, tự đổi sáng/tối theo máy, màn hình 360px không tràn ngang.

## Việc còn cần chốt trước khi phát hành

1. **Logo Khải Minh Factory** (`logo_khai_minh.png`) chưa có file gốc — hiện trang dùng logo dạng chữ. Khi có file thật, thêm `<img class="brand-logo">` vào `.brand-line` trong `index.html` (CSS `.brand-logo` / `.brand-logo-wrap` đã có sẵn cho chế độ tối).
2. **Tên miền/nơi lưu trữ**: vì là trang tĩnh, có thể host miễn phí trên GitHub Pages, Netlify, Vercel hoặc bất kỳ hosting tĩnh nào, gắn tên miền phụ của MIYOUNG (ví dụ `soida.miyoung.vn`).
3. Nếu sau này muốn thu thập lại thông tin khách hàng (số điện thoại, tư vấn 1:1), cần dựng lại phần máy chủ + trang quản trị riêng — phiên bản này chủ động không có để giữ đúng tinh thần "món quà trải nghiệm miễn phí".
