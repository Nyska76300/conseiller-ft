(function () {
  /* Rappels personnels : le conseiller programme un rappel (« relancer dans 15 jours »),
     il reçoit une notification à la date choisie, même appli fermée. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const logged = () => !!(window.ftLoggedIn && window.ftLoggedIn());
  const notifOn = () => !!(window.ftNotifOn && window.ftNotifOn());
  const tab = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  const tabName = id => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); return c ? c.name : ''; } catch (e) { return ''; } };
  const pad = n => String(n).padStart(2, '0');
  const local = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const at9 = days => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0); return d; };
  const QUICK = [['Demain', () => at9(1)], ['Dans 1 semaine', () => at9(7)], ['Dans 15 jours', () => at9(15)], ['Dans 1 mois', () => { const d = at9(0); d.setMonth(d.getMonth() + 1); return d; }]];
  const fmt = iso => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const missing = e => /PGRST20[25]|42P01|does not exist|HTTP 404/.test(String(e && (e.message || e.code) || ''));
  let LIST = [];
  /* Ajout à l’agenda (iPhone, Outlook, Google) : fichier .ics */
  function ics(due, body) {
    const d = new Date(due), z = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(d.getTime() + 15 * 60000), uid = Date.now().toString(36) + '@espace-conseiller';
    const txt = String(body).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const data = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Espace Conseiller//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(d), 'DTEND:' + z(end), 'SUMMARY:' + txt, 'DESCRIPTION:Rappel créé dans l’Espace Conseiller', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + txt, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([data], { type: 'text/calendar;charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = 'rappel.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  window.ftReminderIcs = ics;

  function box() {
    let w = $('ft-rem');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-rem'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'ft-rem-t');
      document.body.appendChild(w);
      w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-rm="x"]')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) close(); });
    }
    return w;
  }
  function close() { const w = $('ft-rem'); if (w) w.hidden = true; }

  window.ftReminders = function (pre) {
    pre = pre || {};
    const w = box(); w.hidden = false;
    if (!logged()) {
      w.innerHTML = '<div class="rm-card"><div class="rm-h"><h2 id="ft-rem-t">⏰ Mes rappels</h2><button type="button" class="rm-x" data-rm="x" aria-label="Fermer">×</button></div><p class="rm-p">Les rappels sont enregistrés sur votre compte pour vous être envoyés en notification : connectez-vous pour les utiliser.</p><div class="rm-row"><button type="button" class="ad-btn pri" id="rm-login">Se connecter</button></div></div>';
      $('rm-login').onclick = () => { close(); const b = document.querySelector('#ft-acct > button'); if (b) b.click(); };
      return;
    }
    const cur = pre.go != null ? pre.go : tab();
    const curName = tabName(cur);
    w.innerHTML = '<div class="rm-card"><div class="rm-h"><h2 id="ft-rem-t">⏰ Mes rappels</h2><button type="button" class="rm-x" data-rm="x" aria-label="Fermer">×</button></div>' +
      (notifOn() ? '' : '<div class="rm-warn">Les notifications ne sont pas activées sur cet appareil : vous ne recevrez pas vos rappels ici. <button type="button" class="ad-btn" id="rm-notif">Activer</button></div>') +
      '<form id="rm-form" class="rm-form"><label for="rm-txt">Rappel</label><textarea id="rm-txt" maxlength="200" rows="2" required placeholder="Ex. : relancer pour les justificatifs, vérifier la fin de droits…">' + esc(pre.text || '') + '</textarea>' +
      '<p class="rm-hint">Pas de nom complet ni d’identifiant d’allocataire : utilisez vos initiales ou une référence interne.</p>' +
      '<label>Quand</label><div class="rm-quick">' + QUICK.map((q, i) => '<button type="button" data-q="' + i + '"' + (i === 2 ? ' class="on"' : '') + '>' + q[0] + '</button>').join('') + '</div>' +
      '<input type="datetime-local" id="rm-when" aria-label="Date et heure du rappel" value="' + local(QUICK[2][1]()) + '">' +
      (curName && cur !== 'home' ? '<label class="rm-chk"><input type="checkbox" id="rm-go" checked> Ouvrir « ' + esc(curName) + ' » en touchant la notification</label>' : '') +
      '<label class="rm-chk"><input type="checkbox" id="rm-ics"> Ajouter aussi à mon agenda (iPhone, Outlook…)</label>' +
      '<div class="rm-row"><button type="submit" class="ad-btn pri">Programmer le rappel</button></div></form>' +
      '<h3 class="rm-sub">À venir</h3><div id="rm-list"><p class="rm-p">Chargement…</p></div></div>';
    const nb = $('rm-notif'); if (nb) nb.onclick = () => { if (window.ftEnableNotifs) window.ftEnableNotifs(); setTimeout(() => { if (notifOn()) { const x = w.querySelector('.rm-warn'); if (x) x.remove(); } }, 2500); };
    w.querySelector('.rm-quick').onclick = e => {
      const b = e.target.closest('[data-q]'); if (!b) return;
      w.querySelectorAll('.rm-quick button').forEach(x => x.classList.toggle('on', x === b));
      $('rm-when').value = local(QUICK[+b.dataset.q][1]());
    };
    $('rm-when').addEventListener('input', () => w.querySelectorAll('.rm-quick button').forEach(x => x.classList.remove('on')));
    $('rm-form').onsubmit = ev => {
      ev.preventDefault();
      const txt = $('rm-txt').value.trim(), when = new Date($('rm-when').value);
      if (!txt) return;
      if (isNaN(when) || when < Date.now() + 60000) return toast('Choisissez une date à venir', 'info');
      if (LIST.filter(r => !r.sent_at).length >= 50) return toast('50 rappels en attente au maximum', 'info');
      const go = $('rm-go') && $('rm-go').checked ? 't-' + cur : '';
      const btn = $('rm-form').querySelector('[type="submit"]'); btn.disabled = true;
      window.__ftRest('/rest/v1/reminders', { method: 'POST', prefer: 'return=representation', body: { due_at: when.toISOString(), body: txt, go } })
        .then(() => { if ($('rm-ics') && $('rm-ics').checked) ics(when.toISOString(), txt); toast('Rappel programmé : ' + fmt(when.toISOString()), 'success'); $('rm-txt').value = ''; btn.disabled = false; load(); })
        .catch(e => { btn.disabled = false; toast(missing(e) ? 'Rappels non installés : l’administrateur doit exécuter le script Supabase.' : 'Enregistrement impossible : ' + e.message, 'error'); });
    };
    if (!pre.text) setTimeout(() => $('rm-txt').focus(), 50);
    load();
  };
  function load() {
    const h = $('rm-list'); if (!h) return;
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    window.__ftRest('/rest/v1/reminders?select=id,due_at,body,go,sent_at&or=(sent_at.is.null,due_at.gte.' + since + ')&order=due_at.asc&limit=100').then(r => {
      LIST = r || []; homeCard();
      const up = LIST.filter(x => !x.sent_at), past = LIST.filter(x => x.sent_at).reverse();
      const row = x => '<div class="rm-it' + (x.sent_at ? ' done' : '') + '"><div><b>' + esc(fmt(x.due_at)) + '</b><span>' + esc(x.body) + '</span>' + (x.go ? '<em>' + esc(tabName(x.go.slice(2)) || '') + '</em>' : '') + '</div><div class="rm-btns">' + (x.sent_at ? '' : '<button type="button" class="rm-del rm-cal" data-cal="' + esc(x.id) + '" aria-label="Ajouter à mon agenda" title="Ajouter à mon agenda">📅</button>') + '<button type="button" class="rm-del" data-id="' + esc(x.id) + '" aria-label="Supprimer le rappel">×</button></div></div>';
      h.innerHTML = (up.length ? up.map(row).join('') : '<p class="rm-p">Aucun rappel à venir.</p>') +
        (past.length ? '<details class="rm-past"><summary>Envoyés ces 7 derniers jours (' + past.length + ')</summary>' + past.map(row).join('') + '</details>' : '');
      h.onclick = e => {
        const cb = e.target.closest('[data-cal]'); if (cb) { const r = LIST.find(x => x.id === cb.dataset.cal); if (r) ics(r.due_at, r.body); return; }
        const b = e.target.closest('.rm-del'); if (!b) return;
        window.__ftRest('/rest/v1/reminders?id=eq.' + encodeURIComponent(b.dataset.id), { method: 'DELETE', prefer: 'return=minimal' }).then(() => { toast('Rappel supprimé', 'success'); load(); }).catch(er => toast(er.message, 'error'));
      };
    }).catch(e => { h.innerHTML = '<p class="rm-p">' + (missing(e) ? 'Les rappels ne sont pas encore installés (script Supabase à exécuter par l’administrateur).' : 'Chargement impossible : ' + esc(e && e.message || e)) + '</p>'; });
  }

  /* Accueil : prochains rappels (s’il y en a) */
  function homeCard() {
    const up = LIST.filter(x => !x.sent_at).slice(0, 3);
    let c = $('ft-rem-home');
    const anchor = document.querySelector('#view-home .fh-hist') || document.querySelector('#view-home .fh-pins');
    if (!up.length || !anchor) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('section'); c.id = 'ft-rem-home'; c.className = 'rm-home'; }
    const pins = document.querySelector('#view-home .fh-pins');
    if (window.__ftHomeCustom && window.__ftHomeCustom() && c.isConnected) { /* accueil personnalisé : la tuile garde sa place */ }
    else if (pins && pins.nextElementSibling !== c) pins.after(c); else if (!pins && c.parentNode !== anchor.parentNode) anchor.parentNode.insertBefore(c, anchor);
    c.innerHTML = '<div class="rm-home-h"><span>⏰ Prochains rappels</span><button type="button" data-rh="all">Tout voir ›</button></div>' + up.map(x => '<button type="button" class="rm-home-it" data-rh="all"><b>' + esc(fmt(x.due_at)) + '</b><span>' + esc(x.body) + '</span></button>').join('');
    c.onclick = e => { if (e.target.closest('[data-rh]')) window.ftReminders(); };
  }
  function refreshHome() {
    if (!logged() || !window.__ftRest) { LIST = []; homeCard(); return; }
    window.__ftRest('/rest/v1/reminders?select=id,due_at,body,go,sent_at&sent_at=is.null&order=due_at.asc&limit=20').then(r => { LIST = r || []; homeCard(); }).catch(() => {});
  }
  setTimeout(refreshHome, 3000);
  document.addEventListener('ft-login', () => setTimeout(refreshHome, 1500));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshHome(); });
  if (window.ftOnDom) window.ftOnDom(() => { if (LIST.length && !$('ft-rem-home')) homeCard(); });

  /* Bouton « Rappel » sous chaque mail généré par un simulateur */
  function mailButtons() {
    document.querySelectorAll('.ft-mail .ft-mail-btns').forEach(g => {
      if (g.querySelector('.ft-mail-rem')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-mail-rem'; b.textContent = '⏰ Rappel'; b.title = 'Programmer un rappel pour ce dossier';
      b.onclick = () => window.ftReminders({ text: 'Relancer : ' + (tabName(tab()) || 'dossier') });
      g.insertBefore(b, g.firstChild);
    });
  }
  if (window.ftOnDom) window.ftOnDom(mailButtons);

  /* Entrées : menu du compte, recherche (Ctrl+K), menu « ⋯ » du téléphone, notification */
  (window.FT_ACCT_ITEMS = window.FT_ACCT_ITEMS || []).push({ t: 'Mes rappels', run: () => window.ftReminders() });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Programmer un rappel', s: 'Notification à la date choisie (relance, fin de droits…)', kw: 'rappel relance relancer alarme notification échéance agenda', run: () => window.ftReminders() });
  (window.FT_GO = window.FT_GO || {}).rem = () => window.ftReminders();
  function moreItem() {
    const m = $('ft-more'); if (!m || m.querySelector('[data-k="rem"]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'rem';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/></svg><span>Mes rappels</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); setTimeout(() => window.ftReminders(), 30); });
    const hr = m.querySelector('hr'); m.insertBefore(b, hr || null);
  }
  if (window.ftOnDom) window.ftOnDom(moreItem);
})();
