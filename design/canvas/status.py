import json, sys, datetime
# status: done | wip | todo
S = json.load(open('status.json'))
icon = {'done': '✅ on canvas', 'wip': '🔄 building', 'todo': '⬜ not started'}
lines = ['BUILD STATUS · updated ' + datetime.datetime.now().strftime('%-I:%M %p'), '',
         'Canvas design  ·  Real app (new design)', '']
n = {'done': 0, 'wip': 0, 'todo': 0}
for grp, rows in S:
    lines.append(grp)
    for num, name, st in rows:
        n[st] += 1
        lines.append(f'{num}. {name}  —  {icon[st]}  ·  app ⬜')
    lines.append('')
lines.append(f"Canvas: {n['done']} done · {n['wip']} building · {n['todo']} not started (of {sum(n.values())})")
lines.append('Real app: 0 of 26 (starts after your approval)')
c = json.load(open('project/canvas.json'))
c['notes']['status'] = {'x': -1100, 'y': -320, 'w': 480, 'fill': 'yellow', 'text': '\n'.join(lines)}
json.dump(c, open('project/canvas.json', 'w'), indent=2, ensure_ascii=False)
print('\n'.join(lines))
# Mirror the table into the repo (docs/redesign/STATUS.md)
md = ['# Redesign build status', '', 'Auto-generated from the canvas status table. Canvas: https://claude.ai/artifact/MArJ4zoZRiYmppEd9hXv5e', '',
      'Updated ' + datetime.datetime.now().strftime('%A, %-d %B %Y · %-I:%M %p'), '',
      '| # | Item | Canvas design | Real app |', '|---|---|---|---|']
for grp, rows in S:
    md.append(f'| | **{grp}** | | |')
    for num, name, st in rows:
        md.append(f'| {num} | {name} | {icon[st]} | ⬜ |')
md += ['', f"**Canvas:** {n['done']} done · {n['wip']} building · {n['todo']} not started (of {sum(n.values())}). **Real app:** 0 of 26, starts after owner approval."]
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','..','docs','redesign','STATUS.md'), 'w').write('\n'.join(md) + '\n')
