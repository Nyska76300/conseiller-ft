(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const eur = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const SRC = {
    sp: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F14944',
    ft: 'https://www.francetravail.fr/faq/candidat/mes-allocations---mes-aides/lallocation-chomage-en-fonction/cumul-pension-invalidite-et-allo.html',
    css: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006073189/LEGISCTA000006156110/'
  };

  /* Calcul pur, testé par les cas de contrôle */
  window.ftInvCompute = function (p) {
    const aj = +p.aj || 0, pension = +p.pension || 0, cat = String(p.cat || '1'), cumulee = p.cumulee === true || p.cumulee === 'oui';
    const areM = Math.round(aj * 30 * 100) / 100; /* mensualisation : 30 jours */
    const integral = cat === '1' || cumulee;
    const deduction = integral ? 0 : Math.min(areM, pension);
    const verse = Math.max(0, Math.round((areM - deduction) * 100) / 100);
    return { aj: aj, pension: pension, cat: cat, cumulee: cumulee, areM: areM, integral: integral, deduction: deduction, verse: verse, total: verse + pension };
  };

  /* Présentation identique aux autres simulateurs (cartes numérotées, verdict, chiffres clés) */
  const sec = (n, title, body, ref) => '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3 inv-old"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><div class="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">' + n + '</div>' + title + '</span></div><div class="text-xs text-slate-300 leading-relaxed">' + body + '</div>' + (ref ? '<p class="text-[10px] text-slate-400 leading-relaxed">' + ref + '</p>' : '') + '</div>';
  const IN = 'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-medium';
  const field = (label, ctl, id) => '<div' + (id ? ' id="' + id + '"' : '') + '><label class="block text-[11px] font-medium text-slate-300 mb-1">' + label + '</label>' + ctl + '</div>';

  function tabRegles() {
    return '<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5"><div class="lg:col-span-6 space-y-4">' +
      sec('1', 'Conditions d’attribution',
        '<ul><li><strong>Incapacité :</strong> maladie ou accident d’origine <strong>non professionnelle</strong> réduisant d’au moins <strong>2/3</strong> la capacité de travail ou de gain (l’assuré ne peut pas gagner plus d’un tiers de la rémunération normale de sa catégorie dans sa région).</li>' +
        '<li><strong>Âge :</strong> ne pas avoir atteint l’âge légal de départ à la retraite. À cet âge, la pension est remplacée par la retraite pour inaptitude si l’assuré ne travaille plus.</li>' +
        '<li><strong>Affiliation :</strong> être immatriculé à la Sécurité sociale depuis au moins <strong>12 mois</strong> au 1er jour du mois de l’arrêt de travail ou de la constatation de l’invalidité.</li>' +
        '<li><strong>Activité :</strong> au cours des 12 mois précédant l’arrêt ou la constatation, avoir travaillé au moins <strong>' + BAREME.invalidite.heures + ' heures</strong> ou cotisé sur une rémunération d’au moins <strong>' + BAREME.invalidite.smicFois.toLocaleString('fr-FR') + ' fois le Smic horaire</strong>.</li>' +
        '<li>La décision et la catégorie sont fixées par le <strong>médecin-conseil de l’Assurance maladie</strong> (CPAM).</li></ul>',
        'Code de la Sécurité sociale, art. L. 341-1 et suivants · <a href="' + SRC.sp + '" target="_blank" rel="noopener noreferrer">service-public.gouv.fr</a> (vérifié le 01/04/2026)') +
      '</div><div class="lg:col-span-6 space-y-4">' +
      sec('2', 'Les 3 catégories et les montants',
        '<div class="inv-scroll"><table class="inv-table"><thead><tr><th>Catégorie</th><th>Situation</th><th>Montant</th><th>Mensuel min.</th><th>Mensuel max.</th></tr></thead><tbody>' +
        '<tr><td><b>1re</b></td><td>Capable d’exercer une activité rémunérée</td><td>30 % du SAM</td><td>' + eur(BAREME.invalidite.min) + '</td><td>' + eur(BAREME.invalidite.max1) + '</td></tr>' +
        '<tr><td><b>2e</b></td><td>Absolument incapable d’exercer une profession quelconque</td><td>50 % du SAM</td><td>' + eur(BAREME.invalidite.min) + '</td><td>' + eur(BAREME.invalidite.max2) + '</td></tr>' +
        '<tr><td><b>3e</b></td><td>Comme la 2e, avec besoin d’une tierce personne pour les actes ordinaires de la vie</td><td>50 % du SAM + majoration tierce personne</td><td>' + eur(BAREME.invalidite.min3) + '</td><td>' + eur(BAREME.invalidite.max3) + '</td></tr>' +
        '</tbody></table></div>' +
        '<p style="margin-top:10px">SAM : salaire annuel moyen des <strong>10 meilleures années</strong>, plafonné au plafond annuel de la Sécurité sociale. Montants bruts, revalorisés chaque 1er avril.</p>',
        'Code de la Sécurité sociale, art. L. 341-4 (catégories) · <a href="' + SRC.sp + '" target="_blank" rel="noopener noreferrer">service-public.gouv.fr</a>, montants affichés au 01/04/2026') +
      sec('3', 'Cumul avec l’ARE',
        '<div class="inv-scroll"><table class="inv-table"><thead><tr><th>Catégorie</th><th>Situation</th><th>Effet sur l’ARE</th></tr></thead><tbody>' +
        '<tr><td><b>1re</b></td><td>Toujours</td><td><span class="inv-pill inv-ok">Cumul intégral</span></td></tr>' +
        '<tr><td><b>2e ou 3e</b></td><td>La pension était déjà cumulée avec les revenus de l’activité ayant servi à ouvrir le droit (y compris en activité partielle)</td><td><span class="inv-pill inv-ok">Cumul intégral</span></td></tr>' +
        '<tr><td><b>2e ou 3e</b></td><td>La pension n’a <strong>jamais</strong> été cumulée avec ces revenus</td><td><span class="inv-pill inv-ko">Pension déduite en totalité</span> de l’ARE</td></tr>' +
        '</tbody></table></div>' +
        '<ul style="margin-top:10px"><li>En cas de déduction, si la pension est supérieure ou égale à l’ARE, aucune allocation n’est versée.</li>' +
        '<li>À demander : la <strong>notification de la CPAM</strong> (catégorie, montant, date d’effet) et, pour un cumul intégral, les justificatifs montrant que la pension était perçue pendant l’activité.</li>' +
        '<li>Tout changement de catégorie, de montant ou une suspension de la pension doit être signalé : il modifie le montant de l’ARE.</li></ul>',
        'Règlement d’assurance chômage, art. 18 § 2 · <a href="' + SRC.ft + '" target="_blank" rel="noopener noreferrer">francetravail.fr</a> · Unédic, fiche ARE (2025)') +
      '</div></div>';
  }

  function tabSim() {
    return '<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5"><div class="lg:col-span-6 space-y-4">' +
      sec('1', 'Allocation et pension', '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">' +
        field('Allocation journalière brute (AJ)', '<input id="inv-aj" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ex. 45,20" class="' + IN + '">') +
        field('Pension d’invalidité mensuelle nette', '<input id="inv-pension" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ex. 650" class="' + IN + '">') + '</div>') +
      sec('2', 'Catégorie et cumul antérieur', '<div class="grid grid-cols-1 gap-3 text-xs">' +
        field('Catégorie d’invalidité', '<select id="inv-cat" class="' + IN + '"><option value="1">1re catégorie</option><option value="2" selected>2e catégorie</option><option value="3">3e catégorie</option></select>') +
        field('La pension était-elle déjà perçue pendant l’emploi qui a ouvert le droit ?', '<select id="inv-cum" class="' + IN + '"><option value="non">Non, jamais cumulée avec ces salaires</option><option value="oui">Oui, cumulée avec ces salaires</option></select>', 'inv-cum-l') + '</div>') +
      '</div><div class="lg:col-span-6 space-y-4"><div id="inv-res" class="space-y-4"></div><div id="inv-mail-host"></div></div></div>';
  }
  function run() {
    const res = $('inv-res'); if (!res) return;
    const cat = ($('inv-cat') || {}).value || '2';
    const cl = $('inv-cum-l'); if (cl) cl.style.display = cat === '1' ? 'none' : '';
    const r = ftInvCompute({ aj: ($('inv-aj') || {}).value, pension: ($('inv-pension') || {}).value, cat: cat, cumulee: ($('inv-cum') || {}).value });
    const st = !r.areM ? 'nd' : r.integral ? 'ok' : r.verse > 0 ? 'wa' : 'ko';
    const VC = { ok: ['from-emerald-950/40 border-emerald-500/40', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', 'text-emerald-300'], wa: ['from-amber-950/40 border-amber-500/40', 'bg-amber-500/20 text-amber-300 border border-amber-500/30', 'text-amber-300'], ko: ['from-rose-950/40 border-rose-500/40', 'bg-rose-500/20 text-rose-300 border border-rose-500/30', 'text-rose-300'], nd: ['from-slate-900 border-slate-800 fr-nd', 'bg-slate-800 text-slate-300 border border-slate-700', 'text-white'] };
    const pill = { ok: 'Cumul intégral', wa: 'Pension déduite', ko: 'Aucune ARE versée', nd: 'En attente' }[st];
    const title = { ok: 'ARE ET PENSION SE CUMULENT INTÉGRALEMENT', wa: 'LA PENSION EST DÉDUITE DE L’ARE', ko: 'PENSION SUPÉRIEURE OU ÉGALE À L’ARE : AUCUNE ALLOCATION', nd: 'SAISISSEZ L’ALLOCATION JOURNALIÈRE' }[st];
    const desc = { ok: r.cat === '1' ? 'Pension de 1re catégorie : cumul intégral avec l’ARE.' : 'La pension était déjà cumulée avec les revenus de l’activité qui a ouvert le droit.', wa: 'Pension de ' + r.cat + 'e catégorie jamais cumulée avec ces revenus : déduite en totalité de l’ARE.', ko: 'La pension est au moins égale à l’ARE du mois : rien n’est versé au titre de l’ARE.', nd: 'Le calcul s’affiche dès la saisie.' }[st];
    const row = (l, v, c) => '<div class="flex items-center justify-between gap-3 text-slate-300 text-[11px]"><span>' + l + '</span><span class="font-mono font-bold text-right ' + (c || 'text-white') + '">' + v + '</span></div>';
    const tile = (l, v, sub, c) => '<div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800"><span class="block text-[10px] text-slate-400 uppercase font-semibold">' + l + '</span><span class="text-lg font-black ' + (c || 'text-white') + '">' + v + '</span><span class="block text-[9px] text-cyan-400 font-mono mt-0.5">' + sub + '</span></div>';
    res.innerHTML = '<div class="rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br via-slate-900 to-slate-950 ' + VC[st][0] + '"><div class="flex items-center justify-between"><span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ' + VC[st][1] + '">' + pill + '</span><span class="text-xs text-slate-400 font-mono">RAC art. 18 § 2</span></div><h4 class="text-base font-extrabold leading-tight ' + VC[st][2] + '">' + title + '</h4><p class="text-xs text-slate-300 leading-relaxed">' + desc + '</p></div>' +
      sec('€', 'Montants du mois', '<div class="grid grid-cols-2 gap-2 text-center">' + tile('ARE versée', eur(r.verse), 'Sur 30 jours', 'text-cyan-300') + tile('Total ARE + pension', eur(r.total), 'Ressources du mois', 'text-emerald-400') + '</div>' +
        '<div class="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs mt-3">' + row('ARE du mois (AJ × 30 jours)', eur(r.areM)) + row('Déduction de la pension', r.integral ? 'aucune' : '− ' + eur(r.deduction), r.integral ? 'text-emerald-400' : 'text-amber-300') + row('Pension d’invalidité nette', eur(r.pension)) + '</div>',
        'Calcul indicatif sur 30 jours (mensualisation), avant retenues sociales sur l’ARE. Vérifiez le montant et la catégorie sur la notification de la CPAM.');
  }

  const TABS = [['sim', 'Cumul avec l’ARE : calcul', tabSim], ['regles', 'Règles et conditions', tabRegles]];
  let cur = 'sim';
  const v = document.createElement('div');
  v.id = 'view-invalidite'; v.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950';
  v.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>Pension d’invalidité</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-normal">CPAM · art. L. 341-1</span></h2></div></div><div class="flex items-center gap-2"><div class="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800" id="inv-tabs" role="tablist"></div></div></div><div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"><p class="max-w-7xl mx-auto text-xs text-slate-400">Conditions d’attribution, catégories et montants, règles de cumul avec l’ARE.</p><div id="inv-body"></div></div>';
  const anchorView = $('view-delais'); if (anchorView) anchorView.parentElement.appendChild(v);
  window.invTab = function (id) {
    cur = id;
    const ON = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm', OFF = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all';
    $('inv-tabs').innerHTML = TABS.map(t => '<button type="button" role="tab" class="' + (t[0] === cur ? ON : OFF) + '" aria-selected="' + (t[0] === cur) + '" onclick="invTab(\'' + t[0] + '\')">' + t[1] + '</button>').join('');
    $('inv-body').innerHTML = TABS.find(x => x[0] === id)[2]();
    if (id === 'sim') { ['inv-aj', 'inv-pension', 'inv-cat', 'inv-cum'].forEach(k => { const e = $(k); if (e) { e.addEventListener('input', run); e.addEventListener('change', run); } }); run(); }
  };

  NAV_TABS_CONFIG.push({ id: 'invalidite', name: 'Pension d’invalidité', desc: 'Conditions, catégories, montants et cumul avec l’ARE', icon: 'accessibility', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', badge: 'CPAM' });
  try { FT_KW.invalidite = 'pension invalidité invalide catégorie 1 2 3 cpam tierce personne mtp cumul are déduction incapacité deux tiers'; } catch (e) {}
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    const r = _sw.apply(this, arguments);
    const on = String(t) === 'invalidite';
    v.classList.toggle('hidden', !on);
    if (on) { const n = $('header-active-tab-name'); if (n) n.textContent = 'Pension d’invalidité'; invTab(cur); }
    return r;
  };

  /* Menu : dans la rubrique « Ouverture de droits » */
  const isOuv = el => /ouverture/i.test((el && (el.dataset.lbOrig || el.textContent)) || '');
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c || c.querySelector("button[onclick=\"switchNavTab('invalidite')\"]")) return r;
      const sec = [...c.querySelectorAll(':scope > .menu-sec')].find(x => isOuv(x.querySelector('.menu-sec-h')));
      const list = sec && (sec.querySelector('.space-y-1\\.5') || sec.querySelector('.menu-sec-h + div')); if (!list) return r;
      const on = String(activeNavTab) === 'invalidite';
      const t = document.createElement('div');
      t.innerHTML = '<button onclick="switchNavTab(\'invalidite\')" class="w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all group ' + (on ? 'bg-gradient-to-r from-blue-900/60 to-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700/80') + '"><div class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ' + (on ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30') + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg></div><div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><span class="text-xs font-bold ' + (on ? 'text-white' : 'text-slate-200') + '">Pension d’invalidité</span></div><p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Conditions, catégories, montants et cumul avec l’ARE</p></div></button>';
      list.appendChild(t.firstChild);
      return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  /* Onglet dans la barre de la rubrique « Ouverture de droits » */
  function hubTabs() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      if (!isOuv(bar.querySelector('.hub-name'))) return;
      if (!bar.querySelector('.hub-tab[data-t="invalidite"]')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'hub-tab'; b.dataset.t = 'invalidite';
        b.setAttribute('onclick', "switchNavTab('invalidite')"); b.textContent = 'Pension d’invalidité';
        bar.insertBefore(b, bar.querySelector(':scope > .hub-sub'));
      }
    });
    if (!v.querySelector(':scope > .hub-bar')) {
      const src = [...document.querySelectorAll('.hub-bar')].find(x => isOuv(x.querySelector('.hub-name')));
      if (src) { const cl = src.cloneNode(true); const sub = cl.querySelector('.hub-sub'); if (sub) sub.remove(); v.insertBefore(cl, v.firstChild); }
    }
    const on = String(activeNavTab) === 'invalidite';
    document.querySelectorAll('.hub-bar .hub-tab').forEach(t => {
      if (t.dataset.t === 'invalidite') { t.classList.toggle('is-on', on); if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); }
      else if (on && t.closest('#view-invalidite')) { t.classList.remove('is-on'); t.removeAttribute('aria-current'); }
    });
  }
  try { hubTabs(); } catch (e) {}
  const _sw2 = switchNavTab;
  switchNavTab = function () {
    const r = _sw2.apply(this, arguments);
    try { hubTabs(); } catch (e) {}
    if (String(activeNavTab) === 'invalidite') { const n = $('header-active-tab-name'); if (n) n.textContent = 'Ouverture de droits · Pension d’invalidité'; }
    try { if (window.ftApplyLabels) window.ftApplyLabels(); } catch (e) {}
    return r;
  };

  /* Sources et cas de contrôle */
  try {
    (window.FT_SOURCES || []).push(
      ['Invalidité', 'Conditions et catégories', 'Incapacité d’au moins 2/3, 12 mois d’immatriculation, 600 h ou 2 030 × Smic horaire ; catégories 1 (30 %), 2 (50 %), 3 (50 % + tierce personne) ; montants au 01/04/2026', 'service-public.gouv.fr (vérifié le 01/04/2026)', 'Vérifié'],
      ['Démission', 'Départ volontaire d’un emploi repris en cours de droits', 'Indemnisation maintenue si l’emploi quitté n’a pas dépassé 88 jours ou 610 heures (4 mois), depuis le 01/04/2025 ; 65 jours ou 455 heures pour neutraliser une démission avant ouverture de droits', 'Unédic (convention du 15/11/2024)', 'Vérifié'],
      ['Invalidité', 'Cumul avec l’ARE', '1re catégorie : cumul intégral ; 2e et 3e : cumul intégral si la pension était cumulée avec les revenus de l’activité, sinon déduite en totalité', 'francetravail.fr et Unédic (règlement, art. 18 § 2)', 'Vérifié']);
  } catch (e) {}
  try {
    FT_CASES.push(
      { n: 'Invalidité : 2e catégorie non cumulée, AJ 40 €, pension 600 € → 600 €', run: () => ftInvCompute({ aj: 40, pension: 600, cat: '2', cumulee: 'non' }).verse, exp: 600, d: 2 },
      { n: 'Invalidité : 2e catégorie déjà cumulée → ARE intégrale (1 200 €)', run: () => ftInvCompute({ aj: 40, pension: 600, cat: '2', cumulee: 'oui' }).verse, exp: 1200, d: 2 },
      { n: 'Invalidité : 1re catégorie → cumul intégral', run: () => ftInvCompute({ aj: 40, pension: 600, cat: '1', cumulee: 'non' }).verse, exp: 1200, d: 2 },
      { n: 'Invalidité : pension supérieure à l’ARE → 0 €', run: () => ftInvCompute({ aj: 30, pension: 1000, cat: '3', cumulee: 'non' }).verse, exp: 0, d: 2 });
  } catch (e) {}
  window.FT_ACTIONS = window.FT_ACTIONS || [];
})();
