import json
c = json.load(open('project/canvas.json'))
old = c['boards']
secs = json.load(open('sections.json'))
boards, order, notes = {}, [], {k: v for k, v in c['notes'].items() if not k.startswith('row') and k != 'titleD' and not k.startswith('sec_')}
y = 0
for i, (title, items) in enumerate(secs):
    notes[f'sec_{i}'] = {'x': 0, 'y': y - 120, 'text': title, 'kind': 'title1', 'maxW': 6000}
    x, rowh = 0, 0
    for f, w, h, t, inter in items:
        b = {'x': x, 'y': y, 'w': w, 'h': h, 'title': t}
        if inter: b['is_interactive'] = True
        boards[f] = b; order.append(f)
        x += w + 80; rowh = max(rowh, h)
    y += rowh + 260
c['boards'], c['order'], c['notes'] = boards, order, notes
# side notes column left of everything
side = [k for k in ('status', 'noteD', 'noteMotion', 'noteTime') if k in notes]
yy = -320
for k in side:
    notes[k]['x'] = -1100 if k == 'status' else -560
    if k != 'status':
        notes[k]['y'] = yy; yy += 520
json.dump(c, open('project/canvas.json', 'w'), indent=2, ensure_ascii=False)
print(len(boards), 'boards,', len(secs), 'sections')
