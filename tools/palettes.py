"""Génère les thèmes de couleurs (assets/css/pal-*.css) à partir des feuilles de style du site.

Usage : python3 tools/palettes.py
Chaque thème ne contient que les déclarations dont la couleur change (bleus, cyans, ardoises),
recalculées avec une autre teinte. Les rouges, verts et ambres (erreurs, succès, alertes) ne bougent pas.
À relancer après une modification des couleurs dans assets/css/ (la CI vérifie que c'est à jour)."""
import colorsys, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = [ROOT / 'assets/css' / f for f in ('base.css', 'tailwind.css', 'app.css')]

# nom : (teinte cible, écart conservé, facteur de saturation des fonds, facteur des accents)
PALETTES = {
    'emeraude': (160, 0.45, 1.0, 1.0),
    'sarcelle': (184, 0.40, 1.0, 1.0),
    'amethyste': (268, 0.45, 1.0, 1.0),
    'framboise': (330, 0.35, 0.9, 1.0),
    'ardoise': (215, 1.0, 0.15, 0.55),
}
H_MIN, H_MAX, H_MID = 178, 268, 220  # famille « bleu » de l’interface d’origine

HEX = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b')
RGB = re.compile(r'rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(\s*[,/][^)]*)?\)')


def shift(r, g, b, pal):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    hd = h * 360
    if s < 0.06 or not (H_MIN <= hd <= H_MAX):
        return None
    c, spread, sbg, sacc = pal
    nh = (c + (hd - H_MID) * spread) % 360
    ns = min(1, s * (sbg if (l < 0.3 or l > 0.92) else sacc))
    # même luminosité perçue que la couleur d’origine (contrastes du texte conservés)
    target = lum(r / 255, g / 255, b / 255)
    lo, hi = 0.0, 1.0
    for _ in range(22):
        mid = (lo + hi) / 2
        if lum(*colorsys.hls_to_rgb(nh / 360, mid, ns)) < target: lo = mid
        else: hi = mid
    nr, ng, nb = colorsys.hls_to_rgb(nh / 360, (lo + hi) / 2, ns)
    return round(nr * 255), round(ng * 255), round(nb * 255)


def lum(r, g, b):
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def recolor(text, pal):
    changed = [False]

    def hx(m):
        v = m.group(1)
        if len(v) in (3, 4):
            v = ''.join(ch * 2 for ch in v)
        r, g, b = int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16)
        out = shift(r, g, b, pal)
        if not out:
            return m.group(0)
        changed[0] = True
        return '#%02x%02x%02x' % out + (v[6:8] if len(v) == 8 else '')

    def rg(m):
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        out = shift(r, g, b, pal)
        if not out:
            return m.group(0)
        changed[0] = True
        tail = m.group(4) or ''
        if ',' in m.group(0)[:len(m.group(0)) - len(tail)] or tail.strip().startswith(','):
            return ('rgba(%d,%d,%d%s)' % (*out, tail)) if tail else 'rgb(%d,%d,%d)' % out
        return 'rgb(%d %d %d%s)' % (*out, tail)

    t = HEX.sub(hx, text)
    t = RGB.sub(rg, t)
    return t, changed[0]


def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)


def blocks(css, i=0):
    """Découpe le CSS en (préambule, contenu) : règle simple ou bloc @ imbriqué."""
    out = []
    n = len(css)
    while i < n:
        j = css.find('{', i)
        k = css.find('}', i)
        if j < 0 or (0 <= k < j):
            return out, (k + 1 if k >= 0 else n)
        head = css[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports') or head.startswith('@layer'):
            inner, end = blocks(css, j + 1)
            out.append((head, inner))
            i = end
        elif head.startswith('@'):
            depth, p = 1, j + 1
            while p < n and depth:
                depth += {'{': 1, '}': -1}.get(css[p], 0); p += 1
            i = p  # @keyframes, @font-face… ignorés
        else:
            e = css.find('}', j)
            out.append((head, css[j + 1:e]))
            i = e + 1
    return out, n


def render(items, pal):
    res = []
    for head, body in items:
        if isinstance(body, list):
            inner = render(body, pal)
            if inner:
                res.append(head + '{' + ''.join(inner) + '}')
            continue
        decls = []
        for d in body.split(';'):
            if ':' not in d or 'var(--' in d.split(':', 1)[0]:
                pass
            nd, ch = recolor(d, pal)
            if ch:
                decls.append(nd.strip())
        if decls and head:
            res.append(head + '{' + ';'.join(decls) + '}')
    return res


def build():
    css = '\n'.join(strip_comments(p.read_text(encoding='utf-8')) for p in SRC)
    items, _ = blocks(css)
    out = {}
    for name, pal in PALETTES.items():
        rules = render(items, pal)
        out[name] = '/* Thème « ' + name + ' » : généré par tools/palettes.py, ne pas modifier à la main */\n' + '\n'.join(rules) + '\n'
    return out


if __name__ == '__main__':
    files = build()
    check = '--check' in sys.argv
    stale = []
    for name, txt in files.items():
        p = ROOT / 'assets/css' / ('pal-' + name + '.css')
        if check:
            if not p.exists() or p.read_text(encoding='utf-8') != txt:
                stale.append(p.name)
        else:
            p.write_text(txt, encoding='utf-8')
            print(p.name, len(txt), 'octets')
    if check:
        if stale:
            print('Thèmes à régénérer (python3 tools/palettes.py) :', ', '.join(stale)); sys.exit(1)
        print('OK thèmes à jour')
