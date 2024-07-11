<script>
  import Icon from '$lib/components/icon.svelte';
  import { mdiGithub, mdiWeb } from '@mdi/js';

  // document.documentElement.classList.add('dark');
</script>

<svelte:head>
  <title>Immich - Purchase License</title>
  <meta name="theme-color" content="currentColor" />
  <meta name="description" content="Buy a license to support Immich" />

  <!-- Facebook Meta Tags -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Immich Licenses" />
  <meta property="og:description" content="Buy a license to support Immich" />
  <meta property="og:image" content="/img/social-preview.png" />

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Immich Licenses" />
  <meta name="twitter:description" content="Buy a license to support Immich" />
  <meta name="twitter:image" content="/img/social-preview.png" />
</svelte:head>

<section class="grid grid-rows-[1fr_100px] h-auto lg:h-screen">
  <slot />

  <div
    class="flex flex-col place-items-center place-content-center w-full py-6 bg-gray-50 dark:bg-immich-dark-bg dark:text-white"
  >
    <div class="flex place-items-center place-content-center gap-10">
      <a class="underline flex gap-1 place-items-center" href="https://github.com/immich-app/immich">
        <Icon path={mdiGithub} />
        GitHub</a
      >
      <a class="underline flex gap-1 place-items-center" href="https://immich.app">
        <Icon path={mdiWeb} />
        Documentation</a
      >
      <a class="underline" href="https://discord.immich.app/"> Discord</a>

      <a class="underline" href="https://futo.org/">FUTO</a>
    </div>
  </div>
</section>
