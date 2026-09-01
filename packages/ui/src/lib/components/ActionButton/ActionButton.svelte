<script lang="ts">
  import Button from '$lib/components/Button/Button.svelte';
  import IconButton from '$lib/components/IconButton/IconButton.svelte';
  import type { ActionItem, Color, Shape, Size, Variants } from '$lib/types.js';
  import { isEnabled } from '$lib/utilities/common.js';
  import { mdiPlus } from '@mdi/js';

  type Props = {
    action: ActionItem & { data?: { title?: string } };
    color?: Color;
    shape?: Shape;
    size?: Size;
    variant?: Variants;
    type?: 'icon' | 'button';
  };

  const { action, type = 'icon', shape, size, color: colorOverride, variant: variantOverride }: Props = $props();
  const { title, icon, onAction } = $derived(action);
  const common = $derived({
    variant: variantOverride ?? 'ghost',
    color: colorOverride ?? action.color ?? 'secondary',
    onclick: () => onAction(action),
  });
</script>

{#if isEnabled(action)}
  {#if type === 'icon'}
    <IconButton {...common} {size} shape={shape ?? 'round'} icon={icon ?? mdiPlus} aria-label={title} />
  {:else if type === 'button'}
    <Button
      {...common}
      shape={shape ?? 'semi-round'}
      size={size ?? 'small'}
      leadingIcon={icon}
      title={action.data?.title}
    >
      {title}
    </Button>
  {/if}
{/if}
