import os

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the 45px avatar size with 22px
content = content.replace('width: 45px; height: 45px;', 'width: 22px; height: 22px;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Update script.js
js_path = 'assets/js/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace the 60px toast icon size with 30px
js_content = js_content.replace('width: 60px; \nheight: 60px;', 'width: 30px; height: 30px;')
js_content = js_content.replace('width: 60px; height: 60px;', 'width: 30px; height: 30px;')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Avatars resized to half.")
