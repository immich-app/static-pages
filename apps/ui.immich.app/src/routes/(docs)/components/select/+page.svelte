<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentFieldCard from '$lib/components/ComponentFieldCard.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import { Markdown, Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import ShapeExample from './ShapeExample.svelte';
  import shapeExample from './ShapeExample.svelte?raw';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
</script>

<ComponentPage name="Select" description="Allows the user to select a single option from a dropdown list">
  <div class="flex flex-col gap-2">
    <ComponentFieldCard />
    <Markdown.Alert variant="tip">
      <Text>
        The <ComponentLink name="Select" /> component is very similar to the <ComponentLink name="MultiSelect" /> component,
        but only allows the user to select a single option.
      </Text>
    </Markdown.Alert>
  </div>
  <ComponentExamples
    examples={[
      { title: 'Basic', code: basicExample, component: BasicExample },
      { title: 'Shapes', code: shapeExample, component: ShapeExample },
      { title: 'Sizes', code: sizeExample, component: SizeExample },
    ]}
  />
</ComponentPage>
