(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const T = id => { const e = $(id); return e ? (('value' in e && e.tagName !== 'DIV' && e.tagName !== 'SPAN') ? e.value : e.textContent).trim() : ''; };
  const num = v => { const n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const eur = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const vis = el => !!(el && el.offsetParent);
  const HELLO = '';
  const BYE = '\n\nCes éléments vous sont communiqués à titre indicatif : seule la notification de vos droits fait foi.';
  const fd = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : iso; };
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const moisLbl = v => { const m = /^(\d{4})-(\d{2})/.exec(v || ''); return m ? MOIS[+m[2] - 1] + ' ' + m[1] : ''; };
  const duMois = v => { const l = moisLbl(v); return l ? (/^[aeiouyéèh]/i.test(l) ? ' d’' : ' de ') + l : ''; };

  /* ---------- Rédaction par simulateur ---------- */
  const GEN = {
    od() {
      if (!num(T('sim-affiliation-val')) && !T('sim-date-fct')) return '';
      const verdict = T('sim-verdict-title'), desc = T('sim-verdict-desc');
      if (/non/i.test(verdict)) {
        return HELLO + 'Après étude de votre dossier, nous ne pouvons pas, en l’état, vous ouvrir un droit à l’allocation d’aide au retour à l’emploi (ARE).\n\n' + (desc ? 'Motif : ' + desc.replace(/\.$/, '') + '.\n\n' : '') +
          'Si votre situation évolue (nouvelle période d’emploi, justificatif complémentaire), informez-nous afin que votre dossier soit réexaminé.' + BYE;
      }
      const aj = T('calc-are-jour'), duree = T('calc-duree-max'), diff = T('calc-total-differe');
      const rows = [...document.querySelectorAll('#sim-calc-detail .sim-d-row')]; const last = rows[rows.length - 1];
      const premier = last ? (last.querySelector('.sim-d-v') || {}).textContent || '' : '';
      let t = HELLO + 'Après étude de votre dossier, vous remplissez les conditions d’ouverture d’un droit à l’allocation d’aide au retour à l’emploi (ARE).\n\n';
      if (/\d/.test(aj)) t += 'Votre allocation journalière brute est estimée à ' + aj + (/\d/.test(duree) ? ', pour une durée d’indemnisation maximale de ' + duree : '') + '.\n';
      if (/\d/.test(diff)) t += 'Un délai de ' + diff + ' s’applique avant le premier versement (délai d’attente et, le cas échéant, différés liés à vos indemnités de fin de contrat).\n';
      if (/\d{2}\/\d{2}\/\d{4}/.test(premier)) t += 'Votre premier jour indemnisable est estimé au ' + premier.trim() + '.\n';
      return t.trimEnd() + BYE;
    },
    delais() {
      const out = $('dl-result'); const hero = out && out.querySelector('.dl-hero strong'); if (!hero) return '';
      const fct = fd(T('dl-fct'));
      const ev = [...out.querySelectorAll('.tl-ev')].map(e => ({ k: (e.querySelector('.tl-ev-k') || {}).textContent || '', d: (e.querySelector('.tl-ev-d') || {}).textContent || '', n: (e.querySelector('.tl-ev-n') || {}).textContent || '' })).filter(e => e.k && !/fin de contrat/i.test(e.k));
      const all = [...out.querySelectorAll('.dl-row')].map(r => [((r.querySelector('.dl-k') || {}).textContent || '').trim(), ((r.querySelector('.dl-v') || {}).textContent || '').trim().replace(/(\d+) j\b/g, '$1 jours')]);
      const rows = all.filter(r => /différé|attente/i.test(r[0]) && !/^0 jours/.test(r[1]));
      const get = re => (all.find(r => re.test(r[0])) || [])[1] || '';
      let t = HELLO + (fct ? 'Suite à la fin de votre contrat de travail le ' + fct + ', v' : 'V') + 'otre premier jour indemnisable est fixé au ' + hero.textContent.trim() + '.\n';
      if (rows.length) t += '\nCe délai se décompose ainsi :\n' + rows.map(r => '- ' + r[0] + ' : ' + r[1]).join('\n') + '\n';
      if (get(/durée/i)) t += '\nVotre droit est ouvert pour une durée maximale de ' + get(/durée/i) + (get(/fin de droits/i) ? ', soit jusqu’au ' + get(/fin de droits/i) + ' au plus tard en cas d’indemnisation continue' : '') + '.\n';
      else if (ev.length) t += '\nÉtapes :\n' + ev.map(e => '- ' + e.k.trim() + ' : ' + e.d.trim() + (e.n ? ' (' + e.n.trim() + ')' : '')).join('\n') + '\n';
      return t.trimEnd() + BYE;
    },
    complement() {
      const W = (typeof FT_WIZ !== 'undefined') ? FT_WIZ : (window.FT_WIZ || {}); const w = W.cumul; if (!w) return '';
      const a = w.answers || {}; if (a.type !== 'salarie' || !num(a.aj) || a.brut === undefined || a.brut === '') return '';
      let r; try { r = cumulCompute(a); } catch (e) { return ''; }
      const mois = moisLbl(a.mois);
      let t = HELLO + 'Vous avez déclaré' + (mois ? ' pour le mois' + duMois(a.mois) : '') + ' un salaire brut de ' + eur(r.brut) + '.\n\n';
      if (r.j === 0) t += 'Ce salaire est trop élevé pour qu’un complément d’allocation soit versé ce mois-ci. Les ' + r.jm + ' jours non indemnisés ne sont pas perdus : ils sont reportés et prolongent votre droit.';
      else t += 'Votre allocation mensuelle est calculée sur 30 jours (' + eur(r.areM) + '). Après déduction de 70 % de votre salaire brut (' + eur(r.deduit) + '), ' + r.j + ' jour' + (r.j > 1 ? 's sont indemnisés' : ' est indemnisé') + ' ce mois-ci, soit un complément de ' + eur(r.complement) + ' brut, ' + eur(r.net) + ' net après retenues sociales.\n\n' +
        (r.reportes ? 'Les ' + r.reportes + ' jours non indemnisés ne sont pas perdus : ils sont reportés et prolongent la durée de votre droit.' : '');
      return t.trimEnd() + BYE;
    },
    invalidite() {
      const aj = num(T('inv-aj')), pen = num(T('inv-pension')); if (!aj || !pen || typeof ftInvCompute !== 'function') return '';
      const cat = T('inv-cat') || '2', r = ftInvCompute({ aj: aj, pension: pen, cat: cat, cumulee: T('inv-cum') });
      const c = cat === '1' ? '1re' : cat + 'e';
      let t = HELLO + 'Vous percevez une pension d’invalidité de ' + c + ' catégorie d’un montant mensuel net de ' + eur(pen) + '.\n\n';
      if (r.integral) t += (cat === '1' ? 'Une pension d’invalidité de 1re catégorie est entièrement cumulable avec l’allocation d’aide au retour à l’emploi (ARE).' : 'Cette pension étant déjà perçue pendant l’activité qui a permis l’ouverture de votre droit, elle est intégralement cumulable avec votre ARE.') +
        ' Votre allocation n’est donc pas réduite : elle s’élève à ' + eur(r.verse) + ' pour un mois de 30 jours.';
      else t += 'Cette pension n’ayant pas été perçue pendant l’activité qui a permis l’ouverture de votre droit, son montant est déduit de votre allocation, conformément à la réglementation de l’assurance chômage.\n\n' +
        (r.verse > 0 ? 'Pour un mois de 30 jours, votre ARE de ' + eur(r.areM) + ' est réduite de ' + eur(r.deduction) + ' : le montant versé est de ' + eur(r.verse) + '.' : 'Le montant de votre pension étant supérieur ou égal à celui de votre allocation mensuelle (' + eur(r.areM) + '), aucune ARE ne peut vous être versée.');
      t += '\n\nMerci de nous transmettre la notification de votre CPAM (catégorie, montant, date d’effet) et de nous signaler tout changement de votre pension.';
      return t + BYE;
    },
    ans() {
      const aj = num(T('arce-input-are-jour')), j = num(T('arce-input-jours')); if (!aj || !j) return '';
      let t = HELLO + 'Vous envisagez de créer ou de reprendre une entreprise. Deux possibilités s’offrent à vous pour votre allocation :\n\n';
      t += '1. L’aide à la reprise ou à la création d’entreprise (ARCE) : un capital estimé à ' + T('arce-res-total') + ', versé en deux fois (' + T('arce-res-v1') + ' au démarrage de l’activité, puis ' + T('arce-res-v2') + ' six mois plus tard si l’activité se poursuit).\n';
      if (num(T('maint-input-are-jour'))) t += '2. Le maintien de votre ARE chaque mois : environ ' + T('maint-res-are-versee') + ' par mois (' + T('maint-res-jours-payes') + ', ' + T('maint-res-jours-reportes').replace(/^\+\s*/, '') + ' en fin de droit), selon les revenus de votre activité.\n';
      else t += '2. Le maintien de votre ARE chaque mois, réduit selon les revenus de votre activité ; les jours non indemnisés sont reportés en fin de droit.\n';
      t += '\nLe choix se fait au démarrage de votre activité. N’hésitez pas à nous contacter pour en échanger avant de vous décider.';
      return t + BYE;
    },
    cns() {
      const out = $('cns-out'); const hero = out && out.querySelector('.wiz-hero strong'); if (!hero || !num(T('cns-aj'))) return '';
      const em = (out.querySelector('.wiz-hero em') || {}).textContent || '';
      const tile = lbl => { const t = [...out.querySelectorAll('.wiz-tile')].find(x => new RegExp(lbl, 'i').test(x.textContent)); return t ? (t.querySelector('strong') || {}).textContent || '' : ''; };
      const mois = moisLbl(T('cns-mois'));
      let t = HELLO + 'Au vu des revenus de votre activité non salariée' + (mois ? ' pour le mois' + duMois(T('cns-mois')) : '') + (tile('Revenu retenu') ? ' (revenu retenu après abattement : ' + tile('Revenu retenu') + ')' : '') + ', votre complément d’allocation s’élève à ' + hero.textContent.trim() + '.\n';
      const m = /(\d+)\s*jour\(s\) indemnisé\(s\),\s*(\d+)/.exec(em);
      if (m) t += '\n' + m[1] + ' jour(s) sont indemnisés ce mois-ci. Les ' + m[2] + ' jour(s) non indemnisés ne sont pas perdus : ils sont reportés et prolongent votre droit.\n';
      t += '\nCe montant est établi d’après les revenus déclarés et pourra être régularisé au vu de vos revenus définitifs.';
      return t + BYE;
    },
    cspSim() {
      if (!vis($('csp-subview-sim')) || !num(T('csp-sim-salaire'))) return '';
      return HELLO + 'Dans le cadre du contrat de sécurisation professionnelle (CSP), votre allocation de sécurisation professionnelle (ASP) est estimée à ' + T('csp-res-asp-mensuelle') + ' par mois, contre ' + T('csp-res-are-mensuelle') + ' au titre de l’ARE.' +
        (/\d/.test(T('csp-res-gain-total')) ? '\nSur la durée du contrat, l’écart est estimé à ' + T('csp-res-gain-total') + '.' : '') + '\n\nLe CSP vous apporte également un accompagnement renforcé dans votre recherche d’emploi pendant 12 mois.' + BYE;
    },
    cspRec() {
      if (!vis($('csp-subview-reclass'))) return '';
      const n = T('csp-rec-adviser-note'); if (!n || !num(T('csp-rec-nouveau-salaire'))) return '';
      return n.replace(/^Madame, Monsieur,?\s*/i, '').replace(/\s*(Cordialement|Bien cordialement)[\s\S]*$/i, '').trim() + BYE;
    },
    droits() {
      const rc = $('rc-out'), as = $('as-out'); const parts = [];
      const al = el => { const s = el && el.querySelector('.wiz-alert span'); return s ? s.textContent.trim() : ''; };
      if (num(T('rc-vol')) && al(rc)) parts.push('Concernant le rechargement de vos droits, ' + al(rc).replace(/sans démarche de l.usager/i, 'sans démarche de votre part').replace(/^Conditions de rechargement réunies\s*:\s*/i, 'les conditions sont réunies : ').replace(/^Conditions de rechargement non réunies\s*:\s*/i, 'les conditions ne sont pas réunies : '));
      if (num(T('as-ans')) && al(as)) parts.push('Concernant l’allocation de solidarité spécifique (ASS), ' + al(as).replace(/^Conditions de l.ASS réunies sur ces éléments\s*:\s*/i, 'les conditions sont réunies : ').replace(/^Conditions de l.ASS non réunies\s*:?\s*/i, 'les conditions ne sont pas réunies : '));
      if (!parts.length) return '';
      return HELLO + parts.join('\n\n') + BYE;
    },
    cfd() {
      const out = $('cfd-result'); if (!out || !num(T('cfd-days'))) return '';
      const big = out.querySelector('.text-2xl'); const j = big ? big.textContent.trim() : ''; if (!/\d/.test(j)) return '';
      return HELLO + 'Votre droit à l’allocation d’aide au retour à l’emploi (ARE) a été calculé avec un coefficient de réduction de durée de 0,75.\n\nLorsque la conjoncture le prévoit à la date de fin de vos droits, un complément de fin de droits (CFD) de ' + j + ' est estimé : il prolongerait alors votre indemnisation, sans démarche de votre part.' + BYE;
    },
    sjr() {
      const out = $('sj-out'); const hero = out && out.querySelector('.wiz-hero strong'); if (!hero || !num(T('sj-sr'))) return '';
      const row = lbl => { const r = [...out.querySelectorAll('.rg-row')].find(x => new RegExp(lbl, 'i').test(x.textContent)); return r ? (r.querySelector('.rg-f') || {}).textContent || '' : ''; };
      return HELLO + 'Votre salaire journalier de référence (SJR), qui sert de base au calcul de votre allocation, est estimé à ' + hero.textContent.trim() + '.\n\nIl est calculé à partir des salaires bruts de votre période de référence (' + eur(num(T('sj-sr'))) + ') rapportés au nombre de jours de cette période (' + (row('Dénominateur') || row('Durée de la période')).trim() + ').' + BYE;
    }
  };

  /* ---------- Emplacements : un panneau par simulateur ---------- */
  const SPOTS = [
    { key: 'od', tab: '1', host: () => document.querySelector('#od-subview-sim > div') },
    { key: 'delais', tab: 'delais', host: () => document.querySelector('#view-delais .reg-wrap') },
    { key: 'complement', tab: '5', split: true, host: () => document.querySelector('#view-complement-are .wiz-wrap') },
    { key: 'invalidite', tab: 'invalidite', show: () => !!$('inv-aj'), host: () => document.getElementById('inv-mail-host') },
    { key: 'ans', tab: '3', host: () => document.querySelector('#ans-subview-sim > div') },
    { key: 'cns', tab: 'cns', split: true, show: () => !!$('cns-out'), host: () => document.querySelector('#view-cns .reg-wrap') },
    { key: 'cspSim', tab: '4', host: () => document.querySelector('#csp-subview-sim > div') },
    { key: 'cspRec', tab: '4', host: () => document.querySelector('#csp-subview-reclass > div[class*="grid-cols"]') || document.querySelector('#csp-subview-reclass > div') },
    { key: 'droits', tab: 'droits', split: true, host: () => document.querySelector('#view-droits .reg-wrap') },
    { key: 'cfd', tab: 'cfd', host: () => $('cfd-panel') ? $('cfd-panel').parentElement : null },
    { key: 'sjr', tab: 'sjr', split: true, show: () => !!($('sj-pane-sjr') && $('sj-pane-sjr').offsetParent), host: () => document.querySelector('#view-sjr .reg-wrap') }
  ];
  const ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>';
  const dirty = {};
  function ensure(sp) {
    let host = sp.host(); if (!host) return null;
    /* Outils en deux colonnes (grille à 12 colonnes, colonne de droite collante) : le mail va sous la colonne de saisie */
    /* (sur ordinateur ; sur téléphone il reste en bas, après les résultats) */
    if (/grid-cols-12/.test(host.className) && host.firstElementChild && /col-span/.test(host.firstElementChild.className)) {
      const grid = host, col = host.firstElementChild, wide = window.innerWidth >= 1024;
      host = wide ? col : grid;
      const other = (wide ? grid : col).querySelector(':scope > .ft-mail[data-mail="' + sp.key + '"]');
      if (other) host.appendChild(other);
    }
    let p = host.querySelector(':scope > .ft-mail[data-mail="' + sp.key + '"]');
    if (!p) {
      p = document.createElement('section'); p.className = 'ft-mail'; p.dataset.mail = sp.key;
      p.innerHTML = '<div class="ft-mail-h"><h3>' + ICO + 'Mail à l’allocataire</h3><span class="ft-mail-tag">Généré automatiquement, modifiable avant copie</span><div class="ft-mail-btns"><button type="button" class="ft-mail-regen">Régénérer</button><button type="button" class="ft-mail-copy">Copier le mail</button></div></div><div class="ft-mail-body"></div>';
      host.appendChild(p);
    }
    if (sp.split) host.classList.add('ft-split');
    return p;
  }
  let rzT = null, rzW = window.innerWidth >= 1024;
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { const w = window.innerWidth >= 1024; if (w === rzW) return; rzW = w; SPOTS.forEach(sp => { try { ensure(sp); } catch (e) {} }); }, 200); });
  function fill(sp, force) {
    const p = ensure(sp); if (!p) return;
    p.hidden = !!(sp.show && !sp.show());
    if (p.hidden) return;
    if (dirty[sp.key] && !force) { p.querySelector('.ft-mail-regen').classList.add('is-warn'); return; }
    let txt = ''; try { txt = (GEN[sp.key]() || '').replace(/(\d)\.(\d{2}) €/g, '$1,$2 €'); } catch (e) { txt = ''; }
    const body = p.querySelector('.ft-mail-body');
    if (!txt) { body.innerHTML = '<p class="ft-mail-empty">Complétez le simulateur : le mail se rédige automatiquement avec les résultats.</p>'; p.querySelector('.ft-mail-copy').disabled = true; return; }
    let ta = body.querySelector('textarea');
    if (!ta) { body.innerHTML = '<textarea aria-label="Mail à l’allocataire" spellcheck="true"></textarea>'; ta = body.querySelector('textarea'); ta.addEventListener('input', () => { dirty[sp.key] = true; }); }
    if (ta.value !== txt) ta.value = txt;
    try { window.ftMailFit && window.ftMailFit(ta); } catch (e) {}
    dirty[sp.key] = false; p.querySelector('.ft-mail-regen').classList.remove('is-warn'); p.querySelector('.ft-mail-copy').disabled = false;
  }
  let tmr = null;
  function refresh(force) {
    const t = (() => { try { return String(activeNavTab); } catch (e) { return ''; } })();
    SPOTS.filter(s => s.tab === t).forEach(s => fill(s, force));
  }
  const later = () => { clearTimeout(tmr); tmr = setTimeout(() => refresh(false), 350); };
  document.addEventListener('input', e => { if (!e.target.closest('.ft-mail') && e.target.closest('[id^="view-"]')) later(); }, true);
  document.addEventListener('change', e => { if (!e.target.closest('.ft-mail') && e.target.closest('[id^="view-"]')) later(); }, true);
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ft-mail button');
    if (b) {
      const p = b.closest('.ft-mail'), key = p.dataset.mail, sp = SPOTS.find(s => s.key === key);
      if (b.classList.contains('ft-mail-regen')) { dirty[key] = false; fill(sp, true); try { showToast('Mail régénéré', 'info'); } catch (er) {} }
      if (b.classList.contains('ft-mail-copy')) { const ta = p.querySelector('textarea'); if (ta) { try { copyToClipboard(ta.value); } catch (er) { navigator.clipboard && navigator.clipboard.writeText(ta.value); } try { showToast('Mail copié', 'success'); } catch (er) {} } }
      return;
    }
    if (e.target.closest && e.target.closest('[id^="view-"]')) later();
  });
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(() => refresh(false), 120); return r; };
  ['invTab', 'cnsTab'].forEach(n => { const o = window[n]; if (typeof o === 'function') window[n] = function () { const r = o.apply(this, arguments); setTimeout(() => refresh(false), 60); return r; }; });
  window.ftMailGen = GEN; window.ftMailRefresh = refresh;
})();
