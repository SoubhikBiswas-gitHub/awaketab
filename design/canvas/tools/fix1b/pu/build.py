import sys, json
sys.path.insert(0, '/home/user/awaketab/design/canvas/tools/fix1b/pu')
from prim import expand
D = '/home/user/awaketab/design/canvas/project/'
F = '/home/user/awaketab/design/canvas/tools/fix1b/pu/'
H = json.load(open(F + 'heights.json'))
for name in sys.argv[1:]:
    s = expand(open(F + name + '.tpl.html').read())
    for lay in ('phone', 'tablet', 'desktop'):
        s = s.replace('%%H_' + lay.upper() + '%%', str(H[name][lay]))
    assert '%%' not in s, name
    open(D + name + '.dc.html', 'w').write(s)
    print('wrote', name)
