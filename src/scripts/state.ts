import { DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL, DEFAULT_SOURCE_INFO } from './constants';

export let activeMode = 'decrypt';
export let currentJsonObject: any = null;
export let stateForDecrypt = { inputFileName: 'file', fileContent: null, jsonObject: null };
export let stateForEncrypt = { inputFileName: 'file', fileContent: null, jsonObject: null };
export let showFinalDownloadWarningPreference: boolean;
export let versionFromTxt: string | null = null;
export let currentMonetizationVarsSourceURL = DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL;
export let currentSourceInfo = JSON.parse(JSON.stringify(DEFAULT_SOURCE_INFO));

export function setActiveMode(mode: string) {
    activeMode = mode;
}

export function setCurrentJsonObject(json: any) {
    currentJsonObject = json;
}

export function setStateForDecrypt(state: any) {
    stateForDecrypt = state;
}

export function setStateForEncrypt(state: any) {
    stateForEncrypt = state;
}

export function setShowFinalDownloadWarningPreference(value: boolean) {
    showFinalDownloadWarningPreference = value;
}

export function setVersionFromTxt(version: string | null) {
    versionFromTxt = version;
}

export function setCurrentMonetizationVarsSourceURL(url: string) {
    currentMonetizationVarsSourceURL = url;
}

export function setCurrentSourceInfo(info: any) {
    currentSourceInfo = info;
}
