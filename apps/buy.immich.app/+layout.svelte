<script lang="ts">
  import Icon from '$lib/components/icon.svelte';
  import { mdiGithub, mdiWeb } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { Text, HStack, Link } from '@immich/ui';
  import '$lib/app.css';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  // document.documentElement.classList.add('dark');
</script>

<section class="grid grid-rows-[auto_60px] h-auto lg:h-screen">
  {@render children?.()}

  <div class="flex flex-col place-content-center bg-gray-50 dark:bg-immich-dark-bg dark:text-white">
    <div class="flex place-items-center place-content-center gap-4">
      <Link href="https://github.com/immich-app/immich" target="_blank" rel="noopener noreferrer">
        <HStack align="center" gap={1}>
          <Icon path={mdiGithub} />
          <Text>GitHub</Text>
        </HStack>
      </Link>

      <Link href="https://immich.app" target="_blank" rel="noopener noreferrer">
        <HStack align="center" gap={1}>
          <Icon path={mdiWeb} />
          <Text>Documentation</Text>
        </HStack>
      </Link>

      <Link href="https://discord.immich.app/" target="_blank" rel="noopener noreferrer">
        <Text>Discord</Text>
      </Link>

      <Link href="https://futo.org/" target="_blank" rel="noopener noreferrer">
        <Text>FUTO</Text>
      </Link>
    </div>
  </div>
</section>
