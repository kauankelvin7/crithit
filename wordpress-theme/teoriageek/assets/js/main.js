/**
 * Teoria Geek — Interações Globais Vanilla JS (v2.12.1, zero dependências externas).
 * 1. Fallback automático para capas (.tg-cover-img) com falha de carregamento
 * 2. Tema Claro / Escuro persistente sem FOUC + sync de theme-color e Disqus + Spoiler Gate
 * 3. Barra de progresso de leitura suave (requestAnimationFrame) em single.php
 * 4. Menu Mobile acessível com acordeão para submenus + Escape
 * 5. Modal de Busca Instantânea (REST GET /teoriageek/v1/search)
 * 6. Copiar link e compartilhamento nativo (navigator.share)
 * 7. Abas Mais Lidas (7 dias / 24 horas)
 * 8. YouTube Facade sob clique (youtube-nocookie.com)
 * 9. Facade Pattern do card Reels em Destaque na Home
 * 10. Carrossel Hero com Virada de Página HQ 3D (WebGL + fallback) e autoplay 4,2s
 * 11. Faixa paginada Giro Geek (3 grupos de 4 cards)
 * 12–13. Focus Trap WCAG 2.1 AA para modais/drawers e busca desktop
 * 14. Botão Pausar/Retomar no Plantão Geek (WCAG 2.2.2)
 * 15. Central de Alertas (sino + GET /teoriageek/v1/alerts + OneSignal/WebPushr)
 * 16. Lightbox nativo para imagens em .entry-content
 * 17. Contagem real de visualizações (POST /posts/{id}/view sem X-WP-Nonce)
 * 18. Reação rápida de 1 clique no fim do artigo (POST /posts/{id}/like sem X-WP-Nonce)
 * 19. Nota da Comunidade nas críticas (POST /posts/{id}/community-score sem X-WP-Nonce)
 * 20. Analytics Editorial First-Party (POST /telemetry: cliques por zona/link, origens, dispositivos, scroll depth e tempo ativo)
 */
(function () {
  'use strict';

  var STORAGE_THEME = 'teoriageek-theme';
  var cfg = window.teoriageekConfig || {};

  function buildRestUrl(subpath, query) {
    var base = String(cfg.restUrl || '').replace(/\/+$/, '') + (subpath || '');
    if (!query) return base;
    return base + (base.indexOf('?') === -1 ? '?' : '&') + query;
  }

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
    var themeMeta = document.getElementById('tg-theme-color-meta') || document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', next === 'dark' ? '#102042' : '#FFFFFF');
    syncThemeButtons();
    // Recarrega o esquema de cores do Disqus (pipDisqus) caso já esteja montado na página
    if (window.DISQUS && typeof window.DISQUS.reset === 'function' && document.getElementById('disqus_thread')) {
      try {
        window.DISQUS.reset({ reload: true });
      } catch (_e) {}
    }
  }

  document.addEventListener('click', function (e) {

    var spoilerBtn = e.target.closest('[data-tg-spoiler-unlock]');
    if (spoilerBtn) {
      e.preventDefault();
      var gate = spoilerBtn.closest('[data-tg-spoiler-gate]');
      if (gate) {
        gate.classList.remove('is-locked');
        gate.classList.add('is-unlocked');
      }
      return;
    }
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

        fetch(buildRestUrl('/search', 'q=' + encodeURIComponent(term)), {
          signal: controller.signal,
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            var items = (data && data.items) || [];
            document.dispatchEvent(new CustomEvent('tg:search-results', { detail: { term: term, count: items.length } }));
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

  /* 6. Copiar Link & Compartilhamento */
  document.addEventListener('click', function (e) {
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

      fetch(buildRestUrl('/reels', 'per_page=1&post=' + encodeURIComponent(rSlug)))
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

  /* 10. Carrossel Editorial de Destaques (Hero) — Halftone HQ WebGL v2 + autoplay travado no trilho 2px + swipe + fallback */
  function createHalftoneHQRenderer(canvas, slides) {
    if (!canvas) return null;
    var gl = null;
    try {
      gl =
        canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) ||
        canvas.getContext('experimental-webgl');
    } catch (e) {
      return null;
    }
    if (!gl) return null;

    var vertSrc = [
      'attribute vec2 aPos;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = aPos * 0.5 + 0.5;',
      '  gl_Position = vec4(aPos, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragSrc = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D uTex0;",
      "uniform sampler2D uTex1;",
      "uniform float uProgress, uDir, uZ0;",
      "uniform vec2 uRes, uImgRes0, uImgRes1;",
      "const float PI = 3.14159265359;",
      "",
      "vec2 coverUV(vec2 uv, vec2 imgRes) {",
      "  float cA = uRes.x / max(uRes.y, 1.0);",
      "  float iA = imgRes.x / max(imgRes.y, 1.0);",
      "  vec2 sc = vec2(1.0);",
      "  if (cA > iA) sc.y = iA / cA;",
      "  else sc.x = cA / iA;",
      "  return clamp((uv - 0.5) * sc + 0.5, 0.001, 0.999);",
      "}",
      "",
      "vec3 sampleFront0(vec2 p) {",
      "  vec2 uv = coverUV(p, uImgRes0);",
      "  return texture2D(uTex0, clamp((uv - 0.5) / max(uZ0, 0.5) + 0.5, 0.001, 0.999)).rgb;",
      "}",
      "",
      "vec3 sampleBackComic(vec2 p) {",
      "  vec3 bleed = sampleFront0(p);",
      "  vec3 paper = vec3(0.95, 0.93, 0.87);",
      "  // Grade sutil de quadrinhos no verso da folha (3 pain\u00e9is assim\u00e9tricos + calhas limpas)",
      "  float m = 0.055;",
      "  float g = 0.018;",
      "  bool inTop = (p.x > m && p.x < 1.0 - m && p.y > 0.52 + g && p.y < 1.0 - m);",
      "  bool inBotL = (p.x > m && p.x < 0.44 - g && p.y > m && p.y < 0.52 - g);",
      "  bool inBotR = (p.x > 0.44 + g && p.x < 1.0 - m && p.y > m && p.y < 0.52 - g);",
      "  bool inPanel = inTop || inBotL || inBotR;",
      "  // Borda fina de nanquim nos quadrinhos",
      "  float borderW = 0.009;",
      "  bool bTop = (p.x > m - borderW && p.x < 1.0 - m + borderW && p.y > 0.52 + g - borderW && p.y < 1.0 - m + borderW) && !inTop;",
      "  bool bBotL = (p.x > m - borderW && p.x < 0.44 - g + borderW && p.y > m - borderW && p.y < 0.52 - g + borderW) && !inBotL;",
      "  bool bBotR = (p.x > 0.44 + g - borderW && p.x < 1.0 - m + borderW && p.y > m - borderW && p.y < 0.52 - g + borderW) && !inBotR;",
      "  vec3 col = mix(paper, bleed, 0.16);",
      "  if (inPanel) {",
      "    // Ret\u00edcula Ben-Day ultra-sutil dentro dos quadrinhos",
      "    float asp = uRes.x / max(uRes.y, 1.0);",
      "    mat2 R45 = mat2(0.70711, -0.70711, 0.70711, 0.70711);",
      "    vec2 hd = fract(R45 * vec2(p.x * asp, p.y) * 34.0) - 0.5;",
      "    float dotMask = smoothstep(0.24, 0.14, length(hd));",
      "    vec3 panelTint = inBotL ? vec3(0.98, 0.80, 0.08) : vec3(0.0, 0.45, 0.90);",
      "    col = mix(mix(paper * 0.96, bleed, 0.28), panelTint, dotMask * 0.14);",
      "  } else if (bTop || bBotL || bBotR) {",
      "    col = vec3(0.08, 0.14, 0.28);",
      "  }",
      "  return col;",
      "}",
      "",
      "bool inBounds(vec2 p) {",
      "  return p.x >= 0.0 && p.x <= 1.0 && p.y >= 0.0 && p.y <= 1.0;",
      "}",
      "",
      "void main() {",
      "  float p = clamp(uProgress, 0.0, 1.0);",
      "  if (p <= 0.001) { gl_FragColor = vec4(sampleFront0(vUv), 1.0); return; }",
      "  if (p >= 0.999) { gl_FragColor = vec4(texture2D(uTex1, coverUV(vUv, uImgRes1)).rgb, 1.0); return; }",
      "",
      "  // Espelha horizontalmente quando volta (uDir < 0) para folhear dos dois lados",
      "  vec2 pt = (uDir >= 0.0) ? vUv : vec2(1.0 - vUv.x, vUv.y);",
      "  vec2 axis = normalize(vec2(-0.91, 0.415));",
      "  float R = 0.125;",
      "  // Varre do canto inferior direito (-0.91) at\u00e9 al\u00e9m do topo esquerdo (+0.415 + R*PI)",
      "  float c = mix(-0.91 - R * 0.05, 0.42 + R * PI + 0.06, p);",
      "  float d = dot(pt, axis) - c;",
      "",
      "  vec3 incoming = texture2D(uTex1, coverUV(vUv, uImgRes1)).rgb;",
      "",
      "  if (d >= 0.0) {",
      "    // Regi\u00e3o plana \u00e0 esquerda da dobra: pode ter a aba virada (verso da HQ) por cima da folha atual",
      "    vec2 origBack = pt - axis * (2.0 * d + PI * R);",
      "    vec2 origBackUv = (uDir >= 0.0) ? origBack : vec2(1.0 - origBack.x, origBack.y);",
      "    if (inBounds(origBack)) {",
      "      vec3 backCol = sampleBackComic(origBackUv);",
      "      // Sombra sutil junto \u00e0 dobra do cilindro",
      "      float creaseShade = 0.88 + 0.12 * smoothstep(0.0, 0.12, d);",
      "      gl_FragColor = vec4(backCol * creaseShade, 1.0);",
      "      return;",
      "    }",
      "    // Ainda \u00e9 a frente plana da p\u00e1gina saindo + sombra suave projetada pela aba virada",
      "    vec3 frontCol = sampleFront0(vUv);",
      "    float sh = smoothstep(0.0, 0.09, d);",
      "    frontCol *= mix(0.76, 1.0, sh);",
      "    gl_FragColor = vec4(frontCol, 1.0);",
      "    return;",
      "  }",
      "",
      "  if (d >= -R) {",
      "    // Regi\u00e3o do cilindro 3D da folha virando",
      "    float theta = asin(clamp(-d / R, 0.0, 1.0));",
      "    // 1) Metade superior do cilindro (verso da p\u00e1gina de HQ, mais perto da c\u00e2mera)",
      "    float arcTop = R * (PI - theta);",
      "    vec2 origTop = pt - axis * (d + arcTop);",
      "    vec2 origTopUv = (uDir >= 0.0) ? origTop : vec2(1.0 - origTop.x, origTop.y);",
      "    if (inBounds(origTop)) {",
      "      vec3 backCol = sampleBackComic(origTopUv);",
      "      float lit = 0.72 + 0.28 * cos(theta);",
      "      float spec = pow(max(0.0, sin(theta)), 6.0) * 0.16;",
      "      gl_FragColor = vec4(backCol * lit + vec3(spec), 1.0);",
      "      return;",
      "    }",
      "    // 2) Metade inferior do cilindro (frente da p\u00e1gina saindo)",
      "    float arcBot = R * theta;",
      "    vec2 origBot = pt - axis * (d + arcBot);",
      "    vec2 origBotUv = (uDir >= 0.0) ? origBot : vec2(1.0 - origBot.x, origBot.y);",
      "    if (inBounds(origBot)) {",
      "      vec3 frontCol = sampleFront0(origBotUv);",
      "      float lit = 0.78 + 0.22 * cos(theta);",
      "      gl_FragColor = vec4(frontCol * lit, 1.0);",
      "      return;",
      "    }",
      "    // 3) J\u00e1 revelou a p\u00e1gina de baixo sob a curva, com sombra realista",
      "    float underSh = smoothstep(-R, 0.0, d);",
      "    gl_FragColor = vec4(incoming * mix(0.62, 0.84, underSh), 1.0);",
      "    return;",
      "  }",
      "",
      "  // Regi\u00e3o j\u00e1 folheada (p\u00e1gina nova revelada + sombra projetada pela dobra)",
      "  float dropDist = -(d + R);",
      "  float dropSh = smoothstep(0.0, 0.14, dropDist);",
      "  gl_FragColor = vec4(incoming * mix(0.60, 1.0, dropSh), 1.0);",
      "}"
    ].join('\n');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, vertSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uTex0 = gl.getUniformLocation(prog, 'uTex0');
    var uTex1 = gl.getUniformLocation(prog, 'uTex1');
    var uProgress = gl.getUniformLocation(prog, 'uProgress');
    var uDir = gl.getUniformLocation(prog, 'uDir');
    var uZ0 = gl.getUniformLocation(prog, 'uZ0');
    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uImgRes0 = gl.getUniformLocation(prog, 'uImgRes0');
    var uImgRes1 = gl.getUniformLocation(prog, 'uImgRes1');

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var glReady = true;
    var texCache = new Array(slides.length);
    var imgCache = new Array(slides.length);
    var failedCache = new Array(slides.length);
    var rafId = null;

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      glReady = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      canvas.classList.remove('is-active');
    });

    function resolveSrc(idx) {
      var slide = slides[idx];
      if (!slide) return '';
      var imgEl = slide.querySelector('img.tg-cover-img');
      if (imgEl && imgEl.currentSrc) return imgEl.currentSrc;
      var attr = slide.getAttribute('data-tg-hero-img') || '';
      if (attr) return attr;
      return imgEl ? imgEl.getAttribute('src') || '' : '';
    }

    function preloadSlide(idx) {
      if (imgCache[idx] || failedCache[idx]) return;
      var slide = slides[idx];
      var domImg = slide ? slide.querySelector('img.tg-cover-img') : null;
      if (domImg && domImg.complete && domImg.naturalWidth > 0) {
        imgCache[idx] = domImg;
        return;
      }
      var src = resolveSrc(idx);
      if (!src) {
        failedCache[idx] = true;
        return;
      }
      var loader = new Image();
      loader.decoding = 'async';
      try {
        if (new URL(src, window.location.href).origin !== window.location.origin) {
          loader.crossOrigin = 'anonymous';
        }
      } catch (_e) {}
      loader.onload = function () {
        if (loader.naturalWidth > 0) {
          imgCache[idx] = loader;
        } else {
          failedCache[idx] = true;
        }
      };
      loader.onerror = function () {
        failedCache[idx] = true;
      };
      loader.src = src;
    }

    function getTexture(idx) {
      if (!glReady || failedCache[idx]) return null;
      if (texCache[idx]) return texCache[idx];
      var img = imgCache[idx];
      if (!img) {
        var domImg = slides[idx] ? slides[idx].querySelector('img.tg-cover-img') : null;
        if (domImg && domImg.complete && domImg.naturalWidth > 0) {
          img = domImg;
          imgCache[idx] = domImg;
        }
      }
      if (!img || !img.naturalWidth || !img.naturalHeight) return null;

      try {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        texCache[idx] = { tex: tex, w: img.naturalWidth, h: img.naturalHeight };
        return texCache[idx];
      } catch (err) {
        failedCache[idx] = true;
        return null;
      }
    }

    function readOutgoingScale(idx) {
      var slide = slides[idx];
      var domImg = slide ? slide.querySelector('img.tg-cover-img') : null;
      if (!domImg || typeof window.DOMMatrix !== 'function') return 1.0;
      try {
        var tr = window.getComputedStyle(domImg).transform;
        if (!tr || tr === 'none') return 1.0;
        var sc = new window.DOMMatrix(tr).a;
        return sc && sc > 0.5 && sc < 2.0 ? sc : 1.0;
      } catch (e) {
        return 1.0;
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      return { w: w, h: h, cssW: rect.width };
    }

    /* Pré-aquecimento suave em segundo plano sem competir com o LCP inicial */
    var warmUp = function () {
      for (var i = 0; i < slides.length; i++) {
        preloadSlide(i);
      }
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(warmUp, { timeout: 1500 });
    } else {
      setTimeout(warmUp, 650);
    }

    return {
      cancel: function () {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        canvas.classList.remove('is-active');
      },
      transition: function (fromIdx, toIdx, dir, onStart, onDone) {
        if (!glReady) return false;
        this.cancel();
        var t0 = getTexture(fromIdx);
        var t1 = getTexture(toIdx);
        if (!t0 || !t1) {
          preloadSlide(fromIdx);
          preloadSlide(toIdx);
          return false;
        }

        var dims = resize();
        var z0 = readOutgoingScale(fromIdx);

        gl.useProgram(prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, t0.tex);
        gl.uniform1i(uTex0, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, t1.tex);
        gl.uniform1i(uTex1, 1);

        gl.uniform1f(uDir, dir >= 0 ? 1.0 : -1.0);
        gl.uniform1f(uZ0, z0);
        gl.uniform2f(uRes, dims.w, dims.h);
        gl.uniform2f(uImgRes0, t0.w, t0.h);
        gl.uniform2f(uImgRes1, t1.w, t1.h);
        gl.uniform1f(uProgress, 0.0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        canvas.classList.add('is-active');
        if (typeof onStart === 'function') onStart();

        var start = performance.now();
        var dur = 420;

        function tick(now) {
          var raw = Math.min(1, (now - start) / dur);
          var eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
          var d = resize();
          gl.uniform2f(uRes, d.w, d.h);
          gl.uniform1f(uProgress, eased);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          if (raw < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            rafId = null;
            requestAnimationFrame(function () {
              canvas.classList.remove('is-active');
              if (typeof onDone === 'function') onDone();
            });
          }
        }
        rafId = requestAnimationFrame(tick);
        return true;
      }
    };
  }

  function initHeroCarousel() {
    var carousels = document.querySelectorAll('[data-tg-hero-carousel]');
    if (!carousels.length) return;

    var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    carousels.forEach(function (root) {
      var slides = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-slide]'));
      if (slides.length < 2) return;

      var rail = root.querySelector('[data-tg-hero-rail]');
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-tab]'));
      var segs = Array.prototype.slice.call(root.querySelectorAll('[data-tg-hero-seg]'));
      var currentCounter = root.querySelector('[data-tg-hero-current]');
      var pauseBtn = root.querySelector('[data-tg-hero-pause]');
      var prevBtn = root.querySelector('[data-tg-hero-prev]');
      var nextBtn = root.querySelector('[data-tg-hero-next]');
      var glCanvas = root.querySelector('[data-tg-hero-gl]');
      var glRenderer = createHalftoneHQRenderer(glCanvas, slides);

      var duration = parseInt(root.getAttribute('data-interval') || '4200', 10);
      if (isNaN(duration) || duration < 2000) duration = 4200;
      root.style.setProperty('--tg-hero-duration', duration + 'ms');

      var current = 0;
      var userPaused = false;
      var textSwapTimer = null;

      function isReducedMotion() {
        return !!(reducedMotionQuery && reducedMotionQuery.matches);
      }

      function syncPause() {
        var hover = false;
        try {
          hover = root.matches(':hover');
        } catch (_e) {}
        var focused = !!(document.activeElement && root.contains(document.activeElement));
        var paused = userPaused || document.hidden || hover || focused || isReducedMotion();
        root.classList.toggle('is-paused', paused);
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

      function syncRailAndCounter(next) {
        tabs.forEach(function (tab, idx) {
          var active = idx === next;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('aria-current', active ? 'true' : 'false');
          tab.tabIndex = active ? 0 : -1;
          if (active) {
            restartAnimation(tab.querySelector('.tg-hero-tab-prog-fill'));
          }
        });

        segs.forEach(function (seg, idx) {
          var active = idx === next;
          seg.classList.toggle('is-active', active);
          seg.classList.toggle('is-done', idx < next);
          if (active) {
            restartAnimation(seg.querySelector('.tg-hero-seg-fill'));
          }
        });
        if (currentCounter) {
          currentCounter.textContent = (next + 1 < 10 ? '0' : '') + (next + 1);
        }
      }

      function applySlideDOM(next) {
        slides.forEach(function (slide, idx) {
          var active = idx === next;
          slide.classList.toggle('is-active', active);
          setSlideInteractivity(slide, active);
          if (active) {
            restartAnimation(slide.querySelector('.tg-cover-img'));
          }
        });
      }

      function goTo(index, dir) {
        var next = ((index % slides.length) + slides.length) % slides.length;
        if (next === current) return;
        var prevIdx = current;
        var direction = typeof dir === 'number' && dir !== 0 ? dir : next > prevIdx ? 1 : -1;
        current = next;

        if (textSwapTimer !== null) {
          clearTimeout(textSwapTimer);
          textSwapTimer = null;
        }

        syncRailAndCounter(next);

        var usedGL = false;
        if (glRenderer && !isReducedMotion()) {
          usedGL = glRenderer.transition(
            prevIdx,
            next,
            direction,
            function () {
              root.classList.add('is-gl-transitioning');
              textSwapTimer = setTimeout(function () {
                textSwapTimer = null;
                applySlideDOM(next);
              }, 170);
            },
            function () {
              if (textSwapTimer !== null) {
                clearTimeout(textSwapTimer);
                textSwapTimer = null;
                applySlideDOM(next);
              }
              root.classList.remove('is-gl-transitioning');
            }
          );
        }

        if (!usedGL) {
          root.classList.remove('is-gl-transitioning');
          applySlideDOM(next);
        }

        syncPause();
      }

      if (pauseBtn) {
        pauseBtn.addEventListener('click', function () {
          userPaused = !userPaused;
          pauseBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
          pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar troca automática' : 'Pausar troca automática');
          var pIco = pauseBtn.querySelector('[data-tg-pause-icon="pause"]');
          var plIco = pauseBtn.querySelector('[data-tg-pause-icon="play"]');
          if (pIco && plIco) {
            pIco.classList.toggle('hidden', userPaused);
            plIco.classList.toggle('hidden', !userPaused);
          }
          syncPause();
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          goTo(current - 1, -1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          goTo(current + 1, 1);
        });
      }

      segs.forEach(function (seg) {
        seg.addEventListener('click', function () {
          var targetIdx = parseInt(seg.getAttribute('data-tg-hero-go') || '0', 10);
          if (!isNaN(targetIdx)) goTo(targetIdx, targetIdx < current ? -1 : 1);
        });
      });
      if (rail) {
        /* Autoplay travado na conclusão exata da barra CSS 2px */
        rail.addEventListener('animationend', function (e) {
          if (e.animationName === 'tg-hero-bar-fill') {
            goTo(current + 1, 1);
          }
        });

        rail.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-tg-hero-go]');
          if (!btn) return;
          var targetIdx = parseInt(btn.getAttribute('data-tg-hero-go') || '0', 10);
          if (!isNaN(targetIdx)) {
            goTo(targetIdx, targetIdx < current ? -1 : 1);
          }
        });

        rail.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          goTo(current + d, d);
          if (tabs[current]) tabs[current].focus();
        });
      }

      root.addEventListener('mouseenter', syncPause);
      root.addEventListener('mouseleave', syncPause);
      root.addEventListener('focusin', syncPause);
      root.addEventListener('focusout', function () {
        setTimeout(syncPause, 0);
      });
      document.addEventListener('visibilitychange', syncPause);

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
            goTo(dx < 0 ? current + 1 : current - 1, dx < 0 ? 1 : -1);
          }
        },
        { passive: true }
      );

      /* Inicialização no Slide 0 sem re-ocultar LCP */
      slides.forEach(function (slide, idx) {
        setSlideInteractivity(slide, idx === 0);
      });
      syncPause();
    });
  }

  /* 11. Faixa Paginada Giro Geek (Segunda Divisão — Estilo Metrópoles) */
  function initGiroStripCarousel() {
    var strips = document.querySelectorAll('[data-tg-strip-carousel]');
    if (!strips.length) return;

    var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    strips.forEach(function (root) {
      var pages = Array.prototype.slice.call(root.querySelectorAll('[data-tg-strip-page]'));
      if (pages.length < 2) return;

      var dotsWrap = root.querySelector('[data-tg-strip-dots]');
      var dots = Array.prototype.slice.call(root.querySelectorAll('[data-tg-strip-dot]'));
      var prevBtn = root.querySelector('[data-tg-strip-prev]');
      var nextBtn = root.querySelector('[data-tg-strip-next]');
      var stage = root.querySelector('[data-tg-strip-stage]');
      var page = 0;

      function isRM() {
        return !!(reducedMotionQuery && reducedMotionQuery.matches);
      }

      function showPage(target, dir) {
        var next = ((target % pages.length) + pages.length) % pages.length;
        if (next === page) return;
        var direction = typeof dir === 'number' && dir !== 0 ? dir : next > page ? 1 : -1;
        page = next;

        pages.forEach(function (el, idx) {
          var active = idx === page;
          el.classList.toggle('hidden', !active);
          el.setAttribute('aria-hidden', active ? 'false' : 'true');
          if (active && !isRM() && typeof el.animate === 'function') {
            el.animate(
              [
                { opacity: 0, transform: 'translateX(' + direction * 28 + 'px)' },
                { opacity: 1, transform: 'none' }
              ],
              { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
            );
          }
        });

        dots.forEach(function (dot, idx) {
          var active = idx === page;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-selected', active ? 'true' : 'false');
          dot.tabIndex = active ? 0 : -1;
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          showPage(page - 1, -1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          showPage(page + 1, 1);
        });
      }
      if (dotsWrap) {
        dotsWrap.addEventListener('click', function (e) {
          var dot = e.target.closest('[data-tg-strip-dot]');
          if (!dot) return;
          var idx = parseInt(dot.getAttribute('data-tg-strip-dot') || '0', 10);
          if (!isNaN(idx)) showPage(idx, idx < page ? -1 : 1);
        });
        dotsWrap.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          showPage(page + d, d);
          if (dots[page]) dots[page].focus();
        });
      }

      if (stage) {
        var sx = 0;
        var sy = 0;
        var tracking = false;
        stage.addEventListener(
          'touchstart',
          function (e) {
            if (!e.touches || e.touches.length !== 1) return;
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
            tracking = true;
          },
          { passive: true }
        );
        stage.addEventListener(
          'touchend',
          function (e) {
            if (!tracking || !e.changedTouches || !e.changedTouches.length) return;
            tracking = false;
            var dx = e.changedTouches[0].clientX - sx;
            var dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
              showPage(dx < 0 ? page + 1 : page - 1, dx < 0 ? 1 : -1);
            }
          },
          { passive: true }
        );
      }
    });
  }


  /* 12. Utilitário de Focus Trap + Retorno de Foco (WCAG 2.1 AA para modais e drawers) */
  function attachFocusTrap(container, onClose) {
    if (!container) return { activate: function () {}, deactivate: function () {} };
    var prevFocus = null;
    var focusableSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (typeof onClose === 'function') onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      var nodes = Array.prototype.slice.call(container.querySelectorAll(focusableSel)).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    return {
      activate: function () {
        prevFocus = document.activeElement;
        document.addEventListener('keydown', onKeydown);
      },
      deactivate: function () {
        document.removeEventListener('keydown', onKeydown);
        if (prevFocus && typeof prevFocus.focus === 'function') {
          try { prevFocus.focus(); } catch (_e) {}
        }
        prevFocus = null;
      }
    };
  }

  /* 13. Busca Instantânea também ao clicar no campo do Desktop + Focus Trap em Modais existentes */
  function initDesktopSearchAndModalA11y() {
    var modal = document.getElementById('tg-search-modal');
    var input = document.getElementById('tg-instant-search-input');
    var desktopInput = document.querySelector('[data-tg-desktop-search]');
    if (desktopInput && modal && input) {
      desktopInput.addEventListener('focus', function () {
        if (modal.classList.contains('hidden')) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          if (desktopInput.value && !input.value) {
            input.value = desktopInput.value;
            input.dispatchEvent(new Event('input'));
          }
          setTimeout(function () { input.focus(); }, 20);
        }
      });
    }

    /* Focus trap leve nos modais existentes (search + mobile drawer) */
    [
      { el: modal, closeSel: '[data-tg-search-close]' },
      { el: document.getElementById('tg-mobile-drawer'), closeSel: '[data-tg-drawer-close]' }
    ].forEach(function (cfgModal) {
      if (!cfgModal.el || typeof MutationObserver !== 'function') return;
      var trap = attachFocusTrap(cfgModal.el, function () {
        var btn = cfgModal.el.querySelector(cfgModal.closeSel);
        if (btn) btn.click();
      });
      var wasOpen = !cfgModal.el.classList.contains('hidden');
      new MutationObserver(function () {
        var isOpen = !cfgModal.el.classList.contains('hidden');
        if (isOpen && !wasOpen) trap.activate();
        else if (!isOpen && wasOpen) trap.deactivate();
        wasOpen = isOpen;
      }).observe(cfgModal.el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* 14. Botão Pausar/Retomar no Plantão Geek (WCAG 2.2.2) */
  function initTickerPause() {
    document.querySelectorAll('[data-tg-ticker-pause]').forEach(function (btn) {
      var marquee = btn.closest('.ticker-marquee');
      if (!marquee) return;
      btn.addEventListener('click', function (ev) {
        var paused = marquee.classList.toggle('is-paused');
        var label = paused ? 'Retomar plantão' : 'Pausar plantão';
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
        var pIco = btn.querySelector('[data-tg-ticker-icon="pause"]');
        var plIco = btn.querySelector('[data-tg-ticker-icon="play"]');
        if (pIco && plIco) {
          pIco.classList.toggle('hidden', paused);
          plIco.classList.toggle('hidden', !paused);
        }
        // Libera foco residual de clique de ponteiro ao retomar para garantir animação imediata.
        if (!paused && ev && ev.detail > 0 && typeof btn.blur === 'function') {
          btn.blur();
        }
      });
    });
  }

  /* 15. Central de Alertas (estilo Metrópoles + integração OneSignal/WebPushr) */
  function initAlertsAndSavedDrawer() {
    var drawer = document.getElementById('tg-alerts-drawer');
    if (!drawer) return;

    var STORAGE_SEEN = 'teoriageek-last-seen-alert';
    var STORAGE_PUSH_DISMISS = 'teoriageek-push-dismissed';
    var alertsFeed = document.getElementById('tg-alerts-feed');
    var pushBox = drawer.querySelector('[data-tg-push-prompt]');
    var pushStatus = drawer.querySelector('[data-tg-push-status]');
    var alertsLoaded = false;
    var latestAlertId = 0;

    function esc(v) {
      return String(v || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var trap = attachFocusTrap(drawer, function () {
      setOpen(false);
    });

    function setOpen(open) {
      drawer.classList.toggle('hidden', !open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        trap.activate();
        loadAlerts(true);
        var closeBtn = drawer.querySelector('.tg-alerts-close');
        if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 25);
      } else {
        trap.deactivate();
      }
    }

    function renderItems(items) {
      if (!alertsFeed) return;
      if (!items || !items.length) {
        alertsFeed.innerHTML = '<p class="tg-alerts-empty">Nenhuma novidade encontrada no momento.</p>';
        return;
      }
      alertsFeed.innerHTML = items
        .map(function (item) {
          var thumbHtml = item.thumb
            ? '<img src="' + esc(item.thumb) + '" alt="" loading="lazy" class="tg-alert-thumb" />'
            : '';
          return (
            '<a href="' + esc(item.url) + '" class="tg-alert-item">' +
            thumbHtml +
            '<div style="min-width:0;flex:1;">' +
            '<div class="tg-alert-meta">' +
            '<span class="tg-alert-cat" style="background:' + esc(item.fillColor) + ';color:' + esc(item.inkColor) + ';">' + esc(item.categoryName) + '</span>' +
            '<span class="tg-alert-time">' + esc(item.dateRelative) + '</span>' +
            '</div>' +
            '<span class="tg-alert-title">' + esc(item.title) + '</span>' +
            '</div>' +
            '</a>'
          );
        })
        .join('');
    }

    function loadAlerts(markSeen) {
      if (!cfg.restUrl) return;
      if (alertsLoaded && !markSeen) return;
      fetch(buildRestUrl('/alerts'))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          alertsLoaded = true;
          var items = (data && data.items) || [];
          latestAlertId = (data && data.latestId) || 0;
          renderItems(items);
          try {
            var seen = parseInt(window.localStorage.getItem(STORAGE_SEEN) || '0', 10);
            if (markSeen && latestAlertId > 0) {
              window.localStorage.setItem(STORAGE_SEEN, String(latestAlertId));
              seen = latestAlertId;
            }
            var hasUnread = latestAlertId > 0 && latestAlertId > seen;
            document.querySelectorAll('[data-tg-alerts-dot]').forEach(function (d) {
              d.classList.toggle('hidden', !hasUnread);
            });
          } catch (_e) {}
        })
        .catch(function () {
          if (alertsFeed && !alertsLoaded) {
            alertsFeed.innerHTML = '<p class="tg-alerts-empty">Não foi possível carregar os alertas agora.</p>';
          }
        });
    }

    try {
      if (pushBox && window.localStorage.getItem(STORAGE_PUSH_DISMISS) === '1') {
        pushBox.classList.add('hidden');
      }
    } catch (_e) {}

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-tg-alerts-open]')) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.target.closest('[data-tg-alerts-close]')) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.target.closest('[data-tg-push-dismiss]')) {
        e.preventDefault();
        if (pushBox) pushBox.classList.add('hidden');
        try { window.localStorage.setItem(STORAGE_PUSH_DISMISS, '1'); } catch (_e) {}
        return;
      }
      if (e.target.closest('[data-tg-push-accept]')) {
        e.preventDefault();
        if (Array.isArray(window.OneSignalDeferred)) {
          window.OneSignalDeferred.push(function (OneSignal) {
            if (OneSignal && OneSignal.Slidedown && OneSignal.Slidedown.promptPush) {
              OneSignal.Slidedown.promptPush({ force: true });
            } else if (OneSignal && OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
              OneSignal.Notifications.requestPermission();
            }
          });
        } else if (window.OneSignal && typeof window.OneSignal.showNativePrompt === 'function') {
          window.OneSignal.showNativePrompt();
        } else if (typeof window.webpushr === 'function') {
          window.webpushr('showPrompt');
        } else if (pushStatus) {
          var hasChannels = !!drawer.querySelector('[data-tg-has-channels="1"]');
          pushStatus.textContent = hasChannels
            ? 'Combinado! Vamos deixar as novidades separadas aqui no sininho. Se quiser receber direto no celular, acompanhe também pelos canais abaixo.'
            : 'Combinado! Vamos deixar as novidades separadas aqui no sininho sempre que você voltar ao site.';
          pushStatus.classList.remove('hidden');
        }
      }
    });

    var checkUnread = function () { loadAlerts(false); };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(checkUnread, { timeout: 2500 });
    } else {
      setTimeout(checkUnread, 1500);
    }
  }

  /* 16. Lightbox nativo para imagens dentro do artigo (.entry-content img) */
  function initArticleLightbox() {
    var content = document.querySelector('#tg-article-body .entry-content');
    if (!content) return;

    var imgs = Array.prototype.slice.call(content.querySelectorAll('img')).filter(function (im) {
      return !im.closest('.tg-yt-facade') && !im.classList.contains('emoji');
    });
    if (!imgs.length) return;

    var lb = document.createElement('div');
    lb.className = 'tg-lightbox hidden';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visualização ampliada da imagem');
    lb.innerHTML =
      '<button type="button" class="tg-lightbox-close" aria-label="Fechar imagem">&times;</button>' +
      '<img class="tg-lightbox-img" alt="" />' +
      '<p class="tg-lightbox-cap"></p>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('.tg-lightbox-img');
    var lbCap = lb.querySelector('.tg-lightbox-cap');
    var lbClose = lb.querySelector('.tg-lightbox-close');
    var trap = attachFocusTrap(lb, closeLb);

    function openLb(im) {
      var fullSrc = im.getAttribute('data-full-src') || im.currentSrc || im.src;
      if (!fullSrc) return;
      lbImg.src = fullSrc;
      lbImg.alt = im.alt || '';
      var fig = im.closest('figure');
      var capEl = fig ? fig.querySelector('figcaption') : null;
      lbCap.textContent = capEl ? capEl.textContent.trim() : (im.alt || '');
      lbCap.style.display = lbCap.textContent ? 'block' : 'none';
      lb.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      trap.activate();
      lbClose.focus();
    }

    function closeLb() {
      if (lb.classList.contains('hidden')) return;
      lb.classList.add('hidden');
      document.body.style.overflow = '';
      trap.deactivate();
    }

    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLb();
    });

    imgs.forEach(function (im) {
      im.classList.add('tg-lightbox-ready');
      im.addEventListener('click', function (e) {
        if (im.naturalWidth && im.naturalWidth < 140) return;
        var parentLink = im.closest('a');
        if (parentLink && !/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(parentLink.href)) return;
        e.preventDefault();
        openLb(im);
      });
    });
  }


  /* 17. Contagem real de visualizações em matérias individuais (compatível com WP Super Cache) */
  function initArticleViewTracker() {
    if (!cfg.isSingle || !cfg.singlePostId || !cfg.restUrl) return;
    var pid = Number(cfg.singlePostId);
    if (!pid) return;
    var key = 'tg-viewed-' + pid;
    try {
      if (window.sessionStorage.getItem(key) === '1') return;
    } catch (_e) {}

    window.setTimeout(function () {
      if (document.visibilityState === 'hidden') return;
      fetch(buildRestUrl('/posts/' + pid + '/view'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: '{}',
      })
        .then(function (r) {
          if (r.ok) {
            try { window.sessionStorage.setItem(key, '1'); } catch (_e) {}
          }
        })
        .catch(function () {});
    }, 1500);
  }

  /* 18. Reação rápida de 1 clique no fim do artigo (compartilha contador _tg_likes_count com Reels) */
  function initArticleReaction() {
    var btn = document.querySelector('[data-tg-article-like]');
    if (!btn) return;
    var pid = Number(btn.getAttribute('data-tg-article-like') || '0');
    if (!pid) return;

    var STORAGE_LIKED = 'teoriageek-liked-ids';
    function readLiked() {
      try {
        var raw = window.localStorage.getItem(STORAGE_LIKED);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_e) {
        return [];
      }
    }

    var labelEl = btn.querySelector('[data-tg-react-label]');
    var countEl = btn.querySelector('[data-tg-react-count]');
    var liked = readLiked().indexOf(pid) !== -1;

    function syncUi(isLiked, countVal) {
      btn.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
      btn.classList.toggle('is-liked', isLiked);
      if (labelEl) labelEl.textContent = isLiked ? 'Curtido' : 'Curtir';
      if (countEl && typeof countVal === 'number') {
        countEl.textContent = String(Math.max(0, countVal));
      }
    }

    syncUi(liked);

    btn.addEventListener('click', function () {
      var list = readLiked();
      var idx = list.indexOf(pid);
      var likedNow = idx === -1;
      if (likedNow) list.push(pid);
      else list.splice(idx, 1);
      try {
        window.localStorage.setItem(STORAGE_LIKED, JSON.stringify(list));
      } catch (_e) {}

      var cur = countEl ? (parseInt(countEl.textContent || '0', 10) || 0) : 0;
      syncUi(likedNow, Math.max(0, cur + (likedNow ? 1 : -1)));

      if (cfg.restUrl) {
        fetch(buildRestUrl('/posts/' + pid + '/like'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: likedNow ? 'like' : 'unlike' }),
        })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (data && typeof data.likes === 'number') {
              syncUi(likedNow, data.likes);
            }
          })
          .catch(function () {});
      }
    });
  }

  /* 19. Nota da Comunidade interativa nas Críticas e Reviews */
  function initCommunityScore() {
    var box = document.querySelector('[data-tg-community-score]');
    if (!box) return;
    var pid = Number(box.getAttribute('data-tg-community-score') || '0');
    if (!pid) return;

    var STORAGE_KEY = 'teoriageek-rated-posts';
    function readRatings() {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        var obj = raw ? JSON.parse(raw) : {};
        return obj && typeof obj === 'object' ? obj : {};
      } catch (_e) {
        return {};
      }
    }

    var avgEl = box.querySelector('[data-tg-cs-avg]');
    var metaEl = box.querySelector('[data-tg-cs-meta]');
    var fbEl = box.querySelector('[data-tg-cs-feedback]');
    var btns = box.querySelectorAll('[data-tg-rate-btn]');
    var ratings = readRatings();

    function lockWithScore(userScore) {
      box.classList.add('is-voted');
      btns.forEach(function (b) {
        var val = Number(b.getAttribute('data-tg-rate-btn'));
        b.disabled = true;
        b.classList.toggle('is-selected', val === userScore);
      });
      if (fbEl) fbEl.textContent = 'Sua nota: ' + userScore + '/10 — obrigado por votar!';
    }

    if (ratings[pid]) {
      lockWithScore(Number(ratings[pid]));
      return;
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var score = Number(b.getAttribute('data-tg-rate-btn') || '0');
        if (score < 1 || score > 10 || box.classList.contains('is-voted')) return;
        lockWithScore(score);
        ratings[pid] = score;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
        } catch (_e) {}

        if (cfg.restUrl) {
          fetch(buildRestUrl('/posts/' + pid + '/community-score'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score }),
          })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
              if (data && typeof data.average === 'number' && typeof data.count === 'number') {
                if (avgEl) avgEl.textContent = data.average.toFixed(1);
                if (metaEl) {
                  metaEl.textContent = '· ' + data.count + (data.count === 1 ? ' voto' : ' votos');
                }
              }
            })
            .catch(function () {});
        }
      });
    });
  }

  /* 20. Analytics Editorial First-Party (cliques por zona/link, origens, dispositivos, scroll depth e tempo ativo) */
  function initEditorialAnalytics() {
    if (!cfg.restUrl || cfg.skipAnalytics) return;

    var endpoint = buildRestUrl('/telemetry');
    var SID_KEY = 'tg_an_sid_v1';
    var SN_KEY = 'tg_an_sn_v1';
    var sid = '';
    var sessPageNum = 1;

    try {
      sid = window.sessionStorage.getItem(SID_KEY) || '';
      if (!sid) {
        sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
        window.sessionStorage.setItem(SID_KEY, sid);
        sessPageNum = 1;
      } else {
        sessPageNum = (parseInt(window.sessionStorage.getItem(SN_KEY) || '0', 10) || 0) + 1;
      }
      window.sessionStorage.setItem(SN_KEY, String(sessPageNum));
    } catch (_e) {
      sid = 'anon' + Date.now().toString(36);
      sessPageNum = 1;
    }

    function detectDevice() {
      var w = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 1280;
      var ua = navigator.userAgent || '';
      if (w < 768 || (/Mobi|Android|iPhone/i.test(ua) && !/iPad|Tablet/i.test(ua))) return 'mobile';
      if (w < 1024 || /iPad|Tablet/i.test(ua)) return 'tablet';
      return 'desktop';
    }

    var device = detectDevice();
    var pagePath = window.location.pathname || '/';
    var pageType = cfg.pageType || (cfg.isSingle ? 'single' : 'other');
    var h1 = document.querySelector('main h1, article h1');
    var pageTitle = (h1 && (h1.textContent || '').trim()) || (document.title || '').replace(/\s+[—–|-]\s+.*$/, '').trim() || pagePath;
    if (pageTitle.length > 96) pageTitle = pageTitle.slice(0, 96);

    var queue = [];
    var flushTimer = null;

    function flush(useBeacon) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (!queue.length) return;
      var payload = JSON.stringify({
        sid: sid,
        events: queue.splice(0, 25),
      });
      if (useBeacon && navigator.sendBeacon) {
        try {
          var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
          if (navigator.sendBeacon(endpoint, blob)) return;
        } catch (_e) {}
      }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: payload,
      }).catch(function () {});
    }

    function enqueue(ev, immediate) {
      queue.push(ev);
      if (immediate || queue.length >= 8) {
        flush(false);
      } else if (!flushTimer) {
        flushTimer = setTimeout(function () {
          flush(false);
        }, 4000);
      }
    }

    function getUtm() {
      try {
        var sp = new URLSearchParams(window.location.search || '');
        return {
          us: (sp.get('utm_source') || '').slice(0, 40),
          uc: (sp.get('utm_campaign') || '').slice(0, 40),
        };
      } catch (_e) {
        return { us: '', uc: '' };
      }
    }

    // 20.1 Pageview inicial + Origem + Sessão
    var utm = getUtm();
    var pvEv = {
      t: 'pv',
      p: pagePath,
      pt: pageType,
      tl: pageTitle,
      d: device,
      sn: sessPageNum,
      pid: Number(cfg.singlePostId) || 0,
      r: sessPageNum === 1 ? (document.referrer || '').slice(0, 240) : '',
      us: sessPageNum === 1 ? utm.us : '',
      uc: sessPageNum === 1 ? utm.uc : '',
    };
    enqueue(pvEv, false);

    // Se estiver na página de busca (?s=termo), registra a busca consolidada
    if (pageType === 'search' && cfg.searchQuery && cfg.searchQuery.length >= 2) {
      enqueue({
        t: 'srch',
        p: pagePath,
        d: device,
        q: cfg.searchQuery,
        rc: typeof cfg.searchCount === 'number' ? cfg.searchCount : -1,
      }, false);
    }

    // Busca instantânea (registra apenas quando o leitor pausa 1,5s com 3+ caracteres)
    var searchLogTimer = null;
    var lastLoggedSearch = '';
    document.addEventListener('tg:search-results', function (ev) {
      var det = (ev && ev.detail) || {};
      var term = String(det.term || '').trim();
      if (term.length < 3 || term.toLowerCase() === lastLoggedSearch) return;
      clearTimeout(searchLogTimer);
      searchLogTimer = setTimeout(function () {
        lastLoggedSearch = term.toLowerCase();
        enqueue({
          t: 'srch',
          p: pagePath,
          d: device,
          q: term,
          rc: typeof det.count === 'number' ? det.count : -1,
        }, false);
      }, 1500);
    });

    // 20.2 Classificação de Zona Editorial & Conversão para qualquer clique do usuário
    var ownHost = (window.location.hostname || '').replace(/^www\./, '').toLowerCase();

    function isExternalUrl(href) {
      if (!href || !/^https?:\/\//i.test(href)) return false;
      try {
        var u = new URL(href, window.location.href);
        var h = (u.hostname || '').replace(/^www\./, '').toLowerCase();
        return !!h && h !== ownHost;
      } catch (_e) {
        return false;
      }
    }

    function detectConversion(el, href) {
      var lowHref = String(href || '').toLowerCase();
      if (el.closest('[data-tg-spoiler-unlock]')) return 'spoiler';
      if (el.closest('.tg-yt-facade')) return 'youtube';
      if (el.closest('[data-tg-article-like], [data-tg-reel-like]')) return 'like';
      if (el.closest('[data-tg-rate-btn]')) return 'community_vote';
      if (el.closest('[data-tg-native-share], [data-tg-copy-url], [data-tg-reel-share], [data-tg-reel-copy]') || lowHref.indexOf('api.whatsapp.com/send') !== -1 || lowHref.indexOf('twitter.com/intent/') !== -1) return 'share';
      if (lowHref.indexOf('whatsapp.com/channel') !== -1 || lowHref.indexOf('chat.whatsapp.com') !== -1 || lowHref.indexOf('wa.me/') !== -1) return 'whatsapp';
      if (lowHref.indexOf('t.me/') !== -1 || lowHref.indexOf('telegram.me/') !== -1) return 'telegram';
      if (lowHref.indexOf('news.google.com') !== -1) return 'gnews';
      if (el.closest('[data-tg-reel-facade-play], .tg-header-reels-btn') || lowHref.indexOf('/reels') !== -1) return 'reels_play';
      if (isExternalUrl(href)) return 'outbound';
      return '';
    }

    function detectZone(el, href) {
      if (el.closest('.tg-hero-carousel')) return 'hero_carousel';
      if (el.closest('.tg-reel-facade, .tg-reels-shell, [aria-labelledby*="reels"]')) return 'reels';
      if (el.closest('.ticker-marquee, [aria-label*="Plantão"]')) return 'plantao_ticker';
      if (el.closest('[aria-label*="Destaques principais"]')) return 'hero_secondary';
      if (el.closest('[aria-labelledby="tg-giro-heading"]')) return 'giro_geek';
      if (el.closest('[aria-labelledby="tg-most-read-heading"], [aria-labelledby="tg-sidebar-mais-lidas"]')) return 'mais_lidas';
      if (el.closest('[aria-labelledby="tg-reviews-heading"], [data-tg-community-score], .tg-review-box')) return 'criticas';
      if (el.closest('[aria-labelledby="tg-especiais-heading"]')) return 'especiais';
      if (el.closest('#editorias')) return 'editorias_home';
      if (el.closest('.tg-inline-read-more')) return 'leia_tambem';
      if (el.closest('[aria-labelledby="tg-related-heading"], .tg-next-article')) return 'relacionados';
      if (el.closest('.tg-series-box, [href*="/universo/"]')) return 'universo';
      if (el.closest('.tg-newsletter-box')) return 'newsletter';
      if (el.closest('.tg-share-bar')) return 'compartilhar';
      if (el.closest('[aria-label*="Canais oficiais"], .tg-push-channels')) return 'canais_sociais';
      if (el.closest('#tg-search-modal, #tg-alerts-drawer')) return 'busca_alertas';
      if (el.closest('header.tg-site-header, #tg-mobile-drawer')) return 'header_nav';
      if (el.closest('footer')) return 'rodape';
      if (el.closest('#tg-article-body')) return isExternalUrl(href) ? 'links_externos' : 'corpo_artigo';
      if (isExternalUrl(href)) return 'links_externos';
      if (el.closest('main article, main .editorial-card')) return 'listagem';
      return 'outros';
    }

    function cleanClickLabel(el, href) {
      var txt = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) {
        var img = el.querySelector('img[alt]');
        if (img && img.alt) txt = img.alt.trim();
      }
      if (!txt) {
        var card = el.closest('article');
        var heading = card ? card.querySelector('h1, h2, h3, h4') : null;
        if (heading) txt = (heading.textContent || '').replace(/\s+/g, ' ').trim();
      }
      if (!txt && href) {
        try {
          var u = new URL(href, window.location.href);
          txt = u.hostname === window.location.hostname ? u.pathname : u.hostname;
        } catch (_e) {
          txt = href;
        }
      }
      return txt.slice(0, 88);
    }

    function compactTarget(href, el) {
      if (href && /^https?:\/\//i.test(href)) {
        try {
          var u = new URL(href, window.location.href);
          if ((u.hostname || '').replace(/^www\./, '').toLowerCase() === ownHost) {
            return (u.pathname || '/').slice(0, 120);
          }
          return (u.hostname + u.pathname).slice(0, 120);
        } catch (_e) {}
      }
      if (el.hasAttribute('data-tg-spoiler-unlock')) return '#spoiler-unlock';
      if (el.hasAttribute('data-tg-article-like') || el.hasAttribute('data-tg-reel-like')) return '#curtir';
      if (el.hasAttribute('data-tg-rate-btn')) return '#nota-' + el.getAttribute('data-tg-rate-btn');
      if (el.closest('.tg-yt-facade')) return '#youtube-play';
      return '';
    }

    document.addEventListener('click', function (ev) {
      var el = ev.target && ev.target.closest
        ? ev.target.closest('a[href], button[data-tg-spoiler-unlock], button[data-tg-article-like], button[data-tg-reel-like], button[data-tg-rate-btn], button[data-tg-native-share], button[data-tg-copy-url], button[data-tg-reel-facade-play], .tg-yt-facade, .tg-hero-tab, .tg-hero-dock-btn')
        : null;
      if (!el) return;
      var href = el.tagName === 'A' ? (el.getAttribute('href') || '') : '';
      if (href && href.indexOf('javascript:') === 0) return;

      var zone = detectZone(el, href);
      var conv = detectConversion(el, href);
      var label = cleanClickLabel(el, href);
      var target = compactTarget(href, el);

      enqueue({
        t: 'clk',
        p: pagePath,
        d: device,
        z: zone,
        l: label,
        u: target,
        cv: conv,
      }, false);

      // Navegação para link externo ou interno: dispara sendBeacon imediato para não perder o clique
      if (el.tagName === 'A' && href && href.charAt(0) !== '#') {
        flush(true);
      }
    }, true);

    document.addEventListener('submit', function (ev) {
      if (ev.target && ev.target.classList && ev.target.classList.contains('tg-newsletter-form')) {
        enqueue({
          t: 'clk',
          p: pagePath,
          d: device,
          z: 'newsletter',
          l: 'Assinar Newsletter',
          u: '#newsletter-submit',
          cv: 'newsletter',
        }, false);
        flush(true);
      }
    }, true);

    // 20.3 Tempo Ativo de Leitura + Profundidade de Scroll (25% / 50% / 75% / 100%)
    var engagedSec = 0;
    var lastActivity = Date.now();
    var maxScrollPct = 0;
    var engagementSent = false;
    var articleEl = document.getElementById('tg-article-body');

    function markActivity() {
      lastActivity = Date.now();
    }
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evtName) {
      window.addEventListener(evtName, markActivity, { passive: true });
    });

    function measureScroll() {
      var pct = 0;
      if (articleEl) {
        var rect = articleEl.getBoundingClientRect();
        var total = Math.max(1, articleEl.offsetHeight);
        var passed = Math.max(0, window.innerHeight - rect.top);
        pct = Math.min(100, Math.round((passed / total) * 100));
      } else {
        var docH = Math.max(1, (document.documentElement.scrollHeight || 1) - window.innerHeight);
        pct = Math.min(100, Math.round(((window.scrollY || 0) / docH) * 100));
      }
      if (pct > maxScrollPct) maxScrollPct = pct;
    }

    var scrollTick = false;
    window.addEventListener('scroll', function () {
      if (!scrollTick) {
        scrollTick = true;
        window.requestAnimationFrame(function () {
          measureScroll();
          scrollTick = false;
        });
      }
    }, { passive: true });

    setInterval(function () {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity <= 30000) {
        engagedSec = Math.min(900, engagedSec + 1);
      }
    }, 1000);

    function sendEngagementAndFlush() {
      measureScroll();
      if (!engagementSent && (engagedSec >= 2 || (cfg.isSingle && maxScrollPct >= 25))) {
        engagementSent = true;
        queue.push({
          t: 'eng',
          p: pagePath,
          d: device,
          s: engagedSec,
          sc: cfg.isSingle ? maxScrollPct : 0,
        });
      }
      flush(true);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        sendEngagementAndFlush();
      }
    });
    window.addEventListener('pagehide', sendEngagementAndFlush);

    // Envia o pageview inicial rapidamente (1,2s após carregar) para aparecer no "Online agora"
    setTimeout(function () {
      measureScroll();
      flush(false);
    }, 1200);
  }

  /* Boot */
  syncThemeButtons();
  initReadingProgress();
  initMobileDrawer();
  initInstantSearch();
  initHeroCarousel();
  initGiroStripCarousel();
  initDesktopSearchAndModalA11y();
  initTickerPause();
  initAlertsAndSavedDrawer();
  initArticleLightbox();
  initArticleViewTracker();
  initArticleReaction();
  initCommunityScore();
  initEditorialAnalytics();
  scanBrokenCoverImages();
  window.addEventListener('load', scanBrokenCoverImages);
})();
