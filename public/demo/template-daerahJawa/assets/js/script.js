// Prevent browser from restoring scroll position on reload
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ============================================================
// AUDIO CONFIGURATION (diisi otomatis oleh template engine)
// ============================================================
var AUDIO_URL = 'https://youtu.be/igFxGRMQYiM';
var AUDIO_START = 0;
// ============================================================

// --- YouTube Player Setup (HARUS di global scope, bukan di dalam setTimeout) ---
var _ytPlayer = null;
var _ytReady = false;
var _playQueued = false;
var _isPlaying = false;
var _htmlAudio = null;

var _ytMatch = AUDIO_URL.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);

if (_ytMatch) {
    // Sisipkan div player tersembunyi langsung ke body
    var ytContainer = document.createElement('div');
    ytContainer.id = 'wim-yt-container';
    ytContainer.style.cssText = 'position:fixed;width:1px;height:1px;top:-10px;left:-10px;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden;';
    var ytDiv = document.createElement('div');
    ytDiv.id = 'wim-yt-player';
    ytContainer.appendChild(ytDiv);
    document.head.appendChild(ytContainer); // pasang di head agar tersedia sebelum body locked

    // Load YouTube IFrame API
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(tag, firstScript);

    // Callback GLOBAL â?" harus di luar setTimeout agar tidak terlewat
    window.onYouTubeIframeAPIReady = function() {
        // Pastikan container sudah ada di body
        if (!document.getElementById('wim-yt-container')) {
            document.body.appendChild(ytContainer);
        }
        _ytPlayer = new YT.Player('wim-yt-player', {
            height: '1',
            width: '1',
            videoId: _ytMatch[1],
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                playsinline: 1,
                mute: 0
            },
            events: {
                onReady: function(e) {
                    _ytReady = true;
                    e.target.unMute();
                    e.target.setVolume(100);
                    if (_playQueued) {
                        e.target.seekTo(AUDIO_START || 0);
                        e.target.playVideo();
                        _playQueued = false;
                        _setAudioPlaying(true);
                    }
                },
                onStateChange: function(e) {
                    // Loop otomatis
                    if (e.data === YT.PlayerState.ENDED) {
                        e.target.seekTo(AUDIO_START || 0);
                        e.target.playVideo();
                    }
                    // Sinkronkan state tombol
                    if (e.data === YT.PlayerState.PLAYING) {
                        _setAudioPlaying(true);
                    } else if (e.data === YT.PlayerState.PAUSED) {
                        _setAudioPlaying(false);
                    }
                }
            }
        });
    };
} else if (AUDIO_URL) {
    // Fallback: HTML5 Audio untuk MP3 biasa
    _htmlAudio = new Audio(AUDIO_URL);
    _htmlAudio.loop = true;
}

function _setAudioPlaying(playing) {
    _isPlaying = playing;
    var btn = document.getElementById('btn-audio');
    if (!btn) return;
    if (playing) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fa-solid fa-music"></i>';
    } else {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }
}

function _playAudio() {
    if (_ytMatch) {
        if (_ytReady && _ytPlayer && typeof _ytPlayer.playVideo === 'function') {
            var state = _ytPlayer.getPlayerState();
            // Jika belum diputar sama sekali, seek ke start dulu
            if (state !== 1 && state !== 2) {
                _ytPlayer.seekTo(AUDIO_START || 0);
            }
            _ytPlayer.unMute();
            _ytPlayer.setVolume(100);
            _ytPlayer.playVideo();
            _setAudioPlaying(true);
        } else {
            // YT belum siap, antre
            _playQueued = true;
            _setAudioPlaying(true); // tampilkan icon playing duluan
        }
    } else if (_htmlAudio) {
        if (_htmlAudio.readyState === 0) {
            _htmlAudio.currentTime = AUDIO_START || 0;
        }
        _htmlAudio.play().catch(function(e) { console.log('Audio play failed', e); });
        _setAudioPlaying(true);
    }
}

function _pauseAudio() {
    _playQueued = false;
    if (_ytMatch) {
        if (_ytReady && _ytPlayer && typeof _ytPlayer.pauseVideo === 'function') {
            _ytPlayer.pauseVideo();
        }
    } else if (_htmlAudio) {
        _htmlAudio.pause();
    }
    _setAudioPlaying(false);
}

// ============================================================
// MAIN INIT â?" setelah DOM siap
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0);

    var btnOpen = document.getElementById('btn-open');
    var btnAudio = document.getElementById('btn-audio');

    // Tombol Buka Undangan
    if (btnOpen) {
        btnOpen.addEventListener('click', function() {
            document.body.classList.remove('locked');
            var mainContent = document.getElementById('main-content');
            if (mainContent) {
                window.scrollTo({ top: mainContent.offsetTop, behavior: 'smooth' });
            }
            // Mulai putar musik â?" ini adalah user gesture sehingga browser mengizinkan
            _playAudio();
        });
    }

    // Tombol toggle Audio
    if (btnAudio) {
        btnAudio.addEventListener('click', function() {
            if (_isPlaying) {
                _pauseAudio();
            } else {
                _playAudio();
            }
        });
    }

    // Countdown
    var targetDate = new Date('December 12, 2026 09:00:00').getTime();
    function updateCountdown() {
        var now = new Date().getTime();
        var distance = targetDate - now;
        var d = document.getElementById('days');
        var h = document.getElementById('hours');
        var m = document.getElementById('minutes');
        var s = document.getElementById('seconds');
        if (!d) return;
        if (distance < 0) {
            d.innerText = h.innerText = m.innerText = s.innerText = '00';
            return;
        }
        d.innerText = Math.floor(distance / 86400000).toString().padStart(2, '0');
        h.innerText = Math.floor((distance % 86400000) / 3600000).toString().padStart(2, '0');
        m.innerText = Math.floor((distance % 3600000) / 60000).toString().padStart(2, '0');
        s.innerText = Math.floor((distance % 60000) / 1000).toString().padStart(2, '0');
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Scroll Animations
    var animateElements = document.querySelectorAll('[data-animate]');
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    animateElements.forEach(function(el) { observer.observe(el); });

    // Guest name from URL
    var urlParams = new URLSearchParams(window.location.search);
    var guestNameParam = urlParams.get('to') || urlParams.get('invitation');
    var guestNameEl = document.querySelector('.guest-name');
    if (guestNameEl && guestNameParam) {
        guestNameEl.innerHTML = guestNameParam.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } else if (guestNameEl && !guestNameEl.innerHTML.trim()) {
        guestNameEl.innerHTML = 'Tamu Undangan';
    }

    // Guestbook name autofill
    var guestNameInput = document.getElementById('guestbook-name-input');
    if (guestNameEl && guestNameInput) {
        guestNameInput.value = guestNameEl.innerText.trim();
    }

    // Guestbook form submit
    var guestbookForm = document.getElementById('guestbook-form');
    if (guestbookForm) {
        guestbookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showCustomToast('Ucapan Terkirim!');
            var textarea = guestbookForm.querySelector('textarea');
            if (textarea) textarea.value = '';
        });
    }
});

// ============================================================
// UTILITIES
// ============================================================
function copyRekening(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var text = el.textContent.trim();
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function() {
            showCustomToast('Berhasil disalin');
        }).catch(function() { fallbackCopyTextToClipboard(text); });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    var tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.style.position = 'fixed';
    document.body.appendChild(tmp);
    tmp.select();
    try { document.execCommand('copy'); showCustomToast('Berhasil disalin'); } catch(e) {}
    document.body.removeChild(tmp);
}

function showCustomToast(message) {
    var existing = document.getElementById('custom-toast-popup');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'custom-toast-popup';
    toast.className = 'custom-toast';
    toast.innerHTML = '<div class="toast-icon"><img src="assets/images/logo.png" style="width:60px;height:60px;border-radius:50%;object-fit:cover;"></div><div class="toast-text">' + message + '</div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 400);
    }, 2000);
}

