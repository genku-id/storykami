import re
import sys

engine_path = r'C:\Pictures\StoryKami\WebSK\src\utils\template-engine.js'
with open(engine_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace renderItem
old_render = r'''      function renderItem(w) {
        var time = w.created_at ? new Date(w.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '';
        return '<div class="comment-item">'
          + '<img src="/demo/template-floral1/assets/images/logo.png" class="comment-avatar-img" alt="Logo">'
          + '<div class="comment-bubble">'
          + '<h4 class="comment-name">' + escapeHtml(w.nama) + '</h4>'
          + '<p class="comment-text">' + escapeHtml(w.ucapan) + '</p>'
          + (time ? '<span class="time">' + time + '</span>' : '')
          + '</div></div>';
      }'''

new_render = r'''      function renderItem(w) {
        var time = w.created_at ? new Date(w.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '';
        var badge = (w.kehadiran === 'Hadir') ? ' <i class="fa-solid fa-circle-check" style="font-size: 0.8rem; color: #6b8e23; margin-left: 3px;"></i>' : '';
        return '<div class="comment-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; width: 100%;">'
          + '<img src="assets/images/logo.png" onerror="this.src=\'logo.png\'" class="comment-avatar-img" alt="Logo" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px;">'
          + '<div class="comment-bubble" style="background-color: #fff; border-radius: 0 12px 12px 12px; padding: 10px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); position: relative; max-width: calc(100% - 45px); text-align: left;">'
          + '<h4 class="comment-name" style="font-family: \'Inter\', sans-serif; font-size: 0.85rem; color: #333; font-weight: 700; margin: 0 0 4px 0;">' + escapeHtml(w.nama || 'Tamu') + badge + '</h4>'
          + '<p class="comment-text" style="font-family: \'Inter\', sans-serif; font-size: 0.9rem; color: #111; margin: 0 0 6px 0; line-height: 1.4; word-wrap: break-word;">' + escapeHtml(w.ucapan || '') + '</p>'
          + (time ? '<small class="time text-muted" style="font-family: \'Inter\', sans-serif; font-size: 0.7rem; color: #999; display: block; text-align: right; margin-top: 4px;">' + time + '</small>' : '')
          + '</div></div>';
      }'''

if old_render in content:
    content = content.replace(old_render, new_render)
    print("Fixed renderItem in template-engine.js")
else:
    print("WARNING: old_render not found in template-engine.js")

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(content)
