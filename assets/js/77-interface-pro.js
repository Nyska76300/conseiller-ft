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
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(b => { const x = T.find(t => t[0] === b.dataset.pt); const sp = b.querySelector('span'); if (x && sp && sp.textContent !== x[1]) sp.textContent = x[1]; });
  }
  if (typeof window.ftApplyLabels === 'function') { const _l = window.ftApplyLabels; window.ftApplyLabels = function () { const r = _l.apply(this, arguments); try { relabel(); } catch (e) {} return r; }; }
  const cur = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  function activeKey() {
    const t = cur(); if (t.indexOf('hub:') === 0) return t;
    const h = window.ftHubOf ? window.ftHubOf(t) : null;
    return h ? h.id : t;
  }
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
      return '<button type="button" data-pt="' + esc(id) + '"' + (hasMenu ? ' aria-haspopup="menu" aria-expanded="false"' : '') + '>' + (id === 'fav' ? STAR : '') + '<span>' + esc(name) + '</span>' + (hasMenu ? CHEV : '') + '</button>';
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
  function mark() {
    const k = activeKey();
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(b => { const on = b.dataset.pt === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); try { mark(); close(); } catch (e) {} return r; };
    window.switchNavTab = switchNavTab;
  }
  const pal = document.getElementById('ft-pal'); if (pal) pal.remove();
  H.removeAttribute('data-pal');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  setTimeout(build, 600); setTimeout(() => { mark(); relabel(); }, 1200); setTimeout(relabel, 3000);
})();
