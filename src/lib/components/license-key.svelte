<script lang="ts">
  import { getRedirectUrl } from '$lib/utils/license';
  import { Button } from '@immich/ui';

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
    <div class="bg-immich-primary/10 text-immich-primary py-3 px-6 rounded-2xl">{productKey}</div>
  </div>
  <div class="flex w-full gap-2 mt-2">
    <Button href={getRedirectUrl(productKey, 'https://my.immich.app')} fullWidth size="large">Activate</Button>
    <Button onclick={handleCopy} fullWidth color="secondary" size="large">Copy</Button>
  </div>
</div>
{#if clipboardStatus === 'success'}
  <p class="text-immich-primary">Coped to clipboard!</p>
{:else if clipboardStatus === 'error'}
  <p class="text-immich-error">Unable to copy to clipboard</p>
{/if}
