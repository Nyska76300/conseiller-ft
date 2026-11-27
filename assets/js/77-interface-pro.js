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
  const TABS = () => {
    const hubs = window.FT_HUBS || [];
    return [['fav', 'Favoris'], ['cvm', 'Mails']].concat(hubs.map(h => { const n = nameOf(h.id, h.name); return [h.id, n === h.name ? n.replace(/\s*:.*$/, '') : n]; })).concat([['jour', nameOf('jour', 'Ma journée')]]);
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
    return h ? h.id : t;
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
    jour: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.4" fill="currentColor" stroke="none"/>'
  };
  const GC = { fav: '#ff9f0a', cvm: '#0a84ff', 'hub:ouverture': '#30b0c7', 'hub:ans': '#34c759', 'hub:fin': '#ff375f', 'hub:situations': '#ff9500', 'hub:calculs': '#5e5ce6', jour: '#8e8e93' };
  const ios = id => G[id] ? '<span class="ios-ic" style="--ios:' + GC[id] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + G[id] + '</svg></span>' : '';
  window.ftIosIcon = ios;
  const STAR = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const CHEV = '<svg class="pt-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* Contenu du menu de chaque onglet */
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
    const h = (window.FT_HUBS || []).find(x => x.id === id);
    if (h) return [{ h: nameOf(h.id, h.name), items: h.members.map(m => ({ k: 'tab', v: m[0], t: nameOf(m[0], m[1]) })) }];
    return null;
  }
  function menuHtml(id) {
    const G = menuItems(id); if (!G) return '';
    const it = x => '<button type="button" role="menuitem" data-mk="' + x.k + '" data-mv="' + esc(x.v == null ? '' : x.v) + '"><span>' + esc(x.t) + '</span>' + (x.n != null && x.n !== '' ? '<small>' + x.n + '</small>' : '') + '</button>';
    return G.map(g => g.empty ? '<p class="pt-empty">' + esc(g.empty) + '</p>' : g.foot ? '<div class="pt-foot">' + g.foot.map(it).join('') + '</div>' :
      '<div class="pt-grp">' + (g.h ? '<div class="pt-gh">' + esc(g.h) + '</div>' : '') + '<div class="pt-list' + (g.cols && g.items.length > 8 ? ' pt-cols' : '') + '">' + g.items.map(it).join('') + '</div></div>').join('');
  }
  let openId = null, tOpen = 0, tClose = 0;
  function pop() {
    let m = document.getElementById('ft-ptmenu');
    if (!m) {
      m = document.createElement('div'); m.id = 'ft-ptmenu'; m.className = 'ft-ptmenu'; m.setAttribute('role', 'menu'); document.body.appendChild(m);
      m.addEventListener('mouseenter', () => clearTimeout(tClose));
      m.addEventListener('mouseleave', () => { tClose = setTimeout(close, 180); });
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
    openId = null;
  }
  const hoverable = () => window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function build() {
    if (document.getElementById('ft-ptabs')) return;
    const hd = document.querySelector('header'); if (!hd) return;
    const n = document.createElement('nav'); n.id = 'ft-ptabs'; n.className = 'ft-ptabs'; n.setAttribute('aria-label', 'Rubriques');
    n.innerHTML = '<div class="ft-ptabs-in">' + TABS().map(([id, name]) => {
      const hasMenu = id !== 'jour';
      return '<button type="button" data-pt="' + esc(id) + '"' + (hasMenu ? ' aria-haspopup="menu" aria-expanded="false"' : '') + '>' + ios(id) + '<span class="pt-l">' + esc(name) + '</span>' + (hasMenu ? CHEV : '') + '</button>';
    }).join('') + '</div>';
    n.addEventListener('click', e => {
      const b = e.target.closest('[data-pt]'); if (!b) return;
      const id = b.dataset.pt;
      if (id === 'fav') { if (openId === 'fav') close(); else open('fav', !hoverable()); return; }
      close(); try { switchNavTab(id); } catch (er) {}
    });
    n.addEventListener('mouseover', e => {
      if (!hoverable()) return;
      const b = e.target.closest('[data-pt]'); if (!b) return;
      clearTimeout(tClose); clearTimeout(tOpen);
      const id = b.dataset.pt; if (openId === id) return;
      tOpen = setTimeout(() => open(id), openId ? 0 : 140);
    });
    n.addEventListener('mouseleave', () => { clearTimeout(tOpen); tClose = setTimeout(close, 220); });
    n.addEventListener('keydown', e => {
      const b = e.target.closest('[data-pt]'); if (!b) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); open(b.dataset.pt, true); }
      else if (e.key === 'Escape') close();
    });
    n.querySelector('.ft-ptabs-in').addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    document.addEventListener('click', e => { if (openId && !e.target.closest('#ft-ptmenu,#ft-ptabs')) close(); });
    hd.after(n);
    mark();
  }
  /* En-tête : icônes alignées, de même taille */
  const HI = {
    rp: '<path d="M5 21V4.5M5 4.5h11l-2 3.5 2 3.5H5"/>',
  };
  function header() {
    const rp = document.getElementById('rp-btn');
    if (rp && !rp.dataset.pro) { rp.dataset.pro = '1'; rp.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + HI.rp + '</svg><span class="sr-only">Repères</span>'; }
    const rl = [...document.querySelectorAll('header button')].find(b => b.title === 'Recharger la page'); if (rl) rl.classList.add('pro-hide');
  }
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
    const sum = document.querySelector('#view-home .fh-sum'), d1 = sum && sum.querySelector(':scope > .fh-grp.fh-c1'); if (d1 && sum.firstElementChild !== d1) sum.prepend(d1);
    const hero = document.querySelector('#view-home .home-hero'); if (!hero) return;
    if (!hero.querySelector('.pro-acts')) {
      const a = document.createElement('div'); a.className = 'pro-acts'; a.setAttribute('role', 'group'); a.setAttribute('aria-label', 'Actions rapides');
      a.innerHTML = '<button type="button" data-a="dos" class="pri">' + sv(AI.dos, '#0a84ff') + '<span><b>Nouveau dossier</b><small>Droits, ARE, durée et mail</small></span></button>' +
        '<button type="button" data-a="fav">' + sv(AI.fav, '#ff9f0a') + '<span><b>Mails favoris</b><small>Vos modèles étoilés</small></span></button>' +
        '<button type="button" data-a="top">' + sv(AI.top, '#34c759') + '<span><b>Plus utilisés</b><small>Vos mails les plus copiés</small></span></button>' +
        '<button type="button" data-a="sit">' + sv(AI.sit, '#5e5ce6') + '<span><b>Que faire si…</b><small>Une situation, le bon outil</small></span></button>';
      a.addEventListener('click', e => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        const k = b.dataset.a;
        try {
          if (k === 'dos') { const x = document.querySelector('#view-home .fh-dos .fh-btn, #view-home .fh-dos button'); if (x) x.click(); else switchNavTab('dossier'); }
          else if (k === 'fav' || k === 'top') { switchNavTab('cvm'); setTimeout(() => { try { selectCategory(k === 'fav' ? 'favorites' : '__top'); } catch (er) {} }, 40); }
          else if (k === 'sit') { const x = document.querySelector('#view-home .sit-home'); if (x) x.click(); }
        } catch (er) {}
      });
      const srch = hero.querySelector('.home-search'); (srch || hero.firstChild).after(a);
    }
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
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.rg-tab')) setTimeout(rulesToc, 60); });

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

  function after() { try { home(); simLayout(); rulesToc(); } catch (e) { console.warn(e); } }
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
