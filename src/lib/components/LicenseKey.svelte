<script lang="ts">
  import { getRedirectUrl } from '$lib/utils/license';
  import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Icon, Stack, Text } from '@immich/ui';
  import { mdiCheckCircleOutline } from '@mdi/js';

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

    setTimeout(() => (clipboardStatus = undefined), 5_000);
  };
</script>

<Card {color}>
  <CardHeader>
    <CardTitle size="tiny">{type} Product Key</CardTitle>
  </CardHeader>
  <CardBody>
    <Stack gap={4}>
      <div>
        <div class="bg-primary/10 py-2 px-6 rounded-lg">
          <Text color="primary">{productKey}</Text>
        </div>
      </div>
    </Stack>
  </CardBody>
  <CardFooter>
    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
      <Button href={getRedirectUrl(productKey, 'https://my.immich.app')} fullWidth size="medium">Activate</Button>
      <div class="flex justify-center items-center">
        {#if clipboardStatus === 'error'}
          <Text color="danger">Unable to copy to clipboard</Text>
        {:else}
          <Button
            onclick={handleCopy}
            color="secondary"
            size="medium"
            fullWidth
            disabled={clipboardStatus === 'success'}
          >
            {#if clipboardStatus === 'success'}
              <Icon icon={mdiCheckCircleOutline} size="1.5em" />
              Copied to clipboard!
            {:else}
              Copy
            {/if}
          </Button>
        {/if}
      </div>
    </div>
  </CardFooter>
</Card>
