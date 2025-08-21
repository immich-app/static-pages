<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import CommandPaletteItem from '$lib/components/CommandPaletteItem.svelte';
  import { commandPaletteManager } from '$lib/services/command-palette-manager.svelte';
  import { Icon, Input, Modal, ModalBody, ModalFooter, ModalHeader, Stack, Text } from '@immich/ui';
  import { mdiArrowDown, mdiArrowUp, mdiKeyboardEsc, mdiKeyboardReturn, mdiMagnify } from '@mdi/js';

  let inputElement = $state<HTMLInputElement | null>(null);

  const handleOpen = () => commandPaletteManager.open();
  const handleClose = () => commandPaletteManager.close();
  const handleUp = (event: KeyboardEvent) => handleNavigate(event, 'up');
  const handleDown = (event: KeyboardEvent) => handleNavigate(event, 'down');
  const handleSelect = (event: KeyboardEvent) => handleNavigate(event, 'select');
  const handleNavigate = async (event: KeyboardEvent, direction: 'up' | 'down' | 'select') => {
    if (!commandPaletteManager.isOpen) {
      return;
    }

    event.preventDefault();

    switch (direction) {
      case 'up': {
        commandPaletteManager.up();
        break;
      }

      case 'down': {
        commandPaletteManager.down();
        break;
      }

      case 'select': {
        await commandPaletteManager.select();
        break;
      }
    }
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'k', meta: true }, preventDefault: true, onShortcut: handleOpen },
    { shortcut: { key: 'k', ctrl: true }, preventDefault: true, onShortcut: handleOpen },
    { shortcut: { key: '/' }, preventDefault: true, onShortcut: handleOpen },
    { shortcut: { key: 'ArrowUp' }, ignoreInputFields: false, onShortcut: handleUp },
    { shortcut: { key: 'ArrowDown' }, ignoreInputFields: false, onShortcut: handleDown },
    { shortcut: { key: 'k', ctrl: true }, ignoreInputFields: false, onShortcut: handleUp },
    { shortcut: { key: 'k', meta: true }, ignoreInputFields: false, onShortcut: handleUp },
    { shortcut: { key: 'j', ctrl: true }, ignoreInputFields: false, onShortcut: handleDown },
    { shortcut: { key: 'j', meta: true }, ignoreInputFields: false, onShortcut: handleDown },
    { shortcut: { key: 'Enter' }, ignoreInputFields: false, onShortcut: handleSelect },
    { shortcut: { key: 'Escape' }, onShortcut: handleClose },
  ]}
/>

{#if commandPaletteManager.isOpen}
  <Modal size="large" onClose={handleClose} closeOnBackdropClick>
    <ModalHeader>
      <Input
        bind:ref={inputElement}
        bind:value={commandPaletteManager.query}
        placeholder="Search..."
        leadingIcon={mdiMagnify}
        tabindex={1}
      />
    </ModalHeader>
    <ModalBody>
      <Stack gap={2}>
        {#if commandPaletteManager.query}
          {#if commandPaletteManager.results.length === 0}
            <Text>No results</Text>
          {/if}
        {:else if commandPaletteManager.recentItems.length > 0}
          <Text>Recently used</Text>
        {:else}
          <Text>Quickly find pages by searching for an endpoint, model name, or keyword.</Text>
        {/if}

        {#if commandPaletteManager.results.length > 0}
          <div class="flex flex-col">
            {#each commandPaletteManager.results as item, i (i)}
              <CommandPaletteItem
                {item}
                selected={commandPaletteManager.selectedIndex === i}
                onRemove={commandPaletteManager.query ? undefined : () => commandPaletteManager.remove(i)}
                onSelect={() => commandPaletteManager.select(i)}
              />
            {/each}
          </div>
        {/if}
      </Stack>
    </ModalBody>
    <ModalFooter>
      <div class="flex justify-around w-full">
        <div class="flex gap-4">
          <div class="flex gap-1 place-items-center">
            <span class="bg-gray-300 dark:bg-gray-500 rounded p-1">
              <Icon icon={mdiKeyboardReturn} size="1rem" />
            </span>
            <Text size="small">to select</Text>
          </div>

          <div class="flex gap-1 place-items-center">
            <span class="flex gap-1 bg-gray-300 dark:bg-gray-500 rounded p-1">
              <Icon icon={mdiArrowUp} size="1rem" />
              <Icon icon={mdiArrowDown} size="1rem" />
            </span>
            <Text size="small">to navigate</Text>
          </div>

          <div class="flex gap-1 place-items-center">
            <span class="bg-gray-300 dark:bg-gray-500 rounded p-1">
              <Icon icon={mdiKeyboardEsc} size="1rem" />
            </span>
            <Text size="small">to close</Text>
          </div>
        </div>
      </div>
    </ModalFooter>
  </Modal>
{/if}
