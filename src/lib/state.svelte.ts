import {
  CURRENT_APP_VERSION,
  DEFAULT_CIPHER_KEY,
  B64_NET_BOOLEAN_TRUE,
  B64_NET_BOOLEAN_FALSE,
  B64_NET_BOOLEAN_FALSE_LEGACY
} from './constants'
import { decryptMonetizationVars, encryptMonetizationVars } from './crypto'

/**
 * Interface representing the parsing state for an active mode tab.
 */
export interface TabState {
  /** The name of the file currently selected. */
  inputFileName: string
  /** The raw text content of the selected file. */
  fileContent: string | null
  /** The parsed or decrypted key-value monetization map. */
  jsonObject: Record<string, boolean | number | string> | null
}

/** Represents the type of active processing modes. */
export type ActiveMode = 'decrypt' | 'encrypt'

/** Represents the possible color states of the status indicator LED. */
export type LedStatus = 'online' | 'offline' | 'busy' | 'update'

/**
 * Interface for active transient toast notifications.
 */
export interface Toast {
  /** A unique auto-incrementing ID. */
  id: number
  /** The message text to display. */
  message: string
  /** The semantic type of notification. */
  type: 'success' | 'error' | 'info'
}

/**
 * Unified application state manager using Svelte 5 runes.
 * Incorporates local storage preferences, binary parsing orchestrators,
 * and high-fidelity transient UI state bindings.
 */
export class AppState {
  /** The manual version number of the build. */
  readonly appVersion = CURRENT_APP_VERSION

  /** The currently selected mode (either 'decrypt' or 'encrypt'). */
  activeMode = $state<ActiveMode>('decrypt')

  /** The user override cipher key. Uses default if empty. */
  cipherKey = $state<string>('')

  /** Indicates whether the client has active internet connectivity. */
  isOnline = $state<boolean>(navigator.onLine)

  /** Indicates whether an application update is registered. */
  updateAvailable = $state<boolean>(false)

  /** The current status/LED display color of the system. */
  currentStatus = $state<LedStatus>('online')

  /** The processing substate representing the decryption tab. */
  stateForDecrypt = $state<TabState>({
    inputFileName: '',
    fileContent: null,
    jsonObject: null
  })

  /** The processing substate representing the encryption tab. */
  stateForEncrypt = $state<TabState>({
    inputFileName: '',
    fileContent: null,
    jsonObject: null
  })

  /** Technical error message string to display inside UI containers. */
  errorMessage = $state<string | null>(null)

  /** Tracks whether the post-download extension alert should display. */
  showFinalDownloadWarning = $state<boolean>(true)

  /** Boolean flag controlling the collapsed state of the advanced options block. */
  isAdvancedExpanded = $state<boolean>(false)

  /** Boolean flag controlling the collapsed state of the documentation guidelines. */
  isDocsExpanded = $state<boolean>(false)

  /** Boolean flag toggling the visibility of the invalid filename alert modal. */
  showWrongFileModal = $state<boolean>(false)

  /** Boolean flag toggling the visibility of the general comparison/installation methods modal. */
  showComparisonModal = $state<boolean>(false)

  /** Boolean flag toggling the visibility of the download confirmation modal. */
  showDownloadWarningModal = $state<boolean>(false)

  /** Reactive list of active transient toast messages. */
  toasts = $state<Toast[]>([])

  /** Unique ID counter for assigning Toast IDs. */
  toastIdOffset = 0

  /** Reference bounds indicating raw HTML elements. */
  fileInputRef = $state<HTMLInputElement | null>(null)

  /** Reference bounds indicating raw HTML textarea. */
  textareaRef = $state<HTMLTextAreaElement | null>(null)

  /** Temporary status variable for active drag-over states. */
  isDragOver = $state<boolean>(false)

  /**
   * Initializes local settings and online connectivity indicators.
   */
  constructor() {
    this.updateAvailable = localStorage.getItem('updateAvailable') === 'true'
    this.showFinalDownloadWarning =
      localStorage.getItem('bitEditHideFinalDownloadWarning') !== 'true'
    this.currentStatus = this.isOnline ? (this.updateAvailable ? 'update' : 'online') : 'offline'
  }

  /**
   * Derived reactive getter retrieving the parsed data object from the active tab.
   */
  currentJsonObject = $derived.by(() => {
    return this.activeMode === 'decrypt'
      ? this.stateForDecrypt.jsonObject
      : this.stateForEncrypt.jsonObject
  })

  /**
   * Derived reactive getter retrieving the filename of the active tab.
   */
  currentFileName = $derived.by(() => {
    return this.activeMode === 'decrypt'
      ? this.stateForDecrypt.inputFileName
      : this.stateForEncrypt.inputFileName
  })

  /**
   * Derived reactive getter retrieving the raw file text of the active tab.
   */
  currentFileContent = $derived.by(() => {
    return this.activeMode === 'decrypt'
      ? this.stateForDecrypt.fileContent
      : this.stateForEncrypt.fileContent
  })

  /**
   * Spawns a transient toast message on the front end.
   * @param message - The content text string.
   * @param type - The stylistic theme of the notification toast.
   */
  addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = this.toastIdOffset++
    this.toasts = [...this.toasts, { id, message, type }]
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    }, 3000)
  }

  /**
   * Transitions the current active processing mode tab.
   * @param mode - The target mode representation.
   */
  setMode(mode: ActiveMode) {
    this.activeMode = mode
    this.errorMessage = null
  }

  /**
   * Resolves the user custom key or falls back to system defaults.
   * @returns The resolved cipher key string.
   */
  getEffectiveCipherKey(): string {
    return this.cipherKey.trim() || DEFAULT_CIPHER_KEY
  }

  /**
   * Mutates the status LED during long-running background operations.
   * @param isBusy - True if the system is actively working.
   */
  setBusy(isBusy: boolean) {
    if (isBusy) {
      this.currentStatus = 'busy'
    } else {
      this.currentStatus = this.isOnline ? (this.updateAvailable ? 'update' : 'online') : 'offline'
    }
  }

  /**
   * Standardizes structural safety checks for chosen user files.
   * @param file - The native web File instance.
   * @throws Error containing string 'INVALID_FILENAME' if signature checks fail.
   */
  async handleFileSelected(file: File) {
    this.errorMessage = null
    const name = file.name

    if (this.activeMode === 'decrypt' && name.toLowerCase() !== 'monetizationvars') {
      throw new Error('INVALID_FILENAME')
    }

    try {
      const text = await file.text()
      if (this.activeMode === 'decrypt') {
        this.stateForDecrypt.inputFileName = name
        this.stateForDecrypt.fileContent = text
        this.stateForDecrypt.jsonObject = null
      } else {
        this.stateForEncrypt.inputFileName = name
        this.stateForEncrypt.fileContent = text
        this.stateForEncrypt.jsonObject = null
      }
    } catch {
      this.errorMessage = 'Failed to read input file stream.'
    }
  }

  /**
   * Core orchestrator executing structural file decryption or JSON validation.
   */
  async executeProcess() {
    this.errorMessage = null
    const effectiveKey = this.getEffectiveCipherKey()
    const content = this.currentFileContent

    if (!content) {
      this.errorMessage = 'Please select an input source file first.'
      return
    }

    this.setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      if (this.activeMode === 'decrypt') {
        const itemMap = decryptMonetizationVars(content, effectiveKey)
        this.stateForDecrypt.jsonObject = itemMap
      } else {
        const parsed = JSON.parse(content) as Record<string, boolean | number | string>
        this.stateForEncrypt.jsonObject = parsed
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.errorMessage = e.message
      } else {
        this.errorMessage = 'Processing failed.'
      }
    } finally {
      this.setBusy(false)
    }
  }

  /**
   * Applies the "Unlock All" premium features patch directly onto target data maps.
   * @returns True if actual modifications took place.
   */
  applyUnlockAllPatch(): boolean {
    const json = this.currentJsonObject
    if (!json) return false

    const tempJson = { ...json }
    let changed = false

    for (const key in tempJson) {
      if (Object.prototype.hasOwnProperty.call(tempJson, key)) {
        const value = tempJson[key]
        if (value === false) {
          tempJson[key] = true
          changed = true
        } else if (value === B64_NET_BOOLEAN_FALSE || value === B64_NET_BOOLEAN_FALSE_LEGACY) {
          tempJson[key] = B64_NET_BOOLEAN_TRUE
          changed = true
        }
      }
    }

    if (changed) {
      if (this.activeMode === 'decrypt') {
        this.stateForDecrypt.jsonObject = tempJson
      } else {
        this.stateForEncrypt.jsonObject = tempJson
      }
      return true
    }
    return false
  }

  /**
   * Compiles the in-memory json data map back to active encrypted binary format.
   * @returns The generated binary-safe output stream.
   */
  compileProcessedPayload(): string | null {
    const json = this.currentJsonObject
    if (!json) return null

    try {
      const effectiveKey = this.getEffectiveCipherKey()
      return encryptMonetizationVars(json, effectiveKey)
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.errorMessage = `Encryption error: ${e.message}`
      }
      return null
    }
  }

  /**
   * Toggles client alert preferences when downloading compiled outputs.
   * @param value - Checkbox checked state.
   */
  toggleWarnPreference(value: boolean) {
    this.showFinalDownloadWarning = !value
    try {
      localStorage.setItem('bitEditHideFinalDownloadWarning', String(value))
    } catch {
      // LocalStorage disabled / read-only exceptions
    }
  }
}
