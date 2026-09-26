# Helper: read primitive blocks from PRIMITIVES.md and expand %%NAME%% placeholders.
import re
P = open('/home/user/awaketab/design/canvas/tools/fix1b/PRIMITIVES.md').read()

def block(name):
    i = P.index('## ' + name)
    j = P.index('```', i)
    k = P.index('```', j + 3)
    return P[j + 3:k].split('\n', 1)[1].rstrip('\n')

def expand(src):
    return re.sub(r'%%([A-Za-z0-9 -]+)%%', lambda m: block(m.group(1)), src)
