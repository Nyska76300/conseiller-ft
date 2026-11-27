/* 2026-11-27.27 : Assistant du site, sans IA externe.
   Il répond à partir du contenu du site uniquement (barème, situations « Que faire si… », FAQ, glossaire,
   outils et modèles de mails). Rien n'est envoyé sur Internet : les questions restent sur le poste. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9%]+/g, ' ').trim();
  const STOP = new Set('apres avant mois jours jour an ans fois cdd cdi le la les un une des de du d l a au aux et ou en est ce que qui quoi quel quelle quels quelles comment combien pour par sur dans avec sans il elle on je j me mon ma mes son sa ses leur y faut peut doit-il cest c s se si ne pas plus quand dois faire est-ce estce vous nous tu t bien'.split(' '));
  const toks = q => N(q).split(' ').filter(w => w.length > 1 && !STOP.has(w));
  const B = () => { try { return BAREME; } catch (e) { return {}; } };
  const e2 = n => (typeof n === 'number' ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '—');
  const pct = n => (typeof n === 'number' ? Math.round(n * 1000) / 10 + ' %' : '—');

  /* Chiffres du barème, reconnus par mots-clés */
  const FACTS = [
    [/\b(are|allocation)\b.*\b(min|minimale|minimum|plancher)\b|\bminimum\b.*\bare\b/, b => 'ARE minimale : ' + e2(b.are.min) + ' par jour.'],
    [/partie fixe/, b => 'Partie fixe de l’ARE : ' + e2(b.are.partieFixe) + ' par jour.'],
    [/\b(max|maximale|maximum|plafond)\b.*\b(are|allocation)\b|\b(are|allocation)\b.*\b(max|maximale|maximum)\b/, b => 'Allocation maximale : ' + e2(b.are.max) + ' par jour.'],
    [/\b(calcul|formule|taux)\b.*\b(are|allocation)\b|\bare\b.*\b(calcul|formule)\b/, b => 'ARE = ' + pct(b.are.tauxA) + ' du SJR + ' + e2(b.are.partieFixe) + ', ou ' + pct(b.are.tauxB) + ' du SJR si c’est plus favorable ; au moins ' + e2(b.are.min) + ', et au plus ' + pct(b.are.plafond) + ' du SJR.'],
    [/\b(ass|solidarite)\b/, b => 'ASS : ' + e2(b.solidarite.ass) + ' par jour' + (b.solidarite.effet ? ' (depuis le ' + b.solidarite.effet + ')' : '') + '.'],
    [/\baffiliation\b|\b130\b|\b910\b|ouvrir (des|un) droit|condition.*duree.*travail/, b => 'Affiliation minimale : ' + b.affiliation.jours + ' jours ou ' + b.affiliation.heures + ' heures travaillés' + (b.affiliation.joursSais ? ' (saisonniers et primo-entrants : ' + b.affiliation.joursSais + ' jours ou ' + b.affiliation.heuresSais + ' heures)' : '') + '.'],
    [/\b(delai d attente|attente|carence)\b/, b => 'Délai d’attente : ' + b.differe.attente + ' jours, après les différés.'],
    [/\b(conges payes|iccp|cp)\b.*\bdiffer|\bdiffer\w*\b.*\b(conges|cp)\b/, b => 'Différé congés payés : plafonné à ' + b.differe.cpMax + ' jours.'],
    [/\b(trop percu|indu)\b.*\b(seuil|minimum|recouvr|prescri)/, b => 'Trop-perçu : pas de recouvrement sous ' + e2(b.indu.seuilRecup) + ' ; prescription de ' + b.indu.prescription + '.'],
    [/\bforclusion\b|delai.*inscri|inscri.*delai/, () => 'Inscription à faire dans les 12 mois suivant la fin du contrat (forclusion).']
  ];

  function answer(q) {
    const T = toks(q), nq = N(q), b = B(), out = { lead: [], tools: [], mails: [], more: [] };
    if (!T.length) return out;
    /* mot à mot : égalité, ou même racine (6 lettres) pour les mots longs : « démissionné » ↔ « démission » */
    const hit = (txt) => { const W = N(txt).split(' '); return T.filter(t => W.some(w => w === t || (t.length >= 5 && w.length >= 5 && w.slice(0, 6) === t.slice(0, 6)))).length; };
    const need = Math.max(1, Math.ceil(T.length * .6));
    /* 1. Chiffres du barème */
    FACTS.forEach(([re, f]) => { if (re.test(nq)) { try { out.lead.push({ k: 'Barème', t: f(b) }); } catch (e) {} } });
    /* 2. Glossaire / sigles */
    (window.FT_GLOSS || []).forEach(g => { if (!g || !g[0]) return; const s = N(g[0]); if (T.includes(s) || (s.length > 3 && nq.includes(s))) out.lead.push({ k: g[0], t: g[1] + (g[2] ? ' : ' + g[2] : '') }); });
    /* 3. FAQ du site */
    const faq = (window.ftFaqList ? window.ftFaqList() : []).map(f => ({ f, s: hit(f[0]) * 2 + hit(f[1]) })).filter(x => x.s >= Math.max(2, Math.ceil(T.length * .8))).sort((a, c) => c.s - a.s).slice(0, 1);
    faq.forEach(x => out.lead.push({ k: 'FAQ', t: x.f[0] + ' — ' + x.f[1] }));
    /* 4. Situations « Que faire si… » */
        const sits = (window.FT_SITUATIONS || []).map(x => ({ x, s: hit(x.t) * 2 + hit(x.kw), u: hit(x.t + ' ' + x.kw) })).filter(o => o.s >= 2 && o.u >= need).sort((a, c) => c.s - a.s).slice(0, 2);
    sits.forEach(o => {
      let c = ''; try { c = o.x.c; } catch (e) {}
      out.lead.push({ k: o.x.t, t: c });
      if (o.x.tool != null) out.tools.push(String(o.x.tool));
      if (o.x.mail) out.mails.push(o.x.mail);
    });
    /* 4 bis. Règles et calculs des outils : la règle la plus proche de la question */
    try {
      const R = [];
      (window.FT_RULES_THEMES ? window.FT_RULES_THEMES() : []).forEach(th => {
        (th.rules || []).forEach(r => R.push({ th, t: r }));
        (th.calc || []).forEach(c => R.push({ th, t: c[0] + ' : ' + c[1] }));
      });
      R.map(o => ({ o, u: hit(o.t), h: hit(o.th.title) })).filter(x => x.u >= need && x.u + x.h >= 2).sort((a, c) => (c.u * 2 + c.h) - (a.u * 2 + a.h)).slice(0, out.lead.length ? 1 : 2)
        .forEach(x => { out.lead.push({ k: 'Règle · ' + x.o.th.title, t: x.o.t }); if (x.o.th.tab) out.tools.push(String(x.o.th.tab)); });
    } catch (e) {}
    /* 5. Outils */
    try {
      NAV_TABS_CONFIG.filter(t => !/^(home|hub:)/.test(String(t.id))).map(t => ({ id: String(t.id), s: hit(t.name) * 3 + hit(t.desc || '') })).filter(o => o.s >= 2 && hit(NAV_TABS_CONFIG.find(t => String(t.id) === o.id).name + ' ' + (NAV_TABS_CONFIG.find(t => String(t.id) === o.id).desc || '')) >= need).sort((a, c) => c.s - a.s).slice(0, 4).forEach(o => { if (!out.tools.includes(o.id)) out.tools.push(o.id); });
    } catch (e) {}
    /* 6. Modèles de mails (même moteur que la recherche des mails) */
    try {
      const terms = qTerms(q);
      templates.map(t => ({ t, s: scoreTpl(t, terms), m: scoreTpl.lastMin })).filter(o => o.s > 0 && o.m >= 30).sort((a, c) => c.s - a.s).slice(0, 4).forEach(o => { if (!out.mails.includes(o.t.id)) out.mails.push(o.t.id); });
    } catch (e) {
      try { templates.map(t => ({ t, s: hit(t.title) * 3 + hit((t.tags || []).join(' ')) })).filter(o => o.s >= 3).sort((a, c) => c.s - a.s).slice(0, 4).forEach(o => out.mails.push(o.t.id)); } catch (er) {}
    }
    out.tools = [...new Set(out.tools)].slice(0, 4); out.mails = [...new Set(out.mails)].slice(0, 4);
    return out;
  }

  const toolName = id => { const b = document.querySelector('#burger-tabs-list button[onclick="switchNavTab(\'' + id + '\')"]'); if (b) { const t = b.querySelector('.text-xs'); const v = ((t ? t.textContent : b.textContent) || '').replace(/\s*(Nouveau|Mis à jour)\s*$/, '').trim(); if (v) return v; } try { return (NAV_TABS_CONFIG.find(x => String(x.id) === id) || {}).name || id; } catch (e) { return id; } };
  const mailName = id => { try { return (templates.find(t => t.id === id) || {}).title || ''; } catch (e) { return ''; } };
  function render(q, a) {
    const has = a.lead.length || a.tools.length || a.mails.length;
    let h = '';
    if (!has) h = '<p>Je n’ai rien trouvé dans le site pour « ' + esc(q) + ' ». Essayez avec d’autres mots (ex. « démission », « trop-perçu », « ARE minimale », « rechargement »), ou utilisez « Que faire si… ».</p><div class="as-acts"><button type="button" data-send="' + esc(q) + '">Envoyer la question à l’administrateur</button></div><p class="as-note">Sans nom ni donnée personnelle d’allocataire : la question est envoyée telle quelle.</p>';
    a.lead.slice(0, 4).forEach(l => { h += '<div class="as-fact"><b>' + esc(l.k) + '</b>' + (l.t ? '<span>' + esc(l.t) + '</span>' : '') + '</div>'; });
    if (a.tools.length) h += '<div class="as-h">Outils</div><div class="as-acts">' + a.tools.map(id => '<button type="button" data-tab="' + esc(id) + '">' + esc(toolName(id)) + '</button>').join('') + '</div>';
    if (a.mails.length) h += '<div class="as-h">Mails</div><div class="as-acts">' + a.mails.filter(mailName).map(id => '<button type="button" data-mail="' + esc(id) + '">✉ ' + esc(mailName(id)) + '</button>').join('') + '</div>';
    if (has) h += '<p class="as-note">Réponse tirée du contenu du site ; la décision notifiée fait foi.</p>';
    return h;
  }

  const SUG = ['ARE minimale', 'Démission légitime', 'Trop-perçu : échéancier', 'Délai d’attente', 'Rechargement des droits', 'Création d’entreprise'];
  function ui() {
    let w = $('ft-asst');
    if (w) return w;
    w = document.createElement('div'); w.id = 'ft-asst'; w.className = 'ft-asst'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Assistant'); w.hidden = true;
    w.innerHTML = '<header><span class="as-av" aria-hidden="true">?</span><div><b>Assistant</b><small>Répond avec le contenu du site · rien ne quitte votre poste</small></div><button type="button" class="as-x" aria-label="Fermer">×</button></header>' +
      '<div class="as-log" id="ft-asst-log" aria-live="polite"><div class="as-msg bot"><p>Bonjour ! Posez votre question avec vos mots : je vous indique la règle, l’outil et le mail adaptés.</p><div class="as-acts">' + SUG.map(s => '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div></div>' +
      '<form class="as-in"><input id="ft-asst-q" type="text" autocomplete="off" placeholder="Ex. : il a démissionné après 2 mois de CDD" aria-label="Votre question"><button type="submit" aria-label="Envoyer">➤</button></form>';
    document.body.appendChild(w);
    const log = $('ft-asst-log');
    const ask = q => {
      q = String(q || '').trim(); if (!q) return;
      log.insertAdjacentHTML('beforeend', '<div class="as-msg me"><p>' + esc(q) + '</p></div>');
      log.insertAdjacentHTML('beforeend', '<div class="as-msg bot">' + render(q, answer(q)) + '</div>');
      log.scrollTop = log.scrollHeight;
    };
    w.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const i = $('ft-asst-q'); ask(i.value); i.value = ''; });
    w.addEventListener('click', e => {
      if (e.target.closest('.as-x')) { w.hidden = true; return; }
      const s = e.target.closest('[data-q]'); if (s) { ask(s.dataset.q); return; }
      const t = e.target.closest('[data-tab]'); if (t) { try { switchNavTab(t.dataset.tab); } catch (er) {} return; }
      const sd = e.target.closest('[data-send]');
      if (sd) {
        const q = sd.dataset.send;
        if (!window.__ftRest) { try { showToast('Connectez-vous à votre compte pour envoyer la question', 'info'); } catch (er) {} return; }
        const u = window.__ftUser ? window.__ftUser() : null;
        window.__ftRest('/rest/v1/site_feedback', { method: 'POST', prefer: 'return=minimal', body: { user_id: u && u.id, email: u && u.email, kind: 'question', message: 'Assistant — question sans réponse : ' + q.slice(0, 1000), page: 'assistant' } })
          .then(() => { sd.disabled = true; sd.textContent = 'Question envoyée ✓'; try { showToast('Question envoyée à l’administrateur', 'success'); } catch (er) {} })
          .catch(() => { try { showToast('Envoi impossible : connectez-vous à votre compte', 'error'); } catch (er) {} });
        return;
      }
      const m = e.target.closest('[data-mail]'); if (m) { try { if (window.ftOpenPin) window.ftOpenPin('tpl:' + m.dataset.mail); else { switchNavTab('cvm'); selectTemplate(m.dataset.mail); } } catch (er) {} }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden && w.contains(document.activeElement)) w.hidden = true; });
    return w;
  }
  window.ftAssistant = function (q) { const w = ui(); w.hidden = false; setTimeout(() => { const i = $('ft-asst-q'); if (i) { if (q) i.value = q; i.focus(); } }, 30); };
  window.ftAssistantAnswer = answer;
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push({ t: 'Assistant', s: 'Poser une question (règles, outils, mails)', kw: 'assistant aide question chat bot', run: () => window.ftAssistant() });
})();
