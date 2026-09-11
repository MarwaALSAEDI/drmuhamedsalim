'use strict';
/* ============================================================
   القالب العام: التهريب، الأيقونات، الترويسة، التذييل، Schema
   ============================================================ */

const DAY_MAP = {
  'السبت': 'Saturday', 'الأحد': 'Sunday', 'الاثنين': 'Monday', 'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday'
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function paras(text) {
  return String(text || '').split(/\n{2,}/).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');
}

function fmtTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
  if (!m) return esc(t);
  const h = parseInt(m[1], 10);
  const suffix = h < 12 ? 'ص' : 'م';
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${m[2]} ${suffix}`;
}

function openDays(hours) {
  return (hours && hours.days ? hours.days : []).filter(d => d.open);
}

function hoursSummary(hours) {
  const open = openDays(hours);
  if (!open.length) return 'يُرجى الاتصال لمعرفة أوقات الدوام.';
  const same = open.every(d => d.from === open[0].from && d.to === open[0].to);
  if (same) return `${open.map(d => d.day).join('، ')} — ${fmtTime(open[0].from)} إلى ${fmtTime(open[0].to)}`;
  return open.map(d => `${d.day} ${fmtTime(d.from)}-${fmtTime(d.to)}`).join('، ');
}

function ytId(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let m = /[?&]v=([A-Za-z0-9_-]{11})/.exec(s);
  if (m) return m[1];
  m = /(?:youtu\.be\/|\/shorts\/|\/live\/|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/.exec(s);
  return m ? m[1] : '';
}

/* ---------------- الأيقونات: خط رفيع، طابع طبي ---------------- */

const SVG = (d, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${d}</svg>`;

const ICON = {
  phone:    SVG('<path d="M6.8 3.8h2.9l1.4 3.5-1.8 1.3a11.6 11.6 0 0 0 5 5l1.3-1.8 3.5 1.4v2.9a1.7 1.7 0 0 1-1.9 1.7A15.2 15.2 0 0 1 5.1 5.7a1.7 1.7 0 0 1 1.7-1.9Z"/>'),
  whatsapp: SVG('<path d="M20 12a8 8 0 0 1-11.9 6.9L4 20l1.2-3.9A8 8 0 1 1 20 12Z"/><path d="M9.2 9.6c0 2.9 2.3 5.2 5.2 5.2.5 0 .9-.4.9-.9l-1.5-.8-.9.9a5.3 5.3 0 0 1-2.4-2.4l.9-.9-.8-1.5c-.5 0-1.4 0-1.4.4Z"/>'),
  pin:      SVG('<path d="M12 20.5s6.5-5.2 6.5-10.2a6.5 6.5 0 1 0-13 0c0 5 6.5 10.2 6.5 10.2Z"/><circle cx="12" cy="10" r="2.4"/>'),
  clock:    SVG('<circle cx="12" cy="12" r="8.3"/><path d="M12 7.6V12l2.9 1.7"/>'),
  calendar: SVG('<rect x="3.8" y="5.2" width="16.4" height="15" rx="2.2"/><path d="M8.2 3.3v3.8M15.8 3.3v3.8M3.8 10h16.4"/>'),
  arrow:    SVG('<path d="M13.5 5.8 7.6 12l5.9 6.2M18 12H7.8"/>', 'width="18" height="18"'),
  check:    SVG('<path d="m5.5 12.4 4.2 4.2L18.5 7.6"/>'),
  shield:   SVG('<path d="M12 3.4 5.5 6v5.3c0 4.1 2.7 7.3 6.5 8.9 3.8-1.6 6.5-4.8 6.5-8.9V6Z"/><path d="m9.4 11.8 1.9 1.9 3.4-3.4"/>'),
  play:     SVG('<path d="M8.5 5.8v12.4L19 12Z" fill="currentColor" stroke="none"/>'),
  instagram:SVG('<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.6"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.8" cy="7.2" r=".9" fill="currentColor" stroke="none"/>'),
  facebook: SVG('<path d="M14.4 8.6h2.3V5.5h-2.4c-2.2 0-3.5 1.4-3.5 3.6v1.5H8.6v3h2.2V21h3.1v-7.4h2.3l.4-3h-2.7V9.5c0-.6.2-.9.5-.9Z"/>'),
  youtube:  SVG('<rect x="3" y="6.2" width="18" height="11.6" rx="3.6"/><path d="m11 9.9 3.5 2.1-3.5 2.1Z" fill="currentColor" stroke="none"/>'),
  menu:     SVG('<path d="M4 7.5h16M4 12h16M4 16.5h10"/>'),
  close:    SVG('<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/>'),
  up:       SVG('<path d="m6.5 14.5 5.5-5.5 5.5 5.5"/>'),
  doc:      SVG('<path d="M14.2 3.8H7.8A1.8 1.8 0 0 0 6 5.6v12.8a1.8 1.8 0 0 0 1.8 1.8h8.4a1.8 1.8 0 0 0 1.8-1.8V7.6Z"/><path d="M14.2 3.8v3.2a.6.6 0 0 0 .6.6H18M9.2 12.2h5.6M9.2 15.8h3.8"/>'),
  chevron:  SVG('<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>'),
  stethos:  SVG('<path d="M6 4v4.5a4 4 0 0 0 8 0V4"/><path d="M6 4H4.6M14 4h1.4M10 12.5v2.2a4.3 4.3 0 0 0 8.6 0v-1.3"/><circle cx="18.6" cy="11.6" r="1.8"/>'),
  pulse:    SVG('<path d="M3.5 12.3h3.3l1.9-4.6 3 10 2.2-5.4h6.6"/>'),
  user:     SVG('<circle cx="12" cy="8.2" r="3.8"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  spark:    SVG('<path d="M12 4.2v3.4M12 16.4v3.4M4.2 12h3.4M16.4 12h3.4M6.9 6.9l2.4 2.4M14.7 14.7l2.4 2.4M17.1 6.9l-2.4 2.4M9.3 14.7l-2.4 2.4"/>')
};

/* ---------------- الفيديو ---------------- */

function videoCover(v, cls) {
  const c = cls || 'h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover/v:scale-[1.04]';
  if (v.cover) {
    return `<img src="${esc(v.cover)}" alt="" width="640" height="360" loading="lazy" decoding="async" class="${c}">`;
  }
  const id = ytId(v.url);
  if (id) {
    return `<img src="https://i.ytimg.com/vi/${esc(id)}/maxresdefault.jpg"
      onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg'"
      alt="" width="640" height="360" loading="lazy" decoding="async" class="${c}">`;
  }
  return `<span class="grid h-full w-full place-items-center bg-navy-900">
    <span class="block h-10 w-10 text-white/40">${ICON.play}</span></span>`;
}

function thumbUrl(v, base) {
  if (v.cover) return (base || '') + v.cover;
  const id = ytId(v.url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

function playOverlay(label) {
  return `<span class="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent"></span>
    <span class="pointer-events-none absolute inset-0 grid place-items-center">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-brand-700 shadow-[var(--shadow-lift)]
                   transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/v:scale-105">
        <span class="block h-6 w-6 ps-0.5">${ICON.play}</span>
      </span>
    </span>
    ${label ? `<span class="pointer-events-none absolute bottom-4 start-4 text-[.82rem] font-medium text-white/90">${esc(label)}</span>` : ''}`;
}

function videoEmbedHTML(v) {
  const id = ytId(v.url);
  if (id) {
    return `<div class="video-facade group/v relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-navy-950"
      data-embed="https://www.youtube-nocookie.com/embed/${esc(id)}?rel=0" role="button" tabindex="0"
      aria-label="تشغيل الفيديو: ${esc(v.title)}">
      ${videoCover(v)}${playOverlay('شاهد على يوتيوب')}
    </div>`;
  }
  if (v.url) {
    return `<a href="${esc(v.url)}" rel="noopener" target="_blank"
      class="video-facade group/v relative block aspect-video overflow-hidden rounded-lg bg-navy-950"
      aria-label="مشاهدة الفيديو: ${esc(v.title)}">
      ${videoCover(v)}${playOverlay('مشاهدة الفيديو')}
    </a>`;
  }
  if (v.cover) {
    return `<div class="relative aspect-video overflow-hidden rounded-lg bg-navy-950">${videoCover(v)}</div>`;
  }
  return '';
}

function videoCard(v) {
  return `<article class="group reveal">
    ${videoEmbedHTML(v)}
    <h3 class="mt-5 text-[1.15rem]">${esc(v.title)}</h3>
    ${v.summary ? `<p class="mt-2 text-[.98rem] leading-[1.9] text-navy-500">${esc(v.summary)}</p>` : ''}
    ${v.transcript ? `<details class="group/t mt-3">
      <summary class="flex cursor-pointer list-none items-center gap-2 text-[.9rem] font-medium text-brand-700">
        التفريغ النصي <span class="block h-4 w-4 transition-transform duration-300 group-open/t:rotate-180">${ICON.chevron}</span>
      </summary>
      <div class="prose-ar mt-3 border-s-2 border-line ps-4 text-[.97rem]">${paras(v.transcript)}</div>
    </details>` : ''}
  </article>`;
}

/* ---------------- البيانات المنظمة ---------------- */

function schemaGraph(c, page) {
  const s = c.site;
  const base = s.domain.replace(/\/+$/, '');
  const g = [];

  g.push({
    '@type': 'WebSite', '@id': base + '/#website',
    name: s.clinicName, alternateName: s.brandEn, url: base + '/', inLanguage: 'ar'
  });

  const clinic = {
    '@type': 'MedicalClinic', '@id': base + '/#clinic',
    name: s.clinicName, alternateName: s.brandEn, url: base + '/', telephone: s.phoneIntl,
    address: {
      '@type': 'PostalAddress', streetAddress: s.address,
      addressLocality: s.addressLocality || 'بغداد', addressCountry: 'IQ'
    },
    medicalSpecialty: 'Urologic',
    openingHoursSpecification: openDays(c.hours).map(d => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'https://schema.org/' + (DAY_MAP[d.day] || 'Saturday'),
      opens: d.from, closes: d.to
    }))
  };
  if (s.mapsUrl) clinic.hasMap = s.mapsUrl;
  g.push(clinic);

  const sameAs = [];
  if (s.instagram) sameAs.push('https://www.instagram.com/' + s.instagram.replace(/^@/, ''));
  if (s.facebook) sameAs.push(s.facebook);
  if (s.youtube) sameAs.push(s.youtube);

  const person = {
    '@type': 'Person', '@id': base + '/#doctor', name: s.doctorName,
    jobTitle: 'أخصائي جراحة الكلى والمسالك البولية وعقم الرجال',
    url: base + '/about/', worksFor: { '@id': base + '/#clinic' }
  };
  if (sameAs.length) person.sameAs = sameAs;
  if (c.hero && c.hero.image) person.image = base + c.hero.image;
  g.push(person);

  if (page && page.extra) g.push(...page.extra);
  return { '@context': 'https://schema.org', '@graph': g };
}

function breadcrumb(base, trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name, item: base + t.url
    }))
  };
}

/* ---------------- الترويسة ---------------- */

const NAV = [
  { url: '/', name: 'الرئيسية' },
  { url: '/about/', name: 'عن الطبيب' },
  { url: '/services/', name: 'الخدمات' },
  { url: '/health-insurance/', name: 'الضمان الصحي' },
  { url: '/education/', name: 'التثقيف الطبي' },
  { url: '/contact/', name: 'الحجز والموقع' }
];

/* الشعار: حرف «م» هندسي داخل قوس رعاية — مربع تركوازي يعمل على الفاتح والداكن */
function monogram(size) {
  const s = size || 'h-11 w-11';
  return `<span class="grid ${s} shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-600">
    <svg viewBox="0 0 40 40" class="h-full w-full" fill="none" aria-hidden="true">
      <path d="M9.5 28.5a13 13 0 1 1 21 0" stroke="#7EDBE8" stroke-width="2.1" stroke-linecap="round"/>
      <circle cx="20" cy="17.4" r="4.3" stroke="#FFFFFF" stroke-width="2.4"/>
      <path d="M20 21.7v7.4" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  </span>`;
}

function header(c, active) {
  const s = c.site;
  return `<a class="sr-only focus:not-sr-only focus:absolute focus:end-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg" href="#main">تخطَّ إلى المحتوى</a>

<header id="siteHeader" class="sticky top-0 z-50 border-b border-transparent transition-[background-color,border-color,box-shadow,padding] duration-300 no-print" data-at-top="true">
  <div class="wrap flex items-center justify-between gap-6 py-4 transition-[padding] duration-300" id="headerInner">

    <!-- الهوية: يمين -->
    <a class="group flex shrink-0 items-center gap-3" href="/" aria-label="${esc(s.clinicName)} — الصفحة الرئيسية">
      ${monogram()}
      <span class="leading-tight">
        <span class="block text-[1.02rem] font-bold text-navy-900">${esc(s.doctorName)}</span>
        <span class="hidden text-[.78rem] text-navy-400 sm:block">أخصائي جراحة الكلى والمسالك البولية</span>
      </span>
    </a>

    <!-- التنقل: وسط -->
    <nav class="hidden items-center gap-0.5 lg:flex" aria-label="القائمة الرئيسية">
      ${NAV.map(n => `<a href="${n.url}" ${active === n.url ? 'aria-current="page"' : ''}
        class="relative px-3.5 py-2 text-[.95rem] transition-colors duration-200 ${active === n.url ? 'font-semibold text-navy-900' : 'text-navy-500 hover:text-navy-900'}">
        ${esc(n.name)}
        ${active === n.url ? '<span class="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand-400"></span>' : ''}
      </a>`).join('\n      ')}
    </nav>

    <!-- الإجراءات: يسار -->
    <div class="hidden shrink-0 items-center gap-2.5 lg:flex">
      <a class="flex items-center gap-2 text-[.92rem] font-medium text-navy-700 transition-colors hover:text-brand-700" href="tel:${esc(s.phoneIntl)}">
        <span class="block h-4 w-4 text-brand-600">${ICON.phone}</span>
        <span dir="ltr">${esc(s.phoneDisplay)}</span>
      </a>
      <a class="btn btn-primary btn-sm" href="/contact/">احجز موعداً</a>
    </div>

    <!-- الموبايل -->
    <div class="flex items-center gap-2 lg:hidden">
      <a class="grid h-11 w-11 place-items-center rounded-lg border border-line-strong text-brand-700 transition hover:border-brand-400"
         href="tel:${esc(s.phoneIntl)}" aria-label="اتصل بالعيادة">
        <span class="block h-5 w-5">${ICON.phone}</span>
      </a>
      <button id="navToggle" class="grid h-11 w-11 place-items-center rounded-lg border border-line-strong text-navy-900 transition hover:border-brand-400"
        aria-expanded="false" aria-controls="mobileNav" aria-label="فتح القائمة">
        <span class="block h-5 w-5" id="navToggleIcon">${ICON.menu}</span>
      </button>
    </div>
  </div>
</header>

<!-- قائمة الموبايل: لوحة كاملة -->
<div id="mobileNav" class="fixed inset-0 z-[60] hidden lg:hidden no-print" role="dialog" aria-modal="true" aria-label="القائمة">
  <div class="absolute inset-0 bg-navy-950/45 opacity-0 transition-opacity duration-300" id="navBackdrop"></div>
  <nav class="absolute inset-y-0 end-0 flex w-[min(88vw,340px)] translate-x-full flex-col bg-white shadow-[var(--shadow-deep)] transition-transform duration-300 ease-[var(--ease-out-soft)]" id="navPanel">
    <div class="flex items-center justify-between border-b border-line px-5 py-4">
      <span class="flex items-center gap-3">${monogram('h-10 w-10')}
        <span class="text-[.98rem] font-bold text-navy-900">${esc(s.doctorName)}</span>
      </span>
      <button id="navClose" class="grid h-10 w-10 place-items-center rounded-lg border border-line text-navy-700 transition hover:border-brand-400" aria-label="إغلاق القائمة">
        <span class="block h-5 w-5">${ICON.close}</span>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-5 py-2">
      ${NAV.map(n => `<a href="${n.url}"
        class="flex items-center justify-between border-b border-line py-4 text-[1.02rem] transition-colors last:border-0 ${active === n.url ? 'font-semibold text-brand-700' : 'text-navy-700 hover:text-brand-700'}">
        ${esc(n.name)}<span class="block h-4 w-4 text-brand-400">${ICON.arrow}</span>
      </a>`).join('\n      ')}
    </div>

    <div class="border-t border-line p-5">
      <a class="btn btn-primary w-full" href="/contact/">
        <span class="block h-4 w-4">${ICON.calendar}</span>احجز موعداً</a>
      <a class="btn btn-line mt-2.5 w-full" href="tel:${esc(s.phoneIntl)}">
        <span class="block h-4 w-4">${ICON.phone}</span><span dir="ltr">${esc(s.phoneDisplay)}</span></a>
      <p class="mt-4 text-[.85rem] leading-relaxed text-navy-400">${esc(s.address)}</p>
    </div>
  </nav>
</div>`;
}

/* ---------------- التذييل ---------------- */

function footer(c) {
  const s = c.site;
  const socials = [];
  if (s.instagram) socials.push({ url: 'https://www.instagram.com/' + s.instagram.replace(/^@/, ''), icon: ICON.instagram, name: 'إنستغرام' });
  if (s.facebook) socials.push({ url: s.facebook, icon: ICON.facebook, name: 'فيسبوك' });
  if (s.youtube) socials.push({ url: s.youtube, icon: ICON.youtube, name: 'يوتيوب' });

  const col = (title, items) => `<div>
    <h2 class="mb-5 text-[.88rem] font-semibold uppercase tracking-wider text-brand-200">${esc(title)}</h2>
    <ul class="space-y-3 text-[.94rem]">${items}</ul>
  </div>`;

  return `<footer class="relative overflow-hidden bg-navy-950 text-navy-200 no-print">
  <div class="pointer-events-none absolute -top-40 start-1/3 h-80 w-80 glow-deep"></div>

  <div class="wrap relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.9fr_1fr]">
    <div>
      <div class="flex items-center gap-3">${monogram()}
        <span class="text-[1.05rem] font-bold text-white">${esc(s.doctorName)}</span>
      </div>
      <p class="mt-5 max-w-xs text-[.94rem] leading-[1.9] text-navy-300">${esc(s.tagline)}</p>
      <p class="mt-2 text-[.82rem] text-navy-300">${esc(s.brandEn)}</p>
      ${socials.length ? `<div class="mt-6 flex gap-2.5">
        ${socials.map(x => `<a href="${esc(x.url)}" rel="noopener me" target="_blank" aria-label="${esc(x.name)}"
          class="grid h-10 w-10 place-items-center rounded-lg border border-white/12 text-navy-200 transition-colors duration-200 hover:border-brand-400 hover:text-brand-200">
          <span class="block h-[18px] w-[18px]">${x.icon}</span></a>`).join('\n        ')}
      </div>` : ''}
    </div>

    ${col('تصفّح', NAV.slice(1).map(n =>
      `<li><a class="text-navy-300 transition-colors hover:text-white" href="${n.url}">${esc(n.name)}</a></li>`).join(''))}

    ${col('الخدمات', c.services.slice(0, 5).map(sv =>
      `<li><a class="text-navy-300 transition-colors hover:text-white" href="/services/${esc(sv.slug)}/">${esc(sv.name)}</a></li>`).join('') +
      `<li><a class="link-more text-brand-200 hover:text-brand-100" href="/services/">كل الخدمات</a></li>`)}

    <div>
      <h2 class="mb-5 text-[.88rem] font-semibold uppercase tracking-wider text-brand-200">تواصل</h2>
      <ul class="space-y-4 text-[.94rem]">
        <li><a class="flex items-center gap-3 text-white transition-colors hover:text-brand-200" href="tel:${esc(s.phoneIntl)}">
          <span class="block h-[18px] w-[18px] text-brand-400">${ICON.phone}</span><span dir="ltr" class="font-semibold">${esc(s.phoneDisplay)}</span></a></li>
        ${s.whatsappEnabled && s.whatsapp ? `<li><a class="flex items-center gap-3 text-navy-300 transition-colors hover:text-white" href="https://wa.me/${esc(s.whatsapp)}" rel="noopener">
          <span class="block h-[18px] w-[18px] text-brand-400">${ICON.whatsapp}</span>واتساب</a></li>` : ''}
        <li class="flex items-start gap-3 text-navy-300">
          <span class="mt-1 block h-[18px] w-[18px] shrink-0 text-brand-400">${ICON.pin}</span><span class="leading-relaxed">${esc(s.address)}</span></li>
        <li class="flex items-start gap-3 text-navy-300">
          <span class="mt-1 block h-[18px] w-[18px] shrink-0 text-brand-400">${ICON.clock}</span><span class="leading-relaxed">${esc(hoursSummary(c.hours))}</span></li>
      </ul>
    </div>
  </div>

  <div class="wrap relative">
    <div class="rule-dark"></div>
    <div class="flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between">
      <p class="text-[.87rem] leading-relaxed text-navy-300">${esc(s.footerNote)}</p>
      <div class="flex shrink-0 gap-5 text-[.87rem]">
        <a class="text-navy-300 transition-colors hover:text-white" href="/editorial-policy/">سياسة التحرير الطبي</a>
        <a class="text-navy-300 transition-colors hover:text-white" href="/privacy/">الخصوصية</a>
      </div>
    </div>
    <p class="pb-8 text-[.82rem] leading-relaxed text-navy-300">${esc(s.medicalDisclaimer)}</p>
  </div>
</footer>

<!-- شريط الإجراء في الموبايل -->
<div class="fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-line bg-white/96 p-3 backdrop-blur-lg lg:hidden no-print">
  <a class="btn btn-primary flex-1" href="/contact/"><span class="block h-4 w-4">${ICON.calendar}</span>احجز موعداً</a>
  <a class="btn btn-line flex-1" href="tel:${esc(s.phoneIntl)}"><span class="block h-4 w-4">${ICON.phone}</span>اتصال</a>
</div>

<button id="toTop" class="fixed bottom-24 end-5 z-40 grid h-11 w-11 translate-y-3 place-items-center rounded-lg bg-navy-900 text-white opacity-0 shadow-[var(--shadow-lift)] transition-all duration-300 hover:bg-navy-800 lg:bottom-8 no-print" aria-label="العودة إلى الأعلى">
  <span class="block h-5 w-5">${ICON.up}</span>
</button>`;
}

/* ---------------- القالب ---------------- */

function layout(c, page) {
  const s = c.site;
  const base = s.domain.replace(/\/+$/, '');
  const canonical = base + (page.path || '/');
  const ogImage = c.hero && c.hero.image ? base + c.hero.image : '';
  const hoursData = JSON.stringify((c.hours && c.hours.days) || []);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.meta)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#071C2C">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_IQ">
<meta property="og:site_name" content="${esc(s.clinicName)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.meta)}">
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/public/favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="/public/fonts/ibm-plex-sans-arabic-arabic-400.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/public/fonts/ibm-plex-sans-arabic-arabic-700.woff2" crossorigin>
<link rel="stylesheet" href="/public/tailwind.css">
<script type="application/ld+json">${JSON.stringify(schemaGraph(c, page))}</script>
</head>
<body class="font-sans">
${header(c, page.path)}
<main id="main">
${page.body}
</main>
${footer(c)}
<script type="application/json" id="clinic-hours">${hoursData}</script>
<script src="/public/site.js" defer></script>
</body>
</html>`;
}

module.exports = {
  esc, paras, fmtTime, hoursSummary, openDays, ytId,
  videoCard, videoEmbedHTML, videoCover, thumbUrl, layout, breadcrumb,
  NAV, DAY_MAP, ICON, SVG, monogram
};
