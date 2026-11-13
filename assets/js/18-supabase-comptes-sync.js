(function () {
  'use strict';
  var SB_URL = 'https://rzjfiikdpjwzrfmlugpq.supabase.co';
  var SB_KEY = 'sb_publishable_TBxXU2fK-AZU5pab-bULiQ_bbTjrO4N';
  if (window.__FT_SB_URL) SB_URL = window.__FT_SB_URL; // tests
  if (!SB_URL || !SB_KEY || !window.fetch) return;

  // Données synchronisées (aucune donnée de dossier ou d'allocataire)
  var SYNC = ['ft_prefs', 'ft_links', 'ft_deleted_tpl', 'ft_templates', 'ft_favorites', 'ft_categories_list', 'ft_recent_templates', 'ft_sort_mode', 'ft_cat_sort_mode', 'ft_theme', 'ft_settings', 'ft_a11y', 'ft_tool_use', 'ft_bareme_ack', 'ft_pins', 'ft_menu_favs', 'ft_tour_done'];
  var K_SESS = 'ft_sb_session', K_META = 'ft_sb_meta';
  var LSraw = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function jget(k, d) { try { var v = JSON.parse(LSraw.get(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { LSraw.set(k, JSON.stringify(v)); }
  var sess = jget(K_SESS, null);
  var meta = jget(K_META, {}); // { uid, lastSync, dirty }
  var status = 'off', lastOk = null, isAdmin = false, pushTimer = null, busy = false;
  function saveMeta() { jset(K_META, meta); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m, t) { try { showToast(m, t || 'info'); } catch (e) {} }

  /* ---------- Détection des modifications ---------- */
  if (window.safeLS) {
    var oSet = safeLS.setItem, oDel = safeLS.removeItem;
    safeLS.setItem = function (k, v) { var old = LSraw.get(k); oSet.call(safeLS, k, v); if (SYNC.indexOf(k) > -1 && old !== String(v)) changed(); };
    safeLS.removeItem = function (k) { var had = LSraw.get(k) != null; oDel.call(safeLS, k); if (SYNC.indexOf(k) > -1 && had) changed(); };
  }
  function changed() {
    if (!sess) return;
    meta.dirty = true; saveMeta(); setStatus('busy');
    clearTimeout(pushTimer); pushTimer = setTimeout(function () { sync('push'); }, 800);
  }

  /* ---------- Appels Supabase ---------- */
  function api(path, opt) {
    opt = opt || {};
    var h = { apikey: SB_KEY, 'Content-Type': 'application/json' };
    if (opt.auth !== false && sess) h.Authorization = 'Bearer ' + sess.access_token;
    if (opt.prefer) h.Prefer = opt.prefer;
    return fetch(SB_URL + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined, keepalive: !!opt.keepalive })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) { var er = new Error((d && (d.msg || d.error_description || d.message || d.error)) || ('HTTP ' + r.status)); er.status = r.status; er.code = d && (d.error_code || d.code); throw er; }
          return d;
        });
      });
  }
  function incomplete(u) { return !u || !u.first || !u.last || !u.agence; }
  function userOf(u) { var m = (u && u.user_metadata) || {}; return { id: u.id, email: u.email, first: m.first_name || '', last: m.last_name || '', agence: m.agence || '', name: m.full_name || [m.first_name, m.last_name].filter(Boolean).join(' ') }; }
  function capName(t) { return String(t || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, function (a, b, c) { return b + c.toUpperCase(); }); }
  function keepSession(d) {
    sess = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)), user: userOf(d.user) };
    jset(K_SESS, sess);
  }
  function ensureToken() {
    if (!sess) return Promise.reject(new Error('no-session'));
    if (sess.expires_at - 90 > Date.now() / 1000) return Promise.resolve();
    return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: sess.refresh_token } })
      .then(function (d) { keepSession(d); })
      .catch(function (e) {
        if (e.status && e.status < 500) { sess = null; LSraw.del(K_SESS); setStatus('off'); showLogin('Votre session a expiré, reconnectez-vous.'); }
        throw e;
      });
  }
  function frErr(e) {
    var m = String(e && e.message || '');
    if (/invalid login|invalid_credentials|invalid grant/i.test(m + (e.code || ''))) return 'E-mail ou mot de passe incorrect.';
    if (/email not confirmed/i.test(m)) return 'Adresse e-mail pas encore confirmée.';
    if (/email rate limit|over_email_send_rate_limit/i.test(m + (e.code || ''))) return 'Trop d’e-mails envoyés en peu de temps (limite d’envoi de Supabase). Réessayez dans une heure, ou demandez à l’administrateur de créer votre compte.';
    if (/error sending|sending (confirmation|magic|recovery)|smtp|unexpected_failure/i.test(m + (e.code || ''))) return 'L’e-mail de confirmation n’a pas pu être envoyé. Réessayez plus tard ou contactez l’administrateur du site.';
    if (/rate limit|too many/i.test(m)) return 'Trop de tentatives, réessayez dans quelques minutes.';
    if (/password should be|weak/i.test(m)) return 'Mot de passe trop court (8 caractères minimum conseillés).';
    if (/failed to fetch|network/i.test(m)) return 'Connexion impossible : vérifiez votre accès à Internet.';
    return 'Erreur : ' + m;
  }

  /* ---------- Fusion (aucun modèle perdu) ---------- */
  function parse(v, d) { try { var x = JSON.parse(v); return x == null ? d : x; } catch (e) { return d; } }
  function merge(localData, remoteData) {
    var out = {}; SYNC.forEach(function (k) { out[k] = remoteData[k] != null ? remoteData[k] : localData[k]; });
    out.ft_pins = remoteData.ft_pins != null ? remoteData.ft_pins : '[]';
    out.ft_menu_favs = remoteData.ft_menu_favs != null ? remoteData.ft_menu_favs : '[]'; // « Mes outils » : propres à chaque compte, jamais repris d’un autre utilisateur du poste
    var dead = {}; parse(localData.ft_deleted_tpl, []).concat(parse(remoteData.ft_deleted_tpl, [])).forEach(function (id) { dead[id] = 1; });
    out.ft_deleted_tpl = JSON.stringify(Object.keys(dead));
    var lt = parse(localData.ft_templates, []), rt = parse(remoteData.ft_templates, []);
    if (lt.length || rt.length) {
      var seen = {}, res = [];
      rt.concat(lt).forEach(function (t) { if (t && t.id != null && !seen[t.id]) { seen[t.id] = 1; res.push(t); } });
      lt.forEach(function (t) { if (t && t.id != null) for (var i = 0; i < res.length; i++) if (res[i].id === t.id) { res[i] = t; break; } });
      out.ft_templates = JSON.stringify(res.filter(function (t) { return !dead[t.id]; }));
    }
    ['ft_favorites', 'ft_categories_list'].forEach(function (k) {
      var a = parse(remoteData[k], []), b = parse(localData[k], []);
      if (!Array.isArray(a) || !Array.isArray(b)) return;
      var u = a.slice(); b.forEach(function (x) { var js = JSON.stringify(x); if (!u.some(function (y) { return JSON.stringify(y) === js; })) u.push(x); });
      if (k === 'ft_favorites') u = u.filter(function (id) { return !dead[id]; });
      out[k] = JSON.stringify(u);
    });
    return out;
  }
  function collect() { var d = {}; SYNC.forEach(function (k) { var v = LSraw.get(k); if (v != null) d[k] = v; }); return d; }
  function applyData(d) { SYNC.forEach(function (k) { if (d[k] != null) LSraw.set(k, d[k]); }); }
  function same(a, b) { return SYNC.every(function (k) { return (a[k] == null ? null : a[k]) === (b[k] == null ? null : b[k]); }); }
  function refreshApp() {
    try { loadState(); } catch (e) {}
    purge();
    try { renderCategoryPills(); } catch (e) {}
    try { if (typeof activeTemplateId !== 'undefined' && activeTemplateId != null && !templates.some(function (t) { return t.id === activeTemplateId; })) activeTemplateId = templates.length ? templates[0].id : null; } catch (e) {}
    try { renderTemplatesList(); } catch (e) {}
    try { renderActiveTemplate(); } catch (e) {}
    try { window.dispatchEvent(new StorageEvent('storage', { key: 'ft_pins' })); } catch (e) {}
  }

  /* ---------- Synchronisation ---------- */
  function pull() {
    return api('/rest/v1/user_data?select=data,updated_at&user_id=eq.' + encodeURIComponent(sess.user.id)).then(function (r) { return r && r[0] || null; });
  }
  function push(data, keepalive) {
    var now = new Date().toISOString();
    return api('/rest/v1/user_data?on_conflict=user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', keepalive: keepalive, body: { user_id: sess.user.id, data: data, updated_at: now } })
      .then(function (r) { meta.lastSync = (r && r[0] && r[0].updated_at) || now; meta.dirty = false; meta.uid = sess.user.id; saveMeta(); });
  }
  function sync(mode) {
    if (!sess || busy) { if (busy && mode === 'push') { clearTimeout(pushTimer); pushTimer = setTimeout(function () { sync('push'); }, 1500); } return Promise.resolve(); }
    busy = true; setStatus('busy');
    var local = collect(), reload = false;
    return ensureToken().then(pull).then(function (remote) {
      var firstHere = meta.uid !== sess.user.id;
      if (!remote) return push(local); // premier envoi : reprise des modèles de ce poste
      var newer = !meta.lastSync || new Date(remote.updated_at) > new Date(meta.lastSync);
      var rd = remote.data || {};
      if (firstHere || (newer && meta.dirty)) {
        var m = merge(local, rd);
        applyData(m); reload = !same(m, local);
        return push(m);
      }
      if (newer) {
        applyData(rd); meta.lastSync = remote.updated_at; meta.uid = sess.user.id; saveMeta();
        reload = !same(collect(), local);
        return;
      }
      if (meta.dirty) return push(local);
    }).then(function () {
      busy = false; lastOk = new Date(); setStatus('ok');
      if (reload) {
        if (mode === 'start') { try { if (!sessionStorage.getItem('ft_sb_rl')) { sessionStorage.setItem('ft_sb_rl', '1'); location.reload(); return; } } catch (e) {} }
        refreshApp(); toast('Modèles mis à jour depuis votre compte', 'success');
      }
      try { sessionStorage.removeItem('ft_sb_rl'); } catch (e) {}
    }).catch(function (e) {
      busy = false;
      if (e && e.message === 'no-session') return;
      setStatus('err', frErr(e)); console.warn('Synchronisation :', e);
    });
  }
  function loadShared() {
    if (!sess) return;
    ensureToken().then(function () { return api('/rest/v1/shared_templates?select=id,template,updated_at'); }).then(function (rows) {
      if (!rows || !rows.length || typeof templates === 'undefined') return;
      var add = 0, upd = 0, dead = parse(LSraw.get('ft_deleted_tpl'), []);
      rows.forEach(function (r) {
        if (String(r.id).indexOf('__') === 0) { if (r.id === '__ft_push' && r.template) { try { if (r.template.publicKey && localStorage.getItem('ft_push_pk') !== r.template.publicKey) { localStorage.setItem('ft_push_pk', r.template.publicKey); document.dispatchEvent(new Event('ft-push')); } } catch (e) {} return; } if (r.id === '__ft_annonce' && r.template) { try { localStorage.setItem('ft_annonce', JSON.stringify(r.template)); document.dispatchEvent(new Event('ft-annonce')); } catch (e) {} return; } if (r.id === '__ft_regs' && r.template) { try { localStorage.setItem('ft_regs_dec', JSON.stringify(r.template.decisions || {})); document.dispatchEvent(new Event('ft-regs')); } catch (e) {} return; } if (r.id === '__ft_faq' && r.template && r.template.items) { try { localStorage.setItem('ft_faq', JSON.stringify(r.template.items)); document.dispatchEvent(new Event('ft-faq')); } catch (e) {} return; } if (r.id === '__ft_labels' && r.template && r.template.labels) { try { localStorage.setItem('ft_labels', JSON.stringify(r.template.labels)); if (window.ftApplyLabels) window.ftApplyLabels(); } catch (e) {} } return; }
        var t = r.template; if (!t || t.id == null || dead.indexOf(String(t.id)) > -1 || dead.indexOf(t.id) > -1) return;
        t.shared = true;
        var i = templates.findIndex(function (x) { return x.id === t.id; });
        if (i < 0) { templates.push(t); add++; }
        else if (JSON.stringify(templates[i]) !== JSON.stringify(t)) { templates[i] = t; upd++; }
      });
      if (add || upd) {
        try { if (typeof categoryList !== 'undefined') rows.forEach(function (r) { var c = r.template && r.template.category; if (c && !categoryList.some(function (x) { return (x && (x.id || x.name || x)) === c; })) {} }); } catch (e) {}
        try { saveState(); } catch (e) {}
        refreshApp();
        if (add) toast(add + ' modèle(s) commun(s) ajouté(s)', 'success');
      }
    }).catch(function () {});
    api('/rest/v1/app_admins?select=user_id&user_id=eq.' + encodeURIComponent(sess.user.id)).then(function (r) { isAdmin = !!(r && r.length); renderAcct(); try { document.dispatchEvent(new Event('ft-admin')); } catch (e) {} }).catch(function () {});
  }

  /* ---------- Réglages communs (administrateurs) ---------- */
  window.__ftIsAdmin = function () { return !!(sess && isAdmin); };
  window.__ftSaveLabels = function (labels) {
    if (!sess || !isAdmin) return Promise.reject(new Error('Réservé à l’administrateur'));
    return ensureToken().then(function () { return api('/rest/v1/shared_templates?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { id: '__ft_labels', template: { id: '__ft_labels', labels: labels }, updated_at: new Date().toISOString(), updated_by: sess.user.id } }); });
  };

  /* ---------- Modèles communs (administrateurs) ---------- */
  function currentTpl() { try { return templates.find(function (t) { return t.id === activeTemplateId; }) || null; } catch (e) { return null; } }
  window.ftSharePublish = function () {
    var t = currentTpl();
    if (!isAdmin) return toast('Réservé aux administrateurs', 'info');
    if (!t) return toast('Ouvrez d’abord un modèle dans l’onglet CVM', 'info');
    if (!confirm('Publier « ' + t.title + ' » pour tous les conseillers ?')) return;
    var c = JSON.parse(JSON.stringify(t)); c.shared = true;
    ensureToken().then(function () { return api('/rest/v1/shared_templates?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { id: String(t.id), template: c, updated_at: new Date().toISOString(), updated_by: sess.user.id } }); })
      .then(function () { toast('Modèle publié pour tous les conseillers', 'success'); }).catch(function (e) { toast(frErr(e), 'error'); });
  };
  window.ftShareRemove = function () {
    var t = currentTpl();
    if (!isAdmin || !t) return toast(isAdmin ? 'Ouvrez d’abord un modèle' : 'Réservé aux administrateurs', 'info');
    if (!confirm('Retirer « ' + t.title + ' » des modèles communs ? (il reste dans vos modèles)')) return;
    ensureToken().then(function () { return api('/rest/v1/shared_templates?id=eq.' + encodeURIComponent(String(t.id)), { method: 'DELETE' }); })
      .then(function () { toast('Modèle retiré des modèles communs', 'success'); }).catch(function (e) { toast(frErr(e), 'error'); });
  };

  /* ---------- Propositions de modèles par les collègues ---------- */
  var propCount = 0, propToastShown = false;
  function propErr(e) { var m = String(e && (e.message || e.code) || ''); return /template_proposals|does not exist|PGRST205|42P01|HTTP 404/.test(m) ? 'Les propositions ne sont pas encore activées : l’administrateur doit ajouter la table dans Supabase (voir supabase/schema.sql).' : frErr(e); }
  function loadProps() {
    if (!sess || !isAdmin) return Promise.resolve([]);
    return ensureToken().then(function () { return api('/rest/v1/template_proposals?select=id,template,note,proposer_email,created_at&order=created_at.asc'); })
      .then(function (r) {
        r = r || []; var before = propCount; propCount = r.length; renderAcct();
        try { document.dispatchEvent(new CustomEvent('ft-props', { detail: propCount })); } catch (e) {}
        if (propCount && !propToastShown) { propToastShown = true; toast(propCount + ' proposition(s) de modèle à valider : menu de votre compte', 'info'); }
        else if (propCount > before && before) toast('Nouvelle proposition de modèle', 'info');
        return r;
      });
  }
  setInterval(function () { if (sess && isAdmin && !document.hidden) loadProps().catch(function () {}); }, 120000);
  window.ftPropCount = function () { return propCount; };
  document.addEventListener('ft-admin', function () { if (isAdmin) loadProps().catch(function () {}); });
  window.__ftRest = function (path, opts) { if (!sess) return Promise.reject(new Error('non connecté')); return ensureToken().then(function () { return api(path, opts || {}); }); };
  /* Session renouvelée par la double vérification : on la garde et on revérifie les droits */
  window.__ftKeepSession = function (d) { keepSession(d); renderAcct(); loadShared(); };
  window.__ftAccess = function () { return sess ? sess.access_token : ''; };
  window.__ftAnon = function (path, o) { var x = { auth: false }; if (o) { x.method = o.method; x.body = o.body; x.prefer = o.prefer; } return api(path, x); };
  window.__ftUser = function () { return sess && sess.user ? { id: sess.user.id, email: sess.user.email } : null; };
  window.__ftSaveShared = function (id, payload) {
    if (!sess || !isAdmin) return Promise.reject(new Error('Réservé à l’administrateur'));
    var tpl = Object.assign({ id: id }, payload);
    return ensureToken().then(function () { return api('/rest/v1/shared_templates?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { id: id, template: tpl, updated_at: new Date().toISOString(), updated_by: sess.user.id } }); });
  };
  window.__ftRpc = function (name, body) { if (!sess) return Promise.reject(new Error('non connecté')); return ensureToken().then(function () { return api('/rest/v1/rpc/' + name, { method: 'POST', body: body || {} }); }); };
  window.ftPropose = function () {
    var t = currentTpl();
    if (!sess) return toast('Connectez-vous pour proposer un modèle à l’équipe', 'info');
    if (!t) return toast('Ouvrez d’abord un modèle dans la page Mails', 'info');
    if (isAdmin) return window.ftSharePublish();
    var note = prompt('Proposer « ' + t.title + ' » à l’administrateur pour qu’il soit ajouté aux modèles communs.\n\nUn mot d’explication (facultatif) :', '');
    if (note === null) return;
    var c = JSON.parse(JSON.stringify(t)); delete c.shared;
    ensureToken().then(function () { return api('/rest/v1/template_proposals', { method: 'POST', prefer: 'return=minimal', body: { template: c, note: note.trim() || null, proposer_email: sess.user.email, proposed_by: sess.user.id } }); })
      .then(function () { toast('Proposition envoyée à l’administrateur', 'success'); })
      .catch(function (e) { toast(propErr(e), 'error'); });
  };
  window.ftProposals = function () {
    if (!isAdmin) return toast('Réservé à l’administrateur', 'info');
    var w = document.getElementById('ft-props'); if (!w) { w = document.createElement('div'); w.id = 'ft-props'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
    w.innerHTML = '<div class="fp-box"><div class="fp-h"><h3>Propositions des collègues</h3><button type="button" class="fp-x" aria-label="Fermer">×</button></div><div class="fp-list"><p class="fp-empty">Chargement…</p></div></div>';
    w.classList.add('on');
    w.onclick = function (e) { if (e.target === w || e.target.closest('.fp-x')) w.classList.remove('on'); };
    var list = w.querySelector('.fp-list');
    function draw(rows) {
      if (!rows.length) { list.innerHTML = '<p class="fp-empty">Aucune proposition en attente.</p>'; return; }
      list.innerHTML = rows.map(function (r, i) {
        var t = r.template || {}, d = r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '';
        var exists = false; try { exists = templates.some(function (x) { return String(x.id) === String(t.id); }); } catch (e) {}
        return '<article class="fp-it" data-i="' + i + '"><div class="fp-t"><b>' + esc(t.title || 'Sans titre') + '</b><span>' + esc(t.category || '') + '</span></div>' +
          '<div class="fp-m">Proposé par ' + esc(r.proposer_email || 'un collègue') + (d ? ' le ' + d : '') + (exists ? ' · <em>modifie un modèle existant</em>' : ' · nouveau modèle') + '</div>' +
          (r.note ? '<div class="fp-n">« ' + esc(r.note) + ' »</div>' : '') +
          '<details><summary>Voir le texte</summary><pre>' + esc(t.body || '') + '</pre></details>' +
          '<div class="fp-b"><button type="button" data-a="no">Refuser</button><button type="button" data-a="ok" class="fp-ok">Publier pour tous</button></div></article>';
      }).join('');
      list.querySelectorAll('.fp-it button').forEach(function (b) {
        b.onclick = function () {
          var it = b.closest('.fp-it'), r = rows[+it.dataset.i], t = r.template || {}, ok = b.dataset.a === 'ok';
          b.disabled = true;
          var go = ok
            ? ensureToken().then(function () { var c = JSON.parse(JSON.stringify(t)); c.shared = true; return api('/rest/v1/shared_templates?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { id: String(t.id), template: c, updated_at: new Date().toISOString(), updated_by: sess.user.id } }); })
            : ensureToken();
          go.then(function () { return api('/rest/v1/template_proposals?id=eq.' + encodeURIComponent(r.id), { method: 'DELETE' }); })
            .then(function () { toast(ok ? '« ' + (t.title || 'Modèle') + ' » publié pour tous les conseillers' : 'Proposition refusée', 'success'); if (ok) loadShared(); return loadProps(); })
            .then(draw).catch(function (e) { b.disabled = false; toast(propErr(e), 'error'); });
        };
      });
    }
    loadProps().then(draw).catch(function (e) { list.innerHTML = '<p class="fp-empty">' + esc(propErr(e)) + '</p>'; });
  };

  /* ---------- Écran de connexion ---------- */
  function box(inner) {
    var w = document.getElementById('ft-auth');
    if (!w) { w = document.createElement('div'); w.id = 'ft-auth'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
    w.innerHTML = '<div class="fa-box"><div class="fa-logo fa-logo-img"><img src="assets/logo-france-travail.png" alt="France Travail" onerror="var p=this.parentNode;p.classList.remove(\'fa-logo-img\');p.innerHTML=\'France <i>Travail</i>\'"></div>' + inner + '</div>';
    return w;
  }
  function closeBox() { var w = document.getElementById('ft-auth'); if (w) w.remove(); }
  function msg(w, t, ok) { var m = w.querySelector('.fa-msg'); m.className = 'fa-msg ' + (ok ? 'ok' : 'err'); m.textContent = t; }
  function showLogin(note) {
    var w = box('<h2>Connexion</h2><p class="fa-sub">Espace Conseiller : vos modèles vous suivent sur tous les postes.</p>' +
      '<form><label for="fa-mail">E-mail</label><input id="fa-mail" type="email" autocomplete="username" required value="' + esc(meta.email || '') + '">' +
      '<label for="fa-pass">Mot de passe</label><input id="fa-pass" type="password" autocomplete="current-password" required>' +
      '<button class="fa-go" type="submit">Se connecter</button></form><div class="fa-msg"></div>' +
      '<div class="fa-links"><button type="button" data-a="forgot">Mot de passe oublié ?</button><button type="button" data-a="signup">Créer un compte</button><button type="button" data-a="skip">Continuer sans compte</button></div>' +
      '<p class="fa-note">Sans compte, les modèles restent enregistrés sur ce poste uniquement. Aucune donnée d’allocataire n’est synchronisée. Avec un compte, l’ouverture des outils est comptabilisée pour améliorer le site ; ces statistiques sont visibles par l’administrateur. <button type="button" class="fa-lnk" data-a="privacy">Confidentialité</button></p>');
    if (note) msg(w, note);
    (meta.email ? w.querySelector('#fa-pass') : w.querySelector('#fa-mail')).focus();
    w.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault();
      var b = w.querySelector('.fa-go'), email = w.querySelector('#fa-mail').value.trim();
      b.disabled = true; b.textContent = 'Connexion…';
      api('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: email, password: w.querySelector('#fa-pass').value } })
        .then(function (d) {
          keepSession(d); meta.email = email; saveMeta();
          try { sessionStorage.removeItem('ft_sb_skip'); } catch (e) {}
          closeBox(); renderAcct(); toast(sess.user.name ? 'Bonjour ' + (sess.user.first || sess.user.name) + ' !' : 'Connecté : ' + email, 'success');
          if (incomplete(sess.user)) setTimeout(function () { if (!document.getElementById('ft-auth')) showAccount(true); }, 1200);
          try { document.dispatchEvent(new Event('ft-login')); } catch (e) {}
          return sync('start').then(loadShared);
        })
        .catch(function (e) { b.disabled = false; b.textContent = 'Se connecter'; msg(w, frErr(e)); });
    };
    w.querySelector('[data-a="signup"]').onclick = function () { showSignup(w.querySelector('#fa-mail').value.trim()); };
    w.querySelector('[data-a="privacy"]').onclick = function () { if (window.ftPrivacy) window.ftPrivacy(); };
    w.querySelector('[data-a="skip"]').onclick = function () { try { sessionStorage.setItem('ft_sb_skip', '1'); } catch (e) {} closeBox(); renderAcct(); };
    w.querySelector('[data-a="forgot"]').onclick = function () {
      var email = w.querySelector('#fa-mail').value.trim();
      if (!email) { msg(w, 'Saisissez d’abord votre e-mail.'); return; }
      api('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', auth: false, body: { email: email } })
        .then(function () { msg(w, 'Si ce compte existe, un e-mail de réinitialisation vient d’être envoyé.', true); })
        .catch(function (e) { msg(w, frErr(e)); });
    };
  }
  function showSignup(prefill) {
    var w = box('<h2>Créer un compte</h2><p class="fa-sub">Vos modèles de mails, favoris et liens vous suivront sur tous les postes.</p>' +
      '<form><div class="fa-2"><div><label for="fa-sfirst">Prénom</label><input id="fa-sfirst" type="text" autocomplete="given-name" required maxlength="40"></div><div><label for="fa-slast">Nom</label><input id="fa-slast" type="text" autocomplete="family-name" required maxlength="40"></div></div>' +
      '<label for="fa-sag">Agence de rattachement</label><input id="fa-sag" type="text" autocomplete="organization" required maxlength="60" placeholder="Ex. : Rouen Saint-Sever">' +
      '<label for="fa-smail">E-mail professionnel</label><input id="fa-smail" type="email" autocomplete="email" required value="' + esc(prefill || '') + '">' +
      '<label for="fa-sp1">Mot de passe (8 caractères minimum)</label><input id="fa-sp1" type="password" autocomplete="new-password" minlength="8" required>' +
      '<label for="fa-sp2">Confirmer le mot de passe</label><input id="fa-sp2" type="password" autocomplete="new-password" minlength="8" required>' +
      '<button class="fa-go" type="submit">Créer mon compte</button></form><div class="fa-msg"></div>' +
      '<div class="fa-links"><button type="button" data-a="back">J’ai déjà un compte</button></div>' +
      '<p class="fa-note">Aucune donnée d’allocataire n’est enregistrée dans votre compte.</p>');
    w.querySelector('#fa-sfirst').focus();
    w.querySelector('[data-a="back"]').onclick = function () { showLogin(); };
    w.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault();
      var email = w.querySelector('#fa-smail').value.trim(), p1 = w.querySelector('#fa-sp1').value, p2 = w.querySelector('#fa-sp2').value, b = w.querySelector('.fa-go');
      var first = capName(w.querySelector('#fa-sfirst').value), last = capName(w.querySelector('#fa-slast').value);
      var agence = w.querySelector('#fa-sag').value.trim().replace(/\s+/g, ' ');
      if (!first || !last) return msg(w, 'Indiquez votre prénom et votre nom.');
      if (!agence) return msg(w, 'Indiquez votre agence de rattachement.');
      if (p1.length < 8) return msg(w, 'Le mot de passe doit contenir au moins 8 caractères.');
      if (p1 !== p2) return msg(w, 'Les deux mots de passe ne sont pas identiques.');
      b.disabled = true; b.textContent = 'Création…';
      api('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', auth: false, body: { email: email, password: p1, data: { first_name: first, last_name: last, full_name: first + ' ' + last, agence: agence, invite: (function () { try { return sessionStorage.getItem('ft_invite') || ''; } catch (e) { return ''; } })() } } })
        .then(function (d) {
          meta.email = email; saveMeta();
          if (d && d.access_token && d.user) {
            keepSession(d); try { sessionStorage.removeItem('ft_sb_skip'); } catch (e) {}
            closeBox(); renderAcct(); toast('Bienvenue ' + first + ' !', 'success');
            return sync('start').then(loadShared);
          }
          b.disabled = false; b.textContent = 'Créer mon compte';
          w.querySelector('form').style.display = 'none';
          msg(w, 'Compte créé. Un e-mail de confirmation vient d’être envoyé à ' + email + ' : cliquez sur le lien qu’il contient pour activer votre compte, puis connectez-vous.', true);
        })
        .catch(function (e) {
          b.disabled = false; b.textContent = 'Créer mon compte';
          var m = String(e && e.message || '');
          if (/database error saving new user|INVITATION/i.test(String(e && e.message || ''))) return msg(w, 'La création de compte se fait sur invitation : utilisez le lien envoyé par l’administrateur du site (il a peut-être expiré ou déjà servi).');
          if (/signups? not allowed|signup.*disabled/i.test(m)) return msg(w, 'La création de compte est désactivée pour le moment. Contactez l’administrateur du site.');
          if (/already registered|already exists|user_already_exists/i.test(m + (e.code || ''))) return msg(w, 'Un compte existe déjà avec cette adresse. Utilisez « Mot de passe oublié ? » si besoin.');
          if (/invalid.*email|email.*invalid/i.test(m)) return msg(w, 'Adresse e-mail invalide.');
          msg(w, frErr(e));
        });
    };
  }
  /* ---------- Mon compte : nom, e-mail, mot de passe ---------- */
  function showAccount(first) {
    if (!sess) return showLogin();
    var u = sess.user;
    var w = box('<h2>' + (first ? 'Complétez votre profil' : 'Mon compte') + '</h2><p class="fa-sub">' + (first ? 'Indiquez votre prénom, votre nom et votre agence de rattachement : ces informations sont obligatoires pour utiliser votre compte.' : 'Modifiez vos informations. L’ancien mot de passe est demandé pour changer d’adresse ou de mot de passe.') + '</p>' +
      '<form autocomplete="off"><div class="fa-sec">Identité</div><div class="fa-2"><div><label for="fa-afirst">Prénom</label><input id="fa-afirst" type="text" autocomplete="given-name" required maxlength="40" value="' + esc(u.first || '') + '"></div><div><label for="fa-alast">Nom</label><input id="fa-alast" type="text" autocomplete="family-name" required maxlength="40" value="' + esc(u.last || '') + '"></div></div>' +
      '<label for="fa-aag">Agence de rattachement</label><input id="fa-aag" type="text" autocomplete="organization" required maxlength="60" placeholder="Ex. : Rouen Saint-Sever" value="' + esc(u.agence || '') + '">' +
      (first ? '' : '<div class="fa-sec">Adresse e-mail</div><label for="fa-amail">E-mail</label><input id="fa-amail" type="email" autocomplete="email" value="' + esc(u.email) + '">' +
      '<div class="fa-sec">Mot de passe</div><label for="fa-anew">Nouveau mot de passe <small>(laisser vide pour ne pas le changer)</small></label><input id="fa-anew" type="password" autocomplete="new-password" minlength="8">' +
      '<label for="fa-anew2">Confirmer le nouveau mot de passe</label><input id="fa-anew2" type="password" autocomplete="new-password" minlength="8">' +
      '<label for="fa-acur">Mot de passe actuel <small>(obligatoire pour changer l’e-mail ou le mot de passe)</small></label><input id="fa-acur" type="password" autocomplete="current-password">') +
      '<button class="fa-go" type="submit">Enregistrer</button></form><div class="fa-msg"></div>' +
      '<div class="fa-links">' + (first ? '' : '<button type="button" data-a="close">Fermer</button>') + '<button type="button" data-a="out">Se déconnecter</button></div>');
    (w.querySelector(first && u.first && u.last ? '#fa-aag' : '#fa-afirst')).focus();
    var cl = w.querySelector('[data-a="close"]'); if (cl) cl.onclick = function () { closeBox(); };
    var o = w.querySelector('[data-a="out"]'); if (o) o.onclick = function () { closeBox(); logout(); };
    w.addEventListener('click', function (e) { if (e.target === w && !first) closeBox(); });
    w.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault();
      var f = capName(w.querySelector('#fa-afirst').value), l = capName(w.querySelector('#fa-alast').value), ag = w.querySelector('#fa-aag').value.trim().replace(/\s+/g, ' ');
      var me = w.querySelector('#fa-amail'), nm = me ? me.value.trim() : u.email;
      var p1 = w.querySelector('#fa-anew') ? w.querySelector('#fa-anew').value : '', p2 = w.querySelector('#fa-anew2') ? w.querySelector('#fa-anew2').value : '', cur = w.querySelector('#fa-acur') ? w.querySelector('#fa-acur').value : '';
      if (!f || !l) return msg(w, 'Indiquez votre prénom et votre nom.');
      if (!ag) return msg(w, 'Indiquez votre agence de rattachement.');
      var chMail = nm && nm.toLowerCase() !== String(u.email).toLowerCase(), chPass = !!p1, chName = f !== u.first || l !== u.last || ag !== (u.agence || '');
      if (chPass && p1.length < 8) return msg(w, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      if (chPass && p1 !== p2) return msg(w, 'Les deux nouveaux mots de passe ne sont pas identiques.');
      if ((chMail || chPass) && !cur) return msg(w, 'Saisissez votre mot de passe actuel pour changer l’e-mail ou le mot de passe.');
      if (!chMail && !chPass && !chName) { closeBox(); return; }
      var b = w.querySelector('.fa-go'); b.disabled = true; b.textContent = 'Enregistrement…';
      var chk = (chMail || chPass) ? api('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: u.email, password: cur } }).then(keepSession).catch(function (e) { var er = new Error('cur'); er.cur = true; throw er; }) : ensureToken();
      var done = [];
      chk.then(function () {
        if (!chName) return;
        return api('/auth/v1/user', { method: 'PUT', body: { data: { first_name: f, last_name: l, full_name: f + ' ' + l, agence: ag } } }).then(function (d) { sess.user = userOf(d); jset(K_SESS, sess); done.push('nom'); });
      }).then(function () {
        if (!chPass) return;
        return api('/auth/v1/user', { method: 'PUT', body: { password: p1 } }).then(function () { done.push('mot de passe'); });
      }).then(function () {
        if (!chMail) return;
        return api('/auth/v1/user?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'PUT', body: { email: nm } }).then(function () { done.push('e-mail'); });
      }).then(function () {
        renderAcct(); try { document.dispatchEvent(new Event('ft-me')); } catch (e) {}
        b.disabled = false; b.textContent = 'Enregistrer';
        if (chMail) { w.querySelector('form').style.display = 'none'; msg(w, (done.length > 1 ? 'Modifications enregistrées. ' : '') + 'Pour finaliser le changement d’adresse, cliquez sur le lien envoyé à ' + nm + ' (un e-mail peut aussi être envoyé à votre ancienne adresse). En attendant, continuez à vous connecter avec ' + u.email + '.', true); return; }
        closeBox(); toast(first ? 'Merci ' + f + ' !' : 'Compte mis à jour', 'success');
      }).catch(function (e) {
        b.disabled = false; b.textContent = 'Enregistrer';
        var m = String(e && e.message || '');
        if (e && e.cur) return msg(w, 'Mot de passe actuel incorrect.');
        if (/same.*password|different from the old/i.test(m)) return msg(w, 'Le nouveau mot de passe doit être différent de l’ancien.');
        if (/reauthenticat/i.test(m)) return msg(w, 'Pour des raisons de sécurité, déconnectez-vous puis reconnectez-vous avant de changer de mot de passe.');
        if (/already.*registered|email_exists|already been registered/i.test(m + (e.code || ''))) return msg(w, 'Cette adresse e-mail est déjà utilisée par un autre compte.');
        msg(w, (done.length ? 'Enregistré : ' + done.join(', ') + '. ' : '') + frErr(e));
      });
    };
  }
  window.ftAccount = function () { showAccount(); };
  window.ftSignup = function () { showSignup(); };
  window.ftReloadShared = function () { loadShared(); };
  setInterval(function () { if (sess) loadShared(); }, 15 * 60 * 1000);
  window.ftLoggedIn = function () { return !!sess; };
  window.__ftUserName = function () { return sess && sess.user ? (sess.user.name || '') : ''; };
  /* Profil sans nom : on rafraîchit depuis Supabase puis on propose de le compléter */
  function checkName() {
    if (!sess) return;
    api('/auth/v1/user').then(function (u) {
      if (!sess) return; var nu = userOf(u); nu.id = sess.user.id || nu.id; sess.user = nu; jset(K_SESS, sess); renderAcct();
      if (incomplete(nu) && !document.getElementById('ft-auth')) showAccount(true);
    }).catch(function () {});
  }
  function showSetPassword(kind) {
    var w = box('<h2>' + (kind === 'invite' ? 'Bienvenue !' : 'Nouveau mot de passe') + '</h2><p class="fa-sub">Choisissez votre mot de passe pour ' + esc(sess.user.email) + '.</p>' +
      '<form><label for="fa-p1">Mot de passe</label><input id="fa-p1" type="password" autocomplete="new-password" minlength="8" required>' +
      '<label for="fa-p2">Confirmer</label><input id="fa-p2" type="password" autocomplete="new-password" minlength="8" required>' +
      '<button class="fa-go" type="submit">Enregistrer</button></form><div class="fa-msg"></div>');
    w.querySelector('#fa-p1').focus();
    w.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault();
      var p1 = w.querySelector('#fa-p1').value, p2 = w.querySelector('#fa-p2').value;
      if (p1 !== p2) return msg(w, 'Les deux mots de passe ne sont pas identiques.');
      api('/auth/v1/user', { method: 'PUT', body: { password: p1 } })
        .then(function () { closeBox(); renderAcct(); toast('Mot de passe enregistré', 'success'); return sync('start').then(loadShared); })
        .catch(function (e) { msg(w, frErr(e)); });
    };
  }
  function logout() {
    if (meta.dirty && !confirm('Des modifications ne sont pas encore synchronisées. Se déconnecter quand même ?')) return;
    var token = sess && sess.access_token;
    if (token) fetch(SB_URL + '/auth/v1/logout', { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token } }).catch(function () {});
    sess = null; LSraw.del(K_SESS);
    SYNC.concat(['ft_user_vars', 'ft_profile']).forEach(function (k) { if (k !== 'ft_theme') LSraw.del(k); });
    meta = { email: meta.email }; saveMeta();
    location.reload();
  }

  /* ---------- Bouton compte dans la barre du haut ---------- */
  function setStatus(s, detail) { status = s; if (detail) status_detail = detail; renderAcct(); }
  var status_detail = '';
  function renderAcct() {
    var host = document.getElementById('ft-acct');
    if (!host) {
      var anchor = document.getElementById('datecalc-toggle');
      if (!anchor || !anchor.parentNode) return;
      host = document.createElement('div'); host.id = 'ft-acct';
      anchor.parentNode.insertBefore(host, anchor);
      document.addEventListener('click', function (e) { if (!host.contains(e.target)) { var m = host.querySelector('.fa-menu'); if (m) m.hidden = true; } });
    }
    var open = host.querySelector('.fa-menu') && !host.querySelector('.fa-menu').hidden;
    var email = sess ? sess.user.email : '', uname = sess ? (sess.user.name || '') : '';
    var initials = uname ? uname.split(' ').map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase() : email.charAt(0).toUpperCase();
    var dot = !sess ? '' : (status === 'ok' ? 'ok' : status === 'busy' ? 'busy' : status === 'err' ? 'err' : '');
    var st = !sess ? 'Non connecté : modèles enregistrés sur ce poste uniquement.' :
      status === 'busy' ? 'Synchronisation en cours…' :
      status === 'err' ? 'Échec de synchronisation : ' + status_detail + ' Vos modifications sont gardées et seront renvoyées.' :
      lastOk ? 'Modèles synchronisés à ' + lastOk.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '.' : 'Connecté.';
    host.innerHTML = '<button type="button" aria-haspopup="true" title="' + esc(sess ? 'Compte : ' + email : 'Se connecter') + '">' +
      (sess ? '<span class="fa-av' + (initials.length > 1 ? ' two' : '') + '">' + esc(initials) + '</span><span class="fa-dot ' + dot + '"></span>' + (isAdmin && propCount ? '<span class="fa-pc">' + propCount + '</span>' : '') : '<span class="fa-name">Se connecter</span><span class="fa-dot"></span>') +
      '</button><div class="fa-menu"' + (open ? '' : ' hidden') + '>' +
      (sess ? (uname ? '<strong>' + esc(uname) + '</strong><div class="fa-st">' + esc(email) + '</div>' : '<strong>' + esc(email) + '</strong>') + (isAdmin ? '<div class="fa-st">Administrateur des modèles communs</div>' : '') : '<strong>Compte conseiller</strong>') +
      '<div class="fa-st">' + esc(st) + '</div>' +
      '<div class="fa-st" style="font-size:11px;opacity:.7">Version ' + esc((document.querySelector('meta[name="ft-version"]') || {}).content || '') + '</div>' +
      (sess ? '<button type="button" data-a="me">Mon compte : nom, e-mail, mot de passe</button><button type="button" data-a="notif">' + (window.ftNotifOn && window.ftNotifOn() ? 'Désactiver les notifications' : 'Activer les notifications') + '</button>' + (window.FT_ACCT_ITEMS || []).map(function (x, i) { return (!x.admin || isAdmin) ? '<button type="button" data-a="x' + i + '">' + esc(typeof x.t === 'function' ? x.t() : x.t) + '</button>' : ''; }).join('') + '<button type="button" data-a="tour">Revoir la visite guidée</button><button type="button" data-a="privacy">Confidentialité</button><button type="button" data-a="sync">Synchroniser maintenant</button>' +
        (isAdmin ? '<button type="button" data-a="admin">Espace administrateur</button>' : '') + (isAdmin ? '<button type="button" data-a="props">Propositions des collègues' + (propCount ? ' (' + propCount + ')' : '') + '</button>' : '<button type="button" data-a="prop">Proposer le modèle ouvert à l’équipe</button>') + (isAdmin ? '<button type="button" data-a="pub">Publier le modèle ouvert pour tous</button><button type="button" data-a="unpub">Retirer le modèle ouvert des communs</button>' : '') +
        '<button type="button" data-a="out" class="fa-out">Se déconnecter</button>'
        : '<button type="button" data-a="in">Se connecter</button>') + '</div>';
    host.querySelector('button').onclick = function (e) { e.stopPropagation(); if (!sess) { showLogin(); return; } var m = host.querySelector('.fa-menu'); m.hidden = !m.hidden; };
    var act = { sync: function () { meta.dirty = true; sync('push').then(loadShared); }, pub: window.ftSharePublish, unpub: window.ftShareRemove, prop: function () { window.ftPropose(); }, props: function () { window.ftProposals(); }, admin: function () { switchNavTab('admin'); }, me: function () { showAccount(); }, tour: function () { if (window.ftTour) window.ftTour(true); }, notif: function () { if (window.ftEnableNotifs) window.ftEnableNotifs(); }, privacy: function () { if (window.ftPrivacy) window.ftPrivacy(); }, out: logout, in: function () { showLogin(); } };
    (window.FT_ACCT_ITEMS || []).forEach(function (x, i) { act['x' + i] = x.run; });
    host.querySelectorAll('.fa-menu [data-a]').forEach(function (b) { b.onclick = function () { host.querySelector('.fa-menu').hidden = true; act[b.dataset.a](); }; });
  }

  /* ---------- Suppressions mémorisées ---------- */
  function tomb(ids, add) {
    var cur = parse(LSraw.get('ft_deleted_tpl'), []);
    ids.forEach(function (id) { id = String(id); var i = cur.indexOf(id); if (add && i < 0) cur.push(id); if (!add && i > -1) cur.splice(i, 1); });
    safeLS.setItem('ft_deleted_tpl', JSON.stringify(cur));
  }
  if (typeof confirmDeleteModel === 'function') {
    var _del = confirmDeleteModel;
    confirmDeleteModel = function () { var id = (typeof modelIdToDelete !== 'undefined') ? modelIdToDelete : null; var r = _del.apply(this, arguments); if (id != null) tomb([id], true); return r; };
  }
  if (typeof resetDefaults === 'function') {
    var _rst = resetDefaults;
    resetDefaults = function () { var r = _rst.apply(this, arguments); try { var ids = templates.map(function (t) { return t.id; }); tomb(ids, false); } catch (e) {} return r; };
  }
  // Un modèle supprimé ne revient jamais au chargement (base d'origine comprise)
  function purge() {
    try {
      var dead = parse(LSraw.get('ft_deleted_tpl'), []); if (!dead.length || typeof templates === 'undefined') return false;
      var n = templates.length; templates = templates.filter(function (t) { return dead.indexOf(String(t.id)) < 0; });
      if (templates.length !== n) { favorites = favorites.filter(function (id) { return dead.indexOf(String(id)) < 0; }); saveState(); return true; }
    } catch (e) {}
    return false;
  }
  if (purge()) setTimeout(refreshApp, 0);

  /* ---------- Démarrage ---------- */
  function start() {
    if (purge()) refreshApp();
    // Retour d'un lien d'invitation ou de réinitialisation
    var h = location.hash || '';
    if (/access_token=/.test(h)) {
      var p = {}; h.slice(1).split('&').forEach(function (kv) { var i = kv.indexOf('='); p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
      history.replaceState(null, '', location.pathname + location.search);
      sess = { access_token: p.access_token, refresh_token: p.refresh_token, expires_at: +p.expires_at || Math.floor(Date.now() / 1000) + (+p.expires_in || 3600), user: { id: '', email: '' } };
      api('/auth/v1/user').then(function (u) {
        sess.user = userOf(u); jset(K_SESS, sess); meta.email = u.email; saveMeta(); renderAcct();
        if (p.type === 'recovery' || p.type === 'invite') showSetPassword(p.type); else sync('start').then(loadShared);
      }).catch(function () { sess = null; LSraw.del(K_SESS); showLogin('Ce lien a expiré. Demandez un nouvel e-mail.'); });
      return;
    }
    if (/error_description=/.test(h)) { history.replaceState(null, '', location.pathname + location.search); showLogin('Ce lien n’est plus valide ou a expiré. Demandez un nouvel e-mail.'); return; }
    renderAcct();
    if (!sess) { var skip = false; try { skip = !!sessionStorage.getItem('ft_sb_skip'); } catch (e) {} if (!skip) showLogin(); return; }
    sync('start').then(loadShared).then(function () { setTimeout(checkName, 800); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 50); }); else setTimeout(start, 50);

  document.addEventListener('visibilitychange', function () { if (!document.hidden && sess && !busy) sync('focus'); });
  window.addEventListener('focus', function () { if (sess && !busy) sync('focus'); });
  setInterval(function () { if (sess && !busy && !document.hidden) sync('poll'); }, 30000); // récupère les changements faits sur un autre poste
  window.addEventListener('online', function () { if (sess && meta.dirty) sync('push'); });
  window.addEventListener('pagehide', function () { if (sess && meta.dirty && sess.expires_at > Date.now() / 1000) { try { push(collect(), true); } catch (e) {} } });

  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push(
    { t: 'Synchroniser mes modèles', s: 'Envoyer et récupérer les modèles de mon compte', kw: 'synchroniser compte cloud sauvegarde connexion', when: function () { return !!sess; }, run: function () { meta.dirty = true; sync('push'); } },
    { t: 'Se connecter', s: 'Compte conseiller : modèles sur tous les postes', kw: 'connexion compte identifiant login', when: function () { return !sess; }, run: function () { showLogin(); } },
    { t: 'Créer un compte', s: 'Compte conseiller : modèles sur tous les postes', kw: 'inscription créer compte nouveau conseiller', when: function () { return !sess; }, run: function () { showSignup(''); } },
    { t: 'Se déconnecter', s: 'Fermer la session sur ce poste', kw: 'déconnexion logout quitter compte', when: function () { return !!sess; }, run: logout },
    { t: 'Publier le modèle ouvert pour tous', s: 'Modèles communs (administrateur)', kw: 'publier commun partager modèle équipe', when: function () { return isAdmin; }, run: function () { window.ftSharePublish(); } },
    { t: 'Proposer le modèle ouvert à l’équipe', s: 'Modèles communs : validé par l’administrateur', kw: 'proposer partager équipe collègue commun', when: function () { return !!sess && !isAdmin; }, run: function () { window.ftPropose(); } },
    { t: 'Propositions des collègues', s: 'Modèles communs (administrateur)', kw: 'propositions valider collègues modèles', when: function () { return isAdmin; }, run: function () { window.ftProposals(); } }
  );
})();
