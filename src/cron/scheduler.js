const { todayVN, TZ } = require('../utils/dateVN');

/**
 * Lập lịch chạy một tác vụ mỗi ngày vào đúng giờ:phút theo giờ Việt Nam.
 * Không dùng thư viện ngoài (node-cron) để tránh phụ thuộc không cần thiết -
 * chỉ kiểm tra mỗi 30 giây, phù hợp với 1 tác vụ chạy 1 lần/ngày.
 */
function runDailyAt(hour, minute, taskFn, label) {
  let lastRunDate = null;

  async function tick() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const hh = parseInt(map.hour, 10);
    const mm = parseInt(map.minute, 10);
    const today = todayVN(now);

    if (hh === hour && mm === minute && lastRunDate !== today) {
      lastRunDate = today;
      try {
        await taskFn();
      } catch (err) {
        console.error(`[cron] Lỗi khi chạy tác vụ "${label}":`, err);
      }
    }
  }

  const intervalId = setInterval(tick, 30 * 1000);
  intervalId.unref();
  return intervalId;
}

module.exports = { runDailyAt };
