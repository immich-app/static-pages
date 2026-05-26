<script lang="ts">
  import { ExampleActions, exampleActions } from '$lib/constants.js';
  import { ActionBar, ControlBarHeader, ControlBarTitle, MenuItemType, Stack } from '@immich/ui';

  const onClose = () => {};
</script>

<Stack>
  <ActionBar {onClose} actions={exampleActions}>
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ActionBar>

  <ActionBar
    {onClose}
    actions={[ExampleActions.Share, ExampleActions.Copy, ExampleActions.Download]}
    overflowActions={[ExampleActions.Edit, MenuItemType.Divider, ExampleActions.Delete]}
  >
    <ControlBarHeader>
      <ControlBarTitle>2 Selected</ControlBarTitle>
    </ControlBarHeader>
  </ActionBar>
</Stack>
