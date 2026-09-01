import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Milea', 'Millea')
content = content.replace("font-family: 'Oleo Script', cursive; font-size: 2.7rem; color: #2a2a2a; \nfont-weight: normal;", "font-family: 'Oleo Script', cursive; font-size: 2.7rem; color: #2a2a2a;")
content = content.replace("font-weight: normal;", "") # just clean it up generally for these specific ones

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Milea to Millea")
