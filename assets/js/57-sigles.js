(function () {
  /* Sigles expliqués : dans l’outil affiché, chaque sigle du glossaire (SJR, PJI, ICCP…) est souligné en pointillé ;
     un survol ou un toucher affiche sa définition. Les champs et les mails générés ne sont pas modifiés. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EXTRA = [
    ['PJI', 'Premier jour indemnisé', 'Premier jour pour lequel l’allocation est versée, après les différés et le délai d’attente.'],
    ['ICCP', 'Indemnité compensatrice de congés payés', 'Congés payés non pris, payés à la fin du contrat ; ils créent un différé d’indemnisation.'],
    ['FCT', 'Fin de contrat de travail', 'Date de fin du dernier contrat, point de départ des différés.'],
    ['AEM', 'Attestation employeur', 'Document de fin de contrat transmis par l’employeur à France Travail.'],
    ['ATI', 'Allocation des travailleurs indépendants', 'Allocation forfaitaire pour les anciens indépendants dont l’activité a cessé.'],
    ['ATA', 'Allocation temporaire d’attente', 'Allocation de solidarité pour certains publics (réfugiés, anciens détenus…).'],
    ['ASS', 'Allocation de solidarité spécifique', 'Allocation de solidarité versée en fin de droits ARE, sous conditions d’activité et de ressources.'],
    ['AREF', 'Allocation d’aide au retour à l’emploi formation', 'L’ARE versée pendant une formation validée.'],
    ['RFF', 'Rémunération de fin de formation', 'Rémunération possible quand les droits ARE s’épuisent pendant une formation.'],
    ['RCI', 'Rupture conventionnelle individuelle', 'Fin du contrat d’un commun accord entre l’employeur et le salarié.'],
    ['CNS', 'Cumul avec une activité non salariée', 'Cumul de l’ARE avec des revenus d’indépendant ou de micro-entrepreneur.'],
    ['IPR', 'Instance paritaire régionale', 'Instance qui examine notamment les démissions et les demandes d’effacement de dette.'],
    ['DPAE', 'Déclaration préalable à l’embauche', 'Déclaration de l’employeur avant l’embauche d’un salarié.'],
    ['CRE', 'Contrat d’engagement', 'Engagements du demandeur d’emploi, dont la recherche active d’emploi.'],
    ['SAE', 'Service d’accompagnement à l’emploi', 'Outil ou parcours de gestion de l’indemnisation selon le contexte de l’agence.']
  ];
  let MAP = null, RX = null;
  function dict() {
    if (MAP) return MAP;
    MAP = {};
    EXTRA.concat(window.FT_GLOSS || []).forEach(g => { if (g && g[0] && /^[A-Z]{2,6}$/.test(g[0])) MAP[g[0]] = { l: g[1], d: g[2] || '' }; });
    const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
    RX = new RegExp('(^|[^A-Za-zÀ-ÿ0-9])(' + keys.join('|') + ')(?![A-Za-zÀ-ÿ0-9])', 'g');
    return MAP;
  }
  const SKIP = 'script,style,textarea,input,select,option,button,a,abbr,code,pre,.ft-mail,.ft-sg-pop,[contenteditable],h1,svg,.hub-bar,label,.var-highlight';
  function mark(root) {
    if (!root || root.dataset.sgDone === '1') return;
    dict(); if (!RX) return;
    const seen = new Set(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (!n.nodeValue || n.nodeValue.length < 2 || !/[A-Z]{2}/.test(n.nodeValue) || (n.parentElement && n.parentElement.closest(SKIP))) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; let n; while ((n = walker.nextNode()) && nodes.length < 4000) nodes.push(n);
    nodes.forEach(t => {
      const v = t.nodeValue; RX.lastIndex = 0; let m, last = 0, frag = null;
      while ((m = RX.exec(v))) {
        const k = m[2]; if (seen.has(k)) continue; seen.add(k);
        frag = frag || document.createDocumentFragment();
        const i = m.index + m[1].length;
        frag.appendChild(document.createTextNode(v.slice(last, i)));
        const ab = document.createElement('abbr'); ab.className = 'ft-sg'; ab.textContent = k; ab.dataset.k = k; ab.tabIndex = 0; ab.setAttribute('aria-label', k + ' : ' + MAP[k].l);
        frag.appendChild(ab); last = i + k.length;
      }
      if (frag) { frag.appendChild(document.createTextNode(v.slice(last))); t.parentNode.replaceChild(frag, t); }
    });
    root.dataset.sgDone = '1';
  }
  function run() {
    const v = document.querySelector('[id^="view-"]:not(.hidden):not(.ft-split-b)'); if (!v || /view-(cvm|admin)/.test(v.id)) return;
    if (v.dataset.sgDone === '1' && v.querySelector('abbr.ft-sg')) return;
    v.dataset.sgDone = ''; mark(v);
  }
  let t = null; const later = () => { clearTimeout(t); t = setTimeout(run, 700); };
  if (typeof switchNavTab === 'function') { const _sw = switchNavTab; switchNavTab = function () { const r = _sw.apply(this, arguments); later(); return r; }; }
  setTimeout(run, 2000);

  /* Bulle de définition */
  let pop = null, cur = null;
  function show(ab) {
    const g = dict()[ab.dataset.k]; if (!g) return;
    if (!pop) { pop = document.createElement('div'); pop.className = 'ft-sg-pop'; pop.setAttribute('role', 'tooltip'); pop.id = 'ft-sg-pop'; document.body.appendChild(pop); }
    pop.innerHTML = '<b>' + esc(ab.dataset.k) + '</b> · ' + esc(g.l) + (g.d ? '<p>' + esc(g.d) + '</p>' : '');
    pop.hidden = false; cur = ab; ab.setAttribute('aria-describedby', 'ft-sg-pop');
    const r = ab.getBoundingClientRect(), w = Math.min(300, innerWidth - 16);
    pop.style.width = w + 'px';
    const left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    pop.style.left = left + 'px';
    const below = r.bottom + 8, h = pop.offsetHeight;
    pop.style.top = (below + h > innerHeight - 70 ? Math.max(8, r.top - h - 8) : below) + 'px';
  }
  function hide() { if (pop) pop.hidden = true; if (cur) cur.removeAttribute('aria-describedby'); cur = null; }
  document.addEventListener('mouseover', e => { const a = e.target.closest && e.target.closest('abbr.ft-sg'); if (a) show(a); else if (cur && !(e.target.closest && e.target.closest('.ft-sg-pop'))) hide(); });
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('abbr.ft-sg'); if (a) { e.stopPropagation(); if (cur === a && pop && !pop.hidden) hide(); else show(a); } else if (cur) hide(); }, true);
  document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('abbr.ft-sg')) show(e.target); });
  document.addEventListener('focusout', e => { if (e.target.matches && e.target.matches('abbr.ft-sg')) hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  document.addEventListener('scroll', hide, true);
  window.ftSigles = { run, dict };
})();
