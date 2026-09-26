#!/usr/bin/env python3
# Aggregate run results: python3 report.py <dir> [file-filter] [--detail check]
import json, sys, glob, os, collections
d = sys.argv[1]
flt = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
detail = sys.argv[sys.argv.index('--detail') + 1] if '--detail' in sys.argv else None
checks = ['textOverlap', 'overflow', 'textClip', 'overlap', 'occluded', 'targets', 'lowContrast', 'inputContrast', 'errors']
tot = collections.Counter()
uniq = collections.defaultdict(collections.Counter)
for f in sorted(glob.glob(d + '/res/*.json')):
    j = json.load(open(f)); res = j['res']; jid = j['job']['id']
    for c in checks:
        items = res.get(c, [])
        if flt: items = [x for x in items if (isinstance(x, str) and flt in x) or (isinstance(x, dict) and x.get('file', '').startswith(flt))]
        tot[c] += len(items)
        for x in items:
            if isinstance(x, dict):
                k = {kk: vv for kk, vv in x.items() if kk not in ('rect', 'clipRect', 'lineRects')}
                key = json.dumps(k, sort_keys=True)
            else: key = x
            uniq[c][key] += 1
            if detail == c and '--ids' in sys.argv: print(jid, key)
    if res['docScroll']['sw'] > res['docScroll']['W']: tot['docScroll'] += 1; uniq['docScroll'][jid] += 1
print('TOTALS', dict(tot))
for c in (checks + ['docScroll'] if not detail else [detail]):
    if not uniq[c]: continue
    print('\n==', c, len(uniq[c]), 'unique')
    for k, n in uniq[c].most_common(400 if detail else 25): print(f'  {n:3d}x {k[:260]}')
