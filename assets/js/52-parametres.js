(function () {
  /* Paramètres : affichage, accessibilité, démarrage, notifications, données et aide,
     réunis dans une seule fenêtre (menu du compte, menu « ⋯ » et recherche). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const KEY = 'ft_prefs';
  const DEF = { themeMode: '', motion: false, easy: false, start: 'home', pal: '' };
  const PALS = [['', 'Océan', '#2563eb', '#22d3ee'], ['emeraude', 'Émeraude', '#059669', '#34d399'], ['sarcelle', 'Sarcelle', '#0d9488', '#2dd4bf'], ['amethyste', 'Améthyste', '#7c3aed', '#c084fc'], ['framboise', 'Framboise', '#db2777', '#f472b6'], ['ardoise', 'Ardoise', '#475569', '#94a3b8']];
  function setPal(p) {
    const h = document.documentElement, old = document.getElementById('ft-pal');
    if (old) old.remove();
    if (p) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.id = 'ft-pal'; l.href = 'assets/css/pal-' + p + '.css?v=' + ((document.querySelector('meta[name="ft-version"]') || {}).content || ''); document.head.appendChild(l); h.setAttribute('data-pal', p); } else h.removeAttribute('data-pal');
  }
  const P = (() => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEF); } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  /* Intensité des néons : 0 = aucun, 50 = réglage d’origine, 100 = très lumineux */

  /* Appareil lent (poste sans carte graphique, bureau à distance…) : on mesure la cadence d’affichage
     quelques secondes après l’ouverture et pendant le premier défilement ; sous ~35 images/s, l’affichage allégé s’active. */
  function apply() {
    const h = document.documentElement;
    h.classList.remove('no-neon'); ['ft-neon-css', 'ft-depth-css'].forEach(id => { const x = document.getElementById(id); if (x) x.remove(); }); /* halos et relief marqués retirés : affichage allégé permanent */
    h.classList.toggle('reduce-motion', !!P.motion);
    h.classList.toggle('easy-read', !!P.easy);
    h.classList.add('ft-lite'); /* affichage allégé appliqué en permanence (fluidité) */
    if ((h.getAttribute('data-pal') || '') !== (P.pal || '')) setPal(P.pal || '');
  }
  /* Thème automatique : selon l’appareil, ou clair en journée et sombre le soir */
  const MQD = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function autoTheme(force) {
    if (!P.themeMode) return;
    const h = new Date().getHours();
    const want = P.themeMode === 'system' ? (MQD && MQD.matches ? 'dark' : 'light') : (h >= 7 && h < 19 ? 'light' : 'dark');
    if (force || theme() !== want) { try { applyTheme(want); } catch (e) {} }
  }
  if (typeof toggleTheme === 'function') { const _tt = toggleTheme; toggleTheme = function () { if (P.themeMode) { P.themeMode = ''; save(); } return _tt.apply(this, arguments); }; }
  if (MQD && MQD.addEventListener) MQD.addEventListener('change', () => autoTheme());
  setInterval(autoTheme, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) autoTheme(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoTheme()); else setTimeout(autoTheme, 0);
  apply();
  window.addEventListener('storage', e => { if (e.key === KEY) { try { Object.assign(P, DEF, JSON.parse(e.newValue || '{}')); apply(); } catch (er) {} } });

  /* Page d’ouverture */
  const tabNow = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  if (typeof switchNavTab === 'function') {
    const _sw = switchNavTab;
    switchNavTab = function (id) { const r = _sw.apply(this, arguments); try { if (id != null && !/^(admin|home)$/.test(String(id))) localStorage.setItem('ft_last_tab', String(id)); } catch (e) {} return r; };
  }
  function startTab() {
    if (window.__ftDeepLink || /[?&](go|tab|t)=/.test(location.search) || location.hash.length > 1 || P.start === 'home') return;
    let t = P.start === 'cvm' ? 'cvm' : (() => { try { return localStorage.getItem('ft_last_tab'); } catch (e) { return null; } })();
    if (!t || tabNow() !== 'home') return;
    try { switchNavTab(/^\d+$/.test(t) ? +t : t); } catch (e) {}
  }
  setTimeout(startTab, 900);

  /* ---------- Fenêtre ---------- */
  const A = () => (window.__ftA11y ? window.__ftA11y() : { ts: 0, hc: false });
  const theme = () => document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
  const seg = (k, cur, list) => '<div class="pm-seg" role="group">' + list.map(([v, l]) => '<button type="button" data-k="' + k + '" data-v="' + esc(v) + '" aria-pressed="' + (String(cur) === String(v)) + '" class="' + (String(cur) === String(v) ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
  const row = (t, s, ctl) => '<div class="pm-row"><div><b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div>' + ctl + '</div>';
  const yn = (k, v) => seg(k, v ? 1 : 0, [[0, 'Non'], [1, 'Oui']]);
  function html() {
    const a = A(), notif = !!(window.ftNotifOn && window.ftNotifOn()), ver = (document.querySelector('meta[name="ft-version"]') || {}).content || '';
    return '<div class="pm-card"><div class="pm-h"><h2 id="pm-t">⚙️ Paramètres</h2><button type="button" class="pm-x" data-pm="x" aria-label="Fermer">×</button></div>' +
      '<section><h3>Affichage</h3>' +
        row('Thème', P.themeMode === 'system' ? 'Suit le réglage de l’appareil' : P.themeMode === 'hours' ? 'Clair de 7 h à 19 h, sombre le soir' : '', seg('theme', P.themeMode || theme(), [['dark', 'Sombre'], ['light', 'Clair'], ['system', 'Auto'], ['hours', 'Horaire']])) +
        '<div class="pm-row pm-col"><div><b>Couleurs</b><span>S’appliquent au thème sombre comme au clair</span></div><div class="pm-pal" role="group" aria-label="Couleurs">' + PALS.map(([v, l, a, b]) => '<button type="button" data-k="pal" data-v="' + v + '" aria-pressed="' + ((P.pal || '') === v) + '" class="' + ((P.pal || '') === v ? 'on' : '') + '"><i style="background:linear-gradient(135deg,' + a + ',' + b + ')"></i>' + l + '</button>').join('') + '</div></div>' +
        row('Taille du texte', '', seg('ts', a.ts, [[0, 'Normal'], [1, 'Grand'], [2, 'Très grand']])) + '</section>' +
      '<section><h3>Accessibilité</h3>' +
        row('Contraste renforcé', 'Textes et bordures plus marqués', yn('hc', a.hc)) +
        row('Lecture facilitée', 'Lettres et lignes plus espacées', yn('easy', P.easy)) +
        row('Réduire les animations', 'Pas d’effets de mouvement ni de fondu', yn('motion', P.motion)) +
        '</section>' +
      '<section><h3>Démarrage</h3>' +
        row('Page à l’ouverture', '', seg('start', P.start, [['home', 'Accueil'], ['cvm', 'Mails'], ['last', 'Dernier outil']])) + '</section>' +
      '<section><h3>Notifications</h3>' +
        row('Sur cet appareil', notif ? 'Activées : nouveautés, annonces et rappels' : 'Désactivées', '<button type="button" class="pm-btn' + (notif ? '' : ' pri') + '" data-pm="notif">' + (notif ? 'Désactiver' : 'Activer') + '</button>') +
        (window.ftReminders ? row('Mes rappels', 'Relances programmées', '<button type="button" class="pm-btn" data-pm="rem">Ouvrir</button>') : '') + '</section>' +
      '<section><h3>Données et aide</h3>' +
        row('Derniers calculs', 'Historique gardé sur ce poste', '<button type="button" class="pm-btn" data-pm="hist">Effacer</button>') +
        row('Mes données', 'Sauvegarder ou restaurer vos modèles et réglages', '<button type="button" class="pm-btn" data-pm="data">Ouvrir</button>') +
        (window.ftLoggedIn && window.ftLoggedIn() ? row('Synchronisation', 'Modèles, favoris et réglages sur tous vos postes', '<button type="button" class="pm-btn" data-pm="sync">Synchroniser</button>') : '') +
        row('Visite guidée', '', '<button type="button" class="pm-btn" data-pm="tour">Revoir</button>') +
        row('Confidentialité', '', '<button type="button" class="pm-btn" data-pm="privacy">Lire</button>') +
        row('Mise à jour', 'Version ' + esc(ver), '<button type="button" class="pm-btn" data-pm="reload">Forcer</button>') + '</section></div>';
  }
  function box() {
    let w = $('ft-prefs');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-prefs'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'pm-t');
      document.body.appendChild(w);
      w.addEventListener('click', onClick);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) close(); });
    }
    return w;
  }
  function close() { const w = $('ft-prefs'); if (w) w.hidden = true; }
  function render() { const w = box(), sc = w.querySelector('.pm-card') ? w.querySelector('.pm-card').scrollTop : 0; w.innerHTML = html(); w.querySelector('.pm-card').scrollTop = sc; }
  window.ftSettings = function () { render(); box().hidden = false; setTimeout(() => { const b = document.querySelector('#ft-prefs .pm-x'); if (b) b.focus(); }, 30); };
  function onClick(e) {
    const w = $('ft-prefs');
    if (e.target === w || e.target.closest('[data-pm="x"]')) return close();
    const s = e.target.closest('[data-k]');
    if (s) {
      const k = s.dataset.k, v = s.dataset.v;
      if (k === 'theme') { P.themeMode = (v === 'system' || v === 'hours') ? v : ''; save(); autoTheme(true); if (!P.themeMode) { try { applyTheme(v); } catch (er) {} } }
      else if (k === 'ts') window.ftA11y && window.ftA11y('ts', +v);
      else if (k === 'hc') window.ftA11y && window.ftA11y('hc', v === '1');
      else { P[k] = (k === 'start' || k === 'pal') ? v : v === '1'; save(); apply(); if (k === 'start' && v !== 'home') toast(v === 'cvm' ? 'Le site s’ouvrira sur la page Mails' : 'Le site s’ouvrira sur le dernier outil utilisé', 'success'); }
      render(); return;
    }
    const b = e.target.closest('[data-pm]'); if (!b) return;
    const a = b.dataset.pm;
    if (a === 'notif') { if (window.ftEnableNotifs) window.ftEnableNotifs(); setTimeout(render, 1500); }
    else if (a === 'rem') { close(); window.ftReminders(); }
    else if (a === 'hist') { if (confirm('Effacer l’historique des derniers calculs de ce poste ?')) { try { localStorage.removeItem('ft_calc_hist'); localStorage.removeItem('ft_calc_vals'); } catch (er) {} toast('Historique effacé', 'success'); try { switchNavTab(tabNow() === 'home' ? 'home' : tabNow()); } catch (er) {} } }
    else if (a === 'data') { close(); const d = $('data-btn') || document.querySelector('[data-k="data"]'); if (d) d.click(); }
    else if (a === 'sync') { if (window.ftSyncNow) window.ftSyncNow(); toast('Synchronisation lancée', 'info'); }
    else if (a === 'tour') { close(); if (window.ftTour) window.ftTour(); }
    else if (a === 'privacy') { close(); if (window.ftPrivacy) window.ftPrivacy(); }
    else if (a === 'reload') { if (window.ftHardReload) window.ftHardReload(); }
  }

  /* Accès : menu du compte, menu « ⋯ », recherche */
  (window.FT_ACCT_ITEMS = window.FT_ACCT_ITEMS || []).unshift({ t: 'Paramètres', run: () => window.ftSettings() });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Paramètres', s: 'Affichage, accessibilité, démarrage, notifications', kw: 'paramètres réglages préférences affichage accessibilité thème clair sombre texte taille contraste animations démarrage néon intensité couleurs', run: () => window.ftSettings() });
  function moreItem() {
    const m = $('ft-more'); if (!m || m.querySelector('[data-k="prefs"]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'prefs';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span>Paramètres</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); setTimeout(() => window.ftSettings(), 30); });
    m.insertBefore(b, m.firstChild);
  }
  if (window.ftOnDom) window.ftOnDom(moreItem);
})();
(function () {
  /* Bouton ⚙ dans l’en-tête (ordinateur), à côté du mode clair / sombre */
  const add = () => {
    const ref = document.getElementById('datecalc-toggle'); if (!ref || document.getElementById('ft-prefs-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-prefs-btn'; b.title = 'Paramètres'; b.setAttribute('aria-label', 'Paramètres');
    b.className = ref.className;
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
    b.onclick = () => window.ftSettings();
    const last = ref.parentElement.lastElementChild; ref.parentElement.insertBefore(b, last && last.id === 'ft-hard-reload' ? last : null);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  setTimeout(add, 1200);
})();
