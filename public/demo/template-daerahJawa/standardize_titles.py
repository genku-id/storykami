import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to find all style attributes that contain 'Oleo Script' and normalize their font-size and font-weight
def replacer(match):
    style_str = match.group(1)
    
    # Remove existing font-size
    style_str = re.sub(r'font-size:\s*[\d\.]+rem;', '', style_str)
    
    # Remove existing font-weight
    style_str = re.sub(r'font-weight:\s*(normal|bold|\d+);', '', style_str)
    
    # Ensure it ends cleanly and add the new standardized size and weight
    style_str = style_str.strip()
    if not style_str.endswith(';'):
        style_str += ';'
    
    # Add standardized size and weight
    style_str += ' font-size: 3rem; font-weight: normal;'
    
    return f'style="{style_str}"'

# Regex to match style="..." containing Oleo Script
content = re.sub(r'style="([^"]*\'Oleo Script\'[^"]*)"', replacer, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated all titles to 3rem and normal weight.")
