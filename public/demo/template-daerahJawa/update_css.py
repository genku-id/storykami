import re
import sys

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. moveBorder 45s -> 30s
content = re.sub(r'animation:\s*moveBorder\s+45s', r'animation: moveBorder 30s', content)

# 2. sway-wayang 13s -> 8.5s
content = re.sub(r'animation:\s*sway-wayang\s+13s', r'animation: sway-wayang 8.5s', content)

# 3. sway-wayang 2s -> 1.3s (for gunungan)
# Wait, let's check what animation gunungan uses.
# Actually I'll just find and replace the block for gunungan and wayang.
content = re.sub(r'animation:\s*sway-wayang\s+2s', r'animation: sway-wayang 1.33s', content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("CSS animations updated!")
