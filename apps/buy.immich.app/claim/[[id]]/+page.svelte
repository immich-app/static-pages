<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/card.svelte';
  import Icon from '$lib/components/icon.svelte';
  import LicenseKey from '$lib/components/license-key.svelte';
  import { getAuthorizeUrl } from '$lib/utils/oauth';
  import { Button, Heading, Text, VStack } from '@immich/ui';
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

<div class="w-full h-full md:max-w-[900px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <VStack gap={4}>
    <section>
      <VStack>
        <Heading size="giant" color="primary" class="uppercase">Claim you key</Heading>
        <Text size="large">
          If you previously supported Immich by sponsoring the project on GitHub, you are entitled to a free product
          key. Login below with your GitHub account to claim your key.
        </Text>
      </VStack>
    </section>

    {#if response}
      <div class="flex gap-2 items-center">
        <img src={response.imageUrl} class="h-16" alt="GitHub profile" />
        <div>
          <p class="text-2xl">Welcome back <strong>{response.username}</strong>!</p>
          {#if response.licenses.length > 0}
            <Text size="large">
              We found <strong>{response.licenses.length}</strong> license{s(response.licenses.length)}.
            </Text>
          {/if}
        </div>
      </div>

      {#if response.licenses.length === 0}
        <Card status="error">
          <Text size="large">
            Unfortunately, we did not find any product keys associated with your account. If you think this is a
            mistake, please send an email to <a href="mailto:claim@immich.app" class="underline">claim@immich.app</a>.
          </Text>
        </Card>
      {/if}

      <div class="flex flex-col gap-2">
        {#each response.licenses as license (license.licenseKey)}
          <Card>
            <LicenseKey productKey={license.licenseKey} />
          </Card>
        {/each}
      </div>
    {:else}
      <Card status={errorMessage ? 'error' : undefined}>
        <div class="flex flex-col gap-2">
          <Button onclick={handleLogin} color="secondary">
            <Icon path={mdiGithub} size="2em" />
            <Text>Login with GitHub</Text>
          </Button>
          {#if errorMessage}
            <div class=" text-lg w-full p-4 rounded-2xl">
              <p>{errorMessage}</p>
            </div>
          {/if}
        </div>
      </Card>
    {/if}
  </VStack>
</div>
