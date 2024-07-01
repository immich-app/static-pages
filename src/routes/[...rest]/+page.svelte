<script lang="ts">
  import { StorageKey } from '$lib';
  import type { PageData } from './$types';
  import '/src/app.css';

  export let data: PageData;

  const targetUrl = data.targetUrl;
  let instanceUrl = data.instanceUrl;
  let saved = false;

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
  <div class="mx-auto max-w-screen-sm m-6 p-12 rounded-[50px] bg-immich-dark-gray text-immich-dark-fg">
    <section class="flex justify-center">
      <img src="/img/immich-logo-stacked-dark.svg" class="h-64" alt="Immich logo" />
    </section>
    <section>
      <h1 class="md:text-3xl mb-2 text-immich-dark-primary">My Immich</h1>
      <p class="mb-4">My Immich allows public links to link you to specific areas of your personal Immich instance.</p>
      <form on:submit|preventDefault={handleSubmit}>
        <div class="mb-4 flex flex-col">
          <label id="instance-url-label" for="instance-url-input" class="font-medium immich-dark-fg mb-2">
            Instance URL
          </label>
          <input
            id="instance-url-input"
            aria-labelledby="instance-url-label"
            class="rounded-xl px-3 py-3 text-sm bg-gray-600 text-immich-dark-fg border-none outline-none"
            type="text"
            placeholder="https://demo.immich.com/"
            bind:value={instanceUrl}
            on:input={() => handleChange()}
            aria-label="Instance URL"
          />
          <p class="mt-2 text-sm">Note: This URL is only stored in your browser.</p>
        </div>
        <div class="flex justify-end">
          {#if saved}
            <p class="text-center sm:text-right m-0 px-5 py-3 text-sm text-immich-dark-primary">Saved!</p>
          {:else}
            <button
              class="w-full sm:w-auto border-0 text-white rounded-xl px-5 py-3 items-center justify-center bg-immich-primary hover:bg-immich-primary/80"
              type="submit"
            >
              {targetUrl ? 'Save & Redirect' : 'Save'}
            </button>
          {/if}
        </div>
      </form>
    </section>
  </div>
</div>
