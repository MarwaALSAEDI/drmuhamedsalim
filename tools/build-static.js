#!/usr/bin/env node
'use strict';
/*
  تصدير الموقع كملفات HTML ثابتة إلى مجلد dist/ — مناسب لـ GitHub Pages.
  الاستخدام:  npm run build

  ملاحظة مهمة: GitHub Pages يقدّم ملفات ثابتة فقط، فلا تعمل عليه:
    - لوحة التحكم (/admin) لأنها تحتاج خادماً يحفظ الملفات
    - نموذج طلب الموعد (/api/appointment)
  الحل: حرّر المحتوى محلياً عبر `node server.js`، ثم `npm run build` وارفع dist/.
*/
process.env.STATIC_BUILD = '1';   // يبدّل نموذج الحجز إلى وضع واتساب

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const store = require(path.join(ROOT, 'lib', 'store'));
const P = require(path.join(ROOT, 'lib', 'pages'));

// بادئة المسار لمواقع المشاريع على GitHub Pages، مثال: drmuhamedsalim
// تُقبل بأي صيغة، وتُصحَّح تلقائياً إذا حوّلها Git Bash إلى مسار ويندوز.
const BASE_PATH = (function () {
  let v = (process.env.BASE_PATH || '').trim();
  if (!v) return '';
  if (/^[A-Za-z]:[\\/]/.test(v) || v.includes('Program Files')) v = v.split(/[\\/]/).pop();
  v = v.replace(/^\/+|\/+$/g, '');
  return v ? '/' + v : '';
})();

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}

// إضافة بادئة المسار لروابط الموقع الداخلية (لمواقع المشاريع على GitHub Pages)
function withBasePath(html) {
  if (!BASE_PATH) return html;
  return html
    .replace(/(href|src)="\/(?!\/)/g, `$1="${BASE_PATH}/`)
    .replace(/url\('\/(?!\/)/g, `url('${BASE_PATH}/`);
}

const NOINDEX = process.env.NOINDEX === '1';

function write(routePath, html) {
  // "/" -> index.html   |   "/about/" -> about/index.html
  const rel = routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\/|\/$/g, ''), 'index.html');
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let page = withBasePath(html);
  if (NOINDEX) {
    page = page.replace('<meta name="viewport"',
      '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"');
  }
  fs.writeFileSync(out, page, 'utf8');
  return rel;
}

function sitemap(c) {
  const base = c.site.domain.replace(/\/+$/, '');
  const urls = ['/', '/about/', '/services/'];
  c.services.forEach(s => urls.push('/services/' + s.slug + '/'));
  urls.push('/health-insurance/', '/education/', '/contact/', '/editorial-policy/', '/privacy/');
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>`;
}

function robots(c) {
  const base = c.site.domain.replace(/\/+$/, '');
  // نسخة المعاينة لا تُفهرس حتى يجهز الدومين الحقيقي
  if (NOINDEX) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

/* ---------------- التنفيذ ---------------- */

const c = store.getContent();

rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });

const written = [];

written.push(write('/', P.home(c)));
written.push(write('/about/', P.about(c)));
written.push(write('/services/', P.servicesIndex(c)));
for (const sv of c.services) written.push(write('/services/' + sv.slug + '/', P.service(c, sv)));
written.push(write('/health-insurance/', P.insurance(c)));
written.push(write('/education/', P.education(c)));
written.push(write('/contact/', P.contact(c)));
written.push(write('/editorial-policy/', P.simplePage(c, 'editorial', '/editorial-policy/')));
written.push(write('/privacy/', P.simplePage(c, 'privacy', '/privacy/')));

// صفحة 404 التي يستخدمها GitHub Pages
fs.writeFileSync(path.join(DIST, '404.html'), withBasePath(P.notFound(c)), 'utf8');

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap(c), 'utf8');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots(c), 'utf8');
// يمنع GitHub من معالجة الملفات بـ Jekyll (مهم للمجلدات التي تبدأ بـ _)
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');

const nPublic = copyDir(path.join(ROOT, 'public'), path.join(DIST, 'public'));

// انسخ الصور المستخدمة فعلاً فقط — لا تنشر صوراً مرفوعة وغير مرتبطة بالمحتوى
const used = new Set();
JSON.stringify(c).replace(/\/uploads\/([^"'\\\s]+)/g, (m, f) => { used.add(f); return m; });
let nUploads = 0, nSkipped = 0;
if (fs.existsSync(path.join(ROOT, 'uploads'))) {
  fs.mkdirSync(path.join(DIST, 'uploads'), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'uploads'))) {
    if (f === '.gitkeep') continue;
    if (used.has(f)) {
      fs.copyFileSync(path.join(ROOT, 'uploads', f), path.join(DIST, 'uploads', f));
      nUploads++;
    } else nSkipped++;
  }
}

function dirSize(p) {
  let total = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    total += e.isDirectory() ? dirSize(f) : fs.statSync(f).size;
  }
  return total;
}

console.log('\n  تم بناء الموقع الثابت في dist/\n');
written.forEach(w => console.log('   ✓ ' + w.replace(/\\/g, '/')));
console.log('   ✓ 404.html، sitemap.xml، robots.txt، .nojekyll');
console.log(`   ✓ ${nPublic} ملف في public/ و ${nUploads} صورة مستخدمة في uploads/` + (nSkipped ? ` (تُخُطِّيت ${nSkipped} صورة غير مستخدمة)` : ''));
console.log(`\n  الحجم الكلي: ${Math.round(dirSize(DIST) / 1024)} كيلوبايت`);
if (BASE_PATH) console.log(`  بادئة المسار: ${BASE_PATH}`);
console.log('\n  تنبيه: لوحة التحكم ونموذج الحجز لا يعملان على الاستضافة الثابتة.\n');
