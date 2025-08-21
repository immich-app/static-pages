<script lang="ts">
  import type { CommandItem } from '$lib/services/command-palette-manager.svelte';
  import { Button, Icon, IconButton, Text } from '@immich/ui';
  import { mdiClose } from '@mdi/js';

  type Props = {
    item: CommandItem;
    selected: boolean;
    onSelect: () => void;
    onRemove?: () => void;
  };

  const { item, selected, onRemove, onSelect }: Props = $props();

  const handleRemove = (event: MouseEvent) => {
    event.stopPropagation();
    onRemove?.();
  };

  let ref = $state<HTMLElement | null>(null);

  $effect(() => {
    if (selected && ref) {
      ref.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' });
    }
  });
</script>

<div bind:this={ref} class="p-1">
  <Button
    onclick={() => onSelect()}
    fullWidth
    variant={selected ? 'outline' : 'ghost'}
    color="secondary"
    class="border overflow-hidden"
  >
    <div class="flex justify-between place-items-center w-full gap-2">
      <div class="flex gap-2 place-items-center min-w-0">
        <Icon icon={item.icon} size="2rem" class={item.iconClass} />
        <div class="flex flex-col min-w-0">
          <div class="flex gap-1 place-items-center">
            <Text fontWeight="bold">{item.title}</Text>
          </div>
          {#if item.description}
            <Text
              size="small"
              class="text-ellipsis overflow-hidden whitespace-nowrap"
              color={selected ? undefined : 'muted'}>{item.description}</Text
            >
          {/if}
        </div>
      </div>
      {#if onRemove}
        <IconButton
          size="small"
          onclick={handleRemove}
          icon={mdiClose}
          shape="round"
          variant="ghost"
          color="secondary"
          aria-label="Remove"
        />
      {:else}
        <span class="shrink-0">[{item.type}]</span>
      {/if}
    </div>
  </Button>
</div>
