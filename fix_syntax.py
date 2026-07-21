import re

engine_path = r'C:\Pictures\StoryKami\WebSK\src\utils\template-engine.js'
with open(engine_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix font-family quotes
content = content.replace(r"font-family: \'Inter\',", r"font-family: Inter,")

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix footer padding
html_path = r'C:\Pictures\StoryKami\template\template-daerahJawa\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('padding-bottom: 150px;', 'padding-bottom: 80px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed syntax error and footer padding")
