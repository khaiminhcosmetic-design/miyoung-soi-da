const app = require('./app');
const config = require('./config');
const { runDailyAt } = require('./cron/scheduler');
const { runRetentionCleanup } = require('./cron/retention');
const { runBackup } = require('./cron/backup');

app.listen(config.port, () => {
  console.log(`[server] Bản đồ Sáng Da MIYOUNG đang chạy tại http://localhost:${config.port} (env: ${config.env})`);
});

// Mục 11.4 - mỗi ngày 02:00 giờ Việt Nam: tự xóa lead quá hạn 24 tháng, sau đó sao lưu cơ sở dữ liệu
runDailyAt(2, 0, async () => {
  runRetentionCleanup();
  runBackup();
}, 'retention+backup 02:00');
