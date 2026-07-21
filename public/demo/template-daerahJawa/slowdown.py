import os

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace border animations
content = content.replace('animation: moveBorder 20s linear infinite alternate;', 'animation: moveBorder 25s linear infinite alternate;')
content = content.replace('animation: moveBorderBottom 20s linear infinite alternate-reverse;', 'animation: moveBorderBottom 25s linear infinite alternate-reverse;')

# Replace wayang animation
content = content.replace('animation: sway-wayang 4s ease-in-out infinite;', 'animation: sway-wayang 7s ease-in-out infinite;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated animations.")
