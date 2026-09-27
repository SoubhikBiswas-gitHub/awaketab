# Normalise Growth board sources to DESIGN.md 11 (spacing, radii, type line-heights, weights).
import re, glob
SCALE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96]
def near(n):
    if n < 4: return n
    if n in SCALE or n > 96: return n
    return min(SCALE, key=lambda v: (abs(v - n), -v))
def fix_lengths(m):
    prop, val = m.group(1), m.group(2)
    return prop + ': ' + re.sub(r'(\d+)px', lambda k: str(near(int(k.group(1)))) + 'px', val)
RAD = {4: 8, 5: 8, 6: 8, 10: 12, 14: 12, 18: 16, 22: 16, 24: 16, 99: 999}
LH = {'12px': '16px', '13px': '18px', '14px': '20px', '15px': '22px', '16px': '26px', '18px': '28px', '20px': '28px'}
for f in sorted(glob.glob('b*.mjs')) + ['common.mjs']:
    s = open(f).read(); o = s
    s = s.replace('letter-spacing: 0.16em', 'letter-spacing: 0.14em')
    if f != 'common.mjs':
        s = re.sub(r'\b(gap|row-gap|column-gap|padding|padding-top|padding-bottom|padding-inline|margin|margin-top|margin-bottom)\s*:\s*([^;"]*?px[^;"]*)', fix_lengths, s)
        s = re.sub(r'border-radius: (\d+)px', lambda m: 'border-radius: ' + str(RAD.get(int(m.group(1)), int(m.group(1)))) + 'px', s)
        s = s.replace('font-size: 11px', 'font-size: 12px')
        s = re.sub(r"font-size: 17px; line-height: 1\.\d+", 'font-size: 18px; line-height: 28px', s)
        s = re.sub(r"font-size: (1[2-8]px|20px); line-height: 1\.\d+", lambda m: 'font-size: ' + m.group(1) + '; line-height: ' + LH.get(m.group(1), '1.5'), s)
    if s != o: open(f, 'w').write(s); print('normalised', f)
