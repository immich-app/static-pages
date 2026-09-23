<script lang="ts">
  import { getFieldContext } from '$lib/common/context.svelte.js';
  import Label from '$lib/components/Label/Label.svelte';
  import Text from '$lib/components/Text/Text.svelte';
  import type { Color } from '$lib/types.js';
  import { cleanClass, generateId } from '$lib/utilities/internal.js';
  import { Switch, type WithoutChildrenOrChild } from 'bits-ui';
  import { tv } from 'tailwind-variants';

  type Props = {
    checked?: boolean;
    color?: Color;
    disabled?: boolean;
    class?: string;
  } & WithoutChildrenOrChild<Switch.RootProps>;

  let {
    id = generateId(),
    checked = $bindable(false),
    ref = $bindable(null),
    color = 'primary',
    class: className,
    ...restProps
  }: Props = $props();

  const context = getFieldContext();
  const { readOnly, required, disabled, label, description, ...labelProps } = $derived(context());
  const size = $derived(labelProps.size ?? 'small');

  const enabled = $derived(checked && !disabled);

  const bar = tv({
    base: 'h-8 w-13 rounded-full border-2 outline-offset-2 focus-visible:outline-2',
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-38',
        false: 'cursor-pointer',
      },
      fillColor: {
        default: 'border-light-400 bg-light-200 dark:border-gray-500',
        primary: 'bg-primary-100 dark:bg-primary-200 border-transparent outline-primary',
        secondary: 'bg-light-200 dark:bg-light-300 border-transparent',
        success: 'bg-success-100 dark:bg-success-200 border-transparent',
        danger: 'bg-danger-100 dark:bg-danger-200 border-transparent',
        warning: 'bg-warning-100 dark:bg-warning-200 border-transparent',
        info: 'bg-info-100 dark:bg-info-200 border-transparent',
      },
    },
  });

  const dot = tv({
    base: 'block size-4 rounded-full transition-transform duration-100 data-[state=unchecked]:translate-x-1.5 data-[state=unchecked]:rtl:-translate-x-1.5 data-[state=checked]:translate-x-6.5 data-[state=checked]:scale-150 data-[state=checked]:rtl:-translate-x-6.5',
    variants: {
      fillColor: {
        default: 'bg-gray-600 dark:bg-gray-500',
        primary: 'bg-primary',
        secondary: 'bg-dark',
        success: 'bg-success',
        danger: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info',
      },
    },
  });

  const inputId = $derived(`input-${id}`);
  const labelId = $derived(label ? `label-${id}` : restProps['aria-labelledby']);
  const descriptionId = $derived(description ? `description-${id}` : restProps['aria-describedby']);
</script>

<div class={cleanClass(label ? 'flex w-full items-center gap-3' : undefined, className)}>
  {#if label}
    <div class="min-w-0 flex-1 text-start">
      <Label id={labelId} for={inputId} {label} requiredIndicator={required === 'indicator'} {...labelProps} {size} />
      {#if description}
        <Text color="muted" size="small" id={descriptionId}>{description}</Text>
      {/if}
    </div>
  {/if}

  <Switch.Root
    bind:checked
    bind:ref
    id={inputId}
    class={bar({ disabled, fillColor: enabled ? color : 'default' })}
    disabled={disabled || readOnly}
    required={!!required}
    aria-readonly={readOnly}
    aria-labelledby={labelId}
    aria-describedby={descriptionId}
    {...restProps}
  >
    <Switch.Thumb class={dot({ fillColor: enabled ? color : 'default' })} />
  </Switch.Root>
</div>
