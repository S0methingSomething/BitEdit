export const CURRENT_APP_VERSION = "v1.6.0";
export const DEFAULT_CIPHER_KEY = "com.wtfapps.apollo16";
export const B64_NET_BOOLEAN_TRUE_STANDARD = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAQs=";
export const B64_NET_BOOLEAN_TRUE_VARIANT  = "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAs=";
export const B64_NET_BOOLEAN_FALSE_STANDARD= "AAEAAAD/////AQAAAAAAAAAEAQAAAA5TeXN0ZW0uQm9vbGVhbgEAAAAHbV92YWx1ZQABAAw=";
export const USER_SERIALIZED_INT32_PREFIX = new Uint8Array([0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 4, 1, 0, 0, 0, 12, 83, 121, 115, 116, 101, 109, 46, 73, 110, 116, 51, 50, 1, 0, 0, 0, 7, 109, 95, 118, 97, 108, 117, 101, 0, 8]);
export const USER_SERIALIZED_INT32_SUFFIX = new Uint8Array([11]);
export const USER_INT32_VALUE_OFFSET = 48;
export const USER_SERIALIZED_INT32_TOTAL_LENGTH = USER_SERIALIZED_INT32_PREFIX.length + 4 + USER_SERIALIZED_INT32_SUFFIX.length;
export const TARGET_ENCRYPTED_FILENAME = "MonetizationVars";
export const HIDE_FINAL_DOWNLOAD_WARNING_KEY = 'bitEditHideFinalDownloadWarning';
export const DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL = "https://raw.githubusercontent.com/S0methingSomething/BitEdit/refs/heads/main/MonetizationVars.txt";
export const GITHUB_API_LATEST_TAG_URL = "https://api.github.com/repos/S0methingSomething/BitEdit/releases/tags/Latest";
export const ORIGINAL_GITHUB_RELEASE_DOWNLOAD_URL = "https://github.com/S0methingSomething/BitEdit/releases/download/Latest/MonetizationVars";
export const BITLIFE_VERSION_TXT_URL = '/version.txt';
export const APP_VERSION_CHECK_URL = '/BitEdit_version.txt';
export const LAST_SUCCESSFUL_UPDATE_CHECK_KEY = 'bitEditLastSuccessfulUpdateCheck';
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_SOURCE_INFO = {
    name: "S0methingSomething",
    pfpImageUrl: "https://avatars.githubusercontent.com/S0methingSomething?v=4&s=128",
    pfpFallbackText: "S0",
    url: DEFAULT_RAW_MONETIZATIONVARS_SOURCE_URL,
    statusMessage: "",
    fetchedVersion: null
};

export const obfCharMap: { [key: number]: number } = {0x61:0x7a,0x62:0x6d,0x63:0x79,0x64:0x6c,0x65:0x78,0x66:0x6b,0x67:0x77,0x68:0x6a,0x69:0x76,0x6a:0x69,0x6b:0x75,0x6c:0x68,0x6d:0x74,0x6e:0x67,0x6f:0x73,0x70:0x66,0x71:0x72,0x72:0x65,0x73:0x71,0x74:0x64,0x75:0x70,0x76:0x63,0x77:0x6f,0x78:0x62,0x79:0x6e,0x7a:0x61};
