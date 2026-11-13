(function () {
  /* Lien d’évitement : aller directement au contenu de l’outil ouvert */
  const a = document.createElement('a'); a.id = 'ft-skip'; a.href = '#'; a.textContent = 'Aller au contenu';
  a.addEventListener('click', e => {
    e.preventDefault();
    const v = document.querySelector('[id^="view-"]:not(.hidden):not(.ft-split-b)'); if (!v) return;
    const t = v.querySelector('h1,h2,h3,[tabindex],input,select,button') || v;
    if (!t.hasAttribute('tabindex') && !/INPUT|SELECT|BUTTON|A|TEXTAREA/.test(t.tagName)) t.setAttribute('tabindex', '-1');
    t.focus();
  });
  document.body.insertBefore(a, document.body.firstChild);
  const main = document.querySelector('main') || (document.querySelector('[id^="view-"]') || {}).parentElement;
  if (main && !main.getAttribute('role') && main.tagName !== 'MAIN') main.setAttribute('role', 'main');

  /* Noms accessibles : relie chaque champ à son libellé, nomme les boutons à icône */
  const named = e => (e.labels && e.labels.length) || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title;
  let uid = 0;
  function fix(root) {
    const MAP = { 'indus-range-duree': 'Nombre de mensualités (curseur)', 'retraite-input-statut-pension': 'Statut de la pension de retraite' };
    Object.keys(MAP).forEach(id => { const e = document.getElementById(id); if (e && !named(e)) e.setAttribute('aria-label', MAP[id]); });
    (root || document).querySelectorAll('input:not([type=hidden]):not([data-a11y]),select:not([data-a11y]),textarea:not([data-a11y])').forEach(e => {
      e.setAttribute('data-a11y', '1');
      if (named(e)) return;
      let lb = null;
      const prev = e.previousElementSibling; if (prev && prev.tagName === 'LABEL') lb = prev;
      for (let p = e.parentElement, n = 0; !lb && p && n < 3; p = p.parentElement, n++) { const l = p.querySelector(':scope > label'); if (l && !l.htmlFor && !l.contains(e)) lb = l; }
      if (lb && !lb.htmlFor) { if (!e.id) e.id = 'ft-f' + (++uid); lb.htmlFor = e.id; return; }
      const t = (lb && lb.textContent) || e.placeholder || (e.closest('[data-label]') || {}).dataset && e.closest('[data-label]') && e.closest('[data-label]').dataset.label;
      if (t && String(t).trim()) e.setAttribute('aria-label', String(t).trim().slice(0, 120));
    });
    (root || document).querySelectorAll('button:not([aria-label]):not([data-a11y]),[role=button]:not([aria-label]):not([data-a11y])').forEach(b => {
      b.setAttribute('data-a11y', '1');
      if ((b.textContent || '').trim()) return;
      if (b.title) { b.setAttribute('aria-label', b.title); return; }
      const ic = b.querySelector('[data-lucide]'); if (ic) b.setAttribute('aria-label', ic.getAttribute('data-lucide').replace(/-/g, ' '));
    });
    /* Onglets de rubrique : indiquer l’outil courant */
    (root || document).querySelectorAll('svg:not([aria-hidden]):not([role])').forEach(s => { if (s.closest('button,a')) s.setAttribute('aria-hidden', 'true'); });
  }
  /* Annonces des messages flash aux lecteurs d’écran */
  const live = document.createElement('div'); live.className = 'ft-sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
  if (typeof showToast === 'function') {
    const _t = showToast;
    window.showToast = showToast = function (m) { try { live.textContent = ''; setTimeout(() => { live.textContent = String(m); }, 30); } catch (e) {} return _t.apply(this, arguments); };
  }
  fix();
  if (window.ftOnDom) window.ftOnDom(() => fix());
})();
