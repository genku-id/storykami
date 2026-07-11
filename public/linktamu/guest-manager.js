/**
 * GuestManager
 * Modul terpisah untuk menangani logika pemrosesan data tamu.
 * Memudahkan ekstensi ke database (Supabase/Firebase) di masa depan.
 */

const GuestManager = {
    // Array to store the generated guests in memory
    guests: [],

    /**
     * Memproses teks input mentah menjadi array object tamu
     * @param {string} rawText - Teks dari textarea
     * @param {string} baseUrl - URL dasar undangan
     * @param {string} messageTemplate - Template teks WA
     */
    processGuests: function(rawText, baseUrl, messageTemplate) {
        this.guests = []; // Reset
        
        // Membersihkan Base URL (hilangkan http:// atau spasi berlebih di ujung)
        let cleanBaseUrl = baseUrl.trim().replace(/^https?:\/\//, '');
        // Pastikan format akhirnya menggunakan https://
        cleanBaseUrl = 'https://' + cleanBaseUrl;
        
        // Pisahkan nama berdasarkan baris baru
        const lines = rawText.split('\n');
        
        let idCounter = 1;

        lines.forEach(line => {
            let name = line.trim();
            if (name) {
                // Sanitasi: Mengubah simbol '&' atau 'dan' jika diperlukan, tapi 
                // URL encode akan menangani '&' dengan baik. Namun sesuai PRD,
                // kita ubah '&' menjadi 'dan' agar aman secara semantik untuk sapaan
                let safeName = name.replace(/&/g, 'dan');
                
                // Encode URL parameter
                let urlEncodedName = encodeURIComponent(safeName);
                let uniqueLink = `${cleanBaseUrl}?to=${urlEncodedName}`;
                
                // Menyusun pesan custom
                let finalMessage = messageTemplate
                    .replace(/\{\{nama_tamu\}\}/g, safeName)
                    .replace(/\{\{link_undangan\}\}/g, uniqueLink);

                // Encode pesan untuk API WhatsApp
                let waApiLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalMessage)}`;

                this.guests.push({
                    id: idCounter++,
                    originalName: safeName,
                    uniqueLink: uniqueLink,
                    finalMessage: finalMessage,
                    waApiLink: waApiLink
                });
            }
        });

        return this.guests;
    },

    /**
     * Mengambil seluruh data tamu
     */
    getAllGuests: function() {
        return this.guests;
    },

    /**
     * Mencari tamu berdasarkan nama
     * @param {string} query - Kata kunci pencarian
     */
    searchGuests: function(query) {
        if (!query) return this.guests;
        
        const lowerQuery = query.toLowerCase();
        return this.guests.filter(guest => 
            guest.originalName.toLowerCase().includes(lowerQuery)
        );
    }
};

// Ekspor untuk environment modern atau attach ke window untuk browser vanilla
if (typeof window !== 'undefined') {
    window.GuestManager = GuestManager;
}
