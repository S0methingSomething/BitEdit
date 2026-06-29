import {
  OBF_CHAR_MAP,
  USER_SERIALIZED_INT32_PREFIX,
  USER_SERIALIZED_INT32_SUFFIX,
  USER_SERIALIZED_INT32_TOTAL_LENGTH,
  B64_NET_BOOLEAN_TRUE,
  B64_NET_BOOLEAN_FALSE,
  B64_NET_BOOLEAN_FALSE_LEGACY
} from './constants'

export function globalBtoa(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str)
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < str.length; i += 3) {
    const char1 = str.charCodeAt(i)
    const char2 = str.charCodeAt(i + 1)
    const char3 = str.charCodeAt(i + 2)

    const byte1 = char1 !== undefined && !Number.isNaN(char1) ? char1 : 0
    const byte2 = char2 !== undefined && !Number.isNaN(char2) ? char2 : 0
    const byte3 = char3 !== undefined && !Number.isNaN(char3) ? char3 : 0

    const chunk = (byte1 << 16) | (byte2 << 8) | byte3

    result += chars[(chunk >> 18) & 63] ?? ''
    result += chars[(chunk >> 12) & 63] ?? ''
    result += char2 !== undefined && !Number.isNaN(char2) ? (chars[(chunk >> 6) & 63] ?? '') : '='
    result += char3 !== undefined && !Number.isNaN(char3) ? (chars[chunk & 63] ?? '') : '='
  }
  return result
}

export function globalAtob(b64: string): string {
  if (typeof atob === 'function') {
    return atob(b64)
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i)
    if (code !== undefined) {
      lookup[code] = i
    }
  }
  let bufferLength = b64.length * 0.75
  if (b64[b64.length - 1] === '=') {
    bufferLength--
    if (b64[b64.length - 2] === '=') {
      bufferLength--
    }
  }
  const bytes = new Uint8Array(bufferLength)
  let p = 0
  for (let i = 0; i < b64.length; i += 4) {
    const code0 = b64.charCodeAt(i)
    const code1 = b64.charCodeAt(i + 1)
    const code2 = b64.charCodeAt(i + 2)
    const code3 = b64.charCodeAt(i + 3)

    const encoded1 = code0 !== undefined ? (lookup[code0] ?? 0) : 0
    const encoded2 = code1 !== undefined ? (lookup[code1] ?? 0) : 0
    const encoded3 = code2 !== undefined ? (lookup[code2] ?? 0) : 0
    const encoded4 = code3 !== undefined ? (lookup[code3] ?? 0) : 0

    const val1 = (encoded1 << 2) | (encoded2 >> 4)
    if (p < bufferLength) {
      bytes[p] = val1
      p++
    }
    const val2 = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    if (p < bufferLength) {
      bytes[p] = val2
      p++
    }
    const val3 = ((encoded3 & 3) << 6) | (encoded4 & 63)
    if (p < bufferLength) {
      bytes[p] = val3
      p++
    }
  }
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b !== undefined) {
      result += String.fromCharCode(b)
    }
  }
  return result
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function getObfuscatedKey(key: string): string {
  let oKey = ''
  for (const char of key.toLowerCase()) {
    const c = char.charCodeAt(0)
    oKey += String.fromCharCode(OBF_CHAR_MAP[c] ?? c)
  }
  return oKey
}

export function utf8StringToBase64(str: string): string {
  try {
    const uBytes = new TextEncoder().encode(str)
    let binStr = ''
    for (const byte of uBytes) {
      binStr += String.fromCharCode(byte)
    }
    return globalBtoa(binStr)
  } catch (e: unknown) {
    console.error('utf8StringToBase64 failed:', e)
    throw new Error('Base64 encode error.', { cause: e })
  }
}

export function base64ToUtf8String(b64: string): string {
  try {
    const binStr = globalAtob(b64)
    const uBytes = new Uint8Array(binStr.length)
    for (let i = 0; i < binStr.length; i++) {
      const code = binStr.charCodeAt(i)
      if (code !== undefined) {
        uBytes[i] = code
      }
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(uBytes)
  } catch (e: unknown) {
    console.error('base64ToUtf8String failed:', e)
    if (e instanceof Error && e.name === 'InvalidCharacterError') {
      throw new Error('Invalid Base64.', { cause: e })
    }
    if (e instanceof Error && e.message.includes('decode')) {
      throw new Error('Invalid UTF-8 in Base64.', { cause: e })
    }
    throw new Error('Base64 process error.', { cause: e })
  }
}

export function xorAndBase64Encode(txt: string, key: string): string {
  let x = ''
  for (let i = 0; i < txt.length; i++) {
    const charCode = txt.charCodeAt(i)
    const keyCharCode = key.charCodeAt(i % key.length)
    if (charCode !== undefined && keyCharCode !== undefined) {
      x += String.fromCharCode(charCode ^ keyCharCode)
    }
  }
  return utf8StringToBase64(x)
}

export function base64DecodeAndXOR(b64: string, key: string): string {
  const dec = base64ToUtf8String(b64)
  let x = ''
  for (let i = 0; i < dec.length; i++) {
    const charCode = dec.charCodeAt(i)
    const keyCharCode = key.charCodeAt(i % key.length)
    if (charCode !== undefined && keyCharCode !== undefined) {
      x += String.fromCharCode(charCode ^ keyCharCode)
    }
  }
  return x
}

export function decryptInt(base64String: string): number | null {
  try {
    const binaryString = globalAtob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      const code = binaryString.charCodeAt(i)
      if (code !== undefined) {
        bytes[i] = code
      }
    }
    if (bytes.length !== USER_SERIALIZED_INT32_TOTAL_LENGTH) return null
    const prefixBytesFromFile = bytes.slice(0, USER_SERIALIZED_INT32_PREFIX.length)
    const suffixByteFromFile = bytes[bytes.length - 1]
    if (suffixByteFromFile === undefined) return null
    if (
      !arraysEqual(prefixBytesFromFile, USER_SERIALIZED_INT32_PREFIX) ||
      suffixByteFromFile !== USER_SERIALIZED_INT32_SUFFIX[0]
    ) {
      return null
    }
    const dataView = new DataView(
      bytes.buffer,
      bytes.byteOffset + USER_SERIALIZED_INT32_PREFIX.length,
      4
    )
    return dataView.getInt32(0, true)
  } catch {
    return null
  }
}

export function encryptInt(value: number): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  const valueBuffer = new ArrayBuffer(4)
  const dataView = new DataView(valueBuffer)
  dataView.setInt32(0, value, true)
  const valueBytes = Array.from(new Uint8Array(valueBuffer))
  const fullByteArray = new Uint8Array(USER_SERIALIZED_INT32_TOTAL_LENGTH)
  fullByteArray.set(USER_SERIALIZED_INT32_PREFIX, 0)
  fullByteArray.set(new Uint8Array(valueBytes), USER_SERIALIZED_INT32_PREFIX.length)
  fullByteArray.set(USER_SERIALIZED_INT32_SUFFIX, USER_SERIALIZED_INT32_PREFIX.length + 4)
  let binaryString = ''
  for (const byte of fullByteArray) {
    binaryString += String.fromCharCode(byte)
  }
  return globalBtoa(binaryString)
}

export function decryptMonetizationVars(
  fileContent: string,
  cipherKey: string
): Record<string, boolean | number | string> {
  const obfuscatedKey = getObfuscatedKey(cipherKey)
  const itemMap: Record<string, boolean | number | string> = {}
  const lines = fileContent.split('\n').filter((line) => line.trim() !== '')

  for (const line of lines) {
    const parts = line.split(/:(.+)/)
    const firstPart = parts[0]
    const secondPart = parts[1]
    if (parts.length < 2 || !firstPart || !secondPart) {
      console.warn('Malformed line (missing or empty value):', line)
      continue
    }
    const encKey = firstPart.trim()
    const encVal = secondPart.trim()

    try {
      const decKey = base64DecodeAndXOR(encKey, obfuscatedKey)
      const decValB64 = base64DecodeAndXOR(encVal, obfuscatedKey)

      if (decValB64 === B64_NET_BOOLEAN_TRUE) {
        itemMap[decKey] = true
      } else if (
        decValB64 === B64_NET_BOOLEAN_FALSE ||
        decValB64 === B64_NET_BOOLEAN_FALSE_LEGACY
      ) {
        itemMap[decKey] = false
      } else {
        const intValue = decryptInt(decValB64)
        if (intValue !== null) {
          itemMap[decKey] = intValue
        } else {
          itemMap[decKey] = decValB64
        }
      }
    } catch (e: unknown) {
      console.error('Error processing line:', line, e)
      throw new Error(
        `Decryption/decoding error. Check key/file. Line: ${line.substring(0, 30)}...`,
        { cause: e }
      )
    }
  }

  return itemMap
}

export function encryptMonetizationVars(
  jsonObject: Record<string, boolean | number | string>,
  cipherKey: string
): string {
  const obfuscatedKey = getObfuscatedKey(cipherKey)
  let varFileContent = ''

  for (const key in jsonObject) {
    if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
      const value = jsonObject[key]
      if (value === undefined) continue
      const cipheredKey = xorAndBase64Encode(key, obfuscatedKey)
      let valueToSerializeB64: string

      if (typeof value === 'boolean') {
        valueToSerializeB64 = value ? B64_NET_BOOLEAN_TRUE : B64_NET_BOOLEAN_FALSE
      } else if (typeof value === 'number') {
        const encryptedIntB64 = encryptInt(value)
        if (encryptedIntB64) {
          valueToSerializeB64 = encryptedIntB64
        } else {
          valueToSerializeB64 = utf8StringToBase64(String(value))
        }
      } else if (
        value === B64_NET_BOOLEAN_TRUE ||
        value === B64_NET_BOOLEAN_FALSE ||
        value === B64_NET_BOOLEAN_FALSE_LEGACY
      ) {
        valueToSerializeB64 = value
      } else {
        valueToSerializeB64 = utf8StringToBase64(String(value))
      }

      const cipheredValue = xorAndBase64Encode(valueToSerializeB64, obfuscatedKey)
      varFileContent += `${cipheredKey}:${cipheredValue}\n`
    }
  }

  return varFileContent.trimEnd()
}
