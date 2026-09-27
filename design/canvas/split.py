"""Build the 12 per-area canvas bundles (docs/redesign/CANVASES.md, decision D-R25).

Usage: python3 split.py <out_dir>
Writes <out_dir>/<area>/project/{canvas.json, *.dc.html}. Each bundle holds its area's boards
(from sections.json, grouped by layout.py's PAGES) plus every component file they mount through
<dc-import>, shown in a "Components used on this canvas" section. No pages: one small canvas each,
so the canvas app loads every board. Publish each bundle to its canvas: canvas.json as file_path,
the .dc.html files as files, root = <out_dir>/<area>.
"""
import datetime
import json
import os
import re
import shutil
import sys

out = sys.argv[1]
secs = json.load(open('sections.json'))
src = open('layout.py').read()
PAGES = eval(src[src.index('PAGES = [') + 8:src.index(']\ndef page_of') + 1])
GAP_X, GAP_Y, TITLE_H, SEC_GAP = 80, 120, 120, 260


def page_of(title):
    for pid, _, prefixes in PAGES:
        if any(title.startswith(p) for p in prefixes):
            return pid
    raise SystemExit('no area for section: ' + title)


IMPORT = re.compile(r'<dc-import name="([A-Za-z0-9_]+)"')


def deps(f, seen):
    for n in IMPORT.findall(open('project/' + f).read()):
        d = n + '.dc.html'
        if d not in seen:
            seen.add(d)
            deps(d, seen)


now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
for pid, pname, _ in PAGES:
    ss = [(t, items) for t, items in secs if page_of(t) == pid]
    files = [it[0] for _, items in ss for it in items]
    need = set()
    for f in files:
        deps(f, need)
    extra = sorted(need - set(files))
    if extra:
        rows = []
        for f in extra:
            m = re.search(r'"\$preview":\{"width":(\d+),"height":(\d+)\}', open('project/' + f).read())
            w, h = (int(m.group(1)), int(m.group(2))) if m else (1280, 800)
            rows.append([f, w, min(h, 8000), f.replace('.dc.html', '') + ' · component (all props in Tweaks)', True])
        ss.append(('Components used on this canvas (open Tweaks to change props)', rows))
    boards, order, notes = {}, [], {}
    area = sum((it[1] + GAP_X) * (it[2] + GAP_Y) for _, items in ss for it in items)
    row_w = max(max(it[1] for _, items in ss for it in items), int((area * 1.6) ** 0.5))
    y0 = 0
    for si, (t, items) in enumerate(ss):
        notes[f'sec_{si}'] = {'x': 0, 'y': y0 - 230, 'text': t, 'kind': 'title1', 'maxW': max(row_w, 2000)}
        x = y = rowh = 0
        for f, w, h, title, inter in items:
            if x > 0 and x + w > row_w:
                x, y, rowh = 0, y + rowh + GAP_Y, 0
            b = {'x': x, 'y': y0 + y, 'w': w, 'h': h, 'title': title}
            if inter:
                b['is_interactive'] = True
            boards[f] = b
            order.append(f)
            x += w + GAP_X
            rowh = max(rowh, h)
        y0 += y + rowh + TITLE_H + SEC_GAP + 110
    c = {'v': 3, 'createdOnFiles': {'v': 1, 'at': now}, 'title': 'AwakeTab · ' + pname.split(' · ', 1)[1],
         'launch': {'view': 'canvas'}, 'pages': [], 'boards': boards, 'order': order, 'notes': notes,
         'designSystems': [], 'attachments': {}}
    d = os.path.join(out, pid, 'project')
    os.makedirs(d, exist_ok=True)
    for f in boards:
        shutil.copyfile('project/' + f, os.path.join(d, f))
    json.dump(c, open(os.path.join(d, 'canvas.json'), 'w'), indent=1, ensure_ascii=False)
    print(pid, len(files), 'boards +', len(extra), 'components')
