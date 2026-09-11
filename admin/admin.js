/* لوحة تحكم موقع العيادة — بدون مكتبات خارجية */
(function () {
  'use strict';

  var data = null;        // محتوى الموقع
  var dirty = false;
  var current = 'home';
  var uploads = [];

  /* ---------- أدوات ---------- */

  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === true) e.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function get(path) {
    return path.split('.').reduce(function (o, k) {
      if (o == null) return undefined;
      return /^\d+$/.test(k) ? o[+k] : o[k];
    }, data);
  }

  function set(path, val) {
    var parts = path.split('.');
    var last = parts.pop();
    var o = parts.reduce(function (o, k) { return /^\d+$/.test(k) ? o[+k] : o[k]; }, data);
    o[/^\d+$/.test(last) ? +last : last] = val;
    markDirty();
  }

  function markDirty() {
    dirty = true;
    document.getElementById('dirty').hidden = false;
  }

  function toast(msg, isErr) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (isErr ? ' err' : '');
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function api(url, opts) {
    return fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts))
      .then(function (r) {
        if (r.status === 401) { showLogin(); throw new Error('انتهت الجلسة'); }
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || 'خطأ غير متوقع');
          return j;
        });
      });
  }

  /* ---------- حقول ---------- */

  function field(label, path, opts) {
    opts = opts || {};
    var val = get(path);
    var input;
    if (opts.type === 'textarea') {
      input = h('textarea', { rows: opts.rows || 4 });
      input.value = val == null ? '' : val;
    } else if (opts.type === 'select') {
      input = h('select', {}, (opts.options || []).map(function (o) {
        return h('option', { value: o.value, selected: String(val || '') === String(o.value) }, [o.label]);
      }));
    } else {
      input = h('input', { type: opts.type || 'text', placeholder: opts.placeholder || '' });
      input.value = val == null ? '' : val;
    }

    var counter = null;
    if (opts.max) {
      counter = h('span', { class: 'counter' });
      var upd = function () {
        var n = input.value.length;
        counter.textContent = n + ' / ' + opts.max;
        counter.className = 'counter' + (n > opts.max ? ' over' : '');
      };
      input.addEventListener('input', upd);
      upd();
    }

    input.addEventListener('input', function () { set(path, input.value); });

    return h('div', { class: 'f' }, [
      h('label', {}, [label, counter].filter(Boolean)),
      input,
      opts.hint ? h('p', { class: 'hint', text: opts.hint }) : null
    ]);
  }

  function checkField(label, path, hint) {
    var input = h('input', { type: 'checkbox' });
    input.checked = !!get(path);
    input.addEventListener('change', function () { set(path, input.checked); });
    var id = 'c' + Math.random().toString(36).slice(2, 8);
    input.id = id;
    return h('div', {}, [
      h('div', { class: 'f row' }, [input, h('label', { for: id, text: label })]),
      hint ? h('p', { class: 'hint', text: hint }) : null
    ]);
  }

  function cols(children) { return h('div', { class: 'cols' }, children); }

  function panel(title, hint, children) {
    return h('section', { class: 'panel' }, [
      h('h2', { text: title }),
      hint ? h('p', { class: 'panel-hint', text: hint }) : null
    ].concat(children));
  }

  /* عنصر متكرر (مصفوفة) */
  function repeater(arrPath, opts) {
    var arr = get(arrPath) || [];
    var wrap = h('div', {});

    arr.forEach(function (item, i) {
      var basePath = arrPath + '.' + i;
      var collapsed = opts.collapsible && arr.length > 1;
      var box = h('div', { class: 'rep-item' + (collapsed ? ' collapsed' : '') });
      var body = h('div', { class: 'rep-body' }, opts.fields(item, basePath, i));

      var tools = h('div', { class: 'rep-tools' }, [
        opts.collapsible ? h('button', {
          class: 'toggle-body', type: 'button',
          onclick: function () { box.classList.toggle('collapsed'); }
        }, ['فتح / طي']) : null,
        i > 0 ? h('button', {
          class: 'btn btn-ghost btn-sm', type: 'button', title: 'تحريك للأعلى',
          onclick: function () { var a = get(arrPath); a.splice(i - 1, 0, a.splice(i, 1)[0]); markDirty(); render(); }
        }, ['▲']) : null,
        i < arr.length - 1 ? h('button', {
          class: 'btn btn-ghost btn-sm', type: 'button', title: 'تحريك للأسفل',
          onclick: function () { var a = get(arrPath); a.splice(i + 1, 0, a.splice(i, 1)[0]); markDirty(); render(); }
        }, ['▼']) : null,
        opts.noDelete ? null : h('button', {
          class: 'btn btn-danger btn-sm', type: 'button',
          onclick: function () {
            if (!confirm('حذف هذا العنصر؟')) return;
            get(arrPath).splice(i, 1); markDirty(); render();
          }
        }, ['حذف'])
      ].filter(Boolean));

      box.appendChild(h('div', { class: 'rep-head' }, [
        h('strong', { text: opts.title ? opts.title(item, i) : ('عنصر ' + (i + 1)) }),
        tools
      ]));
      box.appendChild(body);
      wrap.appendChild(box);
    });

    if (opts.newItem) {
      wrap.appendChild(h('button', {
        class: 'btn btn-ghost rep-add', type: 'button',
        onclick: function () { get(arrPath).push(opts.newItem()); markDirty(); render(); }
      }, ['+ ' + (opts.addLabel || 'إضافة')]));
    }
    return wrap;
  }

  /* قائمة نصية بسيطة (مصفوفة نصوص) */
  function stringList(arrPath, addLabel) {
    var arr = get(arrPath) || [];
    var wrap = h('div', {});
    arr.forEach(function (v, i) {
      var input = h('input', { type: 'text' });
      input.value = v;
      input.addEventListener('input', function () { get(arrPath)[i] = input.value; markDirty(); });
      wrap.appendChild(h('div', { class: 'f row' }, [
        input,
        h('button', {
          class: 'btn btn-danger btn-sm', type: 'button',
          onclick: function () { get(arrPath).splice(i, 1); markDirty(); render(); }
        }, ['حذف'])
      ]));
    });
    wrap.appendChild(h('button', {
      class: 'btn btn-ghost btn-sm', type: 'button',
      onclick: function () { get(arrPath).push(''); markDirty(); render(); }
    }, ['+ ' + (addLabel || 'إضافة سطر')]));
    return wrap;
  }

  /* ---------- رفع الصور ---------- */

  function imageField(path, opts) {
    opts = opts || {};
    var val = get(path);
    var wide = opts.aspect === 'video';          // غلاف فيديو 16:9 بدل الصورة العمودية
    var shape = wide ? ' img-wide' : '';

    var preview = val
      ? h('img', { class: 'img-preview' + shape, src: val, alt: '' })
      : h('div', { class: 'img-empty' + shape }, [
          h('span', { class: 'block text-2xl', text: '🖼' }),
          h('span', { class: 'mt-1 block', text: 'لا توجد صورة' }),
          h('span', { class: 'mt-1 block text-[.8rem]', text: 'اسحب صورة هنا' })
        ]);

    var fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    fileInput.style.display = 'none';

    // ضغط الصورة داخل المتصفح قبل الرفع: تصغير للعرض الأقصى + تحويل إلى WebP
    function compress(file, maxW, done) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, maxW / img.naturalWidth);
          var cw = Math.round(img.naturalWidth * scale);
          var ch = Math.round(img.naturalHeight * scale);
          var cv = document.createElement('canvas');
          cv.width = cw; cv.height = ch;
          cv.getContext('2d').drawImage(img, 0, 0, cw, ch);

          var out = cv.toDataURL('image/webp', 0.85);
          if (out.indexOf('data:image/webp') !== 0) out = cv.toDataURL('image/jpeg', 0.85); // متصفح قديم
          URL.revokeObjectURL(url);
          done(out, cw, ch);
        } catch (e) {
          URL.revokeObjectURL(url);
          done(null);
        }
      };
      img.onerror = function () { URL.revokeObjectURL(url); done(null); };
      img.src = url;
    }

    function sendUp(dataUrl, note) {
      toast('جارٍ رفع الصورة...');
      api('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({ dataUrl: dataUrl, prefix: opts.prefix || 'img' })
      }).then(function (r) {
        set(path, r.url);
        toast('تم رفع الصورة' + (note || '') + '. لا تنسَ الضغط على «حفظ التغييرات».');
        loadUploads().then(render);
      }).catch(function (e) { toast(e.message, true); });
    }

    function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' م.ب' : Math.round(n / 1024) + ' ك.ب'; }

    function upload(f) {
      if (!f) return;
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast('الصيغة غير مدعومة. استخدم JPG أو PNG أو WebP.', true); return; }
      if (f.size > 12 * 1024 * 1024) { toast('حجم الصورة أكبر من 12 ميغابايت', true); return; }

      var maxW = opts.maxWidth || (opts.aspect === 'video' ? 1280 : 1000);

      compress(f, maxW, function (dataUrl, w, hgt) {
        if (!dataUrl) {
          // تعذّر الضغط: ارفع الأصل كما هو
          if (f.size > 8 * 1024 * 1024) { toast('حجم الصورة أكبر من 8 ميغابايت', true); return; }
          var reader = new FileReader();
          reader.onload = function () { sendUp(reader.result, ''); };
          reader.readAsDataURL(f);
          return;
        }
        var newSize = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
        var note = newSize < f.size
          ? ' وضُغطت من ' + kb(f.size) + ' إلى ' + kb(newSize) + ' (' + w + '×' + hgt + ')'
          : '';
        sendUp(dataUrl, note);
      });
    }

    fileInput.addEventListener('change', function () { upload(fileInput.files[0]); });

    var gallery = h('div', { class: 'gallery' }, uploads.slice(0, 12).map(function (u) {
      return h('img', {
        src: u.url, alt: '', title: 'استخدام هذه الصورة',
        onclick: function () { set(path, u.url); render(); }
      });
    }));

    var box = h('div', { class: 'img-box' }, [
      preview,
      h('div', { class: 'img-actions' }, [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { fileInput.click(); } },
          [val ? 'تغيير الصورة' : 'رفع صورة']),
        val ? h('button', {
          class: 'btn btn-danger btn-sm', type: 'button', style: 'margin-inline-start:8px',
          onclick: function () { set(path, ''); render(); }
        }, [opts.removeLabel || 'إزالة الصورة']) : null,
        fileInput,
        h('p', { class: 'hint', text: opts.hint || 'الصيغ المدعومة: JPG أو PNG أو WebP. يُفضل صورة عمودية واضحة بحجم أقل من 1 ميغابايت.' }),
        uploads.length ? h('p', { class: 'hint', text: 'أو اختر من الصور المرفوعة سابقاً:' }) : null,
        uploads.length ? gallery : null
      ].filter(Boolean))
    ]);

    // سحب وإفلات الصورة مباشرة على المعاينة
    ['dragenter', 'dragover'].forEach(function (ev) {
      box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.add('dragging'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.remove('dragging'); });
    });
    box.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
    });
    preview.addEventListener('click', function () { fileInput.click(); });
    preview.style.cursor = 'pointer';

    return box;
  }

  /* ---------- التبويبات ---------- */

  var TABS = [
    { id: 'home', name: 'الصفحة الرئيسية' },
    { id: 'hours', name: 'دوام العيادة' },
    { id: 'videos', name: 'الفيديوهات' },
    { id: 'services', name: 'الخدمات' },
    { id: 'articles', name: 'المقالات' },
    { id: 'clinic', name: 'معلومات العيادة' },
    { id: 'pages', name: 'باقي الصفحات' },
    { id: 'requests', name: 'طلبات المواعيد' },
    { id: 'settings', name: 'الإعدادات' }
  ];

  function serviceOptions() {
    return [{ value: '', label: '— بدون ربط —' }].concat(
      data.services.map(function (s) { return { value: s.slug, label: s.name }; })
    );
  }

  /* --- الرئيسية --- */
  function viewHome() {
    return [
      panel('صورة البداية (الهيرو)', 'الصورة التي تظهر أول شاشة للزائر. العنوان نص حقيقي وليس جزءاً من الصورة.', [
        imageField('hero.image', { prefix: 'hero' }),
        field('الوصف البديل للصورة (alt)', 'hero.imageAlt', { hint: 'وصف واقعي مثل: د. محمد سالم عبدالسلام في العيادة.' })
      ]),
      panel('نصوص أول شاشة', null, [
        field('السطر التمهيدي فوق العنوان', 'hero.eyebrow'),
        field('العنوان الرئيسي H1', 'hero.h1', { type: 'textarea', rows: 2 }),
        field('الفقرة التعريفية', 'hero.lead', { type: 'textarea', rows: 3 }),
        cols([
          field('زر أساسي', 'hero.primaryBtn'),
          field('زر ثانوي', 'hero.secondaryBtn'),
          field('زر الخرائط', 'hero.thirdBtn')
        ]),
        h('h3', { text: 'شارات فوق الصورة' }),
        h('p', { class: 'mb-3 text-[.9rem] text-navy-400', text: 'كلمات قصيرة تظهر أسفل صورة الطبيب. لا تكتب أرقاماً أو مؤهلات غير موثقة.' }),
        stringList('hero.chips', 'إضافة شارة')
      ]),
      panel('تعرّف على الطبيب', 'قسم التعريف في الرئيسية. النص المعروض يأتي من «عن الطبيب».', [
        field('عنوان القسم', 'home.introTitle'),
        h('h3', { text: 'بطاقات المعلومات' }),
        repeater('home.introFacts', {
          title: function (f) { return f.label || 'بطاقة'; },
          addLabel: 'إضافة بطاقة',
          newItem: function () { return { label: '', value: '' }; },
          fields: function (f, base) {
            return [cols([field('العنوان', base + '.label'), field('القيمة', base + '.value')])];
          }
        })
      ]),
      panel('لماذا تختار العيادة', 'مبادئ العمل كما تظهر في القسم الداكن. اكتب وصفاً لطريقة العمل، بلا وعود أو أرقام.', [
        field('عنوان القسم', 'home.trustTitle'),
        repeater('home.trust', {
          title: function (t) { return t.h || 'مبدأ'; },
          addLabel: 'إضافة مبدأ',
          newItem: function () { return { h: '', b: '' }; },
          fields: function (t, base) {
            return [field('العنوان', base + '.h'), field('الشرح', base + '.b', { type: 'textarea', rows: 2 })];
          }
        })
      ]),
      panel('مجالات الرعاية', 'أربعة مجالات تظهر مع الرسم التفاعلي، ويمكن ربط كل مجال بصفحة خدمة.', [
        field('عنوان القسم', 'home.specialtiesTitle'),
        field('نص تمهيدي', 'home.specialtiesIntro', { type: 'textarea', rows: 2 }),
        repeater('home.specialties', {
          title: function (s) { return s.name || 'مجال'; },
          addLabel: 'إضافة مجال',
          newItem: function () { return { name: '', b: '', service: '' }; },
          fields: function (s, base) {
            return [
              field('اسم المجال', base + '.name'),
              field('الوصف', base + '.b', { type: 'textarea', rows: 2 }),
              field('يربط إلى خدمة', base + '.service', { type: 'select', options: serviceOptions() })
            ];
          }
        })
      ]),
      panel('بطاقة التعريف القديمة', 'لم تعد تظهر في التصميم الجديد، وتُحفظ هنا للرجوع إليها.', [
        field('العنوان', 'home.aboutCardTitle'),
        field('النص', 'home.aboutCardText', { type: 'textarea', rows: 3 })
      ]),
      panel('كيف تتم المراجعة', 'ثلاث خطوات تظهر في الرئيسية.', [
        field('عنوان القسم', 'home.stepsTitle'),
        repeater('home.steps', {
          title: function (it) { return it.h || 'خطوة'; },
          addLabel: 'إضافة خطوة',
          newItem: function () { return { h: '', b: '' }; },
          fields: function (it, base) {
            return [field('العنوان', base + '.h'), field('الشرح', base + '.b', { type: 'textarea', rows: 2 })];
          }
        })
      ]),
      panel('فقرة الضمان الصحي في الرئيسية', null, [
        field('النص', 'home.insuranceBlurb', { type: 'textarea', rows: 3 })
      ]),
      panel('بيانات محركات البحث للصفحة الرئيسية', 'العدد المقترح للأحرف إرشادي فقط، وGoogle قد يعيد صياغة العنوان أو الوصف.', [
        field('Title', 'home.title', { max: 60 }),
        field('Meta description', 'home.meta', { type: 'textarea', rows: 2, max: 160 })
      ])
    ];
  }

  /* --- الدوام --- */
  function viewHours() {
    return [
      panel('دوام العيادة', 'يظهر في الرئيسية والتذييل وصفحة الحجز، ويُرسل ضمن البيانات المنظمة إلى محركات البحث.', [
        repeater('hours.days', {
          noDelete: true,
          title: function (d) { return d.day; },
          fields: function (d, base) {
            return [
              checkField('العيادة تعمل في هذا اليوم', base + '.open'),
              cols([
                field('من الساعة', base + '.from', { type: 'time' }),
                field('إلى الساعة', base + '.to', { type: 'time' })
              ])
            ];
          }
        }),
        field('ملاحظة تظهر تحت الجدول', 'hours.note', { type: 'textarea', rows: 2 })
      ])
    ];
  }

  /* --- الفيديوهات --- */

  // معاينة حيّة لغلاف الفيديو + تنبيه إن كان الرابط غير مفهوم
  function coverPreview(v, base) {
    var box = h('div', { class: 'rounded-xl bg-slate-100 p-3' });

    function paint() {
      box.innerHTML = '';
      var cur = get(base) || {};
      var id = ytId(cur.url);
      var src = cur.cover || (id ? 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' : '');

      var thumb = src
        ? h('img', { src: src, alt: '', class: 'aspect-video w-56 rounded-lg object-cover ring-1 ring-slate-300' })
        : h('div', { class: 'grid aspect-video w-56 place-items-center rounded-lg bg-navy-800 text-[.85rem] text-navy-100' }, ['بدون غلاف']);

      var status;
      if (cur.cover) {
        status = h('p', { class: 'text-[.9rem] font-medium text-emerald-700', text: '✓ غلاف مرفوع يدوياً (له الأولوية)' });
      } else if (id) {
        status = h('p', { class: 'text-[.9rem] font-medium text-emerald-700', text: '✓ الرابط مفهوم — سيظهر غلاف يوتيوب تلقائياً' });
      } else if (cur.url) {
        status = h('p', { class: 'text-[.9rem] font-medium text-rose-600' }, [
          '⚠ الرابط غير مفهوم كرابط يوتيوب. سيظهر غلاف عام — ',
          h('strong', { text: 'ارفع صورة غلاف بالأسفل' }),
          ' أو صحّح الرابط.'
        ]);
      } else {
        status = h('p', { class: 'text-[.9rem] text-slate-600', text: 'ألصق رابط الفيديو لتظهر المعاينة.' });
      }

      box.appendChild(h('div', { class: 'flex flex-wrap items-start gap-4' }, [
        thumb,
        h('div', { class: 'min-w-52 flex-1' }, [
          h('p', { class: 'mb-1 text-[.9rem] font-medium text-navy-800', text: 'معاينة الغلاف' }),
          status,
          id ? h('p', { class: 'mt-1 text-[.85rem] text-slate-600', text: 'معرّف الفيديو: ' + id }) : null
        ].filter(Boolean))
      ]));
    }

    paint();
    box._repaint = paint;
    return box;
  }

  function viewVideos() {
    return [
      panel('الفيديوهات',
        'ألصق رابط يوتيوب ويظهر غلاف الفيديو تلقائياً على الموقع. الفيديو لا يُشغَّل تلقائياً ولا يُحمَّل إلا عند نقر الزائر — أفضل لسرعة الصفحة.', [
        repeater('videos', {
          collapsible: true,
          addLabel: 'إضافة فيديو',
          title: function (v) { return v.title || 'فيديو جديد'; },
          newItem: function () { return { title: '', url: '', cover: '', summary: '', transcript: '', service: '', uploadDate: '' }; },
          fields: function (v, base) {
            var prev = coverPreview(v, base);

            var urlField = field('رابط الفيديو', base + '.url', {
              placeholder: 'https://www.youtube.com/watch?v=...  أو  https://youtu.be/...',
              hint: 'تُقبل كل صيغ يوتيوب: watch و youtu.be و shorts و live، ومع أي إضافات في الرابط.'
            });
            // حدّث المعاينة أثناء الكتابة
            var input = urlField.querySelector('input');
            if (input) input.addEventListener('input', function () { prev._repaint(); });

            return [
              field('عنوان الفيديو', base + '.title'),
              urlField,
              prev,
              h('h3', { text: '🖼  صورة الغلاف' }),
              h('p', { class: 'mb-3 text-[.9rem] leading-relaxed text-slate-600' }, [
                'اتركها فارغة ليُستخدم ',
                h('strong', { text: 'غلاف يوتيوب تلقائياً' }),
                '. ارفع صورة إذا أردت غلافاً خاصاً بك — أو إذا كان الرابط من منصة أخرى (فيسبوك/إنستغرام).'
              ]),
              imageField(base + '.cover', {
                prefix: 'cover',
                aspect: 'video',
                removeLabel: 'حذف الغلاف والرجوع لغلاف يوتيوب',
                hint: 'صورة أفقية 16:9 — المقاس المثالي 1280×720. تُضغط تلقائياً إلى WebP قبل الرفع. يمكنك سحب الصورة وإفلاتها على المربع.'
              }),
              field('ملخص مكتوب', base + '.summary', { type: 'textarea', rows: 2, hint: 'ضروري: لا تكتفِ بالفيديو، اكتب ملخصاً نصياً.' }),
              field('التفريغ النصي (اختياري)', base + '.transcript', { type: 'textarea', rows: 5 }),
              cols([
                field('مرتبط بخدمة', base + '.service', { type: 'select', options: serviceOptions() }),
                field('تاريخ النشر', base + '.uploadDate', { type: 'date' })
              ])
            ];
          }
        })
      ])
    ];
  }

  // نفس منطق الخادم: يقبل كل صيغ روابط يوتيوب
  function ytId(url) {
    var s = String(url || '').trim();
    if (!s) return '';
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    var m = /[?&]v=([A-Za-z0-9_-]{11})/.exec(s);
    if (m) return m[1];
    m = /(?:youtu\.be\/|\/shorts\/|\/live\/|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/.exec(s);
    return m ? m[1] : '';
  }

  /* --- الخدمات --- */
  function viewServices() {
    return [
      panel('صفحات الخدمات', 'كل خدمة لها صفحة مستقلة. الرابط (slug) يُستخدم في عنوان الصفحة: /services/الرابط/', [
        repeater('services', {
          collapsible: true,
          addLabel: 'إضافة خدمة',
          title: function (s) { return (s.name || 'خدمة جديدة') + (s.draft ? '  •  مسودة' : ''); },
          newItem: function () {
            return {
              slug: 'new-service-' + Math.random().toString(36).slice(2, 6),
              name: '', short: '', title: '', h1: '', meta: '', intro: '',
              sections: [], faq: [], draft: true
            };
          },
          fields: function (s, base) {
            return [
              cols([
                field('اسم الخدمة', base + '.name'),
                field('الرابط (إنجليزي بأحرف صغيرة وشرطات)', base + '.slug', { hint: 'مثال: kidney-stones' })
              ]),
              field('جملة مختصرة تظهر في بطاقة الخدمة', base + '.short', { type: 'textarea', rows: 2 }),
              field('العنوان الرئيسي H1', base + '.h1'),
              field('الافتتاحية', base + '.intro', { type: 'textarea', rows: 4 }),
              h('h3', { text: 'أقسام الصفحة' }),
              repeater(base + '.sections', {
                addLabel: 'إضافة قسم',
                title: function (x) { return x.h || 'قسم'; },
                newItem: function () { return { h: '', b: '' }; },
                fields: function (x, b2) {
                  return [field('عنوان القسم', b2 + '.h'), field('النص', b2 + '.b', { type: 'textarea', rows: 4 })];
                }
              }),
              h('h3', { text: 'أسئلة شائعة' }),
              repeater(base + '.faq', {
                addLabel: 'إضافة سؤال',
                title: function (x) { return x.q || 'سؤال'; },
                newItem: function () { return { q: '', a: '' }; },
                fields: function (x, b2) {
                  return [field('السؤال', b2 + '.q'), field('الجواب', b2 + '.a', { type: 'textarea', rows: 3 })];
                }
              }),
              field('فقرة الكلفة (اختياري)', base + '.price', {
                type: 'textarea', rows: 3,
                hint: 'إن نُشر سعر، اذكر ما يشمله وما يستثنيه وتاريخ سريانه.'
              }),
              h('h3', { text: 'بيانات محركات البحث والمراجعة' }),
              field('Title', base + '.title', { max: 60 }),
              field('Meta description', base + '.meta', { type: 'textarea', rows: 2, max: 160 }),
              cols([
                field('تاريخ النشر', base + '.published', { type: 'date' }),
                field('تاريخ آخر مراجعة طبية', base + '.reviewed', { type: 'date' })
              ]),
              checkField('مسودة تحتاج مراجعة الطبيب', base + '.draft', 'علامة داخلية للوحة التحكم فقط، لا تظهر للزائر.')
            ];
          }
        })
      ])
    ];
  }

  /* --- المقالات --- */
  function viewArticles() {
    return [
      panel('المقالات التثقيفية', 'تظهر في صفحة «التثقيف الطبي»، ويمكن ربط كل مقال بصفحة خدمة.', [
        repeater('articles', {
          collapsible: true,
          addLabel: 'إضافة مقال',
          title: function (a) { return a.title || 'مقال جديد'; },
          newItem: function () {
            return { id: 'a' + Date.now().toString(36), title: '', summary: '', body: '', service: '', published: '', reviewed: '' };
          },
          fields: function (a, base) {
            return [
              field('عنوان المقال (سؤال واضح)', base + '.title'),
              field('جواب مختصر في البداية', base + '.summary', { type: 'textarea', rows: 2 }),
              field('نص المقال', base + '.body', { type: 'textarea', rows: 10, hint: 'اترك سطراً فارغاً بين كل فقرة وأخرى.' }),
              cols([
                field('مرتبط بخدمة', base + '.service', { type: 'select', options: serviceOptions() }),
                field('تاريخ النشر', base + '.published', { type: 'date' }),
                field('آخر مراجعة', base + '.reviewed', { type: 'date' })
              ])
            ];
          }
        })
      ]),
      panel('نصوص صفحة التثقيف', null, [
        field('العنوان H1', 'education.h1'),
        field('المقدمة', 'education.intro', { type: 'textarea', rows: 2 }),
        field('Title', 'education.title', { max: 60 }),
        field('Meta description', 'education.meta', { type: 'textarea', rows: 2, max: 160 })
      ])
    ];
  }

  /* --- معلومات العيادة --- */
  function viewClinic() {
    return [
      panel('الهوية', null, [
        cols([
          field('اسم الطبيب', 'site.doctorName'),
          field('اسم العيادة', 'site.clinicName')
        ]),
        cols([
          field('الاسم التجاري بالإنجليزية', 'site.brandEn'),
          field('السطر التعريفي', 'site.tagline')
        ]),
        field('دومين الموقع', 'site.domain', { hint: 'يُستخدم في canonical وخريطة الموقع. مثال: https://drmuhamedsalim.com' })
      ]),
      panel('الاتصال والعنوان', 'الاسم والعنوان والهاتف يجب أن تكون متطابقة في الموقع وGoogle والحسابات الاجتماعية.', [
        cols([
          field('الهاتف كما يُعرض', 'site.phoneDisplay'),
          field('الهاتف بصيغة دولية', 'site.phoneIntl', { hint: 'مثال: +9647744389292' })
        ]),
        cols([
          field('رقم واتساب (أرقام فقط)', 'site.whatsapp', { hint: 'مثال: 9647744389292' })
        ]),
        checkField('إظهار زر واتساب', 'site.whatsappEnabled', 'فعّله بعد التأكد أن الرقم مفعّل على واتساب.'),
        field('العنوان', 'site.address', { type: 'textarea', rows: 2 }),
        field('المدينة', 'site.addressLocality'),
        field('رابط الدبوس على خرائط Google', 'site.mapsUrl', { hint: 'اتركه فارغاً حتى تتأكد من صحة الدبوس. عند تركه فارغاً لا يظهر زر الاتجاهات.' })
      ]),
      panel('الحسابات والروابط', 'روابط حساباتك الرسمية فقط.', [
        cols([
          field('إنستغرام (اسم المستخدم)', 'site.instagram'),
          field('فيسبوك (رابط كامل)', 'site.facebook'),
          field('يوتيوب (رابط كامل)', 'site.youtube')
        ])
      ]),
      panel('جهة العمل', null, [
        field('المستشفى', 'site.hospital'),
        field('ملاحظة', 'site.hospitalNote', { type: 'textarea', rows: 2 })
      ]),
      panel('نصوص التذييل', null, [
        field('سطر التذييل', 'site.footerNote', { type: 'textarea', rows: 2 }),
        field('التنبيه الطبي', 'site.medicalDisclaimer', { type: 'textarea', rows: 2 })
      ])
    ];
  }

  /* --- باقي الصفحات --- */
  function viewPages() {
    return [
      panel('صفحة: عن الطبيب', null, [
        field('العنوان H1', 'about.h1'),
        field('التعريف المهني', 'about.bio', { type: 'textarea', rows: 6 }),
        h('h3', { text: 'المؤهلات' }),
        h('p', { class: 'hint', text: 'أضف كل مؤهل موثّق في سطر: الشهادة، الجهة المانحة، السنة.' }),
        stringList('about.credentials', 'إضافة مؤهل'),
        field('نص يظهر عند عدم وجود مؤهلات مضافة', 'about.credentialsNote', { type: 'textarea', rows: 2 }),
        h('h3', { text: 'جهات العمل' }),
        repeater('about.workplaces', {
          addLabel: 'إضافة جهة عمل',
          title: function (w) { return w.name || 'جهة عمل'; },
          newItem: function () { return { name: '', detail: '', url: '' }; },
          fields: function (w, base) {
            return [field('الاسم', base + '.name'), field('التفاصيل', base + '.detail'), field('رابط الصفحة المهنية', base + '.url')];
          }
        }),
        h('h3', { text: 'البحوث المنشورة' }),
        repeater('about.publications', {
          addLabel: 'إضافة بحث',
          title: function (p) { return p.title || 'بحث'; },
          newItem: function () { return { title: '', journal: '', year: '', doi: '' }; },
          fields: function (p, base) {
            return [
              field('عنوان البحث', base + '.title'),
              cols([field('المجلة', base + '.journal'), field('السنة', base + '.year')]),
              field('رابط DOI أو الناشر', base + '.doi')
            ];
          }
        }),
        field('نص يظهر عند عدم وجود بحوث', 'about.publicationsNote', { type: 'textarea', rows: 2 }),
        field('Title', 'about.title', { max: 60 }),
        field('Meta description', 'about.meta', { type: 'textarea', rows: 2, max: 160 })
      ]),

      panel('صفحة: الضمان الصحي', null, [
        field('العنوان H1', 'insurance.h1'),
        field('النص', 'insurance.body', { type: 'textarea', rows: 4 }),
        h('h3', { text: 'نقاط' }),
        stringList('insurance.points', 'إضافة نقطة'),
        field('ملاحظة التحديث', 'insurance.updatedNote'),
        field('Title', 'insurance.title', { max: 60 }),
        field('Meta description', 'insurance.meta', { type: 'textarea', rows: 2, max: 160 })
      ]),

      panel('صفحة: الحجز والموقع', null, [
        field('العنوان H1', 'contact.h1'),
        field('وصف الوصول', 'contact.directions', { type: 'textarea', rows: 2 }),
        field('ملاحظة عند عدم وجود رابط خرائط', 'contact.directionsNote', { type: 'textarea', rows: 2 }),
        field('عنوان قسم الحجز', 'contact.bookingTitle'),
        field('ملاحظة أعلى النموذج', 'contact.formNote', { type: 'textarea', rows: 2 }),
        cols([
          field('عنوان حقل سبب المراجعة', 'contact.reasonLabel'),
          field('الخيار الافتراضي لسبب المراجعة', 'contact.reasonDefault')
        ]),
        field('رسالة النجاح بعد الإرسال', 'contact.successMsg', { type: 'textarea', rows: 2 }),
        field('نص الموافقة', 'contact.consentLabel', { type: 'textarea', rows: 2 }),
        h('h3', { text: 'أسئلة الحجز الشائعة' }),
        repeater('contact.faq', {
          addLabel: 'إضافة سؤال',
          title: function (f) { return f.q || 'سؤال'; },
          newItem: function () { return { q: '', a: '' }; },
          fields: function (f, base) {
            return [field('السؤال', base + '.q'), field('الجواب', base + '.a', { type: 'textarea', rows: 2 })];
          }
        }),
        field('Title', 'contact.title', { max: 60 }),
        field('Meta description', 'contact.meta', { type: 'textarea', rows: 2, max: 160 })
      ]),

      panel('صفحة: سياسة التحرير الطبي', null, [
        field('العنوان H1', 'editorial.h1'),
        field('النص', 'editorial.body', { type: 'textarea', rows: 4 }),
        stringList('editorial.points', 'إضافة بند'),
        field('Title', 'editorial.title', { max: 60 }),
        field('Meta description', 'editorial.meta', { type: 'textarea', rows: 2, max: 160 })
      ]),

      panel('صفحة: الخصوصية', null, [
        field('العنوان H1', 'privacy.h1'),
        field('النص', 'privacy.body', { type: 'textarea', rows: 4 }),
        stringList('privacy.points', 'إضافة بند'),
        field('ملاحظة', 'privacy.note', { type: 'textarea', rows: 2 }),
        field('Title', 'privacy.title', { max: 60 }),
        field('Meta description', 'privacy.meta', { type: 'textarea', rows: 2, max: 160 })
      ])
    ];
  }

  /* --- طلبات المواعيد --- */
  function viewRequests() {
    var box = h('div', {}, [h('p', { class: 'muted', text: 'جارٍ التحميل...' })]);
    api('/api/admin/requests').then(function (list) {
      box.innerHTML = '';
      if (!list.length) {
        box.appendChild(h('p', { class: 'muted', text: 'لا توجد طلبات حتى الآن.' }));
        return;
      }
      box.appendChild(h('p', { class: 'muted small', text: 'عدد الطلبات: ' + list.length + '. البيانات محفوظة في ملف data/requests.json على الخادم.' }));
      var rows = list.map(function (r) {
        var done = r.status === 'تم التأكيد';
        return h('tr', {}, [
          h('td', {}, [
            h('strong', { text: r.name }), h('br'),
            h('a', { href: 'tel:' + r.phone, style: 'direction:ltr;display:inline-block' }, [r.phone])
          ]),
          h('td', {}, [
            (r.date || r.time)
              ? h('span', {}, [
                  r.date ? h('strong', { text: r.date }) : null,
                  r.date && r.time ? h('br') : null,
                  r.time ? h('span', { dir: 'ltr', text: r.time }) : null
                ].filter(Boolean))
              : h('span', { text: r.preferred || '—' })
          ]),
          h('td', { text: r.reason || '—' }),
          h('td', { text: r.note || '—' }),
          h('td', { text: new Date(r.createdAt).toLocaleString('ar-IQ') }),
          h('td', {}, [h('span', { class: 'status-pill' + (done ? ' done' : ''), text: r.status })]),
          h('td', {}, [
            h('button', {
              class: 'btn btn-ghost btn-sm', type: 'button',
              onclick: function () {
                api('/api/admin/requests/' + r.id, {
                  method: 'PATCH',
                  body: JSON.stringify({ status: done ? 'جديد' : 'تم التأكيد' })
                }).then(function () { render(); });
              }
            }, [done ? 'إرجاع لجديد' : 'تم التأكيد']),
            h('button', {
              class: 'btn btn-danger btn-sm', type: 'button', style: 'margin-inline-start:6px',
              onclick: function () {
                if (!confirm('حذف طلب ' + r.name + '؟')) return;
                api('/api/admin/requests/' + r.id, { method: 'DELETE' }).then(function () { render(); });
              }
            }, ['حذف'])
          ])
        ]);
      });
      box.appendChild(h('div', { style: 'overflow-x:auto' }, [
        h('table', { class: 'tbl' }, [
          h('thead', {}, [h('tr', {}, ['المراجع', 'الموعد المفضل', 'سبب المراجعة', 'ملاحظة', 'وصل في', 'الحالة', ''].map(function (t) { return h('th', { text: t }); }))]),
          h('tbody', {}, rows)
        ])
      ]));
    }).catch(function (e) { box.innerHTML = ''; box.appendChild(h('p', { class: 'msg err', text: e.message })); });

    return [panel('طلبات المواعيد', 'الطلب ليس حجزاً مؤكداً. اتصل بالمراجع لتأكيد الموعد، ثم غيّر الحالة.', [box])];
  }

  /* --- الإعدادات --- */
  function viewSettings() {
    var pwMsg = h('p', { class: 'msg' });
    var cur = h('input', { type: 'password', autocomplete: 'current-password' });
    var nw = h('input', { type: 'password', autocomplete: 'new-password' });
    var nw2 = h('input', { type: 'password', autocomplete: 'new-password' });

    var backupsBox = h('div', {}, [h('p', { class: 'muted', text: 'جارٍ التحميل...' })]);
    api('/api/admin/backups').then(function (list) {
      backupsBox.innerHTML = '';
      if (!list.length) { backupsBox.appendChild(h('p', { class: 'muted', text: 'لا توجد نسخ بعد. تُنشأ نسخة تلقائياً عند كل حفظ.' })); return; }
      backupsBox.appendChild(h('div', { style: 'overflow-x:auto' }, [
        h('table', { class: 'tbl' }, [
          h('tbody', {}, list.slice(0, 15).map(function (b) {
            var stamp = b.file.replace('content-', '').replace('.json', '').replace(/-/g, ':').slice(0, 19);
            return h('tr', {}, [
              h('td', { text: stamp.replace('T', '  ') }),
              h('td', { text: Math.round(b.size / 1024) + ' كيلوبايت' }),
              h('td', {}, [h('button', {
                class: 'btn btn-ghost btn-sm', type: 'button',
                onclick: function () {
                  if (!confirm('استرجاع هذه النسخة؟ سيُستبدل المحتوى الحالي (وتُحفظ نسخة منه أيضاً).')) return;
                  api('/api/admin/restore', { method: 'POST', body: JSON.stringify({ file: b.file }) })
                    .then(function () { return api('/api/admin/content'); })
                    .then(function (c) { data = c; dirty = false; document.getElementById('dirty').hidden = true; render(); toast('تم الاسترجاع'); })
                    .catch(function (e) { toast(e.message, true); });
                }
              }, ['استرجاع'])])
            ]);
          }))
        ])
      ]));
    }).catch(function () { backupsBox.innerHTML = ''; });

    return [
      panel('تغيير كلمة المرور', '8 خانات فأكثر. احتفظ بها في مكان آمن.', [
        h('div', { class: 'f' }, [h('label', { text: 'كلمة المرور الحالية' }), cur]),
        h('div', { class: 'f' }, [h('label', { text: 'كلمة المرور الجديدة' }), nw]),
        h('div', { class: 'f' }, [h('label', { text: 'تأكيد كلمة المرور الجديدة' }), nw2]),
        h('button', {
          class: 'btn btn-primary', type: 'button',
          onclick: function () {
            pwMsg.className = 'msg';
            if (nw.value.length < 8) { pwMsg.className = 'msg err'; pwMsg.textContent = 'كلمة المرور الجديدة قصيرة.'; return; }
            if (nw.value !== nw2.value) { pwMsg.className = 'msg err'; pwMsg.textContent = 'التأكيد غير مطابق.'; return; }
            api('/api/admin/password', { method: 'POST', body: JSON.stringify({ current: cur.value, next: nw.value }) })
              .then(function () {
                cur.value = nw.value = nw2.value = '';
                document.getElementById('pw-warning').hidden = true;
                toast('تم تغيير كلمة المرور');
              })
              .catch(function (e) { pwMsg.className = 'msg err'; pwMsg.textContent = e.message; });
          }
        }, ['حفظ كلمة المرور']),
        pwMsg
      ]),
      panel('النسخ الاحتياطية', 'تُحفظ نسخة من المحتوى تلقائياً قبل كل عملية حفظ.', [backupsBox]),
      panel('روابط مفيدة', null, [
        h('ul', {}, [
          h('li', {}, [h('a', { href: '/', target: '_blank', rel: 'noopener' }, ['الصفحة الرئيسية'])]),
          h('li', {}, [h('a', { href: '/sitemap.xml', target: '_blank', rel: 'noopener' }, ['خريطة الموقع sitemap.xml'])]),
          h('li', {}, [h('a', { href: '/robots.txt', target: '_blank', rel: 'noopener' }, ['robots.txt'])])
        ])
      ])
    ];
  }

  var VIEWS = {
    home: viewHome, hours: viewHours, videos: viewVideos, services: viewServices,
    articles: viewArticles, clinic: viewClinic, pages: viewPages,
    requests: viewRequests, settings: viewSettings
  };

  /* ---------- العرض ---------- */

  function renderTabs() {
    var nav = document.getElementById('tabs');
    nav.innerHTML = '';
    TABS.forEach(function (t) {
      nav.appendChild(h('button', {
        class: current === t.id ? 'active' : '',
        type: 'button',
        onclick: function () { current = t.id; render(); window.scrollTo(0, 0); }
      }, [t.name]));
    });
  }

  function render() {
    renderTabs();
    var view = document.getElementById('view');
    view.innerHTML = '';
    (VIEWS[current]() || []).forEach(function (n) { if (n) view.appendChild(n); });
  }

  function save() {
    var btn = document.getElementById('save-btn');
    btn.disabled = true; btn.textContent = 'جارٍ الحفظ...';
    api('/api/admin/content', { method: 'PUT', body: JSON.stringify(data) })
      .then(function () {
        dirty = false;
        document.getElementById('dirty').hidden = true;
        toast('تم حفظ التغييرات ونشرها على الموقع');
      })
      .catch(function (e) { toast(e.message, true); })
      .finally(function () { btn.disabled = false; btn.textContent = 'حفظ التغييرات'; });
  }

  function loadUploads() {
    return api('/api/admin/uploads').then(function (list) { uploads = list; }).catch(function () { uploads = []; });
  }

  /* ---------- الدخول ---------- */

  function showLogin() {
    document.getElementById('app').hidden = true;
    document.getElementById('login').hidden = false;
    // شاشة الدخول تملأ الشاشة بلا تمرير
    document.documentElement.classList.add('is-login');
    document.body.classList.add('is-login');
    window.scrollTo(0, 0);
    setTimeout(function () { document.getElementById('pw').focus(); }, 50);
  }

  function start(isDefault) {
    document.getElementById('login').hidden = true;
    document.getElementById('app').hidden = false;
    document.documentElement.classList.remove('is-login');
    document.body.classList.remove('is-login');
    window.scrollTo(0, 0);
    document.getElementById('pw-warning').hidden = !isDefault;
    Promise.all([api('/api/admin/content'), loadUploads()]).then(function (r) {
      data = r[0];
      // ضمان وجود المصفوفات الاختيارية
      data.videos = data.videos || [];
      data.articles = data.articles || [];
      data.about.credentials = data.about.credentials || [];
      data.about.publications = data.about.publications || [];
      data.about.workplaces = data.about.workplaces || [];
      data.services.forEach(function (s) { s.sections = s.sections || []; s.faq = s.faq || []; });
      render();
    }).catch(function (e) { toast(e.message, true); });
  }

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('login-msg');
    msg.textContent = '';
    fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('pw').value })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.ok) {
          document.getElementById('pw').value = '';
          // انتقال فعلي إلى صفحة اللوحة: تبدأ من أعلى الصفحة بلا بقايا تمرير
          window.location.replace('/admin/');
        } else {
          msg.textContent = res.j.error || 'تعذر تسجيل الدخول';
        }
      })
      .catch(function () { msg.textContent = 'تعذر الاتصال بالخادم'; });
  });

  document.getElementById('save-btn').addEventListener('click', save);
  document.getElementById('logout-btn').addEventListener('click', function () {
    if (dirty && !confirm('لديك تغييرات غير محفوظة. الخروج بدون حفظ؟')) return;
    dirty = false; // لا تُظهر تحذير المغادرة عند خروج مقصود
    fetch('/api/admin/logout', { method: 'POST' })
      .then(function () { window.location.replace('/admin/'); })
      .catch(showLogin);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (data) save(); }
  });

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // بدء التشغيل
  fetch('/api/admin/session').then(function (r) { return r.json(); }).then(function (s) {
    if (s.auth) start(s.isDefault); else showLogin();
  }).catch(showLogin);
})();
