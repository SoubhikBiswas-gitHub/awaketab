import re,sys
FS={'9.5':'12','10.5':'12','11':'12','11.5':'12','12.5':'13','13.5':'14','14.5':'15','15.5':'16','19':'18','22':'20','24':'20','34':'28','60':'48'}
RAD={'22':'16','24':'16','14':'12','18':'20','10':'12','6':'8','5':'8','4':'8','3':'8'}
def fix(s, keep_fs=()):
    def fs(m):
        v=m.group(1)
        if v in keep_fs: return m.group(0)
        return 'font-size: '+FS.get(v,v)+'px'
    s=re.sub(r'font-size: ([\d.]+)px',fs,s)
    s=s.replace('font-weight: 700','font-weight: 600')
    def rad(m):
        v=m.group(1); return 'border-radius: '+RAD.get(v,v)+'px'
    s=re.sub(r'border-radius: ([\d.]+)px(?=[;"])',rad,s)
    s=s.replace('1.5px dashed','1px dashed').replace('1.5px solid','1px solid').replace('border: 2px solid','border: 1px solid')
    s=s.replace('border-bottom-width: 3px; ','').replace('border-bottom-width: 2px; ','').replace('border-bottom-width: 4px; ','')
    return s
for f in sys.argv[1:]:
    src=open(f).read()
    head,rest=src.split('</helmet>',1)
    mark,script=rest.split('<script type="text/x-dc"',1)
    mark=fix(mark, keep_fs=('17',))
    open(f,'w').write(head+'</helmet>'+mark+'<script type="text/x-dc"'+script)
    print('normalised',f)
