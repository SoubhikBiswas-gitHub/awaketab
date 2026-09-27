"""Rebuild project/canvas.json from sections.json.

Sections keep their order, but they are packed into several columns so the canvas stays compact.
A single tall stack (about 130,000 px) made far-off boards fail to show on the live canvas.
Inside a section, boards wrap onto a new row at MAX_ROW_W. Columns are filled in reading order:
column 1 top to bottom, then column 2, and so on.
"""
import json

GAP_X, GAP_Y, TITLE_H, SEC_GAP = 80, 120, 120, 260
MAX_ROW_W = 7200      # widest row inside a section before wrapping
COL_GAP = 800         # space between columns
N_COLS = 6            # number of columns

c = json.load(open('project/canvas.json'))
secs = json.load(open('sections.json'))
notes = {k: v for k, v in c['notes'].items()
         if not k.startswith('row') and k != 'titleD' and not k.startswith('sec_')}

# 1. Lay out each section on its own, at origin (0, 0), and measure it.
blocks = []
for title, items in secs:
    placed, x, y, rowh, width = [], 0, 0, 0, 0
    for f, w, h, t, inter in items:
        if x > 0 and x + w > MAX_ROW_W:
            x, y, rowh = 0, y + rowh + GAP_Y, 0
        placed.append((f, x, y, w, h, t, inter))
        width = max(width, x + w)
        x += w + GAP_X
        rowh = max(rowh, h)
    blocks.append((title, placed, width, y + rowh))

# 2. Fill the columns in order, aiming for equal column heights.
total = sum(TITLE_H + bh + SEC_GAP for _, _, _, bh in blocks)
target = total / N_COLS
cols, cur, cur_h = [], [], 0
for b in blocks:
    bh = TITLE_H + b[3] + SEC_GAP
    if cur and cur_h + bh / 2 > target and len(cols) < N_COLS - 1:
        cols.append(cur)
        cur, cur_h = [], 0
    cur.append(b)
    cur_h += bh
cols.append(cur)

boards, order, x0 = {}, [], 0
for ci, col in enumerate(cols):
    colw = max(b[2] for b in col)
    y0 = 0
    for si, (title, placed, bw, bh) in enumerate(col):
        notes[f'sec_{ci}_{si}'] = {'x': x0, 'y': y0 - TITLE_H, 'text': title, 'kind': 'title1', 'maxW': max(bw, 2000)}
        for f, x, y, w, h, t, inter in placed:
            b = {'x': x0 + x, 'y': y0 + y, 'w': w, 'h': h, 'title': t}
            if inter:
                b['is_interactive'] = True
            boards[f] = b
            order.append(f)
        y0 += bh + TITLE_H + SEC_GAP
    x0 += colw + COL_GAP

c['boards'], c['order'], c['notes'] = boards, order, notes

# 3. Side notes go in a column to the left of everything.
side = [k for k in ('status', 'noteD', 'noteMotion', 'noteTime') if k in notes]
yy = -320
for k in side:
    notes[k]['x'] = -1100 if k == 'status' else -560
    if k != 'status':
        notes[k]['y'] = yy
        yy += 520

json.dump(c, open('project/canvas.json', 'w'), indent=2, ensure_ascii=False)
ys = [b['y'] + b['h'] for b in boards.values()]
xs = [b['x'] + b['w'] for b in boards.values()]
print(len(boards), 'boards,', len(secs), 'sections,', len(cols), 'columns; extent', max(xs), 'x', max(ys))
