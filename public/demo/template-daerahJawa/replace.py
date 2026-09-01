import os

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('src="assets/images/logo.png"', 'src="logo.webp"')
content = content.replace('src="logo.png"', 'src="logo.webp"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Update script.js
js_path = 'assets/js/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

js_content = js_content.replace('src="assets/images/logo.png"', 'src="logo.webp"')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Updated index.html and script.js to use logo.webp")
