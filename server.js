'use strict';
/*
  موقع عيادة د. محمد سالم عبدالسلام + لوحة التحكم
  Node.js بدون أي مكتبات خارجية.  التشغيل:  node server.js
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const store = require('./lib/store');
const P = require('./lib/pages');
const H = require('./lib/html');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

/* ---------------- الجلسات ---------------- */
const sessions = new Map(); // token -> expiry(ms)
const SESSION_MS = 1000 * 60 * 60 * 8; // 8 ساعات

function newSession() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  return token;
}
function validSession(req) {
  const token = parseCookies(req).sid;
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) { sessions.delete(token); return false; }
  sessions.set(token, Date.now() + SESSION_MS);
  return true;
}
function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

// حماية بسيطة من تخمين كلمة المرور
const loginAttempts = new Map(); // ip -> {count, until}
function loginBlocked(ip) {
  const a = loginAttempts.get(ip);
  return !!(a && a.until > Date.now());
}
function noteFailedLogin(ip) {
  const a = loginAttempts.get(ip) || { count: 0, until: 0 };
  a.count++;
  if (a.count >= 6) { a.until = Date.now() + 10 * 60 * 1000; a.count = 0; }
  loginAttempts.set(ip, a);
}

/* ---------------- أدوات الاستجابة ---------------- */

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }, headers || {}));
  res.end(body);
}

function json(res, status, obj, headers) {
  send(res, status, JSON.stringify(obj), Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {}));
}

function redirect(res, to, code) {
  res.writeHead(code || 301, { Location: to });
  res.end();
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const max = limit || 1024 * 1024; // 1MB افتراضياً
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > max) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJSONBody(req, limit) {
  const raw = await readBody(req, limit);
  try { return JSON.parse(raw || '{}'); } catch (e) { throw new Error('bad_json'); }
}

function serveStatic(res, filePath, cacheSeconds) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'غير موجود', { 'Content-Type': 'text/plain; charset=utf-8' });
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'public, max-age=' + (cacheSeconds == null ? 3600 : cacheSeconds),
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// يمنع الخروج خارج المجلد المسموح
function safeJoin(baseDir, rel) {
  const p = path.normalize(path.join(baseDir, rel));
  if (!p.startsWith(path.normalize(baseDir))) return null;
  return p;
}

/* ---------------- خريطة الموقع و robots ---------------- */

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
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
}

/* ---------------- واجهة برمجة لوحة التحكم ---------------- */

async function handleApi(req, res, url) {
  const p = url.pathname;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  // طلب موعد من الزوار (عام)
  if (p === '/api/appointment' && req.method === 'POST') {
    let b;
    try { b = await readJSONBody(req, 32 * 1024); } catch (e) { return json(res, 400, { error: 'طلب غير صالح' }); }
    const name = String(b.name || '').trim().slice(0, 80);
    const phone = String(b.phone || '').trim().slice(0, 20);
    const note = String(b.note || '').trim().slice(0, 300);
    const reason = String(b.reason || '').trim().slice(0, 80);
    // التاريخ والوقت المفضلان
    const rawDate = String(b.date || '').trim();
    const rawTime = String(b.time || '').trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
    const time = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : '';
    // توافق مع النسخة السابقة من النموذج
    const preferred = String(b.preferred || '').trim().slice(0, 60) ||
      [date, time].filter(Boolean).join(' ');

    if (!name || name.length < 2) return json(res, 400, { error: 'الرجاء كتابة الاسم' });
    if (!/^[\d\s+\-()]{7,20}$/.test(phone)) return json(res, 400, { error: 'رقم التواصل غير صحيح' });
    if (b.consent !== true) return json(res, 400, { error: 'الرجاء الموافقة على التواصل لتأكيد الموعد' });
    if (String(b.website || '') !== '') return json(res, 200, { ok: true }); // فخ للرسائل الآلية

    store.addRequest({ name, phone, date, time, reason, preferred, note });
    return json(res, 200, { ok: true, message: store.getContent().contact.successMsg });
  }

  // تسجيل الدخول
  if (p === '/api/admin/login' && req.method === 'POST') {
    if (loginBlocked(ip)) return json(res, 429, { error: 'محاولات كثيرة. حاول بعد 10 دقائق.' });
    let b;
    try { b = await readJSONBody(req, 4096); } catch (e) { return json(res, 400, { error: 'طلب غير صالح' }); }
    if (!store.verifyPassword(String(b.password || ''))) {
      noteFailedLogin(ip);
      return json(res, 401, { error: 'كلمة المرور غير صحيحة' });
    }
    loginAttempts.delete(ip);
    const token = newSession();
    return json(res, 200, { ok: true, isDefault: store.isDefaultPassword() }, {
      'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}`
    });
  }

  if (p === '/api/admin/session' && req.method === 'GET') {
    return json(res, 200, { auth: validSession(req), isDefault: store.isDefaultPassword() });
  }

  if (p === '/api/admin/logout' && req.method === 'POST') {
    const token = parseCookies(req).sid;
    if (token) sessions.delete(token);
    return json(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }

  // ما بعد هذا السطر يتطلب تسجيل دخول
  if (!validSession(req)) return json(res, 401, { error: 'الرجاء تسجيل الدخول' });

  if (p === '/api/admin/content' && req.method === 'GET') {
    return json(res, 200, store.getContent());
  }

  if (p === '/api/admin/content' && req.method === 'PUT') {
    let b;
    try { b = await readJSONBody(req, 4 * 1024 * 1024); } catch (e) { return json(res, 400, { error: 'المحتوى كبير أو غير صالح' }); }
    if (!b || !b.site || !Array.isArray(b.services)) return json(res, 400, { error: 'بنية المحتوى غير صحيحة' });
    store.saveContent(b);
    return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
  }

  if (p === '/api/admin/upload' && req.method === 'POST') {
    let b;
    try { b = await readJSONBody(req, 12 * 1024 * 1024); } catch (e) { return json(res, 413, { error: 'حجم الصورة كبير. الحد 8 ميغابايت.' }); }
    const m = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(String(b.dataUrl || ''));
    if (!m) return json(res, 400, { error: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.' });
    const buf = Buffer.from(m[3], 'base64');
    if (buf.length > 8 * 1024 * 1024) return json(res, 413, { error: 'حجم الصورة كبير. الحد 8 ميغابايت.' });
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const prefix = /^[a-z0-9\-]{1,30}$/.test(String(b.prefix || '')) ? b.prefix : 'img';
    const name = `${prefix}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(store.UPLOADS_DIR, name), buf);
    return json(res, 200, { ok: true, url: '/uploads/' + name });
  }

  if (p === '/api/admin/uploads' && req.method === 'GET') {
    let files = [];
    try {
      files = fs.readdirSync(store.UPLOADS_DIR)
        .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
        .map(f => ({ url: '/uploads/' + f, size: fs.statSync(path.join(store.UPLOADS_DIR, f)).size }))
        .sort((a, b) => a.url < b.url ? 1 : -1);
    } catch (e) {}
    return json(res, 200, files);
  }

  if (p === '/api/admin/requests' && req.method === 'GET') {
    return json(res, 200, store.getRequests());
  }

  if (/^\/api\/admin\/requests\/[a-f0-9]+$/.test(p) && req.method === 'PATCH') {
    const id = p.split('/').pop();
    let b; try { b = await readJSONBody(req, 4096); } catch (e) { return json(res, 400, { error: 'طلب غير صالح' }); }
    const r = store.updateRequest(id, { status: String(b.status || '').slice(0, 20) });
    return r ? json(res, 200, r) : json(res, 404, { error: 'غير موجود' });
  }

  if (/^\/api\/admin\/requests\/[a-f0-9]+$/.test(p) && req.method === 'DELETE') {
    store.deleteRequest(p.split('/').pop());
    return json(res, 200, { ok: true });
  }

  if (p === '/api/admin/password' && req.method === 'POST') {
    let b; try { b = await readJSONBody(req, 4096); } catch (e) { return json(res, 400, { error: 'طلب غير صالح' }); }
    if (!store.verifyPassword(String(b.current || ''))) return json(res, 401, { error: 'كلمة المرور الحالية غير صحيحة' });
    const next = String(b.next || '');
    if (next.length < 8) return json(res, 400, { error: 'كلمة المرور الجديدة يجب أن تكون 8 خانات فأكثر' });
    store.setPassword(next);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/admin/backups' && req.method === 'GET') {
    return json(res, 200, store.listBackups());
  }

  if (p === '/api/admin/restore' && req.method === 'POST') {
    let b; try { b = await readJSONBody(req, 4096); } catch (e) { return json(res, 400, { error: 'طلب غير صالح' }); }
    try { store.restoreBackup(String(b.file || '')); return json(res, 200, { ok: true }); }
    catch (e) { return json(res, 400, { error: e.message }); }
  }

  return json(res, 404, { error: 'مسار غير معروف' });
}

/* ---------------- الخادم ---------------- */

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://' + (req.headers.host || 'localhost')); }
  catch (e) { return send(res, 400, 'طلب غير صالح'); }

  let p = decodeURIComponent(url.pathname);

  try {
    if (p.startsWith('/api/')) return await handleApi(req, res, url);

    // ملفات ثابتة
    if (p.startsWith('/public/')) {
      const f = safeJoin(path.join(ROOT, 'public'), p.slice('/public/'.length));
      // الخطوط لا تتغير: تخزين طويل
      const maxAge = p.startsWith('/public/fonts/') ? 31536000 : 86400;
      return f ? serveStatic(res, f, maxAge) : send(res, 400, 'طلب غير صالح');
    }
    if (p.startsWith('/uploads/')) {
      const f = safeJoin(store.UPLOADS_DIR, p.slice('/uploads/'.length));
      return f ? serveStatic(res, f, 604800) : send(res, 400, 'طلب غير صالح');
    }
    if (p === '/admin' ) return redirect(res, '/admin/', 302);
    if (p === '/admin/') return serveStatic(res, path.join(ROOT, 'admin', 'index.html'), 0);
    if (p.startsWith('/admin/')) {
      const f = safeJoin(path.join(ROOT, 'admin'), p.slice('/admin/'.length));
      return f ? serveStatic(res, f, 0) : send(res, 400, 'طلب غير صالح');
    }

    const c = store.getContent();

    if (p === '/sitemap.xml') return send(res, 200, sitemap(c), { 'Content-Type': 'application/xml; charset=utf-8' });
    if (p === '/robots.txt') return send(res, 200, robots(c), { 'Content-Type': 'text/plain; charset=utf-8' });

    // توحيد الشرطة الأخيرة
    if (p !== '/' && !p.endsWith('/')) return redirect(res, p + '/' + url.search, 301);

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'طريقة غير مسموحة');

    const html = (() => {
      switch (p) {
        case '/': return P.home(c);
        case '/about/': return P.about(c);
        case '/services/': return P.servicesIndex(c);
        case '/health-insurance/': return P.insurance(c);
        case '/education/': return P.education(c);
        case '/contact/': return P.contact(c);
        case '/editorial-policy/': return P.simplePage(c, 'editorial', '/editorial-policy/');
        case '/privacy/': return P.simplePage(c, 'privacy', '/privacy/');
      }
      const m = /^\/services\/([a-z0-9\-]+)\/$/.exec(p);
      if (m) {
        const sv = c.services.find(s => s.slug === m[1]);
        if (sv) return P.service(c, sv);
      }
      return null;
    })();

    if (!html) return send(res, 404, P.notFound(c));
    return send(res, 200, html, { 'Cache-Control': 'no-cache' });

  } catch (err) {
    console.error('خطأ:', err);
    return send(res, 500, 'حدث خطأ في الخادم');
  }
});

store.getConfig(); // ينشئ كلمة المرور عند أول تشغيل ويطبعها

server.listen(PORT, HOST, () => {
  console.log('\n  موقع ' + store.getContent().site.clinicName);
  console.log('  الموقع:        http://localhost:' + PORT + '/');
  console.log('  لوحة التحكم:   http://localhost:' + PORT + '/admin/');
  console.log('  للإيقاف: Ctrl + C\n');
});
