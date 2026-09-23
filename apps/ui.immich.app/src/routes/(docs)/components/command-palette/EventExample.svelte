<script lang="ts">
  import {
    Button,
    CommandPaletteDefaultProvider,
    commandPaletteManager,
    Text,
    toastManager,
    type ActionEvent,
    type ActionItem,
  } from '@immich/ui';
  import { mdiCallMerge } from '@mdi/js';

  const onAction = ({ event }: ActionEvent) => {
    toastManager.info(`Event type: ${event.type}`);
    if (event instanceof KeyboardEvent) {
      toastManager.info(`Key used: ${event.key}`);
    }
  };

  const action: ActionItem = {
    title: 'Trigger me',
    description: 'Trigger me using your mouse or keyboard',
    icon: mdiCallMerge,
    onAction,
  };
</script>

<CommandPaletteDefaultProvider actions={[action]} types={['custom']} />

<Text>Get the event that triggered the action</Text>
<Button onclick={() => commandPaletteManager.open('type:custom')}>Open</Button>
