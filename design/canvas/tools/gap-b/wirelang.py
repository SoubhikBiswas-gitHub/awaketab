# Gap agent B: wire atLang() into renderVals and seed langOpen from the `language` prop. Idempotent.
# usage: python3 wirelang.py  (edits the files listed in CFG, in ../../project)
import os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'project')
# name: (t expression, lamp expression, path expression)
CFG = {
    'ContentArticle': ('t', 'p.lamp', "'/for/cooking'"),
    'HubFor': ('t', 'p.lamp', "hub.path"),
    'HomeBelow': ('t', 'p.lamp', "'/'"),
    'PresetPage': ('t', 'p.lamp', "'/30m'"),
    'UntilPage': ("Object.assign({}, t, AT_TOK[dark ? 'dark' : 'light'])", 'lamp', "'/until/07-30'"),
}
for name, (tx, lx, px) in CFG.items():
    f = os.path.join(P, name + '.dc.html'); s = open(f).read(); o = s
    if 'langOpen:' not in s:
        s = s.replace('this.state = { ', "this.state = { langOpen: props.language === 'open', ", 1)
    if 'prev.language' not in s:
        line = "    if (prev.language !== this.props.language) this.setState({ langOpen: this.props.language === 'open' });\n"
        if 'componentDidUpdate(prev) {\n' in s:
            s = s.replace('componentDidUpdate(prev) {\n', 'componentDidUpdate(prev) {\n' + line, 1)
        else:
            i = s.index('  renderVals() {')
            s = s[:i] + '  componentDidUpdate(prev) {\n' + line + '  }\n' + s[i:]
    if 'atLang({' not in s.split('class Component', 1)[1]:
        i = s.index('  renderVals() {')
        j = s.index('\n    return {\n', i) + len('\n    return {\n')
        s = s[:j] + ("      lang: atLang({ layout, t: " + tx + ", lamp: " + lx + ", path: " + px +
                     ", open: this.state.langOpen, toggle: () => this.setState({ langOpen: !this.state.langOpen }), close: () => this.setState({ langOpen: false }) }),\n") + s[j:]
    if s != o: open(f, 'w').write(s)
    print(name, 'wired' if s != o else 'unchanged')
