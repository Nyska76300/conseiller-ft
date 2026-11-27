/* 2026-11-27.2 : style d'interface « Institutionnel » (direction A), en test.
   html.ui-pro : fond gris très clair, cartes blanches, un seul bleu, rubriques en onglets sous l'en-tête.
   Retour à l'ancien style : Paramètres › Style d'interface › Thème classique (clé ft_ui). */
(function () {
  'use strict';
  const H = document.documentElement;
  window.ftSetUi = function (v) { try { localStorage.setItem('ft_ui', v); } catch (e) {} location.reload(); };
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push(
    { t: 'Style institutionnel', s: 'Interface claire et sobre (test)', kw: 'style interface institutionnel professionnel sobre clair', run: () => window.ftSetUi('pro') },
    { t: 'Thème classique', s: 'Revenir à l’apparence d’avant', kw: 'theme classique ancien style apparence sombre retour', run: () => window.ftSetUi('classic') }
  );
  if (!H.classList.contains('ui-pro')) return;

  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SHORT = { 'hub:fin': 'Fin de droits', 'hub:situations': 'Situations', 'hub:calculs': 'Références' };
  const TABS = () => {
    const hubs = window.FT_HUBS || [];
    return [['fav', 'Favoris'], ['cvm', 'Mails']].concat(hubs.map(h => { const n = nameOf(h.id, h.name); return [h.id, n === h.name ? (SHORT[h.id] || n.replace(/\s*:.*$/, '')) : n]; })).concat([['autres', 'Autres']]);
  };
  /* Noms à jour (renommages de l'administrateur compris), comme dans le menu */
  function nameOf(id, fb) { try { const t = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); if (t && t.name) return t.name; } catch (e) {} return fb; }
  function relabel() {
    const T = TABS();
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(b => { const x = T.find(t => t[0] === b.dataset.pt); const sp = b.querySelector('.pt-l'); if (x && sp && sp.textContent !== x[1]) sp.textContent = x[1]; });
  }
  if (typeof window.ftApplyLabels === 'function') { const _l = window.ftApplyLabels; window.ftApplyLabels = function () { const r = _l.apply(this, arguments); try { relabel(); } catch (e) {} return r; }; }
  const cur = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  function activeKey() {
    const t = cur(); if (t.indexOf('hub:') === 0) return t;
    const h = window.ftHubOf ? window.ftHubOf(t) : null;
    if (h) return h.id;
    const sec = [...document.querySelectorAll('#burger-tabs-list > .menu-sec')].find(x => x.querySelector('button[onclick="switchNavTab(\'' + t + '\')"]'));
    if (sec) { const hh = (window.FT_HUBS || []).find(x => sec.querySelector('button[onclick="switchNavTab(\'' + x.members[0][0] + '\')"]')); if (hh) return hh.id; }
    if (t !== 'home' && t !== 'cvm') return 'autres';
    return t;
  }
  /* Icônes façon iOS : glyphe blanc sur carré arrondi coloré */
  const G = {
    fav: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>',
    cvm: '<rect x="3.5" y="6" width="17" height="12" rx="2.2"/><path d="m4 7 8 6 8-6"/>',
    'hub:ouverture': '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
    'hub:ans': '<rect x="3.5" y="7.5" width="17" height="11.5" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>',
    'hub:fin': '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 8 5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 5-8 8.5"/>',
    'hub:situations': '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.5 14.2c2.8-.3 5 1.6 5 4.3"/>',
    'hub:calculs': '<path d="M5 4.5h4.5v15H5zM10.5 4.5H15v15h-4.5z"/><path d="m16 5.2 3.6-.9 3 14.6-3.6.8z" transform="translate(-2.5 0)"/>',
    autres: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    jour: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.4" fill="currentColor" stroke="none"/>'
  };
  const GC = { fav: '#ff9f0a', cvm: '#0a84ff', 'hub:ouverture': '#30b0c7', 'hub:ans': '#34c759', 'hub:fin': '#ff375f', 'hub:situations': '#ff9500', 'hub:calculs': '#5e5ce6', jour: '#8e8e93', autres: '#8e8e93' };
  const ios = id => G[id] ? '<span class="ios-ic" style="--ios:' + GC[id] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + G[id] + '</svg></span>' : '';
  window.ftIosIcon = ios;
  const STAR = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const CHEV = '<svg class="pt-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* Contenu du menu de chaque onglet */
  /* Couleur propre à chaque outil, selon son sens (rouge pour démission et trop-perçu, etc.) */
  const TOOLC = {
    dossier: '#30b0c7', '1': '#0a84ff', '2': '#ff3b30', '9': '#ff9500', delais: '#5e5ce6', '5': '#34c759', '6': '#ff2d55', invalidite: '#af52de',
    '3': '#34c759', cns: '#00a6a6',
    cfd: '#ff9500', droits: '#0a84ff', '8': '#a2845e',
    '4': '#5e5ce6', ass: '#f5b800', aref: '#af52de', casparts: '#32ade6', '7': '#ff9500', sanctions: '#ff3b30', ati: '#00a6a6',
    bareme: '#0a84ff', calendrier: '#ff3b30', compare: '#af52de', echeances: '#ff9500', glossaire: '#a2845e', journal: '#8e8e93', schemas: '#5e5ce6', sjr: '#34c759', sources: '#64748b',
    jour: '#0a84ff', faq: '#34c759', pieces: '#ff9500', pensebete: '#f5b800', formation: '#af52de', calc: '#30b84f'
  };
  window.FT_TOOLC = TOOLC;
  const alpha = (a, b) => String(a.t).localeCompare(String(b.t), 'fr', { sensitivity: 'base' });
  function menuItems(id) {
    if (id === 'fav') {
      const L = window.ftPinsList ? window.ftPinsList() : [];
      const tools = L.filter(x => String(x.id).indexOf('tpl:') !== 0), mails = L.filter(x => String(x.id).indexOf('tpl:') === 0);
      const g = [];
      if (tools.length) g.push({ h: 'Outils', items: tools.map(x => ({ k: 'pin', v: x.id, t: x.label })) });
      if (mails.length) g.push({ h: 'Mails', items: mails.map(x => ({ k: 'pin', v: x.id, t: x.label })) });
      if (!g.length) g.push({ empty: 'Aucun favori pour l’instant.' });
      g.push({ foot: [{ k: 'pins', t: 'Choisir mes favoris' }, { k: 'tab', v: 'home', t: 'Page d’accueil' }] });
      return g;
    }
    if (id === 'cvm') {
      let cats = []; try { cats = categoryList.map(c => c && (c.name || c)).filter(Boolean); } catch (e) {}
      const n = c => { try { return templates.filter(t => t.category === c).length; } catch (e) { return ''; } };
      let fav = 0, sae = 0, top = 0; try { fav = favorites.length; sae = templates.filter(window.ftIsSae || (() => false)).length; top = window.ftTopIds ? window.ftTopIds(10).length : 0; } catch (e) {}
      return [
        { items: [{ k: 'cat', v: 'all', t: 'Tous les modèles', n: (window.templates || templates || []).length }, { k: 'cat', v: 'favorites', t: 'Favoris', n: fav }, { k: 'cat', v: '__sae', t: 'SAE', n: sae }, { k: 'cat', v: '__top', t: 'Plus utilisés', n: top }] },
        { h: 'Catégories', cols: true, items: cats.map(c => ({ k: 'cat', v: c, t: c, n: n(c) })).filter(x => x.n) }
      ];
    }
    const lbl = b => { const t = b.querySelector('.text-xs'); return ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim(); };
    const tabOf = b => (/switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || '') || [])[1];
    if (id === 'autres') {
      const list = document.getElementById('burger-tabs-list'); const out = [];
      if (list) { let on = false; [...list.children].forEach(c => { if (c.classList.contains('menu-sec-h')) { on = true; return; } if (on && c.tagName === 'BUTTON') { const v = tabOf(c); if (v) out.push({ k: 'tab', v: v, t: lbl(c) }); } }); }
      /* + tout outil qui n'appartient à aucune rubrique (même si le titre « Autres outils » a été renommé) */
      const inSec = new Set([...document.querySelectorAll('#burger-tabs-list .menu-sec button[onclick^="switchNavTab"]')].map(tabOf));
      try { NAV_TABS_CONFIG.forEach(t => { const v = String(t.id); if (/^hub:|^home$|^cvm$/.test(v) || inSec.has(v) || out.some(x => x.v === v)) return; out.push({ k: 'tab', v: v, t: t.name }); }); } catch (e) {}
      if (!out.some(x => x.v === 'jour')) out.unshift({ k: 'tab', v: 'jour', t: nameOf('jour', 'Ma journée') });
      return [{ h: 'Autres outils', items: out.sort(alpha) }];
    }
    const h = (window.FT_HUBS || []).find(x => x.id === id);
    if (h) {
      /* mêmes outils que dans le menu latéral */
      const sec = [...document.querySelectorAll('#burger-tabs-list > .menu-sec')].find(x => x.querySelector('button[onclick="switchNavTab(\'' + h.members[0][0] + '\')"]'));
      if (sec) {
        const its = [...sec.querySelectorAll('button[onclick^="switchNavTab"]')].map(b => ({ k: 'tab', v: tabOf(b), t: lbl(b) })).filter(x => x.v);
        if (its.length) return [{ h: nameOf(h.id, h.name), items: its.sort(alpha) }];
      }
      let LB = {}; try { LB = JSON.parse(localStorage.getItem('ft_labels') || '{}') || {}; } catch (e) {}
      const items = h.members.map(m => ({ k: 'tab', v: m[0], t: LB['t:' + m[0]] || m[1] }));
      /* onglets ajoutés après coup dans la barre de la rubrique (ex. Pension d'invalidité) */
      const ids = new Set(items.map(x => String(x.v)));
      const bar = [...document.querySelectorAll('.hub-bar')].find(b => b.querySelector('.hub-tab[data-t="' + CSS.escape(String(h.members[0][0])) + '"]'));
      if (bar) bar.querySelectorAll('.hub-tab[data-t]').forEach(t => { const v = t.dataset.t; if (!ids.has(v)) { ids.add(v); items.push({ k: 'tab', v: v, t: t.textContent.trim() }); } });
      return [{ h: nameOf(h.id, h.name), items: items.sort(alpha) }];
    }
    return null;
  }
  /* Icône d'un élément de menu : reprend celle du menu latéral, en carré coloré */
  function toolIcon(tab) {
    const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + tab + '\')"] svg');
    return b ? b.outerHTML.replace(/\sclass="[^"]*"/, '') : '';
  }
  function catIcon(name) {
    const nav = document.getElementById('left-nav-menu'); if (!nav) return ['', ''];
    const b = [...nav.querySelectorAll('button[onclick^="selectCategory("]')].find(x => (x.getAttribute('onclick') || '').indexOf("selectCategory('" + name.replace(/'/g, "\\'") + "')") === 0);
    const sp = b && b.querySelector('span.rounded-md'); if (!sp) return ['', ''];
    const m = /text-([a-z]+)-\d/.exec(sp.className); const svg = sp.querySelector('svg');
    return [svg ? svg.outerHTML.replace(/\sclass="[^"]*"/, '') : '', m ? m[1] : 'blue'];
  }
  const IOSM = { blue: '#0a84ff', sky: '#32ade6', cyan: '#30b0c7', teal: '#00a6a6', emerald: '#34c759', green: '#30b84f', lime: '#7cc22e', amber: '#ff9f0a', yellow: '#f5b800', orange: '#ff9500', red: '#ff3b30', rose: '#ff375f', pink: '#ff2d55', purple: '#af52de', violet: '#8e5cf0', fuchsia: '#c644e0', indigo: '#5e5ce6', slate: '#8e8e93', gray: '#8e8e93' };
  function decorate(G, id) {
    const col = GC[id] || '#0a84ff';
    G.forEach(g => (g.items || []).forEach(x => {
      if (x.k === 'tab') { x.ic = toolIcon(x.v); x.c = TOOLC[x.v] || col; }
      else if (x.k === 'pin') { const it = (window.ftPinsList ? window.ftPinsList() : []).find(y => y.id === x.v); x.ic = it && it.icon ? it.icon.replace(/\sclass="[^"]*"/, '') : ''; x.c = String(x.v).indexOf('tpl:') === 0 ? '#0a84ff' : '#ff9f0a'; }
      else if (x.k === 'cat') {
        const fixed = { all: [G0.all, '#8e8e93'], favorites: [G.fav || G0.fav, '#ff9f0a'], __sae: [G0.sae, '#5e5ce6'], __top: [G0.top, '#34c759'] }[x.v];
        if (fixed) { x.ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + fixed[0] + '</svg>'; x.c = fixed[1]; }
        else { const ci = catIcon(x.v); x.ic = ci[0]; x.c = IOSM[ci[1]] || '#0a84ff'; }
      }
    }));
    return G;
  }
  const G0 = { all: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>', fav: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>', sae: '<path d="M4 20h16M5 10h14M12 4l8 5H4zM7 10v8M12 10v8M17 10v8"/>', top: '<path d="M4 19.5h16M7 16v-4M12 16V7M17 16v-6"/>' };
  function menuHtml(id) {
    const G = menuItems(id); if (!G) return ''; decorate(G, id);
    const it = x => '<button type="button" role="menuitem" data-mk="' + x.k + '" data-mv="' + esc(x.v == null ? '' : x.v) + '"' + (x.c ? ' style="--ios:' + x.c + '"' : '') + '>' + (x.ic ? '<i class="ios-ic pt-ic" style="--ios:' + x.c + '">' + x.ic + '</i>' : '') + '<span>' + esc(x.t) + '</span>' + (x.n != null && x.n !== '' ? '<small>' + x.n + '</small>' : '') + '</button>';
    return G.map(g => g.empty ? '<p class="pt-empty">' + esc(g.empty) + '</p>' : g.foot ? '<div class="pt-foot">' + g.foot.map(it).join('') + '</div>' :
      '<div class="pt-grp">' + (g.h ? '<div class="pt-gh">' + esc(g.h) + '</div>' : '') + '<div class="pt-list' + (g.cols && g.items.length > 8 ? ' pt-cols' : '') + '">' + g.items.map(it).join('') + '</div></div>').join('');
  }
  let openId = null, tOpen = 0, tClose = 0, pinned = false;
  function pop() {
    let m = document.getElementById('ft-ptmenu');
    if (!m) {
      m = document.createElement('div'); m.id = 'ft-ptmenu'; m.className = 'ft-ptmenu'; m.setAttribute('role', 'menu'); document.body.appendChild(m);
      m.addEventListener('mouseenter', () => clearTimeout(tClose));
      m.addEventListener('mouseleave', () => { if (pinned || !hoverable()) return; tClose = setTimeout(close, 180); });
      m.addEventListener('click', e => {
        const b = e.target.closest('[data-mk]'); if (!b) return;
        const k = b.dataset.mk, v = b.dataset.mv; close();
        try {
          if (k === 'pin') window.ftOpenPin(v);
          else if (k === 'pins') { if (window.ftOpenPins) window.ftOpenPins(); }
          else if (k === 'tab') switchNavTab(v);
          else if (k === 'cat') { switchNavTab('cvm'); setTimeout(() => { try { selectCategory(v); } catch (er) {} }, 30); }
        } catch (er) {}
      });
      m.addEventListener('keydown', e => {
        const items = [...m.querySelectorAll('[data-mk]')], i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
        else if (e.key === 'Escape') { const t = document.querySelector('#ft-ptabs [data-pt="' + openId + '"]'); close(); if (t) t.focus(); }
      });
    }
    return m;
  }
  function open(id, focus) {
    const html = menuHtml(id), b = document.querySelector('#ft-ptabs [data-pt="' + CSS.escape(id) + '"]');
    if (!html || !b) { close(); return; }
    const m = pop(); m.innerHTML = html; openId = id;
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(x => x.setAttribute('aria-expanded', String(x === b)));
    const r = b.getBoundingClientRect();
    m.classList.add('on');
    const w = m.offsetWidth, left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    m.style.left = left + 'px'; m.style.top = (r.bottom) + 'px';
    if (focus) { const f = m.querySelector('[data-mk]'); if (f) f.focus(); }
  }
  function close() {
    const m = document.getElementById('ft-ptmenu'); if (m) m.classList.remove('on');
    document.querySelectorAll('#ft-ptabs [aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    openId = null; pinned = false;
  }
  const hoverable = () => window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function build() {
    if (document.getElementById('ft-ptabs')) return;
    const hd = document.querySelector('header'); if (!hd) return;
    const n = document.createElement('nav'); n.id = 'ft-ptabs'; n.className = 'ft-ptabs'; n.setAttribute('aria-label', 'Rubriques');
    n.innerHTML = '<div class="ft-ptabs-in">' + TABS().map(([id, name]) => {
      const hasMenu = true;
      return '<button type="button" data-pt="' + esc(id) + '"' + (hasMenu ? ' aria-haspopup="menu" aria-expanded="false"' : '') + '>' + ios(id) + '<span class="pt-l">' + esc(name) + '</span>' + (hasMenu ? CHEV : '') + '</button>';
    }).join('') + '</div>';
    n.addEventListener('click', e => {
      const b = e.target.closest('[data-pt]'); if (!b) return;
      const id = b.dataset.pt;
      if (id === 'fav' || id === 'autres') { if (openId === id && pinned) { close(); return; } clearTimeout(tClose); open(id, !hoverable()); pinned = true; return; }
      close(); try { switchNavTab(id); } catch (er) {}
    });
    n.addEventListener('mouseover', e => {
      if (!hoverable()) return;
      const b = e.target.closest('[data-pt]'); if (!b) return;
      clearTimeout(tClose); clearTimeout(tOpen);
      const id = b.dataset.pt; if (openId === id) return;
      tOpen = setTimeout(() => open(id), openId ? 0 : 140);
    });
    n.addEventListener('mouseleave', () => { clearTimeout(tOpen); if (pinned || !hoverable()) return; tClose = setTimeout(close, 220); });
    n.addEventListener('keydown', e => {
      const b = e.target.closest('[data-pt]'); if (!b) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); open(b.dataset.pt, true); }
      else if (e.key === 'Escape') close();
    });
    n.querySelector('.ft-ptabs-in').addEventListener('scroll', () => { if (!pinned) close(); }, { passive: true });
    window.addEventListener('resize', () => { if (!pinned) close(); });
    document.addEventListener('click', e => { if (openId && !e.target.closest('#ft-ptmenu,#ft-ptabs')) close(); });
    hd.after(n);
    mark();
  }
  /* En-tête : icônes alignées, de même taille */
  const HI = {
    rp: '<path d="M5 21V4.5M5 4.5h11l-2 3.5 2 3.5H5"/>',
  };
  function header() {
    hbApply();
    const rp = document.getElementById('rp-btn');
    if (rp && !rp.dataset.pro) { rp.dataset.pro = '1'; rp.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + HI.rp + '</svg><span class="sr-only">Repères</span>'; }
    const rl = [...document.querySelectorAll('header button')].find(b => b.title === 'Recharger la page'); if (rl) rl.classList.add('pro-hide');
  }
  /* Barre du haut personnalisable : ordre et affichage des boutons ; le compte reste tout à droite */
  const HB = [['ft-pi-btn', 'Post-it'], ['ft-tts', 'Interprète vocal'], ['theme-toggle-btn', 'Clair / sombre']];
  const hbGet = () => { try { const v = JSON.parse(localStorage.getItem('ft_hdr') || 'null'); if (v && Array.isArray(v.order)) return v; } catch (e) {} return { order: HB.map(x => x[0]), hide: [] }; };
  function hbApply() {
    const cfg = hbGet(), order = cfg.order.concat(HB.map(x => x[0]).filter(id => !cfg.order.includes(id)));
    order.forEach((id, i) => { const el = document.getElementById(id); if (el) { el.style.order = String(10 + i); el.classList.toggle('pro-hb-off', cfg.hide.includes(id)); } });
    const ac = document.getElementById('ft-acct'); if (ac) ac.style.order = '999';
  }
  window.ftHeaderEdit = function () {
    let w = document.getElementById('pro-hb');
    if (!w) {
      w = document.createElement('div'); w.id = 'pro-hb'; w.className = 'cvm-so'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'pro-hb-t'); document.body.appendChild(w);
      w.addEventListener('click', e => {
        const cfg = hbGet(); const t = e.target;
        if (t === w || t.closest('[data-hb="x"]')) { w.hidden = true; return; }
        if (t.closest('[data-hb="reset"]')) { try { localStorage.removeItem('ft_hdr'); } catch (er) {} hbApply(); draw(); return; }
        const mv = t.closest('[data-mv]'); if (mv) { const i = +mv.dataset.i, j = i + (+mv.dataset.mv); if (j < 0 || j >= cfg.order.length) return; const o = cfg.order; [o[i], o[j]] = [o[j], o[i]]; save(cfg); return; }
        const cb = t.closest('input[data-id]'); if (cb) { cfg.hide = cfg.hide.filter(x => x !== cb.dataset.id); if (!cb.checked) cfg.hide.push(cb.dataset.id); save(cfg); }
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    function save(cfg) { try { localStorage.setItem('ft_hdr', JSON.stringify(cfg)); } catch (e) {} hbApply(); draw(); }
    function draw() {
      const cfg = hbGet(); const order = cfg.order.concat(HB.map(x => x[0]).filter(id => !cfg.order.includes(id))); cfg.order = order;
      w.innerHTML = '<div class="cvm-so-c"><div class="cvm-so-h"><h2 id="pro-hb-t">Organiser la barre du haut</h2><button type="button" data-hb="x" aria-label="Fermer">×</button></div>' +
        '<p>Changez l’ordre des boutons avec les flèches et décochez ceux que vous ne voulez pas voir. Le bouton du compte reste tout à droite.</p><div class="pro-hb-l">' +
        order.map((id, i) => { const n = (HB.find(x => x[0] === id) || [id, id])[1]; return '<div class="pro-hb-r"><label><input type="checkbox" data-id="' + id + '"' + (cfg.hide.includes(id) ? '' : ' checked') + '> ' + esc(n) + '</label><span><button type="button" data-mv="-1" data-i="' + i + '" aria-label="Monter ' + esc(n) + '"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-mv="1" data-i="' + i + '" aria-label="Descendre ' + esc(n) + '"' + (i < order.length - 1 ? '' : ' disabled') + '>↓</button></span></div>'; }).join('') +
        '</div><div class="cvm-so-a"><button type="button" data-hb="reset">Ordre d’origine</button><button type="button" data-hb="x" class="pri">Terminé</button></div></div>';
      w.hidden = false;
    }
    draw();
  };
  (window.FT_ACCT_ITEMS = window.FT_ACCT_ITEMS || []).push({ t: 'Organiser la barre du haut', anon: true, run: () => window.ftHeaderEdit() });
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push({ t: 'Organiser la barre du haut', s: 'Ordre et affichage des boutons', kw: 'barre haut boutons ordre deplacer organiser en-tete', run: () => window.ftHeaderEdit() });
  function mark() {
    const k = activeKey();
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(b => { const on = b.dataset.pt === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }

  /* ---------- Accueil : barre d'actions, simulateurs en liste ---------- */
  const AI = {
    dos: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/>',
    fav: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>',
    top: '<path d="M4 19.5h16M7 16v-4M12 16V7M17 16v-6"/>',
    sit: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>'
  };
  const sv = (g, c) => '<span class="ios-ic" style="--ios:' + c + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + g + '</svg></span>';
  function home() {
    const nh = document.querySelector('#view-home .fh-news h2'); if (nh && nh.textContent.trim() !== 'Nouveautés') nh.textContent = 'Nouveautés';
    /* icônes des outils de l'accueil : même couleur que dans les onglets */
    document.querySelectorAll('#view-home .fh-chip').forEach(c => {
      const m = /switchNavTab\('([^']+)'\)/.exec(c.getAttribute('onclick') || ''); let id = m ? m[1] : c.dataset.id; if (!id) return;
      let col = null;
      if (String(id).indexOf('tpl:') === 0) col = '#0a84ff';
      else { col = TOOLC[id]; if (!col) { const hh = window.ftHubOf ? window.ftHubOf(id) : null; col = hh && GC[hh.id]; } }
      if (col) c.style.setProperty('--ios', col);
    });
    document.querySelectorAll('#view-home .fh-grp').forEach(g => { const h = (window.FT_HUBS || []).find(x => g.querySelector('.fh-chip[onclick="switchNavTab(\'' + x.members[0][0] + '\')"]')); const gi = g.querySelector('.fh-gi'); if (h && gi && GC[h.id]) gi.style.setProperty('--ios', GC[h.id]); });
    const sum = document.querySelector('#view-home .fh-sum'), d1 = sum && sum.querySelector(':scope > .fh-grp.fh-c1'); if (d1 && sum.firstElementChild !== d1) sum.prepend(d1);
    const hero = document.querySelector('#view-home .home-hero'); if (!hero) return;

  }

  /* ---------- Simulateurs : résultat dans un encadré fixe à droite ---------- */
  function simLayout() {
    const v = [...document.querySelectorAll('[id^="view-"]')].find(x => x.offsetParent && !x.classList.contains('hidden') && x.id !== 'view-home' && x.id !== 'view-cvm');
    if (!v) return;
    v.querySelectorAll('.grid').forEach(g => {
      if (g.dataset.proSim) return;
      const kids = [...g.children].filter(c => c.offsetParent);
      if (kids.length !== 2) return;
      const [a, b] = kids, ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 40 || ra.width < 260 || rb.width < 240) return;
      const ia = a.querySelectorAll('input,select,textarea').length, ib = b.querySelectorAll('input,select,textarea').length;
      if (ia < 2 || ib > 1 || ra.height < 260) return;
      g.dataset.proSim = '1'; g.classList.add('pro-sim'); b.classList.add('pro-res');
    });
  }

  /* ---------- Règles : sommaire collant ---------- */
  function rulesToc() {
    document.querySelectorAll('.rg-panel:not([hidden])').forEach(p => {
      if (p.querySelector('.pro-toc')) return;
      const hs = [...p.querySelectorAll('h4.wiz-h[id]')]; if (hs.length < 2) return;
      const n = document.createElement('nav'); n.className = 'pro-toc'; n.setAttribute('aria-label', 'Sommaire');
      n.innerHTML = '<b>Sommaire</b>' + hs.map(h => '<a href="#' + h.id + '">' + esc(h.textContent) + '</a>').join('');
      n.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); const t = p.querySelector(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      p.classList.add('pro-rules'); p.prepend(n);
    });
  }
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.rg-tab')) setTimeout(() => { rulesToc(); iosify(); }, 60); });

  /* ---------- Impression : en-tête sobre ---------- */
  function printHead() {
    if (document.getElementById('pro-print-h')) return;
    const h = document.createElement('div'); h.id = 'pro-print-h';
    document.body.prepend(h);
  }
  window.addEventListener('beforeprint', () => {
    printHead();
    const h = document.getElementById('pro-print-h'); let t = '';
    try { t = (NAV_TABS_CONFIG.find(x => String(x.id) === String(activeNavTab)) || {}).name || ''; } catch (e) {}
    const d = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    h.innerHTML = '<b>France Travail</b><span>Espace Conseiller' + (t ? ' · ' + esc(t) : '') + '</span><span>Imprimé le ' + d + '</span>';
  });

  /* ---------- Icônes façon iOS partout : carré arrondi coloré, dessin blanc ---------- */
  const IOSC = { blue: '#0a84ff', sky: '#32ade6', cyan: '#30b0c7', teal: '#00a6a6', emerald: '#34c759', green: '#30b84f', lime: '#7cc22e', amber: '#ff9f0a', yellow: '#f5b800', orange: '#ff9500', red: '#ff3b30', rose: '#ff375f', pink: '#ff2d55', purple: '#af52de', violet: '#8e5cf0', fuchsia: '#c644e0', indigo: '#5e5ce6', slate: '#8e8e93', gray: '#8e8e93', zinc: '#8e8e93', neutral: '#8e8e93' };
  function iosify() {
    const v = [...document.querySelectorAll('[id^="view-"]')].find(x => x.offsetParent && !x.classList.contains('hidden'));
    const roots = [v, document.getElementById('rp-drawer')].filter(Boolean);
    roots.forEach(root => root.querySelectorAll('span,div').forEach(el => {
      if (el.dataset.ios || el.classList.contains('ios-ic')) return;
      const c = typeof el.className === 'string' ? el.className : '';
      if (!/rounded/.test(c) || !/(^|\s)bg-/.test(c)) return;
      if (el.children.length !== 1 || el.firstElementChild.tagName.toLowerCase() !== 'svg' || el.textContent.trim()) return;
      const r = el.getBoundingClientRect(); if (r.width < 16 || r.width > 44 || Math.abs(r.width - r.height) > 4) return;
      const m = /(?:^|\s)text-([a-z]+)-\d/.exec(c) || /(?:^|\s)bg-([a-z]+)-\d/.exec(c);
      el.style.setProperty('--ios', IOSC[m ? m[1] : 'blue'] || '#0a84ff');
      el.classList.add('ios-ic', 'ios-auto'); el.dataset.ios = '1';
    }));
  }
  /* Sous-onglets d'une rubrique : icône colorée devant chaque titre */
  function hubIcons() {
    document.querySelectorAll('.hub-bar .hub-tab[data-t]').forEach(b => {
      if (b.querySelector('.pt-ic')) return;
      const ic = toolIcon(b.dataset.t); if (!ic) return;
      const h = window.ftHubOf ? window.ftHubOf(b.dataset.t) : null;
      let col = h ? GC[h.id] : null;
      if (!col) { const sec = [...document.querySelectorAll('#burger-tabs-list > .menu-sec')].find(x => x.querySelector('button[onclick="switchNavTab(\'' + b.dataset.t + '\')"]')); const hh = sec && (window.FT_HUBS || []).find(x => sec.querySelector('button[onclick="switchNavTab(\'' + x.members[0][0] + '\')"]')); col = hh ? GC[hh.id] : '#0a84ff'; }
      col = TOOLC[b.dataset.t] || col; b.style.setProperty('--ios', col);
      const i = document.createElement('i'); i.className = 'ios-ic pt-ic'; i.style.setProperty('--ios', col); i.innerHTML = ic; i.setAttribute('aria-hidden', 'true');
      b.prepend(i);
    });
  }
  /* Barres de rubrique alignées sur le menu latéral : mêmes outils, dans le même ordre */
  function syncHubBars() {
    const act = cur();
    (window.FT_HUBS || []).forEach(h => {
      const sec = [...document.querySelectorAll('#burger-tabs-list > .menu-sec')].find(x => x.querySelector('button[onclick="switchNavTab(\'' + h.members[0][0] + '\')"]'));
      if (!sec) return;
      const want = [...sec.querySelectorAll('button[onclick^="switchNavTab"]')].map(b => { const v = (/switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || '') || [])[1]; const t = b.querySelector('.text-xs'); return v ? [v, ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim()] : null; }).filter(Boolean);
      const bars = [...document.querySelectorAll('.hub-bar')].filter(b => b.querySelector('.hub-tab[data-t="' + CSS.escape(String(h.members[0][0])) + '"]'));
      bars.forEach(bar => {
        const host = bar.querySelector('.hub-chips') || bar;
        bar.querySelectorAll(':scope > .hub-tab').forEach(t => { if (host !== bar) host.appendChild(t); });
        const seen = new Set(); host.querySelectorAll('.hub-tab[data-t]').forEach(t => { if (seen.has(t.dataset.t)) t.remove(); else seen.add(t.dataset.t); });
        want.forEach(([v, label]) => {
          if (bar.querySelector('.hub-tab[data-t="' + CSS.escape(v) + '"]')) return;
          const b = document.createElement('button'); b.type = 'button'; b.className = 'hub-tab'; b.dataset.t = v; b.setAttribute('onclick', "switchNavTab('" + v + "')"); b.textContent = label;
          host.appendChild(b);
        });
        /* ordre alphabétique */
        const tabs = [...host.querySelectorAll(':scope > .hub-tab[data-t]')];
        const sorted = tabs.slice().sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), 'fr', { sensitivity: 'base' }));
        if (sorted.some((t, i) => t !== tabs[i])) sorted.forEach(t => host.appendChild(t));
        /* téléphone : un menu déroulant compact à la place des sous-onglets */
        let sel = bar.querySelector(':scope > .pro-hb-sel');
        if (!sel) { sel = document.createElement('select'); sel.className = 'pro-hb-sel'; sel.setAttribute('aria-label', 'Outil de la rubrique'); sel.addEventListener('change', () => { try { switchNavTab(sel.value); } catch (e) {} }); bar.insertBefore(sel, bar.firstChild); }
        const opts = [...host.querySelectorAll(':scope > .hub-tab[data-t]')].map(t => '<option value="' + esc(t.dataset.t) + '">' + esc(t.textContent.trim()) + '</option>').join('');
        if (sel.dataset.o !== opts) { sel.innerHTML = opts; sel.dataset.o = opts; }
        sel.value = act;
      });
      /* outil du menu latéral sans barre de rubrique : on lui en donne une */
      if (want.some(w => w[0] === act) && bars.length) {
        const v = [...document.querySelectorAll('[id^="view-"]')].find(x => x.offsetParent && !x.classList.contains('hidden'));
        if (v && !v.querySelector(':scope > .hub-bar, :scope > * > .hub-bar')) {
          const cl = bars[0].cloneNode(true); const sub = cl.querySelector('.hub-sub'); if (sub) sub.remove();
          cl.classList.add('pro-hb-clone'); v.insertBefore(cl, v.firstChild);
        }
      }
    });
    document.querySelectorAll('.hub-bar .hub-tab[data-t]').forEach(b => { const on = b.dataset.t === act; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  function foot() {
    const f = document.getElementById('ft-foot'); if (!f || f.dataset.pro) return;
    f.dataset.pro = '1'; f.classList.add('pro-foot');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pro-foot-i'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Sources et version'); b.textContent = 'i';
    b.addEventListener('click', () => { const on = f.classList.toggle('open'); b.setAttribute('aria-expanded', String(on)); });
    f.appendChild(b);
  }
  /* ---------- Accueil allégé : bandeau, outils favoris, mails favoris, plus utilisés, repères ---------- */
  const PH = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3.5" y="6" width="17" height="12" rx="2.2"/><path d="m4 7 8 6 8-6"/>',
    trend: '<path d="m4 16 5-5 4 4 7-7M15 8h5v5"/>', chev: '<path d="m9 6 6 6-6 6"/>'
  };
  const sg = (k, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PH[k] + '</svg>';
  const ic = (inner, c, cls) => '<span class="ios-ic ' + (cls || '') + '" style="--ios:' + c + '">' + inner + '</span>';
  const fmtN = n => (typeof n === 'number' ? n.toFixed(2).replace('.', ',') : '—');
  function proHome() {
    const vh = document.getElementById('view-home'); if (!vh) return;
    let H = document.getElementById('pro-home');
    if (!H) {
      H = document.createElement('div'); H.id = 'pro-home'; H.className = 'pro-home'; vh.prepend(H);
      H.addEventListener('click', e => {
        const a = e.target.closest('[data-go]'); if (!a) return;
        const k = a.dataset.go, v = a.dataset.v;
        try {
          if (k === 'tab') switchNavTab(v);
          else if (k === 'pin') window.ftOpenPin(v);
          else if (k === 'tpl') window.ftOpenPin('tpl:' + v);
          else if (k === 'link') window.open(v, '_blank', 'noopener');
          else if (k === 'search') { if (typeof ftHeaderSearch === 'function') ftHeaderSearch(); }
          else if (k === 'dossier') { const b = vh.querySelector('.home-wrap .fh-dos .fh-btn'); if (b) b.click(); else switchNavTab('dossier'); }
          else if (k === 'sit') { const b = vh.querySelector('.sit-home'); if (b) b.click(); }
          else if (k === 'news') { const b = vh.querySelector('.home-wrap .fh-news .fh-btn2'); if (b) b.click(); }
          else if (k === 'links') { const b = vh.querySelector('.lk-manage'); if (b) b.click(); }
          else if (k === 'pins') { if (window.ftOpenPins) window.ftOpenPins(); }
          else if (k === 'mails') { switchNavTab('cvm'); setTimeout(() => { try { selectCategory('favorites'); } catch (er) {} }, 40); }
        } catch (er) {}
      });
    }
    const B = (typeof BAREME !== 'undefined' && BAREME) || {};
    const h = new Date().getHours(); let me = null; try { me = ftCurrentUser(); } catch (e) {}
    let links = null; try { links = JSON.parse(localStorage.getItem('ft_links')); } catch (e) {}
    if (!Array.isArray(links)) links = [{ t: 'Unédic', u: 'https://www.unedic.org/' }];
    const pins = window.ftPinsList ? window.ftPinsList() : [];
    const ptools = pins.filter(x => String(x.id).indexOf('tpl:') !== 0);
    let fm = []; try { fm = favorites.map(id => templates.find(t => t.id === id)).filter(Boolean); } catch (e) {}
    pins.filter(x => String(x.id).indexOf('tpl:') === 0).forEach(x => { const id = String(x.id).slice(4); if (!fm.some(t => String(t.id) === id)) { try { const t = templates.find(y => String(y.id) === id); if (t) fm.push(t); } catch (e) {} } });
    let use = {}; try { use = JSON.parse(localStorage.getItem('ft_tool_use') || '{}') || {}; } catch (e) {}
    const known = new Set(); try { NAV_TABS_CONFIG.forEach(t => known.add(String(t.id))); } catch (e) {}
    let top = Object.keys(use).filter(k => known.has(k) && !/^(home|cvm|hub:)/.test(k)).sort((a, b) => use[b] - use[a]);
    ['1', '2', '6', '5', '9', 'delais', '3', 'calendrier'].forEach(k => { if (!top.includes(k)) top.push(k); }); top = top.slice(0, 8);
    const tname = id => { const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + id + '\')"]'); if (b) { const t = b.querySelector('.text-xs'); const v = ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim(); if (v) return v; } try { const t = NAV_TABS_CONFIG.find(x => String(x.id) === id); return t ? t.name : id; } catch (e) { return id; } };
    const colOf = id => { if (TOOLC[id]) return TOOLC[id]; const hh = window.ftHubOf ? window.ftHubOf(id) : null; return (hh && GC[hh.id]) || '#0a84ff'; };
    const tIcon = id => toolIcon(id) || sg('star');
    const row = (go, v, title, sub, icon, c) => '<button type="button" class="ph-row" data-go="' + go + '" data-v="' + esc(v) + '">' + ic(icon, c) + '<span class="ph-rt"><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' + sg('chev', 15) + '</button>';
    const html =
      '<section class="ph-hero"><div class="ph-hd"><div><div class="ph-hello">' + ((h >= 18 || h < 4) ? 'Bonsoir' : 'Bonjour') + (me && me.name ? ' ' + esc(me.name) : '') + '</div><div class="ph-q">Que cherchez-vous ?</div></div>' +
        '<div class="ph-right"><div class="ph-clock"><div class="ph-time"><span id="ph-hm"></span><small id="ph-s"></small></div><div class="ph-date" id="ph-d"></div></div></div></div>' +
        '<button type="button" class="ph-search" data-go="search">' + sg('search', 20) + '<span>Un outil, une règle ou un modèle de mail</span><kbd>Ctrl K</kbd></button>' +
        '<div class="ph-acts"><button type="button" class="ph-b pri" data-go="dossier">' + sg('plus', 16) + 'Nouveau dossier</button><button type="button" class="ph-b" data-go="sit">' + ic(sg('help', 14), '#af52de', 'ph-mi') + 'Que faire si…</button></div>' +
        '<div class="ph-kpi"><span class="ph-lab">Chiffres clés</span>' + [['ARE min.', fmtN(B.are && B.are.min) + ' €/j'], ['Partie fixe', fmtN(B.are && B.are.partieFixe) + ' €/j'], ['Allocation max.', fmtN(B.are && B.are.max) + ' €/j'], ['ASS', fmtN(B.solidarite && B.solidarite.ass) + ' €/j'], ['Affiliation', ((B.affiliation && B.affiliation.jours) || '') + ' j / ' + ((B.affiliation && B.affiliation.heures) || '') + ' h']].map(k => '<span>' + k[0] + ' <b>' + esc(k[1]) + '</b></span>').join('') + '</div></section>' +
      '<div class="ph-grid2"><section class="ph-slot" id="ph-links-slot"></section><section class="ph-slot" id="ph-news-slot"></section></div>';
    if (H.dataset.h !== html) {
      const keep = [...H.querySelectorAll('.ph-slot > *')];
      H.innerHTML = html; H.dataset.h = html;
      keep.forEach(k => { const sl = document.getElementById(k.classList.contains('fh-news') ? 'ph-news-slot' : 'ph-links-slot'); if (sl) sl.appendChild(k); });
    }
    /* Liens utiles et Nouveautés : les cartes existantes (avec leurs réglages) sont déplacées ici */
    [['.fh-links', 'ph-links-slot'], ['.fh-news', 'ph-news-slot']].forEach(([sel, id]) => {
      const fresh = vh.querySelector('.home-wrap ' + sel), sl = document.getElementById(id);
      if (fresh && sl) { sl.innerHTML = ''; sl.appendChild(fresh); }
    });
    const nh = vh.querySelector('#ph-news-slot .fh-news h2'); if (nh && nh.textContent.trim() !== 'Nouveautés') nh.textContent = 'Nouveautés';
    phTick();
  }
  function phTick() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const a = document.getElementById('ph-hm'), b = document.getElementById('ph-s'), c = document.getElementById('ph-d');
    if (a) a.textContent = p(d.getHours()) + ':' + p(d.getMinutes());
    if (b) b.textContent = ':' + p(d.getSeconds());
    if (c) { const t = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); c.textContent = t.charAt(0).toUpperCase() + t.slice(1); }
  }
  setInterval(() => { if (cur() === 'home') phTick(); }, 1000);
  /* ---------- Barre de widgets à droite, centrée : favoris, plus utilisés, calculatrice, dates, repères ---------- */
  /* Catalogue des widgets ; chaque conseiller choisit les siens et leur ordre (clé ft_wg, synchronisée avec le compte) */
  const WG = [['asst', 'Assistant', null, '#5e5ce6'], ['mf', 'Mails favoris', 'mail', '#0a84ff'], ['tf', 'Outils favoris', 'star', '#ff9f0a'], ['top', 'Plus utilisés', 'trend', '#34c759'], ['calc', 'Calculatrice', null, '#30b84f'], ['dates', 'Dates', null, '#5e5ce6'], ['rep', 'Repères', null, '#ff7a00'], ['postit', 'Post-it', null, '#f5b800'], ['jour', 'Ma journée', null, '#ff3b30'], ['sit', 'Que faire si…', null, '#af52de'], ['tts', 'Interprète vocal', null, '#af52de'], ['theme', 'Clair / sombre', null, '#5e5ce6']];
  const WG_DEF = ['asst', 'mf', 'tf', 'top', 'calc', 'dates', 'rep'];
  const WGI = {
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4"/>',
    dates: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    rep: '<path d="M5 21V4.5M5 4.5h11l-2 3.5 2 3.5H5"/>',
    asst: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01"/>',
    postit: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',
    jour: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.4" fill="currentColor" stroke="none"/>',
    sit: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>',
    tts: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    gear: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
  };
  const wgCfg = () => { try { const v = JSON.parse(localStorage.getItem('ft_wg') || 'null'); if (Array.isArray(v)) return v; } catch (e) {} return WG_DEF.slice(); };
  const wgSave = v => { try { (typeof safeLS !== 'undefined' ? safeLS : localStorage).setItem('ft_wg', JSON.stringify(v)); } catch (e) {} wgRender(); };
  const svgOf = inner => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  const toolLabel = id => { const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + id + '\')"]'); if (b) { const t = b.querySelector('.text-xs'); const v = ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim(); if (v) return v; } try { const t = NAV_TABS_CONFIG.find(x => String(x.id) === id); return t ? t.name : id; } catch (e) { return id; } };
  function wgMeta(key) {
    if (String(key).indexOf('tool:') === 0) { const id = key.slice(5); const hh = window.ftHubOf ? window.ftHubOf(id) : null; return { k: key, t: toolLabel(id), c: TOOLC[id] || (hh && GC[hh.id]) || '#0a84ff', ic: toolIcon(id) || svgOf(WGI.gear) }; }
    const w = WG.find(x => x[0] === key); if (!w) return null;
    return { k: key, t: w[1], c: w[3], ic: w[2] ? sg(w[2], 18) : svgOf(WGI[key]) };
  }
  function wgRender() {
    const bar = document.getElementById('pro-wg'); if (!bar) return;
    const list = wgCfg().map(wgMeta).filter(Boolean);
    bar.innerHTML = list.map(m => '<button type="button" data-w="' + esc(m.k) + '" title="' + esc(m.t) + '" aria-label="' + esc(m.t) + '">' + ic(m.ic, m.c, 'wg-ic') + '</button>').join('') +
      '<button type="button" class="wg-edit" data-w="__edit" title="Personnaliser la barre" aria-label="Personnaliser la barre">' + svgOf(WGI.gear) + '</button>';
  }
  function wgEdit() {
    let w = document.getElementById('pro-wg-ed');
    if (!w) {
      w = document.createElement('div'); w.id = 'pro-wg-ed'; w.className = 'cvm-so'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'pro-wg-ed-t'); document.body.appendChild(w);
      w.addEventListener('click', e => {
        const t = e.target, cfg = wgCfg();
        if (t === w || t.closest('[data-e="x"]')) { w.hidden = true; return; }
        if (t.closest('[data-e="reset"]')) { try { localStorage.removeItem('ft_wg'); } catch (er) {} wgRender(); draw(); return; }
        const mv = t.closest('[data-mv]'); if (mv) { const i = +mv.dataset.i, j = i + (+mv.dataset.mv); if (j < 0 || j >= cfg.length) return; [cfg[i], cfg[j]] = [cfg[j], cfg[i]]; wgSave(cfg); draw(); return; }
        const rm = t.closest('[data-rm]'); if (rm) { cfg.splice(+rm.dataset.rm, 1); wgSave(cfg); draw(); return; }
        const ad = t.closest('[data-add]'); if (ad) { if (!cfg.includes(ad.dataset.add)) cfg.push(ad.dataset.add); wgSave(cfg); draw(); return; }
      });
      w.addEventListener('change', e => { const sel = e.target.closest('#pro-wg-tool'); if (sel && sel.value) { const cfg = wgCfg(); const k = 'tool:' + sel.value; if (!cfg.includes(k)) cfg.push(k); wgSave(cfg); draw(); } });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    function draw() {
      const cfg = wgCfg();
      const tools = [...document.querySelectorAll('#burger-tabs-list button[onclick^="switchNavTab"]')].map(b => (/switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || '') || [])[1]).filter(id => id && id !== 'home' && !cfg.includes('tool:' + id));
      const uniq = [...new Set(tools)].map(id => [id, toolLabel(id)]).sort((a, b) => a[1].localeCompare(b[1], 'fr'));
      w.innerHTML = '<div class="cvm-so-c"><div class="cvm-so-h"><h2 id="pro-wg-ed-t">Ma barre de widgets</h2><button type="button" data-e="x" aria-label="Fermer">×</button></div>' +
        '<p>Choisissez les widgets de la barre de droite et leur ordre. Vous pouvez aussi y épingler n’importe quel outil.</p>' +
        '<div class="pro-hb-l">' + (cfg.length ? cfg.map((k, i) => { const m = wgMeta(k); if (!m) return ''; return '<div class="pro-hb-r"><label>' + ic(m.ic, m.c, 'wg-ri') + ' ' + esc(m.t) + '</label><span><button type="button" data-mv="-1" data-i="' + i + '" aria-label="Monter"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-mv="1" data-i="' + i + '" aria-label="Descendre"' + (i < cfg.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" data-rm="' + i + '" aria-label="Retirer ' + esc(m.t) + '">✕</button></span></div>'; }).join('') : '<p class="wg-empty">Aucun widget : la barre n’affiche que le bouton de réglage.</p>') + '</div>' +
        '<div class="wg-add"><b>Ajouter</b><div class="wg-chips">' + WG.filter(x => !cfg.includes(x[0])).map(x => '<button type="button" data-add="' + x[0] + '">+ ' + x[1] + '</button>').join('') + '</div>' +
        '<select id="pro-wg-tool" aria-label="Épingler un outil"><option value="">+ Épingler un outil…</option>' + uniq.map(([id, l]) => '<option value="' + esc(id) + '">' + esc(l) + '</option>').join('') + '</select></div>' +
        '<div class="cvm-so-a"><button type="button" data-e="reset">Barre d’origine</button><button type="button" data-e="x" class="pri">Terminé</button></div></div>';
      w.hidden = false;
    }
    draw();
  }
  window.ftWidgetsEdit = wgEdit;
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push({ t: 'Personnaliser la barre de widgets', s: 'Choisir les widgets de droite et leur ordre', kw: 'widget barre droite personnaliser raccourcis', run: () => wgEdit() });
  (window.FT_ACCT_ITEMS = window.FT_ACCT_ITEMS || []).push({ t: 'Personnaliser la barre de widgets', anon: true, run: () => wgEdit() });
  let wOpen = null;
  function wgData(k) {
    const tname = id => { const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + id + '\')"]'); if (b) { const t = b.querySelector('.text-xs'); const v = ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim(); if (v) return v; } return id; };
    const colOf = id => { if (TOOLC[id]) return TOOLC[id]; const hh = window.ftHubOf ? window.ftHubOf(id) : null; return (hh && GC[hh.id]) || '#0a84ff'; };
    const pins = window.ftPinsList ? window.ftPinsList() : [];
    if (k === 'tf') return { items: pins.filter(x => String(x.id).indexOf('tpl:') !== 0).map(x => ({ go: 'pin', v: x.id, t: x.label, s: x.group, i: (x.icon || '').replace(/\sclass="[^"]*"/, ''), c: colOf(String(x.id)) })), empty: 'Aucun outil favori.', foot: ['pins', 'Choisir mes favoris'] };
    if (k === 'mf') { let fm = []; try { fm = favorites.map(id => templates.find(t => t.id === id)).filter(Boolean); } catch (e) {} return { items: fm.map(t => ({ go: 'tpl', v: t.id, t: t.title, s: t.category, i: sg('mail', 16), c: '#0a84ff' })), empty: 'Mettez l’étoile sur un mail pour le retrouver ici.', foot: ['mails', 'Ouvrir les mails favoris'] }; }
    if (k === 'top') {
      let use = {}; try { use = JSON.parse(localStorage.getItem('ft_tool_use') || '{}') || {}; } catch (e) {}
      const known = new Set(); try { NAV_TABS_CONFIG.forEach(t => known.add(String(t.id))); } catch (e) {}
      let top = Object.keys(use).filter(x => known.has(x) && !/^(home|cvm|hub:)/.test(x)).sort((a, b) => use[b] - use[a]);
      ['1', '2', '6', '5', '9', 'delais', '3', 'calendrier'].forEach(x => { if (!top.includes(x)) top.push(x); });
      return { items: top.slice(0, 8).map(id => ({ go: 'tab', v: id, t: tname(id), s: use[id] ? use[id] + ' ouverture' + (use[id] > 1 ? 's' : '') : '', i: toolIcon(id), c: colOf(id) })) };
    }
  }
  function wgBuild() {
    if (document.getElementById('pro-wg')) return;
    const bar = document.createElement('nav'); bar.id = 'pro-wg'; bar.className = 'pro-wg'; bar.setAttribute('aria-label', 'Widgets');
    const pan = document.createElement('div'); pan.id = 'pro-wg-pan'; pan.className = 'pro-wg-pan'; pan.setAttribute('role', 'dialog');
    document.body.appendChild(bar); document.body.appendChild(pan); wgRender();
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (!b) return; const k = b.dataset.w;
      if (k === '__edit') { wgClose(); wgEdit(); return; }
      if (k.indexOf('tool:') === 0) { wgClose(); try { switchNavTab(k.slice(5)); } catch (er) {} return; }
      if (k === 'asst') { wgClose(); if (window.ftAssistant) window.ftAssistant(); return; }
      if (k === 'postit') { wgClose(); if (window.ftPostIt) window.ftPostIt(true); return; }
      if (k === 'jour') { wgClose(); try { switchNavTab('jour'); } catch (er) {} return; }
      if (k === 'sit') { wgClose(); if (window.ftSituations) window.ftSituations(); return; }
      if (k === 'tts') { wgClose(); const t = document.getElementById('ft-tts'); if (t) t.click(); return; }
      if (k === 'theme') { try { toggleTheme(); } catch (er) {} return; }
      if (k === 'calc') { wgClose(); try { toggleCalculator(); } catch (er) {} return; }
      if (k === 'dates') { wgClose(); try { toggleDateCalc(); } catch (er) { const d = document.getElementById('datecalc-toggle'); if (d) d.click(); } return; }
      if (k === 'rep') { wgClose(); try { window.ftRpToggle(true); } catch (er) { const r = document.getElementById('rp-btn'); if (r) r.click(); } return; }
      if (wOpen === k) { wgClose(); return; }
      wgOpen(k, b);
    });
    pan.addEventListener('click', e => {
      const a = e.target.closest('[data-go]'); if (!a) return; const g = a.dataset.go, v = a.dataset.v; wgClose();
      try {
        if (g === 'tab') switchNavTab(v);
        else if (g === 'pin') window.ftOpenPin(v);
        else if (g === 'tpl') window.ftOpenPin('tpl:' + v);
        else if (g === 'pins') { if (window.ftOpenPins) window.ftOpenPins(); }
        else if (g === 'mails') { switchNavTab('cvm'); setTimeout(() => { try { selectCategory('favorites'); } catch (er) {} }, 40); }
      } catch (er) {}
    });
    document.addEventListener('click', e => { if (wOpen && !e.target.closest('#pro-wg,#pro-wg-pan')) wgClose(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && wOpen) wgClose(); });
  }
  function wgOpen(k, btn) {
    const pan = document.getElementById('pro-wg-pan'), d = wgData(k), w = WG.find(x => x[0] === k); if (!d || !w) return;
    pan.innerHTML = '<header>' + ic(sg(w[2], 16), w[3], 'wg-hi') + '<h2>' + w[1] + '</h2><small>' + d.items.length + '</small></header>' +
      (d.items.length ? '<div class="wg-list">' + d.items.map(x => '<button type="button" class="wg-row" data-go="' + x.go + '" data-v="' + esc(x.v) + '">' + ic(x.i || sg('star', 16), x.c, 'wg-ri') + '<span><b>' + esc(x.t) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span></button>').join('') + '</div>' : '<p class="wg-empty">' + d.empty + '</p>') +
      (d.foot ? '<button type="button" class="wg-foot" data-go="' + d.foot[0] + '">' + d.foot[1] + '</button>' : '');
    document.querySelectorAll('#pro-wg [data-w]').forEach(b => b.classList.toggle('on', b.dataset.w === k));
    pan.classList.add('on'); wOpen = k;
  }
  function wgClose() { const p = document.getElementById('pro-wg-pan'); if (p) p.classList.remove('on'); document.querySelectorAll('#pro-wg [data-w]').forEach(b => b.classList.remove('on')); wOpen = null; }
  window.ftWidget = k => { wgBuild(); wgOpen(k); };
  function after() { try { wgBuild(); foot(); home(); simLayout(); rulesToc(); iosify(); syncHubBars(); hubIcons(); } catch (e) { console.warn(e); } }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); try { mark(); close(); setTimeout(after, 250); } catch (e) {} return r; };
    window.switchNavTab = switchNavTab;
  }
  const pal = document.getElementById('ft-pal'); if (pal) pal.remove();
  H.removeAttribute('data-pal');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  setTimeout(build, 600); setTimeout(after, 1300); setTimeout(header, 700); setTimeout(header, 2500); setTimeout(() => { mark(); relabel(); }, 1200); setTimeout(relabel, 3000);
})();
