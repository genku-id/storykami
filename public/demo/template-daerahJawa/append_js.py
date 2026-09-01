import os

js_path = 'assets/js/script.js'
with open(js_path, 'a', encoding='utf-8') as f:
    f.write("""

// Bottom Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const bottomNav = document.querySelector('.bottom-nav');
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const btnOpen = document.getElementById('btn-open');
    
    // Smooth scroll for nav items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if(targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    if(btnOpen && bottomNav) {
        btnOpen.addEventListener('click', () => {
            setTimeout(() => {
                bottomNav.classList.add('visible');
            }, 800);
        });
    }

    // Intersection Observer to highlight active nav item
    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -70% 0px', // Trigger when section is in top 30% of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    if (nav.getAttribute('href') === `#${id}`) {
                        nav.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => {
        if(sec.getAttribute('id')) {
            observer.observe(sec);
        }
    });
});
""")
print("Added JS for bottom nav.")
