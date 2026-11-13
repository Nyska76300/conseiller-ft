(function () {
  if (!/^https?:$/.test(location.protocol)) return; // fichier local : pas de vérification
  var meta = document.querySelector('meta[name="ft-version"]');
  var current = meta ? meta.content : '';
  var bar = document.getElementById('ft-update');
  var dismissed = '', latest = '', last = 0;

  // Après un rechargement forcé, on nettoie l'adresse (?v=...)
  try {
    var u = new URL(location.href);
    if (u.searchParams.has('v')) { u.searchParams.delete('v'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  } catch (e) {}

  function show() { bar.hidden = false; requestAnimationFrame(function () { bar.classList.add('show'); }); try { if (window.ftNotify && latest && localStorage.getItem('ft_ver_notified') !== latest) { localStorage.setItem('ft_ver_notified', latest); window.ftNotify('Nouvelle version de l’Espace Conseiller', 'Touchez pour recharger et voir les nouveautés.', 'ft-ver', 'reload'); } } catch (e) {} }
  function hide() { bar.classList.remove('show'); setTimeout(function () { bar.hidden = true; }, 400); }

  function check() {
    if (Date.now() - last < 20000) return;
    last = Date.now();
    fetch(location.pathname + '?check=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        var m = html.match(/<meta name="ft-version" content="([^"]+)"/);
        if (!m || !current || m[1] === current || m[1] === dismissed) return;
        latest = m[1];
        /* Appli installée (iPhone, Android, Mac) : on recharge tout seul si rien n'est en cours de saisie */
        var app = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
        var ae = document.activeElement, typing = ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.value;
        if (app && !typing && !document.querySelector('.ft-mail textarea[data-edited]')) {
          try { if (window.showToast) showToast('Mise à jour de l’application…', 'info'); } catch (e) {}
          setTimeout(function () { location.replace(location.pathname + '?v=' + encodeURIComponent(latest) + location.hash); }, 900);
          return;
        }
        show();
      })
      .catch(function () {}); // hors ligne : on réessaiera plus tard
  }

  bar.querySelector('.ftu-go').addEventListener('click', function () {
    // L'adresse change pour éviter que le navigateur ressorte l'ancienne copie
    location.replace(location.pathname + '?v=' + encodeURIComponent(latest || Date.now()) + location.hash);
  });
  bar.querySelector('.ftu-x').addEventListener('click', function () { dismissed = latest; hide(); });

  setTimeout(check, 4000);
  setInterval(check, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('online', check);
})();
