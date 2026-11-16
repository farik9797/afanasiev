/* Лендинг «Здоровый кишечник»: слайдер, меню, попапы, формы, квиз. ES2017 без зависимостей. */
(function () {
  'use strict';
  var CFG = window.AF_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- слайдер ---------- */
  var hero = $('.hero');
  if (hero) {
    var track = $('.hero__track', hero);
    var slides = $$('.slide', hero);
    var dots = $$('.hero__dots button', hero);
    var cur = 0;
    // смену слайда задаёт анимация заполнения активной точки (7 с, см. dotFill в CSS)
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * cur) + '%)';
      dots.forEach(function (d) { d.classList.remove('is-active'); });
      void dots[cur].offsetWidth; // перезапуск анимации, если точка та же
      dots[cur].classList.add('is-active');
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
      // как в прототипе: на первом слайде бледная «назад», на последнем — «вперёд»
      prev.classList.toggle('is-off', cur === 0);
      next.classList.toggle('is-off', cur === slides.length - 1);
    };
    var prev = $('.hero__arrow--prev', hero), next = $('.hero__arrow--next', hero);
    var auto = function () { hero.classList.remove('is-paused'); };
    var pause = function () { hero.classList.add('is-paused'); };
    $('.hero__dots', hero).addEventListener('animationend', function () { go(cur + 1); });
    prev.addEventListener('click', function () { if (cur > 0) go(cur - 1); });
    next.addEventListener('click', function () { if (cur < slides.length - 1) go(cur + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', auto);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', auto);
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); auto(); }
      x0 = null;
    });
    go(0); auto();
  }

  /* ---------- слайд 3: на узких экранах картинка с надписями масштабируется целиком ---------- */
  var art = $('.art3');
  if (art) {
    var fitArt = function () {
      if (window.innerWidth > 1100) { art.style.removeProperty('--s'); art.style.removeProperty('--tx'); return; }
      var box = art.parentNode, w = box.clientWidth;
      var s = Math.max(box.clientHeight / 516, w / 958);
      // в кадре держим точку между Евгением и книгой (x≈470 на макете 958×516)
      var tx = Math.min(0, Math.max(w - 958 * s, w / 2 - 470 * s));
      art.style.setProperty('--s', s.toFixed(4));
      art.style.setProperty('--tx', tx.toFixed(1) + 'px');
    };
    window.addEventListener('resize', fitArt);
    window.addEventListener('load', fitArt);
    fitArt();
  }

  /* ---------- плавающая кнопка квиза: появляется после первого экрана ---------- */
  var fab = $('.quiz-fab');
  if (fab) {
    fab.classList.add('is-shown'); // в прототипе кнопка видна сразу
  }

  /* ---------- бургер ---------- */
  var header = $('.header');
  var burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.header .menu a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- попапы ---------- */
  var lastFocus = null;
  var openModal = function (name) {
    var m = $('#modal-' + name);
    if (!m) return;
    $$('.modal').forEach(function (x) { x.hidden = true; });
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('is-locked');
    var f = $('button, input, a', $('.pop', m));
    if (f) f.focus();
  };
  var closeModal = function () {
    $$('.modal').forEach(function (m) { m.hidden = true; });
    document.body.classList.remove('is-locked');
    var box = $('[data-video-box]');
    if (box && box.dataset.loaded) { box.innerHTML = box.dataset.placeholder; delete box.dataset.loaded; }
    if (lastFocus) lastFocus.focus();
  };
  window.AF = { open: openModal, close: closeModal };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t) {
      e.preventDefault();
      var n = t.getAttribute('data-open');
      if (n === 'quiz') { Quiz.start(); }
      openModal(n);
      return;
    }
    var v = e.target.closest('[data-video]');
    if (v) { e.preventDefault(); openVideo(v.getAttribute('data-video')); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeModal(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    var m = $('.modal:not([hidden])');
    if (!m) return;
    var f = $$('button:not([disabled]), input:not([type=hidden]):not([hidden]):not(.hp), a[href]', $('.pop', m));
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });

  /* ---------- видео ---------- */
  var openVideo = function (key) {
    var box = $('[data-video-box]');
    if (!box) return;
    if (!box.dataset.placeholder) box.dataset.placeholder = box.innerHTML;
    var url = (CFG.videos || {})[key];
    if (url) {
      box.innerHTML = /\.(mp4|webm)(\?|$)/i.test(url)
        ? '<video src="' + url + '" controls autoplay playsinline></video>'
        : '<iframe src="' + url + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      box.dataset.loaded = '1';
    }
    openModal('video');
  };

  /* ---------- формы с выбором канала ---------- */
  var PH = {
    email: { ph: 'name@mail.ru', type: 'email', mode: 'email' },
    telegram: { ph: '@username или номер телефона', type: 'text', mode: 'text' },
    whatsapp: { ph: '+7 900 000-00-00', type: 'tel', mode: 'tel' }
  };
  var valid = function (ch, v) {
    v = (v || '').trim();
    if (!v) return false;
    if (ch === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (ch === 'whatsapp') return v.replace(/\D/g, '').length >= 10;
    return /^@?[A-Za-z0-9_]{4,}$/.test(v) || v.replace(/\D/g, '').length >= 10;
  };

  var sendLead = function (payload) {
    var url = CFG.endpoint;
    if (!url) return Promise.resolve({ ok: true }); // статичный макет: заявки не уходят
    var fd = new FormData();
    Object.keys(payload).forEach(function (k) { fd.append(k, typeof payload[k] === 'string' ? payload[k] : JSON.stringify(payload[k])); });
    if (CFG.nonce) fd.append('nonce', CFG.nonce);
    fd.append('action', 'af_lead');
    return fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (j) { return { ok: !!(j && j.success) }; })
      .catch(function () { return { ok: false }; });
  };

  var initForm = function (form, extra) {
    var chans = $$('.channel', form);
    var field = $('input[name=contact]', form);
    var chIn = $('input[name=channel]', form);
    var agree = $('input[name=agree]', form);
    var btn = $('button[type=submit]', form);
    var refresh = function () {
      btn.disabled = !(chIn.value && valid(chIn.value, field.value) && agree.checked);
    };
    chans.forEach(function (c) {
      c.addEventListener('click', function () {
        chans.forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
        c.setAttribute('aria-checked', 'true');
        var ch = c.getAttribute('data-channel');
        chIn.value = ch;
        field.hidden = false;
        field.type = PH[ch].type;
        field.inputMode = PH[ch].mode;
        field.placeholder = PH[ch].ph;
        field.autocomplete = ch === 'email' ? 'email' : (ch === 'whatsapp' ? 'tel' : 'off');
        field.spellcheck = false;
        field.classList.remove('is-error');
        field.focus();
        refresh();
      });
    });
    field.addEventListener('input', function () { field.classList.remove('is-error'); refresh(); });
    field.addEventListener('blur', function () { if (field.value && !valid(chIn.value, field.value)) field.classList.add('is-error'); });
    agree.addEventListener('change', refresh);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.disabled || $('input[name=website]', form).value) return;
      btn.disabled = true;
      var payload = { form: form.getAttribute('data-form'), channel: chIn.value, contact: field.value.trim(), page: location.href };
      if (extra) payload.answers = extra();
      sendLead(payload).then(function (r) {
        if (r.ok) {
          form.reset(); field.hidden = true; chIn.value = '';
          chans.forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          openModal('thanks');
          if (window.ym && CFG.ymId) window.ym(CFG.ymId, 'reachGoal', 'lead_' + payload.form);
        } else {
          alert('Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.');
        }
        refresh();
      });
    });
  };
  $$('form.lead-form').forEach(function (f) { initForm(f); });

  /* ---------- квиз ---------- */
  var I = 'assets/img/';
  var QUIZ = CFG.quiz || [
    { q: 'Какой подход к питанию подойдёт именно вам?', hint: 'Выберите один вариант', a: [
      ['b07a3.svg', 'Забочусь о здоровье и хочу улучшить общее самочувствие'],
      ['7a6a1.svg', 'Стремлюсь к снижению веса и контролю аппетита'],
      ['w:3682f.svg', 'Хочу больше энергии и продуктивности'],
      ['w:250b8.svg', 'У меня есть особые медицинские показания']] },
    { q: 'Какой формат обратной связи для вас удобнее?', hint: 'Выберите один вариант', a: [
      ['w:86221.svg', 'Чат с куратором в мессенджере'],
      ['w:ff76b.svg', 'Индивидуальные консультации c нутрициологом'],
      ['8be89.svg', 'Электронная почта'],
      ['23cb6.svg', 'Мне не нужна обратная связь']] },
    { q: 'Что для вас сейчас является главным в питании?', hint: 'Выберите один вариант', a: [
      ['cb63f.svg', 'Улучшить пищеварение и избавиться от вздутия'],
      ['w:f3c10.svg', 'Нормализовать вес'],
      ['5c15e.svg', 'Наладить работу иммунитета'],
      ['smile', 'Улучшить состояние кожи, волос, ногтей']] },
    { q: 'Есть ли у вас хронические заболевания или особенности?', hint: 'Выберите все подходящие варианты', multi: true, a: [
      ['cb63f.svg', 'Заболевания ЖКТ (гастрит, СРК, колит и др.)'],
      ['17cc4.svg', 'Пищевая непереносимость (лактоза, глютен и др.)'],
      ['0ece7.svg', 'Гормональные нарушения'],
      ['smile', 'Нет, ничего из перечисленного']] },
    { q: 'Для вас подойдет индивидуальный подход?', hint: 'Подберём программу исключительно для вас, учитывая цели и особенности', a: [
      ['d9836.svg', 'Да, хочу персональную программу'],
      ['337f2.svg', 'Хочу узнать о базовых рекомендациях'],
      ['ad110.svg', 'Пока не готов(а), хочу узнать больше']] }
  ];
  var icon = function (k) {
    if (k === 'smile') return '<span class="ico ico--white"><img class="ico__in" src="' + I + '7cdfa.svg" alt="" style="width:29px;height:29px"><img src="' + I + '944ec.svg" alt="" style="position:absolute;left:19.3px;top:16px;width:16px;height:9px;max-width:none"></span>';
    if (k.indexOf('w:') === 0) return '<span class="ico ico--white"><img class="ico__in" src="' + I + k.slice(2) + '" alt=""></span>';
    return '<span class="ico"><img src="' + I + k + '" alt=""></span>';
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var Quiz = {
    el: $('[data-quiz]'), step: 0, ans: [],
    start: function () { this.step = 0; this.ans = QUIZ.map(function () { return []; }); this.render(); },
    render: function () {
      var self = this, n = QUIZ.length, el = this.el;
      if (!el) return;
      el.classList.remove('quiz--multi', 'quiz--wide');
      if (this.step >= n) {
        el.classList.add('quiz--wide');
        el.innerHTML = '<div class="quiz__progress"><i style="width:100%"></i></div>' +
          '<h2 class="quiz__title">Спасибо, что прошли тест!</h2>' +
          '<p class="quiz__hint" style="margin-bottom:20px">На основе ваших ответов я сформирую персональные рекомендации и отправлю их на вашу электронную почту или в мессенджер</p>' +
          '<form class="lead-form lead-form--pop" data-form="quiz" novalidate>' +
          '<div class="channels channels--pop" role="radiogroup" aria-label="Куда прислать рекомендации">' +
          '<button type="button" class="channel" data-channel="email" role="radio" aria-checked="false"><img src="' + I + '75ec4.svg" alt="" width="23" height="23">Ваш email</button>' +
          '<button type="button" class="channel" data-channel="telegram" role="radio" aria-checked="false"><img src="' + I + 'fac9e.svg" alt="" width="23" height="23">Telegram</button>' +
          '<button type="button" class="channel" data-channel="whatsapp" role="radio" aria-checked="false"><img src="' + I + 'd197a.svg" alt="" width="23" height="23">WhatsApp</button></div>' +
          '<input class="field" type="text" name="contact" hidden autocomplete="off" aria-label="Контакт"><input type="hidden" name="channel">' +
          '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<p class="safe"><img src="' + I + '0a472.svg" alt="" width="21" height="21">Ваши данные в безопасности, мы не передаём их третьим лицам</p>' +
          '<div class="form-send form-send--pop"><button type="submit" class="btn btn--submit btn--submit-lg" style="font-size:16px" disabled>Получить персональные рекомендации<img src="' + I + '98328.svg" alt="" width="15" height="15"></button>' +
          '<label class="agree"><input type="checkbox" name="agree"><span class="agree__box"></span><span>Я согласен(на) с <a href="#" data-open="policy">политикой конфиденциальности</a></span></label></div></form>' +
          '<div class="quiz__ctrl" style="margin-top:30px"><div><button class="q-btn q-btn--close" data-close><img src="' + I + 'c964a.svg" alt="" width="24" height="24">Закрыть</button>' +
          '<button class="q-btn q-btn--back" data-q="back" aria-label="Назад"><img src="' + I + '6d4da.svg" alt="" width="24" height="24"></button></div></div>';
        initForm($('form', el), function () {
          return QUIZ.map(function (q, i) { return { q: q.q, a: self.ans[i].map(function (k) { return q.a[k][1]; }) }; });
        });
      } else {
        var q = QUIZ[this.step], sel = this.ans[this.step];
        if (q.multi) el.classList.add('quiz--multi');
        el.innerHTML = '<div class="quiz__progress"><i style="width:' + (this.step / n * 100) + '%"></i></div>' +
          '<h2 class="quiz__title">' + (this.step + 1) + '/' + n + ' —<span>' + esc(q.q) + '</span></h2>' +
          '<p class="quiz__hint">' + esc(q.hint) + '</p>' +
          '<div class="quiz__list" role="' + (q.multi ? 'group' : 'radiogroup') + '">' +
          q.a.map(function (a, k) {
            var on = sel.indexOf(k) > -1;
            return '<button type="button" class="q-item' + (on ? ' is-on' : '') + '" data-k="' + k + '" role="' + (q.multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '">' +
              '<span class="q-item__l">' + icon(a[0]) + '<span class="q-item__t">' + esc(a[1]) + '</span></span><span class="q-item__r"></span></button>';
          }).join('') + '</div>' +
          '<div class="quiz__ctrl"><div><button class="q-btn q-btn--close" data-close><img src="' + I + 'c964a.svg" alt="" width="24" height="24">Закрыть</button>' +
          (this.step > 0 ? '<button class="q-btn q-btn--back" data-q="back" aria-label="Назад"><img src="' + I + '6d4da.svg" alt="" width="24" height="24"></button>' : '') +
          '</div><div><button class="q-btn q-btn--skip" data-q="skip">Пропустить</button>' +
          '<button class="q-btn q-btn--next" data-q="next"' + (sel.length ? '' : ' disabled') + '>Далее<img src="' + I + '2c5e3.svg" alt="" width="24" height="24"></button></div></div>';
      }
      var first = $('.q-item, .channel', el);
      if (first) first.focus();
    }
  };
  if (Quiz.el) {
    Quiz.el.addEventListener('click', function (e) {
      var it = e.target.closest('.q-item');
      if (it) {
        var q = QUIZ[Quiz.step], k = +it.getAttribute('data-k'), sel = Quiz.ans[Quiz.step];
        if (q.multi) {
          var last = k === q.a.length - 1; // «Нет, ничего из перечисленного» снимает остальные
          var i = sel.indexOf(k);
          if (i > -1) sel.splice(i, 1);
          else if (last) Quiz.ans[Quiz.step] = [k];
          else { var j = sel.indexOf(q.a.length - 1); if (j > -1) sel.splice(j, 1); sel.push(k); }
          Quiz.render();
        } else {
          Quiz.ans[Quiz.step] = [k];
          Quiz.render();
          setTimeout(function () { Quiz.step++; Quiz.render(); }, 250);
        }
        return;
      }
      var b = e.target.closest('[data-q]');
      if (!b) return;
      var act = b.getAttribute('data-q');
      if (act === 'back') Quiz.step = Math.max(0, Quiz.step - 1);
      if (act === 'next' || act === 'skip') { if (act === 'skip') Quiz.ans[Quiz.step] = []; Quiz.step++; }
      Quiz.render();
    });
  }
})();
