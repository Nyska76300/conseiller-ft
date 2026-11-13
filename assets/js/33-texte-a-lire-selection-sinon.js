(function () {
  const $ = id => document.getElementById(id);
  const ok = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  const ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  let speaking = false;

  /* Texte à lire : sélection, sinon mail ouvert, sinon mail généré, sinon contenu de l’outil */
  function textToRead() {
    const sel = String(window.getSelection ? window.getSelection() : '').trim();
    if (sel.length >= 3) return sel;
    let tab = ''; try { tab = String(activeNavTab); } catch (e) {}
    if (tab === 'cvm') { const p = $('preview-body') || document.querySelector('#tab-content-cvm .prose, #tab-content-cvm'); if (p) return p.innerText.trim(); }
    const view = document.querySelector('[id^="view-"]:not(.hidden):not(.ft-split-b)');
    if (!view) return '';
    const ta = [...view.querySelectorAll('.ft-mail textarea')].find(t => t.offsetParent && t.value.trim());
    if (ta) return ta.value.trim();
    const clone = view.cloneNode(true);
    clone.querySelectorAll('.hub-bar,button,input,select,textarea,svg,script,style,.ft-mail,[hidden],.hidden,.fr-hide').forEach(e => e.remove());
    return clone.innerText.replace(/\n{2,}/g, '\n').trim().slice(0, 6000);
  }
  function chunks(t) {
    const parts = t.replace(/\s+/g, ' ').match(/[^.!?;:\n]+[.!?;:]?/g) || [t];
    const out = []; let cur = '';
    parts.forEach(p => { if ((cur + p).length > 220) { if (cur) out.push(cur); cur = p; } else cur += p; });
    if (cur.trim()) out.push(cur);
    return out.map(s => s.trim()).filter(Boolean);
  }
  function voice() {
    const vs = speechSynthesis.getVoices();
    return vs.find(v => /^fr(-|_)FR/i.test(v.lang) && /google|amélie|thomas|audrey|denise|henri/i.test(v.name)) || vs.find(v => /^fr(-|_)FR/i.test(v.lang)) || vs.find(v => /^fr/i.test(v.lang)) || null;
  }
  function setBtn() {
    const b = $('ft-tts'); if (!b) return;
    b.classList.toggle('on', speaking);
    b.innerHTML = (speaking ? ICON_STOP : ICON_ON) + '<span class="tt-l">' + (speaking ? 'Arrêter' : 'Écouter') + '</span>';
    const t = speaking ? 'Arrêter la lecture' : 'Lire à voix haute (le texte sélectionné, ou le mail, ou la page)';
    b.title = t; b.setAttribute('aria-label', t); b.setAttribute('aria-pressed', String(speaking));
    const m = document.querySelector('#ft-more [data-k="tts"] span'); if (m) m.textContent = speaking ? 'Arrêter la lecture' : 'Lire à voix haute';
  }
  function stop() { try { speechSynthesis.cancel(); } catch (e) {} speaking = false; setBtn(); }
  window.ftSpeak = function (txt) {
    if (!ok) { toast('La lecture à voix haute n’est pas disponible sur ce navigateur', 'info'); return; }
    if (speaking) { stop(); return; }
    const t = (txt || textToRead()).trim();
    if (!t) { toast('Rien à lire : sélectionnez un texte ou ouvrez un mail', 'info'); return; }
    speechSynthesis.cancel();
    const v = voice(), list = chunks(t);
    speaking = true; setBtn();
    list.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c);
      u.lang = 'fr-FR'; if (v) u.voice = v; u.rate = 1; u.pitch = 1;
      if (i === list.length - 1) { u.onend = () => { speaking = false; setBtn(); }; }
      u.onerror = () => { speaking = false; setBtn(); };
      speechSynthesis.speak(u);
    });
  };
  if (ok) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) {} }

  function build() {
    if (!ok || $('ft-tts')) return;
    const anchor = $('rp-btn') || $('ft-acct'); if (!anchor) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-tts';
    b.onclick = () => window.ftSpeak();
    anchor.parentNode.insertBefore(b, anchor.nextSibling); setBtn();
  }
  function moreItem() {
    const m = $('ft-more'); if (!ok || !m || m.querySelector('[data-k="tts"]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.k = 'tts';
    b.innerHTML = ICON_ON + '<span>Lire à voix haute</span>';
    b.addEventListener('click', ev => { ev.stopPropagation(); document.documentElement.classList.remove('ft-more-on'); setTimeout(() => window.ftSpeak(), 30); });
    m.insertBefore(b, m.firstChild);
  }
  /* La lecture s’arrête quand on change d’outil */
  const _sw = switchNavTab;
  switchNavTab = function () { if (speaking) stop(); return _sw.apply(this, arguments); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && speaking) stop(); });
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  if (ok) window.FT_ACTIONS.push({ t: 'Lire à voix haute', s: 'Le texte sélectionné, le mail ouvert ou la page', kw: 'lire voix haute audio écouter son volume synthèse vocale', run: () => setTimeout(() => window.ftSpeak(), 120) });
  const go = () => { build(); moreItem(); };
  if (window.ftOnDom) window.ftOnDom(go);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(go, 300)); else setTimeout(go, 300);
})();
