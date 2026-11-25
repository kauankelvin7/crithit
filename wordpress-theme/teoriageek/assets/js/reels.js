/**
 * Teoria Geek — Player Nativo Reels 2.0 (Micro-Stories em 3 Lâminas).
 */
(function () {
  'use strict';

  var stage = document.getElementById('tg-reels-stage');
  var dataNode = document.getElementById('tg-reels-initial-data');
  if (!stage || !dataNode) return;

  var cfg = window.teoriageekConfig || {};
  var items = [];
  var activeIndex = 0;

  try {
    items = JSON.parse(dataNode.textContent || '[]');
  } catch (_e) {
    items = [];
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStage() {
    if (!items.length) {
      stage.innerHTML =
        '<div class="flex h-full items-center justify-center p-6 text-center font-sans text-sm text-chrome-muted">Nenhuma matéria encontrada para esta seleção.</div>';
      return;
    }

    stage.innerHTML = items
      .map(function (item, index) {
        var bulletsHtml = (item.bullets || [])
          .slice(0, 3)
          .map(function (b) {
            return '<li class="rounded border border-white/15 bg-black/55 p-3 font-reading text-sm leading-snug text-white">' + esc(b) + '</li>';
          })
          .join('');

        var scoreBadge = item.score
          ? '<span class="inline-flex items-center gap-1 rounded border-2 border-[#111111] bg-highlight px-2 py-0.5 font-display text-base text-ink-highlight">Nota ' +
            esc(item.score) +
            '/10</span>'
          : '';

        var mediaBg = item.coverUrl
          ? '<img src="' +
            esc(item.coverUrl) +
            '" alt="" aria-hidden="true" class="tg-cover-img pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55" loading="lazy" />'
          : '';

        return (
          '<article data-reel-idx="' +
          index +
          '" data-blade="0" class="relative mx-auto flex h-full w-full max-w-[430px] snap-start flex-col justify-between overflow-hidden bg-chrome-surface sm:mb-4 sm:rounded-xl sm:border-2 sm:border-white/15">' +
          mediaBg +
          '<div class="pointer-events-none absolute inset-0" style="background:linear-gradient(to top, #090A0F 8%, rgba(9,10,15,0.82) 56%, rgba(9,10,15,0.35) 100%);"></div>' +
          /* Indicadores das 3 Lâminas */
          '<div class="relative z-10 p-4">' +
          '<div class="mb-3 grid grid-cols-3 gap-1.5">' +
          '<button type="button" data-set-blade="0" aria-label="Lâmina 1: Manchete" class="h-1 rounded-full bg-highlight"></button>' +
          '<button type="button" data-set-blade="1" aria-label="Lâmina 2: Pontos-Chave" class="h-1 rounded-full bg-white/30"></button>' +
          '<button type="button" data-set-blade="2" aria-label="Lâmina 3: Leitura Completa" class="h-1 rounded-full bg-white/30"></button>' +
          '</div>' +
          '<div class="flex items-center justify-between gap-2">' +
          '<span class="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase" style="background:' +
          esc(item.fillColor) +
          ';color:' +
          esc(item.inkColor) +
          ';">' +
          esc(item.categoryName) +
          '</span>' +
          '<span class="font-mono text-[11px] text-white/80">' +
          (index + 1) +
          ' / ' +
          items.length +
          '</span>' +
          '</div>' +
          '</div>' +
          /* Conteúdo das 3 Lâminas */
          '<div class="relative z-10 mt-auto p-5 space-y-4">' +
          '<div data-blade-panel="0" class="space-y-3">' +
          '<div class="flex flex-wrap items-center gap-2">' +
          '<span class="rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-highlight">' +
          esc(item.formatLabel) +
          '</span>' +
          scoreBadge +
          '</div>' +
          '<h2 class="font-headline text-2xl font-extrabold leading-tight text-white sm:text-3xl">' +
          esc(item.title) +
          '</h2>' +
          '<p class="line-clamp-3 font-reading text-sm leading-relaxed text-white/90">' +
          esc(item.summary) +
          '</p>' +
          '</div>' +
          '<div data-blade-panel="1" class="hidden space-y-2.5">' +
          '<p class="font-mono text-xs font-bold uppercase tracking-wider text-highlight">Em 10 Segundos — Pontos-Chave</p>' +
          '<ul class="space-y-2">' +
          bulletsHtml +
          '</ul>' +
          '</div>' +
          '<div data-blade-panel="2" class="hidden space-y-3 rounded-lg border border-white/20 bg-black/65 p-4">' +
          '<p class="font-mono text-xs text-white/80">Por ' +
          esc(item.authorName) +
          ' • ' +
          esc(item.readingTime) +
          ' min de leitura</p>' +
          (item.verdict
            ? '<p class="font-headline text-xl font-bold uppercase text-highlight">' + esc(item.verdict) + '</p>'
            : '') +
          '<a href="' +
          esc(item.url) +
          '" class="inline-flex w-full items-center justify-center rounded border-2 border-[#111111] bg-highlight px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-highlight">Ler matéria completa</a>' +
          '</div>' +
          '<div class="flex items-center justify-between gap-2 border-t border-white/15 pt-3">' +
          '<button type="button" data-next-blade class="rounded border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-white hover:border-highlight hover:text-highlight">Próxima lâmina</button>' +
          '<a href="' +
          esc(item.url) +
          '" class="rounded bg-highlight px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-ink-highlight">Abrir matéria</a>' +
          '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    updateContextPanel(0);
  }

  function setCardBlade(card, bladeIdx) {
    var b = (bladeIdx + 3) % 3;
    card.setAttribute('data-blade', String(b));
    card.querySelectorAll('[data-blade-panel]').forEach(function (p, i) {
      p.classList.toggle('hidden', i !== b);
    });
    card.querySelectorAll('[data-set-blade]').forEach(function (dot, i) {
      dot.classList.toggle('bg-highlight', i === b);
      dot.classList.toggle('bg-white/30', i !== b);
    });
  }

  function updateContextPanel(idx) {
    var panel = document.getElementById('tg-reels-context');
    var item = items[idx];
    if (!panel || !item) return;

    panel.innerHTML =
      '<span class="inline-block rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase" style="background:' +
      esc(item.fillColor) +
      ';color:' +
      esc(item.inkColor) +
      ';">' +
      esc(item.categoryName) +
      '</span>' +
      '<h3 class="font-headline text-2xl font-bold leading-tight text-white">' +
      esc(item.title) +
      '</h3>' +
      '<p class="font-reading text-xs leading-relaxed text-chrome-muted">' +
      esc(item.summary) +
      '</p>' +
      '<div class="border-t border-white/10 pt-3 font-mono text-[11px] text-chrome-muted space-y-1">' +
      '<p>Autor: <strong class="text-white">' +
      esc(item.authorName) +
      '</strong></p>' +
      '<p>Publicado: ' +
      esc(item.dateRelative) +
      '</p>' +
      '</div>' +
      '<a href="' +
      esc(item.url) +
      '" class="inline-flex w-full items-center justify-center rounded border-2 border-highlight bg-highlight px-4 py-2 font-mono text-xs font-bold uppercase text-ink-highlight">Ler Matéria Completa</a>';
  }

  function scrollToIndex(idx) {
    var clamped = Math.max(0, Math.min(items.length - 1, idx));
    activeIndex = clamped;
    var target = stage.querySelector('[data-reel-idx="' + clamped + '"]');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateContextPanel(clamped);
    }
  }

  stage.addEventListener('click', function (e) {
    var card = e.target.closest('[data-reel-idx]');
    if (!card) return;
    var dot = e.target.closest('[data-set-blade]');
    if (dot) {
      setCardBlade(card, parseInt(dot.getAttribute('data-set-blade'), 10) || 0);
      return;
    }
    if (e.target.closest('[data-next-blade]')) {
      var cur = parseInt(card.getAttribute('data-blade') || '0', 10);
      setCardBlade(card, cur + 1);
    }
  });

  stage.addEventListener(
    'scroll',
    function () {
      var cards = stage.querySelectorAll('[data-reel-idx]');
      var mid = stage.getBoundingClientRect().top + stage.clientHeight / 2;
      cards.forEach(function (c, idx) {
        var r = c.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid && activeIndex !== idx) {
          activeIndex = idx;
          updateContextPanel(idx);
        }
      });
    },
    { passive: true }
  );

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-tg-reel-prev]')) scrollToIndex(activeIndex - 1);
    if (e.target.closest('[data-tg-reel-next]')) scrollToIndex(activeIndex + 1);

    var catBtn = e.target.closest('[data-tg-reel-cat]');
    if (catBtn && cfg.restUrl) {
      var slug = catBtn.getAttribute('data-tg-reel-cat') || '';
      fetch(cfg.restUrl + '/reels?category=' + encodeURIComponent(slug))
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          items = (d && d.items) || [];
          activeIndex = 0;
          renderStage();
        });
    }

    var tabBtn = e.target.closest('[data-tg-reel-tab]');
    if (tabBtn && cfg.restUrl) {
      var tab = tabBtn.getAttribute('data-tg-reel-tab') || 'foryou';
      document.querySelectorAll('[data-tg-reel-tab]').forEach(function (b) {
        var isCurr = b === tabBtn;
        b.setAttribute('aria-pressed', isCurr ? 'true' : 'false');
        b.classList.toggle('bg-highlight', isCurr);
        b.classList.toggle('text-ink-highlight', isCurr);
      });
      fetch(cfg.restUrl + '/reels?tab=' + encodeURIComponent(tab))
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          items = (d && d.items) || [];
          activeIndex = 0;
          renderStage();
        });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrollToIndex(activeIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var activeCard = stage.querySelector('[data-reel-idx="' + activeIndex + '"]');
      if (activeCard) {
        var cur = parseInt(activeCard.getAttribute('data-blade') || '0', 10);
        setCardBlade(activeCard, cur + (e.key === 'ArrowRight' ? 1 : -1));
      }
    }
  });

  renderStage();
})();
