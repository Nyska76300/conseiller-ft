(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const fr = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ================= 3. Échéances réglementaires ================= */
  function events() {
    const now = new Date(), y = now.getFullYear();
    const nextReval = [new Date(y, 6, 1), new Date(y + 1, 0, 1), new Date(y + 1, 6, 1)].find(d => d > now);
    let ver = ''; try { ver = BAREME.verifie; } catch (e) {}
    const E = [
      { d: new Date(2026, 3, 1), t: 'Primo-entrants : ouverture de droits dès 5 mois d’affiliation', x: 'Un demandeur d’emploi qui n’a jamais ouvert de droit peut être indemnisé à partir de 108 jours ou 758 heures travaillés.', s: 'Unédic, impact de la mesure primo-entrants' },
      { d: new Date(2026, 8, 1), t: 'Rupture conventionnelle individuelle : durée plafonnée', x: '15 mois avant 55 ans, 20,5 mois à partir de 55 ans, pour les fins de contrat à compter de cette date. La rupture conventionnelle collective n’est pas concernée.', s: 'Unédic, « Ce qui change le 1er septembre 2026 »' },
      { d: new Date(2026, 8, 1), t: 'Retraite : âges du maintien des droits avancés d’un trimestre', x: 'Suspension de la réforme des retraites (LFSS 2026) : générations 1964 à 1968 concernées.', s: 'Unédic, « Ce qui change le 1er septembre 2026 »' },
      { d: new Date(2026, 11, 31), t: 'RFF : dernières formations prescrites', x: 'La rémunération de fin de formation est maintenue pour les formations prescrites jusqu’au 31 décembre 2026. Vérifier la reconduction du dispositif au-delà.', s: 'Centre Inffo, rémunération des demandeurs d’emploi en formation (2026)' },
      { d: nextReval, t: 'Revalorisation possible des allocations et paramètres', x: 'Échéance habituelle de mise à jour des montants (1er janvier, 1er juillet). Montants du site vérifiés le ' + (ver || '—') + ' : contrôler les paramètres Unédic à cette date.', s: 'Rappel automatique du site', next: true },
      { d: null, t: 'Frontaliers : indemnisation par l’État d’emploi', x: 'Réforme européenne adoptée en juillet 2026. Date d’application non fixée : les règles actuelles (indemnisation par la France, État de résidence) restent en vigueur.', s: 'Sources spécialisées frontaliers (vérifiées 11/2026)', wait: true }
    ];
    return E.sort((a, b) => (a.d ? +a.d : 9e15) - (b.d ? +b.d : 9e15));
  }
  function echHtml() {
    const now = new Date(), list = events();
    const firstNext = list.find(e => e.d && e.d > now);
    return '<div class="max-w-5xl mx-auto"><div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><div class="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">⏱</div>Calendrier réglementaire</span><span class="text-[10px] font-mono text-cyan-400">Mis à jour avec le site</span></div>' +
      '<ul class="fe-tl">' + list.map(e => {
        const past = e.d && e.d <= now, nx = e === firstNext;
        return '<li class="' + (past ? 'fe-past' : nx ? 'fe-next' : '') + '"><div class="fe-d">' + (e.d ? fr(e.d) : 'Date à venir') + (past ? '<span class="fe-tag past">En vigueur</span>' : e.wait ? '<span class="fe-tag wait">En attente</span>' : nx ? '<span class="fe-tag next">Prochaine échéance</span>' : '') + '</div><div class="fe-t">' + esc(e.t) + '</div><div class="fe-x">' + esc(e.x) + '</div><div class="fe-s">' + esc(e.s) + '</div></li>';
      }).join('') + '</ul></div></div>';
  }
  const V = document.createElement('div');
  V.id = 'view-echeances'; V.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
  V.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>Échéances réglementaires</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-normal">Veille</span></h2></div></div></div><div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"><p class="max-w-5xl mx-auto text-xs text-slate-400">Ce qui vient de changer et ce qui va bouger : à garder en tête pour les dossiers en cours.</p><div id="fe-body"></div></div>';
  const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(V);
  NAV_TABS_CONFIG.push({ id: 'echeances', name: 'Échéances réglementaires', desc: 'Calendrier des changements récents et à venir', icon: 'calendar-clock', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', badge: 'Veille' });
  try { FT_KW.echeances = 'échéance calendrier veille réforme revalorisation date changement à venir'; } catch (e) {}
  const isRef = el => /référence|calcul/i.test((el && (el.dataset.lbOrig || el.textContent)) || '');
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c || c.querySelector('button[onclick="switchNavTab(\'echeances\')"]')) return r;
      const s = [...c.querySelectorAll(':scope > .menu-sec')].find(x => isRef(x.querySelector('.menu-sec-h'))); if (!s) return r;
      const model = [...s.querySelectorAll('button[onclick^="switchNavTab"]')].find(b => !/from-blue-900/.test(b.className)); if (!model) return r;
      const b = model.cloneNode(true); b.setAttribute('onclick', "switchNavTab('echeances')");
      const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
      if (lb) { lb.textContent = 'Échéances réglementaires'; delete lb.dataset.lbOrig; } if (d) d.textContent = 'Calendrier des changements récents et à venir';
      if (ic) { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ['viewBox', '0 0 24 24', 'fill', 'none', 'stroke', 'currentColor', 'stroke-width', '2', 'stroke-linecap', 'round', 'stroke-linejoin', 'round'].reduce((a, v, i, arr) => { if (i % 2 === 0) n.setAttribute(v, arr[i + 1]); return a; }, 0); n.setAttribute('class', ic.getAttribute('class') || ''); n.innerHTML = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'; ic.replaceWith(n); }
      b.querySelectorAll('.ft-pen-wrap,.ft-pen').forEach(x => x.remove());
      model.parentElement.appendChild(b);
      return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  function hubEch() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      if (!isRef(bar.querySelector('.hub-name')) || bar.querySelector('.hub-tab[data-t="echeances"]')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'hub-tab'; b.dataset.t = 'echeances'; b.setAttribute('onclick', "switchNavTab('echeances')"); b.textContent = 'Échéances réglementaires';
      bar.insertBefore(b, bar.querySelector(':scope > .hub-sub'));
    });
    if (!V.querySelector(':scope > .hub-bar')) { const src = [...document.querySelectorAll('.hub-bar')].find(x => isRef(x.querySelector('.hub-name')) && !x.closest('#view-echeances')); if (src) { const cl = src.cloneNode(true); const sub = cl.querySelector('.hub-sub'); if (sub) sub.remove(); V.insertBefore(cl, V.firstChild); } }
    const on = tab() === 'echeances';
    document.querySelectorAll('.hub-bar .hub-tab').forEach(b => { if (b.dataset.t === 'echeances') b.classList.toggle('is-on', on); else if (on && b.closest('#view-echeances')) b.classList.remove('is-on'); });
  }

  /* ================= 4. Parcours dossier : orientation vers les outils ================= */
  function orient() {
    const w = document.querySelector('#view-dossier .wiz-wrap'); if (!w || w.querySelector('.fo-card')) return;
    const c = document.createElement('section'); c.className = 'fo-card';
    const L = [['ati', 'Ancien travailleur indépendant', 'ATI'], ['aref', 'En formation ou en projet', 'AREF et RFF'], ['6', 'Trop-perçu notifié', 'Délais et recours', 'del'], ['invalidite', 'Pension d’invalidité', 'Cumul avec l’ARE'], ['8', 'Proche de la retraite', 'Maintien des droits'], ['casparts', 'Frontalier ou intermittent', 'Repères'], ['sanctions', 'Manquement constaté', 'Sanctions']];
    c.innerHTML = '<h3>Situation particulière ?</h3><p>Ouvrez directement l’outil adapté : le parcours reste disponible en dessous.</p><div class="fo-row">' + L.map(x => '<button type="button" data-t="' + x[0] + '"' + (x[3] ? ' data-m="' + x[3] + '"' : '') + '>' + esc(x[1]) + ' <b>→ ' + esc(x[2]) + '</b></button>').join('') + '</div>';
    c.addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; switchNavTab(/^\d+$/.test(b.dataset.t) ? +b.dataset.t : b.dataset.t); if (b.dataset.m && window.ftInduMode) setTimeout(() => window.ftInduMode(b.dataset.m), 60); });
    const head = w.querySelector(':scope > .reg-head'); w.insertBefore(c, head ? head.nextSibling : w.firstChild);
  }

  /* ================= 5. Enregistrer un mail de simulateur comme modèle CVM ================= */
  function tplButtons() {
    document.querySelectorAll('.ft-mail .ft-mail-btns').forEach(g => {
      if (g.querySelector('.ft-mail-tpl')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-mail-tpl'; b.textContent = 'En faire un modèle'; b.title = 'Enregistrer ce mail dans vos modèles CVM';
      g.insertBefore(b, g.querySelector('.ft-mail-copy'));
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ft-mail-tpl'); if (!b) return;
    const ta = b.closest('.ft-mail').querySelector('textarea'); const body = ta && ta.value.trim();
    if (!body) { toast('Complétez d’abord le simulateur : le mail est vide', 'info'); return; }
    const n = $('header-active-tab-name'); const tool = ((n && n.textContent) || 'Simulateur').split(' · ').pop().trim();
    const title = prompt('Titre du nouveau modèle :', tool + ' : réponse type'); if (title === null) return;
    const cat = 'Simulateurs';
    try {
      if (!categoryList.includes(cat)) categoryList.push(cat);
      const t = { id: 'custom-' + Date.now(), reference: '', reviewedAt: '', title: title.trim() || tool, shortTitle: title.trim() || tool, category: cat, body: body, variables: [], isOfficial: false };
      templates.push(t); saveState();
      try { if (typeof renderCategoryPills === 'function') renderCategoryPills(); } catch (er) {}
      switchNavTab('cvm'); selectCategory(cat); selectTemplate(t.id);
      toast('Modèle enregistré dans la catégorie « Simulateurs »', 'success');
    } catch (er) { toast('Impossible d’enregistrer le modèle', 'error'); }
  });

  /* ================= 6. Recherche dans le contenu des outils ================= */
  const VIEW = { od: 1, demission: 2, ans: 3, csp: 4, 'complement-are': 5, indus: 6, iccp: 7, retraite: 8, rci: 9 };
  const tabOf = id => { const k = id.replace(/^view-/, ''); return VIEW[k] != null ? VIEW[k] : k; };
  const SEL = '.rounded-xl, .inv-card, .reg-card, .bar-card, details';
  let IDX = null;
  function buildIndex() {
    IDX = [];
    document.querySelectorAll('[id^="view-"]').forEach(v => {
      if (/view-(home|cvm)$/.test(v.id)) return;
      const blocks = v.querySelectorAll(SEL);
      blocks.forEach((el, i) => {
        if (el.querySelector(SEL) && el.matches('.rounded-xl')) { /* garder les blocs feuilles et les cartes titrées */ }
        const h = el.querySelector('span.uppercase, h3, h4, summary, .fh-gh h3');
        const title = h ? h.textContent.replace(/\s+/g, ' ').trim().replace(/^[0-9✓€⏱✉]+\s*/, '') : '';
        const txt = el.textContent.replace(/\s+/g, ' ').trim();
        if (!title || txt.length < 40 || title.length > 90) return;
        IDX.push({ view: v.id, i: i, title: title, txt: txt.slice(0, 900) });
      });
    });
    (window.FT_FICHES || []).forEach(f => {
      const tmp = document.createElement('div'); try { tmp.innerHTML = f.html(); } catch (e) { return; }
      tmp.querySelectorAll('.rounded-xl').forEach((el, i) => {
        const h = el.querySelector('span.uppercase'); if (!h) return;
        const title = h.textContent.replace(/\s+/g, ' ').trim().replace(/^[0-9✓€⏱✉]+\s*/, ''), txt = el.textContent.replace(/\s+/g, ' ').trim();
        if (txt.length < 40) return;
        IDX.push({ fiche: f, i: i, title: title, txt: txt.slice(0, 900), name: f.name });
      });
    });
    return IDX;
  }
  function viewName(id) { const t = tabOf(id); try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(t)); return c ? c.name : ''; } catch (e) { return ''; } }
  window.ftGoContent = function (k) {
    const it = IDX && IDX[k]; if (!it) return;
    if (it.fiche) {
      switchNavTab(it.fiche.tab); setTimeout(() => window.ftFicheShow && window.ftFicheShow(it.fiche.tab, it.fiche.k), 60);
      setTimeout(() => { const host = it.fiche.box ? $(it.fiche.box) : $('view-' + it.fiche.tab); const el = host && host.querySelectorAll('.rounded-xl')[it.i]; if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('fr-flash'); void el.offsetWidth; el.classList.add('fr-flash'); } }, 420);
      return;
    }
    const t = tabOf(it.view); switchNavTab(t);
    setTimeout(() => { const v = $(it.view); const el = v && v.querySelectorAll(SEL)[it.i]; if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('fr-flash'); void el.offsetWidth; el.classList.add('fr-flash'); } }, 350);
  };
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  let added = false;
  function feedActions() {
    if (added) return; buildIndex(); added = true;
    IDX.forEach((it, k) => window.FT_ACTIONS.push({ t: 'Dans « ' + (it.name || viewName(it.view)) + ' » : ' + it.title.charAt(0) + it.title.slice(1).toLowerCase(), s: it.txt.slice(0, 110) + '…', kw: it.txt, when: () => { const q = $('pal-q'); return !!(q && q.value.trim().length >= 3); }, run: () => window.ftGoContent(k) }));
  }

  /* ================= 7. Statistiques d’équipe (administrateur) ================= */
  window.ftTeamStats = function () {
    let w = $('ft-stats'); if (!w) { w = document.createElement('div'); w.id = 'ft-stats'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
    w.innerHTML = '<div class="st-box"><h3>Statistiques d’équipe<button type="button" class="st-x" aria-label="Fermer">×</button></h3><p class="st-sub">Ouvertures cumulées de chaque outil par les conseillers connectés. Chiffres anonymes : aucun nom, aucune donnée d’allocataire.</p><div class="st-list">Chargement…</div></div>';
    w.classList.add('on'); w.onclick = e => { if (e.target === w || e.target.closest('.st-x')) w.classList.remove('on'); };
    const list = w.querySelector('.st-list');
    if (!window.__ftRpc) { list.textContent = 'Connectez-vous avec le compte administrateur.'; return; }
    window.__ftRpc('team_usage').then(rows => {
      rows = (rows || []).filter(r => r.tool && r.tool.indexOf('hub:') !== 0);
      if (!rows.length) { list.textContent = 'Pas encore de données.'; return; }
      const max = Math.max(...rows.map(r => +r.uses || 0)) || 1;
      list.innerHTML = '<div class="st-r st-h"><span>Outil</span><b>Ouvert.</b><b>Conseill.</b></div>' + rows.slice(0, 30).map(r => { const nm = (NAV_TABS_CONFIG.find(t => String(t.id) === String(r.tool)) || {}).name || r.tool; return '<div class="st-r"><span>' + esc(nm) + '<div class="st-bar" style="width:' + Math.max(4, Math.round((+r.uses || 0) / max * 100)) + '%"></div></span><b>' + (+r.uses || 0) + '</b><b>' + (+r.users || 0) + '</b></div>'; }).join('');
    }).catch(e => { const m = String(e && (e.message || e.code) || ''); list.textContent = /team_usage|PGRST202|42883|404/.test(m) ? 'Fonction non encore installée : ajoutez la fonction team_usage dans Supabase (voir supabase/schema.sql).' : 'Chargement impossible : ' + m; });
  };
  window.FT_ACTIONS.push(
    { t: 'Statistiques d’équipe', s: 'Outils les plus utilisés par les conseillers (administrateur)', kw: 'statistiques usage équipe outils utilisés', when: () => !!(window.__ftIsAdmin && window.__ftIsAdmin()), run: () => window.ftTeamStats() },
    { t: 'Échéances réglementaires', s: 'Calendrier des changements récents et à venir', kw: 'échéances calendrier veille', run: () => switchNavTab('echeances') }
  );

  /* ================= 1. Un seul observateur pour les ajouts récents ================= */
  function all() {
    try { hubEch(); } catch (e) {}
    const t = tab();
    V.classList.toggle('hidden', t !== 'echeances');
    if (t === 'echeances') { const b = $('fe-body'); if (b && !b.dataset.ok) { b.innerHTML = echHtml(); b.dataset.ok = '1'; } const n = $('header-active-tab-name'); if (n) n.textContent = 'Références et calculs · Échéances réglementaires'; }
    if (t === 'dossier') orient();
    tplButtons();
    document.querySelectorAll('.fr-view .rounded-xl.border.from-slate-900').forEach(x => x.classList.add('fr-nd'));
  }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(all, 40); return r; };
  let mt = null;
  window.ftOnDom(all);
  const go = () => { setTimeout(all, 400); (window.requestIdleCallback || (f => setTimeout(f, 2500)))(() => { try { feedActions(); } catch (e) {} }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
