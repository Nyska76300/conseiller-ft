/* 2026-11-27.25 : cloche de notifications de l'administrateur.
   Compte en direct (relevé toutes les 30 s, et dès que l'onglet revient au premier plan) :
   - questions, idées et erreurs signalées par les agents (site_feedback non traités) ;
   - propositions de modèles de mails (template_proposals) ;
   - mises à jour réglementaires de la veille en attente de validation (reglementation/maj.json). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isAdmin = () => { try { return !!(window.__ftIsAdmin && window.__ftIsAdmin()); } catch (e) { return false; } };
  const KIND = { question: ['Question d’un agent', '#0a84ff'], idee: ['Suggestion', '#34c759'], erreur: ['Erreur signalée', '#ff3b30'] };
  let items = [], timer = null, busy = false;
  const BELL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  const ago = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return isNaN(m) ? '' : m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.round(m / 60) + ' h' : new Date(d).toLocaleDateString('fr-FR'); };

  function build() {
    if ($('ft-bell')) return;
    const acct = $('ft-acct'); if (!acct) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-bell'; b.className = 'ft-bell'; b.hidden = true;
    b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.title = 'Notifications';
    b.innerHTML = BELL + '<span class="ft-bell-n" hidden></span>';
    acct.parentNode.insertBefore(b, acct);
    const pop = document.createElement('div'); pop.id = 'ft-bell-pop'; pop.className = 'ft-bell-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(pop);
    b.addEventListener('click', e => { e.stopPropagation(); const on = !pop.classList.contains('on'); if (on) { draw(); place(); refresh(); } pop.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); });
    pop.addEventListener('click', e => {
      const an = e.target.closest('[data-ans]'); if (an) { e.stopPropagation(); answer(an.dataset.ans); return; }
      const a = e.target.closest('[data-go]'); if (!a) return; const g = a.dataset.go;
      if (g === 'read') { markAllRead(); return; }
      pop.classList.remove('on');
      try {
        if (g === 'admin') switchNavTab('admin');
        else if (g === 'news') { if (window.ftShowNews) window.ftShowNews(); }
        else if (g === 'regs') switchNavTab('journal');
        else if (g.indexOf('tpl:') === 0 && window.ftOpenPin) window.ftOpenPin(g);
      } catch (er) {}
      if (!isAdmin()) setTimeout(markAllRead, 300);
    });
    document.addEventListener('click', e => { if (pop.classList.contains('on') && !e.target.closest('#ft-bell,#ft-bell-pop')) pop.classList.remove('on'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.classList.remove('on'); });
  }
  function place() { const b = $('ft-bell'), p = $('ft-bell-pop'); if (!b || !p) return; const r = b.getBoundingClientRect(); p.style.top = (r.bottom + 8) + 'px'; p.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; }
  function draw() {
    const p = $('ft-bell-pop'); if (!p) return;
    const adm = isAdmin();
    const groups = adm ? [['fb', 'Questions et suggestions des agents'], ['prop', 'Propositions de modèles'], ['reg', 'Veille réglementaire']] : [['news', 'Nouveautés du site'], ['reg', 'Réglementation'], ['prop', 'Modèles communs']];
    p.innerHTML = '<header><b>Notifications</b><small>' + items.length + (adm ? ' à traiter' : ' non lue(s)') + '</small></header>' +
      (items.length ? groups.map(g => { const L = items.filter(x => x.g === g[0]); return L.length ? '<div class="fb-g"><div class="fb-gh">' + g[1] + ' <span>' + L.length + '</span></div>' + L.slice(0, 6).map(x => '<button type="button" class="fb-it" data-go="1"><i style="--c:' + x.c + '"></i><span><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span><em>' + esc(x.d) + '</em></button>').join('') + (L.length > 6 ? '<div class="fb-more">+ ' + (L.length - 6) + ' autre(s)</div>' : '') + '</div>' : ''; }).join('') : '<p class="fb-none">Rien à traiter pour le moment.</p>') +
      (adm ? '<button type="button" class="fb-all" data-go="admin">Ouvrir l’espace administrateur</button>' : (items.length ? '<button type="button" class="fb-all" data-go="read">Tout marquer comme lu</button>' : ''));
  }
  function badge() {
    const b = $('ft-bell'); if (!b) return;
    const adm = isAdmin(); b.hidden = false;
    const n = b.querySelector('.ft-bell-n'); const c = items.length;
    n.hidden = !c; n.textContent = c > 99 ? '99+' : String(c);
    b.classList.toggle('has', !!c);
    b.title = c ? c + ' notification(s)' + (adm ? ' à traiter' : ' non lue(s)') : 'Aucune notification';
  }
  /* Conseillers (non administrateurs) : nouveautés du site, mises à jour réglementaires validées, nouveaux modèles communs */
  const SEEN = 'ft_bell_seen';
  const seenGet = () => { try { return JSON.parse(localStorage.getItem(SEEN) || 'null'); } catch (e) { return null; } };
  const seenSet = v => { try { localStorage.setItem(SEEN, JSON.stringify(v)); } catch (e) {} };
  const curVer = () => (document.querySelector('meta[name="ft-version"]') || {}).content || '';
  const cmpV = (a, b) => { const pa = String(a).split('.'), pb = String(b).split('.'); if (pa[0] !== pb[0]) return pa[0] < pb[0] ? -1 : 1; return (+pa[1] || 0) - (+pb[1] || 0); };
  function agentItems() {
    let sn = seenGet();
    const shared = (() => { try { return templates.filter(t => t.shared).map(t => String(t.id)); } catch (e) { return []; } })();
    let dec = {}; try { dec = JSON.parse(localStorage.getItem('ft_regs_dec') || '{}') || {}; } catch (e) {}
    const okRegs = Object.keys(dec).filter(k => dec[k] === 'ok');
    if (!sn) { sn = { v: curVer(), regs: okRegs, tpl: shared }; seenSet(sn); }
    const out = [];
    (window.FT_NEWS || []).filter(e => cmpV(e.v, sn.v) > 0).slice(0, 5).forEach(e => out.push({ g: 'news', t: 'Nouveautés du ' + e.date, s: (e.items && e.items[0] || '').replace(/<[^>]+>/g, ''), d: '', c: '#ff375f', go: 'news' }));
    okRegs.filter(id => !(sn.regs || []).includes(id)).forEach(id => out.push({ g: 'reg', t: 'Mise à jour réglementaire appliquée', s: id, d: '', c: '#ff9500', go: 'regs' }));
    shared.filter(id => !(sn.tpl || []).includes(id)).forEach(id => { let t = null; try { t = templates.find(x => String(x.id) === id); } catch (e) {} out.push({ g: 'prop', t: 'Nouveau modèle commun', s: t ? t.title : id, d: '', c: '#0a84ff', go: 'tpl:' + id }); });
    return out;
  }
  function markAllRead() {
    let dec = {}; try { dec = JSON.parse(localStorage.getItem('ft_regs_dec') || '{}') || {}; } catch (e) {}
    let shared = []; try { shared = templates.filter(t => t.shared).map(t => String(t.id)); } catch (e) {}
    seenSet({ v: curVer(), regs: Object.keys(dec).filter(k => dec[k] === 'ok'), tpl: shared });
    items = []; badge(); draw();
  }
  window.ftBellMarkRead = markAllRead;
  async function refresh() {
    build();
    if (!isAdmin()) { items = agentItems(); badge(); if ($('ft-bell-pop') && $('ft-bell-pop').classList.contains('on')) draw(); return; }
    if (busy || !window.__ftRest) { badge(); return; }
    busy = true;
    const out = [];
    try {
      const fb = await window.__ftRest('/rest/v1/site_feedback?select=id,kind,message,email,created_at&done=is.false&order=created_at.desc&limit=50').catch(() => []);
      (fb || []).forEach(r => { const k = KIND[r.kind] || ['Message', '#8e8e93']; out.push({ g: 'fb', id: r.id, full: String(r.message || ''), q: r.kind === 'question', t: k[0] + (r.email ? ' · ' + r.email.split('@')[0] : ''), s: String(r.message || '').slice(0, 90), d: ago(r.created_at), c: k[1] }); });
      const pr = await window.__ftRest('/rest/v1/template_proposals?select=id,template,proposer_email,created_at&order=created_at.desc').catch(() => []);
      (pr || []).forEach(r => out.push({ g: 'prop', t: (r.template && r.template.title) || 'Modèle proposé', s: 'Proposé par ' + String(r.proposer_email || 'un agent').split('@')[0], d: ago(r.created_at), c: '#af52de' }));
      const mj = await fetch('reglementation/maj.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
      let dec = {}; try { dec = JSON.parse(localStorage.getItem('ft_regs_dec') || '{}') || {}; } catch (e) {}
      ((mj && mj.updates) || []).filter(u => u && u.id && !dec[u.id]).forEach(u => out.push({ g: 'reg', t: u.titre || 'Mise à jour réglementaire', s: u.resume || u.source || 'En attente de validation', d: u.date || '', c: '#ff9500' }));
    } catch (e) {}
    const before = items.length; items = out; busy = false;
    badge(); if ($('ft-bell-pop') && $('ft-bell-pop').classList.contains('on')) draw();
    if (items.length > before && before >= 0 && refresh.done) { const b = $('ft-bell'); if (b) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); } }
    refresh.done = true;
  }
  /* Répondre à une question d'agent : la réponse rejoint la FAQ du site (visible par tous) et la question est marquée traitée */
  function answer(id) {
    const it = items.find(x => String(x.id) === String(id)); if (!it) return;
    const q0 = it.full.replace(/^Assistant — question sans réponse : /, '');
    const q = prompt('Question telle qu’elle apparaîtra dans la FAQ :', q0); if (!q) return;
    const a = prompt('Votre réponse (visible par tous les conseillers) :', ''); if (!a) return;
    const list = (window.ftFaqList ? window.ftFaqList() : []).slice(); list.unshift([q.trim(), a.trim()]);
    const save = window.__ftSaveShared ? window.__ftSaveShared('__ft_faq', { items: list }) : Promise.reject(new Error('Connexion indisponible'));
    save.then(() => { try { localStorage.setItem('ft_faq', JSON.stringify(list)); } catch (e) {} return window.__ftRest('/rest/v1/site_feedback?id=eq.' + encodeURIComponent(id), { method: 'PATCH', prefer: 'return=minimal', body: { done: true } }); })
      .then(() => { try { showToast('Réponse ajoutée à la FAQ', 'success'); } catch (e) {} refresh(); })
      .catch(e => { try { showToast('Enregistrement impossible : ' + ((e && e.message) || e), 'error'); } catch (er) {} });
  }
  window.ftBellRefresh = refresh;
  function start() { build(); refresh(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden) refresh(); }, 30000); }
  document.addEventListener('ft-varcfg', () => refresh());
  document.addEventListener('ft-admin', start);
  document.addEventListener('ft-props', () => refresh());
  document.addEventListener('ft-regs', () => refresh());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setTimeout(start, 1500);
})();
