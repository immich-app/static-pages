<script lang="ts">
  import { StorageKey } from '$lib';
  import '$lib/app.css';
  import { Button, Card, CardBody, Heading, Logo, Text, VStack } from '@immich/ui';
  import { preventDefault } from 'svelte/legacy';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const targetUrl = data.targetUrl;
  let instanceUrl = $state(data.instanceUrl);
  let saved = $state(false);

  const handleChange = () => (saved = false);

  const handleSubmit = () => {
    localStorage.setItem(StorageKey.INSTANCE_URL, instanceUrl);
    if (targetUrl && instanceUrl) {
      window.location.href = new URL(targetUrl, instanceUrl).toString();
    } else {
      saved = true;
    }
  };
</script>

<div class="dark w-screen h-screen bg-light overflow-auto p-4 md:p-12 lg:p-24">
  <div class="mx-auto max-w-screen-sm">
    <Card color="secondary" variant="subtle">
      <CardBody class="p-4 lg:p-8">
        <section>
          <div class="flex justify-center">
            <Logo variant="stacked" theme="dark" size="landing" />
          </div>
          <VStack gap={4}>
            <Heading size="large" color="primary">My Immich</Heading>
            <Text>My Immich allows public links to link you to specific areas of your personal Immich instance.</Text>

            <form onsubmit={preventDefault(handleSubmit)}>
              <VStack>
                <label id="instance-url-label" for="instance-url-input" class="font-medium immich-dark-fg">
                  Instance URL
                </label>
                <input
                  id="instance-url-input"
                  aria-labelledby="instance-url-label"
                  class="rounded-xl px-3 py-3 text-sm bg-gray-600 text-immich-dark-fg border-none outline-none"
                  type="text"
                  placeholder="https://demo.immich.app/"
                  bind:value={instanceUrl}
                  oninput={() => handleChange()}
                  aria-label="Instance URL"
                />
                <Text size="small">Note: This URL is only stored in your browser.</Text>
              </VStack>
              <div class="flex justify-end">
                {#if saved}
                  <Text size="small" color="primary">Saved!</Text>
                {:else}
                  <Button type="submit" class="w-full sm:w-auto">
                    {targetUrl ? 'Save & Redirect' : 'Save'}
                  </Button>
                {/if}
              </div>
            </form>
          </VStack>
        </section>
      </CardBody>
    </Card>
  </div>
</div>
