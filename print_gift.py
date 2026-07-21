import re

content = open('C:/Pictures/StoryKami/WebSK/src/utils/template-engine.js', encoding='utf-8').read()
match = re.search(r'function buildGiftCards\(data\) \{[\s\S]*?(?=function replaceFooter)', content)
if match:
    print(match.group(0)[:2000])
else:
    print("Not found")
