  var __ftUser = null, __storageOK = true;
  try { window.localStorage.setItem('__ft_t', '1'); window.localStorage.removeItem('__ft_t'); } catch (e) { __storageOK = false; }
  // Reprise unique des données enregistrées par compte (ancienne connexion) vers le stockage simple
  try {
    if (__storageOK && !window.localStorage.getItem('ft_nologin_migrated')) {
      var __us = JSON.parse(window.localStorage.getItem('ft_users') || '[]');
      if (Array.isArray(__us) && __us.length) {
        var __sid = null;
        try { __sid = window.sessionStorage.getItem('ft_session'); } catch (e) {}
        if (!__sid) __sid = window.localStorage.getItem('ft_session');
        var __pick = __us.filter(function (u) { return u && u.id === __sid; })[0] || __us[0];
        var __pre = 'u:' + __pick.id + ':';
        var __keys = [];
        for (var __i = 0; __i < window.localStorage.length; __i++) __keys.push(window.localStorage.key(__i));
        __keys.forEach(function (k) {
          if (k && k.indexOf(__pre) === 0) window.localStorage.setItem(k.slice(__pre.length), window.localStorage.getItem(k));
        });
      }
      window.localStorage.setItem('ft_nologin_migrated', '1');
    }
  } catch (e) {}
  function __ftKey(k) { return k; }
  var safeLS = {
    getItem: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    setItem: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} },
    removeItem: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  };
  function ftLogoFallback(img) {
    var src = img.getAttribute('src') || '';
    if (/\.svg$/i.test(src)) { img.setAttribute('src', src.replace(/\.svg$/i, '.png')); return; }
    var w = document.createElement('span');
    w.className = 'ft-wordmark';
    w.innerHTML = 'France <i>Travail</i>';
    img.replaceWith(w);
  }
