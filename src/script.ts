/*
 * BitEdit - MonetizationVars Editor
 * Copyright (C) 2025 S0methingSomething
 *
 * This TypeScript version enhances type safety, code structure,
 * and maintainability for future development and forks.
 */

// --- App Metadata & Configuration ---
// GITHUB_ACTION_MARKER_APP_VERSION (Do not remove or alter this line)
const CURRENT_APP_VERSION: string = "v1.4.7";

// --- Enums for Controlled Vocabularies ---
enum AppMode {
    Decrypt = 'decrypt',
    Encrypt = 'encrypt'
}

enum ToastType {
    Info = 'info',
    Success = 'success',
    Error = 'error'
}

// --- Type Definitions ---
type MonetizationValue = string | number | boolean;

interface SourceInfo {
    readonly name: string;
    readonly pfpImageUrl: string;
    readonly pfpFallbackText: string;
    readonly url: string;
    statusMessage: string;
    fetchedVersion: string | null;
}

interface FileState {
    name: string;
    content: string | null;
    jsonObject: Record<string, MonetizationValue> | null;
}

// Encapsulated Application State
interface AppState {
    activeMode: AppMode;
    decryptState: FileState;
    encryptState: FileState;
    showFinalDownloadWarning: boolean;
    bitlifeVersionFromSource: string | null;
}

// --- Strongly-Typed UI Elements ---
interface UIElements {
    tabDecrypt: HTMLButtonElement;
    tabEncrypt: HTMLButtonElement;
    toolContent: HTMLDivElement;
    outputControls: HTMLDivElement;
    jsonOutput: HTMLTextAreaElement;
    unlockAllButton: HTMLButtonElement;
    copyJsonButton: HTMLButtonElement;
    downloadDecryptedJsonButton: HTMLButtonElement;
    downloadEncryptedButton: HTMLButtonElement;
    errorMessageDiv: HTMLDivElement;
    flowchartModal: HTMLDivElement;
    modalTitle: HTMLElement;
    modalBody: HTMLElement;
    modalCloseButton: HTMLButtonElement;
    downloadFinalWarningModal: HTMLDivElement;
    dontShowFinalWarningAgain: HTMLInputElement;
    downloadFinalWarningModalCloseButton: HTMLButtonElement;
    downloadFinalWarningOkButton: HTMLButtonElement;
    bitlifeVersion: HTMLElement;
    openSourceManagerButton: HTMLButtonElement;
    sourceManagerModal: HTMLDivElement;
    sourceManagerModalCloseButton: HTMLButtonElement;
    sourcePfpLarge: HTMLDivElement;
    sourceNameLarge: HTMLElement;
    sourceStatusLabelLarge: HTMLElement;
    sourceUrlDisplayLarge: HTMLAnchorElement;
    sourceFetchedVersionMessage: HTMLElement;
    modalBitlifeVersionDynamic: HTMLElement;
    sourceManagerAdvancedOptionsToggle: HTMLDivElement;
    sourceManagerAdvancedContent: HTMLDivElement;
    sourceManagerAdvancedIcon: HTMLElement;
    newSourceUrlInput: HTMLInputElement;
    loadNewSourceButton: HTMLButtonElement;
    downloadOriginalButton: HTMLButtonElement;
    autoPatchButton: HTMLButtonElement;
    autoPatchCorsNotice: HTMLDivElement;
    autoPatchLogContainer: HTMLDivElement;
    autoPatchLog: HTMLDivElement;
    importantNotesToggleButton: HTMLButtonElement;
    importantNotesContentWrapper: HTMLDivElement;
    importantNotesIconSvg: HTMLElement;
    offlineIndicator: HTMLDivElement;
    updateAvailableBanner: HTMLDivElement;
    appVersionDisplay: HTMLElement;
    fileInputLabel: HTMLLabelElement;
    fileInput: HTMLInputElement;
    fileNameDisplay: HTMLElement;
    advancedOptionsToggleContainer: HTMLDivElement;
    advancedOptionsIcon: HTMLElement;
    advancedOptionsContentArea: HTMLDivElement;
    cipherKey: HTMLInputElement;
    processButton: HTMLButtonElement;
}

// --- Constants ---
const CONSTANTS = Object.freeze({
    DEFAULT_CIPHER_KEY: "com.wtfapps.apollo16",
    TARGET_ENCRYPTED_FILENAME: "MonetizationVars",
    B64_NET_BOOLEAN_TRUE_STANDARD: "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=",
    B64_NET_BOOLEAN_TRUE_VARIANT: "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAs=",
    B64_NET_BOOLEAN_FALSE_STANDARD: "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=",
    USER_SERIALIZED_INT32_PREFIX: new Uint8Array([0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 4, 1, 0, 0, 0, 12, 83, 121, 115, 116, 101, 109, 46, 73, 110, 116, 51, 50, 1, 0, 0, 0, 7, 109, 95, 118, 97, 108, 117, 101, 0, 8]),
    USER_SERIALIZED_INT32_SUFFIX: new Uint8Array([11]),
    get USER_SERIALIZED_INT32_TOTAL_LENGTH() {
        return this.USER_SERIALIZED_INT32_PREFIX.length + 4 + this.USER_SERIALIZED_INT32_SUFFIX.length;
    },
    HIDE_FINAL_DOWNLOAD_WARNING_KEY: 'bitEditHideFinalDownloadWarning',
    LAST_SUCCESSFUL_UPDATE_CHECK_KEY: 'bitEditLastSuccessfulUpdateCheck',
    ONE_DAY_MS: 24 * 60 * 60 * 1000,
    DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL: "https://raw.githubusercontent.com/S0methingSomething/BitEdit/refs/heads/main/MonetizationVars.txt",
    GITHUB_API_LATEST_TAG_URL: "https://api.github.com/repos/S0methingSomething/BitEdit/releases/tags/Latest",
    ORIGINAL_GITHUB_RELEASE_DOWNLOAD_URL: "https://github.com/S0methingSomething/BitEdit/releases/download/Latest/MonetizationVars",
    BITLIFE_VERSION_TXT_URL: 'https://raw.githubusercontent.com/S0methingSomething/BitEdit/Latest/Get_Bitlife_Version/version.txt',
    APP_VERSION_CHECK_URL: 'https://raw.githubusercontent.com/S0methingSomething/BitEdit/main/BitEdit_version.txt',
    OBF_CHAR_MAP: Object.freeze({
        0x61: 0x7a, 0x62: 0x6d, 0x63: 0x79, 0x64: 0x6c, 0x65: 0x78, 0x66: 0x6b, 0x67: 0x77, 0x68: 0x6a,
        0x69: 0x76, 0x6a: 0x69, 0x6b: 0x75, 0x6c: 0x68, 0x6d: 0x74, 0x6e: 0x67, 0x6f: 0x73, 0x70: 0x66,
        0x71: 0x72, 0x72: 0x65, 0x73: 0x71, 0x74: 0x64, 0x75: 0x70, 0x76: 0x63, 0x77: 0x6f, 0x78: 0x62,
        0x79: 0x6e, 0x7a: 0x61
    }) as Record<number, number>,
});

// --- App Initialization ---
const ui = {} as UIElements;
const DEFAULT_SOURCE_INFO: SourceInfo = Object.freeze({
    name: "S0methingSomething",
    pfpImageUrl: "https://avatars.githubusercontent.com/u/1024025?v=4", // Example avatar
    pfpFallbackText: "S0",
    url: CONSTANTS.DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL,
    statusMessage: "",
    fetchedVersion: null
});

let currentSourceInfo: SourceInfo = { ...DEFAULT_SOURCE_INFO };

// Centralized state management
const appState: AppState = {
    activeMode: AppMode.Decrypt,
    decryptState: { name: 'file', content: null, jsonObject: null },
    encryptState: { name: 'file', content: null, jsonObject: null },
    showFinalDownloadWarning: true,
    bitlifeVersionFromSource: null,
};

// --- Utility & Crypto Functions ---

/** Asserts that an element exists, throwing an error if not. */
function assertElementExists<T extends Element>(element: T | null, id: string): T {
    if (!element) {
        throw new Error(`Critical UI element '${id}' not found. The application cannot start.`);
    }
    return element;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function getObfuscatedKey(key: string): string {
    return Array.from(key.toLowerCase())
        .map(char => String.fromCharCode(CONSTANTS.OBF_CHAR_MAP[char.charCodeAt(0)] ?? char.charCodeAt(0)))
        .join('');
}

function utf8StringToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes));
}

function base64ToUtf8String(b64: string): string {
    const binaryStr = atob(b64);
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function xorAndBase64Encode(text: string, key: string): string {
    let xorResult = "";
    for (let i = 0; i < text.length; i++) {
        xorResult += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return utf8StringToBase64(xorResult);
}

function base64DecodeAndXOR(b64: string, key: string): string {
    const decodedText = base64ToUtf8String(b64);
    let xorResult = "";
    for (let i = 0; i < decodedText.length; i++) {
        xorResult += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return xorResult;
}

function decryptInt(base64String: string): number | null {
    try {
        const binaryString = atob(base64String);
        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        if (bytes.length !== CONSTANTS.USER_SERIALIZED_INT32_TOTAL_LENGTH) return null;
        const prefix = bytes.slice(0, CONSTANTS.USER_SERIALIZED_INT32_PREFIX.length);
        const suffix = bytes[bytes.length - 1];
        if (!arraysEqual(prefix, CONSTANTS.USER_SERIALIZED_INT32_PREFIX) || suffix !== CONSTANTS.USER_SERIALIZED_INT32_SUFFIX[0]) return null;
        const dataView = new DataView(bytes.buffer, bytes.byteOffset + CONSTANTS.USER_SERIALIZED_INT32_PREFIX.length, 4);
        return dataView.getInt32(0, true);
    } catch {
        return null;
    }
}

function encryptInt(value: number): string | null {
    if (!Number.isInteger(value)) return null;
    const buffer = new ArrayBuffer(CONSTANTS.USER_SERIALIZED_INT32_TOTAL_LENGTH);
    const fullByteArray = new Uint8Array(buffer);
    const valueBytes = new Uint8Array(4);
    new DataView(valueBytes.buffer).setInt32(0, value, true);
    fullByteArray.set(CONSTANTS.USER_SERIALIZED_INT32_PREFIX, 0);
    fullByteArray.set(valueBytes, CONSTANTS.USER_SERIALIZED_INT32_PREFIX.length);
    fullByteArray.set(CONSTANTS.USER_SERIALIZED_INT32_SUFFIX, CONSTANTS.USER_SERIALIZED_INT32_PREFIX.length + 4);
    return btoa(String.fromCharCode(...fullByteArray));
}

function compareVersions(v1: string, v2: string): number {
    const normalize = (v: string): number[] => v.trim().replace(/^v/, '').split('.').map(p => parseInt(p, 10)).filter(p => !isNaN(p));
    const parts1 = normalize(v1);
    const parts2 = normalize(v2);
    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

// --- UI & DOM Manipulation ---

function showError(message: string): void {
    ui.errorMessageDiv.textContent = message;
    ui.errorMessageDiv.classList.remove('hidden');
    ui.outputControls.classList.add('hidden');
}

function clearError(): void {
    ui.errorMessageDiv.classList.add('hidden');
    ui.errorMessageDiv.textContent = '';
}

function showToast(message: string, type: ToastType = ToastType.Info): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    // These classes should correspond to styles in your CSS
    toast.className = `toast toast-${type}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function showStandardModal(modalElement: HTMLElement): void {
    modalElement.classList.remove('hidden');
    setTimeout(() => modalElement.classList.add('visible'), 10);
}

function hideStandardModal(modalElement: HTMLElement): void {
    modalElement.classList.remove('visible');
    setTimeout(() => modalElement.classList.add('hidden'), 250);
}

// --- Core Application Logic ---

async function fetchBitLifeVersion(): Promise<void> {
    try {
        const response = await fetch(CONSTANTS.BITLIFE_VERSION_TXT_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const versionText = (await response.text()).trim();
        appState.bitlifeVersionFromSource = versionText;
        ui.bitlifeVersion.textContent = versionText;
        ui.modalBitlifeVersionDynamic.textContent = versionText;
    } catch (error) {
        console.error('Failed to fetch BitLife version:', error);
        ui.bitlifeVersion.textContent = 'Error';
        ui.modalBitlifeVersionDynamic.textContent = 'Error';
    }
}

function processEncryptedContent(content: string, key: string): Record<string, MonetizationValue> {
    const obfuscatedKey = getObfuscatedKey(key);
    const itemMap: Record<string, MonetizationValue> = {};
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
        const parts = line.split(/:(.+)/);
        if (parts.length < 2) continue;
        const [encKey, encVal] = parts.map(p => p.trim());
        try {
            const decKey = base64DecodeAndXOR(encKey, obfuscatedKey);
            const decValB64 = base64DecodeAndXOR(encVal, obfuscatedKey);
            if (decValB64 === CONSTANTS.B64_NET_BOOLEAN_TRUE_STANDARD || decValB64 === CONSTANTS.B64_NET_BOOLEAN_TRUE_VARIANT) {
                itemMap[decKey] = true;
            } else if (decValB64 === CONSTANTS.B64_NET_BOOLEAN_FALSE_STANDARD) {
                itemMap[decKey] = false;
            } else {
                itemMap[decKey] = decryptInt(decValB64) ?? decValB64;
            }
        } catch (error) {
            console.error("Error processing line:", line, error);
            throw new Error(`Decryption failed on line "${line.substring(0, 30)}...". Check file and key.`);
        }
    }
    return itemMap;
}

function serializeAndEncryptJson(jsonObject: Record<string, MonetizationValue>, key: string): string {
    const obfuscatedKey = getObfuscatedKey(key);
    let fileContent = "";
    for (const [decKey, decValue] of Object.entries(jsonObject)) {
        const cipheredKey = xorAndBase64Encode(decKey, obfuscatedKey);
        let valueToSerializeB64: string;
        if (typeof decValue === 'boolean') {
            valueToSerializeB64 = decValue ? CONSTANTS.B64_NET_BOOLEAN_TRUE_STANDARD : CONSTANTS.B64_NET_BOOLEAN_FALSE_STANDARD;
        } else if (typeof decValue === 'number') {
            valueToSerializeB64 = encryptInt(decValue) ?? utf8StringToBase64(String(decValue));
        } else {
            valueToSerializeB64 = (String(decValue).startsWith("AAEAAAD")) ? String(decValue) : utf8StringToBase64(String(decValue));
        }
        const cipheredValue = xorAndBase64Encode(valueToSerializeB64, obfuscatedKey);
        fileContent += `${cipheredKey}:${cipheredValue}\n`;
    }
    return fileContent.trimEnd();
}

function setupUIForMode(newMode: AppMode): void {
    appState.activeMode = newMode;
    clearError();
    ui.jsonOutput.value = '';
    ui.outputControls.classList.add('hidden');
    ui.tabDecrypt.classList.toggle('active', newMode === AppMode.Decrypt);
    ui.tabEncrypt.classList.toggle('active', newMode === AppMode.Encrypt);

    if (newMode === AppMode.Decrypt) {
        ui.fileInputLabel.textContent = `Select '${CONSTANTS.TARGET_ENCRYPTED_FILENAME}' File:`;
        ui.fileInput.accept = '*/*';
        ui.processButton.textContent = 'Start Decryption';
    } else {
        ui.fileInputLabel.textContent = 'Select JSON File to Encrypt:';
        ui.fileInput.accept = '.json,text/plain';
        ui.processButton.textContent = 'Load JSON from File';
    }

    const modeState = newMode === AppMode.Decrypt ? appState.decryptState : appState.encryptState;
    ui.fileNameDisplay.textContent = modeState.content ? `Selected: ${modeState.name}` : 'No file selected.';
    ui.fileNameDisplay.style.color = modeState.content ? 'var(--accent-green)' : 'var(--text-secondary)';
    if (!modeState.content) ui.fileInput.value = "";
    if (modeState.jsonObject) {
        ui.jsonOutput.value = JSON.stringify(modeState.jsonObject, null, 2);
        ui.outputControls.classList.remove('hidden');
    }
}

async function handleManualFileProcessing(): Promise<void> {
    clearError();
    const currentState = appState.activeMode === AppMode.Decrypt ? appState.decryptState : appState.encryptState;
    if (!currentState.content) return showError('Please select a file first.');

    if (appState.activeMode === AppMode.Decrypt && currentState.name.toLowerCase() !== CONSTANTS.TARGET_ENCRYPTED_FILENAME.toLowerCase()) {
        return showError(`Invalid input for decryption. Must be '${CONSTANTS.TARGET_ENCRYPTED_FILENAME}'.`);
    }

    try {
        let processedJson: Record<string, MonetizationValue>;
        if (appState.activeMode === AppMode.Decrypt) {
            const cipherKey = ui.cipherKey.value.trim() || CONSTANTS.DEFAULT_CIPHER_KEY;
            processedJson = processEncryptedContent(currentState.content, cipherKey);
        } else {
            processedJson = JSON.parse(currentState.content);
        }
        currentState.jsonObject = processedJson;
        ui.jsonOutput.value = JSON.stringify(processedJson, null, 2);
        ui.outputControls.classList.remove('hidden');
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown processing error occurred.";
        showError(`Error: ${message}`);
        currentState.jsonObject = null;
    }
}

async function handleFileSelection(event: Event): Promise<void> {
    clearError();
    const target = event.target as HTMLInputElement;
    const currentState = appState.activeMode === AppMode.Decrypt ? appState.decryptState : appState.encryptState;
    currentState.name = 'file';
    currentState.content = null;
    currentState.jsonObject = null;

    if (target.files?.length) {
        const file = target.files[0];
        try {
            currentState.name = file.name;
            currentState.content = await file.text();
            ui.fileNameDisplay.textContent = `Selected: ${file.name}`;
            ui.fileNameDisplay.style.color = 'var(--accent-green)';
        } catch (error) {
            showError(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    setupUIForMode(appState.activeMode); // Refresh UI
}

// --- Initialization Functions ---

/** Caches all critical UI elements into the `ui` object. */
function cacheUIElements(): void {
    const ids = [
        'tabDecrypt', 'tabEncrypt', 'toolContent', 'outputControls', 'jsonOutput',
        'unlockAllButton', 'copyJsonButton', 'downloadDecryptedJsonButton',
        'downloadEncryptedButton', 'errorMessageDiv', 'flowchartModal', 'modalTitle',
        'modalBody', 'modalCloseButton', 'downloadFinalWarningModal',
        'dontShowFinalWarningAgain', 'downloadFinalWarningModalCloseButton',
        'downloadFinalWarningOkButton', 'bitlifeVersion', 'openSourceManagerButton',
        'sourceManagerModal', 'sourceManagerModalCloseButton', 'sourcePfpLarge',
        'sourceNameLarge', 'sourceStatusLabelLarge', 'sourceUrlDisplayLarge',
        'sourceFetchedVersionMessage', 'modalBitlifeVersionDynamic',
        'sourceManagerAdvancedOptionsToggle', 'sourceManagerAdvancedContent',
        'sourceManagerAdvancedIcon', 'newSourceUrlInput', 'loadNewSourceButton',
        'downloadOriginalButton', 'autoPatchButton', 'autoPatchCorsNotice',
        'autoPatchLogContainer', 'autoPatchLog', 'importantNotesToggleButton',
        'importantNotesContentWrapper', 'importantNotesIconSvg', 'offlineIndicator',
        'updateAvailableBanner', 'appVersionDisplay', 'fileInputLabel', 'fileInput',
        'fileNameDisplay', 'advancedOptionsToggleContainer', 'advancedOptionsIcon',
        'advancedOptionsContentArea', 'cipherKey', 'processButton'
    ];
    for (const id of ids) {
        const camelCaseId = id.replace(/-(\w)/g, (_, letter) => letter.toUpperCase()) as keyof UIElements;
        ui[camelCaseId] = assertElementExists(document.getElementById(id), id) as any;
    }
}

/** Attaches all primary event listeners to the UI elements. */
function setupEventListeners(): void {
    ui.tabDecrypt.addEventListener('click', () => setupUIForMode(AppMode.Decrypt));
    ui.tabEncrypt.addEventListener('click', () => setupUIForMode(AppMode.Encrypt));
    ui.fileInput.addEventListener('change', handleFileSelection);
    ui.processButton.addEventListener('click', handleManualFileProcessing);
    // Add other event listeners... for modals, toggles, buttons etc.
}

// --- DOMContentLoaded Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        cacheUIElements();
    } catch (error) {
        document.body.innerHTML = `<div style="color: red; padding: 2em;">${error instanceof Error ? error.message : 'A critical error occurred.'}</div>`;
        return;
    }

    ui.appVersionDisplay.textContent = CURRENT_APP_VERSION;
    appState.showFinalDownloadWarning = localStorage.getItem(CONSTANTS.HIDE_FINAL_DOWNLOAD_WARNING_KEY) !== 'true';

    setupEventListeners();
    setupUIForMode(AppMode.Decrypt);
    
    await fetchBitLifeVersion();
    // Further async initializations can go here

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('ServiceWorker registration successful.', reg.scope))
                .catch(err => console.error('ServiceWorker registration failed:', err));
        });
    }
});

