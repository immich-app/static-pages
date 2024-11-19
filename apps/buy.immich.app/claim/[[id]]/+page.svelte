<script lang="ts">
  import { goto } from '$app/navigation';
  import LicenseKey from '$lib/components/license-key.svelte';
  import { getAuthorizeUrl } from '$lib/utils/oauth';
  import { Alert, Button, Heading, Icon, Link, Stack, Text } from '@immich/ui';
  import { mdiGithub } from '@mdi/js';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const s = (n: number) => (n === 1 ? '' : 's');

  let errorMessage = $state(data.error);
  const response = data.response;
  if (response) {
    goto('/claim', { replaceState: true });
  }

  const handleLogin = async () => {
    try {
      const { error, url } = await getAuthorizeUrl();
      if (url) {
        window.location.href = url;
      } else {
        errorMessage = error;
      }
    } catch (error: Error | unknown) {
      errorMessage = error instanceof Error ? error?.message : String(error);
    }
  };
</script>

<svelte:head>
  <title>Immich - Claim</title>
</svelte:head>

<div class="w-full h-full md:max-w-[800px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <Stack gap={8}>
    <section>
      <Stack>
        <Heading size="giant" color="primary" class="uppercase">Claim your key</Heading>
        <Text size="large">
          If you previously supported Immich by sponsoring the project on GitHub, you are entitled to a free product
          key. Login below with your GitHub account to claim your key.
        </Text>
      </Stack>
    </section>

    {#if response}
      <div class="flex gap-2 items-center">
        <img src={response.imageUrl} class="h-16" alt="GitHub profile" />
        <div>
          <p class="text-2xl">Welcome back <strong>{response.username}</strong>!</p>
          {#if response.licenses.length > 0}
            <Text size="large">
              We found <strong>{response.licenses.length}</strong> product key{s(response.licenses.length)}.
            </Text>
          {/if}
        </div>
      </div>

      {#if response.licenses.length === 0}
        <section>
          <Alert color="secondary" title="No product keys">
            <Text>
              Unfortunately, we did not find any product keys associated with your account. If you think this is a
              mistake, please send an email to <Link href="mailto:claim@immich.app">claim@immich.app</Link>.
            </Text>
          </Alert>
        </section>
      {/if}

      <Stack gap={4}>
        {#each response.licenses as license (license.licenseKey)}
          <LicenseKey productKey={license.licenseKey} />
        {/each}
      </Stack>
    {:else}
      <section>
        <Stack align="start" gap={4}>
          <Button onclick={handleLogin} color="secondary" variant="outline">
            <Icon icon={mdiGithub} size="2em" />
            <Text>Login with GitHub</Text>
          </Button>
          {#if errorMessage}
            <Alert title={errorMessage} color="danger" />
          {/if}
        </Stack>
      </section>
    {/if}
  </Stack>
</div>
