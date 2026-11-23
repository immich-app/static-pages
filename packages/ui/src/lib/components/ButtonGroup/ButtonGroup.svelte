<script lang="ts" generics="T extends string">
  import Tooltip from '#lib/components/Tooltip/Tooltip.svelte';
  import IconWrapper from '#lib/internal/IconWrapper.svelte';
  import { styleVariants } from '#lib/styles.js';
  import type { ButtonGroupProps } from '#lib/types.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { ToggleGroup } from 'bits-ui';
  import { tv } from 'tailwind-variants';

  let {
    items,
    value = $bindable(),
    onValueChange,
    size = 'medium',
    color = 'primary',
    variant = 'filled',
    shape = 'semi-round',
    fullWidth = false,
    disabled = false,
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ButtonGroupProps<T> = $props();

  const containerVariants = tv({
    base: 'border-light-200 bg-light-100 items-center gap-1 border p-1',
    variants: {
      fullWidth: {
        true: 'flex w-full',
        false: 'inline-flex w-fit',
      },
      disabled: {
        true: 'opacity-50',
      },
      shape: {
        rectangle: 'rounded-none',
        'semi-round': '',
        round: 'rounded-full',
      },
      roundedSize: {
        tiny: 'rounded-xl',
        small: 'rounded-xl',
        medium: 'rounded-2xl',
        large: 'rounded-2xl',
        giant: 'rounded-3xl',
      },
    },
  });

  const itemVariants = tv({
    base: 'flex items-center justify-center gap-1 font-medium whitespace-nowrap outline-offset-2 transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      fullWidth: {
        true: 'flex-1',
      },
      groupDisabled: {
        true: 'cursor-not-allowed',
        false: 'cursor-pointer',
      },
      shape: styleVariants.shape,
      padding: styleVariants.buttonPadding,
      textSize: styleVariants.textSize,
      roundedSize: styleVariants.buttonRoundedSize,
      focusOutlineColor: styleVariants.focusOutlineColor,
      filledColor: styleVariants.filledColor,
      filledColorHover: styleVariants.filledColorHover,
      outlineColor: styleVariants.outlineColor,
      ghostColor: styleVariants.ghostColor,
      ghostSelectedColor: {
        primary: 'bg-primary/15',
        secondary: 'bg-dark/10',
        success: 'bg-success/15',
        danger: 'bg-danger/15',
        warning: 'bg-warning/15',
        info: 'bg-info/15',
      },
    },
  });

  const getItemClass = (selected: boolean) =>
    itemVariants({
      fullWidth,
      groupDisabled: disabled,
      shape,
      padding: size,
      textSize: size,
      roundedSize: shape === 'semi-round' ? size : undefined,
      focusOutlineColor: color,
      filledColor: selected && variant === 'filled' ? color : undefined,
      filledColorHover: selected && variant === 'filled' ? color : undefined,
      outlineColor: selected && variant === 'outline' ? color : undefined,
      ghostColor: selected ? (variant === 'ghost' ? color : undefined) : 'secondary',
      ghostSelectedColor: selected && variant === 'ghost' ? color : undefined,
    });
</script>

<ToggleGroup.Root
  bind:ref
  type="single"
  bind:value={
    () => value ?? '',
    (next) => {
      if (!next) {
        return;
      }

      value = next as T;
      onValueChange?.(next as T);
    }
  }
  {disabled}
  class={cleanClass(
    containerVariants({ fullWidth, disabled, shape, roundedSize: shape === 'semi-round' ? size : undefined }),
    className,
  )}
  {...restProps}
>
  {#each items as item (item.value)}
    <Tooltip text={item.title}>
      {#snippet child({ props })}
        <ToggleGroup.Item
          {...props}
          value={item.value}
          disabled={item.disabled}
          aria-label={item.label ? undefined : item.title}
          class={getItemClass(item.value === value)}
        >
          {#if item.icon}
            <IconWrapper {size} icon={item.icon} />
          {/if}
          {item.label}
        </ToggleGroup.Item>
      {/snippet}
    </Tooltip>
  {/each}
</ToggleGroup.Root>
