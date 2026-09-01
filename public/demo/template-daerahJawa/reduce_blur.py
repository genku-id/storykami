import os

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace blur from 12px to 6px
content = content.replace('backdrop-filter: blur(12px);', 'backdrop-filter: blur(6px);')
content = content.replace('-webkit-backdrop-filter: blur(12px);', '-webkit-backdrop-filter: blur(6px);')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reduced blur.")
