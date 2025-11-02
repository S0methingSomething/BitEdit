import {
    B64_NET_BOOLEAN_FALSE_STANDARD,
    B64_NET_BOOLEAN_TRUE_STANDARD,
    B64_NET_BOOLEAN_TRUE_VARIANT,
    DEFAULT_CIPHER_KEY,
    obfCharMap,
    USER_SERIALIZED_INT32_PREFIX,
    USER_SERIALIZED_INT32_SUFFIX,
    USER_SERIALIZED_INT32_TOTAL_LENGTH
} from './constants';

function arraysEqual(a: Uint8Array, b: Uint8Array) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function getObfuscatedKey(key: string) {
    let oKey = "";
    for (const char of key.toLowerCase()) {
        const c = char.charCodeAt(0);
        oKey += String.fromCharCode(obfCharMap[c] || c);
    }
    return oKey;
}

function utf8StringToBase64(str: string) {
    try {
        const uBytes = new TextEncoder().encode(str);
        const binStr = String.fromCharCode.apply(null, uBytes as any);
        return btoa(binStr);
    } catch (e) {
        console.error("utf8StringToBase64 failed:", e);
        throw new Error("Base64 encode error.");
    }
}

function base64ToUtf8String(b64: string) {
    try {
        const binStr = atob(b64);
        const uBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
            uBytes[i] = binStr.charCodeAt(i);
        }
        return new TextDecoder("utf-8", {
            fatal: true
        }).decode(uBytes);
    } catch (e: any) {
        console.error("base64ToUtf8String failed:", e);
        if (e.name === 'InvalidCharacterError') throw new Error("Invalid Base64.");
        else if (e.message.includes("decode")) throw new Error("Invalid UTF-8 in Base64.");
        throw new Error("Base64 process error.");
    }
}

export function xorAndBase64Encode(txt: string, key: string) {
    let x = "";
    for (let i = 0; i < txt.length; i++) {
        x += String.fromCharCode(txt.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return utf8StringToBase64(x);
}

export function base64DecodeAndXOR(b64: string, key: string) {
    let dec;
    try {
        dec = base64ToUtf8String(b64);
    } catch (e) {
        throw e;
    }
    let x = "";
    for (let i = 0; i < dec.length; i++) {
        x += String.fromCharCode(dec.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return x;
}

export function decryptInt(base64String: string) {
    try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        if (bytes.length !== USER_SERIALIZED_INT32_TOTAL_LENGTH) return null;
        const prefixBytesFromFile = bytes.slice(0, USER_SERIALIZED_INT32_PREFIX.length);
        const suffixByteFromFile = bytes[bytes.length - 1];
        if (!arraysEqual(prefixBytesFromFile, USER_SERIALIZED_INT32_PREFIX) || suffixByteFromFile !== USER_SERIALIZED_INT32_SUFFIX[0]) return null;
        const dataView = new DataView(bytes.buffer, bytes.byteOffset + USER_SERIALIZED_INT32_PREFIX.length, 4);
        return dataView.getInt32(0, true);
    } catch (e) {
        return null;
    }
}

export function encryptInt(value: number) {
    if (typeof value !== 'number' || !Number.isInteger(value)) return null;
    const valueBuffer = new ArrayBuffer(4);
    const dataView = new DataView(valueBuffer);
    dataView.setInt32(0, value, true);
    const valueBytes = Array.from(new Uint8Array(valueBuffer));
    const fullByteArray = new Uint8Array(USER_SERIALIZED_INT32_TOTAL_LENGTH);
    fullByteArray.set(USER_SERIALIZED_INT32_PREFIX, 0);
    fullByteArray.set(new Uint8Array(valueBytes), USER_SERIALIZED_INT32_PREFIX.length);
    fullByteArray.set(USER_SERIALIZED_INT32_SUFFIX, USER_SERIALIZED_INT32_PREFIX.length + 4);
    let binaryString = '';
    fullByteArray.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
}

export async function processMonetizationVarsContent(fileContent: string, operationMode: string, cipherKeyStr: string) {
    const effectiveCipherKey = cipherKeyStr || DEFAULT_CIPHER_KEY;
    const obfuscatedKey = getObfuscatedKey(effectiveCipherKey);
    let processedJsonObject;
    if (operationMode === 'decrypt') {
        const itemMap: {
            [key: string]: any
        } = {};
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            const parts = line.split(/:(.+)/);
            if (parts.length < 2 || !parts[1]) {
                console.warn("Malformed line (missing or empty value):", line);
                continue;
            }
            const encKey = parts[0].trim();
            const encVal = parts[1].trim();
            try {
                const decKey = base64DecodeAndXOR(encKey, obfuscatedKey);
                const decValB64 = base64DecodeAndXOR(encVal, obfuscatedKey);
                if (decValB64 === B64_NET_BOOLEAN_TRUE_STANDARD || decValB64 === B64_NET_BOOLEAN_TRUE_VARIANT) {
                    itemMap[decKey] = true;
                } else if (decValB64 === B64_NET_BOOLEAN_FALSE_STANDARD) {
                    itemMap[decKey] = false;
                } else {
                    const intValue = decryptInt(decValB64);
                    if (intValue !== null) {
                        itemMap[decKey] = intValue;
                    } else {
                        itemMap[decKey] = decValB64;
                    }
                }
            } catch (e: any) {
                console.error("Error processing line:", line, e);
                throw new Error(`Decryption/decoding error. Check key/file. Line: ${line.substring(0,30)}...`);
            }
        }
        processedJsonObject = itemMap;
    } else {
        processedJsonObject = JSON.parse(fileContent);
    }
    return processedJsonObject;
}
