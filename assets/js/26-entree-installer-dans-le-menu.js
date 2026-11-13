(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) document.documentElement.classList.add('ft-app');
  window.ftInstallHelp = function () {
    let o = document.getElementById('ft-install');
    if (!o) {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const share = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
      const steps = ios
        ? ['Ouvrez ce site dans <b>Safari</b>.', 'Touchez le bouton <b>Partager</b> ' + share + ' en bas de l’écran.', 'Choisissez <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.']
        : ['Ouvrez le menu du navigateur (<b>⋮</b>).', 'Choisissez <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.', 'Confirmez.'];
      o = document.createElement('div'); o.id = 'ft-install';
      o.innerHTML = '<div class="fi-box" role="dialog" aria-label="Installer l’application"><h3><img src="icons/apple-touch-icon.png" alt="">Installer sur l’écran d’accueil</h3><ol>' +
        steps.map((t, i) => '<li><span class="n">' + (i + 1) + '</span><span>' + t + '</span></li>').join('') +
        '</ol><button type="button">J’ai compris</button></div>';
      o.addEventListener('click', e => { if (e.target === o || e.target.tagName === 'BUTTON') o.classList.remove('on'); });
      document.body.appendChild(o);
    }
    o.classList.add('on');
  };
  // Entrée « Installer » dans le menu ⋯ (seulement quand le site n'est pas déjà installé)
  function addItem() {
    const m = document.getElementById('ft-more'); if (!m) return setTimeout(addItem, 300);
    if (standalone || m.querySelector('[data-k="install"]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'install';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/></svg><span>Installer sur l’écran d’accueil</span>';
    b.addEventListener('click', e => { e.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); setTimeout(window.ftInstallHelp, 30); });
    m.insertBefore(b, m.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addItem); else addItem();
})();
