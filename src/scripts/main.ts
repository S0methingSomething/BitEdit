import {
    checkForAppUpdate,
    fetchBitLifeVersion,
    checkSourceOutdatedStatus
} from './api';
import {
    DEFAULT_CIPHER_KEY,
    DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL,
    DEFAULT_SOURCE_INFO,
    HIDE_FINAL_DOWNLOAD_WARNING_KEY,
    ORIGINAL_GITHUB_RELEASE_DOWNLOAD_URL,
    TARGET_ENCRYPTED_FILENAME
} from './constants';
import {
    base64DecodeAndXOR,
    getObfuscatedKey,
    processMonetizationVarsContent,
    xorAndBase64Encode
} from './crypto';
import {
    activeMode,
    currentJsonObject,
    setCurrentJsonObject,
    setShowFinalDownloadWarningPreference,
    setStateForDecrypt,
    setStateForEncrypt,
    showFinalDownloadWarningPreference,
    stateForDecrypt,
    stateForEncrypt,
    setCurrentMonetizationVarsSourceURL,
    setCurrentSourceInfo
} from './state';
import {
    addLogToAutoPatcher,
    cacheUIElements,
    clearError,
    closeSourceManagerModal,
    hideStandardModal,
    openSourceManagerModal,
    setupUIForMode,
    showError,
    showStandardModal,
    showToast,
    ui
} from './ui';

function updateOnlineStatusIndicator() {
    if (ui.offlineIndicator) {
        if (navigator.onLine) {
            ui.offlineIndicator.style.display = 'none';
        } else {
            ui.offlineIndicator.textContent = 'Offline Mode - Content may be cached';
            ui.offlineIndicator.style.display = 'block';
        }
    }
}

async function handleManualFileProcessing(fileContent: string, cipherKeyStr: string) {
    clearError();
    if (!ui.jsonOutput) {
        console.error("CRITICAL ERROR: ui.jsonOutput is undefined.");
        showError("Internal error: Output area not found.");
        return;
    }
    (ui.jsonOutput as HTMLTextAreaElement).value = '';
    if (ui.outputControls) {
        ui.outputControls.classList.add('hidden');
    }

    try {
        const processedJson = await processMonetizationVarsContent(fileContent, activeMode, cipherKeyStr);
        if (activeMode === 'decrypt') {
            setStateForDecrypt({ ...stateForDecrypt,
                jsonObject: processedJson
            });
        } else {
            setStateForEncrypt({ ...stateForEncrypt,
                jsonObject: processedJson
            });
        }
        setCurrentJsonObject(processedJson);
        (ui.jsonOutput as HTMLTextAreaElement).value = JSON.stringify(currentJsonObject, null, 2);
        if (ui.outputControls) ui.outputControls.classList.remove('hidden');
    } catch (error: any) {
        console.error("Manual Processing error:", error);
        showError(`Error: ${error.message}.`);
        setCurrentJsonObject(null);
        if (activeMode === 'decrypt') setStateForDecrypt({ ...stateForDecrypt,
            jsonObject: null
        });
        else setStateForEncrypt({ ...stateForEncrypt,
            jsonObject: null
        });
    }
}

function attachToolContentListeners() {
    const fileInput = document.getElementById('file-input');
    const processButton = document.getElementById('process-button');
    const advancedToggle = document.getElementById('advanced-options-toggle-container');
    const advancedContent = document.getElementById('advanced-options-content-area');
    const advancedIcon = document.getElementById('advanced-options-icon');

    if (fileInput) {
        fileInput.addEventListener('change', async (event) => {
            clearError();
            const currentFileNameDisplay = ui.fileNameDisplay || document.getElementById('file-name-display');
            const selectedFile = (event.target as HTMLInputElement).files!.length > 0 ? (event.target as HTMLInputElement).files![0] : null;

            if (!selectedFile) {
                const modeState = (activeMode === 'decrypt') ? stateForDecrypt : stateForEncrypt;
                modeState.inputFileName = 'file';
                modeState.fileContent = null;
                if (currentFileNameDisplay) {
                    currentFileNameDisplay.textContent = 'No file selected.';
                    currentFileNameDisplay.style.color = 'var(--text-secondary)';
                }
                return;
            }

            const tempInputFileName = selectedFile.name;

            if (activeMode === 'decrypt' && tempInputFileName.toLowerCase() !== TARGET_ENCRYPTED_FILENAME.toLowerCase()) {
                showStandardModal(ui.wrongFileNameModal);
                (event.target as HTMLInputElement).value = "";
                setStateForDecrypt({ ...stateForDecrypt,
                    inputFileName: 'file',
                    fileContent: null
                });
                if (currentFileNameDisplay) {
                    currentFileNameDisplay.textContent = 'No file selected.';
                    currentFileNameDisplay.style.color = 'var(--text-secondary)';
                }
                return;
            }

            try {
                const fileText = await selectedFile.text();
                if (activeMode === 'decrypt') {
                    setStateForDecrypt({ ...stateForDecrypt,
                        inputFileName: tempInputFileName,
                        fileContent: fileText,
                        jsonObject: null
                    });
                } else {
                    setStateForEncrypt({ ...stateForEncrypt,
                        inputFileName: tempInputFileName,
                        fileContent: fileText,
                        jsonObject: null
                    });
                }
                if (currentFileNameDisplay) {
                    currentFileNameDisplay.textContent = `Selected: ${tempInputFileName}`;
                    currentFileNameDisplay.style.color = 'var(--accent-green)';
                    currentFileNameDisplay.classList.add('file-selected-text-anim');
                    setTimeout(() => currentFileNameDisplay.classList.remove('file-selected-text-anim'), 300);
                }
            } catch (readError: any) {
                console.error("Error reading file:", readError);
                showError(`Failed to read file: ${readError.message}.`);
                const modeState = (activeMode === 'decrypt') ? stateForDecrypt : stateForEncrypt;
                modeState.inputFileName = 'file';
                modeState.fileContent = null;
                if (currentFileNameDisplay) {
                    currentFileNameDisplay.textContent = 'No file selected.';
                    currentFileNameDisplay.style.color = 'var(--text-secondary)';
                }
            } finally {
                if (ui.jsonOutput)(ui.jsonOutput as HTMLTextAreaElement).value = '';
                if (ui.outputControls) ui.outputControls.classList.add('hidden');
                setCurrentJsonObject(null);
            }
        });
    } else {
        console.warn("File input for tool-content not found for listener attachment.");
    }

    if (advancedToggle && advancedContent && advancedIcon) {
        advancedToggle.addEventListener('click', () => {
            const isExpanded = advancedContent.classList.toggle('expanded');
            advancedIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    } else {
        console.warn("Advanced options toggle elements for tool-content not found.");
    }

    if (processButton) {
        processButton.addEventListener('click', () => {
            const modeState = (activeMode === 'decrypt') ? stateForDecrypt : stateForEncrypt;

            if (modeState.fileContent === null || modeState.inputFileName === 'file') {
                showError('Please select a file first.');
                return;
            }

            const cipherKeyInput = document.getElementById('cipher-key');
            const effectiveKey = (cipherKeyInput && (cipherKeyInput as HTMLInputElement).value.trim()) ? (cipherKeyInput as HTMLInputElement).value.trim() : DEFAULT_CIPHER_KEY;
            handleManualFileProcessing(modeState.fileContent, effectiveKey);
        });
    } else {
        console.warn("Process button for tool-content not found.");
    }
}

function getEffectiveCipherKeyForOperation() {
    const cipherKeyInput = document.getElementById('cipher-key');
    const advancedContent = document.getElementById('advanced-options-content-area');
    if (cipherKeyInput && advancedContent && advancedContent.classList.contains('expanded') && (cipherKeyInput as HTMLInputElement).value.trim()) {
        return (cipherKeyInput as HTMLInputElement).value.trim();
    }
    return DEFAULT_CIPHER_KEY;
}

document.addEventListener('DOMContentLoaded', async () => {
    const appVersionDisplay = document.getElementById('app-version-display');
    if (appVersionDisplay) {
        appVersionDisplay.textContent = "1.5.0";
    }

    const toolContentCheck = document.getElementById('tool-content');
    if (!toolContentCheck || !document.getElementById('file-input')) {
        console.error("CRITICAL FAILURE: Key pre-rendered UI elements (tool-content or file-input) NOT FOUND. App may not function correctly.");
        return;
    }

    cacheUIElements();
    updateOnlineStatusIndicator();
    window.addEventListener('online', updateOnlineStatusIndicator);
    window.addEventListener('offline', updateOnlineStatusIndicator);
    await checkForAppUpdate();
    try {
        setShowFinalDownloadWarningPreference(localStorage.getItem(HIDE_FINAL_DOWNLOAD_WARNING_KEY) !== 'true');
    } catch (e) {
        console.warn("LocalStorage access denied.", e);
        setShowFinalDownloadWarningPreference(true);
    }

    await fetchBitLifeVersion();
    await checkSourceOutdatedStatus();

    setupUIForMode(activeMode);
    attachToolContentListeners();

    if (ui.tabDecrypt) ui.tabDecrypt.addEventListener('click', () => setupUIForMode('decrypt'));
    if (ui.tabEncrypt) ui.tabEncrypt.addEventListener('click', () => setupUIForMode('encrypt'));
    if (ui.openSourceManagerButton) ui.openSourceManagerButton.addEventListener('click', openSourceManagerModal);
    if (ui.sourceManagerModalCloseButton) ui.sourceManagerModalCloseButton.addEventListener('click', closeSourceManagerModal);
    if (ui.sourceManagerAdvancedOptionsToggle && ui.sourceManagerAdvancedContent && ui.sourceManagerAdvancedIcon) {
        ui.sourceManagerAdvancedOptionsToggle.addEventListener('click', () => {
            const isExpanded = ui.sourceManagerAdvancedContent!.classList.toggle('expanded');
            ui.sourceManagerAdvancedIcon!.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }
    if (ui.loadNewSourceButton && ui.newSourceUrlInput) {
        ui.loadNewSourceButton.addEventListener('click', async () => {
            const newUrl = (ui.newSourceUrlInput as HTMLInputElement).value.trim();
            if (newUrl) {
                try {
                    const parsedUrl = new URL(newUrl);
                    setCurrentMonetizationVarsSourceURL(parsedUrl.href);
                    let sourceNameGuess = parsedUrl.hostname;
                    if (parsedUrl.hostname.includes('githubusercontent.com') && parsedUrl.pathname.split('/').length > 2) {
                        const pathParts = parsedUrl.pathname.split('/');
                        sourceNameGuess = `${pathParts[1]}/${pathParts[2]} (Raw)`;
                    }
                    setCurrentSourceInfo({
                        name: sourceNameGuess,
                        pfpImageUrl: '',
                        pfpFallbackText: sourceNameGuess.substring(0, 2).toUpperCase(),
                        url: parsedUrl.href,
                        statusMessage: "",
                        fetchedVersion: null
                    });
                    await checkSourceOutdatedStatus();
                    showToast(`Source updated to: ${sourceNameGuess}`, "success");
                } catch (e) {
                    showToast("Invalid URL.", "error");
                    console.error("Invalid URL:", e);
                }
            } else {
                setCurrentMonetizationVarsSourceURL(DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL);
                setCurrentSourceInfo(DEFAULT_SOURCE_INFO);
                await checkSourceOutdatedStatus();
                showToast("Source reverted to default.", "info");
            }
        });
    }
    if (ui.downloadOriginalButton) {
        ui.downloadOriginalButton.addEventListener('click', () => {
            window.open(ORIGINAL_GITHUB_RELEASE_DOWNLOAD_URL, '_blank');
            showToast("Original MonetizationVars download started.", "info");
            if (showFinalDownloadWarningPreference) {
                showStandardModal(ui.downloadFinalWarningModal);
            }
        });
    }
    if (ui.autoPatchButton) {
        ui.autoPatchButton.addEventListener('click', async () => {
            if (!ui.autoPatchLogContainer || !ui.autoPatchLog) {
                console.error("Log containers not found.");
                showError("Logging system error.");
                return;
            }
            ui.autoPatchLog.innerHTML = '';
            ui.autoPatchLogContainer.classList.add('hidden');
            ui.autoPatchCorsNotice!.classList.add('hidden');
            (ui.autoPatchButton as HTMLButtonElement).disabled = true;
            addLogToAutoPatcher("Starting auto-patch...", 'info');
            addLogToAutoPatcher(`Attempting to fetch from: ${DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL}`, 'info');
            try {
                const response = await fetch(DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL, {
                    cache: "no-store"
                });
                if (!response.ok) {
                    throw new Error(`Fetch failed (HTTP ${response.status}) for ${DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL}`);
                }
                const fetchedFileContent = await response.text();
                addLogToAutoPatcher("Content fetched.", 'success');
                addLogToAutoPatcher("Decrypting...", 'info');
                const effectiveKeyForAutoPatch = getEffectiveCipherKeyForOperation();
                let decryptedJson = await processMonetizationVarsContent(fetchedFileContent, 'decrypt', effectiveKeyForAutoPatch);
                addLogToAutoPatcher(`Decrypted with key: ${effectiveKeyForAutoPatch === DEFAULT_CIPHER_KEY ? 'Default' : 'Custom'}.`, 'success');
                addLogToAutoPatcher("Applying 'Unlock All' patch...", 'info');
                let changedByPatch = false;
                const tempJsonForPatch = JSON.parse(JSON.stringify(decryptedJson));
                for (const key in tempJsonForPatch) {
                    if (Object.hasOwnProperty.call(tempJsonForPatch, key)) {
                        if (tempJsonForPatch[key] === false) {
                            tempJsonForPatch[key] = true;
                            changedByPatch = true;
                        } else if (tempJsonForPatch[key] === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=") {
                            tempJsonForPatch[key] = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            changedByPatch = true;
                        }
                    }
                }
                if (changedByPatch) {
                    decryptedJson = tempJsonForPatch;
                    addLogToAutoPatcher("'Unlock All' applied.", 'success');
                } else {
                    addLogToAutoPatcher("No items needed 'Unlock All'.", 'info');
                }
                addLogToAutoPatcher("Re-encrypting...", 'info');
                const obfuscatedKey = getObfuscatedKey(effectiveKeyForAutoPatch);
                let encryptedFileContent = "";
                for (const key in decryptedJson) {
                    if (Object.hasOwnProperty.call(decryptedJson, key)) {
                        const value = decryptedJson[key];
                        const cipheredKey = xorAndBase64Encode(key, obfuscatedKey);
                        let valueToSerializeB64;
                        if (typeof value === 'boolean') {
                            valueToSerializeB64 = value ? "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=" : "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=";
                        } else if (typeof value === 'number' && Number.isInteger(value)) {
                            const encryptedIntB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            if (encryptedIntB64) {
                                valueToSerializeB64 = encryptedIntB64;
                            } else {
                                console.warn(`Failed to encrypt int for key ${key}`);
                                valueToSerializeB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            }
                        } else if (value === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=" || value === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAs=" || value === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=") {
                            valueToSerializeB64 = value;
                        } else {
                            valueToSerializeB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                        }
                        const cipheredValue = xorAndBase64Encode(valueToSerializeB64, obfuscatedKey);
                        encryptedFileContent += `${cipheredKey}:${cipheredValue}\n`;
                    }
                }
                addLogToAutoPatcher("Content re-encrypted.", 'success');
                addLogToAutoPatcher("Preparing download...", 'info');
                const blob = new Blob([encryptedFileContent.trimEnd()], {
                    type: 'application/octet-stream'
                });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = TARGET_ENCRYPTED_FILENAME;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                addLogToAutoPatcher(`Patched ${TARGET_ENCRYPTED_FILENAME} downloaded!`, 'success');
                if (showFinalDownloadWarningPreference) {
                    showStandardModal(ui.downloadFinalWarningModal);
                }
            } catch (error: any) {
                console.error("Auto-patch error:", error);
                addLogToAutoPatcher(`Error: ${error.message}`, 'error');
                showToast(`Auto-patch failed: ${error.message}`, 'error');
                if (ui.autoPatchCorsNotice) {
                    ui.autoPatchCorsNotice.textContent = `Failed to fetch the MonetizationVars file from the source. This could be due to a network issue, the server being temporarily unavailable, or a CORS policy on the remote server if using a custom URL. Please check your internet connection and the source URL (${DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL}). You can try the 'Download Original' button or manually provide the file.`;
                    ui.autoPatchCorsNotice.classList.remove('hidden');
                }
            } finally {
                if (ui.autoPatchButton)(ui.autoPatchButton as HTMLButtonElement).disabled = false;
            }
        });
    }
    if (ui.unlockAllButton) {
        ui.unlockAllButton.addEventListener('click', () => {
            if (!currentJsonObject) {
                if (!ui.jsonOutput) {
                    showError("Internal Error: Output area missing (ERR_UAB_JSO_UNDEF_1).");
                    return;
                }
                try {
                    if ((ui.jsonOutput as HTMLTextAreaElement).value) setCurrentJsonObject(JSON.parse((ui.jsonOutput as HTMLTextAreaElement).value));
                    else {
                        showError("No JSON data to process.");
                        return;
                    }
                } catch (e) {
                    showError("Invalid JSON in textarea.");
                    return;
                }
            }
            if (!currentJsonObject) {
                showError("No JSON data to process.");
                return;
            }
            try {
                let changed = false;
                const tempJson = JSON.parse(JSON.stringify(currentJsonObject));
                for (const key in tempJson) {
                    if (Object.hasOwnProperty.call(tempJson, key)) {
                        if (tempJson[key] === false) {
                            tempJson[key] = true;
                            changed = true;
                        } else if (tempJson[key] === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=") {
                            tempJson[key] = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    setCurrentJsonObject(tempJson);
                    if (!ui.jsonOutput) {
                        showError("Internal Error: Output area missing (ERR_UAB_JSO_UNDEF_2).");
                        return;
                    }
                    (ui.jsonOutput as HTMLTextAreaElement).value = JSON.stringify(currentJsonObject, null, 2);
                    if (activeMode === 'decrypt') setStateForDecrypt({ ...stateForDecrypt,
                        jsonObject: currentJsonObject
                    });
                    else setStateForEncrypt({ ...stateForEncrypt,
                        jsonObject: currentJsonObject
                    });
                    showToast("Unlocked all applicable items.", "success");
                } else {
                    showToast("No items changed by 'Unlock All'.", "info");
                }
            } catch (e: any) {
                showError("Error during 'Unlock All': " + e.message);
                console.error("Unlock all error:", e);
            }
        });
    }
    if (ui.copyJsonButton) {
        ui.copyJsonButton.addEventListener('click', () => {
            if (!ui.jsonOutput || !(ui.jsonOutput as HTMLTextAreaElement).value) {
                showToast("No JSON to copy.", "info");
                return;
            }
            (ui.jsonOutput as HTMLTextAreaElement).select();
            (ui.jsonOutput as HTMLTextAreaElement).setSelectionRange(0, 99999);
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showToast('JSON copied!', 'success');
                } else {
                    console.error('execCommand("copy") failed.');
                    showToast('Failed to copy. Try manual.', 'error');
                }
            } catch (err) {
                console.error('execCommand("copy") error: ', err);
                showToast('Failed to copy. Browser issue.', 'error');
            }
        });
    }
    if (ui.downloadDecryptedJsonButton) {
        ui.downloadDecryptedJsonButton.addEventListener('click', () => {
            if (!ui.jsonOutput || !(ui.jsonOutput as HTMLTextAreaElement).value) {
                showToast("No JSON to download.", "info");
                return;
            }
            try {
                const jsonString = (ui.jsonOutput as HTMLTextAreaElement).value;
                JSON.parse(jsonString);
                const blob = new Blob([jsonString], {
                    type: 'application/json;charset=utf-8'
                });
                let baseDlFilename = (stateForDecrypt.inputFileName && stateForDecrypt.inputFileName !== 'file') ? stateForDecrypt.inputFileName : 'decrypted_data';
                const finalBase = baseDlFilename.includes('.') ? baseDlFilename.substring(0, baseDlFilename.lastIndexOf('.')) : baseDlFilename;
                const downloadFileName = `${finalBase}_decrypted.json`;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = downloadFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                showToast('Decrypted JSON download started.', 'success');
            } catch (err) {
                showError('Invalid JSON in textarea.');
                console.error("Download decrypted error:", err);
            }
        });
    }
    if (ui.downloadEncryptedButton) {
        ui.downloadEncryptedButton.addEventListener('click', () => {
            let jsonToEncrypt = currentJsonObject;
            if (!jsonToEncrypt) {
                if (!ui.jsonOutput) {
                    showError("Internal Error: Output area missing (ERR_DEB_JSO_UNDEF).");
                    return;
                }
                try {
                    if ((ui.jsonOutput as HTMLTextAreaElement).value) jsonToEncrypt = JSON.parse((ui.jsonOutput as HTMLTextAreaElement).value);
                    else {
                        showError("No JSON to encrypt.");
                        return;
                    }
                } catch (e) {
                    showError("Invalid JSON in textarea.");
                    return;
                }
            }
            if (!jsonToEncrypt) {
                showError("No JSON to encrypt.");
                return;
            }
            try {
                const effectiveKeyForEncrypt = getEffectiveCipherKeyForOperation();
                const obfuscatedKey = getObfuscatedKey(effectiveKeyForEncrypt);
                let varFileContent = "";
                for (const key in jsonToEncrypt) {
                    if (Object.hasOwnProperty.call(jsonToEncrypt, key)) {
                        const value = jsonToEncrypt[key];
                        const cipheredKey = xorAndBase64Encode(key, obfuscatedKey);
                        let valueToSerializeB64;
                        if (typeof value === 'boolean') {
                            valueToSerializeB64 = value ? "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=" : "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=";
                        } else if (typeof value === 'number' && Number.isInteger(value)) {
                            const encryptedIntB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            if (encryptedIntB64) {
                                valueToSerializeB64 = encryptedIntB64;
                            } else {
                                console.warn(`Failed to encrypt int for key ${key}`);
                                valueToSerializeB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                            }
                        } else if (value === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=" || value === "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1EUQABAAw=") {
                            valueToSerializeB64 = value;
                        } else {
                            valueToSerializeB64 = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
                        }
                        const cipheredValue = xorAndBase64Encode(valueToSerializeB64, obfuscatedKey);
                        varFileContent += `${cipheredKey}:${cipheredValue}\n`;
                    }
                }
                const blob = new Blob([varFileContent.trimEnd()], {
                    type: 'application/octet-stream'
                });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = TARGET_ENCRYPTED_FILENAME;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                if (showFinalDownloadWarningPreference) {
                    showStandardModal(ui.downloadFinalWarningModal);
                }
                showToast(`Encrypted ${TARGET_ENCRYPTED_FILENAME} downloaded.`, 'success');
            } catch (e: any) {
                showError("Error encrypting: " + e.message);
                console.error("Download encrypted error:", e);
            }
        });
    }
    if (ui.modalCloseButton) ui.modalCloseButton.addEventListener('click', () => hideStandardModal(ui.flowchartModal));
    if (ui.wrongFileNameModalCloseButton) ui.wrongFileNameModalCloseButton.addEventListener('click', () => hideStandardModal(ui.wrongFileNameModal));
    if (ui.wrongFileNameOkButton) ui.wrongFileNameOkButton.addEventListener('click', () => hideStandardModal(ui.wrongFileNameModal));
    if (ui.downloadFinalWarningModalCloseButton) {
        ui.downloadFinalWarningModalCloseButton.addEventListener('click', () => {
            hideStandardModal(ui.downloadFinalWarningModal);
            if (ui.dontShowFinalWarningAgain && (ui.dontShowFinalWarningAgain as HTMLInputElement).checked) {
                try {
                    localStorage.setItem(HIDE_FINAL_DOWNLOAD_WARNING_KEY, 'true');
                    setShowFinalDownloadWarningPreference(false);
                } catch (e) {
                    console.warn("Could not save pref.", e);
                }
            }
        });
    }
    if (ui.downloadFinalWarningOkButton) {
        ui.downloadFinalWarningOkButton.addEventListener('click', () => {
            hideStandardModal(ui.downloadFinalWarningModal);
            if (ui.dontShowFinalWarningAgain && (ui.dontShowFinalWarningAgain as HTMLInputElement).checked) {
                try {
                    localStorage.setItem(HIDE_FINAL_DOWNLOAD_WARNING_KEY, 'true');
                    setShowFinalDownloadWarningPreference(false);
                } catch (e) {
                    console.warn("Could not save pref.", e);
                }
            }
        });
    }
    if (ui.importantNotesToggleButton && ui.importantNotesContentWrapper && ui.importantNotesIconSvg) {
        ui.importantNotesToggleButton.setAttribute('aria-expanded', 'false');
        ui.importantNotesIconSvg.style.transform = 'rotate(0deg)';
        ui.importantNotesToggleButton.addEventListener('click', () => {
            const isCurrentlyExpanded = ui.importantNotesContentWrapper!.style.maxHeight !== '0px';
            if (isCurrentlyExpanded) {
                ui.importantNotesContentWrapper!.style.maxHeight = '0';
                ui.importantNotesContentWrapper!.style.opacity = '0';
                ui.importantNotesToggleButton!.setAttribute('aria-expanded', 'false');
                ui.importantNotesIconSvg!.style.transform = 'rotate(0deg)';
            } else {
                const scrollHeight = ui.importantNotesContentWrapper!.scrollHeight;
                ui.importantNotesContentWrapper!.style.maxHeight = scrollHeight + 'px';
                ui.importantNotesContentWrapper!.style.opacity = '1';
                ui.importantNotesToggleButton!.setAttribute('aria-expanded', 'true');
                ui.importantNotesIconSvg!.style.transform = 'rotate(180deg)';
            }
        });
    }
    window.addEventListener('click', (event) => {
        if (event.target === ui.flowchartModal) hideStandardModal(ui.flowchartModal);
        if (event.target === ui.downloadFinalWarningModal) hideStandardModal(ui.downloadFinalWarningModal);
        if (event.target === ui.sourceManagerModal) closeSourceManagerModal();
        if (event.target === ui.wrongFileNameModal) hideStandardModal(ui.wrongFileNameModal);
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log('New content is available and will be used when all tabs for this scope are closed, or on next reload if SKIP_WAITING is triggered.');
                                    } else {
                                        console.log('Content is cached for offline use.');
                                    }
                                }
                            };
                        }
                    };
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'SW_ACTIVATED') {
                    console.log('Service worker activated, reloading page for update.');
                    window.location.reload();
                }
            });
        });
    }
});
