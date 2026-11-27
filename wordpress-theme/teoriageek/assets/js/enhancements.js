/**
 * Teoria Geek — Aprimoramentos Editoriais & UX Vanilla JS (v2.12.0, zero dependências).
 * 0. Fallback elegante para imagens quebradas dentro de .entry-content (além de .tg-cover-img)
 * 1. Wrapper responsivo automático (.tgx-table-wrap) para tabelas editoriais (exceto .ficha)
 * 2. Letra capitular editorial (.tgx-dropcap) no primeiro parágrafo narrativo de single.php
 * 3. Âncoras copiáveis nos subtítulos H2/H3 + Sumário automático retrátil (TOC)
 * 4. Marcação automática de links externos (.tgx-external)
 * 5. Lightbox acessível com zoom para imagens da matéria
 * 6. Botão flutuante "Voltar ao topo" (oculto na tela Reels)
 * 7. Aviso nativo de Cookies/LGPD (auto-suprimido quando CookieYes está ativo)
 * 8. Controles A- / 100% / A+ de tamanho da fonte de leitura (incluindo spans legados)
 * 9. Desligamento de shimmer skeletons no carregamento de capas
 * 10. Focus trap acessível (Tab / Shift+Tab) no Menu Mobile e no Modal de Busca
 */
(function () {
  'use strict';

  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  /* 0. Fallback elegante para imagens quebradas dentro de .entry-content (além de .tg-cover-img) */
  function handleBrokenContentImage(img) {
    if (!img || img.dataset.tgBrokenHandled === '1') return;
    if (img.classList.contains('tg-cover-img')) return;
    img.dataset.tgBrokenHandled = '1';
    img.setAttribute('data-tg-broken', '1');
    img.classList.remove('tgx-zoomable');

    // Thumbnail de YouTube Facade: tenta mqdefault antes de ocultar
    if (img.classList.contains('tg-yt-facade-thumb')) {
      var src = img.getAttribute('src') || '';
      if (src.indexOf('/hqdefault.jpg') !== -1 && !img.dataset.tgYtRetried) {
        img.dataset.tgYtRetried = '1';
        img.dataset.tgBrokenHandled = '';
        img.removeAttribute('data-tg-broken');
        img.src = src.replace('/hqdefault.jpg', '/mqdefault.jpg');
        return;
      }
      img.style.display = 'none';
      return;
    }

    // Selos legados ou ícones decorativos quebrados: oculta silenciosamente sem deixar buraco
    var divSelo = img.closest('.div-selo');
    if (img.classList.contains('selo') || divSelo) {
      img.style.display = 'none';
      if (divSelo && !divSelo.textContent.trim()) {
        divSelo.style.display = 'none';
      }
      return;
    }

    var fig = img.closest('figure, .wp-caption');
    var figcap = fig ? fig.querySelector('figcaption, .wp-caption-text') : null;
    var capText = figcap ? (figcap.textContent || '').trim() : '';
    var altText = (img.getAttribute('alt') || '').trim();
    var label = capText || (altText.length >= 4 ? altText : '');

    img.style.display = 'none';
    var parentLink = img.parentElement && img.parentElement.tagName === 'A' ? img.parentElement : null;
    if (parentLink && parentLink.children.length === 1 && !(parentLink.textContent || '').trim()) {
      parentLink.style.display = 'none';
    }

    if (fig) {
      fig.classList.add('tgx-broken-media');
      if (label && !fig.querySelector('.tgx-img-fallback')) {
        var ph = document.createElement('div');
        ph.className = 'tgx-img-fallback';
        ph.setAttribute('role', 'img');
        ph.setAttribute('aria-label', label);
        ph.innerHTML =
          '<svg class="tgx-img-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' +
          '<span>' +
          (capText ? 'Imagem indisponível no acervo' : label) +
          '</span>';
        fig.insertBefore(ph, fig.firstChild);
      } else if (!label) {
        fig.style.display = 'none';
      }
      return;
    }

    if (label) {
      var inlinePh = document.createElement('div');
      inlinePh.className = 'tgx-img-fallback';
      inlinePh.setAttribute('role', 'img');
      inlinePh.setAttribute('aria-label', label);
      inlinePh.innerHTML =
        '<svg class="tgx-img-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' +
        '<span></span>';
      inlinePh.querySelector('span').textContent = label;
      var anchorRef = parentLink || img;
      if (anchorRef.parentNode) {
        anchorRef.parentNode.insertBefore(inlinePh, anchorRef);
      }
    } else {
      var pWrap = img.closest('p');
      if (pWrap && !(pWrap.textContent || '').trim() && pWrap.querySelectorAll('img:not([data-tg-broken="1"])').length === 0) {
        pWrap.style.display = 'none';
      }
    }
  }

  function enhanceBrokenContentImages(content) {
    function scan() {
      content.querySelectorAll('img').forEach(function (img) {
        if (img.complete && img.naturalWidth === 0 && (img.getAttribute('src') || img.getAttribute('srcset'))) {
          handleBrokenContentImage(img);
        }
      });
    }
    document.addEventListener(
      'error',
      function (ev) {
        var t = ev.target;
        if (t && t.tagName === 'IMG' && content.contains(t)) {
          handleBrokenContentImage(t);
        }
      },
      true
    );
    scan();
    window.addEventListener('load', scan, { once: true });
  }

  /* 1. Envolve tabelas soltas no .entry-content em .tgx-table-wrap (sem tocar em .ficha) */
  function enhanceTables(content) {
    var tables = content.querySelectorAll('table');
    tables.forEach(function (tbl) {
      if (tbl.closest('.ficha') || tbl.closest('.tgx-table-wrap') || tbl.closest('.wp-block-table')) {
        return;
      }
      var wrap = document.createElement('div');
      wrap.className = 'tgx-table-wrap';
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Tabela rolável horizontalmente');
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });
  }

  /* 2. Letra capitular editorial no primeiro parágrafo narrativo real (pula subtítulos em itálico) */
  function enhanceDropcap(content) {
    if (!document.body.classList.contains('single-post') && !document.getElementById('tg-article-body')) {
      return;
    }
    var paragraphs = content.querySelectorAll(':scope > p');
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      if (p.closest('.ficha') || p.closest('blockquote') || p.closest('details')) continue;
      if (p.querySelector('img, iframe, video, figure')) continue;
      var txt = (p.textContent || '').trim();
      if (txt.length < 40) continue;

      // Se o parágrafo de abertura estiver todo em itálico (linha fina/subtítulo), estiliza como lead e continua
      var emChild = p.children.length === 1 && (p.children[0].tagName === 'EM' || p.children[0].tagName === 'I');
      if (emChild && (p.children[0].textContent || '').trim().length >= txt.length - 4) {
        if (i === 0) {
          p.classList.add('tgx-lead-subhead');
        }
        continue;
      }

      if (txt.length >= 120 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(txt)) {
        p.classList.add('tgx-dropcap');
        break;
      }
    }
  }

  /* 3. Âncoras em H2/H3 + Sumário automático retrátil (TOC) */
  function enhanceHeadingsAndToc(content) {
    var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3')).filter(function (h) {
      return !h.closest('.ficha') && !h.closest('details') && (h.textContent || '').trim().length > 1;
    });
    if (!headings.length) return;

    var usedIds = {};
    headings.forEach(function (h, idx) {
      var id = h.id || slugify(h.textContent) || 'secao-' + (idx + 1);
      var base = id;
      var n = 2;
      while (usedIds[id] || (document.getElementById(id) && document.getElementById(id) !== h)) {
        id = base + '-' + n;
        n++;
      }
      usedIds[id] = true;
      h.id = id;

      if (!h.querySelector('.tgx-heading-anchor')) {
        var anchor = document.createElement('a');
        anchor.href = '#' + id;
        anchor.className = 'tgx-heading-anchor';
        anchor.setAttribute('aria-label', 'Copiar link desta seção: ' + (h.textContent || '').trim());
        anchor.setAttribute('title', 'Copiar link da seção');
        anchor.textContent = '#';
        anchor.addEventListener('click', function (ev) {
          var url = window.location.href.split('#')[0] + '#' + id;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).catch(function () {});
          }
          anchor.classList.add('is-copied');
          anchor.textContent = '✓';
          setTimeout(function () {
            anchor.classList.remove('is-copied');
            anchor.textContent = '#';
          }, 1500);
          ev.stopPropagation();
        });
        h.appendChild(anchor);
      }
    });

    if (headings.length < 2 || content.querySelector('.tgx-toc')) return;

    var details = document.createElement('details');
    details.className = 'tgx-toc';
    if (window.innerWidth >= 1024) {
      details.setAttribute('open', '');
    }

    var summary = document.createElement('summary');
    summary.innerHTML =
      '<span class="tgx-toc-title"><span>Nesta matéria</span><span class="tgx-toc-count">' +
      headings.length +
      '</span></span>' +
      '<svg class="tgx-toc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

    var ol = document.createElement('ol');
    ol.className = 'tgx-toc-list';

    headings.forEach(function (h, i) {
      var li = document.createElement('li');
      li.className = 'tgx-toc-item' + (h.tagName === 'H3' ? ' is-h3' : '');

      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'tgx-toc-link';

      var num = document.createElement('span');
      num.className = 'tgx-toc-num';
      num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);

      var clone = h.cloneNode(true);
      var anc = clone.querySelector('.tgx-heading-anchor');
      if (anc) anc.remove();

      var label = document.createElement('span');
      label.textContent = (clone.textContent || '').trim();

      a.appendChild(num);
      a.appendChild(label);
      li.appendChild(a);
      ol.appendChild(li);
    });

    details.appendChild(summary);
    details.appendChild(ol);
    content.insertBefore(details, content.firstChild);
  }

  /* 4. Marca links externos no corpo editorial */
  function enhanceExternalLinks(content) {
    var host = window.location.hostname;
    content.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.classList.contains('tactile-btn') || a.classList.contains('bg-highlight') || a.querySelector('img')) {
        return;
      }
      try {
        var u = new URL(a.href, window.location.href);
        if (u.hostname && host && u.hostname !== host && u.hostname.replace(/^www\./, '') !== host.replace(/^www\./, '')) {
          a.classList.add('tgx-external');
          if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
          var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
          if (rel.indexOf('noopener') === -1) rel.push('noopener');
          if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
          a.setAttribute('rel', rel.join(' '));
        }
      } catch (_e) {}
    });
  }

  /* 5. Lightbox acessível para imagens dentro de .entry-content */
  function enhanceLightbox(content) {
    var imgs = Array.prototype.slice.call(content.querySelectorAll('img')).filter(function (img) {
      if (img.classList.contains('selo') || img.closest('.div-selo') || img.closest('.tg-yt-facade')) return false;
      var parentLink = img.closest('a');
      if (parentLink && !/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(parentLink.getAttribute('href') || '')) {
        return false;
      }
      return true;
    });

    if (!imgs.length) return;

    var lb = document.createElement('div');
    lb.className = 'tgx-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visualização ampliada da imagem');
    lb.hidden = true;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tgx-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Fechar imagem ampliada');
    closeBtn.innerHTML = '&times;';

    var lbImg = document.createElement('img');
    lbImg.className = 'tgx-lightbox-img';
    lbImg.alt = '';

    var lbCap = document.createElement('p');
    lbCap.className = 'tgx-lightbox-caption';

    lb.appendChild(closeBtn);
    lb.appendChild(lbImg);
    lb.appendChild(lbCap);
    document.body.appendChild(lb);

    var lastFocus = null;

    function closeLightbox() {
      lb.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    function openLightbox(src, alt, caption, triggerEl) {
      lastFocus = triggerEl || document.activeElement;
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCap.textContent = caption || alt || '';
      lbCap.hidden = !lbCap.textContent;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    closeBtn.addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (ev) {
      if (ev.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !lb.hidden) closeLightbox();
    });

    imgs.forEach(function (img) {
      if (img.getAttribute('data-tg-broken') === '1') return;
      img.classList.add('tgx-zoomable');
      img.addEventListener('click', function (ev) {
        if (img.getAttribute('data-tg-broken') === '1' || (img.complete && img.naturalWidth === 0)) return;
        var link = img.closest('a');
        var fullSrc = (link && link.getAttribute('href')) || img.currentSrc || img.src;
        if (!fullSrc) return;
        if (link) ev.preventDefault();
        var fig = img.closest('figure');
        var figcap = fig ? fig.querySelector('figcaption') : null;
        var capText = figcap ? (figcap.textContent || '').trim() : '';
        openLightbox(fullSrc, img.getAttribute('alt') || '', capText, img);
      });
    });
  }

  /* 6. Botão flutuante "Voltar ao topo" */
  function initBackToTop() {
    if (document.querySelector('.tg-reels-shell')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tgx-back-to-top';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.setAttribute('title', 'Voltar ao topo');
    btn.innerHTML =
      '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    var ticking = false;
    function sync() {
      var y = window.scrollY || window.pageYOffset || 0;
      btn.classList.toggle('is-visible', y > 420);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(sync);
          ticking = true;
        }
      },
      { passive: true }
    );

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    sync();
  }


  /* 7. Aviso nativo de Cookies / LGPD (auto-suprimido quando CookieYes ou similar está ativo) */
  function initCookieBanner() {
    var banner = document.getElementById('tg-cookie-banner');
    if (!banner) return;
    if (
      document.querySelector('.cky-consent-container, #cookie-law-info-bar, [data-cky-tag], .cmplz-cookiebanner') ||
      document.cookie.indexOf('cookieyes-consent=') !== -1 ||
      document.cookie.indexOf('viewed_cookie_policy=') !== -1
    ) {
      banner.hidden = true;
      return;
    }
    var KEY = 'teoriageek-cookie-consent-v1';
    try {
      if (window.localStorage.getItem(KEY)) return;
    } catch (_e) {}

    banner.hidden = false;
    banner.querySelectorAll('[data-tg-cookie-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choice = btn.getAttribute('data-tg-cookie-choice') || 'accepted';
        try {
          window.localStorage.setItem(KEY, choice);
        } catch (_e) {}
        banner.hidden = true;
      });
    });
  }


  /* 8. Controle A- / 100% / A+ de tamanho da fonte na leitura da matéria */
  function initReadingFontSize() {
    var content = document.querySelector('#tg-article-body .entry-content') || document.querySelector('.entry-content');
    var btns = document.querySelectorAll('[data-tg-font-step]');
    var resetBtn = document.querySelector('[data-tg-font-reset]');
    if (!content || !btns.length) return;

    var KEY = 'teoriageek-reading-scale-v2';
    var steps = [0.875, 1, 1.15, 1.3, 1.45];
    var idx = 1;
    try {
      var saved = parseFloat(window.localStorage.getItem(KEY) || window.localStorage.getItem('teoriageek-reading-scale') || '1');
      if (!isNaN(saved) && saved > 0.5 && saved < 2) {
        var bestIdx = 1;
        var bestDiff = 99;
        for (var s = 0; s < steps.length; s++) {
          var diff = Math.abs(steps[s] - saved);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestIdx = s;
          }
        }
        idx = bestIdx;
      }
    } catch (_e) {}

    function apply() {
      var scale = steps[idx];
      content.style.setProperty('--tgx-reading-scale', String(scale));
      content.setAttribute('data-reading-scale', String(scale));
      content.classList.toggle('tgx-scaled-reading', idx !== 1);
      if (resetBtn) {
        resetBtn.textContent = Math.round(scale * 100) + '%';
        resetBtn.classList.toggle('is-modified', idx !== 1);
      }
      btns.forEach(function (b) {
        var step = parseInt(b.getAttribute('data-tg-font-step') || '0', 10);
        b.disabled = (step < 0 && idx === 0) || (step > 0 && idx === steps.length - 1);
      });
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var delta = parseInt(b.getAttribute('data-tg-font-step') || '0', 10);
        idx = Math.max(0, Math.min(steps.length - 1, idx + delta));
        try {
          window.localStorage.setItem(KEY, String(steps[idx]));
        } catch (_e) {}
        apply();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        idx = 1;
        try {
          window.localStorage.setItem(KEY, '1');
        } catch (_e) {}
        apply();
      });
    }

    apply();
  }

  /* 9. Desliga shimmer skeleton assim que cada imagem de capa termina de carregar */
  function initMediaSkeletons() {
    document.querySelectorAll('.tgx-skeleton-media img.tg-cover-img').forEach(function (img) {
      var wrap = img.closest('.tgx-skeleton-media');
      if (!wrap) return;
      var done = function () {
        wrap.classList.add('is-loaded');
      };
      if (img.complete) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  /* 10. Focus trap acessível (Tab / Shift+Tab) no Menu Mobile e no Modal de Busca */
  function initDialogFocusTraps() {
    ['tg-mobile-drawer', 'tg-search-modal'].forEach(function (id) {
      var container = document.getElementById(id);
      if (!container) return;
      container.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Tab' || container.classList.contains('hidden')) return;
        var dialog = container.querySelector('[role="dialog"]') || container;
        var focusables = Array.prototype.slice.call(
          dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(function (el) {
          return el.offsetParent !== null;
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      });
    });
  }

  function boot() {
    var content = document.querySelector('#tg-article-body .entry-content') || document.querySelector('.entry-content');
    if (content) {
      enhanceBrokenContentImages(content);
      enhanceTables(content);
      enhanceDropcap(content);
      enhanceHeadingsAndToc(content);
      enhanceExternalLinks(content);
      enhanceLightbox(content);
    }
    initBackToTop();
    initCookieBanner();
    initReadingFontSize();
    initMediaSkeletons();
    initDialogFocusTraps();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
