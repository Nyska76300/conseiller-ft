(function () {
  /* Statistiques par agence, suivi de la formation (administrateur) et vue usager (simulateurs). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const nf = n => Number(n || 0).toLocaleString('fr-FR');
  const key = t => String(t || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const toolName = id => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); return c ? c.name : id; } catch (e) { return id; } };
  const kind = t => String(t).indexOf('mail:') === 0 ? 'mail' : String(t).indexOf('copie:') === 0 ? 'copie' : 'outil';
  const missing = e => /PGRST20[25]|42P01|42883|does not exist|HTTP 404|function/.test(String(e && (e.message || e.code) || ''));
  const NOSQL = '<p class="ad-empty">Non installé : exécutez le script <b>supabase/agences_formation.sql</b> dans Supabase.</p>';
  const period = () => { const b = document.querySelector('#ad-usage .au-per [data-d].on'); return b ? +b.dataset.d || 30 : 30; };
  const TH = { are: 'ARE et durée', diff: 'Différés', cumul: 'Cumul et reprise', sol: 'ASS, ATI, formation', indu: 'Trop-perçus', autres: 'Autres' };

  /* Regroupe les variantes d’écriture d’une même agence (« Rouen », « rouen ») */
  function groupAg(list, get) {
    const m = {};
    list.forEach(r => { const raw = (get(r) || '').trim(), k = key(raw) || '~'; const g = m[k] = m[k] || { k, names: {}, rows: [] }; g.rows.push(r); if (raw) g.names[raw] = (g.names[raw] || 0) + 1; });
    Object.values(m).forEach(g => { const n = Object.entries(g.names).sort((a, b) => b[1] - a[1])[0]; g.name = g.k === '~' ? 'Non renseignée' : (n ? n[0] : g.k); });
    return m;
  }

  /* ---------- Carte « Agences » ---------- */
  function agCard() {
    const h = $('ag-body'); if (!h) return;
    const days = period();
    Promise.all([window.__ftRpc('admin_usage', { days }), window.__ftRpc('admin_users')]).then(([use, users]) => {
      use = use || []; users = users || [];
      if (users.length && !('agence' in users[0])) { h.innerHTML = NOSQL; return; }
      const U = groupAg(users, r => r.agence), A = groupAg(use, r => r.agence);
      window.__ftAgences = Object.values(U).filter(g => g.k !== '~').map(g => g.name).sort((a, b) => a.localeCompare(b, 'fr'));
      const sel = $('an-ag'); if (sel) { const v = sel.value; sel.innerHTML = '<option value="">Toutes les agences</option>' + window.__ftAgences.map(x => '<option>' + esc(x) + '</option>').join(''); sel.value = v; }
      const keys = [...new Set(Object.keys(U).concat(Object.keys(A)))];
      const rows = keys.map(k => {
        const u = U[k] || { rows: [], name: (A[k] || {}).name }, a = A[k] || { rows: [] };
        const tools = {}, mails = {}; let acts = 0, copies = 0;
        a.rows.forEach(r => { if (kind(r.tool) === 'outil') { acts += r.uses; tools[r.tool] = (tools[r.tool] || 0) + r.uses; } else { const t = String(r.tool).replace(/^(mail|copie):/, ''); mails[t] = (mails[t] || 0) + r.uses * (kind(r.tool) === 'copie' ? 3 : 1); if (kind(r.tool) === 'copie') copies += r.uses; } });
        return { k, name: u.name || a.name || k, accounts: u.rows.length, active: new Set(a.rows.map(r => r.email)).size, acts, copies,
          tools: Object.entries(tools).sort((x, y) => y[1] - x[1]).slice(0, 3), mail: Object.entries(mails).sort((x, y) => y[1] - x[1])[0] };
      }).sort((x, y) => (y.k === '~' ? -1 : 0) - (x.k === '~' ? -1 : 0) || y.acts - x.acts || y.accounts - x.accounts);
      const sub = $('ad-ag') && $('ad-ag').querySelector('.text-cyan-400'); if (sub) sub.textContent = (rows.filter(r => r.k !== '~').length) + ' agence(s) · ' + (days === 365 ? '1 an' : days + ' j');
      const max = Math.max(1, ...rows.map(r => r.acts));
      h.innerHTML = !rows.length ? '<p class="ad-empty">Aucun compte pour le moment.</p>' :
        '<div class="ag-grid">' + rows.map(r => '<div class="ag-t' + (r.k === '~' ? ' none' : '') + '"><div class="ag-h"><b>' + esc(r.name) + '</b><span>' + r.accounts + ' compte(s)</span></div>' +
          '<div class="ag-n"><div><strong>' + r.active + '</strong><small>actifs</small></div><div><strong>' + nf(r.acts) + '</strong><small>ouvertures</small></div><div><strong>' + nf(r.copies) + '</strong><small>mails copiés</small></div></div>' +
          '<i class="ag-bar"><i style="width:' + Math.round(r.acts / max * 100) + '%"></i></i>' +
          (r.tools.length ? '<p class="ag-l"><em>Outils :</em> ' + r.tools.map(t => esc(toolName(t[0])) + ' <span>' + t[1] + '</span>').join(' · ') + '</p>' : '<p class="ag-l"><em>Aucune activité sur la période</em></p>') +
          (r.mail ? '<p class="ag-l"><em>Mail n° 1 :</em> ' + esc(r.mail[0]) + '</p>' : '') + '</div>').join('') + '</div>' +
          (U['~'] && U['~'].rows.length ? '<p class="ad-empty" style="margin-top:8px">« Non renseignée » : comptes qui n’ont pas encore indiqué leur agence (elle leur est demandée à la prochaine connexion).</p>' : '');
    }).catch(e => { h.innerHTML = missing(e) ? NOSQL : '<p class="ad-empty">Chargement impossible : ' + esc(e && e.message || e) + '</p>'; });
  }

  /* ---------- Carte « Formation » ---------- */
  function qzCard() {
    const h = $('qzs-body'); if (!h) return;
    const days = Math.max(90, period());
    window.__ftRpc('admin_quiz', { days }).then(rows => {
      rows = rows || [];
      if (!rows.length) { h.innerHTML = '<p class="ad-empty">Aucun quiz terminé sur les ' + days + ' derniers jours. Les résultats des conseillers connectés (sans leur nom) apparaîtront ici : taux de bonnes réponses par thème et par agence.</p>'; return; }
      const G = groupAg(rows, r => r.agence === 'Non renseignée' ? '' : r.agence);
      const tot = {}; rows.forEach(r => { const t = tot[r.theme] = tot[r.theme] || [0, 0]; t[0] += +r.ok; t[1] += +r.total; });
      const pct = t => t[1] ? Math.round(t[0] / t[1] * 100) : 0;
      const col = p => p >= 75 ? 'ok' : p >= 50 ? 'mid' : 'low';
      const themes = Object.keys(tot).sort((a, b) => pct(tot[a]) - pct(tot[b]));
      const quizzes = rows.reduce((s, r) => s + +r.quizzes, 0);
      const sub = $('ad-qz') && $('ad-qz').querySelector('.text-cyan-400'); if (sub) sub.textContent = days + ' derniers jours';
      h.innerHTML = '<p class="ad-empty">Taux de bonnes réponses aux quiz, du thème le moins réussi au mieux réussi. Aucun nom n’est affiché.</p>' +
        '<div class="qs-th">' + themes.map(t => '<div><span>' + esc(TH[t] || t) + '</span><i class="qs-bar ' + col(pct(tot[t])) + '"><i style="width:' + pct(tot[t]) + '%"></i></i><b>' + pct(tot[t]) + ' %</b></div>').join('') + '</div>' +
        '<table class="qs-tab"><thead><tr><th>Agence</th><th>Quiz</th><th>Réussite</th><th>À retravailler</th></tr></thead><tbody>' +
        Object.values(G).map(g => {
          const by = {}; let q = 0; const users = new Set();
          g.rows.forEach(r => { const t = by[r.theme] = by[r.theme] || [0, 0]; t[0] += +r.ok; t[1] += +r.total; q = Math.max(q, +r.quizzes); });
          const all = Object.values(by).reduce((s, t) => [s[0] + t[0], s[1] + t[1]], [0, 0]);
          const weak = Object.entries(by).filter(([, t]) => t[1] >= 3).sort((a, b) => pct(a[1]) - pct(b[1]))[0];
          return '<tr><td>' + esc(g.name) + '</td><td>' + q + '</td><td><b class="qs-' + col(pct(all)) + '">' + pct(all) + ' %</b></td><td>' + (weak && pct(weak[1]) < 75 ? esc(TH[weak[0]] || weak[0]) + ' (' + pct(weak[1]) + ' %)' : '—') + '</td></tr>';
        }).join('') + '</tbody></table><p class="ad-empty" style="margin-top:6px">' + nf(quizzes) + ' quiz terminé(s) au total.</p>';
    }).catch(e => { h.innerHTML = missing(e) ? NOSQL : '<p class="ad-empty">Chargement impossible : ' + esc(e && e.message || e) + '</p>'; });
  }

  function cards() {
    const grid = document.querySelector('#adp-stats .adp-grid'); if (!grid || !isAdmin() || !window.__ftRpc) return;
    const mk = (id, sub, ico, title, inner) => { const w = document.createElement('div'); w.id = id; w.dataset.pane = 'stats'; w.dataset.sub = sub;
      w.innerHTML = '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><span class="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center">' + ico + '</span>' + title + '</span><span class="text-[10px] font-mono text-cyan-400">…</span></div>' + inner + '</div>';
      grid.appendChild(w); return w; };
    if (!$('ad-ag')) { mk('ad-ag', 'agences', '🏢', 'Activité par agence', '<div id="ag-body"><p class="ad-empty">Chargement…</p></div>'); agCard(); }
    if (!$('ad-qz')) { mk('ad-qz', 'formation', '🎓', 'Suivi de la formation', '<div id="qzs-body"><p class="ad-empty">Chargement…</p></div>'); qzCard(); }
  }
  if (window.ftOnDom) window.ftOnDom(() => { if ($('adp') && !$('view-admin').classList.contains('hidden')) cards(); });
  /* Nouvelle période ou « Actualiser » : on recharge */
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('#ad-usage .au-per button')) setTimeout(() => { agCard(); qzCard(); }, 400);
  });
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function () { try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); } setTimeout(() => { ['ad-ag', 'ad-qz'].forEach(i => { const x = $(i); if (x) x.remove(); }); cards(); }, 60); };

  /* =================== Vue usager =================== */
  const PLAIN = [[/\bSJR\b/g, 'salaire journalier de référence'], [/\bAJ\b/g, 'allocation par jour'], [/\bARE\b/g, 'allocation chômage'], [/\bICCP\b/g, 'indemnité de congés payés'], [/\bsupra-?légal(e|es)?\b/gi, 'indemnités au-delà du minimum légal'], [/\bASS\b/g, 'allocation de solidarité'], [/\bATI\b/g, 'allocation des travailleurs indépendants'], [/\bAREF\b/g, 'allocation pendant la formation'], [/\bRFF\b/g, 'rémunération de fin de formation'], [/\bCSP\b/g, 'contrat de sécurisation professionnelle'], [/\bFCT\b/g, 'fin de contrat'], [/\bPJI\b/g, 'premier jour indemnisé']];
  const plain = t => PLAIN.reduce((s, [r, v]) => s.replace(r, v), String(t || '')).replace(/^\w/, c => c.toUpperCase());
  let fs = 1;
  window.ftUsagerView = function (mailText, opt) {
    const S = opt && opt.vals ? { name: opt.name || 'Simulation', vals: opt.vals } : (window.ftPrefill && window.ftPrefill.collect ? window.ftPrefill.collect() : null);
    const seen = new Set();
    const vals = S ? S.vals.filter(v => {
      if (!v.l || v.l.length < 3 || /^[\d\s,.]+\s*(€|jours?|mois|j)?$/i.test(v.l.trim()) || /seuil|minimal|minimum l|maximum théorique|barème|plafond de ressources/i.test(v.l)) return false;
      if (seen.has(v.v)) return false; seen.add(v.v); return true;
    }).slice(0, 8) : [];
    let w = $('ft-usager');
    if (!w) { w = document.createElement('div'); w.id = 'ft-usager'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'us-t'); document.body.appendChild(w);
      w.addEventListener('click', e => { const b = e.target.closest('[data-us]'); if (!b) return; const a = b.dataset.us;
        if (a === 'x') w.hidden = true; else if (a === 'p') { fs = Math.min(1.6, fs + 0.15); w.style.setProperty('--us', fs); } else if (a === 'm') { fs = Math.max(0.85, fs - 0.15); w.style.setProperty('--us', fs); } else if (a === 'print') window.print(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; }); }
    const txt = String(mailText || '').replace(/^(objet|sujet)\s*:.*$/gim, '').trim();
    w.innerHTML = '<div class="us-bar"><span>👁 Vue usager · ' + esc(S ? S.name : 'Simulation') + '</span><div><button type="button" data-us="m" aria-label="Texte plus petit">A−</button><button type="button" data-us="p" aria-label="Texte plus grand">A+</button><button type="button" data-us="print">Imprimer</button><button type="button" data-us="x" class="us-x">Fermer</button></div></div>' +
      '<div class="us-body"><h2 id="us-t">Votre situation</h2><p class="us-note">Estimation indicative réalisée avec votre conseiller ou conseillère France Travail. Seule la notification officielle fait foi.</p>' +
      (vals.length ? '<div class="us-grid">' + vals.map(v => '<div class="us-c"><span>' + esc(plain(v.l)) + '</span><strong>' + esc(v.v) + '</strong></div>').join('') + '</div>' : '') +
      (txt ? '<h3>En résumé</h3><div class="us-txt">' + esc(txt).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>').replace(/^/, '<p>') + '</p></div>' : '') + '</div>';
    w.style.setProperty('--us', fs); w.hidden = false;
    setTimeout(() => { const b = w.querySelector('.us-x'); if (b) b.focus(); }, 30);
  };
  function usBtns() {
    document.querySelectorAll('.ft-mail .ft-mail-btns').forEach(g => {
      if (g.querySelector('.ft-mail-us')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-mail-us'; b.textContent = '👁 Vue usager'; b.title = 'Afficher les résultats en grand, sans jargon, pour la personne reçue';
      b.onclick = () => { const box = g.closest('.ft-mail'), ta = box && box.querySelector('textarea'); window.ftUsagerView(ta ? ta.value : ''); };
      g.insertBefore(b, g.firstChild);
    });
  }
  if (window.ftOnDom) window.ftOnDom(usBtns);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Vue usager', s: 'Résultats du simulateur en grand, sans jargon', kw: 'vue usager demandeur écran montrer présentation grand', run: () => { const ta = document.querySelector('[id^="view-"]:not(.hidden) .ft-mail textarea'); window.ftUsagerView(ta ? ta.value : ''); } });
})();
