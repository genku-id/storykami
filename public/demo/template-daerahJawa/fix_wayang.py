import os

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken jawa-bottom-container in #album
broken_html = """            <!-- Wayang & Bottom Border -->
            <div class="jawa-bottom-container" style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 2; margin-top: auto;">
                <div class="wayang-wrapper" style="position: relative; width: 100%; height: auto; z-index: 4;">
                    <img src="assets/images/wayang.webp" class="jawa-wayang center" alt="wayang">
                </div>
                <div class="jawa-bottom-border"></div>
            </div>"""

fixed_html = """            <!-- Wayang & Bottom Border -->
            <div class="jawa-bottom-container">
                <div class="wayang-wrapper">
                    <img src="assets/images/wayang.webp" class="jawa-wayang center" alt="wayang">
                </div>
                <div class="jawa-bottom-border"></div>
            </div>"""

content = content.replace(broken_html, fixed_html)

# Also ensure album section has padding bottom so content isn't covered by wayang
# Currently it is: padding-top: 100px; padding-bottom: 0;
content = content.replace('padding-top: 100px; padding-bottom: 0; height: auto;', 'padding-top: 100px; padding-bottom: 250px; height: auto;')
content = content.replace('margin: 0 auto 50px auto;', 'margin: 0 auto; padding-bottom: 50px;')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed wayang position in Album section.")
