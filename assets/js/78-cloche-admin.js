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
    b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.title = 'Notifications administrateur';
    b.innerHTML = BELL + '<span class="ft-bell-n" hidden></span>';
    acct.parentNode.insertBefore(b, acct);
    const pop = document.createElement('div'); pop.id = 'ft-bell-pop'; pop.className = 'ft-bell-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(pop);
    b.addEventListener('click', e => { e.stopPropagation(); const on = !pop.classList.contains('on'); if (on) { draw(); place(); refresh(); } pop.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); });
    pop.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (!a) return; pop.classList.remove('on'); try { switchNavTab('admin'); } catch (er) {} });
    document.addEventListener('click', e => { if (pop.classList.contains('on') && !e.target.closest('#ft-bell,#ft-bell-pop')) pop.classList.remove('on'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.classList.remove('on'); });
  }
  function place() { const b = $('ft-bell'), p = $('ft-bell-pop'); if (!b || !p) return; const r = b.getBoundingClientRect(); p.style.top = (r.bottom + 8) + 'px'; p.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; }
  function draw() {
    const p = $('ft-bell-pop'); if (!p) return;
    const groups = [['fb', 'Questions et suggestions des agents'], ['prop', 'Propositions de modèles'], ['reg', 'Veille réglementaire']];
    p.innerHTML = '<header><b>Notifications</b><small>' + items.length + ' à traiter</small></header>' +
      (items.length ? groups.map(g => { const L = items.filter(x => x.g === g[0]); return L.length ? '<div class="fb-g"><div class="fb-gh">' + g[1] + ' <span>' + L.length + '</span></div>' + L.slice(0, 6).map(x => '<button type="button" class="fb-it" data-go="1"><i style="--c:' + x.c + '"></i><span><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></span><em>' + esc(x.d) + '</em></button>').join('') + (L.length > 6 ? '<div class="fb-more">+ ' + (L.length - 6) + ' autre(s)</div>' : '') + '</div>' : ''; }).join('') : '<p class="fb-none">Rien à traiter pour le moment.</p>') +
      '<button type="button" class="fb-all" data-go="1">Ouvrir l’espace administrateur</button>';
  }
  function badge() {
    const b = $('ft-bell'); if (!b) return;
    const adm = isAdmin(); b.hidden = !adm;
    const n = b.querySelector('.ft-bell-n'); const c = items.length;
    n.hidden = !c; n.textContent = c > 99 ? '99+' : String(c);
    b.classList.toggle('has', !!c);
    b.title = adm ? (c ? c + ' notification(s) à traiter' : 'Aucune notification') : '';
  }
  async function refresh() {
    build();
    if (!isAdmin() || busy || !window.__ftRest) { badge(); return; }
    busy = true;
    const out = [];
    try {
      const fb = await window.__ftRest('/rest/v1/site_feedback?select=id,kind,message,email,created_at&done=is.false&order=created_at.desc&limit=50').catch(() => []);
      (fb || []).forEach(r => { const k = KIND[r.kind] || ['Message', '#8e8e93']; out.push({ g: 'fb', t: k[0] + (r.email ? ' · ' + r.email.split('@')[0] : ''), s: String(r.message || '').slice(0, 90), d: ago(r.created_at), c: k[1] }); });
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
  window.ftBellRefresh = refresh;
  function start() { build(); refresh(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden) refresh(); }, 30000); }
  document.addEventListener('ft-admin', start);
  document.addEventListener('ft-props', () => refresh());
  document.addEventListener('ft-regs', () => refresh());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setTimeout(start, 1500);
})();
