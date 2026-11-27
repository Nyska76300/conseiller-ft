/* 2026-11-27.31 :
   1. Mails « À relire » : un mail dont le texte contient un montant ou une date écrits en dur, ou une règle
      d'affiliation sans le cas des primo-entrants, est signalé (pastille et filtre). « Marquer comme relu » le retire.
   2. Simulateur → mail conseillé : quand un résultat affiche « non éligible » ou « à vérifier », le mail adapté est proposé.
   3. Synthèse d'entretien : les résultats affichés par chaque simulateur pendant la session sont gardés (sans nom)
      et peuvent être imprimés sur une seule page. Effacés à la fermeture de l'onglet. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const cur = () => { try { return String(activeNavTab); } catch (e) { return ''; } };

  /* ---------- 1. Mails à relire ---------- */
  const RK = 'ft_tpl_reviewed';
  const reviewed = () => { try { return JSON.parse(localStorage.getItem(RK) || '{}') || {}; } catch (e) { return {}; } };
  const B = () => { try { return BAREME; } catch (e) { return {}; } };
  const known = () => { const b = B(), v = []; const walk = o => { if (o && typeof o === 'object') Object.values(o).forEach(walk); else if (typeof o === 'number') v.push(o.toFixed(2).replace('.', ',')); }; walk(b); return new Set(v); };
  function issues(t) {
    const body = String((t && t.body) || '').replace(/\{\{[^}]*\}\}/g, ' '), out = [];
    const K = known();
    (body.match(/\b\d{1,3}(?:[  ]?\d{3})*,\d{2}\s?€/g) || []).forEach(m => { const n = m.replace(/[  €\s]/g, ''); if (!K.has(n)) out.push('Montant écrit en dur : ' + m.trim() + ' (absent du barème du site)'); });
    (body.match(/\b\d{1,2}(?:er)? (?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) 20\d\d\b/g) || []).forEach(m => { if (!/(depuis|à compter|avant|après|en vigueur|à partir)\s+(du|le)\s*$/i.test(body.slice(0, body.indexOf(m)).slice(-30))) out.push('Date écrite en dur : ' + m); });
    const b = B();
    const tt = String((t && t.title) || '') + ' ' + body;
    /* primo-entrants : seulement pour une première ouverture de droits (pas un rechargement ni une fin de droits) */
    if (b.affiliation && /\b130 jours\b|\b910 heures\b/.test(body) && !/\b108 jours\b|\b758 heures\b|primo/i.test(body) && /rejet|refus|ouverture de droits|admission/i.test(tt) && !/rechargement|fin de droits|\bASS\b|marins|ARCE/i.test(tt)) out.push('Affiliation : ne mentionne pas les primo-entrants (' + b.affiliation.joursSais + ' jours ou ' + b.affiliation.heuresSais + ' heures depuis le 01/04/2026)');
    return [...new Set(out)];
  }
  /* La relecture des mails est réservée à l'administrateur */
  const isAdmin = () => { try { return !!(window.__ftIsAdmin && window.__ftIsAdmin()); } catch (e) { return false; } };
  function needsReview(t) {
    if (!t || !isAdmin()) return false; const r = reviewed()[t.id]; if (r) return false;
    return issues(t).length > 0;
  }
  window.ftMailIssues = issues;
  function markCards() {
    const L = $('templates-list'); if (!L) return; let n = 0;
    L.querySelectorAll('[data-tpl-id]').forEach(c => {
      let t = null; try { t = templates.find(x => x.id === c.dataset.tplId); } catch (e) {}
      const on = needsReview(t); c.classList.toggle('is-review', on); if (on) n++;
      let m = c.querySelector('.cvm-rv');
      if (on && !m) { m = document.createElement('span'); m.className = 'cvm-rv'; m.textContent = 'À relire'; m.title = issues(t).join('\n'); const tt = c.querySelector('.min-w-0 > .min-w-0 > span'); if (tt) tt.parentNode.insertBefore(m, tt.nextSibling); else c.appendChild(m); }
      if (!on && m) m.remove();
    });
    const q = $('cvm-qf');
    if (!isAdmin()) { const ob = q && q.querySelector('[data-f="review"]'); if (ob) ob.remove(); document.documentElement.classList.remove('cvm-f-review'); return; }
    if (q && !q.querySelector('[data-f="review"]')) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.f = 'review'; b.innerHTML = 'À relire <b>0</b>';
      b.addEventListener('click', e => { e.stopPropagation(); const on = !document.documentElement.classList.contains('cvm-f-review'); document.documentElement.classList.toggle('cvm-f-review', on); b.classList.toggle('on', on); });
      q.appendChild(b);
    }
    const nb = q && q.querySelector('[data-f="review"] b'); if (nb) nb.textContent = n;
  }
  function reviewBar() {
    const pb = $('preview-body'); if (!pb) return;
    let t = null; try { t = templates.find(x => x.id === activeTemplateId); } catch (e) {}
    let bar = $('cvm-rv-bar'); const is = t ? issues(t) : [], rv = t ? reviewed()[t.id] : null;
    if (!t || !is.length || rv || !isAdmin()) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'cvm-rv-bar'; bar.className = 'cvm-rv-bar'; pb.parentNode.insertBefore(bar, pb); }
    bar.innerHTML = '<b>À relire</b><ul>' + is.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><button type="button">Marquer comme relu</button>';
    bar.querySelector('button').onclick = () => { const r = reviewed(); r[t.id] = new Date().toISOString().slice(0, 10); try { (typeof safeLS !== 'undefined' ? safeLS : localStorage).setItem(RK, JSON.stringify(r)); } catch (e) {} bar.remove(); markCards(); toast('Mail marqué comme relu', 'success'); };
  }

  /* ---------- 2. Mail conseillé selon le résultat du simulateur ---------- */
  function suggest() {
    const t = cur(); if (!t || t === 'cvm' || t === 'home') return;
    const v = [...document.querySelectorAll('[id^="view-"]')].find(x => x.offsetParent && !x.classList.contains('hidden')); if (!v) return;
    const txt = (v.innerText || '').slice(0, 20000);
    const st = /non[ -]éligible|non éligible|refus|rejet/i.test(txt) ? 'ko' : /à vérifier|a verifier/i.test(txt) ? 'wa' : null;
    let chip = v.querySelector('.ft-sugg');
    if (!st || !window.ftS2mHas || !window.ftS2mHas()) { if (chip) chip.remove(); return; }
    if (!chip) {
      chip = document.createElement('div'); chip.className = 'ft-sugg';
      const host = v.querySelector('.pro-res') || v.querySelector('.reg-wrap') || v; host.prepend(chip);
      chip.addEventListener('click', e => { const b = e.target.closest('button'); if (b && window.ftS2mMenu) window.ftS2mMenu(b); });
    }
    chip.className = 'ft-sugg ' + st;
    chip.innerHTML = '<span>' + (st === 'ko' ? 'Résultat défavorable : un mail d’explication est prêt.' : 'Point à vérifier : un mail peut aider à demander les précisions.') + '</span><button type="button">Voir les mails conseillés</button>';
  }

  /* ---------- 3. Synthèse d'entretien ---------- */
  const SK = 'ft_synth';
  const sget = () => { try { return JSON.parse(sessionStorage.getItem(SK) || '{}') || {}; } catch (e) { return {}; } };
  function snapshot(tab) {
    if (!tab || /^(home|cvm|jour|faq|admin|formation|journal|glossaire|sources|schemas|pieces|pensebete)$/.test(tab)) return;
    const v = [...document.querySelectorAll('[id^="view-"]')].find(x => x.offsetParent && !x.classList.contains('hidden')); if (!v) return;
    const res = v.querySelector('.pro-res') || [...v.querySelectorAll('[class*="border-l-4"],[class*="rounded-2xl"]')].find(x => /€|jours|mois|éligible/i.test(x.innerText || ''));
    if (!res) return;
    const cl = res.cloneNode(true); cl.querySelectorAll('.ft-sugg,button,select,input,svg').forEach(x => x.remove());
    document.body.appendChild(cl); cl.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px'; const raw = cl.innerText || ''; cl.remove();
    const L = raw.split('\n').map(x => x.trim()).filter(Boolean), out = [];
    for (let i = 0; i < L.length; i++) {
      const a = L[i], n = L[i + 1];
      if (n && (/:\s*$/.test(a) || (a.length <= 48 && n.length <= 22 && !/[.!?]$/.test(a)))) { out.push(a.replace(/\s*:\s*$/, '') + ' : ' + n); i++; }
      else out.push(a);
    }
    const txt = out.join('\n').slice(0, 1800);
    if (!txt || !/\d/.test(txt)) return;
    let name = tab; try { const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + tab + '\')"] .text-xs'); name = b ? b.textContent.replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim() : ((NAV_TABS_CONFIG.find(x => String(x.id) === tab) || {}).name || tab); } catch (e) {}
    const s = sget(); s[tab] = { n: name, t: txt, at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
    try { sessionStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
  }
  /* Points clés lus dans le résultat : éligibilité, montant, durée, premier jour, différés, points à vérifier */
  function keyPoints(txt) {
    const L = String(txt || '').split('\n'), out = [], seen = new Set();
    const add = (cls, k, v) => { v = String(v || '').trim(); if (!v || seen.has(k)) return; seen.add(k); out.push([cls, k, v]); };
    L.forEach(l => {
      const v = l.split(' : ').slice(1).join(' : ') || l;
      if (/non éligible|non eligible|refus/i.test(l)) add('ko', 'Éligibilité :', 'non éligible en l’état');
      else if (/\béligible\b|droits ouverts|accord/i.test(l) && !/diagnostic/i.test(l)) add('ok', 'Éligibilité :', l.replace(/^.*?:\s*/, ''));
      if (/(are|allocation|montant|asp|ass).*(jour|mois|mensuel)/i.test(l) && /\d/.test(v) && /€/.test(v)) add('', 'Montant :', l);
      if (/durée/i.test(l) && /\d/.test(v)) add('', 'Durée :', v);
      if (/premier jour|1er jour/i.test(l) && /\d/.test(v)) add('', 'Premier jour indemnisable :', v);
      if (/total des différés|différés? avant/i.test(l) && /\d/.test(v)) add('', 'Différés :', v);
      if (/à vérifier|attention/i.test(l)) add('wa', 'À vérifier :', l.replace(/^.*?:\s*/, ''));
      if (/échéanc|mensualit/i.test(l) && /\d/.test(v)) add('', 'Échéancier :', l);
    });
    return out.slice(0, 7);
  }
  window.ftSynthesis = function () {
    snapshot(cur());
    const s = sget(), keys = Object.keys(s);
    if (!keys.length) { toast('Aucun résultat de simulateur pour l’instant : utilisez un simulateur, puis revenez ici.', 'info'); return; }
    let w = $('ft-synth');
    if (!w) { w = document.createElement('div'); w.id = 'ft-synth'; w.className = 'cvm-so'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w);
      w.addEventListener('click', e => {
        if (e.target === w || e.target.closest('[data-s="x"]')) { w.hidden = true; return; }
        if (e.target.closest('[data-s="clear"]')) { sessionStorage.removeItem(SK); w.hidden = true; toast('Synthèse effacée', 'success'); return; }
        if (e.target.closest('[data-s="print"]')) { document.documentElement.classList.add('ft-printing-synth'); window.print(); setTimeout(() => document.documentElement.classList.remove('ft-printing-synth'), 500); }
        const r = e.target.closest('[data-rm]'); if (r) { const s2 = sget(); delete s2[r.dataset.rm]; sessionStorage.setItem(SK, JSON.stringify(s2)); window.ftSynthesis(); }
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    w.innerHTML = '<div class="cvm-so-c ft-synth-c"><div class="cvm-so-h"><h2>Synthèse d’entretien</h2><button type="button" data-s="x" aria-label="Fermer">×</button></div>' +
      '<p>Résultats des simulateurs utilisés pendant cette session (' + keys.length + '). Aucun nom n’est enregistré ; tout s’efface à la fermeture de l’onglet.</p>' +
      '<div class="ft-synth-print"><div class="fsy-h"><b>France Travail · Espace Conseiller</b><span>Synthèse établie le ' + d + '</span></div>' +
      keys.map(k => { const kp = keyPoints(s[k].t); return '<section><h3>' + esc(s[k].n) + ' <small>' + esc(s[k].at) + '</small><button type="button" data-rm="' + esc(k) + '" aria-label="Retirer ' + esc(s[k].n) + '">✕</button></h3>' + (kp.length ? '<ul class="fsy-kp">' + kp.map(x => '<li class="' + x[0] + '"><b>' + esc(x[1]) + '</b> ' + esc(x[2]) + '</li>').join('') + '</ul>' : '') + '<details' + (kp.length ? '' : ' open') + '><summary>Détail affiché par le simulateur</summary><pre>' + esc(s[k].t) + '</pre></details></section>'; }).join('') +
      '<p class="fsy-n">Simulation indicative : la décision notifiée par France Travail fait foi.</p></div>' +
      '<div class="cvm-so-a"><button type="button" data-s="clear">Effacer</button><button type="button" data-s="print" class="pri">Imprimer / PDF</button></div></div>';
    w.hidden = false;
  };
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push({ t: 'Synthèse d’entretien', s: 'Résultats des simulateurs de la session, à imprimer', kw: 'synthese entretien resume recapitulatif imprimer fiche', run: () => window.ftSynthesis() });

  /* ---------- Branchements ---------- */
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { try { snapshot(cur()); } catch (e) {} const r = _s.apply(this, arguments); setTimeout(() => { try { suggest(); markCards(); } catch (e) {} }, 400); return r; };
    window.switchNavTab = switchNavTab;
  }
  if (typeof renderTemplatesList === 'function') { const _r = renderTemplatesList; renderTemplatesList = function () { const r = _r.apply(this, arguments); setTimeout(markCards, 30); return r; }; window.renderTemplatesList = renderTemplatesList; }
  if (typeof updateCompiledPreview === 'function') { const _u = updateCompiledPreview; updateCompiledPreview = function () { const r = _u.apply(this, arguments); try { reviewBar(); } catch (e) {} return r; }; window.updateCompiledPreview = updateCompiledPreview; }
  let tm; document.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { try { suggest(); } catch (e) {} }, 600); });
  document.addEventListener('change', () => { clearTimeout(tm); tm = setTimeout(() => { try { suggest(); } catch (e) {} }, 600); });
  window.addEventListener('beforeprint', () => { if (!document.documentElement.classList.contains('ft-printing-synth')) try { snapshot(cur()); } catch (e) {} });
  setTimeout(() => { try { markCards(); } catch (e) {} }, 1200);
})();
