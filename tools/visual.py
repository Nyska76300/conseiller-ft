#!/usr/bin/env python3
"""Vérifications visuelles automatiques.

Usage : python3 tools/visual.py [dossier_sortie] [dossier_reference]
  (par défaut : visual-out/ et visual-ref/)

Pour chaque page clé, sur ordinateur (thème sombre) et téléphone (thème clair), avec une horloge figée :
  - capture d'écran dans le dossier de sortie ;
  - ÉCHEC si : erreur JavaScript, image cassée (logo…), élément essentiel absent ;
  - AVERTISSEMENT si : icône non dessinée (nom d'icône inconnu) ;
  - si une capture de référence existe (dossier_reference, conservé entre deux passages par le cache GitHub),
    calcule la part de pixels qui ont changé et fabrique une image des différences (diff-*.png).
Le résumé est écrit dans $GITHUB_STEP_SUMMARY quand il existe.
"""
import http.server, socketserver, threading, os, sys, functools, shutil

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'visual-out')
REF = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'visual-ref')
# (onglet, éléments qui doivent être visibles)
PAGES = [
    ('home', ['#view-home .home-hero', '#view-home .fh-tools']),
    ('cvm', ['#view-cvm']),
    (1, ['[id^="view-"]:not(.hidden)']),
    ('droits', ['#view-droits']),
    ('bareme', ['#view-bareme']),
    ('formation', ['#view-formation']),
    ('compare', ['#view-compare']),
]
SETUPS = [('ordi-sombre', {'width': 1366, 'height': 900}, 'dark'), ('tel-clair', {'width': 390, 'height': 800}, 'light')]
FROZEN = """
(() => { const T = new Date('2026-03-16T10:30:00+01:00').getTime(); const D = Date;
  class F extends D { constructor(...a) { if (!a.length) super(T); else super(...a); } static now() { return T; } }
  window.Date = F; })();
"""


def diff(a, b, out):
    try:
        from PIL import Image, ImageChops
    except ImportError:
        return None
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if A.size != B.size:
        return 100.0
    d = ImageChops.difference(A, B).convert('L').point(lambda v: 255 if v > 24 else 0)
    n = d.histogram()[255]
    pct = 100.0 * n / (A.size[0] * A.size[1])
    if n:
        red = Image.new('RGB', A.size, (255, 0, 64))
        Image.composite(red, B.point(lambda v: v // 3), d).save(out)
    return pct


def main():
    os.makedirs(OUT, exist_ok=True)
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    fails, warns, rows = [], [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, vp, theme in SETUPS:
            mob = vp['width'] < 500
            c = b.new_context(viewport=vp, is_mobile=mob, has_touch=mob, reduced_motion='reduce')
            c.add_init_script(FROZEN + "try{localStorage.setItem('ft_news_seen','9999-01-01.1');localStorage.setItem('ft_tour_done','1');sessionStorage.setItem('ft_sb_skip','1');"
                              + ("localStorage.setItem('ft_theme','light');" if theme == 'light' else '') + "}catch(e){}")
            pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(url); pg.wait_for_timeout(2500)
            for tab, must in PAGES:
                n0 = len(errs)
                try: pg.evaluate(f"switchNavTab({tab!r})")
                except Exception as e: errs.append(str(e))
                pg.wait_for_timeout(600)
                pg.add_style_tag(content='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}')
                label = f'{name} / {tab}'
                for e in errs[n0:]:
                    fails.append(f'{label} : erreur JavaScript « {e[:160]} »')
                broken = pg.evaluate("[...document.images].filter(i=>i.offsetParent&&i.complete&&!i.naturalWidth&&!/^data:/.test(i.src)).map(i=>i.getAttribute('src'))")
                for s in broken:
                    fails.append(f'{label} : image cassée {s}')
                for sel in must + ([] if mob else ['header img']):
                    if not pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0}", sel):
                        fails.append(f'{label} : élément absent ou invisible {sel}')
                miss = pg.evaluate("window.lucide&&lucide.icons&&typeof lucide.icons[Object.keys(lucide.icons)[0]]!=='string'?[...new Set([...document.querySelectorAll('[id^=\"view-\"]:not(.hidden) i[data-lucide],header i[data-lucide]')].map(i=>i.getAttribute('data-lucide')))]:[]")
                if miss:
                    warns.append(f"{label} : icône(s) non dessinée(s) {', '.join(miss[:8])}")
                fn = f'{name}-{tab}.png'
                pg.screenshot(path=os.path.join(OUT, fn))
                ref = os.path.join(REF, fn)
                pct = diff(ref, os.path.join(OUT, fn), os.path.join(OUT, 'diff-' + fn)) if os.path.exists(ref) else None
                rows.append((label, '—' if pct is None else f'{pct:.2f} %'))
            c.close()
    rep = ['## Vérifications visuelles', '', '| Page | Pixels changés depuis le dernier passage |', '|---|---|'] + [f'| {a} | {d} |' for a, d in rows]
    if fails: rep += ['', '### ❌ Problèmes'] + ['- ' + f for f in fails]
    if warns: rep += ['', '### ⚠️ À regarder'] + ['- ' + w for w in warns]
    if not fails: rep += ['', '✅ Aucune erreur, image cassée ni élément manquant.']
    print('\n'.join(rep))
    sm = os.environ.get('GITHUB_STEP_SUMMARY')
    if sm:
        with open(sm, 'a') as f: f.write('\n'.join(rep) + '\n')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
