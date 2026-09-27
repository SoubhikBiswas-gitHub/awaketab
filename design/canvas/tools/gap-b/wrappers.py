# Gap agent B: write / resize ONLY the wrapper boards listed here (same shape as every other wrapper).
# Heights are the bases' SIZES (natural heights measured with tools/gap-b/measure.mjs on the real runtime).
# usage: python3 wrappers.py            (writes the files below in ../../project; nothing else)
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'project')
# file: (base, title, props, w, h, crop)   crop = px of the base hidden above the board (showcase boards only)
B = {
    # resized for the footer language control
    'ContentArticlePhoneLight': ('ContentArticle', 'cooking phone light', dict(layout='phone', theme='light', status='awake'), 390, 5344, 0),
    'ContentArticleTablet': ('ContentArticle', 'cooking tablet', dict(layout='tablet', theme='light', status='ready'), 820, 4724, 0),
    'ContentArticleDeskDark': ('ContentArticle', 'cooking desktop dark', dict(layout='desktop', theme='dark', status='awake'), 1280, 4534, 0),
    'ContentArticleDeskLight': ('ContentArticle', 'cooking desktop light', dict(layout='desktop', theme='light', status='ready'), 1280, 4534, 0),
    'HubForPhone': ('HubFor', 'use cases phone', dict(layout='phone', theme='light'), 390, 4412, 0),
    'HomeBelowPhone': ('HomeBelow', 'home below the tool phone', dict(layout='phone', theme='light'), 390, 7908, 0),
    'PresetPhoneLight': ('PresetPage', '/30m · phone · light', dict(layout='phone', theme='light'), 390, 2552, 0),
    'PresetTablet': ('PresetPage', '/30m · tablet · dark', dict(layout='tablet', theme='dark'), 820, 2420, 0),
    'UntilPhoneLight': ('UntilPage', '/until/07-30 · phone · light · evening, ends tomorrow', dict(layout='phone', theme='light', clock='evening'), 390, 2224, 0),
    # new: tablet and missing theme
    'HomeBelowTablet': ('HomeBelow', 'home below the tool · tablet · dark', dict(layout='tablet', theme='dark'), 820, 6048, 0),
    'HubForTablet': ('HubFor', '/for hub · tablet · dark', dict(hub='for', layout='tablet', theme='dark'), 820, 3488, 0),
    'HubForDeskDark': ('HubFor', '/for hub · desktop · dark', dict(hub='for', layout='desktop', theme='dark'), 1280, 2928, 0),
    'UntilTablet': ('UntilPage', '/until/07-30 · tablet · dark · awake', dict(layout='tablet', theme='dark', status='awake', clock='evening'), 820, 2248, 0),
    # new: the four other hubs
    'HubOnPhoneDark': ('HubFor', '/on hub · phone · dark', dict(hub='on', layout='phone', theme='dark'), 390, 3664, 0),
    'HubOnDeskLight': ('HubFor', '/on hub · desktop · light', dict(hub='on', layout='desktop', theme='light'), 1280, 2232, 0),
    'HubVsPhoneLight': ('HubFor', '/vs hub · phone · light', dict(hub='vs', layout='phone', theme='light'), 390, 2812, 0),
    'HubVsDeskDark': ('HubFor', '/vs hub · desktop · dark', dict(hub='vs', layout='desktop', theme='dark'), 1280, 1708, 0),
    'HubGuidesPhoneDark': ('HubFor', '/guides hub · phone · dark', dict(hub='guides', layout='phone', theme='dark'), 390, 2772, 0),
    'HubGuidesDeskLight': ('HubFor', '/guides hub · desktop · light', dict(hub='guides', layout='desktop', theme='light'), 1280, 1684, 0),
    'HubLearnPhoneLight': ('HubFor', '/learn hub · phone · light', dict(hub='learn', layout='phone', theme='light'), 390, 2560, 0),
    'HubLearnDeskDark': ('HubFor', '/learn hub · desktop · dark', dict(hub='learn', layout='desktop', theme='dark'), 1280, 1432, 0),
    # new: language switcher showcase (the bottom of a hub page with the list open)
    'LangSwitcherPhoneDark': ('HubFor', 'language switcher · phone · dark · sheet open', dict(hub='learn', layout='phone', theme='dark', language='open'), 390, 844, 2560 - 844),
    'LangSwitcherDeskLight': ('HubFor', 'language switcher · desktop · light · list open', dict(hub='learn', layout='desktop', theme='light', language='open'), 1280, 800, 1432 - 800),
}
T = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · {title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>body{{margin:0}}</style>
</helmet>
<div style="width: {w}px; height: {h}px{clip}">
{inner}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
for f, (base, title, props, w, h, crop) in B.items():
    bh = h + crop
    imp = '<dc-import name="%s" %s hint-size="%dpx,%dpx"></dc-import>' % (base, ' '.join('%s="%s"' % kv for kv in props.items()), w, bh)
    inner = imp if not crop else '<div style="margin-top: -%dpx">%s</div>' % (crop, imp)
    out = T.format(title=title, w=w, h=h, clip='; overflow: hidden' if crop else '', inner=inner)
    fp = os.path.join(P, f + '.dc.html')
    old = open(fp).read() if os.path.exists(fp) else None
    if old != out: open(fp, 'w').write(out)
    print(f, 'new' if old is None else ('updated' if old != out else 'same'))
