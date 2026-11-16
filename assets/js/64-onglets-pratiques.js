(function () {
  /* Quatre onglets pratiques : Pièces justificatives, Calendrier des versements, Journal réglementaire, Pense-bête d’entretien.
     Rien de ce qui est saisi ici n’est enregistré (ni dans le navigateur, ni dans le compte). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const toast = (m, t) => { try { showToast(m, t || 'success'); } catch (e) {} };
  const B = () => { try { return BAREME; } catch (e) { return null; } };
  const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch (e) {} };
  function copy(txt) {
    const ok = () => toast('Copié dans le presse-papiers');
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(ok).catch(() => fb());
    fb();
    function fb() { const t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) {} t.remove(); }
  }
  const TABS = {};

  /* ---------- Enregistrement d’un onglet (même principe que le comparateur) ---------- */
  function addTab(o) {
    const V = document.createElement('div');
    V.id = 'view-' + o.id; V.className = 'hidden flex-1 overflow-y-auto op-view';
    V.innerHTML = '<div class="reg-wrap"><div class="reg-head"><div><h2>' + esc(o.name) + '</h2><p>' + esc(o.purpose) + '</p></div><div class="reg-actions">' + (o.actions || '') + '</div></div><div class="op-body"></div></div>';
    const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(V);
    try { NAV_TABS_CONFIG.push({ id: o.id, name: o.name, desc: o.desc, icon: o.icon, color: o.color, badge: 'Nouveau' }); } catch (e) {}
    try { FT_KW[o.id] = o.kw; } catch (e) {}
    o.V = V; o.body = V.querySelector('.op-body'); TABS[o.id] = o;
    if (typeof renderBurgerTabs === 'function') {
      const _rb = renderBurgerTabs;
      renderBurgerTabs = function () {
        const r = _rb.apply(this, arguments);
        const c = $('burger-tabs-list'); if (!c || c.querySelector('button[onclick="switchNavTab(\'' + o.id + '\')"]')) return r;
        let model = null; for (const m of o.after) { model = c.querySelector('button[onclick="switchNavTab(\'' + m + '\')"]'); if (model) break; }
        if (!model) return r;
        const b = model.cloneNode(true); b.setAttribute('onclick', "switchNavTab('" + o.id + "')");
        if (tab() !== o.id) b.className = model.className.replace(/bg-gradient[^ ]*|from-[^ ]*|to-[^ ]*|border-cyan[^ ]*|shadow[^ ]*/g, '');
        const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
        if (lb) { lb.textContent = o.name; delete lb.dataset.lbOrig; } if (d) d.textContent = o.desc;
        if (ic) { const i = document.createElement('i'); i.setAttribute('data-lucide', o.icon); i.setAttribute('class', ic.getAttribute('class') || 'w-4 h-4'); ic.replaceWith(i); }
        b.querySelectorAll('.ft-pen-wrap,.ft-pen,.ft-star').forEach(x => x.remove());
        model.parentNode.insertBefore(b, model.nextSibling); setTimeout(icons, 0); return r;
      };
    }
    window.FT_ACTIONS = window.FT_ACTIONS || [];
    window.FT_ACTIONS.push({ t: o.name, s: o.desc, kw: o.kw, run: () => switchNavTab(o.id) });
  }
  function render() {
    const t = tab();
    Object.keys(TABS).forEach(id => {
      const o = TABS[id], on = t === id;
      if (!on) { if (!o.V.classList.contains('ft-split-b')) o.V.classList.add('hidden'); return; }
      o.V.classList.remove('hidden');
      const n = $('header-active-tab-name'); if (n) n.textContent = o.group + ' · ' + o.name;
      if (!o.done) { o.done = 1; o.init(o); icons(); } else if (o.refresh) o.refresh(o);
    });
  }

  /* =================== 1. Pièces justificatives =================== */
  const PJ = [
    ['ouverture', 'Ouverture de droits', ['Pièce d’identité en cours de validité (ou titre de séjour autorisant à travailler)', 'RIB à votre nom', 'Attestation(s) employeur des contrats terminés, si l’employeur ne l’a pas transmise', 'Carte Vitale ou attestation de droits à l’Assurance maladie', 'Derniers bulletins de salaire']],
    ['licenciement', 'Licenciement', ['Lettre de licenciement', 'Certificat de travail', 'Reçu pour solde de tout compte']],
    ['cdd', 'Fin de CDD ou de mission', ['Contrat de travail à durée déterminée ou contrat de mission', 'Certificat de travail', 'Reçu pour solde de tout compte']],
    ['rci', 'Rupture conventionnelle', ['Convention de rupture signée par les deux parties', 'Décision d’homologation de la DREETS, ou courrier de l’employeur confirmant l’homologation tacite']],
    ['demleg', 'Démission légitime', ['Lettre de démission', 'Justificatif du motif légitime (par exemple : attestation d’emploi du conjoint, justificatif du nouveau domicile, acte de mariage ou de PACS)']],
    ['demprojet', 'Démission pour projet', ['Lettre de démission', 'Attestation du caractère réel et sérieux du projet délivrée par Transitions Pro (CPIR)']],
    ['reexamen', 'Réexamen après démission (121 jours)', ['Justificatifs de recherche d’emploi depuis la démission (candidatures, réponses, entretiens)', 'Justificatifs des formations ou missions éventuelles sur la période']],
    ['reprise', 'Reprise d’emploi et cumul', ['Contrat de travail de l’emploi repris', 'Bulletins de salaire des mois déclarés']],
    ['creation', 'Création d’entreprise (ARCE)', ['Extrait Kbis, extrait d’immatriculation au répertoire des métiers ou avis de situation SIRENE', 'Attestation d’admission à l’ACRE (délivrée par l’Urssaf)', 'Justificatif de la date de début d’activité']],
    ['formation', 'Formation (AREF ou RFF)', ['Devis ou attestation d’inscription en formation', 'Attestations de présence ou d’assiduité']],
    ['ass', 'Demande d’ASS', ['Formulaire de demande d’ASS complété et signé', 'Dernier avis d’imposition du foyer', 'Justificatifs de 5 ans d’activité salariée dans les 10 ans avant la fin du contrat (certificats de travail, bulletins, relevé de carrière)']],
    ['invalidite', 'Pension d’invalidité', ['Notification d’attribution de la pension (catégorie et montant)', 'Dernier relevé de versement de la pension']],
    ['ati', 'Travailleur indépendant (ATI)', ['Jugement d’ouverture de liquidation judiciaire ou de redressement judiciaire', 'Justificatif des revenus d’activité non salariée (avis d’imposition ou attestation comptable)']],
    ['frontalier', 'Emploi à l’étranger ou frontalier', ['Formulaire U1 attestant des périodes d’emploi à l’étranger', 'Contrats de travail et bulletins de salaire de l’emploi à l’étranger']],
    ['intermittent', 'Intermittent du spectacle', ['Attestations employeur mensuelles (AEM) des contrats', 'Bulletins de salaire (heures ou cachets)']],
    ['maladie', 'Arrêt maladie', ['Arrêt de travail', 'Attestation de paiement des indemnités journalières (CPAM)']],
    ['tp', 'Trop-perçu : remise ou échéancier', ['Courrier de contestation ou de demande de remise précisant les motifs', 'Justificatifs des ressources et des charges du foyer']],
    ['adresse', 'Changement d’adresse ou de RIB', ['Justificatif de domicile de moins de 3 mois', 'Nouveau RIB à votre nom']]
  ];
  let pjSel = new Set(['ouverture']), pjOff = new Set(), pjExtra = '';
  function pjInit(o) {
    o.body.innerHTML = '<div class="op-grid"><section class="op-card"><h3 class="op-h">Situations</h3><p class="op-sub">Cochez une ou plusieurs situations : la liste des pièces se compose toute seule.</p><div class="op-chips" id="pj-sit"></div></section>' +
      '<section class="op-card"><h3 class="op-h">Pièces à demander</h3><div id="pj-list" class="op-checks"></div><label class="op-f"><span>Autre pièce (facultatif)</span><input id="pj-extra" type="text" placeholder="ex. attestation de la CAF"></label>' +
      '<label class="op-f"><span>À transmettre avant le (facultatif)</span><input id="pj-date" type="date"></label></section></div>' +
      '<section class="op-card"><div class="op-h-row"><h3 class="op-h">Mail de demande</h3><div class="op-btns"><button type="button" class="reg-btn" id="pj-print"><i data-lucide="printer" class="w-4 h-4"></i>Imprimer / PDF</button><button type="button" class="reg-btn reg-btn-primary" id="pj-copy"><i data-lucide="copy" class="w-4 h-4"></i>Copier le mail</button></div></div><textarea id="pj-mail" class="op-ta" rows="12" spellcheck="true"></textarea><p class="op-note">Rien n’est enregistré : le mail se recompose à chaque changement.</p></section>';
    $('pj-sit').innerHTML = PJ.map(s => '<button type="button" class="op-chip" data-s="' + s[0] + '" aria-pressed="false">' + esc(s[1]) + '</button>').join('');
    o.body.addEventListener('click', e => {
      const c = e.target.closest('[data-s]'); if (c) { const k = c.dataset.s; pjSel.has(k) ? pjSel.delete(k) : pjSel.add(k); pjDraw(); return; }
      if (e.target.closest('#pj-copy')) copy($('pj-mail').value);
      if (e.target.closest('#pj-print') && window.ftPrintSheet) window.ftPrintSheet('Pièces justificatives à transmettre', pjItems().map((x, i) => [String(i + 1), x]), $('pj-mail').value);
    });
    o.body.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.p; if (k) { e.target.checked ? pjOff.delete(k) : pjOff.add(k); pjMail(); } if (e.target.id === 'pj-date') pjMail(); });
    o.body.addEventListener('input', e => { if (e.target.id === 'pj-extra') { pjExtra = e.target.value; pjMail(); } });
    pjDraw();
  }
  function pjAll() { const out = []; PJ.forEach(s => { if (pjSel.has(s[0])) s[2].forEach(p => { if (out.indexOf(p) < 0) out.push(p); }); }); return out; }
  function pjItems() { const a = pjAll().filter(p => !pjOff.has(p)); if (pjExtra.trim()) a.push(pjExtra.trim()); return a; }
  function pjDraw() {
    document.querySelectorAll('#pj-sit [data-s]').forEach(b => { const on = pjSel.has(b.dataset.s); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const all = pjAll();
    $('pj-list').innerHTML = all.length ? all.map(p => '<label class="op-check"><input type="checkbox" data-p="' + esc(p) + '"' + (pjOff.has(p) ? '' : ' checked') + '><span>' + esc(p) + '</span></label>').join('') : '<p class="op-note">Choisissez au moins une situation.</p>';
    pjMail();
  }
  function pjMail() {
    const it = pjItems(), d = $('pj-date') && $('pj-date').value;
    const df = d ? d.split('-').reverse().join('/') : '';
    $('pj-mail').value = 'Bonjour,\n\nAfin de poursuivre l’étude de votre dossier, merci de nous transmettre ' + (it.length > 1 ? 'les pièces suivantes' : 'la pièce suivante') + (df ? ' avant le ' + df : '') + ' :\n\n' +
      (it.length ? it.map(x => '- ' + x).join('\n') : '- …') +
      '\n\nVous pouvez les déposer depuis votre espace personnel sur francetravail.fr ou depuis l’application France Travail. Pensez à vérifier que chaque document est lisible et complet.\n\nSans ces éléments, nous ne pourrons pas finaliser l’étude de votre dossier.\n\nCordialement,\nVotre conseiller France Travail';
  }
  addTab({ id: 'pieces', name: 'Pièces justificatives', group: 'Autres outils', desc: 'Pièces à demander selon la situation, mail de demande prêt à copier', purpose: 'Les pièces à demander selon la situation de l’allocataire, et le mail de demande prêt à copier.', icon: 'folder-check', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', after: ['faq', 'jour'], kw: 'pieces justificatives documents justificatif demander manquantes mail demande dossier attestation rib kbis u1 homologation', init: pjInit });

  /* =================== 2. Calendrier des versements =================== */
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  function paques(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  function feries(y) {
    const P = paques(y), add = n => new Date(P.getFullYear(), P.getMonth(), P.getDate() + n);
    return [[new Date(y, 0, 1), 'Jour de l’an'], [add(1), 'Lundi de Pâques'], [new Date(y, 4, 1), 'Fête du Travail'], [new Date(y, 4, 8), 'Victoire 1945'], [add(39), 'Ascension'], [add(50), 'Lundi de Pentecôte'],
      [new Date(y, 6, 14), 'Fête nationale'], [new Date(y, 7, 15), 'Assomption'], [new Date(y, 10, 1), 'Toussaint'], [new Date(y, 10, 11), 'Armistice 1918'], [new Date(y, 11, 25), 'Noël']];
  }
  const key = d => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  const fd = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  let calY, calM;
  function ouvreApres(d, F) { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6 || F[key(x)]) x.setDate(x.getDate() + 1); return x; }
  function calInit(o) {
    const n = new Date(); calY = n.getFullYear(); calM = n.getMonth();
    o.body.innerHTML = '<div class="op-cal-nav"><button type="button" class="reg-btn" data-c="-1" aria-label="Mois précédent">‹</button><h3 id="cal-t" class="op-cal-t" aria-live="polite"></h3><button type="button" class="reg-btn" data-c="1" aria-label="Mois suivant">›</button><button type="button" class="reg-btn" data-c="0">Ce mois-ci</button></div><div id="cal-out"></div>';
    o.body.addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (b) { const v = +b.dataset.c; if (!v) { const t = new Date(); calY = t.getFullYear(); calM = t.getMonth(); } else { calM += v; if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } } calDraw(); return; }
      if (e.target.closest('#cal-copy')) copy($('cal-msg').value);
    });
    calDraw();
  }
  function calDraw() {
    const F = {}; feries(calY).concat(feries(calY + 1)).forEach(f => { F[key(f[0])] = f[1]; });
    const first = new Date(calY, calM, 1), nb = new Date(calY, calM + 1, 0).getDate(), today = key(new Date());
    let ouvres = 0, fer = [];
    const lead = (first.getDay() + 6) % 7;
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="op-cd op-cd-x" aria-hidden="true"></span>';
    for (let d = 1; d <= nb; d++) {
      const x = new Date(calY, calM, d), we = x.getDay() === 0 || x.getDay() === 6, f = F[key(x)];
      if (!we && !f) ouvres++; if (f) fer.push([x, f]);
      const act = d >= 28 || d <= 15;
      const cls = ['op-cd', we ? 'we' : '', f ? 'fe' : '', act ? 'act' : '', key(x) === today ? 'td' : ''].join(' ');
      cells += '<span class="' + cls + '" title="' + esc(fd(x) + (f ? ' · ' + f : '') + (act ? ' · période d’actualisation' : '')) + '"><b>' + d + '</b>' + (f ? '<small>' + esc(f) + '</small>' : '') + '</span>';
    }
    const b = B(), base = b && b.cumul && b.cumul.base || 30;
    const mN = MOIS[calM], mPrev = MOIS[(calM + 11) % 12], mNext = MOIS[(calM + 1) % 12];
    const debAct = new Date(calY, calM, 28), finAct = new Date(calY, calM + 1, 15);
    const vers = ouvreApres(new Date(calY, calM + 1, 1), F);
    $('cal-t').textContent = mN.charAt(0).toUpperCase() + mN.slice(1) + ' ' + calY;
    const msg = 'Bonjour,\n\nL’actualisation de votre situation pour le mois de ' + mN + ' ' + calY + ' est ouverte à partir du ' + fd(debAct) + ' et jusqu’au ' + fd(finAct) + ' environ (le calendrier exact est affiché dans votre espace personnel).\n\nUne fois l’actualisation faite, le paiement de vos allocations intervient en général dans les premiers jours ouvrés du mois suivant ; le délai de votre banque peut ajouter un à trois jours ouvrés.\n\nPensez à déclarer toutes vos activités, même courtes, avec le montant brut des salaires.\n\nCordialement,\nVotre conseiller France Travail';
    $('cal-out').innerHTML = '<div class="op-grid op-grid-cal"><section class="op-card"><div class="op-cal-g" role="grid" aria-label="Calendrier de ' + esc(mN + ' ' + calY) + '">' + JOURS.map(j => '<span class="op-cd-h">' + j + '</span>').join('') + cells + '</div>' +
      '<div class="op-leg"><span><i class="act"></i>Période d’actualisation (environ du 28 au 15)</span><span><i class="fe"></i>Jour férié</span><span><i class="we"></i>Week-end</span></div></section>' +
      '<section class="op-card op-kpis"><div class="op-kpi"><small>Jours calendaires</small><strong>' + nb + '</strong></div><div class="op-kpi"><small>Jours indemnisés (mensualisation)</small><strong>' + base + '</strong></div><div class="op-kpi"><small>Jours ouvrés</small><strong>' + ouvres + '</strong></div>' +
      '<ul class="op-list"><li><b>Actualisation de ' + esc(mPrev) + '</b> : jusqu’au 15 ' + esc(mN) + ' environ.</li><li><b>Actualisation de ' + esc(mN) + '</b> : à partir du ' + esc(fd(debAct)) + '.</li><li><b>Versement de ' + esc(mN) + '</b> : en général à partir du ' + esc(fd(vers)) + ', après l’actualisation (premier jour ouvré du mois suivant).</li>' +
      '<li><b>Jours fériés</b> : ' + (fer.length ? fer.map(f => esc(f[1]) + ' (' + f[0].getDate() + ')').join(', ') : 'aucun') + '.</li></ul>' +
      '<p class="op-note">Depuis la mensualisation, l’ARE est versée sur ' + base + ' jours chaque mois, quel que soit le nombre de jours du mois. Dates d’actualisation et de paiement indicatives : le calendrier officiel publié par France Travail fait foi.</p></section></div>' +
      '<section class="op-card"><div class="op-h-row"><h3 class="op-h">Message à l’allocataire</h3><button type="button" class="reg-btn reg-btn-primary" id="cal-copy"><i data-lucide="copy" class="w-4 h-4"></i>Copier</button></div><textarea id="cal-msg" class="op-ta" rows="9">' + esc(msg) + '</textarea></section>';
    icons();
  }
  addTab({ id: 'calendrier', name: 'Calendrier des versements', group: 'Références et calculs', desc: 'Actualisation, versement, jours fériés et jours indemnisés du mois', purpose: 'Période d’actualisation, date de versement probable, jours fériés et jours indemnisés, mois par mois.', icon: 'calendar-range', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', after: ['echeances', 'compare', 'bareme'], kw: 'calendrier versement paiement actualisation date jours feries indemnises mois mensualisation quand paye', init: calInit });

  /* =================== 3. Journal réglementaire =================== */
  const fD = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : (s || '—'); };
  function jrInit(o) { o.body.innerHTML = '<div id="jr-out"><p class="op-note">Chargement du journal…</p></div>'; jrLoad(); }
  function jrLoad() {
    fetch('reglementation/maj.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null).then(j => jrDraw(j || {}));
  }
  function jrDraw(j) {
    const out = $('jr-out'); if (!out) return;
    let dec = {}; try { dec = JSON.parse(localStorage.getItem('ft_regs_dec') || '{}') || {}; } catch (e) {}
    const adm = !!(window.__ftIsAdmin && window.__ftIsAdmin());
    const up = (Array.isArray(j.updates) ? j.updates : []).filter(u => u && u.id && (adm || dec[u.id] === 'ok')).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const b = B();
    const age = j.verifie_le ? Math.floor((Date.now() - new Date(j.verifie_le + 'T00:00:00')) / 864e5) : null;
    const news = (window.FT_NEWS || []).map(n => ({ v: n.v, date: n.date, items: (n.items || []).filter(t => /barème|réglement|revalori|décret|unédic|convention|veille|plafond|allocation minimale|partie fixe/i.test(t)) })).filter(n => n.items.length).slice(0, 12);
    const st = s => s === 'ok' ? '<span class="op-st ok">Diffusée</span>' : s === 'no' ? '<span class="op-st no">Écartée</span>' : '<span class="op-st p">En attente</span>';
    out.innerHTML = '<div class="op-kpis op-kpis-row"><div class="op-kpi"><small>Dernière vérification automatique</small><strong>' + esc(fD(j.verifie_le)) + '</strong><em>' + (age == null ? 'date inconnue' : age <= 0 ? 'aujourd’hui' : age === 1 ? 'hier' : 'il y a ' + age + ' jours') + '</em></div>' +
      '<div class="op-kpi"><small>Barème en vigueur vérifié le</small><strong>' + esc(b && b.verifie || '—') + '</strong><em>valeurs utilisées par les simulateurs</em></div><div class="op-kpi"><small>Mises à jour publiées</small><strong>' + up.length + '</strong><em>' + (adm ? 'toutes, avec leur statut' : 'diffusées aux conseillers') + '</em></div></div>' +
      '<section class="op-card"><h3 class="op-h">Mises à jour de la veille</h3>' + (up.length ? up.map(u => '<article class="op-up"><div class="op-up-h"><strong>' + esc(u.titre) + '</strong>' + (adm ? st(dec[u.id]) : '') + '</div><div class="op-up-m">Publiée le ' + esc(fD(u.date)) + (u.effet ? ' · en vigueur le ' + esc(fD(u.effet)) : '') + '</div>' +
        (u.resume && u.resume.length ? '<ul class="op-list">' + u.resume.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (u.sources || []).map(s => '<a class="op-src" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + ' ↗</a>').join('') + '</article>').join('') :
        '<p class="op-note">Aucun changement réglementaire détecté depuis la mise en place de la veille. Elle relit chaque semaine les textes officiels (Unédic, Légifrance, France Travail) et met à jour la date de vérification même sans changement.</p>') + '</section>' +
      (news.length ? '<section class="op-card"><h3 class="op-h">Changements réglementaires intégrés au site</h3>' + news.map(n => '<div class="op-up"><div class="op-up-m">Version ' + esc(n.v) + ' · ' + esc(n.date) + '</div><ul class="op-list">' + n.items.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>').join('') + '</section>' : '') +
      '<p class="op-links"><button type="button" class="reg-btn" onclick="switchNavTab(\'echeances\')">Échéances à venir</button><button type="button" class="reg-btn" onclick="switchNavTab(\'bareme\')">Barèmes</button><button type="button" class="reg-btn" onclick="switchNavTab(\'sources\')">Sources et vérification</button></p>';
  }
  addTab({ id: 'journal', name: 'Journal réglementaire', group: 'Références et calculs', desc: 'Historique de la veille automatique et des changements intégrés', purpose: 'Ce que la veille automatique a vérifié et publié, et les changements réglementaires intégrés au site.', icon: 'newspaper', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', after: ['echeances', 'compare', 'bareme'], kw: 'journal reglementaire veille historique mise a jour bareme verification changement texte unedic legifrance', init: jrInit, refresh: jrLoad });

  /* =================== 4. Pense-bête d’entretien =================== */
  const PB = [
    ['suivi', 'Entretien de suivi', ['Actions menées depuis le dernier entretien', 'Candidatures envoyées et réponses', 'Freins éventuels (mobilité, garde d’enfants, santé : sans détail)', 'Offres ou prestations proposées', 'Actualisation et déclarations à jour', 'Prochaines étapes convenues', 'Prochain rendez-vous fixé']],
    ['inscription', 'Inscription, premier entretien', ['Identité et coordonnées vérifiées', 'Date et motif de fin du dernier contrat', 'Attestation(s) employeur reçue(s)', 'Métier(s) recherché(s), zone, temps plein ou partiel', 'Permis, véhicule, mobilité', 'Diplômes, formations, compétences', 'RIB transmis', 'Actualisation mensuelle expliquée', 'Espace personnel et application présentés', 'Prochain rendez-vous fixé']],
    ['droits', 'Ouverture de droits', ['Date et motif de fin de contrat', 'Autres contrats sur les 24 derniers mois (36 mois à partir de 55 ans)', 'Indemnités de congés payés et indemnités supra-légales', 'Âge à la fin du contrat', 'Activité conservée ou reprise', 'Pension d’invalidité ou de retraite', 'Différés et délai d’attente expliqués', 'Dégressivité expliquée si l’allocation est concernée', 'Pièces manquantes demandées']],
    ['demission', 'Démission', ['Date et circonstances de la démission', 'Cas de démission légitime possible ?', 'Projet de reconversion validé par Transitions Pro ?', 'Ancienneté : 1 300 jours travaillés en continu sur 60 mois (démission pour projet)', 'Réexamen après 121 jours expliqué', 'Justificatifs de recherche d’emploi à conserver']],
    ['reprise', 'Reprise d’emploi', ['Type de contrat, date de début, durée', 'Salaire brut mensuel prévu', 'Cumul ARE et salaire expliqué', 'Déclaration de l’activité à l’actualisation', 'Bulletins de salaire à transmettre', 'Aides à la reprise (mobilité, garde d’enfants)', 'Maintien de l’inscription ou fin du suivi']],
    ['creation', 'Création d’entreprise', ['Date de début d’activité', 'Statut juridique choisi', 'ARCE ou maintien de l’ARE expliqué', 'ACRE demandée à l’Urssaf', 'Revenus prévisionnels', 'Accompagnement à la création proposé']],
    ['formation', 'Projet de formation', ['Intitulé, organisme, dates', 'Financement envisagé (CPF, AIF, région…)', 'AREF ou RFF selon la situation', 'Devis et inscription en cours', 'Obligation d’assiduité expliquée']],
    ['fin', 'Fin de droits', ['Date de fin de droits', 'Rechargement possible (au moins 6 mois travaillés) ?', 'Conditions de l’ASS (5 ans d’activité dans les 10 ans, ressources)', 'ATA ou RSA selon la situation', 'Démarches à faire avant la fin de droits']],
    ['tp', 'Trop-perçu', ['Origine expliquée (période, montant)', 'Déclarations de la période vérifiées', 'Options : remboursement, échéancier, retenue', 'Demande de remise possible', 'Délai de contestation rappelé', 'Notification remise ou renvoyée']]
  ];
  let pbM = 'suivi', pbOn = new Set();
  function pbInit(o) {
    o.body.innerHTML = '<div class="op-chips" id="pb-m" role="tablist" aria-label="Motif du rendez-vous">' + PB.map(p => '<button type="button" class="op-chip" role="tab" data-m="' + p[0] + '">' + esc(p[1]) + '</button>').join('') + '</div>' +
      '<div class="op-grid"><section class="op-card"><div class="op-h-row"><h3 class="op-h" id="pb-t"></h3><span class="op-count" id="pb-c"></span></div><div id="pb-list" class="op-checks"></div></section>' +
      '<section class="op-card"><h3 class="op-h">Notes de l’entretien</h3><textarea id="pb-notes" class="op-ta" rows="8" placeholder="Notes libres (rien n’est enregistré)"></textarea><div class="op-btns"><button type="button" class="reg-btn" id="pb-reset">Tout effacer</button><button type="button" class="reg-btn reg-btn-primary" id="pb-copy"><i data-lucide="copy" class="w-4 h-4"></i>Copier la synthèse</button></div>' +
      '<p class="op-note"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Rien n’est enregistré ni synchronisé : tout disparaît en rechargeant la page ou en cliquant sur « Tout effacer ». N’y notez pas de nom ni d’identifiant.</p></section></div>';
    o.body.addEventListener('click', e => {
      const m = e.target.closest('[data-m]'); if (m) { pbM = m.dataset.m; pbDraw(); return; }
      if (e.target.closest('#pb-reset')) { pbOn.clear(); $('pb-notes').value = ''; pbDraw(); }
      if (e.target.closest('#pb-copy')) {
        const p = PB.find(x => x[0] === pbM), done = p[2].filter(q => pbOn.has(pbM + '|' + q)), todo = p[2].filter(q => !pbOn.has(pbM + '|' + q)), n = $('pb-notes').value.trim();
        copy('Entretien : ' + p[1] + '\n\nPoints abordés :\n' + (done.length ? done.map(x => '- ' + x).join('\n') : '- aucun') + (todo.length ? '\n\nPoints restant à voir :\n' + todo.map(x => '- ' + x).join('\n') : '') + (n ? '\n\nNotes :\n' + n : ''));
      }
    });
    o.body.addEventListener('change', e => { const q = e.target.dataset && e.target.dataset.q; if (q) { e.target.checked ? pbOn.add(q) : pbOn.delete(q); pbCount(); } });
    pbDraw();
  }
  function pbCount() { const p = PB.find(x => x[0] === pbM); const n = p[2].filter(q => pbOn.has(pbM + '|' + q)).length; $('pb-c').textContent = n + ' / ' + p[2].length; }
  function pbDraw() {
    const p = PB.find(x => x[0] === pbM);
    document.querySelectorAll('#pb-m [data-m]').forEach(b => { const on = b.dataset.m === pbM; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('pb-t').textContent = p[1];
    $('pb-list').innerHTML = p[2].map(q => { const k = pbM + '|' + q; return '<label class="op-check"><input type="checkbox" data-q="' + esc(k) + '"' + (pbOn.has(k) ? ' checked' : '') + '><span>' + esc(q) + '</span></label>'; }).join('');
    pbCount();
  }
  addTab({ id: 'pensebete', name: 'Pense-bête d’entretien', group: 'Autres outils', desc: 'Points à aborder selon le motif du rendez-vous, rien n’est enregistré', purpose: 'Les points à aborder selon le motif du rendez-vous, à cocher pendant l’entretien. Rien n’est enregistré.', icon: 'check-square', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30', after: ['pieces', 'faq', 'jour'], kw: 'pense bete entretien rendez vous rdv questions checklist liste points aborder oublier synthese', init: pbInit });

  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(render, 30); return r; };
  try { renderBurgerTabs(); } catch (e) {}
  setTimeout(render, 60);
})();
