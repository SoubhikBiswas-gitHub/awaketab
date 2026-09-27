# Gap agent C: add the P-LANG footer control (PRIMITIVES.md) to the batch-2a web pages (Pro, ProActivate, ProManage, GrowthPlanHelper, GrowthB2B).
# Same inserts as tools/gap-b/addlang.py (footer markup, AT-LANG JS, helmet rules, `language` prop) plus the
# 2a wiring: `langOpen` seeded from the prop and `b.lang = atLang(...)` right after atChrome() in renderVals.
# These pages have no translations yet, so the other locales link to their home (P-LANG, docs/07 §2). Idempotent.
# usage: python3 addlang.py Name=/route/ [Name='js:<expression>' ...]   (files in ../../project)
import os, sys
H = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(H, '..', '..', 'project')
JS = open(os.path.join(H, 'lang.js')).read().rstrip('\n')
FOOT = open(os.path.join(H, '..', 'gap-b', 'lang-footer.html')).read().rstrip('\n')
HOME = ("// P-LANG: this page has no translations yet, so every other locale links to its home (PRIMITIVES.md P-LANG).\n"
        "function atLangHome(v) { v.rows.forEach((r, i) => { if (i) r.href = r.href.replace(/^(\\/[a-z-]+)\\/.+$/, '$1/'); }); return v; }\n")
CSS = {
    '.at-chev{': '.at-chev{transition:transform .6s var(--ease)}',
    '.at-in{': '.at-in{animation:at-in .7s var(--ease) both}',
    '@keyframes at-in{': '@keyframes at-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}',
}
def patch(name, route):
    f = os.path.join(P, name + '.dc.html'); s = open(f).read(); o = s
    if 'onKeyDown="{{lang.key}}"' not in s:
        i = s.index('</footer>')
        s = s[:i] + FOOT + s[i:]
    if 'AT-LANG v1' not in s:
        i = s.index('class Component extends DCLogic')
        s = s[:i] + JS + '\n' + HOME + s[i:]
    for k, rule in CSS.items():
        if k not in s:
            i = s.index('@media (prefers-reduced-motion')
            s = s[:i] + rule + '\n' + s[i:]
    if '"language":' not in s:
        s = s.replace('"$preview":{', '"language":{"editor":"enum","options":["closed","open"],"default":"closed"},"$preview":{', 1)
    if 'langOpen:' not in s:
        s = s.replace("theme: props.theme ?? 'auto', ", "theme: props.theme ?? 'auto', langOpen: props.language === 'open', ", 1)
        s = s.replace("theme: props.theme || 'auto', ", "theme: props.theme || 'auto', langOpen: props.language === 'open', ", 1)
    if 'b.lang = ' not in s and 'const b = this.base();' in s:
        # Growth pages: renderVals() { const b = this.base(); ... } on one line. The route may be a JS expression.
        expr = route[3:] if route.startswith('js:') else "'" + route + "'"
        wrap = 'atLangCook' if 'cooking' in route else 'atLangHome'
        s = s.replace('const b = this.base();', "const b = this.base(); b.lang = " + wrap + "(atLang({ layout: b.layout, t: b.t, lamp: b.lamp, path: " + expr + ", open: this.state.langOpen, "
                      "toggle: () => this.setState({ langOpen: !this.state.langOpen }), close: () => this.setState({ langOpen: false }) }));", 1)
    if 'atLangCook' in s and 'function atLangCook' not in s:
        i = s.index('class Component extends DCLogic')
        s = s[:i] + ("// /for/cooking exists in every locale; es, pt-br, de and fr translate the slug (src/i18n/slugs.json). Other routes link home.\n"
                     "const AT_COOK_SLUG = { es: 'cocinar', 'pt-BR': 'cozinhar', de: 'kochen', fr: 'cuisine' };\n"
                     "function atLangCook(v) { if (v.rows[0].href.indexOf('/for/cooking') < 0) return atLangHome(v); v.rows.forEach((r) => { const x = AT_COOK_SLUG[r.lang]; if (x) r.href = r.href.replace('/for/cooking', '/for/' + x); }); return v; }\n") + s[i:]
    if 'b.lang = ' not in s:
        r = s.index('  renderVals() {')
        i = s.index('\n', s.index('const b = atChrome(', r)) + 1
        line = ("    b.lang = atLangHome(atLang({ layout: L, t: b.t, lamp: b.lamp, path: '" + route + "', open: this.state.langOpen, "
                "toggle: () => this.setState({ langOpen: !this.state.langOpen }), close: () => this.setState({ langOpen: false }) }));\n")
        s = s[:i] + line + s[i:]
    if s != o: open(f, 'w').write(s)
    print(name, 'patched' if s != o else 'unchanged')
for a in sys.argv[1:]:
    n, r = a.split('=', 1)
    patch(n, r)
