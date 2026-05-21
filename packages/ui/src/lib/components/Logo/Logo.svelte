<script lang="ts">
  import { logoManager } from '$lib/services/logo-manager.svelte';
  import { themeManager } from '$lib/services/theme-manager.svelte.js';
  import type { LogoVariants, Size } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import { tv } from 'tailwind-variants';

  type Props = {
    size?: Size | 'landing';
    variant?: LogoVariants;
    class?: string;
  };

  const { variant = 'logo', size = 'medium', class: className }: Props = $props();

  const styles = tv({
    variants: {
      size: {
        tiny: 'h-8',
        small: 'h-10',
        medium: 'h-12',
        large: 'h-16',
        giant: 'h-24',
        landing: 'h-64',
      },

      variant: {
        stacked: '',
        inline: '',
        'stacked-futo': '',
        logo: 'bg-light aspect-square rounded-full shadow-lg',
        icon: 'aspect-square',
      },
    },
  });

  const src = $derived(logoManager.getLogo(variant, themeManager.value));
</script>

<img {src} class={cleanClass(styles({ size, variant }), className)} alt="Immich logo" />
