<script lang="ts">
  import { getRedirectUrl } from '$lib';
  import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Stack, Text } from '@immich/ui';
  import { mdiCheckCircleOutline, mdiContentCopy } from '@mdi/js';

  interface Props {
    productKey: string;
  }

  let { productKey }: Props = $props();

  let clipboardStatus: 'success' | 'error' | undefined = $state();

  let type = $derived(productKey.startsWith('IMSV-') ? 'Server' : 'User');
  const color = $derived(type === 'Server' ? 'secondary' : 'primary');

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(productKey);
      clipboardStatus = 'success';
    } catch {
      clipboardStatus = 'error';
    }

    setTimeout(() => (clipboardStatus = undefined), 3_000);
  };
</script>

<Card {color}>
  <CardHeader>
    <CardTitle size="tiny">{type} Product Key</CardTitle>
  </CardHeader>
  <CardBody>
    <Stack gap={4}>
      <div>
        <div class="bg-primary/10 rounded-lg px-6 py-2">
          <Text color="primary">{productKey}</Text>
        </div>
      </div>
    </Stack>
  </CardBody>
  <CardFooter>
    <div class="grid w-full grid-cols-1 gap-2 md:grid-cols-2">
      <Button href={getRedirectUrl(productKey, 'https://my.immich.app')} fullWidth size="medium">Activate</Button>
      <div class="flex items-center justify-center">
        {#if clipboardStatus === 'error'}
          <Text color="danger">Unable to copy to clipboard</Text>
        {:else if clipboardStatus === 'success'}
          <Button disabled color="secondary" size="medium" fullWidth leadingIcon={mdiCheckCircleOutline}>Copied!</Button
          >
        {:else}
          <Button leadingIcon={mdiContentCopy} onclick={handleCopy} color="secondary" size="medium" fullWidth
            >Copy</Button
          >
        {/if}
      </div>
    </div>
  </CardFooter>
</Card>
