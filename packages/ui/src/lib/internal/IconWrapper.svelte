<script lang="ts">
  import Icon from '$lib/components/Icon/Icon.svelte';
  import type { Size } from '$lib/types.js';
  import type { IconLike } from '$lib/types.js';

  type Props = {
    icon: IconLike;
    size?: Size;
  };

  const { icon, size = 'medium' }: Props = $props();

  const iconSizes = {
    tiny: 'h-4 w-4',
    small: 'h-4 w-4',
    medium: 'h-4 w-4',
    large: 'h-6 w-6',
    giant: 'h-8 w-8',
  };
</script>

<Icon size="100%" class={iconSizes[size]} {icon} aria-hidden />
