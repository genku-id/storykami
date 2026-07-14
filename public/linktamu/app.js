/**
 * app.js
 * Modul UI untuk menghubungkan logika (guest-manager) dengan antarmuka DOM.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const baseUrlInput = document.getElementById('base-url');
    const messageTemplateInput = document.getElementById('message-template');
    const guestListInput = document.getElementById('guest-list');
    const btnGenerate = document.getElementById('btn-generate');
    
    const outputSection = document.getElementById('output-section');
    const guestTableBody = document.getElementById('guest-table-body');
    const totalGuestsSpan = document.getElementById('total-guests');
    const searchInput = document.getElementById('search-input');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // State Variables
    let toastTimeout;

    // --- Core Functions --- //

    /**
     * Menampilkan custom toast alert
     */
    function showToast(message) {
        toastMessage.innerText = message;
        toast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Menyalin teks ke clipboard
     */
    async function copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMessage);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(successMessage);
            } catch (err) {
                alert("Gagal menyalin, browser tidak mendukung fitur ini.");
            }
            document.body.removeChild(textArea);
        }
    }

    /**
     * Membangun HTML baris tabel untuk daftar tamu
     */
    function renderTable(guests) {
        guestTableBody.innerHTML = '';
        
        if (guests.length === 0) {
            guestTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Tidak ada tamu ditemukan</td></tr>';
            return;
        }

        guests.forEach((guest, index) => {
            const tr = document.createElement('tr');
            
            // Kolom No
            const tdNo = document.createElement('td');
            tdNo.textContent = index + 1;
            
            // Kolom Nama
            const tdName = document.createElement('td');
            tdName.className = 'guest-name-cell';
            tdName.textContent = guest.originalName;
            
            // Kolom Aksi
            const tdAction = document.createElement('td');
            
            // Container action buttons
            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-buttons';

            // Tombol WA
            const btnWA = document.createElement('button');
            btnWA.className = 'btn btn-sm btn-neutral btn-icon';
            btnWA.title = 'Kirim via WA';
            btnWA.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.6 6.31999C16.8669 5.58141 15.9943 4.99596 15.033 4.59767C14.0716 4.19938 13.0406 3.99622 12 3.99999C10.6089 4.00135 9.24248 4.36819 8.03771 5.06377C6.83294 5.75935 5.83208 6.75926 5.13534 7.96335C4.4386 9.16745 4.07046 10.5335 4.06776 11.9246C4.06507 13.3158 4.42793 14.6832 5.12 15.89L4 20L8.2 18.9C9.35975 19.5452 10.6629 19.8891 11.99 19.9C14.0997 19.9001 16.124 19.0668 17.6222 17.5816C19.1205 16.0965 19.9715 14.0796 19.99 11.97C19.983 10.9173 19.7682 9.87634 19.3581 8.9068C18.948 7.93725 18.3505 7.05819 17.6 6.31999ZM12 18.53C10.8177 18.5308 9.65701 18.213 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.55925 14.0667 5.24174 12.429 5.51762 10.8372C5.7935 9.24545 6.64361 7.81015 7.9069 6.80322C9.1702 5.79628 10.7589 5.28765 12.3721 5.37368C13.9853 5.4597 15.511 6.13441 16.66 7.26999C17.916 8.49818 18.635 10.1735 18.66 11.93C18.6442 13.6859 17.9355 15.3645 16.6882 16.6006C15.441 17.8366 13.756 18.5301 12 18.53ZM15.61 13.59C15.41 13.49 14.44 13.01 14.26 12.95C14.08 12.89 13.94 12.85 13.81 13.05C13.6144 13.3181 13.404 13.5751 13.18 13.82C13.07 13.96 12.95 13.97 12.75 13.82C11.6097 13.3694 10.6597 12.5394 10.06 11.47C9.85 11.12 10.26 11.14 10.64 10.39C10.6681 10.3359 10.6827 10.2759 10.6827 10.215C10.6827 10.1541 10.6681 10.0941 10.64 10.04C10.64 9.93999 10.19 8.95999 10.03 8.56999C9.87 8.17999 9.71 8.23999 9.58 8.22999H9.19C9.08895 8.23154 8.9894 8.25465 8.898 8.29776C8.8066 8.34087 8.72546 8.403 8.66 8.47999C8.43562 8.69817 8.26061 8.96191 8.14676 9.25343C8.03291 9.54495 7.98287 9.85749 8 10.17C8.0627 10.9181 8.34443 11.6311 8.81 12.22C9.6622 13.4958 10.8301 14.5293 12.2 15.22C12.9185 15.6394 13.7535 15.8148 14.58 15.72C14.8552 15.6654 15.1159 15.5535 15.345 15.3915C15.5742 15.2296 15.7667 15.0212 15.91 14.78C16.0428 14.4856 16.0846 14.1583 16.03 13.84C15.94 13.74 15.81 13.69 15.61 13.59Z"/></svg>`;
            btnWA.onclick = () => {
                window.open(guest.waApiLink, '_blank');
                btnWA.classList.remove('btn-neutral');
                btnWA.classList.add('btn-success');
            };
            
            // Tombol Salin Link
            const btnCopyLink = document.createElement('button');
            btnCopyLink.className = 'btn btn-sm btn-neutral btn-icon';
            btnCopyLink.title = 'Salin Link';
            btnCopyLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
            btnCopyLink.onclick = () => {
                copyToClipboard(guest.uniqueLink, 'Link Undangan Disalin!');
                btnCopyLink.classList.remove('btn-neutral');
                btnCopyLink.classList.add('btn-info');
            };
            
            // Tombol Salin Pesan
            const btnCopyMsg = document.createElement('button');
            btnCopyMsg.className = 'btn btn-sm btn-neutral btn-icon';
            btnCopyMsg.title = 'Salin Teks Utuh';
            btnCopyMsg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            btnCopyMsg.onclick = () => {
                copyToClipboard(guest.finalMessage, 'Teks Utuh Disalin!');
                btnCopyMsg.classList.remove('btn-neutral');
                btnCopyMsg.classList.add('btn-gray');
            };

            actionDiv.appendChild(btnWA);
            actionDiv.appendChild(btnCopyLink);
            actionDiv.appendChild(btnCopyMsg);
            tdAction.appendChild(actionDiv);

            tr.appendChild(tdNo);
            tr.appendChild(tdName);
            tr.appendChild(tdAction);

            guestTableBody.appendChild(tr);
        });
    }

    // --- Event Listeners --- //

    // Handle Generate Button Click
    btnGenerate.addEventListener('click', () => {
        const baseUrl = baseUrlInput.value;
        const rawText = guestListInput.value;
        const messageTemplate = messageTemplateInput.value;

        if (!baseUrl) {
            alert('Silakan masukkan Base URL terlebih dahulu!');
            baseUrlInput.focus();
            return;
        }

        if (!rawText.trim()) {
            alert('Silakan masukkan daftar nama tamu!');
            guestListInput.focus();
            return;
        }

        // Proses data menggunakan modul GuestManager
        const generatedGuests = GuestManager.processGuests(rawText, baseUrl, messageTemplate);
        
        // Render tabel
        renderTable(generatedGuests);
        
        // Tampilkan output section dan update angka
        totalGuestsSpan.textContent = generatedGuests.length;
        outputSection.style.display = 'block';
        
        // Scroll halus ke output
        setTimeout(() => {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    });

    // Handle Live Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const filteredGuests = GuestManager.searchGuests(query);
        renderTable(filteredGuests);
    });

    // --- Modal Handlers --- //
    const btnOpenTemplate = document.getElementById('btn-open-template');
    const templateModal = document.getElementById('template-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveModal = document.getElementById('btn-save-modal');
    
    // --- Template Options --- //
    const templateSelector = document.getElementById('template-selector');
    const messageTemplate = document.getElementById('message-template');
    
    const templates = {
        muslim: `Assalamualaikum Warahmatullahi Wabarakatuh\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i {{nama_tamu}} untuk menghadiri acara kami.\n\nBerikut link undangan kami, untuk info lengkap dari acara bisa kunjungi:\n\n{{link_undangan}}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\nMohon maaf perihal undangan hanya di bagikan melalui pesan ini.\n\nTerima kasih banyak atas perhatiannya. Alhamdulillah Jazakumullohu Khoiro\n\nSalam Hormat\n(nama mempelai)`,
        formal: `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, {{nama_tamu}} untuk menghadiri acara pernikahan kami.\n\n*Berikut link undangan kami*, untuk info lengkap dari acara, bisa kunjungi:\n\n{{link_undangan}}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\nTerima Kasih\n\nHormat kami,\n(nama mempelai)`
    };

    templateSelector.addEventListener('change', (e) => {
        messageTemplate.value = templates[e.target.value];
    });

    function openModal() {
        templateModal.style.display = 'flex';
    }

    function closeModal() {
        templateModal.style.display = 'none';
    }

    btnOpenTemplate.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnSaveModal.addEventListener('click', closeModal);
    
    // Close modal if clicked outside
    templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            closeModal();
        }
    });

});
