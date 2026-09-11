'use strict';
/* ============================================================
   مكوّنات واجهة قابلة لإعادة الاستخدام
   SectionHeading · Hero · DoctorIntro · ServiceCard · SpecialtyCard
   TrustSection · ArticleCard · BookingForm · ContactSection
   ============================================================ */

const H = require('./html');
const { esc, paras, fmtTime, hoursSummary, ICON } = H;

/* ---------- أيقونة ولون لكل خدمة ---------- */

const SERVICE_ICON = {
  'kidney-stones':        H.SVG('<path d="M14.3 4c-3.4 0-6.2 3-6.2 6.8 0 1.8-.6 2.8-1.4 3.6-.8.7-1.3 1.4-1.3 2.4 0 1.5 1.3 2.6 2.9 2.6 4.6 0 9.4-3.7 9.4-8.8 0-3.8-2.2-6.6-3.4-6.6Z"/><circle cx="11.8" cy="10.8" r="1.2"/><circle cx="15" cy="13.6" r=".9"/>'),
  'varicocele':           H.SVG('<path d="M12 3.6v5.8"/><path d="M12 9.4c0 1.9-2.3 2.4-2.3 4.2S12 16.9 12 18.8"/><path d="M12 9.4c0 1.9 2.3 2.4 2.3 4.2S12 16.9 12 18.8"/><circle cx="12" cy="20.2" r="1.3"/>'),
  'male-infertility':     H.SVG('<circle cx="8.8" cy="15.2" r="3.8"/><path d="M11.5 12.5 17.8 6.2M14.6 6.2h3.2v3.2"/>'),
  'erectile-dysfunction': H.SVG('<path d="M3.6 12.4h3l1.7-3.8 2.5 7.6 1.9-3.8h7.7"/>'),
  'penile-implants':      H.SVG('<circle cx="12" cy="12" r="8.2"/><path d="M6.6 17.4 17.4 6.6M14.8 5.2 18.8 9.2M5.2 14.8 9.2 18.8"/>'),
  'penile-filler':        H.SVG('<path d="m14.6 4.8 4.6 4.6M16.9 7.1 8.8 15.2 5.4 18.6l.9-4.2 8.1-8.1"/><path d="m11.2 9.6 2.8 2.8"/>'),
  'prostate':             H.SVG('<path d="M12 3.4 5.5 6v5.3c0 4.1 2.7 7.3 6.5 8.9 3.8-1.6 6.5-4.8 6.5-8.9V6Z"/><path d="m9.4 11.8 1.9 1.9 3.4-3.4"/>'),
  _default:               H.SVG('<circle cx="12" cy="12" r="8.2"/><path d="M12 8.4v7.2M8.4 12h7.2"/>')
};

function serviceIcon(slug) { return SERVICE_ICON[slug] || SERVICE_ICON._default; }

/* ---------- SectionHeading ---------- */

function sectionHeading(opts) {
  const dark = opts.dark;
  const center = opts.center;
  return `<div class="${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} mb-12 lg:mb-14">
    ${opts.eyebrow ? `<span class="eyebrow reveal ${dark ? 'eyebrow-dark' : ''} ${center ? 'justify-center' : ''}">${esc(opts.eyebrow)}</span>` : ''}
    <h2 class="h-section reveal mt-4 ${dark ? 'text-white' : ''}">${esc(opts.title)}</h2>
    ${opts.sub ? `<p class="reveal mt-4 ${dark ? 'lead-dark' : 'lead'}">${esc(opts.sub)}</p>` : ''}
  </div>`;
}

/* ---------- أزرار الإجراء ---------- */

function ctaGroup(c, opts) {
  opts = opts || {};
  const s = c.site;
  const hero = c.hero || {};
  const dark = opts.dark;
  return `<div class="flex flex-wrap items-center gap-3 ${opts.center ? 'justify-center' : ''}">
    <a class="btn ${dark ? 'btn-accent' : 'btn-primary'}" href="/contact/">
      <span class="block h-[18px] w-[18px]">${ICON.calendar}</span>${esc(hero.primaryBtn || 'احجز موعداً')}</a>
    <a class="btn ${dark ? 'btn-onDark' : 'btn-line'}" href="tel:${esc(s.phoneIntl)}">
      <span class="block h-[18px] w-[18px]">${ICON.phone}</span>${esc(hero.secondaryBtn || 'اتصل بالعيادة')}</a>
    ${opts.maps && s.mapsUrl ? `<a class="btn ${dark ? 'btn-onDark' : 'btn-line'}" href="${esc(s.mapsUrl)}" rel="noopener" target="_blank">
      <span class="block h-[18px] w-[18px]">${ICON.pin}</span>الاتجاهات</a>` : ''}
  </div>`;
}

/* ---------- Hero ---------- */

function hero(c) {
  const s = c.site;
  const h = c.hero || {};
  const open = H.openDays(c.hours);
  const daysText = open.length ? open.map(d => d.day).join('، ') : '—';
  const timeText = open.length ? `${fmtTime(open[0].from)} – ${fmtTime(open[0].to)}` : '—';

  const portrait = h.image
    ? `<img src="${esc(h.image)}" alt="${esc(h.imageAlt || s.doctorName)}" width="900" height="1125"
         fetchpriority="high" decoding="async"
         class="h-full w-full object-cover object-top">`
    : `<div class="grid h-full w-full place-items-center bg-white/[.04] p-8 text-center text-[.94rem] text-navy-300"
         role="img" aria-label="${esc(h.imageAlt || 'صورة الطبيب')}">ارفع صورة البداية من لوحة التحكم</div>`;

  const fact = (icon, label, value, href) => `<div class="flex items-start gap-3">
    <span class="mt-0.5 block h-[18px] w-[18px] shrink-0 text-brand-400">${icon}</span>
    <span class="min-w-0">
      <span class="block text-[.8rem] text-navy-300">${esc(label)}</span>
      ${href
        ? `<a href="${esc(href)}" dir="ltr" class="block truncate text-[.96rem] font-medium text-white transition-colors hover:text-brand-200">${esc(value)}</a>`
        : `<span class="block text-[.96rem] font-medium text-white">${esc(value)}</span>`}
    </span>
  </div>`;

  return `<section class="relative overflow-hidden bg-navy-950">
  <!-- خلفية: تدرّج + شبكة + توهج هادئ -->
  <div class="absolute inset-0 bg-[linear-gradient(160deg,#071C2C_0%,#0B2638_52%,#0A3242_100%)]"></div>
  <div class="absolute inset-0 grid-fine opacity-70"></div>
  <div class="pointer-events-none absolute -top-32 -start-24 h-[34rem] w-[34rem] glow-deep"></div>
  <div class="pointer-events-none absolute bottom-[-12rem] end-[-6rem] h-[28rem] w-[28rem] glow-cyan"></div>
  <!-- قوس هندسي رفيع -->
  <svg class="pointer-events-none absolute -end-40 top-1/2 hidden h-[42rem] w-[42rem] -translate-y-1/2 text-brand-400/12 lg:block" viewBox="0 0 400 400" fill="none" aria-hidden="true">
    <circle cx="200" cy="200" r="199" stroke="currentColor"/>
    <circle cx="200" cy="200" r="150" stroke="currentColor" stroke-opacity=".65"/>
    <circle cx="200" cy="200" r="101" stroke="currentColor" stroke-opacity=".4"/>
  </svg>

  <div class="wrap relative">
    <div class="grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,.95fr)] lg:gap-16 lg:py-20 xl:py-24">

      <!-- المحتوى -->
      <div class="animate-fade-up">
        <span class="eyebrow eyebrow-dark">${esc(h.eyebrow || s.tagline)}</span>

        <h1 class="h-hero mt-5 text-white">${esc(h.h1)}</h1>

        <p class="lead-dark mt-6 max-w-xl">${esc(h.lead)}</p>

        <div class="mt-9">${ctaGroup(c, { dark: true })}</div>

        <!-- معلومات أساسية: عمودان لتفادي انكسار قائمة الأيام -->
        <div class="mt-10 grid max-w-xl gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-2">
          ${fact(ICON.calendar, 'أيام الدوام', daysText)}
          ${fact(ICON.clock, 'ساعات العمل', timeText)}
          ${fact(ICON.pin, 'الموقع', s.addressLocality || 'بغداد')}
          ${fact(ICON.phone, 'للحجز', s.phoneDisplay, 'tel:' + s.phoneIntl)}
        </div>
      </div>

      <!-- الصورة -->
      <div class="relative animate-fade-up lg:justify-self-end" style="animation-delay:.1s">
        <div class="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
          <div class="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-navy-900">
            ${portrait}
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950/80 to-transparent"></div>
          </div>
          ${(h.chips || []).length ? `<div class="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
            ${(h.chips || []).map(x => `<span class="rounded-md border border-white/15 bg-navy-950/55 px-3 py-1.5 text-[.8rem] font-medium text-navy-100 backdrop-blur-sm">${esc(x)}</span>`).join('\n            ')}
          </div>` : ''}
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- DoctorIntro ---------- */

function doctorIntro(c) {
  const s = c.site;
  const home = c.home;
  const img = c.hero && c.hero.image;

  return `<section class="section bg-soft">
  <div class="wrap">
    <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16">

      <div class="reveal relative order-2 lg:order-1">
        ${img
          ? `<div class="relative overflow-hidden rounded-2xl border border-line bg-white">
               <img src="${esc(img)}" alt="${esc(c.hero.imageAlt || s.doctorName)}" width="800" height="960" loading="lazy" decoding="async"
                 class="aspect-[5/6] w-full object-cover object-top transition-transform duration-[900ms] ease-[var(--ease-out-soft)] hover:scale-[1.03]">
             </div>
             <div class="absolute -bottom-5 -end-3 hidden rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-lift)] sm:block lg:-end-6">
               <span class="block h-6 w-6 text-brand-600">${ICON.stethos}</span>
               <span class="mt-2.5 block text-[.82rem] text-navy-400">الاختصاص</span>
               <span class="block text-[.96rem] font-semibold text-navy-900">المسالك البولية</span>
             </div>`
          : `<div class="grid aspect-[5/6] place-items-center rounded-2xl border-2 border-dashed border-line-strong bg-white text-[.94rem] text-navy-400">
               صورة الطبيب تُرفع من لوحة التحكم</div>`}
      </div>

      <div class="order-1 lg:order-2">
        ${sectionHeading({ eyebrow: 'عن الطبيب', title: home.introTitle || 'تعرف على الطبيب' })}
        <div class="prose-ar reveal -mt-6 max-w-xl text-[1.05rem]">${paras(c.about.bio)}</div>

        <dl class="reveal mt-9 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          ${(home.introFacts || []).map(f => `<div class="bg-white p-5">
            <dt class="text-[.83rem] text-navy-400">${esc(f.label)}</dt>
            <dd class="mt-1.5 text-[.98rem] font-semibold leading-snug text-navy-900">${esc(f.value)}</dd>
          </div>`).join('\n          ')}
        </dl>

        <div class="reveal mt-9 flex flex-wrap items-center gap-6">
          <a class="btn btn-primary" href="/about/">المؤهلات والخبرة
            <span class="block h-[18px] w-[18px]">${ICON.arrow}</span></a>
          <a class="link-more" href="/services/">تصفّح الخدمات <span class="block h-4 w-4">${ICON.arrow}</span></a>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- ServiceCard ---------- */

function serviceCard(sv, i) {
  return `<a href="/services/${esc(sv.slug)}/" class="card card-lift group reveal flex flex-col"
    style="transition-delay:${Math.min(i || 0, 5) * 60}ms">
    <span class="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-600
                 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
      <span class="block h-6 w-6">${serviceIcon(sv.slug)}</span>
    </span>
    <h3 class="mt-5 text-[1.13rem] transition-colors duration-200 group-hover:text-brand-700">${esc(sv.name)}</h3>
    <p class="mt-3 flex-1 text-[.96rem] leading-[1.9] text-navy-500">${esc(sv.short)}</p>
    <span class="link-more mt-5">تفاصيل الخدمة <span class="block h-4 w-4">${ICON.arrow}</span></span>
  </a>`;
}

function servicesGrid(c) {
  return `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    ${c.services.map((sv, i) => serviceCard(sv, i)).join('\n    ')}
  </div>`;
}

/* ---------- TrustSection ---------- */

function trustSection(c) {
  const home = c.home;
  const items = home.trust || [];
  if (!items.length) return '';

  return `<section class="section relative overflow-hidden bg-navy-950">
  <div class="absolute inset-0 grid-fine opacity-60"></div>
  <div class="pointer-events-none absolute -top-24 end-1/4 h-96 w-96 glow-deep"></div>

  <div class="wrap relative">
    ${sectionHeading({ eyebrow: 'الالتزام الطبي', title: home.trustTitle || 'لماذا تختار العيادة؟', dark: true })}

    <div class="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
      ${items.map((t, i) => `<div class="reveal group bg-navy-950 p-8 transition-colors duration-300 hover:bg-navy-900"
        style="transition-delay:${i * 70}ms">
        <span class="block text-[.82rem] font-medium text-brand-400">٠${i + 1}</span>
        <h3 class="mt-4 text-[1.1rem] text-white">${esc(t.h)}</h3>
        <p class="mt-3 text-[.94rem] leading-[1.9] text-navy-300">${esc(t.b)}</p>
      </div>`).join('\n      ')}
    </div>

    <p class="reveal mt-8 text-[.88rem] text-navy-300">التقييم والخطة تعتمد على حالة كل مراجع، ولا تُقدَّم ضمانات لنتائج.</p>
  </div>
</section>`;
}

/* ---------- SpecialtyCard: مجالات الرعاية ---------- */

function specialties(c) {
  const home = c.home;
  const items = home.specialties || [];
  if (!items.length) return '';

  return `<section class="section bg-plain">
  <div class="wrap">
    ${sectionHeading({
      eyebrow: 'مجالات الرعاية',
      title: home.specialtiesTitle || 'مجالات الرعاية',
      sub: home.specialtiesIntro
    })}

    <!-- القائمة بعرض كامل: عمودان على الشاشات الكبيرة -->
    <div class="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
      ${items.map((sp, i) => `<a href="${sp.service ? '/services/' + esc(sp.service) + '/' : '/services/'}"
        class="group reveal relative block bg-white p-7 transition-colors duration-300 hover:bg-navy-50 lg:p-9"
        style="transition-delay:${i * 60}ms">
        <span class="absolute inset-y-0 start-0 w-[3px] origin-bottom scale-y-0 bg-brand-400 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-y-100"></span>
        <div class="flex items-start justify-between gap-6">
          <div class="min-w-0">
            <h3 class="text-[1.2rem] transition-colors duration-200 group-hover:text-brand-700">${esc(sp.name)}</h3>
            <p class="mt-2.5 text-[.96rem] leading-[1.9] text-navy-500">${esc(sp.b)}</p>
          </div>
          <span class="mt-1 block h-5 w-5 shrink-0 text-navy-300 transition-all duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-x-1.5 group-hover:text-brand-600">${ICON.arrow}</span>
        </div>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

/* ---------- ArticleCard ---------- */

function articleCard(a, c, featured) {
  const href = '/education/#' + esc(a.id || '');
  if (featured) {
    return `<article class="reveal group grid gap-8 rounded-2xl border border-line bg-white p-7 lg:grid-cols-2 lg:p-9">
      <div>
        <span class="eyebrow">مقال مميّز</span>
        <h3 class="mt-4 text-[1.5rem] leading-snug"><a class="transition-colors hover:text-brand-700" href="${href}">${esc(a.title)}</a></h3>
        ${a.summary ? `<p class="mt-4 text-[1rem] leading-[1.95] text-navy-500">${esc(a.summary)}</p>` : ''}
        <a class="link-more mt-6" href="${href}">اقرأ المقال <span class="block h-4 w-4">${ICON.arrow}</span></a>
      </div>
      <div class="prose-ar max-h-56 overflow-hidden border-s border-line ps-8 text-[.97rem] [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
        ${paras(String(a.body || '').slice(0, 600))}
      </div>
    </article>`;
  }
  return `<article class="card card-lift group reveal flex flex-col">
    ${a.service ? `<span class="text-[.82rem] font-medium text-brand-600">${esc((c.services.find(x => x.slug === a.service) || {}).name || '')}</span>` : ''}
    <h3 class="mt-2 text-[1.1rem] leading-snug"><a class="transition-colors group-hover:text-brand-700" href="${href}">${esc(a.title)}</a></h3>
    ${a.summary ? `<p class="mt-3 flex-1 text-[.95rem] leading-[1.9] text-navy-500">${esc(a.summary)}</p>` : ''}
    <span class="link-more mt-5">اقرأ المزيد <span class="block h-4 w-4">${ICON.arrow}</span></span>
  </article>`;
}

/* ---------- BookingForm ---------- */

function bookingForm(c, opts) {
  opts = opts || {};
  const dark = opts.dark;
  const t = c.contact;
  const inputCls = dark ? 'field-dark' : 'field-input';
  const labelCls = dark ? 'mb-2 block text-[.93rem] font-medium text-navy-100' : 'field-label';

  const reasons = [t.reasonDefault || 'استشارة عامة'].concat(c.services.map(s => s.name));

  const staticMode = process.env.STATIC_BUILD === "1" && c.site.whatsapp;
  return `<form class="booking-form" id="booking-form" novalidate${staticMode ? ` data-mode="whatsapp" data-whatsapp="${esc(c.site.whatsapp)}"` : ''}>
    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label class="${labelCls}" for="bf-name">الاسم <span class="text-brand-400">*</span></label>
        <input class="${inputCls}" id="bf-name" name="name" required maxlength="80" autocomplete="name" placeholder="الاسم الثلاثي">
      </div>
      <div>
        <label class="${labelCls}" for="bf-phone">رقم التواصل <span class="text-brand-400">*</span></label>
        <input class="${inputCls}" id="bf-phone" name="phone" required maxlength="20" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="07XXXXXXXXX">
      </div>
      <div>
        <label class="${labelCls}" for="bf-date">التاريخ المفضل</label>
        <input class="${inputCls}" id="bf-date" name="date" type="date">
      </div>
      <div>
        <label class="${labelCls}" for="bf-time">الوقت المفضل</label>
        <input class="${inputCls}" id="bf-time" name="time" type="time">
      </div>
      <div class="sm:col-span-2">
        <label class="${labelCls}" for="bf-reason">${esc(t.reasonLabel || 'سبب المراجعة')}</label>
        <select class="${inputCls}" id="bf-reason" name="reason">
          ${reasons.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('\n          ')}
        </select>
      </div>
      <div class="sm:col-span-2">
        <label class="${labelCls}" for="bf-note">ملاحظة قصيرة (اختياري)</label>
        <textarea class="${inputCls}" id="bf-note" name="note" rows="3" maxlength="300"></textarea>
        <p class="mt-2 text-[.85rem] leading-relaxed ${dark ? 'text-navy-300' : 'text-navy-400'}">
          لا ترسل تشخيصاً مفصلاً أو تقارير أو صوراً طبية عبر هذا النموذج.</p>
      </div>
    </div>

    <label class="mt-6 flex cursor-pointer items-start gap-3 rounded-lg ${dark ? 'border border-white/12 bg-white/[.04]' : 'border border-line bg-navy-50'} p-4">
      <input type="checkbox" id="bf-consent" name="consent" required class="mt-1 h-[18px] w-[18px] shrink-0 accent-[#087F95]">
      <span class="text-[.93rem] leading-relaxed ${dark ? 'text-navy-200' : 'text-navy-600'}">${esc(t.consentLabel)}</span>
    </label>

    <div class="mt-6 flex flex-wrap items-center gap-4">
      <button class="btn ${dark ? 'btn-accent' : 'btn-primary'}" type="submit">
        <span class="block h-[18px] w-[18px]">${staticMode ? ICON.whatsapp : ICON.calendar}</span>${staticMode ? 'أرسل الطلب عبر واتساب' : 'احجز موعداً'}</button>
      <span class="flex items-center gap-2 text-[.85rem] ${dark ? 'text-navy-300' : 'text-navy-400'}">
        <span class="block h-4 w-4 text-brand-400">${ICON.shield}</span>بياناتك تُستخدم لتأكيد الموعد فقط</span>
    </div>
    <p class="mt-4 min-h-[1.5em] text-[.95rem]" id="bf-msg" role="status" aria-live="polite"></p>
  </form>`;
}

function bookingSection(c) {
  const t = c.contact;
  return `<section class="section relative overflow-hidden bg-navy-950" id="booking">
  <div class="absolute inset-0 bg-[linear-gradient(200deg,#071C2C_0%,#0B2638_60%,#0A3242_100%)]"></div>
  <div class="absolute inset-0 grid-fine opacity-50"></div>
  <div class="pointer-events-none absolute -bottom-32 -start-16 h-96 w-96 glow-deep"></div>

  <div class="wrap relative">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div>
        ${sectionHeading({ eyebrow: 'الحجز', title: t.bookingTitle || 'احجز موعدك مع الطبيب', dark: true })}
        <p class="lead-dark -mt-6">${esc(t.formNote)}</p>

        <ol class="mt-10 space-y-6">
          ${[['يصل الطلب إلى العيادة', 'يُسجَّل باسمك ورقمك فقط.'],
             ['يتصل بك فريق العيادة', 'ضمن أوقات العمل لتأكيد الموعد المناسب.'],
             ['يتأكد الموعد بالاتصال', 'إرسال الطلب وحده لا يعني تأكيد الحجز.']]
            .map(([h1t, b], i) => `<li class="flex gap-4">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 text-[.9rem] font-semibold text-brand-400">${i + 1}</span>
              <span class="pt-1">
                <strong class="block text-white">${h1t}</strong>
                <span class="text-[.93rem] leading-relaxed text-navy-300">${b}</span></span>
            </li>`).join('\n          ')}
        </ol>

        <div class="mt-10 rule-dark"></div>
        <a class="mt-6 flex items-center gap-3 text-white transition-colors hover:text-brand-200" href="tel:${esc(c.site.phoneIntl)}">
          <span class="block h-5 w-5 text-brand-400">${ICON.phone}</span>
          <span><span class="block text-[.83rem] text-navy-300">تفضّل الاتصال المباشر؟</span>
          <span dir="ltr" class="block text-[1.25rem] font-bold">${esc(c.site.phoneDisplay)}</span></span>
        </a>
      </div>

      <div class="reveal rounded-2xl border border-white/10 bg-white/[.05] p-7 backdrop-blur-sm sm:p-9">
        ${bookingForm(c, { dark: true })}
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- ContactSection ---------- */

function hoursTable(c, dark) {
  const days = (c.hours && c.hours.days) || [];
  return `<table class="w-full text-[.96rem]" id="hoursTable">
    <caption class="sr-only">دوام العيادة</caption>
    <tbody>
    ${days.map(d => `<tr data-day="${esc(d.day)}" class="border-b ${dark ? 'border-white/8' : 'border-line'} last:border-0">
      <th scope="row" class="py-3 text-start font-medium ${d.open ? (dark ? 'text-white' : 'text-navy-900') : (dark ? 'text-navy-300' : 'text-navy-400')}">${esc(d.day)}</th>
      <td class="py-3 text-end ${d.open ? (dark ? 'text-navy-100' : 'text-navy-600') : 'text-navy-400'}">${d.open
        ? `<span dir="ltr">${fmtTime(d.from)} – ${fmtTime(d.to)}</span>`
        : 'مغلق'}</td>
    </tr>`).join('\n    ')}
    </tbody>
  </table>`;
}

function contactSection(c) {
  const s = c.site;
  return `<section class="section bg-plain">
  <div class="wrap">
    ${sectionHeading({ eyebrow: 'الموقع', title: 'موقع العيادة وأوقات الدوام' })}

    <div class="grid gap-5 lg:grid-cols-3">

      <div class="card reveal lg:col-span-2 lg:p-9">
        <div class="grid gap-9 sm:grid-cols-2">
          <div>
            <span class="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <span class="block h-5 w-5">${ICON.pin}</span></span>
            <h3 class="mt-4 text-[1.1rem]">العنوان</h3>
            <p class="mt-2.5 text-[.97rem] leading-[1.9] text-navy-500">${esc(s.address)}</p>
            ${s.mapsUrl
              ? `<a class="btn btn-line btn-sm mt-5" href="${esc(s.mapsUrl)}" rel="noopener" target="_blank">
                  <span class="block h-4 w-4">${ICON.pin}</span>احصل على الاتجاهات</a>`
              : `<p class="mt-4 rounded-lg border border-dashed border-line-strong bg-navy-50 px-4 py-3 text-[.87rem] leading-relaxed text-navy-400">
                  رابط الدبوس على الخرائط يُضاف من لوحة التحكم بعد التأكد منه.</p>`}
          </div>
          <div>
            <span class="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <span class="block h-5 w-5">${ICON.phone}</span></span>
            <h3 class="mt-4 text-[1.1rem]">الاتصال</h3>
            <a dir="ltr" class="mt-2.5 block text-[1.45rem] font-bold text-navy-900 transition-colors hover:text-brand-700" href="tel:${esc(s.phoneIntl)}">${esc(s.phoneDisplay)}</a>
            <div class="mt-4 flex flex-wrap gap-2.5">
              <a class="btn btn-primary btn-sm" href="tel:${esc(s.phoneIntl)}">اتصل بالعيادة</a>
              ${s.whatsappEnabled && s.whatsapp ? `<a class="btn btn-line btn-sm" href="https://wa.me/${esc(s.whatsapp)}" rel="noopener">
                <span class="block h-4 w-4">${ICON.whatsapp}</span>واتساب</a>` : ''}
            </div>
          </div>
        </div>

        ${s.mapsUrl ? `<div class="mt-9 overflow-hidden rounded-xl border border-line">
          <a href="${esc(s.mapsUrl)}" rel="noopener" target="_blank"
             class="group relative flex h-44 items-center justify-center bg-navy-50 transition-colors hover:bg-brand-50">
            <span class="absolute inset-0 grid-fine opacity-[.06]"></span>
            <span class="relative flex items-center gap-3 text-[.97rem] font-medium text-navy-700 transition-colors group-hover:text-brand-700">
              <span class="block h-5 w-5 text-brand-600">${ICON.pin}</span>افتح موقع العيادة على الخرائط</span>
          </a>
        </div>` : ''}
      </div>

      <div class="card reveal lg:p-9">
        <div class="flex items-center justify-between gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <span class="block h-5 w-5">${ICON.clock}</span></span>
          <span id="openBadge" class="hidden rounded-full px-3 py-1 text-[.83rem] font-medium"></span>
        </div>
        <h3 class="mt-4 text-[1.1rem]">دوام العيادة</h3>
        <div class="mt-3">${hoursTable(c)}</div>
        ${c.hours && c.hours.note ? `<p class="mt-4 text-[.86rem] leading-relaxed text-navy-400">${esc(c.hours.note)}</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- FAQ ---------- */

function faqBlock(list, title, opts) {
  if (!list || !list.length) return '';
  opts = opts || {};
  return `<div class="${opts.narrow ? 'mx-auto max-w-3xl' : ''}">
    ${title ? `<h2 class="h-section reveal mb-9">${esc(title)}</h2>` : ''}
    <div class="divide-y divide-line overflow-hidden rounded-xl border border-line">
      ${list.map(f => `<details class="group reveal bg-white">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-[1.02rem] font-medium text-navy-900 transition-colors hover:text-brand-700">
          ${esc(f.q)}
          <span class="block h-5 w-5 shrink-0 text-navy-300 transition-transform duration-300 group-open:rotate-180">${ICON.chevron}</span>
        </summary>
        <div class="prose-ar px-6 pb-6 text-[.98rem]">${paras(f.a)}</div>
      </details>`).join('\n      ')}
    </div>
  </div>`;
}

/* ---------- مسار التنقل + ترويسة صفحة داخلية ---------- */

function crumbs(trail, dark) {
  return `<nav class="mb-6 flex flex-wrap items-center gap-2.5 text-[.87rem] ${dark ? 'text-navy-300' : 'text-navy-400'}" aria-label="مسار التنقل">
    ${trail.map((t, i) => i === trail.length - 1
      ? `<span class="${dark ? 'text-white' : 'text-navy-700'}">${esc(t.name)}</span>`
      : `<a class="transition-colors hover:text-brand-600" href="${t.url}">${esc(t.name)}</a><span class="${dark ? 'text-navy-500' : 'text-navy-200'}">/</span>`
    ).join('\n    ')}
  </nav>`;
}

function pageHeader(opts) {
  return `<section class="relative overflow-hidden bg-navy-950">
    <div class="absolute inset-0 bg-[linear-gradient(165deg,#071C2C_0%,#0B2638_100%)]"></div>
    <div class="absolute inset-0 grid-fine opacity-60"></div>
    <div class="pointer-events-none absolute -top-40 end-0 h-80 w-80 glow-deep"></div>
    <div class="wrap relative py-14 sm:py-16 lg:py-20">
      ${crumbs(opts.trail, true)}
      ${opts.eyebrow ? `<span class="eyebrow eyebrow-dark animate-fade-up">${esc(opts.eyebrow)}</span>` : ''}
      <h1 class="mt-4 max-w-4xl animate-fade-up text-[1.9rem] text-white sm:text-[2.3rem] lg:text-[2.7rem]">${esc(opts.title)}</h1>
      ${opts.sub ? `<p class="lead-dark mt-5 max-w-3xl animate-fade-up" style="animation-delay:.08s">${esc(opts.sub)}</p>` : ''}
      ${opts.cta ? `<div class="mt-9 animate-fade-up" style="animation-delay:.14s">${opts.cta}</div>` : ''}
    </div>
  </section>`;
}

module.exports = {
  sectionHeading, ctaGroup, hero, doctorIntro,
  serviceCard, servicesGrid, serviceIcon,
  trustSection, specialties, articleCard,
  bookingForm, bookingSection, contactSection, hoursTable,
  faqBlock, crumbs, pageHeader
};
