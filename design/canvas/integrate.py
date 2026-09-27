"""Merge agent board reports into sections.json.

Usage: python3 integrate.py report.json [report.json ...]
Each report is {"new": {...}, "resize": {...}, "retitle": {...}}.
- "new" entries: {"File.dc.html": {"w", "h", "title", "section", "is_interactive"}}.
  "section" names an existing section title, or starts with "NEW: " to create one.
- "resize" entries: {"File.dc.html": [w, h]}.
- "retitle" entries: {"File.dc.html": "title"}.
A new board that is already listed is updated in place, not added twice.
"""
import json, sys, os

secs = json.load(open('sections.json'))
by_file = {it[0]: it for _, items in secs for it in items}


def sec_items(title):
    for t, items in secs:
        if t == title:
            return items
    return None


for rp in sys.argv[1:]:
    r = json.load(open(rp))
    for f, (w, h) in r.get('resize', {}).items():
        if f in by_file:
            by_file[f][1], by_file[f][2] = w, min(h, 8000)
    for f, t in r.get('retitle', {}).items():
        if f in by_file:
            by_file[f][3] = t
    for f, b in r.get('new', {}).items():
        if not os.path.exists(os.path.join('project', f)):
            print('skip (file missing):', f)
            continue
        entry = [f, b['w'], min(b['h'], 8000), b['title'], bool(b.get('is_interactive', True))]
        if f in by_file:
            by_file[f][:] = entry
            continue
        sec = b.get('section', 'NEW: Other')
        if sec.startswith('NEW: '):
            name = sec[5:]
            items = sec_items(name)
            if items is None:
                items = []
                # Put the new section right after the section of its sibling boards, when there is one.
                anchor = next((i for i, (t, _) in enumerate(secs) if t.startswith(('Content · hub', 'Guide types', 'Brand'))), len(secs) - 1)
                secs.insert(anchor + 1, [name, items])
        else:
            items = sec_items(sec)
            if items is None:
                print('unknown section, creating:', sec)
                items = []
                secs.append([sec, items])
        items.append(entry)
        by_file[f] = entry

json.dump(secs, open('sections.json', 'w'), indent=1, ensure_ascii=False)
print('sections:', len(secs), 'boards:', sum(len(i) for _, i in secs))
