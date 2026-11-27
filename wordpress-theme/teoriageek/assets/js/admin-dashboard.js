/**
 * Central Teoria Geek — Controlador Vanilla JS do `/wp-admin/` (v2.12.1).
 * Consome o payload inicial em `window.teoriageekAdminData` e atualiza via
 * `GET /wp-json/teoriageek/v1/admin-metrics` (com suporte a `?range=today|7d|14d|30d` e `?refresh=1`,
 * polling a cada 2 min apenas quando `document.visibilityState === 'visible'`).
 * Renderiza colunas 3D em CSS puro, gráficos SVG nativos (área 14d, sparklines, Donut, barras 24h/7d),
 * painéis completos de Analytics First-Party (Audiência & Origem + Cliques & Comportamento),
 * fila editorial, rankings, alternância de tema Claro/Escuro (`tgAdmTheme`) e modo Big Board (`Esc`).
 */
(function () {
  'use strict';

  var app = document.getElementById('tg-admin-app');
  if (!app) return;

  var cfg = window.teoriageekAdminData || {};
  var state = cfg.payload || {};
  var POLL_MS = Number(cfg.pollMs) || 120000;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finePointer = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  var currentBarWin = '24h';
  var currentRange = (state && state.range) || cfg.range || '7d';
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
  function fmtDuration(sec) {
    var s = Math.max(0, Math.round(Number(sec) || 0));
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    var r = s % 60;
    if (m < 60) return m + 'm ' + (r < 10 ? '0' : '') + r + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60 < 10 ? '0' : '') + (m % 60) + 'm';
  }
  function sum(arr, from, to) {
    var t = 0;
    for (var i = from; i < to; i++) t += Number((arr[i] || {}).views != null ? arr[i].views : arr[i]) || 0;
    return t;
  }
  function empty(msg) { return '<p class="tg-empty">' + esc(msg) + '</p>'; }
  function buildRestUrl(base, params) {
    var pairs = [];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])));
      }
    });
    if (!pairs.length) return String(base || '');
    var raw = String(base || '');
    return raw + (raw.indexOf('?') === -1 ? '?' : '&') + pairs.join('&');
  }
  function deltaChip(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return '';
    var n = Math.round(Number(pct));
    var cls = 'tg-mini-delta' + (n < 0 ? ' is-down' : n === 0 ? ' is-flat' : '');
    return '<span class="' + cls + '">' + (n > 0 ? '+' : '') + n + '%</span>';
  }

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
    var dur = 750;
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

    var an = state.analytics || {};
    var anSum = an.summary || {};
    var liveEl = $('tg-live-count');
    if (liveEl) liveEl.textContent = fmt(anSum.onlineNow || 0);
  }

  /* ---------- Faixa de Pulso Analytics na Visão geral ---------- */
  function renderOverviewPulse() {
    var host = $('tg-overview-pulse');
    if (!host) return;
    var an = state.analytics || {};
    var s = an.summary || {};
    var period = an.rangeLabel || 'Últimos 7 dias';

    host.innerHTML =
      '<button type="button" class="tg-pulse-item is-live" data-tg-jump-tab="analytics">' +
      '<small>Online agora (5 min)</small>' +
      '<strong>' + fmt(s.onlineNow || 0) + '</strong>' +
      '<span>Leitores ativos no portal</span>' +
      '</button>' +
      '<button type="button" class="tg-pulse-item" data-tg-jump-tab="clicks">' +
      '<small>Cliques (' + esc(period) + ')</small>' +
      '<strong>' + fmt(s.clicks || 0) + '</strong>' +
      '<span>' + (s.clicksPerSess ? fmt1(s.clicksPerSess) + ' cliques por sessão' : 'Rastreio por zona ativo') + '</span>' +
      '</button>' +
      '<button type="button" class="tg-pulse-item" data-tg-jump-tab="clicks">' +
      '<small>Aonde mais clicaram</small>' +
      '<strong>' + esc(s.topZoneLabel || 'Aguardando dados') + '</strong>' +
      '<span>' + (s.topZoneLabel ? fmt1(s.topZonePct) + '% de todos os cliques' : 'Ver mapa de cliques →') + '</span>' +
      '</button>' +
      '<button type="button" class="tg-pulse-item" data-tg-jump-tab="analytics">' +
      '<small>Principal origem</small>' +
      '<strong>' + esc(s.topRefLabel || 'Aguardando dados') + '</strong>' +
      '<span>' + (s.topRefLabel ? fmt1(s.topRefPct) + '% das sessões' : 'Ver origens de tráfego →') + '</span>' +
      '</button>' +
      '<button type="button" class="tg-pulse-item" data-tg-jump-tab="analytics">' +
      '<small>Tempo ativo médio</small>' +
      '<strong>' + esc(fmtDuration(s.avgEngagedSec || 0)) + '</strong>' +
      '<span>' + (s.completionRate ? fmt1(s.completionRate) + '% chegam a 75% do texto' : 'Scroll depth 25%–100%') + '</span>' +
      '</button>';

    qa('[data-tg-jump-tab]', host).forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(btn.getAttribute('data-tg-jump-tab'));
      });
    });
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

  /* ---------- donut genérico (Editorias e Dispositivos) ---------- */
  function renderDonutInto(stage, slices, centerNum, centerCap, ariaLabel) {
    if (!stage) return;
    var total = (slices || []).reduce(function (a, c) { return a + (Number(c.count) || 0); }, 0);
    if (!slices || !slices.length || total <= 0) {
      stage.innerHTML = empty('Ainda não há dados suficientes neste período.');
      return;
    }
    var r = 58, cx = 85, cy = 85, circ = 2 * Math.PI * r, offset = 0;

    var segs = slices.map(function (c, i) {
      var val = Number(c.count) || 0;
      if (val <= 0) return '';
      var len = (val / total) * circ;
      var vis = Math.max(0, len - 3);
      var pct = Math.round((val / total) * 100);
      var s = '<circle class="tg-donut-seg" data-i="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + esc(c.color) + '"' +
        ' stroke-dasharray="' + vis.toFixed(2) + ' ' + circ.toFixed(2) + '" transform="rotate(' + ((offset / circ) * 360 - 90).toFixed(2) + ' ' + cx + ' ' + cy + ')"' +
        ' data-tip="' + esc(c.name + ': ' + fmt(val) + ' (' + pct + '%)') + '"/>';
      offset += len;
      return s;
    }).join('');

    var legend = '<ul class="tg-donut-legend">' + slices.map(function (c, i) {
      var val = Number(c.count) || 0;
      var pct = total > 0 ? Math.round((val / total) * 100) : 0;
      return '<li data-i="' + i + '"><span class="tg-donut-key"><span class="tg-donut-swatch" style="background:' + esc(c.color) + '"></span>' + esc(c.name) +
        '</span><span><strong>' + pct + '%</strong> <small style="color:var(--ink-3);font-family:var(--f-data);">(' + fmt(val) + ')</small></span></li>';
    }).join('') + '</ul>';

    stage.innerHTML = '<svg viewBox="0 0 170 170" class="tg-donut-svg" role="img" aria-label="' + esc(ariaLabel) + '">' + segs +
      '<text class="tg-donut-num" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + fmt(centerNum > 0 ? centerNum : total) + '</text>' +
      '<text class="tg-donut-cap" x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle">' + esc(centerCap) + '</text></svg>' + legend;

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

  /* ---------- ABA 2: Audiência & Origem (estilo Google Analytics) ---------- */
  function renderAnalytics() {
    var an = state.analytics || {};
    var s = an.summary || {};
    var rt = an.realtime || {};
    var rangeLbl = an.rangeLabel || 'Últimos 7 dias';

    var kpiHost = $('tg-an-kpis');
    if (kpiHost) {
      var liveDevs = rt.byDevice || {};
      var liveSub = (liveDevs.mobile || liveDevs.desktop || liveDevs.tablet)
        ? (fmt(liveDevs.mobile || 0) + ' mobile · ' + fmt(liveDevs.desktop || 0) + ' desktop')
        : 'Janela de 5 minutos';
      kpiHost.innerHTML =
        '<div class="tg-an-tile is-live">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Online agora</span></div>' +
        '<span class="tg-an-tile-val">' + fmt(s.onlineNow || 0) + '</span>' +
        '<span class="tg-an-tile-sub">' + esc(liveSub) + '</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Sessões (' + esc(rangeLbl) + ')</span>' + deltaChip(s.sessDeltaPct) + '</div>' +
        '<span class="tg-an-tile-val">' + fmt(s.sessions || 0) + '</span>' +
        '<span class="tg-an-tile-sub">' + fmt1(s.pagesPerSession || 0) + ' páginas por sessão</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Visualizações</span>' + deltaChip(s.pvDeltaPct) + '</div>' +
        '<span class="tg-an-tile-val">' + fmt(s.pageviews || 0) + '</span>' +
        '<span class="tg-an-tile-sub">' + fmt(an.daysWithData || 0) + ' dia(s) com dados</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Tempo ativo médio</span></div>' +
        '<span class="tg-an-tile-val">' + esc(fmtDuration(s.avgEngagedSec || 0)) + '</span>' +
        '<span class="tg-an-tile-sub">Leitura real (aba ativa)</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Taxa de rejeição</span></div>' +
        '<span class="tg-an-tile-val">' + fmt1(s.bounceRate || 0) + '%</span>' +
        '<span class="tg-an-tile-sub">Sessões de 1 página</span>' +
        '</div>';
    }

    // Origens de tráfego
    var refHost = $('tg-an-referrers');
    var refs = an.referrers || [];
    if (refHost) {
      if (!refs.length) {
        refHost.innerHTML = empty('Os canais de origem (Google, Discover, WhatsApp, Instagram, Direto) aparecem aqui conforme novos acessos chegarem.');
      } else {
        var maxRef = Math.max.apply(null, refs.map(function (r) { return r.visits || 0; })) || 1;
        refHost.innerHTML = '<div class="tg-an-bars">' + refs.map(function (r) {
          var w = Math.max(4, Math.round((r.visits / maxRef) * 100));
          return '<div class="tg-an-bar-row">' +
            '<div class="tg-an-bar-head"><span class="tg-an-bar-title"><span class="tg-donut-swatch" style="background:' + esc(r.color) + '"></span><span>' + esc(r.label) + '</span></span>' +
            '<span class="tg-an-bar-stat"><b>' + fmt(r.visits) + '</b> (' + fmt1(r.pct) + '%)</span></div>' +
            '<div class="tg-an-bar-track"><div class="tg-an-bar-fill" style="--w:' + w + '%;--bar-c:' + esc(r.color) + '"></div></div></div>';
        }).join('') + '</div>';
      }
    }

    var domHost = $('tg-an-domains');
    var doms = an.topReferrerDomains || [];
    if (domHost) {
      if (!doms.length) {
        domHost.hidden = true;
      } else {
        domHost.hidden = false;
        domHost.innerHTML = doms.map(function (d) {
          return '<span class="tg-domain-chip">' + esc(d.domain) + ' <b>' + fmt(d.visits) + '</b></span>';
        }).join('');
      }
    }

    // Dispositivos Donut + Tipos de página
    var devSlices = (an.devices || []).map(function (d) {
      return { name: d.label, count: d.count, color: d.color };
    });
    renderDonutInto($('tg-an-devices'), devSlices, s.pageviews || 0, 'acessos', 'Distribuição por dispositivo');

    var ptHost = $('tg-an-pagetypes');
    var pts = an.pageTypes || [];
    if (ptHost) {
      if (!pts.length) {
        ptHost.hidden = true;
      } else {
        ptHost.hidden = false;
        ptHost.innerHTML = '<p class="tg-sub-heading">Acessos por tipo de página</p>' + pts.slice(0, 6).map(function (pt) {
          return '<div class="tg-pagetype-row"><span>' + esc(pt.label) + '</span>' +
            '<div class="tg-bar-track"><div class="tg-bar-fill" style="--w:' + Math.max(4, Math.round(pt.pct)) + '%"></div></div>' +
            '<strong>' + fmt1(pt.pct) + '%</strong></div>';
        }).join('');
      }
    }

    // Horários de Pico (00h–23h)
    var hrHost = $('tg-an-hourly');
    var peakBadge = $('tg-an-peak-badge');
    var hourly = an.hourly24 || [];
    if (peakBadge) {
      if (an.peakHour) {
        peakBadge.hidden = false;
        peakBadge.textContent = 'Pico: ' + an.peakHour;
      } else {
        peakBadge.hidden = true;
      }
    }
    if (hrHost) {
      var maxHr = Math.max.apply(null, hourly.map(function (h) { return Number(h.pv) || 0; }).concat([0]));
      if (!hourly.length || maxHr <= 0) {
        hrHost.innerHTML = empty('A curva de horários de pico (00h–23h) é preenchida automaticamente conforme os leitores navegam.');
      } else {
        var W = 600, H = 175, padB = 24, padT = 12, barGap = 4;
        var slotW = W / 24;
        var barW = Math.max(8, slotW - barGap);
        var maxH = H - padB - padT;
        var svgInner = hourly.map(function (item, idx) {
          var v = Number(item.pv) || 0;
          var bh = v > 0 ? Math.max(6, Math.round((v / maxHr) * maxH)) : 3;
          var x = (idx * slotW + barGap / 2).toFixed(1);
          var y = (H - padB - bh).toFixed(1);
          var isPeak = v === maxHr && v > 0;
          var lbl = (idx % 3 === 0 || idx === 23)
            ? '<text class="tg-hr-lbl" x="' + (idx * slotW + slotW / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(item.label) + '</text>'
            : '';
          return '<rect class="tg-hr-bar' + (isPeak ? ' is-peak' : '') + '" x="' + x + '" y="' + y + '" width="' + barW.toFixed(1) + '" height="' + bh + '" data-tip="' + esc(item.label + ': ' + fmt(v) + ' visualizações') + '"/>' + lbl;
        }).join('');
        hrHost.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="tg-hourly-svg" role="img" aria-label="Visualizações por hora do dia (00h a 23h)">' + svgInner + '</svg>';
        qa('.tg-hr-bar', hrHost).forEach(function (bar) {
          bar.addEventListener('mousemove', function (ev) { showTip(bar.getAttribute('data-tip'), ev.clientX, ev.clientY); });
          bar.addEventListener('mouseleave', hideTip);
        });
      }
    }

    // Funil de Profundidade de Leitura (Scroll Depth)
    var scHost = $('tg-an-scroll');
    var sf = an.scrollFunnel || {};
    var steps = sf.steps || [];
    if (scHost) {
      if (!sf.base || !steps.length) {
        scHost.innerHTML = empty('O funil de rolagem (25% → 100%) aparece assim que leitores acessarem matérias individuais.');
      } else {
        scHost.innerHTML = '<div class="tg-funnel">' + steps.map(function (st) {
          return '<div class="tg-funnel-step">' +
            '<div class="tg-funnel-head"><strong>Chegaram a ' + esc(st.label) + '</strong><span>' + fmt(st.count) + ' leituras (' + fmt1(st.pct) + '%)</span></div>' +
            '<div class="tg-funnel-track"><div class="tg-funnel-fill" style="--w:' + Math.max(2, Math.min(100, st.pct)) + '%"></div></div>' +
            '</div>';
        }).join('') +
          '<div class="tg-funnel-foot"><span>Base de matérias lidas: <b>' + fmt(sf.base) + '</b></span><span>Conclusão (75%+): <b>' + fmt1(s.completionRate || 0) + '%</b></span></div></div>';
      }
    }

    // Top Páginas Mais Acessadas
    var pgHost = $('tg-an-pages');
    var pages = an.topPages || [];
    if (pgHost) {
      if (!pages.length) {
        pgHost.innerHTML = empty('Nenhuma visualização registrada neste período ainda.');
      } else {
        pgHost.innerHTML = '<div class="tg-table-scroll"><table class="tg-adm-table"><thead><tr><th>#</th><th>Página</th><th class="num">Views</th><th class="num">Cliques</th><th class="num">Tempo</th></tr></thead><tbody>' +
          pages.map(function (p, i) {
            var link = p.editUrl || p.viewUrl;
            return '<tr><td><span class="tg-rank">' + (i + 1) + '</span></td>' +
              '<td><a href="' + url(link) + '"' + (p.editUrl ? '' : ' target="_blank" rel="noopener noreferrer"') + '>' + esc(p.title) + '</a><span class="tg-path-sub">' + esc(p.path) + '</span></td>' +
              '<td class="num">' + fmt(p.pv) + '</td>' +
              '<td class="num">' + fmt(p.clicks) + '</td>' +
              '<td class="num">' + esc(fmtDuration(p.avgSec)) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    }

    // Leitores Ao Vivo (5 min) + UTMs
    var liveHost = $('tg-an-live-pages');
    var livePages = rt.topLivePages || [];
    if (liveHost) {
      liveHost.innerHTML = '<p class="tg-sub-heading">Páginas abertas agora (' + fmt(rt.onlineNow || 0) + ')</p>' +
        (livePages.length
          ? '<ul class="tg-list">' + livePages.map(function (lp) {
              return '<li><span class="tg-search-term">' + esc(lp.path) + '</span><span class="tg-adm-pill tg-pill-ok">' + fmt(lp.count) + '</span></li>';
            }).join('') + '</ul>'
          : empty('Nenhum leitor ativo nos últimos 5 minutos.'));
    }

    var utmHost = $('tg-an-utm');
    var utms = an.utmCampaigns || [];
    if (utmHost) {
      utmHost.innerHTML = '<p class="tg-sub-heading">Campanhas UTM</p>' +
        (utms.length
          ? '<ul class="tg-list">' + utms.map(function (u) {
              return '<li><span class="tg-search-term">' + esc(u.name) + '</span><span class="when">' + fmt(u.visits) + '</span></li>';
            }).join('') + '</ul>'
          : empty('Compartilhe links com ?utm_source=...&utm_campaign=... para medir campanhas.'));
    }
  }

  /* ---------- ABA 3: Cliques & Comportamento ("Aonde mais clicaram!") ---------- */
  function renderClicks() {
    var an = state.analytics || {};
    var s = an.summary || {};
    var zones = an.clickZones || [];
    var topClicks = an.topClicks || [];
    var convs = an.conversions || [];
    var searches = an.topSearches || [];
    var rangeLbl = an.rangeLabel || 'Últimos 7 dias';

    var ckKpiHost = $('tg-clk-kpis');
    if (ckKpiHost) {
      ckKpiHost.innerHTML =
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Total de cliques (' + esc(rangeLbl) + ')</span>' + deltaChip(s.clkDeltaPct) + '</div>' +
        '<span class="tg-an-tile-val">' + fmt(s.clicks || 0) + '</span>' +
        '<span class="tg-an-tile-sub">Links, cards, botões e CTAs</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Zona campeã de cliques</span></div>' +
        '<span class="tg-an-tile-val is-text">' + esc(s.topZoneLabel || '—') + '</span>' +
        '<span class="tg-an-tile-sub">' + (s.topZoneLabel ? fmt1(s.topZonePct) + '% do total de cliques' : 'Aguardando interações') + '</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Cliques por sessão</span></div>' +
        '<span class="tg-an-tile-val">' + fmt1(s.clicksPerSess || 0) + '</span>' +
        '<span class="tg-an-tile-sub">Média de interações por visita</span>' +
        '</div>' +
        '<div class="tg-an-tile">' +
        '<div class="tg-an-tile-top"><span class="tg-an-tile-label">Ações de conversão</span></div>' +
        '<span class="tg-an-tile-val">' + fmt(s.conversions || 0) + '</span>' +
        '<span class="tg-an-tile-sub">Canais, share, Reels, YouTube, curtidas</span>' +
        '</div>';
    }

    // Mapa por Zona do Portal
    var zHost = $('tg-clk-zones');
    if (zHost) {
      if (!zones.length) {
        zHost.innerHTML = empty('Assim que os leitores clicarem na capa, menu, Mais Lidas, Reels ou matérias, o mapa de zonas aparece aqui automaticamente.');
      } else {
        var maxZ = Math.max.apply(null, zones.map(function (z) { return z.clicks || 0; })) || 1;
        zHost.innerHTML = '<div class="tg-an-bars">' + zones.map(function (z, idx) {
          var w = Math.max(4, Math.round((z.clicks / maxZ) * 100));
          var barColor = idx === 0 ? 'var(--accent)' : idx === 1 ? 'var(--brand-ink)' : 'var(--brand)';
          return '<div class="tg-an-bar-row">' +
            '<div class="tg-an-bar-head"><span class="tg-an-bar-title"><span>' + (idx + 1) + '. ' + esc(z.label) + '</span></span>' +
            '<span class="tg-an-bar-stat"><b>' + fmt(z.clicks) + '</b> cliques (' + fmt1(z.pct) + '%)</span></div>' +
            (z.desc ? '<div class="tg-an-bar-desc">' + esc(z.desc) + '</div>' : '') +
            '<div class="tg-an-bar-track"><div class="tg-an-bar-fill" style="--w:' + w + '%;--bar-c:' + barColor + '"></div></div></div>';
        }).join('') + '</div>';
      }
    }

    // Conversões & CTAs
    var cHost = $('tg-clk-conversions');
    if (cHost) {
      if (!convs.length) {
        cHost.innerHTML = empty('Sem eventos de conversão no período.');
      } else {
        cHost.innerHTML = '<div class="tg-conv-grid">' + convs.map(function (c) {
          return '<div class="tg-conv-card" style="--conv-c:' + esc(c.color) + '"><span>' + esc(c.label) + '</span><strong>' + fmt(c.count) + '</strong></div>';
        }).join('') + '</div>';
      }
    }

    // Top 15 links/botões mais clicados
    var topHost = $('tg-clk-top');
    if (topHost) {
      if (!topClicks.length) {
        topHost.innerHTML = empty('Os links, matérias e botões mais clicados aparecem listados aqui em tempo real.');
      } else {
        topHost.innerHTML = '<div class="tg-table-scroll"><table class="tg-adm-table"><thead><tr><th>#</th><th>Elemento / Link</th><th>Zona</th><th class="num">Cliques</th><th class="num">%</th></tr></thead><tbody>' +
          topClicks.map(function (it, i) {
            return '<tr><td><span class="tg-rank">' + (i + 1) + '</span></td>' +
              '<td><strong>' + esc(it.label) + '</strong>' + (it.target ? '<span class="tg-path-sub">' + esc(it.target) + '</span>' : '') + '</td>' +
              '<td><span class="tg-adm-pill tg-pill-info">' + esc(it.zoneLabel) + '</span></td>' +
              '<td class="num">' + fmt(it.clicks) + '</td>' +
              '<td class="num">' + fmt1(it.pct) + '%</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    }

    // Termos mais buscados
    var sHost = $('tg-clk-searches');
    if (sHost) {
      if (!searches.length) {
        sHost.innerHTML = empty('Quando leitores pesquisarem no portal, os termos mais buscados aparecem aqui.');
      } else {
        sHost.innerHTML = '<ul class="tg-search-list">' + searches.map(function (sq) {
          var zeroBadge = sq.zeroResults > 0
            ? '<span class="tg-adm-pill tg-pill-warn" title="Buscas que não encontraram matérias — oportunidade de pauta">0 resultados</span>'
            : '';
          return '<li><span class="tg-search-term">' + esc(sq.term) + '</span><span class="tg-search-meta">' + zeroBadge + '<strong>' + fmt(sq.count) + 'x</strong></span></li>';
        }).join('') + '</ul>';
      }
    }
  }

  /* ---------- redação ---------- */
  function listHtml(items) {
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
    if (t7) t7.innerHTML = a.length ? '<div class="tg-table-scroll"><table class="tg-adm-table"><thead><tr><th>#</th><th>Matéria</th><th class="num">Leituras</th><th class="num">Curtidas</th></tr></thead><tbody>' +
      a.map(function (it, i) {
        return '<tr><td><span class="tg-rank">' + (i + 1) + '</span></td><td><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a></td><td class="num">' + fmt(it.total) + '</td><td class="num">' + fmt(it.likes) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : empty('Sem dados disponíveis no momento.');
    var b = state.mostLiked || [];
    if (lk) lk.innerHTML = b.length ? '<div class="tg-table-scroll"><table class="tg-adm-table"><thead><tr><th>Matéria</th><th class="num">Curtidas</th><th></th></tr></thead><tbody>' +
      b.map(function (it) {
        return '<tr><td><a href="' + url(it.editUrl) + '">' + esc(it.title) + '</a></td><td class="num">' + fmt(it.likes) + '</td><td><a href="' + url(it.viewUrl) + '" target="_blank" rel="noopener noreferrer">Abrir</a></td></tr>';
      }).join('') + '</tbody></table></div>' : empty('Nenhuma curtida registrada ainda.');
  }

  /* ---------- orquestração ---------- */
  function syncRangeButtons() {
    qa('[data-tg-range]').forEach(function (b) {
      var on = b.getAttribute('data-tg-range') === currentRange;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderAll() {
    syncRangeButtons();
    renderKpis();
    renderOverviewPulse();
    renderSlab(state.series14d || []);
    renderArea(state.series14d || []);
    renderDonutInto($('tg-donut-stage'), state.categories || [], (state.kpis && state.kpis.posts_published) || 0, 'matérias', 'Distribuição por editoria');
    renderBars(currentBarWin);
    renderCritics(state.critics || []);
    renderAnalytics();
    renderClicks();
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

  var livePill = $('tg-live-pill');
  if (livePill) {
    livePill.addEventListener('click', function () { showTab('analytics'); });
  }

  qa('[data-tg-range]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nextRange = btn.getAttribute('data-tg-range') || '7d';
      if (nextRange === currentRange) return;
      currentRange = nextRange;
      syncRangeButtons();
      refresh(false, true, 'Período alterado');
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

  var resetForm = $('tg-reset-analytics-form');
  if (resetForm) {
    resetForm.addEventListener('submit', function (ev) {
      if (!window.confirm('Tem certeza que deseja zerar todo o histórico de Analytics First-Party (últimos 30 dias)? As visualizações das matérias no WordPress não serão afetadas.')) {
        ev.preventDefault();
      }
    });
  }

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
  function refresh(force, manual, okMsg) {
    if (!cfg.restUrl || inflight) return;
    inflight = true;
    app.classList.add('is-loading');
    var btn = $('tg-adm-refresh-btn');
    if (manual && force && btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }

    var reqUrl = buildRestUrl(cfg.restUrl, {
      range: currentRange,
      refresh: force ? '1' : ''
    });

    fetch(reqUrl, {
      credentials: 'same-origin',
      headers: cfg.nonce ? { 'X-WP-Nonce': cfg.nonce } : {}
    })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        if (data && data.kpis) {
          state = data;
          if (data.range) currentRange = data.range;
          lastFetch = Date.now();
          renderAll();
          updateSync();
          if (manual) toast(okMsg || 'Métricas atualizadas');
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
