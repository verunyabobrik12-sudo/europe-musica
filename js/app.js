// Заявки идут в тот же Apps Script, что и у других лендингов; отличить заявку можно по полю plan = TOUR_NAME.
// [УТОЧНИТЬ] перед публикацией: нужен ли для Musica отдельный скрипт и таблица.
var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbzxC8fGP3TF_uN9N0MuApY_V9eGdWj0ggqY6sOOIbX8ifHBO2ATvuoP7etg2LO2Hb2LBQ/exec";
var TOUR_NAME = "Круиз Таррагона — Валенсия, MSC Musica, 15–22.04.2027 (лендинг v3)";

// «Цена до даты»: заполнить все три строки, и плашка появится у цены. Пустые: плашки нет.
var PRICE_UNTIL_TEXT = "";   // например: "1 декабря"
var PRICE_UNTIL_ISO = "";    // например: "2026-12-01T23:59:59+03:00"
var PRICE_AFTER = "";        // например: "1 690 €"

(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var save = navigator.connection && navigator.connection.saveData;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var goal = function (n) { try { if (window.ym && window.__ymId) ym(window.__ymId, 'reachGoal', n); } catch (e) {} };

  /* шапка */
  var top = $('#top');
  var onScroll = function () { top.classList.toggle('solid', window.scrollY > 30); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* меню на телефоне и планшете */
  var burger = $('#burger'), nav = $('#nav');
  if (burger && nav) {
    var setMenu = function (open) { top.classList.toggle('open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); document.body.classList.toggle('menu-open', open); };
    burger.addEventListener('click', function () { setMenu(!top.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top.classList.contains('open')) { setMenu(false); burger.focus(); } });
  }

  /* первый экран: на ПК кадры из ролика MSC без титров и карты, на телефоне лёгкий ролик */
  var hv = $('#heroVideo');
  if (hv && !still && !save) {
    /* ролик MSC «Западное Средиземноморье»: лайнер и Рим, затем города и море; без карты (7–12,5 с) и финальных заставок (с 50,5 с) */
    {
      /* без заставки «MSC | Explore Western Mediterranean» (2,3–5,6 с), карты (7–12,5 с) и финальных титров (с 50,5 с) */
      var SEG = [[0.2, 1.8], [5.8, 6.4], [12.8, 49.6]], si = 0;
      hv.src = 'promo/msc-wmed.mp4';
      var go = function (k) { si = k; try { hv.currentTime = SEG[k][0]; } catch (e) {} };
      hv.addEventListener('loadedmetadata', function () { go(0); var q = hv.play(); if (q && q.catch) q.catch(function () {}); });
      var tick = function () { if (hv.seeking) return; var t = hv.currentTime; if (t >= SEG[si][1] || hv.ended) { go((si + 1) % SEG.length); if (hv.paused) hv.play().catch(function () {}); } else if (t < SEG[si][0] - 0.5) go(si); };
      if ('requestVideoFrameCallback' in hv) { var f = function () { tick(); hv.requestVideoFrameCallback(f); }; hv.requestVideoFrameCallback(f); }
      else hv.addEventListener('timeupdate', tick);
      setInterval(tick, 60);
      /* пока идёт перемотка (до ~1 с), показывается старый кадр: прячем его, чтобы не мелькали заставки MSC */
      hv.style.transition = 'opacity .3s';
      hv.addEventListener('seeking', function () { hv.style.transition = 'none'; hv.style.opacity = '0'; });
      hv.addEventListener('seeked', function () { hv.style.transition = 'opacity .3s'; hv.style.opacity = '1'; });
    }
  }

  /* первый экран: порты сменяют друг друга, как утра в круизе */
  var vg = $('#voyage');
  if (vg) {
    var VG = [['15 апреля, посадка', 'Таррагона'], ['16 апреля, утро', 'Марсель'], ['17 апреля, утро', 'Генуя'], ['18 апреля, утро', 'Рим'], ['19 апреля, утро', 'Палермо'], ['21 апреля, утро', 'Ибица'], ['22 апреля, утро', 'Валенсия']];
    var vImgs = $$('.voyage-ph img', vg), vDots = $$('#vgLine li', vg), vi = 0, vTimer = null;
    var vShow = function (k) {
      vi = (k + VG.length) % VG.length;
      vImgs.forEach(function (im, j) { if (j === vi) im.loading = 'eager'; im.classList.toggle('on', j === vi); });
      vDots.forEach(function (d, j) { d.classList.toggle('on', j === vi); d.classList.toggle('past', j < vi); });
      $('#vgDay').textContent = VG[vi][0]; $('#vgCity').textContent = VG[vi][1];
    };
    var vPlay = function () { if (still) return; clearInterval(vTimer); vTimer = setInterval(function () { vShow(vi + 1); }, 3800); };
    $$('#vgLine button', vg).forEach(function (b) { b.addEventListener('click', function () { vShow(+b.dataset.i); vPlay(); }); });
    window.addEventListener('load', function () { vImgs.forEach(function (im) { im.loading = 'eager'; }); });
    vPlay();
  }

  /* ролики, которые играют только когда видны */
  var lazy = $$('video[data-src]');
  if (!still && !save && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          var q = v.play(); if (q && q.catch) q.catch(function () {});
        } else v.pause();
      });
    }, { threshold: .25 });
    lazy.forEach(function (v) { vio.observe(v); });
  }
  $$('iframe[data-src]').forEach(function (fr) {
    if (!('IntersectionObserver' in window)) { fr.src = fr.dataset.src; return; }
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { fr.src = fr.dataset.src; o.disconnect(); } }, { rootMargin: '300px' }).observe(fr);
  });

  /* плавающая плашка брони */
  var stick = $('#stick'), heroEl = $('#hero'), finalEl = $('#zayavka');
  if (stick && heroEl && finalEl && 'IntersectionObserver' in window) {
    var heroIn = true, finalIn = false;
    var upd = function () { var on = !heroIn && !finalIn; stick.classList.toggle('on', on); stick.setAttribute('aria-hidden', on ? 'false' : 'true'); stick.tabIndex = on ? 0 : -1; };
    new IntersectionObserver(function (en) { heroIn = en[0].isIntersecting; upd(); }, { threshold: .05 }).observe(heroEl);
    new IntersectionObserver(function (en) { finalIn = en[0].isIntersecting; upd(); }, { threshold: .05 }).observe(finalEl);
  }

  /* таймер до вылета из Варшавы */
  var cnt = $$('#count b');
  if (cnt.length) {
    var target = new Date('2027-04-14T12:00:00+02:00').getTime();
    var tickT = function () {
      var sec = Math.max(0, Math.floor((target - Date.now()) / 1000));
      var v = [Math.floor(sec / 86400), Math.floor(sec % 86400 / 3600), Math.floor(sec % 3600 / 60), sec % 60];
      v.forEach(function (x, i) { cnt[i].textContent = i ? String(x).padStart(2, '0') : x; });
    };
    tickT(); if (!still) setInterval(tickT, 1000);
  }

  /* цифры в полосе фактов считаются один раз при появлении */
  var nums = $$('.facts b[data-n]');
  if (nums.length && !still && 'IntersectionObserver' in window) {
    nums.forEach(function (n) { n.textContent = '0'; });
    new IntersectionObserver(function (en, o) {
      if (!en[0].isIntersecting) return; o.disconnect();
      nums.forEach(function (n) {
        var to = +n.dataset.n, t0 = null;
        var s = function (ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 900); n.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(s); };
        requestAnimationFrame(s);
      });
    }, { threshold: .6 }).observe($('.facts'));
  }

  /* маршрут */
  var DAYS = [
    { d: '15 апреля', n: 'День 1', id: 'tarragona', name: 'Таррагона', c: 'Испания, Каталония', h: 'посадка, отплытие в 18:00',
      lead: 'Накануне вы ночуете в Барселоне, а утром трансфер везёт группу в Таррагону, примерно 100 км по побережью. До посадки остаётся время на римский город у моря.',
      todo: 'Римский амфитеатр прямо у моря, набережная-балкон «Балкон Средиземноморья», старый город вокруг собора. Затем посадка на лайнер.', eat: 'Соус ромеско и морепродукты в портовых ресторанчиках.', fact: 'Римские памятники Таррагоны — «Таррако» — внесены в список ЮНЕСКО в 2000 году.' },
    { d: '16 апреля', n: 'День 2', id: 'marseille', name: 'Марсель', c: 'Франция', h: '08:00–17:00 · 9 часов',
      lead: 'Самый старый город Франции: Старый порт с сотнями яхт, базилика на холме и пёстрые улицы квартала Панье.',
      todo: 'Старый порт, квартал Панье, подъём к базилике Нотр-Дам-де-ла-Гард с видом на весь город и море, музей MuCEM у воды.', eat: 'Буйабес — рыбный суп, с которого началась слава марсельской кухни.', fact: 'Город основали греки около 600 года до н. э., он назывался Массалия.' },
    { d: '17 апреля', n: 'День 3', id: 'genoa', name: 'Генуя', c: 'Италия, Лигурия', h: '08:00–17:00 · 9 часов',
      lead: 'Портовый город, где старые дворцы стоят в узких улицах-«каруджи», а до центра недалеко от причала.',
      todo: 'Старый порт с аквариумом, улица Via Garibaldi с дворцами Рольи, лабиринт старого города и фокаччерия по дороге.', eat: 'Паста с соусом песто по-генуэзски и фокачча.', fact: 'Генуя считается родиной Христофора Колумба, а дворцы Рольи внесены в список ЮНЕСКО в 2006 году.' },
    { d: '18 апреля', n: 'День 4', id: 'civitavecchia', name: 'Чивитавеккья (Рим)', c: 'Италия', h: '08:00–19:00 · 11 часов',
      lead: 'Порт Рима: до столицы около 80 км, поезд идёт примерно час-полтора. Одиннадцати часов стоянки хватает, чтобы увидеть главное, если выйти с утра.',
      todo: 'Колизей и Римский форум, фонтан Треви, Пантеон и площадь Навона. Если ехать в Рим не хочется — крепость Форте-Микеланджело у самого порта.', eat: 'Паста карбонара, качо-э-пепе и джелато по дороге.', fact: 'Порт основал император Траян во II веке, а крепость у причала достраивали по проекту Микеланджело.' },
    { d: '19 апреля', n: 'День 5', id: 'palermo', name: 'Палермо', c: 'Италия, Сицилия', h: '11:00–20:00 · 9 часов',
      lead: 'Арабо-норманнская столица Сицилии: золотая мозаика, рынки и барочные фасады. Прибытие в 11 утра, поэтому утро можно не спешить.',
      todo: 'Кафедральный собор, Норманнский дворец с Палатинской капеллой, площадь Куатро-Канти и фонтан Претория, рынок Балларо.', eat: 'Аранчини — жареные рисовые шарики и сицилийские каннолли.', fact: 'Арабо-норманнские памятники Палермо вместе с соборами Чефалу и Монреале входят в список ЮНЕСКО с 2015 года.' },
    { d: '20 апреля', n: 'День 6', id: 'sea', name: 'День в море', c: 'Средиземное море', h: 'весь день на борту', sea: true,
      lead: 'Выспаться, полежать у бассейна, сходить на шоу и в спа. Никуда не нужно спешить.',
      todo: 'Бассейны, шоу, рестораны, закат с верхней палубы.', eat: 'Ужин в ресторане: пробуйте новое каждый вечер.', fact: 'Лайнер идёт со скоростью около 40 км/ч.' },
    { d: '21 апреля', n: 'День 7', id: 'ibiza', name: 'Ибица', c: 'Испания, Балеарские острова', h: '12:30–23:00 · 10,5 часов',
      lead: 'Белый город на холме и остров без вечеринок: днём это тихие улицы старого города, а вечером закат с крепостных стен. Прибытие после обеда, отплытие поздно вечером.',
      todo: 'Крепость и старый город Дальт-Вила, собор на вершине холма, прогулка по улочкам вокруг порта, ужин в городе. Возвращайтесь на борт заранее.', eat: 'Флао — местный десерт с мятой и миндалём, и рыбные блюда на набережной.', fact: 'Старый город Ибицы и его крепость включены в список ЮНЕСКО в 1999 году.' },
    { d: '22 апреля', n: 'День 8', id: 'valencia', name: 'Валенсия', c: 'Испания', h: 'прибытие в 07:00',
      lead: 'Последний порт: высадка утром и перелёт Валенсия — Варшава в тот же день. Сколько останется на город, зависит от времени рейса.',
      todo: 'Если рейс не слишком рано, успеете Город искусств и наук Сантьяго Калатравы, площадь Ратуши и центральный рынок.', eat: 'Паэлья, которая родом именно отсюда, и холодный напиток орчата с фартонами.', fact: 'Город искусств и наук открылся в 1998 году и стал главным символом современной Валенсии.' }
  ];
  var PHOTO = { tarragona: 'img/u/tarragona-amph.jpg', marseille: 'img/u/marseille-sky.jpg', genoa: 'img/u/genoa-boccadasse.jpg', civitavecchia: 'img/u/rome-colosseum.jpg', palermo: 'img/u/palermo-cathedral-sq.jpg', ibiza: 'img/u/ibiza-daltvila.jpg', valencia: 'img/u/valencia-street.jpg', sea: 'img/ship-stern.jpg' };
  var SEA = [null, 'img/ship-stern.jpg'];
  /* Валенсия: обратный перелёт вечером, около 19–20 часов (со слов Вероники, 18.11.2026) */
  DAYS.forEach(function (d) { if (d.id === 'valencia') {
    d.lead = 'Последний порт: высадка утром, а перелёт Валенсия — Варшава вечером, около 19–20 часов. Целый день можно гулять по городу.';
    d.todo = 'Город искусств и наук Сантьяго Калатравы, площадь Ратуши и центральный рынок.';
  } });
  /* накануне круиза: Барселона (перелёт, ночь в отеле, утром трансфер в Таррагону) */
  PHOTO.barcelona = 'img/port-barcelona.jpg';
  DAYS.unshift({ d: '14 апреля', n: 'Накануне', id: 'barcelona', name: 'Барселона', c: 'Испания, Каталония', h: 'перелёт и ночь в отеле',
    lead: 'Из Варшавы вы летите в Барселону и остаётесь здесь на ночь. Утром завтрак в отеле и трансфер в Таррагону, где ждёт лайнер.',
    todo: 'Если после прилёта останется вечер: прогулка по Готическому кварталу и набережной, ужин в центре.', eat: 'Тапас, паэлья и каталонский крем на десерт.', factLabel: 'О городе', fact: 'Город между горой Тибидабо и Средиземным морем: готические кварталы с узкими улочками, сказочные дома Гауди, широкие песчаные пляжи и бульвар Рамбла, где вечером гуляет весь город.' });
  var tabs = $('#days'), body = $('#dayBody'), glass = $('#routePorthole'), cur = 0;
  if (glass) { var first = document.createElement('img'); first.src = PHOTO.barcelona; first.alt = ''; first.className = 'layer on'; glass.appendChild(first); }
  function setGlass(d) {
    if (!glass) return;
    var el;
    if (d.sea && SEA[0] && !still) { el = document.createElement('video'); el.muted = true; el.loop = true; el.playsInline = true; el.autoplay = true; el.poster = SEA[1]; el.src = SEA[0]; }
    else { el = document.createElement('img'); el.alt = ''; el.src = d.sea ? SEA[1] : PHOTO[d.id]; }
    el.className = 'layer'; glass.appendChild(el);
    var olds = $$('.layer.on', glass);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    setTimeout(function () { olds.forEach(function (o) { o.remove(); }); }, 800);
  }
  var map = $('#routeMap'), route = $('#route'), ship = $('#shipDot'), pinLen = {}, shipLen = 0, anim = null;
  if (map && route && ship) {
    var L = route.getTotalLength(), N = 600;
    $$('.pin', map).forEach(function (pin) {
      var m = /translate\(([\d.]+),([\d.]+)\)/.exec(pin.getAttribute('transform')), px = +m[1], py = +m[2], best = 0, bd = 1e9;
      for (var k = 0; k <= N; k++) { var pt = route.getPointAtLength(L * k / N), dd = (pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py); if (dd < bd) { bd = dd; best = L * k / N; } }
      if (pin.classList.contains('pre')) best = 0;
      pinLen[pin.getAttribute('data-i')] = best;
      pin.addEventListener('click', function () { show(+pin.getAttribute('data-i'), true); });
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(+pin.getAttribute('data-i'), true); } });
    });
    var placeShip = function (len) { var pt = route.getPointAtLength(len); ship.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')'); shipLen = len; };
    placeShip(pinLen[0] || 0);
  }
  function targetLen(i) {
    if (pinLen[i] !== undefined) return pinLen[i];
    var a = i - 1, b = i + 1;
    while (a > 0 && pinLen[a] === undefined) a--;
    while (b < DAYS.length - 1 && pinLen[b] === undefined) b++;
    return ((pinLen[a] || 0) + (pinLen[b] !== undefined ? pinLen[b] : (pinLen[a] || 0))) / 2;
  }
  function sailTo(i) {
    if (!route || !ship) return;
    var from = shipLen, to = targetLen(i);
    if (anim) cancelAnimationFrame(anim);
    if (still) { placeShip(to); return; }
    var t0 = null, dur = Math.min(2200, 500 + Math.abs(to - from) * 1.2);
    var step = function (ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; placeShip(from + (to - from) * k); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  DAYS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'tab-' + i; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'dayCard');
    var hrs = String(d.h || '').split(' · ')[0];
    b.innerHTML = '<img src="' + (PHOTO[d.id] || SEA[1]) + '" alt="" loading="lazy"><span class="ct"><small>' + esc(d.d) + '</small><span>' + esc(d.id === 'civitavecchia' ? 'Рим' : d.name) + '</span><em>' + esc(hrs) + '</em></span>';
    b.addEventListener('click', function () { show(i, true); });
    tabs.appendChild(b);
  });
  function show(i, fromUser) {
    cur = (i + DAYS.length) % DAYS.length;
    var d = DAYS[cur];
    $$('button', tabs).forEach(function (b, k) { b.setAttribute('aria-selected', k === cur ? 'true' : 'false'); b.tabIndex = k === cur ? 0 : -1; });
    $('#dayCard').setAttribute('aria-labelledby', 'tab-' + cur);
    body.innerHTML = '<p class="when">' + esc(d.n) + ', ' + esc(d.d) + '</p><h3>' + esc(d.name) + '</h3><p class="meta">' + esc(d.c) + ' · ' + esc(d.h) + '</p><p class="lead2">' + esc(d.lead) +
      '</p><dl><div><dt>Что успеть</dt><dd>' + esc(d.todo) + '</dd></div><div><dt>Что попробовать</dt><dd>' + esc(d.eat) + '</dd></div><div><dt>' + esc(d.factLabel || 'Интересно') + '</dt><dd>' + esc(d.fact) + '</dd></div></dl>';
    if (map) $$('.pin', map).forEach(function (p) { p.classList.toggle('on', +p.getAttribute('data-i') === cur); });
    if (fromUser) { setGlass(d); sailTo(cur); }
    var tb = $('#tab-' + cur);
    if (fromUser && tb) tb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: still ? 'auto' : 'smooth' });
  }
  tabs.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(cur + (e.key === 'ArrowRight' ? 1 : -1), true); $('#tab-' + cur).focus(); }
  });
  $('#prevDay').addEventListener('click', function () { show(cur - 1, true); });
  $('#nextDay').addEventListener('click', function () { show(cur + 1, true); });
  show(0, false);
  window.addEventListener('load', function () { DAYS.forEach(function (d) { if (PHOTO[d.id]) { var im = new Image(); im.src = PHOTO[d.id]; } }); });

  /* «Знали ли вы» */
  var factEl = $('#fact');
  if (factEl) {
    var facts = DAYS.filter(function (d) { return !d.sea && !d.factLabel; }).map(function (d) { return d.name + ': ' + d.fact; });
    var fi = Math.floor(Math.random() * facts.length);
    var showFact = function () { factEl.textContent = facts[fi]; fi = (fi + 1) % facts.length; };
    showFact(); $('#nextFact').addEventListener('click', showFact);
  }

  /* цена до даты */
  if (PRICE_UNTIL_TEXT && PRICE_AFTER && (!PRICE_UNTIL_ISO || Date.now() < new Date(PRICE_UNTIL_ISO).getTime())) {
    $$('.deadline').forEach(function (el) { el.textContent = 'Цена действует при брони до ' + PRICE_UNTIL_TEXT + ', потом ' + PRICE_AFTER; el.hidden = false; });
  }

  /* каюты */
  var CABINS = [
    { name: 'Внутренняя каюта', tag: 'Входит в цену', img: 'img/ship-cabin2.jpg', alt: 'Внутренняя каюта MSC Musica',
      text: 'Уютная каюта без окна. Днём вы в городах и на палубах, в каюте спите, поэтому во многих поездках её хватает с запасом.', list: ['Кровать, душ и кондиционер', 'Сейф и телевизор', 'Входит в стоимость круиза'], cta: 'Забронировать эту каюту', cab: 'Внутренняя' },
    { name: 'Каюта с окном', tag: 'Доплата', img: 'img/ship-cabin-ocean.jpg', alt: 'Каюта с окном на MSC Musica',
      text: 'Всё то же, и ещё окно с видом на море. Утром раздвигаете шторы и сразу видите, где вы сегодня.', list: ['Всё, что есть во внутренней каюте', 'Окно с видом на море', 'Доплату менеджер назовёт на вашу дату'], cta: 'Узнать доплату', cab: 'С окном' },
    { name: 'Каюта с балконом', tag: 'Доплата', img: 'img/ship-cabin-balcony.jpg', alt: 'Каюта с балконом на MSC Musica',
      text: 'Свой балкон с видом на море: утренний кофе и закат без очереди на палубе.', list: ['Всё, что есть во внутренней каюте', 'Выход на собственный балкон', 'Доплату менеджер назовёт на вашу дату'], cta: 'Узнать доплату', cab: 'С балконом' }
  ];
  var cabText = $('#cabText'), cabBtn = $('#cabPhoto'), cabTabs = $$('#cabin [data-cab]'), cabCur = 0;
  function cab(i) {
    cabCur = i; var c = CABINS[i];
    cabTabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    var img = $('img', cabBtn); img.style.opacity = 0;
    setTimeout(function () { img.src = c.img; img.alt = c.alt; cabBtn.dataset.cap = c.name + ' на MSC Musica'; img.style.opacity = 1; }, still ? 0 : 160);
    cabText.innerHTML = '<span class="cab-tag">' + esc(c.tag) + '</span><h3>' + esc(c.name) + '</h3><p>' + esc(c.text) + '</p><ul class="list yes">' + c.list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
      '</ul><a class="btn btn-sea" href="#zayavka" data-want="' + (i ? 'Расчёт с визой' : 'Забронировать каюту') + '" data-cabin="' + esc(c.cab) + '">' + esc(c.cta) + '</a>';
    bindWant(cabText);
  }
  if (cabText) { $('#cabPhoto img').style.transition = 'opacity .25s'; cabTabs.forEach(function (b, k) { b.addEventListener('click', function () { cab(k); }); }); cab(0); }

  /* кнопки с data-want выбирают пункт формы, data-cabin подставляет каюту в комментарий */
  var cabinInput = $('#leadForm input[name="cabin"]');
  function bindWant(root) {
    $$('[data-want]', root).forEach(function (a) {
      a.addEventListener('click', function () {
        var r = $('input[name="want"][value="' + a.dataset.want + '"]'); if (r) r.checked = true;
        if (cabinInput) cabinInput.value = a.dataset.cabin || '';
      });
    });
  }
  bindWant(document);

  /* карусель отзывов */
  var car = $('#rvCar');
  if (car) {
    var stepPx = function () { var f = $('.rv', car); return f ? f.getBoundingClientRect().width + 16 : 300; };
    $('#rvNext').addEventListener('click', function () { if (car.scrollLeft + car.clientWidth >= car.scrollWidth - 8) car.scrollTo({ left: 0 }); else car.scrollBy({ left: stepPx() }); });
    $('#rvPrev').addEventListener('click', function () { if (car.scrollLeft <= 8) car.scrollTo({ left: car.scrollWidth }); else car.scrollBy({ left: -stepPx() }); });
    car.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') car.scrollBy({ left: stepPx() }); if (e.key === 'ArrowLeft') car.scrollBy({ left: -stepPx() }); });
  }

  /* увеличение фото */
  var lb = $('#lb'), lbi = $('#lbImg'), lbc = $('#lbCap');
  function zoom(src, alt, cap) {
    if (!lb || !lb.showModal) { window.open(src, '_blank'); return; }
    lbi.src = src; lbi.alt = alt || ''; lbc.textContent = cap || ''; lb.showModal();
  }
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-x')) lb.close(); });
  $$('.g, .gal button, .cab-ph').forEach(function (b) { b.addEventListener('click', function () { var im = $('img', b); zoom(im.currentSrc || im.src, im.alt, b.dataset.cap); }); });
  if (cabBtn) cabBtn.addEventListener('click', function () { var im = $('img', cabBtn); zoom(im.currentSrc || im.src, im.alt, cabBtn.dataset.cap); });
  $$('[data-full]').forEach(function (b) { b.addEventListener('click', function () { zoom(b.dataset.full, b.dataset.alt, b.dataset.alt); }); });

  /* пример дня и меню: две вкладки в одной карточке */
  var sxTabs = $$('.sx-tabs button'), sxPanels = $$('.sx-panel');
  sxTabs.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = +b.dataset.sx;
      sxTabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === k ? 'true' : 'false'); });
      sxPanels.forEach(function (pn, i) { pn.classList.toggle('on', i === k); pn.setAttribute('aria-hidden', i === k ? 'false' : 'true'); });
    });
  });

  /* 3D-тур MSC: открываем в окне на этой же странице, iframe грузится только по клику */
  var tour = $('#tour'), tourBtn = $('#tourOpen');
  if (tour && tourBtn) {
    var tf = $('iframe', tour);
    tourBtn.addEventListener('click', function () {
      if (!tour.showModal) { window.open(tourBtn.dataset.tour, '_blank', 'noopener'); return; }
      if (!tf.src) tf.src = tourBtn.dataset.tour;
      tour.showModal();
    });
    tour.addEventListener('click', function (e) { if (e.target === tour || e.target.classList.contains('lb-x')) tour.close(); });
  }

  /* чемодан */
  var pl = $('#packlist');
  if (pl) {
    var boxes = $$('input', pl), key = 'pack-musica-2027';
    var saved = []; try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    boxes.forEach(function (b, i) { b.checked = saved.indexOf(i) > -1; });
    var updP = function () {
      var n = 0, arr = []; boxes.forEach(function (b, i) { if (b.checked) { n++; arr.push(i); } });
      $('#packBar').style.width = (n / boxes.length * 100) + '%';
      $('#packTxt').textContent = 'Собрано ' + n + ' из ' + boxes.length;
      try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
    };
    pl.addEventListener('change', updP);
    $('#packReset').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); updP(); });
    updP();
  }

  /* день в море */
  var chips = $('#planChips'), plan = $('#plan'), planEmpty = $('#planEmpty'), chosen = [];
  if (chips) {
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var t = b.textContent, k = chosen.indexOf(t);
      if (k > -1) chosen.splice(k, 1); else chosen.push(t);
      b.setAttribute('aria-pressed', k > -1 ? 'false' : 'true');
      plan.innerHTML = chosen.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      planEmpty.hidden = chosen.length > 0;
    });
  }

  /* цели: телефон, Telegram, Viber */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (h.indexOf('tel:') === 0) goal('phone_click');
    else if (h.indexOf('t.me/') > -1) goal('telegram_click');
    else if (h.indexOf('viber:') === 0) goal('viber_click');
  });

  /* форма */
  var form = $('#leadForm'), msg = $('#formMsg');
  var phoneLink = ' Позвоните: <a href="tel:+375447884422">+375 44 788-44-22</a> или напишите в <a href="https://t.me/+375447884422" target="_blank" rel="noopener">Telegram</a>.';
  function say(type, html) { msg.className = 'form-msg ' + type; msg.innerHTML = html; }
  var ph = form.phone;
  ph.addEventListener('focus', function () { if (!ph.value) ph.value = '+375 '; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.website.value) return;
    var name = form.name.value.trim(), phone = form.phone.value.trim();
    if (!name || phone.replace(/\D/g, '').length < 7) { say('err', 'Укажите имя и телефон, чтобы менеджер смог перезвонить.'); (name ? form.phone : form.name).focus(); return; }
    if (!LEAD_ENDPOINT) { say('err', 'Форма пока не подключена.' + phoneLink); return; }
    var data = new URLSearchParams();
    data.append('name', name); data.append('phone', phone); data.append('plan', TOUR_NAME);
    data.append('channel', ($('input[name="channel"]:checked', form) || {}).value || '');
    var want = ($('input[name="want"]:checked', form) || {}).value || '', cabin = form.cabin.value;
    data.append('comment', (want ? '[' + want + '] ' : '') + (cabin ? '[' + cabin + '] ' : '') + form.comment.value.trim());
    data.append('page', location.href);
    new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_|^gclid$|^yclid$|^fbclid$/.test(k)) data.append(k, v); });
    var btn = $('button[type="submit"]', form);
    btn.disabled = true; btn.textContent = 'Отправляем…';
    fetch(LEAD_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () { form.reset(); cabinInput.value = ''; say('ok', '<b>Заявка отправлена.</b> Менеджер перезвонит в рабочее время.'); goal('zayavka'); })
      .catch(function () { say('err', 'Не получилось отправить заявку.' + phoneLink); })
      .then(function () { btn.disabled = false; btn.textContent = 'Отправить заявку'; });
  });
})();
