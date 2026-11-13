(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const user = () => window.__ftUser && window.__ftUser();
  const name = id => { if (String(id).indexOf('mail:') === 0) return '✉ ' + String(id).slice(5); if (String(id).indexOf('copie:') === 0) return '📋 ' + String(id).slice(6); try { return (NAV_TABS_CONFIG.find(t => String(t.id) === String(id)) || {}).name || id; } catch (e) { return id; } };
  const dt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const dtt = d => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const missing = e => /PGRST20[25]|42883|42P01|does not exist|HTTP 404/.test(String(e && (e.message || e.code) || ''));

  /* ================= Journal d’utilisation (comptes connectés) ================= */
  let Q = [], ft = null, last = '';
  function log(tool) {
    if (!user() || !tool || tool === last) return; last = tool;
    if (/^(home|admin)$/.test(tool) || tool.indexOf('hub:') === 0) return;
    Q.push({ tool: tool.slice(0, 120), at: new Date().toISOString() });
    clearTimeout(ft); ft = setTimeout(flush, Q.length >= 8 ? 200 : 20000);
  }
  function flush(keep) {
    if (!Q.length || !window.__ftRest || !user()) return;
    const rows = Q.splice(0, Q.length);
    window.__ftRest('/rest/v1/usage_events', { method: 'POST', prefer: 'return=minimal', keepalive: !!keep, body: rows }).catch(e => { if (!missing(e)) Q = rows.concat(Q).slice(-200); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });
  window.addEventListener('pagehide', () => flush(true));
  const _sw = switchNavTab;
  switchNavTab = function (t) { const r = _sw.apply(this, arguments); try { log(String(t)); } catch (e) {} setTimeout(faqRender, 30); return r; };
  if (typeof selectTemplate === 'function') {
    const _st = selectTemplate;
    selectTemplate = function (id) { const r = _st.apply(this, arguments); try { const t = templates.find(x => x.id === id); if (t) { last = ''; log('mail:' + t.title); } } catch (e) {} return r; };
  }
  if (typeof copyCurrentMail === 'function') {
    const _cp = copyCurrentMail;
    copyCurrentMail = function () { const r = _cp.apply(this, arguments); try { const t = templates.find(x => x.id === activeTemplateId); if (t) { last = ''; log('copie:' + t.title); last = ''; } } catch (e) {} return r; };
  }

  /* ================= Boîte à idées ================= */
  window.ftFeedback = function () {
    let w = $('ft-fb'); if (!w) { w = document.createElement('div'); w.id = 'ft-fb'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
    const page = (($('header-active-tab-name') || {}).textContent || '').trim();
    w.innerHTML = '<div class="fb-box"><h3>Suggérer une amélioration</h3><p>Votre message est transmis à l’administrateur du site' + (user() ? ' avec votre e-mail, pour pouvoir vous répondre' : '') + '. N’y mettez aucune donnée d’allocataire.</p>' +
      '<select id="fb-k"><option value="idee">Idée d’amélioration</option><option value="erreur">Erreur dans un calcul ou un texte</option><option value="question">Question</option></select>' +
      '<textarea id="fb-m" placeholder="Votre message"></textarea><div class="ad-row" style="justify-content:flex-end"><button type="button" class="ad-btn" data-x>Annuler</button><button type="button" class="ad-btn pri" data-s>Envoyer</button></div></div>';
    w.classList.add('on'); setTimeout(() => $('fb-m').focus(), 50);
    w.onclick = e => {
      if (e.target === w || e.target.closest('[data-x]')) { w.classList.remove('on'); return; }
      if (!e.target.closest('[data-s]')) return;
      const m = $('fb-m').value.trim(); if (!m) { $('fb-m').focus(); return; }
      if (!user()) { toast('Connectez-vous pour envoyer une suggestion', 'info'); return; }
      window.__ftRest('/rest/v1/site_feedback', { method: 'POST', prefer: 'return=minimal', body: { user_id: user().id, email: user().email, kind: $('fb-k').value, message: m.slice(0, 4000), page: page } })
        .then(() => { w.classList.remove('on'); toast('Merci ! Votre message a été transmis', 'success'); })
        .catch(e => toast(missing(e) ? 'La boîte à idées n’est pas encore activée par l’administrateur' : 'Envoi impossible pour le moment', 'error'));
    };
  };

  /* ================= FAQ ================= */
  const FAQ0 = [
    ['Comment installer le site comme une application sur mon téléphone ?', 'Sur iPhone, ouvrez le site dans Safari, touchez Partager puis « Sur l’écran d’accueil ». Sur Android, menu ⋮ puis « Installer l’application ». Le mode d’emploi est aussi dans le menu « ⋯ » du téléphone.'],
    ['Pourquoi créer un compte ?', 'Vos modèles de mail, favoris et réglages vous suivent sur tous vos postes et votre téléphone. Sans compte, ils restent sur l’appareil utilisé.'],
    ['Mes données d’allocataires sont-elles enregistrées ?', 'Non. Les simulateurs calculent sur votre poste ; rien de ce que vous saisissez dans un simulateur n’est envoyé. Seuls vos modèles, favoris et réglages sont synchronisés avec votre compte.'],
    ['Quelles statistiques sont collectées ?', 'Avec un compte, le site enregistre quel outil ou quel modèle est ouvert, et quand. Ces chiffres servent à améliorer le site et sont visibles par l’administrateur. Aucune donnée d’allocataire n’est collectée.'],
    ['Comment proposer un modèle de mail à toute l’équipe ?', 'Ouvrez le modèle dans la page Mails, puis cliquez sur l’icône « équipe » à côté du titre. L’administrateur le valide avant qu’il soit publié pour tous.'],
    ['Comment garder une trace d’une simulation ?', 'Sous chaque mail généré par un simulateur : « Fiche PDF » pour imprimer ou enregistrer les résultats, « En faire un modèle » pour l’ajouter à vos modèles, « Copier le mail » pour le coller dans le dossier.'],
    ['Les montants sont-ils à jour ?', 'La date de vérification du barème est indiquée dans les Repères de l’accueil. Les sources de chaque règle sont dans « Sources et vérification ». En cas de doute, la décision notifiée fait foi.'],
    ['J’ai trouvé une erreur ou j’ai une idée', 'Utilisez « Suggérer une amélioration » (bouton ci-dessus, ou Ctrl+K). Votre message arrive directement à l’administrateur.']
  ];
  const faq = () => { try { const f = JSON.parse(localStorage.getItem('ft_faq') || 'null'); return Array.isArray(f) && f.length ? f : FAQ0; } catch (e) { return FAQ0; } };
  const FV = document.createElement('div');
  FV.id = 'view-faq'; FV.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
  FV.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>Questions fréquentes</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-normal">FAQ</span></h2></div></div></div><div class="flex-1 overflow-y-auto p-4 md:p-6"><div class="max-w-4xl mx-auto"><div class="faq-tools"><input id="faq-q" type="search" placeholder="Rechercher une question" aria-label="Rechercher dans la FAQ"><button type="button" class="ad-btn pri" onclick="ftFeedback()">Suggérer une amélioration</button></div><div id="faq-list"></div></div></div>';
  const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(FV);
  NAV_TABS_CONFIG.push({ id: 'faq', name: 'Questions fréquentes', desc: 'Utiliser le site, compte, données, suggestions', icon: 'help-circle', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', badge: 'FAQ' });
  try { FT_KW.faq = 'faq question aide utiliser site compte installer données suggestion'; } catch (e) {}
  function faqRender() {
    const on = tab() === 'faq'; FV.classList.toggle('hidden', !on); if (!on) return;
    const n = $('header-active-tab-name'); if (n) n.textContent = 'Autres outils · Questions fréquentes';
    const q = (($('faq-q') || {}).value || '').toLowerCase();
    const it = faq().filter(x => !q || (x[0] + ' ' + x[1]).toLowerCase().indexOf(q) > -1);
    $('faq-list').innerHTML = it.length ? it.map(x => '<details class="faq-q"><summary>' + esc(x[0]) + '</summary><div>' + esc(x[1]) + '</div></details>').join('') : '<p class="ad-empty">Aucune question ne correspond. Posez-la avec « Suggérer une amélioration ».</p>';
  }
  document.addEventListener('input', e => { if (e.target && e.target.id === 'faq-q') faqRender(); });
  document.addEventListener('ft-faq', faqRender);
  /* Menu : rubrique « Autres outils », sous « Ma journée » */
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c || c.querySelector('button[onclick="switchNavTab(\'faq\')"]')) return r;
      const model = c.querySelector('button[onclick="switchNavTab(\'jour\')"]'); if (!model) return r;
      const b = model.cloneNode(true); b.setAttribute('onclick', "switchNavTab('faq')");
      const on = tab() === 'faq';
      if (on) { b.className = model.className.replace(/bg-gradient[^ ]*|from-[^ ]*|to-[^ ]*|border-cyan[^ ]*|shadow[^ ]*/g, ''); }
      const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
      if (lb) { lb.textContent = 'Questions fréquentes'; delete lb.dataset.lbOrig; } if (d) d.textContent = 'Utiliser le site, compte, données, suggestions';
      if (ic) { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('fill', 'none'); n.setAttribute('stroke', 'currentColor'); n.setAttribute('stroke-width', '2'); n.setAttribute('stroke-linecap', 'round'); n.setAttribute('stroke-linejoin', 'round'); n.setAttribute('class', ic.getAttribute('class') || ''); n.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>'; ic.replaceWith(n); }
      b.querySelectorAll('.ft-pen-wrap,.ft-pen').forEach(x => x.remove());
      model.parentNode.insertBefore(b, model.nextSibling); return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  function hubFaq() {}
  if (window.ftOnDom) window.ftOnDom(hubFaq);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push(
    { t: 'Suggérer une amélioration', s: 'Idée, erreur ou question pour l’administrateur', kw: 'suggestion idée erreur bug amélioration avis remarque', run: () => window.ftFeedback() },
    { t: 'Questions fréquentes', s: 'Aide à l’utilisation du site', kw: 'faq aide question', run: () => switchNavTab('faq') }
  );
  /* Entrée dans le menu « ⋯ » du téléphone */
  function moreItem() {
    const m = $('ft-more'); if (!m || m.querySelector('[data-k="fb"]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'fb';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Suggérer une amélioration</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); setTimeout(window.ftFeedback, 30); });
    const hr = m.querySelector('hr'); m.insertBefore(b, hr || null);
  }
  if (window.ftOnDom) window.ftOnDom(moreItem);

  /* ================= Espace administrateur : cartes supplémentaires ================= */
  let per = 30;
  window.ftAdminFill = function (card) {
    usage(card); users(card); ideas(card); faqAdmin(card);
  };
  function evo(name, short) {
    const host = $('au-evo'); if (!host) return;
    const mk = (y, m) => y + '-' + String(m + 1).padStart(2, '0');
    const now = new Date(), months = []; for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(mk(d.getFullYear(), d.getMonth())); }
    const lab = k => new Date(k + '-15').toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
    Promise.all([window.__ftRpc('admin_monthly_users', { months: 6 }), window.__ftRpc('admin_usage', { days: 30 }), window.__ftRpc('admin_usage', { days: 60 }), window.__ftRpc('admin_users').catch(() => [])]).then(([mu, u30, u60, users]) => {
      const M = {}; (mu || []).forEach(r => { M[String(r.month).slice(0, 7)] = r; });
      const ser = months.map(k => ({ k, a: +(M[k] && M[k].actions) || 0, u: +(M[k] && M[k].users) || 0 }));
      const mxA = Math.max(1, ...ser.map(x => x.a)), mxU = Math.max(1, ...ser.map(x => x.u));
      const bars = '<div class="ev-bars">' + ser.map(x => '<div class="ev-col" title="' + lab(x.k) + ' : ' + x.a + ' action(s), ' + x.u + ' conseiller(s) actif(s)"><div class="ev-pair"><i class="a" style="height:' + Math.max(2, Math.round(x.a / mxA * 100)) + '%"></i><i class="u" style="height:' + Math.max(2, Math.round(x.u / mxU * 100)) + '%"></i></div><span>' + lab(x.k) + '</span></div>').join('') + '</div><div class="ev-leg"><span><i class="a"></i>Actions</span><span><i class="u"></i>Conseillers actifs</span></div>';
      const cur = ser[5], prev = ser[4], pct = (a, b) => b ? Math.round((a - b) / b * 100) : (a ? 100 : 0);
      /* Tendances : 30 derniers jours contre les 30 précédents */
      const agg = rows => { const m = {}; (rows || []).forEach(r => { const t = String(r.tool); if (/^(hub:|admin$)/.test(t)) return; m[t] = (m[t] || 0) + (+r.uses || 0); }); return m; };
      const A = agg(u30), B60 = agg(u60), P = {}; Object.keys(B60).forEach(k => { P[k] = B60[k] - (A[k] || 0); });
      const keys = [...new Set([...Object.keys(A), ...Object.keys(P)])];
      const d = keys.map(k => ({ k, now: A[k] || 0, before: P[k] || 0, diff: (A[k] || 0) - (P[k] || 0) })).filter(x => x.now + x.before >= 2);
      const up = d.filter(x => x.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5), down = d.filter(x => x.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);
      const li = (x, c) => '<div><span>' + esc(name(x.k)) + '</span><b class="' + c + '">' + (x.diff > 0 ? '+' : '') + x.diff + ' <small>(' + x.before + ' → ' + x.now + ')</small></b></div>';
      /* Adoption */
      const cnt = (users || []).length, created = {}; (users || []).forEach(r => { const k = String(r.created_at || '').slice(0, 7); created[k] = (created[k] || 0) + 1; });
      const active30 = new Set((u30 || []).map(r => r.email)).size;
      host.innerHTML =
        '<div class="st-tile st-wide2"><h4>Activité par mois<span>6 derniers mois</span></h4>' + bars + '<p class="st-last">Ce mois-ci : ' + cur.a + ' action(s) (' + (pct(cur.a, prev.a) >= 0 ? '+' : '') + pct(cur.a, prev.a) + ' % par rapport au mois dernier), ' + cur.u + ' conseiller(s) actif(s).</p></div>' +
        '<div class="st-tile"><h4>En hausse<span>30 j vs 30 j précédents</span></h4><div class="st-list">' + (up.length ? up.map(x => li(x, 'ev-up')).join('') : '<div><span class="ad-empty">Pas de hausse notable</span></div>') + '</div></div>' +
        '<div class="st-tile"><h4>En baisse<span>30 j vs 30 j précédents</span></h4><div class="st-list">' + (down.length ? down.map(x => li(x, 'ev-down')).join('') : '<div><span class="ad-empty">Pas de baisse notable</span></div>') + '</div></div>' +
        '<div class="st-tile"><h4>Adoption</h4><div class="st-nums"><div><b>' + cnt + '</b><span>comptes</span></div><div><b>' + active30 + '</b><span>actifs 30 j</span></div><div><b>' + (cnt ? Math.round(active30 / cnt * 100) : 0) + ' %</b><span>taux d’usage</span></div></div><div class="st-lbl">Nouveaux comptes</div><div class="st-list">' + months.slice(-3).reverse().map(k => '<div><span>' + lab(k) + ' ' + k.slice(0, 4) + '</span><b>' + (created[k] || 0) + '</b></div>').join('') + '</div></div>';
    }).catch(e => { host.innerHTML = '<p class="ad-empty">' + (/admin_monthly|PGRST202|42883|404/.test(String(e && (e.message || e.code))) ? 'Évolution non installée : exécutez le script supabase/evolution.sql dans Supabase.' : 'Chargement impossible : ' + esc(e && e.message || e)) + '</p>'; });
  }
  function usage(card) {
    const host = $('ad-usage'); if (!host) return;
    host.innerHTML = '<div class="st-head"><h3>Statistiques d’utilisation</h3><span class="au-per">' + [7, 30, 90, 365].map(d => '<button type="button" data-d="' + d + '" class="' + (d === per ? 'on' : '') + '">' + (d === 365 ? '1 an' : d + ' j') + '</button>').join('') + '</span></div><div id="au-body" class="ad-empty">Chargement…</div>';
    host.querySelector('.au-per').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { per = +b.dataset.d; usage(card); } };
    Promise.all([window.__ftRpc('admin_usage', { days: per }), window.__ftRpc('admin_daily', { days: per })]).then(([rows, daily]) => {
      rows = (rows || []).map(r => Object.assign({}, r, { uses: +r.uses || 0 })); daily = daily || [];
      const b = $('au-body');
      if (!rows.length) { b.innerHTML = '<p class="ad-empty">Pas encore d’activité enregistrée sur cette période. Les chiffres apparaîtront au fil des connexions.</p>'; return; }
      const kind = t => String(t).indexOf('mail:') === 0 ? 'mail' : String(t).indexOf('copie:') === 0 ? 'copie' : 'outil';
      const tplName = t => String(t).replace(/^(mail|copie):/, '');
      const NM = {}; rows.forEach(r => { if (r.name) NM[r.email] = r.name; }); Object.assign(window.__ftNames = window.__ftNames || {}, NM);
      const disp = e => (window.__ftNames && window.__ftNames[e]) || e;
      const short = e => (window.__ftNames && window.__ftNames[e]) || String(e || '').split('@')[0];
      const ini = e => { const n = (window.__ftNames && window.__ftNames[e]); return n ? n.split(' ').map(x => x.charAt(0)).join('').slice(0, 2).toUpperCase() : (String(e || '').charAt(0).toUpperCase() || '?'); };
      const sum = a => a.reduce((s, r) => s + r.uses, 0);
      const tools = rows.filter(r => kind(r.tool) === 'outil'), opens = rows.filter(r => kind(r.tool) === 'mail'), copies = rows.filter(r => kind(r.tool) === 'copie');
      /* Regroupements */
      const group = (list, key) => { const m = {}; list.forEach(r => { const k = key(r); const g = m[k] = m[k] || { k, uses: 0, users: {}, last: null }; g.uses += r.uses; g.users[r.email] = (g.users[r.email] || 0) + r.uses; if (!g.last || r.last_at > g.last) g.last = r.last_at; }); return Object.values(m).sort((a, c) => c.uses - a.uses); };
      const mails = {}; opens.concat(copies).forEach(r => { const k = tplName(r.tool); const g = mails[k] = mails[k] || { k, open: 0, copy: 0, users: {}, last: null }; if (kind(r.tool) === 'mail') g.open += r.uses; else g.copy += r.uses; const u = g.users[r.email] = g.users[r.email] || { o: 0, c: 0 }; if (kind(r.tool) === 'mail') u.o += r.uses; else u.c += r.uses; if (!g.last || r.last_at > g.last) g.last = r.last_at; });
      const M = Object.values(mails).sort((a, c) => (c.copy * 3 + c.open) - (a.copy * 3 + a.open));
      const T = group(tools, r => r.tool);
      const byU = {}; rows.forEach(r => { const u = byU[r.email] = byU[r.email] || { email: r.email, uses: 0, tools: [], mails: {}, copies: 0, last: null }; u.uses += r.uses; if (kind(r.tool) === 'outil') u.tools.push(r); else { const k = tplName(r.tool); const m = u.mails[k] = u.mails[k] || { k, o: 0, c: 0 }; if (kind(r.tool) === 'mail') m.o += r.uses; else { m.c += r.uses; u.copies += r.uses; } } if (!u.last || r.last_at > u.last) u.last = r.last_at; });
      const U = Object.values(byU).sort((a, c) => c.uses - a.uses);
      /* Graphique */
      const days = [], map = {}; daily.forEach(d => { map[String(d.day).slice(0, 10)] = d; });
      const nd = Math.min(per, 90);
      for (let i = nd - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().slice(0, 10); days.push([k, map[k] ? +map[k].uses : 0, map[k] ? +map[k].users : 0]); }
      const mx = Math.max(1, ...days.map(d => d[1]));
      const who = users => Object.entries(users).sort((a, c) => (typeof c[1] === 'object' ? c[1].o + c[1].c : c[1]) - (typeof a[1] === 'object' ? a[1].o + a[1].c : a[1])).map(([e, v]) => '<span class="st-who" title="' + esc(disp(e) + (disp(e) !== e ? ' · ' + e : '')) + '"><i>' + esc(ini(e)) + '</i>' + esc(short(e)) + ' <b>' + (typeof v === 'object' ? (v.c ? v.c + ' copie' + (v.c > 1 ? 's' : '') + ' · ' : '') + v.o + ' ouv.' : v) + '</b></span>').join('');
      const kpi = (l, v, sub, c) => '<div class="st-kpi ' + (c || '') + '"><span>' + l + '</span><b>' + v + '</b><em>' + sub + '</em></div>';
      const topM = M[0], topT = T[0];
      b.className = '';
      b.innerHTML =
        '<div class="st-kpis">' +
          kpi('Conseillers actifs', U.length, 'sur la période', 'c1') +
          kpi('Ouvertures d’outils', sum(tools), (sum(tools) / per).toFixed(1).replace('.', ',') + ' par jour', 'c2') +
          kpi('Mails ouverts', sum(opens), M.length + ' modèle(s) différents', 'c3') +
          kpi('Mails copiés', sum(copies), 'envoyés aux usagers', 'c4') +
          kpi('Mail n° 1', topM ? topM.copy + topM.open : 0, esc(topM ? topM.k : '—'), 'c5') +
          kpi('Outil n° 1', topT ? topT.uses : 0, esc(topT ? name(topT.k) : '—'), 'c6') +
        '</div>' +
        '<div class="st-tile st-wide"><h4>Activité jour par jour<span>' + nd + ' derniers jours</span></h4><div class="au-chart">' + days.map(d => '<i style="height:' + Math.max(2, Math.round(d[1] / mx * 100)) + '%" data-t="' + new Date(d[0] + 'T12:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' : ' + d[1] + ' action(s), ' + d[2] + ' conseiller(s)"></i>').join('') + '</div><div class="au-axis"><span>' + new Date(days[0][0] + 'T12:00').toLocaleDateString('fr-FR') + '</span><span>aujourd’hui</span></div></div>' +
        '<div class="st-sec">📈 Évolution</div><div id="au-evo" class="st-grid"><p class="ad-empty">Chargement…</p></div>' +
        '<div class="st-sec">✉ Mails (CVM) les plus utilisés</div>' +
        '<div class="st-grid">' + (M.length ? M.slice(0, 12).map((m, i) => '<div class="st-tile"><div class="st-rank">' + (i + 1) + '</div><h4 title="' + esc(m.k) + '">' + esc(m.k) + '</h4><div class="st-nums"><div><b>' + m.copy + '</b><span>copié' + (m.copy > 1 ? 's' : '') + '</span></div><div><b>' + m.open + '</b><span>ouvert' + (m.open > 1 ? 's' : '') + '</span></div><div><b>' + Object.keys(m.users).length + '</b><span>conseiller' + (Object.keys(m.users).length > 1 ? 's' : '') + '</span></div></div><div class="st-bar"><i style="width:' + Math.max(4, Math.round((m.copy * 3 + m.open) / (M[0].copy * 3 + M[0].open) * 100)) + '%"></i></div><div class="st-whos">' + who(m.users) + '</div><p class="st-last">Dernière utilisation : ' + dtt(m.last) + '</p></div>').join('') : '<p class="ad-empty">Aucun mail ouvert sur la période.</p>') + '</div>' +
        (M.length > 12 ? '<details class="st-more"><summary>Voir les ' + (M.length - 12) + ' autres modèles</summary><table class="ad-tbl"><tr><th>Modèle</th><th style="text-align:right">Copiés</th><th style="text-align:right">Ouverts</th><th>Par</th></tr>' + M.slice(12).map(m => '<tr><td>' + esc(m.k) + '</td><td class="n">' + m.copy + '</td><td class="n">' + m.open + '</td><td>' + Object.keys(m.users).map(short).map(esc).join(', ') + '</td></tr>').join('') + '</table></details>' : '') +
        '<div class="st-sec">🧮 Outils les plus utilisés</div>' +
        '<div class="st-grid">' + (T.length ? T.slice(0, 12).map((t, i) => '<div class="st-tile"><div class="st-rank">' + (i + 1) + '</div><h4>' + esc(name(t.k)) + '</h4><div class="st-nums"><div><b>' + t.uses + '</b><span>ouverture' + (t.uses > 1 ? 's' : '') + '</span></div><div><b>' + Object.keys(t.users).length + '</b><span>conseiller' + (Object.keys(t.users).length > 1 ? 's' : '') + '</span></div></div><div class="st-bar"><i style="width:' + Math.max(4, Math.round(t.uses / T[0].uses * 100)) + '%"></i></div><div class="st-whos">' + who(t.users) + '</div><p class="st-last">Dernière ouverture : ' + dtt(t.last) + '</p></div>').join('') : '<p class="ad-empty">Aucun outil ouvert sur la période.</p>') + '</div>' +
        '<div class="st-sec">👤 Par conseiller</div>' +
        '<div class="st-grid">' + U.map((u, i) => {
          const tl = u.tools.slice().sort((a, c) => c.uses - a.uses), ml = Object.values(u.mails).sort((a, c) => (c.c * 3 + c.o) - (a.c * 3 + a.o));
          return '<div class="st-tile st-user"><div class="st-uh"><span class="st-av">' + esc(ini(u.email)) + '</span><div><h4 title="' + esc(u.email) + '">' + esc(disp(u.email)) + '</h4>' + (disp(u.email) !== u.email ? '<p class="st-last">' + esc(u.email) + '</p>' : '') + '<p class="st-last">Dernière activité : ' + dtt(u.last) + '</p></div></div>' +
            '<div class="st-nums"><div><b>' + u.uses + '</b><span>actions</span></div><div><b>' + tl.length + '</b><span>outils</span></div><div><b>' + ml.length + '</b><span>mails</span></div><div><b>' + u.copies + '</b><span>copiés</span></div></div>' +
            '<div class="st-lbl">Mails les plus utilisés</div><div class="st-list">' + (ml.length ? ml.slice(0, 4).map(m => '<div><span>' + esc(m.k) + '</span><b>' + (m.c ? m.c + ' copie' + (m.c > 1 ? 's' : '') + ' · ' : '') + m.o + ' ouv.</b></div>').join('') : '<div><span class="ad-empty">Aucun</span></div>') + '</div>' +
            '<div class="st-lbl">Outils les plus utilisés</div><div class="st-list">' + (tl.length ? tl.slice(0, 4).map(t => '<div><span>' + esc(name(t.tool)) + '</span><b>' + t.uses + '</b></div>').join('') : '<div><span class="ad-empty">Aucun</span></div>') + '</div>' +
            ((tl.length > 4 || ml.length > 4) ? '<details class="st-more"><summary>Tout voir</summary><div class="st-list">' + ml.slice(4).map(m => '<div><span>✉ ' + esc(m.k) + '</span><b>' + (m.c ? m.c + ' c. · ' : '') + m.o + ' o.</b></div>').join('') + tl.slice(4).map(t => '<div><span>' + esc(name(t.tool)) + '</span><b>' + t.uses + '</b></div>').join('') + '</div></details>' : '') +
            '</div>';
        }).join('') + '</div>' +
        '' + (setTimeout(() => evo(name, short), 0) && '') +
        '<p class="ad-empty" style="margin-top:10px">« Copié » = le conseiller a copié le mail pour l’envoyer ; « ouvert » = il l’a consulté. Le classement des mails compte une copie comme trois ouvertures. Les copies sont enregistrées à partir de cette version.</p>';
    }).catch(e => { $('au-body').textContent = missing(e) ? 'Statistiques détaillées non installées : exécutez le script supabase/admin_stats.sql dans Supabase.' : 'Chargement impossible : ' + (e && e.message || e); });
  }
  function users(card) {
    const host = $('ad-users'); if (!host) return;
    host.innerHTML = card('👤', 'Comptes', '', '<div id="us-body" class="ad-empty">Chargement…</div>');
    window.__ftRpc('admin_users').then(rows => {
      rows = rows || []; const b = $('us-body'); b.className = '';
      rows.forEach(r => { if (r.name) (window.__ftNames = window.__ftNames || {})[r.email] = r.name; });
      b.innerHTML = '<table class="ad-tbl"><tr><th>Conseiller</th><th style="text-align:right">Inscrit</th><th style="text-align:right">Connexion</th><th style="text-align:right">Modèles perso</th></tr>' + rows.map(r => '<tr><td>' + (r.name ? '<b>' + esc(r.name) + '</b><div class="ad-empty" style="font-size:11px">' + esc(r.email) + '</div>' : esc(r.email) + (('name' in r) ? ' <span class="ad-empty" style="font-size:11px">(nom non renseigné)</span>' : '')) + '</td><td class="n">' + dt(r.created_at) + '</td><td class="n">' + dtt(r.last_sign_in) + '</td><td class="n">' + (r.own_templates || 0) + '</td></tr>').join('') + '</table><p class="ad-empty" style="margin-top:6px">' + rows.length + ' compte(s).</p>';
    }).catch(e => { $('us-body').textContent = missing(e) ? 'Non installé : script supabase/admin_stats.sql.' : 'Chargement impossible.'; });
  }
  function ideas(card) {
    const host = $('ad-ideas'); if (!host) return;
    host.innerHTML = card('💡', 'Boîte à idées', '', '<div id="id-body" class="ad-empty">Chargement…</div>');
    const K = { idee: 'Idée', erreur: 'Erreur signalée', question: 'Question' };
    window.__ftRest('/rest/v1/site_feedback?select=*&order=done.asc,created_at.desc&limit=100').then(rows => {
      rows = rows || []; const b = $('id-body'); b.className = '';
      const open = rows.filter(r => !r.done).length;
      host.querySelector('.text-cyan-400').textContent = open + ' à traiter'; try { document.dispatchEvent(new Event('ft-regs')); } catch (e) {}
      b.innerHTML = rows.length ? rows.map(r => '<div class="id-it' + (r.done ? ' done' : '') + '" data-id="' + esc(r.id) + '"><div class="id-h"><span class="id-k">' + esc(K[r.kind] || r.kind) + '</span><span>' + esc((window.__ftNames && window.__ftNames[r.email]) || r.email || '') + ' · ' + dtt(r.created_at) + '</span></div><div class="id-m">' + esc(r.message) + '</div>' + (r.page ? '<div class="id-h"><span>Page : ' + esc(r.page) + '</span></div>' : '') + '<div class="ad-row" style="margin-top:6px">' + (r.email ? '<a class="ad-btn" href="mailto:' + esc(r.email) + '?subject=' + encodeURIComponent('Votre suggestion sur l’Espace Conseiller') + '">Répondre</a>' : '') + '<button type="button" class="ad-btn" data-a="done">' + (r.done ? 'Rouvrir' : 'Marquer traité') + '</button><button type="button" class="ad-btn" data-a="del">Supprimer</button></div></div>').join('') : '<p class="ad-empty">Aucun message pour l’instant. Les conseillers écrivent via « Suggérer une amélioration » (FAQ, recherche, menu « ⋯ »).</p>';
      b.onclick = e => {
        const btn = e.target.closest('button[data-a]'); if (!btn) return; const it = btn.closest('.id-it'), id = it.dataset.id, r = rows.find(x => String(x.id) === id);
        const p = btn.dataset.a === 'del' ? window.__ftRest('/rest/v1/site_feedback?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }) : window.__ftRest('/rest/v1/site_feedback?id=eq.' + encodeURIComponent(id), { method: 'PATCH', prefer: 'return=minimal', body: { done: !r.done } });
        p.then(() => ideas(card)).catch(() => toast('Action impossible', 'error'));
      };
    }).catch(e => { $('id-body').textContent = missing(e) ? 'Non installée : script supabase/admin_stats.sql.' : 'Chargement impossible.'; });
  }
  function faqAdmin(card) {
    const host = $('ad-faq'); if (!host) return;
    let items = faq().map(x => x.slice());
    const draw = () => {
      host.innerHTML = card('?', 'FAQ du site', items.length + ' question(s)', '<div class="fq-ed">' + items.map((x, i) => '<div class="fq-row" data-i="' + i + '"><input value="' + esc(x[0]) + '" data-f="0" aria-label="Question"><textarea data-f="1" aria-label="Réponse">' + esc(x[1]) + '</textarea><div class="ad-row" style="margin-top:6px"><button type="button" class="ad-btn" data-a="up">Monter</button><button type="button" class="ad-btn" data-a="del">Supprimer</button></div></div>').join('') + '</div><div class="ad-row"><button type="button" class="ad-btn" data-a="add">Ajouter une question</button><button type="button" class="ad-btn pri" data-a="save">Publier la FAQ</button><button type="button" class="ad-btn" onclick="switchNavTab(\'faq\')">Voir la page</button></div>');
      host.oninput = e => { const r = e.target.closest('.fq-row'); if (r && e.target.dataset.f) items[+r.dataset.i][+e.target.dataset.f] = e.target.value; };
      host.onclick = e => {
        const b = e.target.closest('button[data-a]'); if (!b) return; const r = b.closest('.fq-row'), i = r ? +r.dataset.i : -1;
        if (b.dataset.a === 'add') { items.push(['Nouvelle question', 'Réponse']); draw(); }
        if (b.dataset.a === 'del') { items.splice(i, 1); draw(); }
        if (b.dataset.a === 'up' && i > 0) { const t = items[i]; items[i] = items[i - 1]; items[i - 1] = t; draw(); }
        if (b.dataset.a === 'save') {
          const clean = items.filter(x => x[0].trim() && x[1].trim());
          window.__ftSaveShared('__ft_faq', { items: clean }).then(() => { localStorage.setItem('ft_faq', JSON.stringify(clean)); toast('FAQ publiée pour tous les conseillers', 'success'); }).catch(() => toast('Publication impossible', 'error'));
        }
      };
    };
    draw();
  }
})();
