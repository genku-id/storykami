import os

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the background color specifically for the album section
# Let's find the section first
start = content.find('<section id="album"')
end = content.find('>', start)
album_tag = content[start:end+1]
new_album_tag = album_tag.replace('radial-gradient(circle, #b8a18a 0%, #9e816a 100%)', 'radial-gradient(circle, #dfcfb9 0%, #b8a18a 100%)')

content = content[:start] + new_album_tag + content[end+1:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated background color for Album section.")
