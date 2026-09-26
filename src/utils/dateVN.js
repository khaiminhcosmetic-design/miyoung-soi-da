const TZ = 'Asia/Ho_Chi_Minh';

// Ngày hiện tại theo giờ Việt Nam, dạng YYYY-MM-DD - dùng để tính giới hạn 1 cuộc gọi/ngày
function todayVN(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// Định dạng thời điểm theo vi-VN (mục 9.5 "Bản ghi đồng ý của bạn")
function formatVNDateTime(isoString) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TZ,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch (e) {
    return isoString;
  }
}

module.exports = { todayVN, formatVNDateTime, TZ };
