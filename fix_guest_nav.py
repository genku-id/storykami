import re

# Fix Guestbook rendering in template-engine.js
engine_path = r'C:\Pictures\StoryKami\WebSK\src\utils\template-engine.js'
with open(engine_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the img tag inside renderItem
old_img = r'''<img src="assets/images/logo.png" onerror="this.src=\'logo.png\'" class="comment-avatar-img" alt="Logo" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px;">'''
new_img = r'''<img src="https://ui-avatars.com/api/?name=\' + encodeURIComponent(w.nama || \'T\') + \'&background=random&color=fff" class="comment-avatar-img" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px;">'''

if old_img in content:
    content = content.replace(old_img, new_img)
    print("Updated template-engine.js avatar logic")
else:
    print("Could not find old img tag in template-engine.js")

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix bottom navigation visibility in script.js
script_path = r'C:\Pictures\StoryKami\template\template-daerahJawa\assets\js\script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    js = f.read()

nav_logic = r'''            var bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) bottomNav.classList.add('visible');'''

if nav_logic not in js:
    # Insert it right after document.body.classList.remove('locked');
    js = js.replace("document.body.classList.remove('locked');", "document.body.classList.remove('locked');\n" + nav_logic)
    print("Added bottom nav logic to script.js")
else:
    print("Bottom nav logic already in script.js")

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(js)
