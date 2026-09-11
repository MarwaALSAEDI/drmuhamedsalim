#!/usr/bin/env node
'use strict';
/*
  تنزيل خط عربي من Google Fonts واستضافته محلياً داخل public/fonts/
  الاستخدام:
    node tools/font.js "Cairo"
    node tools/font.js "IBM Plex Sans Arabic"
    node tools/font.js "Almarai" 400;700;800

  بعدها شغّل:  npm run css
*/
const https = require('https');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FAMILY = process.argv[2] || 'IBM Plex Sans Arabic';
const WEIGHTS = process.argv[3] || '400;500;600;700';
const KEEP = ['arabic', 'latin'];
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'fonts');
const SLUG = FAMILY.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function get(url, binary) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return resolve(get(r.headers.location, binary));
      }
      if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode + ' — تأكد من اسم الخط'));
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => resolve(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

(async () => {
  console.log(`\nتنزيل: ${FAMILY}  (الأوزان ${WEIGHTS})\n`);
  const css = await get(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY).replace(/%20/g, '+')}:wght@${WEIGHTS}&display=swap`);

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  // نظّف الخطوط القديمة
  for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith('.woff2')) fs.unlinkSync(path.join(OUT, f));
  }

  let out = `/* ${FAMILY} — مستضاف محلياً. أُنشئ بـ: node tools/font.js "${FAMILY}" */\n`;
  let n = 0;

  for (const b of css.split('/*').slice(1)) {
    const subset = b.slice(0, b.indexOf('*/')).trim();
    if (!KEEP.includes(subset)) continue;
    const weight = (/font-weight:\s*(\d+)/.exec(b) || [])[1];
    const url = (/src:\s*url\((https:[^)]+)\)/.exec(b) || [])[1];
    const range = (/unicode-range:\s*([^;]+);/.exec(b) || [])[1];
    if (!weight || !url || !range) continue;

    const file = `${SLUG}-${subset}-${weight}.woff2`;
    const buf = await get(url, true);
    fs.writeFileSync(path.join(OUT, file), buf);
    n++;
    console.log(`  ✓ ${file}  ${(buf.length / 1024).toFixed(1)} KB`);

    out += `@font-face{font-family:'${FAMILY}';font-style:normal;font-weight:${weight};font-display:swap;` +
           `src:url('/public/fonts/${file}') format('woff2');unicode-range:${range.trim()}}\n`;
  }

  if (!n) throw new Error('لم يُعثر على أي ملف خط — تأكد أن الخط يدعم العربية');
  fs.writeFileSync(path.join(OUT, 'fonts.css'), out);

  // حدّث اسم الخط في مصدر التصميم
  const srcFile = path.join(ROOT, 'src', 'tailwind.css');
  let src = fs.readFileSync(srcFile, 'utf8');
  src = src.replace(/--font-sans:\s*"[^"]+"/, `--font-sans: "${FAMILY}"`);
  fs.writeFileSync(srcFile, src);

  // حدّث روابط التحميل المسبق في القالب
  const htmlFile = path.join(ROOT, 'lib', 'html.js');
  let html = fs.readFileSync(htmlFile, 'utf8');
  html = html.replace(/\/public\/fonts\/[a-z0-9-]+-arabic-400\.woff2/g, `/public/fonts/${SLUG}-arabic-400.woff2`)
             .replace(/\/public\/fonts\/[a-z0-9-]+-arabic-700\.woff2/g, `/public/fonts/${SLUG}-arabic-700.woff2`);
  fs.writeFileSync(htmlFile, html);

  console.log(`\nتم. الخط الآن: ${FAMILY}`);
  console.log('شغّل الآن:  npm run css  ثم أعد تشغيل الخادم\n');
})().catch(e => {
  console.error('\nخطأ: ' + e.message + '\n');
  process.exit(1);
});
