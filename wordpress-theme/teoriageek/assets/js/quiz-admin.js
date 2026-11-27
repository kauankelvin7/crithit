/**
 * Teoria Geek — Construtor Administrativo de Quizzes (v2.13.0, Vanilla JS + wp.media).
 * Enfileirado exclusivamente em `post.php` e `post-new.php` do CPT `tg_quiz`.
 * - Criação de perguntas, alternativas e faixas a partir de `<template>`
 * - Reordenação por botões ▲ / ▼ acessíveis por teclado preservando alternativa correta marcada
 * - Reindexação determinística dos atributos `name` e `value` antes do submit
 * - Seletor de imagem opcional via `wp.media` e contador de recomendação em tempo real
 */
(function () {
  'use strict';

  var qList = document.getElementById('tgq-questions-list');
  var rList = document.getElementById('tgq-results-list');
  if (!qList || !rList) return;

  var qTpl = document.getElementById('tgq-question-tpl');
  var oTpl = document.getElementById('tgq-option-tpl');
  var rTpl = document.getElementById('tgq-result-tpl');
  var addQBtn = document.getElementById('tgq-add-question');
  var addRBtn = document.getElementById('tgq-add-result');
  var postForm = document.getElementById('post');

  var MAX_QUESTIONS = 15;
  var MIN_QUESTIONS = 3;
  var MAX_OPTIONS = 5;
  var MIN_OPTIONS = 2;
  var MAX_RESULTS = 6;
  var MIN_RESULTS = 1;

  function qa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function cloneTemplate(tpl) {
    if (!tpl || !tpl.content || !tpl.content.firstElementChild) return null;
    return tpl.content.firstElementChild.cloneNode(true);
  }

  function updateCounterUi(total) {
    var box = document.getElementById('tgq-question-counter-box');
    var txt = document.getElementById('tgq-question-counter-text');
    var warn = document.getElementById('tgq-question-counter-warn');
    if (txt) txt.textContent = 'Perguntas cadastradas: ' + total + ' de ' + MAX_QUESTIONS;
    if (box) {
      var ideal = total >= 5 && total <= 8;
      box.classList.toggle('is-ok', ideal);
      box.classList.toggle('is-warn', !ideal);
    }
    if (warn) {
      if (total < MIN_QUESTIONS) {
        warn.textContent = 'Abaixo do mínimo obrigatório (3 perguntas).';
      } else if (total < 5 || total > 8) {
        warn.textContent = 'Fora da faixa recomendada de 5 a 8 perguntas.';
      } else {
        warn.textContent = 'Quantidade ideal para retenção.';
      }
    }
  }

  function reindexAll() {
    var questions = qa('[data-tgq-question]', qList);

    // Captura quais radios estão marcados ANTES de renomear grupos para nunca perder seleção
    var checkedByQuestion = questions.map(function (qCard) {
      var opts = qa('[data-tgq-option]', qCard);
      for (var i = 0; i < opts.length; i++) {
        var r = opts[i].querySelector('[data-tgq-correct]');
        if (r && r.checked) return i;
      }
      return -1;
    });

    questions.forEach(function (qCard, qi) {
      var heading = qCard.querySelector('[data-tgq-question-heading]');
      if (heading) heading.textContent = 'Pergunta #' + (qi + 1);

      var upQ = qCard.querySelector('[data-tgq-move-question="-1"]');
      var dnQ = qCard.querySelector('[data-tgq-move-question="1"]');
      var rmQ = qCard.querySelector('[data-tgq-remove-question]');
      if (upQ) upQ.disabled = qi === 0;
      if (dnQ) dnQ.disabled = qi === questions.length - 1;
      if (rmQ) rmQ.disabled = questions.length <= 1;

      var textInput = qCard.querySelector('[data-tgq-field="text"]');
      if (textInput) textInput.name = 'tg_quiz[questions][' + qi + '][text]';

      var imgInput = qCard.querySelector('[data-tgq-field="image_id"]');
      if (imgInput) imgInput.name = 'tg_quiz[questions][' + qi + '][image_id]';

      var expInput = qCard.querySelector('[data-tgq-field="explanation"]');
      if (expInput) expInput.name = 'tg_quiz[questions][' + qi + '][explanation]';

      var opts = qa('[data-tgq-option]', qCard);
      opts.forEach(function (oRow, oi) {
        var radio = oRow.querySelector('[data-tgq-correct]');
        if (radio) {
          radio.name = 'tg_quiz[questions][' + qi + '][correct]';
          radio.value = String(oi);
        }
        var lbl = oRow.querySelector('[data-tgq-opt-label]');
        if (lbl) lbl.name = 'tg_quiz[questions][' + qi + '][options][' + oi + '][label]';

        var upO = oRow.querySelector('[data-tgq-move-option="-1"]');
        var dnO = oRow.querySelector('[data-tgq-move-option="1"]');
        var rmO = oRow.querySelector('[data-tgq-remove-option]');
        if (upO) upO.disabled = oi === 0;
        if (dnO) dnO.disabled = oi === opts.length - 1;
        if (rmO) rmO.disabled = opts.length <= MIN_OPTIONS;
      });

      var addOptBtn = qCard.querySelector('[data-tgq-add-option]');
      if (addOptBtn) addOptBtn.disabled = opts.length >= MAX_OPTIONS;
    });

    // Restaura exatamente a opção correta marcada após todos os `name` estarem exclusivos
    questions.forEach(function (qCard, qi) {
      var targetIdx = checkedByQuestion[qi];
      var opts = qa('[data-tgq-option]', qCard);
      opts.forEach(function (oRow, oi) {
        var radio = oRow.querySelector('[data-tgq-correct]');
        if (radio) radio.checked = oi === targetIdx;
      });
    });

    if (addQBtn) addQBtn.disabled = questions.length >= MAX_QUESTIONS;
    updateCounterUi(questions.length);

    var results = qa('[data-tgq-result]', rList);
    results.forEach(function (rCard, ri) {
      var rHead = rCard.querySelector('[data-tgq-result-heading]');
      if (rHead) rHead.textContent = 'Faixa #' + (ri + 1);

      var rmR = rCard.querySelector('[data-tgq-remove-result]');
      if (rmR) rmR.disabled = results.length <= MIN_RESULTS;

      var minInput = rCard.querySelector('[data-tgq-field="min_pct"]');
      if (minInput) minInput.name = 'tg_quiz[results][' + ri + '][min_pct]';

      var titInput = rCard.querySelector('[data-tgq-field="title"]');
      if (titInput) titInput.name = 'tg_quiz[results][' + ri + '][title]';

      var descInput = rCard.querySelector('[data-tgq-field="description"]');
      if (descInput) descInput.name = 'tg_quiz[results][' + ri + '][description]';

      var rImgInput = rCard.querySelector('[data-tgq-field="image_id"]');
      if (rImgInput) rImgInput.name = 'tg_quiz[results][' + ri + '][image_id]';
    });

    if (addRBtn) addRBtn.disabled = results.length >= MAX_RESULTS;
  }

  function moveElement(el, dir, selector, focusSel) {
    if (!el || !el.parentNode) return;
    var siblings = qa(selector, el.parentNode);
    var idx = siblings.indexOf(el);
    var targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= siblings.length) return;

    if (dir < 0) {
      el.parentNode.insertBefore(el, siblings[targetIdx]);
    } else {
      el.parentNode.insertBefore(el, siblings[targetIdx].nextSibling);
    }
    reindexAll();
    var focusBtn = focusSel ? el.querySelector(focusSel) : null;
    if (focusBtn && !focusBtn.disabled) {
      focusBtn.focus();
    } else {
      var fallback = el.querySelector('input[type="text"], button:not([disabled])');
      if (fallback) fallback.focus();
    }
  }

  function openMediaPicker(mediaBox) {
    if (!window.wp || !window.wp.media) return;
    var frame = window.wp.media({
      title: 'Selecionar imagem do quiz',
      button: { text: 'Usar esta imagem' },
      library: { type: 'image' },
      multiple: false
    });
    frame.on('select', function () {
      var att = frame.state().get('selection').first();
      if (!att) return;
      var json = att.toJSON();
      var idInput = mediaBox.querySelector('[data-tgq-field="image_id"]');
      var preview = mediaBox.querySelector('[data-tgq-media-preview]');
      var removeBtn = mediaBox.querySelector('[data-tgq-media-remove]');
      var thumbUrl = (json.sizes && json.sizes.thumbnail && json.sizes.thumbnail.url) || json.url || '';
      if (idInput) idInput.value = String(json.id || 0);
      if (preview && thumbUrl) {
        preview.src = thumbUrl;
        preview.hidden = false;
      }
      if (removeBtn) removeBtn.hidden = false;
    });
    frame.open();
  }

  function clearMediaPicker(mediaBox) {
    var idInput = mediaBox.querySelector('[data-tgq-field="image_id"]');
    var preview = mediaBox.querySelector('[data-tgq-media-preview]');
    var removeBtn = mediaBox.querySelector('[data-tgq-media-remove]');
    if (idInput) idInput.value = '0';
    if (preview) {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
    if (removeBtn) removeBtn.hidden = true;
  }

  if (addQBtn) {
    addQBtn.addEventListener('click', function () {
      if (qa('[data-tgq-question]', qList).length >= MAX_QUESTIONS) return;
      var node = cloneTemplate(qTpl);
      if (!node) return;
      qList.appendChild(node);
      reindexAll();
      var input = node.querySelector('[data-tgq-field="text"]');
      if (input) input.focus();
    });
  }

  if (addRBtn) {
    addRBtn.addEventListener('click', function () {
      if (qa('[data-tgq-result]', rList).length >= MAX_RESULTS) return;
      var node = cloneTemplate(rTpl);
      if (!node) return;
      rList.appendChild(node);
      reindexAll();
      var input = node.querySelector('[data-tgq-field="min_pct"]');
      if (input) input.focus();
    });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;

    var copyBtn = t.closest('[data-tgq-copy-shortcode]');
    if (copyBtn) {
      ev.preventDefault();
      var code = copyBtn.getAttribute('data-tgq-copy-shortcode') || '';
      var orig = copyBtn.textContent;
      var done = function () {
        copyBtn.textContent = 'Copiado!';
        setTimeout(function () { copyBtn.textContent = orig; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(done);
      } else {
        var inp = document.getElementById('tg-quiz-shortcode-input');
        if (inp) { inp.select(); try { document.execCommand('copy'); } catch (_e) {} }
        done();
      }
      return;
    }

    var moveQ = t.closest('[data-tgq-move-question]');
    if (moveQ) {
      ev.preventDefault();
      var dirQ = parseInt(moveQ.getAttribute('data-tgq-move-question') || '0', 10);
      moveElement(moveQ.closest('[data-tgq-question]'), dirQ, '[data-tgq-question]', '[data-tgq-move-question="' + dirQ + '"]');
      return;
    }

    var rmQ = t.closest('[data-tgq-remove-question]');
    if (rmQ) {
      ev.preventDefault();
      if (qa('[data-tgq-question]', qList).length <= 1) return;
      var qCard = rmQ.closest('[data-tgq-question]');
      if (qCard) {
        qCard.remove();
        reindexAll();
      }
      return;
    }

    var addOpt = t.closest('[data-tgq-add-option]');
    if (addOpt) {
      ev.preventDefault();
      var qParent = addOpt.closest('[data-tgq-question]');
      var optContainer = qParent ? qParent.querySelector('[data-tgq-options-list]') : null;
      if (!optContainer || qa('[data-tgq-option]', optContainer).length >= MAX_OPTIONS) return;
      var optNode = cloneTemplate(oTpl);
      if (optNode) {
        optContainer.appendChild(optNode);
        reindexAll();
        var optInput = optNode.querySelector('[data-tgq-opt-label]');
        if (optInput) optInput.focus();
      }
      return;
    }

    var moveOpt = t.closest('[data-tgq-move-option]');
    if (moveOpt) {
      ev.preventDefault();
      var dirO = parseInt(moveOpt.getAttribute('data-tgq-move-option') || '0', 10);
      moveElement(moveOpt.closest('[data-tgq-option]'), dirO, '[data-tgq-option]', '[data-tgq-move-option="' + dirO + '"]');
      return;
    }

    var rmOpt = t.closest('[data-tgq-remove-option]');
    if (rmOpt) {
      ev.preventDefault();
      var oRow = rmOpt.closest('[data-tgq-option]');
      var oParent = oRow ? oRow.parentNode : null;
      if (!oParent || qa('[data-tgq-option]', oParent).length <= MIN_OPTIONS) return;
      oRow.remove();
      reindexAll();
      return;
    }

    var rmRes = t.closest('[data-tgq-remove-result]');
    if (rmRes) {
      ev.preventDefault();
      if (qa('[data-tgq-result]', rList).length <= MIN_RESULTS) return;
      var rCard = rmRes.closest('[data-tgq-result]');
      if (rCard) {
        rCard.remove();
        reindexAll();
      }
      return;
    }

    var selMedia = t.closest('[data-tgq-media-select]');
    if (selMedia) {
      ev.preventDefault();
      var mBox = selMedia.closest('[data-tgq-media]');
      if (mBox) openMediaPicker(mBox);
      return;
    }

    var remMedia = t.closest('[data-tgq-media-remove]');
    if (remMedia) {
      ev.preventDefault();
      var rmBox = remMedia.closest('[data-tgq-media]');
      if (rmBox) clearMediaPicker(rmBox);
    }
  });

  if (postForm) {
    postForm.addEventListener('submit', function () {
      reindexAll();
    });
  }

  reindexAll();
})();
