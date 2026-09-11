'use strict';
// تخزين المحتوى والطلبات وكلمة المرور في ملفات JSON بسيطة (بدون قاعدة بيانات)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT, 'content.json');
const DATA_DIR = path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

for (const d of [DATA_DIR, BACKUP_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJSONAtomic(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/* ---------- المحتوى ---------- */

let cache = null;

function getContent() {
  if (!cache) cache = readJSON(CONTENT_FILE, {});
  return cache;
}

function saveContent(next) {
  // نسخة احتياطية قبل كل حفظ
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp}.json`));
    }
  } catch (e) { /* النسخ الاحتياطي لا يمنع الحفظ */ }
  pruneBackups(40);
  writeJSONAtomic(CONTENT_FILE, next);
  cache = next;
  return next;
}

function listBackups() {
  try {
    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('content-') && f.endsWith('.json'))
      .sort().reverse()
      .map(f => ({ file: f, size: fs.statSync(path.join(BACKUP_DIR, f)).size }));
  } catch (e) { return []; }
}

function restoreBackup(file) {
  if (!/^content-[\w.\-]+\.json$/.test(file)) throw new Error('اسم ملف غير صالح');
  const p = path.join(BACKUP_DIR, file);
  if (!fs.existsSync(p)) throw new Error('النسخة غير موجودة');
  const data = readJSON(p, null);
  if (!data) throw new Error('النسخة تالفة');
  return saveContent(data);
}

function pruneBackups(keep) {
  const all = listBackups();
  for (const b of all.slice(keep)) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, b.file)); } catch (e) {}
  }
}

/* ---------- طلبات المواعيد ---------- */

function getRequests() {
  return readJSON(REQUESTS_FILE, []);
}

function addRequest(req) {
  const all = getRequests();
  const item = Object.assign({
    id: crypto.randomBytes(6).toString('hex'),
    createdAt: new Date().toISOString(),
    status: 'جديد'
  }, req);
  all.unshift(item);
  writeJSONAtomic(REQUESTS_FILE, all.slice(0, 2000));
  return item;
}

function updateRequest(id, patch) {
  const all = getRequests();
  const i = all.findIndex(r => r.id === id);
  if (i === -1) return null;
  all[i] = Object.assign(all[i], patch);
  writeJSONAtomic(REQUESTS_FILE, all);
  return all[i];
}

function deleteRequest(id) {
  const all = getRequests().filter(r => r.id !== id);
  writeJSONAtomic(REQUESTS_FILE, all);
  return true;
}

/* ---------- كلمة المرور ---------- */

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { salt: s, hash };
}

function getConfig() {
  let cfg = readJSON(CONFIG_FILE, null);
  if (!cfg) {
    const initial = crypto.randomBytes(5).toString('hex'); // 10 خانات
    const { salt, hash } = hashPassword(initial);
    cfg = { salt, hash, isDefault: true, createdAt: new Date().toISOString() };
    writeJSONAtomic(CONFIG_FILE, cfg);
    try {
      fs.writeFileSync(
        path.join(DATA_DIR, 'ADMIN-PASSWORD.txt'),
        'كلمة مرور لوحة التحكم الأولى:\r\n' + initial +
        '\r\n\r\nادخل على /admin وغيّرها من تبويب «الإعدادات»، ثم احذف هذا الملف.\r\n',
        'utf8'
      );
    } catch (e) {}
    console.log('\n==================================================');
    console.log('  كلمة مرور لوحة التحكم (أول تشغيل): ' + initial);
    console.log('  محفوظة أيضاً في: data/ADMIN-PASSWORD.txt');
    console.log('==================================================\n');
  }
  return cfg;
}

function verifyPassword(password) {
  const cfg = getConfig();
  const { hash } = hashPassword(password, cfg.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(cfg.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function setPassword(password) {
  const { salt, hash } = hashPassword(password);
  writeJSONAtomic(CONFIG_FILE, { salt, hash, isDefault: false, updatedAt: new Date().toISOString() });
  try { fs.unlinkSync(path.join(DATA_DIR, 'ADMIN-PASSWORD.txt')); } catch (e) {}
  return true;
}

function isDefaultPassword() {
  return !!getConfig().isDefault;
}

module.exports = {
  ROOT, UPLOADS_DIR, DATA_DIR,
  getContent, saveContent, listBackups, restoreBackup,
  getRequests, addRequest, updateRequest, deleteRequest,
  verifyPassword, setPassword, isDefaultPassword, getConfig
};
