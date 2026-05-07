<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Markdown, Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import ConfirmDialogExample from './ConfirmDialogExample.svelte';
  import confirmDialogExample from './ConfirmDialogExample.svelte?raw';
  import IconExample from './IconExample.svelte';
  import iconExample from './IconExample.svelte?raw';
  import NestedExample from './NestedExample.svelte';
  import nestedExample from './NestedExample.svelte?raw';
  import RouteExample from './RouteExample.svelte';
  import routeExample from './RouteExample.svelte?raw';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
</script>

<ComponentPage name="Modal" description="A component for displaying content in a modal dialog">
  <div class="flex flex-col gap-2">
    <Markdown.Alert variant="note">
      <Text>Modals are always screen width and height on small devices</Text>
    </Markdown.Alert>
    <Markdown.Alert variant="tip">
      <Text>
        See <ComponentLink name="ConfirmModal" /> for a basic confirm modal
      </Text>
    </Markdown.Alert>
  </div>
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Icon', code: iconExample, component: IconExample },
      { title: 'Size', code: sizeExample, component: SizeExample },
      { title: 'Route', code: routeExample, component: RouteExample },
      { title: 'Confirm Dialog', code: confirmDialogExample, component: ConfirmDialogExample },
      { title: 'Nested Dialog', code: nestedExample, component: NestedExample },
    ]}
  />
</ComponentPage>
