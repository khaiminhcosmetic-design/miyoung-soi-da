// Mục 9.2 / 11.1 - kiểm tra dữ liệu gói lead gửi từ trang soi da

const KHUNG_GIO_HOP_LE = ['08-11', '11-14', '14-17', '17-20'];
const NHANH_HOP_LE = ['A', 'B', 'C'];
const MA_KET_QUA_REGEX = /^MY-[ABC]{3}$/;

/**
 * Chuẩn hóa số điện thoại về dạng 0xxxxxxxxx.
 * Trả về null nếu không hợp lệ theo ^(0|\+84)(3|5|7|8|9)\d{8}$ (sau khi bỏ khoảng trắng, dấu chấm, gạch).
 */
function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  const stripped = input.replace(/[\s.\-]/g, '');
  const match = /^(0|\+84)(3|5|7|8|9)\d{8}$/.exec(stripped);
  if (!match) return null;
  const rest = stripped.slice(match[1].length); // (3|5|7|8|9)\d{8}
  return '0' + rest;
}

function isValidKhungGio(v) {
  return KHUNG_GIO_HOP_LE.includes(v);
}

function isValidMaKetQua(v) {
  return typeof v === 'string' && MA_KET_QUA_REGEX.test(v);
}

function isValidNhanh(v) {
  return NHANH_HOP_LE.includes(v);
}

function isValidTenGoi(v) {
  if (v === null || v === undefined) return true;
  return typeof v === 'string' && v.trim().length <= 40;
}

function isValidGhiChu(v) {
  if (v === null || v === undefined) return true;
  return typeof v === 'string' && v.length <= 300;
}

/**
 * Kiểm tra toàn bộ gói dữ liệu POST /api/leads theo lược đồ mục 9.4, từ chối trường lạ (mục 11.1).
 * Trả về { ok: true, data } hoặc { ok: false, error }.
 */
function validateLeadPayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' };
  }

  const allowedTopKeys = ['ten_goi', 'so_dien_thoai', 'khung_gio_goi', 'ma_ket_qua', 'nhanh_cam_nang', 'dong_y'];
  const extraKey = Object.keys(body).find((k) => !allowedTopKeys.includes(k));
  if (extraKey) {
    return { ok: false, error: `Trường không hợp lệ: ${extraKey}.` };
  }

  if (!isValidTenGoi(body.ten_goi)) {
    return { ok: false, error: 'Tên gọi không hợp lệ.' };
  }

  const phone = normalizePhone(body.so_dien_thoai);
  if (!phone) {
    return { ok: false, error: 'Nhập số điện thoại Việt Nam 10 số, ví dụ 0912345678.' };
  }

  if (!isValidKhungGio(body.khung_gio_goi)) {
    return { ok: false, error: 'Chọn khung giờ bạn muốn được gọi.' };
  }

  if (!isValidMaKetQua(body.ma_ket_qua)) {
    return { ok: false, error: 'Mã kết quả không hợp lệ.' };
  }

  if (!isValidNhanh(body.nhanh_cam_nang)) {
    return { ok: false, error: 'Nhánh cẩm nang không hợp lệ.' };
  }

  const dongY = body.dong_y;
  if (!dongY || typeof dongY !== 'object') {
    return { ok: false, error: 'Thiếu bản ghi đồng ý.' };
  }
  const allowedDongYKeys = ['thoi_diem', 'phien_ban_thong_bao', 'muc_dich', 'khung_gio_da_thoa_thuan', 'xac_nhan_du_16_tuoi', 'kenh'];
  const extraDongYKey = Object.keys(dongY).find((k) => !allowedDongYKeys.includes(k));
  if (extraDongYKey) {
    return { ok: false, error: `Trường đồng ý không hợp lệ: ${extraDongYKey}.` };
  }
  if (typeof dongY.thoi_diem !== 'string' || Number.isNaN(Date.parse(dongY.thoi_diem))) {
    return { ok: false, error: 'Thời điểm đồng ý không hợp lệ.' };
  }
  if (typeof dongY.phien_ban_thong_bao !== 'string' || !dongY.phien_ban_thong_bao) {
    return { ok: false, error: 'Thiếu phiên bản thông báo xử lý dữ liệu.' };
  }
  if (!dongY.muc_dich || typeof dongY.muc_dich !== 'object') {
    return { ok: false, error: 'Thiếu mục đích đồng ý.' };
  }
  if (dongY.muc_dich.goi_tu_van_va_gui_cam_nang !== true) {
    return { ok: false, error: 'Để gửi yêu cầu, cần tick: đồng ý gọi tư vấn và gửi cẩm nang.' };
  }
  if (typeof dongY.muc_dich.nhan_uu_dai !== 'boolean') {
    return { ok: false, error: 'Giá trị đồng ý nhận ưu đãi không hợp lệ.' };
  }
  if (dongY.xac_nhan_du_16_tuoi !== true) {
    return { ok: false, error: 'Cần xác nhận từ đủ 16 tuổi.' };
  }
  // Bản ghi đồng ý dùng nhãn hiển thị (vd "8h – 11h"), chỉ cần là chuỗi không rỗng - không dùng isValidKhungGio ở đây
  if (typeof dongY.khung_gio_da_thoa_thuan !== 'string' || !dongY.khung_gio_da_thoa_thuan) {
    return { ok: false, error: 'Thiếu khung giờ đã thỏa thuận trong bản ghi đồng ý.' };
  }
  if (typeof dongY.kenh !== 'string' || !dongY.kenh) {
    return { ok: false, error: 'Thiếu thông tin kênh.' };
  }

  return {
    ok: true,
    data: {
      ten_goi: body.ten_goi ? String(body.ten_goi).trim().slice(0, 40) : null,
      so_dien_thoai: phone,
      khung_gio_goi: body.khung_gio_goi,
      ma_ket_qua: body.ma_ket_qua,
      nhanh_cam_nang: body.nhanh_cam_nang,
      dong_y: dongY,
      nhan_uu_dai: dongY.muc_dich.nhan_uu_dai === true,
    },
  };
}

module.exports = {
  KHUNG_GIO_HOP_LE,
  NHANH_HOP_LE,
  normalizePhone,
  isValidKhungGio,
  isValidMaKetQua,
  isValidNhanh,
  isValidTenGoi,
  isValidGhiChu,
  validateLeadPayload,
};
