# Gap agent B: add the P-LANG footer control (PRIMITIVES.md) to a base board. Idempotent.
# Inserts: footer markup (last child of <footer>), the AT-LANG JS block (above `class Component`),
# the .at-chev / .at-in helmet rules when missing, and a `language` prop (closed | open) in data-props.
# renderVals wiring (`lang: atLang({...})`) is done by hand per file.
# usage: python3 addlang.py Name [Name ...]   (files in ../../project)
import os, re, sys
H = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(H, '..', '..', 'project')
JS = open(os.path.join(H, 'lang.js')).read()
FOOT = open(os.path.join(H, 'lang-footer.html')).read().rstrip('\n')
CSS = {
    '.at-chev{': '.at-chev{transition:transform .6s var(--ease)}',
    '.at-in{': '.at-in{animation:at-in .7s var(--ease) both}',
    '@keyframes at-in{': '@keyframes at-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}',
}
def patch(name):
    f = os.path.join(P, name + '.dc.html'); s = open(f).read(); o = s
    if 'onKeyDown="{{lang.key}}"' not in s:
        i = s.index('</footer>')
        s = s[:i] + '  ' + FOOT + '\n  ' + s[i:]
    if 'AT-LANG v1' not in s:
        i = s.index('class Component extends DCLogic')
        s = s[:i] + JS + '\n' + s[i:]
    for k, rule in CSS.items():
        if k not in s:
            i = s.index('@media (prefers-reduced-motion')
            s = s[:i] + rule + '\n' + s[i:]
    if '"language":' not in s:
        s = s.replace("data-props='{", 'data-props=\'{"language":{"editor":"enum","options":["closed","open"],"default":"closed"},', 1)
    if s != o: open(f, 'w').write(s)
    print(name, 'patched' if s != o else 'unchanged')
for n in sys.argv[1:]: patch(n)
