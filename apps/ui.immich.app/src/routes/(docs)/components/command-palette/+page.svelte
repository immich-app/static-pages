<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Markdown, Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="CommandPalette" description="A command menu that can be used to search, filter, and select items">
  <Markdown.Alert variant="tip">
    <Text>See <ComponentLink name="CommandPaletteButton" /> for a dedicated button to open the component</Text>
  </Markdown.Alert>
  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
