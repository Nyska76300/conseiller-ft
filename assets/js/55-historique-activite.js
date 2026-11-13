(function () {
  /* Historique des éléments communs et sauvegardes (administrateur), « Mon activité » (chaque conseiller),
     raccourcis de l’appli (appui long sur l’icône). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const logged = () => !!(window.ftLoggedIn && window.ftLoggedIn());
  const missing = e => /PGRST20[25]|42P01|42883|does not exist|HTTP 404|function/.test(String(e && (e.message || e.code) || ''));
  const NOSQL = f => '<p class="ad-empty">Non installé : exécutez le script <b>supabase/' + f + '</b> dans Supabase.</p>';
  const dt = s => new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const nf = n => Number(n || 0).toLocaleString('fr-FR');
  const toolName = id => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); return c ? c.name : id; } catch (e) { return id; } };
  const SPECIAL = { __ft_faq: 'FAQ du site', __ft_labels: 'Noms renommés', __ft_icons: 'Icônes', __ft_annonce: 'Annonce', __ft_regs: 'Validations de la veille', __ft_push: 'Clés des notifications' };
  const label = (id, title) => SPECIAL[id] || (title && title !== id ? 'Modèle « ' + title + ' »' : id);

  /* =================== Historique et sauvegardes =================== */
  let H = [], BK = [];
  function render() {
    const h = $('hs-body'); if (!h) return;
    const sub = $('ad-hist') && $('ad-hist').querySelector('.text-cyan-400'); if (sub) sub.textContent = H.length + ' modification(s)';
    h.innerHTML = '<p class="ad-empty">Chaque modification ou suppression d’un modèle commun, de la FAQ, des noms, des icônes ou de l’annonce garde l’ancienne version (30 par élément, pendant un an).</p>' +
      (H.length ? '<div class="hs-list">' + H.slice(0, 40).map((r, i) => '<div class="hs-it"><div><b>' + esc(label(r.tpl_id, r.title)) + '</b><span>' + (r.action === 'delete' ? 'Supprimé' : 'Modifié') + ' le ' + dt(r.changed_at) + ' · ' + esc(r.who || '') + '</span></div><button type="button" class="ad-btn" data-hs="restore" data-i="' + i + '">' + (r.action === 'delete' ? 'Restaurer' : 'Revenir à cette version') + '</button></div>').join('') + '</div>' : '<p class="ad-empty">Aucune modification enregistrée pour le moment.</p>') +
      '<h4 class="hs-h">Sauvegardes complètes</h4><p class="ad-empty">Copie de tous les éléments communs chaque dimanche (12 dernières semaines).</p>' +
      (BK.length ? '<div class="hs-list">' + BK.map((b, i) => '<div class="hs-it"><div><b>' + dt(b.at) + '</b><span>' + b.items + ' élément(s)</span></div><div class="ad-row" style="gap:6px;flex-wrap:wrap"><button type="button" class="ad-btn" data-hs="dl" data-i="' + i + '">Télécharger</button><button type="button" class="ad-btn" data-hs="all" data-i="' + i + '">Tout restaurer</button></div></div>').join('') + '</div>' : '<p class="ad-empty">Aucune sauvegarde pour le moment.</p>') +
      '<div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn" data-hs="now">Sauvegarder maintenant</button></div>';
  }
  function load() {
    const h = $('hs-body'); if (!h || !window.__ftRpc) return;
    Promise.all([window.__ftRpc('admin_history', { days: 365 }), window.__ftRest('/rest/v1/shared_backups?select=id,at,items&order=at.desc')])
      .then(([a, b]) => { H = a || []; BK = b || []; render(); })
      .catch(e => { h.innerHTML = missing(e) ? NOSQL('historique_sauvegarde.sql') : '<p class="ad-empty">Chargement impossible : ' + esc(e && e.message || e) + '</p>'; });
  }
  const upsert = rows => window.__ftRest('/rest/v1/shared_templates?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: rows.map(r => ({ id: r.id, template: r.template, updated_at: new Date().toISOString() })) });
  const after = m => { toast(m, 'success'); try { if (window.ftReloadShared) window.ftReloadShared(); } catch (e) {} setTimeout(load, 600); };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-hs]'); if (!b || !isAdmin()) return;
    const a = b.dataset.hs, i = +b.dataset.i;
    if (a === 'restore') {
      const r = H[i]; if (!confirm('Remettre « ' + label(r.tpl_id, r.title) + ' » tel qu’il était avant le ' + dt(r.changed_at) + ' ? La version actuelle sera gardée dans l’historique.')) return;
      window.__ftRest('/rest/v1/shared_history?select=tpl_id,template&id=eq.' + r.id).then(x => { const v = x && x[0]; if (!v || !v.template) throw new Error('version introuvable'); return upsert([{ id: v.tpl_id, template: v.template }]); })
        .then(() => after('Version restaurée')).catch(er => toast('Restauration impossible : ' + (er && er.message || er), 'error'));
    } else if (a === 'all' || a === 'dl') {
      const bk = BK[i];
      window.__ftRest('/rest/v1/shared_backups?select=data&id=eq.' + bk.id).then(x => {
        const d = (x && x[0] && x[0].data) || [];
        if (a === 'dl') {
          const blob = new Blob([JSON.stringify({ sauvegarde: bk.at, elements: d }, null, 2)], { type: 'application/json' });
          const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'espace-conseiller-sauvegarde-' + bk.at.slice(0, 10) + '.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
          return;
        }
        if (!confirm('Restaurer les ' + d.length + ' éléments communs de la sauvegarde du ' + dt(bk.at) + ' ? Les éléments créés depuis sont conservés ; les versions actuelles restent dans l’historique.')) return;
        return upsert(d.filter(r => r && r.id)).then(() => after(d.length + ' élément(s) restauré(s)'));
      }).catch(er => toast('Impossible : ' + (er && er.message || er), 'error'));
    } else if (a === 'now') {
      window.__ftRpc('ft_backup_now').then(() => after('Sauvegarde effectuée')).catch(er => toast(missing(er) ? 'Script Supabase à exécuter d’abord' : 'Impossible : ' + er.message, 'error'));
    }
  });
  function card() {
    const grid = document.querySelector('#adp-content .adp-grid'); if (!grid || !isAdmin() || $('ad-hist')) return;
    const w = document.createElement('div'); w.id = 'ad-hist'; w.dataset.pane = 'content';
    w.innerHTML = '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><span class="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center">🕘</span>Historique et sauvegardes</span><span class="text-[10px] font-mono text-cyan-400">…</span></div><div id="hs-body"><p class="ad-empty">Chargement…</p></div></div>';
    grid.insertBefore(w, grid.firstChild); load();
  }
  if (window.ftOnDom) window.ftOnDom(() => { if ($('adp') && !$('view-admin').classList.contains('hidden')) card(); });

  /* =================== Mon activité =================== */
  const TH = { are: 'ARE et durée', diff: 'Différés', cumul: 'Cumul et reprise', sol: 'ASS, ATI, formation', indu: 'Trop-perçus', autres: 'Autres' };
  const day = d => d.toISOString().slice(0, 10);
  window.ftMyActivity = function () {
    let w = $('ft-act');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-act'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'act-t');
      document.body.appendChild(w);
      w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-act="x"]')) w.hidden = true; });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    w.hidden = false;
    const head = '<div class="pm-h"><h2 id="act-t">📊 Mon activité</h2><button type="button" class="pm-x" data-act="x" aria-label="Fermer">×</button></div>';
    if (!logged()) { w.innerHTML = '<div class="pm-card">' + head + '<p class="rm-p">Connectez-vous pour retrouver votre activité sur tous vos postes.</p></div>'; return; }
    w.innerHTML = '<div class="pm-card">' + head + '<p class="rm-p">Chargement…</p></div>';
    const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    Promise.all([
      window.__ftRest('/rest/v1/usage_events?select=tool,at&at=gte.' + since + '&order=at.desc&limit=5000'),
      window.__ftRest('/rest/v1/quiz_results?select=at,score,total,details&order=at.desc&limit=100').catch(() => [])
    ]).then(([ev, qz]) => {
      ev = ev || []; qz = qz || [];
      const d30 = Date.now() - 30 * 864e5, last = ev.filter(e => new Date(e.at) >= d30);
      const kind = t => /^mail:/.test(t) ? 'mail' : /^copie:/.test(t) ? 'copie' : 'outil';
      const tools = {}, mails = {}; let opens = 0, copies = 0;
      last.forEach(e => { const k = kind(e.tool); if (k === 'outil') tools[e.tool] = (tools[e.tool] || 0) + 1; else { const n = e.tool.replace(/^(mail|copie):/, ''); const m = mails[n] = mails[n] || [0, 0]; if (k === 'mail') { m[0]++; opens++; } else { m[1]++; copies++; } } });
      const days = new Set(ev.map(e => day(new Date(e.at))));
      let streak = 0; for (let d = new Date(); ; d.setDate(d.getDate() - 1)) { const k = day(d); if (days.has(k)) streak++; else if (streak || k !== day(new Date())) break; if (streak > 365) break; }
      const weeks = []; for (let i = 7; i >= 0; i--) { const a = Date.now() - (i + 1) * 7 * 864e5, b = Date.now() - i * 7 * 864e5; weeks.push(ev.filter(e => { const t = +new Date(e.at); return t >= a && t < b; }).length); }
      const wmax = Math.max(1, ...weeks);
      const T = Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 5), tmax = Math.max(1, ...T.map(x => x[1]));
      const M = Object.entries(mails).sort((a, b) => (b[1][1] * 3 + b[1][0]) - (a[1][1] * 3 + a[1][0])).slice(0, 5);
      const th = {}; qz.forEach(q => Object.entries(q.details || {}).forEach(([k, v]) => { const t = th[k] = th[k] || [0, 0]; t[0] += +v[0] || 0; t[1] += +v[1] || 0; }));
      const best = qz.reduce((m, q) => Math.max(m, q.total ? Math.round(q.score / q.total * 100) : 0), 0);
      const avg = qz.length ? Math.round(qz.reduce((s, q) => s + (q.total ? q.score / q.total : 0), 0) / qz.length * 100) : 0;
      const pct = t => t[1] ? Math.round(t[0] / t[1] * 100) : 0, col = p => p >= 75 ? 'ok' : p >= 50 ? 'mid' : 'low';
      const kpi = (n, l) => '<div><strong>' + n + '</strong><small>' + l + '</small></div>';
      w.innerHTML = '<div class="pm-card act-card">' + head +
        '<p class="rm-p">Vos 30 derniers jours (seulement pour vous : vos collègues ne voient pas ce détail).</p>' +
        '<div class="act-kpi">' + kpi(nf(Object.values(tools).reduce((s, x) => s + x, 0)), 'outils ouverts') + kpi(nf(opens), 'mails ouverts') + kpi(nf(copies), 'mails copiés') + kpi(streak + ' j', 'jours d’affilée') + '</div>' +
        '<h3 class="act-h">Activité par semaine</h3><div class="act-weeks">' + weeks.map((n, i) => '<div title="' + n + ' action(s)"><i style="height:' + Math.max(4, Math.round(n / wmax * 100)) + '%"></i><span>' + (i === 7 ? 'cette sem.' : 'S-' + (7 - i)) + '</span></div>').join('') + '</div>' +
        '<h3 class="act-h">Mes outils les plus utilisés</h3>' + (T.length ? '<div class="qs-th">' + T.map(([t, n]) => '<div><span>' + esc(toolName(t)) + '</span><i class="qs-bar ok"><i style="width:' + Math.round(n / tmax * 100) + '%"></i></i><b>' + n + '</b></div>').join('') + '</div>' : '<p class="rm-p">Pas encore d’outil ouvert ce mois-ci.</p>') +
        '<h3 class="act-h">Mes mails les plus utilisés</h3>' + (M.length ? '<ul class="act-ml">' + M.map(([n, m]) => '<li><span>' + esc(n) + '</span><em>' + m[0] + ' ouvert(s) · ' + m[1] + ' copié(s)</em></li>').join('') + '</ul>' : '<p class="rm-p">Pas encore de mail utilisé ce mois-ci.</p>') +
        '<h3 class="act-h">Formation</h3>' + (qz.length ? '<div class="act-kpi">' + kpi(qz.length, 'quiz terminés') + kpi(best + ' %', 'meilleur score') + kpi(avg + ' %', 'moyenne') + '</div><div class="qs-th">' + Object.keys(th).sort((a, b) => pct(th[a]) - pct(th[b])).map(k => '<div><span>' + esc(TH[k] || k) + '</span><i class="qs-bar ' + col(pct(th[k])) + '"><i style="width:' + pct(th[k]) + '%"></i></i><b>' + pct(th[k]) + ' %</b></div>').join('') + '</div>' : '<p class="rm-p">Aucun quiz terminé. <button type="button" class="pm-btn" data-act="quiz">Faire un quiz</button></p>') +
        '</div>';
      const qb = w.querySelector('[data-act="quiz"]'); if (qb) qb.onclick = () => { w.hidden = true; switchNavTab('formation'); };
    }).catch(e => { w.innerHTML = '<div class="pm-card">' + head + (missing(e) || /permission|42501|403/.test(String(e && e.message)) ? '<p class="rm-p">« Mon activité » sera disponible dès que l’administrateur aura installé la mise à jour (script Supabase).</p>' : '<p class="rm-p">Chargement impossible : ' + esc(e && e.message || e) + '</p>') + '</div>'; });
  };
  const items = window.FT_ACCT_ITEMS = window.FT_ACCT_ITEMS || [];
  const at = items.findIndex(x => /Mes rappels/.test(typeof x.t === 'function' ? x.t() : x.t));
  items.splice(at >= 0 ? at + 1 : items.length, 0, { t: 'Mon activité', run: () => window.ftMyActivity() });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Mon activité', s: 'Mes outils, mes mails et mes scores de formation', kw: 'mon activité statistiques personnelles tableau de bord progression', run: () => window.ftMyActivity() });

  /* Raccourcis de l’appli (appui long sur l’icône, Android et ordinateur) */
  const G = window.FT_GO = window.FT_GO || {};
  G.search = () => { if (window.ftHeaderSearch) window.ftHeaderSearch(); };
  G.sims = () => { try { toggleBurgerMenu(true); } catch (e) {} };
  G.act = () => window.ftMyActivity();
})();
