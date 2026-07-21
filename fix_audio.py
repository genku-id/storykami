import re
import sys

engine_path = r'C:\Pictures\StoryKami\WebSK\src\utils\template-engine.js'
with open(engine_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix AUDIO_URL replacement to preserve template default if data.audioUrl is empty
old_audio = r'''        script = script.replace(/(?:const|var) AUDIO_URL = '[^']*';/, `var AUDIO_URL = '${attrEscape(data.audioUrl || "")}';`);'''
new_audio = r'''        script = script.replace(/(?:const|var) AUDIO_URL = '[^']*';/, function(match) {
            return data.audioUrl ? `var AUDIO_URL = '${attrEscape(data.audioUrl)}';` : match;
        });'''

if old_audio in content:
    content = content.replace(old_audio, new_audio)
    print("Fixed AUDIO_URL logic in template-engine.js")
else:
    print("WARNING: Could not find AUDIO_URL replacement in template-engine.js")

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(content)
