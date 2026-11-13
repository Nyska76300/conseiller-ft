(function () {
  /* Hors ligne complet : tous les fichiers du site sont gardés sur l’appareil dès la première visite
     (simulateurs, modèles, styles), et un repère discret signale l’absence de connexion. */
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };

  function files() {
    const out = new Set(['./', 'manifest.webmanifest', 'lucide.min.js', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'].map(p => new URL(p, location.href).href));
    document.querySelectorAll('script[src], link[rel="stylesheet"][href], link[rel~="icon"][href]').forEach(el => {
      const u = new URL(el.getAttribute('src') || el.getAttribute('href'), location.href);
      if (u.origin === location.origin) out.add(u.href);
    });
    return [...out];
  }
  function send() {
    navigator.serviceWorker.ready.then(reg => {
      const w = reg.active || navigator.serviceWorker.controller; if (w) w.postMessage({ ftCache: files() });
    }).catch(() => {});
  }
  window.addEventListener('load', () => setTimeout(send, 2500));
  navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(send, 500));

  /* Repère « Hors ligne » */
  let chip = null;
  function show(off) {
    if (!chip) {
      chip = document.createElement('div'); chip.id = 'ft-offline'; chip.setAttribute('role', 'status'); chip.setAttribute('aria-live', 'polite');
      chip.innerHTML = '<i></i><span>Hors ligne : simulateurs et modèles disponibles, synchronisation au retour du réseau</span>';
      document.body.appendChild(chip);
    }
    chip.hidden = !off;
    document.documentElement.classList.toggle('ft-is-offline', off);
  }
  window.addEventListener('offline', () => show(true));
  window.addEventListener('online', () => { show(false); toast('Connexion rétablie', 'success'); });
  const init = () => { if (!navigator.onLine) show(true); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
