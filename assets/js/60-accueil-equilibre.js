(function () {
  /* Accueil sur ordinateur (3 colonnes) : les rubriques d’outils sont réparties automatiquement entre les colonnes
     pour qu’elles finissent à peu près à la même hauteur, sans vide dans les colonnes de côté.
     + Personnalisation : chaque conseiller choisit les tuiles affichées et leur place. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const onHome = () => { try { return String(activeNavTab) === 'home'; } catch (e) { return false; } };
  const wide = () => innerWidth >= 1200;
  const cols = () => { const w = document.querySelector('#view-home > .home-wrap.fh-on'); return w ? { w, L: w.querySelector(':scope > .fh-L'), C: w.querySelector(':scope > .fh-C'), R: w.querySelector(':scope > .fh-R') } : null; };

  /* ---------- Tuiles personnalisables ---------- */
  const CARDS = [
    ['dos', 'Dossier en cours', '.fh-dos:not(.fh-news)'], ['links', 'Liens utiles', '.fh-links'], ['rep', 'Repères', '.fh-rep'],
    ['pins', 'Mes favoris', '.fh-pins'], ['hist', 'Derniers calculs', '.fh-hist'], ['rem', 'Prochains rappels', '#ft-rem-home'],
    ['tools', 'Simulateurs et outils', '.fh-tools'], ['cvm', 'CVM favoris et Reprendre', '.home-top'], ['news', 'Quoi de neuf ?', '.fh-news']
  ];
  const DEF = { L: ['dos', 'links', 'rep'], C: ['pins', 'hist', 'rem', 'tools'], R: ['cvm', 'news'], hidden: [] };
  const prefs = () => { try { return JSON.parse(localStorage.getItem('ft_prefs') || '{}') || {}; } catch (e) { return {}; } };
  const getLay = () => { const h = prefs().home; return h && h.L && h.C && h.R ? h : null; };
  function setLay(l) { const p = prefs(); if (l) p.home = l; else delete p.home; try { localStorage.setItem('ft_prefs', JSON.stringify(p)); } catch (e) {} }
  const el = (c, k) => { const d = CARDS.find(x => x[0] === k); return d ? c.w.querySelector(':scope > .fh-col > ' + d[2]) : null; };
  window.__ftHomeCustom = () => !!getLay() || editing;

  function applyLayout() {
    const c = cols(); if (!c || !c.L) return;
    const lay = getLay() || (editing ? DEF : null);
    c.w.querySelectorAll('.fh-hide').forEach(x => x.classList.remove('fh-hide'));
    if (!lay) { c.w.querySelectorAll('[data-hk]').forEach(x => { x.style.order = ''; }); return; }
    const hero = c.C.querySelector(':scope > .home-hero');
    let n = 2;
    ['L', 'C', 'R'].forEach(side => {
      const col = c[side];
      lay[side].forEach(k => {
        const e = el(c, k); if (!e) return;
        e.dataset.hk = k;
        if (e.parentNode !== col) col.appendChild(e);
        e.style.order = n++;
      });
    });
    /* ordre dans le DOM (ordinateur) : on respecte la liste, le héros reste en tête au centre */
    ['L', 'C', 'R'].forEach(side => {
      const col = c[side], keep = [...col.children].filter(x => !x.dataset.hk || !lay[side].includes(x.dataset.hk));
      lay[side].map(k => el(c, k)).filter(Boolean).forEach(e => col.appendChild(e));
      keep.filter(x => !x.classList.contains('home-hero')).forEach(x => { if (!x.dataset.hk) col.appendChild(x); });
      if (side === 'C' && hero) col.insertBefore(hero, col.firstChild);
    });
    if (!editing) (lay.hidden || []).forEach(k => { const e = el(c, k); if (e) e.classList.add('fh-hide'); });
  }

  /* ---------- Équilibrage des colonnes ---------- */
  let busy = false;
  function colH(col) {
    const kids = [...col.children].filter(x => x.offsetParent !== null && x.getBoundingClientRect().height > 0);
    if (!kids.length) return 0;
    return kids[kids.length - 1].getBoundingClientRect().bottom - col.getBoundingClientRect().top;
  }
  /* Les rubriques d’outils sont dans .fh-tools > .fh-sum ; celles déplacées vont dans un .fh-sum.fh-sum-side de la colonne de côté */
  const title = g => ((g.querySelector('h3') || {}).textContent || '').trim();
  function restore(c) {
    const tw = c.C.querySelector(':scope > .fh-tools'), sum = tw && tw.querySelector(':scope > .fh-sum'); if (!sum) return null;
    const home = [...sum.querySelectorAll(':scope > .fh-grp')];
    home.forEach((g, i) => { if (g.dataset.gi == null) g.dataset.gi = i; });
    c.w.querySelectorAll('.fh-sum-side').forEach(box => {
      [...box.querySelectorAll(':scope > .fh-grp')].forEach(g => {
        if (home.some(x => title(x) === title(g)) || g.dataset.gi == null) { g.remove(); return; } /* rubriques redessinées entre-temps */
        g.classList.remove('fh-grp-side');
        const sib = [...sum.querySelectorAll(':scope > .fh-grp')].find(x => +x.dataset.gi > +g.dataset.gi);
        sum.insertBefore(g, sib || null);
      });
      box.remove();
    });
    return sum;
  }
  function sideBox(col) {
    let box = col.querySelector(':scope > .fh-sum-side');
    if (!box) { box = document.createElement('div'); box.className = 'fh-sum fh-sum-side'; col.appendChild(box); }
    return box;
  }
  function balance() {
    if (busy || editing) return;
    const c = cols(); if (!c || !c.L || !onHome()) return;
    busy = true; c.w.classList.add('fh-meas');
    try {
      const sum = restore(c); if (!sum || !wide()) return;
      const groups = () => [...sum.querySelectorAll(':scope > .fh-grp')];
      for (let guard = 0; guard < 8 && groups().length > 1; guard++) {
        const hL = colH(c.L), hC = colH(c.C), hR = colH(c.R), before = Math.max(hL, hC, hR);
        if (hC <= Math.max(hL, hR) + 40) break;
        const g = groups().pop(), side = hL <= hR ? c.L : c.R, box = sideBox(side);
        g.classList.add('fh-grp-side'); box.insertBefore(g, box.firstChild);
        const after = Math.max(colH(c.L), colH(c.C), colH(c.R));
        if (after >= before - 10) { /* pas mieux : on remet et on s’arrête */
          g.classList.remove('fh-grp-side'); sum.appendChild(g); if (!box.children.length) box.remove(); break;
        }
      }
    } catch (e) { console.warn(e); } finally { c.w.classList.remove('fh-meas'); busy = false; quiet = Date.now() + 500; }
  }
  let t = null, quiet = 0;
  const later = (ms) => { clearTimeout(t); t = setTimeout(() => { if (onHome()) { applyLayout(); balance(); quiet = Date.now() + 500; } }, ms || 250); };
  /* nos propres déplacements déclenchent aussi l’observateur : on les ignore pendant un court instant */
  if (window.ftOnDom) window.ftOnDom(() => { if (onHome() && !busy && Date.now() > quiet) later(); });
  addEventListener('resize', () => later(300));
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#view-home .fh-rep h3, #view-home .fh-rg, #view-home details summary')) later(120); });
  setTimeout(() => later(50), 1500);

  /* ---------- Mode « Personnaliser l’accueil » ---------- */
  let editing = false, work = null;
  function bar() {
    let b = $('fh-editbar');
    if (!b) { b = document.createElement('div'); b.id = 'fh-editbar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Personnaliser l’accueil'); document.body.appendChild(b);
      b.addEventListener('click', e => { const x = e.target.closest('[data-he]'); if (!x) return; if (x.dataset.he === 'done') stop(true); else if (x.dataset.he === 'reset') { work = JSON.parse(JSON.stringify(DEF)); setLay(null); paint(); toast('Disposition d’origine rétablie', 'info'); } else if (x.dataset.he === 'cancel') stop(false); }); }
    b.innerHTML = '<span>✏️ <b>Personnaliser l’accueil</b> : déplacez les tuiles (flèches ou glisser), masquez celles qui ne vous servent pas.</span><div><button type="button" data-he="reset">Disposition d’origine</button><button type="button" data-he="cancel">Annuler</button><button type="button" data-he="done" class="pri">Terminé</button></div>';
    b.hidden = false;
  }
  function paint() {
    const c = cols(); if (!c) return;
    c.w.querySelectorAll('.fh-edtools').forEach(x => x.remove());
    ['L', 'C', 'R'].forEach(side => work[side].forEach((k, i) => {
      const e = el(c, k); if (!e) return;
      e.classList.add('fh-editing'); e.classList.toggle('fh-off', work.hidden.includes(k));
      const d = CARDS.find(x => x[0] === k);
      const tb = document.createElement('div'); tb.className = 'fh-edtools';
      tb.innerHTML = '<span class="fh-drag" title="Glisser pour déplacer" aria-hidden="true">⠿</span><b>' + esc(d[1]) + '</b>' +
        '<button type="button" data-hm="up" aria-label="Monter ' + esc(d[1]) + '"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-hm="down" aria-label="Descendre ' + esc(d[1]) + '"' + (i < work[side].length - 1 ? '' : ' disabled') + '>↓</button>' +
        (wide() ? '<button type="button" data-hm="left" aria-label="Colonne de gauche"' + (side === 'L' ? ' disabled' : '') + '>←</button><button type="button" data-hm="right" aria-label="Colonne de droite"' + (side === 'R' ? ' disabled' : '') + '>→</button>' : '') +
        '<button type="button" data-hm="eye" aria-pressed="' + !work.hidden.includes(k) + '" aria-label="' + (work.hidden.includes(k) ? 'Afficher ' : 'Masquer ') + esc(d[1]) + '">' + (work.hidden.includes(k) ? '🙈 Masquée' : '👁 Affichée') + '</button>';
      tb.dataset.k = k; e.insertBefore(tb, e.firstChild);
    }));
  }
  function start() {
    if (!onHome()) { try { switchNavTab('home'); } catch (e) {} }
    editing = true; work = JSON.parse(JSON.stringify(getLay() || DEF));
    CARDS.forEach(([k]) => { if (!['L', 'C', 'R'].some(s => work[s].includes(k))) work.C.push(k); });
    document.documentElement.classList.add('fh-edit-on');
    restore(cols());
    setLay(work); applyLayout(); paint(); bar();
  }
  let saved = null;
  function stop(keep) {
    editing = false; document.documentElement.classList.remove('fh-edit-on');
    const c = cols(); if (c) { c.w.querySelectorAll('.fh-edtools').forEach(x => x.remove()); c.w.querySelectorAll('.fh-editing').forEach(x => x.classList.remove('fh-editing', 'fh-off')); }
    if (keep) { setLay(JSON.stringify(work) === JSON.stringify(DEF) ? null : work); toast('Accueil enregistré (sur tous vos postes une fois connecté)', 'success'); }
    else setLay(saved);
    const b = $('fh-editbar'); if (b) b.hidden = true;
    applyLayout(); later(60);
  }
  window.ftHomeEdit = () => { saved = getLay(); start(); };
  function move(k, how) {
    const side = ['L', 'C', 'R'].find(s => work[s].includes(k)), list = work[side], i = list.indexOf(k);
    if (how === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
    else if (how === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
    else if (how === 'left' || how === 'right') { const ns = how === 'left' ? (side === 'R' ? 'C' : 'L') : (side === 'L' ? 'C' : 'R'); if (ns !== side) { list.splice(i, 1); work[ns].push(k); } }
    else if (how === 'eye') { const h = work.hidden; const j = h.indexOf(k); if (j >= 0) h.splice(j, 1); else h.push(k); }
    setLay(work); applyLayout(); paint();
    const b = document.querySelector('.fh-edtools[data-k="' + k + '"] [data-hm="' + how + '"]'); if (b && !b.disabled) b.focus();
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.fh-edtools [data-hm]'); if (!b || !editing) return; e.preventDefault(); e.stopPropagation(); move(b.parentNode.dataset.k, b.dataset.hm); }, true);
  /* Glisser-déposer (souris ou doigt) par la poignée ⠿ */
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest && e.target.closest('.fh-edtools .fh-drag'); if (!h || !editing) return;
    e.preventDefault(); const card = h.closest('[data-hk]'); if (!card) return;
    const r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true); ghost.classList.add('fh-ghost'); ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost);
    card.classList.add('fh-dragging');
    drag = { k: card.dataset.hk, card, ghost, dx: e.clientX - r.left, dy: e.clientY - r.top };
    h.setPointerCapture && h.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.ghost.style.left = (e.clientX - drag.dx) + 'px'; drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
    const c = cols(); if (!c) return;
    let side = 'C';
    if (wide()) { const x = e.clientX; const rl = c.L.getBoundingClientRect(), rr = c.R.getBoundingClientRect(); side = x < rl.right ? 'L' : x > rr.left ? 'R' : 'C'; }
    else side = ['L', 'C', 'R'].find(s => work[s].includes(drag.k));
    const list = work[side].filter(k => k !== drag.k), es = list.map(k => el(c, k));
    let at = list.length; for (let i = 0; i < es.length; i++) { const b = es[i] && es[i].getBoundingClientRect(); if (b && e.clientY < b.top + b.height / 2) { at = i; break; } }
    drag.target = { side, at };
    const ref = es[at];
    c.w.querySelectorAll('.fh-drop').forEach(x => x.classList.remove('fh-drop'));
    if (ref) ref.classList.add('fh-drop'); else c[side].classList.add('fh-drop');
  });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag; drag = null; d.ghost.remove(); d.card.classList.remove('fh-dragging');
    const c = cols(); if (c) c.w.querySelectorAll('.fh-drop').forEach(x => x.classList.remove('fh-drop'));
    if (!d.target) return;
    ['L', 'C', 'R'].forEach(s => { const i = work[s].indexOf(d.k); if (i >= 0) work[s].splice(i, 1); });
    work[d.target.side].splice(d.target.at, 0, d.k);
    setLay(work); applyLayout(); paint();
  });
  /* Accès : bas de l’accueil, Paramètres, recherche */
  function footLink() {
    const f = document.querySelector('#view-home .home-foot'); if (!f || f.querySelector('.fh-custom')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fh-custom'; b.textContent = '✏️ Personnaliser l’accueil';
    b.onclick = () => window.ftHomeEdit(); f.appendChild(b);
  }
  if (window.ftOnDom) window.ftOnDom(footLink);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Personnaliser l’accueil', s: 'Choisir et déplacer les tuiles de la page d’accueil', kw: 'personnaliser accueil tuiles déplacer masquer organiser disposition colonnes', run: () => window.ftHomeEdit() });
  window.ftHomeBalance = () => later(10);
})();
