(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const logged = () => !!(window.ftLoggedIn && window.ftLoggedIn());
  const pk = () => { try { return localStorage.getItem('ft_push_pk') || ''; } catch (e) { return ''; } };
  const can = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const u8 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - s.length % 4) % 4); const b = atob(s); return Uint8Array.from(b, c => c.charCodeAt(0)); };

  async function subscribe() {
    if (!can() || !logged() || !pk() || Notification.permission !== 'granted') return;
    try { if (localStorage.getItem('ft_notif') !== '1') return; } catch (e) {}
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      const key = u8(pk());
      if (sub && sub.options && sub.options.applicationServerKey) {
        const cur = new Uint8Array(sub.options.applicationServerKey);
        if (cur.length !== key.length || cur.some((v, i) => v !== key[i])) { await sub.unsubscribe(); sub = null; }
      }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const j = sub.toJSON();
      await window.__ftRest('/rest/v1/push_subs', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, ua: navigator.userAgent.slice(0, 120) } });
      try { localStorage.setItem('ft_push_ok', j.endpoint.slice(-24)); } catch (e) {}
    } catch (e) { console.warn('push', e); }
  }
  async function unsubscribe() {
    if (!can()) return;
    try {
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { const ep = sub.endpoint; await sub.unsubscribe(); if (logged()) window.__ftRest('/rest/v1/push_subs?endpoint=eq.' + encodeURIComponent(ep), { method: 'DELETE' }).catch(() => {}); }
      try { localStorage.removeItem('ft_push_ok'); } catch (e) {}
    } catch (e) {}
  }
  /* Branché sur le bouton « Activer / désactiver les notifications » */
  const _en = window.ftEnableNotifs;
  if (_en) window.ftEnableNotifs = function () {
    const r = _en.apply(this, arguments);
    setTimeout(() => { if (window.ftNotifOn && window.ftNotifOn()) subscribe(); else unsubscribe(); }, 1500);
    return r;
  };
  document.addEventListener('ft-push', () => subscribe());
  setTimeout(subscribe, 5000);

  /* Envoi (administrateur) */
  window.ftPushSend = function (p) {
    if (!isAdmin() || !window.__ftRest) return Promise.resolve(null);
    return window.__ftRest('/functions/v1/send-push', { method: 'POST', body: p });
  };

  /* Carte de l’Espace administrateur */
  function card(c) {
    return c('🔔', 'Notifications push', '', '<div id="pu-body"><p class="ad-empty">Chargement…</p></div>');
  }
  function load() {
    const h = $('pu-body'); if (!h) return;
    const head = '<p class="ad-empty">Arrivent sur les téléphones et ordinateurs des conseillers qui ont activé les notifications, même appli fermée (iPhone : appli installée sur l’écran d’accueil).</p>';
    if (!pk()) {
      h.innerHTML = head + '<p class="ad-empty"><b>Étape 1 :</b> générer les clés d’envoi (à faire une seule fois).</p><div class="ad-row"><button type="button" class="ad-btn pri" data-pu="keys">Générer les clés</button></div><div id="pu-keys"></div>';
      return;
    }
    window.ftPushSend({ action: 'status' }).then(st => {
      h.innerHTML = head + '<table class="ad-tbl"><tr><td>Service d’envoi</td><td class="n">' + (st && st.configured ? '✅ prêt' : '⚠️ clés à ajouter dans Supabase') + '</td></tr><tr><td>Appareils abonnés</td><td class="n">' + ((st && st.subscribers) || 0) + '</td></tr></table>' +
        '<textarea class="ad-in" id="pu-txt" maxlength="180" placeholder="Message à envoyer à tous les conseillers abonnés" style="margin-top:8px"></textarea>' +
        '<div class="ad-row" style="margin-top:8px;flex-wrap:wrap;gap:8px"><button type="button" class="ad-btn pri" data-pu="all">Envoyer à tous</button><button type="button" class="ad-btn" data-pu="me">Envoyer un test (à moi)</button><button type="button" class="ad-btn" data-pu="keys">Régénérer les clés</button></div>' +
        '<p class="ad-empty" style="margin-top:6px">Envoyés automatiquement : annonce publiée, mise à jour réglementaire diffusée (tous) ; mise à jour à valider (vous, via GitHub).</p><div id="pu-keys"></div>';
    }).catch(e => {
      h.innerHTML = head + '<p class="ad-empty">⚠️ Service d’envoi non installé ou inaccessible (' + esc(e && e.message || e) + '). Suivez les étapes : script supabase/push.sql, fonction « send-push », secrets VAPID.</p><div class="ad-row"><button type="button" class="ad-btn" data-pu="keys">Voir / régénérer les clés</button></div><div id="pu-keys"></div>';
    });
  }
  async function genKeys() {
    if (pk() && !confirm('Régénérer les clés désabonne tous les appareils : chacun devra réactiver les notifications. Continuer ?')) return;
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), priv = (await crypto.subtle.exportKey('jwk', kp.privateKey)).d;
    await window.__ftSaveShared('__ft_push', { publicKey: pub });
    try { localStorage.setItem('ft_push_pk', pub); } catch (e) {}
    const out = $('pu-keys'); if (!out) return;
    out.innerHTML = '<div class="inv-out" style="display:block"><p class="ad-empty"><b>Copiez ces deux clés dans Supabase</b> (Edge Functions → Secrets), puis fermez cette fenêtre : la clé privée n’est affichée qu’une fois et n’est enregistrée nulle part ailleurs.</p>' +
      '<p class="ad-empty" style="margin-top:6px">VAPID_PUBLIC_KEY</p><code>' + esc(pub) + '</code><div class="ad-row" style="margin:4px 0 8px"><button type="button" class="ad-btn" data-pu="copy" data-v="' + esc(pub) + '">Copier</button></div>' +
      '<p class="ad-empty">VAPID_PRIVATE_KEY (secrète)</p><code>' + esc(priv) + '</code><div class="ad-row" style="margin-top:4px"><button type="button" class="ad-btn" data-pu="copy" data-v="' + esc(priv) + '">Copier</button></div></div>';
    toast('Clés générées : copiez-les dans Supabase', 'success');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pu]'); if (!b || !isAdmin()) return;
    const a = b.dataset.pu;
    if (a === 'copy') { navigator.clipboard.writeText(b.dataset.v).then(() => toast('Copié', 'success')); return; }
    if (a === 'keys') { genKeys().catch(er => toast('Génération impossible : ' + er.message, 'error')); return; }
    if (a === 'me' || a === 'all') {
      const txt = (($('pu-txt') || {}).value || '').trim();
      if (a === 'all' && !txt) return toast('Écrivez le message à envoyer', 'info');
      if (a === 'all' && !confirm('Envoyer cette notification à tous les conseillers abonnés ?')) return;
      window.ftPushSend(a === 'me' ? { audience: 'me', title: 'Test de notification', body: 'Les notifications push fonctionnent sur cet appareil.', go: 'home', tag: 'ft-test' } : { title: 'Espace Conseiller', body: txt, go: 'home', tag: 'ft-msg' })
        .then(r => toast(r ? (r.sent + ' notification(s) envoyée(s)' + (r.gone ? ', ' + r.gone + ' appareil(s) désabonné(s)' : '')) : 'Envoyé', 'success'))
        .catch(er => toast('Envoi impossible : ' + er.message, 'error'));
    }
  });
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function (c) {
    try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); }
    const B = $('ad-first-b');
    if (B && !$('ad-push')) { const h = document.createElement('div'); h.id = 'ad-push'; const ann = $('ad-annonce'); B.insertBefore(h, ann ? ann.nextSibling : B.firstChild); h.innerHTML = card(c); load(); }
  };
})();
