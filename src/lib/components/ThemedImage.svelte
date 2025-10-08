<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '@immich/ui';

  export let lightSrc: string;
  export let darkSrc: string;
  export let alt = '';
  export let className = '';

  let src = lightSrc;

  const compute = () => {
    const v = String((theme as any)?.value ?? '').toLowerCase();
    src = v === 'dark' ? darkSrc : lightSrc;
  };

  onMount(() => {
    compute();
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  });
</script>

<img {src} {alt} class={className} />
