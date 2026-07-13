(function () {
    function getSource(templateName) {
        const base = `../template/${templateName}`;
        return {
            html: `${base}/index.html`,
            css: `${base}/assets/css/style.css`,
            js: `${base}/assets/js/script.js`,
            images: {
                brideImage: `${base}/assets/images/bride.png`,
                groomImage: `${base}/assets/images/groom.png`,
                coupleImage: `${base}/assets/images/couple.png`,
                logoImage: `${base}/assets/images/logo.png`,
                backgroundImage: `${base}/assets/images/backgroundbunga.png`,
                floralImage: `${base}/assets/images/floral1.png`
            }
        };
    }

    const form = document.getElementById("generator-form");
    const summaryList = document.getElementById("summary-list");
    const jsonOutput = document.getElementById("json-output");
    const statusPanel = document.getElementById("status-panel");
    const importInput = document.getElementById("json-import-input");
    const eventsEditor = document.getElementById("events-editor");
    const storiesEditor = document.getElementById("stories-editor");

    function setStatus(message, type) {
        statusPanel.className = `status-panel ${type || ""}`.trim();
        statusPanel.textContent = message;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function setByPath(target, path, value) {
        const parts = path.split(".");
        let cursor = target;
        parts.forEach((part, index) => {
            const key = /^\d+$/.test(part) ? Number(part) : part;
            if (index === parts.length - 1) {
                cursor[key] = value;
                return;
            }
            if (cursor[key] === undefined) {
                cursor[key] = /^\d+$/.test(parts[index + 1]) ? [] : {};
            }
            cursor = cursor[key];
        });
    }

    function getByPath(target, path) {
        return path.split(".").reduce((cursor, part) => {
            if (cursor === undefined || cursor === null) return "";
            return cursor[/^\d+$/.test(part) ? Number(part) : part];
        }, target);
    }

    function eventTemplate(event, index) {
        return `
            <article class="repeat-card event-editor-card">
                <div class="repeat-header">
                    <h3>Acara ${index + 1}</h3>
                    <button type="button" class="danger-button" data-action="remove-event" title="Hapus acara">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="grid three">
                    <label>
                        Judul acara
                        <input data-event-field="title" type="text" value="${escapeHtml(event.title)}">
                    </label>
                    <label>
                        Mulai
                        <input data-event-field="startTime" type="time" value="${escapeHtml(event.startTime)}">
                    </label>
                    <label>
                        Selesai
                        <input data-event-field="endTime" type="time" value="${escapeHtml(event.endTime)}">
                    </label>
                </div>
                <div class="grid two">
                    <label>
                        Tanggal tampil
                        <input data-event-field="dateText" type="text" value="${escapeHtml(event.dateText)}">
                    </label>
                    <label>
                        Nama lokasi
                        <input data-event-field="locationName" type="text" value="${escapeHtml(event.locationName)}">
                    </label>
                </div>
                <div class="grid two">
                    <label>
                        Link Google Maps
                        <input data-event-field="mapsUrl" type="url" value="${escapeHtml(event.mapsUrl)}">
                    </label>
                    <label>
                        Alamat
                        <textarea data-event-field="address" rows="3">${escapeHtml(event.address)}</textarea>
                    </label>
                </div>
            </article>`;
    }

    function storyTemplate(story, index) {
        return `
            <article class="repeat-card story-editor-card">
                <div class="repeat-header">
                    <h3>Cerita ${index + 1}</h3>
                    <button type="button" class="danger-button" data-action="remove-story" title="Hapus cerita">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="grid two">
                    <label>
                        Judul
                        <input data-story-field="title" type="text" value="${escapeHtml(story.title)}">
                    </label>
                    <label>
                        Tanggal
                        <input data-story-field="date" type="text" value="${escapeHtml(story.date)}">
                    </label>
                </div>
                <label>
                    Cerita
                    <textarea data-story-field="text" rows="3">${escapeHtml(story.text)}</textarea>
                </label>
            </article>`;
    }

    function renderEvents(events) {
        eventsEditor.innerHTML = events.map(eventTemplate).join("");
    }

    function renderStories(stories) {
        storiesEditor.innerHTML = stories.map(storyTemplate).join("");
    }

    function collectRepeatItems(container, cardSelector, fieldSelector, defaults) {
        return Array.from(container.querySelectorAll(cardSelector)).map((card) => {
            const item = Object.assign({}, defaults);
            card.querySelectorAll(fieldSelector).forEach((field) => {
                const key = field.dataset.eventField || field.dataset.storyField;
                item[key] = field.value.trim();
            });
            return item;
        });
    }

    function collectEvents() {
        return collectRepeatItems(eventsEditor, ".event-editor-card", "[data-event-field]", {
            title: "",
            dateText: "",
            startTime: "",
            endTime: "",
            locationName: "",
            address: "",
            mapsUrl: ""
        });
    }

    function collectStories() {
        return collectRepeatItems(storiesEditor, ".story-editor-card", "[data-story-field]", {
            title: "",
            date: "",
            text: ""
        });
    }

    function collectData() {
        const data = {};
        Array.from(form.elements).forEach((element) => {
            if (!element.name || element.type === "file") return;
            const value = element.type === "checkbox" ? element.checked : element.value.trim();
            setByPath(data, element.name, value);
        });
        data.events = collectEvents();
        data.stories = collectStories();
        return InvitationTemplateEngine.normalizeData(data);
    }

    function populateForm(rawData) {
        const data = InvitationTemplateEngine.normalizeData(rawData);
        Array.from(form.elements).forEach((element) => {
            if (!element.name || element.type === "file") return;
            const value = getByPath(data, element.name);
            if (element.type === "checkbox") {
                element.checked = Boolean(value);
            } else {
                element.value = value ?? "";
            }
        });
        renderEvents(data.events);
        renderStories(data.stories);
        refreshPanels();
    }

    function refreshPanels() {
        const data = collectData();
        const activeSections = Object.entries(data.sections)
            .filter((entry) => entry[1])
            .map((entry) => entry[0])
            .length;
        const rows = [
            ["Folder", data.projectName],
            ["Pasangan", data.coupleName],
            ["Tanggal", data.weddingDateText || "-"],
            ["Acara", data.sections.events ? `${data.events.length} acara` : "Tidak ditampilkan"],
            ["Love Story", data.sections.loveStory ? `${data.stories.length} cerita` : "Tidak ditampilkan"],
            ["Halaman", `${activeSections} aktif`],
            ["Brand", data.brandName || "-"]
        ];

        summaryList.innerHTML = rows.map(([label, value]) => `
            <div class="summary-row">
                <dt>${label}</dt>
                <dd>${value || "-"}</dd>
            </div>
        `).join("");
        jsonOutput.value = JSON.stringify(data, null, 2);
    }

    async function fetchText(path) {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Gagal membaca ${path}`);
        }
        return response.text();
    }

    async function fetchBlob(path) {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Gagal membaca ${path}`);
        }
        return response.blob();
    }

    function selectedImageBlob(key, templateName) {
        const input = document.getElementById(`image-${key}`);
        if (input && input.files && input.files[0]) {
            return Promise.resolve(input.files[0]);
        }
        const src = getSource(templateName || "template-floral1");
        return fetchBlob(src.images[key]);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    async function generateZip() {
        if (!window.JSZip) {
            throw new Error("Library ZIP belum termuat. Cek koneksi internet lalu muat ulang halaman generator.");
        }

        const data = collectData();
        const src = getSource(data.templateName || "template-floral1");
        const [templateHtml, templateCss, templateScript] = await Promise.all([
            fetchText(src.html),
            fetchText(src.css),
            fetchText(src.js)
        ]);

        const folderName = data.projectName;
        const zip = new JSZip();
        zip.file(`${folderName}/index.html`, InvitationTemplateEngine.buildHtml(templateHtml, data));
        zip.file(`${folderName}/assets/css/style.css`, templateCss);
        zip.file(`${folderName}/assets/js/script.js`, InvitationTemplateEngine.buildScript(templateScript, data));
        zip.file(`${folderName}/DATA.json`, JSON.stringify(data, null, 2));
        zip.file(`${folderName}/README.txt`, [
            `Undangan ${data.coupleName}`,
            "",
            "Upload seluruh isi folder ini ke hosting.",
            "Nama tamu bisa dibuat personal lewat query URL:",
            `index.html?to=Nama%20Tamu`
        ].join("\n"));

        const imageTasks = Object.entries(InvitationTemplateEngine.IMAGE_FILES).map(async ([key, filename]) => {
            zip.file(`${folderName}/assets/images/${filename}`, await selectedImageBlob(key, data.templateName));
        });
        await Promise.all(imageTasks);

        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${folderName}.zip`);
    }

    function saveJson() {
        const data = collectData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${data.projectName}-data.json`);
    }

    async function importJson(file) {
        const text = await file.text();
        populateForm(JSON.parse(text));
        setStatus("Data JSON berhasil dimuat.", "success");
    }

    function addEvent() {
        const events = collectEvents();
        events.push({
            title: "Acara Baru",
            dateText: "",
            startTime: "",
            endTime: "",
            locationName: "",
            address: "",
            mapsUrl: ""
        });
        renderEvents(events);
        refreshPanels();
    }

    function addStory() {
        const stories = collectStories();
        stories.push({ title: "", date: "", text: "" });
        renderStories(stories);
        refreshPanels();
    }

    document.getElementById("btn-generate").addEventListener("click", async () => {
        try {
            setStatus("Membuat ZIP undangan...", "");
            await generateZip();
            setStatus("ZIP undangan selesai dibuat.", "success");
        } catch (error) {
            setStatus(`${error.message}. Buka generator lewat server lokal, bukan langsung dari file, supaya template bisa dibaca.`, "error");
        }
    });

    document.getElementById("btn-download-json").addEventListener("click", saveJson);

    document.getElementById("btn-import-json").addEventListener("click", () => {
        importInput.click();
    });

    document.getElementById("btn-add-event").addEventListener("click", addEvent);
    document.getElementById("btn-add-story").addEventListener("click", addStory);

    eventsEditor.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-action='remove-event']");
        if (!removeButton) return;
        removeButton.closest(".event-editor-card").remove();
        refreshPanels();
    });

    storiesEditor.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-action='remove-story']");
        if (!removeButton) return;
        removeButton.closest(".story-editor-card").remove();
        refreshPanels();
    });

    importInput.addEventListener("change", async () => {
        if (!importInput.files[0]) return;
        try {
            await importJson(importInput.files[0]);
        } catch (error) {
            setStatus(`JSON tidak valid: ${error.message}`, "error");
        } finally {
            importInput.value = "";
        }
    });

    document.getElementById("btn-copy-json").addEventListener("click", async () => {
        await navigator.clipboard.writeText(jsonOutput.value);
        setStatus("Data JSON disalin.", "success");
    });

    form.addEventListener("input", refreshPanels);

    populateForm(InvitationTemplateEngine.DEFAULT_DATA);
    setStatus("Generator siap dipakai.", "");
}());
