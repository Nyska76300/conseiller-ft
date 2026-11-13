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

  /* ---------- Mise à jour automatique, sans action du conseiller ----------
     Dès qu’une nouvelle version est en ligne, elle est appliquée au premier moment calme
     (onglet en arrière-plan, ou aucune saisie depuis 20 s) ; l’outil ouvert, les champs
     remplis et la position dans la page sont remis en place après la mise à jour. */
  var KEY = 'ft_upd_state', lastAct = Date.now(), waitSince = 0, timer = null;
  ['keydown', 'input', 'pointerdown', 'wheel', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true, capture: true }); });
  function busy() {
    var ae = document.activeElement;
    if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.value && Date.now() - lastAct < 60000) return true;
    if (document.querySelector('.ft-mail textarea[data-edited]')) return true;
    var dlg = [].slice.call(document.querySelectorAll('[role="dialog"], #ft-auth, #ft-ip')).some(function (d) { return !d.hidden && !d.classList.contains('hidden') && d.offsetParent !== null && getComputedStyle(d).display !== 'none'; });
    if (dlg) return true;
    try { if (window.speechSynthesis && speechSynthesis.speaking) return true; } catch (e) {}
    return Date.now() - lastAct < 20000;
  }
  function view() { return document.querySelector('[id^="view-"]:not(.hidden):not(.ft-split-b)'); }
  function scroller(v) { if (!v) return null; if (v.scrollHeight > v.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(v).overflowY)) return v; var c = [].slice.call(v.querySelectorAll('.overflow-y-auto')).filter(function (x) { return x.offsetParent && x.scrollTop > 0; }); return c[0] || v.querySelector('.overflow-y-auto'); }
  function saveState() {
    var v = view(), st = { at: Date.now(), ver: latest, tab: (function () { try { return String(activeNavTab); } catch (e) { return ''; } })(), fields: {}, scroll: 0, tpl: (function () { try { return activeTemplateId; } catch (e) { return null; } })() };
    if (v) {
      [].slice.call(v.querySelectorAll('input[id], select[id], textarea[id]')).forEach(function (el) {
        if (el.type === 'password' || el.type === 'file') return;
        if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked !== el.defaultChecked) st.fields[el.id] = el.checked ? '__on' : '__off'; }
        else if (el.value !== el.defaultValue && String(el.value).length < 2000) st.fields[el.id] = el.value;
      });
      var sc = scroller(v); if (sc) { st.scroll = sc.scrollTop; st.scId = sc.id || ''; }
    }
    try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function apply() {
    clearTimeout(timer); timer = null;
    saveState();
    location.replace(location.pathname + '?v=' + encodeURIComponent(latest) + location.hash);
  }
  function waitCalm() {
    if (timer) return;
    if (!waitSince) waitSince = Date.now();
    (function loop() {
      if (document.hidden || !busy()) return apply();
      if (Date.now() - waitSince > 15 * 60 * 1000 && latest !== dismissed) show(); /* longtemps occupé : on propose quand même le bouton */
      timer = setTimeout(loop, 5000);
    })();
  }
  /* Après la mise à jour : on remet le conseiller là où il était */
  (function restore() {
    var st = null; try { st = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!st || Date.now() - st.at > 120000) return;
    window.__ftDeepLink = window.__ftDeepLink || 'restore';
    setTimeout(function () {
      try { if (st.tab && st.tab !== 'home') switchNavTab(/^\d+$/.test(st.tab) ? +st.tab : st.tab); } catch (e) {}
      setTimeout(function () {
        try { if (st.tpl != null && st.tab === 'cvm' && typeof selectTemplate === 'function') selectTemplate(st.tpl); } catch (e) {}
        Object.keys(st.fields || {}).forEach(function (id) {
          var el = document.getElementById(id); if (!el) return;
          var v = st.fields[id];
          if (v === '__on' || v === '__off') el.checked = v === '__on'; else el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        var sc = st.scId ? document.getElementById(st.scId) : scroller(view()); if (sc && st.scroll) sc.scrollTop = st.scroll;
        try { if (window.showToast) showToast('Site mis à jour automatiquement' + (current ? ' (version ' + current + ')' : ''), 'success'); } catch (e) {}
      }, 450);
    }, 1300);
  })();

  function check() {
    if (Date.now() - last < 20000) return;
    last = Date.now();
    fetch(location.pathname + '?check=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        var m = html.match(/<meta name="ft-version" content="([^"]+)"/);
        if (!m || !current || m[1] === current) return;
        latest = m[1];
        waitCalm();
      })
      .catch(function () {}); // hors ligne : on réessaiera plus tard
  }

  bar.querySelector('.ftu-go').addEventListener('click', function () {
    saveState();
    // L'adresse change pour éviter que le navigateur ressorte l'ancienne copie
    location.replace(location.pathname + '?v=' + encodeURIComponent(latest || Date.now()) + location.hash);
  });
  bar.querySelector('.ftu-x').addEventListener('click', function () { dismissed = latest; hide(); });

  setTimeout(check, 4000);
  setInterval(function () { if (!document.hidden) check(); }, 3 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('online', check);
})();
