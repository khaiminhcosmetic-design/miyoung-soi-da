const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db } = require('../db');
const config = require('../config');

const KEEP_COUNT = 7; // mục 11.4 - giữ 7 bản gần nhất

function encryptFile(plainPath, outPath, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plain = fs.readFileSync(plainPath);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Định dạng file: [12 byte IV][16 byte auth tag][dữ liệu mã hóa]
  fs.writeFileSync(outPath, Buffer.concat([iv, authTag, encrypted]));
}

// Mục 11.4 - sao lưu cơ sở dữ liệu hằng ngày, mã hóa, giữ 7 bản gần nhất
function runBackup() {
  if (!config.backupEncryptionKey || config.backupEncryptionKey.length !== 64) {
    console.warn('[backup] Thiếu hoặc sai định dạng BACKUP_ENCRYPTION_KEY (cần 64 ký tự hex) - bỏ qua sao lưu hôm nay.');
    return;
  }

  if (!fs.existsSync(config.backupDir)) fs.mkdirSync(config.backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotPath = path.join(config.backupDir, `snapshot-${stamp}.db`);
  const encryptedPath = path.join(config.backupDir, `soida-${stamp}.db.enc`);

  db.prepare('VACUUM INTO ?').run(snapshotPath);
  encryptFile(snapshotPath, encryptedPath, config.backupEncryptionKey);
  fs.unlinkSync(snapshotPath);

  const files = fs
    .readdirSync(config.backupDir)
    .filter((f) => f.endsWith('.db.enc'))
    .sort();
  const excess = files.length - KEEP_COUNT;
  for (let i = 0; i < excess; i++) {
    fs.unlinkSync(path.join(config.backupDir, files[i]));
  }

  console.log(`[backup] Đã tạo bản sao lưu mã hóa: ${path.basename(encryptedPath)}`);
}

module.exports = { runBackup };
