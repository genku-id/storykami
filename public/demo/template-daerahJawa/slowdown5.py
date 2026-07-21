import os

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace border animations to 150s
content = content.replace('animation: moveBorder 45s linear infinite alternate;', 'animation: moveBorder 150s linear infinite alternate;')
content = content.replace('animation: moveBorderBottom 45s linear infinite alternate-reverse;', 'animation: moveBorderBottom 150s linear infinite alternate-reverse;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated animations to 150s.")
