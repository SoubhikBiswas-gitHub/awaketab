"""Rebuild project/canvas.json from sections.json.

The canvas is split into PAGES (canvas.json `pages`, one tab each): the canvas only loads a board once it is
in view AND big enough on screen; zoomed out over a big page every board stays a blank "Click to load"
frame. So each product area is split into pages of at most MAX_PER_PAGE boards that fit one screen. Inside a page, sections keep their order and are packed into columns (reading
order: column 1 top to bottom, then column 2); inside a section, boards wrap at MAX_ROW_W.
"""
import json

GAP_X, GAP_Y, TITLE_H, SEC_GAP = 80, 120, 120, 260
MAX_ROW_W = 7200      # widest row inside a section before wrapping
COL_GAP = 800         # space between columns
N_COLS = 3            # columns per page

c = json.load(open('project/canvas.json'))
secs = json.load(open('sections.json'))
notes = {k: v for k, v in c['notes'].items()
         if not k.startswith('row') and k != 'titleD' and not k.startswith('sec_')}

PAGES = [
    ('tool', '1 · Tool', ['Tool · phone', 'Tool · tablet', 'Tool · desktop', 'Tool · more screen sizes', 'Tool · large displays']),
    ('states', '2 · Tool states', ['Tool · edge states', 'Tool · banners', 'Tool · shortcuts', 'System · offline']),
    ('ambient', '3 · Ambient & floating window', ['Ambient', 'Floating window']),
    ('content', '4 · Content & guides', ['Content ·', 'Hubs ·', 'Guide types']),
    ('site', '5 · Site pages', ['Preset page', 'Extension landing', 'Privacy, terms']),
    ('pro', '6 · Pro & checkout', ['Pro ·', 'System · browser tabs', 'System · checkout']),
    ('extension', '7 · Chrome extension', ['Chrome extension', 'Extension ·', 'Chrome Web Store', 'Store promo']),
    ('embed', '8 · Embed, kiosk & library', ['Embed', 'Kiosk']),
    ('growth', '9 · Growth moments', ['Growth ·']),
    ('a11y', '10 · Languages & accessibility', ['Languages', 'Accessibility', 'Language switcher']),
    ('brand', '11 · Brand & share images', ['Brand', 'Social share']),
    ('components', '12 · Components (all props)', ['Page components']),
]
def page_of(title):
    for pid, _, prefixes in PAGES:
        if any(title.startswith(pf) for pf in prefixes):
            return pid
    raise SystemExit('no page for section: ' + title)

MAX_PER_PAGE = 16      # boards per page: a whole page fits the screen at a zoom where every board loads

# 1. Assign sections to pages: each area splits into pages of at most MAX_PER_PAGE boards.
area_secs = {pid: [] for pid, _, _ in PAGES}
for title, items in secs:
    area_secs[page_of(title)].append((title, items))
page_list = []   # (page id, page name, [(title, items)])
for pid, name, _ in PAGES:
    chunks, cur, n = [], [], 0
    for title, items in area_secs[pid]:
        # a section larger than the page cap is split into parts
        for k in range(0, len(items), MAX_PER_PAGE):
            part = items[k:k + MAX_PER_PAGE]
            t = title if len(items) <= MAX_PER_PAGE else f'{title} ({k // MAX_PER_PAGE + 1})'
            if cur and n + len(part) > MAX_PER_PAGE:
                chunks.append(cur); cur, n = [], 0
            cur.append((t, part)); n += len(part)
    if cur:
        chunks.append(cur)
    for i, ch in enumerate(chunks):
        sub = ' · '.join(dict.fromkeys(t.split(' (')[0] for t, _ in ch))
        first = ch[0][0].split(' (')[0]
        short = first.split(' · ', 1)[1] if ' · ' in first else first
        label = name if len(chunks) == 1 else f'{name} {i + 1}/{len(chunks)} · {short}'
        page_list.append((f'{pid}{i + 1}' if len(chunks) > 1 else pid, label[:60], ch))
assert len(page_list) <= 40, len(page_list)

# 2. Lay out each page: sections stacked top to bottom, boards wrapping at PAGE_ROW_W.
boards, order = {}, []
for pid, pname, ch in page_list:
    # Row width per page: about 16:10 overall, never narrower than its widest board.
    area = sum((w + GAP_X) * (h + GAP_Y) for _, items in ch for _, w, h, _, _ in items)
    row_w = max(max(w for _, items in ch for _, w, _, _, _ in items), int((area * 1.6) ** 0.5))
    y0 = 0
    for si, (title, items) in enumerate(ch):
        notes[f'sec_{pid}_{si}'] = {'x': 0, 'y': y0 - TITLE_H - 110, 'text': title, 'kind': 'title1', 'maxW': max(row_w, 2000), 'page': pid}
        x, y, rowh = 0, 0, 0
        for f, w, h, t, inter in items:
            if x > 0 and x + w > row_w:
                x, y, rowh = 0, y + rowh + GAP_Y, 0
            b = {'x': x, 'y': y0 + y, 'w': w, 'h': h, 'title': t, 'page': pid}
            if inter:
                b['is_interactive'] = True
            boards[f] = b
            order.append(f)
            x += w + GAP_X
            rowh = max(rowh, h)
        y0 += y + rowh + TITLE_H + SEC_GAP + 110

c['pages'] = [{'id': pid, 'name': pname} for pid, pname, _ in page_list]
c['launch'] = {'view': 'canvas', 'page': page_list[0][0]}
c['boards'], c['order'], c['notes'] = boards, order, notes

# 3. Side notes go in a column to the left of everything.
side = [k for k in ('status', 'noteD', 'noteMotion', 'noteTime') if k in notes]
yy = -320
for k in side:
    notes[k]['x'] = -1100 if k == 'status' else -560
    notes[k]['page'] = page_list[0][0]
    if k != 'status':
        notes[k]['y'] = yy
        yy += 520

json.dump(c, open('project/canvas.json', 'w'), indent=2, ensure_ascii=False)
ys = [b['y'] + b['h'] for b in boards.values()]
xs = [b['x'] + b['w'] for b in boards.values()]
print(len(boards), 'boards,', len(secs), 'sections,', len(c['pages']), 'pages')
for pid, pname, _ in page_list:
    bb = [b for b in boards.values() if b['page'] == pid]
    print(' ', pname, len(bb), 'boards, extent', max(b['x'] + b['w'] for b in bb), 'x', max(b['y'] + b['h'] for b in bb))
