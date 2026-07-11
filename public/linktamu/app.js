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
            guestTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Tidak ada tamu ditemukan</td></tr>';
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
            
            // Tombol WA
            const btnWA = document.createElement('button');
            btnWA.className = 'btn btn-sm btn-wa';
            btnWA.textContent = 'Kirim via WA';
            btnWA.onclick = () => window.open(guest.waApiLink, '_blank');
            
            // Tombol Salin Link
            const btnCopyLink = document.createElement('button');
            btnCopyLink.className = 'btn btn-sm btn-copy-link';
            btnCopyLink.textContent = 'Salin Link';
            btnCopyLink.onclick = () => copyToClipboard(guest.uniqueLink, 'Link Undangan Disalin!');
            
            // Tombol Salin Pesan
            const btnCopyMsg = document.createElement('button');
            btnCopyMsg.className = 'btn btn-sm btn-copy-msg';
            btnCopyMsg.textContent = 'Salin Teks Utuh';
            btnCopyMsg.onclick = () => copyToClipboard(guest.finalMessage, 'Teks Utuh Disalin!');

            tdAction.appendChild(btnWA);
            tdAction.appendChild(btnCopyLink);
            tdAction.appendChild(btnCopyMsg);

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
        outputSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Handle Live Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const filteredGuests = GuestManager.searchGuests(query);
        renderTable(filteredGuests);
    });

});
