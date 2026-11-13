(function () {
  /* Accueil sur ordinateur : disposition fixe
     gauche : Dossier en cours, Liens utiles, Repères
     centre : la recherche puis uniquement les simulateurs et outils
     droite : Mes favoris (et prochains rappels), CVM favoris, Quoi de neuf ?
     « Derniers calculs » n’est plus affiché sur l’accueil. */
  try { const p = JSON.parse(localStorage.getItem('ft_prefs') || '{}'); if (p && p.home) { delete p.home; localStorage.setItem('ft_prefs', JSON.stringify(p)); } } catch (e) {}
  let quiet = 0;
  function place() {
    const w = document.querySelector('#view-home > .home-wrap.fh-on'); if (!w) return;
    const L = w.querySelector(':scope > .fh-L'), C = w.querySelector(':scope > .fh-C'), R = w.querySelector(':scope > .fh-R'); if (!L || !C || !R) return;
    let moved = false;
    const put = (el, col, before) => { col.insertBefore(el, before || null); moved = true; };
    w.querySelectorAll('.fh-hist').forEach(x => { x.remove(); moved = true; });
    /* anciennes rubriques déplacées par la répartition automatique : on les remet au centre */
    const sum = C.querySelector(':scope > .fh-tools > .fh-sum');
    w.querySelectorAll('.fh-sum-side').forEach(box => { [...box.children].forEach(g => { g.classList.remove('fh-grp-side'); if (sum) sum.appendChild(g); }); box.remove(); moved = true; });
    const pins = w.querySelector('.fh-pins'), rem = document.getElementById('ft-rem-home'), top = w.querySelector('.home-top'), news = w.querySelector('.fh-news');
    if (pins && (pins.parentNode !== R || R.firstElementChild !== pins)) put(pins, R, R.firstElementChild);
    if (rem && (rem.parentNode !== R || (pins && rem.previousElementSibling !== pins))) put(rem, R, pins ? pins.nextElementSibling : R.firstElementChild);
    if (top && top.parentNode !== R) put(top, R);
    if (news && news.parentNode !== R) put(news, R);
    if (moved) quiet = Date.now() + 400;
  }
  /* nos propres déplacements déclenchent aussi l’observateur : on les ignore un court instant */
  if (window.ftOnDom) window.ftOnDom(() => { if (Date.now() > quiet) place(); });
  setTimeout(place, 300); setTimeout(place, 1500);
})();
