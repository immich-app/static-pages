<script lang="ts">
  import {
    Button,
    ControlBar,
    ControlBarDescription,
    ControlBarHeader,
    ControlBarOverflow,
    ControlBarTitle,
    Heading,
    IconButton,
    Stack,
    toastManager,
  } from '@immich/ui';
  import { mdiArrowLeft, mdiUndo } from '@mdi/js';

  const onClose = () => {
    toastManager.primary('onClose');
  };
  const onDone = () => {
    toastManager.primary('onDone');
  };
</script>

<Stack>
  <ControlBar {onClose}>
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ControlBar>

  <Heading size="tiny" class="mb-2">Narrow screen</Heading>
  <div class="max-w-80">
    <ControlBar {onClose} closeIcon={mdiArrowLeft} translations={{ close: 'Back' }}>
      <ControlBarHeader>
        <ControlBarTitle>Very long person or workflow name</ControlBarTitle>
        <ControlBarDescription>Pictures of Mich</ControlBarDescription>
      </ControlBarHeader>
      <ControlBarOverflow>
        <IconButton aria-label="Undo" icon={mdiUndo} variant="ghost" shape="round" color="secondary" />
        <Button variant="filled" color="primary" onclick={onDone}>Done</Button>
      </ControlBarOverflow>
    </ControlBar>
  </div>
</Stack>
