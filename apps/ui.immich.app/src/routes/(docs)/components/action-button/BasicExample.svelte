<script lang="ts">
  import { ExampleActions } from '$lib/constants.js';
  import {
    ActionButton,
    type ActionEvent,
    type ActionItem,
    CommandPaletteDefaultProvider,
    Heading,
    Kbd,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiDeleteForeverOutline, mdiTrashCanOutline } from '@mdi/js';

  const onAction = ({ action, event }: ActionEvent) => {
    if (event.type === 'click') {
      toastManager.show({
        title: `Clicked ${action.title}…`,
        description: '…using the mouse',
        icon: action.icon,
      });
    } else {
      const { key, ctrlKey: force } = event as KeyboardEvent;

      toastManager.show({
        title: `Used shortcut for ${action.title}…`,
        description: `…using ${force ? 'Ctrl+' : ''}${key}`,
        color: force ? 'danger' : undefined,
        icon: force ? mdiDeleteForeverOutline : action.icon,
      });
    }
  };

  const DeleteWithShortcuts: ActionItem = {
    title: 'Delete',
    icon: mdiTrashCanOutline,
    color: 'danger',
    shortcuts: [{ key: 'Delete' }, { key: 'Delete', ctrl: true }],
    onAction,
  };
</script>

<Heading size="small" class="mb-2">Icon buttons</Heading>
<div class="flex gap-2">
  <ActionButton action={ExampleActions.Copy} />
  <ActionButton action={ExampleActions.Edit} />
  <ActionButton action={ExampleActions.Share} />
  <ActionButton action={ExampleActions.Delete} />
  <ActionButton action={ExampleActions.Download} variant="filled" color="primary" />
</div>

<Heading size="small" class="mt-6 mb-2">Buttons</Heading>
<div class="flex gap-2">
  <ActionButton type="button" action={ExampleActions.Copy} />
  <ActionButton type="button" action={ExampleActions.Edit} />
  <ActionButton type="button" action={ExampleActions.Share} />
  <ActionButton type="button" action={ExampleActions.Delete} />
  <ActionButton type="button" action={ExampleActions.Download} variant="filled" color="primary" />
</div>

<CommandPaletteDefaultProvider name="Example action" actions={[DeleteWithShortcuts]} />

<Heading size="small" class="mt-6 mb-2">Event info</Heading>
<div class="flex flex-col gap-2">
  <Text>Use the mouse or keyboard shortcuts <Kbd>Del</Kbd> or <Kbd>Ctrl Del</Kbd></Text>
  <div class="w-fit">
    <ActionButton action={DeleteWithShortcuts} type="button" />
  </div>
</div>
