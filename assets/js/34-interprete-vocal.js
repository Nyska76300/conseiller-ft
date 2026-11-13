(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANGS = [
    ['fr', 'fr-FR', 'Français'], ['en', 'en-GB', 'Anglais'], ['es', 'es-ES', 'Espagnol'], ['ar', 'ar-SA', 'Arabe'],
    ['pt', 'pt-PT', 'Portugais'], ['it', 'it-IT', 'Italien'], ['de', 'de-DE', 'Allemand'], ['ro', 'ro-RO', 'Roumain'],
    ['ru', 'ru-RU', 'Russe'], ['uk', 'uk-UA', 'Ukrainien'], ['tr', 'tr-TR', 'Turc'], ['pl', 'pl-PL', 'Polonais'],
    ['nl', 'nl-NL', 'Néerlandais'], ['zh-CN', 'zh-CN', 'Chinois'], ['fa', 'fa-IR', 'Persan (farsi)'], ['hi', 'hi-IN', 'Hindi'],
    ['vi', 'vi-VN', 'Vietnamien'], ['bn', 'bn-BD', 'Bengali'], ['sq', 'sq-AL', 'Albanais'], ['ka', 'ka-GE', 'Géorgien']
  ];
  const L = code => LANGS.find(l => l[0] === code) || LANGS[0];
  const st = { a: 'fr', b: 'en', rec: null, side: null };
  try { const s = JSON.parse(localStorage.getItem('ft-ip') || '{}'); if (s.a) st.a = s.a; if (s.b) st.b = s.b; } catch (e) {}
  const save = () => { try { localStorage.setItem('ft-ip', JSON.stringify({ a: st.a, b: st.b })); } catch (e) {} };
  const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3"/></svg>';

  async function translate(text, from, to) {
    if (from === to) return text;
    const f = from.split('-')[0] === 'zh' ? 'zh-CN' : from, t = to;
    try {
      const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + encodeURIComponent(f) + '&tl=' + encodeURIComponent(t) + '&q=' + encodeURIComponent(text));
      if (r.ok) { const j = await r.json(); const out = (j[0] || []).map(x => x[0]).join(''); if (out) return out; }
    } catch (e) {}
    const r2 = await fetch('https://api.mymemory.translated.net/get?langpair=' + encodeURIComponent(f.split('-')[0] + '|' + t.split('-')[0]) + '&q=' + encodeURIComponent(text.slice(0, 480)));
    const j2 = await r2.json();
    if (j2 && j2.responseData && j2.responseData.translatedText) return j2.responseData.translatedText;
    throw new Error('traduction indisponible');
  }
  function speak(text, code) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const loc = L(code)[1], vs = speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = loc; const v = vs.find(v => v.lang.replace('_', '-') === loc) || vs.find(v => v.lang.toLowerCase().startsWith(code.split('-')[0].toLowerCase()));
    if (v) u.voice = v; u.rate = .95;
    speechSynthesis.speak(u);
  }
  function live(t) { const e = $('ip-live'); if (e) e.textContent = t || ''; }
  async function handle(side, text) {
    text = String(text || '').trim(); if (!text) return;
    const from = side === 'a' ? st.a : st.b, to = side === 'a' ? st.b : st.a;
    const log = $('ip-log'); const em = log.querySelector('.ip-empty'); if (em) em.remove();
    const m = document.createElement('div'); m.className = 'ip-msg ' + side;
    m.innerHTML = '<div class="tr">…</div><div class="or">' + esc(L(from)[2]) + ' : ' + esc(text) + '</div>';
    log.appendChild(m); log.scrollTop = log.scrollHeight; live('Traduction…');
    try {
      const out = await translate(text, from, to);
      m.querySelector('.tr').innerHTML = '<button class="rp" title="Réécouter">🔊</button>' + esc(out);
      m.querySelector('.rp').onclick = () => speak(out, to);
      live(''); speak(out, to);
    } catch (e) {
      m.querySelector('.tr').textContent = '⚠️ Traduction impossible (connexion Internet ?)'; live('');
    }
    log.scrollTop = log.scrollHeight;
  }
  function stopRec() { if (st.rec) { try { st.rec.stop(); } catch (e) {} } }
  function listen(side) {
    if (st.rec) { const same = st.side === side; stopRec(); if (same) return; }
    if (!SR) { live('Dictée non disponible sur ce navigateur : utilisez Safari ou Chrome, ou tapez le texte ci-dessous.'); return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    const r = new SR(); r.lang = L(side === 'a' ? st.a : st.b)[1]; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    let finalTxt = '';
    const btn = $('ip-mic-' + side);
    r.onstart = () => { btn.classList.add('rec'); btn.querySelector('span').textContent = 'J’écoute… (toucher pour finir)'; live(''); };
    r.onresult = ev => { let t = ''; for (let i = 0; i < ev.results.length; i++) { t += ev.results[i][0].transcript; if (ev.results[i].isFinal) finalTxt = t; } live('« ' + t + ' »'); if (!finalTxt) finalTxt = ''; r._last = t; };
    r.onerror = ev => { live(ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Micro refusé : autorisez le micro pour ce site dans les réglages du navigateur.' : ev.error === 'no-speech' ? 'Je n’ai rien entendu, réessayez.' : 'Erreur de dictée : ' + ev.error); };
    r.onend = () => { btn.classList.remove('rec'); btn.querySelector('span').textContent = 'Parler'; const t = finalTxt || r._last || ''; st.rec = null; st.side = null; if (t) handle(side, t); };
    st.rec = r; st.side = side; r.start();
  }
  function opts(sel) { return LANGS.map(l => '<option value="' + l[0] + '"' + (l[0] === sel ? ' selected' : '') + '>' + l[2] + '</option>').join(''); }
  function build() {
    if ($('ft-ip')) return;
    const d = document.createElement('div'); d.id = 'ft-ip'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Interprète vocal');
    d.innerHTML = '<div class="ip-box">' +
      '<div class="ip-top"><b>🗣️ Interprète vocal</b><button class="ip-mini" id="ip-face" title="Retourne la partie de l’usager pour poser le téléphone entre vous deux">Face à face</button><button class="ip-mini" id="ip-clear">Effacer</button><button class="ip-x" id="ip-close" aria-label="Fermer">✕</button></div>' +
      '<div class="ip-side sb"><span class="ip-who">Usager</span><select id="ip-lb">' + opts(st.b) + '</select><button class="ip-mic b" id="ip-mic-b">' + MIC + '<span>Parler</span></button></div>' +
      '<div class="ip-log" id="ip-log"><div class="ip-empty">Chacun appuie sur <b>Parler</b> à son tour : la phrase est traduite à l’écran et lue à voix haute dans la langue de l’autre.<br><br>Évitez de dicter des données personnelles (n° de sécurité sociale, identifiant…) : la traduction passe par un service en ligne.</div></div>' +
      '<div class="ip-live" id="ip-live"></div>' +
      '<div class="ip-type"><select id="ip-ts" style="flex:none;width:120px"><option value="a">Conseiller</option><option value="b">Usager</option></select><input id="ip-ti" placeholder="Ou tapez une phrase puis Entrée"></div>' +
      '<div class="ip-side sa"><span class="ip-who">Conseiller</span><select id="ip-la">' + opts(st.a) + '</select><button class="ip-mic" id="ip-mic-a">' + MIC + '<span>Parler</span></button></div>' +
      '<div class="ip-note">Dictée et voix : Safari ou Chrome. La qualité dépend du micro et des voix installées sur l’appareil.</div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) close(); });
    $('ip-close').onclick = close;
    $('ip-clear').onclick = () => { $('ip-log').innerHTML = ''; live(''); };
    $('ip-face').onclick = () => { d.classList.toggle('face'); $('ip-face').classList.toggle('on', d.classList.contains('face')); };
    $('ip-la').onchange = e => { st.a = e.target.value; save(); };
    $('ip-lb').onchange = e => { st.b = e.target.value; save(); };
    $('ip-mic-a').onclick = () => listen('a');
    $('ip-mic-b').onclick = () => listen('b');
    $('ip-ti').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) { handle($('ip-ts').value, e.target.value); e.target.value = ''; } });
  }
  function close() { stopRec(); try { speechSynthesis.cancel(); } catch (e) {} const d = $('ft-ip'); if (d) d.classList.remove('on'); }
  window.ftInterp = function () { build(); $('ft-ip').classList.add('on'); try { speechSynthesis.getVoices(); } catch (e) {} };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('ft-ip') && $('ft-ip').classList.contains('on')) close(); });

  /* Le bouton haut-parleur de la barre du haut ouvre l’interprète */
  function hook() {
    const b = $('ft-tts');
    if (b && !b.dataset.ip) {
      b.dataset.ip = '1'; b.style.display = '';
      b.onclick = () => window.ftInterp();
      const fix = () => { b.title = 'Interprète vocal : conversation à deux dans deux langues'; b.setAttribute('aria-label', b.title); const l = b.querySelector('.tt-l'); if (l) l.textContent = 'Interprète'; };
      fix(); new MutationObserver(() => { const l = b.querySelector('.tt-l'); if (l && l.textContent !== 'Interprète') fix(); }).observe(b, { childList: true });
    }
    const m = $('ft-more');
    if (m && !m.querySelector('[data-k="interp"]')) {
      const it = document.createElement('button'); it.type = 'button'; it.setAttribute('role', 'menuitem'); it.dataset.k = 'interp';
      it.innerHTML = MIC + '<span>Interprète vocal</span>';
      it.addEventListener('click', ev => { ev.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); window.ftInterp(); });
      m.insertBefore(it, m.firstChild);
    }
  }
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Interprète vocal', s: 'Conversation à voix haute entre deux langues', kw: 'traduire traducteur traduction interprète langue étranger anglais arabe espagnol voix micro', run: () => setTimeout(window.ftInterp, 120) });
  if (window.ftOnDom) window.ftOnDom(hook);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 400)); else setTimeout(hook, 400);
})();
