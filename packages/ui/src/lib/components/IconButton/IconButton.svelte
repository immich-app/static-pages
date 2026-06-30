<script lang="ts">
  import Icon from '$lib/components/Icon/Icon.svelte';
  import Button from '$lib/internal/Button.svelte';
  import type { IconButtonProps } from '$lib/types.js';

  const {
    icon,
    flipped,
    flopped,
    indicator,
    title,
    'aria-label': ariaLabel,
    color = 'primary',
    ...buttonProps
  }: IconButtonProps = $props();

  const buttonTitle = $derived(title ?? ariaLabel);
</script>

<Button icon {color} {...buttonProps} title={buttonTitle} aria-label={ariaLabel}>
  <Icon {icon} {flipped} {flopped} {indicator} size="60%" aria-hidden />
</Button>
