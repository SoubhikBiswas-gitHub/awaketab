# Set a wrapper board's height everywhere it is declared: root div, dc-import hint-size, $preview.
import re, sys
def set_h(path, h):
    s = open(path).read(); o = s
    s = re.sub(r'(<div style="width: \d+px; height: )\d+(px")', lambda m: m.group(1) + str(h) + m.group(2), s, count=1)
    s = re.sub(r'(hint-size="\d+px,)\d+(px")', lambda m: m.group(1) + str(h) + m.group(2), s)
    s = re.sub(r'("\$preview":\{"width":\d+,"height":)\d+', lambda m: m.group(1) + str(h), s)
    if s != o: open(path, 'w').write(s)
    return s != o
if __name__ == '__main__':
    for arg in sys.argv[1:]:
        f, h = arg.split('='); print(f, set_h('project/' + f + '.dc.html', int(h)))
