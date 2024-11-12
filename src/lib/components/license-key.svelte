<script lang="ts">
  import { getRedirectUrl } from '$lib/utils/license';

  interface Props {
    productKey: string;
  }

  let { productKey }: Props = $props();

  let clipboardStatus: 'success' | 'error' | undefined = $state();

  let type = $derived(productKey.startsWith('IMSV-') ? 'Server' : 'User');

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(productKey);
      clipboardStatus = 'success';
    } catch {
      clipboardStatus = 'error';
    }

    setTimeout(() => (clipboardStatus = undefined), 5_000);
  };
</script>

<div class="flex flex-col gap-2">
  <p class="text-lg font-bold">{type} Product Key</p>
  <div class="flex gap-1">
    <div class="bg-immich-primary/10 text-immich-primary py-3 px-6 rounded-lg">{productKey}</div>
  </div>
  <div class="flex w-full gap-2 mt-2">
    <a href={getRedirectUrl(productKey, 'https://my.immich.app')} class="w-full">
      <button
        type="button"
        class="px-4 py-3 text-white bg-immich-primary rounded-xl dark:text-black dark:bg-immich-dark-primary hover:shadow-xl w-full"
        >Activate</button
      >
    </a>
    <button onclick={handleCopy} type="button" class="px-4 py-3 text-dark bg-gray-300 rounded-xl hover:shadow-xl w-full"
      >Copy</button
    >
  </div>
</div>
{#if clipboardStatus === 'success'}
  <p class="text-immich-primary">Coped to clipboard!</p>
{:else if clipboardStatus === 'error'}
  <p class="text-immich-error">Unable to copy to clipboard</p>
{/if}
