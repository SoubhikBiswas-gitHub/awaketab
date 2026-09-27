import sys
from PIL import Image
name, step = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 1800
im = Image.open(f'shots/{name}.png')
w, h = im.size
i = 0
for y in range(0, h, step):
    im.crop((0, y, w, min(h, y + step))).save(f'crops/{name}-{i}.png'); i += 1
print(name, w, h, i)
