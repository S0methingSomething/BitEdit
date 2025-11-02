import {
    currentMonetizationVarsSourceURL,
    currentSourceInfo,
    setStateForDecrypt,
    setStateForEncrypt,
    showFinalDownloadWarningPreference,
    stateForDecrypt,
    stateForEncrypt,
    versionFromTxt
} from './state';
import {
    checkSourceOutdatedStatus
} from './api';
import {
    TARGET_ENCRYPTED_FILENAME
} from './constants';

export const ui: {
    [key: string]: HTMLElement | null
} = {};

export function cacheUIElements() {
    const ids = [
        'tab-decrypt', 'tab-encrypt', 'tool-content', 'output-controls', 'json-output',
        'unlock-all-button', 'copy-json-button', 'download-decrypted-json-button',
        'download-encrypted-button', 'error-message', 'flowchart-modal', 'modal-title',
        'modal-body', 'modal-close-button', 'download-final-warning-modal',
        'dont-show-final-warning-again', 'download-final-warning-modal-close-button',
        'download-final-warning-ok-button', 'bitlife-version', 'open-source-manager-button',
        'source-manager-modal', 'source-manager-modal-close-button', 'source-pfp-large',
        'source-name-large', 'source-status-label-large', 'source-url-display-large',
        'source-fetched-version-message', 'modal-bitlife-version-dynamic',
        'source-manager-advanced-options-toggle', 'source-manager-advanced-content',
        'source-manager-advanced-icon', 'new-source-url', 'load-new-source-button',
        'download-original-button', 'auto-patch-button', 'auto-patch-cors-notice',
        'auto-patch-log-container', 'auto-patch-log',
        'important-notes-toggle-button', 'important-notes-content-wrapper', 'important-notes-icon-svg',
        'offline-indicator', 'update-available-banner', 'app-version-display',
        'file-input-label', 'file-input', 'file-name-display', 'advanced-options-toggle-container',
        'advanced-options-icon', 'advanced-options-content-area', 'cipher-key', 'process-button',
        'wrong-file-name-modal', 'wrong-file-name-modal-close-button', 'wrong-file-name-ok-button'
    ];
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (!element && id !== 'tool-content') {
            console.warn(`Element with ID '${id}' not found during caching.`);
        }
        ui[id.replace(/-(\w)/g, (match, letter) => letter.toUpperCase())] = element;
    });
    if (!ui.newSourceUrlInput && ui.newSourceUrl) {
        ui.newSourceUrlInput = ui.newSourceUrl;
    }
    if (!ui.jsonOutput) {
        console.error("CRITICAL: ui.jsonOutput is undefined after caching. (ERR_DOM_JSO_CACHE_FAIL)");
    }
}

export function showToast(message: string, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'fixed py-2 px-4 rounded-md shadow-lg text-sm font-medium';
    Object.assign(toast.style, {
        bottom: '-50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '200',
        transition: 'opacity 0.3s ease-in-out, bottom 0.3s ease-in-out',
    });
    if (type === 'success') {
        toast.style.backgroundColor = 'var(--accent-green)';
        toast.style.color = 'white';
    } else if (type === 'error') {
        toast.style.backgroundColor = 'var(--accent-red)';
        toast.style.color = 'white';
    } else {
        toast.style.backgroundColor = 'var(--bg-tertiary)';
        toast.style.color = 'var(--text-primary)';
        toast.style.border = '1px solid var(--border-color-primary)';
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.bottom = '20px';
    }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '-50px';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

export function showError(message: string) {
    if (ui.errorMessageDiv) {
        ui.errorMessageDiv.textContent = message;
        ui.errorMessageDiv.classList.remove('hidden');
    }
    if (ui.outputControls) {
        ui.outputControls.classList.add('hidden');
    }
}

export function clearError() {
    if (ui.errorMessageDiv) {
        ui.errorMessageDiv.classList.add('hidden');
        ui.errorMessageDiv.textContent = '';
    }
}

export function showStandardModal(modalElement: HTMLElement | null) {
    if (modalElement) {
        modalElement.classList.remove('hidden');
        setTimeout(() => {
            modalElement.classList.add('visible');
        }, 10);
    }
}

export function hideStandardModal(modalElement: HTMLElement | null) {
    if (modalElement) {
        modalElement.classList.remove('visible');
        setTimeout(() => {
            modalElement.classList.add('hidden');
        }, 250);
    }
}

export function openSourceManagerModal() {
    updateSourceManagerDisplay(currentSourceInfo);
    if (ui.newSourceUrlInput) (ui.newSourceUrlInput as HTMLInputElement).value = '';
    if (ui.sourceManagerAdvancedContent) ui.sourceManagerAdvancedContent.classList.remove('expanded');
    if (ui.sourceManagerAdvancedIcon) ui.sourceManagerAdvancedIcon.style.transform = 'rotate(0deg)';
    if (ui.autoPatchLog) ui.autoPatchLog.innerHTML = '';
    if (ui.autoPatchLogContainer) ui.autoPatchLogContainer.classList.add('hidden');
    if (ui.autoPatchCorsNotice) ui.autoPatchCorsNotice.classList.add('hidden');
    if (ui.autoPatchButton)(ui.autoPatchButton as HTMLButtonElement).disabled = false;
    if (ui.modalBitlifeVersionDynamic) ui.modalBitlifeVersionDynamic.textContent = versionFromTxt || 'Loading...';
    showStandardModal(ui.sourceManagerModal);
}

export function closeSourceManagerModal() {
    hideStandardModal(ui.sourceManagerModal);
    if (ui.autoPatchLogContainer) ui.autoPatchLogContainer.classList.add('hidden');
    if (ui.autoPatchLog) ui.autoPatchLog.innerHTML = '';
}

export function updateSourceManagerDisplay(sourceInfo: any) {
    if (ui.sourcePfpLarge) {
        ui.sourcePfpLarge.innerHTML = '';
        if (sourceInfo.pfpImageUrl) {
            const img = document.createElement('img');
            img.src = sourceInfo.pfpImageUrl;
            img.alt = sourceInfo.name.substring(0, 2);
            img.className = "w-full h-full object-cover";
            img.onerror = () => {
                ui.sourcePfpLarge!.textContent = sourceInfo.pfpFallbackText || sourceInfo.name.substring(0, 2).toUpperCase();
            };
            ui.sourcePfpLarge.appendChild(img);
        } else {
            ui.sourcePfpLarge.textContent = sourceInfo.pfpFallbackText || sourceInfo.name.substring(0, 2).toUpperCase() || 'URL';
        }
    }
    if (ui.sourceNameLarge) ui.sourceNameLarge.textContent = sourceInfo.name;
    if (ui.sourceUrlDisplayLarge) {
        (ui.sourceUrlDisplayLarge as HTMLAnchorElement).href = sourceInfo.url;
        const displayUrl = sourceInfo.url.length > 40 ? sourceInfo.url.substring(0, 15) + "..." + sourceInfo.url.substring(sourceInfo.url.length - 15) : sourceInfo.url;
        ui.sourceUrlDisplayLarge.textContent = `View Raw: ${displayUrl}`;
    }
    if (ui.sourceStatusLabelLarge) {
        ui.sourceStatusLabelLarge.textContent = sourceInfo.statusMessage || "(Status N/A)";
        ui.sourceStatusLabelLarge.classList.remove('hidden', 'potentially-newer', 'outdated', 'neutral');
        ui.sourceStatusLabelLarge.classList.add('status-label');
        if (sourceInfo.statusMessage) {
            ui.sourceStatusLabelLarge.classList.remove('hidden');
            const lowerStatus = sourceInfo.statusMessage.toLowerCase();
            if (lowerStatus.includes("newer")) {
                ui.sourceStatusLabelLarge.classList.add('potentially-newer');
            } else if (lowerStatus.includes("outdated")) {
                ui.sourceStatusLabelLarge.classList.add('outdated');
            } else {
                ui.sourceStatusLabelLarge.classList.add('neutral');
            }
        } else {
            ui.sourceStatusLabelLarge.classList.add('hidden');
        }
    }
    if (ui.sourceFetchedVersionMessage) {
        if (sourceInfo.fetchedVersion && currentMonetizationVarsSourceURL === "https://raw.githubusercontent.com/S0methingSomething/BitEdit/refs/heads/main/MonetizationVars.txt") {
            ui.sourceFetchedVersionMessage.textContent = `Default source is for BitLife v${sourceInfo.fetchedVersion}`;
            ui.sourceFetchedVersionMessage.classList.remove('hidden');
        } else {
            ui.sourceFetchedVersionMessage.classList.add('hidden');
        }
    }
    if (ui.autoPatchButton)(ui.autoPatchButton as HTMLButtonElement).disabled = false;
    if (ui.autoPatchCorsNotice) ui.autoPatchCorsNotice.classList.add('hidden');
}

export function addLogToAutoPatcher(message: string, type = 'info') {
    if (!ui.autoPatchLog || !ui.autoPatchLogContainer) return;
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${message}`;
    logEntry.classList.add(type === 'success' ? 'log-success' : (type === 'error' ? 'log-error' : 'log-info'));
    ui.autoPatchLog.appendChild(logEntry);
    ui.autoPatchLog.scrollTop = ui.autoPatchLog.scrollHeight;
    ui.autoPatchLogContainer.classList.remove('hidden');
}

export function setupUIForMode(newMode: string) {
    clearError();

    if (!ui.jsonOutput) {
        console.error("ERROR in setupUIForMode: ui.jsonOutput is undefined.");
    } else {
        (ui.jsonOutput as HTMLTextAreaElement).value = '';
    }

    if (ui.outputControls) ui.outputControls.classList.add('hidden');
    if (ui.tabDecrypt) ui.tabDecrypt.classList.toggle('active', newMode === 'decrypt');
    if (ui.tabEncrypt) ui.tabEncrypt.classList.toggle('active', newMode === 'encrypt');

    const fileInputLabel = document.getElementById('file-input-label');
    const fileInputElement = document.getElementById('file-input');
    const processButtonElement = document.getElementById('process-button');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (!fileInputLabel || !fileInputElement || !processButtonElement || !fileNameDisplay) {
        console.error("CRITICAL: One or more pre-rendered UI elements for the tool content are missing. UI updates for mode changes will fail.");
    }

    if (newMode === 'decrypt') {
        if (fileInputLabel) fileInputLabel.textContent = `Select '${TARGET_ENCRYPTED_FILENAME}' File:`;
        if (fileInputElement)(fileInputElement as HTMLInputElement).accept = '*/*';
        if (processButtonElement) processButtonElement.textContent = 'Start Decryption';
    } else {
        if (fileInputLabel) fileInputLabel.textContent = 'Select JSON File to Encrypt:';
        if (fileInputElement)(fileInputElement as HTMLInputElement).accept = '.json,text/plain';
        if (processButtonElement) processButtonElement.textContent = 'Load JSON from File';
    }

    let modeState = (newMode === 'decrypt') ? stateForDecrypt : stateForEncrypt;
    if (fileNameDisplay) {
        if (modeState.inputFileName !== 'file' && modeState.fileContent !== null) {
            fileNameDisplay.textContent = `Selected: ${modeState.inputFileName}`;
            fileNameDisplay.style.color = 'var(--accent-green)';
        } else {
            fileNameDisplay.textContent = 'No file selected.';
            fileNameDisplay.style.color = 'var(--text-secondary)';
            if (fileInputElement)(fileInputElement as HTMLInputElement).value = "";

            if (newMode === 'decrypt' && (stateForDecrypt.inputFileName !== 'file' || stateForDecrypt.fileContent !== null)) {
                setStateForDecrypt({
                    inputFileName: 'file',
                    fileContent: null,
                    jsonObject: null
                });
            } else if (newMode === 'encrypt' && (stateForEncrypt.inputFileName !== 'file' || stateForEncrypt.fileContent !== null)) {
                setStateForEncrypt({
                    inputFileName: 'file',
                    fileContent: null,
                    jsonObject: null
                });
            }
        }
    }

    if (modeState.jsonObject && ui.jsonOutput && ui.outputControls) {
        (ui.jsonOutput as HTMLTextAreaElement).value = JSON.stringify(modeState.jsonObject, null, 2);
        ui.outputControls.classList.remove('hidden');
    } else {
        if (ui.jsonOutput)(ui.jsonOutput as HTMLTextAreaElement).value = '';
        if (ui.outputControls) ui.outputControls.classList.add('hidden');
    }
}
