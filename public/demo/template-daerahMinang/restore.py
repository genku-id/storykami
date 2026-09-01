import re

minang_path = 'index.html'
floral_path = '../template-floral1/index.html'

with open(floral_path, 'r', encoding='utf-8') as f:
    floral_html = f.read()

match = re.search(r'(<main id=\"main-content\">.*?</main>)', floral_html, flags=re.DOTALL)
if match:
    main_content = match.group(1)
    with open(minang_path, 'r', encoding='utf-8') as f:
        minang_html = f.read()

    minang_html = minang_html.replace('<!-- Main Content -->', '<!-- Main Content -->\n    ' + main_content)
    with open(minang_path, 'w', encoding='utf-8') as f:
        f.write(minang_html)
    print('Restored successfully')
else:
    print('Failed to find main content in floral template')
