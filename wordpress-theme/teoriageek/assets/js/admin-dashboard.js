/**
 * Central Teoria Geek — Controlador Vanilla JS do `/wp-admin/` (v2.12.0).
 * Consome o payload inicial em `window.teoriageekAdminData` e atualiza via
 * `GET /wp-json/teoriageek/v1/admin-metrics` (polling a cada 2,5 min apenas quando
 * `document.visibilityState === 'visible'` e atualização sob demanda com `?refresh=1`).
 * Renderiza colunas 3D em CSS puro, gráficos SVG nativos (área 14d, sparklines, Donut, barras 24h/7d),
 * painéis de redação, alternância de tema Claro/Escuro (`tgAdmTheme`) e modo Big Board (`Esc`).
 */
(function () {
  'use strict';

  var app = document.getElementById('tg-admin-app');
  if (!app) return;

  var cfg = window.teoriageekAdminData || {};
  var state = cfg.payload || {};
  var POLL_MS = Number(cfg.pollMs) || 150000;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finePointer = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  var currentBarWin = '24h';
  var currentTab = 'overview';
  var tabBeforeBoard = 'overview';
  var lastFetch = Date.now();
  var inflight = false;
  var firstRender = true;
  var tooltip = document.getElementById('tg-chart-tooltip');

  /* ---------- utilitários ---------- */
  function $(id) { return document.getElementById(id); }
  function qa(sel, root) { return Array.prototype.slice.call((root || app).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function url(u) { return /^https?:\/\//i.test(String(u || '')) ? esc(u) : '#'; }
  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }
  function fmt1(n) { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function sum(arr, from, to) {
    var t = 0;
    for (var i = from; i < to; i++) t += Number((arr[i] || {}).views != null ? arr[i].views : arr[i]) || 0;
    return t;
  }
  function empty(msg) { return '<p class="tg-empty">' + esc(msg) + '</p>'; }

  function showTip(text, x, y) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.style.left = Math.max(8, Math.min(window.innerWidth - 270, x + 14)) + 'px';
    tooltip.style.top = Math.max(8, y - 44) + 'px';
    tooltip.classList.add('is-visible');
  }
  function hideTip() { if (tooltip) tooltip.classList.remove('is-visible'); }

  function toast(msg) {
    var t = $('tg-adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }

  /* ---------- tema ---------- */
  function applyThemeLabel() {
    var btn = $('tg-adm-theme-btn');
    var dark = app.getAttribute('data-theme') !== 'light';
    if (btn) {
      btn.textContent = dark ? 'Tema claro' : 'Tema escuro';
      btn.setAttribute('aria-pressed', dark ? 'false' : 'true');
    }
  }
  function setTheme(t) {
    app.setAttribute('data-theme', t);
    try { localStorage.setItem('tgAdmTheme', t); } catch (e) { /* storage indisponível */ }
    applyThemeLabel();
  }

  /* ---------- números animados ---------- */
  function setNumber(el, to) {
    to = Number(to) || 0;
    var from = el._v || 0;
    el._v = to;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = null;
    var dur = 800;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- sparkline ---------- */
  function spark(host, values) {
    if (!host) return;
    if (!values || values.length < 2) { host.innerHTML = ''; return; }
    var w = 120, h = 40, max = Math.max.apply(null, values) || 1;
    var pts = values.map(function (v, i) {
      return [(i / (values.length - 1)) * w, h - 4 - (v / max) * (h - 8)];
    });
    var d = smooth(pts);
    host.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><path class="f" d="' + d + ' L' + w + ',' + h + ' L0,' + h + ' Z"/><path class="l" d="' + d + '"/></svg>';
  }

  /* curva suave (Catmull-Rom → Bézier), sem ultrapassar a base */
  function smooth(p) {
    if (p.length < 2) return '';
    var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- KPIs e hero ---------- */
  function renderKpis() {
    var k = state.kpis || {};
    Object.keys(k).forEach(function (key) {
      qa('[data-tg-kpi="' + key + '"]').forEach(function (el) { setNumber(el, k[key]); });
    });

    var series = state.series14d || [];
    var cur = sum(series, Math.max(0, series.length - 7), series.length);
    var prev = sum(series, 0, Math.max(0, series.length - 7));
    var delta = $('tg-hero-delta');
    if (delta) {
      if (series.length >= 14 && prev > 0) {
        var pct = Math.round(((cur - prev) / prev) * 100);
        delta.hidden = false;
        delta.className = 'tg-delta' + (pct < 0 ? ' is-down' : pct === 0 ? ' is-flat' : '');
        delta.textContent = (pct > 0 ? '+' : '') + pct + '% contra os 7 dias anteriores';
      } else {
        delta.hidden = true;
      }
    }

    var posts = Number(k.posts_published) || 0;
    var perPost = function (n) { return posts > 0 ? fmt1(n / posts) + ' por matéria' : ''; };
    var set = function (id, t) { var el = $(id); if (el) el.textContent = t; };
    set('tg-kpi-sub-views', 'Soma dos dois últimos dias');
    set('tg-kpi-sub-likes', perPost(k.likes_total));
    set('tg-kpi-sub-votes', perPost(k.community_votes));
    var pub = state.pubSeries || [];
    set('tg-kpi-sub-posts', pub.length ? fmt(sum(pub, 0, pub.length)) + ' nos últimos 14 dias' : '');

    spark($('tg-spark-views'), series.map(function (p) { return Number(p.views) || 0; }));
    spark($('tg-spark-posts'), pub);
  }

  /* ---------- colunas 3D ---------- */
  function renderSlab(series) {
    var stage = $('tg-slab-stage');
    if (!stage) return;
    if (!Array.isArray(series) || !series.length) { stage.innerHTML = ''; return; }
    var max = Math.max.apply(null, series.map(function (p) { return Number(p.views) || 0; })) || 1;
    var H = 105;
    var n = series.length;
    var html = '<div class="tg-slab"><div class="tg-slab-floor"></div>';
    series.forEach(function (pt, i) {
      var h = Math.max(6, Math.round(((Number(pt.views) || 0) / max) * H));
      html += '<div class="tg-bar' + (i === n - 1 ? ' is-today' : '') + '" style="--i:' + i + ';--h:' + h + 'px" data-tip="' +
        esc(pt.label + ': ' + fmt(pt.views) + ' leituras') + '"><i class="t"></i><i class="a"></i><i class="b"></i></div>';
    });
    html += '</div>';
    stage.innerHTML = html;
    if (firstRender === false) {
      qa('.tg-bar', stage).forEach(function (b) { b.style.animation = 'none'; });
    }
  }

  function bindSlab() {
    var stage = $('tg-slab-stage');
    if (!stage) return;
    stage.addEventListener('mousemove', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-tip]') : null;
      if (t) showTip(t.getAttribute('data-tip'), ev.clientX, ev.clientY); else hideTip();
      if (reduce || !finePointer) return;
      var r = stage.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--tx', (px * 14).toFixed(2) + 'deg');
      stage.style.setProperty('--ty', (-py * 10).toFixed(2) + 'deg');
    });
    stage.addEventListener('mouseleave', function () {
      hideTip();
      stage.style.setProperty('--tx', '0deg');
      stage.style.setProperty('--ty', '0deg');
    });
  }

  /* ---------- gráfico de área ---------- */
  function renderArea(series) {
    var stage = $('tg-area-chart-stage');
    if (!stage) return;
    if (!Array.isArray(series) || !series.length) { stage.innerHTML = empty('Ainda não há leituras registradas.'); return; }

    var w = 680, h = 240, padL = 44, padR = 14, padT = 16, padB = 28;
    var plotW = w - padL - padR, plotH = h - padT - padB;
    var maxV = 4;
    series.forEach(function (p) { if (p.views > maxV) maxV = p.views; });
    maxV = Math.ceil(maxV * 1.15);
    var total = series.reduce(function (a, p) { return a + (Number(p.views) || 0); }, 0);
    var avg = total / series.length;

    var pts = series.map(function (p, i) {
      return [padL + (series.length > 1 ? (i / (series.length - 1)) * plotW : plotW / 2), padT + plotH - ((Number(p.views) || 0) / maxV) * plotH];
    });
    var line = smooth(pts);
    var base = padT + plotH;
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + base + ' L' + pts[0][0].toFixed(1) + ',' + base + ' Z';

    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (g / 3) * plotH;
      grid += '<line class="tg-grid-line" x1="' + padL + '" x2="' + (w - padR) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text class="tg-axis" x="' + (padL - 8) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' + fmt(Math.round(maxV - (g / 3) * maxV)) + '</text>';
    }
    var xl = '';
    series.forEach(function (p, i) {
      if (i % 3 === 0 || i === series.length - 1) {
        xl += '<text class="tg-axis" x="' + pts[i][0].toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(p.label) + '</text>';
      }
    });
    var avgY = padT + plotH - (avg / maxV) * plotH;
    var avgLine = '<line class="tg-avg" x1="' + padL + '" x2="' + (w - padR) + '" y1="' + avgY.toFixed(1) + '" y2="' + avgY.toFixed(1) + '"/>' +
      '<text class="tg-avg-label" x="' + (w - padR) + '" y="' + (avgY - 6).toFixed(1) + '" text-anchor="end">média de ' + fmt(Math.round(avg)) + ' por dia</text>';

    stage.innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" class="tg-area-svg' + (firstRender && !reduce ? ' is-anim' : '') + '" role="img" aria-label="Tendência de leituras nos últimos 14 dias">' +
      '<defs><linearGradient id="tgAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop class="tg-stop-a" offset="0%"/><stop class="tg-stop-b" offset="100%"/></linearGradient></defs>' +
      grid + xl + avgLine +
      '<path class="tg-area-fill" d="' + area + '"/>' +
      '<path class="tg-area-line" pathLength="1" d="' + line + '"/>' +
      '<line class="tg-cross" x1="0" x2="0" y1="' + padT + '" y2="' + base + '"/>' +
      '<circle class="tg-cross-dot" r="5" cx="0" cy="0"/>' +
      '<rect x="' + padL + '" y="0" width="' + plotW + '" height="' + h + '" fill="transparent" class="tg-hit"/>' +
      '</svg>';

    var svg = stage.querySelector('svg');
    var cross = svg.querySelector('.tg-cross');
    var dot = svg.querySelector('.tg-cross-dot');
    var hit = svg.querySelector('.tg-hit');
    hit.addEventListener('mousemove', function (ev) {
      var r = svg.getBoundingClientRect();
      var vx = ((ev.clientX - r.left) / r.width) * w;
      var idx = Math.round(((vx - padL) / plotW) * (series.length - 1));
      idx = Math.max(0, Math.min(series.length - 1, idx));
      var c = pts[idx];
      cross.setAttribute('x1', c[0]); cross.setAttribute('x2', c[0]);
      dot.setAttribute('cx', c[0]); dot.setAttribute('cy', c[1]);
      svg.classList.add('is-hover');
      var d = idx > 0 ? (Number(series[idx].views) || 0) - (Number(series[idx - 1].views) || 0) : null;
      var extra = d === null ? '' : ' (' + (d >= 0 ? '+' : '') + fmt(d) + ' contra o dia anterior)';
      showTip(series[idx].label + ': ' + fmt(series[idx].views) + ' leituras' + extra, ev.clientX, ev.clientY);
    });
    hit.addEventListener('mouseleave', function () { svg.classList.remove('is-hover'); hideTip(); });
  }

  /* ---------- donut ---------- */
  function renderDonut(cats, totalPublished) {
    var stage = $('tg-donut-stage');
    if (!stage) return;
    if (!Array.isArray(cats) || !cats.length) { stage.innerHTML = empty('Ainda não há categorias com matérias.'); return; }
    var catSum = cats.reduce(function (a, c) { return a + (c.count || 0); }, 0) || 1;
    var centerNum = totalPublished > 0 ? totalPublished : catSum;
    var r = 58, cx = 85, cy = 85, circ = 2 * Math.PI * r, offset = 0;

    var segs = cats.map(function (c, i) {
      var len = ((c.count || 0) / catSum) * circ;
      var vis = Math.max(0, len - 3);
      var pct = Math.round(((c.count || 0) / catSum) * 100);
      var s = '<circle class="tg-donut-seg" data-i="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + esc(c.color) + '"' +
        ' stroke-dasharray="' + vis.toFixed(2) + ' ' + circ.toFixed(2) + '" transform="rotate(' + ((offset / circ) * 360 - 90).toFixed(2) + ' ' + cx + ' ' + cy + ')"' +
        ' data-tip="' + esc(c.name + ': ' + fmt(c.count) + ' matérias (' + pct + '%)') + '"/>';
      offset += len;
      return s;
    }).join('');

    var legend = '<ul class="tg-donut-legend">' + cats.map(function (c, i) {
      var pct = Math.round(((c.count || 0) / catSum) * 100);
      return '<li data-i="' + i + '"><span class="tg-donut-key"><span class="tg-donut-swatch" style="background:' + esc(c.color) + '"></span>' + esc(c.name) +
        '</span><span><strong>' + pct + '%</strong></span></li>';
    }).join('') + '</ul>';

    stage.innerHTML = '<svg viewBox="0 0 170 170" class="tg-donut-svg" role="img" aria-label="Distribuição por editoria">' + segs +
      '<text class="tg-donut-num" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + fmt(centerNum) + '</text>' +
      '<text class="tg-donut-cap" x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle">matérias</text></svg>' + legend;

    var svg = stage.querySelector('svg');
    function focus(i) {
      qa('.tg-donut-seg', stage).forEach(function (s) { s.classList.toggle('is-on', i !== null && s.getAttribute('data-i') === String(i)); });
      svg.classList.toggle('has-focus', i !== null);
    }
    qa('.tg-donut-seg', stage).forEach(function (seg) {
      seg.addEventListener('mousemove', function (ev) { focus(seg.getAttribute('data-i')); showTip(seg.getAttribute('data-tip'), ev.clientX, ev.clientY); });
      seg.addEventListener('mouseleave', function () { focus(null); hideTip(); });
    });
    qa('.tg-donut-legend li', stage).forEach(function (li) {
      li.addEventListener('mouseenter', function () { focus(li.getAttribute('data-i')); });
      li.addEventListener('mouseleave', function () { focus(null); });
    });
  }

  /* ---------- barras (24h / 7 dias) ---------- */
  function renderBars(win) {
    currentBarWin = win === '7d' ? '7d' : '24h';
    var stage = $('tg-bars-stage');
    if (!stage) return;
    var items = currentBarWin === '24h' ? state.top24h || [] : state.top7d || [];
    if (!items.length) { stage.innerHTML = empty('Ainda não há leituras registradas nessa janela.'); return; }
    var maxV = Math.max.apply(null, items.map(function (it) { return it.views || 0; })) || 1;
    stage.className = 'tg-bars-list' + (reduce ? '' : ' is-pre');
    stage.innerHTML = items.map(function (it) {
      var pct = Math.max(4, Math.round(((it.views || 0) / maxV) * 100));
      return '<div class="tg-bar-row"><div class="tg-bar-meta"><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a><span class="tg-bar-num">' + fmt(it.views) +
        '</span></div><div class="tg-bar-track"><div class="tg-bar-fill" style="--w:' + pct + '%"></div></div></div>';
    }).join('');
    if (!reduce) requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.remove('is-pre'); }); });
  }

  /* ---------- críticas ---------- */
  function renderCritics(list) {
    var stage = $('tg-critics-stage');
    if (!stage) return;
    if (!list || !list.length) { stage.innerHTML = empty('Os comparativos aparecem aqui assim que os leitores votarem nas críticas.'); return; }
    stage.innerHTML = list.map(function (c) {
      var ed = c.ed == null ? null : Number(c.ed);
      var pub = Number(c.pub) || 0;
      return '<div class="tg-cmp-row"><a class="tg-cmp-title" href="' + url(c.editUrl) + '">' + esc(c.title) + '</a>' +
        '<div class="tg-cmp-line"><span>Redação</span><div class="tg-cmp-track"><div class="tg-cmp-fill-ed" style="--w:' + Math.min(100, (ed || 0) * 10) + '%"></div></div><strong>' + (ed == null ? '—' : fmt1(ed)) + '</strong></div>' +
        '<div class="tg-cmp-line"><span>Público</span><div class="tg-cmp-track"><div class="tg-cmp-fill-pub" style="--w:' + Math.min(100, pub * 10) + '%"></div></div><strong>' + (c.votes > 0 ? fmt1(pub) : '—') + '</strong></div></div>';
    }).join('');
  }

  /* ---------- redação ---------- */
  function listHtml(items, whenKey) {
    return '<ul class="tg-list">' + items.map(function (it) {
      var st = it.status === 'pending' ? 'Aguardando revisão' : it.status === 'draft' ? 'Rascunho' : '';
      var meta = [it.author, st].filter(Boolean).join(', ');
      return '<li><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a><span class="when">' + esc(it.date || '') + '</span>' +
        (meta ? '<span class="meta">' + esc(meta) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function renderNewsroom() {
    var q = state.queue;
    var tiles = $('tg-queue-tiles'), sch = $('tg-scheduled-stage'), dr = $('tg-drafts-stage');
    if (q) {
      if (tiles) tiles.innerHTML =
        '<div class="tg-tile' + (q.pending > 0 ? ' is-hot' : '') + '"><b>' + fmt(q.pending) + '</b><span>Aguardando revisão</span></div>' +
        '<div class="tg-tile"><b>' + fmt(q.draft) + '</b><span>Rascunhos</span></div>' +
        '<div class="tg-tile"><b>' + fmt(q.future) + '</b><span>Agendadas</span></div>';
      if (sch) sch.innerHTML = q.scheduled && q.scheduled.length ? listHtml(q.scheduled) : empty('Nada agendado. Programe uma matéria para ela aparecer aqui.');
      if (dr) dr.innerHTML = q.drafts && q.drafts.length ? listHtml(q.drafts) : empty('Nenhum rascunho em aberto.');
    } else {
      if (tiles) tiles.innerHTML = '';
      var msg = empty('A fila editorial é visível para editores e administradores.');
      if (sch) sch.innerHTML = msg;
      if (dr) dr.innerHTML = msg;
    }

    var fl = state.flags || {};
    var cols = [['hero', 'Manchete da capa'], ['ticker', 'Plantão Geek'], ['spoiler', 'Com alerta de spoiler']];
    var flagsEl = $('tg-flags-stage');
    if (flagsEl) flagsEl.innerHTML = cols.map(function (c) {
      var f = fl[c[0]] || { count: 0, items: [] };
      var body = f.items && f.items.length ? '<ul class="tg-list">' + f.items.map(function (it) {
        return '<li><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a><span class="meta">' + esc(it.date || '') + '</span></li>';
      }).join('') + '</ul>' : empty('Nenhuma matéria marcada.');
      return '<div class="tg-flag-col"><h3>' + esc(c[1]) + '<span class="tg-adm-pill ' + (c[0] === 'spoiler' ? 'tg-pill-spoiler' : c[0] === 'ticker' ? 'tg-pill-ok' : 'tg-pill-info') + '">' + fmt(f.count) + '</span></h3>' + body + '</div>';
    }).join('');

    var au = state.authors || [];
    var auEl = $('tg-authors-stage');
    if (auEl) {
      var maxP = Math.max.apply(null, au.map(function (a) { return a.posts; }).concat([1]));
      auEl.innerHTML = au.length ? au.map(function (a) {
        var ini = String(a.name || '?').trim().split(/\s+/).slice(0, 2).map(function (s) { return s.charAt(0); }).join('').toUpperCase();
        return '<div class="tg-author"><span class="tg-avatar" aria-hidden="true">' + esc(ini) + '</span><div><a href="' + url(a.url) + '">' + esc(a.name) +
          '</a><div class="tg-bar-track"><div class="tg-bar-fill" style="--w:' + Math.round((a.posts / maxP) * 100) + '%"></div></div></div>' +
          '<small><b>' + fmt(a.posts) + ' ' + (a.posts === 1 ? 'matéria' : 'matérias') + '</b>' + fmt(a.likes) + ' curtidas</small></div>';
      }).join('') : empty('Nenhuma matéria publicada nos últimos 30 dias.');
    }
  }

  /* ---------- rankings ---------- */
  function renderRankings() {
    var t7 = $('tg-top7-stage'), lk = $('tg-liked-stage');
    var a = state.top7d || [];
    if (t7) t7.innerHTML = a.length ? '<table class="tg-adm-table"><thead><tr><th>#</th><th>Matéria</th><th class="num">Leituras</th><th class="num">Curtidas</th></tr></thead><tbody>' +
      a.map(function (it, i) {
        return '<tr><td><span class="tg-rank">' + (i + 1) + '</span></td><td><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a></td><td class="num">' + fmt(it.total) + '</td><td class="num">' + fmt(it.likes) + '</td></tr>';
      }).join('') + '</tbody></table>' : empty('Sem dados disponíveis no momento.');
    var b = state.mostLiked || [];
    if (lk) lk.innerHTML = b.length ? '<table class="tg-adm-table"><thead><tr><th>Matéria</th><th class="num">Curtidas</th><th></th></tr></thead><tbody>' +
      b.map(function (it) {
        return '<tr><td><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a></td><td class="num">' + fmt(it.likes) + '</td><td><a href="' + url(it.viewUrl) + '" target="_blank" rel="noopener noreferrer">Abrir</a></td></tr>';
      }).join('') + '</tbody></table>' : empty('Nenhuma curtida registrada ainda.');
  }

  /* ---------- orquestração ---------- */
  function renderAll() {
    renderKpis();
    renderSlab(state.series14d || []);
    renderArea(state.series14d || []);
    renderDonut(state.categories || [], (state.kpis && state.kpis.posts_published) || 0);
    renderBars(currentBarWin);
    renderCritics(state.critics || []);
    renderNewsroom();
    renderRankings();
    firstRender = false;
  }

  function updateSync() {
    var el = $('tg-adm-sync');
    if (!el) return;
    var s = Math.floor((Date.now() - lastFetch) / 1000);
    el.textContent = s < 45 ? 'Atualizado agora' : 'Atualizado há ' + Math.round(s / 60) + ' min';
  }

  /* ---------- abas ---------- */
  function showTab(target, instant) {
    if (!app.querySelector('[data-tg-adm-panel="' + target + '"]')) return;
    currentTab = target;
    function swap() {
      qa('[data-tg-adm-tab]').forEach(function (b) {
        var on = b.getAttribute('data-tg-adm-tab') === target;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
      });
      qa('[data-tg-adm-panel]').forEach(function (p) {
        var on = p.getAttribute('data-tg-adm-panel') === target;
        p.hidden = !on;
        p.classList.toggle('is-entering', on && !reduce && !document.startViewTransition);
      });
    }
    if (!instant && !reduce && typeof document.startViewTransition === 'function') {
      try { document.startViewTransition(swap); } catch (e) { swap(); }
    } else {
      swap();
    }
  }

  qa('[data-tg-adm-tab]').forEach(function (btn, idx, all) {
    btn.addEventListener('click', function () { showTab(btn.getAttribute('data-tg-adm-tab')); });
    btn.addEventListener('keydown', function (ev) {
      var j = ev.key === 'ArrowRight' ? idx + 1 : ev.key === 'ArrowLeft' ? idx - 1 : ev.key === 'Home' ? 0 : ev.key === 'End' ? all.length - 1 : -1;
      if (j < 0) return;
      ev.preventDefault();
      var nb = all[(j + all.length) % all.length];
      nb.focus();
      showTab(nb.getAttribute('data-tg-adm-tab'));
    });
  });

  qa('[data-tg-bar-win]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var win = btn.getAttribute('data-tg-bar-win');
      qa('[data-tg-bar-win]').forEach(function (b) {
        var on = b.getAttribute('data-tg-bar-win') === win;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderBars(win);
    });
  });

  /* ---------- inclinação 3D dos cartões de KPI ---------- */
  if (finePointer && !reduce) {
    qa('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--ry', (((ev.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - (ev.clientY - r.top) / r.height) * 8).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- tooltips das colunas 3D, tema, Big Board ---------- */
  bindSlab();

  var themeBtn = $('tg-adm-theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () { setTheme(app.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
  applyThemeLabel();

  function setBoard(on) {
    app.classList.toggle('is-board', on);
    var b = $('tg-adm-board-btn');
    if (b) b.textContent = on ? 'Sair do Big Board' : 'Big Board';
    if (on) { tabBeforeBoard = currentTab; showTab('overview', true); } else { showTab(tabBeforeBoard, true); }
  }
  var boardBtn = $('tg-adm-board-btn');
  if (boardBtn) boardBtn.addEventListener('click', function () {
    var on = !app.classList.contains('is-board');
    setBoard(on);
    try {
      if (on && app.requestFullscreen) app.requestFullscreen();
      else if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    } catch (e) { /* tela cheia indisponível: o modo continua em janela */ }
  });
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && app.classList.contains('is-board')) setBoard(false);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && app.classList.contains('is-board') && !document.fullscreenElement) setBoard(false);
  });

  /* ---------- atualização (manual e automática) ---------- */
  function refresh(force, manual) {
    if (!cfg.restUrl || inflight) return;
    inflight = true;
    app.classList.add('is-loading');
    var btn = $('tg-adm-refresh-btn');
    if (manual && btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }
    fetch(cfg.restUrl + (force ? '?refresh=1' : ''), {
      credentials: 'same-origin',
      headers: cfg.nonce ? { 'X-WP-Nonce': cfg.nonce } : {}
    })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        if (data && data.kpis) {
          state = data;
          lastFetch = Date.now();
          renderAll();
          updateSync();
          if (manual) toast('Métricas atualizadas');
        }
      })
      .catch(function () { if (manual) toast('Não foi possível atualizar. Tente de novo em instantes.'); })
      .then(function () {
        inflight = false;
        app.classList.remove('is-loading');
        if (btn) { btn.disabled = false; btn.textContent = 'Atualizar agora'; }
      });
  }

  var refreshBtn = $('tg-adm-refresh-btn');
  if (refreshBtn) refreshBtn.addEventListener('click', function () { refresh(true, true); });

  function maybeAutoRefresh() {
    if (document.visibilityState === 'visible' && Date.now() - lastFetch >= POLL_MS) refresh(false, false);
  }
  setInterval(function () { updateSync(); maybeAutoRefresh(); }, 20000);
  document.addEventListener('visibilitychange', function () { updateSync(); maybeAutoRefresh(); });

  renderAll();
  updateSync();
})();
