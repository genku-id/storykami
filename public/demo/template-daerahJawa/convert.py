import os
from PIL import Image

paths = [
    'assets/images/bride.webp',
    'assets/images/groom.webp',
    'assets/images/couple.webp',
    'logo.webp'
]

for p in paths:
    if os.path.exists(p):
        img = Image.open(p)
        new_p = p.replace('.webp', '.png')
        img.save(new_p, 'PNG')
        print(f"Converted {p} to {new_p}")
    else:
        print(f"File not found: {p}")
