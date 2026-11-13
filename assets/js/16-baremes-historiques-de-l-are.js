/* ================= Extension 21 : barèmes historiques de l'ARE (partie fixe, minimum, plancher formation, seuil de dégressivité) ================= */
(function () {
  'use strict';
  /* Valeurs journalières publiées par l'Unédic lors de chaque revalorisation du 1er juillet.
     seuil = plancher de dégressivité (92,11 € puis 92,57 €) ; null = non confirmé, la valeur actuelle est conservée. */
  const HIST = [
    { effet: '2025-07-01', pf: 13.18, min: 32.13, form: 22.99, seuil: 92.57, src: 'Unédic, revalorisation de 0,5 % au 01/07/2025' },
    { effet: '2024-07-01', pf: 13.11, min: 31.97, form: 22.88, seuil: 92.11, src: 'Unédic, revalorisation de 1,2 % au 01/07/2024' },
    { effet: '2023-07-01', pf: 12.95, min: 31.59, form: 22.61, seuil: null, src: 'Unédic, revalorisation de 1,9 % au 01/07/2023' },
    { effet: '2022-07-01', pf: 12.71, min: 31.00, form: 22.19, seuil: null, src: 'Unédic, valeurs « avant » du communiqué du 01/07/2023' }
  ];
  window.FT_BAREME_HIST = HIST;
  const fr = iso => iso.split('-').reverse().join('/');
  const money = n => n.toFixed(2).replace('.', ',') + ' €';
  function histAt(d) {
    if (!d || isNaN(d.getTime())) return null;
    const cur = BAREME.are.effet ? BAREME.are.effet.split('/').reverse().join('-') : '2025-07-01';
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (iso >= cur) return null;                       /* barème actuel */
    return HIST.find(h => iso >= h.effet) || null;      /* null si antérieur à 07/2022 */
  }
  window.ftBaremeHistAt = histAt;

  let depth = 0;
  function withRef(d, fn) {
    const h = histAt(d);
    if (!h) return fn();
    const A = BAREME.are, G = BAREME.degr, F = ARE_FORMULES;
    const sv = { pf: A.partieFixe, min: A.min, form: A.formation, seuil: G.seuil, f404: F['404'], fmin: F['min'] };
    A.partieFixe = h.pf; A.min = h.min; A.formation = h.form; if (h.seuil != null) G.seuil = h.seuil;
    F['404'] = '40,4 % du SJR + partie fixe (' + money(h.pf).replace('.', ',') + ')'; F['min'] = 'Allocation minimale (' + money(h.min) + ')';
    depth++;
    try { return fn(); }
    finally { depth--; A.partieFixe = sv.pf; A.min = sv.min; A.formation = sv.form; G.seuil = sv.seuil; F['404'] = sv.f404; F['min'] = sv.fmin; }
  }
  const pd = v => (typeof v === 'string' ? ftParseDate(v) : v);

  /* Simulateur d'admission : date de fin de contrat saisie (champ visible pour la rupture conventionnelle ou lancé depuis le dossier) */
  const _run = runSimulatorCalculation;
  runSimulatorCalculation = function () {
    const f = document.getElementById('sim-date-fct'), w = document.getElementById('sim-fct-wrap');
    const use = f && f.value && ((w && !w.classList.contains('hidden')) || window.__ftInDossier);
    return use ? withRef(ftParseDate(f.value), () => _run.apply(this, arguments)) : _run.apply(this, arguments);
  };
  const _cd = ftComputeDates;
  ftComputeDates = function (o) { return o && o.fct ? withRef(o.fct, () => _cd.call(this, o)) : _cd.call(this, o); };
  const _dr = dossierResult;
  dossierResult = function (a) {
    window.__ftInDossier = true;
    try { return a && a.fct ? withRef(ftParseDate(a.fct), () => _dr.apply(this, arguments)) : _dr.apply(this, arguments); }
    finally { window.__ftInDossier = false; }
  };

  /* Avertissement adapté à la date de fin de contrat */
  ftBaremeWarnings = function (fct) {
    const out = [];
    if (!fct) return out;
    const h = histAt(fct);
    if (h) out.push('Fin de contrat du ' + ftFmtDate(fct) + ' : barème du ' + fr(h.effet) + ' appliqué (partie fixe ' + money(h.pf) + ', minimum ' + money(h.min) + (h.seuil != null ? ', dégressivité au-delà de ' + money(h.seuil) : '') + '). Le maximum' + (h.seuil == null ? ' et le seuil de dégressivité' : '') + ' restent aux valeurs actuelles, à contrôler. L’allocation est ensuite revalorisée chaque 1er juillet : ce calcul n’en tient pas compte. Contrôlez la notification de droits.');
    else if (fct < ftParseDate(BAREME.are.effet.split('/').reverse().join('-'))) out.push('Fin de contrat antérieure au 01/07/2022 : aucun barème historique intégré, les valeurs actuelles sont utilisées et peuvent différer des montants applicables. Contrôlez la notification de droits.');
    return out;
  };

  /* Sources : lignes d'historique et encadré dans le journal */
  if (window.FT_SOURCES) {
    window.FT_SOURCES.push(
      ['ARE', 'Barèmes historiques (partie fixe, minimum, plancher formation)', 'Du 01/07/2022 au 01/07/2025 ; appliqués selon la date de fin de contrat saisie, sans revalorisation ultérieure', 'Unédic, communiqués de revalorisation 2023, 2024 et 2025', 'Vérifié'],
      ['ARE', 'Seuil de dégressivité 2024 et maximum antérieur à 2025', 'Seuil 92,11 € (01/07/2024) ; seuil 2023 et allocation maximale avant 2025 non confirmés, valeurs actuelles conservées', 'Unédic', 'À confirmer']
    );
  }
  const addHist = () => {
    const log = document.querySelector('.x12-log'); if (!log || log.querySelector('.x13-hist')) return;
    const d = document.createElement('div'); d.className = 'x12-ent x13-hist';
    d.innerHTML = '<h4>Barèmes historiques de l’ARE (par jour)</h4><ul>' + [{ effet: '2025-07-01', pf: 13.18, min: 32.13, form: 22.99, seuil: 92.57 }].concat(HIST.slice(1)).map(h => '<li>' + fr(h.effet) + ' : partie fixe ' + money(h.pf) + ', minimum ' + money(h.min) + ', plancher formation ' + money(h.form) + (h.seuil != null ? ', dégressivité ' + money(h.seuil) : ', seuil de dégressivité non confirmé') + '</li>').join('') + '</ul>';
    log.insertBefore(d, log.querySelector('.x12-tools'));
  };
  const _sw = switchNavTab;
  switchNavTab = function (t) { const r = _sw(t); try { addHist(); } catch (e) {} return r; };
  try { addHist(); } catch (e) {}

  /* Cas de contrôle */
  const mk = (iso, sjr) => ftComputeDates({ fct: new Date(iso + 'T12:00:00'), sjr: sjr, cp: 0, supra: 0, eco: false, ageBand: 'u55', rci: false, joursPeriode: 0 }).aj;
  [
    { n: 'Barème 2024 : allocation minimale 31,97 €', run: () => mk('2024-09-30', 45), exp: 31.97, d: 2 },
    { n: 'Barème 2024 : partie fixe 13,11 € (SJR 78,89 €)', run: () => mk('2024-09-30', 78.89), exp: 0.404 * 78.89 + 13.11, d: 2 },
    { n: 'Barème 2023 : allocation minimale 31,59 €', run: () => mk('2023-10-02', 45), exp: 31.59, d: 2 },
    { n: 'Barème actuel intact après un calcul historique', run: () => { mk('2023-10-02', 45); return BAREME.are.min + BAREME.are.partieFixe + BAREME.degr.seuil; }, exp: 32.13 + 13.18 + 92.57, d: 2 },
    { n: 'Fin de contrat en 2026 : barème actuel', run: () => mk('2026-09-30', 45), exp: 32.13, d: 2 },
    { n: 'Complément ARE : AJ 66,30 €, SJR 116,31 €, brut 2 000 € → 565,29 € net', run: () => cumulCompute({ type: 'salarie', aj: '66.3', sjr: '116.31', mois: '2026-10', brut: '2000' }).net, exp: 565.29, d: 2 },
    { n: 'Complément ARE : 30 jours en février (mensualisation)', run: () => cumulCompute({ type: 'salarie', aj: '66.3', sjr: '116.31', mois: '2027-02', brut: '2000' }).jm, exp: 30, d: 0 },
    { n: 'Complément ARE : 30 jours en mois de 31 jours (mensualisation)', run: () => cumulCompute({ type: 'salarie', aj: '66.3', sjr: '116.31', mois: '2026-10', brut: '0' }).areM, exp: 1989, d: 2 }
  ].forEach(c => FT_CASES.push(c));
})();
