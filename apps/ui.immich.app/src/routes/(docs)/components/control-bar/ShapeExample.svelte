<script lang="ts">
  import { ControlBar, ControlBarHeader, ControlBarTitle, Heading, Stack, toastManager } from '@immich/ui';

  const onClose = () => {
    toastManager.primary('onClose');
  };
</script>

<Stack>
  <Heading size="tiny" class="mt-2">Round</Heading>

  <ControlBar {onClose} shape="round">
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ControlBar>

  <Heading size="tiny" class="mt-2">Semi-Round</Heading>
  <ControlBar {onClose} shape="semi-round">
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ControlBar>

  <Heading size="tiny" class="mt-2">Rectangle</Heading>
  <ControlBar {onClose} shape="rectangle">
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ControlBar>
</Stack>
