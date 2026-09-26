# Checks that each batch file carrying a primitive carries it byte-identically (from PRIMITIVES.md).
import sys, glob, os, re
sys.path.insert(0, os.path.dirname(__file__) + '/pu')
from prim import block
D = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/'
bases = ['Extras','Ambient','PipWindow','PipOverDesk','ContentArticle','HubFor','HomeBelow','Intl','A11y','GuideOn','GuideVs','GuideLearn','GuideGuides','PresetPage','UntilPage']
# marker (unique opening) -> primitive name
checks = {'P-THEME': '<div role="radiogroup" aria-label="Theme"', 'P-FOOTER': '<footer style="border-top', 'P-HEADER': '<header style=', 'JS constants': '// AT-PRIMITIVES v1', 'P-PILL-M': '<output aria-live="polite" class="at-slide" style="display: inline-flex; align-items: center; gap: 8px; height: 38px'}
def norm(x):  # ignore leading indentation of each line
    return '\n'.join(l.strip() for l in x.split('\n'))
for b in bases:
    s = open(D + b + '.dc.html').read()
    res = []
    for name, marker in checks.items():
        can = block(name)
        n = s.count(marker)
        if not n: res.append(name + ':absent'); continue
        ok = norm(s).count(norm(can))
        res.append(f'{name}:{ok}/{n}')
    print(b.ljust(15), ' '.join(res))
