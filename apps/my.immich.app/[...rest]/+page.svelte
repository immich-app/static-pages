<script lang="ts">
  import { preventDefault } from 'svelte/legacy';
  import { StorageKey } from '$lib';
  import '$lib/app.css';
  import { Button } from '@immich/ui';
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

<div class="w-screen h-screen bg-immich-dark-bg overflow-auto p-4">
  <div class="mx-auto max-w-screen-sm m-6 p-12 rounded-lg bg-immich-dark-gray text-immich-dark-fg">
    <section class="flex justify-center">
      <img src="/img/immich-logo-stacked-dark.svg" class="h-64" alt="Immich logo" />
    </section>
    <section>
      <h1 class="md:text-3xl mb-2 text-immich-dark-primary">My Immich</h1>
      <p class="mb-4">My Immich allows public links to link you to specific areas of your personal Immich instance.</p>
      <form onsubmit={preventDefault(handleSubmit)}>
        <div class="mb-4 flex flex-col">
          <label id="instance-url-label" for="instance-url-input" class="font-medium immich-dark-fg mb-2">
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
          <p class="mt-2 text-sm">Note: This URL is only stored in your browser.</p>
        </div>
        <div class="flex justify-end">
          {#if saved}
            <p class="text-center sm:text-right m-0 px-5 py-3 text-sm text-immich-dark-primary">Saved!</p>
          {:else}
            <Button type="submit" class="w-full sm:w-auto">
              {targetUrl ? 'Save & Redirect' : 'Save'}
            </Button>
          {/if}
        </div>
      </form>
    </section>
  </div>
</div>
