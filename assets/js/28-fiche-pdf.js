(function () {
  const $ = id => document.getElementById(id), H = document.documentElement;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ================= Fiche PDF ================= */
  function viewTitle() { const n = $('header-active-tab-name'); return (n && n.textContent.trim()) || 'Simulation'; }
  function resultRows(view) {
    const rows = []; const seen = new Set();
    view.querySelectorAll('.inv-row, .bar-row, .res-row, [class*="result"] .flex.justify-between').forEach(r => {
      if (r.closest('.ft-mail') || !r.offsetParent) return;
      const kids = [...r.children].filter(k => k.textContent.trim());
      if (kids.length < 2) return;
      const k = kids[0].textContent.trim().replace(/\s+/g, ' '), v = kids[kids.length - 1].textContent.trim().replace(/\s+/g, ' ');
      if (!k || !v || k.length > 120 || seen.has(k)) return; seen.add(k); rows.push([k, v]);
    });
    const hero = view.querySelector('.inv-hero');
    if (hero && hero.offsetParent) { const s = hero.querySelector('span'), st = hero.querySelector('strong'); if (s && st) rows.unshift([s.textContent.trim(), st.textContent.trim()]); }
    return rows.slice(0, 30);
  }
  window.ftPrintSheet = function (title, rows, text) {
    let p = $('ft-print'); if (!p) { p = document.createElement('div'); p.id = 'ft-print'; document.body.appendChild(p); }
    const d = new Date();
    p.innerHTML = '<h1>' + esc(title) + '</h1><div class="fp-meta">Espace Conseiller France Travail · fiche établie le ' + d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' · simulation indicative</div>' +
      (rows && rows.length ? '<h2>Résultats</h2><table>' + rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>' : '') +
      (text ? '<h2>Message à l’allocataire</h2><div class="fp-txt">' + esc(text) + '</div>' : '') +
      '<div class="fp-foot">Document de travail : les montants et dates sont donnés à titre indicatif et doivent être confirmés par la décision notifiée.</div>';
    document.body.classList.add('ft-printing');
    const done = () => { document.body.classList.remove('ft-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(done, 1500); }, 60);
  };
  function pdfButtons() {
    document.querySelectorAll('.ft-mail .ft-mail-btns').forEach(g => {
      if (g.querySelector('.ft-mail-pdf')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-mail-pdf'; b.textContent = 'Fiche PDF'; b.title = 'Imprimer ou enregistrer en PDF : résultats et mail';
      g.insertBefore(b, g.firstChild);
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ft-mail-pdf'); if (!b) return;
    const p = b.closest('.ft-mail'), view = b.closest('[id^="view-"]'), ta = p.querySelector('textarea');
    window.ftPrintSheet(viewTitle(), view ? resultRows(view) : [], ta ? ta.value : '');
  });

  /* ================= Mes outils épinglés ================= */
  const getPins = () => { try { return JSON.parse(ls.get('ft_pins') || '[]'); } catch (e) { return []; } };
  const setPins = a => { if (window.safeLS && safeLS.setItem) safeLS.setItem('ft_pins', JSON.stringify(a)); else ls.set('ft_pins', JSON.stringify(a)); try { window.dispatchEvent(new StorageEvent('storage', { key: 'ft_pins' })); } catch (e) {} };
  function allTools() {
    const list = $('burger-tabs-list'); if (!list) return [];
    const out = [];
    list.querySelectorAll('.menu-sec').forEach(sec => {
      const h = sec.querySelector('.menu-sec-h'), g = h ? h.textContent.trim() : '';
      sec.querySelectorAll('button[onclick^="switchNavTab"]').forEach(b => {
        const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m) return;
        const lb = b.querySelector('.text-xs'), svg = b.querySelector('svg');
        out.push({ id: m[1], label: (lb ? lb.textContent : b.textContent).trim(), group: g, icon: svg ? svg.outerHTML.replace(/\sclass="[^"]*"/, '') : '' });
      });
    });
    [...list.children].map(el => el.matches && el.matches('button[onclick^="switchNavTab"]') ? el : (el.classList && el.classList.contains('ft-pen-wrap') ? el.querySelector('button[onclick^="switchNavTab"]') : null)).filter(Boolean).forEach(b => {
      const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m || m[1] === 'home' || out.some(t => t.id === m[1])) return;
      const lb = b.querySelector('.text-xs'), svg = b.querySelector('svg');
      const it = { id: m[1], label: (lb ? lb.textContent : b.textContent).trim(), group: m[1] === 'cvm' ? 'Mails' : 'Autres outils', icon: svg ? svg.outerHTML.replace(/\sclass="[^"]*"/, '') : '' };
      if (m[1] === 'cvm') out.unshift(it); else out.push(it);
    });
    if (window.__ftIsAdmin && window.__ftIsAdmin()) out.push({ id: 'admin', label: 'Espace administrateur', group: 'Administration (vous seul)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>' });
    return out;
  }
  const MAIL_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>';
  function allMails() { try { return (templates || []).map(t => ({ id: 'tpl:' + t.id, tid: t.id, label: t.title || '(sans titre)', group: t.category || '', mine: !(t.isOfficial || t.shared), icon: MAIL_ICO })); } catch (e) { return []; } }
  const pinCol = g => /invalidit/i.test(g) ? 'fh-c6' : /ouverture|droits/i.test(g) && !/fin de droits/i.test(g) ? 'fh-c1' : /ans|création|cumul/i.test(g) ? 'fh-c2' : /fin de droits|passage/i.test(g) ? 'fh-c3' : /situation/i.test(g) ? 'fh-c4' : /référence|calcul/i.test(g) ? 'fh-c5' : 'fh-c1';
  function pinsCard() {
    const hero = document.querySelector('#view-home .fh-C .home-hero'); if (!hero) return;
    let c = document.querySelector('#view-home .fh-pins');
    if (!c) { c = document.createElement('section'); c.className = 'fh-card fh-pins fh-c5'; hero.parentNode.insertBefore(c, hero.nextSibling); }
    const tools = allTools(), pins = getPins().map(id => tools.find(t => t.id === id)).filter(Boolean);
    const html = '<div class="fh-gh"><span class="fh-gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg></span><h3>Mes favoris</h3><button type="button" class="fh-pin-edit">' + (pins.length ? 'Modifier' : 'Choisir') + '</button></div>' +
      (pins.length ? '<div class="fh-chips">' + pins.map(t => '<button type="button" class="fh-chip fh-pin ' + (t.tid != null ? 'fh-c2 fh-pin-mail' : t.id === 'admin' ? 'fh-c6' : pinCol(t.group)) + '" data-id="' + esc(t.id) + '" title="' + esc(t.tid != null ? 'Mail : ' + t.label : t.group) + '"><span class="fh-ci">' + t.icon + '</span><span class="fh-cl">' + esc(t.label) + '</span></button>').join('') + '</div>' : '<p class="fh-pin-empty">Cochez les outils que vous utilisez le plus (CVM Direct compris) pour les retrouver ici en un geste.</p>');
    if (c.dataset.h !== html) { c.innerHTML = html; c.dataset.h = html; }
  }
  document.addEventListener('click', e => {
    const p = e.target.closest && e.target.closest('.fh-pins .fh-pin');
    if (p) { const id = p.dataset.id; if (id.indexOf('tpl:') === 0) { const tid = id.slice(4); switchNavTab('cvm'); setTimeout(() => { try { const t = templates.find(x => String(x.id) === tid); if (t) { try { if (typeof currentCategory !== 'undefined') { currentCategory = 'all'; } } catch (er) {} try { localStorage.setItem('ft_tpl_scope', 'all'); } catch (er) {} selectTemplate(t.id); } } catch (er) {} }, 60); } else switchNavTab(id); return; }
    if (e.target.closest && e.target.closest('.fh-pins .fh-pin-edit')) openPins();
  });
  function openPins() {
    let d = $('ft-pins-dlg'); if (!d) { d = document.createElement('div'); d.id = 'ft-pins-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); document.body.appendChild(d); }
    const tools = allTools();
    let q = '';
    const box = it => '<label><input type="checkbox" value="' + esc(it.id) + '"' + (getPins().includes(it.id) ? ' checked' : '') + '><span class="pd-l">' + esc(it.label) + '</span></label>';
    function list() {
      const nq = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const match = it => !nq || (it.label + ' ' + it.group).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(nq);
      let last = '', html = '';
      tools.filter(match).forEach(t => { if (t.group !== last) html += '<div class="pd-g">' + esc(last = t.group) + '</div>'; html += box(t); });
      return html || '<p class="pd-none">Aucun résultat.</p>';
    }
    d.innerHTML = '<div class="pd-box"><div class="pd-h"><h3>Mes favoris</h3><button type="button" class="pd-x" aria-label="Fermer">×</button></div>' +
      '<div class="pd-q"><input type="search" placeholder="Rechercher un outil…"></div><div class="pd-list">' + list() + '</div></div>';
    d.classList.add('on');
    d.onclick = e => { if (e.target === d || e.target.closest('.pd-x')) d.classList.remove('on'); };
    d.oninput = e => { if (e.target.matches('.pd-q input')) { q = e.target.value; d.querySelector('.pd-list').innerHTML = list(); } };
    d.onchange = e => {
      if (e.target.type !== 'checkbox') return;
      const id = e.target.value, cur = getPins().filter(x => x !== id && x.indexOf('tpl:') !== 0);
      if (e.target.checked) cur.push(id);
      setPins(cur); pinsCard();
    };
  }
  window.ftOpenPins = openPins;

  /* ================= Notifications et pastille de l’icône ================= */
  const canNotif = 'Notification' in window && 'serviceWorker' in navigator;
  const notifOn = () => canNotif && Notification.permission === 'granted' && ls.get('ft_notif') === '1';
  function notify(title, body, tag, go) {
    if (!notifOn()) return;
    navigator.serviceWorker.ready.then(r => r.showNotification(title, { body: body, tag: tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { go: go || '' } })).catch(() => { try { const n = new Notification(title, { body: body, tag: tag }); n.onclick = () => { window.focus(); ftGo(go); }; } catch (e) {} });
  }
  window.ftNotify = notify;
  window.ftNotifOn = notifOn;
  /* Clic sur une notification : on ouvre ce qui la concerne */
  function ftGo(go) {
    if (!go) return;
    setTimeout(() => {
      try {
        if (go === 'news') { if (window.ftShowNews) window.ftShowNews(); }
        else if (go === 'reload') location.replace(location.pathname + '?v=' + Date.now());
        else if (go === 'admin') switchNavTab('admin');
        else if (go === 'home') switchNavTab('home');
        else if (/^t-[\w-]+$/.test(go)) { const t = go.slice(2); switchNavTab(/^\d+$/.test(t) ? +t : t); }
        else if (window.FT_GO && window.FT_GO[go]) window.FT_GO[go]();
      } catch (e) {}
    }, 400);
  }
  window.ftGo = ftGo;
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.ftGo) ftGo(e.data.ftGo); });
  (function () { const m = /[?&]go=([\w-]+)/.exec(location.search); if (m) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} setTimeout(() => ftGo(m[1]), 1200); } })();
  window.ftEnableNotifs = function () {
    if (!canNotif) { toast('Les notifications ne sont pas disponibles ici. Sur iPhone, installez d’abord le site sur l’écran d’accueil.', 'info'); return; }
    if (ls.get('ft_notif') === '1' && Notification.permission === 'granted') { ls.set('ft_notif', '0'); toast('Notifications désactivées', 'info'); menuLabel(); return; }
    Notification.requestPermission().then(p => {
      if (p === 'granted') { ls.set('ft_notif', '1'); toast('Notifications activées', 'success'); notify('Notifications activées', 'Vous serez prévenu des nouveautés du site.', 'ft-test'); }
      else toast('Notifications refusées : vous pouvez les autoriser dans les réglages du téléphone', 'info');
      menuLabel();
    });
  };
  function latestNews() { try { const n = (window.FT_NEWS || []); return n[0]; } catch (e) { return null; } }
  function checkNotifs() {
    const meta = document.querySelector('meta[name="ft-version"]'), v = meta && meta.content;
    if (v && ls.get('ft_notif_v') && ls.get('ft_notif_v') !== v) { const n = latestNews(); notify('Espace Conseiller mis à jour', n && n.items ? n.items[0] : 'De nouvelles fonctions sont disponibles.', 'ft-news', 'news'); }
    if (v) ls.set('ft_notif_v', v);
    badge();
  }
  let props = 0;
  document.addEventListener('ft-props', e => { const n = +e.detail || 0; if (n > props && notifOn() && document.hidden) notify('Proposition de modèle', n + ' proposition(s) de collègues à valider', 'ft-props', 'admin'); props = n; badge(); });
  function badge() {
    const due = document.querySelector('#view-home .fh-alert') ? 1 : 0;
    const n = props + due;
    try { if (navigator.setAppBadge) { n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } } catch (e) {}
  }
  function menuLabel() {
    const m = $('ft-more'); if (!m) return;
    let b = m.querySelector('[data-k="notif"]');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'notif';
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span></span>';
      b.addEventListener('click', ev => { ev.stopPropagation(); H.classList.remove('ft-more-on'); setTimeout(window.ftEnableNotifs, 30); });
      const pinsB = document.createElement('button'); pinsB.type = 'button'; pinsB.setAttribute('role', 'menuitem'); pinsB.dataset.k = 'pins';
      pinsB.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg><span>Mes favoris</span>';
      pinsB.addEventListener('click', ev => { ev.stopPropagation(); H.classList.remove('ft-more-on'); setTimeout(openPins, 30); });
      const hr = m.querySelector('hr'); m.insertBefore(b, hr || null); m.insertBefore(pinsB, hr || null);
    }
    b.querySelector('span').textContent = notifOn() ? 'Désactiver les notifications' : 'Activer les notifications';
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNotifs(); });

  /* ================= Glossaire au survol ================= */
  let GL = null;
  function gl() {
    if (GL) return GL;
    const g = window.FT_GLOSS || []; if (!g.length) return null;
    GL = { map: {}, re: null };
    g.forEach(x => { GL.map[x[0]] = x; });
    const keys = g.map(x => x[0]).filter(k => /^[A-Z][A-Z0-9-]{1,7}$/.test(k)).sort((a, b) => b.length - a.length);
    GL.re = new RegExp('(^|[^A-Za-zÀ-ÿ0-9-])(' + keys.map(k => k.replace(/[-]/g, '\\-')).join('|') + ')(?![A-Za-zÀ-ÿ0-9-])');
    return GL;
  }
  const SKIP = 'INPUT,TEXTAREA,SELECT,BUTTON,A,ABBR,SCRIPT,STYLE,SVG,CODE,PRE,OPTION,H1,H2';
  function glossify(root) {
    const G = gl(); if (!G || !root) return;
    const done = new Set([...root.querySelectorAll('abbr.ft-g')].map(a => a.dataset.g));
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => {
        if (!n.nodeValue || n.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement; if (!p || p.closest(SKIP) || p.closest('.ft-mail,.hub-bar,.rg-tabs,[contenteditable="true"],#view-glossaire,.fh-chip')) return NodeFilter.FILTER_REJECT;
        return G.re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = []; let n; while ((n = walker.nextNode()) && nodes.length < 400) nodes.push(n);
    nodes.forEach(t => {
      const m = G.re.exec(t.nodeValue); if (!m) return;
      const key = m[2]; if (done.has(key)) return; done.add(key);
      const start = m.index + m[1].length;
      const after = t.splitText(start); after.splitText(key.length);
      const ab = document.createElement('abbr'); ab.className = 'ft-g'; ab.tabIndex = 0; ab.dataset.g = key; ab.textContent = key;
      ab.setAttribute('aria-label', key + ' : ' + G.map[key][1]);
      after.parentNode.replaceChild(ab, after);
    });
  }
  function tip(el) {
    let t = $('ft-gtip'); if (!t) { t = document.createElement('div'); t.id = 'ft-gtip'; t.setAttribute('role', 'tooltip'); document.body.appendChild(t); }
    if (!el) { t.style.display = 'none'; return; }
    const g = (window.FT_GLOSS || []).find(x => x[0] === el.dataset.g); if (!g) return;
    t.innerHTML = '<b>' + esc(g[0]) + ' · ' + esc(g[1]) + '</b>' + esc(g[2] || '');
    t.style.display = 'block';
    const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = Math.min(Math.max(10, r.left + r.width / 2 - w / 2), innerWidth - w - 10), y = r.bottom + 8;
    if (y + h > innerHeight - 70) y = r.top - h - 8;
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  document.addEventListener('mouseover', e => { const a = e.target.closest && e.target.closest('abbr.ft-g'); if (a) tip(a); });
  document.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('abbr.ft-g')) tip(null); });
  document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('abbr.ft-g')) tip(e.target); });
  document.addEventListener('focusout', e => { if (e.target.matches && e.target.matches('abbr.ft-g')) tip(null); });
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('abbr.ft-g'); if (a) { e.preventDefault(); tip(a); } else tip(null); }, true);
  window.addEventListener('scroll', () => tip(null), true);
  function glossActive() {
    const t = tab(); if (t === 'home' || t === 'cvm' || t === 'glossaire') return;
    const v = document.querySelector('[id^="view-"]:not(.hidden):not(#view-home):not(#view-cvm)');
    if (v) glossify(v);
  }

  /* ================= Démarrage ================= */
  function all() { try { pdfButtons(); pinsCard(); menuLabel(); glossActive(); badge(); } catch (e) { console.warn(e); } }
  if (typeof switchNavTab === 'function') { const _s = switchNavTab; switchNavTab = function () { const r = _s.apply(this, arguments); setTimeout(all, 80); return r; }; }
  let mt = null;
  window.ftOnDom(() => { pdfButtons(); if (tab() === 'home') pinsCard(); glossActive(); });
  window.addEventListener('storage', e => { if (e.key === 'ft_pins' && tab() === 'home') pinsCard(); });
  const go = () => { setTimeout(all, 500); setTimeout(checkNotifs, 2500); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
