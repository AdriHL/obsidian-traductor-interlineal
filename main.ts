import { App, Plugin, PluginSettingTab, Setting, requestUrl, Notice, debounce, Modal, SuggestModal, TFile } from 'obsidian';
import { Extension, StateField, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";

// --- LANGUAGE LIST (ISO 639-1) ---
const LANGUAGES: Record<string, string> = {
    'es': 'Spanish', 'en': 'English', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
    'zh': 'Chinese (Simplified)', 'ko': 'Korean', 'ar': 'Arabic',
    'hi': 'Hindi', 'tr': 'Turkish', 'nl': 'Dutch', 'pl': 'Polish',
    'sv': 'Swedish', 'uk': 'Ukrainian', 'ca': 'Catalan', 'eu': 'Basque',
    'gl': 'Galician'
};

type TranslationProvider = 'google_free' | 'google_api' | 'local_ollama';

interface InterlinearSettings {
    provider: TranslationProvider;
    targetLang: string;
    apiKey: string;
    ollamaModel: string;
    secondaryColor: string;
    secondarySize: string;
    isActive: boolean;
    savedTranslations: Record<string, string>;
    monthlyCharacterLimit: number;
    alertThresholdPercent: number;
    currentMonthChars: number;
    lastResetMonth: string;
    dontAskConfirmClear: boolean;
}

const DEFAULT_SETTINGS: InterlinearSettings = {
    provider: 'google_free',
    targetLang: 'es',
    apiKey: '',
    ollamaModel: 'qwen2.5:0.5b',
    secondaryColor: '#2ea44f',
    secondarySize: '14px',
    isActive: true,
    savedTranslations: {},
    monthlyCharacterLimit: 500000,
    alertThresholdPercent: 80.00,
    currentMonthChars: 0,
    lastResetMonth: new Date().toISOString().slice(0, 7),
    dontAskConfirmClear: false
}

export default class InterlinearPlugin extends Plugin {
    settings: InterlinearSettings;
    translationCache: Map<string, string> = new Map();
    requestQueue: { text: string, lang: string }[] = []; 
    isProcessingQueue: boolean = false;
    ribbonIconEl: HTMLElement | null = null;
    statusBarItemEl: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.translationCache = new Map(Object.entries(this.settings.savedTranslations || {}));
        this.checkMonthlyReset();

        // --- COMANDOS RÁPIDOS ---
        this.addCommand({
            id: 'toggle-translator-current-file',
            name: 'Activar/Desactivar traductor SOLO en esta nota',
            callback: () => this.toggleTranslationForActiveFile()
        });

        this.addCommand({
            id: 'set-language-current-file',
            name: 'Cambiar idioma de traducción para esta nota...',
            callback: () => this.openLanguageModalForActiveFile()
        });

        this.addCommand({
            id: 'toggle-translator',
            name: 'Toggle Translator On/Off (Global)',
            hotkeys: [{ modifiers: ["Alt", "Shift"], key: "t" }], 
            callback: () => this.togglePluginStatus()
        });

        // --- BARRA DE ESTADO CLICABLE ---
        this.statusBarItemEl = this.addStatusBarItem();
        this.statusBarItemEl.addClass("mod-clickable");
        this.statusBarItemEl.addEventListener("click", () => this.openLanguageModalForActiveFile());
        this.updateStatusBar();

        // --- ICONO LATERAL ---
        this.ribbonIconEl = this.addRibbonIcon('languages', 'Interlinear Translator', () => this.togglePluginStatus());
        this.updateRibbonIcon();

        // --- MENÚ DE LOS 3 PUNTITOS Y EXPLORADOR ---
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFile && file.extension === "md") {
                    menu.addSeparator();
                    menu.addItem((item) => {
                        item.setTitle("🌐 Traductor: Cambiar idioma")
                            .setIcon("languages")
                            .onClick(() => {
                                new LanguageSuggestModal(this.app, this, file).open();
                            });
                    });
                    menu.addItem((item) => {
                        item.setTitle("⚡ Traductor: Activar/Desactivar")
                            .setIcon("power")
                            .onClick(async () => {
                                await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                                    if (frontmatter.hasOwnProperty('translate')) {
                                        frontmatter['translate'] = !frontmatter['translate'];
                                    } else {
                                        frontmatter['translate'] = !this.settings.isActive; 
                                    }
                                    new Notice(frontmatter['translate'] ? "🟢 Traductor ACTIVADO para esta nota" : "🔴 Traductor DESACTIVADO para esta nota");
                                });
                                this.app.workspace.updateOptions();
                            });
                    });
                }
            })
        );

        // --- MENÚ DE CLIC DERECHO EN EL TEXTO ---
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                menu.addSeparator();
                menu.addItem((item) => {
                    item.setTitle("🌐 Traductor: Cambiar idioma de esta nota")
                        .setIcon("languages")
                        .onClick(() => {
                            this.openLanguageModalForActiveFile();
                        });
                });
            })
        );

        // --- CARGA FINAL ---
        this.registerEditorExtension(this.liveTranslationExtension());
        this.addSettingTab(new InterlinearSettingTab(this.app, this));
    }

    // --- RASTREADOR DE PROPIEDADES (FRONTMATTER) ---
    getFileSettings(): { isActive: boolean, targetLang: string } {
        let localIsActive = this.settings.isActive;
        let localTargetLang = this.settings.targetLang;

        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            const cache = this.app.metadataCache.getFileCache(activeFile);
            const frontmatter = cache?.frontmatter;

            if (frontmatter) {
                if (frontmatter.hasOwnProperty('translate')) {
                    localIsActive = frontmatter['translate'] === true; 
                }
                if (frontmatter.hasOwnProperty('target_lang')) {
                    localTargetLang = frontmatter['target_lang'];
                }
            }
        }
        return { isActive: localIsActive, targetLang: localTargetLang };
    }

    async toggleTranslationForActiveFile() {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice("⚠️ No se ha encontrado ninguna nota activa.");
            return;
        }

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            if (frontmatter.hasOwnProperty('translate')) {
                frontmatter['translate'] = !frontmatter['translate'];
            } else {
                frontmatter['translate'] = !this.settings.isActive; 
            }
            new Notice(frontmatter['translate'] ? "🟢 Traductor ACTIVADO para esta nota" : "🔴 Traductor DESACTIVADO para esta nota");
        });
        this.app.workspace.updateOptions();
    }

    openLanguageModalForActiveFile() {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice("⚠️ No se ha encontrado ninguna nota activa.");
            return;
        }
        new LanguageSuggestModal(this.app, this, file).open();
    }

    checkMonthlyReset() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (this.settings.lastResetMonth !== currentMonth) {
            this.settings.currentMonthChars = 0;
            this.settings.lastResetMonth = currentMonth;
            this.saveSettings();
            new Notice("📅 New Month: API Usage Counter Reset.");
        }
    }

    async togglePluginStatus() {
        this.settings.isActive = !this.settings.isActive;
        await this.saveSettings();
        this.updateRibbonIcon();
        this.updateStatusBar();
        new Notice(this.settings.isActive ? `Translator: ON (${this.getProviderName()})` : "Translator: OFF");
        this.app.workspace.updateOptions();
    }

    getProviderName(): string {
        switch(this.settings.provider) {
            case 'google_free': return "Free";
            case 'google_api': return "PRO";
            case 'local_ollama': return "Local";
        }
    }

    updateStatusBar() {
        if (!this.statusBarItemEl) return;
        
        const { isActive, targetLang } = this.getFileSettings();

        if (!isActive) {
            this.statusBarItemEl.setText("🔕 Traductor: Apagado");
            this.statusBarItemEl.style.color = "";
        } else {
            const mode = this.settings.provider;
            let icon = "🟢";
            let color = "#66ff66";
            
            if (mode === 'google_api') { icon = "⚡"; color = "#ffcc00"; }
            if (mode === 'local_ollama') { icon = "🔒"; color = "#00ffff"; }

            this.statusBarItemEl.setText(`${icon} a ${LANGUAGES[targetLang] || targetLang}`);
            this.statusBarItemEl.style.color = color;
        }
    }

    updateRibbonIcon() {
        if (!this.ribbonIconEl) return;
        this.settings.isActive ? this.ribbonIconEl.style.opacity = "1" : this.ribbonIconEl.style.opacity = "0.4";
    }

    saveCacheToDisk = debounce(async () => {
        this.settings.savedTranslations = Object.fromEntries(this.translationCache);
        await this.saveData(this.settings);
    }, 5000, true);

    liveTranslationExtension(): Extension {
        return StateField.define<DecorationSet>({
            create: () => Decoration.none,
            update: (decorations, transaction) => {
                const { isActive, targetLang } = this.getFileSettings();
                this.updateStatusBar();

                if (!isActive) return Decoration.none;
                return this.getDecorations(transaction.state.doc, targetLang);
            },
            provide: field => EditorView.decorations.from(field)
        });
    }

    getDecorations(doc: any, currentLang: string): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const text = line.text.trim();
            if (text.length < 3 || text.startsWith("```") || text.startsWith("$$")) continue;

            const cacheKey = `${text}_${currentLang}_${this.settings.provider}`;
            let translatedText = "..."; 
            let isWaiting = true;

            if (this.translationCache.has(cacheKey)) {
                translatedText = this.translationCache.get(cacheKey) || "";
                isWaiting = false;
            } else {
                this.addToQueue(text, currentLang);
            }

            builder.add(line.to, line.to, Decoration.widget({
                widget: new TranslationWidget(translatedText, this.settings, isWaiting),
                side: 1, block: true 
            }));
        }
        return builder.finish();
    }

    addToQueue(text: string, lang: string) {
        if (!this.requestQueue.find(item => item.text === text && item.lang === lang)) {
            this.requestQueue.push({ text, lang });
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue[0];
            const textToTranslate = request.text;
            const targetLang = request.lang; 
            const cacheKey = `${textToTranslate}_${targetLang}_${this.settings.provider}`;
            
            let delay = 800; 
            if (this.settings.provider === 'google_api') delay = 200; 
            if (this.settings.provider === 'local_ollama') delay = 300; 

            await sleep(delay); 

            if (!this.translationCache.has(cacheKey)) {
                try {
                    let result = "";
                    if (this.settings.provider === 'local_ollama') {
                        result = await this.translateLocal(textToTranslate, targetLang);
                    } else if (this.settings.provider === 'google_api') {
                        result = await this.translateGooglePro(textToTranslate, targetLang);
                    } else {
                        result = await this.translateGoogleFree(textToTranslate, targetLang);
                    }
                    
                    const esError = result.startsWith("⚠️") || result.includes("Error") || result.includes("Key");
                    
                    if (!esError) {
                        this.translationCache.set(cacheKey, result);
                        this.saveCacheToDisk(); 
                    }
                    try { this.app.workspace.updateOptions(); } catch(e){}
                } catch (error) { await sleep(2000); }
            }
            this.requestQueue.shift();
        }
        this.isProcessingQueue = false;
    }

    async translateGoogleFree(text: string, targetLang: string): Promise<string> {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await requestUrl({ url: url });
            
            const translationParts = response.json?.[0];
            if (!translationParts || !Array.isArray(translationParts)) return "Error de formato Google";

            let fullTranslation = "";
            for (let i = 0; i < translationParts.length; i++) {
                const part = translationParts[i];
                if (Array.isArray(part) && typeof part[0] === 'string') {
                    fullTranslation += part[0];
                }
            }
            
            return fullTranslation.trim() || "Error al unir frases";
        } catch (error) {
            console.error("Traductor - Error en Google Free:", error);
            return "⚠️ Error de conexión Free";
        }
    }

    async translateGooglePro(text: string, targetLang: string): Promise<string> {
        if (!this.settings.apiKey) return "⚠️ Missing API Key";

        const limit = this.settings.monthlyCharacterLimit;
        const current = this.settings.currentMonthChars;
        const threshold = (this.settings.alertThresholdPercent / 100) * limit;

        if (current < threshold && (current + text.length) >= threshold) {
            new Notice(`⚠️ USAGE ALERT: You have crossed ${this.settings.alertThresholdPercent}% of your monthly quota.`);
        }

        const url = `https://translation.googleapis.com/language/translate/v2?key=${this.settings.apiKey}`;
        const response = await requestUrl({ 
            url: url, method: 'POST',
            body: JSON.stringify({ q: text, target: targetLang, format: 'text' })
        });
        
        const translated = response.json?.data?.translations?.[0]?.translatedText;

        if (translated) {
            this.settings.currentMonthChars += text.length;
            this.updateStatusBar(); 
            await this.saveData(this.settings);
        }

        return translated || "Error API";
    }

    async translateLocal(text: string, targetLang: string): Promise<string> {
        const fullLangName = LANGUAGES[targetLang] || targetLang;
        const systemPrompt = `Translate to ${fullLangName}. Output ONLY translation.`;
        try {
            const response = await requestUrl({
                url: 'http://localhost:11434/api/generate',
                method: 'POST',
                body: JSON.stringify({
                    model: this.settings.ollamaModel,
                    system: systemPrompt,
                    prompt: text,
                    stream: false,
                    options: { temperature: 0.1 }
                })
            });
            return response.json?.response?.trim() || "Error Local";
        } catch (e) { return "⚠️ Open Ollama App"; }
    }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() { await this.saveData(this.settings); this.app.workspace.updateOptions(); this.updateRibbonIcon(); this.updateStatusBar(); }
}

// --- WIDGET ---
class TranslationWidget extends WidgetType {
    constructor(private text: string, private settings: InterlinearSettings, private isWaiting: boolean) { super(); }
    toDOM(view: EditorView): HTMLElement {
        const div = document.createElement("div");
        div.className = "interlinear-widget";
        const esError = this.text.startsWith("⚠️");

        if (this.isWaiting && !this.text) {
            div.innerText = "⏳"; div.style.opacity = "0.5";
        } else {
            const txt = new DOMParser().parseFromString(this.text, "text/html").documentElement.textContent;
            div.innerText = txt || "";
            if (esError) {
                div.style.color = "#ff4444"; 
                div.style.fontSize = "12px";
            } else {
                div.style.color = this.settings.secondaryColor;
                div.style.fontSize = this.settings.secondarySize;
            }
        }
        return div;
    }
}

// --- MODAL DE CONFIRMACIÓN ---
class ConfirmModal extends Modal {
    plugin: InterlinearPlugin;
    onSubmit: (result: boolean, dontAsk: boolean) => void;

    constructor(app: App, plugin: InterlinearPlugin, onSubmit: (result: boolean, dontAsk: boolean) => void) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "⚠️ Clear Database?" });
        contentEl.createEl("p", { text: "This will delete all saved translations. This action cannot be undone." });

        const div = contentEl.createDiv();
        const checkbox = div.createEl("input", { type: "checkbox" });
        div.createEl("span", { text: " Don't ask again (Always confirm)" });
        div.style.marginBottom = "20px";

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.justifyContent = "flex-end";

        const btnCancel = buttonContainer.createEl("button", { text: "Cancel" });
        btnCancel.onClickEvent(() => { this.close(); });

        const btnConfirm = buttonContainer.createEl("button", { text: "Yes, Delete" });
        btnConfirm.classList.add("mod-warning");
        btnConfirm.onClickEvent(() => {
            this.onSubmit(true, checkbox.checked);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// --- CONFIGURACIÓN UI ---
class InterlinearSettingTab extends PluginSettingTab {
    plugin: InterlinearPlugin;
    constructor(app: App, plugin: InterlinearPlugin) { super(app, plugin); this.plugin = plugin; }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        
        containerEl.createEl('h2', {text: '🌍 Interlinear Translator Settings'});

        new Setting(containerEl)
        .setName('🗑️ Clear Database')
        .setDesc('Deletes all saved translations to free up space or fix errors.')
        .addButton(button => button
            .setButtonText('Clear Memory')
            .setWarning()
            .onClick(async () => {
                if (this.plugin.settings.dontAskConfirmClear) {
                    this.clearDatabase();
                } else {
                    new ConfirmModal(this.app, this.plugin, (result, dontAsk) => {
                        if (result) {
                            if (dontAsk) {
                                this.plugin.settings.dontAskConfirmClear = true;
                                this.plugin.saveSettings();
                            }
                            this.clearDatabase();
                        }
                    }).open();
                }
            }));

        new Setting(containerEl).setName('Translation Mode')
            .addDropdown(d => d
                .addOption('google_free', '🟢 Basic (Free - Slow)')
                .addOption('google_api', '⚡ Pro (API Key - Fast)')
                .addOption('local_ollama', '🔒 Private (Ollama - Local)')
                .setValue(this.plugin.settings.provider)
                .onChange(async v => { 
                    this.plugin.settings.provider = v as TranslationProvider; 
                    await this.plugin.saveSettings(); 
                    this.display(); 
                }));

        if (this.plugin.settings.provider === 'google_api') {
            containerEl.createEl('h3', {text: '💰 Cost Control (Pro Mode)'});
            new Setting(containerEl).setName('🔑 Google API Key').addText(t => t.setValue(this.plugin.settings.apiKey).onChange(async v => { this.plugin.settings.apiKey = v; await this.plugin.saveSettings(); }));
            new Setting(containerEl).setName('📊 Characters Used (Month)').addText(t => t.setValue(this.plugin.settings.currentMonthChars.toString()).setDisabled(true));
            
            new Setting(containerEl).setName('🔔 Usage Warning Threshold (%)')
                .setDesc('Notify me when usage reaches this percentage (0-100).')
                .addText(text => text
                    .setPlaceholder("80.00")
                    .setValue(this.plugin.settings.alertThresholdPercent.toFixed(2))
                    .onChange(async (value) => {
                        let num = parseFloat(value);
                        if (isNaN(num)) return;
                        if (num < 0) num = 0;
                        if (num > 100) num = 100;
                        
                        this.plugin.settings.alertThresholdPercent = num;
                        await this.plugin.saveSettings();
                    }));
        }

        if (this.plugin.settings.provider === 'local_ollama') {
            new Setting(containerEl).setName('🤖 Ollama Model').addText(t => t.setValue(this.plugin.settings.ollamaModel).onChange(async v => { this.plugin.settings.ollamaModel = v; await this.plugin.saveSettings(); }));
        }

        containerEl.createEl('h3', {text: '🎨 Appearance'});

        new Setting(containerEl).setName('Target Language (Global)')
            .addDropdown(dropdown => {
                const sortedLangs = Object.entries(LANGUAGES).sort((a, b) => a[1].localeCompare(b[1]));
                sortedLangs.forEach(([code, name]) => dropdown.addOption(code, name));
                dropdown.setValue(this.plugin.settings.targetLang);
                dropdown.onChange(async (value) => { this.plugin.settings.targetLang = value; await this.plugin.saveSettings(); });
            });

        new Setting(containerEl).setName('Text Color').addColorPicker(c => c.setValue(this.plugin.settings.secondaryColor).onChange(async v => { this.plugin.settings.secondaryColor = v; await this.plugin.saveSettings(); }));
    }

    async clearDatabase() {
        this.plugin.settings.savedTranslations = {};
        this.plugin.translationCache.clear();
        await this.plugin.saveSettings();
        new Notice('✅ Memory cleared successfully.');
        this.plugin.app.workspace.updateOptions();
    }
}

class LanguageSuggestModal extends SuggestModal<string> {
    plugin: InterlinearPlugin;
    file: TFile;

    constructor(app: App, plugin: InterlinearPlugin, file: TFile) {
        super(app);
        this.plugin = plugin;
        this.file = file;
        this.setPlaceholder("Buscar idioma (ej. Spanish, en, fr...)");
    }

    getSuggestions(query: string): string[] {
        const queryLower = query.toLowerCase();
        return Object.keys(LANGUAGES).filter(code => 
            LANGUAGES[code].toLowerCase().includes(queryLower) || code.includes(queryLower)
        );
    }

    renderSuggestion(code: string, el: HTMLElement) {
        el.createEl("div", { text: LANGUAGES[code] });
        el.createEl("small", { text: `Código: ${code}`, cls: "text-muted" });
    }

    async onChooseSuggestion(code: string, evt: MouseEvent | KeyboardEvent) {
        await this.plugin.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
            frontmatter['target_lang'] = code;
        });
        new Notice(`🎯 Idioma establecido a: ${LANGUAGES[code]} para esta nota`);
        this.plugin.app.workspace.updateOptions(); 
    }
}

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }