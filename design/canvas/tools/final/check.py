# Final-audit checks over render dumps (fix1b/render.mjs output): contrast, targets, overflow, copy.
# usage: A=<audit dir> python3 check.py [board-regex]   -> prints per-board issues and totals
import json, os, re, sys, collections
try:
    from PIL import Image
except ImportError:
    Image = None
SHOTS = os.environ.get('S', os.path.join(os.path.dirname(os.environ.get('A', '/tmp/claude-0/base/audit/').rstrip('/')), 'shots') + '/')
def lum(c):
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0] / 255) + 0.7152 * f(c[1] / 255) + 0.0722 * f(c[2] / 255)
def ratio(a, b):
    x, y = lum(a), lum(b); return (max(x, y) + 0.05) / (min(x, y) + 0.05)
def rgbt(c):
    m = re.match(r'rgba?\(([^)]*)\)', c or ''); v = [float(x) for x in re.split(r'[ ,/]+', m.group(1)) if x] if m else None
    return (v[0], v[1], v[2], v[3] if len(v) > 3 else 1) if v else None
A = os.environ.get('A', '/tmp/claude-0/base/audit/')
flt = re.compile(sys.argv[1] if len(sys.argv) > 1 else '.')
PILLS = {'Ready', 'Starting…', 'Screen awake', 'Paused — tab hidden', "Blocked — here's the fix", 'Tap to use the fallback',
         'Awake via video fallback', 'Starts when you open this tab', 'System awake'}
H24 = re.compile(r'\b(at|until|since|ends?|by|from|to)\s(1[3-9]|2[0-3]|00):[0-5]\d\b(?!\s?(AM|PM))', re.I)
BAD = [(re.compile(r'battery saver (blocks|denies|refuses)|Low Power Mode (blocks|denies)', re.I), 'battery-saver blame'),
       (re.compile(r'was \$29'), 'fictitious former price'), (re.compile(r'\bforever\b', re.I), '"forever" (O-38)'),
       (re.compile(r'Sponsored'), 'sponsor card (O-04)'), (re.compile(r'Try again'), '"Try again" (use Retry)'),
       (re.compile(r'floating (pill|timer)', re.I), 'floating window wording'), (re.compile(r'Who tested this'), 'O-72 rename'),
       (re.compile(r'no limit\b'), 'O-87 (∞)'), (re.compile(r'Sample data|Demo numbers'), 'designer note')]
tot = collections.Counter(); per = {}
for f in sorted(os.listdir(A)):
    d = json.load(open(A + f)); b = f[:-5]
    if not flt.search(b): continue
    W = d['board']['w']; issues = []
    img = None
    if Image and os.path.exists(SHOTS + b + '.png'):
        img = Image.open(SHOTS + b + '.png').convert('RGB')
    scaled = b.startswith(('StoreShot', 'StorePromo', 'StoreMarquee', 'Og'))  # image assets: scaled mocks, not live UI
    for it in d['items']:
        if it.get('ph') or it.get('forced'): continue
        txt = (it.get('text') or '').strip(); vis = it['w'] > 0 and it['h'] > 0 and (1 if it.get('op') is None else it['op']) > 0.05
        cr = it.get('cr')
        if it.get('own') and txt and vis and cr and not cr.get('grad'):
            fs = float(it['fs'].rstrip('px')); big = fs >= 24 or (fs >= 18.66 and int(it['fw']) >= 600)
            need = 3 if big else 4.5
            if cr['r'] < need - 0.05: issues.append(('contrast', f'{cr["r"]:.2f}<{need} "{txt[:40]}"'))
        elif it.get('own') and txt and vis and cr and cr.get('grad') and img is not None:
            # text over a gradient or image: background = the most common pixel colour in the text box of the screenshot
            fg = rgbt(it['color']); x0, y0 = max(0, it['x']), max(0, it['y']); x1, y1 = min(img.width, it['x'] + int(it['w'])), min(img.height, it['y'] + int(it['h']))
            if fg and fg[3] > 0.5 and x1 - x0 > 2 and y1 - y0 > 2:
                px = img.load(); ring = collections.Counter()
                for xx in range(x0, x1): ring[px[xx, y0]] += 1; ring[px[xx, y1 - 1]] += 1
                for yy in range(y0, y1): ring[px[x0, yy]] += 1; ring[px[x1 - 1, yy]] += 1
                # background = the commonest colour on the text box's edge, away from the glyph colour
                far = [(n, c) for c, n in ring.items() if sum(abs(c[i] - fg[i]) for i in range(3)) > 60]
                bg = max(far)[1] if far else None
                fs = float(it['fs'].rstrip('px')); big = fs >= 24 or (fs >= 18.66 and int(it['fw']) >= 600); need = 3 if big else 4.5
                if bg and ratio(fg[:3], bg) < need - 0.05: issues.append(('contrast', f'{ratio(fg[:3], bg):.2f}<{need} (over gradient) "{txt[:40]}"'))
        interactive = it['tag'] in ('button', 'input', 'select') or it['role'] in ('tab', 'radio', 'switch', 'checkbox') or (it['tag'] == 'a' and it['disp'] != 'inline')
        if interactive and vis and not scaled and not (it['tag'] == 'a' and 'by AwakeTab' in txt and it['h'] >= 24) and (it['w'] < 43.5 or it['h'] < 43.5) and it['w'] > 4 and 'data-placeholder' not in it.get('style', ''):
            issues.append(('target', f'{it["tag"]} {round(it["w"])}x{round(it["h"])} "{(txt or it.get("aria",""))[:30]}"'))
        if vis and it['tag'] not in ('code', 'pre') and (txt and it.get('own') or interactive) and it['x'] + it['w'] > W + 1 and it['w'] < W * 3: issues.append(('overflow', f'{it["tag"]} right edge {round(it["x"]+it["w"])} > {W} "{txt[:30]}"'))
        if it.get('own') and txt:
            if it['tag'] == 'output' and 26 <= it['h'] <= 60 and txt not in PILLS and txt != 'Saved' and not re.search(r'[/.]\w', txt) and not b.startswith(('Intl', 'A11yScreen')):
                issues.append(('pill', f'pill text not one of the seven: "{txt[:50]}"'))
            for rx, why in BAD:
                if rx.search(txt): issues.append(('copy', f'{why}: "{txt[:60]}"'))
            if H24.search(txt) and 'Intl' not in b: issues.append(('copy', f'24h time: "{txt[:50]}"'))
    if issues:
        per[b] = issues
        for k, _ in issues: tot[k] += 1
for b, iss in per.items():
    c = collections.Counter(k for k, _ in iss)
    print(b, dict(c)); [print('   ', k, v) for k, v in list(dict.fromkeys(iss))[:12]]
print('TOTAL', dict(tot), 'boards with issues', len(per))
