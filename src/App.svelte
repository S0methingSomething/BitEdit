<script lang="ts">
  import { onMount } from 'svelte'
  import { AppState } from './lib/state.svelte'

  /**
   * Initialize unified AppState object containing routing, cryptos, and nested UI states.
   */
  const app = new AppState()

  /**
   * Prevent default actions for standard drop streams.
   */
  function preventDefaults(e: Event) {
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * Drag drop handler.
   */
  const handleDrop = async (e: DragEvent) => {
    app.isDragOver = false
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        await processUploadedFile(file)
      }
    }
  }

  /**
   * Native selector change interface.
   */
  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await processUploadedFile(file)
    }
  }

  /**
   * Reads target files and captures errors cleanly inside modular properties.
   */
  async function processUploadedFile(file: File) {
    try {
      await app.handleFileSelected(file)
      app.addToast(`Selected file: ${file.name}`, 'success')
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_FILENAME') {
        app.showWrongFileModal = true
      } else {
        app.errorMessage = 'Failed to read file.'
        app.addToast('File read failed.', 'error')
      }
      if (app.fileInputRef) {
        app.fileInputRef.value = ''
      }
    }
  }

  /**
   * Decrypts binary input or parses target raw string JSON data.
   */
  async function handleExecute() {
    await app.executeProcess()
    if (app.errorMessage) {
      app.addToast('Process execution failed.', 'error')
    } else {
      app.addToast(
        app.activeMode === 'decrypt'
          ? 'Decryption completed successfully.'
          : 'JSON parsed successfully.',
        'success'
      )
    }
  }

  /**
   * Applies global Unlock All premium service patch.
   */
  function handleUnlockAll() {
    const result = app.applyUnlockAllPatch()
    if (result) {
      app.addToast('Unlocked all applicable items successfully.', 'success')
    } else {
      app.addToast("No items needed 'Unlock All'.", 'info')
    }
  }

  /**
   * Copies current JSON schema representation to user clipboard.
   */
  function handleCopyJson() {
    const rawVal = app.textareaRef?.value
    if (!rawVal) {
      app.addToast('No JSON to copy.', 'info')
      return
    }

    navigator.clipboard
      .writeText(rawVal)
      .then(() => app.addToast('JSON copied to clipboard!', 'success'))
      .catch(() => app.addToast('Failed to copy. Clipboard permission denied.', 'error'))
  }

  /**
   * Triggers local JSON output format download stream.
   */
  function handleDownloadJson() {
    const jsonStr = app.textareaRef?.value
    if (!jsonStr) {
      app.addToast('No JSON data available for download.', 'info')
      return
    }

    try {
      JSON.parse(jsonStr)
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
      const baseFilename = app.currentFileName || 'decrypted_data'
      const cleanBase = baseFilename.includes('.')
        ? baseFilename.substring(0, baseFilename.lastIndexOf('.'))
        : baseFilename
      const downloadName = `${cleanBase}_decrypted.json`

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      app.addToast('Decrypted JSON downloaded.', 'success')
    } catch {
      app.errorMessage = 'Invalid JSON payload structure inside editor.'
      app.addToast('Failed to download. Invalid JSON.', 'error')
    }
  }

  /**
   * Re-encrypts monetization vars content and offers binary payload stream.
   */
  function handleCompileAndDownload() {
    const compiled = app.compileProcessedPayload()
    if (!compiled || app.errorMessage) {
      app.addToast('Compilation failed.', 'error')
      return
    }

    const blob = new Blob([compiled], { type: 'application/octet-stream' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'MonetizationVars'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    app.addToast('Encrypted MonetizationVars compiled & downloaded.', 'success')

    if (app.showFinalDownloadWarning) {
      app.showDownloadWarningModal = true
    }
  }

  /**
   * Toggles final alerts during compiles.
   */
  function handleWarningModalAcknowledge(dontShowAgain: boolean) {
    app.showDownloadWarningModal = false
    if (dontShowAgain) {
      app.toggleWarnPreference(true)
      app.addToast('Download warning disabled for future runs.', 'info')
    }
    dontWarnChecked = false
  }

  let dontWarnChecked = $state(false)

  onMount(() => {
    const handleOnline = () => {
      app.isOnline = true
      app.currentStatus = app.updateAvailable ? 'update' : 'online'
    }
    const handleOffline = () => {
      app.isOnline = false
      app.currentStatus = 'offline'
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })
</script>

<div class="bg-grid-full"></div>
<div class="texture-overlay"></div>

<main
  class="min-h-screen flex flex-col items-center relative z-10 w-full max-w-3xl mx-auto px-4 py-10 sm:py-16"
>
  <!-- Header -->
  <header class="text-center mb-10 w-full animate-fade-in">
    <div class="inline-flex items-baseline justify-center relative group select-none">
      <h1 class="font-bold tracking-tighter text-white drop-shadow-md text-6xl font-display">
        BitEdit
      </h1>
      <!-- Status LED Dot -->
      <span
        class="inline-block w-2.5 h-2.5 rounded-full ml-1.5 relative -top-3.5 transition-all duration-300"
        class:led-online={app.currentStatus === 'online'}
        class:led-offline={app.currentStatus === 'offline'}
        class:led-update={app.currentStatus === 'update'}
        class:led-busy={app.currentStatus === 'busy'}
        title="Status: {app.currentStatus}"
      ></span>
    </div>

    <div class="flex flex-col items-center gap-2 mt-4">
      <p
        class="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 px-3 py-1 rounded-full bg-black/50"
      >
        MonetizationVars Editor
      </p>
      <div
        class="flex gap-3 text-[10px] text-zinc-600 font-mono mt-1 opacity-60 hover:opacity-100 transition-opacity duration-300"
      >
        <span>u/C1oudyLol</span>
        <span>&bull;</span>
        <span>AI Assisted</span>
      </div>
    </div>
  </header>

  <!-- Main Panel Card -->
  <div class="w-full panel-textured rounded-xl overflow-hidden relative">
    <div class="grid grid-cols-2 border-b border-white/5 bg-black/20 font-mono">
      <button
        type="button"
        class="py-4 text-xs sm:text-sm font-semibold tracking-tight transition-all tab-btn"
        class:active={app.activeMode === 'decrypt'}
        onclick={() => app.setMode('decrypt')}
      >
        DECRYPT
      </button>
      <button
        type="button"
        class="py-4 text-xs sm:text-sm font-semibold tracking-tight transition-all tab-btn"
        class:active={app.activeMode === 'encrypt'}
        onclick={() => app.setMode('encrypt')}
      >
        ENCRYPT JSON
      </button>
    </div>

    <!-- Main Workspace Area -->
    <div class="p-6 sm:p-8 space-y-6">
      <!-- File Selector Container -->
      <section class="space-y-4">
        <h2 class="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest pl-1">
          {app.activeMode === 'decrypt' ? 'File' : 'JSON'}
        </h2>

        <!-- Drag & Drop Zone -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          role="region"
          class="drop-zone w-full rounded-xl h-32 flex flex-col items-center justify-center group relative cursor-pointer"
          class:drag-over={app.isDragOver}
          ondragenter={preventDefaults}
          ondragover={(e) => {
            preventDefaults(e)
            app.isDragOver = true
          }}
          ondragleave={(e) => {
            preventDefaults(e)
            app.isDragOver = false
          }}
          ondrop={(e) => {
            preventDefaults(e)
            handleDrop(e)
          }}
          onclick={() => app.fileInputRef?.click()}
        >
          <!-- Hidden Native File Input -->
          <input
            type="file"
            bind:this={app.fileInputRef}
            class="hidden"
            accept={app.activeMode === 'decrypt' ? '*/*' : '.json,text/plain'}
            onchange={handleFileChange}
          />

          <div
            class="flex flex-col items-center pointer-events-none transition-transform duration-200 group-hover:scale-105"
          >
            <svg
              class="w-8 h-8 text-zinc-600 mb-3 group-hover:text-zinc-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p class="text-sm font-mono text-zinc-400 font-medium group-hover:text-white">
              Click or Drag File Here
            </p>
            <p class="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">
              {app.activeMode === 'decrypt' ? 'MonetizationVars' : '.json file'}
            </p>
          </div>
        </div>

        <!-- File Name Display Indicator -->
        <div class="h-6 pl-1 flex items-center">
          {#if app.currentFileName}
            <span class="text-xs font-mono text-emerald-400">
              Selected: {app.currentFileName}
            </span>
          {:else}
            <span class="text-xs font-mono text-zinc-600">No file selected.</span>
          {/if}
        </div>

        <!-- Cipher Override Form (Advanced options panel) -->
        <div class="pt-1">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex items-center gap-2 cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-max select-none group"
            onclick={() => {
              app.isAdvancedExpanded = !app.isAdvancedExpanded
            }}
          >
            <div
              class="w-4 h-4 flex items-center justify-center border border-zinc-800 rounded bg-zinc-950 group-hover:border-zinc-600 transition-colors"
            >
              <svg
                class="w-3 h-3 transition-transform duration-200"
                class:rotate-180={app.isAdvancedExpanded}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
            <span class="font-mono uppercase tracking-wide font-medium">Key</span>
          </div>

          {#if app.isAdvancedExpanded}
            <div class="pt-3 pb-1 transition-all duration-300 animate-slide-down">
              <input
                type="text"
                bind:value={app.cipherKey}
                placeholder="Default: com.wtfapps.apollo16"
                class="input-cutout w-full rounded-md px-3 py-2.5 text-sm font-mono text-zinc-300 placeholder-zinc-700"
              />
            </div>
          {/if}
        </div>

        <!-- Main Execute button -->
        <button
          type="button"
          class="btn-tactile w-full px-6 py-3.5 mt-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-[0_4px_15px_rgba(255,255,255,0.04)] font-display text-sm tracking-wide"
          onclick={handleExecute}
        >
          <span class="font-display tracking-tight text-sm">RUN</span>
        </button>
      </section>

      <!-- Code Output Area -->
      {#if app.currentJsonObject}
        <section class="space-y-6 pt-6 border-t border-zinc-800 animate-fade-in">
          <!-- Apply unlocks modifiers -->
          <button
            type="button"
            class="btn-tactile w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black font-mono text-xs font-bold rounded-md transition-all uppercase tracking-wide"
            onclick={handleUnlockAll}
          >
            Enable All
          </button>

          <!-- Text Stream Editor -->
          <div class="space-y-2">
            <label
              for="json-output"
              class="block text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest pl-1"
            >
              Editor
            </label>
            <textarea
              id="json-output"
              bind:this={app.textareaRef}
              rows="12"
              value={JSON.stringify(app.currentJsonObject, null, 2)}
              onchange={(e) => {
                try {
                  const parsed = JSON.parse((e.target as HTMLTextAreaElement).value) as Record<
                    string,
                    boolean | number | string
                  >
                  if (app.activeMode === 'decrypt') {
                    app.stateForDecrypt.jsonObject = parsed
                  } else {
                    app.stateForEncrypt.jsonObject = parsed
                  }
                  app.errorMessage = null
                } catch {
                  app.errorMessage = 'JSON syntax syntax validation failed.'
                  app.addToast('Invalid JSON structure.', 'error')
                }
              }}
              class="input-cutout w-full rounded-md p-3 font-mono text-[11px] leading-relaxed text-zinc-300 resize-y"
            ></textarea>
          </div>

          <!-- Bottom Control actions -->
          <div class="flex flex-col gap-4">
            <div class="flex gap-3">
              <button
                type="button"
                class="btn-tactile flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 rounded-md text-xs font-mono font-bold uppercase transition-all"
                onclick={handleDownloadJson}
              >
                SAVE JSON
              </button>

              <button
                type="button"
                class="btn-tactile w-14 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-md transition-all"
                onclick={handleCopyJson}
                title="Copy to Clipboard"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
            </div>

            <button
              type="button"
              class="btn-tactile w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display rounded-lg transition-all text-sm relative group overflow-hidden"
              onclick={handleCompileAndDownload}
            >
              <div class="flex flex-col items-center leading-tight">
                <span class="text-sm font-bold font-display tracking-wide">ENCRYPT & SAVE</span>
              </div>
            </button>
          </div>
        </section>
      {/if}

      <!-- Error display module -->
      {#if app.errorMessage}
        <div
          class="p-4 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono animate-fade-in"
        >
          {app.errorMessage}
        </div>
      {/if}
    </div>
  </div>

  <!-- Documentation accordion -->
  <div class="w-full mt-6">
    <button
      type="button"
      class="btn-tactile w-full flex justify-between items-center p-4 bg-black/20 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all select-none"
      onclick={() => {
        app.isDocsExpanded = !app.isDocsExpanded
      }}
    >
      <span class="font-mono text-[10px] uppercase tracking-widest font-bold">Notes</span>
      <svg
        class="w-4 h-4 transition-transform duration-300"
        class:rotate-180={app.isDocsExpanded}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {#if app.isDocsExpanded}
      <div
        class="p-6 mt-2 bg-black/40 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-mono leading-relaxed space-y-4 animate-slide-down"
      >
        <ul class="space-y-2 list-disc list-outside pl-4 marker:text-zinc-600">
          <li>
            File must be named <code class="bg-white/10 px-1 rounded text-zinc-200"
              >MonetizationVars</code
            > (no extension).
          </li>
          <li>Edit the values, then save the file back.</li>
          <li><strong>Enable All</strong> turns on every option.</li>
        </ul>
      </div>
    {/if}
  </div>

  <!-- Inline installation guide trigger banner -->
  <div
    class="w-full mt-4 bg-zinc-950/30 border border-zinc-800/40 hover:border-zinc-700/60 rounded-lg p-3 transition-all text-center"
  >
    <button
      type="button"
      class="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      onclick={() => {
        app.showComparisonModal = true
      }}
    >
      💡 Need help applying your changes? <span
        class="font-bold underline text-zinc-400 hover:text-zinc-300 ml-1"
        >Compare Installation Methods & Requirements ➔</span
      >
    </button>
  </div>

  <!-- Footer -->
  <footer class="w-full py-8 text-center border-t border-white/5 bg-black/20 mt-auto rounded-b">
    <a
      href="https://github.com/yntha/bitlife-edit"
      target="_blank"
      rel="noopener noreferrer"
      class="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors font-mono"
    >
      Based on yntha/bitlife-edit
    </a>
  </footer>
</main>

<!-- Toasts Container -->
<div class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999] pointer-events-none">
  {#each app.toasts as toast (toast.id)}
    <div
      class="py-2.5 px-4 rounded border font-mono text-xs shadow-2xl transition-all duration-300 max-w-sm pointer-events-auto"
      class:bg-emerald-950={toast.type === 'success'}
      class:border-emerald-600={toast.type === 'success'}
      class:text-emerald-300={toast.type === 'success'}
      class:bg-red-950={toast.type === 'error'}
      class:border-red-600={toast.type === 'error'}
      class:text-red-300={toast.type === 'error'}
      class:bg-zinc-950={toast.type === 'info'}
      class:border-zinc-800={toast.type === 'info'}
      class:text-zinc-300={toast.type === 'info'}
    >
      {toast.message}
    </div>
  {/each}
</div>

<!-- ================= MODALS SYSTEM ================= -->

<!-- Wrong File Name Modal -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-[3px] p-4"
  class:hidden={!app.showWrongFileModal}
  class:visible={app.showWrongFileModal}
  onclick={() => {
    app.showWrongFileModal = false
  }}
>
  <div
    class="modal-glass rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <h3 class="text-xl font-display font-bold text-white mb-2">Wrong file</h3>
    <p class="text-zinc-400 text-sm mb-6 font-medium leading-relaxed font-mono">
      Please pick a file named <code
        class="text-red-400 font-mono bg-red-900/20 px-1.5 py-0.5 rounded border border-red-500/20"
        >MonetizationVars</code
      >.
    </p>

    <div class="flex justify-end">
      <button
        type="button"
        class="btn-tactile px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wide rounded hover:bg-zinc-200 transition-all"
        onclick={() => {
          app.showWrongFileModal = false
        }}
      >
        Acknowledge
      </button>
    </div>
  </div>
</div>

<!-- Download Success Warning Modal -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-[3px] p-4"
  class:hidden={!app.showDownloadWarningModal}
  class:visible={app.showDownloadWarningModal}
  onclick={() => {
    app.showDownloadWarningModal = false
  }}
>
  <div
    class="modal-glass rounded-xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <h3 class="text-xl font-display font-bold text-white mb-2">Saved</h3>
    <p class="text-zinc-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
      File downloaded as <code
        class="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/20"
        >MonetizationVars</code
      >
    </p>

    <div
      class="text-[11px] text-zinc-400 font-mono leading-relaxed space-y-2 mb-6 border-b border-white/5 pb-4"
    >
      <div class="font-bold text-zinc-300">How to apply manually:</div>
      <ul class="space-y-1.5 list-disc list-outside pl-4 marker:text-zinc-650">
        <li>
          Rename file to remove any extension (e.g. from <code
            class="bg-white/10 px-1 rounded text-zinc-200 font-bold">MonetizationVars.txt</code
          >
          to
          <code class="bg-white/10 px-1 rounded text-zinc-200 font-bold">MonetizationVars</code>).
        </li>
        <li>
          Place the file in: <code
            class="bg-white/10 px-1.5 py-0.5 rounded text-zinc-200 break-all font-bold"
            >Android/data/com.candywriter.bitlife/files/</code
          >
        </li>
        <li>
          Delete the existing <code class="bg-white/10 px-1 rounded text-zinc-200 font-bold"
            >LiveDictionary</code
          > file inside that directory.
        </li>
        <li>
          Create a new <strong class="text-zinc-200">folder</strong> (not a file) and name it
          exactly
          <code class="bg-white/10 px-1 rounded text-zinc-200 font-bold">LiveDictionary</code>.
        </li>
      </ul>
      <p class="text-[10px] text-zinc-500 italic mt-2">
        Note: Requires a file manager with Shizuku or Root access on Android 11+.
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <div class="space-y-3 font-mono">
        <a
          href="https://bitguides.pages.dev/modding/monetizationvars/unlocking-iap/#requirements"
          target="_blank"
          rel="noopener noreferrer"
          class="block text-center py-2.5 bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-450 border border-emerald-500/30 hover:border-emerald-500/50 font-bold rounded transition-all text-[11px] uppercase tracking-wider shadow-md w-full"
        >
          📖 Read Full Manual Guide (BitGuides) ➔
        </a>
        <div class="flex justify-between items-center text-[10px] pt-1">
          <span class="text-zinc-500">Other option:</span>
          <button
            type="button"
            class="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold"
            onclick={() => {
              app.showDownloadWarningModal = false
              app.showComparisonModal = true
            }}
          >
            Try Automated (BitInstaller) ⚡ ➔
          </button>
        </div>
      </div>

      <div
        class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-t border-white/5 pt-4"
      >
        <label
          class="flex items-center gap-2 text-[11px] text-zinc-500 cursor-pointer select-none hover:text-zinc-300 transition-colors font-mono"
        >
          <input type="checkbox" id="dont-show-warn-again" bind:checked={dontWarnChecked} />
          Don't warn again
        </label>
        <button
          type="button"
          class="btn-tactile px-5 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wide rounded hover:bg-emerald-500 transition-colors"
          onclick={() => handleWarningModalAcknowledge(dontWarnChecked)}
        >
          Understood
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Methods Comparison Modal -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-[3px] p-4"
  class:hidden={!app.showComparisonModal}
  class:visible={app.showComparisonModal}
  onclick={() => {
    app.showComparisonModal = false
  }}
>
  <div
    class="modal-glass rounded-xl shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="mb-4">
      <h3 class="text-lg font-display font-bold text-white">Compare Installation Methods</h3>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t border-white/5 pt-4 text-xs font-mono"
    >
      <!-- Automated Column -->
      <div class="space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <span class="font-bold text-indigo-400">⚡ Automated (BitInstaller)</span>
            <span
              class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold"
              >App</span
            >
          </div>
          <p class="text-zinc-400 text-[11px] leading-relaxed mb-4">
            Android app that patches Scoped Storage natively via Shizuku permissions, avoiding
            manual file moving.
          </p>
          <div class="space-y-3">
            <div>
              <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                Requirements
              </div>
              <ul class="space-y-1 text-zinc-400">
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Android 12 or higher
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Shizuku active runner
                </li>
              </ul>
            </div>
            <div>
              <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                Cons / Limits
              </div>
              <ul class="space-y-1 text-zinc-400">
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-700"></span> Requires wireless debug setup
                </li>
              </ul>
            </div>
          </div>
        </div>
        <a
          href="https://bitguides.pages.dev/modding/monetizationvars/bitinstaller/"
          target="_blank"
          rel="noopener noreferrer"
          class="block text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition-colors text-[11px] mt-4"
        >
          GET BITINSTALLER (GITHUB) ➔
        </a>
      </div>

      <!-- Manual Column -->
      <div class="space-y-4 flex flex-col justify-between md:border-l md:border-white/5 md:pl-6">
        <div>
          <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <span class="font-bold text-emerald-400">📁 Manual (BitGuides)</span>
            <span
              class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold"
              >Guide</span
            >
          </div>
          <p class="text-zinc-400 text-[11px] leading-relaxed mb-4">
            A step-by-step documentation guide on placing files manually via third-party managers.
          </p>
          <div class="space-y-3">
            <div>
              <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                Requirements
              </div>
              <ul class="space-y-1 text-zinc-400">
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Android 11 or higher
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> FV File/ZArchiver + Shizuku/Root
                </li>
              </ul>
            </div>
            <div>
              <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                Cons / Limits
              </div>
              <ul class="space-y-1 text-zinc-400">
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-700"></span> Multi-step manual process
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-700"></span> Risk of filename/extension
                  errors
                </li>
              </ul>
            </div>
          </div>
        </div>
        <a
          href="https://bitguides.pages.dev/modding/monetizationvars/unlocking-iap/#requirements"
          target="_blank"
          rel="noopener noreferrer"
          class="block text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors text-[11px] mt-4"
        >
          VIEW MANUAL GUIDE (BITGUIDES) ➔
        </a>
      </div>
    </div>

    <!-- Wide close button at the bottom -->
    <div class="mt-6 pt-4 border-t border-white/5">
      <button
        type="button"
        class="btn-tactile w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-bold font-mono text-center rounded transition-all text-xs uppercase tracking-wider cursor-pointer"
        onclick={() => {
          app.showComparisonModal = false
        }}
      >
        Close
      </button>
    </div>
  </div>
</div>

<style>
  /* Custom specific styles representing physical console interfaces */
  .tab-btn {
    border-bottom: 2px solid transparent;
    color: var(--color-zinc-500, #71717a);
  }
  .tab-btn:hover {
    color: var(--color-zinc-300, #d4d4d8);
  }
  .tab-btn.active {
    border-bottom-color: white;
    color: white;
  }

  /* Structural UI element modals styling overrides */
  .modal-glass {
    background-color: rgba(8, 8, 8, 0.96);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 0 0 1px #000,
      0 30px 60px -15px rgba(0, 0, 0, 0.95);
  }

  /* Micro transitions */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideDown {
    from {
      height: 0;
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      height: auto;
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-slide-down {
    animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
