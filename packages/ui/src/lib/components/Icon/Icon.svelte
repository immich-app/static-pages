<script lang="ts">
  import { styleVariants } from '$lib/styles.js';
  import type { IconProps } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import type { HTMLAttributes } from 'svelte/elements';
  import { tv } from 'tailwind-variants';

  const {
    size = '1em',
    viewBox = '0 0 24 24',
    class: className = '',
    indicator: indicatorColor,
    directional = false,
    flipped = false,
    flopped = false,
    spin = false,
    strokeColor = 'transparent',
    strokeWidth = 2,
    role = 'img',
    title,
    icon,
    color = 'currentColor',
    description,
    ...restProps
  }: IconProps & HTMLAttributes<EventTarget> = $props();

  const indicator = $derived.by(() => {
    const [_, yStart, xEnd, yEnd] = viewBox.split(' ', 4);
    if (yStart && xEnd && yEnd) {
      const radius = Math.min(Number(xEnd), Number(yEnd)) / 8;
      return { x: Number(xEnd) - radius, y: Number(yStart) + radius, radius };
    }
  });

  const indicatorStyles = tv({
    variants: {
      color: styleVariants.textColor,
    },
  });

  const flip = $derived.by(() => {
    if (directional && flipped) {
      return 'ltr:-scale-x-100 rtl:scale-x-100';
    }
    if (directional) {
      return 'rtl:-scale-x-100 ltr:scale-x-100';
    }
    if (flipped) {
      return '-scale-x-100';
    }
  });
</script>

<svg
  width={size}
  height={size}
  {viewBox}
  class={cleanClass(className, flip, flopped && 'rotate-180', spin && 'animate-spin')}
  stroke={strokeColor}
  stroke-width={strokeWidth}
  {role}
  {...restProps}
>
  {#if title}
    <title>{title}</title>
  {/if}
  {#if description}
    <desc>{description}</desc>
  {/if}
  <path d={typeof icon === 'string' ? icon : icon.path} fill={color} />
  {#if indicatorColor && indicator}
    <circle
      cx={indicator.x}
      cy={indicator.y}
      r={indicator.radius}
      fill="currentColor"
      class={indicatorStyles({ color: indicatorColor })}
    ></circle>
  {/if}
</svg>

<style>
  svg {
    transition: transform 0.2s ease;
  }
</style>
