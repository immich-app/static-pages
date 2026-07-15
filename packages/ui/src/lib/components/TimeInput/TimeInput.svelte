<script lang="ts">
  import { getFieldContext } from '$lib/common/context.svelte.js';
  import Label from '$lib/components/Label/Label.svelte';
  import InputIcon from '$lib/internal/InputIcon.svelte';
  import { getLocale } from '$lib/state/locale-state.svelte.js';
  import { inputContainerStyles, inputSegmentStyles, inputStyles } from '$lib/styles.js';
  import type { TimeInputProps } from '$lib/types.js';
  import { cleanClass } from '$lib/utilities/internal.js';
  import { TimeField, type TimeValue } from 'bits-ui';

  let {
    ref = $bindable(null),
    class: className,
    leadingIcon,
    trailingIcon,
    containerRef = $bindable(null),
    onChange,
    minValue,
    maxValue,
    value = $bindable<TimeValue | undefined>(),
    shape = 'semi-round',
    size: initialSize,
    granularity = 'second',
  }: TimeInputProps = $props();

  const context = getFieldContext();
  const { readOnly, required, invalid, disabled, label, ...labelProps } = $derived(context());
  const size = $derived(initialSize ?? labelProps.size ?? 'small');
</script>

<div bind:this={containerRef} class={cleanClass('flex w-full flex-col gap-1', className)}>
  <TimeField.Root
    onValueChange={onChange}
    {minValue}
    {maxValue}
    {granularity}
    bind:value
    readonly={readOnly}
    locale={getLocale()}
    {disabled}
  >
    {#if label}
      <TimeField.Label>
        {#snippet child({ props })}
          <Label
            {...labelProps}
            {...props}
            class={cleanClass(labelProps.class, props.class)}
            requiredIndicator={required === 'indicator'}
            {label}
            {size}
          />
        {/snippet}
      </TimeField.Label>
    {/if}

    <TimeField.Input
      bind:ref
      class={cleanClass(
        inputContainerStyles({
          shape,
          roundedSize: shape === 'semi-round' ? size : undefined,
          invalid,
        }),
        className,
      )}
    >
      {#snippet children({ segments })}
        <InputIcon icon={leadingIcon} {size} {disabled} />

        <div
          class={cleanClass(
            inputStyles({
              textSize: size,
              leadingPadding: leadingIcon ? 'icon' : 'base',
              trailingPadding: trailingIcon ? 'icon' : 'base',
              roundedSize: shape === 'semi-round' ? size : undefined,
            }),
            'font-medium',
          )}
        >
          {#each segments as { part, value }, i (`segment-${i}`)}
            {#if part === 'literal'}
              <TimeField.Segment {part} class="text-muted p-px">
                {value}
              </TimeField.Segment>
            {:else}
              <TimeField.Segment {part} class={inputSegmentStyles({ padding: 'narrow' })}>
                {value}
              </TimeField.Segment>
            {/if}
          {/each}
        </div>

        <InputIcon icon={trailingIcon} {size} {disabled} />
      {/snippet}
    </TimeField.Input>
  </TimeField.Root>
</div>
