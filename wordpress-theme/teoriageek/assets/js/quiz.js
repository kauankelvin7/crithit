/**
 * Teoria Geek — Motor Front-end Acessível de Quizzes (Trivia MVP · v2.13.0).
 *
 * ES2017 puro, sem dependências externas. Constrói toda a interface via `document.createElement`
 * e `textContent`, com instâncias 100% isoladas por container `[data-tg-quiz]`.
 */
(function () {
	'use strict';

	var memoryFallbackStore = {};
	var instanceCounter = 0;

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (typeof text === 'string') {
			node.textContent = text;
		}
		return node;
	}

	function clearChildren(node) {
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}
	}

	function buildQuizRestUrl(restBase, quizId, action) {
		var base = String(restBase || '');
		var suffix = encodeURIComponent(String(quizId)) + '/' + action;
		if (!base) {
			return '/wp-json/teoriageek/v1/quizzes/' + suffix;
		}
		var qPos = base.indexOf('?');
		if (qPos !== -1) {
			var pathPart = base.slice(0, qPos);
			var queryPart = base.slice(qPos + 1);
			var params = queryPart.split('&');
			for (var i = 0; i < params.length; i += 1) {
				if (params[i].indexOf('rest_route=') === 0) {
					var routeVal = decodeURIComponent(params[i].slice('rest_route='.length));
					if (routeVal.slice(-1) !== '/') {
						routeVal += '/';
					}
					params[i] = 'rest_route=' + encodeURIComponent(routeVal + suffix);
					return pathPart + '?' + params.join('&');
				}
			}
		}
		if (base.slice(-1) !== '/') {
			base += '/';
		}
		return base + suffix;
	}

	function readStoredState(storageKey, version) {
		var fresh = {
			v: version,
			started: false,
			counted: false,
			completed: false,
			answers: []
		};
		var raw = null;
		try {
			raw = window.localStorage.getItem(storageKey);
		} catch (err) {
			raw = Object.prototype.hasOwnProperty.call(memoryFallbackStore, storageKey)
				? memoryFallbackStore[storageKey]
				: null;
		}
		if (!raw) {
			return fresh;
		}
		try {
			var parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== 'object' || String(parsed.v || '') !== String(version)) {
				writeStoredState(storageKey, fresh);
				return fresh;
			}
			return {
				v: version,
				started: Boolean(parsed.started),
				counted: Boolean(parsed.counted),
				completed: Boolean(parsed.completed),
				answers: Array.isArray(parsed.answers) ? parsed.answers.slice() : []
			};
		} catch (err2) {
			return fresh;
		}
	}

	function writeStoredState(storageKey, stateObj) {
		var serialized = JSON.stringify(stateObj);
		memoryFallbackStore[storageKey] = serialized;
		try {
			window.localStorage.setItem(storageKey, serialized);
		} catch (err) {
			// Fallback silencioso em memória quando localStorage está bloqueado ou cheio.
		}
	}

	function copyTextFallback(text) {
		if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
			return navigator.clipboard.writeText(text).then(
				function () {
					return true;
				},
				function () {
					return legacyExecCopy(text);
				}
			);
		}
		return Promise.resolve(legacyExecCopy(text));
	}

	function legacyExecCopy(text) {
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', 'readonly');
		ta.style.position = 'fixed';
		ta.style.top = '-9999px';
		ta.style.left = '-9999px';
		document.body.appendChild(ta);
		ta.select();
		var ok = false;
		try {
			ok = document.execCommand('copy');
		} catch (err) {
			ok = false;
		}
		document.body.removeChild(ta);
		return ok;
	}

	function formatSocialProof(count) {
		var formatted = Number(count || 0).toLocaleString('pt-BR');
		return formatted + ' leitores já completaram este quiz';
	}

	function initQuizInstance(root) {
		if (!root || root.getAttribute('data-tg-quiz-ready') === '1') {
			return;
		}
		root.setAttribute('data-tg-quiz-ready', '1');

		var dataScript = root.querySelector('script.tg-quiz-data');
		var mountEl = root.querySelector('[data-tg-quiz-mount]');
		var liveEl = root.querySelector('[data-tg-quiz-live]');
		var afterEl = root.querySelector('[data-tg-quiz-after]');
		if (!dataScript || !mountEl) {
			return;
		}

		var payload = null;
		try {
			payload = JSON.parse(dataScript.textContent || '');
		} catch (err) {
			return;
		}
		if (!payload || !Array.isArray(payload.questions) || !Array.isArray(payload.results)) {
			return;
		}

		var questions = payload.questions.slice(0, 15).filter(function (q) {
			return (
				q &&
				typeof q.text === 'string' &&
				q.text.length > 0 &&
				Array.isArray(q.options) &&
				q.options.length >= 2 &&
				typeof q.correct === 'number' &&
				q.correct >= 0 &&
				q.correct < q.options.length
			);
		});
		var results = payload.results
			.slice(0, 6)
			.filter(function (r) {
				return r && typeof r.title === 'string' && r.title.length > 0;
			})
			.sort(function (a, b) {
				return Number(b.min_pct || 0) - Number(a.min_pct || 0);
			});

		if (questions.length < 3 || results.length < 1) {
			return;
		}

		instanceCounter += 1;
		var instanceUid = instanceCounter;
		var quizId = Number(payload.id || root.getAttribute('data-tg-quiz-id') || 0);
		var version = String(payload.version || root.getAttribute('data-version') || '1');
		var restBase = String(payload.restBase || root.getAttribute('data-rest') || '');
		var quizTitle = String(payload.title || '');
		var quizUrl = String(payload.url || '');
		var mode = String(root.getAttribute('data-tg-quiz-mode') || 'single');
		var playsCount = Math.max(0, Number(payload.plays || 0));
		var storageKey = 'tg_quiz_state_' + String(quizId);

		var state = readStoredState(storageKey, version);
		var currentIndex = 0;
		var answers = [];

		function announce(message) {
			if (!liveEl) {
				return;
			}
			liveEl.textContent = '';
			window.setTimeout(function () {
				liveEl.textContent = message;
			}, 20);
		}

		function postCounter(action) {
			if (!quizId || typeof window.fetch !== 'function') {
				return Promise.resolve(null);
			}
			var endpoint = buildQuizRestUrl(restBase, quizId, action);
			return window
				.fetch(endpoint, {
					method: 'POST',
					keepalive: true,
					credentials: 'same-origin',
					headers: {
						Accept: 'application/json'
					}
				})
				.then(function (res) {
					if (!res || !res.ok) {
						return null;
					}
					return res.json().catch(function () {
						return null;
					});
				})
				.catch(function () {
					return null;
				});
		}

		function resolveResultBand(pct) {
			for (var i = 0; i < results.length; i += 1) {
				if (pct >= Number(results[i].min_pct || 0)) {
					return results[i];
				}
			}
			return results[results.length - 1];
		}

		function setRecirculationVisible(visible) {
			if (!afterEl) {
				return;
			}
			if (visible && afterEl.children.length > 0) {
				afterEl.hidden = false;
			} else {
				afterEl.hidden = true;
			}
		}

		function renderQuestion(qIdx, shouldFocusQuestion) {
			var q = questions[qIdx];
			var total = questions.length;
			var locked = false;

			setRecirculationVisible(false);
			clearChildren(mountEl);

			var card = el('div', 'tg-quiz__step');

			var topRow = el('div', 'tg-quiz__top');
			var stepCounter = el('span', 'tg-quiz__step-label', 'Pergunta ' + String(qIdx + 1) + ' de ' + String(total));
			topRow.appendChild(stepCounter);

			var progress = el('div', 'tg-quiz__progress');
			progress.setAttribute('role', 'progressbar');
			progress.setAttribute('aria-label', 'Progresso do quiz');
			progress.setAttribute('aria-valuemin', '1');
			progress.setAttribute('aria-valuemax', String(total));
			progress.setAttribute('aria-valuenow', String(qIdx + 1));

			var progressBar = el('div', 'tg-quiz__progress-bar');
			progressBar.style.width = String(((qIdx + 1) / total) * 100) + '%';
			progress.appendChild(progressBar);
			topRow.appendChild(progress);
			card.appendChild(topRow);

			var fieldset = el('fieldset', 'tg-quiz__fieldset');
			var legend = el('legend', 'tg-quiz__question', q.text);
			legend.setAttribute('tabindex', '-1');
			fieldset.appendChild(legend);

			if (q.image && typeof q.image.url === 'string' && q.image.url.length > 0) {
				var fig = el('figure', 'tg-quiz__media');
				var img = document.createElement('img');
				img.className = 'tg-quiz__img';
				img.src = q.image.url;
				img.alt = typeof q.image.alt === 'string' ? q.image.alt : '';
				if (q.image.w) {
					img.width = Number(q.image.w);
				}
				if (q.image.h) {
					img.height = Number(q.image.h);
				}
				img.loading = 'lazy';
				img.decoding = 'async';
				fig.appendChild(img);
				fieldset.appendChild(fig);
			}

			var optionsWrap = el('div', 'tg-quiz__options');
			var optionRows = [];
			var radios = [];
			var opts = q.options.slice(0, 5);
			var radioGroupName = 'tg_quiz_' + String(instanceUid) + '_q_' + String(qIdx);

			function chooseOption(chosenIdx) {
				if (locked) {
					return;
				}
				locked = true;
				answers[qIdx] = chosenIdx;

				if (qIdx === 0 && !state.started) {
					state.started = true;
					writeStoredState(storageKey, state);
					postCounter('start');
				}

				var correctIdx = q.correct;
				var isHit = chosenIdx === correctIdx;

				for (var j = 0; j < optionRows.length; j += 1) {
					var rowObj = optionRows[j];
					rowObj.radio.disabled = true;
					rowObj.radio.checked = j === chosenIdx;

					if (j === correctIdx) {
						rowObj.label.classList.add('is-correct');
						rowObj.status.textContent = '\u2713 Correta';
						rowObj.status.hidden = false;
					} else if (j === chosenIdx) {
						rowObj.label.classList.add('is-wrong');
						rowObj.status.textContent = '\u2717 Incorreta';
						rowObj.status.hidden = false;
					} else {
						rowObj.label.classList.add('is-muted');
					}
				}

				if (isHit) {
					announce('Correta!');
				} else {
					var rightLabel = opts[correctIdx] ? opts[correctIdx].label : '';
					announce('Incorreta. A resposta certa é: ' + rightLabel);
				}

				var feedbackWrap = el('div', 'tg-quiz__feedback');
				if (typeof q.explanation === 'string' && q.explanation.length > 0) {
					var expP = el('p', 'tg-quiz__explanation', q.explanation);
					feedbackWrap.appendChild(expP);
				}

				var isLast = qIdx >= total - 1;
				var nextBtn = el(
					'button',
					'tg-quiz__btn tg-quiz__btn--primary tg-quiz__next-btn',
					isLast ? 'Ver resultado' : 'Próxima pergunta'
				);
				nextBtn.type = 'button';
				nextBtn.addEventListener('click', function () {
					if (isLast) {
						completeQuiz(false);
					} else {
						currentIndex = qIdx + 1;
						renderQuestion(currentIndex, true);
					}
				});

				feedbackWrap.appendChild(nextBtn);
				card.appendChild(feedbackWrap);
				nextBtn.focus();
			}

			opts.forEach(function (opt, optIdx) {
				var optLabel = el('label', 'tg-quiz__option');
				var radio = document.createElement('input');
				radio.type = 'radio';
				radio.className = 'tg-quiz__radio';
				radio.name = radioGroupName;
				radio.value = String(optIdx);

				var marker = el('span', 'tg-quiz__option-marker');
				marker.setAttribute('aria-hidden', 'true');

				var textSpan = el('span', 'tg-quiz__option-text', String(opt.label || ''));
				var statusSpan = el('span', 'tg-quiz__option-status');
				statusSpan.hidden = true;

				radio.addEventListener('keydown', function (ev) {
					if (locked) {
						return;
					}
					if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
						ev.preventDefault();
						var nextIdx = (optIdx + 1) % radios.length;
						radios[nextIdx].focus();
					} else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
						ev.preventDefault();
						var prevIdx = (optIdx - 1 + radios.length) % radios.length;
						radios[prevIdx].focus();
					} else if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
						ev.preventDefault();
						radio.checked = true;
						chooseOption(optIdx);
					}
				});

				radio.addEventListener('change', function () {
					chooseOption(optIdx);
				});

				optLabel.appendChild(radio);
				optLabel.appendChild(marker);
				optLabel.appendChild(textSpan);
				optLabel.appendChild(statusSpan);
				optionsWrap.appendChild(optLabel);

				radios.push(radio);
				optionRows.push({
					label: optLabel,
					radio: radio,
					status: statusSpan
				});
			});

			fieldset.appendChild(optionsWrap);
			card.appendChild(fieldset);
			mountEl.appendChild(card);

			if (shouldFocusQuestion) {
				legend.focus();
			}
		}

		function completeQuiz(restoredFromReload) {
			var total = questions.length;
			var hits = 0;
			for (var i = 0; i < total; i += 1) {
				if (typeof answers[i] === 'number' && answers[i] === questions[i].correct) {
					hits += 1;
				}
			}

			// Cálculo exato sem arredondamento: pct = acertos / total * 100.
			var pct = (hits / total) * 100;
			var band = resolveResultBand(pct);

			clearChildren(mountEl);

			var resultWrap = el('div', 'tg-quiz__result');

			var scoreBadge = el(
				'div',
				'tg-quiz__score-pill',
				'Placar: ' + String(hits) + '/' + String(total)
			);
			resultWrap.appendChild(scoreBadge);

			var titleTag = mode === 'embed' ? 'p' : 'h2';
			var resultTitle = el(titleTag, 'tg-quiz__result-title', band.title);
			resultTitle.setAttribute('tabindex', '-1');
			resultWrap.appendChild(resultTitle);

			if (band.image && typeof band.image.url === 'string' && band.image.url.length > 0) {
				var resFig = el('figure', 'tg-quiz__media tg-quiz__result-media');
				var resImg = document.createElement('img');
				resImg.className = 'tg-quiz__img';
				resImg.src = band.image.url;
				resImg.alt = typeof band.image.alt === 'string' ? band.image.alt : '';
				if (band.image.w) {
					resImg.width = Number(band.image.w);
				}
				if (band.image.h) {
					resImg.height = Number(band.image.h);
				}
				resImg.loading = 'lazy';
				resImg.decoding = 'async';
				resFig.appendChild(resImg);
				resultWrap.appendChild(resFig);
			}

			if (typeof band.description === 'string' && band.description.length > 0) {
				var descP = el('p', 'tg-quiz__result-desc', band.description);
				resultWrap.appendChild(descP);
			}

			var socialEl = el('p', 'tg-quiz__social');
			if (playsCount >= 10) {
				socialEl.textContent = formatSocialProof(playsCount);
				socialEl.hidden = false;
			} else {
				socialEl.hidden = true;
			}
			resultWrap.appendChild(socialEl);

			// Compartilhamento usa SEMPRE a URL limpa (permalink) do próprio quiz, nunca a do artigo hospedeiro.
			var shareTextOnly =
				'Acertei ' +
				String(hits) +
				'/' +
				String(total) +
				' no quiz "' +
				quizTitle +
				'" do Teoria Geek! \uD83E\uDDE0';
			var shareFullText = quizUrl ? shareTextOnly + ' ' + quizUrl : shareTextOnly;

			var shareBlock = el('div', 'tg-quiz__share');
			var shareLabel = el('span', 'tg-quiz__share-label', 'Compartilhar resultado:');
			shareBlock.appendChild(shareLabel);

			var shareRow = el('div', 'tg-quiz__share-actions');

			var waLink = el('a', 'tg-quiz__btn tg-quiz__btn--share tg-quiz__btn--wa', 'WhatsApp');
			waLink.href = 'https://wa.me/?text=' + encodeURIComponent(shareFullText);
			waLink.target = '_blank';
			waLink.rel = 'noopener noreferrer';
			shareRow.appendChild(waLink);

			var xLink = el('a', 'tg-quiz__btn tg-quiz__btn--share tg-quiz__btn--x', 'Postar no X');
			xLink.href = 'https://x.com/intent/post?text=' + encodeURIComponent(shareFullText);
			xLink.target = '_blank';
			xLink.rel = 'noopener noreferrer';
			shareRow.appendChild(xLink);

			if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
				var nativeShareBtn = el('button', 'tg-quiz__btn tg-quiz__btn--share', 'Compartilhar');
				nativeShareBtn.type = 'button';
				nativeShareBtn.addEventListener('click', function () {
					var shareData = {
						title: quizTitle,
						text: shareTextOnly
					};
					if (quizUrl) {
						shareData.url = quizUrl;
					}
					navigator.share(shareData).catch(function () {
						// Cancelamento pelo usuário ignorado silenciosamente.
					});
				});
				shareRow.appendChild(nativeShareBtn);
			}

			var copyBtn = el('button', 'tg-quiz__btn tg-quiz__btn--share', 'Copiar texto');
			copyBtn.type = 'button';
			copyBtn.addEventListener('click', function () {
				copyTextFallback(shareFullText).then(function (copied) {
					if (copied) {
						copyBtn.textContent = 'Texto copiado!';
						announce('Resultado copiado para a área de transferência.');
						window.setTimeout(function () {
							copyBtn.textContent = 'Copiar texto';
						}, 2200);
					}
				});
			});
			shareRow.appendChild(copyBtn);

			shareBlock.appendChild(shareRow);
			resultWrap.appendChild(shareBlock);

			var footerActions = el('div', 'tg-quiz__footer');
			var retryBtn = el('button', 'tg-quiz__btn tg-quiz__btn--secondary tg-quiz__retry-btn', 'Refazer quiz');
			retryBtn.type = 'button';
			retryBtn.addEventListener('click', function () {
				// Reinicia apenas a sessão visual sem zerar `started` nem `counted` no mesmo navegador/versão.
				answers = [];
				currentIndex = 0;
				state.completed = false;
				state.answers = [];
				writeStoredState(storageKey, state);
				renderQuestion(0, true);
			});
			footerActions.appendChild(retryBtn);
			resultWrap.appendChild(footerActions);

			mountEl.appendChild(resultWrap);
			setRecirculationVisible(true);

			if (!restoredFromReload) {
				var shouldCount = !state.counted;
				state.completed = true;
				state.counted = true;
				state.answers = answers.slice();
				writeStoredState(storageKey, state);

				resultTitle.focus();

				if (shouldCount) {
					postCounter('complete').then(function (resp) {
						if (resp && typeof resp.plays === 'number' && resp.plays >= 0) {
							playsCount = resp.plays;
							if (playsCount >= 10) {
								socialEl.textContent = formatSocialProof(playsCount);
								socialEl.hidden = false;
							} else {
								socialEl.hidden = true;
							}
						}
					});
				}
			}
		}

		var hasValidSavedCompletion =
			state.completed &&
			Array.isArray(state.answers) &&
			state.answers.length === questions.length &&
			state.answers.every(function (ans, idx) {
				return (
					typeof ans === 'number' &&
					ans >= 0 &&
					ans < questions[idx].options.length
				);
			});

		if (hasValidSavedCompletion) {
			answers = state.answers.slice();
			completeQuiz(true);
		} else {
			renderQuestion(0, false);
		}
	}

	function bootAllQuizzes() {
		var nodes = document.querySelectorAll('[data-tg-quiz]');
		for (var i = 0; i < nodes.length; i += 1) {
			initQuizInstance(nodes[i]);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bootAllQuizzes);
	} else {
		bootAllQuizzes();
	}
})();
