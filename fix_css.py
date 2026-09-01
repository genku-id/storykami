import re
import sys

try:
    filepath = 'c:/Pictures/StoryKami/WebSK/src/app/wim/floral1.css'
    with open(filepath, 'r', encoding='utf-8') as f:
        css = f.read()

    # Replace all occurrences of ../images with /assets/images
    css = css.replace('url(\"../images/', 'url(\"/assets/images/')
    css = css.replace('url(\'../images/', 'url(\'/assets/images/')
    css = css.replace('url(../images/', 'url(/assets/images/')

    # Regex fallback just in case
    css = re.sub(r'url\([\u0027\u0022]?\.\./images/', 'url(\'/assets/images/', css)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
