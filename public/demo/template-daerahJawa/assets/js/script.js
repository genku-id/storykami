// Prevent browser from restoring scroll position on reload which causes getting stuck
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top when page loads
    window.scrollTo(0, 0);
    // 1. Open Invitation & Audio Logic
    const btnOpen = document.getElementById('btn-open');
    const coverPage = document.getElementById('cover-page');
    const mainContent = document.getElementById('main-content');
    const btnAudio = document.getElementById('btn-audio');
    
    // Create audio element (using a placeholder royalty-free instrumental link since the user will set it later)
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    audio.loop = true;
    let isPlaying = false;

    btnOpen.addEventListener('click', () => {
        // Unlock scroll by removing locked class from body
        document.body.classList.remove('locked');
        
        // Sembunyikan tombol setelah ditekan
        btnOpen.style.display = 'none';
        
        // Scroll to the main content area (hero section)
        const heroSection = document.getElementById('main-content');
        window.scrollTo({
            top: heroSection.offsetTop,
            behavior: 'smooth'
        });
        
        // Play audio
        audio.play().then(() => {
            isPlaying = true;
            btnAudio.classList.add('playing');
            btnAudio.innerHTML = '<i class="fa-solid fa-music"></i>';
        }).catch(err => {
            console.log("Audio play failed: ", err);
        });

    });

    // Audio toggle button
    btnAudio.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            btnAudio.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            btnAudio.classList.remove('playing');
        } else {
            audio.play();
            btnAudio.innerHTML = '<i class="fa-solid fa-music"></i>';
            btnAudio.classList.add('playing');
        }
        isPlaying = !isPlaying;
    });

    // 2. Countdown Logic
    const weddingDateElement = document.getElementById('wedding-date');
    const targetDateString = weddingDateElement ? weddingDateElement.getAttribute('data-date') : 'December 12, 2026 09:00:00';
    const targetDate = new Date(targetDateString).getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.getElementById('days').innerText = '00';
            document.getElementById('hours').innerText = '00';
            document.getElementById('minutes').innerText = '00';
            document.getElementById('seconds').innerText = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').innerText = seconds.toString().padStart(2, '0');
    };

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // 3. Scroll Animations (Intersection Observer)
    const animateElements = document.querySelectorAll('[data-animate]');
    
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // 4. Form submission mockup
    const guestbookFormOld = document.getElementById('guestbook-form');
    // Removed old alert logic
    
    // Initialize audio icon state
    btnAudio.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
});

// Global function for Copy to Clipboard
function copyRekening(elementId) {
    const rekeningText = document.getElementById(elementId).textContent.trim();
    
    // Use modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(rekeningText).then(() => {
            showCustomToast("Berhasil disalin");
        }).catch(err => {
            console.error('Gagal menyalin text: ', err);
            fallbackCopyTextToClipboard(rekeningText);
        });
    } else {
        fallbackCopyTextToClipboard(rekeningText);
    }
}

function fallbackCopyTextToClipboard(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed'; // Prevent scrolling to bottom
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        showCustomToast("Berhasil disalin");
    } catch (err) {
        console.error('Fallback copy gagal: ', err);
    }
    document.body.removeChild(tempInput);
}

function showCustomToast(message) {
    // Check if toast already exists, remove it
    let existingToast = document.getElementById('custom-toast-popup');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast element
    const toast = document.createElement('div');
    toast.id = 'custom-toast-popup';
    toast.className = 'custom-toast';
    toast.innerHTML = `
        <div class="toast-icon"><img src="logo.webp" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"></div>
        <div class="toast-text">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400); // Wait for transition to finish
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Guest Name from URL Parameter (?to=)
    const urlParams = new URLSearchParams(window.location.search);
    const guestNameParam = urlParams.get('to') || urlParams.get('invitation');
    const guestNameCover = document.querySelector('.guest-name');
    
    if (guestNameCover) {
        if (guestNameParam) {
            // Basic sanitization
            const sanitizedName = guestNameParam.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            guestNameCover.innerHTML = sanitizedName;
        } else {
            // Default fallback if no parameter is provided
            // We keep the original HTML value if it's already generated by WIM, 
            // but for safety we can default to "Tamu Undangan" if it's empty
            if (!guestNameCover.innerHTML.trim()) {
                guestNameCover.innerHTML = "Tamu Undangan";
            }
        }
    }

    // Fill guestbook name from cover guest name
    const guestNameInput = document.getElementById('guestbook-name-input');
    if (guestNameCover && guestNameInput) {
        guestNameInput.value = guestNameCover.innerText.trim();
    }
    
    // Sync couple names on closing page from cover page
    const coverCoupleNames = document.querySelector('.cover-content .title-names-cursive');
    const closingCoupleNames = document.getElementById('closing-couple-names');
    if (coverCoupleNames && closingCoupleNames) {
        closingCoupleNames.innerText = coverCoupleNames.innerText.trim();
    }
    
    // Handle guestbook form submission
    const guestbookForm = document.getElementById('guestbook-form');
    if (guestbookForm) {
        guestbookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Show custom toast with logo
            showCustomToast("Ucapan Terkirim!");
            // Reset the textarea (leaving name intact as it is readonly)
            const textarea = guestbookForm.querySelector('textarea');
            if (textarea) textarea.value = '';
        });
    }
});


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
                const btnAudio = document.getElementById('btn-audio');
                if (btnAudio) btnAudio.classList.add('visible');
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
