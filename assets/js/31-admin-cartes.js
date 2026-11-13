(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const card = (n, title, ref, inner) => '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><div class="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">' + n + '</div>' + title + '</span><span class="text-[10px] font-mono text-cyan-400">' + (ref || '') + '</span></div>' + inner + '</div>';
  const name = id => { try { return (NAV_TABS_CONFIG.find(t => String(t.id) === String(id)) || {}).name || id; } catch (e) { return id; } };
  const parseFr = d => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };

  const V = document.createElement('div');
  V.id = 'view-admin'; V.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
  V.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>Espace administrateur</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-normal">Visible par vous seul</span></h2></div></div><div class="ad-row"><button type="button" class="ad-btn" id="ad-refresh">Actualiser</button></div></div><div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"><div id="ad-body"></div></div>';
  const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(V);
  /* Volontairement absent de la liste des outils : rien n’apparaît pour les collègues (recherche, menus, accueil) */

  function render() {
    const body = $('ad-body'); if (!body) return;
    if (!isAdmin()) { body.innerHTML = '<p class="max-w-3xl mx-auto ad-empty">Cet espace est réservé à l’administrateur. Connectez-vous avec le compte administrateur.</p>'; return; }
    let B = {}; try { B = BAREME; } catch (e) {}
    const v = parseFr(B.verifie), now = new Date(), y = now.getFullYear();
    const cp = now >= new Date(y, 6, 1) ? new Date(y, 6, 1) : new Date(y, 0, 1);
    const next = now >= new Date(y, 6, 1) ? new Date(y + 1, 0, 1) : new Date(y, 6, 1);
    let ack = null; try { ack = localStorage.getItem('ft_bareme_ack'); } catch (e) {}
    const due = v && v < cp && !(ack && new Date(ack) >= cp);
    let shared = 0; try { shared = templates.filter(t => t.shared).length; } catch (e) {}
    let L = {}; try { L = JSON.parse(localStorage.getItem('ft_labels') || '{}') || {}; } catch (e) {}
    const lab = Object.keys(L).map(k => '<tr><td>' + esc(k.charAt(0) === 'r' ? 'Rubrique « ' + k.slice(2) + ' »' : 'Outil « ' + name(k.slice(2)) + ' »') + '</td><td>' + esc(L[k]) + '</td></tr>').join('');
    const ver = (document.querySelector('meta[name="ft-version"]') || {}).content || '';
    body.innerHTML = '<div class="max-w-7xl mx-auto space-y-4 mb-5"><div id="ad-usage"></div></div><div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5"><div class="lg:col-span-6 space-y-4">' +
      card('1', 'Statistiques cumulées', 'Depuis le début', '<div id="ad-stats" class="ad-empty">Chargement…</div>') + '<div id="ad-users"></div><div id="ad-ideas"></div>' +
      card('2', 'Propositions de modèles', 'Collègues', '<div class="ad-row"><span class="ad-empty" id="ad-props-n">…</span><button type="button" class="ad-btn pri" onclick="ftProposals()">Voir et valider</button></div>') +
      '</div><div class="lg:col-span-6 space-y-4">' +
      card('3', 'Barème', due ? 'À vérifier' : 'À jour', '<table class="ad-tbl"><tr><td>Montants vérifiés le</td><td class="n">' + esc(B.verifie || '—') + '</td></tr><tr><td>Dernière échéance de revalorisation</td><td class="n">' + cp.toLocaleDateString('fr-FR') + '</td></tr><tr><td>Prochaine échéance</td><td class="n">' + next.toLocaleDateString('fr-FR') + '</td></tr><tr><td>État</td><td class="n" style="color:' + (due ? '#fbbf24' : '#34d399') + '">' + (due ? 'À contrôler' : 'Rien à faire') + '</td></tr></table><div class="ad-row">' + (due ? '<button type="button" class="ad-btn pri" id="ad-ack">C’est vérifié</button>' : '') + '<a class="ad-btn" href="https://www.unedic.org/publications" target="_blank" rel="noopener">Paramètres Unédic</a><button type="button" class="ad-btn" onclick="switchNavTab(\'echeances\')">Échéances</button></div>') +
      card('4', 'Modèles communs', shared + ' publié(s)', '<p class="ad-empty">Pour publier un modèle pour tous : ouvrez-le dans la page Mails, puis l’icône « équipe » ou le menu du compte. Pour en retirer un : menu du compte → « Retirer le modèle ouvert des communs ».</p><div class="ad-row"><button type="button" class="ad-btn" onclick="switchNavTab(\'cvm\')">Ouvrir la page Mails</button></div>') +
      card('5', 'Noms renommés', Object.keys(L).length + ' changement(s)', (lab ? '<table class="ad-tbl"><tr><th>Élément</th><th>Nom affiché</th></tr>' + lab + '</table>' : '<p class="ad-empty">Aucun renommage.</p>') + '<p class="ad-empty">Pour renommer : survolez un nom dans le menu et cliquez sur le crayon.</p>') +
      card('6', 'Site', 'Version ' + esc(ver), '<table class="ad-tbl"><tr><td>Version en ligne</td><td class="n">' + esc(ver) + '</td></tr><tr><td>Cas de contrôle des calculs</td><td class="n" id="ad-cases">…</td></tr></table><div class="ad-row"><button type="button" class="ad-btn" onclick="switchNavTab(\'sources\')">Sources et vérification</button><button type="button" class="ad-btn" onclick="window.ftShowNews && ftShowNews()">Quoi de neuf ?</button></div>') +
      '<div id="ad-faq"></div></div></div>';
    try { window.ftAdminFill && window.ftAdminFill(card); } catch (e) { console.warn(e); }
    const a = $('ad-ack'); if (a) a.onclick = () => { try { localStorage.setItem('ft_bareme_ack', new Date().toISOString()); } catch (e) {} toast('Rappel barème masqué jusqu’à la prochaine échéance', 'success'); render(); };
    try { const ko = FT_CASES.filter(c => { let g; try { g = c.run(); } catch (e) { return true; } return !(Math.abs(g - c.exp) < Math.pow(10, -c.d) / 2 + 1e-9); }).length; $('ad-cases').innerHTML = ko ? '<span style="color:#f87171">' + ko + ' écart(s)</span>' : '<span style="color:#34d399">' + FT_CASES.length + ' / ' + FT_CASES.length + ' conformes</span>'; } catch (e) {}
    const pc = window.ftPropCount ? window.ftPropCount() : null; $('ad-props-n').textContent = pc == null ? 'Nombre inconnu' : pc ? pc + ' proposition(s) en attente' : 'Aucune proposition en attente';
    const st = $('ad-stats');
    if (!window.__ftRpc) { st.textContent = 'Connexion requise.'; return; }
    window.__ftRpc('team_usage').then(rows => {
      rows = (rows || []).filter(r => r.tool && String(r.tool).indexOf('hub:') !== 0 && r.tool !== 'admin');
      if (!rows.length) { st.textContent = 'Pas encore de données.'; return; }
      const max = Math.max(...rows.map(r => +r.uses || 0)) || 1, tot = rows.reduce((s, r) => s + (+r.uses || 0), 0);
      st.className = ''; st.innerHTML = '<table class="ad-tbl"><tr><th>Outil</th><th style="text-align:right">Ouvertures</th><th style="text-align:right">Conseillers</th></tr>' + rows.slice(0, 25).map(r => '<tr><td>' + esc(name(r.tool)) + '<div class="ad-bar" style="width:' + Math.max(4, Math.round((+r.uses || 0) / max * 100)) + '%"></div></td><td class="n">' + (+r.uses || 0) + '</td><td class="n">' + (+r.users || 0) + '</td></tr>').join('') + '</table><p class="ad-empty">' + tot + ' ouvertures au total. Les outils jamais ouverts n’apparaissent pas.</p>';
    }).catch(e => { const m = String(e && (e.message || e.code) || ''); st.textContent = /team_usage|PGRST202|42883|404/.test(m) ? 'Fonction team_usage absente dans Supabase.' : 'Chargement impossible : ' + m; });
  }
  window.ftOpenAdmin = () => switchNavTab('admin');
  $('ad-refresh') && ($('ad-refresh').onclick = () => { render(); try { window.ftProposals && 0; } catch (e) {} });
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    if (String(t) === 'admin' && !isAdmin()) { toast('Espace réservé à l’administrateur', 'info'); t = 'home'; arguments[0] = 'home'; }
    const r = _sw.apply(this, arguments);
    const on = String(t) === 'admin'; V.classList.toggle('hidden', !on);
    if (on) { render(); const n = $('header-active-tab-name'); if (n) n.textContent = 'Espace administrateur'; }
    return r;
  };
  document.addEventListener('ft-props', () => { if (!V.classList.contains('hidden')) { const e = $('ad-props-n'); if (e) { const n = window.ftPropCount(); e.textContent = n ? n + ' proposition(s) en attente' : 'Aucune proposition en attente'; } } });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Espace administrateur', s: 'Statistiques, propositions, barème (administrateur)', kw: 'admin administrateur statistiques gestion', when: isAdmin, run: () => switchNavTab('admin') });
})();
