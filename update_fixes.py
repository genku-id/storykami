import sys

# Fix index.html footer padding
html_path = r'C:\Pictures\StoryKami\template\template-daerahJawa\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('padding-bottom: 100px;', 'padding-bottom: 150px;')

# Ensure youtube-player div exists just in case (though script creates it)
if '<div id="youtube-player"' not in html:
    html = html.replace('</body>', '    <div id="youtube-player" style="display:none;"></div>\n</body>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# Fix script.js head append
js_path = r'C:\Pictures\StoryKami\template\template-daerahJawa\assets\js\script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("document.head.appendChild(ytContainer); // pasang di head", "document.body.appendChild(ytContainer); // pasang di body")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("HTML and JS updated")
