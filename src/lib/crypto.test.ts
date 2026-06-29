import { describe, it, expect } from 'vitest'
import {
  getObfuscatedKey,
  utf8StringToBase64,
  base64ToUtf8String,
  xorAndBase64Encode,
  base64DecodeAndXOR,
  encryptInt,
  decryptInt,
  decryptMonetizationVars,
  encryptMonetizationVars,
  globalBtoa,
  globalAtob
} from './crypto'

describe('Crypto Utility Helpers', () => {
  it('should obfuscate cipher key correctly', () => {
    // com.wtfapps.apollo16 (lowercase conversion and character map check)
    // OBF_CHAR_MAP maps:
    // a(97) -> z(122), b(98) -> m(109), c(99) -> y(121), etc.
    const key = 'com.wtfapps.apollo16'
    const obfuscated = getObfuscatedKey(key)
    expect(obfuscated).toBe('yst.odkzffq.zfshhs16')
  })

  it('should encode and decode utf8 strings consistently', () => {
    const raw = 'Hello Planet Earth! © 2026'
    const encoded = utf8StringToBase64(raw)
    const decoded = base64ToUtf8String(encoded)
    expect(decoded).toBe(raw)
  })

  it('should custom globalBtoa and globalAtob match standard in node/browser context', () => {
    const binaryData = 'some \x00 arbitrary \xff bytes'
    const globalObj = globalThis as typeof globalThis & {
      Buffer?: {
        from: (str: string, encoding: string) => { toString: (encoding: string) => string }
      }
    }
    const bufferFrom = globalObj.Buffer?.from

    if (bufferFrom) {
      const encodedNode = bufferFrom(binaryData, 'binary').toString('base64')
      const encodedCustom = globalBtoa(binaryData)
      expect(encodedCustom).toBe(encodedNode)

      const decodedCustom = globalAtob(encodedCustom)
      expect(decodedCustom).toBe(binaryData)
    } else if (typeof btoa === 'function') {
      const encodedStandard = btoa(binaryData)
      const encodedCustom = globalBtoa(binaryData)
      expect(encodedCustom).toBe(encodedStandard)

      const decodedCustom = globalAtob(encodedCustom)
      expect(decodedCustom).toBe(binaryData)
    }
  })

  it('should xor and base64 process consistently', () => {
    const key = 'y3t.dgbzmme.zk3h316'
    const message = 'SomeSensibleMetadata'
    const ciphered = xorAndBase64Encode(message, key)
    const deciphered = base64DecodeAndXOR(ciphered, key)
    expect(deciphered).toBe(message)
  })

  it('should handle integer base64 serialization and deserialization', () => {
    const originalVal = 1337
    const serialized = encryptInt(originalVal)
    expect(serialized).not.toBeNull()

    if (serialized !== null) {
      const deserialized = decryptInt(serialized)
      expect(deserialized).toBe(originalVal)
    }
  })

  it('should decrypt and encrypt full monetization vars structure', () => {
    const key = 'com.wtfapps.apollo16'
    const mockData: Record<string, boolean | number | string> = {
      BitLifeGodMode: true,
      BitizenUpgrade: false,
      ChallengeCount: 42,
      CustomStatusMsg: 'ActiveRebel'
    }

    // Encrypt the map
    const encrypted = encryptMonetizationVars(mockData, key)
    expect(encrypted).toContain(':') // format label:value

    // Decrypt the encrypted payload
    const decrypted = decryptMonetizationVars(encrypted, key)

    // String values are asymmetric in MonetizationVars serialization:
    // encrypting a string encodes it to base64, but decrypting does not decode it,
    // reflecting the original app's exact behavior.
    expect(decrypted).toEqual({
      BitLifeGodMode: true,
      BitizenUpgrade: false,
      ChallengeCount: 42,
      CustomStatusMsg: 'QWN0aXZlUmViZWw='
    })
  })
})
