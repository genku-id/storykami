import re
html = open('C:\\Pictures\\StoryKami\\template\\template-daerahJawa\\index.html', encoding='utf-8').read()
matches = re.findall(r'(<a href=")[^"]*(" target="_blank" class="social-link"[^>]*>)[\s\S]*?(<\/a>)', html)
print(f"Found {len(matches)} matches")
for i, m in enumerate(matches):
    print(f"Match {i}: {m[0]} ... {m[1]} ... {m[2]}")
