/**
 * Teoria Geek — Interações Globais Vanilla JS (Zero Dependências).
 * - Alternância Modo Claro / Modo Escuro persistente sem FOUC
 * - Barra de progresso de leitura suave (requestAnimationFrame)
 * - Menu Mobile acessível com acordeão para submenus + tecla Escape
 * - Modal de Busca Instantânea (REST API /teoriageek/v1/search)
 * - Fallback automático para imagens remotas ausentes
 * - Compartilhamento nativo / copiar link e lista local de salvos
 */
(function () {
  'use strict';

  var STORAGE_THEME = 'teoriageek-theme';
  var STORAGE_SAVED = 'teoriageek-saved-slugs';
  var cfg = window.teoriageekConfig || {};

  /* 1. Fallback automático para qualquer capa cuja imagem remota falhe (tempo real + pós-load) */
  function revealCoverFallback(img) {
    if (!img) return;
    img.style.display = 'none';
    var wrap = img.closest('.tg-cover-wrap');
    if (wrap) {
      wrap.querySelectorAll('img').forEach(function (other) {
        other.style.display = 'none';
      });
      var fb = wrap.querySelector('.tg-cover-fallback');
      if (fb) {
        fb.classList.remove('hidden');
        fb.style.display = 'block';
      }
    }
  }

  document.addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG' && target.classList.contains('tg-cover-img')) {
        revealCoverFallback(target);
      }
    },
    true
  );

  function scanBrokenCoverImages() {
    document.querySelectorAll('img.tg-cover-img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        revealCoverFallback(img);
      }
    });
  }

  /* 2. Tema Claro / Escuro */
  function getActiveTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncThemeButtons() {
    var isDark = getActiveTheme() === 'dark';
    var buttons = document.querySelectorAll('[data-tg-theme-toggle]');
    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
      var moon = btn.querySelector('[data-tg-theme-icon="moon"]');
      var sun = btn.querySelector('[data-tg-theme-icon="sun"]');
      var label = btn.querySelector('[data-tg-theme-label]');
      if (moon && sun) {
        moon.classList.toggle('hidden', isDark);
        sun.classList.toggle('hidden', !isDark);
      }
      if (label) {
        label.textContent = isDark ? 'Claro' : 'Escuro';
      }
    });
  }

  function setTheme(next) {
    var root = document.documentElement;
    root.setAttribute('data-theme', next);
    if (next === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_THEME, next);
    } catch (_e) {
      // Ignora bloqueio de storage
    }
    syncThemeButtons();
    // Recarrega o esquema de cores do Disqus (pipDisqus) caso já esteja montado na página
    if (window.DISQUS && typeof window.DISQUS.reset === 'function' && document.getElementById('disqus_thread')) {
      try {
        window.DISQUS.reset({ reload: true });
      } catch (_e) {}
    }
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-tg-theme-toggle]');
    if (toggle) {
      e.preventDefault();
      setTheme(getActiveTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  /* 3. Barra de Progresso de Leitura no single.php */
  function initReadingProgress() {
    var bar = document.getElementById('tg-reading-progress');
    var articleBody = document.getElementById('tg-article-body');
    if (!bar || !articleBody) return;

    var ticking = false;
    function updateBar() {
      var rect = articleBody.getBoundingClientRect();
      var viewportH = window.innerHeight || document.documentElement.clientHeight;
      var total = Math.max(1, articleBody.offsetHeight - viewportH * 0.55);
      var scrolled = Math.max(0, -rect.top + 96);
      var ratio = Math.max(0, Math.min(1, scrolled / total));
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateBar);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateBar();
  }

  /* 4. Menu Mobile + Submenus expansíveis */
  function initMobileDrawer() {
    var drawer = document.getElementById('tg-mobile-drawer');
    if (!drawer) return;

    var openBtns = document.querySelectorAll('[data-tg-drawer-open]');

    // Transforma itens com submenu em acordeões acessíveis no mobile
    var parents = drawer.querySelectorAll('.menu-item-has-children');
    parents.forEach(function (li) {
      var sub = li.querySelector(':scope > .sub-menu');
      var link = li.querySelector(':scope > a');
      if (!sub || !link) return;

      var row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2';
      link.parentNode.insertBefore(row, link);
      row.appendChild(link);

      var expBtn = document.createElement('button');
      expBtn.type = 'button';
      expBtn.className =
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-white/15 bg-chrome-surface text-xs text-chrome-ink';
      expBtn.setAttribute('aria-expanded', 'false');
      expBtn.setAttribute('aria-label', 'Expandir submenu');
      expBtn.innerHTML =
        '<svg class="h-4 w-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
      row.appendChild(expBtn);

      sub.classList.add('hidden');
      expBtn.addEventListener('click', function () {
        var expanded = expBtn.getAttribute('aria-expanded') === 'true';
        expBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        sub.classList.toggle('hidden', expanded);
        var svg = expBtn.querySelector('svg');
        if (svg) svg.style.transform = expanded ? '' : 'rotate(180deg)';
      });
    });

    function setDrawer(open) {
      drawer.classList.toggle('hidden', !open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      openBtns.forEach(function (b) {
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-tg-drawer-open]')) {
        e.preventDefault();
        setDrawer(true);
      } else if (e.target.closest('[data-tg-drawer-close]')) {
        e.preventDefault();
        setDrawer(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
        setDrawer(false);
      }
    });
  }

  /* 5. Modal de Busca Instantânea */
  function initInstantSearch() {
    var modal = document.getElementById('tg-search-modal');
    var input = document.getElementById('tg-instant-search-input');
    var resultsBox = document.getElementById('tg-instant-search-results');
    if (!modal || !input || !resultsBox) return;

    var debounceTimer = null;
    var controller = null;

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function setSearchModal(open) {
      modal.classList.toggle('hidden', !open);
      modal.classList.toggle('flex', open);
      modal.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        setTimeout(function () {
          input.focus();
        }, 30);
      }
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-tg-search-open]')) {
        e.preventDefault();
        setSearchModal(true);
      } else if (e.target.closest('[data-tg-search-close]')) {
        e.preventDefault();
        setSearchModal(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModal(modal.classList.contains('hidden'));
      } else if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        setSearchModal(false);
      }
    });

    input.addEventListener('input', function () {
      var term = input.value.trim();
      clearTimeout(debounceTimer);
      if (term.length < 2) {
        resultsBox.innerHTML =
          '<p class="py-3 text-center font-mono text-xs text-ink-muted">Digite ao menos 2 letras para visualizar resultados instantâneos ou pressione Enter.</p>';
        return;
      }

      debounceTimer = setTimeout(function () {
        if (!cfg.restUrl) return;
        if (controller) controller.abort();
        controller = new AbortController();

        resultsBox.innerHTML =
          '<div class="tgx-skel-list" aria-label="Carregando resultados">' +
          '<div class="tgx-skel-row"><div class="tgx-skel-line w-24 h-3"></div><div class="tgx-skel-line w-full h-4"></div></div>' +
          '<div class="tgx-skel-row"><div class="tgx-skel-line w-20 h-3"></div><div class="tgx-skel-line w-4/5 h-4"></div></div>' +
          '<div class="tgx-skel-row"><div class="tgx-skel-line w-28 h-3"></div><div class="tgx-skel-line w-11/12 h-4"></div></div>' +
          '</div>';

        fetch(cfg.restUrl + '/search?q=' + encodeURIComponent(term), {
          signal: controller.signal,
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            var items = (data && data.items) || [];
            if (!items.length) {
              resultsBox.innerHTML =
                '<p class="py-4 text-center font-reading text-sm text-ink-secondary">Nenhuma matéria encontrada para <strong>' +
                escapeHtml(term) +
                '</strong>.</p>';
              return;
            }

            var html = '<ul class="divide-y divide-border-subtle">';
            items.forEach(function (item) {
              html +=
                '<li class="py-2.5">' +
                '<a href="' +
                escapeHtml(item.url) +
                '" class="group flex items-start gap-3 rounded p-1.5 hover:bg-surface-alt">' +
                '<div class="min-w-0 flex-1">' +
                '<div class="mb-1 flex items-center gap-2 font-mono text-[11px]">' +
                '<span class="rounded px-1.5 py-0.5 font-bold uppercase" style="background:' +
                escapeHtml(item.fillColor) +
                ';color:' +
                escapeHtml(item.inkColor) +
                ';">' +
                escapeHtml(item.categoryName) +
                '</span>' +
                '<span class="text-ink-muted">' +
                escapeHtml(item.dateRelative) +
                '</span>' +
                '</div>' +
                '<p class="font-sans text-sm font-bold text-ink-primary group-hover:text-brand">' +
                escapeHtml(item.title) +
                '</p>' +
                '</div>' +
                '</a>' +
                '</li>';
            });
            html += '</ul>';
            resultsBox.innerHTML = html;
          })
          .catch(function (err) {
            if (err && err.name === 'AbortError') return;
            var fallbackUrl = (cfg.homeUrl || '/') + '?s=' + encodeURIComponent(term);
            resultsBox.innerHTML =
              '<div class="py-4 text-center space-y-2.5">' +
              '<p class="font-sans text-xs text-ink-muted">Não foi possível carregar os resultados instantâneos agora.</p>' +
              '<a href="' + escapeHtml(fallbackUrl) + '" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm bg-brand-fill px-4 py-2 font-sans text-xs font-bold text-white">Buscar "' + escapeHtml(term) + '" no portal</a>' +
              '</div>';
          });
      }, 220);
    });
  }

  /* 6. Salvar Matéria & Copiar Link */
  function getSavedSlugs() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_SAVED) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function syncSavedButtons() {
    var saved = getSavedSlugs();
    document.querySelectorAll('[data-tg-save-slug]').forEach(function (btn) {
      var slug = btn.getAttribute('data-tg-save-slug');
      var active = saved.indexOf(slug) !== -1;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('bg-highlight', active);
      btn.classList.toggle('text-ink-highlight', active);
      var lbl = btn.querySelector('[data-tg-save-label]');
      if (lbl) lbl.textContent = active ? 'Salvo' : 'Salvar';
    });
  }

  document.addEventListener('click', function (e) {
    var saveBtn = e.target.closest('[data-tg-save-slug]');
    if (saveBtn) {
      e.preventDefault();
      var slug = saveBtn.getAttribute('data-tg-save-slug');
      var list = getSavedSlugs();
      var idx = list.indexOf(slug);
      if (idx === -1) list.push(slug);
      else list.splice(idx, 1);
      try {
        window.localStorage.setItem(STORAGE_SAVED, JSON.stringify(list));
      } catch (_e) {}
      syncSavedButtons();
      return;
    }

    var copyBtn = e.target.closest('[data-tg-copy-url]');
    if (copyBtn) {
      e.preventDefault();
      var url = copyBtn.getAttribute('data-tg-copy-url') || window.location.href;
      var label = copyBtn.querySelector('[data-tg-copy-label]');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (label) {
            var prev = label.textContent;
            label.textContent = 'Link copiado!';
            setTimeout(function () {
              label.textContent = prev;
            }, 2000);
          }
        });
      }
      return;
    }

    var nativeShareBtn = e.target.closest('[data-tg-native-share]');
    if (nativeShareBtn) {
      e.preventDefault();
      var sTitle = nativeShareBtn.getAttribute('data-share-title') || document.title;
      var sUrl = nativeShareBtn.getAttribute('data-share-url') || window.location.href;
      var sLbl = nativeShareBtn.querySelector('[data-tg-share-label]');
      if (navigator.share) {
        navigator.share({ title: sTitle, url: sUrl }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sUrl).then(function () {
          if (sLbl) {
            var old = sLbl.textContent;
            sLbl.textContent = 'Copiado!';
            setTimeout(function () {
              sLbl.textContent = old;
            }, 1800);
          }
        });
      }
      return;
    }

    /* 7. Abas Mais Lidas (7 dias / 24h) */
    var mrTab = e.target.closest('[data-tg-mr-tab]');
    if (mrTab) {
      e.preventDefault();
      var targetWin = mrTab.getAttribute('data-tg-mr-tab');
      document.querySelectorAll('[data-tg-mr-tab]').forEach(function (btn) {
        var active = btn.getAttribute('data-tg-mr-tab') === targetWin;
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.classList.toggle('bg-brand-fill', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('text-ink-secondary', !active);
      });
      document.querySelectorAll('[data-tg-mr-panel]').forEach(function (panel) {
        panel.classList.toggle('hidden', panel.getAttribute('data-tg-mr-panel') !== targetWin);
      });
      return;
    }

    /* 8. YouTube Facade sob demanda no corpo do artigo (zero iframes/fontes externas no load inicial) */
    var ytFacade = e.target.closest('.tg-yt-facade');
    if (ytFacade) {
      e.preventDefault();
      var ytId = ytFacade.getAttribute('data-yt-id') || '';
      var ytTitle = ytFacade.getAttribute('data-yt-title') || 'Vídeo do YouTube';
      if (/^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0';
        iframe.title = ytTitle;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        ytFacade.innerHTML = '';
        ytFacade.classList.add('tg-yt-loaded');
        ytFacade.appendChild(iframe);
      }
      return;
    }

    /* 9. Facade Pattern do card Reels em Destaque na Home (carregamento sob demanda) */
    var facadePlay = e.target.closest('[data-tg-reel-facade-play]');
    if (facadePlay) {
      e.preventDefault();
      var box = facadePlay.closest('.tg-reel-facade');
      if (!box || !cfg.restUrl) return;
      var rSlug = box.getAttribute('data-tg-reel-slug') || '';
      var fullUrl = box.getAttribute('data-tg-reel-full-url') || cfg.reelsUrl || '/reels/';
      facadePlay.disabled = true;

      fetch(cfg.restUrl + '/reels?per_page=1&post=' + encodeURIComponent(rSlug))
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var item = data && data.items && data.items[0];
          if (!item) {
            window.location.href = fullUrl;
            return;
          }
          function esc(v) {
            return String(v || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
          }
          var bullets = (item.bullets || [])
            .slice(0, 3)
            .map(function (b) {
              return '<li class="rounded border border-white/15 bg-black/60 px-3 py-2 font-reading text-xs leading-snug text-white">' + esc(b) + '</li>';
            })
            .join('');
          var overlay = box.querySelector('.tg-reel-facade-overlay');
          if (overlay) {
            overlay.innerHTML =
              '<div class="flex h-full flex-col justify-between">' +
              '<div class="flex items-center justify-between">' +
              '<span class="rounded bg-highlight px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink-highlight">Resumo em 10s</span>' +
              '<a href="' +
              esc(fullUrl) +
              '" class="font-mono text-[11px] font-bold uppercase text-highlight underline">Tela cheia</a>' +
              '</div>' +
              '<ul class="my-auto space-y-2 py-3">' +
              bullets +
              '</ul>' +
              '<a href="' +
              esc(item.url) +
              '" class="inline-flex w-full items-center justify-center rounded border-2 border-[#0B0F19] bg-highlight px-3 py-2 font-mono text-xs font-bold uppercase text-ink-highlight">Ler matéria completa</a>' +
              '</div>';
          }
        })
        .catch(function () {
          window.location.href = fullUrl;
        });
    }
  });

  /* 10. Carrossel Editorial de Destaques (Hero) — Vanilla JS puro, 6s autoplay inteligente e swipe mobile */
  function initHeroCarousel() {
    var carousels = document.querySelectorAll('[data-tg-hero-carousel]');
    if (!carousels.length) return;

    var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    carousels.forEach(function (root) {
      var slides = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-slide]'));
      if (slides.length < 2) return;

      var bars = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-bar]'));
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-tab]'));
      var counter = root.querySelector('[data-tg-hero-counter]');
      var prevBtn = root.querySelector('[data-tg-hero-prev]');
      var nextBtn = root.querySelector('[data-tg-hero-next]');

      var duration = parseInt(root.getAttribute('data-interval') || '6000', 10);
      if (isNaN(duration) || duration < 2000) duration = 6000;
      root.style.setProperty('--tg-hero-duration', duration + 'ms');

      var current = 0;
      var timerId = null;
      var startedAt = 0;
      var remaining = duration;
      var hoverPaused = false;
      var focusPaused = false;

      function isReducedMotion() {
        return !!(reducedMotionQuery && reducedMotionQuery.matches);
      }

      function isPaused() {
        return hoverPaused || focusPaused || document.hidden || isReducedMotion();
      }

      function setSlideInteractivity(slide, active) {
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active) {
          slide.removeAttribute('inert');
        } else {
          slide.setAttribute('inert', '');
        }
        slide.querySelectorAll('a, button').forEach(function (el) {
          el.setAttribute('tabindex', active ? '0' : '-1');
        });
      }

      function restartAnimation(el) {
        if (!el) return;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      }

      function clearTimer() {
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
      }

      function scheduleNext() {
        clearTimer();
        var paused = isPaused();
        root.classList.toggle('is-paused', paused);
        if (paused) return;
        startedAt = Date.now();
        timerId = setTimeout(function () {
          goTo(current + 1);
        }, Math.max(120, remaining));
      }

      function pauseAutoplay() {
        if (timerId !== null) {
          var elapsed = Date.now() - startedAt;
          remaining = Math.max(120, remaining - elapsed);
          clearTimer();
        }
        root.classList.add('is-paused');
      }

      function syncPauseState() {
        if (isPaused()) {
          pauseAutoplay();
        } else {
          scheduleNext();
        }
      }

      function goTo(index) {
        var next = ((index % slides.length) + slides.length) % slides.length;
        current = next;
        remaining = duration;

        slides.forEach(function (slide, idx) {
          var active = idx === next;
          slide.classList.toggle('is-active', active);
          setSlideInteractivity(slide, active);
          if (active) {
            restartAnimation(slide.querySelector('.tg-cover-img'));
          }
        });

        bars.forEach(function (bar, idx) {
          var active = idx === next;
          bar.classList.toggle('is-active', active);
          bar.classList.toggle('is-done', idx < next);
          bar.setAttribute('aria-selected', active ? 'true' : 'false');
          bar.setAttribute('aria-current', active ? 'true' : 'false');
          if (active) {
            restartAnimation(bar.querySelector('.tg-hero-bar-fill'));
          }
        });

        tabs.forEach(function (tab, idx) {
          var active = idx === next;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('aria-current', active ? 'true' : 'false');
        });

        if (counter) {
          var currStr = (next + 1 < 10 ? '0' : '') + (next + 1);
          var totStr = (slides.length < 10 ? '0' : '') + slides.length;
          counter.textContent = currStr + ' / ' + totStr;
        }

        scheduleNext();
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          goTo(current - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          goTo(current + 1);
        });
      }

      root.querySelectorAll('[data-tg-hero-go]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var targetIdx = parseInt(btn.getAttribute('data-tg-hero-go') || '0', 10);
          if (!isNaN(targetIdx)) {
            goTo(targetIdx);
          }
        });
      });

      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          goTo(current + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goTo(current - 1);
        }
      });

      root.addEventListener('mouseenter', function () {
        hoverPaused = true;
        syncPauseState();
      });
      root.addEventListener('mouseleave', function () {
        hoverPaused = false;
        syncPauseState();
      });

      root.addEventListener('focusin', function () {
        focusPaused = true;
        syncPauseState();
      });
      root.addEventListener('focusout', function (e) {
        if (!e.relatedTarget || !root.contains(e.relatedTarget)) {
          focusPaused = false;
          syncPauseState();
        }
      });

      document.addEventListener('visibilitychange', syncPauseState);

      /* Swipe horizontal mobile (limiar 45px, sem travar scroll vertical) */
      var startX = 0;
      var startY = 0;
      var trackingTouch = false;
      root.addEventListener(
        'touchstart',
        function (e) {
          if (!e.touches || e.touches.length !== 1) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          trackingTouch = true;
        },
        { passive: true }
      );
      root.addEventListener(
        'touchend',
        function (e) {
          if (!trackingTouch || !e.changedTouches || !e.changedTouches.length) return;
          trackingTouch = false;
          var dx = e.changedTouches[0].clientX - startX;
          var dy = e.changedTouches[0].clientY - startY;
          if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            goTo(dx < 0 ? current + 1 : current - 1);
          }
        },
        { passive: true }
      );

      /* Inicialização no Slide 0 sem re-ocultar LCP */
      slides.forEach(function (slide, idx) {
        setSlideInteractivity(slide, idx === 0);
      });
      scheduleNext();
    });
  }

  /* Boot */
  syncThemeButtons();
  initReadingProgress();
  initMobileDrawer();
  initInstantSearch();
  initHeroCarousel();
  syncSavedButtons();
  scanBrokenCoverImages();
  window.addEventListener('load', scanBrokenCoverImages);
})();
