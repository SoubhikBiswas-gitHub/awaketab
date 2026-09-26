# D-R18: find boards that show the same page, state, size and theme as another board.
import json, re, os, sys
P = 'project/'
secs = json.load(open('sections.json'))
order = [i[0] for t, its in secs for i in its]
titles = {i[0]: i[3] for t, its in secs for i in its}
def defaults(name):
    s = open(P + name + '.dc.html').read()
    m = re.search(r"data-props='([^']*)'", s)
    d = json.loads(m.group(1)) if m else {}
    return {k: v.get('default') for k, v in d.items() if isinstance(v, dict) and 'default' in v}
sig = {}
for f in order:
    s = open(P + f).read(); name = f[:-8]
    imps = re.findall(r'<dc-import ([^>]*)>', s)
    top = re.search(r'<x-dc>.*?</helmet>\s*<div style="width: \d+px; height: \d+px">\s*<dc-import', s, re.S)
    if len(imps) == 1 and top:  # a thin wrapper around one base
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', imps[0])); base = attrs.pop('name'); attrs.pop('hint-size', None)
        props = defaults(base); props.update(attrs)
    else:
        base = name; props = defaults(name)
    props.pop('$preview', None)
    sig[f] = (base, tuple(sorted(props.items())))
groups = {}
for f in order: groups.setdefault(sig[f], []).append(f)
drop = []
print('== exact duplicates')
for k, fs in groups.items():
    if len(fs) > 1:
        keep = next((f for f in fs if titles[f].startswith('▶')), fs[0])
        print('keep', keep, '| drop', [f for f in fs if f != keep]); drop += [f for f in fs if f != keep]
print('== theme twins of a ▶ play-me board (same props, theme dark/light vs auto)')
for f in order:
    if f in drop or not titles[f].startswith('▶'): continue
    base, props = sig[f]; pd = dict(props)
    if pd.get('theme') != 'auto': continue
    twins = {}
    for g in order:
        if g == f or g in drop or sig[g][0] != base: continue
        qd = dict(sig[g][1])
        if qd.get('theme') in ('dark', 'light') and {k: v for k, v in qd.items() if k != 'theme'} == {k: v for k, v in pd.items() if k != 'theme'}:
            twins[qd['theme']] = g
    if len(twins) == 2:
        print(f, 'twins', twins, '-> drop the dark twin', twins['dark']); drop.append(twins['dark'])
json.dump(drop, open('tools/final/drop.json', 'w'), indent=1)
print(len(drop), 'to drop')
