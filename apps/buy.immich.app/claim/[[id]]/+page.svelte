<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/card.svelte';
  import Icon from '$lib/components/icon.svelte';
  import LicenseKey from '$lib/components/license-key.svelte';
  import { getAuthorizeUrl } from '$lib/utils/oauth';
  import { mdiGithub } from '@mdi/js';
  import type { PageData } from './$types';

  export let data: PageData;

  const s = (n: number) => (n === 1 ? '' : 's');

  let errorMessage = data.error;
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
  <div class="m-auto">
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">CLAIM YOUR KEY</h1>
    <p class="text-left text-lg mt-2 dark:text-immich-gray">
      If you previously supported Immich by sponsoring the project on GitHub, you are entitled to a free product key.
      Login below with your GitHub account to claim your key.
    </p>
  </div>

  <section class="mt-10">
    {#if response}
      <div class="flex gap-2 items-center">
        <img src={response.imageUrl} class="h-16" alt="GitHub profile" />
        <div>
          <p class="text-2xl">Welcome back <strong>{response.username}</strong>!</p>
          {#if response.licenses.length > 0}
            <p class="text-lg">
              We found <strong>{response.licenses.length}</strong> license{s(response.licenses.length)}.
            </p>
          {/if}
        </div>
      </div>

      {#if response.licenses.length === 0}
        <Card status="error">
          <p class="text-lg">
            Unfortunately, we did not find any product keys associated with your account. If you think this is a
            mistake, please send an email to <a href="mailto:claim@immich.app" class="underline">claim@immich.app</a>.
          </p>
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
          <a href={''}>
            <button
              on:click={handleLogin}
              class="flex mt-2 items-center gap-2 text-lg p-2 w-full rounded-full text-white bg-black hover:shadow-xl"
            >
              <Icon path={mdiGithub} size="3em" />
              <span class="pr-3"> Login with GitHub </span>
            </button>
          </a>
          {#if errorMessage}
            <div class=" text-lg w-full p-4 rounded-lg">
              <p>{errorMessage}</p>
            </div>
          {/if}
        </div>
      </Card>
    {/if}
  </section>
</div>
