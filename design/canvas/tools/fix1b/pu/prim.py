# Helper: read primitive blocks from PRIMITIVES.md and expand %%NAME%% placeholders.
import re
P = open('/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/fix1b/PRIMITIVES.md').read()

def block(name):
    i = P.index('## ' + name)
    j = P.index('```', i)
    k = P.index('```', j + 3)
    return P[j + 3:k].split('\n', 1)[1].rstrip('\n')

def expand(src):
    return re.sub(r'%%([A-Za-z0-9 -]+)%%', lambda m: block(m.group(1)), src)
