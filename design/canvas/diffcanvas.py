import json,sys
a=json.load(open('server/project/canvas.json')); b=json.load(open('directions/project/canvas.json'))
ab,bb=a['boards'],b['boards']
only_s=set(ab)-set(bb); only_l=set(bb)-set(ab)
moved=[k for k in set(ab)&set(bb) if any(ab[k].get(f)!=bb[k].get(f) for f in ('x','y','w','h','title'))]
nd=[k for k in set(a['notes'])|set(b['notes']) if a['notes'].get(k)!=b['notes'].get(k)]
print('server-only boards:',sorted(only_s)); print('local-only boards:',sorted(only_l)); print('changed boards:',sorted(moved)[:20]); print('changed notes:',nd)
for k in moved[:5]: print(k, {f:(ab[k].get(f),bb[k].get(f)) for f in ('x','y','w','h','title') if ab[k].get(f)!=bb[k].get(f)})
