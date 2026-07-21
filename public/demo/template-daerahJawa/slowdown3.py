import os

css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace border animations to 40s
content = content.replace('animation: moveBorder 32s linear infinite alternate;', 'animation: moveBorder 40s linear infinite alternate;')
content = content.replace('animation: moveBorderBottom 32s linear infinite alternate-reverse;', 'animation: moveBorderBottom 40s linear infinite alternate-reverse;')

# Replace wayang animation to 13s
content = content.replace('animation: sway-wayang 10s ease-in-out infinite;', 'animation: sway-wayang 13s ease-in-out infinite;')

# Replace gunungan and cloud animations to 2.5s (from 3.5s) to make them slightly faster
content = content.replace('animation: pulse-gunungan-left 3.5s ease-in-out infinite;', 'animation: pulse-gunungan-left 2.5s ease-in-out infinite;')
content = content.replace('animation: pulse-gunungan-right 3.5s ease-in-out infinite;', 'animation: pulse-gunungan-right 2.5s ease-in-out infinite;')
content = content.replace('animation: pulse-cloud 3.5s ease-in-out infinite;', 'animation: pulse-cloud 2.5s ease-in-out infinite;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated animations.")
