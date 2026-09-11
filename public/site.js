/* ============================================================
   تفاعلات الموقع — حركة قليلة ومقصودة
   الترويسة · قائمة الموبايل · الظهور عند التمرير
   مجالات الرعاية · حالة العيادة · الفيديو · نموذج الحجز
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- الترويسة عند التمرير ---------- */
  var header = document.getElementById('siteHeader');
  var headerInner = document.getElementById('headerInner');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var scrolled = y > 8;

    if (header) {
      header.setAttribute('data-at-top', scrolled ? 'false' : 'true');
      header.classList.toggle('bg-white/92', scrolled);
      header.classList.toggle('backdrop-blur-xl', scrolled);
      header.classList.toggle('border-line', scrolled);
      header.classList.toggle('shadow-[0_1px_3px_rgb(16_37_54_/_.06)]', scrolled);
      if (headerInner) {
        headerInner.classList.toggle('py-2.5', scrolled);
        headerInner.classList.toggle('py-4', !scrolled);
      }
    }
    if (toTop) {
      toTop.classList.toggle('opacity-100', y > 700);
      toTop.classList.toggle('translate-y-0', y > 700);
      toTop.classList.toggle('pointer-events-none', y <= 700);
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- قائمة الموبايل ---------- */
  var navToggle = document.getElementById('navToggle');
  var navWrap = document.getElementById('mobileNav');
  var navPanel = document.getElementById('navPanel');
  var navBackdrop = document.getElementById('navBackdrop');
  var navClose = document.getElementById('navClose');
  var lastFocus = null;

  function openNav() {
    if (!navWrap) return;
    lastFocus = document.activeElement;
    navWrap.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      navPanel.classList.remove('translate-x-full');
      navBackdrop.classList.add('opacity-100');
    });
    navToggle.setAttribute('aria-expanded', 'true');
    if (navClose) navClose.focus();
  }

  function closeNav() {
    if (!navWrap) return;
    navPanel.classList.add('translate-x-full');
    navBackdrop.classList.remove('opacity-100');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { navWrap.classList.add('hidden'); }, reduced ? 0 : 300);
    if (lastFocus) lastFocus.focus();
  }

  if (navToggle) navToggle.addEventListener('click', openNav);
  if (navClose) navClose.addEventListener('click', closeNav);
  if (navBackdrop) navBackdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navWrap && !navWrap.classList.contains('hidden')) closeNav();
  });

  /* ---------- الظهور عند التمرير ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  }

  /* ---------- حالة العيادة + تمييز يوم اليوم ---------- */
  (function clinicStatus() {
    var raw = document.getElementById('clinic-hours');
    if (!raw) return;
    var days;
    try { days = JSON.parse(raw.textContent); } catch (e) { return; }
    if (!days || !days.length) return;

    var AR_DAY = { Sat: 'السبت', Sun: 'الأحد', Mon: 'الاثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة' };
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Baghdad', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
    } catch (e) { return; }

    var wd = '', hh = '00', mm = '00';
    parts.forEach(function (p) {
      if (p.type === 'weekday') wd = p.value.slice(0, 3);
      if (p.type === 'hour') hh = p.value;
      if (p.type === 'minute') mm = p.value;
    });
    var todayName = AR_DAY[wd];
    if (!todayName) return;

    var today = days.filter(function (d) { return d.day === todayName; })[0];
    var now = parseInt(hh, 10) * 60 + parseInt(mm, 10);

    function toMin(t) {
      var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    }

    var isOpen = false;
    if (today && today.open) {
      var f = toMin(today.from), t = toMin(today.to);
      if (f != null && t != null) isOpen = now >= f && now < t;
    }

    Array.prototype.forEach.call(document.querySelectorAll('#openBadge'), function (badge) {
      badge.classList.remove('hidden');
      if (isOpen) {
        badge.className = 'rounded-full bg-emerald-50 px-3 py-1 text-[.83rem] font-medium text-emerald-700 ring-1 ring-emerald-200';
        badge.innerHTML = '<span class="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle"></span>مفتوحة الآن';
      } else {
        badge.className = 'rounded-full bg-navy-100 px-3 py-1 text-[.83rem] font-medium text-navy-500';
        badge.textContent = 'مغلقة الآن';
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('#hoursTable tr'), function (tr) {
      if (tr.getAttribute('data-day') !== todayName) return;
      var th = tr.querySelector('th');
      if (th && th.querySelector('[data-today]')) return;
      if (th) {
        var tag = document.createElement('span');
        tag.setAttribute('data-today', '');
        tag.className = 'ms-2 rounded bg-brand-600 px-1.5 py-0.5 align-middle text-[.7rem] font-medium text-white';
        tag.textContent = 'اليوم';
        th.appendChild(tag);
      }
    });
  })();

  /* ---------- الفيديو: تحميل عند الطلب ---------- */
  function playFacade(el) {
    var src = el.getAttribute('data-embed');
    if (!src) return;
    var f = document.createElement('iframe');
    f.src = src + '&autoplay=1';
    f.title = el.getAttribute('aria-label') || 'فيديو';
    f.className = 'h-full w-full border-0';
    f.allow = 'accelerometer; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', '');
    el.innerHTML = '';
    el.appendChild(f);
    el.removeAttribute('role');
    el.removeAttribute('tabindex');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.video-facade[data-embed]'), function (el) {
    el.addEventListener('click', function () { playFacade(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playFacade(el); }
    });
  });

  /* ---------- نموذج الحجز ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    var msg = document.getElementById('bf-msg');
    // في النسخة الثابتة (بلا خادم) يُرسل الطلب عبر واتساب
    var waNumber = form.getAttribute('data-whatsapp') || '';
    var isStatic = form.getAttribute('data-mode') === 'whatsapp';

    // لا تسمح باختيار تاريخ ماضٍ
    var dateEl = form.querySelector('#bf-date');
    if (dateEl) {
      try {
        var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad' }).format(new Date());
        dateEl.min = p;
      } catch (e) {}
    }

    function setMsg(text, ok) {
      msg.textContent = text;
      msg.className = 'mt-4 min-h-[1.5em] text-[.95rem] ' + (ok ? 'text-emerald-300' : 'text-rose-300');
    }
    function markInvalid(el) {
      if (!el) return;
      el.classList.add('border-rose-400');
      el.addEventListener('input', function once() {
        el.classList.remove('border-rose-400');
        el.removeEventListener('input', once);
      });
      el.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var label = btn.innerHTML;

      var data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        date: form.date ? form.date.value : '',
        time: form.time ? form.time.value : '',
        reason: form.reason ? form.reason.value : '',
        note: form.note.value.trim(),
        consent: form.consent.checked
      };

      if (data.name.length < 2) { setMsg('الرجاء كتابة الاسم.'); markInvalid(form.name); return; }
      if (!/^[\d\s+\-()]{7,20}$/.test(data.phone)) { setMsg('الرجاء كتابة رقم تواصل صحيح.'); markInvalid(form.phone); return; }
      if (!data.consent) { setMsg('الرجاء الموافقة على التواصل لتأكيد الموعد.'); return; }

      // النسخة الثابتة: افتح واتساب برسالة جاهزة
      if (isStatic && waNumber) {
        var lines = ['طلب موعد', 'الاسم: ' + data.name, 'رقم التواصل: ' + data.phone];
        if (data.date) lines.push('التاريخ المفضل: ' + data.date);
        if (data.time) lines.push('الوقت المفضل: ' + data.time);
        if (data.reason) lines.push('سبب المراجعة: ' + data.reason);
        if (data.note) lines.push('ملاحظة: ' + data.note);
        window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
        setMsg('فُتح واتساب برسالة جاهزة — أرسلها ليصل طلبك إلى العيادة.', true);
        return;
      }

      btn.disabled = true;
      btn.textContent = 'جارٍ الإرسال...';
      fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.ok) {
            form.reset();
            setMsg(res.j.message || 'تم استلام طلب الموعد. سيتواصل فريق العيادة لتأكيد الموعد ضمن أوقات العمل.', true);
          } else {
            setMsg((res.j && res.j.error) || 'تعذر إرسال الطلب. حاول مرة أخرى أو اتصل بالعيادة.');
          }
        })
        .catch(function () { setMsg('تعذر الاتصال. يمكنك الاتصال بالعيادة مباشرة.'); })
        .finally(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }
})();
