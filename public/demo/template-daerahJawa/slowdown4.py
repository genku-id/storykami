import os

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace border animations to 45s
content = content.replace('animation: moveBorder 40s linear infinite alternate;', 'animation: moveBorder 45s linear infinite alternate;')
content = content.replace('animation: moveBorderBottom 40s linear infinite alternate-reverse;', 'animation: moveBorderBottom 45s linear infinite alternate-reverse;')

# Replace gunungan and cloud animations to 2s
content = content.replace('animation: pulse-gunungan-left 2.5s ease-in-out infinite;', 'animation: pulse-gunungan-left 2s ease-in-out infinite;')
content = content.replace('animation: pulse-gunungan-right 2.5s ease-in-out infinite;', 'animation: pulse-gunungan-right 2s ease-in-out infinite;')
content = content.replace('animation: pulse-cloud 2.5s ease-in-out infinite;', 'animation: pulse-cloud 2s ease-in-out infinite;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated animations.")
