/* ================= Extension 18 : interface (barre unique, en-tête, repères, accessibilité, accueil) ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const LS = k => { try { return safeLS.getItem(k); } catch (e) { return null; } };
  const LSset = (k, v) => { try { safeLS.setItem(k, v); } catch (e) {} };

  /* ---------- 1. Une seule barre de navigation par écran ---------- */
  document.querySelectorAll('.hub-bar').forEach(hb => {
    const holder = hb.parentElement; if (!holder) return;
    const sub = holder.querySelector(':scope > .rg-tabs'); if (!sub) return;
    const wrap = document.createElement('div'); wrap.className = 'hub-sub'; wrap.appendChild(sub);
    hb.appendChild(wrap);
  });

  /* ---------- 2. Notifications : jamais plus de deux, sans doublon ---------- */
  const _toast = showToast;
  showToast = function (m, t) {
    const c = $('toast-container');
    if (c) { Array.from(c.children).forEach(ch => { if (ch.textContent.trim() === String(m).trim()) ch.remove(); }); while (c.children.length >= 2) c.firstChild.remove(); }
    return _toast(m, t);
  };

  /* ---------- 3. Dossier en cours dans l'en-tête, bouton Repères ---------- */
  const actions = $('datecalc-toggle') && $('datecalc-toggle').parentElement;
  function movePill() { const pill = $('fp-pill'); if (actions && pill && pill.parentElement !== actions) actions.insertBefore(pill, actions.firstChild); }
  movePill(); document.addEventListener('DOMContentLoaded', movePill); setTimeout(movePill, 600);
  const KEY = [
    ['Ouverture de droits', [['Affiliation', '130 jours ou 910 heures sur 24 mois (36 mois à 55 ans et plus)'], ['Saisonniers et primo-entrants', '108 jours ou 758 heures (fins de contrat dès le 01/04/2026)'], ['Démission non légitime', '65 jours ou 455 heures travaillés, ou réexamen après 121 jours de chômage non indemnisé'], ['Démission pour projet professionnel', '1 300 jours sur 60 mois, inscription sous 6 mois, contrôle à 6 mois'], ['Forclusion', '12 mois après la fin du contrat']]],
    ['Allocation', [['ARE minimale et maximale', '32,13 € et 300,21 € par jour'], ['Formule', '40,4 % du SJR + 13,18 € ou 57 % du SJR, plafond 75 % du SJR'], ['Dégressivité', '−30 % à partir du 7e mois, moins de 55 ans, allocation supérieure à 92,57 €'], ['Durées maximales', '548 j, 685 j (55-56 ans), 822 j (57 ans et plus), minimum 182 j'], ['Rupture conventionnelle', '456 j et 624 j (fin de contrat dès le 01/09/2026)']]],
    ['Différés', [['Délai d’attente', '7 jours'], ['Congés payés', 'plafonné à 30 jours'], ['Supra-légal', 'indemnité ÷ 111,8, plafonné à 150 jours (75 jours éco)']]],
    ['Cumul et autres', [['Cumul avec un salaire', '70 % du salaire brut'], ['CSP', 'ASP à 75 %, minimum 22,99 €'], ['ASS', '19,48 € par jour, plafond de ressources 1 363,60 € (seul) et 2 142,80 € (couple)'], ['Retenues sociales', 'retraite complémentaire 3 % du SJR, CSG 6,2 %, CRDS 0,5 %']]]
  ];
  const A11 = (() => { try { return Object.assign({ ts: 0, hc: false }, JSON.parse(LS('ft_a11y') || '{}')); } catch (e) { return { ts: 0, hc: false }; } })();
  function applyA11() {
    const h = document.documentElement;
    h.classList.toggle('ts-1', A11.ts === 1); h.classList.toggle('ts-2', A11.ts === 2); h.classList.toggle('hc', !!A11.hc);
    LSset('ft_a11y', JSON.stringify(A11));
  }
  applyA11();
  window.ftA11y = (k, v) => { A11[k] = v; applyA11(); rpRender(); try { document.dispatchEvent(new Event('ft-a11y')); } catch (e) {} };
  window.__ftA11y = () => Object.assign({}, A11);

  const btn = document.createElement('button');
  btn.id = 'rp-btn'; btn.type = 'button'; btn.title = 'Aide-mémo : seuils et montants clés (?)'; btn.setAttribute('onclick', 'ftRpToggle()'); btn.textContent = 'Aide-mémo';
  if (actions) actions.insertBefore(btn, actions.firstChild);
  const dr = document.createElement('div'); dr.setAttribute('role', 'dialog'); dr.id = 'rp-drawer'; dr.className = 'hidden'; dr.setAttribute('aria-label', 'Aide-mémo'); dr.setAttribute('aria-modal', 'true');
  document.body.appendChild(dr);
  function rpRender() {
    const on = (k, v) => A11[k] === v ? ' is-on' : '';
    dr.innerHTML = '<div class="rp-head"><h3>Aide-mémo</h3><button type="button" onclick="ftRpToggle(false)" aria-label="Fermer">Fermer</button></div>' +
      KEY.map((g, gi) => '<section class="rp-sec"><h4>' + esc(g[0]) + '</h4><dl>' + g[1].map(r => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('') + '</dl><button type="button" class="rp-copy" onclick="ftRpCopy(' + gi + ')">Copier ce groupe</button></section>').join('') +
      '<p class="rp-foot">Valeurs du barème vérifié le ' + esc(typeof BAREME !== 'undefined' ? BAREME.verifie : '') + ', détail et sources dans « Références et calculs ».</p>';
  }
  window.ftRpCopy = gi => { const g = KEY[gi]; copyToClipboard(g[0] + '\n' + g[1].map(r => '- ' + r[0] + ' : ' + r[1]).join('\n')); showToast('Repères copiés', 'success'); };
  const scrim = document.createElement('div'); scrim.id = 'rp-scrim'; scrim.hidden = true; scrim.addEventListener('click', () => ftRpToggle(false)); document.body.appendChild(scrim);
  window.ftRpToggle = v => { const open = v == null ? dr.classList.contains('hidden') : v; if (open) rpRender(); dr.classList.toggle('hidden', !open); scrim.hidden = !open; };
  window.addEventListener('keydown', e => {
    const f = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (e.key === '?' && !f && !e.ctrlKey && !e.metaKey) { e.preventDefault(); ftRpToggle(); }
    if (e.key === 'Escape') ftRpToggle(false);
  });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push(
    { t: 'Aide-mémo', s: 'Seuils et montants clés à copier (touche ?)', kw: 'aide mémo mémoire seuils repères montants', run: () => ftRpToggle(true) },
    { t: 'Texte plus grand', s: 'Agrandir l’affichage', kw: 'taille texte police zoom', run: () => ftA11y('ts', Math.min(2, A11.ts + 1)) },
    { t: 'Contraste renforcé', s: 'Activer ou couper', kw: 'contraste lisibilité', run: () => ftA11y('hc', !A11.hc) }
  );

  /* ---------- 4. Accueil : dossier en cours, derniers outils, repères ---------- */
  function homeExtra() {
    const main = $('home-main'); if (!main || main.querySelector('.hm-extra')) return;
    const q = (($('home-search') || {}).value || '').trim(); if (q) return;
    const prof = window.__ftProfile ? window.__ftProfile() : null;
    let use = {}; try { use = JSON.parse(LS('ft_tool_use') || '{}') || {}; } catch (e) {}
    const tools = NAV_TABS_CONFIG.filter(t => use[String(t.id)] && String(t.id).indexOf('hub:') !== 0 && t.id !== 'home' && t.id !== 'cvm').sort((a, b) => use[String(b.id)] - use[String(a.id)]).slice(0, 5);
    const d = document.createElement('section'); d.className = 'hm-extra';
    let h = '';
    if (prof) {
      const ok = !/^NON/i.test(prof.sn.verdict);
      h += '<div class="hm-card"><h3>Dossier en cours' + (prof.a.ref ? ' · ' + esc(prof.a.ref) : '') + '</h3><p>' + esc(prof.sn.verdict) + (ok && prof.aj ? ' · ' + prof.aj.toFixed(2).replace('.', ',') + ' € / jour' : '') + (prof.premier ? ' · 1er jour indemnisable ' + esc(prof.premier) : '') + '</p><div class="hm-btns"><button type="button" onclick="ftFpCopy()">Copier la fiche</button><button type="button" onclick="ftFpSim()">Rouvrir le simulateur</button></div></div>';
    }
    if (tools.length) h += '<div class="hm-card"><h3>Derniers outils</h3><div class="hm-chips">' + tools.map(t => '<button type="button" onclick="switchNavTab(\'' + t.id + '\')">' + esc(t.name) + '</button>').join('') + '</div></div>';
    h += '<div class="hm-card"><h3>Repères</h3><div class="hm-key"><div><strong>130 j / 910 h</strong><span>affiliation</span></div><div><strong>65 j / 455 h</strong><span>après démission</span></div><div><strong>121 jours</strong><span>réexamen démission</span></div><div><strong>32,13 à 300,21 €</strong><span>ARE par jour</span></div><div><strong>456 / 624 j</strong><span>rupture conventionnelle</span></div><div><strong>7 jours</strong><span>délai d’attente</span></div></div><div class="hm-btns"><button type="button" onclick="ftRpToggle(true)">Tous les repères</button></div></div>';
    d.innerHTML = h; if (main.children.length > 1) main.insertBefore(d, main.children[1]); else main.appendChild(d);
  }
  const _rh = renderHome;
  renderHome = function (q) { const r = _rh(q); try { homeExtra(); } catch (e) {} return r; };
  try { homeExtra(); } catch (e) {}

  /* ---------- 5. Bandeau de résultat du simulateur sur petit écran ---------- */
  const od = $('view-od');
  if (od) {
    const bar = document.createElement('div'); bar.className = 'vbar'; bar.setAttribute('aria-live', 'polite');
    od.appendChild(bar);
    const sync = () => {
      const t = ($('sim-verdict-title') || {}).textContent || '', a = ($('calc-are-jour') || {}).textContent || '';
      bar.textContent = (t.trim() + (a && a.trim() !== '—' && !/^NON/i.test(t.trim()) ? ' · ' + a.trim() + ' / jour' : '')).trim();
      bar.classList.toggle('is-ko', /^NON/i.test(t.trim()));
    };
    ['sim-verdict-title', 'calc-are-jour'].forEach(id => { const el = $(id); if (el) new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true }); });
    sync();
  }
})();
