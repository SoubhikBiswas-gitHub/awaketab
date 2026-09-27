# O-77: compare rendered shared primitives across boards; more than one variant per primitive is a bug
# (except the documented A11y zoom board and scaled mounts). usage: A=<audit dir> python3 primvariance.py
import json, os, collections
A = os.environ.get('A', '/tmp/claude-0/base/audit/')
V = collections.defaultdict(lambda: collections.defaultdict(set))
for f in os.listdir(A):
    d = json.load(open(A + f)); b = f[:-5]
    if b.startswith(('A11yZoom', 'A11yReflow', 'Sys', 'Store', 'Og')): continue
    for i in d['items']:
        if i.get('ph'): continue
        src = i['src'] or b
        if i['tag'] == 'header' and i['h'] >= 60: V['header'][(i['h'], i['pad'])].add(src)
        if i['role'] == 'radiogroup' and 'Theme' in i['aria'] and i['w'] > 130: V['theme bar'][(i['w'], i['h'], i['pad'])].add(src)
        if i['tag'] == 'footer' and i['pad'] != '8px 0px 0px 0px': V['footer'][(i['pad'], i['bw'])].add(src)
        if i['tag'] == 'a' and i['own'] and i['text'] in ('Privacy', 'Terms', 'Changelog', 'About', 'Buy me a coffee') and i['h'] == 44: V['footer link'][(i['fs'], i['fw'])].add(src)
        if i['tag'] == 'a' and i['text'] == 'Pro' and i['y'] < 70: V['nav Pro'][(round(i['w']), i['pad'], i['fs'])].add(src)
        if i['tag'] == 'kbd' and i['h'] >= 23: V['kbd'][(i['h'], i['pad'], i['br'], i['fs'], i['ff'], i['fw'])].add(src)
        if i['tag'] == 'a' and i['aria'] == 'AwakeTab home': V['logo'][(i['fs'], i['fw'], i['gap'])].add(src)
# size classes that §11 defines on purpose (phone / tablet / desktop / xl)
OK = {'header': {(60, '0px 16px 0px 16px'), (68, '0px 32px 0px 32px'), (68, '0px 80px 0px 80px'), (68, '0px 120px 0px 120px')},
      'footer': {('24px 16px 32px 16px', '1px 0px 0px 0px'), ('24px 32px 24px 32px', '1px 0px 0px 0px'), ('24px 80px 24px 80px', '1px 0px 0px 0px'), ('24px 120px 24px 120px', '1px 0px 0px 0px')}}
bad = 0
for k, m in V.items():
    print('==', k, len(m), 'variant(s)')
    for val, srcs in sorted(m.items(), key=lambda x: -len(x[1])): print('   ', val, len(srcs), sorted(srcs)[:10])
    extra = [v for v in m if v not in OK.get(k, set())]
    bad += (len(extra) > 0) if k in OK else (len(m) > 1)
print('primitives with more than one variant:', bad)
