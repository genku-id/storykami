import os

# Update style.css
css_path = 'assets/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

css_content = css_content.replace(
""".btn-audio {
    position: fixed;
    bottom: 90px; /* 2x tinggi elemen (45px) */
    right: 20px;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: #4e342e;
    color: #dfcfb9;
    border: none;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 9999;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}""",
""".btn-audio {
    position: fixed;
    bottom: 90px; /* 2x tinggi elemen (45px) */
    right: 20px;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: #4e342e;
    color: #dfcfb9;
    border: none;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 9999;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease;
}

.btn-audio.visible {
    opacity: 1;
    pointer-events: auto;
}

@keyframes spin-audio {
    100% { transform: rotate(360deg); }
}

.btn-audio.playing i {
    animation: spin-audio 4s linear infinite;
}""")

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

# Update script.js
js_path = 'assets/js/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

js_content = js_content.replace(
"""    if(btnOpen && bottomNav) {
        btnOpen.addEventListener('click', () => {
            setTimeout(() => {
                bottomNav.classList.add('visible');
            }, 800);
        });
    }""",
"""    if(btnOpen && bottomNav) {
        btnOpen.addEventListener('click', () => {
            setTimeout(() => {
                bottomNav.classList.add('visible');
                const btnAudio = document.getElementById('btn-audio');
                if (btnAudio) btnAudio.classList.add('visible');
            }, 800);
        });
    }""")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Updated audio button logic and styles.")
