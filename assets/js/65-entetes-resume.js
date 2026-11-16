(function () {
  /* En-têtes d’outils harmonisés (icône, titre, objectif), boutons « Rédiger le mail CVM » et « Imprimer / PDF » dans l’en-tête,
     carte résumé et frise des dates dans Conditions et ARE. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const cfg = id => { try { return NAV_TABS_CONFIG.find(t => String(t.id) === String(id)); } catch (e) { return null; } };
  const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch (e) {} };
  const NOPRINT = { home: 1, cvm: 1, jour: 1, faq: 1, formation: 1, pensebete: 1 };

  function activeView() {
    const all = [...document.querySelectorAll('[id^="view-"]:not(.hidden)')].filter(v => !v.classList.contains('ft-split-b') && v.offsetParent !== null);
    return all.find(v => !v.closest('.hidden') && v.id !== 'view-home') || null;
  }
  function rows(view) {
    const out = [], seen = new Set();
    const push = (k, v) => { k = (k || '').trim().replace(/\s+/g, ' '); v = (v || '').trim().replace(/\s+/g, ' '); if (!k || !v || k.length > 120 || seen.has(k)) return; seen.add(k); out.push([k, v]); };
    view.querySelectorAll('.th-sum .th-k').forEach(k => push(k.querySelector('small') && k.querySelector('small').textContent, k.querySelector('strong') && k.querySelector('strong').textContent));
    view.querySelectorAll('.sim-d-row').forEach(r => push(r.querySelector('.sim-d-k') && r.querySelector('.sim-d-k').textContent, r.querySelector('.sim-d-v') && r.querySelector('.sim-d-v').textContent));
    view.querySelectorAll('.tl-ev').forEach(r => push(r.querySelector('.tl-ev-k') && r.querySelector('.tl-ev-k').textContent, r.querySelector('.tl-ev-d') && r.querySelector('.tl-ev-d').textContent));
    view.querySelectorAll('.inv-row, .bar-row, .res-row, .cp-r:not(.cp-hd), tr').forEach(r => {
      if (!r.offsetParent || r.closest('.ft-mail')) return;
      const kids = [...r.children].filter(k => k.textContent.trim()); if (kids.length < 2) return;
      push(kids[0].textContent, kids.slice(1).map(k => k.textContent.trim()).join(' · '));
    });
    return out.slice(0, 40);
  }
  function doPrint() {
    const v = activeView(); if (!v) return;
    const n = $('header-active-tab-name'), title = (n && n.textContent.split('·').pop().trim()) || 'Simulation';
    const ta = [...v.querySelectorAll('.ft-mail textarea')].find(t => t.offsetParent && t.value.trim());
    if (window.ftPrintSheet) window.ftPrintSheet(title, rows(v), ta ? ta.value : ''); else window.print();
  }
  /* Logo et barème sur la fiche imprimée */
  if (window.ftPrintSheet) {
    const _ps = window.ftPrintSheet;
    window.ftPrintSheet = function () {
      const r = _ps.apply(this, arguments);
      const p = $('ft-print');
      if (p && !p.querySelector('.fp-logo')) {
        const h = document.createElement('div'); h.className = 'fp-top';
        let ver = ''; try { ver = 'Barème vérifié le ' + BAREME.verifie; } catch (e) {}
        h.innerHTML = '<img class="fp-logo" src="assets/logo-france-travail.png" alt="France Travail"><span>' + esc(ver) + '</span>';
        p.insertBefore(h, p.firstChild);
      }
      return r;
    };
  }

  /* ---------- En-tête de l’outil actif ---------- */
  function head() {
    const t = tab(), v = activeView(); if (!v || t === 'home' || t === 'cvm') return syncFloat(false);
    const c = cfg(t);
    let rh = v.querySelector('.reg-head');
    /* Icône devant le titre */
    if (rh && c && c.icon && !rh.querySelector('.th-ico')) {
      const h2 = rh.querySelector('h2');
      if (h2) { const s = document.createElement('span'); s.className = 'th-ico'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<i data-lucide="' + esc(c.icon) + '" class="w-5 h-5"></i>'; h2.classList.add('th-title'); h2.insertBefore(s, h2.firstChild); }
      if (!rh.querySelector('p') && c.desc) { const p = document.createElement('p'); p.textContent = c.desc; (h2 ? h2.parentNode : rh).appendChild(p); }
    }
    /* Emplacement des actions */
    let host = rh ? rh.querySelector('.reg-actions') : null;
    if (rh && !host) { host = document.createElement('div'); host.className = 'reg-actions'; rh.appendChild(host); }
    if (!host) {
      const bar = v.querySelector(':scope > .h-12, :scope > .h-14, :scope > div > .h-12');
      if (bar) { host = bar.querySelector('.th-act-host'); if (!host) { host = document.createElement('div'); host.className = 'th-act-host'; bar.appendChild(host); } }
    }
    if (!host) {
      const bar = v.querySelector('.hub-bar');
      if (bar) { host = document.createElement('div'); host.className = 'th-act-host th-act-under'; bar.parentNode.insertBefore(host, bar.nextSibling); }
    }
    if (!host) return syncFloat(false);
    let box = host.querySelector('.th-act'); if (!box) { box = document.createElement('div'); box.className = 'th-act'; host.appendChild(box); }
    const hasMail = !!(window.ftS2mHas && window.ftS2mHas());
    const want = (hasMail ? 'm' : '') + (NOPRINT[t] ? '' : 'p');
    if (box.dataset.w !== want) {
      box.dataset.w = want;
      box.innerHTML = (hasMail ? '<button type="button" class="reg-btn th-mail" title="Mail CVM pré-rempli avec les résultats de cet outil"><i data-lucide="mail" class="w-4 h-4"></i>Rédiger le mail CVM</button>' : '') +
        (NOPRINT[t] ? '' : '<button type="button" class="reg-btn th-print" title="Fiche sobre : logo, date, calcul et mentions"><i data-lucide="printer" class="w-4 h-4"></i>Imprimer / PDF</button>');
      icons();
    }
    syncFloat(hasMail);
  }
  function syncFloat(inHead) { document.body.classList.toggle('th-s2m-in', !!inHead); }
  document.addEventListener('click', e => {
    const m = e.target.closest && e.target.closest('.th-mail'); if (m) { if (window.ftS2mMenu) window.ftS2mMenu(m); return; }
    const p = e.target.closest && e.target.closest('.th-print'); if (p) doPrint();
  });

  /* ---------- Conditions et ARE : carte résumé + frise ---------- */
  function simExtra() {
    const det = $('sim-calc-detail'); if (!det) return;
    const g = id => document.getElementById(id), n = id => parseFloat((g(id) || {}).value) || 0;
    const motif = (g('sim-motif') || {}).value || '', age = (g('sim-age') || {}).value || 'under55';
    const sjr = n('sim-sjr-att') > 0 ? n('sim-sjr-att') : n('sim-salaire-moyen') / 30.42;
    let wrap = $('th-sim-extra'); if (!wrap) { wrap = document.createElement('div'); wrap.id = 'th-sim-extra'; det.parentNode.insertBefore(wrap, det); }
    let d = null;
    try {
      const fct = ftParseDate((g('sim-date-fct') || {}).value) || new Date();
      d = ftComputeDates({ fct: fct, sjr: sjr, cp: n('sim-indem-cp'), supra: n('sim-indem-supra'), eco: motif === 'licenciement_eco', attenteDeja: false, rci: motif === 'rupture_conv', ageBand: age === 'under55' ? 'u55' : (age === '55to56' ? 'a55' : 'a57'), joursPeriode: 0 });
      d.fct = fct;
    } catch (e) { d = null; }
    if (!d) { wrap.innerHTML = ''; return; }
    const eur = x => (Math.round(x * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const base = (window.BAREME && BAREME.cumul && BAREME.cumul.base) || 30;
    wrap.innerHTML = '<div class="th-sum" role="group" aria-label="Résumé du calcul">' +
      '<div class="th-k th-k-main"><small>Allocation mensuelle estimée</small><strong>' + (sjr > 0 ? eur(d.aj * base) : '—') + '</strong><em>' + (sjr > 0 ? eur(d.aj) + ' par jour, brut' : 'Renseignez le salaire moyen') + '</em></div>' +
      '<div class="th-k"><small>Premier jour indemnisable</small><strong>' + ftFmtDate(d.debut) + '</strong><em>' + d.total + ' j de différés et délai d’attente</em></div>' +
      '<div class="th-k"><small>Durée maximale</small><strong>' + d.dureeReelle + ' j</strong><em>fin au plus tard le ' + ftFmtDate(d.fin) + '</em></div></div>' +
      '<details class="th-tl"><summary>Frise des dates</summary>' + ftTimelineHtml(d, d.fct) + '</details>';
    if (!det.closest('details.th-det')) {
      const dt = document.createElement('details'); dt.className = 'th-det';
      dt.innerHTML = '<summary>Détail du calcul</summary>';
      det.parentNode.insertBefore(dt, det); dt.appendChild(det);
    }
  }
  if (typeof runSimulatorCalculation === 'function') {
    const _r = runSimulatorCalculation;
    runSimulatorCalculation = function () { const r = _r.apply(this, arguments); try { simExtra(); } catch (e) { console.warn(e); } return r; };
    window.runSimulatorCalculation = runSimulatorCalculation;
  }

  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(() => { try { head(); } catch (e) { console.warn(e); } }, 90); return r; };
  setTimeout(() => { try { head(); simExtra(); } catch (e) {} }, 900);
})();
