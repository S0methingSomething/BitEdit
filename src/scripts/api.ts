import {
    APP_VERSION_CHECK_URL,
    BITLIFE_VERSION_TXT_URL,
    CURRENT_APP_VERSION,
    DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL,
    GITHUB_API_LATEST_TAG_URL,
    LAST_SUCCESSFUL_UPDATE_CHECK_KEY,
    ONE_DAY_MS
} from './constants';
import {
    currentMonetizationVarsSourceURL,
    currentSourceInfo,
    setVersionFromTxt,
    versionFromTxt
} from './state';
import {
    ui,
    updateSourceManagerDisplay
} from './ui';

function compareVersions(v1: string, v2: string) {
    if (!v1 || !v2) return 0;
    const normalize = (v: string) => String(v).trim().startsWith('v') ? String(v).trim().substring(1) : String(v).trim();
    const parts1 = normalize(v1).split('.').map(p => parseInt(p, 10));
    const parts2 = normalize(v2).split('.').map(p => parseInt(p, 10));
    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (Number.isNaN(p1) || Number.isNaN(p2)) return 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

export async function checkForAppUpdate() {
    if (!ui.updateAvailableBanner) return;
    ui.updateAvailableBanner.style.display = 'none';
    ui.updateAvailableBanner.classList.remove('update-check-failed');


    try {
        const response = await fetch(APP_VERSION_CHECK_URL, {
            cache: "no-store"
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} fetching app version from ${APP_VERSION_CHECK_URL}`);
        }
        const latestVersionText = (await response.text()).trim();
        const latestVersionMatch = latestVersionText.match(/^(v)?(\d+\.\d+\.\d+(\.\d+)?)$/);

        if (latestVersionMatch && latestVersionMatch[2]) {
            const normalizedLatestVersion = latestVersionMatch[2];
            localStorage.setItem(LAST_SUCCESSFUL_UPDATE_CHECK_KEY, Date.now().toString());

            if (compareVersions(normalizedLatestVersion, CURRENT_APP_VERSION) > 0) {
                ui.updateAvailableBanner.innerHTML = `Update to ${normalizedLatestVersion} available! <button id="refresh-update-button">Refresh to Update</button>`;
                ui.updateAvailableBanner.style.display = 'block';
                const refreshButton = document.getElementById('refresh-update-button');
                if (refreshButton) {
                    refreshButton.addEventListener('click', () => {
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.getRegistration().then(reg => {
                                if (reg && reg.waiting) {
                                    reg.waiting.postMessage({
                                        type: 'SKIP_WAITING'
                                    });
                                }
                                window.location.reload();
                            });
                        } else {
                            window.location.reload();
                        }
                    });
                }
            } else {
                console.log(`App is up to date (Current: ${CURRENT_APP_VERSION}, Latest on server: ${normalizedLatestVersion})`);
                ui.updateAvailableBanner.style.display = 'none';
            }
        } else {
            throw new Error(`Invalid version format in BitEdit_version.txt: "${latestVersionText}"`);
        }
    } catch (error) {
        console.error('Error checking for app update:', error);
        ui.updateAvailableBanner.textContent = 'Could not check for updates. Try refreshing later.';
        ui.updateAvailableBanner.classList.add('update-check-failed');
        ui.updateAvailableBanner.style.display = 'block';

        const lastCheck = localStorage.getItem(LAST_SUCCESSFUL_UPDATE_CHECK_KEY);
        if (lastCheck && (Date.now() - parseInt(lastCheck, 10) > ONE_DAY_MS)) {
            ui.updateAvailableBanner.textContent += ' (Checks failing for >1 day)';
        }
    }
}

export async function fetchBitLifeVersion() {
    if (!ui.bitlifeVersion) {
        console.error("ui.bitlifeVersion not defined in fetchBitLifeVersion.");
        return null;
    }
    try {
        const response = await fetch(BITLIFE_VERSION_TXT_URL, {
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const versionText = (await response.text()).trim();
        setVersionFromTxt(versionText);
        ui.bitlifeVersion.textContent = versionFromTxt;
        if (ui.modalBitlifeVersionDynamic) ui.modalBitlifeVersionDynamic.textContent = versionFromTxt;
        return versionFromTxt;
    } catch (error) {
        console.error('Failed to fetch BitLife version.txt:', error);
        if (ui.bitlifeVersion) ui.bitlifeVersion.textContent = 'Error';
        if (ui.modalBitlifeVersionDynamic) ui.modalBitlifeVersionDynamic.textContent = 'Error';
        setVersionFromTxt(null);
        return null;
    }
}

export async function checkSourceOutdatedStatus() {
    currentSourceInfo.fetchedVersion = null;
    if (ui.sourceFetchedVersionMessage) ui.sourceFetchedVersionMessage.classList.add('hidden');

    if (!versionFromTxt) {
        console.log("BitLife version (version.txt) not fetched yet, status check deferred.");
        currentSourceInfo.statusMessage = "(BitLife version unknown)";
        updateSourceManagerDisplay(currentSourceInfo);
        return;
    }
    if (currentMonetizationVarsSourceURL !== DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL) {
        currentSourceInfo.statusMessage = "(Custom source, version status unknown)";
        updateSourceManagerDisplay(currentSourceInfo);
        return;
    }

    try {
        const response = await fetch(GITHUB_API_LATEST_TAG_URL, {
            cache: "no-store"
        });
        if (!response.ok) {
            console.warn(`GitHub API for BitEdit release notes failed: ${response.status}`);
            currentSourceInfo.statusMessage = "(Could not verify BitEdit release notes)";
            updateSourceManagerDisplay(currentSourceInfo);
            return;
        }
        const releaseData = await response.json();
        const releaseBody = releaseData.body || "";
        const versionRegex = /(?:for BitLife\s*v?|compatible with BitLife\s*v?|BitLife version\s*v?)(\d+\.\d+(?:\.\d+)?)/i;
        const match = releaseBody.match(versionRegex);

        if (match && match[1]) {
            const versionFromReleaseNotes = match[1];
            currentSourceInfo.fetchedVersion = versionFromReleaseNotes;
            if (ui.sourceFetchedVersionMessage) {
                ui.sourceFetchedVersionMessage.textContent = `Default source is for BitLife v${versionFromReleaseNotes}`;
                ui.sourceFetchedVersionMessage.classList.remove('hidden');
            }
            const comparisonResult = compareVersions(versionFromTxt, versionFromReleaseNotes);
            if (comparisonResult === 1) {
                currentSourceInfo.statusMessage = `OUTDATED (Current BitLife: v${versionFromTxt})`;
            } else if (comparisonResult === -1) {
                currentSourceInfo.statusMessage = `POTENTIALLY NEWER (Current BitLife: v${versionFromTxt})`;
            } else {
                currentSourceInfo.statusMessage = `COMPATIBLE (v${versionFromReleaseNotes})`;
            }
        } else {
            console.warn("Could not parse BitLife version from BitEdit release notes body. Ensure description contains 'For BitLife vX.Y.Z' or similar. Body received:", releaseBody);
            currentSourceInfo.statusMessage = "(Release notes for default source do not specify BitLife version in expected format)";
            if (ui.sourceFetchedVersionMessage) ui.sourceFetchedVersionMessage.classList.add('hidden');
        }
    } catch (error) {
        console.error("Error checking BitEdit release notes:", error);
        currentSourceInfo.statusMessage = "(Error checking source compatibility)";
    }
    updateSourceManagerDisplay(currentSourceInfo);
}
