// Prevent browser from restoring scroll position on reload which causes getting stuck
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

setTimeout(() => {
    // Force scroll to top when page loads
    window.scrollTo(0, 0);
    // 1. Open Invitation & Audio Logic
    const btnOpen = document.getElementById('btn-open');
    const coverPage = document.getElementById('cover-page');
    const mainContent = document.getElementById('main-content');
    const btnAudio = document.getElementById('btn-audio');
    
    // -- Audio Configuration --
    const AUDIO_URL = 'https://youtu.be/QcuAbb3fpcI?si=JNZOui3-_zrV8SsG';
    const AUDIO_START = 0;
    // -------------------------

    let isPlaying = false;
    let ytPlayer = null;
    let htmlAudio = null;
    let ytReady = false;
    let playQueued = false;

    const ytMatch = AUDIO_URL.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);

    if (ytMatch) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        const ytContainer = document.createElement('div');
        ytContainer.style.position = 'absolute';
        ytContainer.style.width = '1px';
        ytContainer.style.height = '1px';
        ytContainer.style.overflow = 'hidden';
        ytContainer.style.opacity = '0.01';
        ytContainer.style.pointerEvents = 'none';
        ytContainer.style.zIndex = '-1';
        
        const ytDiv = document.createElement('div');
        ytDiv.id = 'wim-yt-player';
        ytContainer.appendChild(ytDiv);
        document.body.appendChild(ytContainer);

        window.onYouTubeIframeAPIReady = () => {
            ytPlayer = new YT.Player('wim-yt-player', {
                height: '200', width: '200',
                videoId: ytMatch[1],
                playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1 },
                events: {
                    onReady: (e) => {
                        ytReady = true;
                        e.target.unMute();
                        e.target.setVolume(100);
                        if (playQueued) {
                            e.target.seekTo(AUDIO_START || 0);
                            e.target.playVideo();
                            playQueued = false;
                        }
                    },
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.ENDED) {
                            e.target.seekTo(AUDIO_START || 0);
                            e.target.playVideo();
                        }
                    }
                }
            });
        };
    } else {
        htmlAudio = new Audio(AUDIO_URL);
        htmlAudio.loop = true;
        htmlAudio.currentTime = AUDIO_START || 0;
    }

    const playAudio = () => {
        if (ytMatch) {
            if (ytReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
                const state = ytPlayer.getPlayerState();
                if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.PAUSED) {
                    ytPlayer.seekTo(AUDIO_START || 0);
                }
                ytPlayer.playVideo();
            } else {
                playQueued = true;
            }
        } else if (htmlAudio) {
            htmlAudio.play().catch(e => console.log("Audio play failed", e));
        }
        isPlaying = true;
        btnAudio.classList.add('playing');
        btnAudio.innerHTML = '<i class="fa-solid fa-music"></i>';
    };

    const pauseAudio = () => {
        if (ytMatch) {
            playQueued = false;
            if (ytReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
        } else if (htmlAudio) {
            htmlAudio.pause();
        }
        isPlaying = false;
        btnAudio.classList.remove('playing');
        btnAudio.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    };

    btnOpen.addEventListener('click', () => {
        // Unlock scroll by removing locked class from body
        document.body.classList.remove('locked');
        
        // Scroll to the main content area (hero section)
        const heroSection = document.getElementById('main-content');
        window.scrollTo({
            top: heroSection.offsetTop,
            behavior: 'smooth'
        });
        
        playAudio();
    });

    // Audio toggle button
    btnAudio.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // 2. Countdown Logic
    // Target date: 12 Desember 2026, 09:00:00
    const targetDate = new Date("2026-12-12T09:00:00+07:00").getTime();

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
        <div class="toast-icon"><img src="assets/images/logo.png" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"></div>
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

setTimeout(() => {
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
