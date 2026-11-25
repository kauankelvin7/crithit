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

  /* 1. Fallback automático para qualquer capa cuja imagem remota falhe */
  document.addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG' && target.classList.contains('tg-cover-img')) {
        target.style.display = 'none';
        var wrap = target.closest('.tg-cover-wrap');
        if (wrap) {
          var fb = wrap.querySelector('.tg-cover-fallback');
          if (fb) {
            fb.classList.remove('hidden');
            fb.style.display = 'block';
          }
        }
      }
    },
    true
  );

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
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 bg-chrome-surface text-xs text-chrome-ink';
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
          '<p class="py-4 text-center font-mono text-xs text-ink-muted">Buscando no acervo...</p>';

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
            resultsBox.innerHTML =
              '<p class="py-3 text-center font-mono text-xs text-ink-muted">Pressione Enter para ver a busca completa.</p>';
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
    }
  });

  /* Boot */
  syncThemeButtons();
  initReadingProgress();
  initMobileDrawer();
  initInstantSearch();
  syncSavedButtons();
})();
