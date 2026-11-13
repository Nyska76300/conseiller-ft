(function () {
  /* Double vérification de l’administrateur : en plus du mot de passe, un code à 6 chiffres
     donné par une appli d’authentification. Une fois activée, les droits d’administrateur
     (publication, invitations, statistiques…) exigent ce code, y compris côté base de données. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const logged = () => !!(window.ftLoggedIn && window.ftLoggedIn());
  const rest = (p, o) => window.__ftRest(p, o);
  function aal() {
    try { const t = window.__ftAccess && window.__ftAccess(); return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; } catch (e) { return 'aal1'; }
  }
  const factors = () => rest('/auth/v1/user').then(u => (u && u.factors) || []);
  const verified = f => f.filter(x => x.status === 'verified' && x.factor_type === 'totp');
  const codeIn = id => '<input id="' + id + '" class="mf-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="123456" aria-label="Code à 6 chiffres">';
  function verify(fid, code) {
    return rest('/auth/v1/factors/' + fid + '/challenge', { method: 'POST', body: {} })
      .then(ch => rest('/auth/v1/factors/' + fid + '/verify', { method: 'POST', body: { challenge_id: ch.id, code } }))
      .then(s => { if (s && s.access_token && window.__ftKeepSession) window.__ftKeepSession(s); return s; });
  }
  const frErr = e => { const m = String(e && e.message || e); return /invalid|code/i.test(m) ? 'Code incorrect ou expiré : saisissez le code affiché maintenant dans l’appli.' : m; };

  /* ---------- Saisie du code à la connexion ---------- */
  let asking = false;
  function check() {
    if (!logged() || asking || aal() === 'aal2') return;
    factors().then(f => {
      const v = verified(f); if (!v.length) return;
      asking = true;
      let w = $('ft-mfa'); if (!w) { w = document.createElement('div'); w.id = 'ft-mfa'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'mf-t'); document.body.appendChild(w); }
      w.hidden = false;
      w.innerHTML = '<form class="mf-card" id="mf-form"><h2 id="mf-t">🔐 Double vérification</h2><p>Saisissez le code à 6 chiffres affiché dans votre appli d’authentification pour accéder à l’Espace administrateur.</p>' + codeIn('mf-in') +
        '<p class="mf-err" id="mf-err" role="alert"></p><div class="mf-row"><button type="button" class="ad-btn" id="mf-later">Plus tard</button><button type="submit" class="ad-btn pri">Valider</button></div></form>';
      const inp = $('mf-in'); setTimeout(() => inp.focus(), 50);
      inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value.length === 6) $('mf-form').requestSubmit(); });
      $('mf-later').onclick = () => { w.hidden = true; asking = false; toast('Sans le code, vous utilisez le site comme un conseiller (Espace administrateur masqué).', 'info'); };
      $('mf-form').onsubmit = ev => {
        ev.preventDefault(); if (inp.value.length !== 6) return;
        verify(v[0].id, inp.value).then(() => { w.hidden = true; asking = false; toast('Code validé : Espace administrateur disponible', 'success'); })
          .catch(e => { $('mf-err').textContent = frErr(e); inp.value = ''; inp.focus(); });
      };
    }).catch(() => {});
  }
  document.addEventListener('ft-login', () => setTimeout(check, 800));
  setTimeout(check, 2500);

  /* ---------- Carte de l’Espace administrateur ---------- */
  function render() {
    const h = $('mf-body'); if (!h) return;
    factors().then(f => {
      const v = verified(f);
      const sub = $('ad-mfa') && $('ad-mfa').querySelector('.text-cyan-400'); if (sub) sub.textContent = v.length ? 'Activée' : 'Recommandée';
      if (v.length) {
        h.innerHTML = '<p class="ad-empty">✅ Activée : à chaque connexion, l’Espace administrateur demande le code de votre appli d’authentification. Même avec votre mot de passe, personne ne peut publier ou consulter les statistiques sans ce code.</p>' +
          '<div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn" data-mf="off" data-id="' + esc(v[0].id) + '">Désactiver</button></div>';
      } else {
        h.innerHTML = '<p class="ad-empty">Protège votre compte administrateur : en plus du mot de passe, un code à 6 chiffres change toutes les 30 secondes dans une appli d’authentification (app <b>Mots de passe</b> de l’iPhone, Google Authenticator, Microsoft Authenticator…).</p>' +
          '<div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn pri" data-mf="on">Activer la double vérification</button></div><div id="mf-setup"></div>';
      }
    }).catch(e => { h.innerHTML = '<p class="ad-empty">Indisponible : ' + esc(e && e.message || e) + '</p>'; });
  }
  async function enroll() {
    const out = $('mf-setup'); if (!out) return;
    out.innerHTML = '<p class="ad-empty">Préparation…</p>';
    try {
      const f = await factors();
      for (const x of f.filter(x => x.status !== 'verified')) await rest('/auth/v1/factors/' + x.id, { method: 'DELETE' }).catch(() => {});
      const r = await rest('/auth/v1/factors', { method: 'POST', body: { factor_type: 'totp', friendly_name: 'Espace Conseiller ' + new Date().toLocaleDateString('fr-FR'), issuer: 'Espace Conseiller FT' } });
      const t = r.totp || {}, qr = String(t.qr_code || '');
      const src = /^data:/.test(qr) ? qr : 'data:image/svg+xml;utf8,' + encodeURIComponent(qr);
      out.innerHTML = '<div class="mf-setup"><p class="ad-empty"><b>1.</b> Sur ordinateur : scannez ce QR code avec l’appareil photo de votre téléphone ou votre appli d’authentification. Sur le téléphone lui-même : touchez « Ajouter sur cet appareil ».</p>' +
        '<img class="mf-qr" alt="QR code de double vérification" src="' + esc(src) + '">' +
        '<div class="ad-row" style="gap:8px;flex-wrap:wrap;justify-content:center"><a class="ad-btn" href="' + esc(t.uri || '') + '">Ajouter sur cet appareil</a><button type="button" class="ad-btn" data-mf="copy" data-v="' + esc(t.secret || '') + '">Copier la clé</button></div>' +
        '<p class="ad-empty" style="margin-top:10px"><b>2.</b> Saisissez le code à 6 chiffres affiché par l’appli :</p>' + codeIn('mf-new') +
        '<p class="mf-err" id="mf-new-err" role="alert"></p><div class="ad-row"><button type="button" class="ad-btn pri" data-mf="confirm" data-id="' + esc(r.id) + '">Confirmer</button></div></div>';
      $('mf-new').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
    } catch (e) {
      out.innerHTML = '<p class="ad-empty">Activation impossible : ' + esc(e && e.message || e) + (/disabled|not enabled|mfa/i.test(String(e && e.message)) ? ' (vérifiez que la double vérification TOTP est autorisée dans Supabase : Authentication → Multi-Factor).' : '') + '</p>';
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-mf]'); if (!b) return;
    const a = b.dataset.mf;
    if (a === 'on') { enroll(); return; }
    if (a === 'copy') { navigator.clipboard.writeText(b.dataset.v).then(() => toast('Clé copiée', 'success')); return; }
    if (a === 'confirm') {
      const c = ($('mf-new') || {}).value || ''; if (c.length !== 6) return;
      verify(b.dataset.id, c).then(() => { toast('Double vérification activée', 'success'); render(); }).catch(er => { $('mf-new-err').textContent = frErr(er); });
      return;
    }
    if (a === 'off') {
      if (!confirm('Désactiver la double vérification ? Votre compte administrateur ne sera plus protégé que par le mot de passe.')) return;
      rest('/auth/v1/factors/' + b.dataset.id, { method: 'DELETE' }).then(() => { toast('Double vérification désactivée', 'info'); render(); }).catch(er => toast('Impossible : ' + er.message, 'error'));
    }
  });
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function (c) {
    try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); }
    const B = $('ad-first-b');
    if (B && !$('ad-mfa')) { const h = document.createElement('div'); h.id = 'ad-mfa'; B.appendChild(h); h.innerHTML = c('🔐', 'Double vérification', '…', '<div id="mf-body"><p class="ad-empty">Chargement…</p></div>'); render(); }
  };
})();
