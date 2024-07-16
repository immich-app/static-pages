<script lang="ts">
  import Icon from '$lib/components/icon.svelte';
  import { mdiGithub, mdiWeb } from '@mdi/js';
  import '$lib/app.css';
  // document.documentElement.classList.add('dark');
</script>

<section class="grid grid-rows-[auto_60px] h-auto lg:h-screen">
  <slot />

  <div class="flex flex-col place-content-center bg-gray-50 dark:bg-immich-dark-bg dark:text-white">
    <div class="flex place-items-center place-content-center gap-4">
      <a
        class="underline flex gap-1 place-items-center"
        href="https://github.com/immich-app/immich"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon path={mdiGithub} />
        GitHub</a
      >
      <a
        class="underline flex gap-1 place-items-center"
        href="https://immich.app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon path={mdiWeb} />
        Documentation</a
      >
      <a class="underline" href="https://discord.immich.app/" target="_blank" rel="noopener noreferrer"> Discord</a>

      <a class="underline" href="https://futo.org/" target="_blank" rel="noopener noreferrer">FUTO</a>
    </div>
  </div>
</section>
