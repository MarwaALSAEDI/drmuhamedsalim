'use strict';
/* ============================================================
   الصفحات — مبنية من مكوّنات components.js
   ============================================================ */

const H = require('./html');
const C = require('./components');
const { esc, paras, hoursSummary, layout, breadcrumb, videoCard, ICON } = H;

/* ---------------- الرئيسية ---------------- */

function home(c) {
  const videos = c.videos || [];
  const articles = c.articles || [];

  const eduSection = (videos.length || articles.length) ? `
<section class="section bg-soft">
  <div class="wrap">
    ${C.sectionHeading({
      eyebrow: 'التثقيف الطبي',
      title: c.education.h1 || 'التثقيف الطبي',
      sub: 'معلومات طبية مبسطة تساعدك على فهم حالتك واتخاذ قرارات صحية أفضل.'
    })}

    ${articles.length ? `<div class="mb-5">${C.articleCard(articles[0], c, true)}</div>` : ''}

    ${articles.length > 1 ? `<div class="mb-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${articles.slice(1, 4).map(a => C.articleCard(a, c)).join('\n      ')}
    </div>` : ''}

    ${videos.length ? `<div class="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
      ${videos.slice(0, 3).map(videoCard).join('\n      ')}
    </div>` : ''}

    <div class="reveal mt-11">
      <a class="btn btn-line" href="/education/">كل المقالات والفيديو
        <span class="block h-[18px] w-[18px]">${ICON.arrow}</span></a>
    </div>
  </div>
</section>` : '';

  const body = `
${C.hero(c)}
${C.doctorIntro(c)}

<section class="section bg-plain">
  <div class="wrap">
    ${C.sectionHeading({
      eyebrow: 'الخدمات',
      title: 'رعاية متخصصة لكل حالة',
      sub: 'اختر الخدمة لقراءة تفاصيل التقييم والخيارات المتاحة وحدود النتائج المتوقعة.'
    })}
    ${C.servicesGrid(c)}
  </div>
</section>

${C.trustSection(c)}
${C.specialties(c)}

<section class="section bg-soft">
  <div class="wrap">
    ${C.sectionHeading({ eyebrow: 'خطوة بخطوة', title: c.home.stepsTitle || 'كيف تتم المراجعة' })}
    <div class="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
      ${c.home.steps.map((st, i) => `<div class="reveal bg-white p-8" style="transition-delay:${i * 70}ms">
        <span class="text-[.84rem] font-semibold text-brand-600">الخطوة ${i + 1}</span>
        <h3 class="mt-3 text-[1.12rem]">${esc(st.h)}</h3>
        <p class="mt-2.5 text-[.96rem] leading-[1.9] text-navy-500">${esc(st.b)}</p>
      </div>`).join('\n      ')}
    </div>
    <p class="reveal mt-6 text-[.88rem] text-navy-400">التقييم والخطة تعتمد على حالة كل مراجع، ولا تُقدَّم ضمانات لنتائج.</p>
  </div>
</section>

<!-- الضمان الصحي -->
<section class="section bg-plain">
  <div class="wrap">
    <div class="grid items-center gap-10 rounded-2xl border border-line bg-white p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)] lg:p-12">
      <div class="reveal">
        <span class="eyebrow">الضمان الصحي</span>
        <h2 class="h-section mt-4">تغطية واضحة قبل أي إجراء</h2>
        <p class="lead mt-4 max-w-2xl">${esc(c.home.insuranceBlurb)}</p>
        <ul class="mt-7 grid gap-3 sm:grid-cols-2">
          ${(c.insurance.points || []).slice(0, 4).map(p => `<li class="flex items-start gap-3">
            <span class="mt-1 block h-[18px] w-[18px] shrink-0 text-brand-600">${ICON.check}</span>
            <span class="text-[.94rem] leading-[1.85] text-navy-500">${esc(p)}</span></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="reveal lg:justify-self-end">
        <a class="btn btn-primary" href="/health-insurance/">تفاصيل الضمان الصحي
          <span class="block h-[18px] w-[18px]">${ICON.arrow}</span></a>
      </div>
    </div>
  </div>
</section>

${eduSection}
${C.bookingSection(c)}
${C.contactSection(c)}

<section class="section bg-soft">
  <div class="wrap">${C.faqBlock(c.contact.faq, 'أسئلة الحجز الشائعة', { narrow: true })}</div>
</section>`;

  return layout(c, { path: '/', title: c.home.title, meta: c.home.meta, body });
}

/* ---------------- عن الطبيب ---------------- */

function about(c) {
  const a = c.about;
  const base = c.site.domain.replace(/\/+$/, '');
  const img = c.hero && c.hero.image;

  const body = `
${C.pageHeader({
    eyebrow: 'عن الطبيب',
    title: a.h1,
    trail: [{ url: '/', name: 'الرئيسية' }, { name: 'عن الطبيب' }]
  })}

<section class="section bg-plain">
  <div class="wrap">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,.85fr)] lg:gap-16">

      <div>
        <div class="prose-ar reveal text-[1.06rem]">${paras(a.bio)}</div>

        <dl class="reveal mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          ${(c.home.introFacts || []).map(f => `<div class="bg-white p-5">
            <dt class="text-[.83rem] text-navy-400">${esc(f.label)}</dt>
            <dd class="mt-1.5 text-[.97rem] font-semibold leading-snug text-navy-900">${esc(f.value)}</dd>
          </div>`).join('\n          ')}
        </dl>

        <div class="mt-14">
          <h2 class="h-section reveal mb-8">المؤهلات</h2>
          ${a.credentials && a.credentials.length
            ? `<ul class="grid gap-3">${a.credentials.map((x, i) => `<li class="reveal flex items-start gap-4 rounded-xl border border-line bg-white p-5" style="transition-delay:${i * 60}ms">
                <span class="mt-0.5 block h-[18px] w-[18px] shrink-0 text-brand-600">${ICON.check}</span>
                <span class="text-[.99rem] leading-[1.9] text-navy-600">${esc(x)}</span></li>`).join('')}</ul>`
            : `<p class="reveal rounded-xl border border-dashed border-line-strong bg-navy-50 p-6 text-[.97rem] leading-[1.9] text-navy-400">${esc(a.credentialsNote)}</p>`}
        </div>

        <div class="mt-14">
          <h2 class="h-section reveal mb-8">البحوث والمنشورات</h2>
          ${a.publications && a.publications.length
            ? `<ul class="grid gap-4">${a.publications.map(p => `<li class="card reveal">
                <h3 class="text-[1.05rem] leading-snug">${esc(p.title)}</h3>
                <p class="mt-2 text-[.9rem] text-navy-400">${esc(p.journal || '')} ${esc(p.year || '')}</p>
                ${p.doi ? `<a class="link-more mt-3" href="${esc(p.doi)}" rel="noopener" target="_blank">DOI <span class="block h-4 w-4">${ICON.arrow}</span></a>` : ''}
              </li>`).join('')}</ul>`
            : `<p class="reveal rounded-xl border border-dashed border-line-strong bg-navy-50 p-6 text-[.97rem] leading-[1.9] text-navy-400">${esc(a.publicationsNote)}</p>`}
        </div>
      </div>

      <aside class="lg:sticky lg:top-28 lg:self-start">
        ${img ? `<div class="reveal overflow-hidden rounded-2xl border border-line">
          <img src="${esc(img)}" alt="${esc(c.hero.imageAlt || c.site.doctorName)}" width="700" height="875" loading="lazy" decoding="async"
            class="aspect-[4/5] w-full object-cover object-top">
        </div>` : ''}

        <div class="card reveal mt-5">
          <h2 class="text-[1.05rem]">جهات العمل</h2>
          <ul class="mt-4 space-y-5">
            ${(a.workplaces || []).map(w => `<li>
              <strong class="block text-[.98rem] text-navy-900">${esc(w.name)}</strong>
              ${w.detail ? `<span class="mt-1 block text-[.92rem] leading-relaxed text-navy-500">${esc(w.detail)}</span>` : ''}
              ${w.url ? `<a class="link-more mt-1.5" href="${esc(w.url)}" rel="noopener" target="_blank">الصفحة المهنية</a>` : ''}
            </li>`).join('\n            ')}
          </ul>
          ${c.site.hospital ? `<div class="mt-5 rule"></div>
            <p class="mt-4 text-[.87rem] leading-relaxed text-navy-400"><strong class="text-navy-600">${esc(c.site.hospital)}:</strong> ${esc(c.site.hospitalNote)}</p>` : ''}
        </div>

        <div class="reveal mt-5 rounded-2xl border border-navy-800 bg-navy-950 p-7">
          <h2 class="text-[1.05rem] text-white">احجز تقييماً</h2>
          <p class="mt-2.5 text-[.93rem] leading-[1.9] text-navy-300">تقييم الحالة وشرح الخيارات المناسبة وخطة المتابعة.</p>
          <div class="mt-6 flex flex-col gap-2.5">
            <a class="btn btn-accent w-full" href="/contact/">احجز موعداً</a>
            <a class="btn btn-onDark w-full" href="tel:${esc(c.site.phoneIntl)}" dir="ltr">${esc(c.site.phoneDisplay)}</a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="section bg-soft">
  <div class="wrap">
    ${C.sectionHeading({ eyebrow: 'الخدمات', title: 'مجالات العمل' })}
    ${C.servicesGrid(c)}
  </div>
</section>`;

  return layout(c, {
    path: '/about/', title: a.title, meta: a.meta, body,
    extra: [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: 'عن الطبيب', url: '/about/' }])]
  });
}

/* ---------------- فهرس الخدمات ---------------- */

function servicesIndex(c) {
  const base = c.site.domain.replace(/\/+$/, '');
  const body = `
${C.pageHeader({
    eyebrow: 'الخدمات',
    title: 'خدمات العيادة',
    sub: 'تقييم وعلاج أمراض الكلى والمسالك البولية وصحة الرجل في بغداد. اختر الخدمة لقراءة تفاصيل التقييم والخيارات المتاحة.',
    trail: [{ url: '/', name: 'الرئيسية' }, { name: 'الخدمات' }],
    cta: C.ctaGroup(c, { dark: true })
  })}

<section class="section bg-plain">
  <div class="wrap">${C.servicesGrid(c)}</div>
</section>

${C.specialties(c)}
${C.bookingSection(c)}`;

  return layout(c, {
    path: '/services/',
    title: 'خدمات المسالك البولية وصحة الرجل في بغداد | ' + c.site.doctorName,
    meta: 'فهرس خدمات عيادة ' + c.site.doctorName + ' في بغداد: الحصوات والمناظير، دوالي الخصية، عقم الرجال، ضعف الانتصاب، الدعامات، الفلر، وتضخم البروستات.',
    body,
    extra: [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: 'الخدمات', url: '/services/' }])]
  });
}

/* ---------------- صفحة خدمة ---------------- */

function service(c, sv) {
  const base = c.site.domain.replace(/\/+$/, '');
  const url = '/services/' + sv.slug + '/';
  const related = (c.videos || []).filter(v => v.service === sv.slug);
  const relatedArticles = (c.articles || []).filter(a => a.service === sv.slug);
  const others = c.services.filter(x => x.slug !== sv.slug).slice(0, 4);

  const body = `
<section class="relative overflow-hidden bg-navy-950">
  <div class="absolute inset-0 bg-[linear-gradient(165deg,#071C2C_0%,#0B2638_100%)]"></div>
  <div class="absolute inset-0 grid-fine opacity-60"></div>
  <div class="pointer-events-none absolute -top-40 end-10 h-96 w-96 glow-deep"></div>

  <div class="wrap relative py-14 sm:py-16 lg:py-20">
    ${C.crumbs([{ url: '/', name: 'الرئيسية' }, { url: '/services/', name: 'الخدمات' }, { name: sv.name }], true)}
    <div class="flex items-start gap-5">
      <span class="hidden h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/12 text-brand-400 sm:grid">
        <span class="block h-7 w-7">${C.serviceIcon(sv.slug)}</span>
      </span>
      <div class="min-w-0">
        <span class="eyebrow eyebrow-dark">${esc(sv.name)}</span>
        <h1 class="mt-3 animate-fade-up text-[1.9rem] text-white sm:text-[2.25rem] lg:text-[2.6rem]">${esc(sv.h1)}</h1>
      </div>
    </div>
    <div class="prose-ar mt-6 max-w-3xl animate-fade-up [&_p]:text-navy-200" style="animation-delay:.08s">${paras(sv.intro)}</div>
    <div class="mt-9 animate-fade-up" style="animation-delay:.14s">${C.ctaGroup(c, { dark: true })}</div>
  </div>
</section>

<section class="section bg-plain">
  <div class="wrap">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,.75fr)] lg:gap-16">

      <article>
        ${(sv.sections || []).map((s, i) => `<section class="reveal mb-10" style="transition-delay:${Math.min(i, 4) * 50}ms">
          <h2 class="text-[1.3rem]">${esc(s.h)}</h2>
          <div class="prose-ar mt-3.5">${paras(s.b)}</div>
        </section>`).join('\n        ')}

        ${sv.price ? `<section class="reveal mb-10 rounded-xl border border-line bg-navy-50 p-7">
          <h2 class="text-[1.25rem]">الكلفة</h2>
          <div class="prose-ar mt-3">${paras(sv.price)}</div>
        </section>` : ''}

        ${sv.faq && sv.faq.length ? `<div class="mt-14">${C.faqBlock(sv.faq, 'أسئلة شائعة')}</div>` : ''}

        ${related.length ? `<div class="mt-14">
          <h2 class="h-section reveal mb-8">فيديو مرتبط</h2>
          <div class="grid gap-9 sm:grid-cols-2">${related.map(videoCard).join('\n')}</div>
        </div>` : ''}

        ${relatedArticles.length ? `<div class="mt-14">
          <h2 class="h-section reveal mb-8">مقالات مرتبطة</h2>
          <div class="grid gap-5 sm:grid-cols-2">${relatedArticles.map(a => C.articleCard(a, c)).join('\n')}</div>
        </div>` : ''}

        <div class="reveal mt-14 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-navy-50 px-6 py-5 text-[.89rem] text-navy-500">
          <span class="block h-[18px] w-[18px] text-brand-600">${ICON.shield}</span>
          <span>إعداد ومراجعة طبية: <strong class="text-navy-900">${esc(c.site.doctorName)}</strong></span>
          ${sv.published ? `<span class="text-navy-200">•</span><span>نُشر: ${esc(sv.published)}</span>` : ''}
          ${sv.reviewed ? `<span class="text-navy-200">•</span><span>آخر مراجعة: ${esc(sv.reviewed)}</span>` : ''}
        </div>
        <p class="mt-3 text-[.87rem] leading-relaxed text-navy-400">${esc(c.site.medicalDisclaimer)}</p>
      </article>

      <aside class="lg:sticky lg:top-28 lg:self-start">
        <div class="reveal rounded-2xl border border-navy-800 bg-navy-950 p-7">
          <h2 class="text-[1.05rem] text-white">حجز التقييم</h2>
          <p class="mt-2.5 text-[.93rem] leading-[1.9] text-navy-300">احجز تقييماً طبياً لمناقشة ملاءمة الإجراء والخيارات المتاحة لحالتك.</p>
          <div class="mt-6 flex flex-col gap-2.5">
            <a class="btn btn-accent w-full" href="/contact/">
              <span class="block h-[18px] w-[18px]">${ICON.calendar}</span>احجز موعداً</a>
            <a class="btn btn-onDark w-full" href="tel:${esc(c.site.phoneIntl)}">
              <span class="block h-[18px] w-[18px]">${ICON.phone}</span><span dir="ltr">${esc(c.site.phoneDisplay)}</span></a>
          </div>
          <div class="mt-6 rule-dark"></div>
          <p class="mt-4 flex items-start gap-2.5 text-[.87rem] leading-relaxed text-navy-300">
            <span class="mt-0.5 block h-4 w-4 shrink-0 text-brand-400">${ICON.clock}</span>${esc(hoursSummary(c.hours))}</p>
        </div>

        <div class="card reveal mt-5">
          <h2 class="text-[1rem]">خدمات أخرى</h2>
          <ul class="mt-4 divide-y divide-line">
            ${others.map(o => `<li><a class="group flex items-center gap-3.5 py-3.5 transition-colors" href="/services/${esc(o.slug)}/">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <span class="block h-[18px] w-[18px]">${C.serviceIcon(o.slug)}</span></span>
              <span class="text-[.94rem] text-navy-600 transition-colors group-hover:text-brand-700">${esc(o.name)}</span>
            </a></li>`).join('\n            ')}
          </ul>
          <a class="link-more mt-4" href="/services/">كل الخدمات <span class="block h-4 w-4">${ICON.arrow}</span></a>
        </div>
      </aside>
    </div>
  </div>
</section>

${C.bookingSection(c)}`;

  const extra = [
    breadcrumb(base, [
      { name: 'الرئيسية', url: '/' },
      { name: 'الخدمات', url: '/services/' },
      { name: sv.name, url }
    ]),
    Object.assign({
      '@type': 'MedicalWebPage', '@id': base + url + '#page',
      name: sv.h1, url: base + url, about: sv.name, inLanguage: 'ar',
      reviewedBy: { '@id': base + '/#doctor' }
    }, sv.reviewed ? { lastReviewed: sv.reviewed } : {})
  ];

  for (const v of related) {
    const id = H.ytId(v.url);
    if (!id) continue;
    extra.push({
      '@type': 'VideoObject', name: v.title, description: v.summary || v.title,
      thumbnailUrl: H.thumbUrl(v, base),
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      uploadDate: v.uploadDate || undefined
    });
  }

  return layout(c, { path: url, title: sv.title, meta: sv.meta, body, extra });
}

/* ---------------- الضمان الصحي ---------------- */

function insurance(c) {
  const i = c.insurance;
  const base = c.site.domain.replace(/\/+$/, '');
  const body = `
${C.pageHeader({
    eyebrow: 'الضمان الصحي',
    title: i.h1,
    trail: [{ url: '/', name: 'الرئيسية' }, { name: 'الضمان الصحي' }]
  })}

<section class="section bg-plain">
  <div class="wrap">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,.8fr)] lg:gap-16">
      <div>
        <div class="prose-ar reveal text-[1.06rem]">${paras(i.body)}</div>

        <h2 class="h-section reveal mt-12 mb-8">ما يجب توضيحه قبل الإجراء</h2>
        <ul class="grid gap-3">
          ${(i.points || []).map((p, n) => `<li class="reveal flex items-start gap-4 rounded-xl border border-line bg-white p-5" style="transition-delay:${n * 60}ms">
            <span class="mt-0.5 block h-[18px] w-[18px] shrink-0 text-brand-600">${ICON.check}</span>
            <span class="text-[.99rem] leading-[1.9] text-navy-600">${esc(p)}</span></li>`).join('\n          ')}
        </ul>
        ${i.updatedNote ? `<p class="reveal mt-6 text-[.88rem] text-navy-400">${esc(i.updatedNote)}</p>` : ''}
      </div>

      <aside class="lg:sticky lg:top-28 lg:self-start">
        <div class="reveal rounded-2xl border border-navy-800 bg-navy-950 p-7">
          <span class="grid h-11 w-11 place-items-center rounded-lg border border-white/12 text-brand-400">
            <span class="block h-5 w-5">${ICON.shield}</span></span>
          <h2 class="mt-5 text-[1.05rem] text-white">للاستفسار عن التغطية</h2>
          <p class="mt-2.5 text-[.93rem] leading-[1.9] text-navy-300">اتصل بالعيادة للاستفسار عن الأهلية والمستندات المطلوبة.</p>
          <div class="mt-6 flex flex-col gap-2.5">
            <a class="btn btn-accent w-full" href="tel:${esc(c.site.phoneIntl)}" dir="ltr">${esc(c.site.phoneDisplay)}</a>
            <a class="btn btn-onDark w-full" href="/contact/">احجز موعداً</a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>`;

  return layout(c, {
    path: '/health-insurance/', title: i.title, meta: i.meta, body,
    extra: [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: 'الضمان الصحي', url: '/health-insurance/' }])]
  });
}

/* ---------------- التثقيف الطبي ---------------- */

function education(c) {
  const e = c.education;
  const base = c.site.domain.replace(/\/+$/, '');
  const videos = c.videos || [];
  const articles = c.articles || [];

  const body = `
${C.pageHeader({
    eyebrow: 'التثقيف الطبي',
    title: e.h1,
    sub: 'معلومات طبية مبسطة تساعدك على فهم حالتك واتخاذ قرارات صحية أفضل.',
    trail: [{ url: '/', name: 'الرئيسية' }, { name: 'التثقيف الطبي' }]
  })}

${videos.length ? `<section class="section bg-plain">
  <div class="wrap">
    ${C.sectionHeading({ eyebrow: 'فيديو', title: 'شروحات مصوّرة' })}
    <div class="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">${videos.map(videoCard).join('\n')}</div>
  </div>
</section>` : `<section class="section bg-plain"><div class="wrap">
  <div class="reveal rounded-2xl border border-dashed border-line-strong bg-navy-50 p-14 text-center">
    <span class="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white text-brand-600 shadow-[var(--shadow-card)]">
      <span class="block h-6 w-6">${ICON.play}</span></span>
    <p class="mt-5 text-[1rem] text-navy-400">تُضاف الفيديوهات من لوحة التحكم.</p>
  </div>
</div></section>`}

${articles.length ? `<section class="section bg-soft">
  <div class="wrap">
    ${C.sectionHeading({ eyebrow: 'مقالات', title: 'إجابات عن أسئلة شائعة' })}
    <div class="space-y-7">
      ${articles.map(a => `<article id="${esc(a.id || '')}" class="card reveal scroll-mt-28 lg:p-10">
        ${a.service ? `<span class="eyebrow">${esc((c.services.find(x => x.slug === a.service) || {}).name || '')}</span>` : ''}
        <h2 class="mt-3 text-[1.4rem] leading-snug">${esc(a.title)}</h2>
        ${a.summary ? `<p class="mt-4 border-s-2 border-brand-400 bg-navy-50 px-5 py-4 text-[1rem] leading-[1.95] text-navy-700">${esc(a.summary)}</p>` : ''}
        <div class="prose-ar mt-5">${paras(a.body)}</div>
        <div class="mt-8 rule"></div>
        <p class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[.88rem] text-navy-400">
          <span class="block h-4 w-4 text-brand-600">${ICON.shield}</span>
          <span>إعداد ومراجعة طبية: <strong class="text-navy-700">${esc(c.site.doctorName)}</strong></span>
          ${a.published ? `<span class="text-navy-200">•</span><span>نُشر: ${esc(a.published)}</span>` : ''}
          ${a.reviewed ? `<span class="text-navy-200">•</span><span>آخر مراجعة: ${esc(a.reviewed)}</span>` : ''}
        </p>
        ${a.service ? `<a class="link-more mt-4" href="/services/${esc(a.service)}/">صفحة الخدمة المرتبطة <span class="block h-4 w-4">${ICON.arrow}</span></a>` : ''}
      </article>`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section class="section bg-plain">
  <div class="wrap">
    <p class="text-[.88rem] leading-relaxed text-navy-400">${esc(c.site.medicalDisclaimer)}</p>
  </div>
</section>

${C.bookingSection(c)}`;

  const extra = [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: 'التثقيف الطبي', url: '/education/' }])];
  for (const v of videos) {
    const id = H.ytId(v.url);
    if (!id) continue;
    extra.push({
      '@type': 'VideoObject', name: v.title, description: v.summary || v.title,
      thumbnailUrl: H.thumbUrl(v, base),
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      uploadDate: v.uploadDate || undefined
    });
  }
  return layout(c, { path: '/education/', title: e.title, meta: e.meta, body, extra });
}

/* ---------------- الحجز والموقع ---------------- */

function contact(c) {
  const t = c.contact;
  const base = c.site.domain.replace(/\/+$/, '');

  const body = `
${C.pageHeader({
    eyebrow: 'الحجز والموقع',
    title: t.h1,
    sub: t.directions,
    trail: [{ url: '/', name: 'الرئيسية' }, { name: 'الحجز والموقع' }],
    cta: C.ctaGroup(c, { dark: true, maps: true })
  })}

${C.contactSection(c)}
${C.bookingSection(c)}

<section class="section bg-soft">
  <div class="wrap">${C.faqBlock(t.faq, 'أسئلة الحجز الشائعة', { narrow: true })}</div>
</section>

<section class="pb-16">
  <div class="wrap-sm">
    <p class="text-[.88rem] leading-relaxed text-navy-400">${esc(c.site.medicalDisclaimer)}</p>
  </div>
</section>`;

  return layout(c, {
    path: '/contact/', title: t.title, meta: t.meta, body,
    extra: [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: 'الحجز والموقع', url: '/contact/' }])]
  });
}

/* ---------------- صفحات نصية ---------------- */

function simplePage(c, key, path) {
  const p = c[key];
  const base = c.site.domain.replace(/\/+$/, '');
  const body = `
${C.pageHeader({ title: p.h1, trail: [{ url: '/', name: 'الرئيسية' }, { name: p.h1 }] })}

<section class="section bg-plain">
  <div class="wrap-sm">
    <div class="prose-ar reveal text-[1.05rem]">${paras(p.body)}</div>
    ${p.points && p.points.length ? `<ul class="mt-9 grid gap-3">
      ${p.points.map((x, i) => `<li class="reveal flex items-start gap-4 rounded-xl border border-line bg-white p-5" style="transition-delay:${i * 60}ms">
        <span class="mt-0.5 block h-[18px] w-[18px] shrink-0 text-brand-600">${ICON.check}</span>
        <span class="text-[.99rem] leading-[1.9] text-navy-600">${esc(x)}</span></li>`).join('\n      ')}
    </ul>` : ''}
    ${p.note ? `<p class="reveal mt-7 rounded-xl border border-line bg-navy-50 p-5 text-[.92rem] leading-relaxed text-navy-500">${esc(p.note)}</p>` : ''}
  </div>
</section>`;

  return layout(c, {
    path, title: p.title, meta: p.meta, body,
    extra: [breadcrumb(base, [{ name: 'الرئيسية', url: '/' }, { name: p.h1, url: path }])]
  });
}

/* ---------------- 404 ---------------- */

function notFound(c) {
  const body = `<section class="grid min-h-[60vh] place-items-center bg-plain py-20">
  <div class="wrap-sm text-center">
    <span class="eyebrow justify-center">404</span>
    <h1 class="h-section mt-5">الصفحة غير موجودة</h1>
    <p class="lead mx-auto mt-4 max-w-lg">الرابط الذي طلبته غير متاح. يمكنك العودة إلى الرئيسية أو تصفّح الخدمات.</p>
    <div class="mt-9 flex flex-wrap justify-center gap-3">
      <a class="btn btn-primary" href="/">الصفحة الرئيسية</a>
      <a class="btn btn-line" href="/services/">الخدمات</a>
    </div>
  </div>
</section>`;
  return layout(c, { path: '/404', title: 'الصفحة غير موجودة | ' + c.site.clinicName, meta: 'الصفحة غير موجودة.', body });
}

module.exports = { home, about, servicesIndex, service, insurance, education, contact, simplePage, notFound };
