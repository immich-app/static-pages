<script lang="ts">
  import ComponentExamples from '$lib/components/ComponentExamples.svelte';
  import ComponentFieldCard from '$lib/components/ComponentFieldCard.svelte';
  import ComponentLink from '$lib/components/ComponentLink.svelte';
  import ComponentPage from '$lib/components/ComponentPage.svelte';
  import ComponentTipCard from '$lib/components/ComponentTipCard.svelte';
  import { Text } from '@immich/ui';
  import BasicExample from './BasicExample.svelte';
  import basicExample from './BasicExample.svelte?raw';
  import IconExample from './IconExample.svelte';
  import iconExample from './IconExample.svelte?raw';
  import ShapeExample from './ShapeExample.svelte';
  import shapeExample from './ShapeExample.svelte?raw';
  import SizeExample from './SizeExample.svelte';
  import sizeExample from './SizeExample.svelte?raw';
  import TrailingTextExample from './TrailingTextExample.svelte';
  import trailingTextExample from './TrailingTextExample.svelte?raw';
</script>

<ComponentPage name="Input" description="Accept text input from the user">
  <ComponentFieldCard />
  <ComponentTipCard>
    <Text>See <ComponentLink name="PasswordInput" /> for password input fields</Text>
  </ComponentTipCard>
  <ComponentExamples
    examples={[
      { title: 'States', code: basicExample, component: BasicExample },
      { title: 'Shapes', code: shapeExample, component: ShapeExample },
      { title: 'Sizes', code: sizeExample, component: SizeExample },
      { title: 'Icons', code: iconExample, component: IconExample },
      { title: 'Trailing Text', code: trailingTextExample, component: TrailingTextExample },
    ]}
  />
</ComponentPage>
