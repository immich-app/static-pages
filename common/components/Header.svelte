<script lang="ts">
  import { page } from '$app/state';
  import type { HeaderItem } from '$common/types';
  import {
    Button,
    CommandPaletteButton,
    HStack,
    IconButton,
    isExternalLink,
    Logo,
    Modal,
    ModalBody,
    ModalFooter,
    ThemeSwitcher,
  } from '@immich/ui';
  import { mdiInformationOutline, mdiMenu, mdiOpenInNew } from '@mdi/js';
  type Props = {
    items?: HeaderItem[];
    onToggleSidebar?: () => void;
  };

  const isActive = (path: string, options?: { prefix?: boolean }) =>
    path === page.url.pathname || (options?.prefix && page.url.pathname.startsWith(path));
  let displayInstructions = $state(false);
  let { items = [], onToggleSidebar }: Props = $props();

  let onPetsPage = $derived(isActive('/projects/pets'));
</script>

{#if onPetsPage && displayInstructions}
  <Modal title="Instructions" onClose={() => (displayInstructions = false)}>
    <ModalBody>
      <div class="flex list-decimal flex-col gap-2 px-8">
        <li>Drag photos anywhere onto the page, or press the + button on the carousel to add them.</li>
        <li>
          Click a photo and add a box around the faces of your pets using the "Add Box" button. Drag the corners so the
          box fits the face.
          <img
            src="/img/petface-example.png"
            alt="Example of a box drawn around a pet's face"
            class="mx-auto mt-2 w-64 rounded-lg"
            draggable="false"
          />
        </li>
        <li>If creating a new pet, choose a name, animal, breed and birthday, then select "Create Pet".</li>
        <li>Add at least 1 pet per image and 10 images per pet, then submit your photos.</li>
      </div>
    </ModalBody>
    <ModalFooter>
      <Button shape="round" onclick={() => (displayInstructions = false)}>Ok</Button>
    </ModalFooter>
  </Modal>
{/if}
<nav class="grid w-full grid-cols-[1fr_auto_1fr] items-center p-2 md:gap-4">
  <div class="flex place-items-center gap-2 justify-self-start">
    {#if onToggleSidebar}
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        size="medium"
        aria-label="Main menu"
        icon={mdiMenu}
        onclick={() => onToggleSidebar()}
        class="md:hidden"
      />
    {/if}
    <a href="/" class="flex gap-2 text-4xl">
      <Logo variant="inline" class="hidden sm:block" />
      <Logo variant="logo" class="sm:hidden" />
    </a>
  </div>
  <div class="justify-self-center whitespace-nowrap px-4"></div>
  <HStack gap={1} class="justify-self-end px-2">
    {#each items as item (item.href)}
      <Button
        class={item.show === 'always' ? '' : 'hidden md:flex'}
        href={item.href}
        shape="round"
        variant={item.variant ?? 'ghost'}
        leadingIcon={(item.icon as { path?: string })?.path ?? (item.icon as string)}
        trailingIcon={isExternalLink(item.href) ? mdiOpenInNew : undefined}
        color={item.color ?? (isActive(item.href) ? 'primary' : 'secondary')}>{item.title}</Button
      >
    {/each}
    <CommandPaletteButton />
    <ThemeSwitcher />
    {#if onPetsPage}
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        aria-label="Display Instructions"
        icon={mdiInformationOutline}
        onclick={() => (displayInstructions = true)}
      />
    {/if}
  </HStack>
</nav>
