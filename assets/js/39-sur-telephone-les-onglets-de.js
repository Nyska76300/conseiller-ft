(function () {
  /* Sur téléphone, les onglets de la rubrique défilent sur une ligne et les modes (Simulateur / Règles…) passent sur la ligne suivante, en entier */
  function wrap() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      if (bar.querySelector(':scope > .hub-chips')) return;
      const box = document.createElement('div'); box.className = 'hub-chips';
      [...bar.children].filter(c => c.classList.contains('hub-tab') || c.classList.contains('hub-name')).forEach(c => box.appendChild(c));
      bar.insertBefore(box, bar.firstChild);
    });
  }
  function center() {
    if (innerWidth > 640) return;
    document.querySelectorAll('[id^="view-"]:not(.hidden) .hub-chips').forEach(box => {
      const on = box.querySelector('.hub-tab.is-on'); if (!on) return;
      box.scrollLeft = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
    });
  }
  wrap();
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(() => { wrap(); center(); }, 30); return r; };
  if (window.ftOnDom) window.ftOnDom(wrap);
  setTimeout(() => { wrap(); center(); }, 500);
})();
