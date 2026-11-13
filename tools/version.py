"""Change la version du site partout d'un coup.
Usage : python3 tools/version.py 2026-11-14.1   (sans argument : vérifie la cohérence)
Met à jour <meta name="ft-version"> et les « ?v= » des fichiers assets/ (le navigateur
recharge alors les fichiers modifiés au lieu de garder l'ancienne copie)."""
import re, sys, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
h = p.read_text(encoding='utf-8')
cur = re.search(r'name="ft-version" content="([^"]+)"', h).group(1)
if len(sys.argv) > 1:
    new = sys.argv[1]
    h = h.replace(f'name="ft-version" content="{cur}"', f'name="ft-version" content="{new}"')
    h = re.sub(r'(assets/[\w./-]+\.(?:js|css))(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={new}"', h)
    p.write_text(h, encoding='utf-8'); print(cur, '->', new)
else:
    bad = [m.group(0) for m in re.finditer(r'assets/[\w./-]+\.(?:js|css)(\?v=[^"]*)?"', h) if m.group(1) != f'?v={cur}']
    if bad: print('Versions incohérentes :', bad[:5]); sys.exit(1)
    # Fichiers locaux référencés (scripts, styles, images) : ils doivent exister
    root = p.parent
    refs = set(re.findall(r'(?:src|href)="((?:assets|icons)/[^"?#]+)', h))
    for js in (root / 'assets/js').glob('*.js'):
        refs |= set(re.findall(r'["\'](assets/[\w./-]+\.(?:png|jpg|svg|webp))', js.read_text(encoding='utf-8')))
    missing = sorted(r for r in refs if not (root / r).exists())
    if missing: print('Fichiers introuvables :', missing); sys.exit(1)
    print('OK', cur)
