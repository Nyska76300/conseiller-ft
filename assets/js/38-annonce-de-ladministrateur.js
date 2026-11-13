(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const jget = (k, d) => { try { const v = JSON.parse(LS.get(k)); return v == null ? d : v; } catch (e) { return d; } };
  const today = () => new Date().toISOString().slice(0, 10);
  const notify = (t, b, tag, go) => { try { window.ftNotify && window.ftNotify(t, b, tag, go); } catch (e) {} };

  /* ===================== Annonce de l’administrateur ===================== */
  function annonce() {
    const a = jget('ft_annonce', null), hd = document.querySelector('body > header, header.h-14');
    let bar = $('ft-ann');
    const live = a && a.active && a.text && (!a.until || today() <= a.until);
    if (!live || LS.get('ft_ann_x') === a.id) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'ft-ann'; bar.setAttribute('role', 'status'); if (hd && hd.parentNode) hd.parentNode.insertBefore(bar, hd.nextSibling); else document.body.prepend(bar); }
    if (bar.dataset.id === a.id) return;
    bar.dataset.id = a.id; bar.className = a.level === 'imp' ? 'imp' : '';
    bar.innerHTML = '<span class="an-i" aria-hidden="true">' + (a.level === 'imp' ? '⚠️' : '📣') + '</span><div class="an-t"><b>' + (a.level === 'imp' ? 'Important' : 'Annonce') + '</b>' + esc(a.text) + '</div><button type="button" class="an-x" aria-label="Masquer l’annonce" title="Masquer">×</button>';
    bar.querySelector('.an-x').onclick = () => { LS.set('ft_ann_x', a.id); bar.remove(); };
    if (LS.get('ft_ann_n') !== a.id) { LS.set('ft_ann_n', a.id); notify(a.level === 'imp' ? 'Annonce importante' : 'Annonce', a.text, 'ft-ann'); }
  }
  document.addEventListener('ft-annonce', annonce);
  function anonShared() {
    if (window.ftLoggedIn && window.ftLoggedIn()) return;
    if (!window.__ftAnon) return;
    window.__ftAnon('/rest/v1/shared_templates?select=id,template&id=eq.__ft_annonce').then(r => { const t = r && r[0] && r[0].template; if (t) { LS.set('ft_annonce', JSON.stringify(t)); annonce(); } }).catch(() => {});
  }
  function annCard(card) {
    const a = jget('ft_annonce', {}) || {};
    const live = a.active && a.text && (!a.until || today() <= a.until);
    return card('📣', 'Annonce aux conseillers', live ? 'En ligne' : 'Aucune',
      '<p class="ad-empty">Le message s’affiche en bandeau en haut du site chez tous les conseillers (et en notification pour ceux qui les ont activées), jusqu’à sa date de fin ou son retrait.</p>' +
      '<textarea class="ad-in" id="an-txt" maxlength="400" placeholder="Ex. : Nouvelle règle démission au 1er janvier, voir la fiche mise à jour.">' + esc(live ? a.text : '') + '</textarea>' +
      '<div class="ad-row" style="margin-top:8px;flex-wrap:wrap;gap:8px"><select class="ad-in" id="an-lvl"><option value="info"' + (a.level !== 'imp' ? ' selected' : '') + '>Information</option><option value="imp"' + (a.level === 'imp' ? ' selected' : '') + '>Important</option></select>' +
      '<label class="ad-empty" style="display:flex;align-items:center;gap:6px">Jusqu’au <input type="date" class="ad-in" id="an-until" value="' + esc(live ? (a.until || '') : '') + '"></label></div>' +
      '<div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn pri" data-an="pub">Publier</button>' + (live ? '<button type="button" class="ad-btn" data-an="off">Retirer</button>' : '') + '</div>');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-an]'); if (!b || !isAdmin()) return;
    const off = b.dataset.an === 'off';
    const txt = ($('an-txt') || {}).value || '';
    if (!off && !txt.trim()) return toast('Écrivez le message de l’annonce', 'info');
    const a = off ? Object.assign({}, jget('ft_annonce', {}), { active: false }) : { id: Date.now().toString(36), text: txt.trim(), level: ($('an-lvl') || {}).value || 'info', until: ($('an-until') || {}).value || '', date: today(), active: true };
    if (!off && !confirm('Publier cette annonce pour tous les conseillers ?')) return;
    window.__ftSaveShared('__ft_annonce', a).then(() => { LS.set('ft_annonce', JSON.stringify(a)); LS.set('ft_ann_n', a.id); annonce(); if (!off && window.ftPushSend) window.ftPushSend({ title: a.level === 'imp' ? 'Annonce importante' : 'Annonce', body: a.text, go: 'home', tag: 'ft-ann' }).catch(() => {}); toast(off ? 'Annonce retirée' : 'Annonce publiée', 'success'); if (window.ftAdminRefresh) window.ftAdminRefresh(); else try { switchNavTab('admin'); } catch (er) {} })
      .catch(er => toast('Publication impossible : ' + (er && er.message || er), 'error'));
  });

  /* ===================== Confidentialité ===================== */
  window.ftPrivacy = function () {
    let d = $('ft-priv'); if (!d) { d = document.createElement('div'); d.id = 'ft-priv'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); document.body.appendChild(d); }
    d.innerHTML = '<div class="pv-box"><h2>Confidentialité</h2><p>Ce qui est enregistré quand vous utilisez l’Espace Conseiller, et pourquoi.</p>' +
      '<h3>Aucune donnée d’allocataire</h3><p>Les montants, dates et informations saisis dans les simulateurs restent dans votre navigateur. Ils ne sont ni envoyés ni conservés sur un serveur.</p>' +
      '<h3>Votre compte</h3><ul><li>Prénom, nom, adresse e-mail et mot de passe (chiffré) : pour vous connecter.</li><li>Vos préférences (thème, favoris, liens utiles) et vos modèles de mails personnels : pour les retrouver sur tous vos postes.</li></ul>' +
      '<h3>Statistiques d’utilisation</h3><ul><li>Quand vous êtes connecté : l’outil ouvert, le modèle de mail ouvert ou copié (son titre, pas son contenu) et la date.</li><li>Visibles uniquement par l’administrateur du site, pour l’améliorer.</li><li>Supprimées automatiquement au bout d’un an.</li></ul>' +
      '<h3>Rappels et erreurs techniques</h3><ul><li>Vos rappels (texte et date) sont enregistrés sur votre compte pour vous être envoyés en notification ; supprimez-les à tout moment dans « Mes rappels ». N’y indiquez pas de nom complet ni d’identifiant d’allocataire.</li><li>Si un outil plante, l’erreur technique (message, outil ouvert, version, type d’appareil) est transmise à l’administrateur pour la corriger, sans aucune donnée saisie. Effacée au bout de 90 jours.</li><li>Pour remplir un mail, les montants et dates du dernier calcul restent 12 heures sur ce poste uniquement.</li></ul>' +
      '<h3>Services extérieurs</h3><ul><li>Comptes et synchronisation : Supabase.</li><li>Interprète vocal : le texte dicté est envoyé à un service de traduction en ligne (Google Traduction, ou MyMemory en secours). N’y dictez pas de données personnelles.</li><li>Hébergement des pages : GitHub Pages.</li></ul>' +
      '<h3>Vos droits</h3><p>Vous pouvez modifier vos informations dans « Mon compte ». Pour consulter ou supprimer vos données, ou supprimer votre compte, contactez l’administrateur du site.</p>' +
      '<button type="button" class="pv-ok">Fermer</button></div>';
    d.classList.add('on');
    d.onclick = e => { if (e.target === d || e.target.closest('.pv-ok')) d.classList.remove('on'); };
  };

  /* ===================== Visite guidée ===================== */
  const vis = el => el && el.offsetParent !== null && el.getBoundingClientRect().width > 0;
  const pick = sels => { for (const s of sels) { const el = document.querySelector(s); if (vis(el)) return el; } return null; };
  const STEPS = [
    { k: 'Bienvenue', h: 'L’Espace Conseiller en 1 minute', p: 'Cinq repères pour aller plus vite au quotidien. Vous pourrez revoir cette visite depuis le menu de votre compte.', el: () => null },
    { k: 'Accueil', h: 'Mes favoris', p: 'Vos outils préférés en un clic. Le bouton à droite (« Choisir » ou « Modifier ») permet de cocher ceux que vous utilisez le plus, CVM Direct compris.', el: () => pick(['#view-home .fh-pins']) },
    { k: 'Navigation', h: 'Le menu', p: 'Tous les outils, classés par thème. L’étoile à droite d’un outil le place en haut du menu, dans « Favoris du menu ».', el: () => pick(['#burger-menu-btn', '#ft-tabbar [data-t="tools"]']) },
    { k: 'Mails', h: 'Modèles de mails (CVM)', p: 'Choisissez un modèle, complétez les champs, copiez. Les simulateurs rédigent aussi le mail à l’allocataire automatiquement.', el: () => pick(['#ft-tabbar [data-t="cvm"]', '#burger-menu-btn']) },
    { k: 'Accueil du public', h: 'Interprète vocal', p: 'Pour un allocataire qui parle une autre langue : chacun parle à son tour, la phrase est traduite et lue à voix haute.', el: () => pick(['#ft-tts', '#ft-more-btn']) },
    { k: 'Astuce', h: 'Rechercher partout', p: 'Ctrl+K (ou la loupe) : un outil, une règle, un modèle de mail… tapez quelques lettres.', el: () => pick(['.ft-hsearch', '#ft-tabbar [data-t="search"]', '#ft-header-search']) }
  ];
  let ti = 0;
  function tourDraw() {
    let ov = $('ft-tour'), tip = $('ft-tour-tip');
    if (!ov) { ov = document.createElement('div'); ov.id = 'ft-tour'; ov.innerHTML = '<div class="tr-hole"></div>'; document.body.appendChild(ov); }
    if (!tip) { tip = document.createElement('div'); tip.id = 'ft-tour-tip'; tip.setAttribute('role', 'dialog'); tip.setAttribute('aria-live', 'polite'); document.body.appendChild(tip); }
    const st = STEPS[ti], el = st.el(), hole = ov.firstChild;
    tip.innerHTML = '<div class="tt-k">' + esc(st.k) + ' · ' + (ti + 1) + '/' + STEPS.length + '</div><h4>' + esc(st.h) + '</h4><p>' + esc(st.p) + '</p>' +
      '<div class="tt-b">' + (ti ? '<button type="button" data-tt="prev">Précédent</button>' : '<button type="button" class="tt-s" data-tt="end">Passer</button>') +
      '<span class="tt-dots">' + STEPS.map((s, i) => '<i class="' + (i === ti ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<button type="button" class="tt-n" data-tt="next">' + (ti === STEPS.length - 1 ? 'Terminer' : 'Suivant') + '</button></div>';
    const W = innerWidth, H = innerHeight, tw = tip.offsetWidth, th = tip.offsetHeight;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect(), pad = 6;
      hole.classList.remove('none');
      Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (Math.min(r.height, H * .5) + pad * 2) + 'px' });
      let top = r.bottom + 14; if (top + th > H - 10) top = Math.max(10, r.top - th - 14);
      let left = Math.min(Math.max(10, r.left), W - tw - 10);
      Object.assign(tip.style, { top: top + 'px', left: left + 'px' });
    } else {
      hole.classList.add('none'); Object.assign(hole.style, { left: (W / 2) + 'px', top: (H / 2) + 'px' });
      Object.assign(tip.style, { top: Math.max(10, (H - th) / 2) + 'px', left: Math.max(10, (W - tw) / 2) + 'px' });
    }
    tip.querySelector('.tt-n').focus();
  }
  function tourEnd() { const a = $('ft-tour'), b = $('ft-tour-tip'); if (a) a.remove(); if (b) b.remove(); const v = '1'; if (window.safeLS && safeLS.setItem) safeLS.setItem('ft_tour_done', v); else LS.set('ft_tour_done', v); window.removeEventListener('resize', tourDraw); }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#ft-tour-tip [data-tt]'); if (!b) return;
    const a = b.dataset.tt;
    if (a === 'end' || (a === 'next' && ti === STEPS.length - 1)) return tourEnd();
    ti += a === 'next' ? 1 : -1; tourDraw();
  });
  document.addEventListener('keydown', e => { if (!$('ft-tour-tip')) return; if (e.key === 'Escape') tourEnd(); else if (e.key === 'ArrowRight' && ti < STEPS.length - 1) { ti++; tourDraw(); } else if (e.key === 'ArrowLeft' && ti) { ti--; tourDraw(); } });
  window.ftTour = function () { try { switchNavTab('home'); } catch (e) {} try { if (typeof isBurgerMenuOpen !== 'undefined' && isBurgerMenuOpen) toggleBurgerMenu(false); } catch (e) {} ti = 0; setTimeout(() => { tourDraw(); window.addEventListener('resize', tourDraw); }, 250); };
  function maybeTour(tries) {
    if (LS.get('ft_tour_done')) return;
    const busy = $('ft-auth') || $('ft-news') || $('ft-tour') || document.querySelector('#ft-regs-dlg.on, #ft-pins-dlg.on');
    let tab = ''; try { tab = String(activeNavTab); } catch (e) {}
    if (busy || tab !== 'home' || document.hidden) { if ((tries || 0) < 40) setTimeout(() => maybeTour((tries || 0) + 1), 3000); return; }
    window.ftTour();
  }
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Visite guidée', s: 'Découvrir l’Espace Conseiller en 6 étapes', kw: 'visite guidée aide découvrir tutoriel prise en main', run: () => setTimeout(window.ftTour, 150) });
  window.FT_ACTIONS.push({ t: 'Confidentialité', s: 'Données enregistrées et services utilisés', kw: 'confidentialité rgpd données personnelles vie privée', run: () => setTimeout(window.ftPrivacy, 120) });

  /* ===================== Invitations (administrateur) ===================== */
  const rnd = n => { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; const r = new Uint32Array(n); crypto.getRandomValues(r); r.forEach(x => { s += a[x % a.length]; }); return s; };
  const invLink = c => location.origin + location.pathname + '?invite=' + encodeURIComponent(c);
  const dtt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  function invCard(card) {
    return card('✉', 'Invitations', '', '<div id="ivt-body"><p class="ad-empty">Chargement…</p></div>');
  }
  function invLoad() {
    const host = $('ivt-body'); if (!host || !window.__ftRest) return;
    Promise.all([window.__ftRest('/rest/v1/invites?select=*&order=created_at.desc&limit=30'), window.__ftRest('/rest/v1/app_settings?select=key,value&key=eq.invite_only')]).then(([rows, st]) => {
      const only = !(st && st[0] && st[0].value === false);
      host.innerHTML =
        '<div class="ad-row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><span class="ad-empty">Inscriptions : <b>' + (only ? 'sur invitation uniquement' : 'ouvertes à tous') + '</b></span><button type="button" class="ad-btn" data-inv="mode" data-v="' + (only ? '0' : '1') + '">' + (only ? 'Ouvrir à tous' : 'Passer sur invitation') + '</button></div>' +
        '<div class="ad-row" style="margin-top:8px;flex-wrap:wrap;gap:8px"><input class="ad-in" id="ivt-note" placeholder="Pour qui ? (ex. Équipe Rouen)" style="flex:1;min-width:150px">' +
        '<select class="ad-in" id="ivt-max"><option value="1">1 personne</option><option value="5">5 personnes</option><option value="20">20 personnes</option><option value="100">100 personnes</option></select>' +
        '<select class="ad-in" id="ivt-days"><option value="7">7 jours</option><option value="30" selected>30 jours</option><option value="90">90 jours</option></select>' +
        '<button type="button" class="ad-btn pri" data-inv="new">Créer le lien</button></div><div id="ivt-out"></div>' +
        (rows && rows.length ? '<table class="ad-tbl" style="margin-top:8px"><tr><th>Invitation</th><th style="text-align:right">Utilisée</th><th style="text-align:right">Expire</th><th></th></tr>' + rows.map(r => '<tr><td>' + esc(r.note || r.code) + '</td><td class="n">' + r.uses + ' / ' + r.max_uses + '</td><td class="n">' + dtt(r.expires_at) + '</td><td class="n"><button type="button" class="ad-btn" data-inv="show" data-c="' + esc(r.code) + '">Lien</button> <button type="button" class="ad-btn" data-inv="del" data-c="' + esc(r.code) + '">×</button></td></tr>').join('') + '</table>' : '<p class="ad-empty" style="margin-top:8px">Aucune invitation pour le moment.</p>');
    }).catch(e => { host.innerHTML = '<p class="ad-empty">' + (/relation|does not exist|404|PGRST/i.test(String(e && e.message)) ? 'Invitations non installées : exécutez le script supabase/annonces_invitations.sql dans Supabase.' : 'Chargement impossible : ' + esc(e && e.message || e)) + '</p>'; });
  }
  function invShow(code) {
    const o = $('ivt-out'); if (!o) return;
    const link = invLink(code);
    o.innerHTML = '<div class="inv-out"><img alt="QR code de l’invitation" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=' + encodeURIComponent(link) + '"><div style="min-width:0"><code>' + esc(link) + '</code><div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn pri" data-inv="copy" data-l="' + esc(link) + '">Copier le lien</button>' + (navigator.share ? '<button type="button" class="ad-btn" data-inv="share" data-l="' + esc(link) + '">Partager</button>' : '') + '</div><p class="ad-empty" style="margin-top:6px">À envoyer au collègue : il crée son compte avec ce lien. Le QR code se scanne avec l’appareil photo du téléphone.</p></div></div>';
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-inv]'); if (!b || !isAdmin()) return;
    const a = b.dataset.inv;
    if (a === 'copy') { navigator.clipboard.writeText(b.dataset.l).then(() => toast('Lien copié', 'success')); return; }
    if (a === 'share') { navigator.share({ title: 'Invitation Espace Conseiller', text: 'Créez votre compte sur l’Espace Conseiller :', url: b.dataset.l }).catch(() => {}); return; }
    if (a === 'show') { invShow(b.dataset.c); return; }
    if (a === 'del') { if (!confirm('Supprimer ce lien d’invitation ?')) return; window.__ftRest('/rest/v1/invites?code=eq.' + encodeURIComponent(b.dataset.c), { method: 'DELETE' }).then(invLoad).catch(er => toast('Suppression impossible : ' + er.message, 'error')); return; }
    if (a === 'mode') { window.__ftRest('/rest/v1/app_settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'invite_only', value: b.dataset.v === '1' } }).then(() => { toast(b.dataset.v === '1' ? 'Inscriptions sur invitation uniquement' : 'Inscriptions ouvertes à tous', 'success'); invLoad(); }).catch(er => toast('Enregistrement impossible : ' + er.message, 'error')); return; }
    if (a === 'new') {
      const code = rnd(10), days = +(($('ivt-days') || {}).value || 30);
      const body = { code, note: ($('ivt-note') || {}).value || '', max_uses: +(($('ivt-max') || {}).value || 1), expires_at: new Date(Date.now() + days * 864e5).toISOString() };
      window.__ftRest('/rest/v1/invites', { method: 'POST', body }).then(() => { invLoad(); setTimeout(() => invShow(code), 350); toast('Lien d’invitation créé', 'success'); }).catch(er => toast('Création impossible : ' + er.message, 'error'));
    }
  });
  /* Lien d’invitation reçu : on garde le code et on ouvre la création de compte */
  (function () {
    const m = /[?&]invite=([A-Za-z0-9_-]{4,40})/.exec(location.search); if (!m) return;
    try { sessionStorage.setItem('ft_invite', m[1]); history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    const go = n => { if (window.ftLoggedIn && window.ftLoggedIn()) return; if (window.ftSignup) { window.ftSignup(); setTimeout(() => toast('Invitation reçue : créez votre compte', 'success'), 300); } else if (n < 20) setTimeout(() => go(n + 1), 300); };
    setTimeout(() => go(0), 900);
  })();

  /* ===================== Cartes de l’Espace administrateur ===================== */
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function (card) {
    try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); }
    const B = $('ad-first-b');
    if (B && !$('ad-annonce')) { const h = document.createElement('div'); h.id = 'ad-annonce'; B.insertBefore(h, B.firstChild); }
    if ($('ad-annonce')) $('ad-annonce').innerHTML = annCard(card);
    const A = $('ad-first-a');
    if (A && !$('ad-invites')) { const h = document.createElement('div'); h.id = 'ad-invites'; A.appendChild(h); h.innerHTML = invCard(card); invLoad(); }
    /* purge automatique (au plus une fois par jour) */
    if (LS.get('ft_purge_d') !== today() && window.__ftRpc) { LS.set('ft_purge_d', today()); window.__ftRpc('admin_purge', { days: 365 }).catch(() => {}); }
  };

  /* ===================== Notifications ===================== */
  /* Liens « Voir › » dans « Quoi de neuf » */
  const LINKS = [
    [/^Visite guid/i, 'Lancer', () => window.ftTour && window.ftTour()],
    [/^Notifications/i, 'Activer', () => window.ftEnableNotifs && window.ftEnableNotifs(), () => !(window.ftNotifOn && window.ftNotifOn())],
    [/^Confidentialit/i, 'Lire', () => window.ftPrivacy && window.ftPrivacy()],
    [/^Mes rappels/i, 'Ouvrir', () => window.ftReminders && window.ftReminders()],
    [/^Paramètres/i, 'Ouvrir', () => window.ftSettings && window.ftSettings()],
    [/^Aide-mémo/i, 'Ouvrir', () => window.ftRpToggle && window.ftRpToggle(true)],
    [/^Mode formation/i, 'Ouvrir', () => switchNavTab('formation')],
    [/^Mails pré-remplis/i, 'Ouvrir', () => switchNavTab('cvm')],
    [/^Quoi de neuf/i, '', null, () => false],
    [/^(Apparence|Fiabilit)/i, '', null, () => false],
    [/interpr[eè]te/i, 'Ouvrir', () => window.ftInterp && window.ftInterp()],
    [/Mon compte/i, 'Ouvrir', () => window.ftAccount && window.ftAccount()],
    [/Espace administrateur|veille r[ée]glementaire|statistiques/i, 'Ouvrir', () => switchNavTab('admin'), isAdmin],
    [/Conditions et ARE/i, 'Ouvrir', () => switchNavTab(1)],
    [/Trop-per[cç]u/i, 'Ouvrir', () => switchNavTab(6)],
    [/Sch[ée]mas/i, 'Ouvrir', () => switchNavTab('schemas')],
    [/invalidit[ée]/i, 'Ouvrir', () => switchNavTab('invalidite')],
    [/\bATI\b/i, 'Ouvrir', () => switchNavTab('ati')],
    [/\bCSP\b/i, 'Ouvrir', () => switchNavTab(4)],
    [/Mails?\s*\(CVM\)|\bCVM\b|mod[eè]les? de mails?/i, 'Ouvrir', () => switchNavTab('cvm')],
    [/Liens utiles|Mes favoris|Accueil/i, 'Voir', () => switchNavTab('home')],
    [/« ?Menu ?»|Menu Outils|\bmenu\b/i, 'Voir', () => { try { toggleBurgerMenu(true); } catch (e) {} }],
    [/Annonce/i, 'Voir', () => switchNavTab('admin'), isAdmin]
  ];
  window.ftNewsLink = function (txt) { const l = LINKS.find(x => x[0].test(txt)); if (!l || (l[3] && !l[3]()) || !l[2]) return null; return { label: l[1], run: l[2] }; };

  /* Démarrage */
  annonce();
  setTimeout(anonShared, 1500);
  setTimeout(() => maybeTour(0), 2500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) annonce(); });
})();
