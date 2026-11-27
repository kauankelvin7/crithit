/**
 * Teoria Geek — Player Nativo Reels 2.0 (v2.12.1, Micro-Stories em 3 Lâminas).
 * - Enquadramento exato 100dvh abaixo da Admin Bar (zero recorte no topo ou vazamento do próximo reel)
 * - Navegação de lâminas por setas laterais, clique/toque nas laterais, swipe e barras no topo
 * - Roda do mouse com debounce, scroll-snap mandatory no mobile e atalhos ↑ ↓ ← → S
 * - Painel direito complementar sem duplicar título/resumo do player central
 * - Filtros via REST (Para Você, Mais Lidas, Salvos, Editorias), compartilhamento e deep-link
 * - Curtidas persistidas no banco (_tg_likes_count) via POST /teoriageek/v1/posts/{id}/like (sem X-WP-Nonce para compatibilidade com WP Super Cache)
 */
(function () {
  'use strict';

  var stage = document.getElementById('tg-reels-stage');
  var dataNode = document.getElementById('tg-reels-initial-data');
  if (!stage || !dataNode) return;

  var STORAGE_SAVED = 'teoriageek-saved-slugs';
  var STORAGE_LIKED = 'teoriageek-liked-ids';
  var cfg = window.teoriageekConfig || {};
  var items = [];
  var activeIndex = 0;
  var activeTab = 'foryou';
  var activeCategory = '';
  var currentPage = 1;
  var hasMore = true;
  var loadingMore = false;
  var wheelLocked = false;
  var scrollTimer = null;

  var BLADE_LABELS = ['Lâmina 1/3 · Manchete', 'Lâmina 2/3 · Pontos-Chave', 'Lâmina 3/3 · Veredito & Leitura'];

  try {
    items = JSON.parse(dataNode.textContent || '[]');
  } catch (_e) {
    items = [];
  }

  function buildRestUrl(subpath, query) {
    var base = String(cfg.restUrl || '').replace(/\/+$/, '') + (subpath || '');
    if (!query) return base;
    return base + (base.indexOf('?') === -1 ? '?' : '&') + query;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSavedSlugs() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_SAVED) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function isSavedSlug(slug) {
    return getSavedSlugs().indexOf(slug) !== -1;
  }

  function toggleSavedSlug(slug) {
    var list = getSavedSlugs();
    var idx = list.indexOf(slug);
    var savedNow = false;
    if (idx === -1) {
      list.push(slug);
      savedNow = true;
    } else {
      list.splice(idx, 1);
      savedNow = false;
    }
    try {
      window.localStorage.setItem(STORAGE_SAVED, JSON.stringify(list));
    } catch (_e) {}
    syncSaveControls();
    return savedNow;
  }

  function syncSaveControls() {
    var saved = getSavedSlugs();
    document.querySelectorAll('[data-tg-reel-save]').forEach(function (btn) {
      var slug = btn.getAttribute('data-tg-reel-save') || '';
      var active = saved.indexOf(slug) !== -1;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('bg-highlight', active);
      btn.classList.toggle('text-ink-highlight', active);
      btn.classList.toggle('border-highlight', active);
      var lbl = btn.querySelector('[data-save-text]');
      if (lbl) lbl.textContent = active ? 'Salvo' : 'Salvar';
    });
  }

  function copyWithFeedback(url, btn) {
    var applyMsg = function () {
      if (!btn) return;
      var lbl = btn.querySelector('[data-feedback-text]');
      if (lbl) {
        var prev = lbl.textContent;
        lbl.textContent = 'Link copiado!';
        setTimeout(function () {
          lbl.textContent = prev;
        }, 1800);
      } else {
        btn.setAttribute('data-copied', 'true');
        setTimeout(function () {
          btn.removeAttribute('data-copied');
        }, 1800);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(applyMsg).catch(applyMsg);
    } else {
      applyMsg();
    }
  }

  function shareReel(item, btn) {
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          url: item.reelsUrl || item.url,
        })
        .catch(function () {});
    } else {
      copyWithFeedback(item.reelsUrl || item.url, btn);
    }
  }

  function iconSvg(type) {
    if (type === 'bookmark') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
    }
    if (type === 'share') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';
    }
    if (type === 'copy') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
    }
    if (type === 'external') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
    }
    if (type === 'heart') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
    }
    if (type === 'chevron-left') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
    }
    if (type === 'chevron-right') {
      return '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    }
    return '';
  }

  function getLikedIds() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_LIKED) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function isLikedId(id) {
    return getLikedIds().indexOf(Number(id)) !== -1;
  }

  function toggleLikeId(id, btn) {
    var numId = Number(id);
    if (!numId) return;
    var list = getLikedIds();
    var idx = list.indexOf(numId);
    var likedNow = idx === -1;
    if (likedNow) list.push(numId);
    else list.splice(idx, 1);
    try {
      window.localStorage.setItem(STORAGE_LIKED, JSON.stringify(list));
    } catch (_e) {}

    if (btn) {
      btn.setAttribute('aria-pressed', likedNow ? 'true' : 'false');
      btn.classList.toggle('is-liked', likedNow);
      var cnt = btn.querySelector('[data-like-count]');
      if (cnt) {
        var cur = parseInt(cnt.textContent || '0', 10) || 0;
        var nextVal = Math.max(0, cur + (likedNow ? 1 : -1));
        cnt.textContent = nextVal > 0 ? String(nextVal) : '';
      }
    }

    if (cfg.restUrl) {
      fetch(buildRestUrl('/posts/' + numId + '/like'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: likedNow ? 'like' : 'unlike' }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && typeof data.likes === 'number') {
            if (btn) {
              var cntEl = btn.querySelector('[data-like-count]');
              if (cntEl) cntEl.textContent = data.likes > 0 ? String(data.likes) : '';
            }
            for (var i = 0; i < items.length; i++) {
              if (Number(items[i].id) === numId) {
                items[i].likes = data.likes;
                break;
              }
            }
          }
        })
        .catch(function () {});
    }
  }

  function loadMoreReels() {
    if (loadingMore || !hasMore || !cfg.restUrl || activeTab === 'saved') return;
    loadingMore = true;
    var nextPage = currentPage + 1;
    var qs = new URLSearchParams({
      page: String(nextPage),
      per_page: '10',
      tab: activeTab,
    });
    if (activeCategory) qs.set('category', activeCategory);

    fetch(buildRestUrl('/reels', qs.toString()))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var batch = (d && Array.isArray(d.items)) ? d.items : [];
        if (!batch.length) {
          hasMore = false;
          return;
        }
        var existingIds = {};
        items.forEach(function (it) { existingIds[it.id] = true; });
        var fresh = batch.filter(function (it) { return !existingIds[it.id]; });
        if (!fresh.length) {
          hasMore = false;
          return;
        }
        currentPage = nextPage;
        if (batch.length < 10) hasMore = false;
        var startIdx = items.length;
        items = items.concat(fresh);
        var frag = document.createElement('div');
        frag.innerHTML = fresh.map(function (it, off) {
          return buildSlideHtml(it, startIdx + off);
        }).join('');
        while (frag.firstChild) {
          stage.appendChild(frag.firstChild);
        }
        stage.querySelectorAll('img.tg-reel-cover').forEach(function (img) {
          if (!img.dataset.boundErr) {
            img.dataset.boundErr = '1';
            img.addEventListener('error', function () { img.style.display = 'none'; });
          }
        });
        stage.querySelectorAll('[data-reel-slide-counter]').forEach(function (cntEl, i) {
          cntEl.textContent = (i + 1) + ' / ' + items.length;
        });
        updateRailControls();
        var currCard = stage.querySelector('[data-reel-idx="' + activeIndex + '"]');
        var currBlade = currCard ? parseInt(currCard.getAttribute('data-blade') || '0', 10) : 0;
        updateContextPanel(activeIndex, currBlade);
      })
      .catch(function () {
        hasMore = false;
      })
      .finally(function () {
        loadingMore = false;
      });
  }

  function fallbackGradient(artKey) {
    var map = {
      games: 'linear-gradient(155deg,#0B132B 0%,#1D4ED8 55%,#2563EB 100%)',
      cinema: 'linear-gradient(155deg,#062C22 0%,#047857 55%,#059669 100%)',
      animes: 'linear-gradient(155deg,#082F49 0%,#0E7490 55%,#0284C7 100%)',
      comics: 'linear-gradient(155deg,#3B1805 0%,#B45309 55%,#D97706 100%)',
      tech: 'linear-gradient(155deg,#172554 0%,#1D4ED8 55%,#3B82F6 100%)',
    };
    return map[artKey] || map.tech;
  }

  function renderStage() {
    if (!items.length) {
      var emptyMsg =
        activeTab === 'saved'
          ? 'Você ainda não salvou nenhuma matéria. Toque em Salvar em qualquer reel ou artigo.'
          : 'Nenhuma matéria encontrada para esta seleção.';
      stage.innerHTML =
        '<div class="flex h-full w-full items-center justify-center p-6 text-center font-sans text-sm text-chrome-muted">' +
        esc(emptyMsg) +
        '</div>';
      updateRailControls();
      updateContextPanel(0, 0);
      return;
    }

    stage.innerHTML = items.map(buildSlideHtml).join('');
    stage.querySelectorAll('img.tg-reel-cover').forEach(function (img) {
      img.dataset.boundErr = '1';
      img.addEventListener('error', function () {
        img.style.display = 'none';
      });
    });
    activeIndex = 0;
    stage.scrollTop = 0;
    updateRailControls();
    updateContextPanel(0, 0);
    syncSaveControls();
  }

  function buildSlideHtml(item, index) {
        var bulletsArr = Array.isArray(item.bullets) ? item.bullets.slice(0, 3) : [];
        var bulletsHtml = bulletsArr.length
          ? bulletsArr
              .map(function (b, bi) {
                return (
                  '<li class="flex gap-2 rounded-sm border border-white/15 bg-black/75 p-3 font-reading text-xs leading-snug text-white sm:text-sm">' +
                  '<span class="font-mono font-bold text-highlight">' +
                  (bi + 1) +
                  '.</span><span>' +
                  esc(b) +
                  '</span></li>'
                );
              })
              .join('')
          : '<li class="rounded-sm border border-white/15 bg-black/75 p-3 font-reading text-xs leading-snug text-white sm:text-sm">' +
            esc(item.summary || item.title) +
            '</li>';

        var scoreBadge = item.score
          ? '<span class="inline-flex items-center gap-1 rounded-sm border border-[#0B0F19] bg-highlight px-2 py-0.5 font-display text-base leading-none text-ink-highlight">Nota ' +
            esc(item.score) +
            '/10</span>'
          : '';

        var mediaBg = item.coverUrl
          ? '<img src="' +
            esc(item.coverUrl) +
            '" alt="" aria-hidden="true" class="tg-reel-cover pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100" loading="' +
            (index === 0 ? 'eager' : 'lazy') +
            '" decoding="async" />'
          : '';

        var isSaved = isSavedSlug(item.slug);

        return (
          '<div class="tg-reel-slide flex h-full w-full shrink-0 snap-start items-center justify-center sm:py-3">' +
          '<article data-reel-idx="' +
          index +
          '" data-reel-slug="' +
          esc(item.slug) +
          '" data-blade="0" class="tg-reel-card relative flex h-full w-full flex-col justify-between overflow-hidden bg-chrome-surface sm:rounded-sm sm:border sm:border-white/15">' +
          /* Fallback gradiente elegante (sempre presente abaixo da imagem caso falhe ou inexista) */
          '<div class="pointer-events-none absolute inset-0" style="background:' +
          fallbackGradient(item.artKey) +
          ';"></div>' +
          mediaBg +
          /* Gradiente editorial focado apenas na metade inferior (texto) e vinheta leve no topo — foto limpa no centro! */
          '<div class="tg-reel-scrim pointer-events-none absolute inset-0" style="background:linear-gradient(to top, rgba(9,10,15,0.96) 0%, rgba(9,10,15,0.88) 28%, rgba(9,10,15,0.42) 48%, rgba(9,10,15,0) 60%, rgba(9,10,15,0) 84%, rgba(9,10,15,0.52) 100%);"></div>' +
          /* Véu extra de legibilidade ativado apenas nas Lâminas 2 e 3 (Pontos-Chave / Veredito) */
          '<div class="tg-reel-blade-veil pointer-events-none absolute inset-0 bg-[#090A0F]/65 opacity-0 transition-opacity duration-200"></div>' +
          /* Zonas invisíveis clicáveis nas laterais esquerda/direita (mobile + toque rápido) */
          '<button type="button" data-blade-prev aria-label="Lâmina anterior" class="tg-reel-tap-zone absolute inset-y-16 left-0 z-20 w-[30%] cursor-pointer bg-transparent focus-visible:outline-highlight"></button>' +
          '<button type="button" data-blade-next aria-label="Próxima lâmina" class="tg-reel-tap-zone absolute inset-y-16 right-0 z-20 w-[30%] cursor-pointer bg-transparent focus-visible:outline-highlight"></button>' +
          /* Setas discretas visíveis no Desktop/Tablet para deixar óbvia a navegação entre as 3 lâminas */
          '<button type="button" data-blade-prev aria-label="Lâmina anterior" class="tg-reel-blade-arrow absolute left-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm border border-white/25 bg-black/55 text-white backdrop-blur-xs transition-colors hover:border-highlight hover:text-highlight sm:inline-flex">' +
          iconSvg('chevron-left') +
          '</button>' +
          '<button type="button" data-blade-next aria-label="Próxima lâmina" class="tg-reel-blade-arrow absolute right-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm border border-white/25 bg-black/55 text-white backdrop-blur-xs transition-colors hover:border-highlight hover:text-highlight sm:inline-flex">' +
          iconSvg('chevron-right') +
          '</button>' +
          /* Topo: barras de progresso clicáveis das 3 lâminas + selo da editoria + contador apenas no mobile */
          '<div class="relative z-30 p-3.5 sm:p-4">' +
          '<div role="tablist" aria-label="Lâminas do resumo" class="mb-2.5 grid grid-cols-3 gap-1.5">' +
          '<button type="button" role="tab" aria-selected="true" data-set-blade="0" aria-label="Lâmina 1: Manchete" class="h-1.5 rounded-sm bg-highlight transition-colors"></button>' +
          '<button type="button" role="tab" aria-selected="false" data-set-blade="1" aria-label="Lâmina 2: Pontos-Chave" class="h-1.5 rounded-sm bg-white/35 transition-colors hover:bg-white/70"></button>' +
          '<button type="button" role="tab" aria-selected="false" data-set-blade="2" aria-label="Lâmina 3: Leitura Completa" class="h-1.5 rounded-sm bg-white/35 transition-colors hover:bg-white/70"></button>' +
          '</div>' +
          '<div class="flex items-center justify-between gap-2">' +
          '<span class="tg-cat-badge inline-flex max-w-[78%] items-center truncate rounded-sm px-2 py-0.5 font-headline text-[11px] font-bold uppercase tracking-wider" style="background:' +
          esc(item.fillColor) +
          ';color:' +
          esc(item.inkColor) +
          ';">' +
          esc(item.categoryName) +
          '</span>' +
          '<span data-reel-slide-counter class="rounded-sm bg-black/60 px-2 py-0.5 font-mono text-[11px] font-bold text-white/95 sm:hidden">' +
          (index + 1) +
          ' / ' +
          items.length +
          '</span>' +
          '</div>' +
          '</div>' +
          /* Conteúdo principal do player (pointer-events-none para não bloquear toque lateral nas lâminas; links/botões são pointer-events-auto) */
          '<div class="tg-reel-bottom-bar pointer-events-none relative z-30 mt-auto flex items-end justify-between gap-3 p-4 sm:p-5">' +
          '<div class="min-w-0 flex-1 space-y-2.5">' +
          /* Lâmina 0: Manchete */
          '<div data-blade-panel="0" class="space-y-2">' +
          '<div class="flex flex-wrap items-center gap-2">' +
          '<span class="rounded-sm bg-white/15 px-2 py-0.5 font-sans text-[11px] font-bold uppercase text-highlight">' +
          esc(item.formatLabel) +
          '</span>' +
          scoreBadge +
          '</div>' +
          '<h2 class="tg-reel-headline line-clamp-4 font-headline text-2xl font-extrabold leading-[1.1] tracking-[0.005em] text-white sm:text-[1.7rem]">' +
          esc(item.title) +
          '</h2>' +
          (item.summary
            ? '<p class="line-clamp-3 font-reading text-xs leading-relaxed text-slate-100 sm:text-sm">' +
              esc(item.summary) +
              '</p>'
            : '') +
          '<p class="font-sans text-[11px] font-medium text-slate-300 sm:hidden">Deslize ou toque nas laterais para ver os pontos-chave</p>' +
          '</div>' +
          /* Lâmina 1: Pontos-Chave */
          '<div data-blade-panel="1" class="hidden space-y-2">' +
          '<p class="font-sans text-xs font-extrabold uppercase tracking-wider text-highlight">Em 10 Segundos — Pontos-Chave</p>' +
          '<ul class="space-y-2">' +
          bulletsHtml +
          '</ul>' +
          '</div>' +
          /* Lâmina 2: Veredito & Leitura */
          '<div data-blade-panel="2" class="hidden space-y-2.5 rounded-sm border border-white/20 bg-black/80 p-4">' +
          '<p class="font-sans text-xs text-slate-200">Por <strong class="text-white">' +
          esc(item.authorName) +
          '</strong> · Matéria completa: ' +
          esc(item.readingTime) +
          ' min</p>' +
          (item.verdict
            ? '<p class="font-headline text-xl font-extrabold uppercase text-highlight">' + esc(item.verdict) + '</p>'
            : '') +
          '<a href="' +
          esc(item.url) +
          '" class="pointer-events-auto inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2.5 font-sans text-xs font-extrabold uppercase text-ink-highlight xl:hidden">Ler matéria completa</a>' +
          '<p class="hidden font-reading text-xs text-slate-200 xl:block">Acesse a matéria completa e os próximos destaques no painel ao lado.</p>' +
          '</div>' +
          '</div>' +
          /* Coluna compacta de ações no Mobile/Tablet (< xl) ancorada no canto inferior direito */
          '<div class="pointer-events-auto flex shrink-0 flex-col items-center gap-2 xl:hidden">' +
          '<button type="button" data-tg-reel-like="' +
          esc(item.id) +
          '" aria-pressed="' +
          (isLikedId(item.id) ? 'true' : 'false') +
          '" aria-label="Curtir matéria" class="tgx-reel-like-btn inline-flex min-h-[40px] w-10 flex-col items-center justify-center gap-0.5 rounded-sm border border-white/25 bg-black/70 py-1 text-white' +
          (isLikedId(item.id) ? ' is-liked' : '') +
          '">' +
          iconSvg('heart') +
          '<span data-like-count class="text-[11px] font-bold leading-none">' +
          (item.likes > 0 ? esc(item.likes) : '') +
          '</span></button>' +
          '<button type="button" data-tg-reel-save="' +
          esc(item.slug) +
          '" aria-pressed="' +
          (isSaved ? 'true' : 'false') +
          '" aria-label="Salvar matéria" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border ' +
          (isSaved ? 'border-highlight bg-highlight text-ink-highlight' : 'border-white/25 bg-black/70 text-white') +
          '">' +
          iconSvg('bookmark') +
          '</button>' +
          '<button type="button" data-tg-reel-share="' +
          index +
          '" aria-label="Compartilhar reel" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/25 bg-black/70 text-white hover:border-highlight hover:text-highlight">' +
          iconSvg('share') +
          '</button>' +
          '<a href="' +
          esc(item.url) +
          '" aria-label="Ler matéria completa" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#0B0F19] bg-highlight text-ink-highlight">' +
          iconSvg('external') +
          '</a>' +
          '</div>' +
          '</div>' +
          '</article>' +
          '</div>'
        );
  }

  function updateRailControls() {
    var counter = document.getElementById('tg-reels-counter-rail');
    if (counter) {
      counter.textContent = items.length ? activeIndex + 1 + ' / ' + items.length : '0 / 0';
    }
    var prevBtn = document.querySelector('[data-tg-reel-prev]');
    var nextBtn = document.querySelector('[data-tg-reel-next]');
    if (prevBtn) prevBtn.disabled = activeIndex <= 0;
    if (nextBtn) nextBtn.disabled = activeIndex >= items.length - 1;
  }

  function syncUrlSlug(item) {
    if (!item || !item.slug || !window.history || !window.history.replaceState) return;
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('post', item.slug);
      u.searchParams.delete('id');
      window.history.replaceState(null, '', u.toString());
    } catch (_e) {}
  }

  function setCardBlade(card, bladeIdx) {
    var b = (bladeIdx + 3) % 3;
    card.setAttribute('data-blade', String(b));
    card.querySelectorAll('[data-blade-panel]').forEach(function (p, i) {
      p.classList.toggle('hidden', i !== b);
    });
    var veil = card.querySelector('.tg-reel-blade-veil');
    if (veil) {
      veil.classList.toggle('opacity-100', b !== 0);
      veil.classList.toggle('opacity-0', b === 0);
    }
    card.querySelectorAll('[data-set-blade]').forEach(function (dot, i) {
      dot.setAttribute('aria-selected', i === b ? 'true' : 'false');
      dot.classList.toggle('bg-highlight', i === b);
      dot.classList.toggle('bg-white/35', i !== b);
    });
    var idx = parseInt(card.getAttribute('data-reel-idx') || '0', 10);
    if (idx === activeIndex) {
      updateContextPanel(idx, b);
    }
  }

  function updateContextPanel(idx, bladeIdx) {
    var panel = document.getElementById('tg-reels-context');
    var item = items[idx];
    if (!panel) return;
    if (!item) {
      panel.innerHTML = '<p class="font-sans text-xs text-slate-300">Selecione uma editoria para explorar os Reels.</p>';
      return;
    }

    var activeBlade = typeof bladeIdx === 'number' ? bladeIdx : 0;
    var isSaved = isSavedSlug(item.slug);
    var bulletsArr = Array.isArray(item.bullets) ? item.bullets.slice(0, 3) : [];

    var bulletsList = bulletsArr
      .map(function (b, bi) {
        return (
          '<li class="flex gap-2 font-reading text-xs leading-relaxed text-slate-100">' +
          '<span class="font-mono font-bold text-highlight">' +
          (bi + 1) +
          '.</span><span>' +
          esc(b) +
          '</span></li>'
        );
      })
      .join('');

    var queueHtml = items
      .slice(idx + 1, idx + 3)
      .map(function (nextItem, offset) {
        var targetIdx = idx + 1 + offset;
        return (
          '<li>' +
          '<button type="button" data-tg-reel-jump="' +
          targetIdx +
          '" class="group flex w-full items-start gap-2.5 rounded-sm border border-white/15 bg-chrome-surface/80 p-2.5 text-left transition-colors hover:border-highlight">' +
          '<span class="font-mono text-xs font-bold text-highlight">' +
          String(targetIdx + 1).padStart(2, '0') +
          '</span>' +
          '<span class="min-w-0 flex-1">' +
          '<span class="block font-sans text-[11px] font-bold uppercase text-slate-300">' +
          esc(nextItem.categoryName) +
          '</span>' +
          '<span class="line-clamp-2 block font-sans text-xs font-semibold text-white group-hover:text-highlight">' +
          esc(nextItem.title) +
          '</span>' +
          '</span>' +
          '</button>' +
          '</li>'
        );
      })
      .join('');

    panel.innerHTML =
      '<div class="flex items-center justify-between gap-2">' +
      '<span class="rounded-sm border border-white/15 bg-chrome-surface px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-wide text-highlight">' +
      esc(BLADE_LABELS[activeBlade] || BLADE_LABELS[0]) +
      '</span>' +
      (item.score
        ? '<span class="rounded-sm bg-highlight px-2 py-0.5 font-sans text-[11px] font-extrabold text-ink-highlight">Nota ' +
          esc(item.score) +
          '/10</span>'
        : '') +
      '</div>' +
      /* Contexto complementar: exibido apenas quando existem pontos-chave distintos do subtítulo do card */
      (bulletsArr.length
        ? '<div class="space-y-2.5 rounded-sm border border-white/15 bg-chrome-surface p-3.5">' +
          '<p class="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-300">Pontos-Chave da Matéria</p>' +
          '<ul class="space-y-2">' +
          bulletsList +
          '</ul>' +
          (item.sourceName
            ? '<p class="border-t border-white/10 pt-2 font-sans text-xs text-slate-300">Fonte: <strong class="text-white">' +
              esc(item.sourceName) +
              '</strong></p>'
            : '') +
          '</div>'
        : '') +
      /* Metadados editoriais com Editoria em largura cheia (sem truncar) e rótulo claro do tempo da matéria */
      '<dl class="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-sm border border-white/15 bg-chrome-surface/75 p-3.5 font-sans text-xs">' +
      '<div class="col-span-2"><dt class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Editoria</dt><dd class="mt-0.5 font-bold leading-snug text-white"><a href="' +
      esc(item.categoryUrl) +
      '" class="hover:text-highlight hover:underline">' +
      esc(item.categoryName) +
      '</a></dd></div>' +
      '<div><dt class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Autor</dt><dd class="mt-0.5 truncate font-semibold text-white">' +
      esc(item.authorName) +
      '</dd></div>' +
      '<div><dt class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Publicado</dt><dd class="mt-0.5 font-semibold text-white">' +
      esc(item.dateRelative) +
      '</dd></div>' +
      '<div class="col-span-2 border-t border-white/10 pt-2 flex items-center justify-between"><dt class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Matéria completa</dt><dd class="font-bold text-highlight">' +
      esc(item.readingTime) +
      ' min de leitura</dd></div>' +
      '</dl>' +
      /* Ações reais: Salvar, Compartilhar, Copiar Link */
      '<div class="grid grid-cols-3 gap-2">' +
      '<button type="button" data-tg-reel-save="' +
      esc(item.slug) +
      '" aria-pressed="' +
      (isSaved ? 'true' : 'false') +
      '" class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-sm border px-2.5 py-2 font-sans text-[11px] font-bold uppercase transition-colors ' +
      (isSaved
        ? 'border-highlight bg-highlight text-ink-highlight'
        : 'border-white/25 bg-chrome-surface text-white hover:border-highlight hover:text-highlight') +
      '">' +
      iconSvg('bookmark') +
      '<span data-save-text>' +
      (isSaved ? 'Salvo' : 'Salvar') +
      '</span></button>' +
      '<button type="button" data-tg-reel-share="' +
      idx +
      '" class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-sm border border-white/25 bg-chrome-surface px-2.5 py-2 font-sans text-[11px] font-bold uppercase text-white transition-colors hover:border-highlight hover:text-highlight">' +
      iconSvg('share') +
      '<span data-feedback-text>Enviar</span></button>' +
      '<button type="button" data-tg-reel-copy="' +
      esc(item.reelsUrl || item.url) +
      '" class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-sm border border-white/25 bg-chrome-surface px-2.5 py-2 font-sans text-[11px] font-bold uppercase text-white transition-colors hover:border-highlight hover:text-highlight">' +
      iconSvg('copy') +
      '<span data-feedback-text>Copiar</span></button>' +
      '</div>' +
      /* 1 Único CTA principal no Desktop */
      '<a href="' +
      esc(item.url) +
      '" class="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2.5 font-sans text-xs font-extrabold uppercase text-ink-highlight transition-colors hover:bg-[#fde047]">' +
      '<span>Ler matéria completa</span>' +
      iconSvg('external') +
      '</a>' +
      /* Fila compacta de próximos reels (2 itens para não cortar no viewport) */
      (queueHtml
        ? '<div class="space-y-2 pt-1"><p class="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-300">Próximos na fila</p><ul class="space-y-2">' +
          queueHtml +
          '</ul></div>'
        : '');
  }

  function scrollToIndex(idx) {
    if (!items.length) return;
    var clamped = Math.max(0, Math.min(items.length - 1, idx));
    activeIndex = clamped;
    var target = stage.querySelector('[data-reel-idx="' + clamped + '"]');
    if (target) {
      var slide = target.closest('.tg-reel-slide') || target;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      stage.scrollTo({ top: slide.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
      var blade = parseInt(target.getAttribute('data-blade') || '0', 10);
      updateRailControls();
      updateContextPanel(clamped, blade);
      if (clamped >= items.length - 2) loadMoreReels();
      syncUrlSlug(items[clamped]);
    }
  }

  function fetchReels(params) {
    if (!cfg.restUrl) return;
    var qs = new URLSearchParams(params);
    stage.setAttribute('aria-busy', 'true');
    stage.innerHTML =
      '<div class="tg-reel-slide flex h-full w-full items-center justify-center sm:py-2.5">' +
      '<div class="tg-reel-card tgx-reel-skeleton relative flex h-full w-full flex-col justify-between overflow-hidden bg-chrome-surface p-5 sm:rounded-sm sm:border sm:border-white/15">' +
      '<div class="space-y-3"><div class="grid grid-cols-3 gap-1.5"><div class="tgx-skel-dark h-1.5 rounded-sm"></div><div class="tgx-skel-dark h-1.5 rounded-sm"></div><div class="tgx-skel-dark h-1.5 rounded-sm"></div></div><div class="tgx-skel-dark h-5 w-28 rounded-sm"></div></div>' +
      '<div class="space-y-3"><div class="tgx-skel-dark h-7 w-11/12 rounded-sm"></div><div class="tgx-skel-dark h-7 w-3/4 rounded-sm"></div><div class="tgx-skel-dark h-4 w-full rounded-sm"></div><div class="tgx-skel-dark h-4 w-2/3 rounded-sm"></div></div>' +
      '</div></div>';
    fetch(buildRestUrl('/reels', qs.toString()))
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        items = (d && Array.isArray(d.items)) ? d.items : [];
        currentPage = 1;
        hasMore = activeTab !== 'saved' && activeTab !== 'trending' && items.length >= 10;
        activeIndex = 0;
        renderStage();
      })
      .finally(function () {
        stage.removeAttribute('aria-busy');
      });
  }

  /* Gesto horizontal (swipe) no mobile/tablet registrado uma única vez na inicialização */
  var touchStartX = 0;
  var touchStartY = 0;
  stage.addEventListener(
    'touchstart',
    function (e) {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    'touchend',
    function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        var activeCard = stage.querySelector('[data-reel-idx="' + activeIndex + '"]');
        if (activeCard) {
          var cur = parseInt(activeCard.getAttribute('data-blade') || '0', 10);
          setCardBlade(activeCard, cur + (dx < 0 ? 1 : -1));
        }
      }
    },
    { passive: true }
  );

  function syncFilterStates() {
    document.querySelectorAll('[data-tg-reel-tab]').forEach(function (b) {
      var isCurr = b.getAttribute('data-tg-reel-tab') === activeTab;
      b.setAttribute('aria-pressed', isCurr ? 'true' : 'false');
      b.classList.toggle('bg-highlight', isCurr);
      b.classList.toggle('text-ink-highlight', isCurr);
      b.classList.toggle('font-extrabold', isCurr);
      b.classList.toggle('bg-chrome-surface', !isCurr && b.classList.contains('tg-reel-chip'));
      b.classList.toggle('text-slate-200', !isCurr && !b.classList.contains('tg-reel-chip'));
      b.classList.toggle('text-chrome-ink', !isCurr && b.classList.contains('tg-reel-chip'));
    });

    document.querySelectorAll('[data-tg-reel-cat]').forEach(function (b) {
      var isCurr = activeTab === 'foryou' && (b.getAttribute('data-tg-reel-cat') || '') === activeCategory;
      b.setAttribute('aria-pressed', isCurr ? 'true' : 'false');
      if (b.classList.contains('tg-reel-cat-chip')) {
        b.classList.toggle('bg-brand-fill', isCurr);
        b.classList.toggle('border-highlight', isCurr);
        b.classList.toggle('text-white', isCurr);
        b.classList.toggle('bg-chrome-surface', !isCurr);
        b.classList.toggle('text-chrome-muted', !isCurr);
      } else {
        b.classList.toggle('border-highlight', isCurr);
        b.classList.toggle('border-transparent', !isCurr);
        b.classList.toggle('bg-white/10', isCurr);
        b.classList.toggle('text-white', isCurr);
        b.classList.toggle('font-bold', isCurr);
        b.classList.toggle('text-slate-300', !isCurr);
        b.classList.toggle('font-medium', !isCurr);
      }
    });
  }

  /* Cliques dentro do palco (barras no topo, laterais esquerda/direita, ações mobile) */
  stage.addEventListener('click', function (e) {
    var saveBtn = e.target.closest('[data-tg-reel-save]');
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleSavedSlug(saveBtn.getAttribute('data-tg-reel-save') || '');
      return;
    }

    var shareBtn = e.target.closest('[data-tg-reel-share]');
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      var sIdx = parseInt(shareBtn.getAttribute('data-tg-reel-share') || '0', 10);
      if (items[sIdx]) shareReel(items[sIdx], shareBtn);
      return;
    }

    var card = e.target.closest('[data-reel-idx]');
    if (!card) return;

    var likeBtn = e.target.closest('[data-tg-reel-like]');
    if (likeBtn) {
      e.preventDefault();
      toggleLikeId(likeBtn.getAttribute('data-tg-reel-like'), likeBtn);
      return;
    }

    var dot = e.target.closest('[data-set-blade]');
    if (dot) {
      setCardBlade(card, parseInt(dot.getAttribute('data-set-blade'), 10) || 0);
      return;
    }

    if (e.target.closest('[data-blade-next]')) {
      var curNext = parseInt(card.getAttribute('data-blade') || '0', 10);
      setCardBlade(card, curNext + 1);
      return;
    }

    if (e.target.closest('[data-blade-prev]')) {
      var curPrev = parseInt(card.getAttribute('data-blade') || '0', 10);
      setCardBlade(card, curPrev - 1);
    }
  });

  /* Scroll-snap sync */
  stage.addEventListener(
    'scroll',
    function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var cards = stage.querySelectorAll('[data-reel-idx]');
        var mid = stage.getBoundingClientRect().top + stage.clientHeight / 2;
        cards.forEach(function (c, idx) {
          var r = c.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid && activeIndex !== idx) {
            activeIndex = idx;
            var blade = parseInt(c.getAttribute('data-blade') || '0', 10);
            updateRailControls();
            updateContextPanel(idx, blade);
            if (idx >= items.length - 2) loadMoreReels();
            syncUrlSlug(items[idx]);
          }
        });
      }, 60);
    },
    { passive: true }
  );

  /* Roda do mouse com debounce no desktop para troca suave 1-a-1 */
  stage.addEventListener(
    'wheel',
    function (e) {
      if (window.innerWidth < 640 || Math.abs(e.deltaY) < 24) return;
      e.preventDefault();
      if (wheelLocked) return;
      wheelLocked = true;
      scrollToIndex(activeIndex + (e.deltaY > 0 ? 1 : -1));
      setTimeout(function () {
        wheelLocked = false;
      }, 380);
    },
    { passive: false }
  );

  /* Cliques globais: Anterior/Próximo, Abas, Editorias, Painel Direito (Salvar/Compartilhar/Copiar/Fila) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-tg-reel-prev]')) {
      scrollToIndex(activeIndex - 1);
      return;
    }
    if (e.target.closest('[data-tg-reel-next]')) {
      scrollToIndex(activeIndex + 1);
      return;
    }

    var jumpBtn = e.target.closest('[data-tg-reel-jump]');
    if (jumpBtn) {
      scrollToIndex(parseInt(jumpBtn.getAttribute('data-tg-reel-jump') || '0', 10));
      return;
    }

    var ctxSave = e.target.closest('#tg-reels-context [data-tg-reel-save]');
    if (ctxSave) {
      e.preventDefault();
      toggleSavedSlug(ctxSave.getAttribute('data-tg-reel-save') || '');
      return;
    }

    var ctxShare = e.target.closest('#tg-reels-context [data-tg-reel-share]');
    if (ctxShare) {
      e.preventDefault();
      var idx = parseInt(ctxShare.getAttribute('data-tg-reel-share') || '0', 10);
      if (items[idx]) shareReel(items[idx], ctxShare);
      return;
    }

    var ctxCopy = e.target.closest('[data-tg-reel-copy]');
    if (ctxCopy) {
      e.preventDefault();
      copyWithFeedback(ctxCopy.getAttribute('data-tg-reel-copy') || window.location.href, ctxCopy);
      return;
    }

    var catBtn = e.target.closest('[data-tg-reel-cat]');
    if (catBtn) {
      activeTab = 'foryou';
      activeCategory = catBtn.getAttribute('data-tg-reel-cat') || '';
      syncFilterStates();
      fetchReels({ category: activeCategory, tab: 'foryou' });
      return;
    }

    var tabBtn = e.target.closest('[data-tg-reel-tab]');
    if (tabBtn) {
      activeTab = tabBtn.getAttribute('data-tg-reel-tab') || 'foryou';
      activeCategory = '';
      syncFilterStates();
      if (activeTab === 'saved') {
        var savedList = getSavedSlugs();
        if (!savedList.length) {
          items = [];
          activeIndex = 0;
          renderStage();
        } else {
          fetchReels({ tab: 'saved', slugs: savedList.join(',') });
        }
      } else {
        fetchReels({ tab: activeTab });
      }
    }
  });

  /* Atalhos de teclado: ↑ ↓ troca reel | ← → troca lâmina | S salva */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrollToIndex(activeIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var activeCard = stage.querySelector('[data-reel-idx="' + activeIndex + '"]');
      if (activeCard) {
        e.preventDefault();
        var cur = parseInt(activeCard.getAttribute('data-blade') || '0', 10);
        setCardBlade(activeCard, cur + (e.key === 'ArrowRight' ? 1 : -1));
      }
    } else if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && items[activeIndex]) {
      e.preventDefault();
      toggleSavedSlug(items[activeIndex].slug);
    }
  });

  if (window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
  renderStage();
})();
