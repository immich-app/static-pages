<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentFieldCard from '$lib/components/ComponentFieldCard.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Markdown, Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
</script>

<ComponentPage name="MultiSelect" description="Allows the user to select a multiple options from a dropdown list">
  <div class="flex flex-col gap-2">
    <ComponentFieldCard />
    <Markdown.Alert variant="tip">
      <Text>
        The <ComponentLink name="MultiSelect" /> component is very similar to the <ComponentLink name="Select" />
        component, but allows the user to select multiple options.
      </Text>
    </Markdown.Alert>
  </div>
  <ComponentExamples examples={[{ title: 'Basic', code: basicExample, component: BasicExample }]} />
</ComponentPage>
