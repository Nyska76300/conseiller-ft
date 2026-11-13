(function () {
  /* Accueil sur ordinateur (3 colonnes) : les rubriques d’outils sont réparties automatiquement entre les colonnes
     pour qu’elles finissent à peu près à la même hauteur, sans vide dans les colonnes de côté.
     */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const onHome = () => { try { return String(activeNavTab) === 'home'; } catch (e) { return false; } };
  const wide = () => innerWidth >= 1200;
  const cols = () => { const w = document.querySelector('#view-home > .home-wrap.fh-on'); return w ? { w, L: w.querySelector(':scope > .fh-L'), C: w.querySelector(':scope > .fh-C'), R: w.querySelector(':scope > .fh-R') } : null; };

  /* La personnalisation de l’accueil a été retirée : on efface une disposition enregistrée auparavant */
  try { const p = JSON.parse(localStorage.getItem('ft_prefs') || '{}'); if (p && p.home) { delete p.home; localStorage.setItem('ft_prefs', JSON.stringify(p)); } } catch (e) {}
  const editing = false;
  document.querySelectorAll('#view-home [data-hk]').forEach(x => { x.style.order = ''; });

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
  const later = (ms) => { clearTimeout(t); t = setTimeout(() => { if (onHome()) { balance(); quiet = Date.now() + 500; } }, ms || 250); };
  /* nos propres déplacements déclenchent aussi l’observateur : on les ignore pendant un court instant */
  if (window.ftOnDom) window.ftOnDom(() => { if (onHome() && !busy && Date.now() > quiet) later(); });
  addEventListener('resize', () => later(300));
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#view-home .fh-rep h3, #view-home .fh-rg, #view-home details summary')) later(120); });
  setTimeout(() => later(50), 1500);

  window.ftHomeBalance = () => later(10);
})();
