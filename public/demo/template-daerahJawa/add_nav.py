import os

css_path = 'assets/css/style.css'
with open(css_path, 'a', encoding='utf-8') as f:
    f.write("""
/* Bottom Navigation */
.bottom-nav {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 8px 15px;
    background: rgba(223, 207, 185, 0.7); /* Translucent beige */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 50px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.bottom-nav.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
}

.bottom-nav .nav-item {
    color: #4a2c16;
    font-size: 1.1rem;
    width: 40px;
    height: 40px;
    text-decoration: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.bottom-nav .nav-item:hover {
    color: #2a2a2a;
}

.bottom-nav .nav-item.active {
    background-color: #4a2c16;
    color: #dfcfb9;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
""")
print("Added bottom nav CSS.")
