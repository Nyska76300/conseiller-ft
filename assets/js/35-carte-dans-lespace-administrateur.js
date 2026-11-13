(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const jget = (k, d) => { try { const v = JSON.parse(LS.get(k)); return v == null ? d : v; } catch (e) { return d; } };
  let B = null; try { B = BAREME; } catch (e) {}
  let UPD = [], ORIG = {}, applied = [];
  const decs = () => jget('ft_regs_dec', {});
  const getP = p => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), B);
  const setP = (p, v) => { const ks = p.split('.'), last = ks.pop(); const o = ks.reduce((o, k) => (o[k] = o[k] && typeof o[k] === 'object' ? o[k] : {}), B); o[last] = v; };
  const fmtV = v => typeof v === 'number' ? v.toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : String(v);
  const fmtD = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (d || ''); };
  const state = u => decs()[u.id] || 'p';

  function apply() {
    if (!B) return;
    Object.keys(ORIG).forEach(p => setP(p, ORIG[p]));
    const adm = isAdmin(), d = decs(); applied = [];
    UPD.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach(u => {
      const st = d[u.id];
      if (!(st === 'ok' || (adm && st !== 'no'))) return;
      Object.keys(u.bareme || {}).forEach(p => { if (!(p in ORIG)) ORIG[p] = getP(p); setP(p, u.bareme[p]); });
      applied.push(u.id);
    });
    try {
      const nn = jget('ft_regs_notified', []), fresh = UPD.filter(u => nn.indexOf(u.id) < 0 && (adm ? !d[u.id] : d[u.id] === 'ok'));
      if (fresh.length && window.ftNotify && window.ftNotifOn && window.ftNotifOn()) {
        window.ftNotify(adm ? 'Mise à jour réglementaire à valider' : 'Mise à jour réglementaire', fresh.map(u => u.titre).join(' · '), 'ft-regs', adm ? 'admin' : 'home');
        LS.set('ft_regs_notified', JSON.stringify(nn.concat(fresh.map(u => u.id))));
      }
    } catch (e) {}
    if (adm) {
      const pend = UPD.filter(u => !d[u.id]);
      if (pend.length && !sessionStorage.getItem('ft_regs_told')) { try { sessionStorage.setItem('ft_regs_told', '1'); } catch (e) {} toast(pend.length + ' mise(s) à jour réglementaire(s) appliquée(s) pour vous seul, en attente de votre validation (Espace administrateur)', 'info'); }
    } else announce();
    if (window.__ftRegsRender) window.__ftRegsRender();
    pill();
  }
  function announce() {
    const seen = jget('ft_regs_seen', []), d = decs();
    const fresh = UPD.filter(u => d[u.id] === 'ok' && seen.indexOf(u.id) < 0);
    if (!fresh.length) return;
    let w = $('ft-regs-dlg'); if (!w) { w = document.createElement('div'); w.id = 'ft-regs-dlg'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
    w.innerHTML = '<div class="rd-box"><div class="rd-k">Mise à jour réglementaire</div>' + fresh.map(u => '<h3>' + esc(u.titre) + '</h3><div style="font-size:12px;color:#94a3b8">' + (u.effet ? 'En vigueur le ' + esc(fmtD(u.effet)) : '') + '</div><ul>' + (u.resume || []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + (u.sources || []).map(s => '<div><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + ' ↗</a></div>').join('')).join('<hr style="border-color:rgba(255,255,255,.08);margin:14px 0">') + '<p style="font-size:12px;color:#94a3b8;margin-top:12px">Les simulateurs utilisent déjà ces nouvelles valeurs.</p><button type="button" class="rd-go">J’ai compris</button></div>';
    w.classList.add('on');
    w.querySelector('.rd-go').onclick = () => { LS.set('ft_regs_seen', JSON.stringify(seen.concat(fresh.map(u => u.id)))); w.classList.remove('on'); };
  }
  function loadDecsAnon() {
    if (window.__ftUser && window.__ftUser()) return;
    if (!window.__ftAnon) return;
    window.__ftAnon('/rest/v1/shared_templates?select=template&id=eq.__ft_regs').then(r => { const t = r && r[0] && r[0].template; if (t && t.decisions) { LS.set('ft_regs_dec', JSON.stringify(t.decisions)); apply(); } }).catch(() => {});
  }
  let LAST = null;
  function pill() {
    const p = $('ft-reg-pill'); if (!p) return;
    const adm = isAdmin(), d = decs(), pend = UPD.filter(u => !d[u.id]).length;
    let last = LAST ? new Date(LAST + 'T12:00') : null;
    if (!last && B && B.verifie) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(B.verifie); if (m) last = new Date(+m[3], +m[2] - 1, +m[1]); }
    const age = last ? Math.floor((Date.now() - last) / 864e5) : 999;
    let cls = 'ok', txt = 'À jour';
    if (adm && pend) { cls = 'warn'; txt = pend + ' à valider'; }
    else if (age > 14) { cls = 'late'; txt = 'À vérifier'; }
    const when = last ? last.toLocaleDateString('fr-FR') : '—';
    const t = (cls === 'warn' ? pend + ' mise(s) à jour réglementaire(s) en attente de votre validation. ' : cls === 'late' ? 'La dernière vérification date de plus de deux semaines. ' : 'Réglementation à jour. ') + 'Dernière vérification automatique : ' + when + ' (veille chaque lundi sur Unédic, Légifrance et France Travail).' + (B && B.verifie ? ' Barème Unédic vérifié le ' + B.verifie + '.' : '');
    p.className = 'ft-rp ' + cls + (adm ? '' : ' ro'); p.title = t; p.setAttribute('aria-label', t);
    if (adm) p.removeAttribute('tabindex'); else p.setAttribute('tabindex', '-1');
    p.querySelector('b').textContent = txt;
    p.onclick = adm ? () => switchNavTab('admin') : null;
  }
  window.__ftRegPill = pill;
  function load() {
    fetch('reglementation/maj.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
      UPD = (j && Array.isArray(j.updates)) ? j.updates.filter(u => u && u.id) : [];
      LAST = j && j.verifie_le || null;
      apply(); loadDecsAnon();
    }).catch(() => {});
  }
  window.ftRegsDecide = function (id, val) {
    if (!isAdmin()) return toast('Réservé à l’administrateur', 'info');
    const d = decs(); if (val) d[id] = val; else delete d[id];
    const u = UPD.find(x => x.id === id);
    if (val === 'ok' && !confirm('Diffuser « ' + (u ? u.titre : id) + ' » à tous les conseillers ?')) return;
    window.__ftSaveShared('__ft_regs', { decisions: d }).then(() => {
      LS.set('ft_regs_dec', JSON.stringify(d)); apply();
      if (val === 'ok' && window.ftPushSend) window.ftPushSend({ title: 'Mise à jour réglementaire', body: u ? u.titre : 'Nouvelles valeurs appliquées', go: 'home', tag: 'ft-regs' }).catch(() => {});
      toast(val === 'ok' ? 'Mise à jour diffusée aux conseillers' : val === 'no' ? 'Mise à jour écartée' : 'Décision annulée', 'success');
      setTimeout(todo, 50);
    }).catch(e => toast('Enregistrement impossible : ' + (e && e.message || e), 'error'));
  };
  /* Carte dans l’Espace administrateur */
  window.__ftRegsRender = function () {
    const host = $('ad-regs'); if (!host || !isAdmin()) return;
    const d = decs(), pend = UPD.filter(u => !d[u.id]).length;
    const list = UPD.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(u => {
      const st = d[u.id] || 'p';
      const rows = Object.keys(u.bareme || {}).map(p => '<tr><td>' + esc(p) + '</td><td class="n">' + esc(fmtV(p in ORIG ? ORIG[p] : getP(p))) + ' → <b>' + esc(fmtV(u.bareme[p])) + '</b></td></tr>').join('');
      return '<div class="rg-up"><h4><span>' + esc(u.titre) + '</span><span class="rg-st ' + st + '">' + (st === 'ok' ? 'Diffusée' : st === 'no' ? 'Écartée' : 'En attente') + '</span></h4>' +
        '<div class="rg-m">Publiée le ' + esc(fmtD(u.date)) + (u.effet ? ' · en vigueur le ' + esc(fmtD(u.effet)) : '') + '</div>' +
        (u.resume && u.resume.length ? '<ul>' + u.resume.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (rows ? '<table class="ad-tbl"><tr><th>Valeur du barème</th><th style="text-align:right">Avant → après</th></tr>' + rows + '</table>' : '') +
        (u.code ? '<p class="ad-empty">Modification du code préparée dans la branche « ' + esc(u.code) + ' » : elle sera intégrée après votre validation.</p>' : '') +
        (u.sources || []).map(s => '<div><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + ' ↗</a></div>').join('') +
        '<div class="ad-row" style="margin-top:8px">' + (st === 'p' ? '<button type="button" class="ad-btn pri" onclick="ftRegsDecide(\'' + esc(u.id) + '\',\'ok\')">Diffuser aux conseillers</button><button type="button" class="ad-btn" onclick="ftRegsDecide(\'' + esc(u.id) + '\',\'no\')">Écarter</button>' : '<button type="button" class="ad-btn" onclick="ftRegsDecide(\'' + esc(u.id) + '\',null)">Annuler la décision</button>') + '</div></div>';
    }).join('');
    const card = window.__ftAdCard || ((n, t, r, i) => '<div>' + i + '</div>');
    host.innerHTML = card('★', 'Veille réglementaire', pend ? pend + ' en attente' : 'À jour', list || '<p class="ad-empty">Aucune mise à jour publiée par la veille pour le moment. La veille vérifie chaque semaine les textes officiels (Unédic, Légifrance, France Travail) ; dès qu’un changement est publié, il s’applique d’abord pour vous seul et apparaît ici pour validation.</p>');
  };
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function (card) {
    window.__ftAdCard = card;
    try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); }
    const top = $('ad-usage'); if (top && !$('ad-regs')) { const h = document.createElement('div'); h.id = 'ad-regs'; top.parentNode.insertBefore(h, top); }
    window.__ftRegsRender();
    /* « À traiter » : tout ce qui attend une réponse de l’administrateur, en premier */
    if (top && !$('ad-first')) {
      const f = document.createElement('div'); f.id = 'ad-first';
      f.innerHTML = '<div id="ad-todo"></div><div class="ad-first-grid"><div id="ad-first-a"></div><div id="ad-first-b"></div></div>';
      top.parentNode.insertBefore(f, top.parentNode.firstChild);
      const mv = (el, to) => { if (el && $(to)) $(to).appendChild(el); };
      mv($('ad-regs'), 'ad-first-a');
      const props = $('ad-props-n'); mv(props && props.closest('.rounded-xl'), 'ad-first-a');
      const ack = $('ad-ack'); mv(ack && ack.closest('.rounded-xl'), 'ad-first-a');
      mv($('ad-ideas'), 'ad-first-b');
    }
    [0, 1200, 3500].forEach(t => setTimeout(todo, t));
  };
  function todo() {
    const h = $('ad-todo'); if (!h) return;
    const d = decs(), regs = UPD.filter(u => !d[u.id]).length;
    const props = window.ftPropCount ? (window.ftPropCount() || 0) : 0;
    let ideas = 0; const ic = document.querySelector('#ad-ideas .text-cyan-400'); if (ic) ideas = parseInt(ic.textContent, 10) || 0;
    const bar = !!$('ad-ack');
    const it = [];
    if (regs) it.push(['⚖️', regs + ' mise(s) à jour réglementaire(s) à valider', 'ad-regs']);
    if (props) it.push(['📝', props + ' proposition(s) de modèle à examiner', 'ad-props-n']);
    if (ideas) it.push(['💡', ideas + ' message(s) de la boîte à idées à traiter', 'ad-ideas']);
    if (bar) it.push(['💶', 'Barème à contrôler (échéance de revalorisation passée)', 'ad-ack']);
    h.innerHTML = '<div class="ad-todo ' + (it.length ? 'has' : 'none') + '"><div class="ad-todo-h">' + (it.length ? '🔔 À traiter <b>' + it.length + '</b>' : '✅ Rien à traiter pour le moment') + '</div>' +
      (it.length ? '<div class="ad-todo-l">' + it.map(x => '<button type="button" data-go="' + x[2] + '"><span>' + x[0] + '</span>' + esc(x[1]) + '<em>Voir ›</em></button>').join('') + '</div>' : '<p>Les mises à jour réglementaires, propositions de modèles et messages des conseillers apparaîtront ici dès qu’ils arrivent.</p>') + '</div>';
    h.onclick = e => { const b = e.target.closest('[data-go]'); if (!b) return; const t = $(b.dataset.go); if (t) { const c = t.closest('.rounded-xl') || t; c.scrollIntoView({ behavior: 'smooth', block: 'start' }); c.classList.add('ad-flash'); setTimeout(() => c.classList.remove('ad-flash'), 1600); } };
  }
  document.addEventListener('ft-props', () => setTimeout(todo, 50));
  document.addEventListener('ft-regs', () => setTimeout(todo, 50));
  document.addEventListener('ft-admin', apply);
  document.addEventListener('ft-admin', () => setTimeout(pill, 50));
  document.addEventListener('ft-regs', apply);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Veille réglementaire', s: 'Mises à jour en attente de validation (administrateur)', kw: 'veille réglementation mise à jour validation diffusion', when: isAdmin, run: () => switchNavTab('admin') });
  load(); setTimeout(pill, 300);
  setInterval(() => { if (!document.hidden) load(); }, 30 * 60 * 1000);
})();
