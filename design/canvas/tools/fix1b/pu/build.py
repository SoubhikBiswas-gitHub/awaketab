import sys, json
sys.path.insert(0, '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/fix1b/pu')
from prim import expand
D = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/'
F = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/fix1b/pu/'
H = json.load(open(F + 'heights.json'))
for name in sys.argv[1:]:
    s = expand(open(F + name + '.tpl.html').read())
    for lay in ('phone', 'tablet', 'desktop'):
        s = s.replace('%%H_' + lay.upper() + '%%', str(H[name][lay]))
    assert '%%' not in s, name
    open(D + name + '.dc.html', 'w').write(s)
    print('wrote', name)
