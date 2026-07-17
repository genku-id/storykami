(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.InvitationTemplateEngine = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    const DEFAULT_DATA = {
        projectName: "undangan-dika-riyan",
        guestName: "Nama Tamu",
        brideName: "Dika",
        groomName: "Riyan",
        brideParents: "Putri Pertama dari\nBapak Lorem Dan Ibu Ipsum",
        groomParents: "Putra Pertama dari\nBapak Lorem Dan Ibu Ipsum",
        brideInstagram: "akun_dika",
        groomInstagram: "akun_riyan",
        weddingDate: "2026-12-12",
        weddingDateText: "12 Desember 2026",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        brandName: "StoryKami",
        footerInstagramUrl: "#",
        footerWhatsappUrl: "#",
        sections: {
            profiles: true,
            quote: true,
            events: true,
            loveStory: true,
            gift: true,
            guestbook: true,
            closing: true,
            footer: true
        },
        events: [
            {
                title: "Akad Nikah",
                dateText: "Sabtu, 22 Maret 2025",
                startTime: "09:00",
                endTime: "10:00",
                locationName: "Masjid Agung Al-Hikmah",
                address: "Jl. Contoh Alamat No. 123, Kota, Provinsi",
                mapsUrl: "https://maps.google.com"
            },
            {
                title: "Resepsi",
                dateText: "Sabtu, 22 Maret 2025",
                startTime: "11:00",
                endTime: "14:00",
                locationName: "Hotel Amaris",
                address: "Jl. Karet Pasar Baru Barat V No.92, RW.4, Karet Tengsin, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10250",
                mapsUrl: "https://maps.google.com"
            }
        ],
        stories: [
            {
                title: "Awal Pertemuan",
                date: "4 Februari 2019",
                text: "Takdir mempertemukan kami di sebuah acara kampus. Awalnya hanya sebatas perkenalan biasa, namun tawa dan obrolan ringan malam itu menyisakan kesan yang tak biasa. Dari sana, segalanya mulai berubah."
            },
            {
                title: "Langkah Pertama",
                date: "10 Maret 2019",
                text: "Setelah beberapa kali saling bertukar cerita, akhirnya keberanian itu muncul. Sebuah ajakan sederhana untuk makan siang berdua menjadi langkah awal dari kisah kami. Sejak hari itu, waktu terasa lebih berharga saat dihabiskan bersama."
            },
            {
                title: "Ujian Waktu",
                date: "7 November 2021",
                text: "Hubungan kami tak selalu mudah. Jarak, waktu, dan kesibukan sempat membuat semuanya terasa sulit. Tapi justru di sanalah kami belajar tentang kesabaran, pengertian, dan komitmen. Setiap rindu dan air mata menjadi bukti bahwa cinta ini layak diperjuangkan."
            }
        ],
        gift: {
            whatsappNumber: "6281234567890",
            bank1: {
                name: "BCA",
                logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
                number: "0012345678",
                owner: "DILAN PRATAMA"
            },
            bank2: {
                name: "BSI",
                logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg",
                number: "9876543210",
                owner: "MILLEA KHADEEJA"
            },
            physicalAddress: "JL. alamat rumah",
            receiver: "alamat kado"
        }
    };

    const IMAGE_FILES = {
        brideImage: "bride.png",
        groomImage: "groom.png",
        coupleImage: "couple.png",
        logoImage: "logo.png",
        backgroundImage: "backgroundbunga.png",
        floralImage: "floral1.png"
    };

    const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    function deepMerge(base, input) {
        if (Array.isArray(base)) {
            return Array.isArray(input) ? input.map((item, index) => deepMerge(base[index] || {}, item || {})) : base.slice();
        }

        if (!base || typeof base !== "object") {
            return input === undefined || input === null ? base : input;
        }

        const output = Object.assign({}, base);
        Object.keys(input || {}).forEach((key) => {
            output[key] = deepMerge(base[key], input[key]);
        });
        return output;
    }

    function htmlEscape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function attrEscape(value) {
        return htmlEscape(value).replace(/'/g, "&#39;");
    }

    function linesToHtml(value) {
        return htmlEscape(value).replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
    }

    function parseDateParts(dateString) {
        const parts = String(dateString || "").split("-").map(Number);
        if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
        return { year: parts[0], month: parts[1], day: parts[2] };
    }

    function formatDateId(dateString, includeDay) {
        const parts = parseDateParts(dateString);
        if (!parts) return "";
        const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
        const dateText = `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
        return includeDay ? `${DAYS[date.getUTCDay()]}, ${dateText}` : dateText;
    }

    function formatClock(time) {
        const safe = String(time || "").slice(0, 5);
        return safe ? safe.replace(":", ".") : "";
    }

    function eventTimeText(event) {
        const start = formatClock(event.startTime);
        const end = formatClock(event.endTime);
        if (start && end) return `Pukul ${start} WIB - ${end} WIB`;
        if (start) return `Pukul ${start} WIB`;
        return "";
    }

    function slugify(value) {
        return String(value || "undangan")
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 70) || "undangan";
    }

    function normalizePhone(value) {
        const digits = String(value || "").replace(/\D/g, "");
        if (!digits) return "";
        if (digits.startsWith("0")) return `62${digits.slice(1)}`;
        return digits;
    }

    function whatsappLink(phone, text) {
        const normalized = normalizePhone(phone);
        if (!normalized) return "";
        return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
    }

    function instagramUrl(value) {
        const text = String(value || "").trim();
        if (!text) return "";
        if (/^https?:\/\//i.test(text)) return text;
        return `https://instagram.com/${text.replace(/^@/, "")}`;
    }

    function instagramLabel(value) {
        const text = String(value || "").trim();
        if (!text) return "";
        if (/^https?:\/\//i.test(text)) {
            const clean = text.replace(/\/+$/, "");
            return `@${clean.split("/").pop()}`;
        }
        return `@${text.replace(/^@/, "")}`;
    }

    function toGoogleDate(date, time) {
        const parts = parseDateParts(date);
        if (!parts) return "";
        const clock = String(time || "09:00").replace(":", "").padEnd(4, "0").slice(0, 4);
        return `${String(parts.year).padStart(4, "0")}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}T${clock}00`;
    }

    function titleFromEventKey(key) {
        if (key === "akad") return "Akad Nikah";
        if (key === "resepsi") return "Resepsi";
        return String(key || "Acara")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function migrateInput(input) {
        if (!input || typeof input !== "object") return {};
        const output = Object.assign({}, input);

        if (input.events && !Array.isArray(input.events)) {
            const eventKeys = Object.keys(input.events);
            const orderedKeys = ["akad", "resepsi"]
                .filter((key) => eventKeys.includes(key))
                .concat(eventKeys.filter((key) => key !== "akad" && key !== "resepsi"));
            output.events = orderedKeys.map((key) => Object.assign({ title: titleFromEventKey(key) }, input.events[key]));
        }

        return output;
    }

    function normalizeEvent(event) {
        const normalized = Object.assign({
            title: "",
            date: "",
            dateText: "",
            startTime: "",
            endTime: "",
            locationName: "",
            address: "",
            mapsUrl: ""
        }, event || {});
        if (normalized.date && !normalized.dateText) {
            normalized.dateText = formatDateId(normalized.date, true);
        }
        normalized.timeText = eventTimeText(normalized);
        return normalized;
    }

    function hasEventContent(event) {
        return ["title", "dateText", "startTime", "endTime", "locationName", "address", "mapsUrl"]
            .some((key) => String(event[key] || "").trim());
    }

    function normalizeEvents(events) {
        if (!Array.isArray(events)) return [];
        return events.map(normalizeEvent).filter(hasEventContent);
    }

    function normalizeStory(story) {
        return Object.assign({ title: "", date: "", text: "" }, story || {});
    }

    function hasStoryContent(story) {
        return ["title", "date", "text"].some((key) => String(story[key] || "").trim());
    }

    function normalizeStories(stories) {
        if (!Array.isArray(stories)) return [];
        return stories.map(normalizeStory).filter(hasStoryContent);
    }

    function getBankLogo(bankName) {
        if (!bankName) return null;
        const name = bankName.toUpperCase().trim();
        const svgBanks = ["BCA", "BRI", "DANA", "GOPAY", "LINKAJA", "OVO"];
        const pngBanks = ["BLU", "BNI", "BSI", "CIMB", "JAGO", "JENIUS", "MANDIRI", "NEO", "PERMATA", "SEABANK", "SHOPEEPAY"];
        
        for (const b of svgBanks) {
            if (name.includes(b)) return "/banks/" + b + ".svg";
        }
        for (const b of pngBanks) {
            if (name.includes(b)) return "/banks/" + b + ".png";
        }
        return null;
    }

    function getGiftAccounts(gift) {
        if (Array.isArray(gift.accounts) && gift.accounts.length > 0) {
            return gift.accounts.filter((bank) => {
                return bank && ["name", "logoUrl", "number", "owner", "whatsapp"].some((key) => String(bank[key] || "").trim());
            });
        }
        return [gift.bank1, gift.bank2].filter((bank) => {
            return bank && ["name", "logoUrl", "number", "owner", "whatsapp"].some((key) => String(bank[key] || "").trim());
        });
    }

    function hasPhysicalGift(gift) {
        return Boolean(String(gift.physicalAddress || "").trim() || String(gift.receiver || "").trim());
    }

    function calendarUrl(data) {
        if (!data.weddingDate || !data.events.length) return "";
        const firstEvent = data.events[0];
        const lastEvent = data.events[data.events.length - 1] || firstEvent;
        const title = `Pernikahan ${data.coupleName}`;
        const start = toGoogleDate(data.weddingDate, firstEvent.startTime || "09:00");
        const end = toGoogleDate(data.weddingDate, lastEvent.endTime || lastEvent.startTime || firstEvent.endTime || "14:00");
        const location = firstEvent.locationName || firstEvent.address || "";
        const details = `Acara pernikahan ${data.brideName} dan ${data.groomName}. Terima kasih atas doa dan restunya.`;
        if (!start || !end) return "";
        const params = new URLSearchParams({
            action: "TEMPLATE",
            text: title,
            dates: `${start}/${end}`,
            details,
            location,
            ctz: "Asia/Jakarta"
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    function normalizeData(input) {
        const data = deepMerge(DEFAULT_DATA, migrateInput(input));
        data.sections = Object.assign({}, DEFAULT_DATA.sections, data.sections || {});
        data.projectName = slugify(data.projectName || `${data.brideName}-${data.groomName}`);
        data.coupleName = [data.brideName, data.groomName].filter(Boolean).join(" & ") || "Undangan";
        if (data.weddingDate && !data.weddingDateText) {
            data.weddingDateText = formatDateId(data.weddingDate, false);
        }
        data.events = normalizeEvents(data.events);
        data.stories = normalizeStories(data.stories);
        data.calendarUrl = calendarUrl(data);
        data.countdownAt = data.weddingDate ? `${data.weddingDate}T${(data.events[0] && data.events[0].startTime) || "09:00"}:00+07:00` : "";
        
        const physicalWa = data.gift.physicalWhatsapp || data.gift.whatsappNumber;
        data.gift.confirmPackageUrl = physicalWa ? whatsappLink(physicalWa, "Halo saya telah mengirimkan kado fisik") : "";
        return data;
    }

    function replaceNth(html, regex, index, replacer) {
        let count = -1;
        return html.replace(regex, function () {
            const args = arguments;
            count += 1;
            if (count !== index) return arguments[0];
            if (typeof replacer === "function") return replacer.apply(null, args);
            return String(replacer).replace(/\$(\d{1,2})/g, function (match, groupIndex) {
                const fullIndex = Number(groupIndex);
                if (args[fullIndex] !== undefined) return args[fullIndex];
                const firstIndex = Number(groupIndex.charAt(0));
                if (args[firstIndex] !== undefined) return `${args[firstIndex]}${groupIndex.slice(1)}`;
                return match;
            });
        });
    }

    function removeSectionById(html, id) {
        const regex = new RegExp(`\\n?\\s*(?:<!--[^<]*-->\\s*)?<section id="${id}"[\\s\\S]*?<\\/section>`, "");
        return html.replace(regex, "");
    }

    function removeFooter(html) {
        return html.replace(/\n?\s*(?:<!-- Absolute Footer -->\s*)?<footer[\s\S]*?<\/footer>/, "");
    }

    function buildEventCards(events) {
        return events.map((event) => {
            const title = event.title || "Acara";
            const locationBlock = event.locationName || event.address || event.mapsUrl;
            return `
                <div class="event-card-pill bg-dark-blue" data-animate="zoom-in">
                    <div class="card-floral card-floral-tl"></div>
                    <div class="card-floral card-floral-mr"></div>
                    <div class="card-floral card-floral-bl"></div>

                    <h2 class="event-title text-white">${htmlEscape(title)}</h2>
                    ${event.dateText ? `<p class="event-date">${htmlEscape(event.dateText)}</p>` : ""}
                    ${event.timeText ? `<p class="event-time">${htmlEscape(event.timeText)}</p>` : ""}
                    ${locationBlock ? `
                    <div class="event-location-icon mt-4">
                        <i class="fa-solid fa-map-location-dot fa-2x"></i>
                    </div>` : ""}
                    ${event.locationName ? `<p class="event-location-name mt-2">${htmlEscape(event.locationName)}</p>` : ""}
                    ${event.address ? `<p class="event-address">${htmlEscape(event.address)}</p>` : ""}
                    ${event.mapsUrl ? `
                    <a href="${attrEscape(event.mapsUrl)}" target="_blank" class="btn btn-maps mt-4">
                        <i class="fa-solid fa-location-dot"></i> Google Maps
                    </a>` : ""}
                </div>`;
        }).join("\n");
    }

    function buildStoryItems(stories) {
        return stories.map((story, index) => {
            const side = index % 2 === 0 ? "story-left" : "story-right";
            const divider = index < stories.length - 1 ? `<div class="story-divider"><i class="fa-solid fa-heart"></i></div>` : "";
            return `
                <div class="story-item ${side}">
                    ${story.title ? `<h3 class="story-title">${htmlEscape(story.title)}</h3>` : ""}
                    ${story.date ? `<p class="story-date">${htmlEscape(story.date)}</p>` : ""}
                    ${story.text ? `<p class="story-text">${htmlEscape(story.text)}</p>` : ""}
                </div>
                ${divider}`;
        }).join("\n");
    }

    function buildGiftCards(data) {
        const gift = data.gift;
        const bankWa = bank.whatsapp || gift.whatsappNumber;
            const confirmUrl = bankWa ? whatsappLink(bankWa, "Halo, saya telah mengirimkan hadiah pernikahan") : "";
            const confirmGift = confirmUrl ? `
                                <a href="${attrEscape(confirmUrl)}" target="_blank" class="btn-bank btn-wa">
                                    <i class="fa-brands fa-whatsapp"></i> Konfirmasi WhatsApp
                                </a>` : "";
        const confirmPackage = gift.confirmPackageUrl ? `
                            <a href="${attrEscape(gift.confirmPackageUrl)}" target="_blank" class="btn-bank btn-wa px-4 py-2">
                                <i class="fa-brands fa-whatsapp"></i> Konfirmasi WhatsApp
                            </a>` : "";

        const accountCards = getGiftAccounts(gift).map((bank, index) => {
            const rekId = `rek-gift-${index + 1}`;
            return `
                <div class="bank-card${index > 0 ? " mt-4" : ""}">
                    <div class="card-top-row">
                        <h3 class="bank-card-title">Wedding Gift</h3>
                        <div class="bank-logo-container">
                            ${(bank.logoUrl || getBankLogo(bank.name)) ? `<img src="${attrEscape(bank.logoUrl || getBankLogo(bank.name))}" alt="${attrEscape(bank.name || "Bank")}" class="bank-logo">` : `<strong>${htmlEscape(bank.name || "Bank")}</strong>`}
                            <hr class="bank-divider">
                        </div>
                    </div>

                    <div class="card-body-row">
                        <div class="card-left">
                            <i class="fa-solid fa-credit-card card-icon"></i>
                            <div class="card-buttons">
                                ${bank.number ? `
                                <button class="btn-bank btn-copy" onclick="copyRekening('${rekId}')">
                                    <i class="fa-regular fa-copy"></i> Salin NO
                                </button>` : ""}
                                ${confirmGift}
                            </div>
                        </div>

                        <div class="card-right">
                            <div class="bank-details-wrapper">
                                ${bank.number ? `<p class="bank-label">No. Rekening</p><p class="bank-number" id="${rekId}">${htmlEscape(bank.number)}</p>` : ""}
                                ${bank.owner ? `<p class="bank-label mt-2">Atas Nama</p><p class="bank-name">${htmlEscape(bank.owner)}</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join("\n");

        const addressText = `${gift.physicalAddress || ""}${gift.receiver ? ` - Penerima: ${gift.receiver}` : ""}`.trim();
        const addressCard = hasPhysicalGift(gift) ? `
                <div class="bank-card mt-4 address-card text-center" style="align-items: center; padding-top: 30px;">
                    <h3 class="bank-card-title text-center mb-3">Wedding Gift</h3>
                    <i class="fa-solid fa-gift card-icon-address" style="font-size: 5rem; color: #8da4a6; margin: 15px 0;"></i>

                    <div class="address-details mt-3 mb-4 text-dark" style="color: var(--text-dark);">
                        ${gift.physicalAddress ? `<p class="mb-1" style="font-family: 'Quicksand', 'Inter', sans-serif; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px;">Alamat : ${htmlEscape(gift.physicalAddress)}</p>` : ""}
                        ${gift.receiver ? `<p class="mb-0" style="font-family: 'Quicksand', 'Inter', sans-serif; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px;">Penerima: ${htmlEscape(gift.receiver)}</p>` : ""}
                    </div>

                    <div class="address-buttons d-flex flex-column align-items-center w-100">
                        <button class="btn-bank btn-copy mb-2 px-4 py-2" onclick="copyRekening('alamat-kado')">
                            <i class="fa-regular fa-copy"></i> Salin Alamat
                        </button>
                        ${confirmPackage}
                    </div>
                    <div id="alamat-kado" style="display:none;">${htmlEscape(addressText)}</div>
                </div>` : "";

        return `${accountCards}${addressCard}`;
    }

    function replaceEventsSection(html, events) {
        return html.replace(/(<div class="events-content">\s*)[\s\S]*?(\s*<\/div>\s*<div class="floral-bottom-profiles"><\/div>\s*<\/section>)/, function (match, start, end) {
            return `${start}${buildEventCards(events)}${end}`;
        });
    }

    function replaceStoriesSection(html, stories) {
        return html.replace(/(<div class="story-frame"[^>]*>\s*)[\s\S]*?(\s*<\/div>\s*<\/section>)/, function (match, start, end) {
            return `${start}${buildStoryItems(stories)}${end}`;
        });
    }

    function replaceGiftSection(html, data) {
        return html.replace(/(<div class="gift-container"[^>]*>\s*)[\s\S]*?(\s*<\/div>\s*<\/section>)/, function (match, start, end) {
            return `${start}${buildGiftCards(data)}${end}`;
        });
    }

    function injectGuestQueryScript(html) {
        const script = `
    <script>
    document.addEventListener('DOMContentLoaded', function () {
        var params = new URLSearchParams(window.location.search);
        var recipient = params.get('to') || params.get('tamu') || params.get('guest');
        if (!recipient) return;
        recipient = recipient.replace(/\\+/g, ' ').trim();
        var guestName = document.querySelector('.guest-name');
        var guestInput = document.getElementById('guestbook-name-input');
        if (guestName) guestName.textContent = recipient;
        if (guestInput) guestInput.value = recipient;
    });
    <\/script>`;
        return html.replace("</body>", `${script}\n</body>`);
    }

    function buildHtml(templateHtml, rawData) {
        const data = normalizeData(rawData);
        let html = templateHtml;

        html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>Undangan Pernikahan ${htmlEscape(data.coupleName)} | ${htmlEscape(data.brandName)}</title>`);
        html = html.replace(/(<meta name="description" content="[^"]*">)/, `$1`);

        // Fix: move btn-audio OUTSIDE #main-content so it's not hidden by body.locked CSS
        // Remove btn-audio from wherever it is inside #main-content
        html = html.replace(/<button id="btn-audio" class="btn-audio">\s*<i class="fa-solid fa-volume-xmark"><\/i>\s*<\/button>/g, '');
        // Re-insert it right before <main id="main-content">
        html = html.replace('<main id="main-content">', `<!-- Floating Audio Button -->\n    <button id="btn-audio" class="btn-audio">\n        <i class="fa-solid fa-volume-xmark"></i>\n    </button>\n\n    <main id="main-content">`);
        html = html.replace(/(<span class="cover-slide-in-left">)[\s\S]*?(<\/span>)/, `$1${htmlEscape((data.brideName || "").charAt(0).toUpperCase())}$2`);
        html = html.replace(/(<span class="cover-slide-in-right">)[\s\S]*?(<\/span>)/, `$1${htmlEscape((data.groomName || "").charAt(0).toUpperCase())}$2`);
        html = html.replace(/(<h2 class="title-names-cursive">)[\s\S]*?(<\/h2>)/, `$1${htmlEscape(data.coupleName)}$2`);
        html = html.replace(/(<h3 class="guest-name text-serif">)[\s\S]*?(<\/h3>)/, `$1${htmlEscape(data.guestName)}$2`);
        html = html.replace(/(<h1 class="title-names text-sage mb-3 mt-4"[^>]*>)[\s\S]*?(<\/h1>)/, `$1${htmlEscape(data.coupleName)}$2`);
        if (data.weddingDateText) {
            html = html.replace(/(<p class="date-highlight mb-4"[^>]*>)[\s\S]*?(<\/p>)/, `$1${htmlEscape(data.weddingDateText)}$2`);
        } else {
            html = html.replace(/\s*<p class="date-highlight mb-4"[^>]*>[\s\S]*?<\/p>/, "");
        }

        if (data.calendarUrl && data.events.length) {
            html = html.replace(/(<a href=")[^"]*(" target="_blank" class="btn-secondary mt-4")/, `$1${attrEscape(data.calendarUrl)}$2`);
        } else {
            html = html.replace(/\s*<a href="[^"]*" target="_blank" class="btn-secondary mt-4"[\s\S]*?<\/a>/, "");
        }

        html = html.replace(/<img src="assets\/images\/bride\.png" alt="[^"]*">/, `<img src="assets/images/bride.png" alt="${attrEscape(data.brideName)}">`);
        html = html.replace(/<img src="assets\/images\/groom\.png" alt="[^"]*">/, `<img src="assets/images/groom.png" alt="${attrEscape(data.groomName)}">`);
        html = replaceNth(html, /(<h2 class="title-names mt-3"[^>]*>)[\s\S]*?(<\/h2>)/g, 0, `$1${htmlEscape(data.brideName)}$2`);
        html = replaceNth(html, /(<h2 class="title-names mt-3"[^>]*>)[\s\S]*?(<\/h2>)/g, 1, `$1${htmlEscape(data.groomName)}$2`);
        html = replaceNth(html, /(<p class="parents"[^>]*>)[\s\S]*?(<\/p>)/g, 0, data.brideParents ? `$1${linesToHtml(data.brideParents)}$2` : "");
        html = replaceNth(html, /(<p class="parents"[^>]*>)[\s\S]*?(<\/p>)/g, 1, data.groomParents ? `$1${linesToHtml(data.groomParents)}$2` : "");
        html = replaceNth(html, /(<a href=")[^"]*(" target="_blank" class="social-link"[^>]*>)[\s\S]*?(<\/a>)/g, 0, data.brideInstagram ? `$1${attrEscape(instagramUrl(data.brideInstagram))}$2<i class="fa-brands fa-instagram"></i> ${htmlEscape(instagramLabel(data.brideInstagram))}$3` : "");
        html = replaceNth(html, /(<a href=")[^"]*(" target="_blank" class="social-link"[^>]*>)[\s\S]*?(<\/a>)/g, 1, data.groomInstagram ? `$1${attrEscape(instagramUrl(data.groomInstagram))}$2<i class="fa-brands fa-instagram"></i> ${htmlEscape(instagramLabel(data.groomInstagram))}$3` : "");

        if (data.sections.events && data.events.length) {
            html = replaceEventsSection(html, data.events);
        } else {
            html = removeSectionById(html, "events");
        }

        if (data.sections.loveStory && data.stories.length) {
            html = replaceStoriesSection(html, data.stories);
        } else {
            html = removeSectionById(html, "lovestory");
        }

        if (data.sections.gift && (getGiftAccounts(data.gift).length || hasPhysicalGift(data.gift))) {
            html = replaceGiftSection(html, data);
        } else {
            html = removeSectionById(html, "gift");
        }

        html = html.replace(/(<p class="comments-count[\s\S]*?>)[\s\S]*?(<\/p>)/, `$1
                        <i class="fa-solid fa-comments"></i> 0 Ucapan
                    $2`);
        html = html.replace(/(<h1 id="closing-couple-names" class="title-names mt-4"[^>]*>)[\s\S]*?(<\/h1>)/, `$1${htmlEscape(data.coupleName)}$2`);
        html = html.replace(/(<footer[\s\S]*?<h3>)[\s\S]*?(<\/h3>)/, `$1${htmlEscape((data.brandName || "").toUpperCase())}$2`);
        html = html.replace(/(<p class="made-with mt-4">)Made with <i class="fa-solid fa-heart text-red"><\/i> by [\s\S]*?(<\/p>)/, `$1Made with <i class="fa-solid fa-heart text-red"></i> by ${htmlEscape(data.brandName)}$2`);
        html = replaceNth(html, /(<div class="social-icons mt-3">\s*<a href=")[^"]*(">)/, 0, `$1${attrEscape(data.footerInstagramUrl || "#")}$2`);
        html = replaceNth(html, /(<div class="social-icons mt-3">[\s\S]*?<a href="[^"]*">[\s\S]*?<\/a>\s*<a href=")[^"]*(">)/, 0, `$1${attrEscape(data.footerWhatsappUrl || "#")}$2`);

        
        const rawQuote = data.quoteText || "?????? ????????? ???? ?????? ?????? ????? ???????????? ?????????? ??????????????? ????????? ?????????????????? ?????????? ???????????\n\n\"Dan Di Antara Tanda-Tanda (Kebesaran)-Nya Ialah Dia Menciptakan Pasangan-Pasangan Untukmu Dari Jenismu Sendiri, Agar Kamu Cenderung Dan Merasa Tenteram Kepadanya, Dan Dia Menjadikan Di Antaramu Rasa Kasih Sayang. Sungguh, Pada Yang Demikian Itu Benar-Benar Terdapat Tanda-Tanda (Kebesaran Allah) Bagi Kaum Yang Berpikir.\"";
        
        let quoteHtml = rawQuote.split("\n").map(line => {
            if (!line.trim()) return "";
            if (/[\u0600-\u06FF]/.test(line)) {
                return `<p class="arabic-text mt-3" dir="rtl">${htmlEscape(line.trim())}</p>`;
            } else {
                return `<p class="translation mt-3">${htmlEscape(line.trim())}</p>`;
            }
        }).join("");
        
        // Remove old h3, arabic, and translation and replace with quoteHtml
        html = html.replace(/(<div class="quote-text text-white mt-4">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/, `$1${quoteHtml}$2`);

        if (!data.sections.profiles) html = removeSectionById(html, "profiles");
        if (!data.sections.quote) html = removeSectionById(html, "quote");
        if (!data.sections.guestbook) html = removeSectionById(html, "guestbook");
        if (!data.sections.closing) html = removeSectionById(html, "closing");
        if (!data.sections.footer) html = removeFooter(html);

        // Bust browser cache for script.js by adding a timestamp
        html = html.replace(/assets\/js\/script\.js\?v=\d+/, `assets/js/script.js?v=${Date.now()}`);

        return injectGuestQueryScript(html);
    }

    function buildScript(templateScript, rawData) {
        const data = normalizeData(rawData);
        let script = templateScript;
        const targetDate = data.countdownAt || "1970-01-01T00:00:00+07:00";
        // Support both 'const' (old) and 'var' (new) declarations
        script = script.replace(/(?:const|var) AUDIO_URL = '[^']*';/, `var AUDIO_URL = '${attrEscape(data.audioUrl || "")}';`);
        script = script.replace(/(?:const|var) AUDIO_START = \d+;/, `var AUDIO_START = ${data.audioTimestamp || 0};`);
        // Support both countdown patterns
        script = script.replace(/const targetDate = new Date\('[^']*'\)\.getTime\(\);/, `const targetDate = new Date(${JSON.stringify(targetDate)}).getTime();`);
        script = script.replace(/var targetDate = new Date\('[^']*'\)\.getTime\(\);/, `var targetDate = new Date(${JSON.stringify(targetDate)}).getTime();`);
        return script;
    }

    return {
        DEFAULT_DATA,
        IMAGE_FILES,
        buildHtml,
        buildScript,
        normalizeData,
        slugify
    };
}));
