<script lang="ts">
  import LoadingSpinner from '#lib/components/LoadingSpinner/LoadingSpinner.svelte';
  import Tooltip from '#lib/components/Tooltip/Tooltip.svelte';
  import IconWrapper from '#lib/internal/IconWrapper.svelte';
  import { styleVariants } from '#lib/styles.js';
  import type { ButtonProps, Size } from '#lib/types.js';
  import { isExternalLink, resolveUrl } from '#lib/utilities/common.js';
  import { cleanClass } from '#lib/utilities/internal.js';
  import { Button as ButtonPrimitive } from 'bits-ui';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { tv } from 'tailwind-variants';

  type InternalButtonProps = ButtonProps & {
    /**
    when true, button width to height ratio is 1:1
    */
    icon?: boolean;
  };

  let {
    ref = $bindable(null),
    type = 'button',
    href,
    variant = 'filled',
    color,
    shape = 'semi-round',
    size = 'medium',
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    icon = false,
    title,
    class: className = '',
    children,
    ...restProps
  }: InternalButtonProps = $props();

  const disabled = $derived((restProps as HTMLButtonAttributes).disabled || loading);

  const disabledLinkProps: HTMLAnchorAttributes = { href: undefined, role: 'link', tabindex: -1, onclick: undefined };

  const buttonVariants = tv({
    base: 'flex items-center justify-center gap-1 rounded-md text-sm font-medium outline-offset-2 transition-colors focus-visible:outline-2',
    variants: {
      disabled: {
        true: 'cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50',
        false: 'cursor-pointer',
      },
      shape: styleVariants.shape,
      fullWidth: {
        true: 'w-full',
      },
      textPadding: styleVariants.buttonPadding,
      textSize: styleVariants.textSize,
      iconSize: {
        tiny: 'h-6 w-6',
        small: 'h-8 w-8',
        medium: 'h-10 w-10',
        large: 'h-12 w-12',
        giant: 'h-14 w-14',
      },
      roundedSize: styleVariants.buttonRoundedSize,
      focusOutlineColor: styleVariants.focusOutlineColor,
      filledColor: styleVariants.filledColor,
      filledColorHover: styleVariants.filledColorHover,
      outlineColor: styleVariants.outlineColor,
      ghostColor: styleVariants.ghostColor,
    },
  });

  const spinnerSizes: Record<Size, Size> = {
    tiny: 'tiny',
    small: 'tiny',
    medium: 'small',
    large: 'medium',
    giant: 'large',
  };

  const classList = $derived(
    cleanClass(
      buttonVariants({
        shape,
        fullWidth,
        textPadding: icon ? undefined : size,
        textSize: size,
        iconSize: icon ? size : undefined,
        disabled,
        roundedSize: shape === 'semi-round' ? size : undefined,
        filledColor: variant === 'filled' ? color : undefined,
        filledColorHover: variant === 'filled' ? color : undefined,
        outlineColor: variant === 'outline' ? color : undefined,
        ghostColor: variant === 'ghost' ? color : undefined,
        focusOutlineColor: color,
      }),
      className,
    ),
  );
</script>

{#snippet content()}
  {#if leadingIcon && !loading}
    <div>
      <IconWrapper {size} icon={leadingIcon} />
    </div>
  {/if}
  {@render children?.()}
  {#if trailingIcon}
    <IconWrapper {size} icon={trailingIcon} />
  {/if}
{/snippet}

{#snippet wrapper()}
  {#if loading}
    <div class="flex items-center justify-center gap-2">
      <LoadingSpinner {color} size={spinnerSizes[size]} />
      {#if !icon}
        {@render content()}
      {/if}
    </div>
  {:else}
    {@render content()}
  {/if}
{/snippet}

<Tooltip text={title}>
  {#snippet child({ props })}
    {#if href}
      {@const resolved = resolveUrl(href)}
      {@const external = isExternalLink(resolved)}
      <a
        bind:this={ref}
        {...props}
        href={resolved}
        class={classList}
        aria-disabled={disabled}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...restProps as HTMLAnchorAttributes}
        {...disabled ? disabledLinkProps : {}}
      >
        {@render wrapper()}
      </a>
    {:else}
      <ButtonPrimitive.Root
        bind:ref
        {...props}
        class={classList}
        type={type as HTMLButtonAttributes['type']}
        {...restProps as HTMLButtonAttributes}
        {disabled}
        aria-disabled={disabled}
      >
        {@render wrapper()}
      </ButtonPrimitive.Root>
    {/if}
  {/snippet}
</Tooltip>
