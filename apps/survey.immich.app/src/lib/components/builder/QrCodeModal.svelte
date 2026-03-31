<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  interface Props {
    url: string;
    onClose: () => void;
  }

  let { url, onClose }: Props = $props();

  let dataUrl = $state<string | null>(null);

  onMount(async () => {
    dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
  });

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'survey-qr-code.png';
    a.click();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
  >
    <h2 class="mb-4 text-center text-lg font-semibold">QR Code</h2>
    <p class="mb-4 text-center text-xs break-all text-gray-500">{url}</p>

    {#if dataUrl}
      <div class="flex justify-center">
        <img src={dataUrl} alt="QR Code for survey" class="rounded-lg" width="300" height="300" />
      </div>
    {:else}
      <div class="flex h-[300px] items-center justify-center">
        <p class="text-sm text-gray-400">Generating...</p>
      </div>
    {/if}

    <div class="mt-5 flex items-center justify-center gap-3">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        onclick={handleDownload}
        disabled={!dataUrl}
      >
        Download PNG
      </button>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onclick={onClose}
      >
        Close
      </button>
    </div>
  </div>
</div>
